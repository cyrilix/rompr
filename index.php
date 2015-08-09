<?php
include("includes/vars.php");

debuglog("=================****==================","INIT",2);

//
// Check to see if this is a mobile browser
//

if (array_key_exists('mobile', $_REQUEST)) {
    $skin = ($_REQUEST['mobile'] == "phone") ? "phone" : "desktop";
    debuglog("Request asked for skin: ".$skin,"INIT",6);
} else if(array_key_exists('skin', $_REQUEST)) {
    $skin = $_REQUEST['skin'];
    debuglog("Request asked for skin: ".$skin,"INIT",6);
} else if (array_key_exists('skin', $_COOKIE)) {
    $skin = $_COOKIE['skin'];
    debuglog("Using skin as set by Cookie: ".$skin,"INIT",6);
} else {
    debuglog("Detecting window size to decide which skin to use....","INIT",4);
    include('checkwindowsize.php');
    exit(0);
}
$skin = trim($skin);
debuglog("Using skin : ".$skin,"INIT",6);
if (!is_dir('skins/'.$skin)) {
    print '<h3>Skin '.$skin.' does not exist!</h3>';
    exit(0);
}

if (file_exists('skins/'.$skin.'/skin.requires')) {
    debuglog("Loading Skin Requirements File","INIT",9);
    $skinrequires = file('skins/'.$skin.'/skin.requires');
} else {
    $skinrequires = array();
}

// SVN versions of this release had composergenrename as a string but it's now an array
if (!is_array($prefs['composergenrename'])) {
    $prefs['composergenrename'] = array($prefs['composergenrename']);
}
// Workaround bug where thsi wasn't initialised to a value, meaning an error could be thrown
// on the first inclusion of connection.php
if ($prefs['player_backend'] == '') {
    $prefs['player_backend'] = 'mpd';
}

include("includes/functions.php");
include("international.php");

//
// See if there are any POST values from the setup screen
//

if (array_key_exists('mpd_host', $_POST)) {
    foreach ($_POST as $i => $value) {
        debuglog("Setting Pref ".$i." to ".$value,"INIT", 3);
        $prefs[$i] = $value;
    }
    $prefs['multihosts']->$prefs['currenthost'] = (object) [
            'host' => $prefs['mpd_host'],
            'port' => $prefs['mpd_port'],
            'password' => $prefs['mpd_password'],
            'socket' => $prefs['unix_socket']
    ];
    $logger->setLevel($prefs['debug_enabled']);
    savePrefs();
}

debuglog($_SERVER['SCRIPT_FILENAME'],"INIT",9);
debuglog($_SERVER['PHP_SELF'],"INIT",9);

//
// Has the user asked for the setup screen?
//

if (array_key_exists('setup', $_REQUEST)) {
    askForMpdValues(get_int_text("setup_request"));
    exit();
}

include("player/mpd/connection.php");
if (!$is_connected) {
    debuglog("MPD Connection Failed","INIT",1);
    askForMpdValues(get_int_text("setup_connectfail"));
    exit();
} else {
    $mpd_status = do_mpd_command("status", true);
    if (array_key_exists('error', $mpd_status)) {
        debuglog("MPD Password Failed or other status failure","INIT",1);
        close_mpd();
        askForMpdValues(get_int_text("setup_connecterror").$mpd_status['error']);
        exit();
    }
}

// Let's do a test to see if we're running mpd or mopidy
$oldmopidy = false;
debuglog("Probing Player Type....","INIT",4);
$r = do_mpd_command('tagtypes', true, true);
if (is_array($r) && array_key_exists('tagtype', $r)) {
    if (in_array('X-AlbumUri', $r['tagtype'])) {
        debuglog("    ....tagtypes test says we're running Mopidy","INIT",4);
        $prefs['player_backend'] = "mopidy";
    } else {
        debuglog("    ....tagtypes test says we're running MPD","INIT",4);
        $prefs['player_backend'] = "mpd";
    }
} else {
    debuglog("WARNING! No output for 'tagtypes' - probably an old version of Mopidy. Rompr may not function correctly","INIT",2);
    $prefs['player_backend'] = "mopidy";
    $oldmopidy = true;
}

