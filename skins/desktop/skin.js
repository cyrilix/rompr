function toggleSearch() {
    if (prefs.hide_albumlist) {
        layoutProcessor.sourceControl("albumlist", grrAnnoyed);
        ihatefirefox();
        return false;
    }
    if ($("#albumlist").is(':visible')) {
        if (albumScrollOffset < 20) {
            $("#search").slideToggle({duration: 'fast', start: setSearchLabelWidth});
        } else {
            $("#search").slideDown({duration: 'fast', start: setSearchLabelWidth});
        }
    } else {
        layoutProcessor.sourceControl("albumlist", grrAnnoyed);
    }
    $('#sources').mCustomScrollbar("scrollTo", 0, {scrollInertia:200});
    albumScrollOffset = 0;
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
            $('#sources').mCustomScrollbar("scrollTo", '#fothergill', {scrollInertia:200});
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
    if (settings[panel] > 0) {
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

function setBottomPaneSize() {
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

var shortcuts = function() {

    var hotkeys = { button_next: "Right",
                    button_previous: "Left",
                    button_stop: "Space",
                    button_play: "P",
                    button_volup: "Up",
                    button_voldown: "Down",
                    button_skipforward: "]",
                    button_skipbackward: "[",
                    button_clearplaylist: "C",
                    button_stopafter: "F",
                    button_random: "S",
                    button_crossfade: "X",
                    button_repeat: "R",
                    button_consume: "E",
                    button_rateone: "1",
                    button_ratetwo: "2",
                    button_ratethree: "3",
                    button_ratefour: "4",
                    button_ratefive: "5",
                    button_togglesources: ",",
                    button_toggleplaylist: ".",
                    config_hidebrowser: "H",
                    button_updatecollection: "U",
                    button_nextsource: "I",
    };

    if (typeof playlist !== "undefined") {

        var bindings = { button_next: playlist.next,
                        button_previous: playlist.previous,
                        button_stop: player.controller.stop,
                        button_play: infobar.playbutton.clicked,
                        button_volup: function() { infobar.volumeKey(5) },
                        button_voldown: function() { infobar.volumeKey(-5) },
                        button_skipforward: function() { player.skip(10) },
                        button_skipbackward: function() { player.skip(-10) },
                        button_clearplaylist: playlist.clear,
                        button_stopafter: playlist.stopafter,
                        button_random: function() { playlistControlButton('random') },
                        button_crossfade: function() { playlistControlButton('crossfade') },
                        button_repeat: function() { playlistControlButton('repeat') },
                        button_consume: function() { playlistControlButton('consume') },
                        button_rateone: function() { nowplaying.setRating(1) },
                        button_ratetwo: function() { nowplaying.setRating(2) },
                        button_ratethree: function() { nowplaying.setRating(3) },
                        button_ratefour: function() { nowplaying.setRating(4) },
                        button_ratefive: function() { nowplaying.setRating(5) },
                        button_togglesources: function() { expandInfo('left') },
                        button_toggleplaylist: function() { expandInfo('right') },
                        config_hidebrowser: function() { $("#hidebrowser").attr("checked", !$("#hidebrowser").is(':checked')); prefs.save({hidebrowser: $("#hidebrowser").is(':checked')}, hideBrowser) },
                        button_updatecollection: function(){ checkCollection(true, false) },
                        button_nextsource: function() { browser.nextSource(1) }
        };

    }

    function format_keyinput(inpname, hotkey) {
        if (hotkey === null) hotkey = "";
        return '<input id="'+inpname+'" class="tleft buttonchange" type="text" size="16" value="'+hotkey+'"></input>';
    }

    function format_clearbutton(inpname) {
        return '<td><i class="icon-cancel-circled playlisticon clickicon buttonclear" name="'+inpname+'"></i></td>';
    }

    return {

        load: function() {
            debug.shout("SHORTCUTS","Loading Key Bindings");
            $(window).unbind('keydown');
            for (var i in hotkeys) {
                if (localStorage.getItem('hotkeys.'+i) !== null) {
                    hotkeys[i] = localStorage.getItem('hotkeys.'+i);
                }
                if (hotkeys[i] !== "" && bindings[i]) {
                    debug.log("SHORTCUTS","Binding Key For",i);
                    $(window).bind('keydown', hotkeys[i], bindings[i]);
                }
            }
        },

        edit: function() {
            $("#configpanel").slideToggle('fast');
            var keybpu = popupWindow.create(400,600,"keybpu",true,language.gettext("title_keybindings"));
            $("#popupcontents").append('<table align="center" cellpadding="2" id="keybindtable" width="90%"></table>');
            for (var i in hotkeys) {
                $("#keybindtable").append('<tr><td width="50%" align="right">'+language.gettext(i).initcaps()+'</td><td>'+format_keyinput(i, hotkeys[i])+'</td>'+format_clearbutton(i)+'</tr>');
            }
            $(".buttonchange").keydown( shortcuts.change );
            $(".buttonclear").click( shortcuts.remove );
            popupWindow.open();
        },

        change: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            $(ev.target).val(KeyCode.hot_key(KeyCode.translate_event(ev)));
            shortcuts.save()
        },

        remove: function(ev) {
            var n = $(ev.target).attr("name");
            $("#"+n).val('');
            shortcuts.save();
        },

        save: function() {
            $("#keybindtable").find(".buttonchange").each(function() {
                var k = $(this).val();
                var n = $(this).attr("id");
                hotkeys[n] = k;
                localStorage.setItem('hotkeys.'+n, k);
            });
            shortcuts.load();
        },

        add: function(name, binding) {
            hotkeys[name] = "";
            bindings[name] = binding;
        }
    }

}();

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
        theme: (prefs.theme == "Light.css" || prefs.theme == "BrushedAluminium.css" || prefs.theme == "Aqua.css") ? "dark-thick" : "light-thick",
        scrollInertia: 80,
        contentTouchScroll: true,
        advanced: {
            updateOnContentResize: true,
            autoScrollOnFocus: false
        },
        callbacks: {
            whileScrolling: function(){ playlistScrolled(this); }
        }
    });
}

