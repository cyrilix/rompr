function multiProtocolController() {

	var mopidy = null;
    var consoleError = console.error.bind(console);
    var self = this;

    // These are all the mpd status fields the program currently cares about.
    // We don't need to initialise them here; this is for reference
    this.status = {
    	file: null,
    	bitrate: null,
    	audio: null,
    	state: null,
    	volume: -1,
    	song: 0,
    	elapsed: 0,
    	songid: 0,
    	consume: 0,
    	xfade: 0,
    	repeat: 0,
    	random: 0,
    	error: null,
    	Date: null,
    	Genre: null,
    	Title: null,
    }


    /* Things we're missing:
            song - need to try and remove dependence on this completely. We have it but it's asynchronous

            Name - does this even have a meaning with mopidy?
            	 - currently this needs to be undefined

            Currently, these DO get filled in because we're sending mpd commands
			- especially, we send "" right at page load.
    */


    this.http = function() {

    	var urischemes = new Object();
    	var tracklist = new Array();
    	var isReady = false;
    	var tracksToAdd = new Array();
    	var albumtracks = new Array();
    	var collectionLoaded = false;
    	var timerTimer = null;

	    function playTlTrack(track) {
	        debug.log("PLAYER","Playing Track",track);
	        mopidy.playback.play(track,1).then( function(data){ }, function(){
	            // Fallback in case the above fails due to some known but
	            // as yet not understood mopidy problem with empty ID3 tags
	            debug.warn("PLAYER","Mopidy error, using fallback");
	            id = track.tlid || 0;
	            player.mpd.command("command=playid&arg="+id);
	        });
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

    	function enableMopidyEvents() {
    		if (!isReady) { return 0 }

	        mopidy.on("event:playlistsLoaded", self.http.reloadPlaylists);

            mopidy.on("event:playbackStateChanged", function(data) {
                debug.log("PLAYER","Mopidy State Change",data);
		        switch(data.new_state) {
		            case "playing":
		                self.status.state = "play";
		                self.http.checkPlaybackTime();
		                break;
		            case "stopped":
		                self.status.state = "stop";
			        	mopidy.playback.getCurrentTlTrack().then( function(data) {
			        		// undefined means no track selected - we use this to detect
			        		// that we've reached the end of the playlist
			        		if (data === null) {
			        			debug.log("PLAYER","Current track is undefined");
			        			self.status.songid = undefined;
			        			self.status.elapsed = undefined;
			        			self.status.file = undefined;
			        			playlist.checkProgress();
			        		}
			        	});
		                break;
		            case "paused":
		                self.status.state = "pause";
		                playlist.clearProgressTimer();
		                break;
		        }
		        infobar.updateWindowValues();
            });

            mopidy.on("event:trackPlaybackStarted", function(data) {
                debug.log("PLAYER","Track Playback Started",data);
                mopidy.playback.getTracklistPosition().then( function(data) { self.status.song = data });
		        self.status.songid = data.tl_track.tlid || 0;
		        self.status.file = data.tl_track.track.uri;
		        self.status.Date = data.tl_track.track.date;
		        self.status.bitrate = data.tl_track.bitrate;
		        self.status.Title = data.tl_track.name;
		        self.status.elapsed = 0;
		        infobar.setStartTime(0);
		        playlist.checkProgress();
		        infobar.updateWindowValues();
            });

            mopidy.on("event:seeked", function(data) {
                debug.log("PLAYER","Track Seeked",data);
		        self.status.elapsed = data.time_position/1000;
		        infobar.setStartTime(self.status.elapsed);
		        playlist.checkProgress();
		        infobar.updateWindowValues();
            });

			mopidy.on("event:tracklistChanged", function(data) {
				debug.log("PLAYER","Tracklist Changed",data);
				playlist.repopulate();
			});

            mopidy.on("event:trackPlaybackEnded", function(data) {
	        	// Workaround for mopidy bug where 'single' doesn't work.
	        	if (self.status.single == 1) {
	        		self.http.stop();
	        		mopidy.playback.setSingle(false);
	        		self.status.single = 0;
	        	}
                debug.log("PLAYER","Track Playback Ended",data);
            });

    	}

    	function startPlaybackFromPos(playpos) {
        	debug.log("PLAYER","addTracks winding up to start playback...");
		    mopidy.tracklist.getTlTracks().then( function (tracklist) {
            	debug.log("PLAYER","addTracks starting playback as position",playpos);
	            // Don't call playByPosition, we want to let the trackListChanged event update our
	            // local copy of the tracklist, not here, as things may get out of sync
	            playTlTrack(tracklist[playpos]);
			});
    	}

		return {

			checkCollection: function() {
				if (isReady && !collectionLoaded) {
					collectionLoaded = true;
					debug.log("PLAYER","Checking Collection");
					checkCollection();
				}
			},

	    	connected: function() {
		        debug.log("PLAYER","Connected to Mopidy");
		        isReady = true;
		        self.controller = self.http;
	    		enableMopidyEvents();
	    		self.http.reloadPlaylists();
	    		playlist.repopulate();
		        mopidy.getUriSchemes().then( function(data) {
		            for(var i =0; i < data.length; i++) {
		            	debug.log("PLAYER","Mopidy URI Scheme : ",data[i]);
		                urischemes[data[i]] = true;
		            }
		            $("#mopidysearcher").find('.searchdomain').each( function() {
		                var v = $(this).attr("value");
		                if (!urischemes.hasOwnProperty(v)) {
		                    $(this).parent().remove();
		                }
		            });
		        });
		        self.http.checkCollection();
	    	},

	    	disconnected: function() {
		        debug.warn("PLAYER","Mopidy Has Gone Offline");
		        infobar.notify(infobar.ERROR, "The connection to Mopidy has been lost!")
		        isReady = false;
		        self.controller = self.mpd;
		        self.mpd.reloadPlaylists();
	    	},

	    	checkPlaybackTime: function() {
	    		clearTimeout(timerTimer);
	    		mopidy.playback.getTimePosition().then(function(pos) {
	    			debug.log("PLAYER","Playback position is",parseInt(pos));
	    			if (self.status.state == "play") {
	    				self.status.elapsed = parseInt(pos)/1000;
	    				infobar.setStartTime(self.status.elapsed);
			        	playlist.checkProgress();
	    				if (self.status.elapsed == 0) {
	    					timerTimer = setTimeout(self.http.checkPlaybackTime, 1000);
	    				}
	    			}
	    		});
	    	},

	    	updateCollection: function(cmd) {
		        prepareForLiftOff("Updating Collection");
		        prepareForLiftOff2("Scanning Files");
		        debug.log("PLAYER","Updating collection with command", cmd);
	    		switch (cmd) {
	    			case "update":
			            mopidy.library.refresh().then( function() { checkPoll({data: 'dummy' }) });
			           	break;

			        case "rescan":
		                $.ajax({
		                    type: 'GET',
		                    url: 'doMopidyScan.php',
		                    cache: false,
		                    timeout: 1800000,
		                    success: function() {
	                            debug.log("PLAYER","Forcing mopidy to reload its library");
	                            mopidy.library.refresh().then( function() { checkPoll({data: 'dummy' }) });
		                    },
		                    error: function() {
		                        alert("Failed to create mopidy tag cache");
		                        checkPoll({data: 'dummy' });
		                    }
		                });
		                break;
		        }
	    	},

	    	reloadAlbumsList: function(uri) {
		        if (uri.indexOf("?") < 0) {
	            	// This means we want to update the cache
	                debug.log("PLAYER","Getting list of files using mopidy websocket search");
	                var be = new Array();
	                if (prefs.use_mopidy_file_backend) {
	                    be.push('local:');
	                }
	                if (prefs.use_mopidy_beets_backend) {
	                    be.push('beets:');
	                }
	                if (be.length == 0) {
	                    //alert("You have not chosen a backend to build a collection with!");
	                    $("#collection").empty();
	                    return 0;
	                }
	                mopidy.library.search({}, be).then( function(data) {
	                    $.ajax({
	                            type: "POST",
	                            url: "parseMopidyTracks.php",
	                            data: JSON.stringify(data),
	                            contentType: "application/json",
	                            success: function(data) {
	                                $("#collection").html(data);
	                                data = null;
	                            },
	                            error: function(data) {
	                                $("#collection").empty();
	                                alert("Failed to generate albums list!");
	                            	debug.error("PLAYER","failed to generate albums list",data);
	                            }
	                        });
	                }, consoleError);
	            } else {
	                debug.log("PLAYER","Loding",uri);
			        $("#collection").load(uri);
	            }
	    	},

	    	reloadPlaylists: function() {
	            debug.log("PLAYER","Retreiving Playlists from Mopidy");
	            mopidy.playlists.getPlaylists().then(function (data) {
	            	debug.log("PLAYER","Got Playlists from Mopidy",data);
	            	formatPlaylistInfo(data);
	            }, consoleError);

	    	},

	    	loadPlaylist: function(uri) {
	    		mopidy.tracklist.clear().then( function() {
		            mopidy.playlists.lookup(uri).then( function(list) {
		                debug.debug("PLAYER","Playlist : ",list);
		                mopidy.tracklist.add(list.tracks).then( playlist.repopulate );
		            });
		        });
	    	},

	    	deletePlaylist: function(name) {
	    		alert("Not supported yet!");
	    	},

	    	clearPlaylist: function() {
	    		// Currently we use the mpd command for clearing the playlist
	    		// because it does some cleanups of our stored stream playlists too
	    		// We'll need a mechanism for doing this when mopidy supports
	    		// saving and loading of playlists.
	    		self.mpd.clearPlaylist();
	    		// mopidy.tracklist.clear();
	    	},

	    	getPlaylist: function() {
	            debug.log("PLAYER","Using Mopidy HTTP connection for playlist");
	            mopidy.tracklist.getTlTracks().then( function (data) {
	                debug.log("PLAYER","Got Playlist from Mopidy:",data);
	                tracklist = data;
	                $.ajax({
	                        type: "POST",
	                        url: "parseMopidyPlaylist.php",
	                        data: JSON.stringify(data),
	                        contentType: "application/json",
	                        dataType: "json",
	                        success: playlist.newXSPF,
	                        error: function(data) {
	                            infobar.notify(infobar.ERROR, "Something went wrong retrieving the playlist!");
	                            playlist.updateFailure();
	                        }
	                    });
	            }, consoleError);
	    	},

	    	search: function(searchtype) {
	            var terms = {};
	            var cunt = 0;
	            $("#mopidysearcher").find('.searchterm').each( function() {
	                var key = $(this).attr('name');
	                var value = $(this).attr("value");
	                if (value != "") {
		                debug.debug("PLAYER","Searching for",key, value);
	                    terms[key] = [value];
	                    cunt++;
	                }
	            });
	            var domains = new Array();
	            var fanny = 0;
	            var prefssave = { search_limit_limitsearch: $("#limitsearch").is(':checked') ? 1 : 0 };
	            $("#mopidysearcher").find('.searchdomain').each( function() {
	                if (checkDomain(this)) {
	                    debug.log("PLAYER","Search Type", $(this).attr("value"));
	                    domains.push($(this).attr("value")+":");
	                    fanny++;
	                }
	                prefssave['search_limit_'+$(this).attr("value")] = $(this).is(':checked') ? 1 : 0;
	            });
	            prefs.save(prefssave);
	            if (cunt > 0 && (!($("#limitsearch").is(':checked')) || fanny > 0)) {
	                $("#searchresultholder").empty();
	                doSomethingUseful('searchresultholder', 'Searching...');
	                debug.log("PLAYER","Doing Search:", terms, domains);
	                mopidy.library[searchtype](terms, domains).then( function(data) {
	                    debug.log("PLAYER","Search Results",data);
	                    $.ajax({
	                            type: "POST",
	                            url: "parseMopidySearch.php",
	                            data: JSON.stringify(data),
	                            contentType: "application/json",
	                            success: function(data) {
	                                $("#searchresultholder").html(data);
	                                // $("#usefulbar").remove();
	                                data = null;
	                            }
	                        });
	                    data = null;
	                }, consoleError);
	            }
	    	},

	    	play: function() {
	            mopidy.playback.play();
	    	},

	    	pause: function() {
	    		mopidy.playback.pause();
	    	},

	    	stop: function() {
	            mopidy.playback.stop().then( playlist.stop );
	    	},

	    	next: function() {
	    		if (self.status.state == 'play') {
	    			mopidy.playback.next();
	    		}
	    	},

	    	previous: function() {
	    		if (self.status.state == 'play') {
	    			mopidy.playback.previous();
	    		}
	    	},

	    	seek: function(seekto) {
	            mopidy.playback.seek(seekto*1000).then(function(data){}, consoleError);
	    	},

	    	playId: function(id) {
		        debug.log("PLAYER","Playing ID",id);
	            for(var i = 0; i < tracklist.length; i++) {
	                if (tracklist[i].tlid == id ||
	                    (id == 0 && !tracklist[i].tlid)) {
	                    playTlTrack(tracklist[i]);
	                    break;
	                }
	            }
	    	},

	    	playByPosition: function(pos) {
		        debug.log("PLAYER","Playing Position",pos);
	            playTlTrack(tracklist[pos]);
	    	},

	    	clearerror: function() {
	    		self.status.error = null;
	    	},

	    	volume: function(volume, callback) {
	    		mopidy.playback.setVolume(Math.round(volume)).then( function() {
	    			self.status.volume = volume;
	    			if (callback) {
	    				callback();
	    			}
	    		});
	    	},

	    	removeId: function(ids) {
	    		debug.log("PLAYER","Removing Tracks",ids);
	    		playlist.ignoreupdates(ids.length-1);
	    		for (var i in ids) {
	    			mopidy.tracklist.remove({tlid: parseInt(ids[i])});
	    		}
	    		// (function riterator() {
	    		// 	var id = ids.shift();
	    		// 	if (id !== undefined) {
			    // 		debug.log("PLAYER","Removing ID",id);
		    	// 		mopidy.tracklist.remove({tlid: parseInt(id)}).then( riterator );
	    		// 	}
	    		// })();
	    	},

	    	toggleRandom: function() {
	    		mopidy.playback.getRandom().then( function(data) {
	    			mopidy.playback.setRandom(!data);
	    			var new_value = (data) ? 0 : 1;
				    $("#random").attr("src", prefsbuttons[new_value]);
				    self.status.random = new_value;
	    		});
	    	},

	    	toggleCrossfade: function() {
	    		infobar.notify(infobar.NOTIFY, "Mopidy does not support crossfading");
	    	},

	    	setCrossfade: function(v) {
	    		infobar.notify(infobar.NOTIFY, "Mopidy does not support crossfading");
	    	},

	    	toggleRepeat: function() {
	    		mopidy.playback.getRepeat().then( function(data) {
	    			mopidy.playback.setRepeat(!data);
	    			var new_value = (data) ? 0 : 1;
				    $("#repeat").attr("src", prefsbuttons[new_value]);
				    self.status.repeat = new_value;
	    		});
	    	},

	    	toggleConsume: function() {
	    		mopidy.playback.getConsume().then( function(data) {
	    			mopidy.playback.setConsume(!data);
	    			var new_value = (data) ? 0 : 1;
				    $("#consume").attr("src", prefsbuttons[new_value]);
				    self.status.consume = new_value;
	    		});
	    	},

	    	addTracks: function(tracks, playpos, at_pos) {
	    		infobar.notify(infobar.NOTIFY, "Adding Tracks");
	    		debug.log("PLAYER","Adding Tracks",tracks,playpos,at_pos);
	    		var started = false;
	    		if (tracks.length == 0) { return }
	    		playlist.ignoreupdates(tracks.length-1);
	    		// Add the tracks to a single variable. otherwise if we get one add request
	    		// before the previous one has finished, the tracks get muddled up and
	    		// playpos gets confused.
	    		$.each(tracks, function(i,v) {
	    			tracksToAdd.push(v);
	    		});
	    		if (tracks.length == tracksToAdd.length) {
	    			debug.debug("PLAYER:","Creating track iterator");
		    		(function iterator() {
		    			debug.debug("PLAYER","Iterating...");
		    			var t = albumtracks.shift() || tracksToAdd.shift();
		    			if (t) {
				    		switch (t.type) {
				    			case "uri":
				    				if (t.findexact) {
				    					// We use this for filtering items when we get spotify artist results but no tracks, as just adding
				    					// the artist URI to the playlist can have unexpected results.
				    					debug.log("PLAYER","addTracks has a findexact filter to apply",t.findexact,t.filterdomain);
				    					mopidy.library.findExact(t.findexact, t.filterdomain).then(function(data) {
				    						mopidy.tracklist.add(data[0].tracks,at_pos,null).then(function() {
							    				if (playpos !== null && playpos > -1 && !started) {
							    					started = true;
							    					startPlaybackFromPos(playpos);
							    				}
							    				if (at_pos !== null) {
							    					at_pos += data[0].tracks.length;
							    				}
							    				iterator();
				    						},consoleError);
				    					}, consoleError);
				    				} else {
							    		debug.log("PLAYER","addTracks Adding",t.name,"at",at_pos);
						    			mopidy.tracklist.add(null, at_pos, t.name).then( function() {
						    				if (playpos !== null && playpos > -1 && !started) {
						    					started = true;
						    					startPlaybackFromPos(playpos);
						    				}
						    				if (at_pos !== null) {
						    					at_pos++;
						    				}
						    				iterator();
						    			});
						    		}
					    			break;

					    		case "item":
						    		debug.log("PLAYER","addTracks Adding",t.name,"at",at_pos);
					    			$.getJSON("getItems.php?item="+t.name, function(data) {
					    				playlist.ignoreupdates(data.length-1);
					    				$(data).each( function() {
					    					albumtracks.push(this);
					    				});
					    				iterator();
					    			});
					    			break;

					    		case "delete":
						    		debug.log("PLAYER","addTracks Deleting ID",t.name);
					    			// Yes it's odd to call addTracks to delete tracks, but we need this for Last.FM
					    			// ONLY use it there.
					    			mopidy.tracklist.remove({tlid: parseInt(t.name)}).then( iterator );
					    			break;

				    		}
		    			}
		    		})();
	    		}

	    	},

	    	move: function(first, number, moveto) {
	    		debug.log("PLAYER","Moving",first,first+number,moveto);
	    		mopidy.tracklist.move(first, first+number, moveto);
	    	},

	    	stopafter: function() {
	            if (self.status.repeat == 1) {
	            	mopidy.playback.setRepeat(false);
	                $("#repeat").attr("src", prefsbuttons[0]);
	                self.status.repeat = 1;
	            }
            	mopidy.playback.setSingle(true)
            	self.status.single = 1;
	    	}

	    }

    }();

    this.mpd = function() {

    	var updatetimer = null;

    	return {

    		command: function(cmd, callback) {
		        debug.log("MPD","'"+cmd+"'");
		        playlist.clearProgressTimer();
		        $.getJSON("ajaxcommand.php", cmd)
		        .done(function(data) {
		            debug.log("MPD","Result for","'"+cmd+"'",data);
		            if (cmd == "command=clearerror" && data.error) {
		                // Ignore errors on clearerror - we get into an endless loop
		                data.error = null;
		            }
		            self.status = data;
		            infobar.setStartTime(self.status.elapsed);
		            if (callback) {
		                callback();
		                infobar.updateWindowValues();
		            } else {
		               playlist.checkProgress();
		               infobar.updateWindowValues();
		            }
		            if ((data.state == "pause" || data.state=="stop") && data.single == 1) {
		                player.mpd.fastcommand("command=single&arg=0");
		            }
		            debug.log("MPD","Status",self.status);
		        })
		        .fail( function() {
		            alert("Failed to send command '"+cmd+"' to MPD");
		            playlist.checkProgress();
		        });
    		},

    		fastcommand: function(cmd, callback) {
		        $.getJSON("ajaxcommand.php?fast", cmd)
		        .done(function() { if (callback) { callback(); } })
		        .fail(function() { if (callback) { callback(); } })
    		},

    		do_command_list: function(list, callback) {
		        debug.log("MPD","Command List",list);
		        playlist.clearProgressTimer();
		        if (typeof list == "string") {
		            data = list;
		        } else {
		            data = {'commands[]': list};
		        }
		        $.ajax({
		            type: 'POST',
		            url: 'postcommand.php',
		            data: data,
		            success: function(data) {
		                debug.log("MPD           : result for",list,data);
		                self.status = data;
		                infobar.setStartTime(self.status.elapsed);
		                if (callback) {
		                    callback();
		                    infobar.updateWindowValues();
		                } else {
		                    playlist.checkProgress();
		                    infobar.updateWindowValues();
		                }

		            },
		            error: function() {
		                alert("Failed sending command list to mpd");
		                playlist.checkProgress();
		            },
		            dataType: 'json'
		        });
    		},

		    deferredupdate: function(time) {
		        // Use this to force us to re-check mpd's status after some commands
		        // eg sometimes when we seek it doesn't happen immediately.
		        // Calling mpd.command with no parameters is fine.
		        clearTimeout(updatetimer);
		        updatetimer = setTimeout(self.mpd.command, time);
		    },

		    updateCollection: function(cmd) {
		        prepareForLiftOff("Updating Collection");
		        prepareForLiftOff2("Scanning Files");
	            $.getJSON("ajaxcommand.php", "command="+cmd, function() {
	                        update_load_timer = setTimeout( pollAlbumList, 2000);
	                        update_load_timer_running = true;
	            });
		    },

		    reloadAlbumsList: function(uri) {
               	$("#collection").load(uri);
		    },

	    	reloadPlaylists: function() {
	              $("#playlistslist").load("loadplaylists.php?mobile="+mobile);
	    	},

	    	loadPlaylist: function(name) {
	            this.command('command=load&arg='+name, playlist.repopulate);
	    	},

	    	deletePlaylist: function(name) {
				this.fastcommand('command=rm&arg='+escape(this.name), player.controller.reloadPlaylists);
	    	},

	    	clearPlaylist: function() {
			    this.command('command=clear', playlist.repopulate);
	    	},

	    	getPlaylist: function() {
	            debug.log("PLAYER","Getting playlist using mpd connection");
	            $.ajax({
	                type: "GET",
	                url: "getplaylist.php",
	                cache: false,
	                //contentType: "text/xml; charset=utf-8",
	                dataType: "json",
	                success: playlist.newXSPF,
	                error: function(data) {
	                    alert("Something went wrong retrieving the playlist!");
	                }
	            });
	    	},

	    	play: function() {
	            this.command('command=play');
	    	},

	    	pause: function() {
	            this.command('command=pause');
	    	},

	    	stop:function() {
	            this.command("command=stop", playlist.stop )
	    	},

	    	next: function() {
	    		if (self.status.state == 'play') {
		            this.command("command=next");
	    		}
	    	},

	    	previous: function() {
	    		if (self.status.state == 'play') {
		            this.command("command=previous");
	    		}
	    	},

	    	seek: function(seekto) {
	            this.command("command=seek&arg="+self.status.song+"&arg2="+parseInt(seekto.toString()),
	                function() { self.mpd.deferredupdate(1000) });
	    	},

	    	playId: function(id) {
	            this.command("command=playid&arg="+id);
	    	},

	    	playByPosition: function(pos) {
	            this.command("command=play&arg="+pos.toString());
	    	},

	    	clearerror: function() {
	    		this.command('command=clearerror');
	    	},

	    	volume: function(volume, callback) {
	            if (player.status.state != "stop") {
    	            this.command("command=setvol&arg="+parseInt(volume.toString()), callback);
    	        } else {
	                infobar.notify(infobar.ERROR, "MPD cannot adjust volume while playback is stopped");
	                volumeslider.restoreState();
    	        }
	    	},

	    	removeId: function(ids) {
	    		var cmdlist = [];
	    		$.each(ids, function(i,v) {
	    			cmdlist.push("deleteid "+v);
	    		});
	    		this.do_command_list(cmdlist, playlist.repopulate);
	    	},

	    	toggleRandom: function() {
			    var new_value = (player.status.random == 0) ? 1 : 0;
			    $("#random").attr("src", prefsbuttons[new_value]);
			    this.command("command=random&arg="+new_value);
	    	},

	    	toggleCrossfade: function() {
			    var new_value = (player.status.xfade == 0) ? 1 : 0;
			    $("#crossfade").attr("src", prefsbuttons[new_value]);
			    if (new_value == 1) {
			        new_value = prefs.crossfade_duration;
			    }
			    this.command("command=crossfade&arg="+new_value);
	    	},

	    	setCrossfade: function(v) {
			    this.command("command=crossfade&arg="+v);
	    	},

	    	toggleRepeat: function() {
			    var new_value = (player.status.repeat == 0) ? 1 : 0;
			    $("#repeat").attr("src", prefsbuttons[new_value]);
			    this.command("command=repeat&arg="+new_value);
	    	},

	    	toggleConsume: function() {
			    var new_value = (player.status.consume == 0) ? 1 : 0;
			    $("#consume").attr("src", prefsbuttons[new_value]);
			    this.command("command=consume&arg="+new_value);
	    	},

	    	addTracks: function(tracks, playpos, at_pos) {
	    		infobar.notify(infobar.NOTIFY, "Adding Tracks",playpos,at_pos);
	    		var cmdlist = [];
	    		var pl = self.status.playlistlength;
	    		$.each(tracks, function(i,v) {
	    			switch (v.type) {
	    				case "uri":
		    				cmdlist.push('add "'+v.name+'"');
		    				break;
		    			case "item":
		    				cmdlist.push("additem "+v.name);
		    				break;
		    			case "delete":
		    				cmdlist.push("deleteid "+v.name);
		    				if (at_pos) {
		    					at_pos--;
		    				}
							if (playpos && playpos > -1) {
								playpos--;
							}
		    				break;
		    		}
	    		});
	    		// Note : playpos, if set, will point to the first track position
	    		// BEFORE we move it.
				if (playpos !== null && playpos > -1) {
					cmdlist.push('play "'+playpos.toString()+'"');
				}
				this.do_command_list(cmdlist, function() {
					if (at_pos) {
						self.mpd.move(pl, self.status.playlistlength - pl, at_pos);
					} else {
						playlist.repopulate();
					}
				});
	    	},

	    	move: function(first, num, moveto) {
	    		var itemstomove = first.toString();
	    		if (num > 1) {
	    			itemstomove = itemstomove + ":" + (parseInt(first)+parseInt(num));
	    		}
	    		this.command("command=move&arg="+itemstomove+"&arg2="+moveto, playlist.repopulate);
	    	},

	    	stopafter: function() {
	            var cmds = [];
	            if (self.status.repeat == 1) {
	                cmds.push("repeat 0");
	                $("#repeat").attr("src", prefsbuttons[0]);
	            }
	            cmds.push("single 1");
	            this.do_command_list(cmds);
	    	}

	    }

    }();

    /* INITIALISATION STUFF */

    this.controller = this.mpd;

    this.loadCollection = function() {
	    if (prefs.use_mopidy_http == 0) {
	    	debug.log("MPD", "Checking Collection");
	    	checkCollection();
	    } else {
	    	// This will almost certainly be called before the http socket
	    	// has connected to mopidy
	    	self.http.checkCollection();
	    }
    }

    if (prefs.use_mopidy_http == 1) {
        debug.log("PLAYER","Connecting to Mopidy HTTP frontend");
        mopidy = new Mopidy({
            webSocketUrl: "ws://"+prefs.mpd_host+":"+prefs.mopidy_http_port+"/mopidy/ws/"
        });
        mopidy.on("state:online", this.http.connected);
        mopidy.on("state:offline", this.http.disconnected);
	    this.mop = mopidy;
    }

}