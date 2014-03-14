function doThatFunkyThang() {

}

function setBottomPaneSize() {
    var ws = getWindowSize();
    if (itisbigger) {
        // The nowplaying area has ben hidden
        var newheight = ws.y-28;
    } else {
        // The nowplaying area is visible
        var newheight = ws.y - 112;
    }
    // 'landscape' determines whether we're showing 2 columns or one
    var oldls = landscape;
    if (ws.x > ws.y) {
        landscape = prefs.twocolumnsinlandscape;
    } else {
        landscape = false;
    }
    if (oldls != landscape) {
        switchColumnMode(landscape);
        sourcecontrol(prefs.chooser);
    }
    // Set the height of the volume control bar
    var v = newheight - 32;
    $("#volumecontrol").css("height", v.toString()+"px");
    // This is called here purely to make sure the 'progress bar' in the
    // resized volume control gets updated
    infobar.updateWindowValues();
    // Width of the nowplaying area
    var gibbon = ws.x-164;
    $("#patrickmoore").css('width', gibbon.toString()+"px");
    // Hack for some themes that have a 1 pixel border on nowplaying
    // or the top of the albums list/info pane.
    // This cuases it to overflow bottompage, and on a mobile device
    // we get a second scrollbar because of it.
    var cockfeature = newheight-2;
    $("#infopane").css("height", cockfeature.toString()+"px");
    $("#bottompage").css("height", newheight.toString()+"px");
    newheight = null;
    playlist.setHeight();
    infobar.rejigTheText();
}

function switchColumnMode(flag) {
    if (flag) {
        $("#sources").css({'width' : '50%', 'float' : 'left'});
        $("#playlistm").css({'width' : '50%', 'float' : 'right'});
        $("#playlistm").show();
        $("#sources").show();
        if (prefs.chooser == "playlistm") {
            prefs.chooser = "albumlist";
        }
        $("#chooseplaylist").hide();
    } else {
        $("#sources").css({'width' : '100%', 'float' : 'none'});
        $("#playlistm").css({'width' : '100%', 'float' : 'none'});
        if (prefs.chooser == "playlistm") {
            $("#playlistm").show();
            $("#sources").hide();
        } else {
            $("#playlistm").hide();
            $("#sources").show();
        }
        $("#chooseplaylist").show();
    }
}

function switchsource(source) {

    var togo = sources.shift();
    if (togo) {
        if ($("#"+togo).is(':visible')) {
            $("#"+togo).hide();
            switchsource(source);
        } else {
            switchsource(source);
        }
    } else {
        prefs.save({chooser: source});
        $("#"+source).show();
        if (landscape) {
            switchColumnMode(source != "infopane");
        } else {
            if (source == "playlistm") {
                $("#sources").hide();
            } else {
                $("#sources").show();
            }
        }
        setBottomPaneSize();
    }
}

function makeitbigger() {
    itisbigger = !itisbigger;
    $("#infobar").slideToggle('fast', function() {
        if (itisbigger) {
            $("#bottompage").css('top', "28px");
        } else {
            $("#bottompage").css('top', "112px");
        }
        setBottomPaneSize();
    });
}

function swipeyswipe(dir) {
    var order = [];
    order.push("albumlist")
    if (!prefs.hide_filelist) {
        order.push("filelist")
    }
    if (!prefs.hide_lastfmlist) {
        order.push("lastfmlist")
    }
    if (!prefs.hide_radiolist) {
        order.push("radiolist")
    }
    if (!prefs.hidebrowser) {
        order.push("infopane");
    }
    if (landscape) {
        if (!prefs.twocolumnsinlandscape) {
            order.push("playlistm");
        }
    } else {
        order.push("playlistm");
    }
    for (var i in order) {
        if (order[i] == prefs.chooser) {
            var j = (i*1)+(dir*1);
            if (j<0) { j=order.length-1; }
            if (j>=order.length) { j = 0; }
            sourcecontrol(order[j]);
            break;
        }
    }
}

function showVolumeControl() {
    $("#volumecontrol").slideToggle('fast');
}

function addCustomScrollBar(value) {

}

function initUI() {
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
    $(window).touchwipe({
        wipeLeft: function() { swipeyswipe(1); },
        wipeRight: function() { swipeyswipe(-1) },
        min_move_x: 200,
        min_move_y: 1000,
        preventDefaultEvents: false
    });
}