<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
$mpd_status['albumart'] = "";

if (!array_key_exists('fast', $_REQUEST) && array_key_exists('song', $mpd_status)) {
    $songinfo = array();
    $songinfo = do_mpd_command($connection, 'playlistinfo "' . $mpd_status['song'] . '"', null, true);
    $mpd_status = array_merge($mpd_status, $songinfo);
}
close_mpd($connection);
print json_encode($mpd_status);
?>
