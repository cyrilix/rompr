<?php

@open_mpd_connection();

if($is_connected) {

    check_playlist_commands($_REQUEST);
    $cmd_status = true;

    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            debug_print("Arg is ".$_REQUEST['arg'],"CONNECTION");
            $command.=" \"".format_for_mpd($_REQUEST["arg"])."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd($_REQUEST["arg2"])."\"";
        }
        $cmd_status = do_mpd_command($connection, $command, null, true);
    }

    if (!array_key_exists('fast', $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);
        if (array_key_exists('state', $mpd_status)) {
            while ($mpd_status['state'] == 'play' &&
                    (!array_key_exists('elapsed', $mpd_status) && !array_key_exists('time', $mpd_status)))
            {
                debug_print("Playing but no elapsed time yet.. waiting","CONNECTION");
                sleep(1);
                $mpd_status = do_mpd_command ($connection, "status", null, true);
            }
        }
        if (is_array($cmd_status) && !array_key_exists('error', $mpd_status)) {
            $mpd_status = array_merge($mpd_status, $cmd_status);
        }
        if (!array_key_exists('elapsed', $mpd_status) && array_key_exists('time', $mpd_status)) {
            // Rompr depends on mpd's elapsed count for the song progress but some mpd-like players (eg beets)
            // don't support this. This is lower resolution however.
            $mpd_status['elapsed'] = substr($mpd_status['time'] ,0, strpos($mpd_status['time'], ':'));
        }
    }

} else {
    if ($prefs['unix_socket'] != "") {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["unix_socket"];
    } else {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["mpd_host"].":".$prefs["mpd_port"];
    }
}

function check_playlist_commands($cmds) {

    global $connection;
    global $ALBUMSLIST;
    global $FILESLIST;

    if(array_key_exists("command", $cmds)) {
        switch ($cmds['command']) {
            case 'save':
                $playlist_name = format_for_mpd($cmds['arg']);
                $playlist_file = format_for_disc(rawurldecode($cmds['arg']));
                clean_the_toilet($playlist_file);
                system('mkdir "prefs/'.$playlist_file.'"');
                system('cp prefs/*.xspf prefs/"'.$playlist_file.'"/');
                do_mpd_command($connection, 'rm "'.$playlist_name.'"');
                break;

            case "rm":
                $playlist_file = format_for_disc(rawurldecode($cmds['arg']));
                clean_the_toilet($playlist_file);
                break;

            case "load":
                $playlist_file = format_for_disc(rawurldecode($cmds['arg']));
                do_mpd_command($connection, "clear");
                clean_stored_xspf();
                system('cp -f prefs/"'.$playlist_file.'"/*.xspf prefs/');
                break;

            case "clear":
                clean_stored_xspf();
                break;

            case "update":
            case "rescan":
                if (file_exists($ALBUMSLIST)) {
                    unlink($ALBUMSLIST);
                }
                if (file_exists($FILESLIST)) {
                    unlink($FILESLIST);
                }
                break;

        }
    }

}

function clean_stored_xspf() {

    $playlists = glob("prefs/*.xspf");
    foreach($playlists as $i => $file) {
        if (!preg_match('/USERSTREAM/', basename($file))) {
            system("rm ".$file);
        }
    }
}

function clean_the_toilet($playlist_name) {
    if (is_dir('prefs/'.$playlist_name)) {
        system('rm prefs/"'.$playlist_name.'"/*.*');
        system('rmdir prefs/"'.$playlist_name.'"');
    }
}

?>