if ($prefs['unix_socket'] != '') {
    // If we're connected by a local socket we can read the music directory
    $arse = do_mpd_command('config', true);
    if (array_key_exists('music_directory', $arse)) {
        debuglog("Music Directory Is ".$arse['music_directory'],"INIT",9);
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

debuglog("Initialisation done. Let's Boogie!", "INIT",9);
debuglog("=================****==================","STARTED UP",2);

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
        debuglog("Including Skin Requirement ".$s,"INIT",6);
        print '<link rel="stylesheet" type="text/css" href="'.$s.'" />'."\n";
    }
}
?>
<link rel="stylesheet" id="theme" type="text/css" />
<link rel="stylesheet" id="fontsize" type="text/css" />
<link rel="stylesheet" id="fontfamily" type="text/css" />
<link rel="stylesheet" id="icontheme-theme" type="text/css" />
<link rel="stylesheet" id="icontheme-adjustments" type="text/css" />
<link rel="stylesheet" id="albumcoversize" type="text/css" />
<!-- JQuery : http://jquery.com -->
<script type="text/javascript" src="jquery/jquery-2.1.4.min.js"></script>
<script type="text/javascript" src="jquery/jquery-migrate-1.2.1.js"></script>
<!-- JQueryUI is required for $.widget even in the mobile version -->
<script type="text/javascript" src="jquery/jquery-ui.min.js"></script>
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
<script type="text/javascript" src="ui/favefinder.js"></script>
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
    debug.trace("INDEX","Album Art Download Has Finished");
}
var playlist = new Playlist();
var player = new multiProtocolController();
var lastfm = new LastFM(prefs.lastfm_user);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);
var trackFinder = new faveFinder(false);
</script>

<script type="text/javascript" src="ui/podcasts.js"></script>
<?php
debuglog("Including skins/".$skin.'/skinvars.php',"LAYOUT",5);
include('skins/'.$skin.'/skinvars.php');
$inc = glob("browser/helpers/*.js");
foreach($inc as $i) {
    debuglog("Including Browser Helper ".$i,"INIT",5);
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
$inc = glob("browser/plugins/*.js");
ksort($inc);
foreach($inc as $i) {
    debuglog("Including Info Panel Plugin ".$i,"INIT",5);
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
if ($use_smartradio) {
    $inc = glob("radios/*.js");
    ksort($inc);
    foreach($inc as $i) {
        debuglog("Including Smart Radio Plugin ".$i,"INIT",5);
        print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
    }
}
if ($use_plugins) {
    $inc = glob("plugins/*.js");
    foreach($inc as $i) {
        debuglog("Including Plugin ".$i,"INIT",5);
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
        debuglog("Including Skin Requirement ".$s,"INIT",5);
        print '<script type="text/javascript" src="'.$s.'"></script>'."\n";
    }
}
print '<script type="text/javascript" src="skins/'.$skin.'/skin.js"></script>'."\n";
?>

</head>

<?php
debuglog("Including skins/".$skin.'/skin.php',"LAYOUT",5);
include('skins/'.$skin.'/skin.php');
?>

<div id="tagadder" class="funkymusic dropmenu dropshadow">
    <div class="configtitle textcentre hound" style="padding-top:4px"><b>
<?php
print get_int_text("lastfm_addtags").'</b><i class="icon-cancel-circled clickicon playlisticonr tright" onclick="tagAdder.close()"></i></div><div>'.get_int_text("lastfm_addtagslabel");
?>
    </div>
    <div class="containerbox padright dropdown-container tagaddbox"></div>
</div>

</body>
</html>

