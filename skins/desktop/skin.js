jQuery.fn.menuReveal = function(callback) {
    if (callback) {
        this.slideToggle('fast',callback);
    } else {
        this.slideToggle('fast');
    }
    return this;
}

jQuery.fn.menuHide = function(callback) {
    if (callback) {
        this.slideToggle('fast',callback);
    } else {
        this.slideToggle('fast');
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
        var tbc = "enter combobox-entry";
        if (settings.textboxextraclass) {
            tbc = tbc + " "+settings.textboxextraclass;
        }
        $(this).append(settings.labelhtml);
        var holder = $('<div>', { class: "expand"}).appendTo($(this));
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

        dropbox.mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 120,
        contentTouchScroll: 25,
        advanced: {
            updateOnContentResize: true,
            updateOnImageLoad: false,
            autoScrollOnFocus: false,
            autoUpdateTimeout: 500,
        }
        });
        textbox.hover(makeHoverWork);
        textbox.mousemove(makeHoverWork);
        textbox.click(function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var position = getPosition(ev);
            var elemright = textbox.width() + textbox.offset().left;
            if (position.x > elemright - 24) {
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
                        dropbox.slideToggle('fast', function() {
                            dropbox.mCustomScrollbar("update");
                        });
                    });
                }
            }
        });
    });
}

function getPanelWidths() {
    var sourcesweight = (prefs.sourceshidden) ? 0 : 1;
    var playlistweight = (prefs.playlisthidden) ? 0 : 1;
    var browserweight = (prefs.hidebrowser) ? 0 : 1;
    var sourceswidth = prefs.sourceswidthpercent*sourcesweight;
    var playlistwidth = prefs.playlistwidthpercent*playlistweight;
    var browserwidth = (100 - sourceswidth - playlistwidth)*browserweight;
    if (browserwidth < 0) browserwidth = 0;
    return ({infopane: browserwidth, sources: sourceswidth, playlist: playlistwidth});
}

function expandInfo(side) {
    switch(side) {
        case "left":
            var p = !prefs.sourceshidden;
            prefs.save({sourceshidden: p});
            break;
        case "right":
            var p = !prefs.playlisthidden;
            prefs.save({playlisthidden: p});
            break;
    }
    animatePanels();
    return false;
}

function setExpandIcons() {
    var i = (prefs.sourceshidden) ? "icon-angle-double-right" : "icon-angle-double-left";
    $("#expandleft").removeClass("icon-angle-double-right icon-angle-double-left").addClass(i);
    i = (prefs.playlisthidden) ? "icon-angle-double-left" : "icon-angle-double-right";
    $("#expandright").removeClass("icon-angle-double-right icon-angle-double-left").addClass(i);
}

function animatePanels() {
    var widths = getPanelWidths();
    widths.speed = { sources: 400, playlist: 400, infopane: 400 };
    // Ensure that the playlist and playlistcontrols don't get pushed off the edge
    if ($("#playlist").is(':hidden')) {
        var w = $("#infopane").width();
        w -= 12;
        $("#infopane").css({width: w+"px"});
        $("#infopanecontrols").css({width: w+"px"});
    } else {
        var w = $("#playlist").width();
        w -= 12;
        $("#playlist").css({width: w+"px"});
        $("#playlistcontrols").css({width: w+"px"});
    }
    $("#sources").animatePanel(widths);
    $("#sourcescontrols").animatePanel(widths);
    $("#playlist").animatePanel(widths);
    $("#playlistcontrols").animatePanel(widths);
    $("#infopane").animatePanel(widths);
    $("#infopanecontrols").animatePanel(widths);
}

jQuery.fn.animatePanel = function(options) {
    var settings = $.extend({},options);
    var panel = this.attr("id");
    var opanel = panel;
    panel = panel.replace(/controls/,'');
    if (settings[panel] > 0 && this.is(':hidden')) {
        this.show();
    }
    this.animate({width: settings[panel]+"%"},
        {
            duration: settings.speed[panel],
            always: function() {
                if (settings[panel] == 0) {
                    $(this).hide();
                } else {
                    if (opanel == "infopane") browser.rePoint();
                    if (opanel.match(/controls/)) {
                        setExpandIcons();
                        setTopIconSize(["#"+opanel]);
                    }
                }
            }
        }
    );
}

function doThatFunkyThang() {
    var widths = getPanelWidths();
    $("#sources").css("width", widths.sources+"%");
    $("#sourcescontrols").css("width", widths.sources+"%");
    $("#infopane").css("width", widths.infopane+"%");
    $("#infopanecontrols").css("width", widths.infopane+"%");
    $("#playlist").css("width", widths.playlist+"%");
    $("#playlistcontrols").css("width", widths.playlist+"%");
}

