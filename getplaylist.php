<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("collection/collection.php");
include ("player/mpd/connection.php");
include ("backends/sql/backend.php");

header('Content-Type: application/json; charset=utf-8');
doCollection("playlistinfo");
debuglog("Collection scan playlistinfo finished","GETPLAYLIST");
$foundartists = array();
outputPlaylist();

debuglog("Playlist Output Is Done","GETPLAYLIST");

function outputPlaylist() {
    global $playlist;
    global $prefs;
    global $foundartists;

    $output = array();

    foreach ($playlist as $track) {
        // Track artists are held in the track object possibly as an array
        $c = $track->get_artist_string();
        $t = $track->tags['Title'];
        // We can't return NULL in the JSON data for some reason that escapes me
        if ($c === null) $c = "";
        if ($t === null) $t = "";
        $info = array(
            "title" => $t,
            "album" => $track->albumobject->name,
            "creator" => $c,
            // Albumartist is always stored as a string, since the metadata bit doesn't really use it
            "albumartist" => $track->albumobject->artist,
            "compilation" => $track->albumobject->isCompilation() ? "yes" : "no",
            "duration" => $track->tags['Time'],
            "type" => $track->tags['type'],
            "date" => $track->albumobject->getDate(),
            "tracknumber" => $track->tags['Track'],
            "station" => $track->tags['station'],
            "disc" => $track->tags['Disc'],
            "location" => $track->tags['file'],
            "backendid" => (int) $track->tags['Id'],
            "dir" => rawurlencode($track->albumobject->folder),
            "key" => $track->albumobject->getKey(),
            "image" => $track->albumobject->getImage('asdownloaded'),
            "trackimage" => $track->getImage(),
            "stream" => $track->tags['stream'],
            "playlistpos" => $track->tags['Pos'],
            "genre" => $track->tags['Genre'],
            "metadata" => array(
                "iscomposer" => 'false',
                "artists" => array(),
                "album" => array(
                    "name" => $track->albumobject->name,
                    "artist" => $track->albumobject->artist,
                    "musicbrainz_id" => $track->albumobject->musicbrainz_albumid,
                    "uri" => $track->getAlbumUri(null)
                ),
                "track" => array(
                    "name" => $track->tags['Title'],
                    "musicbrainz_id" => $track->tags['MUSICBRAINZ_TRACKID'],
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
            if (($track->tags['Composer'] !== null || $track->tags['Performer'] !== null) &&
                (($prefs['composergenre'] && $track->tags['Genre'] &&
                    checkComposerGenre($track->tags['Genre'], $prefs['composergenrename'])) ||
                (!$prefs['composergenre'] && $track->tags['Genre'])))
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
                do_performers($track, $info);
                do_composers($track, $info);
            }
            if ($track->tags['Composer'] !== null || $track->tags['Performer'] !== null) {
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

function do_composers($track, &$info) {
    if ($track->tags['Composer'] == null) {
        return;
    }
    foreach ($track->tags['Composer'] as $comp) {
        if (artist_not_found_yet($comp)) {
            array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => "", "type" => "composer", "ignore" => "false"));
        }
    }
}

function do_performers($track, &$info) {
    if ($track->tags['Performer'] == null) {
        return;
    }
    foreach ($track->tags['Performer'] as $comp) {
        $toremove = null;
        foreach($info['metadata']['artists'] as $i => $artist) {
            if ($artist['type'] == "albumartist" || $artist['type'] == "artist") {
                if (strtolower($artist['name'] ==  strtolower($comp))) {
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

function do_albumartist($track, &$info) {
    $albumartist = null;
    if (!($track->tags['type'] == "stream" && $track->albumobject->artist == "Radio") &&
        strtolower($track->albumobject->artist) != "various artists" &&
        strtolower($track->albumobject->artist) != "various")
    {
        $albumartist = $track->albumobject->artist;
    }
    if ($albumartist !== null && artist_not_found_yet($albumartist)) {
        array_push($info['metadata']['artists'], array( "name" => $albumartist, "musicbrainz_id" => $track->tags['MUSICBRAINZ_ALBUMARTISTID'], "type" => "albumartist", "ignore" => "false"));
    }
}

function do_track_artists($track, &$info) {
    if ($track->tags['Artist'] == null) {
        return;
    }
    $c = $track->tags['Artist'];
    $m = $track->tags['MUSICBRAINZ_ARTISTID'];
    while (count($m) < count($c)) {
        array_push($m, "");
    }
    foreach ($c as $i => $comp) {
        if (($track->tags['type'] != "stream" && $comp != "") || ($track->tags['type'] == "stream" && $comp != $track->tags['Album'] && $comp != "")) {
            if (artist_not_found_yet($comp)) {
                array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => $m[$i], "type" => "artist", "ignore" => "false"));
            }
        }
    }
}

?>
