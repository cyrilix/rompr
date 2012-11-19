<?php
include("vars.php");
include("functions.php");
include("connection.php");
setswitches();
close_mpd($connection);
// session_start();
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
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
<script type="text/javascript" src="jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="jquery.scrollTo-1.4.3.1-min.js"></script>
<script type="text/javascript" src="shortcut.js"></script>
<script type="text/javascript" src="keycode.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="lfmdatafunctions.js"></script>
<script type="text/javascript" src="lastfmstation.js"></script>
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<script type="text/javascript" src="ba-debug.js"></script>
<script type="text/javascript" src="mpd.js"></script>
<script type="text/javascript" src="nowplaying.js"></script>
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
// debug.setLevel(0);
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";
var lastfm_session_key;
var lastfm_country_code = "United Kingdom";
var emptytrack = new Track({    creator: "",
                                album: "",
                                title: "",
                                duration: 0,
                                image: "images/album-unknown.png"
});
var emptylfmtrack = new lfmtrack("", "", null);
var emptylfmalbum = new lfmalbum("", "", null);
var emptylfmartist = new lfmartist("", null);
var mpd = new mpdController();
var playlist = new Playlist();
var nowplaying = new playInfo();
var infobar = new infoBar();
var lfmprovider = new lastFMprovider();
var gotNeighbours = false;
var gotFriends = false;
var sourceshidden = false;
var playlisthidden = false;
// var resizeTimer;
<?php
 print "var scrobblepercent = ".$prefs['scrobblepercent'].";\n";
 print "var sourceswidthpercent = ".$prefs['sourceswidthpercent'].";\n";
 print "var playlistwidthpercent = ".$prefs['playlistwidthpercent'].";\n";
 print "var max_history_length = ".$prefs["historylength"].";\n";;
 print "var lastfm = new LastFM('".$prefs["lastfm_user"]."');\n";
 print "var browser = new Info('infopane', '".$prefs["infosource"]."');\n";
 print "var shownupdatewindow = ".$prefs['shownupdatewindow'].";\n";
