<?php
include("vars.php");
include("functions.php");
include("connection.php");
setswitches();
close_mpd($connection);
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
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="jquery.scrollTo-1.4.3.1-min.js"></script>
<script type="text/javascript" src="shortcut.js"></script>
<script type="text/javascript" src="keycode.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="clickfunctions.js"></script>
<script type="text/javascript" src="lastfmstation.js"></script>
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<script type="text/javascript" src="ba-debug.js"></script>
<script type="text/javascript" src="mpd.js"></script>
<script type="text/javascript" src="nowplaying.js"></script>
<script type="text/javascript" src="infobar2.js"></script>
<script type="text/javascript" src="lastfm.js"></script>
<script type="text/javascript" src="playlist.js"></script>
<script type="text/javascript" src="info.js"></script>
<script type="text/javascript" src="coverscraper.js"></script>

<?php
if (file_exists("prefs/prefs.js")) {
    print '<script type="text/javascript" src="prefs/prefs.js"></script>'."\n";
}
?>
<script language="javascript">
// debug.setLevel(0);
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";
var lastfm_session_key;
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
var emptytrack = {  creator: "",
                    album: "",
                    title: "",
                    duration: 0,
                    image: "images/album-unknown.png"
};
var mpd = new mpdController();
var playlist = new Playlist();
var nowplaying = new playInfo();
var lfmprovider = new lastFMprovider();
var gotNeighbours = false;
var gotFriends = false;
var gotTopTags = false;
var gotTopArtists = false;
var progresstimer = null;
var prefsbuttons = ["images/button-off.png", "images/button-on.png"];
var prefsInLocalStorage = ["hidebrowser", "sourceshidden", "playlisthidden", "infosource", "playlistcontrolsvisible",
                            "sourceswidthpercent", "playlistwidthpercent", "downloadart", "clickmode", "chooser",
                            "hide_albumlist", "hide_filelist", "hide_lastfmlist", "hide_radiolist"];

function aADownloadFinished() {
    /* We need one of these in global scope so coverscraper works here
    */
    debug.log("Album Art Download Has Finished");
}

 
var prefs = function() {

    var useLocal = false;
    if ("localStorage" in window && window["localStorage"] != null) {
        useLocal = true;
    }
    
    return {
<?php
 foreach ($prefs as $index => $value) {
    if ($value == "true" || $value == "false" || is_numeric($value)) {
        print "        ".$index.": ".$value.",\n";
    } else {
        print "        ".$index.": '".$value."',\n";
    }
}
?>
        updateLocal: function() {
            if (useLocal) {
                prefsInLocalStorage.forEach(function(p) {
//                     debug.log("Checking Pref",p,localStorage.getItem("prefs."+p));
                    if (localStorage.getItem("prefs."+p) != null && localStorage.getItem("prefs."+p) != "") {
                        prefs[p] = localStorage.getItem("prefs."+p);
                        if (prefs[p] == "false") {
                            prefs[p] = false;
                        }
                        if (prefs[p] == "true") {
                            prefs[p] = true;
                        }
                        debug.log("Using Local Value for",p,prefs[p],localStorage.getItem("prefs."+p));
                    }
                });
            }    
        },
        
        save: function(options) {
            var prefsToSave = {};
            var postSave = false;
            for (var i in options) {
                prefs[i] = options[i];
                if (options[i] === true || options[i] === false) {
                    options[i] = options[i].toString();
                }
                if (useLocal) {
                    if (prefsInLocalStorage.indexOf(i) > -1) {
                        debug.log("Save Pref Locally:",i,options[i],prefs[i]);
                        localStorage.setItem("prefs."+i, options[i]);
                    } else {
                        prefsToSave[i] = options[i];
                        postSave = true;
                    }
                } else {
                    prefsToSave[i] = options[i];
                    postSave = true;
                }
            }
            if (postSave) {
                debug.log("Saving prefs to server",prefsToSave);
                $.post('saveprefs.php', prefsToSave);
            }
        }
        
    }
}();

prefs.updateLocal();
var lastfm = new LastFM(prefs.lastfm_user);
var browser = new Info('infopane', prefs.infosource);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);

