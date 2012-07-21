<?php
$is_connected = false;

$connection = fsockopen($prefs["mpd_host"], $prefs["mpd_port"], $errno, $errstr, 10);

if(isset($connection) && is_resource($connection)) {

    $is_connected = true;

    while(!feof($connection)) {
        $gt = fgets($connection, 1024);
        if(parse_mpd_var($gt))
            break;
    }

    if (!array_key_exists("fast", $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);
    }

    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg"]))."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg2"]))."\"";
        }
        do_mpd_command($connection, $command);

        if (!array_key_exists("fast", $_REQUEST)) {
            if ($_REQUEST["command"] == "add" || $_REQUEST["command"] == "load") {
                if ($mpd_status["state"] == "stop") {
                    do_mpd_command($connection, "play ".$mpd_status["playlistlength"]);
                }
            }
        }
        // Clean up the saved xspf playlists if we're emptying the playlist
        if ($command == "clear") {
            system( "rm prefs/*.xspf" );
        }
    }

    if (!array_key_exists("fast", $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);
        while ($mpd_status['state'] == 'play' && !array_key_exists('elapsed', $mpd_status)) {
            sleep(1);
            $mpd_status = do_mpd_command ($connection, "status", null, true);
        }
    }

} else {
    $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["mpd_host"].":".$prefs["mpd_port"];
}

?>
