<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

header('Content-Type: text/xml; charset=utf-8');

$collection = doCollection("playlistinfo");
debug_print("Collection scan playlistinfo finished");

print  '<?xml version="1.0" encoding="utf-8"?>'."\n".
        '<playlist version="1">'."\n".
        '<title>Current Playlist</title>'."\n".
        '<creator>RompR</creator>'."\n".
        '<trackList>'."\n";
        
foreach ($playlist as $track) {
    print '<track>'."\n";
    $image = $track->image;
    $origimage = $track->original_image;
    if ($track->albumobject->isCompilation()) {
        print xmlnode("compilation", "yes");
        if ($image === null || $image == "") {
            $artname = md5("Various Artists ".$track->album);
            if (file_exists("albumart/original/".$artname.".jpg")) {
                $image = "albumart/original/".$artname.".jpg";
            }
            if (file_exists("albumart/asdownloaded/".$artname.".jpg")) {
                $origimage = "albumart/asdownloaded/".$artname.".jpg";
            }
        }
    }
    print xmlnode("title", $track->name)
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
            .xmlnode("image", $image)
            .xmlnode("origimage", $origimage)
            .xmlnode("stream", $track->stream)
            .xmlnode("playlistpos", $track->playlistpos)
            .xmlnode("mbartistid", $track->musicbrainz_artistid)
            .xmlnode("mbalbumid", $track->musicbrainz_albumid)
            .xmlnode("mbalbumartistid", $track->musicbrainz_albumartistid)
            .xmlnode("mbtrackid", $track->musicbrainz_trackid);                    
    print '</track>'."\n";
}

print "</trackList>\n</playlist>\n";

//  $fp = fopen("prefs/Current.xml", "w");
//  fwrite($fp, $xml);
//  fclose($fp);

debug_print("Playlist Output Is Done");

?>
