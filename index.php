<?php
include("vars.php");
debug_print("");
debug_print("=================****==================","STARTING UP");
debug_print($_SERVER['SCRIPT_FILENAME'],"STARTING UP");
if (array_key_exists('mpd_host', $_POST)) {
    $prefs['mpd_host'] = $_POST['mpd_host'];
    $prefs['mpd_port'] = $_POST['mpd_port'];
    $prefs['mpd_password'] = $_POST['mpd_password'];
    $prefs['unix_socket'] = $_POST['unix_socket'];

    if (array_key_exists('use_mopidy_tagcache', $_POST)) {
        $prefs['use_mopidy_tagcache'] = 1;
        $prefs['updateeverytime'] = "false";
    } else {
        $prefs['use_mopidy_tagcache'] = 0;
    }
    if (array_key_exists('use_mopidy_http', $_POST)) {
        $prefs['use_mopidy_http'] = 1;
    } else {
        $prefs['use_mopidy_http'] = 0;
    }
    if (array_key_exists('use_mopidy_file_backend', $_POST)) {
        $prefs['use_mopidy_file_backend'] = $_POST['use_mopidy_file_backend'];
    } else {
        $prefs['use_mopidy_file_backend'] = "false";
    }
    if (array_key_exists('use_mopidy_beets_backend', $_POST)) {
        $prefs['use_mopidy_beets_backend'] = $_POST['use_mopidy_beets_backend'];
    } else {
        $prefs['use_mopidy_beets_backend'] = "false";
    }
    if (array_key_exists('sortbydate', $_POST)) {
        $prefs['sortbydate'] = $_POST['sortbydate'];
    } else {
        $prefs['sortbydate'] = "false";
    }
    if (array_key_exists('notvabydate', $_POST)) {
        $prefs['notvabydate'] = $_POST['notvabydate'];
    } else {
        $prefs['notvabydate'] = "false";
    }

    savePrefs();
}

include 'Mobile_Detect.php';
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

include("functions.php");
include("connection.php");
if (!$is_connected) {
    debug_print("MPD Connection Failed","INDEX");
    close_mpd($connection);
    askForMpdValues("Rompr could not connect to an mpd server");
    exit();
} else if (array_key_exists('error', $mpd_status)) {
    debug_print("MPD Password Failed or other status failure","INDEX");
    close_mpd($connection);
    askForMpdValues('There was an error when communicating with your mpd server : '.$mpd_status['error']);
    exit();
} else if (array_key_exists('setup', $_REQUEST)) {
    askForMpdValues("You requested the setup page");
    close_mpd($connection);
    exit();
}

// setswitches();
close_mpd($connection);

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="layout.css" />
<link rel="stylesheet" type="text/css" href="tiptip/tipTip.css" />
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
<!-- TipTip jQuery tooltip plugin -->
<!-- http://code.drewwilson.com/entry/tiptip-jquery-plugin -->
<script type="text/javascript" src="tiptip/jquery.tipTip.js"></script>
<?php
if ($mobile != "no") {
    print '<script type="text/javascript" src="jquery.touchwipe.min.js"></script>'."\n";
} else {
    print '<script type="text/javascript" src="shortcut.js"></script>'."\n";
    print '<script type="text/javascript" src="keycode.js"></script>'."\n";
}
?>
<script type="text/javascript" src="debug.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="clickfunctions.js"></script>
<script type="text/javascript" src="lastfmstation.js"></script>
<script type="text/javascript" src="podcasts.js"></script>
<script type="text/javascript" src="jshash-2.2/md5-min.js"></script>
<script type="text/javascript" src="lastfm.js"></script>
<script type="text/javascript" src="musicbrainz.js"></script>
<script type="text/javascript" src="discogs.js"></script>
<script type="text/javascript" src="wikipedia.js"></script>
<script type="text/javascript" src="soundcloud.js"></script>
<script type="text/javascript" src="nowplaying.js"></script>
<script type="text/javascript" src="info_file.js"></script>
<script type="text/javascript" src="info_lastfm.js"></script>
<script type="text/javascript" src="info_wikipedia.js"></script>
<script type="text/javascript" src="info_musicbrainz.js"></script>
<script type="text/javascript" src="info_discogs.js"></script>
<script type="text/javascript" src="info_lyrics.js"></script>
<script type="text/javascript" src="info_soundcloud.js"></script>
<script type="text/javascript" src="infobar2.js"></script>
<script type="text/javascript" src="playlist.js"></script>
<script type="text/javascript" src="coverscraper.js"></script>
<?php

