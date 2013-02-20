<?php
print '<div class="noselection fullwidth">';

print '<p>Enter a URL of an internet station in this box</p>';
print '<input class="enter sourceform" name="horace" id="yourradioinput" type="text" size="60"/>';
print '<button class="topformbutton" onclick="doInternetRadio(\'yourradioinput\')">Play</button>';
$playlists = [];

if (file_exists('prefs/radioorder.txt')) {

    $all_playlists = glob("prefs/USERSTREAM*.xspf");
    $fcontents = file ('prefs/radioorder.txt');
    if ($fcontents) {
        while (list($line_num, $line) = each($fcontents)) {
            $i = array_search(trim($line), $all_playlists);
            if ($i !== false) {
                array_splice($all_playlists, $i, 1);
            }
            array_push($playlists, trim($line));
        }
    }
    $p = array_merge($playlists, $all_playlists);
    $playlists = $p;
} else {
    $playlists = glob("prefs/USERSTREAM*.xspf");
}

foreach($playlists as $i => $file) {
    if (file_exists($file)) {
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
}

print '</div>';

?>
<script language="javascript">
    $("#radiolist .enter").keyup( onKeyUp );
</script>