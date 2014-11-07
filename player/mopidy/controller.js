function playerController() {

	var self = this;
	// var urischemes = new Object();
	var tracklist = new Array();
	var isReady = false;
	var tracksToAdd = new Array();
	var albumtracks = new Array();
	var tltracksToAdd = new Array();
	var timerTimer = null;
	var stoptimer = null;
    var progresstimer = null;
    var tracknotfound = true;
    var consoleError = console.error.bind(console);
    var mopidy = null;
    var tlchangeTimer = null;
    var plstartpos = null;
    var pladdpos = null;
    var att = null;
    var updatePlTimer = null;
    var doingPlUpdate = false;
    var timecheckcounter = 0;

    function mopidyStateChange(data) {
        debug.shout("PLAYER","Mopidy State Change",data);
        clearTimeout(stoptimer);
        clearTimeout(progresstimer);
        switch(data.new_state) {
            case "playing":
                player.status.state = "play";
                break;
            case "stopped":
                player.status.state = "stop";
                stoptimer = setTimeout(checkEndOfList, 2000);
                playlist.stopped();
                break;
            case "paused":
                player.status.state = "pause";
                break;
        }
        infobar.updateWindowValues();
    }

    function trackPlaybackStarted(data) {
        debug.shout("PLAYER","Track Playback Started",data);
        setStatusValues(data.tl_track);
		player.status.elapsed = 0;
		infobar.setStartTime(0);
        timecheckcounter = 0;
        checkPlaybackTime();
    	if (playlist.findCurrentTrack()) {
    		onFoundTrack();
    	} else {
    		debug.log("PLAYER", "Current track NOT Found");
    		tracknotfound = true;
    	}
    }

	function onFoundTrack() {
    	debug.shout("PLAYER", "Current track Found",playlist.currentTrack);
        nowplaying.newTrack(playlist.currentTrack);
        tracknotfound = false;
        self.checkProgress();
    }

    function trackPlaybackEnded(data) {
        debug.shout("PLAYER","Track Playback Ended",data);
        playlist.trackchanged();
    	if (player.status.single == 1) {
    		mopidy.tracklist.setSingle(false);
    		player.status.single = 0;
    	}
    }

    function trackPlaybackPaused(data) {
        debug.shout("PLAYER","Track Playback Paused",data);
        player.status.elapsed = data.time_position/1000;
        infobar.setStartTime(player.status.elapsed);
    }

    function trackPlaybackResumed(data) {
        debug.shout("PLAYER","Track Playback Resumed",data);
        player.status.elapsed = data.time_position/1000;
        infobar.setStartTime(player.status.elapsed);
        self.checkProgress();
    }

    function seeked(data) {
        debug.shout("PLAYER","Track Seeked",data);
        player.status.elapsed = data.time_position/1000;
        infobar.setStartTime(player.status.elapsed);
        self.checkProgress();
        infobar.updateWindowValues();
	}

	function tracklistChanged() {
		// Don't repopulate immediately in case there are more coming
		debug.shout("PLAYER","Tracklist Changed");
		clearTimeout(tlchangeTimer);
		tlchangeTimer = setTimeout(playlist.repopulate, 400);
	}

	function checkPlaybackTime() {
		clearTimeout(timerTimer);
		mopidy.playback.getTimePosition().then(function(pos) {
			debug.log("PLAYER","Playback position is",parseInt(pos));
			if (player.status.state == "play") {
				player.status.elapsed = parseInt(pos)/1000;
				infobar.setStartTime(player.status.elapsed);
				if (player.status.elapsed == 0) {
                    // Playback has not started - perhaps a stream is being buffered
                    // or a hard disc is spinning up. Keep checking.
					timerTimer = setTimeout(checkPlaybackTime, 1000);
				} else if (timecheckcounter < 2) {
                    // Mopidy seems to report an incorrect playback time sometimes
                    // near the start of playback, so we just check a few times
                    // to be sure.
                    timecheckcounter++;
                    timerTimer = setTimeout(checkPlaybackTime, 2000);
                }
			}
		});
	}

	function checkEndOfList() {
		debug.log("PLAYER","Checking playlist state");
    	mopidy.playback.getCurrentTlTrack().then( function(data) {
			debug.log("PLAYER","Got Playlist State");
    		// null means no track selected - we use this to detect
    		// that we've reached the end of the playlist
    		if (data === null) {
    			debug.log("PLAYER","Current track is undefined");
    			player.status.songid = undefined;
    			player.status.elapsed = undefined;
    			player.status.file = undefined;
    	        nowplaying.newTrack(playlist.emptytrack);
		        $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
		        $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
    		}
    	}, consoleError);
    }

	function enableMopidyEvents() {
		if (!isReady) {
			debug.warn("MOPIDY","EnableEvents called when mopidy not ready");
			return 0;
		}
        mopidy.on("event:playlistsLoaded", self.reloadPlaylists);
        mopidy.on("event:playbackStateChanged", mopidyStateChange);
        mopidy.on("event:trackPlaybackStarted", trackPlaybackStarted);
        mopidy.on("event:trackPlaybackEnded", trackPlaybackEnded);
        mopidy.on("event:trackPlaybackPaused", trackPlaybackPaused);
        mopidy.on("event:trackPlaybackResumed", trackPlaybackResumed);
        mopidy.on("event:seeked", seeked);
		mopidy.on("event:tracklistChanged", tracklistChanged);
	}

	function setStatusValues(tl_track) {
		if (tl_track) {
	        player.status.songid = tl_track.tlid;
	        player.status.file = tl_track.track.uri;
	        player.status.Date = tl_track.track.date;
	        player.status.bitrate = tl_track.track.bitrate || 'None';
	        player.status.Title = tl_track.track.name;
	        player.status.performers = tl_track.track.performers;
	        player.status.composers = tl_track.track.composers;
	        player.status.Genre = tl_track.track.genre;
	        player.status.Comment = tl_track.track.comment;
	    }
	}

    function playTlTrack(track) {
        debug.log("PLAYER","Playing Track",track);
        mopidy.playback.play(track,1).then( function(data){ }, consoleError);
    }

    function checkDomain(element) {
        if ($("#limitsearch").is(':checked')) {
            if ($(element).is(':checked')) {
                return true;
            } else {
                return false;
            }
        } else {
            // return false to leave an empty array meaning ALL domains
            // get searched - this means new backends we don't know about
            // can be added and they'll still be searched
            return false;
        }
    }

	function sortByAlbum(tracks) {
		// Takes an array of unsorted mopidy.models.track and sorts them by albums
		// ONLY works with spotify tracks!
		debug.log("PLAYER", "Sorting tracks into albums");
		var albums = {};
		for (var i in tracks) {
			if (!albums.hasOwnProperty(tracks[i].album.uri)) {
				albums[tracks[i].album.uri] = new Array();
			}
			albums[tracks[i].album.uri].push(tracks[i]);
		}
		for (var i in albums) {
			albums[i].sort(function(a,b){ return a.track_no - b.track_no });
		}
		var result = new Array();
		for (var i in albums) {
			for (var j in albums[i]) {
				result.push(albums[i][j]);
			}
		}
		return result;
	}

	function mopidyTooOld() {
		alert(language.gettext("mopidy_tooold", [prefs.mopidy_version]));
	}

	function doTracklistButtons() {
		player.status.xfade = 0;
		mopidy.tracklist.getRandom().then( function(data) {
			player.status.random = (data) ? 1 : 0;
    		mopidy.tracklist.getRepeat().then( function(data) {
			    player.status.repeat = (data) ? 1 : 0;
	    		mopidy.tracklist.getConsume().then( function(data) {
	    			player.status.consume = (data) ? 1 : 0;
	    			setPlaylistButtons();
	    		},consoleError);
    		},consoleError);
    	},consoleError);
    	mopidy.playback.getMute().then(function(m){
    		var i = (m) ? 1 : 0;
    		$("#outputbutton0").removeClass("togglebutton-0 togglebutton-1").addClass("togglebutton-"+i);
    	},consoleError);
	}

	function formatPlaylistInfo(data) {

	    var html = '';
     	var c = 0;
     	$.each(data, function() {
     		var protocol = this.uri.substr(0, this.uri.indexOf(":"));
     		switch (protocol) {
     			case "spotify":
                    html = html + '<div class="containerbox menuitem">';
     				html = html + '<div class="mh fixed"><img src="'+ipath+'toggle-closed-new.png" class="menu fixed" name="pholder'+c+'"></div>'+
						        '<input type="hidden" name="'+this.uri+'">'+
        				        '<div class="fixed playlisticon"><img height="12px" src="'+ipath+'spotify-logo.png" /></div>'+
						        '<div class="expand clickable clickloadplaylist">'+this.name+'</div>'+
						        '</div>'+
						        '<div id="pholder'+c+'" class="dropmenu notfilled"></div>';
						        break;
                case "radio-de":
                   html = html + '<div class="containerbox menuitem clickable clicktrack" name="'+this.uri+'">'+
                                '<div class="fixed playlisticon"><img height="12px" src="'+ipath+'broadcast-12.png" /></div>'+
                                '<div class="expand">'+this.name+'</div>'+
                                '</div>';
                                break;
				default:
		           html = html + '<div class="containerbox menuitem clickable clicktrack" name="'+this.uri+'">'+
								'<div class="fixed playlisticon"><img height="12px" src="'+ipath+'document-open-folder.png" /></div>'+
						        '<div class="expand">'+this.name+'</div>'+
						        '</div>';
						        break;
     		}
     		c++;
     	});

	    $("#storedplaylists").html(html);
	}

	// This is the beginning of our ability to update the collection on the fly
	// - because mopidy is good :)
	function checkTracksAgainstDatabase(data) {
    	debug.log("PLAYER","Seeing if we need to add new tracks to the database");
        $.ajax({
            type: "POST",
            url: "onthefly.php",
            data: JSON.stringify(data),
            dataType: "json",
            timeout: 600000,
            success: function(data) {
            	debug.log("PLAYER","Checktracks has returned");
            	updateCollectionDisplay(data);
                doingPlUpdate = false;
            },
            error: function(data) {
            	debug.error("PLAYER","Checktracks Failed",data);
                doingPlUpdate = false;
            }
        });

	}

	this.startAddingTracks = function() {
		var t = albumtracks.shift() || tracksToAdd.shift();
		if (t) {
    		switch (t.type) {
    			case "uri":
    				if (t.findexact) {
    					// We use this for filtering items when we add a spotify:artist link.
    					// The reason is that adding spotify:artist:whatever to the playlist
    					// adds every *album* that artist is on, including compilations -
    					// thus we get loads of tracks that *aren't* by that artist.
    					debug.log("PLAYER","addTracks has a findexact filter to apply",t.findexact,t.filterdomain);
    					mopidy.library.findExact(t.findexact, t.filterdomain).then(function(data) {
    						if (data[0].tracks)	tltracksToAdd = tltracksToAdd.concat(sortByAlbum(data[0].tracks));
    						clearTimeout(att);
    						att = setTimeout(self.startAddingTracks, 20);
    					}, consoleError);
    				} else {
			    		debug.log("PLAYER","addTracks Adding",t.name);
			    		mopidy.library.lookup(t.name).then(function(tracks) {
			    			tltracksToAdd = tltracksToAdd.concat(tracks);
    						clearTimeout(att);
    						att = setTimeout(self.startAddingTracks, 20);
			    		}, consoleError);
		    		}
	    			break;

	    		case "playlist":
	    			self.loadSpecial(t.name,null,null);
	    			break;

	    		case "item":
		    		debug.log("PLAYER","addTracks Adding",t.name);
	    			$.getJSON("getItems.php?item="+t.name, function(data) {
	    				albumtracks = albumtracks.concat(data);
						clearTimeout(att);
						att = setTimeout(self.startAddingTracks, 20);
	    			});
	    			break;

	    		case "delete":
		    		debug.log("PLAYER","addTracks Deleting ID",t.name);
		    		if (pladdpos !== null && pladdpos > 0) {
		    			// Adjust the insert position. This will only be used for Last.FM
		    			// so we know that the track being deleted is before pladdpos in
		    			// the playlist. For other situations this'll need a rethink.
		    			pladdpos--;
		    		}
	    			mopidy.tracklist.remove({'tlid': [parseInt(t.name)]}).then( self.startAddingTracks );
	    			break;

    		}
    		t = null;
		} else {
			debug.log("MOPIDY","TlTracks Array is",tltracksToAdd);
			if (tltracksToAdd.length > 0) {
				mopidy.tracklist.add(tltracksToAdd, pladdpos, null).then( function() {
					tltracksToAdd = [];
					pladdpos = null;
				}, consoleError);
			} else {
				infobar.notify(infobar.NOTIFY, "Couldn't find any tracks");
				playlist.repopulate();
				pladdpos = null;
			}
		}
	}

	function checkSearchDomains() {
		if (isReady) {
            $("#mopidysearcher").find('.searchdomain').each( function() {
                var v = $(this).attr("value");
                if (v == "radio_de") {
                    v = "radio-de";
                }
                if (!player.canPlay(v)) {
                    $(this).parent().remove();
                }
            });
        }
    }

	function connected() {
        debug.log("PLAYER","Connected to Mopidy");
        infobar.removenotify();
        if ('getVersion' in mopidy) {
        	mopidy.getVersion().then(function(version){
    			debug.log("PLAYER", "Mopidy Version is",version);
    			if (version < prefs.mopidy_version) {
    				mopidyTooOld();
    			}
        	});
        } else {
        	mopidyTooOld();
        }
        isReady = true;
		enableMopidyEvents();
    	mopidy.playback.getCurrentTlTrack().then( function(data) {
    		debug.log("PLAYER","Current tl_track is",data);
    		if (data) {
    			setStatusValues(data);
    		}
    		mopidy.playback.getVolume().then( function(v) {
    			player.status.volume = v;
	    		mopidy.playback.getState().then( function(s) {
	    			switch (s) {
			            case "playing":
			                player.status.state = "play";
			                break;
			            case "stopped":
			                player.status.state = "stop";
			                break;
			            case "paused":
			                player.status.state = "pause";
			                break;
			        }
    	    		mopidy.playback.getTimePosition().then(function(pos) {
	    				player.status.elapsed = parseInt(pos)/1000;
	    				infobar.setStartTime(player.status.elapsed);
				        infobar.updateWindowValues();
	    				playlist.repopulate();
	    				doTracklistButtons();
	    			});
    			});
    		});
		});
        mopidy.getUriSchemes().then( function(data) {
            for(var i =0; i < data.length; i++) {
            	debug.log("PLAYER","Mopidy URI Scheme : ",data[i]);
                player.urischemes[data[i]] = true;
            }
			checkSearchDomains();
			if (!player.collectionLoaded) {
				debug.log("PLAYER","Checking Collection");
				checkCollection();
			} else {
                self.reloadPlaylists();
            }
			playlist.radioManager.init();
        });
        self.cancelSingle();
	}

	function disconnected() {
        debug.warn("PLAYER","Mopidy Has Gone Offline");
        infobar.notify(infobar.PERMERROR,
        	language.gettext("mopidy_down")+'<br><a href="#" onclick="player.controller.reConnect()">Click To Reconnect</a>');
        isReady = false;
        mopidy.off("event:playlistsLoaded");
        mopidy.off("event:playbackStateChanged");
        mopidy.off("event:trackPlaybackStarted");
        mopidy.off("event:seeked");
        mopidy.off("event:trackPlaybackEnded");
        mopidy.off("event:trackPlaybackPaused");
        mopidy.off("event:trackPlaybackResumed");
		mopidy.off("event:tracklistChanged");
		tracknotfound = true;
	}

    this.initialise = function() {
        debug.shout("PLAYER","Connecting to Mopidy HTTP frontend");
        debug.log("PLAYER","ws://"+prefs.mopidy_http_address+":"+prefs.mopidy_http_port+"/mopidy/ws/");
        mopidy = new Mopidy({
            webSocketUrl: "ws://"+prefs.mopidy_http_address+":"+prefs.mopidy_http_port+"/mopidy/ws/",
            callingConvention: "by-position-only",
            autoConnect:false
        });
        mopidy.on("state:online", connected);
        mopidy.on("state:offline", disconnected);
        mopidy.connect();
	    self.mop = mopidy;
	}

	this.reConnect = function() {
		mopidy.close();
		mopidy.connect();
	}

	this.isConnected = function() {
		return isReady;
	}

	this.updateCollection = function(cmd) {
        prepareForLiftOff(language.gettext("label_updating"));
        debug.log("PLAYER","Updating collection with command", cmd);
        mopidy.library.refresh().then( function() {
        	debug.log("PLAYER", "Refresh Success");
        	checkPoll({data: 'dummy' })
        }, consoleError);
	}

	this.reloadAlbumsList = function(uri) {
        if (uri.match(/rebuild/)) {
            mopidy.library.search({}).then( function(data) {
            	debug.log("PLAYER","Got Mopidy Library Response");
                $.ajax({
                    type: "POST",
                    url: uri,
                    data: JSON.stringify(data),
                    timeout: 600000,
                    contentType: "application/json",
                    success: function(data) {
                        $("#collection").html(data);
                        data = null;
                        player.collectionLoaded = true;
                        self.reloadPlaylists();
                    },
                    error: function(data) {
                        $("#collection").empty();
                        alert(language.gettext("label_update_error"));
                    	debug.error("PLAYER","Failed to generate albums list",data);
                    }
                });
	        }, consoleError);
        } else {
            debug.log("PLAYER","Loading",uri);
	        $("#collection").load(uri, function() {
                player.collectionLoaded = true;
	        	self.reloadPlaylists();
	        });
        }
	}

	this.reloadFilesList = function(uri) {
		self.browse(null, "filecollection");
	}

	this.reloadPlaylists = function() {
        clearTimeout(updatePlTimer);
		if (isReady) {
            if (doingPlUpdate) {
                // Prevent simultaneous updates from running
                debug.shout("PLAYER","Request to update playlists when already doing so");
                updatePlTimer = setTimeout(self.reloadPlaylists, 2000);
            } else {
                debug.log("PLAYER","Retreiving Playlists from Mopidy");
                doingPlUpdate = true;
                mopidy.playlists.getPlaylists().then(function (data) {
                	debug.log("PLAYER","Got Playlists from Mopidy",data);
                	formatPlaylistInfo(data);
                    if (prefs.apache_backend == "sql" && player.collectionLoaded && prefs.onthefly) {
                        for (var i in data) {
                            // Make sure we've got some Spotify playlists
                            if (data[i].uri.match(/^spotify/)) {
                                checkTracksAgainstDatabase(data);
                                break;
                            }
                        }
                    } else {
                        doingPlUpdate = false;
                    }
                }, consoleError);
            }
        }
	}

	this.browse = function(what, where,element) {
		debug.log("PLAYER","Browsing for",what,where);
		mopidy.library.browse(what).then( function(data) {
			var html = "";
			debug.log("PLAYER","Browse result : ",data);
            if (data) {
    			$.each(data, function(i,ref) {
    				switch (ref.type) {
    					case "directory":
    					case "album":
    						var menuid = hex_md5(ref.uri);
    						// Mopidy's SoundCloud plugin does some fucking awful shit with directory names.
    						var shit = decodeURIComponent(decodeURIComponent(ref.name));
    				        html = html + '<div class="containerbox menuitem">'+
    				        '<div class="mh fixed"><img src="'+ipath+'toggle-closed-new.png" class="menu fixed" name="'+menuid+'"></div>'+
    				        '<input type="hidden" name="'+ref.uri+'">'+
    				        '<div class="fixed playlisticon"><img width="16px" src="'+ipath+'folder.png" /></div>'+
    				        '<div class="expand">'+shit.replace(/\+/g, ' ')+'</div>'+
    				        '</div>'+
    				        '<div id="'+menuid+'" class="dropmenu notfilled"></div>';
    				        break;
    				    case "track":
                            if (!ref.name.match(/\[unplayable\]/)) {
        				        html = html + '<div class="clickable clicktrack ninesix indent containerbox padright line" name="'+encodeURIComponent(ref.uri)+'">'+
        				        '<div class="playlisticon fixed"><img height="16px" src="'+ipath+'audio-x-generic.png" /></div>'+
        				        '<div class="expand">'+decodeURIComponent(ref.name)+'</div>'+
        				        '</div>';
                            }
    				        break;
    					case "playlist":
    				        html = html + '<div class="clickable clickplaylist ninesix indent containerbox padright line" name="'+encodeURIComponent(ref.uri)+'">'+
    				        '<div class="playlisticon fixed"><img height="16px" src="'+ipath+'document-open-folder.png" /></div>'+
    				        '<div class="expand">'+decodeURIComponent(ref.name)+'</div>'+
    				        '</div>';
    				        break;
    				}
    			});
            } else {
                html = '<div class="indent padright line">Nothing found</div>';
            }
			$("#"+where).html(html);
			if (where != "filecollection") {
            	$('#'+where).removeClass("notfilled");
            	$('#'+where).menuReveal();
                element.removeClass('spinner');
            }
		},
		consoleError );

	}

	this.loadPlaylist = function(uri) {
		mopidy.tracklist.clear().then( function() {
			$.get("cleanPlaylists.php?command=clear");
            mopidy.playlists.lookup(uri).then( function(list) {
                debug.debug("PLAYER","Playlist : ",list);
                mopidy.tracklist.add(list.tracks);
            });
        });
	}

	this.loadSpecial = function(uri, play, pos) {
		// This is used for Spotify Browse functions - just looking up the playlist
		// or simply adding it to the tracklist can often return lots of [loading] ..
		// track names in our playlist. So we use our internal mechanism to add the tracks
		// one by one by URI, which forces mopidy to look them up.
		debug.log("MOPIDY","Looking up",uri);
        mopidy.library.lookup(uri).then( function(list) {
        	var tracks = new Array();
        	$.each(list, function(i, e){ tracks.push({type: "uri", name: e.uri})});
        	self.addTracks(tracks,play,pos);
        });
	}

	this.deletePlaylist = function(name) {
		alert(language.gettext("label_notsupported"));
	}

	this.clearPlaylist = function() {
		mopidy.tracklist.clear();
		$.get("cleanPlaylists.php?command=clear");
	}

	this.savePlaylist = function() {
		alert(language.gettext("label_notsupported"));
	}

	this.getPlaylist = function() {
        debug.log("PLAYER","Using Mopidy HTTP connection for playlist");
        mopidy.tracklist.getTlTracks().then( function (data) {
            debug.log("PLAYER","Got Playlist from Mopidy:",data);
            tracklist = data;
            if (plstartpos !== null && plstartpos > -1) {
            	mopidy.playback.play(tracklist[plstartpos]);
            	plstartpos = null;
            }
            $.ajax({
                type: "POST",
                url: "getplaylist.php",
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
                success: playlist.newXSPF,
                error: function(j, e, s) {
                    debug.error("PLAYLIST",j);
                    debug.error("PLAYLIST",e);
                    debug.error("PLAYLIST",s);
                    playlist.updateFailure();
                }
            });
            data = null;
        }, consoleError);
	}

	this.search = function(searchtype) {
        debug.shout("MOPIDY","Doing Search",searchtype);
        var terms = {};
        var termcount = 0;
        $("#mopidysearcher").find('.searchterm').each( function() {
            var key = $(this).attr('name');
            var value = $(this).attr("value");
            if (value != "") {
                if (key == 'tag') {
                	terms[key] = value.split(',');
                } else {
                	terms[key] = [value];
                }
                termcount++;
            }
        });
        if ($('[name="searchrating"]').val() != "") {
        	terms['rating'] = $('[name="searchrating"]').val();
        	termcount++;
        }
        var domains = new Array();
        var fanny = 0;
        var prefssave = { search_limit_limitsearch: $("#limitsearch").is(':checked') ? 1 : 0 };
        $("#mopidysearcher").find('.searchdomain').each( function() {
            if (checkDomain(this)) {
                debug.log("PLAYER","Search Type", $(this).attr("value"));
                var d = $(this).attr("value");
                if (d == "radio_de") {
                    // We can't have a pref value with a - in it; javascript interprets it as a math function
                    d = "radio-de";
                }
                domains.push(d+":");
                fanny++;
            }
            prefssave['search_limit_'+$(this).attr("value")] = $(this).is(':checked') ? 1 : 0;
        });
        prefs.save(prefssave);
        if (termcount > 0 && (!($("#limitsearch").is(':checked')) || fanny > 0)) {
            $("#searchresultholder").empty();
            doSomethingUseful('searchresultholder', language.gettext("label_searching"));
            debug.log("PLAYER","Doing Search:", terms, domains);
            if ((termcount == 1 && (terms.tag || terms.rating)) ||
            	(termcount == 2 && (terms.tag && terms.rating))) {
            	debug.log("PLAYER","Doing Database Search");
            	// We're only looking for a tag and/or a rating, so use the
            	// database search engine
                $.ajax({
                    type: "POST",
                    url: "albums.php",
                    data: {terms: terms, domains: domains},
                    success: function(data) {
                        $("#searchresultholder").html(data);
		                data = null;
                    },
                    error: function() {
                        $("#searchresultholder").empty();
                        infobar.notify(infobar.ERROR,"Search Failed");
                    }
                });
            } else {
            	// If we're looking for anything else, let mopidy do the search
            	// and the collectioniser will compare the results against the
            	// database if we're looking for tags and/or ratings.
            	// The allows us to keep the data in our database to a minimum -
            	// i.e. we'd have to include genre, composer, performer etc if we
            	// didn't do this. Also it means search results will always be
            	// consistent because the same search engine is always being used.
            	debug.log("PLAYER","Doing Mopidy Search");
            	var dbterms = false;
                if (terms.tag || terms.rating) {
					dbterms = { '__model__': 'DBTerms'};
					if (terms.tag) {
						dbterms['tags'] = terms.tag;
						delete terms.tag;
					}
					if (terms.rating) {
						dbterms['rating'] = terms.rating;
						delete terms.rating;
					}
                }
	            mopidy.library[searchtype](terms, domains).then( function(data) {
	            	if (dbterms) {
	            		// Make sure the tags and rating search terms are the
	            		// first in the list so the parser finds them before it
	            		// starts collectionising the results.
						data.unshift(dbterms);
	            	}
	                debug.log("PLAYER","Search Results",data);
	                $.ajax({
                        type: "POST",
                        url: "albums.php",
                        data: JSON.stringify(data),
                        contentType: "application/json",
                        success: function(data) {
                            $("#searchresultholder").html(data);
                            data = null;
	                    },
	                    error: function() {
	                        $("#searchresultholder").empty();
	                        infobar.notify(infobar.ERROR,"Search Failed");
	                    }
                    });
	                data = null;
	            }, function() {
                    $("#searchresultholder").empty();
                    infobar.notify(infobar.ERROR,"Search Failed");
                });
	        }
        }
	}

	this.play = function() {
		debug.log("PLAYER","Playing");
        mopidy.playback.play();
	}

	this.pause = function() {
		debug.log("PLAYER","Pausing");
		mopidy.playback.pause();
	}

	this.stop = function() {
		debug.log("PLAYER","Stopping");
        mopidy.playback.stop();
	}

	this.next = function() {
		if (player.status.state == 'play') {
        	clearTimeout(progresstimer);
			debug.log("PLAYER","Nexting");
			mopidy.playback.next();
		}
	}

	this.previous = function() {
		if (player.status.state == 'play') {
        	clearTimeout(progresstimer);
			debug.log("PLAYER","Preving");
			mopidy.playback.previous();
		}
	}

	this.seek = function(seekto) {
        mopidy.playback.seek(seekto*1000);
	}

	this.playId = function(id) {
        debug.log("PLAYER","Playing ID",id);
        for(var i = 0; i < tracklist.length; i++) {
            if (tracklist[i].tlid == id) {
        		clearTimeout(progresstimer);
                playTlTrack(tracklist[i]);
                break;
            }
        }
	}

	this.playByPosition = function(pos) {
        debug.log("PLAYER","Playing Position",pos);
        clearTimeout(progresstimer);
        playTlTrack(tracklist[pos]);
	}

	this.clearerror = function() {
		player.status.error = null;
	}

	this.volume = function(volume, callback) {
		mopidy.playback.setVolume(Math.round(volume)).then( function() {
			player.status.volume = volume;
			if (callback) {
				callback();
			}
		});
		return true;
	}

	this.removeId = function(ids) {
		debug.log("PLAYER","Removing Tracks",ids,ids.length);
		mopidy.tracklist.remove({'tlid': ids});
	}

	this.toggleRandom = function() {
		mopidy.tracklist.getRandom().then( function(data) {
			mopidy.tracklist.setRandom(!data);
			player.status.random = (data) ? 0 : 1;
			setPlaylistButtons();
		});
	}

	this.toggleCrossfade = function() {
		infobar.notify(infobar.NOTIFY, language.gettext("label_notsupported"));
	}

	this.setCrossfade = function(v) {
		infobar.notify(infobar.NOTIFY, language.gettext("label_notsupported"));
	}

	this.toggleRepeat = function() {
		mopidy.tracklist.getRepeat().then( function(data) {
			mopidy.tracklist.setRepeat(!data);
			player.status.repeat = (data) ? 0 : 1;
			setPlaylistButtons();
		});
	}

	this.toggleConsume = function() {
		mopidy.tracklist.getConsume().then( function(data) {
			mopidy.tracklist.setConsume(!data);
			player.status.consume = (data) ? 0 : 1;
			setPlaylistButtons();
		});
	}

	this.addTracks = function(tracks, playpos, at_pos) {
		if (tracks.length == 0) return;
		if (mobile != "no") infobar.notify(infobar.NOTIFY, language.gettext("label_addingtracks"));
		debug.log("PLAYER","Adding Tracks",tracks,playpos,at_pos);
		// Add the tracks to a single variable. Otherwise if we get one add request
		// before the previous one has finished the tracks get muddled up
		tracksToAdd = tracksToAdd.concat(tracks);
		if (plstartpos == null || plstartpos == -1) plstartpos = playpos;
		if (pladdpos == null || pladdpos == -1) pladdpos = at_pos;
		if (tracks.length == tracksToAdd.length) {
			clearTimeout(att);
			att = setTimeout(self.startAddingTracks, 50);
		}
		tracks = null;
	}

	this.move = function(first, number, moveto) {
		debug.log("PLAYER","Moving",first,first+number,moveto);
		mopidy.tracklist.move(first, first+number, moveto);
	}

	this.stopafter = function() {
        if (player.status.repeat == 1) {
        	mopidy.tracklist.setRepeat(false);
            player.status.repeat = 0;
            setPlaylistButtons();
        }
    	mopidy.tracklist.setSingle(true)
    	player.status.single = 1;
	}

	this.cancelSingle = function() {
		mopidy.tracklist.setSingle(false);
		player.status.single = 0;
	}

	this.doOutput = function(id, state) {
		if (state) {
			mopidy.playback.setMute(true);
		} else {
			mopidy.playback.setMute(false).then( function() {
    			// Workaround for possible mopidy bug
				mopidy.playback.setVolume(Math.round(player.status.volume));
			});
		}
	}

	this.rawsearch = function(terms, sources, callback) {
        if (sources.length > 0) {
            mopidy.library.search(terms, sources).then( function(data) {
                callback(data);
            },
            function() {
                debug.error("MOPIDY","Raw Search Failed");
                callback([]);
            });
        } else {
    		mopidy.library.search(terms).then( function(data) {
    			callback(data);
    		},
    		function() {
    			debug.error("MOPIDY","Raw Search Failed");
    			callback([]);
    		});
        }
	}

	this.rawfindexact = function(terms, callback) {
		mopidy.library.findExact(terms).then( function(data) {
			callback(data);
		},
		function() {
			debug.error("MOPIDY","Find Exact failed");
			callback([]);
		});
	}

	this.command = function(cmd, callback) {
		// For compatability
		if (callback) {
			callback();
		}
	}

    this.postLoadActions = function() {
    	if (tracknotfound || player.status.state == "stop") {
	        if (playlist.currentTrack) {
	        	onFoundTrack();
	        } else {
    	        nowplaying.newTrack(playlist.emptytrack);
		        tracknotfound = false;
	        }
    	}
    }

    this.checkProgress = function() {
    	clearTimeout(progresstimer);
    	if (playlist.currentTrack) {
	        progress = infobar.progress();
	        duration = playlist.currentTrack.duration || 0;
	        percent = (duration == 0) ? 0 : (progress/duration) * 100;
	        infobar.setProgress(percent.toFixed(2),progress,duration);
            if (player.status.state == "play") {
	            if (progress > 4)
	            	infobar.updateNowPlaying();
	            if (percent >= prefs.scrobblepercent)
	            	infobar.scrobble();
				progresstimer = setTimeout(self.checkProgress, 1000);
			}
    	}
    }

}