<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

header('Content-Type: text/xml; charset=utf-8');

$collection = doCollection("playlistinfo");
error_log("Collection scan playlistinfo finished");
$pos = 0;
// Now we have a collection, which will have worked out compilations,
// We can go through the tracks again and build up a playlist

$xml =  '<?xml version="1.0" encoding="utf-8"?>'."\n".
        '<playlist version="1">'."\n".
        '<title>Current Playlist</title>'."\n".
        '<creator>RompR</creator>'."\n".
        '<trackList>'."\n";

if ($is_connected) {
    fputs($connection, "playlistinfo\n");
    $parts = true;
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts)) {
            if ($parts[0] == "file") {
                getFileInfo($parts[1], $pos);
                $pos++;
            }
        }
    }

    close_mpd($connection);
}

$xml = $xml . "</trackList>\n</playlist>\n";

//  $fp = fopen("prefs/Current.xml", "w");
//  fwrite($fp, $xml);
//  fclose($fp);

print $xml;

function getFileInfo($file, $pos) {
    global $xml;
    global $collection;
    $xml = $xml . '<track>'."\n";
    $track = $collection->findTrack($file, $pos);
    if ($track == null) {
        error_log("FAILED TO FIND TRACK! ".$file);
        $xml = $xml.xmlnode("title", "Unknown")
                    .xmlnode("album", "Unknown")
                    .xmlnode("duration", 0)
                    .xmlnode("creator", "Unknown");
    } else {
        $image = $track->image;
        $xml = $xml.xmlnode("title", $track->name)
                    .xmlnode("album", $track->album)
                    .xmlnode("creator", $track->artist)
                    .xmlnode("albumartist", $track->albumartist)
                    .xmlnode("duration", $track->duration)
                    .xmlnode("type", $track->type)
                    .xmlnode("tracknumber", $track->number)
                    .xmlnode("expires", $track->expires)
                    .xmlnode("stationurl", $track->stationurl)
                    .xmlnode("station", $track->station)
                    .xmlnode("location", $track->url)
                    .xmlnode("backendid", $track->backendid)
                    .xmlnode("stream", $track->stream)
                    .xmlnode("playlistpos", $track->playlistpos)
                    .xmlnode("mbartistid", $track->musicbrainz_artistid)
                    .xmlnode("mbalbumid", $track->musicbrainz_albumid)
                    .xmlnode("mbalbumartistid", $track->musicbrainz_albumartistid)
                    .xmlnode("mbtrackid", $track->musicbrainz_trackid);                    
        if ($track->albumobject->isCompilation()) {
            $xml = $xml.xmlnode("compilation", "yes");
            if ($image == null || $image == "") {
                $artname = md5("Various Artists ".$track->album);
                if (file_exists("albumart/original/".$artname.".jpg")) {
                    $image = "albumart/original/".$artname.".jpg";
                }
            }
        }
        $xml = $xml.xmlnode("image", $image);
    }
    $xml = $xml . '</track>'."\n";
}

?>