?>
$(document).ready(function(){
    setBottomPaneSize();
    $("#collection").html('<div class="dirname"><h2 id="loadinglabel"></h2></div>');
    $("#filecollection").html('<div class="dirname"><h2 id="loadinglabel2"></h2></div>');
    $("#loadinglabel3").effect('pulsate', { times:100 }, 2000);
    $("#progress").progressbar();
    $("#progress").click(function(evt) { infobar.seek(evt) });
    $("#volume").slider();
    $("#volume").slider("option", "orientation", "vertical");
    $("#volume" ).slider({
        stop: function(event, ui) { infobar.setvolume(event) }
    });
    $('#infocontrols').load("infocontrols.php", function() { 
<?php
    if ($prefs['hidebrowser'] == 'true') {
        print "    browser.hide();\n";
    } else {
        print "    doThatFunkyThang()\n";
    }
    if ($prefs['sourceshidden'] == 'true' && $prefs['playlisthidden'] == 'true') {
        print "    expandInfo('both');\n";
    } else {
        if ($prefs['sourceshidden'] == 'true') {
            print "    expandInfo('left');\n";
        }
        if ($prefs['playlisthidden'] == 'true') {
            print "    expandInfo('right');\n";
        }
    }
?>
    });
    $('#albumcontrols').load("albumcontrols.php", function() { 
        debug.log("Album Controls Loaded");
        reloadPlaylistControls();
        $("#sourcesresizer").draggable({
            containment: '#headerbar',
            axis: 'x'
        });
        $("#sourcesresizer").bind("drag", function(event, ui){
            var size = getWindowSize();
            if (ui.offset.left < 120) { ui.offset.left = 120; }
            sourceswidthpercent = ((ui.offset.left+8)/size.x)*100;
            doThatFunkyThang();
            $(this).data('draggable').position.left = 0;
        });
        $("#sourcesresizer").bind("dragstop", function(event, ui){
            savePrefs({sourceswidthpercent: sourceswidthpercent.toString()})
        });
    });
    $("#lastfmlist").load("lastfmchooser.php");
    $("#bbclist").load("bbcradio.php");
    $("#somafmlist").load("somafm.php");
    $("#yourradiolist").load("yourradio.php");
    $("#icecastlist").load("getIcecast.php");
    mpd.command("",playlist.repopulate);
    loadKeyBindings();
    if (!shownupdatewindow) {
        var fnarkle = popupWindow.create(500,300,"fnarkle",true,"Information About This Version");
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        $("#fnarkler").append('<p>Thanks for installing this version of RompR. If you used a previous version there is a change in this version that I wanted to let you know about.</p>');
        $("#fnarkler").append('<p>To add tracks and albums to the playlist you must now <i>Double Click</i>. A single-click will <i>select</i> things so that they can be dragged to the playlist.</p>');
        $("#fnarkler").append('<p>The Basic RompR Manual is at: <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">https://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p>The Discussion Forum is at: <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">https://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p><button style="width:8em" class="tright topformbutton" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        shownupdatewindow = true;
        savePrefs({shownupdatewindow: shownupdatewindow.toString()});
    }
    $(window).bind('resize', function() {
        //clearTimeout(resizeTimer);
        //resizeTimer = setTimeout(setBottomPaneSize, 100);
        setBottomPaneSize();
    });
});

</script>
</head>
<body>

<div id="infobar">
    <div id="leftholder" class="infobarlayout tleft bordered">
        <div id="buttons">
            <a href="#" title="Previous Track" onclick="playlist.previous()" class="controlbutton"><img src="images/media-skip-backward.png"></a>
            <a href="#" title="Play/Pause" onclick="infobar.playbutton.clicked()" id="playbutton" class="controlbutton"><img id="playbuttonimg" src="images/media-playback-pause.png"></a>
            <a href="#" title="Stop" onclick="playlist.stop()" class="controlbutton"><img src="images/media-playback-stop.png"></a>
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
    <div style="padding-left:12px">
    <a href="#" title="Search Music" onclick="toggleSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="search" class="invisible searchbox">
    </div>
    <div id="collection" class="noborder"></div>    
    </div>

    <?php
    if ($prefs['chooser'] == "filelist") {
        print '<div id="filelist">'."\n";
    } else {
        print '<div id="filelist" class="invisible">'."\n";
    }
    ?>
    <div style="padding-left:12px">
    <a href="#" title="Search Files" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="filesearch" class="invisible searchbox">
    </div>
    <div id="filecollection" class="noborder"></div>   
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
    if ($prefs['chooser'] == "radiolist") {
        print '<div id="radiolist">'."\n";
    } else {
        print '<div id="radiolist" class="invisible">'."\n";
    }
    ?>
    <ul class="sourcenav">
        <li>
            <table><tr>
                <td><a name="yourradiolist" style="padding-left:0px" href="#" onclick="doMenu(event, 'yourradiolist')"><img src="images/toggle-closed.png"></a></td>
                <td><img src="images/broadcast.png" height="28px"></td><td><h3>Your Radio Stations</h3></td>
            </tr></table>
        </li>
        <li>
            <div id="yourradiolist" name="yourradiolist" class="invisible"></div>
        </li>
        <li>
            <table><tr>
                <td><a name="somafmlist" style="padding-left:0px" href="#" onclick="doMenu(event, 'somafmlist')"><img src="images/toggle-closed.png"></a></td>
                <td><img src="images/somafm.png" height="24px"></td>
            </tr></table>
        </li>
        <li>
            <div id="somafmlist" name="somafmlist" class="invisible"></div>
        </li>
        <li>
            <table><tr>
                <td><a name="bbclist" style="padding-left:0px" href="#" onclick="doMenu(event, 'bbclist')"><img src="images/toggle-closed.png"></a></td>
                <td><img src="images/bbcr.png" height="32px"></td><td><h3>Live BBC Radio</h3></td>
            </tr></table>
        </li>
        <li>
            <div id="bbclist" name="bbclist" class="invisible"></div>
        </li>
        <li>
            <table><tr>
                <td><a name="icecastlist" style="padding-left:0px" href="#" onclick="doMenu(event, 'icecastlist')"><img src="images/toggle-closed.png"></a></td>
                <td><img src="images/icecast.png" height="32px"></td><td><h3>Icecast Radio</h3></td>
            </tr></table>
        </li>
        <li>
            <div id="icecastlist" name="icecastlist" class="invisible">
                <div class="dirname">
                    <h2 id="loadinglabel3">Loading Stations...</h2>
                </div>
            </div>
        </li>
    </ul>

</div>
</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<div id="artistinformation" class="infotext"><h2 align="center">This is the information panel. Interesting stuff will appear here when you play some music</h2></div>
<div id="albuminformation" class="infotext"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
<ul id="sortable"></ul>
</div>

</div>

</body>
</html>