if ($prefs['use_mopidy_http'] == 1) {
    print'<script type="text/javascript" src="http://'.$prefs['mpd_host'].':'.$prefs['mopidy_http_port'].'/mopidy/mopidy.min.js"></script>'."\n";
}

?>
<!-- <script type="text/javascript" src="mopidy.js"></script> -->
<script type="text/javascript" src="player.js"></script>

<?php
include('globals.php');
if (file_exists("prefs/prefs.js")) {
    print '<script type="text/javascript" src="prefs/prefs.js"></script>'."\n";
}
?>
<script language="javascript">
// The world's smallest jQuery plugin :)
jQuery.fn.reverse = [].reverse;
// http://www.mail-archive.com/discuss@jquery.com/msg04261.html

jQuery.fn.isOpen = function() {
    return this.attr('src') == 'newimages/toggle-open-new.png';
}

jQuery.fn.isClosed = function() {
    return this.attr('src') == 'newimages/toggle-closed-new.png';
}

jQuery.fn.toggleOpen = function() {
    this.attr('src', 'newimages/toggle-open-new.png');
}

jQuery.fn.toggleClosed = function() {
    this.attr('src', 'newimages/toggle-closed-new.png');
}

debug.setLevel(9);
// debug.setLevel(0);

<?php
print "var mobile = '".$mobile."';\n";
?>

function aADownloadFinished() {
    debug.log("INDEX","Album Art Download Has Finished");
    $.get("checkRemoteImageCache.php", function() { debug.debug("INDEX","Finished Thinning Remote Cache")});
}

var playlist = new Playlist();
var player = new multiProtocolController();
var lfmprovider = new lastFMprovider();
var lastfm = new LastFM(prefs.lastfm_user);
var coverscraper = new coverScraper(0, false, false, prefs.downloadart);
var sbWidth;