$(document).ready(function(){
    // Check to see if HTML5 local storage is supported - we use this for communication between the
    // album art manager and the albums list
    if ("localStorage" in window && window["localStorage"] != null) {
        window.addEventListener("storage", onStorageChanged, false);
    }
        
    setClickHandlers();
    $("#sortable").click(onPlaylistClicked);

    setDraggable('collection');
    setDraggable('filecollection');
    setDraggable('search');
    setDraggable('filesearch');
    
    $("#sortable").disableSelection();
    $("#sortable").sortable({ 
        items: ".sortable",
        axis: 'y', 
        containment: '#sortable', 
        scroll: 'true', 
        scrollSpeed: 10,
        tolerance: 'pointer',
        start: function(event, ui) { 
            ui.item.css("background", "#555555"); 
            ui.item.css("opacity", "0.7") 
        },
        stop: playlist.dragstopped
    });
    
    $("#yourradiolist").sortable({
        items: ".clickradio",
        axis: "y",
        containment: "#yourradiolist",
        scroll: 'true',
        scrollSpeed: 10,
        tolerance: 'pointer',
        stop: saveRadioOrder
    });
    
    setBottomPaneSize();
    $("#loadinglabel3").effect('pulsate', { times:100 }, 2000);
    $("#progress").progressbar();
    $("#progress").click( infobar.seek );
    $("#volume").slider();
    $("#volume").slider({
        orientation: 'vertical',
        value: prefs.volume,
        stop: infobar.setvolume,
        slide: infobar.volumemoved
    });
    
    $("#headerbar").load('headerbar.php', function() {
        $("#sourcesresizer").draggable({
            containment: '#headerbar',
            axis: 'x'
        });
        $("#sourcesresizer").bind("drag", srDrag);
        $("#sourcesresizer").bind("dragstop", srDragStop);
        $("#playlistresizer").draggable({   
            containment: 'headerbar',
            axis: 'x'
        });
        $("#playlistresizer").bind("drag", prDrag);
        $("#playlistresizer").bind("dragstop", prDragStop);
        reloadPlaylists();
        doThatFunkyThang();
        //$("ul.topnav li a").unbind('click');
        $("ul.topnav li a").click(function() {
            $(this).parent().find("ul.subnav").slideToggle('fast');
            return false;
        });
        var s = ["albumlist", "filelist", "lastfmlist", "radiolist"];
        for (var i in s) {
            if (prefs["hide_"+s[i]]) {
                $("#choose_"+s[i]).fadeOut('fast');
            }
        }
    });
    sourcecontrol(prefs.chooser);
    $("#lastfmlist").load("lastfmchooser.php");
    $("#bbclist").load("bbcradio.php");
    $("#somafmlist").load("somafm.php");
    $("#yourradiolist").load("yourradio.php");
    $("#icecastlist").load("getIcecast.php");
<?php
if ($prefs['updateeverytime'] == "true" ||
        !file_exists($ALBUMSLIST) ||
        !file_exists($FILESLIST)) 
{
    // debug_print("Rebuilding Music Cache");
    print "updateCollection('update');\n";
} else {
    // debug_print("Loading Music Cache");
    print "prepareForLiftOff()\n";
    print "loadCollection('".$ALBUMSLIST."', '".$FILESLIST."');\n";
}
?>
    loadKeyBindings();
    if (!prefs.shownupdatewindow) {
        var fnarkle = popupWindow.create(500,300,"fnarkle",true,"Information About This Version");
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        $("#fnarkler").append('<p>The Basic RompR Manual is at: <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p>The Discussion Forum is at: <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p><button style="width:8em" class="tright topformbutton" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: true});
    }
    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").slideToggle('fast');
    }
    mpd.command("",playlist.repopulate);
    $(window).bind('resize', function() {
        setBottomPaneSize();
    });

});

</script>
</head>
<body>

