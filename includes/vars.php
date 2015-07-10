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
                "debug_enabled" => 0,
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
                "onthefly" => false,
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

if ($prefs['debug_enabled'] === true) {
    $prefs['debug_enabled'] = 8;
}

if (is_dir('albumart/original')) {
    system('mv albumart/small albumart/not_used_anymore');
    system('mv albumart/original albumart/small');
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

class debug_logger {

    public function __construct($outfile, $level = 8) {
        $this->outfile = $outfile;
        $this->loglevel = intval($level);
        $this->debug_colours = array(
            # red
            1 => 31,
            # yellow
            2 => 33,
            # magenta
            3 => 35,
            # cyan
            4 => 36,
            # white
            5 => 37,
            # white
            6 => 37,
            # green
            7 => 32,
            # blue
            8 => 34,
            # dim
            9 => 2
        );
    }

    public function log($out, $module, $level) {
        if ($level > $this->loglevel || $level > 9 || $level < 1) return;
        $in = str_repeat(" ", 20 - strlen($module));
        if ($this->outfile != "") {
            $col = $this->debug_colours[$level];
            error_log(strftime('%T')." : \033[".$col."m".$module.$in.": ".$out."\033[0m\n",3,$this->outfile);
        } else {
            error_log($module.$in.": ".$out,0);
        }

    }

    public function setLevel($level) {
        $this->loglevel = intval($level);
    }
}

$logger = new debug_logger($prefs['custom_logfile'], $prefs['debug_enabled']);

function debuglog($text, $module = "", $level = 7) {
    global $logger;
    $logger->log($text, $module, $level);
}

?>
