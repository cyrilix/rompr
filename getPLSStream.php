<?php
include("functions.php");
header('Content-Type: text/xml; charset=utf-8');
# This works for soma fm playlists, probably nothing else

// [playlist]
// numberofentries=3
// File1=http://streamer-dtc-aa04.somafm.com:80/stream/1018
// Title1=SomaFM: Groove Salad (#1 128k mp3): A nicely chilled plate of ambient/downtempo beats and grooves.
// Length1=-1
// File2=http://mp2.somafm.com:8032
// Title2=SomaFM: Groove Salad (#2 128k mp3): A nicely chilled plate of ambient/downtempo beats and grooves.
// Length2=-1
// File3=http://ice.somafm.com/groovesalad
// Title3=SomaFM: Groove Salad (Firewall-friendly 128k mp3) A nicely chilled plate of ambient/downtempo beats and grooves.
// Length3=-1
// Version=2

$content = url_get_contents($_REQUEST['url'], 'RompR Media Player/0.1', false, true);
if ($content['contents']) {
	$pls = $content['contents'];

	$output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
	            '<playlist>'."\n".
	            // Creator is soma fm to keep everything grouped.
	            // Need to think of a more generic method.
	            xmlnode('creator', 'soma fm').
	            //xmlnode('creator', html_entity_decode(urldecode($_REQUEST['station']))).
	            '<trackList>'."\n";

	$parts = explode(PHP_EOL, $pls);
	$got = 0;
	$url = "";
	$title = "";
	foreach ($parts as $line) {
		$bits = explode("=", $line);
		if (preg_match('/File/', $bits[0])) {
			$url = $bits[1];
			$got++;
		}
		if (preg_match('/Title/', $bits[0])) {
			$title = htmlentities($bits[1]);
			$got++;
		}
		if ($got == 2) {
			$output = $output . "<track>\n".
	                    		//xmlnode('album', $title).
	                    		//xmlnode('creator', html_entity_decode(urldecode($_REQUEST['station']))).
								// For Soma FM - need album and creator to be the same for all urls
								// otherwise they all appear separately.
			                    xmlnode('album', html_entity_decode(urldecode($_REQUEST['station']))).
	        		            xmlnode('creator', 'soma fm').
	                    		xmlnode('location', $url).
	                    		xmlnode('image', $_REQUEST['image']).
	                    		"</track>\n";
	        $got = 0;

		}
	}

	$output = $output . "</trackList>\n</playlist>\n";

	$fp = fopen('prefs/STREAM_'.md5(html_entity_decode(urldecode($_REQUEST['station']))).'.xspf', 'w');
	if ($fp) {
	    fwrite($fp, $output);
	}
	fclose($fp);

	print $output;
}
?>