function hideBrowser() {
    if (prefs.hidebrowser) {
        prefs.save({playlistwidthpercent: 50, sourceswidthpercent: 50});
    } else {
        prefs.save({playlistwidthpercent: 25, sourceswidthpercent: 25});
    }
    animatePanels();
}

function setTopIconSize(panels) {
    var imw = (parseInt($('.topimg').first().css('margin-left')) +
        parseInt($('.topimg').first().css('margin-right')));
    panels.forEach( function(div) {
        if ($(div).is(':visible')) {
            var icons = $(div+" .topimg");
            var numicons = icons.length;
            var mw = imw*numicons;
            var iw = Math.floor(($(div).width() - mw)/numicons);
            if (iw > 24) iw = 24;
            if (iw < 2) iw = 2;
            icons.css({width: iw+"px", height: iw+"px", "font-size": (iw-2)+"px"});
        }
    });
}

function playlistControlButton(button) {
    if (!$("#playlistbuttons").is(':visible')) {
        togglePlaylistButtons()
    }
    $("#"+button).click();
}

function addCustomScrollBar(value) {
    $(value).mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 300,
        contentTouchScroll: 25,
        mouseWheel: {
            scrollAmount: 40,
        },
        advanced: {
            updateOnContentResize: true,
            updateOnImageLoad: false,
            autoScrollOnFocus: false,
            autoUpdateTimeout: 500,
        }
    });
}

function flashTrack(uri) {
    infobar.markCurrentTrack();
    $('[name="'+uri+'"]').makeFlasher({flashtime: 0.5, repeats: 5});
    // The timeout is so that markCurrentTrack doesn't fuck it up - these often
    // have CSS transitions that affect the scrollbar size
    setTimeout(function() {
        layoutProcessor.scrollCollectionTo($('[name="'+uri+'"]'));
    }, 1000);
}

