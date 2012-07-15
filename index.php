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
<?php
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<link rel="shortcut icon" href="images/favicon.ico" />
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.16.custom.css" rel="stylesheet" /> 
<script type="text/javascript" src="jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.16.custom.min.js"></script>
<script type="text/javascript" src="shortcut.js"></script>
<script type="text/javascript" src="keycode.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
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
var keybpu;
<?php
 print "var scrobblepercent = ".$prefs['scrobblepercent'].";\n";
 print "var lastfm = new LastFM('".$prefs["lastfm_user"]."');\n";
?>
var browser = new Info("infopane", "lastfm");

$(document).ready(function(){
    //debug.log("Index ready");
    $("#progress").progressbar();
    $("#progress").click(function(evt) { infobar.seek(evt) });
    playlist.repopulate();
    lastfm.revealloveban();
    reloadPlaylistControls();
    $('#albumcontrols').load("albumcontrols.php");
    $('#infocontrols').load("infocontrols.php");
    $('#icecastlist').load("getIcecast.php");
    infobar.update();
    loadKeyBindings();
});  

</script>
</head>
<body>

<div id="infobar">
<table cellpadding="0" cellspacing="0"><tr><td>
    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="buttons">
            <a href="#" title="Previous Track" onclick="infobar.command('command=previous')" class="controlbutton"><img src="images/media-skip-backward.png"></a>
            <a href="#" title="Play/Pause" id="playbutton" class="controlbutton"><img id="playbuttonimg" src="images/media-playback-pause.png"></a>
            <a href="#" title="Stop" onclick="infobar.command('command=stop')" class="controlbutton"><img src="images/media-playback-stop.png"></a>
            <a href="#" title="Next Track" onclick="infobar.command('command=next')" class="controlbutton"><img src="images/media-skip-forward.png"></a>
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
            0:00 of 0:00
        </div>
    </div>
    
    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" src="images/album-unknown.png">
        </div>
        <div id="nowplaying"></div>
        <div id="lastfm" class="infobarlayout">
            <div><ul class="topnav"><a id="love" href="javascript:lastfm.track.love()"><img src="images/lastfm-love.png"></a></ul></div>
            <div><ul class="topnav"><a id="ban" href="javascript:lastfm.track.ban()"><img src="images/lastfm-ban.png"></a></ul></div>
        </div>
    </div>
</td></tr></table>
</div>

<div id="headerbar">
<div id="albumcontrols" class="tleft column noborder">
</div>
<div id="infocontrols" class="tleft cmiddle noborder">
</div>
<div class="tright column noborder">
<div id="playlistcontrols" class="noborder">
</div>
</div>
</div>

<div id="bottompage">

<div id="sources" class="tleft column noborder">

<div id="albumlist" class="noborder">
</div>
<div id="filelist" class="invisible">
</div>
<div id="lastfmlist" class="invisible">
<ul class="sourcenav">
    <li><h3>Last.FM Personal Radio</h3></li>
    <li><a href="#" onclick="doLastFM('lastfmuser', lastfm.username())">Library Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmmix', lastfm.username())">Mix Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmrecommended', lastfm.username())">Recommended Radio</a></li>
    <li><a href="#" onclick="doLastFM('lastfmneighbours', lastfm.username())">Neighbourhood Radio</a></li><br>
    <li><b>Last.FM Artist Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmartist" type="text" size="60"/>
        <button class="sourceform" onclick="doLastFM('lastfmartist')">Play</button>
    </li>
    <li><b>Last.FM Artist Fan Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmfan" type="text" size="60"/>
        <button class="sourceform" onclick="doLastFM('lastfmfan')">Play</button>
    </li>
    <li><b>Last.FM Global Tag Radio</b></li>
    <li>
        <input class="sourceform" id="lastfmglobaltag" type="text" size="60"/>
        <button class="sourceform" onclick="doLastFM('lastfmglobaltag')">Play</button>
    </li>
    <li>
        <a name="friends" style="padding-left:0px" class="toggle" href="#" onclick="getFriends()">+</a><b>Friends</b></li>
        <div id="albummenu" name="friends"></div>
    </li>    
    <li>
        <a name="neighbours" style="padding-left:0px" class="toggle" href="#" onclick="getNeighbours()">+</a><b>Neighbours</b></li>
        <div id="albummenu" name="neighbours"></div>
    </li>
</ul>
</div>
<div id="bbclist" class="invisible">
<ul class="sourcenav">
<li><h3>Live BBC Radio</h3></li>
<?php
$x = simplexml_load_file("resources/bbcradio.xml");
foreach($x->stations->station as $i => $station) {
    print '<li><a href="#" onclick="doASXStream(\''.$station->playlist.'\', \''.$station->image.'\')">'.$station->name.'</a></li>';
}
?>
</ul>
</div>
<div id="icecastlist" class="invisible"></div>
<div id="somafmlist" class="invisible">
<ul class="sourcenav">
<li><img src="images/somafm.png" width="128px"></li>
<li><a href="http://somafm.com" target="_blank">Please donate to soma fm to keep this service alive!</a></li>
<?php
$x = simplexml_load_file("resources/somafm.xml");
foreach($x->stations->station as $i => $station) {
    print '<li><table cellspacing="8"><tr><td colspan="2"><h3>'.$station->name.'</h3></td></tr>';
    print '<tr><td><img src="'.$station->image.'" height="72px"></td>';
    print '<td>'.$station->description.'</td></tr><tr><td colspan="2">';
    foreach($station->link as $j => $link) {
        $pl = $link->desc;
        $pl = preg_replace('/ /', '&nbsp;', $pl);
        print' <a class="tiny" href="#" onclick="doPLSStream(\''.$link->playlist.'\', \''.$station->image.'\', \''.$station->name.'\')">'.$pl.'</a>';
    }
    print '</td></tr></table></li>'."\n";
}
?>
</ul>
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
