<?php
include ("vars.php");
include ("functions.php");

$url = $_REQUEST['url'];
$url = str_replace("https://", "http://", $url);
debug_print("Getting Remote Image ".$url,"TOMATO");
$ext = explode('.',$url);
$outfile = 'prefs/imagecache/'.md5($url);
if (!file_exists($outfile)) {
    debug_print("  Image is not cached", "TOMATO");
	$contents = file_get_contents($url);
	if ($contents) {
		file_put_contents($outfile, $contents);
	} else {
        header('HTTP/1.0 403 Forbidden');
        exit;
	}
}

header('Content-type: image/'.end($ext));
readfile($outfile);

?>
