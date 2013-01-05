<?php
ob_start();
$playlist_type = $_POST['type'];
$playlist = $_POST['xml'];

$xml = simplexml_load_string($playlist, 'SimpleXMLElement', LIBXML_NOCDATA);

switch ($playlist_type) {

    case "radio":
        $xml->playlist->stationurl = htmlspecialchars($_POST['stationurl']);
        $unixtimestamp = time() + $xml->playlist->link;
        $title = md5($xml->playlist->title);
        $trackcount = 0;
        foreach($xml->playlist->trackList->track as $i => $track) {
            $trackcount++;
            $track->expires = $unixtimestamp;
        }
        if (file_exists('prefs/LFMRADIO_'.$title.'.xspf')) {
            $oldxml = simplexml_load_file('prefs/LFMRADIO_'.$title.'.xspf', 'SimpleXMLElement', LIBXML_NOCDATA);
            foreach($oldxml->playlist->trackList->track as $i => $track) {
                $trackcount++;
                if ($trackcount > 50)
                    break;
                $newtrack = $xml->playlist->trackList->addChild($track->getName());
                mergeXML($newtrack, $track);
            }
        }
        $xml->asXML('prefs/LFMRADIO_'.$title.'.xspf');
        break;

    case "track":
        $xml->asXML('prefs/'.md5($xml->trackList->track->location).'.xspf');
        break;

    case "stream":
        $xml->asXML('prefs/STREAM_'.md5($xml->trackList->track->album).'.xspf');
        break;

}

header('HTTP/1.1 204 No Content');
ob_flush();

function mergeXML($out, $in) {
    foreach ($in->children() as $child)
    {
        if ($child->count() != 0) {
            $chld = $out->addChild($child->getName());
            mergeXML($chld, $child);
        } else {
            // Either Last.FM are returning non-standard XML or PHP is doing something to it.
            // Oh no wait, it'll be getting munged by the javascript when it gets posted to here.
            // Hence htmlspecialchars.
            $chld = $out->addChild($child->getName(), htmlspecialchars($child));
        }
        foreach($child->attributes() as $a => $b) {
            $chld->addAttribute($a, $b);
        }
    }
}

?>