var layoutProcessor = function() {

    function showPanel(source, callback) {
        if (callback) {
            $('#'+source).fadeIn('fast', callback);
        } else {
            $('#'+source).fadeIn('fast');
        }
        if (source == "radiolist") {
            podcasts.loadList();
            if ($("#yourradiolist").is(':empty')) {
                $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
            }
        }
    }

    return {

        shrinkerRatio: 2.5,
        supportsDragDrop: true,
        hasCustomScrollbars: true,
        usesKeyboard: true,

        afterHistory: function() {
            setTimeout(function() { $("#infopane").mCustomScrollbar("scrollTo",0) }, 500);
        },

        addInfoSource: function(name, obj) {
            $("#chooserbuttons").append($('<i>', {
                onclick: "browser.switchsource('"+name+"')",
                title: language.gettext(obj.text),
                class: obj.icon+' topimg sep fixed',
                id: "button_source"+name
            }));
        },

        setupInfoButtons: function() {
            $("#button_source"+prefs.infosource).addClass("currentbun");
            $("#chooserbuttons .topimg").tipTip({delay: 1000, edgeOffset: 8});
        },

        goToBrowserPanel: function(panel) {
            $("#infopane").mCustomScrollbar('update');
            $("#infopane").mCustomScrollbar("scrollTo","#"+panel+"information");
        },

        goToBrowserPlugin: function(panel) {
            setTimeout( function() { layoutProcessor.goToBrowserPanel(panel) }, 1000);
        },

        goToBrowserSection: function(section) {
            $("#infopane").mCustomScrollbar("scrollTo",section);
        },

        notifyAddTracks: function() { },

        maxPopupSize : function(winsize) {
            return {width: winsize.x - 128, height: winsize.y - 128};
        },

        hidePanel: function(panel, is_hidden, new_state) {
            if (is_hidden != new_state) {
                if (new_state && prefs.chooser == panel) {
                    $("#"+panel).fadeOut('fast');
                    var s = ["albumlist", "searcher", "filelist", "radiolist"];
                    for (var i in s) {
                        if (s[i] != panel && !prefs["hide_"+s[i]]) {
                            switchsource(s[i]);
                            if (s[i] == 'searcher') setSearchLabelWidth();
                            break;
                        }
                    }
                }
                if (!new_state && prefs.chooser == panel) {
                    $("#"+panel).fadeIn('fast');
                }
            }
        },

        setTagAdderPosition: function(position) {
            $("#tagadder").css({top: position.y+8, left: position.x-16});
        },

        setPlaylistHeight: function() {
            var newheight = $("#bottompage").height() - $("#horse").outerHeight();
            if ($("#playlistbuttons").is(":visible")) {
                newheight -= $("#playlistbuttons").outerHeight();
            }
            $("#pscroller").css("height", newheight.toString()+"px");
            $('#pscroller').mCustomScrollbar("update");
        },

        playlistLoading: function() {
        },

        scrollPlaylistToCurrentTrack: function() {
            if (prefs.scrolltocurrent && $('.track[romprid="'+player.status.songid+
                '"],.booger[romprid="'+player.status.songid+'"]').length > 0) {
                $('#pscroller').mCustomScrollbar("stop");
                $('#pscroller').mCustomScrollbar("update");
                var pospixels = Math.round($('div.track[romprid="'+player.status.songid+
                    '"],.booger[romprid="'+player.status.songid+'"]').position().top -
                    ($("#sortable").parent().parent().height()/2));
                if (pospixels < 0) { pospixels = 0 }
                if (pospixels > $("#sortable").parent().height()) {
                    pospixels = $("#sortable").parent().height();
                }
                debug.log("LAYOUT","Scrolling Playlist To Song:",player.status.songid);
                $('#pscroller').mCustomScrollbar(
                    "scrollTo",
                    pospixels,
                    { scrollInertia: 0 }
                );
            }
        },

        scrollCollectionTo: function(jq) {
            debug.log("LAYOUT","Scrolling Collection To",jq,
                jq.position().top,$("#collection").parent().parent().parent().height()/2);
            var pospixels = Math.round(jq.position().top -
                $("#collection").parent().parent().parent().height()/2);
            debug.log("LAYOUT","Scrolling Collection To",pospixels);
            $("#sources").mCustomScrollbar('update').mCustomScrollbar('scrollTo', pospixels,
                { scrollInertia: 1000,
                  scrollEasing: 'easeOut' }
            );
        },

        sourceControl: function(source, callback) {
            if ($('#'+source).length == 0) {
                prefs.save({chooser: 'albumlist'});
                source = 'albumlist';
            }
            if (source != prefs.chooser) {
                $('#'+prefs.chooser).fadeOut('fast', function() {
                    prefs.save({chooser: source});
                    showPanel(source, callback);
                });
            } else {
                showPanel(source, callback);
            }
            return false;
        },

        adjustLayout: function() {
            var ws = getWindowSize();
            // Height of the bottom pane (chooser, info, playlist container)
            var newheight = ws.y - $("#bottompage").offset().top;
            $("#bottompage").css("height", newheight+"px");
            if (newheight < 540) {
                $('.topdropmenu').css('height',newheight+"px");
            } else {
                $('.topdropmenu').css('height', "");
            }
            layoutProcessor.setPlaylistHeight();
            setTopIconSize(["#sourcescontrols", "#infopanecontrols", "#playlistcontrols"]);
            infobar.rejigTheText();
            browser.rePoint();
        },

        fanoogleMenus: function(jq) {
            var avheight = $("#bottompage").height() - 16;
            var conheight = jq.children().first().children('.mCSB_container').height();
            var nh = Math.min(avheight, conheight);
            jq.css({height: nh+"px", "max-height":''});
            jq.mCustomScrollbar("update");
            if (jq.attr("id") == "hpscr") {
                $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
            }
        },

        displayCollectionInsert: function(details) {

            debug.log("COLLECTION","Displaying New Insert",details);

            if (prefs.sortcollectionby == "artist" && $('i[name="aartist'+details.artistindex+'"]').isClosed()) {
                debug.log("COLLECTION","Opening Menu","aartist"+details.artistindex);
                doAlbumMenu(null, $('i[name="aartist'+details.artistindex+'"]'), false, function() {
                    if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
                        debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
                        doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
                            flashTrack(details.trackuri);
                        });
                    } else {
                        flashTrack(details.trackuri);
                    }
                });
            } else if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
                debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
                doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
                    flashTrack(details.trackuri);
                });
            } else {
                flashTrack(details.trackuri);
            }
        },

        initialise: function() {
            if (prefs.outputsvisible) {
                toggleAudioOutputs();
            }
            $("#sortable").disableSelection();
            setDraggable('collection');
            setDraggable('filecollection');
            setDraggable('searchresultholder');
            setDraggable("podcastslist");
            setDraggable("somafmlist");
            setDraggable("bbclist");
            setDraggable("icecastlist");
            setDraggable('artistinformation');
            setDraggable('albuminformation');
            setDraggable('storedplaylists');

            $("#sortable").acceptDroppedTracks({
                scroll: true,
                scrollparent: '#pscroller'
            });
            $("#sortable").sortableTrackList({
                items: '.sortable',
                outsidedrop: playlist.dragstopped,
                insidedrop: playlist.dragstopped,
                scroll: true,
                scrollparent: '#pscroller',
                scrollspeed: 80,
                scrollzone: 120
            });

            $("#pscroller").acceptDroppedTracks({
                ondrop: playlist.draggedToEmpty,
                coveredby: '#sortable'
            });

            $("#yourradiolist").sortableTrackList({
                items: ".menuitem",
                insidedrop: saveRadioOrder,
                scroll: true,
                scrollparent: "#radiolist",
                scrollspeed: 80,
                scrollzone:120,
                allowdragout: true
            });

            $('#sourcesresizer').resizeHandle({
                adjusticons: ['#sourcescontrols', '#infopanecontrols'],
                side: 'left'
            });
            $('#playlistresizer').resizeHandle({
                adjusticons: ['#playlistcontrols', '#infopanecontrols'],
                side: 'right'
            });
            animatePanels();

            $(".topdropmenu").floatingMenu({
                handleClass: 'dragmenu',
                addClassTo: 'configtitle',
                siblings: '.topdropmenu'
            });

            $("#tagadder").floatingMenu({
                handleClass: 'configtitle',
                handleshow: false
            });

            $(".stayopen").click(function(ev) {ev.stopPropagation() });

            $("#volumecontrol").bind('mousedown', function(event){
                event.preventDefault();
                infobar.volumeTouch(event);
                return false;
            }).bind('mousemove', function(event) {
                event.preventDefault();
                infobar.volumeMouseMove(event);
                return false;
            }).bind('mouseup', function(event) {
                event.preventDefault();
                infobar.volumeDragEnd(event);
                return false;
            }).bind('mouseout', function(event) {
                event.preventDefault();
                infobar.volumeTouchEnd(event);
                return false;
            });
            $(".enter").keyup( onKeyUp );
            $.each([ "#sources", "#infopane", "#pscroller", ".topdropmenu", ".drop-box" ],
                function( index, value ) {
                addCustomScrollBar(value);
            });
            shortcuts.load();
            $("#collectionsearcher input").keyup( function(event) {
                if (event.keyCode == 13) {
                    player.controller.search('search');
                }
            } );
            setControlClicks();
            $('.choose_albumlist').click(function(){layoutProcessor.sourceControl('albumlist')});
            $('.choose_searcher').click(function(){layoutProcessor.sourceControl('searcher',
                setSearchLabelWidth)});
            $('.choose_filelist').click(function(){layoutProcessor.sourceControl('filelist')});
            $('.choose_radiolist').click(function(){layoutProcessor.sourceControl('radiolist')});
            $('.choose_playlistslist').click(function(){layoutProcessor.sourceControl('playlistslist')});
            $('.choose_pluginplaylistslist').click(function(){layoutProcessor.sourceControl('pluginplaylistslist')});
            $('.open_albumart').click(openAlbumArtManager);
            $('#love').click(nowplaying.love);
            $('#ban').click(infobar.ban);
            $("#ratingimage").click(nowplaying.setRating);
            $('.icon-rss.npicon').click(function(){podcasts.doPodcast('nppodiput')});
            $('#expandleft').click(function(){expandInfo('left')});
            $('#expandright').click(function(){expandInfo('right')});
            $('.clear_playlist').click(playlist.clear);
            $("#playlistname").parent().next('button').click(player.controller.savePlaylist);

            $(".lettuce,.tooltip").tipTip({delay: 1000, edgeOffset: 8});

            document.body.addEventListener('drop', function(e) {
                e.preventDefault();
            }, false);
            $('#albumcover').on('dragenter', infobar.albumImage.dragEnter);
            $('#albumcover').on('dragover', infobar.albumImage.dragOver);
            $('#albumcover').on('dragleave', infobar.albumImage.dragLeave);
            $("#albumcover").on('drop', infobar.albumImage.handleDrop);

        }
    }
}();

