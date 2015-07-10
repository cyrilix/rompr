<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
include ("collection/collection.php");

$mpd_status = array();
$mpd_status['albumart'] = "";

if ($is_connected) {

    $cmd_status = true;

    $cmds = array();
    //
    // Assemble and format the command list and perform any command-specific backend actions
    //
    if (array_key_exists('commands', $_POST)) {
        foreach ($_POST['commands'] as $cmd) {
            switch ($cmd[0]) {
                case "additem":
                    require_once("backends/sql/backend.php");
                    debuglog("Adding Item ".$cmd[1],"POSTCOMMAND");
                    $cmds = array_merge($cmds, getItemsToAdd($cmd[1], null));
                    break;

                case "addartist":
                    require_once("backends/sql/backend.php");
                    debuglog("Getting tracks for Artist ".$cmd[1],"MPD");
                    doCollection('find "artist" "'.format_for_mpd($cmd[1]).'"',array("spotify"));
                    $cmds = array_merge($cmds, $collection->getAllTracks("add"));
                    break;

                case "rename":
                    $oldimage = md5('Playlist '.$cmd[1]);
                    $newimage = md5('Playlist '.$cmd[2]);
                    if (file_exists('albumart/small/'.$oldimage.'.jpg')) {
                        debuglog("Renaming playlist image for ".$cmd[1]." to ".$cmd[2],"MPD");
                        system('mv "albumart/small/'.$oldimage.'.jpg" "albumart/small/'.$newimage.'.jpg"');
                        system('mv "albumart/asdownloaded/'.$oldimage.'.jpg" "albumart/asdownloaded/'.$newimage.'.jpg"');
                    }
                    $playlist_file = format_for_disc(rawurldecode($cmd[1]));
                    $new_file = format_for_disc(rawurldecode($cmd[2]));
                    system('mv "prefs/'.$playlist_file.'" "prefs/'.$new_file.'"');
                    $cmds[] = join_command_string($cmd);
                    break;

                case "playlistadd":
                    require_once("backends/sql/backend.php");
                    if (preg_match('/[ab]album\d+|[ab]artist\d+/', $cmd[2])) {
                        $cmds = array_merge($cmds, getItemsToAdd($cmd[2], $cmd[0].' "'.format_for_mpd($cmd[1]).'"'));
                        break;
                    }
                    $cmds[] = join_command_string($cmd);
                    break;

                case "playlistadddir":
                    $thing = array('searchaddpl',$cmd[1],'base',$cmd[2]);
                    $cmds[] = join_command_string($thing);
                    break;

                case 'save':
                    $playlist_name = format_for_mpd($cmd[1]);
                    $playlist_file = format_for_disc(rawurldecode($cmd[1]));
                    clean_the_toilet($playlist_file);
                    system('mkdir "prefs/'.$playlist_file.'"');
                    system('cp prefs/*.xspf prefs/"'.$playlist_file.'"/');
                    $cmds[] = join_command_string($cmd);
                    break;

                case 'rm':
                    $playlist_file = format_for_disc(rawurldecode($cmd[1]));
                    clean_the_toilet($playlist_file);
                    $cmds[] = join_command_string($cmd);
                    break;

                case "load":
                    $playlist_file = format_for_disc(rawurldecode($cmd[1]));
                    clean_stored_xspf();
                    if (is_dir('prefs/'.$playlist_file)) {
                        system('cp -f prefs/"'.$playlist_file.'"/*.xspf prefs/');
                    }
                    $cmds[] = join_command_string($cmd);
                    break;

                case "clear":
                    clean_stored_xspf();
                    $cmds[] = join_command_string($cmd);
                    break;
                    
                default:
                    $cmds[] = join_command_string($cmd);
                    break;
            }        
        }
    }

    //
    // Send the command list to mpd
    //
    $done = 0;
    $cmd_status = null;
    if (count($cmds) > 0) {
        fputs($connection, "command_list_begin\n");

        foreach ($cmds as $c) {
            debuglog("Command List: ".$c,"POSTCOMMAND",6);
            fputs($connection, $c."\n");
            $done++;
            // Command lists have a maximum length, 50 seems to be the default
            if ($done == 50) {
                do_mpd_command("command_list_end", true);
                fputs($connection, "command_list_begin\n");
                $done = 0;
            }
        }

        $cmd_status = do_mpd_command("command_list_end", true, false);
    }

    //
    // Query mpd's status
    //
    $mpd_status = do_mpd_command ("status", true, false);
    if (is_array($cmd_status) && !array_key_exists('error', $mpd_status) && array_key_exists('error', $cmd_status)) {
        debuglog("Command List Error ".$cmd_status['error'],"POSTCOMMAND",1);
        $mpd_status = array_merge($mpd_status, $cmd_status);
    }

    if (array_key_exists('song', $mpd_status) && !array_key_exists('error', $mpd_status)) {
        $songinfo = array();
        $songinfo = do_mpd_command('currentsong', true, false);
        $mpd_status = array_merge($mpd_status, $songinfo);
    }

    $arse = array();
    $arse = do_mpd_command('replay_gain_status', true, false);
    $mpd_status = array_merge($mpd_status, $arse);

    if (array_key_exists('error', $mpd_status)) {
        debuglog("Clearing Player Error ".$mpd_status['error'],"MPD",7);
        fputs($connection, "clearerror\n");
    }

    if ($mpd_status['single'] == 1 && array_key_exists('state', $mpd_status) && ($mpd_status['state'] == "pause" || $mpd_status['state'] == "stop")) {
        debuglog("Cancelling Single Mode","MPD",9);
        fputs($connection, 'single "0"'."\n");
        $mpd_status['single'] = 0;
    }

    if (array_key_exists('error', $mpd_status)) {
        $mpd_status['error'] = preg_replace('/ACK \[.*?\]\s*/','',$mpd_status['error']);
    }

} else {
    if ($prefs['unix_socket'] != "") {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["unix_socket"];
    } else {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["mpd_host"].":".$prefs["mpd_port"];
    }
}

close_mpd();
print json_encode($mpd_status);

function join_command_string($cmd) {
    $c = $cmd[0];
    for ($i = 1; $i < count($cmd); $i++) {
        $c .= ' "'.format_for_mpd($cmd[$i]).'"';
    }
    return $c;
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