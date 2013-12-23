function trackDataCollection(i, d) {

	var self = this;
	var collections = new Array();
	this.playlistinfo = d;
	this.index = i;

	// Last.FM needs to be running as it's used for love, ban, and autocorrect
	if (prefs.lastfm_autocorrect || lastfm.isLoggedIn()) {
		collections['lastfm'] = new (nowplaying.getPlugin('lastfm')).collection(this);
	}

	// For SoundCloud tracks, we use the plugin to get albumart and artist names,
	// because sometimes mopidy_soundcloud fails to get them
	var t = d.location;
	if (t.substring(0,11) == 'soundcloud:') {
		collections['soundcloud'] = new (nowplaying.getPlugin('soundcloud')).collection(this);
	}

	function startSource(source) {
		var requirements = (nowplaying.getPlugin(source)).getRequirements(self);
		for (var i in requirements) {
			if (collections[requirements[i]] === undefined) {
				debug.mark("TRACKDATA",self.index,"Starting collection",source,"requirement",requirements[i]);
				startSource(requirements[i]);
			}
		}
		debug.mark("TRACKDATA",self.index,"Starting collection",source);
		collections[source] = new (nowplaying.getPlugin(source)).collection(self);
	}

	this.sendDataToBrowser = function(waitingon) {
		if (collections[waitingon.source] === undefined) {
			startSource(waitingon.source);
		}
		debug.log("TRACKDATA",self.index,"Telling",waitingon.source,"to start displaying");
		collections[waitingon.source].displayData();
	}

	this.stopDisplaying = function(waitingon) {
		for (var coll in collections) {
			debug.debug("TRACKDATA",self.index,"Telling",coll,"to stop displaying");
			collections[coll].stopDisplaying(waitingon);
		}
	}

	this.updateData = function(data, start) {
		if (start === undefined || start === null) {
			start = self.playlistinfo;
		}
		for (var i in data) {
			if (typeof data[i] == "object" && data[i] !== null) {
				if (start[i] === undefined) {
					start[i] = {};
				}
				self.updateData(data[i], start[i]);
			} else {
				if (start[i] === undefined || start[i] == "" || start[i] == null) {
					start[i] = data[i];
				}
			}
		}
	}

	this.youWereClicked = function(plugin, source, element, event) {
		collections[plugin].handleClick(source, element, event);
	}

	this.love = function() {
		if (collections['lastfm'] === undefined) {
			debug.error("TRACKDATA","Asked to Love but there is no lastfm collection!");
		} else {
			collections['lastfm'].track.love();
		}
	}

	this.reduceYourIndexPlease = function() {
		self.index--;
	}

	this.updateProgress = function(percent) {
		if (collections['soundcloud'] !== undefined) {
			collections['soundcloud'].progressUpdate(percent);
		}
	}

}

