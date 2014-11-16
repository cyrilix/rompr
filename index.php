<?php
include("includes/vars.php");

debug_print("","HERE WE GO!");
debug_print("=================****==================","STARTING UP");

include("includes/functions.php");
include("international.php");

debug_print($_SERVER['SCRIPT_FILENAME'],"STARTING UP");
debug_print($_SERVER['PHP_SELF'],"STARTING UP");

//
// See if there are any POST values from the setup screen
//

if (array_key_exists('mpd_host', $_POST)) {
    $prefs['debug_enabled'] = 0;
    foreach ($_POST as $i => $value) {
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
    $mobile = $_REQUEST['mobile'];
    debug_print("Request asked for mobile mode: ".$mobile,"INDEX");
} else {
    $detect = new Mobile_Detect();
    if ($detect->isMobile() && !$detect->isTablet()) {
        debug_print("Mobile Browser Detected!","INDEX");
        $mobile = "phone";
    } else {
        debug_print("Not a mobile browser","INDEX");
        $mobile = "no";
    }
}

//
// Find mopidy's HTTP interface, if present or ignore this check
// if the user has specified it in URL eg http://hostname/rompr?mopdiy=mopidyhost:mopidyport
//

if (array_key_exists('mopidy', $_REQUEST)) {
    $mopidy_detected = true;
    $prefs['mopidy_detected'] = "true";
    $a = explode(':', $_REQUEST['mopidy']);
    $prefs['mopidy_http_address'] = $a[0];
    $prefs['mopidy_http_port'] = $a[1];
    debug_print("User Specified Mopidy Connection As ".$prefs['mopidy_http_address'].":".$prefs['mopidy_http_port'],"INDEX");
} else {
    $mopidy_detected = detect_mopidy();
    $prefs['mopidy_detected'] = $mopidy_detected == true ? "true" : "false";
}

if ($mopidy_detected) {

    $prefs["player_backend"] = "mopidy";

} else {

    //
    // If we didn't find mopidy, try and connect to mpd and ask for
    // setup values if we couldn't
    //

    include("player/mpd/connection.php");
    if (!$is_connected) {
        debug_print("MPD Connection Failed","INDEX");
        close_mpd($connection);
        askForMpdValues(get_int_text("setup_connectfail"));
        exit();
    } else if (array_key_exists('error', $mpd_status)) {
        debug_print("MPD Password Failed or other status failure","INDEX");
        close_mpd($connection);
        askForMpdValues(get_int_text("setup_connecterror").$mpd_status['error']);
        exit();
    }
    close_mpd($connection);
    $prefs['player_backend'] = "mpd";
}

//
// See if we can use the SQL backend
//

include( "backends/sql/connect.php");
connect_to_database();
if ($mysqlc) {
    $prefs["apache_backend"] = "sql";
    $backend_in_use = "sql";
} else {
    $prefs["apache_backend"] = "xml";
    $backend_in_use = "xml";
}

savePrefs();

//
// Do some initialisation and cleanup of the Apache backend
//

include ("includes/firstrun.php");

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
<link rel="stylesheet" type="text/css" href="tiptip/tipTip.css" />
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
<?php
if ($mobile != "no") {
    print '<link rel="stylesheet" type="text/css" href="css/layout_mobile.css" />'."\n";
} else {
    print '<link type="text/css" href="custom-scrollbar-plugin/css/jquery.mCustomScrollbar.css" rel="stylesheet" />'."\n";
}
print '<link id="theme" rel="stylesheet" type="text/css" href="themes/'.$prefs['theme'].'" />'."\n";
print '<link rel="stylesheet" id="fontsize" type="text/css" href="sizes/'.$prefs['fontsize'].'" />'."\n";
print '<link rel="stylesheet" id="fontfamily" type="text/css" href="fonts/'.$prefs['fontfamily'].'" />'."\n";
?>
<!-- JQuery : http://jquery.com -->
<script type="text/javascript" src="jquery/jquery-1.8.3-min.js"></script>
<!-- JQuery AJAX form plugin : http://malsup.com/jquery/form/ -->
<script type="text/javascript" src="jquery/jquery.form.js"></script>
<!-- JQuery UI plugin : http://jqueryui.com. Heavily modified to make dragging work more easily and to function -->
<!-- with the custom scrollbar plugin (now almost certainly doesn't work without it) -->
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<!-- JQuery JSONP Plugin. My saviour : https://github.com/jaubourg/jquery-jsonp -->
<script type="text/javascript" src="jquery/jquery.jsonp-2.3.1.min.js"></script>
<!-- JQuery scrollTO plugin : http://demos.flesler.com/jquery/scrollTo/ -->
<script type="text/javascript" src="jquery/jquery.scrollTo-1.4.3.1-min.js"></script>
<!-- TipTip jQuery tooltip plugin : http://code.drewwilson.com/entry/tiptip-jquery-plugin -->
<script type="text/javascript" src="tiptip/jquery.tipTip.js"></script>
<!-- MD5 hashing algorith : http://pajhome.org.uk/crypt/md5 -->
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<!-- Masonry layout engine : http://masonry.desandro.com/ -->
<script type="text/javascript" src="jquery/masonry.pkgd.min.js"></script>
<script type="text/javascript" src="jquery/imagesloaded.pkgd.min.js"></script>
<?php
if ($mobile != "no") {
    // JQuery touchwipe plugin : http://www.netcu.de/jquery-touchwipe-iphone-ipad-library
    print '<script type="text/javascript" src="jquery/jquery.touchwipe.min.js"></script>'."\n";
    print '<script type="text/javascript" src="ui/mobile_functions.js"></script>'."\n";
} else {
    // Custom scrollbar plugin : http://manos.malihu.gr/jquery-custom-content-scroller/
    print '<script type="text/javascript" src="custom-scrollbar-plugin/js/jquery.mCustomScrollbar.concat.min.js"></script>'."\n";
    // Keyboard shortcut helper : http://www.openjs.com/scripts/events/keyboard_shortcuts/
    print '<script type="text/javascript" src="ui/shortcut.js"></script>'."\n";
    // Keycode normaliser by Jonathan Tang : http://jonathan.tang.name/code/js_keycode
    print '<script type="text/javascript" src="ui/keycode.js"></script>'."\n";
    print '<script type="text/javascript" src="ui/desktop_functions.js"></script>'."\n";
}
?>
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

if ($prefs['player_backend'] == "mopidy") {
    print'<script type="text/javascript" src="http://'.$prefs['mopidy_http_address'].':'.$prefs['mopidy_http_port'].'/mopidy/mopidy.min.js"></script>'."\n";
}
print'<script type="text/javascript" src="player/'.$prefs['player_backend'].'/controller.js"></script>'."\n";

?>
<script type="text/javascript" src="player/player.js"></script>

<?php
include('includes/globals.php');
if (file_exists("prefs/prefs.js") && $prefs['lastfm_session_key'] === "") {
    print '<script type="text/javascript" src="prefs/prefs.js"></script>'."\n";
} else if (file_exists("prefs/prefs.js") && $prefs['lastfm_session_key'] !== "") {
    system('rm prefs/prefs.js');
}
?>

<script language="javascript">

function aADownloadFinished() {
    debug.log("INDEX","Album Art Download Has Finished");
}

var playlist = new Playlist();
var player = new multiProtocolController();
var lastfm = new LastFM(prefs.lastfm_user);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);

<?php
print 'var ipath = "'.$ipath.'";'."\n";
?>

$(window).ready(function(){

    // Update the old-style lastfm_session_key variable
    if (typeof lastfm_session_key !== 'undefined') {
        prefs.save({lastfm_session_key: lastfm_session_key});
    }

    if ("localStorage" in window && window["localStorage"] != null) {
        window.addEventListener("storage", onStorageChanged, false);
    }

    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").slideToggle('fast', setBottomPaneSize);
    }

    if (prefs.country_userset == false) {
        // Have to pull this data in via the webserver as it's cross-domain
        $.getJSON("getgeoip.php", function(result){
            debug.shout("CHECKING", 'Country: ' + result.country_name + ' Code: ' + result.country_code);
            $("#countryselector").val(prefs.lastfm_country_code);
            prefs.save({lastfm_country_code: result.country_code});
        });
    }

    setClickHandlers();
    $("#sortable").click(onPlaylistClicked);
    infobar.createProgressBar();
    $("#progress").click( infobar.seek );
    sbWidth = scrollbarWidth();
    initUI();
    browser.createButtons();
    setChooserButtons();
    if (prefs.hide_albumlist) {
        $("#search").show();
    }
    if (!prefs.hide_radiolist) {
        $("#yourradiolist").load("yourradio.php");
    }
    setPrefs();
    checkServerTimeOffset();
    sourcecontrol(prefs.chooser);
});

