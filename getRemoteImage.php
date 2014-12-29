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
			debug_print("Failed to download - status was ".$aagh['status'],"TOMATO");
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
	// debug_print("Checking MIME type : ".$r,"TOMATO");
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
