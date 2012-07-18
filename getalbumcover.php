<?php
include ("functions.php");

//error_log("Get Album Cover");

$fname = rawurldecode($_REQUEST['key']);
$src = rawurldecode($_REQUEST['src']);

$matches = array();
preg_match('/\.(.*?)$/', basename($src), $matches);
$file_extension = $matches[1];
//error_log("  File extension is ".$file_extension);
//error_log("  Saving as ".$fname);
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
system($convert_path, &$a);
if ($a == 127) {
    //error_log("Trying MacPorts installation of convert");
    $convert_path = "/opt/local/bin/convert";
}

$aagh = url_get_contents($src);
$fp = fopen($download_file, "x");
if ($fp) {
    fwrite($fp, $aagh['contents']);
    fclose($fp);
    check_file($download_file, $aagh['contents']);
    $r = system( $convert_path.' "'.$download_file.'" "'.$main_file.'"');
    //error_log($r);
    $r = system( $convert_path.' -resize 32x32 "'.$download_file.'" "'.$small_file.'"');
    //error_log($r);
    unlink($download_file);
} else {
    error_log("File open failed!");
}

print "<HTML><body></body></html>";

function check_file($file, $data) {
    $r = system('file "'.$file.'"');
    if (preg_match('/HTML/', $r)) {
        //error_log("   Downloaded file is HTML");
        $matches=array();
        if (preg_match('/<a href="(.*?)"/', $data, $matches)) {
            $new_url = $matches[1];
            //error_log("    Found possible redirect link: ".$new_url);
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
