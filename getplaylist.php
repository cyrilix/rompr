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

    $output = array();

    foreach ($playlist as $track) {
        array_push($output, array(
            "title" => $track->name,
            "album" => $track->album,
            "creator" => $track->artist,
            "albumartist" => $track->albumobject->artist,
            "compilation" => $track->albumobject->isCompilation() ? "yes" : "no",
            "duration" => $track->duration,
            "type" => $track->type,
            "date" => $track->albumobject->getDate(),
            "tracknumber" => $track->number,
            "expires" => $track->expires,
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
            "spotify" => array (
                "album" => $track->getSpotiAlbum()
            ),
            // Sending null in any of these values is very, very bad as it prevents plugins
            // waiting on lastfm to find an ID
            "musicbrainz" => array (
                "artistid" => $track->musicbrainz_artistid,
                "albumid" => $track->musicbrainz_albumid,
                "albumartistid" => $track->musicbrainz_albumartistid,
                "trackid" => $track->musicbrainz_trackid
            )
        ));
    }
    $o = json_encode($output);
    print $o;
    ob_flush();
    file_put_contents($PLAYLISTFILE, $o);
}

?>
