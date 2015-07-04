<?php
include("includes/vars.php");

// SVN versions of this release had composergenrename as a string but it's now an arry
if (!is_array($prefs['composergenrename'])) {
    $prefs['composergenrename'] = array($prefs['composergenrename']);
}

debug_print("=================****==================","INIT");

include("includes/functions.php");
include("international.php");

debug_print($_SERVER['SCRIPT_FILENAME'],"INIT");
debug_print($_SERVER['PHP_SELF'],"INIT");

//
// See if there are any POST values from the setup screen
//

if (array_key_exists('mpd_host', $_POST)) {
    $prefs['debug_enabled'] = false;
    foreach ($_POST as $i => $value) {
        if ($i == 'debug_enabled') {
            $value = true;
        }
        debug_print("Setting Pref ".$i." to ".$value,"INIT");
        $prefs[$i] = $value;
    }
    savePrefs();
}

//
// Has the user asked for the setup screen?
//

if (array_key_exists('setup', $_REQUEST)) {
    askForMpdValues(get_int_text("setup_request"));
    exit();
}

//
// Check to see if this is a mobile browser
//

include 'utils/Mobile_Detect.php';
if (array_key_exists('mobile', $_REQUEST)) {
    $skin = ($_REQUEST['mobile'] == "phone") ? "phone" : "desktop";
    debug_print("Request asked for skin: ".$skin,"INIT");
} else if(array_key_exists('skin', $_REQUEST)) {
    $skin = $_REQUEST['skin'];
    debug_print("Request asked for skin: ".$skin,"INIT");
    if (!is_dir('skins/'.$skin)) {
        print '<h3>Skin '.$skin.' does not exist!</h3>';
        exit(0);
    }
} else {
    $detect = new Mobile_Detect();
    if ($detect->isMobile() && !$detect->isTablet()) {
        debug_print("Mobile Browser Detected!","INIT");
        $skin = "phone";
    } else {
        debug_print("Not a mobile browser","INIT");
        $skin = "desktop";
    }
}
debug_print("Using skin : ".$skin,"INIT");
if (file_exists('skins/'.$skin.'/skin.requires')) {
    debug_print("Loading Skin Requirements File","INIT");
    $skinrequires = file('skins/'.$skin.'/skin.requires');
} else {
    $skinrequires = array();
}

include("player/mpd/connection.php");
if (!$is_connected) {
    debug_print("MPD Connection Failed","INIT");
    askForMpdValues(get_int_text("setup_connectfail"));
    exit();
} else {
    $mpd_status = do_mpd_command("status", true);
    if (array_key_exists('error', $mpd_status)) {
        debug_print("MPD Password Failed or other status failure","INIT");
        close_mpd();
        askForMpdValues(get_int_text("setup_connecterror").$mpd_status['error']);
        exit();
    }
}

// Let's do a test to see if we're running mpd or mopidy
// Mopidy doesn't support 'readmessages' and the website says its unlikely
// ever to support it, so if we get an error on that
// we're running mopidy. It's flaky but I don't see another way.
$r = do_mpd_command('readmessages', false);
if ($r === false) {
    debug_print("Looks like we're running Mopidy","INIT");
    $prefs['player_backend'] = "mopidy";
} else {
    debug_print("Looks like we're running MPD","INIT");
    $prefs['player_backend'] = "mpd";
}

if ($prefs['unix_socket'] != '') {
    // If we're connected by a local socket we can read the music directory
    $arse = do_mpd_command('config', true);
    if (array_key_exists('music_directory', $arse)) {
        debug_print("Music Directory Is ".$arse['music_directory'],"INIT");
        $prefs['music_directory'] = $arse['music_directory'];
        if (is_link("prefs/MusicFolders")) {
            system ("unlink prefs/MusicFolders");
        }
        system ('ln -s "'.$arse['music_directory'].'" prefs/MusicFolders');
    }
}

close_mpd();

//
// See if we can use the SQL backend
//

// XML backend no longer supported. Force switch to SQLite.
if (array_key_exists('collection_type', $prefs) && $prefs['collection_type'] == "xml") {
    $prefs['collection_type'] = "sqlite";
} 

include( "backends/sql/connect.php");
if (array_key_exists('collection_type', $prefs)) {
    connect_to_database();
} else {
    probe_database();
    include("backends/sql/".$prefs['collection_type']."/specifics.php");
}
if (!$mysqlc) {
    sql_init_fail();
}

savePrefs();

list($result, $message) = check_sql_tables();
if ($result == false) {
    sql_init_fail($message);
}

//
// Do some initialisation and cleanup of the Apache backend
//
include ("includes/firstrun.php");

