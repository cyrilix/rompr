var mostPlayed = function() {

	var running = false;
    var populating = false;
    var started = false;

    function getSmartPlaylistTracks(action, numtracks) {
        if (populating) {
            debug.warn("MOST PLAYED", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: action, playlist: "mostplayed", numtracks: numtracks },
            url: "backends/sql/userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.debug("SMARTPLAYLIST","Got tracks",data);
                    running = true;
                    populating = false;
                    player.controller.addTracks(data, playlist.radioManager.playbackStartPos(), null);
                } else {
                    playlist.radioManager.stop();
                }
            },
            fail: function() {
                debug.error("MOST PLAYED","Database fail");
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
                populating = false;
            }
        });
    }

	return {

		populate: function(s, numtracks) {
            debug.shout("MOST PLAYED", "Populating");
			getSmartPlaylistTracks(started ? "repopulate" : "getplaylist", numtracks);
            started = true;
		},

        modeHtml: function(p) {
            return '<i class="icon-doc-text modeimg"></i><span class="modespan">'+language.gettext("label_mostplayed")+'</span>&nbsp;';
        },

        stop: function() {
            running = false;
            started = false;
        },

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'mostPlayed\', null)">';
            html = html + '<div class="fixed">';
            html = html + '<i class="icon-doc-text smallicon"></i></div>';
            html = html + '<div class="expand">'+language.gettext('label_mostplayed')+'</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

playlist.radioManager.register("mostPlayed", mostPlayed);