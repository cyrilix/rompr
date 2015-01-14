<?php
include("includes/vars.php");

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
    $prefs['lowmemorymode'] = false;
    foreach ($_POST as $i => $value) {
        if ($i == 'debug_enabled' || $i == 'lowmemorymode') {
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

//
// Find mopidy's HTTP interface, if present or ignore this check
// if the user has specified it in URL eg http://hostname/rompr?mopdiy=mopidyhost:mopidyport
//

if (array_key_exists('mopidy', $_REQUEST)) {
    $mopidy_detected = true;
    $a = explode(':', $_REQUEST['mopidy']);
    $prefs['mopidy_http_address'] = $a[0];
    $prefs['mopidy_http_port'] = $a[1];
    debug_print("User Specified Mopidy Connection As ".$prefs['mopidy_http_address'].":".$prefs['mopidy_http_port'],"INIT");
} else {
    $mopidy_detected = detect_mopidy();
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
        debug_print("MPD Connection Failed","INIT");
        close_mpd($connection);
        askForMpdValues(get_int_text("setup_connectfail"));
        exit();
    } else if (array_key_exists('error', $mpd_status)) {
        debug_print("MPD Password Failed or other status failure","INIT");
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
if (array_key_exists('collection_type', $prefs)) {
    connect_to_database();
} else {
    probe_database();
    include("backends/sql/".$prefs['collection_type']."/specifics.php");
}
if ($mysqlc) {
    $prefs["apache_backend"] = "sql";
    $backend_in_use = "sql";
} else {
    $prefs["apache_backend"] = "xml";
    $backend_in_use = "xml";
}

savePrefs();

if ($prefs['apache_backend'] == 'sql') {
    list($result, $message) = check_sql_tables();
    if ($result == false) {
        sql_init_fail($message);
    }
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
<link rel="stylesheet" id="theme" type="text/css" />
<link rel="stylesheet" id="fontsize" type="text/css" />
<link rel="stylesheet" id="fontfamily" type="text/css" />
<link rel="stylesheet" id="icontheme-theme" type="text/css" />
<link rel="stylesheet" id="icontheme-adjustments" type="text/css" />
<link rel="stylesheet" id="albumcoversize" type="text/css" />
<!-- JQuery : http://jquery.com -->
<script type="text/javascript" src="jquery/jquery-1.8.3-min.js"></script>
<!-- JQuery AJAX form plugin : http://malsup.com/jquery/form/ -->
<script type="text/javascript" src="jquery/jquery.form.js"></script>
<!-- JQuery JSONP Plugin. My saviour : https://github.com/jaubourg/jquery-jsonp -->
<script type="text/javascript" src="jquery/jquery.jsonp-2.3.1.min.js"></script>
<!-- MD5 hashing algorith : http://pajhome.org.uk/crypt/md5 -->
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<!-- Masonry layout engine : http://masonry.desandro.com/ -->
<script type="text/javascript" src="jquery/masonry.pkgd.min.js"></script>
<script type="text/javascript" src="jquery/imagesloaded.pkgd.min.js"></script>
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

$("#theme").attr("href", "themes/"+prefs.theme);
$("#fontsize").attr("href", "sizes/"+prefs.fontsize);
$("#fontfamily").attr("href", "fonts/"+prefs.fontfamily);
$("#icontheme-theme").attr("href", "iconsets/"+prefs.icontheme+"/theme.css");
$("#icontheme-adjustments").attr("href", "iconsets/"+prefs.icontheme+"/adjustments.css");
$("#albumcoversize").attr("href", "coversizes/"+prefs.coversize);

function aADownloadFinished() {
    debug.log("INDEX","Album Art Download Has Finished");
}

var playlist = new Playlist();
var player = new multiProtocolController();
var lastfm = new LastFM(prefs.lastfm_user);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);
</script>

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

<script language="javascript">

$(window).ready(function(){

    // Update the old-style lastfm_session_key variable
    if (typeof lastfm_session_key !== 'undefined') {
        prefs.save({lastfm_session_key: lastfm_session_key});
    }

    if ("localStorage" in window && window["localStorage"] != null) {
        window.addEventListener("storage", onStorageChanged, false);
    }

    if (prefs.country_userset == false) {
        // Have to pull this data in via the webserver as it's cross-domain
        // It's helpful and important to get the country code set, as many users won't see it
        // and it's necessary for the Spotify info panel to return accurate data
        $.getJSON("utils/getgeoip.php", function(result){
            debug.shout("GET COUNTRY", 'Country:',result.country,'Code:',result.country_code);
            $("#lastfm_country_codeselector").val(result.country_code);
            prefs.save({lastfm_country_code: result.country_code});
        });
    }

    setClickHandlers();
    $("#sortable").click(onPlaylistClicked);
    infobar.createProgressBar();
    globalPlugins.initialise();
    layoutProcessor.initialise();
    browser.createButtons();
    setChooserButtons();
    if (!prefs.hide_radiolist) {
        $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
    }
    $(".toggle").click(togglePref);
    $(".saveotron").keyup(saveTextBoxes);
    $(".saveomatic").change(saveSelectBoxes);
    $(".savulon").click(toggleRadio);
    setPrefs();
    checkServerTimeOffset();
    layoutProcessor.sourceControl(prefs.chooser, setSearchLabelWidth);
    if (prefs.chooser == "searchpane") {
        ihatefirefox();
    }
});

$(window).load(function() {
    $(window).bind('resize', function() {
        layoutProcessor.adjustLayout();
    });
    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").show();
    }
    player.controller.initialise();
    showUpdateWindow();
    if (!prefs.hide_radiolist) {
        podcasts.loadList();
    }
    layoutProcessor.adjustLayout();
    $.get('utils/cleancache.php', function() {
        debug.shout("INIT","Cache Has Been Cleaned");
    });
    $('.combobox').makeTagMenu({textboxextraclass: 'searchterm', textboxname: 'tag', labelhtml: '<div class="fixed searchlabel"><b>'+language.gettext("label_tag")+'</b></div>', populatefunction: populateTagMenu});
    $('.tagaddbox').makeTagMenu({textboxname: 'newtags', populatefunction: populateTagMenu, buttontext: language.gettext('button_add'), buttonfunc: tagAdder.add});
});

</script>
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
</html>