function initUI() {
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
                $(this).mCustomScrollbar("update");
                if ($(this).attr("id") == "hpscr") {
                    $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
                }
            }
        });
    });

    $(".stayopen").click(function(ev) {ev.stopPropagation() });

    shortcuts.load();
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
    obj.addEventListener('mouseout', function(event) {
        infobar.volumeTouchEnd(event);
    }, false);
    $(".enter").keyup( onKeyUp );
    $(".lettuce,.tooltip").tipTip({delay: 1000, edgeOffset: 8});
    $.each([ "#sources", "#infopane", "#pscroller", ".topdropmenu", ".drop-box" ], function( index, value ) {
        addCustomScrollBar(value);
    });

    $("#mopidysearcher input").keyup( function(event) {
        if (event.keyCode == 13) {
            player.controller.search('search');
        }
    } );

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

        afterHistory: function() {
            setTimeout(function() { $("#infopane").mCustomScrollbar("scrollTo",0) }, 500);
        },

        addInfoSource: function(name, obj) {
            $("#chooserbuttons").append($('<i>', {
                onclick: "browser.switchsource('"+name+"')",
                title: language.gettext(obj.text),
                class: obj.icon+' topimg sep dildo fixed',
                id: "button_source"+name
            }));
        },

        setupInfoButtons: function() {
            $("#button_source"+prefs.infosource).addClass("currentbun");
            $(".dildo").tipTip({delay: 1000, edgeOffset: 8});
        },

        goToBrowserPanel: function(panel) {
            $("#infopane").mCustomScrollbar('update');
            var sp = $("#"+panel+"information").position();
            $("#infopane").mCustomScrollbar("scrollTo",sp.top);
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
        }
    }

}();
