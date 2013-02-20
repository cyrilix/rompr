<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
print '<li class="tleft wide"><b>Playlists</b></li>';
$playlists = do_mpd_command($connection, "listplaylists", null, true);
if ($playlists['playlist'] && !is_array($playlists['playlist'])) {
    $temp = $playlists['playlist'];
    $playlists = array();
    $playlists['playlist'][0] = $temp;
}
if (is_array($playlists['playlist'])) {
    sort($playlists['playlist'], SORT_STRING);
    print '<li class="tleft wide"><table width="100%">';
    foreach ($playlists['playlist'] as $pl) {

        print '<tr><td align="left"><a href="#" onclick="mpd.command(\'command=load&arg='.rawurlencode($pl).'\', playlist.repopulate)">'.htmlspecialchars($pl).'</a></td>';
        print '<td class="playlisticon" align="right"><a href="#" onclick="mpd.fastcommand(\'command=rm&arg='.rawurlencode($pl).'\', reloadPlaylists)"><img src="images/edit-delete.png"></a></td></tr>';

    }
    print '</table></li>';
}
?>
 