<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");

$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GETSPDATA");

if (file_exists('prefs/jsoncache/spotify/'.md5($uri))) {
	debug_print("Returning cached data","GETSPDATA");
	header("Pragma: From Cache");
	print file_get_contents('prefs/jsoncache/spotify/'.md5($uri));
} else {
	$content = url_get_contents($uri);
	$s = $content['status'];
	debug_print("Response Status was ".$s, "GETSPDATA");
	header("Pragma: Not Cached");
	if ($s == "200") {
		print $content['contents'];
		file_put_contents('prefs/jsoncache/spotify/'.md5($uri), $content['contents']);
	} else {
		$a = array( 'error' => get_int_text("spotify_error"));
		print json_encode($a);
	}
}

?>
