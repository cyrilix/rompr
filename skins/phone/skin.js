function doThatFunkyThang() {

}

function toggleSearch() {
    layoutProcessor.sourceControl('searchpane', setSearchLabelWidth);
    ihatefirefox();
}

function setBottomPaneSize() {
    var ws = getWindowSize();
    var newheight = ws.y-$("#headerbar").outerHeight(true);
    // Set the height of the volume control bar
    var v = newheight - 32;
    $("#volumecontrol").css("height", v+"px");
    $(".mainpane").css({height: newheight+"px"});
    if ($("#infobar").is(':visible')) {
        var hack = ws.x - 32;
        var t = ws.y - $("#patrickmoore").offset().top - $("#amontobin").outerHeight(true);
        if (t > 200 && layoutProcessor.playlistInNowplaying == false) {
            $("#nowplayingfiddler").css({height: "40px", "margin-bottom": "4px" });
            $("#nptext").detach().appendTo("#nowplayingfiddler");
            layoutProcessor.playlistInNowplaying = true;
            $("#playlistm").detach().prependTo("#nowplaying").removeClass('mainpane').css({height: "100%"}).show();
            $(".playlistchoose").hide();
            if (prefs.chooser == "playlistm") {
                layoutProcessor.sourceControl("infobar");
            }
        } else if (t <= 200 && layoutProcessor.playlistInNowplaying) {
            $("#playlistm").detach().appendTo("body").addClass('mainpane').css({height: newheight+"px"}).hide();
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
            if (source == prefs.chooser) {
                $("#"+source).show(); 
                return;
            }
            $("#"+prefs.chooser).hide();
            $("#"+source).show(); 
            prefs.save({chooser: source});
            setBottomPaneSize();
            if (callback) {
                callback();
            }
        }

    }

}();