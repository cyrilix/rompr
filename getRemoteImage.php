<?php
include ("includes/vars.php");
include ("includes/functions.php");

$url = $_REQUEST['url'];
if (!$url) {
    // header('Content-type: image/svg+xml');
    // readfile('newimages/compact_disc.svg');
    header("HTTP/1.1 404 Not Found");
    exit(0);
} else {
	$url = str_replace("https://", "http://", $url);
	debuglog("Getting Remote Image ".$url,"TOMATO",8);
	$ext = explode('.',$url);
	$outfile = 'prefs/imagecache/'.md5($url);
	if (!file_exists($outfile)) {
	    debuglog("  Image is not cached", "TOMATO",9);
		$aagh = url_get_contents($url);
		if ($aagh['status'] == "200") {
			debuglog("Cached Image ".$outfile,"TOMATO",9);
			file_put_contents($outfile, $aagh['contents']);
		} else {
			debuglog("Failed to download ".$url." - status was ".$aagh['status'],"TOMATO",7);
	        // header('Content-type: image/svg+xml');
	        // readfile('newimages/compact_disc.svg');
		    header("HTTP/1.1 404 Not Found");
		    exit(0);
	        exit(0);
		}
	}

	$mime = 'image/'.end($ext);
	$convert_path = find_executable("identify");
	$o = array();
	$r = exec($convert_path."identify -verbose ".$outfile." | grep Mime");
	// debuglog("Checking MIME type : ".$r,"TOMATO");
	if (preg_match('/Mime type:\s+(.*)$/', $r, $o)) {
		if ($o[1]) {
			$mime = $o[1];
		}
	} else {
		$r = exec($convert_path."identify -verbose ".$outfile." | grep Format");
		if (preg_match('/Format:\s+(.*?) /', $r, $o)) {
			if ($o[1]) {
				$mime = 'image/'.strtolower($o[1]);
			}
		}
	}
	header('Content-type: '.$mime);
	readfile($outfile);
}
?>