<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
            <img title="Previous Track" class="clickicon controlbutton" onclick="playlist.previous()" src="images/media-skip-backward.png">
            <img title="Play/Pause" class="shiftleft clickicon controlbutton" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="images/media-playback-pause.png">
            <img title="Stop" class="shiftleft2 clickicon controlbutton" onclick="playlist.stop()" src="images/media-playback-stop.png">
            <img title="Stop After Current Track" class="shiftleft3 clickicon controlbutton" onclick="playlist.stopafter()" id="stopafterbutton" src="images/stopafter.png">
            <img title="Next Track" class="shiftleft4 clickicon controlbutton" onclick="playlist.next()" src="images/media-skip-forward.png">
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
            0:00 of 0:00
        </div>
    </div>

    <div class="infobarlayout tleft bordered">
        <div id="volumecontrol">
            <div id="volume">
            </div>
        </div>
    </div>

    <div class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" src="images/album-unknown.png" />
        </div>
        <div id="nowplaying"></div>
        <div id="lastfm" class="infobarlayout invisible">
            <div><ul class="topnav"><a title="Love this track" id="love" href="#" onclick="infobar.love()"><img height="24px" src="images/lastfm-love.png"></a></ul></div>
            <div><ul class="topnav"><a title="Ban this track" id="ban" href="#" onclick="nowplaying.ban()"><img height="24px" src="images/lastfm-ban.png"></a></ul></div>
        </div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">
</div>

<div id="bottompage">

<div id="sources" class="tleft column noborder">

    <div id="albumlist" class="invisible noborder">
    <div style="padding-left:12px">
    <a title="Search Music" href="#" onclick="toggleSearch()"><img class="topimg clickicon" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="search" class="invisible searchbox"></div>
    <div id="collection" class="noborder"></div>    
    </div>

    <div id="filelist" class="invisible">
    <div style="padding-left:12px">
    <a title="Search Files" href="#" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="filesearch" class="invisible searchbox">
    </div>
    <div id="filecollection" class="noborder"></div>   
    </div>

    <div id="lastfmlist" class="invisible">
    </div>

    <div id="radiolist" class="invisible">
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="yourradiolist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/broadcast-32.png"></div>
        <div class="expand">Your Radio Stations</div>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="somafmlist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/somafm.png"></div>
        <div class="expand">Soma FM</div>
    </div>
    <div id="somafmlist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="bbclist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/bbcr.png"></div>
        <div class="expand">Live BBC Radio</div>
    </div>
    <div id="bbclist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="icecastlist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/icecast.png"></div>
        <div class="expand">Icecast Radio</div>
    </div>
    <div id="icecastlist" class="dropmenu">
        <div class="dirname">
            <h2 id="loadinglabel3">Loading Stations...</h2>
        </div>
    </div>
    
</div>
</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<div id="nowplayingstuff" class="infotext"></div>
<div id="artistinformation" class="infotext"><h2 align="center">This is the information panel. Interesting stuff will appear here when you play some music</h2></div>
<div id="albuminformation" class="infotext"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
    <div style="padding-left:12px">
    <a title="Playlist Controls" href="#" onclick="togglePlaylistButtons()"><img class="topimg clickicon" height="20px" src="images/pushbutton.png"></a>
    </div>
        <div id="playlistbuttons" class="invisible searchbox">
        <table width="90%" align="center">
        <tr>
        <td align="right">SHUFFLE</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['random']].'" id="random" onclick="toggleoption(\'random\')" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        $c = ($prefs['crossfade'] == 0) ? 0 : 1;
        print '<img src="'.$prefsbuttons[$c].'" id="crossfade" onclick="toggleoption(\'crossfade\')" class="togglebutton clickicon" />';
?>
        </td>
        <td align="left">CROSSFADE</td>
        </tr>
        <tr>
        <td align="right">REPEAT</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['repeat']].'" id="repeat" onclick="toggleoption(\'repeat\')" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['consume']].'" id="consume" onclick="toggleoption(\'consume\')" class="togglebutton clickicon" />';
?>
        </td><td align="left">CONSUME</td>
        </tr>
        </table>
    </div>

<div id="sortable" class="noselection fullwidth"><div>
</div>

</div>

</body>
</html>
