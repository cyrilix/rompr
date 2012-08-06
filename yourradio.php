<?php

print '<p>Enter a URL of an internet station in this box</p>';
print '<input class="sourceform" id="yourradioinput" type="text" size="60"/>';
print '<button class="topformbutton" onclick="doInternetRadio(\'yourradioinput\')">Play</button>';

$playlists = glob("prefs/USERSTREAM*.xspf");
print '<table width="100%">';
foreach($playlists as $i => $file) {
      $x = simplexml_load_file($file);
      foreach($x->trackList->track as $i => $track) {
      		print '<tr><td><img src="images/broadcast.png" height="20px"></td><td><a href="#" onclick="playUserStream(\''.htmlentities(rawurlencode($file)).'\');">'.$track->album.'</a></td></tr>';
      		break;
      }
}

print '</table>'

?>
