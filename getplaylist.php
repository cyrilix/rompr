<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("collection/collection.php");
include ("player/".$prefs['player_backend']."/connection.php");
include ("backends/xml/backend.php");

header('Content-Type: application/json; charset=utf-8');
doCollection("playlistinfo", null, array("TlTrack"), true);
debug_print("Collection scan playlistinfo finished","GETPLAYLIST");
$foundartists = array();
outputPlaylist();

debug_print("Playlist Output Is Done","GETPLAYLIST");

function outputPlaylist() {
    global $playlist;
    global $prefs;
    global $foundartists;

    $output = array();

    foreach ($playlist as $track) {
        // Track artists are held in the track object possibly as an array
        $c = $track->get_artist_string();
        $t = $track->name;
        // We can't return NULL in the JSON data for some reason that escapes me
        if ($c === null) $c = "";
        if ($t === null) $t = "";
        $info = array(
            "title" => $t,
            "album" => $track->album,
            "creator" => $c,
            // Albumartist is always stored as a string, since the metadata bit doesn't really use it
            "albumartist" => $track->albumobject->artist,
            "compilation" => $track->albumobject->isCompilation() ? "yes" : "no",
            "duration" => $track->duration,
            "type" => $track->type,
            "date" => $track->albumobject->getDate(),
            "tracknumber" => $track->number,
            "station" => $track->station,
            "disc" => $track->disc,
            "location" => $track->url,
            "backendid" => (int) $track->backendid,
            "dir" => rawurlencode($track->albumobject->folder),
            "key" => $track->albumobject->getKey(),
            "image" => $track->albumobject->getImage('asdownloaded'),
            "trackimage" => $track->getImage(),
            "stream" => $track->stream,
            "playlistpos" => $track->playlistpos,
            "genre" => $track->genre,
            "spotify" => array (
                "album" => $track->getSpotiAlbum()
            ),
            // Never send null in any musicbrainz id as it prevents plugins from
            // waiting on lastfm to find one
            "metadata" => array(
                "iscomposer" => 'false',
                "artists" => array(),
                "album" => array(
                    "name" => $track->album,
                    "artist" => $track->albumobject->artist,
                    "musicbrainz_id" => unwanted_array($track->musicbrainz_albumid),
                ),
                "track" => array(
                    "name" => $track->name,
                    "musicbrainz_id" => unwanted_array($track->musicbrainz_trackid),
                ),
            )
        );

        $foundartists = array();

        // All kinds of places we get artist names from:
        // Composer, Performer, Track Artist, Album Artist
        // Note that we filter duplicates
        // This creates the metadata array used by the info panel and nowplaying - 
        // Metadata such as scrobbles and ratings will still use the Album Artist

        if ($prefs['displaycomposer']) {
            // The user has chosen to display Composer/Perfomer information
            // Here check:
            // a) There is composer/performer information AND
            // bi) Specific Genre Selected, Track Has Genre, Genre Matches Specific Genre OR
            // bii) No Specific Genre Selected, Track Has Genre
            if (($track->composer !== null || $track->performers !== null) &&
                (($prefs['composergenre'] && $track->genre && strtolower($track->genre) == strtolower($prefs['composergenrename'])) ||
                (!$prefs['composergenre'] && $track->genre)))
            {
                // Track Genre matches selected 'Sort By Composer' Genre
                // Display Compoer - Performer - AlbumArtist
                do_composers($track, $info);
                do_performers($track, $info);
                // The album artist probably won't be required in this case, but use it just in case
                do_albumartist($track, $info);
                // Don't do track artist as with things tagged like this this is usually rubbish
            } else {
                // Track Genre Does Not Match Selected 'Sort By Composer' Genre
                // Or there is no composer/performer info
                // Do Track Artist - Album Artist - Composer - Performer
                do_track_artists($track, $info);
                do_albumartist($track, $info);
                do_composers($track, $info);
                do_performers($track, $info);
            }
            if ($track->composer !== null || $track->performers !== null) {
                $info['metadata']['iscomposer'] = 'true';
            }
        } else {
            // The user does not want Composer/Performer information
            do_track_artists($track, $info);
            do_albumartist($track, $info);
        }

        if (count($info['metadata']['artists']) == 0) {
            array_push($info['metadata']['artists'], array( "name" => "", "musicbrainz_id" => ""));
        }
        array_push($output, $info);
    }
    $o = json_encode($output);
    print $o;
    ob_flush();
    file_put_contents(ROMPR_PLAYLIST_FILE, $o);
}

function artist_not_found_yet($a) {
    global $foundartists;
    $s = strtolower($a);
    if (in_array($s, $foundartists)) {
        return false;
    } else {
        array_push($foundartists, $s);
        return true;
    }
}

function do_composers(&$track, &$info) {
    $c = getArray($track->composer);
    foreach ($c as $comp) {

        if (artist_not_found_yet($comp)) {
            array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => "", "type" => "composer", "ignore" => "false"));
        }
    }
}

function do_performers(&$track, &$info) {
    $c = getArray($track->performers);
    foreach ($c as $comp) {
        // When doing performers these are often duplicates of album artists or track artists
        // in that case we'd rather display the performer (and we don't want to display both) because the 'Performer' tag
        // often includes details like 'Cannonball Adderley (Saxophone)';
        $toremove = null;
        foreach($info['metadata']['artists'] as $i => $artist) {
            if ($artist['type'] == "albumartist" || $artist['type'] == "artist") {
                if (preg_match('/^'.preg_quote($artist['name']).'/i', $comp)) {
                    $toremove = $i;
                    break;
                }
            }
        }
        if ($toremove !== null) {
            array_splice($info['metadata']['artists'], $toremove, 1);
        }

        if ($toremove !== null || artist_not_found_yet($comp)) {
            array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => "", "type" => "performer", "ignore" => "false"));
        }
    }
}

function do_albumartist(&$track, &$info) {
    $albumartist = null;
    if (!($track->type == "stream" && $track->albumobject->artist == "Radio") && 
        strtolower($track->albumobject->artist) != "various artists" && 
        strtolower($track->albumobject->artist) != "various") 
    {
        $albumartist = $track->albumobject->artist;
    }
    if ($albumartist !== null && artist_not_found_yet($albumartist)) {
        array_push($info['metadata']['artists'], array( "name" => $albumartist, "musicbrainz_id" => unwanted_array($track->musicbrainz_albumartistid), "type" => "albumartist", "ignore" => "false"));
    }
}

function do_track_artists(&$track, &$info) {
    $c = getArray($track->artist);
    $m = getArray($track->musicbrainz_artistid);
    while (count($m) < count($c)) {
        array_push($m, "");
    }
    foreach ($c as $i => $comp) {
        if (($track->type != "stream" && $comp != "") || ($track->type == "stream" && $comp != $track->album && $comp != "")) {
            if (artist_not_found_yet($comp)) {
                array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => $m[$i], "type" => "artist", "ignore" => "false"));
            }
        }
    }
}

?>
