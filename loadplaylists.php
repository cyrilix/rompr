<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
$playlists = do_mpd_command($connection, "listplaylists", null, true);
if (!is_array($playlists)) {
    $playlists = array();
} else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
    $temp = $playlists['playlist'];
    $playlists = array();
    $playlists['playlist'][0] = $temp;
}
if (array_key_exists('mobile', $_REQUEST) && $_REQUEST['mobile'] != "no") {
    if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
        sort($playlists['playlist'], SORT_STRING);
        print '<table width="90%">';
        foreach ($playlists['playlist'] as $pl) {

            print '<tr><td align="left"><a href="#" onclick="playlist.load(\''.rawurlencode($pl).'\')">'.htmlspecialchars($pl).'</a></td>';
            print '<td class="playlisticon" align="right"><a href="#" onclick="player.controller.deletePlaylist(\''.rawurlencode($pl).'\')"><img src="newimages/edit-delete.png"></a></td></tr>';

        }
        print '</table>';
    }
} else {
    print '<li class="tleft wide"><b>Playlists</b></li>';
    if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
        sort($playlists['playlist'], SORT_STRING);
        print '<li class="tleft wide"><table width="100%">';
        foreach ($playlists['playlist'] as $pl) {

            print '<tr><td align="left"><a href="#" onclick="playlist.load(\''.rawurlencode($pl).'\')">'.htmlspecialchars($pl).'</a></td>';
            print '<td class="playlisticon" align="right"><a href="#" onclick="player.controller.deletePlaylist(\''.rawurlencode($pl).'\')"><img src="newimages/edit-delete.png"></a></td></tr>';

        }
        print '</table></li>';
    }
}
?>