$(document).ready(function(){
    // Check to see if HTML5 local storage is supported - we use this for communication between the
    // album art manager and the albums list
    if ("localStorage" in window && window["localStorage"] != null) {
        window.addEventListener("storage", onStorageChanged, false);
    }

    checkServerTimeOffset();
    setClickHandlers();
    $("#sortable").click(onPlaylistClicked);

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

    infobar.createProgressBar();
    $("#progress").click( infobar.seek );

    if (mobile == "no") {
        setDraggable('collection');
        setDraggable('filecollection');
        setDraggable('search');
        setDraggable('filesearch');

        // Make the entire playlist area accept drops from the collection
        $("#pscroller").droppable({
            //accept: ".draggable",
            addClasses: false,
            greedy: true,
            drop: playlist.draggedToEmpty,
            hoverClass: "highlighted"
        });

        // We have to set the sortable as droppable, even though the draggables
        // are connected to it. This means we can set the 'greedy' option.
        // Otherwise the drop event bubbles up when we drop over the sortable
        // and the pscroller event captures it first.
        $("#sortable").droppable({
            //accept: ".draggable",
            addClasses: false,
            greedy: true,
            drop: function() {},
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
            player.controller.reloadPlaylists();
            doThatFunkyThang();
            $("ul.topnav li a").click(function() {
                $(this).parent().find("ul.subnav").slideToggle('fast', function() {
                    // hackety hack
                    $("#historypanel").scrollTo('.current');
                });
                return false;
            });
            browser.createButtons();
            setChooserButtons();
            scrobwrangler = new progressBar('scrobwrangler', 'horizontal');
            scrobwrangler.setProgress(parseInt(prefs.scrobblepercent.toString()));
            $("#scrobwrangler").click( setscrob );

        });
        loadKeyBindings();
        infobar.setVolumeState(prefs.volume);
        var obj = document.getElementById('volumecontrol');
        obj.addEventListener('mousedown', function(event) {
            event.preventDefault();
            infobar.volumeTouch(event);
        }, false);
        obj.addEventListener('mousemove', function(event) {
            event.preventDefault();
            infobar.volumeMouseMove(event);
        }, false);
        obj.addEventListener('mouseup', function(event) {
            infobar.volumeDragEnd(event);
        }, false);
    } else {
        scrobwrangler = new progressBar('scrobwrangler', 'horizontal');
        scrobwrangler.setProgress(parseInt(prefs.scrobblepercent.toString()));
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
        $("#button_keep_search_open").attr("checked", prefs.keep_search_open);
        $("#button_hide_filelist").attr("checked", prefs.hide_filelist);
        $("#button_hide_lastfmlist").attr("checked", prefs.hide_lastfmlist);
        $("#button_hide_radiolist").attr("checked", prefs.hide_radiolist);
        $("#hideinfobutton").attr("checked", prefs.hidebrowser);
        if (prefs.hidebrowser) {
            $(".penbehindtheear").fadeOut('fast');
        }
        browser.createButtons();
        setChooserButtons();
        player.controller.reloadPlaylists();
        var obj = document.getElementById('volumecontrol');
        obj.addEventListener('touchstart', function(event) {
            if (event.targetTouches.length == 1) {
                infobar.volumeTouch(event.targetTouches[0]);

            }
        }, false);
        obj.addEventListener('touchmove', function(event) {
            event.preventDefault();
            if (event.targetTouches.length == 1) {
                infobar.volumeTouch(event.targetTouches[0]);
            }
        }, false);
        obj.addEventListener('touchend', function(event) {
            infobar.volumeTouchEnd();
        }, false);
    }

    $('#search').load("search.php");
    if (!prefs.hide_lastfmlist) {
        $("#lastfmlist").load("lastfmchooser.php");
    }
    if (!prefs.hide_radiolist) {
        $("#bbclist").load("bbcradio.php");
        $("#somafmlist").load("somafm.php");
        $("#yourradiolist").load("yourradio.php");
        podcasts.loadList();
        refreshMyDrink(false);
    }

    player.loadCollection();

    sourcecontrol(prefs.chooser);
    if (prefs.shownupdatewindow === true || prefs.shownupdatewindow < 0.40) {
        var fnarkle = popupWindow.create(500,600,"fnarkle",true,"Information About This Version");
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        if (mobile != "no") {
            $("#fnarkler").addClass('tiny');
        }
        $("#fnarkler").append('<p>Welcome to RompR version 0.40</p>');
        if (mobile != "no") {
            $("#fnarkler").append('<p>You are viewing the mobile version of RompR. To view the standard version go to <a href="/rompr/?mobile=no">/rompr/?mobile=no</a></p>');
        } else {
            $("#fnarkler").append('<p>To view the mobile version go to <a href="/rompr/?mobile=phone">/rompr/?mobile=phone</a></p>');
        }
        $("#fnarkler").append('<p>The Basic RompR Manual is at: <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p>The Discussion Forum is at: <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        if (!debinstall) {
            $("#fnarkler").append('<p><b>IMPORTANT</b> The Apache configuration file has CHANGED in this version. Please make sure you update to the latest one.</p>');
        }
        $("#fnarkler").append('<p><b>IMPORTANT! Mopidy Users</b></p>');
        $("#fnarkler").append('<p>If you are running Mopidy, please <a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/" target="_blank">read the section about Mopidy on the Wiki</a> to enable some extra features</p>');
        $("#fnarkler").append('<p>You will have to rebuild your albums list if you use the Local Files backend</p>');
        $("#fnarkler").append('<p>This version of Rompr REQUIRES Mopidy 0.15 or later</p>');
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: 0.40});
        $.get('firstrun.php');
    }
    // Initialise the player's status
    if (prefs.use_mopidy_http == 0) {
        player.mpd.command("",playlist.repopulate);
    } else {
        player.mpd.command("");
    }
    if (mobile == "no") {
        if (prefs.playlistcontrolsvisible) {
            $("#playlistbuttons").slideToggle('fast', setBottomPaneSize);
        } else {
            setBottomPaneSize();
        }
    } else {
        if (prefs.playlistcontrolsvisible) {
            $("#playlistbuttons").slideToggle('fast', setBottomPaneSize);
        }
        setTimeout(setBottomPaneSize, 2000);
        $(window).touchwipe({
            wipeLeft: function() { swipeyswipe(1); },
            wipeRight: function() { swipeyswipe(-1) },
            min_move_x: 200,
            min_move_y: 1000,
            preventDefaultEvents: false
        });
    }
    $(window).bind('resize', function() {
        setBottomPaneSize();
    });

    sbWidth = scrollbarWidth();
    $(".lettuce").tipTip({delay: 1000});

});