$(window).load(function() {
    setBottomPaneSize();
    $(window).bind('resize', function() {
        setBottomPaneSize();
    });
    player.controller.initialise();
    showUpdateWindow();
    if (!prefs.hide_radiolist) {
        podcasts.loadList();
    }
    $.get('cleancache.php', function() {
        debug.shout("INIT","Cache Has Been Cleaned");
    });
});

function showUpdateWindow() {
    if (prefs.shownupdatewindow === true || prefs.shownupdatewindow < 0.60) {
        var fnarkle = popupWindow.create(500,600,"fnarkle",true,language.gettext("intro_title"));
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        if (mobile != "no") {
            $("#fnarkler").addClass('tiny');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_welcome")+' 0.60</p>');
        if (mobile != "no") {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewingmobile")+' <a href="/rompr/?mobile=no">/rompr/?mobile=no</a></p>');
        } else {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewmobile")+' <a href="/rompr/?mobile=phone">/rompr/?mobile=phone</a></p>');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_basicmanual")+' <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_forum")+' <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p align="center">RompR needs translators! If you want to get involved, please read <a href="https://sourceforge.net/p/rompr/wiki/Translating%20RompR/" target="_blank">this</a></p>');
        $("#fnarkler").append('<p align="center"><b>'+language.gettext("intro_mopidy")+'</b></p>');
<?php
        print '$("#fnarkler").append(\'<p align="center"><a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/" target="_blank">'.get_int_text("intro_mopidywiki").'</a></p>\');'."\n";
        print '$("#fnarkler").append(\'<p align="center"><b>'.get_int_text("intro_mopidyversion", array($prefs["mopidy_version"])).'</b></p>\');'."\n";
?>
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: 0.60});
    }
}

