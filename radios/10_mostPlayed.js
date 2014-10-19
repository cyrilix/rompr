var mostPlayed = function() {

	var running = false;
    var populating = false;

    function getSmartPlaylistTracks(action) {
        if (populating) {
            debug.warn("STARRADIOS", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: action, playlist: "mostplayed" },
            url: "userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.log("SMARTPLAYLIST","Got tracks",data);
                    running = true;
                    populating = false;
                    player.controller.addTracks(data, null, null);
                } else {
                    populating = false;
                    running = false;
                    playlist.repopulate();
                }
            },
            fail: function() {
                populating = false;
                running = false;
                infobar.notify(infobar.ERROR,"Failed to create Playlist");
                playlist.repopulate();
            }
        });
    }

	return {

		populate: function(s) {
            if (s) selected = s;
            debug.log("MOST PLAYED", "Populating");
			getSmartPlaylistTracks(running ? "getplaylist" : "repopulate");
		},

        modeHtml: function() {
            return '<img src="'+ipath+'document-open-folder.png" height="12px" style="vertical-align:middle">&nbsp;<span style="vertical-align:middle">'+language.gettext("label_mostplayed")+'</span>&nbsp;';
        },

        stop: function() {
            running = false;
        },

        setup: function() {

            var html = '<div class="padright menuitem"><div class="containerbox">';

            html = html + '<div class="fixed">';
            html = html + '<img src="'+ipath+'document-open-folder.png" height="12px" style="vertical-align:middle"></div>';
            html = html + '<div class="expand"><a href="#" onclick="playlist.loadSmart(mostPlayed, null)">&nbsp;&nbsp;&nbsp;'+language.gettext('label_mostplayed')+'</a></div>';

            html = html + '</div></div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

mostPlayed.setup();
