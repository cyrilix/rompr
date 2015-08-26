var starRadios = function() {

	var running = false;
    var populating = false;
    var selected;

    function getSmartPlaylistTracks(action, playlist, numtracks) {
        if (populating) {
            debug.warn("STARRADIOS", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        debug.shout("STAR RADIOS", action, playlist, numtracks);
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: action, playlist: playlist, numtracks: numtracks },
            url: "backends/sql/userRatings.php",
            success: starRadios.gotTracks,
            fail: starRadios.Fail
        });
    }

	return {

		populate: function(param, numtracks) {
            debug.log("STARRADIOS","Populate Called with",param,numtracks);
            var whattodo = "repopulate";
            if (param !== selected) {
                whattodo = "getplaylist";
                switch(param) {
                    case '1stars':
                    case '2stars':
                    case '3stars':
                    case '4stars':
                    case '5stars':
                    case 'neverplayed':
                    case 'allrandom':
                        selected = param;
                        break;

                    default:
                        selected = 'tag+'+param;
                        break;
                }

            }
            running = true;
			getSmartPlaylistTracks(whattodo, selected, numtracks);
		},

        modeHtml: function(param) {
            if (param.match(/^\dstars/)) {
                var cn = param.replace(/(\d)/, 'icon-$1-');
                return '<i class="'+cn+' rating-icon-small"></i>';
            } else if (param == "neverplayed" || param == "allrandom") {
                return '<i class="icon-music modeimg"/></i><span class="modespan">'+
                    language.gettext('label_'+param)+'</span>';
            } else {
                return '<i class="icon-tags modeimg"/><span class="modespan">'+param+'</span>';
            }
        },

        stop: function() {
            running = false;
            selected = null;
        },

        gotTracks: function(data) {
            populating = false;
            if (data.length > 0) {
                debug.log("SMARTPLAYLIST","Got tracks",data);
                if (running) player.controller.addTracks(data,
                    playlist.radioManager.playbackStartPos(), null);
            } else {
                debug.warn("SMARTPLAYLIST","Got NO tracks",data);
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
                running = false;
            }
        },

        Fail: function() {
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
            populating = false;
            running = false;
        },

        tagPopulate: function(tags) {
            playlist.radioManager.load('starRadios', tags);
        }
    }
}();

debug.log("STARRADIOS","Real script Loaded");

playlist.radioManager.register("starRadios", starRadios, null);
