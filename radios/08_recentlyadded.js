var recentlyaddedtracks = function() {

	var running = false;
	var populating = false;
	var tracks = new Array();
    var tracksneeded = 0;
	var mode;

	function getTracks() {
        if (populating) {
            debug.warn("MOST PLAYED", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "radios/recentlyadded.php?mode="+mode,
            success: function(data) {
                if (data && data.length > 0) {
                    debug.debug("SMARTPLAYLIST","Got tracks",data);
                    running = true;
                    populating = false;
                    tracks = data;
                    addTracks();
                } else {
                    infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                    playlist.radioManager.stop();
                }
            },
            fail: function() {
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
                populating = false;
            }
        });

	}

	function addTracks() {
		if (running) {
			var t = new Array();
			while (tracksneeded > 0 && tracks.length > 0) {
				t.push({type: 'uri', name: tracks.shift()});
				tracksneeded--;
			}
			if (t.length > 0) {
				player.controller.addTracks(t, playlist.radioManager.playbackStartPos(), null);
			} else {
                playlist.radioManager.stop();
			}
		}
	}

	return {

		populate: function(param, numtracks) {
			if (param && param != mode) {
				mode = param;
				tracks = new Array();
			}
            tracksneeded += (numtracks - tracksneeded);
			debug.shout("RECENTLY ADDED", "Populating",param,numtracks);
			if (tracks.length == 0) {
				getTracks();
			} else {
				addTracks();
			}
		},

        modeHtml: function(param) {
            return '<i class="icon-music modeimg"></i><span class="modespan">'+language.gettext("label_recentlyadded_"+param)+'</span>&nbsp;';
        },

        stop: function() {
            running = false;
            tracks = new Array();
        },

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'recentlyaddedtracks\', \'random\')">';

            html = html + '<div class="fixed">';
            html = html + '<i class="icon-music smallicon"></i></div>';
            html = html + '<div class="expand">'+language.gettext('label_recentlyadded_random')+'</div>';

            html = html + '</div>';
            html = html + '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'recentlyaddedtracks\', \'byalbum\')">';

            html = html + '<div class="fixed">';
            html = html + '<i class="icon-music smallicon"></i></div>';
            html = html + '<div class="expand">'+language.gettext('label_recentlyadded_byalbum')+'</div>';

            html = html + '</div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

playlist.radioManager.register("recentlyaddedtracks", recentlyaddedtracks);