<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
$playlists = do_mpd_command($connection, "listplaylists", null, true);
if (!is_array($playlists)) {
    $playlists = array();
} else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
    $temp = $playlists['playlist'];
    $playlists = array();
    $playlists['playlist'][0] = $temp;
}

if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
    sort($playlists['playlist'], SORT_STRING);
    foreach ($playlists['playlist'] as $pl) {
        print '<tr><td></td><td align="left"><a href="#" onclick="playlist.load(\''.rawurlencode($pl).'\')">'.htmlspecialchars($pl).'</a></td>';
        print '<td class="playlisticon" align="right"><a href="#" onclick="player.controller.deletePlaylist(\''.rawurlencode($pl).'\')"><img src="'.$ipath.'edit-delete.png"></a></td></tr>';
    }
}
?>
