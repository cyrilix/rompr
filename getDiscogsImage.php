<?php
include ("vars.php");
$url = $_REQUEST['url'];
$url = str_replace("https://", "http://", $url);
debug_print("Getting ".$url, "GETDISCOGSIMAGE");
$outfile = 'prefs/imagecache/'.md5($url);
$ext = explode('.',$url);
if (!file_exists($outfile)) {
    debug_print("  Image is not cached", "GETDISCOGSIMAGE");
    $fp = fopen($outfile, 'wb');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
    curl_setopt($ch, CURLOPT_REFERER, 'http://www.discogs.com/viewimages');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_exec($ch);
    $result = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);
    if ($result != "200") {
        header('HTTP/1.0 403 Forbidden');
        if (file_exists($outfile)) {
            unlink($outfile);
        }
        exit;
    }
}
header('Content-type: image/'.end($ext));
readfile($outfile);

?>