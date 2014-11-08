<?php

include ("includes/vars.php");
include ("includes/functions.php");
$station = $_POST['station'];
debug_print("Looking for ".$_POST['station'],"ADDFAVE");
$uri = null;
if (array_key_exists('uri', $_POST)) {
	$uri = $_POST['uri'];
	debug_print("Current URI: ".$uri,"ADDFAVE");
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
    	if($track->album == $station) {
	        debug_print("Found Station in ".$file, "ADDFAVE");
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
	          "<addedbyrompr>true</addedbyrompr>\n".
			  "<trackList>\n".
			  $output.
			  "</trackList>\n".
			  "</playlist>\n";

	$newname = "prefs/USERSTREAM_".md5($station).".xspf";
	file_put_contents($newname, $output);
}

?>

<html></html>