</script>
</head>

<?php
if ($mobile == "no") {
    include('layouts/layout_normal.php');
} else if ($mobile == "phone") {
    include('layouts/layout_phone.php');
}
?>

<div id="tagadder" class="funkymusic dropmenu dropshadow">
    <div class="pref" style="padding-top:4px"><b>
<?php
print get_int_text("lastfm_addtags").'<br></b>'.get_int_text("lastfm_addtagslabel");
?>
    </div>
    <div class="containerbox padright dropdown-container">
        <div class="expand dropdown-holder">
            <input class="searchterm enter sourceform" id="newtags" type="text" style="width:100%;font-size:100%"/>
            <div class="drop-box dropshadow tagmenu" style="width:100%">
                <div class="tagmenu-contents">
                </div>
            </div>
        </div>
        <div class="fixed dropdown-button">
<?php
            print '<img src="'.$ipath.'dropdown.png">';
?>
        </div>
        <button class="fixed" style="margin-left:8px" onclick="tagAdder.add()">
<?php
print get_int_text("button_add");
?>
        </button>
    </div>
</div>

</body>
<script type="text/javascript" src="ui/podcasts.js"></script>
<?php
$inc = glob("browser/helpers/*.js");
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
$inc = glob("browser/plugins/*.js");
ksort($inc);
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
$inc = glob("radios/*.js");
ksort($inc);
foreach($inc as $i) {
    print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
}
if ($mobile == "no") {
    $inc = glob("plugins/*.js");
    foreach($inc as $i) {
        print '<script type="text/javascript" src="'.$i.'"></script>'."\n";
    }
}
?>
<script type="text/javascript" src="browser/info.js"></script>
</html>