var nowplaying = function() {

	var history = new Array();
	var plugins = new Array();
    var currenttrack = 0;
    var currentlocation = "";
    var currenttype = "";

	return {

		registerPlugin: function(name, fn, icon, text) {
			debug.log("NOWPLAYING", "Plugin is regsistering - ",name);
			plugins[name] = { 	createfunction: fn,
								icon: icon,
								text: language.gettext(text)
							};
		},

		getPlugin: function(name) {
			return plugins[name].createfunction;
		},

		getAllPlugins: function() {
			return plugins;
		},

		newTrack: function(playlistinfo) {

            if (currentlocation != "" && currenttype == "podcast") {
            	debug.log("NOWPLAYING", "Seeing if we need to mark a podcast as listened");
                podcasts.checkMarkPodcastAsListened(currentlocation);
            }
            currentlocation = playlistinfo.location;
            currenttype = playlistinfo.type;
	        debug.groupend();
			infobar.setNowPlayingInfo(playlistinfo);
			if (playlistinfo == playlist.emptytrack) {
				return;
			}
	        debug.group("NOWPLAYING","New Track:",playlistinfo);

	        // Repeatedly querying online databases for the same data is a bad idea -
	        // it's slow, it means we have to store the same data multiple times,
	        // and some databases (musicbrainz) will start to severely rate-limit you
	        // if you do it. Hence we see if we've got stuff we can copy.
	        // (Note Javascript is a by-reference language, so all we're copying is
	       	// references to one pot of data).
			var metadata = {artist: null, album: null, track: null };

	        for (var i = currenttrack; i > 0; i--) {
	            if (playlistinfo.creator == history[i].playlistinfo.creator) {
	                if (metadata.artist === null) {
	                    debug.log("NOWPLAYING","Copying Artist data from index",i);
	                    metadata.artist = history[i].playlistinfo.metadata.artist;
	                }
	                if (playlistinfo.musicbrainz.artistid == "") {
	                	playlistinfo.musicbrainz.artistid = history[i].playlistinfo.musicbrainz.artistid;
	                }
	                if (playlistinfo.title == history[i].playlistinfo.title && metadata.track === null) {
	                    debug.log("NOWPLAYING","Copying Track data from index",i);
	                    metadata.track = history[i].playlistinfo.metadata.track;
		                if (playlistinfo.musicbrainz.trackid == "") {
		                	playlistinfo.musicbrainz.trackid = history[i].playlistinfo.musicbrainz.trackid;
		                }
	                }
	            }

	            var newalbumartist = (playlistinfo.albumartist == "") ? playlistinfo.creator : playlistinfo.albumartist;
	            var albumartist = (history[i].playlistinfo.albumartist == "") ? history[i].playlistinfo.creator : history[i].playlistinfo.albumartist;
	            if (albumartist == newalbumartist) {
	                if (playlistinfo.album == history[i].playlistinfo.album && metadata.album === null) {
	                    debug.log("NOWPLAYING","Copying Album data from index",i);
	                    metadata.album = history[i].playlistinfo.metadata.album;
		                if (playlistinfo.musicbrainz.albumid == "") {
		                	playlistinfo.musicbrainz.albumid = history[i].playlistinfo.musicbrainz.albumid;
		                }
	                }
	            }
	        }
	        if (metadata.artist == null) {
	        	metadata.artist = {};
	        }
	        if (metadata.album == null) {
	        	metadata.album = {};
	        }
	        if (metadata.track == null) {
	        	metadata.track = {};
	        }
	        playlistinfo.metadata = metadata;

	        // Truncate our history if we've gone over the limit
	        // the limit is configurable as prefs.historylength, but it's not in the UI
	        // NOTE: history[0] is not used.
	        if (currenttrack == prefs.historylength) {
	        	debug.log("NOWPLAYING","History is too long - truncating by one");
	        	history.splice(1,1);
	        	currenttrack--;
	        	for(var i in history) {
	        		history[i].reduceYourIndexPlease();
	        	}
	        	browser.thePubsCloseTooEarly();
	        }

	        currenttrack++;
			history[currenttrack] = new trackDataCollection(currenttrack, playlistinfo);
			browser.trackHasChanged(currenttrack, playlistinfo);

		},

		giveUsTheData: function(waitingon) {
			if (waitingon.index > 0) {
				for (var i in history) {
					history[i].stopDisplaying(waitingon);
				}
				history[waitingon.index].sendDataToBrowser(waitingon);
			}
		},

		clickPassThrough: function(index, plugin, source, element, event) {
			history[index].youWereClicked(plugin, source, element, event);
		},


		setLastFMCorrections: function(index, updates) {
			debug.log("NOWPLAYING","Recieved last.fm corrections for index",index);
			if (index == currenttrack) {
		    	var t = history[index].playlistinfo.location;
            	if (t.substring(0,11) == 'soundcloud:') {
            		debug.log("NOWPLAYING","Not sending LastFM Updates because this track is from soundcloud");
            	} else {
					infobar.setLastFMCorrections(updates);
				}
			}
		},

		setSoundCloudCorrections: function(index, updates) {
			if (index == currenttrack) {
		    	var t = history[index].playlistinfo.location;
            	if (t.substring(0,11) == 'soundcloud:') {
            		debug.log("NOWPLAYING", "Sending SoundCloud Updates");
            		infobar.setLastFMCorrections(updates);
            	}
            }
        },

		progressUpdate: function(percent) {
			if (currenttrack > 0) {
				history[currenttrack].updateProgress(percent);
			}
		},

		love: function() {
			if (lastfm.isLoggedIn()) {
				history[currenttrack].love();
			}
            $("#love").effect('pulsate', {times: 1}, 2000);
		},

		dumpHistory: function() {
			for (var i in history) {
				debug.log("NOWPLAYING", "History index",i,history[i]);
			}
		}

	}

}();

