var starRadios = function() {

	var running = false;
    var populating = false;
    var selected;

    function getSmartPlaylistTracks(action, playlist) {
        if (populating) {
            debug.warn("STARRADIOS", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: action, playlist: playlist },
            url: "userRatings.php",
            success: starRadios.Go,
            fail: starRadios.Fail
        });
    }

	return {

		populate: function(s, flag) {
            debug.log("STARRADIOS","Populate Called with ",s,running);
            if (s) {
                switch(s) {
                    case '1stars':
                    case '2stars':
                    case '3stars':
                    case '4stars':
                    case '5stars':
                    case 'neverplayed':
                        selected = s;
                        break;

                    default:
                        selected = 'tag+'+s;
                        break;
                }

            }
            if (flag) running = flag;
            debug.shout("STAR RADIOS", "Populating",selected);
			getSmartPlaylistTracks(running ? "repopulate" : "getplaylist", selected);
		},

        modeHtml: function() {
            if (selected.match(/^\dstars/)) {
                return '<img src="newimages/'+selected+'.png" class="modeimg"/>';
            } else if (selected.match(/^tag/)){
                return '<img src="'+ipath+'tag.png" class="modeimg"/><span class="modespan">'+selected.replace(/^tag\+/,'')+'</span>';
            } else {
                return '<img src="'+ipath+'document-open-folder.png" class="modeimg"/><span class="modespan">'+language.gettext('label_'+selected)+'</span>';
            }
        },

        stop: function() {
            running = false;
            populating = false;
        },

        Go: function(data) {
            if (data.length > 0) {
                debug.log("SMARTPLAYLIST","Got tracks",data);
                running = true;
                populating = false;
                player.controller.addTracks(data, playlist.playFromEnd(), null);
            } else {
                debug.warn("SMARTPLAYLIST","Got NO tracks",data);
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        },

        Fail: function() {
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
        },

        setup: function() {

            var html = '';

            if (prefs.apache_backend == "sql") {
                $.each(['1stars','2stars','3stars','4stars','5stars'], function(i, v) {
                    html = html + '<div class="containerbox backhi spacer" onclick="playlist.radioManager.load(\'starRadios\', \''+v+'\')">'+
                                    '<div class="fixed"><img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></div>'+
                                    '<div class="fixed"><img src="newimages/'+v+'.png" height="12px" style="vertical-align:middle;margin-left:8px"></div>'+
                                    '<div class="expand" style="margin-left:8px">'+language.gettext('playlist_xstar', [i+1])+'</div>'+
                                    '</div>';

                });
                html = html + '<div class="containerbox spacer"><div class="containerbox expand">'+
                                '<div class="fixed playlisticon"><img src="'+ipath+'tag.png" height="12px" style="vertical-align:middle;padding-top:6px"></div>'+
                                '<div class="expand dropdown-holder">'+
                                '<input class="searchterm enter sourceform" id="cynthia" type="text" style="font-size:100%;width:100%"/>'+
                                '<div class="drop-box dropshadow tagmenu" id="tigger" style="width:100%;position:relative">'+
                                '<div class="tagmenu-contents">'+
                                '</div>'+
                                '</div>'+
                                '</div>'+
                                '<div class="fixed dropdown-button" id="poohbear" style="padding-top:6px">'+
                                '<img src="'+ipath+'dropdown.png">'+
                                '</div>'+
                                '<button class="fixed" style="margin-left:8px" onclick="playlist.radioManager.load(\'starRadios\', $(\'#cynthia\').val())"><b>'+language.gettext('button_playradio')+'</b></button>'+
                                '</div></div>';

                html = html + '<div class="containerbox backhi spacer" onclick="playlist.radioManager.load(\'starRadios\', \'neverplayed\')">'+
                                '<div class="fixed"><img src="'+ipath+'document-open-folder.png" height="12px" style="vertical-align:middle"></div>'+
                                '<div class="expand">&nbsp;&nbsp;&nbsp;'+language.gettext('label_neverplayed')+'</div>'+
                                '</div>';

                $("#pluginplaylists").append(html);
                $("#poohbear").click(onDropdownClicked);
                if (mobile == "no") {
                    addCustomScrollBar("#tigger");
                }
            }

        }

	}

}();

playlist.radioManager.register("starRadios", starRadios);