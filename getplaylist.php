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
outputPlaylist();

debug_print("Playlist Output Is Done","GETPLAYLIST");

function outputPlaylist() {
    global $playlist;
    global $prefs;

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
            "image" => $track->albumobject->getImage('original'),
            "origimage" => $track->albumobject->getImage('asdownloaded'),
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

        if ($prefs['displaycomposer'] &&
            ($track->composer !== null || $track->performers !== null) &&
            (
                ($prefs['composergenre'] && $track->genre && strtolower($track->genre) == strtolower($prefs['composergenrename'])) ||
                !$prefs['composergenre'])
            ) {
            $c = getArray($track->composer);
            foreach ($c as $comp) {
                array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => ""));
            }
            $c = getArray($track->performers);
            foreach ($c as $comp) {
                array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => ""));
            }
            $info['metadata']['iscomposer'] = 'true';
        } else {
            $doalbumartist = ($track->type == "stream" && $track->albumobject->artist == "Radio") ? false : true;
            $c = getArray($track->artist);
            $m = getArray($track->musicbrainz_artistid);
            while (count($m) < count($c)) {
                array_push($m, "");
            }
            foreach ($c as $i => $comp) {
                if (($track->type != "stream" && $comp != "") || ($track->type == "stream" && $comp != $track->album && $comp != "")) {
                    if ($comp == $track->albumobject->artist) {
                        $doalbumartist = false;
                        array_unshift($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => $m[$i]));
                    } else {
                        array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => $m[$i]));
                    }
                }
            }
            if ($doalbumartist && strtolower($track->albumobject->artist) != "various artists" && strtolower($track->albumobject->artist) != "various") {
                array_push($info['metadata']['artists'], array( "name" => $track->albumobject->artist, "musicbrainz_id" => unwanted_array($track->musicbrainz_albumartistid)));
            }
            if (count($info['metadata']['artists']) == 0) {
                array_push($info['metadata']['artists'], array( "name" => "", "musicbrainz_id" => ""));
            }
        }

        array_push($output, $info);

    }
    $o = json_encode($output);
    print $o;
    ob_flush();
    file_put_contents(ROMPR_PLAYLIST_FILE, $o);
}

?>
