var genreRadio = function() {

	var running = false;
	var genre;
	var tracks;
	var tuner;

	function searchForTracks(genre) {
		var domains = new Array();
		// Am finding some spotify backends don't support search by genre
		// and actually return an error instead of failing gracefully
		var testdoms = ["local","spotify", "gmusic", "beets"];
		for (var i in testdoms) {
			if (player.canPlay(testdoms[i])) {
				domains.push(testdoms[i]+":");
			}
		}
		player.controller.rawsearch({genre: [genre]}, domains, genreRadio.checkResults);
	}

	function sendTracks(num) {
		if (running) {
			if (tuner && tracks.length > 0 && Math.random < 0.3) {
				// prioritise sending of tracks returned by search rather tham
				// tracks found by spotify radio, as search will include other sources
				if (tuner.sending <= 0) {
					tuner.sending = 10;
					tuner.startSending;
				}
			} else {
				var ta = new Array();
				while (tracks.length > 0 && num > 0) {
					ta.push(tracks.shift());
					num--;
				}
				if (ta.length > 0) {
					player.controller.addTracks(ta, playlist.playFromEnd(), null);
				}
			}
		}
	}

	return {

		populate: function(g,f) {
			if (g) {
				debug.log("GENRE RADIO","Populating Genre",g);
				running = true;
				tracks = new Array();
				genre = g;
				searchForTracks(g);
				tuner = null;
			} else {
				debug.log("GENRE RADIO","Repopulating");
				if (tuner === null || (tuner && tuner.sending <= 0)) {
					sendTracks(10);
				}
			}
		},

		checkResults: function(data) {
			debug.log("GENRE RADIO","Search Results",data);
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
			sendTracks(10);
		},

		fail: function() {
			debug.error("GENRE RADIO","Well, that didn't work");
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
		},

		stop: function() {
			running = false;
			if (tuner) {
				tuner.sending = 0;
				tuner.running = false;
			}
		},

		modeHtml: function() {
            return '<img src="'+ipath+'smartradio.png" class="modeimg"/><span class="modespan ucfirst">'+genre+' '+language.gettext('label_radio')+'</span>';
		},

		setup: function() {
            var html = '<div class="containerbox dropdown-container spacer">';
            html = html + '<div class="fixed playlisticon"><img src="'+ipath+'smartradio.png" height="12px" style="vertical-align:middle"></div>';
            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('label_genre')+'</span></div>';
            html = html + '<div class="expand dropdown-holder"><input class="searchterm enter sourceform" id="humphrey" type="text" style="width:100%;font-size:100%;vertical-align:middle" onkeyup="onKeyUp(event)" /></div>';
            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'genreRadio\', $(\'#humphrey\').val())">'+language.gettext('button_playradio')+'</button>';
            html = html + '</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);
		}

	}

}();

playlist.radioManager.register("genreRadio", genreRadio);
