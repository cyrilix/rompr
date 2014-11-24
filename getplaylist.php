<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("collection/collection.php");
include ("player/".$prefs['player_backend']."/connection.php");
include ("backends/".$prefs['apache_backend']."/backend.php");

header('Content-Type: application/json; charset=utf-8');

$collection = doCollection("playlistinfo");
debug_print("Collection scan playlistinfo finished","GETPLAYLIST");
outputPlaylist();

debug_print("Playlist Output Is Done","GETPLAYLIST");

function outputPlaylist() {
    global $playlist;
    global $PLAYLISTFILE;
    global $prefs;

    $output = array();

    foreach ($playlist as $track) {
        $info = array(
            "title" => $track->name,
            "album" => $track->album,
            // Track artists are held in the track object possibly as an array
            "creator" => $track->get_artist_string(),
            // Albumartist is always stored as a string, since the metadata bit doesn't really use it
            "albumartist" => $track->albumobject->artist,
            "compilation" => $track->albumobject->isCompilation() ? "yes" : "no",
            "duration" => $track->duration,
            "type" => $track->type,
            "date" => $track->albumobject->getDate(),
            "tracknumber" => $track->number,
            // "expires" => $track->expires,
            "stationurl" => $track->stationurl,
            "station" => $track->station,
            "disc" => $track->disc,
            "location" => $track->url,
            "backendid" => $track->backendid,
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

        if ($prefs['displaycomposer'] == "true" &&
            ($track->composer !== null || $track->performers !== null) &&
            (
                ($prefs['composergenre'] == "true" && $track->genre && strtolower($track->genre) == strtolower($prefs['composergenrename'])) ||
                $prefs['composergenre'] == "false")
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
            $doalbumartist = true;
            $c = getArray($track->artist);
            $m = getArray($track->musicbrainz_artistid);
            while (count($m) < count($c)) {
                array_push($m, "");
            }
            foreach ($c as $i => $comp) {
                array_push($info['metadata']['artists'], array( "name" => $comp, "musicbrainz_id" => $m[$i]));
                if ($comp == $track->albumobject->artist) {
                    $doalbumartist = false;
                }
            }
            if ($doalbumartist && strtolower($track->albumobject->artist) != "various artists" && strtolower($track->albumobject->artist) != "various") {
                array_push($info['metadata']['artists'], array( "name" => $track->albumobject->artist, "musicbrainz_id" => unwanted_array($track->musicbrainz_albumartistid)));
            }
        }

        array_push($output, $info);

    }
    $o = json_encode($output);
    print $o;
    ob_flush();
    file_put_contents($PLAYLISTFILE, $o);
}

?>
