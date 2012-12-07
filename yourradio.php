<?php
print '<div class="noselection fullwidth">';

print '<p>Enter a URL of an internet station in this box</p>';
print '<input class="sourceform" id="yourradioinput" type="text" size="60"/>';
print '<button class="topformbutton" onclick="doInternetRadio(\'yourradioinput\')">Play</button>';

$playlists = glob("prefs/USERSTREAM*.xspf");

foreach($playlists as $i => $file) {
    $x = simplexml_load_file($file);
    foreach($x->trackList->track as $i => $track) {
    
        print '<div class="clickable clickradio containerbox padright menuitem" name="'.$file.'">';
        print '<div class="playlisticon fixed"><img width="20px" src="'.$track->image.'" /></div>';
        print '<div class="expand indent">'.utf8_encode($track->album).'</div>';
        print '<div class="playlisticon fixed clickable clickradioremove clickicon" name="'.$file.'"><img src="images/edit-delete.png"></div>';
        print '</div>';
        break;
    }
}

print '</div>';

?>
