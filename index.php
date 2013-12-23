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
    $prefs['mopidy_http_port'] = $_POST['mopidy_http_port'];
    if (array_key_exists('debug_enabled', $_POST)) {
        $prefs['debug_enabled'] = 1;
    } else {
        $prefs['debug_enabled'] = 0;
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
include("international.php");
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
} else if (array_key_exists('setup', $_REQUEST)) {
    askForMpdValues(get_int_text("setup_request"));
    close_mpd($connection);
    exit();
}

close_mpd($connection);

// Clean our caches of stored responses. 2592000 is 30 days
clean_cache('prefs/jsoncache/musicbrainz/*', 2592000);
clean_cache('prefs/jsoncache/discogs/*', 2592000);
clean_cache('prefs/jsoncache/wikipedia/*', 2592000);
clean_cache('prefs/jsoncache/lastfm/*', 2592000);
clean_cache('prefs/imagecache/*', 2592000);

// Find mopidy's HTTP interface, if present
// This is set here but never saved. globals.php will pass this into the javascript
// as prefs.mopidy_detected. If the user wishes to prevent us from using the HTTP
// interface they just need to set the HTTP port to the 'wrong' value.
// detect_mopidy will also set prefs.mopidy_http_address to the IP address where
// it finds the HTTP API
$mopidy_detected = detect_mopidy();
$prefs['mopidy_detected'] = $mopidy_detected == true ? "true" : "false";
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
<link type="text/css" href="custom-scrollbar-plugin/css/jquery.mCustomScrollbar.css" rel="stylesheet" />
<?php
if ($mobile != "no") {
print '<link rel="stylesheet" type="text/css" href="layout_mobile.css" />'."\n";
}
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<!-- JQuery UI plugin, somewhat modified to make dragging work more easily and to function -->
<!-- with the custom scrollbar plugin (now almost certainly doesn't work without it) -->
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="jquery.scrollTo-1.4.3.1-min.js"></script>
<!-- TipTip jQuery tooltip plugin -->
<!-- http://code.drewwilson.com/entry/tiptip-jquery-plugin -->
<script type="text/javascript" src="tiptip/jquery.tipTip.js"></script>
<!-- Custom scrollbar plugin from http://manos.malihu.gr/jquery-custom-content-scroller/ -->
<!-- Initial work of adding it to RompR done by Vitaly Ignatov -->
<script type="text/javascript" src="custom-scrollbar-plugin/js/jquery.mCustomScrollbar.concat.min.js"></script>
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
<script type="text/javascript" src="infobar2.js"></script>
<script type="text/javascript" src="playlist.js"></script>
<script type="text/javascript" src="coverscraper.js"></script>
<?php

if ($mopidy_detected) {
    print'<script type="text/javascript" src="http://'.$prefs['mopidy_http_address'].':'.$prefs['mopidy_http_port'].'/mopidy/mopidy.min.js"></script>'."\n";
}

?>
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

<?php
if ($prefs['debug_enabled'] == 1) {
    print "debug.setLevel(8);\n";
} else {
    print "debug.setLevel(0);\n";
}
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
        scroll: true,
        scrollSpeed: 10,
        tolerance: 'pointer',
        scrollparent: "#pscroller",
        customscrollbars: true,
        scrollSensitivity: 60,
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
        scroll: true,
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
                    if ($(this).is(':visible')) {
                        debug.log("UI","Opened menu",$(this).attr("id"));
                        $(this).mCustomScrollbar("update");
                        if ($(this).attr("id") == "hpscr") {
                            $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
                        }
                    }
                });
                return false;
            });
            browser.createButtons();
            setChooserButtons();
            scrobwrangler = new progressBar('scrobwrangler', 'horizontal');
            scrobwrangler.setProgress(parseInt(prefs.scrobblepercent.toString()));
            $("#scrobwrangler").click( setscrob );
            $.each([ "#lpscr", "#configpanel", "#hpscr" ], function( index, value ) {
                addCustomScrollBar(value);
            });
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
        $("#lastfmlang").attr("checked", prefs.lastfmlang);
        $("#scrolltocurrent").attr("checked", prefs.scrolltocurrent);
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
    if (prefs.shownupdatewindow === true || prefs.shownupdatewindow < 0.42) {
        var fnarkle = popupWindow.create(500,600,"fnarkle",true,language.gettext("intro_title"));
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        if (mobile != "no") {
            $("#fnarkler").addClass('tiny');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_welcome")+' 0.42</p>');
        if (mobile != "no") {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewingmobile")+' <a href="/rompr/?mobile=no">/rompr/?mobile=no</a></p>');
        } else {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewmobile")+' <a href="/rompr/?mobile=phone">/rompr/?mobile=phone</a></p>');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_basicmanual")+' <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_forum")+' <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        if (!debinstall && prefs.shownupdatewindow < 0.41) {
            $("#fnarkler").append('<p align="center"><b>IMPORTANT</b> The Apache configuration file has CHANGED. If you have upgraded from a version earlier than 0.40 please make sure you update your Apache configuration.</p>');
        }
        $("#fnarkler").append('<p align="center"><b>'+language.gettext("intro_mopidy")+'</b></p>');
<?php
        print '$("#fnarkler").append(\'<p align="center">'.get_int_text("intro_mopidywiki", array('<a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/" target="_blank">', '</a>')).'</p>\');'."\n";
        print '$("#fnarkler").append(\'<p align="center"><b>'.get_int_text("intro_mopidyversion", array($prefs["mopidy_minversion"])).'</b></p>\');'."\n";
?>
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: 0.42});
        $.get('firstrun.php');
    }
    // Initialise the player's status
    if (!prefs.mopidy_detected) {
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

    $(".lettuce").tipTip({delay: 1000});
    $.each([ "#sources", "#infopane", "#pscroller" ], function( index, value ) {
        addCustomScrollBar(value);
    });
    sbWidth = scrollbarWidth();
});

