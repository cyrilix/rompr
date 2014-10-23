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

		populate: function(s) {
            if (s) {
                switch(s) {
                    case '1stars':
                    case '2stars':
                    case '3stars':
                    case '4stars':
                    case '5stars':
                        selected = s;
                        break;

                    default:
                        selected = 'tag+'+s;
                        break;
                }

            }
            debug.shout("STAR RADIOS", "Populating",selected);
			getSmartPlaylistTracks(running ? "repopulate" : "getplaylist", selected);
		},

        modeHtml: function() {
            return '<img src="newimages/'+selected+'.png" height="14px" style="vertical-align:middle"/>';
        },

        stop: function() {
            running = false;
        },

        Go: function(data) {
            if (data.length > 0) {
                debug.debug("SMARTPLAYLIST","Got tracks",data);
                running = true;
                populating = false;
                player.controller.addTracks(data, playlist.playFromEnd(), null);
            } else {
                populating = false;
                running = false;
                playlist.repopulate();
            }
        },

        Fail: function() {
            populating = false;
            running = false;
            infobar.notify(infobar.ERROR,"Failed to create Playlist");
            playlist.repopulate();
        },

        setup: function() {

            var html = '';

            if (prefs.apache_backend == "sql") {
                html = html + '<div class="padright menuitem">';
                html = html + '<table width="100%">';
                $.each(['1stars','2stars','3stars','4stars','5stars'], function(i, v) {
                    html = html + '<tr><td class="playlisticon" align="left">';
                    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
                    html = html + '<td align="left"><a href="#" onclick="playlist.radioManager.load(\'starRadios\', \''+v+'\')"><img src="newimages/'+v+'.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_xstar', [i+1])+'</a></td>';
                    html = html + '<td></td></tr>';

                });
                html = html + '</table></div>';
                html = html + '<div class="padright menuitem"><div class="containerbox dropdown-container">'+
                                '<div class="fixed playlisticon"><img src="'+ipath+'tag.png" height="12px" style="vertical-align:middle"></div>'+
                                '<div class="expand dropdown-holder">'+
                                '<input class="searchterm enter sourceform" id="cynthia" type="text" style="width:100%;font-size:100%"/>'+
                                '<div class="drop-box dropshadow tagmenu" id="tigger" style="width:100%">'+
                                '<div class="tagmenu-contents">'+
                                '</div>'+
                                '</div>'+
                                '</div>'+
                                '<div class="fixed dropdown-button" id="poohbear">'+
                                '<img src="'+ipath+'dropdown.png">'+
                                '</div>'+
                                '<button class="fixed" style="margin-left:8px" onclick="playlist.radioManager.load(\'starRadios\', $(\'#cynthia\').val())"><b>'+language.gettext('button_playradio')+'</b></button>'+
                                '</div></div>';
                $("#pluginplaylists").append(html);
            }

        }

	}

}();

playlist.radioManager.register("starRadios", starRadios);