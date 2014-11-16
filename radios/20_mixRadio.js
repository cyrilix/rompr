var mixRadio = function() {

	var sending = 0;
	var gotAllAlbums = false
	var artists = new Array();
	var fartists = new Array();
	var running = false;
	var populating = false;
	var artistindex = 0;
	var idhunting = -1;
	var sendingTimer = null;

	function getFaveArtists() {
		idhunting = -1;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: "getfaveartists" },
            url: "userRatings.php",
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
	                infobar.notify(infobar.ERROR,"No artists returned. Play some more music!");
                	debug.warn("MIX RADIO", "No Fave Artists Returned", data);
                	debug.groupend();
                    playlist.repopulate();
                }
            },
            fail: function(data) {
            	debug.error("MIX RADIO", "Failed to get artists", data);
            	debug.groupend();
                infobar.notify(infobar.ERROR,"Failed to create Playlist");
                playlist.repopulate();
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

    function mixArtist(name, id, findrelated) {
		var self = this;
		debug.mark("MIX ARTIST","Creating",name,id);
		var albums = null;

		this.gotSomeAlbums = function(data) {
			debug.debug("MIX ARTIST","Got albums for",name,data);
			albums = new mixAlbum(name, data.items);
		}

		this.gotRelatedArtists = function(data) {
			debug.debug("MIX ARTIST","Got related artists for",name,data);
			for (var i in data.artists) {
				ac: {
	        		for (var j in artists) {
	        			if (artists[j].getName() == data.artists[i].name) {
	        				debug.shout("MIX RADIO", "Ignoring artist",data.artists[i].name,"because it already exists");
	        				break ac;
	        			}
	        		}
					// add a new artist in a random position in the array
					artists.splice(Math.floor(Math.random() * artists.length), 0, new mixArtist(data.artists[i].name, data.artists[i].id, false));
					// artists.push(new mixArtist(data.artists[i].name, data.artists[i].id, false));
	        	}
			}
		}

		this.failQuiet = function(data) {
			debug.error("MIX ARTIST", "Spotify Error On",name,data);
		}

		this.sendATrack = function() {
			if (albums === null) {
				debug.shout("MIX ARTIST","Artist",name,"was asked to send a track but has no albums");
				return false;
			}
			debug.debug("MIX ARTIST","Artist",name,"was asked to send a track");
			albums.sendATrack();
		}

		this.getName = function() {
			return name;
		}

		if (running) {
			spotify.artist.getAlbums(id, 'album', this.gotSomeAlbums, this.failQuiet);
			if (findrelated) {
				debug.mark("MIX ARTIST", "Getting Related Artists For",name);
				spotify.artist.getRelatedArtists(id, this.gotRelatedArtists, this.failQuiet);
			}
		}
	}

	function mixAlbum(name, items) {
		var self = this;
		debug.mark("MIX ALBUM", "Getting tracks for artist",name);
		var tracks = new Array();

		this.gotTracks = function(data) {
			debug.debug("MIX ALBUM", "Got Tracks For",name,data);
			for (var i in data.albums) {
				for (var j in data.albums[i].tracks.items) {
					tracks.push({type: 'uri', name: data.albums[i].tracks.items[j].uri});
				}
			}
			tracks.sort(randomsort);
			if (sending > 0) {
				self.sendATrack();
			}
		}

		this.failQuiet = function(data) {
			debug.error("MIX ALBUM", "Spotify Error On",name,data);
		}

		this.sendATrack = function() {
			if (running && tracks.length > 0) {
				debug.shout("MIX ALBUM",name,"is sending a track!");
				mixRadio.sendThis(tracks.shift());
			} else {
				debug.shout("MIX ALBUM",name,"was asked for a track but doesn't have any");
			}
		}

		if (running) {
			var ids = new Array();
			for (var i in items) {
				ids.push(items[i].id);
			}
			while (ids.length > 0) {
				ids.sort(randomsort);
				var temp = new Array();
				while (ids.length > 0 && temp.length < 20) {
					// Can only multi-query 20 albums at a time.
					temp.push(ids.shift());
				}
				spotify.album.getMultiInfo(temp, this.gotTracks, this.failQuiet, true);
			}
		}
	}

	function startSending() {
		clearTimeout(sendingTimer);
		if (sending > 0) {
			debug.shout("MIX RADIO","Asking Artist",artistindex,"to send a track");
			artists[artistindex].sendATrack();
			artistindex++;
			if (artistindex >= artists.length) artistindex = 0;
			sendingTimer = setTimeout(startSending, 2000);
		}
	}

	return {

		populate: function(p, flag) {
			if (!populating) {
				debug.shout("MIX RADIO","Populating");
				fartists = new Array();
				artists = new Array();
				sending = 5;
				running = true;
				artistindex = 0;
				populating = true;
				numfartists = 0;
				getFaveArtists();
			} else {
				debug.shout("MIX RADIO","RePopulating");
				if (sending <= 0) {
					sending = 5;
					startSending();
				}
			}
		},

		stop: function() {
			clearTimeout(sendingTimer);
			sending = 0;
			running = false;
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

		fail: function(data) {
            debug.error("MIX RADIO","Spotify Error",data);
            infobar.notify(infobar.ERROR,"Failed to create Playlist");
            playlist.radioManager.stop();
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
	        		for (var j in artists) {
	        			if (artists[j].getName() == data.artists.items[i].name) {
	        				debug.shout("MIX RADIO", "Ignoring artist",data.artists.items[i].name,"because it already exists");
	        				break check;
	        			}
	        		}
	        		if (data.artists.items[i].name.toLowerCase() == fartists[idhunting].name.toLowerCase()) {
	        			debug.shout("MIX RADIO","Found Spotify ID for artist",idhunting,fartists[idhunting].name);
	    				artists.push(new mixArtist(data.artists.items[i].name, data.artists.items[i].id, true));
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

        sendThis: function(track) {
        	sending--;
        	debug.shout("MIX RADIO","Sending a track to playlist",sending,"left");
        	player.controller.addTracks([track], playlist.playFromEnd(), null);
        }

	}

}();

playlist.radioManager.register("mixRadio", mixRadio);