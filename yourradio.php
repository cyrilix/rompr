<?php

print '<p>Enter a URL of an internet station in this box</p>';
print '<input class="sourceform" id="yourradioinput" type="text" size="60"/>';
print '<button class="topformbutton" onclick="doInternetRadio(\'yourradioinput\')">Play</button>';

$playlists = glob("prefs/USERSTREAM*.xspf");
print '<table width="100%">';
foreach($playlists as $i => $file) {
    $x = simplexml_load_file($file);
    foreach($x->trackList->track as $i => $track) {
        print '<tr><td><img src="'.$track->image.'" height="20px"></td><td><a style="padding-left:0px" href="#" onclick="playUserStream(\''.$file.'\');">'.$track->album.'</a></td>';
        print '<td class="playlisticon" align="right"><a style="padding-left:0px" href="#" onclick="removeUserStream(\''.$file.'\');">';
        print '<img src="images/edit-delete.png"></a></td>';
        print '</tr>';
        break;
    }
}

print '</table>'

?>
