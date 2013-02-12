<?php
$LISTVERSION = "0.17";
$ALBUMSLIST = 'prefs/albums_'.$LISTVERSION.'.html';
$FILESLIST = 'prefs/files_'.$LISTVERSION.'.html';
$connection = null;
$is_connected = false;
$DEBUG = 1;
$prefsbuttons = array("images/button-off.png", "images/button-on.png");

// NOTE: sortbydate can be set to "true' to make the collection sort albums by date
// - however mpd can only read the Date ID3 tag, whereas the 'Original Release Date'
//   tag is MUCH more useful. So I haven't added a GUI option to enable this option
//   because it usually just results in a jumble
$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "unix_socket" => '',
                "consume" => 0,
                "repeat" => 0,
                "random" => 0,
                "crossfade" => 0,
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
                "lastfm_country_code" => "GB"
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
            fwrite($fp, $key . "||||" . $value . "\n");
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
                if ($prefs[$i] == 0) {
                    $prefs[$i] = "false";
                } else if ($prefs[$i] == 1) {
                    $prefs[$i] = "true";
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
            do_mpd_command($connection, $option." ".$prefs[$option], null, false);
        }
    }
}

?>
