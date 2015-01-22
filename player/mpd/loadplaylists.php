<?php
chdir('../..');
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
        print '<div class="containerbox meunitem dropdown-container">';
        print '<input type="hidden" name="'.rawurlencode($pl).'" />';
        print '<i class="icon-folder-open-empty fixed smallicon"></i>';
        print '<div class="expand clickable clickloadplaylist">'.htmlspecialchars($pl).'</div>';
        print '<i class="icon-cancel-circled fixed smallicon clickable clickicon clickdeleteplaylist"></i>';
        print '</div>';
    }
}
?>
