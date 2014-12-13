<?php

if(array_key_exists("command", $_REQUEST)) {
    switch ($_REQUEST['command']) {
        case 'save':
            $playlist_name = format_for_mpd($_REQUEST['arg']);
            $playlist_file = format_for_disc(rawurldecode($_REQUEST['arg']));
            clean_the_toilet($playlist_file);
            system('mkdir "prefs/'.$playlist_file.'"');
            system('cp prefs/*.xspf prefs/"'.$playlist_file.'"/');
            if (function_exists("do_mpd_command")) {
                do_mpd_command($connection, 'rm "'.$playlist_name.'"');
            }
            break;

        case "rm":
            $playlist_file = format_for_disc(rawurldecode($_REQUEST['arg']));
            clean_the_toilet($playlist_file);
            break;

        case "load":
            $playlist_file = format_for_disc(rawurldecode($_REQUEST['arg']));
            if (function_exists("do_mpd_command")) {
                do_mpd_command($connection, "clear");
            }
            clean_stored_xspf();
            system('cp -f prefs/"'.$playlist_file.'"/*.xspf prefs/');
            break;

        case "clear":
            clean_stored_xspf();
            break;

        case "update":
        case "rescan":
            if (file_exists(ROMPR_XML_COLLECTION)) {
                unlink(ROMPR_XML_COLLECTION);
            }
            if (file_exists(ROMPR_FILEBROWSER_LIST)) {
                unlink(ROMPR_FILEBROWSER_LIST);
            }
            break;

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