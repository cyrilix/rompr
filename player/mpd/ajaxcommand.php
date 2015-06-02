<?php
chdir('../..');
include ("includes/vars.php");
$mpd_status = array();
include ("includes/functions.php");
include ("player/mpd/connection.php");

if (!array_key_exists('fast', $_REQUEST) && array_key_exists('song', $mpd_status)) {
    $songinfo = array();
    $songinfo = do_mpd_command($connection, 'playlistinfo "' . $mpd_status['song'] . '"', null, true);
    $mpd_status = array_merge($mpd_status, $songinfo);
}

$arse = array();
$arse = do_mpd_command($connection, 'replay_gain_status', null, true);
$mpd_status = array_merge($mpd_status, $arse);

close_mpd($connection);
print json_encode($mpd_status);
?>
