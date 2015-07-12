<?php

define('ROMPR_MAX_TRACKS_PER_TRANSACTION', 500);
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

$prefs = array( 
    // Things that only make sense as backend options, not per-user options
    "music_directory_albumart" => "",
    "mysql_host" => "localhost",
    "mysql_database" => "romprdb",
    "mysql_user" => "rompr",
    "mysql_password" => "romprdbpass",
    "mysql_port" => "3306",
    "proxy_host" => "",
    "proxy_user" => "",
    "proxy_password" => "",
    "ignore_unplayable" => true,
    "sortbycomposer" => false,
    "composergenre" => false,
    "composergenrename" => array("Classical"),
    "mopidy_collection_folders" => array("Spotify Playlists","Local media","SoundCloud/Liked"),
    "lastfm_country_code" => "GB",
    "country_userset" => false,
    "debug_enabled" => 0,
    "custom_logfile" => "",
    "player_backend" => "",

    // Things that could be set on a per-user basis but need to be known by the backend
    "mpd_host" => "localhost",
    "mpd_port" => 6600,
    "mpd_password" => "",
    "unix_socket" => '',
    "sortbydate" => false,
    "notvabydate" => false,
    "displaycomposer" => true,
    "artistsatstart" => array("Various Artists","Soundtracks"),
    "nosortprefixes" => array("The"),
    "sortcollectionby" => "artist",

    // These are currently saved in the backend, as the most likely scenario is one user
    // with multiple browsers. But what if it's multiple users?
    "lastfm_user" => "",
    "lastfm_scrobbling" => false,
    "lastfm_autocorrect" => false,
    "lastfm_session_key" => "",    
    "autotagname" => "",

    // All of these are saved in the browser, so these are only defaults
    "sourceshidden" => false,
    "playlisthidden" => false,
    "infosource" => "lastfm",
    "playlistcontrolsvisible" => false,
    "sourceswidthpercent" => 22,
    "playlistwidthpercent" => 22,
    "downloadart" => true,
    "clickmode" => "double",
    "chooser" => "albumlist",
    "hide_albumlist" => false,
    "hide_filelist" => false,
    "hide_radiolist" => false,
    "hidebrowser" => false,
    "shownupdatewindow" => 0,
    "scrolltocurrent" => false,
    "alarmtime" => 43200,
    "alarmon" => false,
    "alarmramp" => false,
    "alarm_ramptime" => 30,
    "alarm_snoozetime" => 8,
    "lastfmlang" => "default",
    "user_lang" => "en",
    "synctags" => false,
    "synclove" => false,
    "synclovevalue" => "5",
    "radiomode" => "",
    "radioparam" => "",
    "consumeradio" => false,
    "onthefly" => false,
    "theme" => "Darkness.css",
    "icontheme" => "Modern-Light",
    "coversize" => "10-Small.css",
    "fontsize" => "02-Normal.css",
    "fontfamily" => "Verdana.css",
    "mediacentremode" => false,
    "collectioncontrolsvisible" => false,
    "displayresultsas" => "collection",
    'crossfade_duration' => 5,
    "radiocountry" => "http://www.listenlive.eu/uk.html",
    "search_limit_limitsearch" => false,
    "scrobblepercent" => 50,
    "updateeverytime" => false,
    "fullbiobydefault" => true,
    "mopidy_search_domains" => array("local", "spotify")

);

// ====================================================================
// Load Saved Preferences

if (file_exists('prefs/prefs')) {
    // Convert old-style prefs file
    include("utils/convertprefs.php");
} else if (file_exists('prefs/prefs.var')) {
    // Else, load new-style prefs file
    loadPrefs();
}

if ($prefs['debug_enabled'] === true) {
    // Convert old-style debug pref
    $prefs['debug_enabled'] = 7;
}

$logger = new debug_logger($prefs['custom_logfile'], $prefs['debug_enabled']);

if (!array_key_exists('multihosts', $prefs)) { 
    $prefs['multihosts'] = new stdClass; 
    $prefs['multihosts']->Default = (object) [ 
            'host' => $prefs['mpd_host'],
            'port' => $prefs['mpd_port'],
            'password' => $prefs['mpd_password'],
            'socket' => $prefs['unix_socket']
    ];
    setcookie('currenthost','Default',time()+365*24*60*60*10);
    $prefs['currenthost'] = 'Default';
    savePrefs();
}

// Prefs can be overridden by cookies
foreach ($_COOKIE as $a => $v) {
    if (array_key_exists($a, $prefs)) {
        $prefs[$a] = $v;
        if ($a == 'debug_enabled') {
            $logger->setLevel($v);
        }
        debuglog("Pref ".$a." overridden by Cookie  - Value : ".$v,"COOKIE",8);
    }
}

debuglog("Using MPD Host ".$prefs['currenthost'],"INIT",8);

if (!array_key_exists('currenthost', $_COOKIE)) {
    setcookie('currenthost',$prefs['currenthost'],time()+365*24*60*60*10);
}

$prefs['mpd_host'] = $prefs['multihosts']->$prefs['currenthost']->host;
$prefs['mpd_port'] = $prefs['multihosts']->$prefs['currenthost']->port;
$prefs['mpd_password'] = $prefs['multihosts']->$prefs['currenthost']->password;
$prefs['unix_socket'] = $prefs['multihosts']->$prefs['currenthost']->socket;


if (is_dir('albumart/original')) {
    // Re-arrange the saved album art 
    system('mv albumart/small albumart/not_used_anymore');
    system('mv albumart/original albumart/small');
}

// ====================================================================

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

function debuglog($text, $module = "", $level = 7) {
    global $logger;
    $logger->log($text, $module, $level);
}

?>