var popupWindow = function() {

    var popup;
    var userheight;
    var wantedwidth;
    var wantedheight;
    var wantshrink;
    var closeCall = null;

    return {
        create:function(w,h,id,shrink,title,xpos,ypos) {
            if (popup == null) {
                popup = document.createElement('div');
                $(popup).addClass("popupwindow");
                $(popup).addClass("dropshadow");
                document.body.appendChild(popup);
            }
            $(popup).empty();
            closeCall = null;
            wantedwidth = w;
            wantedheight = h;
            wantshrink = shrink;
            popup.setAttribute('id',id);
            popup.style.height = 'auto';
            $(popup).append('<div id="cheese"></div>');
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+
                title+
                '</h2></td><td align="right" width="30px">'+
                '<i class="icon-cancel-circled playlisticon clickicon" onclick="popupWindow.close()">'+
                '</i></td></tr></table>');
            $(popup).append('<div id="popupcontents"></div>');
            var winsize = getWindowSize();
            var lsize = layoutProcessor.maxPopupSize(winsize);
            if (lsize.width > w) { lsize.width = w; }
            if (lsize.height > h) { lsize.height = h; }
            if (typeof xpos == "undefined") {
                var x = (winsize.x - lsize.width)/2;
                var y = (winsize.y - lsize.height)/2;
            } else {
                var x = Math.min(xpos, (winsize.x - lsize.width));
                var y = Math.min(ypos, (winsize.y - lsize.height));
            }
            popup.style.width = parseInt(lsize.width) + 'px';
            userheight = lsize.height;
            if (!shrink) {
                popup.style.height = parseInt(lsize.height) + 'px';
            }
            popup.style.top = parseInt(y) + 'px';
            popup.style.left = parseInt(x) + 'px';
        },
        open:function() {
            $(popup).show();
            var calcheight = $(popup).outerHeight(true);
            if (userheight > calcheight) {
                popup.style.height = parseInt(calcheight) + 'px';
                $("#popupcontents").css("height", parseInt(calcheight - $("#cheese").height()) + 'px');
            } else {
                popup.style.height = parseInt(userheight) + 'px';
                $("#popupcontents").css("height", parseInt(userheight - $("#cheese").height()) + 'px');
            }
            addCustomScrollBar("#popupcontents");
        },
        close:function() {
            $(popup).hide();
            if (closeCall) {
                closeCall();
            }
        },
        setsize:function() {
            var winsize = getWindowSize();
            var lsize = layoutProcessor.maxPopupSize(winsize);
            var psize = $("#cheese").outerHeight(true)+$("#popupcontents")
                .children().first().children().first().outerHeight(true)+16;
            if (psize < wantedheight && psize < winsize.y && psize < lsize.height) {
                $(popup).css('height',(psize+16)+"px");
                $("#popupcontents").css('height', $("#popupcontents").children().first()
                    .children().first().outerHeight(true)+"px");
            }
        },
        onClose: function(callback) {
            closeCall = callback;
        }
    };
}();

