<?php
chdir('..');
include ("includes/vars.php");
include ("includes/functions.php");
$station = $_POST['station'];
debuglog("Looking for ".$_POST['station'],"ADDFAVE");
$uri = null;
if (array_key_exists('uri', $_POST)) {
	$uri = $_POST['uri'];
	debuglog("Current URI: ".$uri,"ADDFAVE");
}

$playlisturl = "";
$output = "";
$found = false;

$playlists = glob("prefs/STREAM*.xspf");
foreach($playlists as $i => $file) {
	$x = simplexml_load_file($file);
	$n = "";
	$stncount = 0;
	foreach ($x->trackList->track as $track) {
		if ((string) $track->album != $n) {
			$n = (string) $track->album;
			$stncount++;
		}
    	if((string) $track->album == $station) {
	        debuglog("Found Station in ".$file, "ADDFAVE");
	        $found = true;
	        if ($uri && $track->location == $uri) {
	        	// Make the currently playing track the first one in the playlist
	        	// Note that this only makes any difference when we don't have a playlisturl
	        	// We probably ought to handle this.
	        	$output = $track->asXML()."\n".$output;
	        } else {
	        	$output .= $track->asXML()."\n";
	        }
	        if ($stncount > 1) {
	        	// Don't put the original playlist URL in here if the original playlist
	        	// returned multiple stations
	        	$playlisturl = "";
	        } else {
	        	$playlisturl = (string) $x->playlisturl;
	        }
    	}
    }
}

if (!$found) {
	update_stream_playlist($_POST['location'], $_POST['station'], $_POST['image'], "", "", "stream", "USERSTREAM");
} else {
	$output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
	          "<playlist>\n".
	          "<playlisturl>".htmlspecialchars($playlisturl)."</playlisturl>\n".
			  "<trackList>\n".
			  $output.
			  "</trackList>\n".
			  "</playlist>\n";

	$newname = "prefs/USERSTREAM_".md5($station).".xspf";
	if (file_exists($newname)) {
		debuglog("Fave Already Exists!","ADDFAVE");
	} else {
		file_put_contents($newname, $output);
	}
}

?>

<html></html>

