<?php
$LISTVERSION = "0.22";
$ALBUMSLIST = 'prefs/albums_'.$LISTVERSION.'.xml';
$ALBUMSEARCH = 'prefs/albumsearch_'.$LISTVERSION.'.xml';
$FILESLIST = 'prefs/files_'.$LISTVERSION.'.xml';
$FILESEARCH = 'prefs/filesearch_'.$LISTVERSION.'.xml';
$connection = null;
$is_connected = false;
$DEBUG = 1;
$prefsbuttons = array("images/button-off.png", "images/button-on.png");
$ARTIST = 0;
$ALBUM = 1;

// NOTE: sortbydate can be set to "true' to make the collection sort albums by date
// - however mpd can only read the 'Date' ID3 tag, whereas the 'Original Release Date'
//   tag is MUCH more useful. So I haven't added a GUI option to enable this option
//   because it usually just results in a jumble

// Set unix_socket to a value to make rompr connect to mpd via a unix domain socket
// (see mpd.conf). There's no real reason to do this, although it is marginally faster.
// If unix_socket is set to anything then mpd_host will be ignored

// Note that mpd_host is relative to the APACHE SERVER not the browser.

$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "mpd_password" => "",
                "unix_socket" => '',
                "consume" => 0,
                "repeat" => 0,
                "random" => 0,
                "crossfade" => 0,
                'crossfade_duration' => 5,
                "volume" => 100,
                "lastfm_user" => "",
                "lastfm_scrobbling" => "false",
                "lastfm_autocorrect" => "false",
                "theme" => "BrushedAluminium.css",
                "scrobblepercent" => 50,
                "hidebrowser" => "false",
                "sourceshidden" => "false",
                "playlisthidden" => "false",
                "infosource" => "lastfm",
                "chooser" => "albumlist",
                "historylength" => 25,
                "dontscrobbleradio" => "false",
                "sourceswidthpercent" => 22,
                "playlistwidthpercent" => 22,
                "shownupdatewindow" => "false",
                "updateeverytime" => "false",
                "downloadart" => "true",
                "autotagname" => "",
                "sortbydate" => "false",
                "playlistcontrolsvisible" => "false",
                "clickmode" => "double",
                "lastfm_country_code" => "GB",
                "hide_albumlist" => "false",
                "hide_filelist" => "false",
                "hide_lastfmlist" => "false",
                "hide_radiolist" => "false",
                "fullbiobydefault" => "true",
                "twocolumnsinlandscape" => "false",
                "use_mopidy_tagcache" => 0,
                "music_directory" => ""
                );
loadPrefs();

function debug_print($out) {
    global $DEBUG;
    if ($DEBUG) {
        error_log($out);
    }
}

function savePrefs() {
    global $prefs;
    $fp = fopen('prefs/prefs', 'w');
    if($fp) {
        foreach($prefs as $key=>$value) {
            // Don't save these two items!!! They're not user-updateable
            // and saving them will prevent the Javascript from knowing if we
            // change the format
            if ($key != "albumslist" && $key != "fileslist") {
                fwrite($fp, $key . "||||" . $value . "\n");
            }
        }
        if(!fclose($fp)) {
            echo "Error! Couldn't close the prefs file.";
        }
    }
}

function loadPrefs() {
    global $prefs;
    if (file_exists('prefs/prefs')) {
        $fcontents = file ('prefs/prefs');
        if ($fcontents) {
            while (list($line_num, $line) = each($fcontents)) {
                $a = explode("||||", $line);
                if ($a[1]) {
                    $prefs[$a[0]] = trim($a[1]);
                }
            }
            
            // Convert old pref types to new booleans
            foreach (array('dontscrobbleradio', 'lastfm_scrobbling', 'lastfm_autocorrect') as $i) {
                if ($prefs[$i] != "false" && $prefs[$i] != "true") {
                    if ($prefs[$i] == 0) {
                        $prefs[$i] = "false";
                    } else if ($prefs[$i] == 1) {
                        $prefs[$i] = "true";
                    }
                }
            }
        }
    }
}

function setswitches() {
    global $prefs;
    global $connection;
    global $is_connected;
    if ($is_connected) {
        foreach(array("consume", "repeat", "crossfade", "random") as $key => $option) {
            if ($option == "crossfade" && $prefs[$option] > 0) {
                do_mpd_command($connection, $option." ".$prefs['crossfade_duration'], null, false);
            } else {
                do_mpd_command($connection, $option." ".$prefs[$option], null, false);
            }
        }
    }
}

?>
