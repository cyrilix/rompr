<?php

$url = $_POST['url'];
$name = $_POST['name'];

$file = "";
$found = false;
$x = null;

$playlists = glob("prefs/USERSTREAM*.xspf");
foreach($playlists as $i => $file) {
      $x = simplexml_load_file($file);
      foreach($x->trackList->track as $i => $track) {
            if($track->location == $url && $track->album == "Unknown Internet Stream") {
                  error_log("Found Stream To Update! - ".$file);
                  $found = true;
                  break;
            }
      }
       if ($found) {
            break;
      }
}

if ($found) {
      error_log("Updating ".$file);
      foreach($x->trackList->track as $i => $track) {
            if($track->album == "Unknown Internet Stream") {
                  $track->album = $name;
            }
      }
      $fp = fopen($file, 'w');
      if ($fp) {
          fwrite($fp, $x->asXML());
      }
      fclose($fp);

} else {
      $xml = '<?xml version="1.0" encoding="utf-8"?>'.
            "<playlist>".
            "<title>".$name."</title>".
            "<trackList>".
            "<track>".
            "<album>".$name."</album>".
            "<image>images/broadcast.png</image>".
            "<creator>".$url."</creator>".
            "<location>".$url."</location>".
            "</track>".
            "</trackList>".
            "</playlist>";

      error_log("Creating new playlist for stream ".$url);

      $fp = fopen('prefs/STREAM_'.md5($url).'.xspf', 'w');
      if ($fp) {
          fwrite($fp, $xml);
      }
      fclose($fp);

}

?>





