<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");

$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GOOGLE");

if (file_exists('prefs/jsoncache/google/'.md5($uri))) {
	debug_print("Returning cached data","GOOGLE");
	header("Pragma: From Cache");
	print file_get_contents('prefs/jsoncache/google/'.md5($uri));
} else {
	$content = url_get_contents($uri);
	$s = $content['status'];
	debug_print("Response Status was ".$s, "GOOGLE");
	if ($s == "200") {
		header("Pragma: Not Cached");
		print $content['contents'];
		file_put_contents('prefs/jsoncache/google/'.md5($uri), $content['contents']);
	} else {
		header("HTTP/1.1 500 Internal Server Error");
		debug_print("Error From Google","GOOGLE");
		print $contents['contents'];
	}
}

?>
