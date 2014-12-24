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
            url: "backends/sql/userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.debug("SMARTPLAYLIST","Got tracks",data);
                    running = true;
                    populating = false;
                    player.controller.addTracks(data, playlist.playFromEnd(), null);
                } else {
                    playlist.radioManager.stop();
                }
            },
            fail: function() {
                debug.error("MOST PLAYED","Database fail");
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        });
    }

	return {

		populate: function(s, flag) {
            if (s) selected = s;
            if (flag) running = flag;
            debug.shout("MOST PLAYED", "Populating");
			getSmartPlaylistTracks(running ? "repopulate" : "getplaylist");
		},

        modeHtml: function() {
            return '<i class="icon-doc-text modeimg"></i><span class="modespan">'+language.gettext("label_mostplayed")+'</span>&nbsp;';
        },

        stop: function() {
            running = false;
            populating = false;
        },

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'mostPlayed\', null)">';
            html = html + '<div class="fixed">';
            html = html + '<i class="icon-doc-text smallicon"></i></div>';
            html = html + '<div class="expand">&nbsp;&nbsp;&nbsp;'+language.gettext('label_mostplayed')+'</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

playlist.radioManager.register("mostPlayed", mostPlayed);