function doPluginDropStuff(name,attributes,fn) {
    var tracks = new Array();
    $.each($('.selected').filter(removeOpenItems), function (index, element) {
        var uri = unescapeHtml(decodeURIComponent($(element).attr("name")));
        debug.log("DROPPLUGIN","Dragged",uri,"to",name);
        if ($(element).hasClass('directory')) {
            tracks.push({
                uri: decodeURIComponent($(element).children('input').first().attr('name')),
                action: 'geturisfordir',
                attributes: attributes
            });
        } else if ($(element).hasClass('clickalbum')) {
            tracks.push({
                uri: uri,
                action: 'geturis',
                attributes: attributes
            });
        } else {
            tracks.push({
                uri: uri,
                artist: 'dummy',
                title: 'dummy',
                urionly: '1',
                action: 'set',
                attributes: attributes
            });
        }
    });

    (function dotags() {
        var track = tracks.shift();
        if (track) {
            if (track.action == 'geturis' ||
                track.action == 'geturisfordir') {
                $.ajax({
                    url: "backends/sql/userRatings.php",
                    type: "POST",
                    data: track,
                    dataType: 'json',
                    success: function(rdata) {
                        for (var i in rdata) {
                            var u = rdata[i];
                            u = u.replace(/ \"/,'');
                            u = u.replace(/\"$/, '');
                            tracks.push({
                                uri: u,
                                artist: 'dummy',
                                title: 'dummy',
                                urionly: '1',
                                action: 'set',
                                attributes: track.attributes
                            });
                        }
                        dotags();
                    },
                    error: function() {
                        debug.error("DROPPLUGIN","Error looking up track URIs");
                        infobar.notify(infobar.ERROR, "Failed To Set Attributes");
                        dotags();
                    }
                });
            } else {
                $.ajax({
                    url: "backends/sql/userRatings.php",
                    type: "POST",
                    data: track,
                    dataType: 'json',
                    success: function(rdata) {
                        updateCollectionDisplay(rdata);
                        dotags();
                    },
                    error: function(data) {
                        debug.warn("DROPPLUGIN","Failed to set attributes for",track,data);
                        infobar.notify(infobar.ERROR, "Failed To Set Attributes");
                        dotags();
                    }
                });
            }
        } else {
            tracks = null;
            fn(name);
        }
    })();

}

$.widget("rompr.trackdragger", $.ui.mouse, {
    options: {

    },

    _create: function() {
        this.dragging = false;
        this._mouseInit();
    },

    _mouseCapture: function() {
        return true;
    },

    _mouseStart: function(event) {
        var clickedElement = findClickableElement(event);
        if (!clickedElement.hasClass('draggable')) {
            return false;
        }
        this.dragging = true;
        if (!clickedElement.hasClass("selected")) {
            if (clickedElement.hasClass("clickalbum") ||
                clickedElement.hasClass("clickloadplaylist")) {
                albumSelect(event, clickedElement);
            } else if (clickedElement.hasClass("clicktrack") ||
                        clickedElement.hasClass("clickcue") ||
                        clickedElement.hasClass('clickstream')) {
                trackSelect(event, clickedElement);
            }
        }
        this.dragger = $('<div>', {id: 'dragger', class: 'draggable dragsort containerbox vertical dropshadow'}).appendTo('body');
        if ($(".selected").length > 6) {
            this.dragger.append('<div class="containerbox menuitem">'+
                '<div class="smallcover fixed"><i class="icon-music smallcover-svg"></i></div>'+
                '<div class="expand"><h3>'+$(".selected").length+' Items</h3></div>'+
                '</div>');
        } else {
            $(".selected").clone().removeClass("selected").appendTo(this.dragger);
        }
        // Little hack to make dragging from the various tag/rating/playlist managers
        // look prettier
        this.dragger.find('tr').wrap('<table></table>');
        this.dragger.find('.icon-cancel-circled').remove();
        this.drag_x_offset = event.pageX - clickedElement.offset().left;
        var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
        this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
        this.dragger.fadeIn('fast');
        $('.trackacceptor').acceptDroppedTracks('dragstart');
        return true;
    },

    _mouseDrag: function(event) {
        if (this.dragging) {
            var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
            this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
        }
        $('.trackacceptor').each(function() {
            if ($(this).acceptDroppedTracks('checkMouseOver', event)) {
                // Break out of the each loop
                return false;
            }
        });
        return true;
    },

    _mouseStop: function(event) {
        this.dragging = false;
        this.dragger.remove();
        $('.trackacceptor').each(function() {
            if ($(this).acceptDroppedTracks('dragstop', event)) {
                return false;
            }
        });
        return true;
    }

});


$.widget("rompr.acceptDroppedTracks", {
    options: {
        ondrop: null,
        coveredby: null,
        scroll: false,
        scrollparent: ''
    },

    _create: function() {
        this.element.addClass('trackacceptor');
        this.dragger_is_over = false;
    },

    dragstart: function() {
        this.dragger_is_over = false;
        // For custom scrollbars the bounding box needs to be the scrollparent
        var vbox = (this.options.scroll) ? $(this.options.scrollparent) : this.element;
        this.bbox = {
            left:   this.element.offset().left,
            top:    Math.max(vbox.offset().top, this.element.offset().top),
            right:  this.element.offset().left + this.element.width(),
            bottom: Math.min(vbox.offset().top + vbox.height(), this.element.offset().top + this.element.height())
        }
        if (this.options.coveredby !== null) {
            // ONLY works in playlist for sending correct events to correct targets
            this.bbox.top = $(this.options.coveredby).offset().top + $(this.options.coveredby).height();
        }
        if (this.element.hasClass('sortabletracklist')) {
             this.element.sortableTrackList('dragstart');
        }

    },

    dragstop: function(event) {
        debug.log("UITHING","dragstop",this.element.attr("id"));
        if (this.dragger_is_over && this.options.ondrop !== null) {
            debug.log("UITHING","Dropped onto wotsit thingy",this.element.attr("id"));
            this.dragger_is_over = false;
            this.element.removeClass('highlighted');
            this.options.ondrop(event, this.element);
            return true;
        }
        if (this.dragger_is_over && this.element.hasClass('sortabletracklist')) {
            debug.log("UITHING","Dropped ontp sortable tracklist",this.element.attr("id"));
            this.dragger_is_over = false;
            this.element.removeClass('highlighted');
            this.element.sortableTrackList('dropped', event);
            return true;
        }
        this.dragger_is_over = false;
        this.element.removeClass('highlighted');
        return false;
    },

    checkMouseOver: function(event) {
        if (event.pageX > this.bbox.left && event.pageX < this.bbox.right &&
            event.pageY > this.bbox.top && event.pageY < this.bbox.bottom) {
            if (!this.dragger_is_over) {
                this.dragger_is_over = true;
                this.element.addClass('highlighted');
            }
            if (this.dragger_is_over && this.element.hasClass('sortabletracklist')) {
                this.element.sortableTrackList('do_intersect_stuff', event, $("#dragger"));
            }
            return true;
        } else {
            if (this.dragger_is_over) {
                debug.log("UITHING","Dragger is NOT over",this.element.attr("id"));
                this.element.removeClass('highlighted');
                if (this.element.hasClass('sortabletracklist')) {
                    this.element.sortableTrackList('dragleave');
                }
                this.dragger_is_over = false;
            }
            return false;
        }
    }

 });

$.widget("rompr.sortableTrackList", $.ui.mouse, {
    options: {
        items: '',
        outsidedrop: null,
        insidedrop: null,
        scroll: false,
        scrollparent: '',
        scrollspeed: 0,
        scrollzone: 0,
        allowdragout: false
    },

    _create: function() {
        this.element.addClass('sortabletracklist');
        this.helper = null;
        this.dragger = null;
        this.dragging = false;
        this.draggingout = false;
        this._scrollcheck = null;
        this._mouseInit();
    },

    dragstart: function() {
        // For custom scrollbars the bounding box needs to be the scrollparent
        var vbox = (this.options.scroll) ? $(this.options.scrollparent) : this.element;
        this.bbox = {
            left:   this.element.offset().left,
            top:    Math.max(vbox.offset().top, this.element.offset().top),
            right:  this.element.offset().left + this.element.width(),
            bottom: Math.min(vbox.offset().top + vbox.height(), this.element.offset().top + this.element.height())
        }
        if (this.helper) this.helper.remove();
        this.helper = null;
    },

    do_intersect_stuff: function(event, item) {
        // This is vertical sortable lists so we're only gonna care
        // about vertical sorting.
        var self = this;
        clearTimeout(this._scrollcheck);
        this._mouseEvent = event;
        this._item = item;
        var scrolled = this._checkScroll(event);
        this.element.find(this.options.items).each(function() {
            var jq = $(this);
            var bbox = {
                top: jq.offset().top,
                middle: jq.offset().top + jq.height()/2,
                bottom: jq.offset().top + jq.height()
            }
            if (event.pageY > bbox.top && event.pageY <= bbox.middle) {
                // Put a helper above the current item
                self._checkHelper.call(self, item);
                self.helper.detach().insertBefore(jq);
                return false;
            } else if (event.pageY > bbox.middle && event.pageY < bbox.bottom) {
                self._checkHelper.call(self, item);
                self.helper.detach().insertAfter(jq);
                return false;
            }
        });
        if (scrolled) {
            this._scrollcheck = setTimeout($.proxy(this._checkMouseHover, this), 100);
        }

    },

    _checkHelper: function(item) {
        if (this.helper) return true;
        if (this.element.find(this.options.items).first().is('tr')) {
            this.helper = $('<tr>', {
                id: this.element.attr('id')+'_sorthelper',
            });
        } else {
            this.helper = $('<div>', {
                id: this.element.attr('id')+'_sorthelper',
            });
        }
        this.helper.css('height', (item.height()+12)+"px");
        this.helper.attr('class', item.hasClass('draggable') ? 'draggable' : 'something');
        this.helper.empty();
    },

    _checkScroll: function(event) {
        // Custom Scrollbars ONLY
        var scrolled = false;
        if (this.options.scroll) {
            if (event.pageY < this.bbox.top + this.options.scrollzone) {
                $(this.options.scrollparent).mCustomScrollbar('scrollTo', '+='+
                    this.options.scrollspeed, {scrollInertia: 100, scrollEasing: "easeOut"});
                scrolled = true;
            } else if (event.pageY > this.bbox.bottom - this.options.scrollzone) {
                $(this.options.scrollparent).mCustomScrollbar('scrollTo', '-='+
                    this.options.scrollspeed, {scrollInertia: 100, scrollEasing: "easeOut"});
                scrolled = true;
            }
        }
        return scrolled;

    },

    _checkMouseHover: function() {
        this.do_intersect_stuff(this._mouseEvent, this._item);
    },

    dragleave: function() {
        this.helper.remove();
        this.helper = null;
        clearTimeout(this._scrollcheck);
    },

    dropped: function(event) {
        // This is called when something from OUTSIDE the list has been dropped onto us
        debug.log("STL","Dropped",event);
        clearTimeout(this._scrollcheck);
        this.options.outsidedrop(event, this.helper);
    },

    // Local dragging functions

    _findDraggable: function(event) {
        var el = $(event.target);
        while (!el.hasClass(this.options.items.replace(/^\./,'')) && el != this.element) {
            el = el.parent();
        }
        return el;
    },

    _mouseStart: function(event) {
        debug.log("SORTABLE","Mouse Start",event);
        var dragged = this._findDraggable(event);
        this.dragged_original_pos = dragged.prev();
        if (this.dragger) this.dragger.remove();
        this.dragger = dragged.clone().appendTo('body');
        this.dragger.find('.icon-cancel-circled').remove();
        if (this.dragger.is('tr')) {
            this.dragger.wrap('<table></table>');
        }
        this.dragger.css({
            position: 'absolute',
            top: dragged.offset().top + 'px',
            left: dragged.offset().left + 'px',
            width: dragged.width() + 'px'
        });
        this.drag_x_offset = event.pageX - this.dragger.offset().left;
        this.dragger.addClass('dropshadow');
        if (this.helper) this.helper.remove();
        this.helper = null;
        this._checkHelper(dragged);
        this.helper.detach().insertAfter(dragged);
        this.original = dragged.detach();
        this.dragstart();
        this.dragging = true;
        return true;
    },

    _mouseDrag: function(event) {
        clearTimeout(this._scrollcheck);
        if (this.dragging) {
            if ((event.pageX > this.bbox.right || event.pageX < this.bbox.left) &&
                this.options.allowdragout)
            {
                clearTimeout(this._scrollcheck);
                this.dragging = false;
                this.draggingout = true;
                var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
                this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
                this.original.insertAfter(this.dragged_original_pos);
                this.original.addClass('selected');
                this.helper.detach();
                this.dragger.attr('id','dragger');
                this.dragger.addClass('draggable');
                $('.trackacceptor').acceptDroppedTracks('dragstart');
            } else {
                var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
                if (pos.top > this.bbox.top && pos.top < this.bbox.bottom) {
                    this.dragger.css('top',pos.top+'px');
                    if (this.options.allowdragout) {
                        this.dragger.css('left',pos.left+'px');
                    }
                    this.do_intersect_stuff(event, this.dragger);
                }
            }
        } else if (this.draggingout) {
            var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
            this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
            $('.trackacceptor').each(function() {
                if ($(this).acceptDroppedTracks('checkMouseOver', event)) {
                    // Break out of the each loop
                    return false;
                }
            });
        }
        return true;
    },

    _mouseStop: function(event) {
        clearTimeout(this._scrollcheck);
        if (this.dragging) {
            this.dragger.remove();
            this.original.insertAfter(this.helper);
            this.helper.remove();
            this.helper = null;
            this.dragging = false;
            if (this.options.insidedrop) {
                this.options.insidedrop(event, this.original);
            }
        } else if (this.draggingout) {
            debug.log("STL","Dragged out and onto something else");
            this.dragger.remove();
            this.draggedout = false;
            if (this.helper) this.helper.remove();
            this.helper = null;
            $('.trackacceptor').each(function() {
                if ($(this).acceptDroppedTracks('dragstop', event)) {
                    return false;
                }
            });
        }
        return true;
    }
});

function dropProcessor(evt, imgobj, imagekey, success, fail) {

    evt.stopPropagation();
    evt.preventDefault();
    if (evt.dataTransfer.types) {
        for (var i in evt.dataTransfer.types) {
            type = evt.dataTransfer.types[i];
            debug.log("ALBUMART","Checking...",type);
            var data = evt.dataTransfer.getData(type);
            switch (type) {

                case "text/html":       // Image dragged from another browser window (Chrome and Firefox)
                    var srces = data.match(/src\s*=\s*"(.*?)"/);
                    if (srces && srces[1]) {
                        src = srces[1];
                        debug.log("ALBUMART","Image Source",src);
                        imgobj.removeClass('nospin notexist notfound').addClass('spinner notexist');
                        if (src.match(/image\/.*;base64/)) {
                            debug.log("ALBUMART","Looks like Base64");
                            // For some reason I no longer care about, doing this with jQuery.post doesn't work
                            var formData = new FormData();
                            formData.append('base64data', src);
                            formData.append('key', imagekey);
                            var xhr = new XMLHttpRequest();
                            xhr.open('POST', 'getalbumcover.php');
                            xhr.responseType = "json";
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    success(xhr.response);
                                } else {
                                    fail();
                                }
                            };
                            xhr.send(formData);
                        } else {
                            $.ajax({
                                url: "getalbumcover.php",
                                type: "POST",
                                data: { key: imagekey,
                                        src: src
                                },
                                cache:false,
                                success: success,
                                error: fail,
                            });
                        }
                        return false;
                    }
                    break;

                case "Files":       // Local file upload
                    debug.log("ALBUMART","Found Files");
                    var files = evt.dataTransfer.files;
                    if (files[0]) {
                        imgobj.removeClass('nospin notexist notfound').addClass('spinner notexist');
                        // For some reason I no longer care about, doing this with jQuery.post doesn't work
                        var formData = new FormData();
                        formData.append('ufile', files[0]);
                        formData.append('key', imagekey);
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', 'getalbumcover.php');
                        xhr.responseType = "json";
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                success(xhr.response);
                            } else {
                                fail();
                            }
                        };
                        xhr.send(formData);
                        return false;
                    }
                    break;
            }

        }
    }
    // IF we get here, we didn't find anything. Let's try the basic text,
    // which might give us something if we're lucky.
    // Safari returns a plethora of MIME types, but none seem to be useful.
    var data = evt.dataTransfer.getData('Text');
    var src = data;
    debug.log("ALBUMART","Trying last resort methods",src);
    if (src.match(/^http:\/\//)) {
        debug.log("ALBUMART","Appears to be a URL");
        var u = src.match(/images.google.com.*imgurl=(.*?)&/)
        if (u && u[1]) {
            src = u[1];
            debug.log("ALBUMART","Found possible Google Image Result",src);
        }
        $.ajax({
            url: "getalbumcover.php",
            type: "POST",
            data: { key: imagekey,
                    src: src
            },
            cache:false,
            success: success,
            error: fail,
        });
    }
    return false;
}
