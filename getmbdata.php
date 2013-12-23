<?php
include ("vars.php");
include ("functions.php");
include ("international.php");

$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GETMBDATA");

if (file_exists('prefs/jsoncache/musicbrainz/'.md5($uri))) {
	debug_print("Returning cached data","GETMBDATA");
	print file_get_contents('prefs/jsoncache/musicbrainz/'.md5($uri));
} else {
	$content = url_get_contents($uri);
	$s = $content['status'];
	debug_print("Response Status was ".$s, "GETMBDATA");
	if ($s == "200") {
		print $content['contents'];
		file_put_contents('prefs/jsoncache/musicbrainz/'.md5($uri), $content['contents']);
	} else {
		$a = array( 'error' => get_int_text("musicbrainz_error"));
		print json_encode($a);
	}
}

?>
