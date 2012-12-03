<?php
include ("vars.php");
include ("functions.php");
$mpd_status = array();
$mpd_status['albumart'] = "";

open_mpd_connection();

if($is_connected) {

    $cmd_status = true;

    fputs($connection, "command_list_begin\n");
    foreach ($_POST['commands'] as $cmd) {
        $cmdstart = strpos($cmd, " ");
        $part1 = substr($cmd, 0, $cmdstart);
        if ($part1 == "move") {
            // NASTY HACK!
            error_log("Command List: ".$cmd);
            fputs($connection, $cmd."\n");
        } else {
            $part2 = substr($cmd, $cmdstart+1, strlen($cmd));
            error_log("Command List: ".$part1.' "'.format_for_mpd(trim($part2, '"')).'"');
            fputs($connection, $part1.' "'.format_for_mpd(trim($part2, '"')).'"'."\n");
        }
    }
	 
    $cmd_status = do_mpd_command($connection, "command_list_end", null, true);
    $mpd_status = do_mpd_command ($connection, "status", null, true);
    if (is_array($cmd_status) && !array_key_exists('error', $mpd_status)) {
        error_log("Command List Error ".$cmd_status['error']);
        $mpd_status = array_merge($mpd_status, $cmd_status);
    }
    
    if (array_key_exists('song', $mpd_status) && !array_key_exists('error', $mpd_status)) {
        error_log("DoBEBEBEBEBEBEBEBEDO");
        $songinfo = array();
        $songinfo = do_mpd_command($connection, 'playlistinfo "' . $mpd_status['song'] . '"', null, true);
        $mpd_status = array_merge($mpd_status, $songinfo);
    }

} else {
    if ($prefs['unix_socket'] != "") {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["unix_socket"];
    } else {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["mpd_host"].":".$prefs["mpd_port"];
    }
}

close_mpd($connection);
print json_encode($mpd_status);

?>