</script>
<script type="text/javascript" src="info.js"></script>
</head>

<?php
if ($mobile == "no") {
    include('layout_normal.php');
} else if ($mobile == "phone") {
    include('layout_phone.php');
}
?>
</body>
</html>

<?php
function askForMpdValues($title) {
    global $prefs;
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="layout.css" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<link rel="stylesheet" type="text/css" href="Darkness.css" />
</head>
<body style="padding:8px;overflow-y:auto">
    <div class="bordered simar dingleberry" style="max-width:40em">
    <h3>
<?php
print $title;
?>
    </h3>
    <p>Please enter the IP address and port of your mpd server in this form</p>
    <p class="tiny">Note: localhost in this context means the computer running the apache server</p>
    <form name="mpdetails" action="index.php" method="post">
<?php
        print '<p>IP Address or hostname<br><input type="text" class="winkle" name="mpd_host" value="'.$prefs['mpd_host'].'" /></p>'."\n";
        print '<p>Port<br><input type="text" class="winkle" name="mpd_port" value="'.$prefs['mpd_port'].'" /></p>'."\n";
?>
        <hr class="dingleberry" />
        <h3>Advanced options</h3>
        <p>Leave these blank unless you know you need them</p>
<?php
        print '<p>Password<br><input type="text" class="winkle" name="mpd_password" value="'.$prefs['mpd_password'].'" /></p>'."\n";
?>
        <p>UNIX-domain socket</p>
<?php
        print '<input type="text" class="winkle" name="unix_socket" value="'.$prefs['unix_socket'].'" /></p>';
?>
        <hr class="dingleberry" />
        <h3>Music Collection (Albums List) Settings</h3>
<?php
        print '<p><input type="checkbox" name="sortbydate" value="true"';
        if ($prefs['sortbydate'] == "true") {
            print " checked";
        }
        print '>Sort Albums By Date</input></p>';
        print '<p><input type="checkbox" name="notvabydate" value="true"';
        if ($prefs['notvabydate'] == "true") {
            print " checked";
        }
        print '>Don\'t Apply Date Sorting to \'Various Artists\'</input></p>';
?>
        <p>You will need to rebuild your Albums List after changing this option.</p>
        <p>Note: Not all Mopidy backends return date information. Dates may not be what you expect, depending on your tags</p>
        <hr class="dingleberry" />
        <h3>Mopidy-specific Settings</h3>
        <p>PLEASE <a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/" target="_blank">read the section about Mopidy on the Wiki</a> before changing these settings</p>
<?php
        print '<input type="checkbox" name="use_mopidy_tagcache" value="1"';
        if ($prefs['use_mopidy_tagcache'] == 1) {
            print " checked";
        }
        print '>Update local file collection using mopidy-scan</input>';

        print '<p><input type="checkbox" name="use_mopidy_http" value="1"';
        if ($prefs['use_mopidy_http'] == 1) {
            print " checked";
        }
        print '>Use Mopidy HTTP Frontend for additional features</input></p>';
        print '<p>Mopidy HTTP port:<br><input type="text" class="winkle" name="mopidy_http_port" value="'.$prefs['mopidy_http_port'].'" /></p>'."\n";

        print "<p><b>Use these mopidy backends for creating RompR's Albums List (only if HTTP Frontend is enabled) (choose one or both):</b></p>";
        print '<p><input type="checkbox" name="use_mopidy_file_backend" value="true"';
        if ($prefs['use_mopidy_file_backend'] == "true") {
            print " checked";
        }
        print '>Local Files Backend</input></p>';
        print '<p><input type="checkbox" name="use_mopidy_beets_backend" value="true"';
        if ($prefs['use_mopidy_beets_backend'] == "true") {
            print " checked";
        }
        print '>Beets Backend</input></p>';


?>
        <p><input type="submit" class="winkle" value="OK" /></p>
    </form>
    </div>
</body>
</html>
<?php
}
?>
