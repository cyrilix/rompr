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
                    debug.log("SHORTCUTS","Binding Key",hotkeys[i],"For",i);
                    $(window).bind('keydown', hotkeys[i], bindings[i]);
                }
            }
        },

        edit: function() {
            $("#configpanel").slideToggle('fast');
            var keybpu = popupWindow.create(400,1024,"keybpu",true,language.gettext("title_keybindings"));
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
            var key = KeyCode.hot_key(KeyCode.translate_event(ev));
            for (var name in hotkeys) {
                if (hotkeys[name] == key) {
                    infobar.notify(infobar.ERROR, "Key '"+key+"' is already used by '"+language.gettext(name)+"'");
                    return false;
                }
            }
            $(ev.target).val(key);
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

        add: function(name, binding, hotkey) {
            for (var nom in hotkeys) {
                if (hotkeys[nom] == hotkey) {
                    debug.warn("HOTKEYS","Plugin trying to add hotkey",hotkey,"for",name,"but this already used by",nom);
                    hotkey = "";
                }
            }
            hotkeys[name] = hotkey;
            bindings[name] = binding;
        }
    }

}();
