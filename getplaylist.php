<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

header('Content-Type: text/xml; charset=utf-8');

$collection = doCollection("playlistinfo");
// Now we have a collection, which will have worked out compilations,
// We can go through the tracks again and build up a playlist

fputs($connection, "playlistinfo\n");

$xml =  '<?xml version="1.0" encoding="utf-8"?>'."\n".
        '<playlist version="1">'."\n".
        '<title>Current Playlist</title>'."\n".
        '<creator>RompR</creator>'."\n".
        '<trackList>'."\n";

$parts = true;
while(!feof($connection) && $parts) {
    $parts = getline($connection);
    if (is_array($parts)) {
        if ($parts[0] == "file") {
            getFileInfo($parts[1]);
        }
    }
}
 
close_mpd($connection);

$xml = $xml . "</trackList>\n</playlist>\n";

//$fp = fopen("prefs/Current.xml", "w");
//fwrite($fp, $xml);
//fclose($fp);

print $xml;

function getFileInfo($file) {
    global $xml;
    global $collection;
    $track = $collection->findTrack($file);
    if ($track == null) {
        error_log("FAILED TO FIND TRACK!");
        return false;
    }
    $xml = $xml . '<track>'."\n";
    $xml = $xml.xmlnode("title", $track->name)
                .xmlnode("album", $track->album)
                .xmlnode("creator", $track->artist)
                .xmlnode("duration", $track->duration)
                .xmlnode("type", $track->type)
                .xmlnode("tracknumber", $track->number)
                .xmlnode("image", $track->image)
                .xmlnode("expires", $track->expires)
                .xmlnode("stationurl", $track->stationurl)
                .xmlnode("station", $track->station)
                .xmlnode("location", $track->url)
                .xmlnode("backendid", $track->backendid)
                .xmlnode("playlistpos", $track->playlistpos);
    if ($track->albumobject->isCompilation()) {
        $xml = $xml.xmlnode("compilation", "yes");
    }
    $xml = $xml . '</track>'."\n";    
}
