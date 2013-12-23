<?php
include ("vars.php");
include ("functions.php");
include ("international.php");
print '<div id="anaconda" class="noselection fullwidth">';

print '<p>'.get_int_text("label_radioinput").'</p>';
print '<input class="enter sourceform" name="horace" id="yourradioinput" type="text" size="60"/>';
print '<button onclick="doInternetRadio(\'yourradioinput\')">'.get_int_text("button_playradio").'</button>';
$playlists = array();

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
        $track = $x->trackList->track[0];
        print '<div class="clickable clickradio containerbox padright menuitem" name="'.$file.'">';
        print '<div class="playlisticon fixed"><img width="20px" height="20px" name="'.md5($track->album).'" src="'.$track->image.'" /></div>';
        print '<div class="expand indent">'.utf8_encode($track->album).'</div>';
        print '<div class="playlisticon fixed clickable clickradioremove clickicon" name="'.$file.'"><img src="newimages/edit-delete.png"></div>';
        print '</div>';
    }
}

print '</div>';

?>
<script language="javascript">
$("#radiolist .enter").keyup( onKeyUp );
$('#anaconda').on('drop', handleDropRadio);
</script>