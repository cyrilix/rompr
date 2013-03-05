<?php

@open_mpd_connection();

if($is_connected) {

    check_playlist_commands($_REQUEST);
    $cmd_status = true;

    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            debug_print("Arg is ".$_REQUEST['arg']);
            $command.=" \"".format_for_mpd($_REQUEST["arg"])."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd($_REQUEST["arg2"])."\"";
        }
        $cmd_status = do_mpd_command($connection, $command, null, true);
    }

    $mpd_status = do_mpd_command ($connection, "status", null, true);
    while ($mpd_status['state'] == 'play' && 
            !array_key_exists('elapsed', $mpd_status))
    {
        debug_print("Playing but no elapsed time yet.. waiting");
        sleep(1);
        $mpd_status = do_mpd_command ($connection, "status", null, true);
    }
    if (is_array($cmd_status) && !array_key_exists('error', $mpd_status)) {
        $mpd_status = array_merge($mpd_status, $cmd_status);
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

function askForMpdValues() {
    global $prefs;
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="layout.css" />
<link rel="shortcut icon" href="images/favicon.ico" />
<link rel="stylesheet" type="text/css" href="Darkness.css" />
</head>
<body style="padding:8px">
    <div class="bordered simar">
    <h3>RompR could not connect to an mpd server</h3>
    <p>Please enter the IP address and port of your mpd server in this form</p>
    <p class="tiny">Note: localhost in this context means the computer running the apache server</p>
    <form name="mpdetails" action="index.php" method="post">
<?php
        print '<p>IP Address or hostname: <input type="text" class="winkle" name="mpd_host" value="'.$prefs['mpd_host'].'" /></p>'."\n";
        print '<p>Port: <input type="text" class="winkle" name="mpd_port" value="'.$prefs['mpd_port'].'" /></p>'."\n";
?>
        <p><input type="submit" class="winkle" value="OK" /></p>
    </form>
    </div>
</body>
</html>
<?php
}

?>
