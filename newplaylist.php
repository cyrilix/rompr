<?php
ob_start();
$playlist_type = $_POST['type'];
$playlist = $_POST['xml'];

$xml = simplexml_load_string($playlist, 'SimpleXMLElement', LIBXML_NOCDATA);

switch ($playlist_type) {

    case "stream":
        $xml->asXML('prefs/STREAM_'.md5($xml->trackList->track->album).'.xspf');
        break;

}

header('HTTP/1.1 204 No Content');
ob_flush();

?>
