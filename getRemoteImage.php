<?php
include ("includes/vars.php");
include ("includes/functions.php");

$url = $_REQUEST['url'];
if (!$url) {
	header('Content-type: image/png');
	readfile('newimages/transparent-32x32.png');
} else {
	$url = str_replace("https://", "http://", $url);
	debug_print("Getting Remote Image ".$url,"TOMATO");
	$ext = explode('.',$url);
	$outfile = 'prefs/imagecache/'.md5($url);
	if (!file_exists($outfile)) {
	    debug_print("  Image is not cached", "TOMATO");
		$aagh = url_get_contents($url);
		if ($aagh['status'] == "200") {
			debug_print("Cached Image ".$outfile,"TOMATO");
			file_put_contents($outfile, $aagh['contents']);
		} else {
	        header('HTTP/1.0 403 Forbidden');
	        exit(0);
		}
	}

	header('Content-type: image/'.end($ext));
	readfile($outfile);

}
?>
