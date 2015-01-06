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
    if ($("#infobar").is(':visible')) {
        var hack = ws.x - 32;
        var t = ws.y - $("#patrickmoore").offset().top - $("#amontobin").outerHeight(true);
        if (t > 200 && layoutProcessor.playlistInNowplaying == false) {
            $("#nowplayingfiddler").css({height: "40px", "margin-bottom": "4px" });
            $("#nptext").detach().appendTo("#nowplayingfiddler");
            layoutProcessor.playlistInNowplaying = true;
            $("#playlistm").show().detach().prependTo("#nowplaying").removeClass('mainpane').css({width: "", left: ""});
            $(".playlistchoose").hide();
            if (prefs.chooser == "playlistm") {
                layoutProcessor.sourceControl("infobar");
            }
        } else if (t <= 200 && layoutProcessor.playlistInNowplaying) {
            $("#playlistm").detach().appendTo("#bottompage").addClass('mainpane').css({width: ws.x+"px", left: ws.x+"px"}).hide();
            $("#nptext").detach().appendTo("#nowplaying");
            $("#nowplayingfiddler").css({height: "0px", "margin-bottom": "0px"});
            layoutProcessor.playlistInNowplaying = false;
            $(".playlistchoose").show();
        }
        t = ws.y - $("#patrickmoore").offset().top - $("#amontobin").outerHeight(true) - $("#nowplayingfiddler").outerHeight(true);
        $("#nowplaying").css({height: t+"px", width: hack+"px"});
        infobar.updateWindowValues();
        infobar.rejigTheText();
    }
    layoutProcessor.setPlaylistHeight();
    layoutProcessor.scrollPlaylistToCurrentTrack();
    browser.rePoint();
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
}

var layoutProcessor = function() {

    return {

        shrinkerRatio: 1,
        supportsDragDrop: false,
        hasCustomScrollbars: false,
        playlistInNowplaying: false,

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
            var ws = getWindowSize();
            var wa = parseInt($("#tagadder").css("padding-left")) + parseInt($("#tagadder").css("padding-right"));
            $("#tagadder").css({top: "0px", left: "0px", width: (ws.x-wa)+"px", height: ws.y+"px"});
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
            if (source == prefs.chooser) {
                $("#"+source).show().css({top: "0px", left: "0px"});
                setBottomPaneSize();
                return;
            }
            var sources = ["infobar", "albumlist", "searchpane", "filelist", "radiolist", "infopane", "playlistm", "pluginplaylistholder", "chooser", "historypanel", "playlistman", "prefsm"];
            if (typeof source == "number") {
                var temp = source;
                var newindex = sources.indexOf(prefs.chooser)+source;
                if (newindex >= sources.length ) return false;
                if (newindex < 0) return false;
                source = sources[newindex];
                if (source == "playlistm" && layoutProcessor.playlistInNowplaying) {
                    source = sources[newindex+temp];
                }
            }
            if (sources.indexOf(source) < sources.indexOf(prefs.chooser)) {
                var direction = -1;
            } else {
                var direction = 1;
            }
            $("#"+source).show().css({top: "0px", left: (ws.x*direction)+"px"});
            for (var i in sources) {
                if (sources[i] != source && sources[i] != prefs.chooser && !(sources[i] == "playlistm" && layoutProcessor.playlistInNowplaying)) {
                    $("#"+sources[i]).hide();
                }
            }
            $("#"+prefs.chooser).animate({
                left: (ws.x*(-direction))+"px"
            }, 'fast', 'swing', function() {
                $(this).hide();
            });
            $("#"+source).animate({
                left: 0
            }, 'fast', 'swing', function() {
                prefs.save({chooser: source});
                setBottomPaneSize();
                if (callback) {
                    callback();
                }
            });
        }



    }

}();