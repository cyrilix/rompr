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
        var textbox = $('<input>', { type: "text", class: tbc, name: settings.textboxname }).appendTo(holder);
        var dropbox = $('<div>', {class: "drop-box tagmenu dropshadow"}).appendTo(holder);
        var menucontents = $('<div>', {class: "tagmenu-contents"}).appendTo(dropbox);
        if (settings.buttontext !== null) {
            var submitbutton = $('<button>', {class: "fixed"+settings.buttonclass, style: "margin-left: 8px"}).appendTo($(this));
            submitbutton.html(settings.buttontext);
            if (settings.buttonfunc) {
                submitbutton.click(function() {
                    settings.buttonfunc(textbox.val());
                });
            }
        }

        dropbox.mCustomScrollbar({
            theme: "light-thick",
            scrollInertia: 80,
            contentTouchScroll: true,
            advanced: {
                updateOnContentResize: true,
            }
        });

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

function toggleSearch() {
    if (prefs.hide_albumlist) {
        layoutProcessor.sourceControl("albumlist", grrAnnoyed);
        ihatefirefox();
        return false;
    }
    var albumScrollOffset = $("#sources .mCSB_container").position().top;
    if ($("#albumlist").is(':visible')) {
        if (albumScrollOffset > -90) {
            $("#search").slideToggle({duration: 'fast', start: setSearchLabelWidth});
        } else {
            $("#search").slideDown({duration: 'fast', start: setSearchLabelWidth});
        }
    } else {
        layoutProcessor.sourceControl("albumlist", grrAnnoyed);
    }
    $('#sources').mCustomScrollbar("scrollTo", 0, {scrollInertia:200});
    ihatefirefox();
    return false;
}

function grrAnnoyed() {
    $("#search").slideDown({duration: 'fast', start: setSearchLabelWidth});
}

function doSomethingClever() {
    if ($("#albumlist").is(':hidden')) {
        layoutProcessor.sourceControl("albumlist");
        if ($("#search").is(':visible')) {
            $("#search").slideToggle('fast');
        }
    } else {
        if ($("#search").is(':visible')) {
            $('#sources').mCustomScrollbar("scrollTo", $('#fothergill').prev().position().top, {scrollInertia:200});
        }
    }
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
    var imw = (parseInt($('.topimg').first().css('margin-left')) + parseInt($('.topimg').first().css('margin-right')));
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

function srDrag(event, ui) {
    var size = getWindowSize();
    if (ui.offset.left < 120) { ui.offset.left = 120; }
    prefs.sourceswidthpercent = ((ui.offset.left+8)/size.x)*100;
    if (prefs.sourceswidthpercent + prefs.playlistwidthpercent > 100 || prefs.hidebrowser) {
        prefs.playlistwidthpercent = 100 - prefs.sourceswidthpercent;
    }
    doThatFunkyThang();
    setTopIconSize(["#sourcescontrols", "#infopanecontrols"]);
    $(this).data('draggable').position.left = 0;
}

function srDragStop(event, ui) {
    setTopIconSize(["#sourcescontrols", "#infopanecontrols", "#playlistcontrols"]);
    browser.rePoint();
    prefs.save({sourceswidthpercent: prefs.sourceswidthpercent});
    prefs.save({playlistwidthpercent: prefs.playlistwidthpercent});
}

function prDrag(event, ui) {
    var size = getWindowSize();
    if ((size.x - ui.offset.left) < 120) { ui.offset.left = size.x - 120; }
    prefs.playlistwidthpercent = (((size.x - ui.offset.left))/size.x)*100;
    if (prefs.sourceswidthpercent + prefs.playlistwidthpercent > 100 || prefs.hidebrowser) {
        prefs.sourceswidthpercent = 100 - prefs.playlistwidthpercent;
    }
    doThatFunkyThang();
    setTopIconSize(["#infopanecontrols", "#playlistcontrols"]);
    $(this).data('draggable').position.left = 0;
}

function prDragStop(event, ui) {
    setTopIconSize(["#sourcescontrols", "#infopanecontrols", "#playlistcontrols"]);
    browser.rePoint();
    prefs.save({sourceswidthpercent: prefs.sourceswidthpercent});
    prefs.save({playlistwidthpercent: prefs.playlistwidthpercent})
}

function addCustomScrollBar(value) {
    $(value).mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 80,
        contentTouchScroll: true,
        advanced: {
            updateOnContentResize: true,
            autoScrollOnFocus: false
        }
    });
}

