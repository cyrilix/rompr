var mixRadio = function() {

	var fartists = new Array();
	var idhunting = -1;
	var populating = false;
	var tuner;

	function getFaveArtists() {
		idhunting = -1;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: "getfaveartists" },
            url: "backends/sql/userRatings.php",
            success: function(data) {
                if (data.length > 0) {
                    debug.mark("MIX RADIO","Got Fave Artists",data);
                    data.sort(randomsort);
                    for (var i in data) {
                    	if (data[i].name && data[i] !== "" && fartists.length <= 10) {
                    		fartists.push({name: data[i].name});
                    	}
                	}
                	searchForNextArtist();
                } else {
	                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                	debug.warn("MIX RADIO", "No Fave Artists Returned", data);
                    playlist.radioManager.stop();
                }
            },
            fail: function(data) {
            	debug.error("MIX RADIO", "Failed to get artists", data);
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        });
	}

	function searchForNextArtist() {
		idhunting++;
		if (idhunting < fartists.length) {
			debug.shout("MIX RADIO","Searching for spotify ID for",idhunting,fartists.length,fartists[idhunting].name);
			spotify.artist.search(fartists[idhunting].name, mixRadio.gotArtists, mixRadio.lookupFail);
		}
	}

	return {

		populate: function(p, flag) {
			if (!populating) {
				debug.shout("MIX RADIO","Populating");
				fartists = new Array();
				tuner = new spotifyRadio();
				tuner.sending = 10;
				tuner.running = true;
				tuner.artistindex = 0;
				populating = true;
				numfartists = 0;
				getFaveArtists();
			} else {
				debug.shout("MIX RADIO","RePopulating");
				if (tuner.sending <= 0) {
					tuner.sending = 10;
					tuner.startSending();
				}
			}
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
			populating = false;
		},

		modeHtml: function() {
			return '<img src="'+ipath+'smartradio.png" class="modeimg"/><span class="modespan">'+language.gettext("label_radio_mix")+'</span>';
		},

        setup: function() {

            if (player.canPlay('spotify')) {

	            var html = '<div class="containerbox spacer backhi" onclick="playlist.radioManager.load(\'mixRadio\', null)">';

	            html = html + '<div class="fixed">';
	            html = html + '<img src="'+ipath+'spotify-logo.png" height="12px" style="vertical-align:middle"></div>';
	            html = html + '<div class="expand">&nbsp;&nbsp;&nbsp;'+language.gettext('label_radio_mix')+'</div>';

	            html = html + '</div>';
	            $("#pluginplaylists").append(html);
	        }
        },

		lookupFail: function() {
			debug.warn("MIX RADIO","Failed to lookup artist");
			searchForNextArtist();
		},

        gotArtists: function(data) {
        	debug.shout("MIX RADIO","Got artist search results",data);
        	var found = false;
        	for (var i in data.artists.items) {
        		check: {
	        		for (var j in tuner.artists) {
	        			if (tuner.artists[j].getName() == data.artists.items[i].name) {
	        				debug.shout("MIX RADIO", "Ignoring artist",data.artists.items[i].name,"because it already exists");
	        				found = true;
	        				break check;
	        			}
	        		}
	        		if (data.artists.items[i].name.toLowerCase() == fartists[idhunting].name.toLowerCase()) {
	        			debug.shout("MIX RADIO","Found Spotify ID for artist",idhunting,fartists[idhunting].name);
	        			tuner.newArtist(data.artists.items[i].name, data.artists.items[i].id, true);
	    				found = true;
	    				break;
	    			}
    			}
        	}
        	if (!found) {
        		debug.shout("MIX RADIO","Failed to find Spotify ID for artist",fartists[idhunting].name);
        	}
        	searchForNextArtist();
        },
	}
}();

playlist.radioManager.register("mixRadio", mixRadio);