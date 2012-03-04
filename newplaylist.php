<?php
$playlist_type = $_POST['type'];
$playlist = $_POST['xml'];

//if (array_key_exists('stationurl', $_POST)) {
    $playlist = preg_replace('/(<playlist.*?>)/', "$1\n<stationurl>".$_POST['stationurl']."</stationurl>", $playlist);
//}

$xml = simplexml_load_string($playlist, 'SimpleXMLElement', LIBXML_NOCDATA);

if($playlist_type == "radio") {
    $title = $xml->playlist->title;
    $carrot = time();
    // Add a local unix timestamp to this file, since last.fm send us a date but don't tell us what time zone they're
    // sending it from
    $playlist = preg_replace('/(<playlist.*?>)/', "$1\n<unixtimestamp>".$carrot."</unixtimestamp>", $playlist);
    //error_log("New radio playlist with title ".$title);
    if (file_exists('prefs/LFMRADIO_'.md5($title).'.xspf')) {
        if (file_exists('prefs/OLD_LFMRADIO_'.md5($title).'.xspf')) {
            unlink('prefs/OLD_LFMRADIO_'.md5($title).'.xspf');
        }
        system('mv prefs/LFMRADIO_'.md5($title).'.xspf prefs/OLD_LFMRADIO_'.md5($title).'.xspf');
    }
    $fp = fopen('prefs/LFMRADIO_'.md5($title).'.xspf', 'w');
    if ($fp) {
        fwrite($fp, $playlist);
    }
    fclose($fp);
}

if ($playlist_type == "track"){
    $title = $xml->trackList->track->location;
    //error_log("New Playlist for ".$title);
    $fp = fopen('prefs/'.md5($title).'.xspf', 'w');
    if ($fp) {
        fwrite($fp, $playlist);
    }
    fclose($fp);
}


print "<html><body></body></html>";
?>