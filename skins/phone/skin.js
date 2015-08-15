jQuery.fn.menuReveal = function(callback) {
    if (callback) {
        this.show(0, callback);
    } else {
        this.show();
    }
    return this;
}

jQuery.fn.menuHide = function(callback) {
    if (callback) {
        this.hide(0, callback);
    } else {
        this.hide();
    }
    return this;
}

jQuery.fn.makeTagMenu = function(options) {
    var settings = $.extend({
        textboxname: "",
        textboxextraclass: "",
        labelhtml: "",
        populatefunction: null,
        buttontext: null,
        buttonfunc: null,
        buttonclass: ""
    },options);

    this.each(function() {
        var tbc = "enter";
        if (settings.textboxextraclass) {
            tbc = tbc + " "+settings.textboxextraclass;
        }
        $(this).append(settings.labelhtml);
        var holder = $('<div>', { class: "expand"}).appendTo($(this));
        var dropbutton = $('<i>', { class: 'fixed combo-button'}).appendTo($(this));
        var textbox = $('<input>', { type: "text", class: tbc, name: settings.textboxname }).
            appendTo(holder);
        var dropbox = $('<div>', {class: "drop-box tagmenu dropshadow"}).appendTo(holder);
        var menucontents = $('<div>', {class: "tagmenu-contents"}).appendTo(dropbox);
        if (settings.buttontext !== null) {
            var submitbutton = $('<button>', {class: "fixed"+settings.buttonclass,
                style: "margin-left: 8px"}).appendTo($(this));
            submitbutton.html(settings.buttontext);
            if (settings.buttonfunc) {
                submitbutton.click(function() {
                    settings.buttonfunc(textbox.val());
                });
            }
        }

        dropbutton.click(function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (dropbox.is(':visible')) {
                dropbox.slideToggle('fast');
            } else {
                var data = settings.populatefunction(function(data) {
                    menucontents.empty();
                    for (var i in data) {
                        var d = $('<div>', {class: "backhi"}).appendTo(menucontents);
                        d.html(data[i]);
                        d.click(function() {
                            var cv = textbox.val();
                            if (cv != "") {
                                cv += ",";
                            }
                            cv += $(this).html();
                            textbox.val(cv);
                        });
                    }
                    dropbox.slideToggle('fast');
                });
            }
        });
    });
}

function toggleSearch() {
    layoutProcessor.sourceControl('searchpane', setSearchLabelWidth);
}

// Dummy function - we don't use tiptip in the mobile version because, well, you don't hover
// over stuff so what's the point?
jQuery.fn.tipTip = function() {
    return this;
}

function showVolumeControl() {
    $("#outputbits").animate({width: 'toggle'});
}

function addCustomScrollBar(value) {
    // Dummy function - custom scrollbars are not used in the mobile version
}

function setTopIconSize(panels) {
    panels.forEach( function(div) {
        if ($(div).is(':visible')) {
            var jq = $(div+' .topimg');
            var imw = (parseInt(jq.first().css('margin-left')) + parseInt(jq.first().css('margin-right')));
            var imh = parseInt(jq.first().css('max-height'))
            var numicons = jq.length+1;
            var mw = imw*numicons;
            var iw = Math.floor(($(div).width() - mw - 8)/numicons);
            if (iw > imh) iw = imh;
            if (iw < 8) iw = 6;
            jq.css({width: iw+"px", height: iw+"px", "font-size": iw+"px"});
        }
    });
}

