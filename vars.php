<?php
$LISTVERSION = "0.34";
$ALBUMSLIST = 'prefs/albums_'.$LISTVERSION.'.xml';
$ALBUMSEARCH = 'prefs/albumsearch_'.$LISTVERSION.'.xml';
$FILESLIST = 'prefs/files_'.$LISTVERSION.'.xml';
$FILESEARCH = 'prefs/filesearch_'.$LISTVERSION.'.xml';
$PLAYLISTFILE = 'prefs/playlist.json';
$connection = null;
$is_connected = false;
$DEBUG = 1;
$prefsbuttons = array("newimages/button-off.png", "newimages/button-on.png");
$ARTIST = 0;
$ALBUM = 1;
$covernames = array("cover", "albumart", "thumb", "albumartsmall", "front");

// NOTE: sortbydate can be set to "true' to make the collection sort albums by date
// - however mpd can only read the 'Date' ID3 tag, whereas the 'Original Release Date'
//   tag is MUCH more useful. Beets is handy for setting the 'year' tag to the
//   original release date.

// Set unix_socket to a value to make rompr connect to mpd via a unix domain socket
// (see mpd.conf). There's no real reason to do this, although it is marginally faster.
// If unix_socket is set to anything then mpd_host will be ignored

// Note that mpd_host is relative to the APACHE SERVER not the browser.

$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "mpd_password" => "",
                "unix_socket" => '',
                // These are no longer used - we simply set the switches to match
                // whatever they're set to when we start up.
                // "consume" => 0,
                // "repeat" => 0,
                // "random" => 0,
                // "crossfade" => 0,
                'crossfade_duration' => 5,
                "volume" => 100,
                "lastfm_user" => "",
                "lastfm_scrobbling" => "false",
                "lastfm_autocorrect" => "false",
                "theme" => "Darkness.css",
                "scrobblepercent" => 50,
                "hidebrowser" => "false",
                "sourceshidden" => "false",
                "playlisthidden" => "false",
                "showfileinfo" => "true",
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
                "notvabydate" => "false",
                "playlistcontrolsvisible" => "false",
                "clickmode" => "double",
                "lastfm_country_code" => "GB",
                "hide_albumlist" => "false",
                "keep_search_open" => "false",
                "hide_filelist" => "false",
                "hide_lastfmlist" => "false",
                "hide_radiolist" => "false",
                "fullbiobydefault" => "true",
                "twocolumnsinlandscape" => "false",
                "use_mopidy_tagcache" => 0,
                "music_directory" => "",
                "music_directory_albumart" => "",
                "use_mopidy_http" => 0,
                "mopidy_http_port" => "6680",
                "use_mopidy_file_backend" => "true",
                "use_mopidy_beets_backend" => "false",
                "search_limit_limitsearch" => 0,
                "search_limit_local" => 0,
                "search_limit_spotify" => 0,
                "search_limit_soundcloud" => 0,
                "search_limit_beets" => 0
                );
loadPrefs();

$searchlimits = array(  "local" => "Local Files",
                        "spotify" => "Spotify",
                        "soundcloud" => "Soundcloud",
                        "beets" => "Beets"
                        );

function debug_print($out, $module = "") {
    global $DEBUG;
    if ($DEBUG) {
        $indent = 20 - strlen($module);
        $in = "";
        while ($indent > 0) {
            $in .= " ";
            $indent--;
        }
        if (php_uname('s') == "Linux") {
            error_log($module.$in.": ".$out);
        } else {
            error_log($module.$in.": ".$out."\n",3,'/Library/Logs/RomprLog.log');
        }
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
            debug_print("Error! Couldn't close the prefs file.", "VARS");
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

?>
