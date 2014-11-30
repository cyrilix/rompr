<?php
if (array_key_exists('populate', $_REQUEST)) {

    chdir ('..');

    include ("includes/vars.php");
    include ("includes/functions.php");
    include ("international.php");
    print '<div id="anaconda" class="noselection fullwidth">';

    print '<div class="containerbox"></div class="expand">'.get_int_text("label_radioinput").'</div></div>';
    print '<div class="containerbox"><div class="expand"><input class="enter sourceform" name="horace" id="yourradioinput" type="text" /></div>';
    print '<button class="fixed sourceform" onclick="doInternetRadio(\'yourradioinput\')">'.get_int_text("button_playradio").'</button></div>';
    $playlists = array();

    if (file_exists('prefs/radioorder.txt')) {

        $all_playlists = glob("prefs/USERSTREAM*.xspf");
        $fcontents = file ('prefs/radioorder.txt');
        if ($fcontents) {
            while (list($line_num, $line) = each($fcontents)) {
                for ($i = 0; $i < count($all_playlists); $i++) {
                    $x = simplexml_load_file($all_playlists[$i]);
                    if ($x->trackList->track[0]->album == trim($line)) {
                        array_push($playlists, $all_playlists[$i]);
                        array_splice($all_playlists, $i, 1);
                        continue 2;
                    }
                }
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
            if ($x->playlisturl && (string) $x->playlisturl != "") {
                print '<div class="clickable clickstream containerbox padright menuitem" name="'.(string) $x->playlisturl.'" streamimg="'.(string) $track->image.'" streamname="'.$track->album.'">';
            } else {
                print '<div class="clickable clickradio containerbox padright menuitem" name="'.$file.'">';
            }
            print '<div class="playlisticon fixed"><img width="20px" height="20px" name="'.md5(" ".$track->album).'" src="'.$track->image.'" /></div>';
            print '<div class="expand stname" style="margin-left:4px">'.utf8_encode($track->album).'</div>';
            print '<div class="playlisticon fixed clickable clickradioremove clickicon" name="'.$file.'"><img src="'.$ipath.'edit-delete.png"></div>';
            print '</div>';
        }
    }

    print '</div>';

    ?>
    <script language="javascript">
    $("#radiolist .enter").keyup( onKeyUp );
    $('#anaconda').on('drop', handleDropRadio);
    </script>

<?php
} else {
?>
<div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" name="yourradiolist"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'broadcast-32.png"></div>';
print '<div class="expand">'.get_int_text('label_yourradio').'</div>';
?>
</div>
<div id="yourradiolist" class="dropmenu">
</div>
<?php
}
?>
