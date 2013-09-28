<?php
$url = $_REQUEST['url'];
$url = str_replace("https://", "http://", $url);
$outfile = 'prefs/imagecache/'.md5($url);
$ext = explode('.',$url);
if (!file_exists($outfile)) {
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

// Clean the cache - remove any files over a month old
$cache = glob('prefs/imagecache/*');
$now = time();
foreach($cache as $file) {
    if($now - filemtime($file) > 2592000) {
        unlink ($file);
    }
}
?>