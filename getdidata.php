<?php
include ("vars.php");
include ("functions.php");
include ("international.php");

$uri = rawurldecode($_REQUEST['uri']);
$uri = preg_replace('/\s/',"%20",$uri);
debug_print("Getting ".$uri, "GETDIDATA");

if (file_exists('prefs/jsoncache/discogs/'.md5($uri))) {
	debug_print("Returning cached data","GETDIDATA");
	print file_get_contents('prefs/jsoncache/discogs/'.md5($uri));
} else {
	$content = url_get_contents($uri);
	$s = $content['status'];
	debug_print("Response Status was ".$s, "GETDIDATA");
	if ($s == "200") {
		print $content['contents'];
		file_put_contents('prefs/jsoncache/discogs/'.md5($uri), $content['contents']);
	} else {
		$a = array( 'error' => get_int_text("discogs_error"));
		print json_encode($a);
	}
}

?>
