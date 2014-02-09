function playerController() {

	var self = this;
	var urischemes = new Object();
	var tracklist = new Array();
	var isReady = false;
	var tracksToAdd = new Array();
	var albumtracks = new Array();
	var collectionLoaded = false;
	var timerTimer = null;
    var progresstimer = null;
    var tracknotfound = true;
    var consoleError = console.error.bind(console);
    var mopidy = null;

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

	function enableMopidyEvents() {
		if (!isReady) { return 0 }

        mopidy.on("event:playlistsLoaded", self.reloadPlaylists);

        mopidy.on("event:playbackStateChanged", function(data) {
            debug.log("PLAYER","Mopidy State Change",data);
	        switch(data.new_state) {
	            case "playing":
	                player.status.state = "play";
	                self.checkPlaybackTime();
	                break;
	            case "stopped":
	                player.status.state = "stop";
		        	mopidy.playback.getCurrentTlTrack().then( function(data) {
		        		// undefined means no track selected - we use this to detect
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
		        	});
	                playlist.stop();
	                break;
	            case "paused":
	                player.status.state = "pause";
	                self.clearProgressTimer();
	                break;
	        }
	        infobar.updateWindowValues();
        });

        mopidy.on("event:trackPlaybackStarted", function(data) {
            debug.log("PLAYER","Track Playback Started",data);
            setStatusValues(data.tl_track);
	        player.status.elapsed = 0;
	        infobar.setStartTime(0);
	        self.trackPlaybackStarted(data.tl_track);
	        infobar.updateWindowValues();
        });

        mopidy.on("event:seeked", function(data) {
            debug.log("PLAYER","Track Seeked",data);
	        player.status.elapsed = data.time_position/1000;
	        infobar.setStartTime(player.status.elapsed);
	        self.checkProgress();
	        infobar.updateWindowValues();
        });

		mopidy.on("event:tracklistChanged", function(data) {
			debug.log("PLAYER","Tracklist Changed",data);
			playlist.repopulate();
		});

        mopidy.on("event:trackPlaybackEnded", function(data) {
        	self.trackPlaybackEnded();
        	if (player.status.single == 1) {
        		mopidy.tracklist.setSingle(false);
        		player.status.single = 0;
        	}
            debug.log("PLAYER","Track Playback Ended",data);
        });

	}

	function setStatusValues(tl_track) {
		if (tl_track) {
            //player.status.song = mopidy.tracklist.index(data);
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

	function startPlaybackFromPos(playpos) {
    	debug.log("PLAYER","addTracks winding up to start playback...");
	    mopidy.tracklist.getTlTracks().then( function (tracklist) {
        	debug.log("PLAYER","addTracks starting playback at position",playpos);
            // Don't call playByPosition, we want to let the trackListChanged event update our
            // local copy of the tracklist, not here, as things may get out of sync
            playTlTrack(tracklist[playpos]);
		});
	}

	function sortByAlbum(tracks) {
		// Takes an array of unsorted mopidy.models.track and sorts them by albums
		// ONLY works with spotify tracks!
		debug.log("PLAYER", "Sorting tracks into albums");
		var albums = {};
		for (var i in tracks) {
			if (!albums.hasOwnProperty(tracks[i].album.uri)) {
				albums[tracks[i].album.uri] = new Array();
				debug.log("PLAYER", "New album",tracks[i].album.uri);
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
		alert("Your version of Mopidy is too old. You need at least version "+prefs.mopidy_version);
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

	function onFoundTrack() {
    	debug.log("PLAYER", "Current track Found",playlist.currentTrack);
        nowplaying.newTrack(playlist.currentTrack);
        self.checkProgress();
        tracknotfound = false;
    }

	function formatPlaylistInfo(data) {

	    var html = "";
	    if (mobile == "no") {
	        html = html + '<li class="tleft wide"><b>'+language.gettext("menu_playlists")+'</b></li>';
	        html = html + '<li class="tleft wide"><table width="100%">';
	    } else {
	        html = html + '<h3>'+language.gettext("menu_playlists")+'</h3>';
	        html = html + '<table width="90%">';
	    }

	    html = html + '<tr><td class="playlisticon" align="left">';
	    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
	    html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'1stars\')"><img src="newimages/1stars.png" height="12px" style="vertical-align:middle;margin-right:4px">1 Star And Above</a></td>';
	    html = html + '<td></td></tr>';

	    html = html + '<tr><td class="playlisticon" align="left">';
	    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
	    html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'2stars\')"><img src="newimages/2stars.png" height="12px" style="vertical-align:middle;margin-right:4px">2 Stars And Above</a></td>';
	    html = html + '<td></td></tr>';

	    html = html + '<tr><td class="playlisticon" align="left">';
	    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
	    html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'3stars\')"><img src="newimages/3stars.png" height="12px" style="vertical-align:middle;margin-right:4px">3 Stars And Above</a></td>';
	    html = html + '<td></td></tr>';

	    html = html + '<tr><td class="playlisticon" align="left">';
	    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
	    html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'4stars\')"><img src="newimages/4stars.png" height="12px" style="vertical-align:middle;margin-right:4px">4 Stars And Above</a></td>';
	    html = html + '<td></td></tr>';

	    html = html + '<tr><td class="playlisticon" align="left">';
	    html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
	    html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'5stars\')"><img src="newimages/5stars.png" height="12px" style="vertical-align:middle;margin-right:4px">5 Star Tracks</a></td>';
	    html = html + '<td></td></tr>';
	    html = html + '</table>';

	    html = html + '<div class="containerbox dropdown-container">'+
	    				'<div class="fixed playlisticon"><img src="newimages/tag.png" height="12px" style="vertical-align:middle"></div>'+
	        			'<div class="expand dropdown-holder">'+
	            		'<input class="searchterm enter sourceform" id="cynthia" type="text" style="width:100%;font-size:100%"/>'+
	            		'<div class="drop-box dropshadow tagmenu" id="tigger" style="width:100%">'+
	                	'<div class="tagmenu-contents">'+
	                	'</div>'+
	            		'</div>'+
	        			'</div>'+
	        			'<div class="fixed dropdown-button" id="poohbear">'+
	            		'<img src="newimages/dropdown.png">'+
	        			'</div>'+
					    '<button class="fixed" style="margin-left:8px" onclick="playlist.loadSmart(\'tag\')">'+language.gettext('button_playradio')+'</button>'+
						'</div>';

	    html = html + '<table width="90%">';
	    $.each(data, function() {
	        var uri = this.uri;
	        html = html + '<tr><td class="playlisticon" align="left">';
	        var protocol = uri.substr(0, uri.indexOf(":"));
	        switch (protocol) {
	            case "soundcloud":
	                html = html + '<img src="newimages/soundcloud-logo.png" height="12px" style="vertical-align:middle"></td>';
	                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
	                html = html + '<td></td></tr>';
	                break;
	            case "spotify":
	                html = html + '<img src="newimages/spotify-logo.png" height="12px" style="vertical-align:middle"></td>';
	                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
	                html = html + '<td></td></tr>';
	                break;
	            case "somafm":
	                html = html + '<img src="newimages/somafm-icon.png" height="18px" style="vertical-align:middle"></td>';
	                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
	                html = html + '<td></td></tr>';
	                break;
	            case "radio-de":
	                html = html + '<img src="newimages/broadcast-12.png" height="12px" style="vertical-align:middle"></td>';
	                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
	                html = html + '<td></td></tr>';
	                break;
	            default:
	                html = html + '<img src="newimages/folder.png" width="12px" style="vertical-align:middle"></td>';
	                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
	                html = html + '<td class="playlisticon" align="right"><a href="#" onclick="player.controller.deletePlaylist(\''+escape(this.name)+'\')"><img src="newimages/edit-delete.png" style="vertical-align:middle"></a></td></tr>';
	                break;
	        }
	    });
	    if (mobile == "no") {
	        html = html + '</table></li>';
	    } else {
	        html = html + "</table>";
	    }
	    $("#playlistslist").html(html);
	    $("#playlistslist").find('.enter').keyup(onKeyUp);
	    $("#poohbear").click(onDropdownClicked);
	    addCustomScrollBar("#tigger");

	}

    this.initialise = function() {
        debug.log("PLAYER","Connecting to Mopidy HTTP frontend");
        mopidy = new Mopidy({
            webSocketUrl: "ws://"+prefs.mopidy_http_address+":"+prefs.mopidy_http_port+"/mopidy/ws/",
            autoConnect:false
        });
        mopidy.on("state:online", self.connected);
        mopidy.on("state:offline", self.disconnected);
        mopidy.connect();
	    self.mop = mopidy;
	}

	this.checkSearchDomains = function() {
		if (isReady) {
            $("#mopidysearcher").find('.searchdomain').each( function() {
                var v = $(this).attr("value");
                if (!urischemes.hasOwnProperty(v)) {
                    $(this).parent().remove();
                }
            });
        }
    }

	this.connected = function() {
        debug.log("PLAYER","Connected to Mopidy");
        if ('getVersion' in mopidy) {
        	mopidy.getVersion().then(function(v){
        		var b = v.match(/\d+/g);
        		if (b) {
        			var version = parseFloat(b[0]+"."+b[1]);
        			debug.log("PLAYER", "Mopidy Version is",version);
        			if (version < parseFloat(prefs.mopidy_version)) {
        				mopidyTooOld();
        			}
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
		self.reloadPlaylists();
        mopidy.getUriSchemes().then( function(data) {
            for(var i =0; i < data.length; i++) {
            	debug.log("PLAYER","Mopidy URI Scheme : ",data[i]);
                urischemes[data[i]] = true;
            }
			self.checkSearchDomains();
			if (!collectionLoaded) {
				debug.log("PLAYER","Checking Collection");
				collectionLoaded = true;
				checkCollection();
			}
        });
        self.cancelSingle();
	}

	this.disconnected = function() {
        debug.warn("PLAYER","Mopidy Has Gone Offline");
        infobar.notify(infobar.ERROR, language.gettext("mopidy_down"));
        isReady = false;
	}

	this.isConnected = function() {
		return isReady;
	}

	this.checkPlaybackTime = function() {
		clearTimeout(timerTimer);
		mopidy.playback.getTimePosition().then(function(pos) {
			debug.log("PLAYER","Playback position is",parseInt(pos));
			if (player.status.state == "play") {
				player.status.elapsed = parseInt(pos)/1000;
				infobar.setStartTime(player.status.elapsed);
	        	self.checkProgress();
				if (player.status.elapsed == 0) {
					timerTimer = setTimeout(self.checkPlaybackTime, 1000);
				}
			}
		});
	}

	this.updateCollection = function(cmd) {
        prepareForLiftOff(language.gettext("label_updating"));
        debug.log("PLAYER","Updating collection with command", cmd);
        // Running mopidy local scan and parsing the tag cache is no
        // longer supported as it's impossible to make it work in all situations.
        // Mopidy will soon support updating from a client, hopefully
        // by adding it to this command.
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
                        contentType: "application/json",
                        success: function(data) {
                            $("#collection").html(data);
                            data = null;
                        },
                        error: function(data) {
                            $("#collection").empty();
                            alert(language.gettext("label_update_error"));
                        	debug.error("PLAYER","failed to generate albums list",data);
                        }
                    });
            }, consoleError);
        } else {
            debug.log("PLAYER","Loding",uri);
	        $("#collection").load(uri);
        }
	}

	this.reloadFilesList = function(uri) {
		self.browse(null, "filecollection");
	}

	this.browse = function(what, where) {
		debug.log("PLAYER","Browsing for",what,where);
		mopidy.library.browse(what).then( function(data) {
			var html = "";
			$.each(data, function(i,ref) {
				switch (ref.type) {
					case "directory":
						var menuid = hex_md5(ref.uri);
				        html = html + '<div class="containerbox menuitem">'+
				        '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'+menuid+'"></div>'+
				        '<input type="hidden" name="'+ref.uri+'">'+
				        '<div class="fixed playlisticon"><img width="16px" src="newimages/folder.png" /></div>'+
				        '<div class="expand">'+ref.name+'</div>'+
				        '</div>'+
				        '<div id="'+menuid+'" class="dropmenu notfilled"></div>';
				        break;
				    case "track":
				        html = html + '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'+encodeURIComponent(ref.uri)+'">'+
				        '<div class="playlisticon fixed"><img height="16px" src="newimages/audio-x-generic.png" /></div>'+
				        '<div class="expand">'+ref.name+'</div>'+
				        '</div>';
				        break;
				}
			});
			$("#"+where).html(html);
			if (where != "filecollection") {
            	$('#'+where).removeClass("notfilled");
            	$('#'+where).slideToggle('fast');
            }
		},
		consoleError );

	}

	this.reloadPlaylists = function() {
		if (isReady) {
            debug.log("PLAYER","Retreiving Playlists from Mopidy");
            mopidy.playlists.getPlaylists().then(function (data) {
            	debug.log("PLAYER","Got Playlists from Mopidy",data);
            	formatPlaylistInfo(data);
            }, consoleError);
        }
	}

	this.loadPlaylist = function(uri) {
		playlist.ignoreupdates(1);
		mopidy.tracklist.clear().then( function() {
			$.get("cleanPlaylists.php?command=clear");
            mopidy.playlists.lookup(uri).then( function(list) {
                debug.debug("PLAYER","Playlist : ",list);
                mopidy.tracklist.add(list.tracks);
            });
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
            $.ajax({
                    type: "POST",
                    url: "getplaylist.php",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json",
                    success: playlist.newXSPF,
                    error: playlist.updateFailure
                });
        }, consoleError);
	}

	this.search = function(searchtype) {
        var terms = {};
        var termcount = 0;
        $("#mopidysearcher").find('.searchterm').each( function() {
            var key = $(this).attr('name');
            var value = $(this).attr("value");
            if (value != "") {
                debug.debug("PLAYER","Searching for",key, value);
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
                domains.push($(this).attr("value")+":");
                fanny++;
            }
            prefssave['search_limit_'+$(this).attr("value")] = $(this).is(':checked') ? 1 : 0;
        });
        debug.log("PLAYER","Saving search prefs",prefssave);
        prefs.save(prefssave);
        if (termcount > 0 && (!($("#limitsearch").is(':checked')) || fanny > 0)) {
            $("#searchresultholder").empty();
            doSomethingUseful('searchresultholder', language.gettext("label_searching"));
            debug.log("PLAYER","Doing Search:", terms, domains);
            if (terms.tag || terms.rating) {
                $.ajax({
                        type: "POST",
                        url: "albums.php",
                        data: {terms: terms, domains: domains},
                        success: function(data) {
                            $("#searchresultholder").html(data);
                        }
                    });
                data = null;
            } else {
	            mopidy.library[searchtype](terms, domains).then( function(data) {
	                debug.log("PLAYER","Search Results",data);
	                $.ajax({
	                        type: "POST",
	                        url: "albums.php",
	                        data: JSON.stringify(data),
	                        contentType: "application/json",
	                        success: function(data) {
	                            $("#searchresultholder").html(data);
	                            data = null;
	                        }
	                    });
	                data = null;
	            }, consoleError);
	        }
        }
	}

	this.play = function() {
        mopidy.playback.play();
	}

	this.pause = function() {
		mopidy.playback.pause();
	}

	this.stop = function() {
        mopidy.playback.stop();
	}

	this.next = function() {
		if (player.status.state == 'play') {
			mopidy.playback.next();
		}
	}

	this.previous = function() {
		if (player.status.state == 'play') {
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
                playTlTrack(tracklist[i]);
                break;
            }
        }
	}

	this.playByPosition = function(pos) {
        debug.log("PLAYER","Playing Position",pos);
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
		if (tracks.length == 0) { return }
		if (mobile != "no") {
			infobar.notify(infobar.NOTIFY, language.gettext("label_addingtracks"));
		}
		debug.log("PLAYER","Adding Tracks",tracks,playpos,at_pos);

		var started = false;
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
		    					// We use this for filtering items when we add a spotify:artist link.
		    					// The reason is that adding spotify:artist:whatever to the playlist
		    					// adds every *album* that artist is on, including compilations - thus
		    					// we get loads of tracks that *aren't* by that artist.
		    					// I don't like that, so I filter by the artist name to get a bunch
		    					// of tracks. These, unfortunately (this being spotify), come back in an
		    					// unsorted list...
		    					debug.log("PLAYER","addTracks has a findexact filter to apply",t.findexact,t.filterdomain);
		    					mopidy.library.findExact(t.findexact, t.filterdomain).then(function(data) {
		    						debug.log("PLAYER", "findExact results : ",data[0].tracks);
		    						if (data[0].tracks) {
			    						mopidy.tracklist.add(sortByAlbum(data[0].tracks),at_pos,null).then(function() {
						    				if (playpos !== null && playpos > -1 && !started) {
						    					started = true;
						    					startPlaybackFromPos(playpos);
						    				}
						    				if (at_pos !== null) {
						    					at_pos += data[0].tracks.length;
						    				}
						    				iterator();
			    						},consoleError);
			    					} else {
			    						infobar.notify(infobar.NOTIFY, "Couldn't find any tracks");
			    						playlist.repopulate();
			    					}
		    					}, consoleError);
		    				} else {
					    		debug.log("PLAYER","addTracks Adding",t.name,"at",at_pos);

					    		// This doesn't work because spotify tracks that aren't the result of a search
					    		// can't be played like this. It's no quicker anyway.
					    		// Might well be quicker to lookup everything first and then
					    		// add the whole lot in one go?
					    		// mopidy.library.lookup(t.name).then(function(tracks) {
					    		// 	mopidy.tracklist.add(tracks, at_pos, null).then( function() {

					    			mopidy.tracklist.add(null, at_pos, t.name).then( function() {

					    				if (playpos !== null && playpos > -1 && !started) {
					    					started = true;
					    					startPlaybackFromPos(playpos);
					    				}
					    				if (at_pos !== null) {
					    					at_pos++;
					    				}
					    				iterator();
					    			},consoleError);

					    		// },consoleError);
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
			    			mopidy.tracklist.remove({'tlid': [parseInt(t.name)]}).then( iterator );
			    			break;

		    		}
    			}
    		})();
		}

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

	this.rawsearch = function(terms, callback) {
		mopidy.library.search(terms).then( function(data) {
			callback(data);
		},
		function() {
			debug.error("MOPIDY","Raw Search Failed");
			callback([]);
		});
	}

	this.command = function(cmd, callback) {
		// For compatability
		if (callback) {
			callback();
		}
	}

	this.trackPlaybackEnded = function() {
        self.clearProgressTimer();
        if (playlist.currentTrack && playlist.currentTrack.type == "podcast") {
            debug.log("PLAYLIST", "Seeing if we need to mark a podcast as listened");
            podcasts.checkMarkPodcastAsListened(playlist.currentTrack.location);
        }
        debug.groupend();
    }

    this.trackPlaybackStarted = function(tl_track) {
        debug.group("PLAYLIST","Track Playback Started",tl_track);
        playlist.findCurrentTrack();
        if (playlist.currentTrack) {
        	onFoundTrack();
        } else {
        	debug.log("PLAYLIST", "Current track NOT Found",playlist.currentTrack);
        	// Track won't be found IF we've started playback before adding all the tracks
        	// which we do, for instance, almost all the time.
        	tracknotfound = true;
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

    this.clearProgressTimer = function() {
        clearTimeout(progresstimer);
    }

    this.onStop = function() {
        self.clearProgressTimer();
        playlist.checkSongIdAfterStop(player.status.songid);
    }

    this.checkProgress = function() {
    	self.clearProgressTimer();
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
				setTimeout(self.checkProgress, 1000);
			}
    	}
    }

}