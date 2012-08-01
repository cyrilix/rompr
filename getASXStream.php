<?php
include("functions.php");
header('Content-Type: text/xml; charset=utf-8');
// This works for BBC radio streams.. probably not for anything else

$content = url_get_contents($_REQUEST['url'], 'RompR Media Player/0.1', false, true);
$xml = simplexml_load_string($content['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

if ($content['contents']) {
    error_log("Contents OK");
    $title = $xml->TITLE;
    $creator = $xml->AUTHOR;

    $output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
                '<playlist>'."\n".
                xmlnode('title', $title).
                xmlnode('creator', $creator).
                '<trackList>'."\n";
    foreach($xml->Entry as $i => $r) {
        $output = $output . "<track>\n".
                            xmlnode('title', $title).
                            xmlnode('image', $_REQUEST['image']).
                            xmlnode('creator', $creator).
                            xmlnode('location', $r->ref['href']).
                            "</track>\n";

    }
    $output = $output . "</trackList>\n</playlist>\n";

    $fp = fopen('prefs/STREAM_'.md5($title).'.xspf', 'w');
    if ($fp) {
        fwrite($fp, $output);
    }
    fclose($fp);

    print $output;
}

?>
