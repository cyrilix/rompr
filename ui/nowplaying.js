function trackDataCollection(i, d) {

	var self = this;
	var collections = new Array();
	this.playlistinfo = d;
	this.index = i;

	this.isCurrentTrack = function() {
		return nowplaying.isThisCurrent(self.index);
	}

	this.updateProgress = function(percent) {
		if (collections['soundcloud'] !== undefined) {
			collections['soundcloud'].progressUpdate(percent);
		}
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

	this.addlfmtags = function(tags) {
		collections['lastfm'].track.addtags(tags);
	}

	this.remlfmtags = function(tags) {
		collections['lastfm'].track.removetags(tags);
	}

	this.reduceYourIndexPlease = function() {
		self.index--;
	}

	this.setMeta = function(action, type, value) {
		collections['ratings'].setMeta(action, type, value);
	}

	collections['ratings'] = new (nowplaying.getPlugin('ratings')).collection(this);

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

}

var nowplaying = function() {

	var history = new Array();
	var plugins = new Array();
    var currenttrack = 0;

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

		    var maxhistorylength = (mobile == "no") ? 25 : 5;

			infobar.setNowPlayingInfo(playlistinfo);
			if (playlistinfo == playlist.emptytrack) {
				return;
			}
	        debug.mark("NOWPLAYING","New Track:",playlistinfo);

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
	                    debug.debug("NOWPLAYING","Copying Artist data from index",i);
	                    metadata.artist = history[i].playlistinfo.metadata.artist;
	                }
	                if (playlistinfo.musicbrainz.artistid == "") {
	                	playlistinfo.musicbrainz.artistid = history[i].playlistinfo.musicbrainz.artistid;
	                }
	                if (playlistinfo.title != "" && playlistinfo.title == history[i].playlistinfo.title && metadata.track === null) {
	                    debug.debug("NOWPLAYING","Copying Track data from index",i);
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
	                    debug.debug("NOWPLAYING","Copying Album data from index",i);
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
	        // NOTE: history[0] is not used.
	        if (currenttrack == maxhistorylength) {
	        	debug.shout("NOWPLAYING","History is too long - truncating by one");
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
	    	var t = history[index].playlistinfo.location;
        	if (t.substring(0,11) == 'soundcloud:') {
				if (history[index].playlistinfo.creator == null) {
					// We have to update this, or nowplaying won't realise the artist has changed
					// Really, someone should fix the SoundCloud plugin for Mopidy so it doesn't
					// return null as an artist name... I don't like python so I ain't doin' it.
					history[index].playlistinfo.creator = updates.creator;
				}
				if (index == currenttrack) {
					debug.log("NOWPLAYING","Got SoundCloud updates",updates);
	        		infobar.setLastFMCorrections(updates);
	        	}
            }
        },

		progressUpdate: function(percent) {
			if (currenttrack > 0) {
				history[currenttrack].updateProgress(percent);
			}
		},

        setRating: function(evt) {
            if (prefs.apache_backend == 'sql') {
                var position = getPosition(evt);
                var elem = $(evt.target);
                var width = elem.width();
                var offset = elem.offset();
                var rating = Math.ceil(((position.x - offset.left - 6)/width) * 5);
                var index = elem.next().val();
                if (index == -1) index = currenttrack;
				if (index > 0) {
		            debug.log("NOWPLAYING", "Setting Rating to",rating,"on index",index);
		            // The image will get updated anyway, but this makes it more responsive
		            elem.attr("src", "newimages/"+rating+"stars.png");
					history[index].setMeta('set', 'Rating', rating.toString());
					if (prefs.synclove && lastfm.isLoggedIn() && rating >= prefs.synclovevalue) {
						history[index].love();
						if (index == currenttrack) {
			            	$("#love").effect('pulsate', {times: 1}, 2000);
			            }
					}
				}
            } else {
                alert(language.gettext('label_nosql')+'. Please Read http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/');
            }
        },

		addTags: function(index, tags) {
			if (!index) index = currenttrack;
            var tagarr = tags.split(',');
			if (index > 0) {
	            debug.log("NOWPLAYING", "Adding tags",tags,"to index",index);
				history[index].setMeta('set', 'Tags', tagarr);
				if (lastfm.isLoggedIn() && prefs.synctags) {
					history[index].addlfmtags(tags);
				}
			}
		},

		removeTag: function(event, index) {
			if (!index) index = currenttrack;
            var tag = $(event.target).parent().parent().text();
            tag = tag.replace(/x$/,'');
			if (index > 0) {
	            debug.log("NOWPLAYING", "Removing tag",tag,"from index",index);
				history[index].setMeta('remove', 'Tags', tag);
				if (lastfm.isLoggedIn() && prefs.synctags) {
					history[index].remlfmtags(tag);
				}
			}
		},

		incPlaycount: function(index) {
			if (!index) index = currenttrack;
			history[index].setMeta('inc', 'Playcount', 1);
		},

		love: function() {
			if (lastfm.isLoggedIn()) {
				history[currenttrack].love();
	            $("#love").effect('pulsate', {times: 1}, 2000);
			}
			if (prefs.synclove) {
				history[currenttrack].setMeta('set', 'Rating', prefs.synclovevalue);
			}
		},

		isThisCurrent: function(index) {
			return (index == currenttrack);
		},

		dumpHistory: function() {
			for (var i in history) {
				debug.log("NOWPLAYING", "History index",i,history[i]);
			}
		}

	}

}();

