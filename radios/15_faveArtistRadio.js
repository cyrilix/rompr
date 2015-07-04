var faveArtistRadio = function() {

	var populating = false;
	var tuner;

	function getFaveArtists() {
		if (populating) {
			debug.warn("FAVE ARTIST RADIO","Asked to populate but already doing so!");
			return false;
		}
		populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: "getfaveartists" },
            url: "backends/sql/userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.debug("FAVE ARTIST RADIO","Got artists",data);
                    for (var i in data) {
                    	tuner.newArtist(data[i].name);
                    }
                    tuner.populateNext(10);
                } else {
	                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                	debug.warn("FAVE ARTIST RADIO", "Got no artists", data);
                    playlist.radioManager.stop();
                }
            },
            fail: function() {
            	debug.error("FAVE ARTIST RADIO", "Failed to get artists", data);
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        });
	}

	return {

		populate: function(p, numtracks) {
			if (!populating) {
				debug.shout("FAVE ARTIST RADIO","Populating");
				tuner = new searchRadio();
				tuner.sending = numtracks;
				tuner.running = true;
				tuner.artistindex = 0;
				getFaveArtists();
			} else {
				debug.log("FAVE ARTIST RADIO","RePopulating",numtracks);
				var a = tuner.sending;
				tuner.sending += (numtracks - tuner.sending);
				if (a == 0 && tuner.sending > 0) {
					tuner.startSending();
				}
			}
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
			populating = false;
		},

		modeHtml: function(p) {
			return '<i class="icon-wifi modeimg"/></i><span class="modespan">'+language.gettext("label_radio_fartist")+'</span>';
		},

        setup: function() {
            var html = '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'faveArtistRadio\', null)">';

            html = html + '<div class="fixed">';
            html = html + '<i class="icon-wifi smallicon"></i></div>';
            html = html + '<div class="expand">'+language.gettext('label_radio_fartist')+'</div>';

            html = html + '</div>';
            $("#pluginplaylists_everywhere").append(html);
        }
	}
}();

playlist.radioManager.register("faveArtistRadio", faveArtistRadio);