var layoutProcessor = function() {

    function switchsource(source) {

        var togo = sources.shift();
        if (togo && typeof togo != "function") {
            if ($("#"+togo).is(':visible')) {
                $("#"+togo).fadeOut(200, function() { switchsource(source) });
            } else {
                switchsource(source);
            }
        } else {
            prefs.save({chooser: source});
            if (typeof togo == "function") {
                $("#"+source).fadeIn(200, togo);
            } else {
                $("#"+source).fadeIn(200);
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
                    var s = ["albumlist", "filelist", "radiolist"];
                    for (var i in s) {
                        if (s[i] != panel && !prefs["hide_"+s[i]]) {
                            switchsource(s[i]);
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
            var newheight = $("#bottompage").height() - $("#horse").height();
            if ($("#playlistbuttons").is(":visible")) {
                newheight -= $("#playlistbuttons").height();
            }
            $("#pscroller").css("height", newheight.toString()+"px");
            $('#pscroller').mCustomScrollbar("update");
        },

        playlistLoading: function() {
            if ($("#lpscr").is(':visible')) {
                $("#lpscr").slideToggle('fast');
            }
            if ($("#ppscr").is(':visible')) {
                $("#ppscr").slideToggle('fast');
            }
        },

        scrollPlaylistToCurrentTrack: function() {
            $('#pscroller').mCustomScrollbar(
                "scrollTo",
                $('div.track[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2,
                { scrollInertia: 0 }
            );
        },

        sourceControl: function(source, callback) {
            sources = ["albumlist", "filelist", "radiolist"];
            if (callback) {
                sources.push(callback);
            }
            for(var i in sources) {
                if (sources[i] == source) {
                    sources.splice(i, 1);
                    break;
                }
            }
            switchsource(source);
            return false;
        },

        adjustLayout: function() {
            var ws = getWindowSize();
            // x-position of the notification rollup
            var notpos = ws.x - 340;
            $("#notifications").css("left", notpos+"px");
            // Width of the nowplaying area
            var lp = ws.x - $("#patrickmoore").prev().offset().left - $("#patrickmoore").prev().outerWidth(true) - 16;
            $('#patrickmoore').css("width", lp+"px");
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

        initialise: function() {
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
                items: ".clickradio,.clickstream",
                axis: "y",
                containment: "#yourradiolist",
                scroll: true,
                scrollSpeed: 10,
                tolerance: 'pointer',
                stop: saveRadioOrder
            });

            setDraggable('collection');
            setDraggable('filecollection');
            setDraggable('search');
            setDraggable('filesearch');
            setDraggable("podcastslist");
            setDraggable('artistinformation');
            setDraggable('albuminformation');
            setDraggable('storedplaylists');

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
            animatePanels();
            $(".topdrop").click(function(ev) {
                var ours = $(this)[0];
                $('.topdropmenu').each(function() {
                    if ($(this).is(':visible') && $(this).parent()[0] != ours) {
                        $(this).slideToggle('fast');
                    }
                });
                $(this).find('.topdropmenu').slideToggle('fast', function() {
                    if ($(this).is(':visible')) {
                        var avheight = $("#bottompage").height() - 16;
                        var conheight = $(this).children().first().children('.mCSB_container').height();
                        var nh = Math.min(avheight, conheight);
                        $(this).css({height: nh+"px", "max-height":''});
                        $(this).mCustomScrollbar("update");
                        if ($(this).attr("id") == "hpscr") {
                            $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
                        }
                    } else {
                        $(this).css({left: "", top: ""});
                    }
                });
            });

            $(".topdropmenu").each(function() {$(this).find('.configtitle').first().addClass('dragmenu').append('<i class="icon-cancel-circled playlisticonr tright clickicon closemenu"></i>') });

            $(".closemenu").click(function() {$(this).parent().parent().parent().parent().prev().click() });

            $(".topdropmenu").draggable({
                containment: 'body',
                handle: '.configtitle'
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
            $.each([ "#sources", "#infopane", "#pscroller", ".topdropmenu", ".drop-box" ], function( index, value ) {
                addCustomScrollBar(value);
            });
            shortcuts.load();
            $("#mopidysearcher input").keyup( function(event) {
                if (event.keyCode == 13) {
                    player.controller.search('search');
                }
            } );
            if (prefs.hide_albumlist) {
                $("#search").show({complete: setSearchLabelWidth});
                ihatefirefox();
            }
            setControlClicks();
            $('.choose_albumlist').click(doSomethingClever);
            $('.choose_searcher').click(toggleSearch);
            $('.choose_filelist').click(function(){layoutProcessor.sourceControl('filelist')});
            $('.choose_radiolist').click(function(){layoutProcessor.sourceControl('radiolist')});
            $('.open_albumart').click(openAlbumArtManager);
            $('#love').click(nowplaying.love);
            $('#ban').click(infobar.ban);
            $("#ratingimage").click(nowplaying.setRating);
            $('.icon-rss.npicon').click(function(){podcasts.doPodcast('nppodiput')});
            $('#expandleft').click(function(){expandInfo('left')});
            $('#expandright').click(function(){expandInfo('right')});
            $('.clear_playlist').click(playlist.clear);
            $("#playlistname").parent().next('button').click(player.controller.savePlaylist);
            $(".choose_filesearch").click(toggleFileSearch);

            $(".lettuce,.tooltip").tipTip({delay: 1000, edgeOffset: 8});
        }
    }
}();
