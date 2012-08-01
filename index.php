<?php
include("vars.php");
include("functions.php");
include("connection.php");
setswitches();
close_mpd($connection);
session_start();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="stylesheet" type="text/css" href="layout.css" />
<?php
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<link rel="shortcut icon" href="images/favicon.ico" />
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.22.custom.css" rel="stylesheet" />
<script type="text/javascript" src="jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.22.custom.min.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="shortcut.js"></script>
<script type="text/javascript" src="keycode.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="lfmdatafunctions.js"></script>
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<script type="text/javascript" src="ba-debug.js"></script>
<script type="text/javascript" src="infobar.js"></script>
<script type="text/javascript" src="lastfm.js"></script>
<script type="text/javascript" src="playlist.js"></script>
<script type="text/javascript" src="info.js"></script>

<?php
if (file_exists("prefs/prefs.js")) {
    print '<script type="text/javascript" src="prefs/prefs.js"></script>'."\n";
}
?>
<script language="javascript">
//debug.setLevel(0);
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";
var lastfm_session_key;
var lastfm_country_code = "United Kingdom";
var playlist = new Playlist();
var infobar = new infoBar();
var gotNeighbours = false;
var gotFriends = false;
var sourceshidden = false;
var playlisthidden = false;
<?php
 print "var scrobblepercent = ".$prefs['scrobblepercent'].";\n";
 print "var lastfm = new LastFM('".$prefs["lastfm_user"]."');\n";
 print "var browser = new Info('infopane', '".$prefs["infosource"]."');\n";
?>
$(document).ready(function(){
    //debug.log("Index ready");
    $("#loadinglabel2").effect('pulsate', { times:100 }, 2000);
    $("#progress").progressbar();
    $("#progress").click(function(evt) { infobar.seek(evt) });
    $("#volume").slider();
    $("#volume").slider("option", "orientation", "vertical");
    $("#volume" ).slider({
        stop: function(event, ui) { infobar.setvolume(event) }
    });
    $('#infocontrols').load("infocontrols.php");
    lastfm.revealloveban();
    $('#albumcontrols').load("albumcontrols.php");
    $('#icecastlist').load("getIcecast.php");
    $("#filelist").load("dirbrowser.php");
    $("#lastfmlist").load("lastfmchooser.php");
    $("#bbclist").load("bbcradio.php");
    $("#somafmlist").load("somafm.php");

    infobar.command("",playlist.repopulate);
    loadKeyBindings();
    reloadPlaylistControls();
<?php
    if ($prefs['hidebrowser'] == 'true') {
        print "    browser.hide();\n";
    }
?>
});

</script>
</head>
<body>

<div id="infobar">
<table cellpadding="0" cellspacing="0"><tr><td>
    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="buttons">
            <a href="#" title="Previous Track" onclick="playlist.previous()" class="controlbutton"><img src="images/media-skip-backward.png"></a>
            <a href="#" title="Play/Pause" id="playbutton" class="controlbutton"><img id="playbuttonimg" src="images/media-playback-pause.png"></a>
            <a href="#" title="Stop" onclick="infobar.command('command=stop')" class="controlbutton"><img src="images/media-playback-stop.png"></a>
            <a href="#" title="Next Track" onclick="playlist.next()" class="controlbutton"><img src="images/media-skip-forward.png"></a>
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
            0:00 of 0:00
        </div>
    </div>

    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="volumecontrol">
            <div id="volume">
            </div>
        </div>
    </div>

    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" src="images/album-unknown.png">
        </div>
        <div id="nowplaying"></div>
        <div id="lastfm" class="infobarlayout">
            <div><ul class="topnav"><a title="Love this track" id="love" href="javascript:infobar.love()"><img height="24px" src="images/lastfm-love.png"></a></ul></div>
            <div><ul class="topnav"><a title="Ban this track" id="ban" href="javascript:lastfm.track.ban()"><img height="24px" src="images/lastfm-ban.png"></a></ul></div>
        </div>
    </div>
</td></tr></table>
</div>

<div id="headerbar">
<div id="albumcontrols" class="tleft column noborder">
</div>
<div id="infocontrols" class="tleft cmiddle noborder">
</div>
<div id="pcholder" class="tright column noborder">
<div id="playlistcontrols" class="noborder">
</div>
</div>
</div>

<div id="bottompage">

<div id="sources" class="tleft column noborder">

    <?php
    if ($prefs['chooser'] == "albumlist") {
        print '<div id="albumlist" class="noborder">'."\n";
    } else {
        print '<div id="albumlist" class="invisible noborder">'."\n";
    }
    ?>
        <div class="dirname">
            <h2 id="loadinglabel"></h2>
        </div>
    </div>

    <?php
    if ($prefs['chooser'] == "filelist") {
        print '<div id="filelist">'."\n";
    } else {
        print '<div id="filelist" class="invisible">'."\n";
    }
    ?>
        <div class="dirname">
            <h2 id="loadinglabel2">Scanning Files...</h2>
        </div>
    </div>

    <?php
    if ($prefs['chooser'] == "lastfmlist") {
        print '<div id="lastfmlist">'."\n";
    } else {
        print '<div id="lastfmlist" class="invisible">'."\n";
    }
    ?>
    </div>

    <?php
    if ($prefs['chooser'] == "bbclist") {
        print '<div id="bbclist">'."\n";
    } else {
        print '<div id="bbclist" class="invisible">'."\n";
    }
    ?>
    </div>

    <?php
    if ($prefs['chooser'] == "icecastlist") {
        print '<div id="icecastlist">'."\n";
    } else {
        print '<div id="icecastlist" class="invisible">'."\n";
    }
    ?>
    </div>

    <?php
    if ($prefs['chooser'] == "somafmlist") {
        print '<div id="somafmlist">'."\n";
    } else {
        print '<div id="somafmlist" class="invisible">'."\n";
    }
    ?>
    </div>

</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<div id="artistinformation" class="infotext"><h1 align="center">This is the information panel. Interesting stuff will appear here when you play some music</h1></div>
<div id="albuminformation" class="infotext"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
<ul id="sortable"></ul>
</div>

</div>

<div id="logindialog" title="Last.FM Login">
<p>A popup window will now open (your browser may block it). Follow the instructions in that window to give RompR
permission to access your Last.FM account. When you've done that, click the OK button</p>
</div>

<script language="javascript">
$(function() {
    $("#logindialog").dialog({autoOpen: false, buttons: {"OK": function() { lastfm.finishlogin(); $(this).dialog("close") } } });
});
</script>

</body>
</html>
