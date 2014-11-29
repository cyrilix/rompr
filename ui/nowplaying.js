function trackDataCollection(currenttrack, nowplayingindex, artistindex, playlistinfo) {

	var self = this;
	var collections = new Array();
	this.playlistinfo = playlistinfo;
	this.currenttrack = currenttrack;
	this.nowplayingindex = nowplayingindex;
	this.artistindex = artistindex;

	this.isCurrentTrack = function() {
		return nowplaying.isThisCurrent(self.currenttrack);
	}

	this.updateProgress = function(percent) {
		if (collections['soundcloud'] !== undefined) {
			collections['soundcloud'].progressUpdate(percent);
		}
	}

	function startSource(source) {
		debug.mark("TRACKDATA",self.nowplayingindex,"Starting collection",source);
		var requirements = (nowplaying.getPlugin(source)).getRequirements(self);
		for (var i in requirements) {
			if (collections[requirements[i]] === undefined) {
				debug.mark("TRACKDATA",self.nowplayingindex,"Starting collection",source,"requirement",requirements[i]);
				startSource(requirements[i]);
			}
		}
		collections[source] = new (nowplaying.getPlugin(source)).collection(
			self,
			self.playlistinfo.metadata.artists[self.artistindex],
			self.playlistinfo.metadata.album,
			self.playlistinfo.metadata.track
		);
		collections[source].populate();
	}

	this.doArtistChoices = function() {
		debug.log("TRACKDATA",self.nowplayingindex,"Doing Artist Choices",self.artistindex);
		if (playlistinfo.metadata.artists.length > 1) {
			var htmlarr = new Array();;
			for (var i in playlistinfo.metadata.artists) {
				var html = '<span class="infoclick clickartistchoose';
				if (i == self.artistindex) {
					html = html + ' bsel'
				}
				html = html + '">'+playlistinfo.metadata.artists[i].name+'</span>'+
				'<input type="hidden" value="'+playlistinfo.metadata.artists[i].nowplayingindex+'" />';
				htmlarr.push(html);
			}
			$("#artistchooser").html(htmlarr.join('&nbsp;|&nbsp;'));
			$("#artistchooser").stop().slideDown('fast');
		}
	}

	this.handleClick = function(source, panel, element, event) {
		collections[source].handleClick(panel, element, event);
	}

	this.sendDataToBrowser = function(waitingon) {
		debug.log("TRACKDATA",self.nowplayingindex,"Telling",waitingon.source,"to start displaying");
		collections[waitingon.source].displayData();
	}

	this.stopDisplaying = function(waitingon) {
		for (var coll in collections) {
			debug.debug("TRACKDATA",self.nowplayingindex,"Telling",coll,"to stop displaying");
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

	this.setMeta = function(action, type, value) {
		collections['ratings'].setMeta(action, type, value);
	}

	// Create the data collections we need

	this.populate = function(source, isartistswitch) {
		if (collections['ratings'] === undefined) startSource('ratings');
		// Last.FM needs to be running as it's used for love, ban, and autocorrect
		if (collections['lastfm'] === undefined && (prefs.lastfm_autocorrect || lastfm.isLoggedIn())) {
			startSource('lastfm');
		}
		if (collections[source] === undefined) startSource(source);
		browser.dataIsComing(
			self,
			isartistswitch,
			self.nowplayingindex,
			source,
			self.playlistinfo.creator,
			self.playlistinfo.metadata.artists[artistindex].name,
			(self.playlistinfo.albumartist && self.playlistinfo.albumartist != "") ? self.playlistinfo.albumartist : self.playlistinfo.creator,
			self.playlistinfo.metadata.album.name,
			self.playlistinfo.metadata.track.name
		);
	};

}

var nowplaying = function() {

	var history = new Array();
	var plugins = new Array();
    var currenttrack = 0;
    var nowplayingindex = 0;
    var currentbackendid = -1;

    function findCurrentTrack() {
    	for (var i in history) {
    		if (history[i] !== undefined && history[i].currenttrack == currenttrack) {
    			return i;
    		}
    	}
    	debug.error("NOWPLAYING","Failed to find current track!");
    }

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

			infobar.setNowPlayingInfo(playlistinfo);
			if (playlistinfo.backendid == currentbackendid) {
				debug.warn("NOWPLAYING","Meet the new track, same as the old track");
				return;
			}
			if (playlistinfo == playlist.emptytrack) {
				return;
			}
			currentbackendid = playlistinfo.backendid;
	        debug.mark("NOWPLAYING","New Track:",playlistinfo);

	        // Repeatedly querying online databases for the same data is a bad idea -
	        // it's slow, it means we have to store the same data multiple times,
	        // and some databases (musicbrainz) will start to severely rate-limit you
	        // if you do it. Hence we see if we've got stuff we can copy.
	        // (Note Javascript is a by-reference language, so all we're copying is
	       	// references to one pot of data).

			// See if we can copy artist data
			for (var i in playlistinfo.metadata.artists) {
				acheck: {
					for (var j = nowplayingindex; j > 0; j--) {
						if (history[j] 	!== undefined) {
							for (var k in history[j].playlistinfo.metadata.artists) {
								if (playlistinfo.metadata.artists[i].name == history[j].playlistinfo.metadata.artists[k].name) {
									debug.log("NOWPLAYING","Using artist info from",j,k,"for",i);
									playlistinfo.metadata.artists[i] = history[j].playlistinfo.metadata.artists[k];
									break acheck;
								}
							}
						}
					}
				}
			}

			// See if we can copy album and track data
			for (var j = nowplayingindex; j > 0; j--) {
				if (history[j] !== undefined) {
		            var newalbumartist = (playlistinfo.albumartist == "") ? playlistinfo.creator : playlistinfo.albumartist;
		            var albumartist = (history[j].playlistinfo.albumartist == "") ? history[j].playlistinfo.creator : history[j].playlistinfo.albumartist;
		            if (newalbumartist == albumartist) {
		            	if (playlistinfo.metadata.album.name == history[j].playlistinfo.metadata.album.name) {
		            		debug.log("NOWPLAYING","Using album info from",j);
		            		playlistinfo.metadata.album = history[j].playlistinfo.metadata.album;
		            		if (playlistinfo.metadata.track.name == history[j].playlistinfo.metadata.track.name) {
			            		debug.log("NOWPLAYING","Using track info from",j);
		            			playlistinfo.metadata.track = history[j].playlistinfo.metadata.track;
		            		}
		            	}
		            }
		        }
	        }

	        currenttrack++;
	        for (var i in playlistinfo.metadata.artists) {
	        	nowplayingindex++;
	        	playlistinfo.metadata.artists[i].nowplayingindex = nowplayingindex;
				history[nowplayingindex] = new trackDataCollection(currenttrack, nowplayingindex, i, playlistinfo);
				// IF there are multiple artists we will be creating multiple trackdatacollections.
				// BUT we only tell the first one to poulate - this prevents the others from trying to
				// populate the album and track info which is shared between them
				if (i == 0)  {
					history[nowplayingindex].populate(prefs.infosource, false);
				}
			}
		},

		remove: function(npindex) {
			// Browser has truncated its history, so we no longer need to hold on to
			// an item. Rather than splice the array and go through a whole lot of rigmarole,
			// just set the entry to undefined. This will permit garbage collection in the
			// browser to tidy it up.
			history[npindex] = undefined;
		},

		switchArtist: function(source, npindex) {
			if (history[npindex] !== undefined) {
				history[npindex].populate(source, true);
			} else {
				infobar.notify(infobar.NOTIFY, "Browser history has been truncated - artist cannot be displayed");
			}
		},

		setLastFMCorrections: function(index, updates) {
			debug.log("NOWPLAYING","Recieved last.fm corrections for index",index);
			if (index == currenttrack) {
		    	var t = history[findCurrentTrack()].playlistinfo.location;
            	if (t.substring(0,11) == 'soundcloud:') {
            		debug.log("NOWPLAYING","Not sending LastFM Updates because this track is from soundcloud");
            	} else {
					infobar.setLastFMCorrections(updates);
				}
			}
		},

		progressUpdate: function(percent) {
			if (currenttrack > 0) {
				history[findCurrentTrack()].updateProgress(percent);
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
                if (index == -1) index = findCurrentTrack();
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
			if (!index) index = findCurrentTrack();
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
			if (!index) index = findCurrentTrack();
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
			if (!index) index = findCurrentTrack();
			history[index].setMeta('inc', 'Playcount', 1);
		},

		love: function() {
			if (lastfm.isLoggedIn()) {
				history[findCurrentTrack()].love();
	            $("#love").effect('pulsate', {times: 1}, 2000);
			}
			if (prefs.synclove) {
				history[findCurrentTrack()].setMeta('set', 'Rating', prefs.synclovevalue);
			}
		},

		isThisCurrent: function(index) {
			return (index == currenttrack);
		}

	}

}();

