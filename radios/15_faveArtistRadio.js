var faveArtistRadio = function() {

	var sending = 0;
	var artists = new Array();
	var artistindex;
	var running = false;
	var populating = false;

	function getFaveArtists() {
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: "getfaveartists" },
            url: "userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.debug("SMARTPLAYLIST","Got artists",data);
                    artists = data;
                    getTracksForNextArtist();
                } else {
	                infobar.notify(infobar.ERROR,"No artists returned. Play some more music!");
                	debug.debug("SMARTPLAYLIST", "Failed to get artists", data);
                    playlist.repopulate();
                }
            },
            fail: function() {
                infobar.notify(infobar.ERROR,"Failed to create Playlist");
                playlist.repopulate();
            }
        });
	}

	function getTracksForNextArtist() {
		for (var i in artists) {
			if (artists[i].tracks === undefined) {
				debug.shout("FAVE ARTIST RADIO","Searching for tracks for",artists[i].name);
				player.controller.rawfindexact({artist: [artists[i].name]}, faveArtistRadio.gotTracksForArtist);
				break;
			}
		}
	}

	function sendTracks(num) {
		var t = new Array();
		debug.debug("ARTIST RADIO","Asked to send",num,"tracks, flag is",sending);
		debug.debug("ARTIST RADIO", "Artistindex is",artistindex);
		// Safety counter just in case
		var c = 100;
		while (num > 0 && sending < 5 && c > 0) {
			if (artists[artistindex].tracks !== undefined) {
				t.push({type: 'uri', name: artists[artistindex].tracks[artists[artistindex].trackpointer].uri});
				sending++;
				num--;
				artists[artistindex].trackpointer++;
				if (artists[artistindex].trackpointer >= artists[artistindex].tracks.length) {
					artists[artistindex].trackpointer = 0;
				}
			}
			artistindex++;
			if (artistindex >= artists.length) {
				artistindex = 0;
			}
			c--;
		}
		if (sending == 5) populating = false;
		if (t.length > 0) {
			debug.mark("ARTIST RADIO","Sending tracks to playlist",t);
			player.controller.addTracks(t, playlist.playFromEnd(), null);
		} else {
			debug.log("ARTIST RADIO","No tracks to send",num,sending,c);
		}
	}

	return {

		populate: function(p, flag) {
			if (!populating) {
				if (!running) {
					debug.shout("FAVE ARTIST RADIO","Populating");
					artists = new Array();
					sending = 0;
					running = true;
					artistindex = 0;
					populating = true;
					getFaveArtists();
				} else {
					debug.log("FAVE ARTIST RADIO","RePopulating");
					sending = 0;
					populating = true;
					sendTracks(5);
				}
			}
		},

		gotTracksForArtist: function(data) {
			for (var i in artists) {
				if (artists[i].tracks === undefined) {
					artists[i].tracks = new Array();
					for (var j in data) {
						if (data[j].hasOwnProperty('tracks')) {
							artists[i].tracks = artists[i].tracks.concat(data[j].tracks);
						}
					}
					artists[i].tracks = artists[i].tracks.sort(randomsort);
					artists[i].trackpointer = 0;
					debug.log("FAVE ARTIST RADIO","Got Tracks For",artists[i].name);
					break;
				}
			}
			sendTracks(1);
			setTimeout(getTracksForNextArtist, 2000);

		},

		stop: function() {
			sending = 5;
			running = false;
			populating = false;
		},

		modeHtml: function() {
			return '<img src="'+ipath+'smartradio.png" style="vertical-align:middle"/>&nbsp;<span style="vertical-align:middle">'+language.gettext("label_radio_fartist")+'</span>';
		},

        setup: function() {

            var html = '<div class="containerbox spacer backhi" onclick="playlist.radioManager.load(\'faveArtistRadio\', null)">';

            html = html + '<div class="fixed">';
            html = html + '<img src="'+ipath+'smartradio.png" height="12px" style="vertical-align:middle"></div>';
            html = html + '<div class="expand">&nbsp;&nbsp;&nbsp;'+language.gettext('label_radio_fartist')+'</div>';

            html = html + '</div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

playlist.radioManager.register("faveArtistRadio", faveArtistRadio);