debug_print("Initialisation done. Let's Boogie!", "INIT");
debug_print("=================****==================","STARTED UP");

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<?php
print '<link rel="stylesheet" type="text/css" href="skins/'.$skin.'/skin.css" />'."\n";
foreach ($skinrequires as $s) {
    $s = trim($s);
    $ext = strtolower(pathinfo($s, PATHINFO_EXTENSION));
    if ($ext == "css") {
        debug_print("Including Skin Requirement ".$s,"INIT");
        print '<link rel="stylesheet" type="text/css" href="'.$s.'" />'."\n";
    }
}
?>
<link rel="stylesheet" type="text/css" href="css/jquery-ui.css" />
<link rel="stylesheet" id="theme" type="text/css" />
<link rel="stylesheet" id="fontsize" type="text/css" />
<link rel="stylesheet" id="fontfamily" type="text/css" />
<link rel="stylesheet" id="icontheme-theme" type="text/css" />
<link rel="stylesheet" id="icontheme-adjustments" type="text/css" />
<link rel="stylesheet" id="albumcoversize" type="text/css" />
<!-- JQuery : http://jquery.com -->
<script type="text/javascript" src="jquery/jquery-1.8.3-min.js"></script>
<!-- JQueryUI is required for $.widget even in the mobile version -->
<script type="text/javascript" src="jquery/jquery-ui.js"></script>
<!-- JQuery AJAX form plugin : http://malsup.com/jquery/form/ -->
<script type="text/javascript" src="jquery/jquery.form.js"></script>
<!-- JQuery JSONP Plugin. My saviour : https://github.com/jaubourg/jquery-jsonp -->
<script type="text/javascript" src="jquery/jquery.jsonp-2.3.1.min.js"></script>
<!-- MD5 hashing algorith : http://pajhome.org.uk/crypt/md5 -->
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<!-- Masonry layout engine : http://masonry.desandro.com/ -->
<script type="text/javascript" src="jquery/imagesloaded.pkgd.min.js"></script>
<script type="text/javascript" src="jquery/masonry.pkgd.min.js"></script>
<script type="text/javascript" src="ui/readyhandlers.js"></script>
<script type="text/javascript" src="ui/debug.js"></script>
<script type="text/javascript" src="ui/functions.js"></script>
<script type="text/javascript" src="ui/uifunctions.js"></script>
<script type="text/javascript" src="ui/clickfunctions.js"></script>
<script type="text/javascript" src="ui/lastfm.js"></script>
<script type="text/javascript" src="ui/nowplaying.js"></script>
<script type="text/javascript" src="ui/infobar2.js"></script>
<script type="text/javascript" src="ui/playlist.js"></script>
<script type="text/javascript" src="ui/coverscraper.js"></script>
<?php
$inc = glob("streamplugins/*.js");
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
print'<script type="text/javascript" src="player/mpd/controller.js"></script>'."\n";
?>
<script type="text/javascript" src="player/player.js"></script>

<?php
include('includes/globals.php');
?>

<script language="javascript">

function aADownloadFinished() {
    debug.log("INDEX","Album Art Download Has Finished");
}
var playlist = new Playlist();
var player = new multiProtocolController();
var lastfm = new LastFM(prefs.lastfm_user);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);
</script>

<script type="text/javascript" src="ui/podcasts.js"></script>
<?php
$inc = glob("browser/helpers/*.js");
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
$inc = glob("browser/plugins/*.js");
ksort($inc);
foreach($inc as $i) {
    debug_print("Including Plugin ".$i,"INIT");
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
$inc = glob("radios/*.js");
ksort($inc);
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
if ($skin == "desktop") {
    $inc = glob("plugins/*.js");
    foreach($inc as $i) {
        debug_print("Including Plugin ".$i,"INIT");
        print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
    }
}
?>
<script type="text/javascript" src="browser/info.js"></script>

<?php
foreach ($skinrequires as $s) {
    $s = trim($s);
    $ext = strtolower(pathinfo($s, PATHINFO_EXTENSION));
    if ($ext == "js") {
        debug_print("Including Skin Requirement ".$s,"INIT");
        print '<script type="text/javascript" src="'.$s.'"></script>'."\n";
    }
}
print '<script type="text/javascript" src="skins/'.$skin.'/skin.js"></script>'."\n";
?>

</head>

<?php
debug_print("Including skins/".$skin.'/skin.php',"LAYOUT");
include('skins/'.$skin.'/skin.php');
?>

<div id="tagadder" class="funkymusic dropmenu dropshadow">
    <div class="configtitle textcentre" style="padding-top:4px"><b>
<?php
print get_int_text("lastfm_addtags").'</b><i class="icon-cancel-circled clickicon playlisticonr tright" onclick="tagAdder.close()"></i></div><div>'.get_int_text("lastfm_addtagslabel");
?>
    </div>
    <div class="containerbox padright dropdown-container tagaddbox"></div>
</div>

</body>
</html>

