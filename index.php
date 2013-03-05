<?php
include("vars.php");
if (array_key_exists('mpd_host', $_POST)) {
    $prefs['mpd_host'] = $_POST['mpd_host'];
    $prefs['mpd_port'] = $_POST['mpd_port'];
    savePrefs();
}
include 'Mobile_Detect.php';
if (array_key_exists('mobile', $_REQUEST)) {
    $mobile = $_REQUEST['mobile'];
    debug_print("Request asked for mobile mode: ".$mobile);
} else {
    $detect = new Mobile_Detect();
    if ($detect->isMobile() && !$detect->isTablet()) {
        debug_print("Mobile Browser Detected!");
        $mobile = "phone";
    } else {
        debug_print("Not a mobile browser");
        $mobile = "no";
    }
}
include("functions.php");
include("connection.php");
if (!$is_connected) {
    debug_print("MPD Connection Failed");
    askForMpdValues();
    exit();
}
setswitches();
close_mpd($connection);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<?php 
//if ($mobile != "no") {
    print '<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />'."\n";
    print '<meta name="apple-mobile-web-app-capable" content="yes" />'."\n";
//}
?>
<link rel="stylesheet" type="text/css" href="layout.css" />
<link rel="shortcut icon" href="images/favicon.ico" />
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
<?php
if ($mobile != "no") {
print '<link rel="stylesheet" type="text/css" href="layout_mobile.css" />'."\n";
}
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="jquery.scrollTo-1.4.3.1-min.js"></script>
<?php
if ($mobile != "no") {
    print '<script type="text/javascript" src="jquery.touchwipe.min.js"></script>'."\n";
}
?>
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
<?php
if (file_exists($ALBUMSLIST)) {
    print "var albumslistexists = true\n";
} else {
    print "var albumslistexists = false\n";
}
if (file_exists($FILESLIST)) {
    print "var fileslistexists = true\n";
} else {
    print "var fileslistexists = false\n";
}
print "var mobile = '".$mobile."';\n";
?>
var landscape = false;
var itisbigger = false;
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
                            "hide_albumlist", "hide_filelist", "hide_lastfmlist", "hide_radiolist", "twocolumnsinlandscape",
                            "shownupdatewindow"];

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
    if ($index == 'clickmode' && $mobile != "no") {
        $value = 'single';
    }
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

    if (mobile == "no") {
        setDraggable('collection');
        setDraggable('filecollection');
        setDraggable('search');
        setDraggable('filesearch');
    }
    
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
    
    $("#loadinglabel3").effect('pulsate', { times:100 }, 2000);
    $("#progress").progressbar();
    $("#progress").click( infobar.seek );
    if (mobile == "no") {
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
        loadKeyBindings();
    } else {
        $("#headerbar").load('headerbar_phone.php');
        $("#scrobwrangler").progressbar();
        $("#scrobwrangler").progressbar("option", "value", parseInt(prefs.scrobblepercent.toString()));
        $("#scrobwrangler").click( setscrob );
        $("#scrobbling").attr("checked", prefs.lastfm_scrobbling);
        $("#radioscrobbling").attr("checked", prefs.dontscrobbleradio);
        $("#autocorrect").attr("checked", prefs.lastfm_autocorrect);
        $("#twocolumnsinlandscape").attr("checked", prefs.twocolumnsinlandscape);
        $("#updateeverytime").attr("checked", prefs.updateeverytime);
        $("#downloadart").attr("checked", prefs.downloadart);
        $("#fullbiobydefault").attr("checked", prefs.fullbiobydefault);
        $("#themeselector").val(prefs.theme);
        $("#countryselector").val(prefs.lastfm_country_code);
        $("#button_hide_albumlist").attr("checked", prefs.hide_albumlist);
        $("#button_hide_filelist").attr("checked", prefs.hide_filelist);
        $("#button_hide_lastfmlist").attr("checked", prefs.hide_lastfmlist);
        $("#button_hide_radiolist").attr("checked", prefs.hide_radiolist);
        $("#hideinfobutton").attr("checked", prefs.hidebrowser);
        if (prefs.hidebrowser) {
            $(".penbehindtheear").fadeOut('fast');
        }
        reloadPlaylists();
        var s = ["albumlist", "filelist", "lastfmlist", "radiolist"];
        for (var i in s) {
            if (prefs["hide_"+s[i]]) {
                $("#choose_"+s[i]).fadeOut('fast');
            }
        }
    }

    if (!prefs.hide_lastfmlist) {
        $("#lastfmlist").load("lastfmchooser.php");
    }
    if (!prefs.hide_radiolist) {
        $("#bbclist").load("bbcradio.php");
        $("#somafmlist").load("somafm.php");
        $("#yourradiolist").load("yourradio.php");
        if (mobile == "no") {
            $("#icecastlist").load("getIcecast.php");
        }
    }
    checkCollection();
    sourcecontrol(prefs.chooser);
    if (prefs.shownupdatewindow === true || prefs.shownupdatewindow < 0.30) {
        var fnarkle = popupWindow.create(500,600,"fnarkle",true,"Information About This Version");
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        if (mobile != "no") {
            $("#fnarkler").addClass('tiny');
        }
        $("#fnarkler").append('<p>Welcome to RompR version 0.30</p>');
        if (mobile != "no") {
            $("#fnarkler").append('<p>You are viewing the mobile version of RompR. To view the standard version go to <a href="/rompr/index.php?mobile=no">/rompr/index.php?mobile=no</a></p>');
        } else {
            $("#fnarkler").append('<p>To view the mobile version go to <a href="/rompr/index.php?mobile=phone">/rompr/index.php?mobile=phone</a></p>');            
        }
        $("#fnarkler").append('<p>The Basic RompR Manual is at: <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p>The Discussion Forum is at: <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: 0.30});
    }
    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").slideToggle('fast');
    }
    mpd.command("",playlist.repopulate);
    if (mobile == "no") {
        setBottomPaneSize();
    } else {
        setTimeout(setBottomPaneSize, 2000);
    }
    $(window).bind('resize', function() {
        setBottomPaneSize();
    });
    if (mobile != "no") {
        $(window).touchwipe({
            wipeLeft: function() { swipeyswipe(1); },
            wipeRight: function() { swipeyswipe(-1) },
            min_move_x: 240,
            min_move_y: 1000,
            preventDefaultEvents: false
        });
    }

});

</script>
</head>

<?php

if ($mobile == "no") {
    include('layout_normal.php');
} else if ($mobile == "phone") {
    include('layout_phone.php');
}

?>
</html>
