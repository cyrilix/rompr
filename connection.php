<?php
$is_connected = false;

if ($prefs['unix_socket'] != "") {
    $connection = fsockopen('unix://'.$prefs['unix_socket']);
} else {
    $connection = fsockopen($prefs["mpd_host"], $prefs["mpd_port"], $errno, $errstr, 10);
}

if(isset($connection) && is_resource($connection)) {

    $is_connected = true;

    while(!feof($connection)) {
        $gt = fgets($connection, 1024);
        if(parse_mpd_var($gt))
            break;
    }

    check_playlist_commands($_REQUEST);

    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg"]))."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg2"]))."\"";
        }
        do_mpd_command($connection, $command);
    }

    $mpd_status = do_mpd_command ($connection, "status", null, true);
    while ($mpd_status['state'] == 'play' && 
            (!array_key_exists('elapsed', $mpd_status) ||
            $mpd_status['volume'] == -1)) 
    {
        sleep(1);
        $mpd_status = do_mpd_command ($connection, "status", null, true);
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

    if(array_key_exists("command", $cmds)) {
        switch ($cmds['command']) {
            case 'save':
                $playlist_name = format_for_mpd(html_entity_decode($cmds['arg']));
                clean_the_toilet($playlist_name);
                system('mkdir prefs/"'.$playlist_name.'"');
                system('cp prefs/*.xspf prefs/"'.$playlist_name.'"/');
                do_mpd_command($connection, 'rm "'.$playlist_name.'"');
                break;

            case "rm":
                $playlist_name = format_for_mpd(html_entity_decode($cmds['arg']));
                clean_the_toilet($playlist_name);
                break;

            case "load":
                $playlist_name = format_for_mpd(html_entity_decode($cmds['arg']));
                do_mpd_command($connection, "clear");
                clean_stored_xspf();
                system('cp -f prefs/"'.$playlist_name.'"/*.xspf prefs/');
                break;

            case "clear":
                clean_stored_xspf();
                break;

        }
    }

}

function clean_stored_xspf() {

    $playlists = glob("prefs/*.xspf");
    foreach($playlists as $i => $file) {
        if (!preg_match('/USERSTREAM/', basename($file)) &&
            ($file != "prefs/icecast.xspf")) {
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
