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
        sourcecontrol("albumlist");
        $("#search").show();
        return false;
    }
    if ($("#albumlist").is(':visible')) {
        if (albumScrollOffset < 20) {
            $("#search").slideToggle('fast');
        } else {
            $("#search").slideDown('fast');
        }
    } else {
        sourcecontrol("albumlist");
        $("#search").slideDown('fast');
    }
    $('#sources').mCustomScrollbar("scrollTo", 0, {scrollInertia:20});
    albumScrollOffset = 0;
    return false;
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
    if (prefs.hidebrowser) {
        prefs.save({playlistwidthpercent: 25, sourceswidthpercent: 25});
    }
    prefs.save({hidebrowser: !prefs.hidebrowser});
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
    if (togo) {
        if ($("#"+togo).is(':visible')) {
            $("#"+togo).fadeOut(200, function() { switchsource(source) });
        } else {
            switchsource(source);
        }
    } else {
        prefs.save({chooser: source});
        $("#"+source).fadeIn(200);
    }
}

function loadKeyBindings() {
    $.getJSON("getkeybindings.php")
        .done(function(data) {
            shortcut.add(getHotKey(data['nextrack']),    function(){ playlist.next() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['prevtrack']),   function(){ playlist.previous() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['stop']),        function(){ player.controller.stop() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['play']),        function(){ infobar.playbutton.clicked() }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumeup']),    function(){ infobar.volumeKey(5) }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumedown']),  function(){ infobar.volumeKey(-5) }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['closewindow']), function(){ window.open(location, '_self').close() }, {'disable_in_input':true} );

        })
        .fail( function(data) {  });
}

function getHotKey(st) {
    var bits = st.split("+++");
    return bits[0];
}

function getHotKeyDisplay(st) {
    debug.log("HOTKEY","Display passed is ",st);
    var bits = st.split("+++");
    return bits[1];
}

function editkeybindings() {

    debug.log("GENERAL", "Editing Key Bindings");

    $("#configpanel").slideToggle('fast');

    $.getJSON("getkeybindings.php")
        .done(function(data) {
            var keybpu = popupWindow.create(500,400,"keybpu",true,language.gettext("title_keybindings"));
            $("#popupcontents").append('<table align="center" cellpadding="4" id="keybindtable" width="80%"></table>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_next")+'</td><td>'+format_keyinput('nextrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_previous")+'</td><td>'+format_keyinput('prevtrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_stop")+'</td><td>'+format_keyinput('stop', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_play")+'</td><td>'+format_keyinput('play', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_volup")+'</td><td>'+format_keyinput('volumeup', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_voldown")+'</td><td>'+format_keyinput('volumedown', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_closewindow")+'</td><td>'+format_keyinput('closewindow', data)+'</td></tr>');

            $("#keybindtable").append('<tr><td colspan="2"><button style="width:8em" class="tleft topformbutton" onclick="popupWindow.close()">'+language.gettext("button_cancel")+'</button>'+
                                        '<button  style="width:8em" class="tright topformbutton" onclick="saveKeyBindings()">'+language.gettext("button_OK")+'</button></td></tr>');

            $(".buttonchange").keydown( function(ev) { changeHotKey(ev) } );
            popupWindow.open();
        })
        .fail( function() { alert("Failed To Read Key Bindings!") });

}

function format_keyinput(inpname, data) {
    return '<input id="'+inpname+'" class="tleft sourceform buttonchange" type="text" size="10" value="'+getHotKeyDisplay(data[inpname])+'"></input>' +
            '<input name="'+inpname+'" class="buttoncode" type="hidden" value="'+getHotKey(data[inpname])+'"></input>';
}

function changeHotKey(ev) {

    var key = ev.which;
    debug.log("HOTKEY", "pressed code was",key);
    // Ignore Shift, Ctrl, Alt, and Meta
    if (key == 17 || key == 18 || key == 19 || key == 224) {
        return true;
    }

    ev.preventDefault();
    ev.stopPropagation();
    var source = $(ev.target).attr("id");

    var special_keys = {
        9: 'tab',
        32: 'space',
        13: 'return',
        8: 'backspace',
        145: 'scrolllock',
        20: 'capslock',
        144: 'numlock',
        19: 'pause',
        45: 'insert',
        36: 'home',
        46: 'delete',
        35: 'end',
        33: 'pageup',
        34: 'pagedown',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        112: 'f1',
        113: 'f2',
        114: 'f3',
        115: 'f4',
        116: 'f5',
        117: 'f6',
        118: 'f7',
        119: 'f8',
        120: 'f9',
        121: 'f10',
        122: 'f11',
        123: 'f12',
    }

    var keystring = special_keys[key] || String.fromCharCode(key).toUpperCase();

    if (ev.shiftKey) { keystring = "Shift+"+keystring };
    if (ev.metaKey) { keystring = "Meta+"+keystring };
    if (ev.ctrlKey) { keystring = "Ctrl+"+keystring };
    if (ev.altKey) { keystring = "Alt+"+keystring };

    var keydisplay = KeyCode.hot_key(KeyCode.translate_event(ev));

    $("#"+source).attr("value", keydisplay);
    $('input[name="'+source+'"]').attr("value", keystring);
}

function saveKeyBindings() {

    var bindings = new Object;
    $.getJSON("getkeybindings.php")
        .done(function(data) {
            debug.log("GENERAL","Clearing Key Bindings");
            $.each(data, function(i, v) { shortcut.remove(v)});
            $(".buttonchange").each( function(i) {
                bindings[$(this).attr("id")] = $(this).attr("value");
            });
            $(".buttoncode").each( function(i) {
                bindings[$(this).attr("name")] = $(this).attr("value")+"+++"+bindings[$(this).attr("name")];
            });

            $.post("savekeybindings.php", bindings, function() {
                loadKeyBindings();
                popupWindow.close();
            });
        })
        .fail( function(data) {  });
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

    loadKeyBindings();
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
    $.each([ "#sources", "#infopane", "#pscroller", "#lpscr", "#configpanel", "#hpscr", "#searchscr", ".drop-box" ], function( index, value ) {
        addCustomScrollBar(value);
    });
}
