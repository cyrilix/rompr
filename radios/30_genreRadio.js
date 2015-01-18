var genreRadio = function() {

	var populating = false;
	var running = false;
	var genre;
	var tracks;
	var tuner;
	var tracksneeded = 0;

	function searchForTracks(genre) {
		if (populating) {
			debug.warn("GENRE RADIO","Asked to populate but already doing so!");
			return false;
		}
		populating = true;
		var domains = new Array();
		// Am finding some mopidy backends don't support search by genre
		// and actually return an error instead of failing gracefully
		var testdoms = ["local","spotify", "beets", "beetslocal"];
		for (var i in testdoms) {
			if (player.canPlay(testdoms[i])) {
				domains.push(testdoms[i]+":");
			}
		}
		debug.shout("GENRE RADIO","Searching for Genre",genre,"in domains",domains);
		player.controller.rawsearch({genre: [genre]}, domains, genreRadio.checkResults);
	}

	function sendTracks() {
		if (running) {
			if (tracks.length == 0 || (tuner && Math.random() < 0.4)) {
				// prioritise sending of tracks returned by search rather tham
				// tracks found by spotify radio, as search will include other sources
				if (tuner && tuner.sending <= 0) {
					debug.shout("GENRE RADIO","Asking Spotify Tuner To Send",tracksneeded,"Tracks");
					tuner.sending = tracksneeded;
					tuner.startSending();
					tracksneeded = 0;
				}
			} else {
				var ta = new Array();
				while (tracks.length > 0 &&  tracksneeded > 0) {
					ta.push(tracks.shift());
					tracksneeded--;
				}
				if (ta.length > 0) {
					player.controller.addTracks(ta, playlist.playFromEnd(), null);
				}
			}
		}
	}

	return {

		populate: function(g,numtracks) {
			if (g) {
				debug.log("GENRE RADIO","Populating Genre",g);
				running = true;
				tracks = new Array();
				genre = g;
				searchForTracks(g);
				tuner = null;
				tracksneeded = numtracks;
			} else {
				debug.log("GENRE RADIO","Repopulating");
				tracksneeded += (numtracks - tracksneeded);
				sendTracks();
			}
		},

		checkResults: function(data) {
			debug.log("GENRE RADIO","Search Results",data);
			running = true;
			for (var i in data) {
				if (data[i].tracks) {
					for (var k = 0; k < data[i].tracks.length; k++) {
						tracks.push({type: 'uri', name: data[i].tracks[k].uri});
					}
				}
				if (data[i].artists && data[i].uri && data[i].uri.substr(0, 7) == "spotify") {
					tuner = new spotifyRadio();
					tuner.running = true;
					// Make sure we send some searched tracks before we engage the tuner
					tuner.sending = 0;
					tuner.artistindex = 0;
					for (var k = 0; k < data[i].artists.length; k++) {
						tuner.newArtist(data[i].artists[k].name, data[i].artists[k].uri.substr(15, data[i].artists[k].uri.length), false);
					}
				}
			}
			if (tracks.length == 0) {
				genreRadio.fail();
				return;
			}
			tracks.sort(randomsort);
			sendTracks();
		},

		fail: function() {
			debug.error("GENRE RADIO","Well, that didn't work");
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
		},

		stop: function() {
			if (tuner) {
				tuner.sending = 0;
				tuner.running = false;
			}
			populating = false;
		},

		modeHtml: function() {
            return '<i class="icon-wifi modeimg"/></i><span class="modespan ucfirst">'+genre+' '+language.gettext('label_radio')+'</span>';
		},

		setup: function() {
            var html = '<div class="containerbox dropdown-container spacer">';
            html = html + '<div class="fixed"><i class="icon-wifi smallicon"/></i></div>';
            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('label_genre')+'</span></div>';
            html = html + '<div class="expand dropdown-holder"><input class="enter" id="humphrey" type="text" onkeyup="onKeyUp(event)" /></div>';
            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'genreRadio\', $(\'#humphrey\').val())">'+language.gettext('button_playradio')+'</button>';
            html = html + '</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);
		}

	}

}();

playlist.radioManager.register("genreRadio", genreRadio);
