
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
    doThatFunkyThang();
    return false;
}

function toggleSearch() {
    if (prefs.hide_albumlist) {
        sourcecontrol("albumlist", grrAnnoyed);
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
        sourcecontrol("albumlist", grrAnnoyed);
    }
    $('#sources').mCustomScrollbar("scrollTo", 0, {scrollInertia:20});
    albumScrollOffset = 0;
    ihatefirefox();
    return false;
}

function grrAnnoyed() {
    $("#search").slideDown({duration: 'fast', start: setSearchLabelWidth});
}

function ihatefirefox() {
    if (prefs.search_limit_limitsearch) {
        $("#mopidysearchdomains").show();
    } else {
        $("#mopidysearchdomains").hide();
    }
}

function doThatFunkyThang() {
    var sourcesweight = (prefs.sourceshidden) ? 0 : 1;
    var playlistweight = (prefs.playlisthidden) ? 0 : 1;
    var browserweight = (prefs.hidebrowser) ? 0 : 1;

    var browserwidth = (100 - (prefs.playlistwidthpercent*playlistweight) - (prefs.sourceswidthpercent*sourcesweight))*browserweight;
    var sourceswidth = (100 - (prefs.playlistwidthpercent*playlistweight) - browserwidth)*sourcesweight;
    var playlistwidth = (100 - sourceswidth - browserwidth)*playlistweight;

    $("#sources").css("width", sourceswidth.toString()+"%");
    $("#albumcontrols").css("width", sourceswidth.toString()+"%");
    $("#playlist").css("width", playlistwidth.toString()+"%");
    $("#playlistcontrols").css("width", playlistwidth.toString()+"%");
    $("#infopane").css("width", browserwidth.toString()+"%");
    $("#infocontrols").css("width", browserwidth.toString()+"%");

    if (prefs.sourceshidden != $("#sources").is(':hidden')) {
        $("#sources").toggle("fast");
        $("#albumcontrols").toggle("fast");
    }

    if (prefs.playlisthidden != $("#playlist").is(':hidden')) {
        $("#playlist").toggle("fast");
        $("#playlistcontrols").toggle("fast");
    }

    if (prefs.hidebrowser != $("#infopane").is(':hidden')) {
        $("#infopane").toggle("fast");
        $("#infocontrols").toggle("fast");
        if (prefs.hidebrowser) {
            $("#sourcesresizer").hide();
        } else {
            $("#sourcesresizer").show();
        }
    }

    var i = (prefs.sourceshidden) ? ipath+"arrow-right-double.png" : ipath+"arrow-left-double.png";
    $("#expandleft").attr("src", i);
    i = (prefs.playlisthidden) ? ipath+"arrow-left-double.png" : ipath+"arrow-right-double.png";
    $("#expandright").attr("src", i);
    browser.rePoint();
}

function hideBrowser() {
    if (!prefs.hidebrowser) {
        prefs.save({playlistwidthpercent: 25, sourceswidthpercent: 25});
    }
    doThatFunkyThang();
}

function setBottomPaneSize() {
    var ws = getWindowSize();
    // x-position of the notification rollup
    var notpos = ws.x - 340;
    $("#notifications").css("left", notpos.toString()+"px");
    // Width of the nowplaying area
    var lp = ws.x - 328;
    $('#patrickmoore').css("width", lp.toString()+"px");
    // Height of the bottom pane (chooser, info, playlist container)
    var newheight = ws.y - 148;
    // Make sure the dropdown menus don't overflow the window
    // They have max-height as 500 in the css.
    if (newheight < 500) {
        $('ul.subnav').each(function() {
            if ($(this).height() > newheight) {
                $(this).css('height', newheight.toString()+"px");
            }
        });
    } else {
        $('ul.subnav').css('height', "");
    }
    $("#bottompage").css("height", newheight.toString()+"px");
    newheight = null;
    playlist.setHeight();
    infobar.rejigTheText();
    browser.rePoint();
}

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

var shortcuts = function() {

    var hotkeys = { button_next: "Right",
                    button_previous: "Left",
                    button_stop: "Space",
                    button_play: "P",
                    button_volup: "Up",
                    button_voldown: "Down",
                    button_closewindow: "Escape",
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

    var bindings = { button_next: playlist.next,
                    button_previous: playlist.previous,
                    button_stop: player.controller.stop,
                    button_play: infobar.playbutton.clicked,
                    button_volup: function() { infobar.volumeKey(5) },
                    button_voldown: function() { infobar.volumeKey(-5) },
                    button_closewindow: function() { window.open(location, '_self').close() },
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

    function format_keyinput(inpname, hotkey) {
        if (hotkey === null) hotkey = "";
        return '<input id="'+inpname+'" class="tleft sourceform buttonchange" type="text" size="16" value="'+hotkey+'"></input>';
    }

    function format_clearbutton(inpname) {
        return '<td><img class="clickicon buttonclear" name="'+inpname+'" src="'+ipath+'edit-delete.png"></td>';
    }

    return {

        load: function() {
            debug.shout("SHORTCUTS","Loading Key Bindings");
            $(document).unbind('keydown');
            for (var i in hotkeys) {
                if (localStorage.getItem('hotkeys.'+i) !== null) {
                    hotkeys[i] = localStorage.getItem('hotkeys.'+i);
                }
                if (hotkeys[i] !== "" && bindings[i]) {
                    debug.log("SHORTCUTS","Binding Key For",i);
                    $(document).bind('keydown', hotkeys[i], bindings[i]);
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
    doThatFunkyThang();
    $(this).data('draggable').position.left = 0;
}

function srDragStop(event, ui) {
    prefs.save({sourceswidthpercent: prefs.sourceswidthpercent});
}

function prDrag(event, ui) {
    var size = getWindowSize();
    if ((size.x - ui.offset.left) < 120) { ui.offset.left = size.x - 120; }
    prefs.playlistwidthpercent = (((size.x - ui.offset.left))/size.x)*100;
    doThatFunkyThang();
    $(this).data('draggable').position.left = 0;
}

function prDragStop(event, ui) {
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
    doThatFunkyThang();
    $("ul.topnav li a").click(function() {
        $(this).parent().find("ul.subnav").slideToggle('fast', function() {
            if ($(this).is(':visible')) {
                $(this).mCustomScrollbar("update");
                if ($(this).attr("id") == "hpscr") {
                    $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
                }
            }
        });
        return false;
    });

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
    $.each([ "#sources", "#infopane", "#pscroller", "#lpscr", "#configpanel", "#hpscr", "#searchscr", ".drop-box", "#plscr", "#ppscr" ], function( index, value ) {
        addCustomScrollBar(value);
    });

    $("#mopidysearcher input").keyup( function(event) {
        if (event.keyCode == 13) {
            player.controller.search('search');
        }
    } );

}
