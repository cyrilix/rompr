<?php

define('ROMPR_MAX_TRACKS_PER_TRANSACTION', 1000);
define('ROMPR_COLLECTION_VERSION', 2);
define('ROMPR_SCHEMA_VERSION', 12);
define('ROMPR_PLAYLIST_FILE', 'prefs/playlist.json');
define('ROMPR_VERSION', 0.70);
define('ROMPR_ARTIST', 0);
define('ROMPR_ALBUM', 1);
define('ROMPR_FILE', 2);
$connection = null;
$is_connected = false;
$mysqlc = null;

$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "mpd_password" => "",
                "unix_socket" => '',
                'crossfade_duration' => 5,
                "volume" => 100,
                "lastfm_user" => "",
                "lastfm_scrobbling" => false,
                "lastfm_autocorrect" => false,
                "theme" => "Darkness.css",
                "scrobblepercent" => 50,
                "sourceshidden" => false,
                "playlisthidden" => false,
                "infosource" => "lastfm",
                "chooser" => "albumlist",
                "sourceswidthpercent" => 22,
                "playlistwidthpercent" => 22,
                "shownupdatewindow" => 0,
                "updateeverytime" => false,
                "downloadart" => true,
                "autotagname" => "",
                "sortbydate" => false,
                "notvabydate" => false,
                "playlistcontrolsvisible" => false,
                "clickmode" => "double",
                "lastfm_country_code" => "GB",
                "country_userset" => false,
                "hide_albumlist" => false,
                "hide_filelist" => false,
                "hide_radiolist" => false,
                "hidebrowser" => false,
                "fullbiobydefault" => true,
                "lastfmlang" => "default",
                "lastfm_session_key" => "",
                "user_lang" => "en",
                "music_directory_albumart" => "",
                "search_limit_limitsearch" => false,
                "scrolltocurrent" => false,
                "debug_enabled" => false,
                "radiocountry" => "http://www.listenlive.eu/uk.html",
                "mysql_host" => "localhost",
                "mysql_database" => "romprdb",
                "mysql_user" => "rompr",
                "mysql_password" => "romprdbpass",
                "mysql_port" => "3306",
                "fontsize" => "02-Normal.css",
                "fontfamily" => "Verdana.css",
                "alarmtime" => 43200,
                "alarmon" => false,
                "alarmramp" => false,
                "synctags" => false,
                "synclove" => false,
                "synclovevalue" => "5",
                "proxy_host" => "",
                "proxy_user" => "",
                "proxy_password" => "",
                "ignore_unplayable" => true,
                "icontheme" => "Modern-Light",
                "radiomode" => "",
                "radioparam" => "",
                "onthefly" => true,
                "sortbycomposer" => false,
                "composergenre" => false,
                "composergenrename" => array("Classical"),
                "displaycomposer" => true,
                "custom_logfile" => "",
                "consumeradio" => false,
                "artistsatstart" => array("Various Artists","Soundtracks"),
                "nosortprefixes" => array("The"),
                "sortcollectionby" => "artist",
                "alarm_ramptime" => 30,
                "alarm_snoozetime" => 8,
                "coversize" => "10-Small.css",
                "mediacentremode" => false,
                "collectioncontrolsvisible" => false,
                "displayresultsas" => "collection",
                "mopidy_collection_folders" => array("Spotify Playlists","Local media","SoundCloud/Liked"),
                "mopidy_search_domains" => array("local", "spotify")
                );

if (file_exists('prefs/prefs')) {
    include("utils/convertprefs.php");
} else if (file_exists('prefs/prefs.var')) {
    loadPrefs();
}

if (is_dir('albumart/original')) {
    system('mv albumart/small albumart/not_used_anymore');
    system('mv albumart/original albumart/small');
}

if ($prefs['debug_enabled']) {

    $debug_colours = array(
        "COLLECTION" => "0;34",
        "MYSQL" => "0;32",
        "TIMINGS" => "0;36",
        "TOMATO" => "1;30",
        "GETALBUMCOVER" => "0;33",
        "INIT" => "1;33"
    );

    function debug_print($out, $module = "") {
        global $prefs, $debug_colours;
        $in = str_repeat(" ", 20 - strlen($module));
        if ($prefs['custom_logfile'] != "") {
            if (array_key_exists($module, $debug_colours)) {
                $col = $debug_colours[$module];
            } else {
                $col = "1;35";
            }
            error_log(strftime('%T')." : \e[".$col."m".$module.$in.": \e[0m".$out."\n",3,$prefs['custom_logfile']);
        } else {
            error_log($module.$in.": ".$out,0);
        }
    }
} else {
    function debug_print($a, $b = "") {

    }
}

function savePrefs() {
    global $prefs;
    $sp = $prefs;
    foreach (array('albumslist', 'fileslist', 'showfileinfo') as $p) {
        if (array_key_exists($p, $sp)) {
            unset($sp[$p]);
        }
    }
    $ps = serialize($sp);
    $r = file_put_contents('prefs/prefs.var', $ps, LOCK_EX);
    if ($r === false) {
        error_log("ERROR!              : COULD NOT SAVE PREFS");
    }
}

function loadPrefs() {
    global $prefs;
    $fp = fopen('prefs/prefs.var', 'r');
    if($fp) {
        if (flock($fp, LOCK_SH)) {
            $sp = unserialize(fread($fp, 32768));
            flock($fp, LOCK_UN);
            fclose($fp);
            if ($sp === false) {
                error_log("ERROR!              : COULD NOT LOAD PREFS");
                exit(1);
            }
            $prefs = array_replace($prefs, $sp);
        } else {
            error_log("ERROR!              : COULD NOT GET READ FILE LOCK ON PREFS FILE");
            exit(1);
        }
    } else {
        error_log("ERROR!              : COULD NOT GET HANDLE FOR PREFS FILE");
        exit(1);
    }
}

?>