</script>
<script type="text/javascript" src="info_file.js"></script>
<script type="text/javascript" src="info_lastfm.js"></script>
<script type="text/javascript" src="info_wikipedia.js"></script>
<script type="text/javascript" src="info_musicbrainz.js"></script>
<script type="text/javascript" src="info_discogs.js"></script>
<script type="text/javascript" src="info_lyrics.js"></script>
<script type="text/javascript" src="info_soundcloud.js"></script>
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
print '</h3>';
print '<p>'.get_int_text("setup_labeladdresses").'</p>';
print '<p class="tiny">'.get_int_text("setup_addressnote").'</p>';
print '<form name="mpdetails" action="index.php" method="post">';
print '<p>'.get_int_text("setup_ipaddress").'<br><input type="text" class="winkle" name="mpd_host" value="'.$prefs['mpd_host'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_port").'<br><input type="text" class="winkle" name="mpd_port" value="'.$prefs['mpd_port'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_advanced").'</h3>';
print '<p>'.get_int_text("setup_leaveblank").'</p>';
print '<p>'.get_int_text("setup_password").'<br><input type="text" class="winkle" name="mpd_password" value="'.$prefs['mpd_password'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_unixsocket").'</p>';
print '<input type="text" class="winkle" name="unix_socket" value="'.$prefs['unix_socket'].'" /></p>';
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_mopidy").'</h3>';
print '<p>'.get_int_text("setup_mopidyport").'<br><input type="text" class="winkle" name="mopidy_http_port" value="'.$prefs['mopidy_http_port'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<p><input type="checkbox" name="debug_enabled" value="1"';
if ($prefs['debug_enabled'] == 1) {
    print " checked";
}
print '>'.get_int_text("setup_debug").'</input></p>';
?>
        <p><input type="submit" class="winkle" value="OK" /></p>
    </form>
    </div>
</body>
</html>
<?php
}

?>
