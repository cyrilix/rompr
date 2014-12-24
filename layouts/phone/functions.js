function doThatFunkyThang() {

}

function toggleSearch() {
    layoutProcessor.sourceControl('searchpane', setSearchLabelWidth);
    ihatefirefox();
}

function setBottomPaneSize() {
    var ws = getWindowSize();
    var newheight = ws.y-$("#bottompage").offset().top;
    // Set the height of the volume control bar
    var v = newheight - 32;
    $("#volumecontrol").css("height", v+"px");
    $("#bottompage").css("height", newheight+"px");
    $(".mainpane").css({height: newheight+"px", width: ws.x+"px"});
    var t = ws.y - $("#patrickmoore").offset().top;
    $("#patrickmoore").css("height", t+"px");
    var p = $("#nowplaying").height();
    if ( p > 300 && $("#nptext").is(':visible')) {
        $("#nptext").hide();
        $("#playlistm").detach().prependTo("#nowplaying").removeClass('mainpane').css({width: "", left: ""});
        $("#choose_playlist").hide();
        if (prefs.chooser == "playlistm") {
            layoutProcessor.sourceControl("infobar");
        }
    } else if (p <= 300 && $("#nptext").is(':hidden')) {
        $("#playlistm").detach().appendTo("#bottompage").addClass('mainpane').css({width: ws.x+"px", left: ws.x+"px"});
        $("#nptext").show();
        $("#choose_playlist").show();
    }
    // This is called here purely to make sure the 'progress bar' in the
    // resized volume control gets updated
    infobar.updateWindowValues();
    // Hack for some themes that have a 1 pixel border on nowplaying
    // or the top of the albums list/info pane.
    // This causes it to overflow bottompage, and on a mobile device
    // we get a second scrollbar because of it.
    // var cockfeature = newheight-2;
    // $("#infopane").css("height", cockfeature.toString()+"px");
    // newheight = null;
    layoutProcessor.setPlaylistHeight();
    layoutProcessor.scrollPlaylistToCurrentTrack();
    infobar.rejigTheText();
    browser.rePoint();
}

function swipeyswipe(dir) {
    var order = ["historypanel", "playlistman", "prefsm"];
    order.unshift("playlistm");
    order.unshift("infopane");
    if (!prefs.hide_radiolist) order.unshift("radiolist")
    if (!prefs.hide_filelist) order.unshift("filelist")
    if (!prefs.hide_albumlist)order.unshift("albumlist");
    order.unshift('infobar');
    for (var i in order) {
        if (order[i] == prefs.chooser) {
            var j = (i*1)+(dir*1);
            if (j<0) { j=order.length-1; }
            if (j>=order.length) { j = 0; }
            layoutProcessor.sourceControl(order[j]);
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
        min_move_y: 100,
        preventDefaultEvents: false
    });
}

var layoutProcessor = function() {

    return {

        shrinkerRatio: 1,
        supportsDragDrop: false,

        afterHistory: function() {
            layoutProcessor.sourceControl('infopane', function() { layoutProcessor.goToBrowserPanel('artist')});
        },

        addInfoSource: function(name, obj) {
            $("#chooser").append('<div class="chooser penbehindtheear"><a href="#" onclick="browser.switchsource(\''+name+'\');layoutProcessor.sourceControl(\'infopane\')">'+language.gettext(obj.text)+'</a></div>');
        },

        setupInfoButtons: function() { },

        goToBrowserPanel: function(panel) {
            $("#infopane").scrollTo("#"+panel+"information");
        },

        goToBrowserPlugin: function(panel) {
            layoutProcessor.sourceControl("infopane", function() { layoutProcessor.goToBrowserPanel(panel) });
        },

        goToBrowserSection: function(section) {
            $("#infopane").scrollTo(section);
        },

        notifyAddTracks: function() {
            infobar.notify(infobar.NOTIFY, language.gettext("label_addingtracks"));
        },

        maxPopupSize: function(winsize) {
            return {width: winsize.x - 16, height: winsize.y - 16};
        },

        hidePanel: function(panel, is_hidden, new_state) { },

        setTagAdderPosition: function(position) {
            $("#tagadder").css({top: position.y+8, left: 0, width: $("#bottompage").width()});
        },

        setPlaylistHeight: function() {
            var newheight = $("#playlistm").parent().height() - $("#horse").height();
            if ($("#playlistbuttons").is(":visible")) {
                newheight = newheight - $("#playlistbuttons").height() - 2;
            }
            $("#pscroller").css("height", newheight.toString()+"px");
        },

        playlistLoading: function() {
            layoutProcessor.sourceControl('playlistm');
        },

        scrollPlaylistToCurrentTrack: function() {
            if (prefs.scrolltocurrent && player.status.songid) {
                $('#pscroller').animate({
                   scrollTop: $('div.track[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2
                }, 500);
            }
        },

        sourceControl: function(source, callback) {
            debug.log("SOURCECONTROL","Calling Up",source);
            var ws = getWindowSize();
            if (typeof source == "number") {

            }
            var sources = ["infobar", "albumlist", "searchpane", "filelist", "radiolist", "infopane", "playlistm", "pluginplaylists", "chooser", "historypanel", "playlistman", "prefsm"];
            if (typeof source == "number") {
                var temp = source;
                var newindex = sources.indexOf(prefs.chooser)+source;
                if (newindex >= sources.length ) return false;
                if (newindex < 0) return false;
                source = sources[newindex];
                if (source == "playlistm" && $("#nptext").is(':hidden')) {
                    source = sources[newindex+temp];
                }
            }
            if (sources.indexOf(source) < sources.indexOf(prefs.chooser)) {
                var direction = -1;
            } else {
                var direction = 1;
            }
            $("#"+source).css({top: "0px", left: (ws.x*direction)+"px"});
            for (var i in sources) {
                if (sources[i] != source && sources[i] != prefs.chooser && !(sources[i] == "playlistm" && $("#nptext").is(':hidden'))) {
                    $("#"+sources[i]).css({left: (ws.x*2*direction)+"px"});
                }
            }
            $("#"+prefs.chooser).animate({
                left: (ws.x*(-direction))+"px"
            }, 'fast', 'swing');
            $("#"+source).animate({
                left: 0
            }, 'fast', 'swing', function() {
                prefs.save({chooser: source});
                if (callback) {
                    callback();
                }
            });
        }



    }

}();