var layoutProcessor = function() {

    return {

        shrinkerRatio: 1,
        supportsDragDrop: false,
        hasCustomScrollbars: false,
        playlistInNowplaying: false,
        usesKeyboard: false,

        afterHistory: function() {
            layoutProcessor.sourceControl('infopane',
                function() { layoutProcessor.goToBrowserPanel('artist')});
        },

        addInfoSource: function(name, obj) {
            $("#chooserbuttons").append($('<i>', {
                onclick: "browser.switchsource('"+name+"')",
                class: obj.icon+' topimg fixed',
                id: "button_source"+name
            }));
        },

        setupInfoButtons: function() { },

        goToBrowserPanel: function(panel) {
            // Browser plugins are not supported in this skin
        },

        goToBrowserPlugin: function(panel) {
            // Browser plugins are not supported in this skin
        },

        goToBrowserSection: function(section) {
            // Wikipedia mobile does not return contents
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
            var wa = parseInt($("#tagadder").css("padding-left")) + parseInt($("#tagadder").
                css("padding-right"));
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
            if (prefs.scrolltocurrent && player.status.songid &&
                $('.track[romprid="'+player.status.songid+'"]').length > 0) {
                $('#pscroller').animate({
                   scrollTop: $('div.track[romprid="'+player.status.songid+
                    '"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2
                }, 500);
            }
        },

        sourceControl: function(source, callback) {
            if (source == prefs.chooser) {
                $("#"+source).show();
                if (source == "searchpane") {
                    setSearchLabelWidth();
                }
                return;
            }
            $("#"+prefs.chooser).hide();
            $("#"+source).show();
            prefs.save({chooser: source});
            layoutProcessor.adjustLayout();
            if (callback) {
                callback();
            }
            if (source == 'infopane') {
                setTopIconSize(['#chooserbuttons']);
            }
            if (source == "radiolist") {
                podcasts.loadList();
                $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
            }
        },

        adjustLayout: function() {
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
                    $("#playlistm").detach().prependTo("#nowplaying").removeClass('mainpane').
                        css({height: "100%"}).show();
                    $(".choose_playlist").hide();
                    if (prefs.chooser == "playlistm") {
                        layoutProcessor.sourceControl("infobar");
                    }
                } else if (t <= 200 && layoutProcessor.playlistInNowplaying) {
                    $("#playlistm").detach().appendTo("body").addClass('mainpane').
                        css({height: newheight+"px"}).hide();
                    $("#nptext").detach().appendTo("#nowplaying");
                    $("#nowplayingfiddler").css({height: "0px", "margin-bottom": "0px"});
                    layoutProcessor.playlistInNowplaying = false;
                    $(".choose_playlist").show();
                }
                t = ws.y - $("#patrickmoore").offset().top - $("#amontobin").outerHeight(true) -
                    $("#nowplayingfiddler").outerHeight(true);
                $("#nowplaying").css({height: t+"px", width: hack+"px"});
                infobar.updateWindowValues();
                infobar.rejigTheText();
            }
            layoutProcessor.setPlaylistHeight();
            browser.rePoint();
            setTopIconSize(['#headerbar', '#chooserbuttons']);
        },

        fanoogleMenus: function(jq) {

        },

        scrollCollectionTo: function(jq) {

        },

        initialise: function() {

            $('#volumecontrol').bind('touchstart', function(event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.originalEvent.targetTouches.length == 1) {
                    infobar.volumeTouch(event.originalEvent.targetTouches[0]);
                    return false;
                }
            }).bind('touchmove', function(event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.originalEvent.targetTouches.length == 1) {
                    infobar.volumeTouch(event.originalEvent.targetTouches[0]);
                    return false;
                }
            }).bind('touchend', function(event) {
                event.preventDefault();
                event.stopPropagation();
                infobar.volumeTouchEnd();
                return false;
            });
            if (!prefs.checkSet('clickmode')) {
                prefs.clickmode = 'single';
            }
            // Work around iOS7 input/select bug - when touching a select or input
            // the entire browser will freeze (for a very long time). Workaround is to
            // use our own touchend event listener.
            $('input,select').bind("touchend", function (e) {
                 e.preventDefault();
                 e.stopImmediatePropagation();
                 e.target.focus();
            });
            setControlClicks();
            $('.choose_nowplaying').click(function(){layoutProcessor.sourceControl('infobar')});
            $('.choose_albumlist').click(function(){layoutProcessor.sourceControl('albumlist')});
            $('.choose_searcher').click(toggleSearch);
            $('.choose_filelist').click(function(){layoutProcessor.sourceControl('filelist')});
            $('.choose_radiolist').click(function(){layoutProcessor.sourceControl('radiolist')});
            $('.choose_infopanel').click(function(){layoutProcessor.sourceControl('infopane')});
            $('.choose_playlistman').click(function(){layoutProcessor.sourceControl('playlistman')});
            $('.choose_pluginplaylists').click(function(){layoutProcessor.sourceControl(
                'pluginplaylistholder')});
            $('.choose_prefs').click(function(){layoutProcessor.sourceControl('prefsm')});
            $('.choose_history').click(function(){layoutProcessor.sourceControl('historypanel')});
            $('.icon-rss.npicon').click(function(){podcasts.doPodcast('nppodiput')});
            $('#love').click(nowplaying.love);
            $('#ban').click(infobar.ban);
            $('.icon-volume-up.topimg').click(showVolumeControl);
            $('.icon-cog-alt.topimg').click(function(){layoutProcessor.sourceControl('chooser')});
            $('.choose_playlist').click(function(){layoutProcessor.sourceControl('playlistm')});
            $("#ratingimage").click(nowplaying.setRating);
            $("#playlistname").parent().next('button').click(player.controller.savePlaylist);
            $('.clear_playlist').click(playlist.clear);
        }

    }

}();

var popupWindow = function() {

    var closeCall = null;
    var returnTo = null;

    return {
        create: function(w,h,id,s,title,x,y) {
            $('#popupwindow').empty();
            closeCall = null;
            var ourdiv = $('<div>', {id: id}).appendTo('#popupwindow');
            ourdiv.append('<div id="cheese"></div>');
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+
                title+
                '</h2></td><td align="right" width="30px">'+
                '<i class="icon-cancel-circled playlisticon clickicon" onclick="popupWindow.close()">'+
                '</i></td></tr></table>');
            ourdiv.append('<div id="popupcontents"></div>');
        },
        open: function() {
            returnTo = prefs.chooser;
            layoutProcessor.sourceControl('popupwindow');
        },
        close: function() {
            layoutProcessor.sourceControl(returnTo);
            if (closeCall) {
                closeCall();
            }
        },
        setsize: function() {

        },
        onClose: function(callback) {
            closeCall = callback;
        }
    }

}();