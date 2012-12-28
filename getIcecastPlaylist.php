<?php
include ("vars.php");

$xml = simplexml_load_file("prefs/icecast.xspf");
$name = rawurldecode($_REQUEST['name']);

debug_print("Looking for IceCast Station ".$name);

$output = '<?xml version="1.0" encoding="utf-8"?><playlist version="1">'."\n".
            '<title>Icecast</title>'."\n".
            '<creator>RompR</creator>'."\n".
            '<trackList>'."\n";

foreach($xml->trackList->track as $track) {
	if(utf8_decode($track->album) == $name) {
		$output = $output . $track->asXML();
		$output = $output . "\n";
	}
}

$output = $output . "</trackList>\n</playlist>\n";

print $output;

$fp = fopen('prefs/STREAM_'.md5($name).'.xspf', 'w');
if ($fp) {
	fwrite($fp, $output);
}
fclose($fp);

?>