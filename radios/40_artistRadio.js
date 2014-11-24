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

		populate: function(artist, flag) {
			if (artist) {
				debug.shout("ARTIST RADIO","Populating with",artist);
				tuner = new spotifyRadio();
				tuner.sending = 10;
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
				if (tuner.sending <= 0) {
					tuner.sending = 10;
					tuner.startSending();
				}
			}
		},

		modeHtml: function() {
			return '<img src="'+ipath+'smartradio.png" class="modeimg"/><span class="modespan">'+artistname+'&nbsp;'+language.gettext("label_radio")+'</span>';
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
		},

		gotArtists: function(data) {
			for (var i in data.artists.items) {
				if (data.artists.items[i].name.toLowerCase() == artistname.toLowerCase()) {
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
	            html = html + '<div class="fixed playlisticon"><img src="'+ipath+'spotify-logo.png" height="12px" style="vertical-align:middle"></div>';
	            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('label_artistradio')+'</span></div>';
	            html = html + '<div class="expand dropdown-holder"><input class="searchterm enter sourceform" id="bubbles" type="text" style="width:100%;font-size:100%;vertical-align:middle" onkeyup="onKeyUp(event)" /></div>';
	            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'artistRadio\', $(\'#bubbles\').val())">'+language.gettext('button_playradio')+'</button>';
	            html = html + '</div>';
	            html = html + '</div>';
	            $("#pluginplaylists").append(html);
	        }
		}

	}

}();

playlist.radioManager.register("artistRadio", artistRadio);
