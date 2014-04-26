<?php
$LISTVERSION = "1";
$ALBUMSLIST = 'prefs/albums_'.$LISTVERSION.'.xml';
$ALBUMSEARCH = 'prefs/albumsearch_'.$LISTVERSION.'.xml';
$FILESLIST = 'prefs/files_'.$LISTVERSION.'.xml';
$FILESEARCH = 'prefs/filesearch_'.$LISTVERSION.'.xml';
$PLAYLISTFILE = 'prefs/playlist.json';
$connection = null;
$is_connected = false;
$ARTIST = 0;
$ALBUM = 1;
$covernames = array("cover", "albumart", "thumb", "albumartsmall", "front");
$mysqlc = null;
$backend_in_use = "";

// Set unix_socket to a value to make rompr connect to mpd via a unix domain socket
// (see mpd.conf). There's no real reason to do this, although it is marginally faster.
// If unix_socket is set to anything then mpd_host will be ignored

// Note that mpd_host is relative to the APACHE SERVER not the browser.

$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "mpd_password" => "",
                "unix_socket" => '',
                'crossfade_duration' => 5,
                "volume" => 100,
                "lastfm_user" => "",
                "lastfm_scrobbling" => "false",
                "lastfm_autocorrect" => "false",
                "theme" => "Darkness.css",
                "scrobblepercent" => 50,
                "sourceshidden" => "false",
                "playlisthidden" => "false",
                "showfileinfo" => "true",
                "infosource" => "lastfm",
                "chooser" => "albumlist",
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
                "hide_filelist" => "false",
                "hide_radiolist" => "false",
                "fullbiobydefault" => "true",
                "lastfmlang" => "default",
                "lastfm_session_key" => "",
                "user_lang" => "en",
                "twocolumnsinlandscape" => "false",
                "music_directory_albumart" => "",
                "mopidy_http_port" => 6680,
                "search_limit_limitsearch" => 0,
                "search_limit_local" => 0,
                "search_limit_spotify" => 0,
                "search_limit_soundcloud" => 0,
                "search_limit_beets" => 0,
                "search_limit_gmusic" => 0,
                "scrolltocurrent" => "false",
                // Minimum version of mopidy required
                "mopidy_version" => "0.18.3",
                "debug_enabled" => 0,
                "radiocountry" => "http://www.listenlive.eu/uk.html",
                "mysql_host" => "localhost",
                "mysql_user" => "rompr",
                "mysql_password" => "romprdbpass",
                "mysql_port" => "3306",
                "mysql_socket" => "/var/run/mysqld/mysqld.sock",
                "fontsize" => "02-Normal.css",
                "fontfamily" => "Verdana.css",
                "alarmtime" => 43200,
                "alarmon" => "false",
                "synctags" => "false",
                "synclove" => "false",
                "synclovevalue" => "5",
                "proxy_host" => "",
                "proxy_user" => "",
                "proxy_password" => ""
                );

loadPrefs();

$searchlimits = array(  "local" => "Local Files",
                        "spotify" => "Spotify",
                        "soundcloud" => "Soundcloud",
                        "beets" => "Beets",
                        "gmusic" => "Google Play Music"
                        // Can't include radio-de because prefs values with a - in them cause
                        // errors as in
                        // search_limit_radio-de: 1
                        // simply won't wash.
                        // "radio-de" => "Radio.de"
                        );

function debug_print($out, $module = "") {
    global $prefs;
    if ($prefs['debug_enabled'] == 1) {
        $indent = 20 - strlen($module);
        $in = "";
        while ($indent > 0) {
            $in .= " ";
            $indent--;
        }
        error_log($module.$in.": ".$out,0);
    }
}

function savePrefs() {
    global $prefs;
    $fp = fopen('prefs/prefs', 'w');
    if($fp) {
        $crap = true;
        if (flock($fp, LOCK_EX, $crap)) {
            foreach($prefs as $key=>$value) {
                if ($key != "albumslist" && $key != "fileslist" && $key != "mopidy_version") {
                    fwrite($fp, $key . "||||" . $value . "\n");
                }
            }
            flock($fp, LOCK_UN);
            if(!fclose($fp)) {
                error_log("ERROR!              : Couldn't close the prefs file.");
            }
        } else {
            error_log("=================================================================");
            error_log("ERROR!              : COULD NOT GET WRITE FILE LOCK ON PREFS FILE");
            error_log("=================================================================");
        }
    }
}

function loadPrefs() {
    global $prefs;
    if (file_exists('prefs/prefs')) {
        $fp = fopen('prefs/prefs', 'r');
        if($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {
                $fcontents = array();
                while (!feof($fp)) {
                    array_push($fcontents, fgets($fp));
                }
                flock($fp, LOCK_UN);
                if(!fclose($fp)) {
                    error_log("ERROR!              : Couldn't close the prefs file.");
                    exit(1);
                }
                if (count($fcontents) > 0) {
                    foreach($fcontents as $line) {
                        $a = explode("||||", $line);
                        if (is_array($a) && count($a) > 1) {
                            $prefs[$a[0]] = trim($a[1]);
                        }
                    }
                } else {
                    error_log("===============================================");
                    error_log("ERROR!              : COULD NOT READ PREFS FILE");
                    error_log("===============================================");
                    exit(1);
                }
            } else {
                error_log("================================================================");
                error_log("ERROR!              : COULD NOT GET READ FILE LOCK ON PREFS FILE");
                error_log("================================================================");
                fclose($fp);
                exit(1);
            }
        } else {
            error_log("=========================================================");
            error_log("ERROR!              : COULD NOT GET HANDLE FOR PREFS FILE");
            error_log("=========================================================");
            exit(1);
        }
    }
}

?>
