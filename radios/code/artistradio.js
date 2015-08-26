var artistRadio = function() {

	var artistname;
	var artistindex;
	var tuner;

	function getArtistName(id) {
		spotify.artist.getInfo(id, artistRadio.gotArtistName, artistRadio.fail);
	}

	function searchForArtist(name) {
		spotify.artist.search(name, artistRadio.gotArtists, artistRadio.fail);
	}

	return {

		populate: function(artist, numtracks) {
			if (artist && artist != artistname) {
				debug.shout("ARTIST RADIO","Populating with",artist);
				if (typeof(spotifyRadio) == 'undefined') {
					debug.log("ARTIST RADIO","Loading Spotify Radio Tuner");
					$.getScript('radios/code/spotifyRadio.js',function() {
						artistRadio.actuallyGo(artist, numtracks)
					});
				} else {
					artistRadio.actuallyGo(artist, numtracks);
				}
			} else {
				debug.log("ARTIST RADIO", "Repopulating");
				var a = tuner.sending;
				tuner.sending += (numtracks - tuner.sending);
				if (a == 0 && tuner.sending > 0) {
					tuner.startSending();
				}
			}
		},

		actuallyGo: function(artist, numtracks) {
			tuner = new spotifyRadio();
			tuner.sending = numtracks;
			tuner.running = true;
			tuner.artistindex = 0;
			if (artist.substr(0,15) == "spotify:artist:") {
				getArtistName(artist.substr(15,artist.length));
			} else {
				debug.shout("ARTIST RADIO","Searching for artist",artist);
				artistname = artist;
				searchForArtist(artist);
			}
		},

		modeHtml: function(a) {
			return '<i class="icon-wifi modeimg"/></i><span class="modespan">'+a+' '+
				language.gettext("label_radio")+'</span>';
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
			artistname = "";
		},

		gotArtists: function(data) {
			for (var i in data.artists.items) {
				if (data.artists.items[i].name.removePunctuation().toLowerCase() ==
						artistname.removePunctuation().toLowerCase()) {
					artistname = data.artists.items[i].name;
					tuner.newArtist(artistname, data.artists.items[i].id, true);
					return;
				}
			}
			artistRadio.fail();
		},

		gotArtistName: function(data) {
			artistname = data.name;
			tuner.newArtist(artistname, data.id, true);
		},

		fail: function(data) {
            debug.error("ARTIST RADIO","Failed to create playlist",data);
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
		}

	}

}();

playlist.radioManager.register("artistRadio", artistRadio, null);
