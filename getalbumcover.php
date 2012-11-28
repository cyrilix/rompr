<?php
include ("functions.php");

//error_log("Get Album Cover");

$fname = rawurldecode($_REQUEST['key']);
$src = rawurldecode($_REQUEST['src']);
$stream = "";
if (array_key_exists("stream", $_REQUEST)) {
    $stream = rawurldecode($_REQUEST['stream']);
}
error_log("stream is ".$stream);

$matches = array();
preg_match('/\.(.*?)$/', basename($src), $matches);
$file_extension = $matches[1];
$download_file = "albumart/".$fname.".".$file_extension;
$main_file = "albumart/original/".$fname.".jpg";
$small_file = "albumart/small/".$fname.".jpg";

if (file_exists($download_file)) {
    unlink ($download_file);
}
if (file_exists($main_file)) {
    unlink($main_file);
}
if (file_exists($small_file)) {
    unlink($small_file);
}

// Test to see if convert is on the path and adjust if not - this makes
// it work on MacOSX when everything's installed from MacPorts
$convert_path = "convert";
$a = 1;
system($convert_path, $a);
if ($a == 127) {
    $convert_path = "/opt/local/bin/convert";
}

$aagh = url_get_contents($src);
$fp = fopen($download_file, "x");
if ($fp) {
    fwrite($fp, $aagh['contents']);
    fclose($fp);
    check_file($download_file, $aagh['contents']);
    $r = system( $convert_path.' "'.$download_file.'" "'.$main_file.'"');
    $r = system( $convert_path.' -resize 32x32 "'.$download_file.'" "'.$small_file.'"');
    unlink($download_file);
} else {
    error_log("File open failed!");
}

if ($stream != "") {
    error_log("Updating file ".$stream);
    if (file_exists($stream)) {
        $x = simplexml_load_file($stream);
        foreach($x->trackList->track as $i => $track) {
            $track->image = $main_file;
        }
        $fp = fopen($stream, 'w');
        if ($fp) {
            fwrite($fp, $x->asXML());
        }
        fclose($fp);
    }
}

print "<HTML><body></body></html>";

function check_file($file, $data) {
    $r = system('file "'.$file.'"');
    if (preg_match('/HTML/', $r)) {
        $matches=array();
        if (preg_match('/<a href="(.*?)"/', $data, $matches)) {
            $new_url = $matches[1];
            system('rm "'.$file.'"');
            $aagh = url_get_contents($new_url);
            $fp = fopen($file, "x");
            if ($fp) {
                fwrite($fp, $aagh['contents']);
                fclose($fp);
            }
        }
    }
}

?>
