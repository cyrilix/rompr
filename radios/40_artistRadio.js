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
			} else {
				debug.log("ARTIST RADIO", "Repopulating");
				var a = tuner.sending;
				tuner.sending += (numtracks - tuner.sending);
				if (a == 0 && tuner.sending > 0) {
					tuner.startSending();
				}
			}
		},

		modeHtml: function(a) {
			return '<i class="icon-wifi modeimg"/></i><span class="modespan">'+a+' '+language.gettext("label_radio")+'</span>';
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
			artistname = "";
		},

		gotArtists: function(data) {
			for (var i in data.artists.items) {
				if (data.artists.items[i].name.removePunctuation().toLowerCase() == artistname.removePunctuation().toLowerCase()) {
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
		},

		setup: function() {
			if (player.canPlay('spotify')) {
	            var html = '<div class="containerbox dropdown-container spacer">';
	            html = html + '<div class="fixed"><i class="icon-spotify-circled smallicon"></i></div>';
	            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('lastfm_simar')+'</span></div>';
	            html = html + '<div class="expand dropdown-holder"><input class="enter" id="bubbles" type="text" onkeyup="onKeyUp(event)" /></div>';
	            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'artistRadio\', $(\'#bubbles\').val())">'+language.gettext('button_playradio')+'</button>';
	            html = html + '</div>';
	            html = html + '</div>';
	            $("#pluginplaylists_spotify").append(html);
	        }
		}

	}

}();

playlist.radioManager.register("artistRadio", artistRadio);
