function playerController() {

    var self = this;
	var updatetimer = null;
    var progresstimer = null;
    var safetytimer = 500;
    var previoussongid = -1;
    var AlanPartridge = 0;
    var plversion = null;
    var openpl = null;
    var oldplname;
    var thenowplayinghack = false;
    var lastsearchcmd = "search";

    function updateStreamInfo() {

        // When playing a stream, mpd returns 'Title' in its status field.
        // This usually has the form artist - track. We poll this so we know when
        // the track has changed (note, we rely on radio stations setting their
        // metadata reliably)

        if (playlist.getCurrent('type') == "stream") {
            var temp = playlist.getCurrentTrack();
            if (player.status.Title) {
                var tit = player.status.Title;
                var parts = tit.split(" - ");
                if (parts[0] && parts[1]) {
                    temp.creator = parts.shift();
                    temp.title = parts.join(" - ");
                    temp.metadata.artists = [{name: temp.creator, musicbrainz_id: ""}];
                    temp.metadata.track = {name: temp.title, musicbrainz_id: ""};
                }
            }
            if (player.status.Name && !player.status.Name.match(/^\//)) {
                // NOTE: 'Name' is returned by MPD - it's the station name
                // as read from the station's stream metadata
                checkForUpdateToUnknownStream(player.status.file, player.status.Name);
                temp.album = player.status.Name;
                temp.metadata.album = {name: temp.album, musicbrainz_id: ""};
            }

            if (playlist.getCurrent('title') != temp.title ||
                playlist.getCurrent('album') != temp.album ||
                playlist.getCurrent('creator') != temp.creator)
            {
                debug.log("STREAMHANDLER","Detected change of track",temp);
                playlist.setCurrent({title: temp.title, album: temp.album, creator: temp.creator});
                nowplaying.newTrack(temp, true);
            }
        }
    }

    function checkForUpdateToUnknownStream(url, name) {
        // If our playlist for this station has 'Unknown Internet Stream' as the
        // station name, let's see if we can update it from the metadata.
        // (Note, recent updates to the code mean this function will rarely do anything)
        var m = playlist.getCurrent('album');
        if (m.match(/^Unknown Internet Stream/)) {
            debug.log("PLAYLIST","Updating Stream",name);
            $.post("utils/updateplaylist.php", { url: url, name: name })
            .done( function() {
                playlist.repopulate();
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").empty();
                    $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
                }
            });
        }
    }

    function setTheClock(callback, timeout) {
        clearProgressTimer();
        progresstimer = setTimeout(callback, timeout);
    }

    this.initialise = function() {
        $.ajax({
            type: 'GET',
            url: 'player/mpd/geturlhandlers.php',
            dataType: 'json',
            success: function(data) {
                for(var i =0; i < data.length; i++) {
                    var h = data[i].replace(/\:\/\/$/,'');
                    debug.log("PLAYER","URL Handler : ",h);
                    player.urischemes[h] = true;
                }
                checkSearchDomains();
                doMopidyCollectionOptions();
                playlist.radioManager.init();
                // Need to call this with a callback when we start up so that checkprogress doesn't get called
                // before the playlist has repopulated.
                self.do_command_list([],self.ready);
                if (!player.collectionLoaded) {
                    debug.log("MPD", "Checking Collection");
                    checkCollection(false, false);
                }
            },
            error: function(data) {
                debug.error("MPD","Failed to get URL Handlers",data);
                infobar.notify(infobar.PERMERROR, "Could not get a respone from the player!");
            }
        });
    }

    this.ready = function() {
        debug.mark("MPD","Player is ready");
        var t = "Connected to "+prefs.player_backend.capitalize() + " at " + player_ip;
        if (prefs.unix_socket) {
        } else {
            t += ":" + prefs.mpd_port;
        }
        infobar.notify(infobar.NOTIFY, t);
        playlist.radioManager.checkSavedState();
    }

	this.do_command_list = function(list, callback) {
        debug.debug("MPD","Command List",list);
        $.ajax({
            type: 'POST',
            url: 'player/mpd/postcommand.php',
            data: {commands: list},
            success: function(data) {
                player.status = data;
                debug.debug("MPD","Status",player.status);
                if (player.status.playlist !== plversion) {
                    playlist.repopulate();
                }
                plversion = player.status.playlist;
                infobar.setStartTime(player.status.elapsed);
                if (callback) {
                    callback();
                    infobar.updateWindowValues();
                } else {
                   self.checkProgress();
                   infobar.updateWindowValues();
                }
            },
            error: function(data) {
                debug.error("MPD","Command List Failed",list,data);
                infobar.notify(infobar.ERROR, "Failed sending command list to mpd");
                self.checkProgress();
            },
            dataType: 'json'
        });
	}

    this.updateCollection = function(cmd) {
        prepareForLiftOff(language.gettext("label_updating"));
        prepareForLiftOff2(language.gettext("label_updating"));
        self.do_command_list([[cmd]], function() {
            update_load_timer = setTimeout( pollAlbumList, 2000);
            update_load_timer_running = true;
        });
    }

    this.reloadAlbumsList = function(uri) {
        $.ajax({
            type: "GET",
            url: uri,
            timeout: 800000,
            dataType: (uri.match(/onthefly\.php/)) ? "json" : "html",
            success: function(data) {
                if (uri.match(/onthefly\.php/)) {
                    updateCollectionDisplay(data);
                    $("#spinner_fothergill").remove();
                    infobar.notify(infobar.NOTIFY,"Music Collection Updated");
                } else {
                    $("#collection").html(data);
                    data = null;
                }
                self.reloadPlaylists();
                player.collectionLoaded = true;
                scootTheAlbums($("#collection"));
            },
            error: function(data) {
                $("#collection").html('<p align="center"><b><font color="red">Failed To Generate Collection :</font></b><br>'+data.responseText+"<br>"+data.statusText+"</p>");
                debug.error("PLAYER","Failed to generate albums list",data);
                infobar.notify(infobar.ERROR,"Music Collection Update Failed");
            }
        });
    }

    this.reloadFilesList = function(uri) {
        $("#filecollection").load(uri);
    }

    this.isConnected = function() {
        return true;
    }

	this.reloadPlaylists = function() {
        $.get("player/mpd/loadplaylists.php", function(data) {
            $("#storedplaylists").html(data);
            if (openpl !== null) {
                $("#storedplaylists").find('input[name="'+openpl+'"]').first().next().click();
                openpl = null;
            }
        });
	}

	this.loadPlaylist = function(name) {
        self.do_command_list([['load', name]]);
        return false;
	}

    this.loadPlaylistURL = function(name) {
        var data = {url: encodeURIComponent(name)};
        $.ajax( {
            type: "GET",
            url: "utils/getUserPlaylist.php",
            cache: false,
            data: data,
            dataType: "xml",
            success: function(data) {
                self.reloadPlaylists();
            },
            error: function(data, status) {
                playlist.repopulate();
                debug.error("MPD","Failed to save user playlist URL");
            }
        } );
        if (prefs.player_backend == "mpd") {
            self.do_command_list([['load', name]]);
        } else {
            self.do_command_list([['add', name]]);
        }
        return false;
    }

	this.deletePlaylist = function(name, callback) {
        openpl = null;
        name = decodeURIComponent(name);
        if (callback) {
            self.do_command_list([['rm',name]], callback);
        } else {
    		self.do_command_list([['rm',name]], function() {
                self.reloadPlaylists();
                if (playlistManager) {
                    playlistManager.reloadAll();
                }
            });
        }
	}

    this.deleteUserPlaylist = function(name) {
        openpl = null;
        var data = {del: encodeURIComponent(name)};
        $.ajax( {
            type: "GET",
            url: "utils/getUserPlaylist.php",
            cache: false,
            data: data,
            dataType: "xml",
            success: function(data) {
                self.reloadPlaylists();
            },
            error: function(data, status) {
                debug.error("MPD","Failed to delete user playlist",name);
            }
        } );
    }

    this.renamePlaylist = function(name, e) {
        openpl = null;
        oldplname = name;
        debug.log("MPD","Renaming Playlist",name,e);
        var rmppu = popupWindow.create(400,300,"rmppu",true,language.gettext("label_renameplaylist"),e.clientX,e.clientY);
        $("#popupcontents").append('<div class="containerbox" style="margin-left:8px"><div class="expand"><input class="enter" id="newplname" type="text" size="200" /></div><button class="fixed">Rename</button></div>');
        $("#newplname").parent().next('button').click(player.controller.doRenamePlaylist);
        $("#newplname").keyup(onKeyUp);
        popupWindow.open();
    }

    this.doRenamePlaylist = function() {
        popupWindow.close();
        self.do_command_list([["rename", decodeURIComponent(oldplname), $("#newplname").val()]], function() {
            self.reloadPlaylists();
            if (playlistManager) {
                playlistManager.reloadAll();
            }
        });
    }

    this.renameUserPlaylist = function(name, e) {
        openpl = null;
        oldplname = name;
        debug.log("MPD","Renaming Playlist",name,e);
        var rmppu = popupWindow.create(400,300,"rmppu",true,language.gettext("label_renameplaylist"),e.clientX,e.clientY);
        $("#popupcontents").append('<div class="containerbox" style="margin-left:8px"><div class="expand"><input class="enter" id="newplname" type="text" size="200" /></div><button class="fixed">Rename</button></div>');
        $("#newplname").parent().next('button').click(player.controller.doRenameUserPlaylist);
        $("#newplname").keyup(onKeyUp);
        popupWindow.open();
    }

    this.doRenameUserPlaylist = function() {
        var data = {rename: encodeURIComponent(oldplname),
                    newname: encodeURIComponent($("#newplname").val())
        };
        $.ajax( {
            type: "GET",
            url: "utils/getUserPlaylist.php",
            cache: false,
            data: data,
            dataType: "xml",
            success: function(data) {
                self.reloadPlaylists();
            },
            error: function(data, status) {
                debug.error("MPD","Failed to rename user playlist",name);
            }
        } );
        popupWindow.close();
    }

    this.deletePlaylistTrack = function(name,songpos,callback) {
        openpl = name;
        if (!callback) {
            callback = self.checkReloadPlaylists;
        }
        self.do_command_list([['playlistdelete',decodeURIComponent(name),songpos]], callback);
    }

    this.checkReloadPlaylists = function() {
        self.reloadPlaylists();
        if (playlistManager) {
            playlistManager.checkToUpdateTheThing(openpl);
        }
    }

	this.clearPlaylist = function() {
	    self.do_command_list([['clear']]);
	}

	this.savePlaylist = function() {

	    var name = $("#playlistname").val();
	    debug.log("GENERAL","Save Playlist",name);
	    if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) {
	        infobar.notify(infobar.ERROR, language.gettext("error_playlistname"));
	    } else {
	        self.do_command_list([["save", name]], function() {
	            self.reloadPlaylists();
                if (playlistManager) {
                    playlistManager.reloadAll();
                }
	            infobar.notify(infobar.NOTIFY, language.gettext("label_savedpl", [name]));
                $("#plsaver").slideToggle('fast');
                self.checkProgress();
	        });
	    }
	}

	this.getPlaylist = function() {
        debug.log("PLAYER","Getting playlist using mpd connection");
        $.ajax({
            type: "GET",
            url: "getplaylist.php",
            cache: false,
            dataType: "json",
            success: playlist.newXSPF,
            error: playlist.updateFailure
        });
	}

	this.play = function() {
        self.do_command_list([['play']]);
	}

	this.pause = function() {
        self.do_command_list([['pause']]);
	}

	this.stop = function() {
        self.do_command_list([["stop"]], self.onStop )
	}

	this.next = function() {
        self.do_command_list([["next"]]);
	}

	this.previous = function() {
        self.do_command_list([["previous"]]);
	}

	this.seek = function(seekto) {
        self.do_command_list([["seek", player.status.song, parseInt(seekto.toString())]]);
	}

	this.playId = function(id) {
        self.do_command_list([["playid",id]]);
	}

	this.playByPosition = function(pos) {
        self.do_command_list([["play",pos.toString()]]);
	}

	this.volume = function(volume, callback) {
        self.do_command_list([["setvol",parseInt(volume.toString())]], callback);
        return true;
	}

	this.removeId = function(ids) {
		var cmdlist = [];
		$.each(ids, function(i,v) {
			cmdlist.push(["deleteid", v]);
		});
		self.do_command_list(cmdlist);
	}

	this.toggleRandom = function() {
	    var new_value = (player.status.random == 0) ? 1 : 0;
	    self.do_command_list([["random",new_value]]);
	}

	this.toggleCrossfade = function() {
	    var new_value = (player.status.xfade === undefined || player.status.xfade === null || player.status.xfade == 0) ? prefs.crossfade_duration : 0;
	    self.do_command_list([["crossfade",new_value]]);
	}

	this.setCrossfade = function(v) {
	    self.do_command_list([["crossfade",v]]);
	}

	this.toggleRepeat = function() {
	    var new_value = (player.status.repeat == 0) ? 1 : 0;
	    self.do_command_list([["repeat",new_value]]);
	}

	this.toggleConsume = function() {
	    var new_value = (player.status.consume == 0) ? 1 : 0;
	    self.do_command_list([["consume",new_value]]);
	}

    this.checkConsume = function(state, callback) {
        var c = player.status.consume;
        self.do_command_list([["consume",state]]);
        if (callback) callback(c);
    }

	this.addTracks = function(tracks, playpos, at_pos) {
        layoutProcessor.notifyAddTracks();
		debug.log("MPD","Adding Tracks",tracks,playpos,at_pos);
		var cmdlist = [];
        if (prefs.mediacentremode) {
            cmdlist.push("clear");
            cmdlist.push('consume "1"');
            at_pos = false;
        }
		var pl = player.status.playlistlength;
		$.each(tracks, function(i,v) {
			switch (v.type) {
				case "uri":
    				cmdlist.push(['add',v.name]);
    				break;
                case "playlist":
				case "cue":
    				cmdlist.push(['load',v.name]);
    				break;
    			case "item":
    				cmdlist.push(['additem',v.name]);
    				break;
                case "artist":
                    cmdlist.push(['addartist',v.name]);
                    break;
    		}
		});
		// Note : playpos, if set, will point to the first track position
		// BEFORE we move it.
        if (prefs.mediacentremode) {
            cmdlist.push(['play']);
        } else if (playpos !== null && playpos > -1) {
			cmdlist.push(['play', playpos.toString()]);
		}
		self.do_command_list(cmdlist, function() {
            // We don't insert tracks at a specific position because we don't always
            // know how many tracks are in each 'item' or 'playlist'. Hence we add them
            // to the end and then move them.
			if (at_pos === 0 || at_pos) {
				self.move(pl, player.status.playlistlength - pl, at_pos);
			}
		});
	}

	this.move = function(first, num, moveto) {
		var itemstomove = first.toString();
		if (num > 1) {
			itemstomove = itemstomove + ":" + (parseInt(first)+parseInt(num));
		}
		debug.log("PLAYER", "Move command is move&arg="+itemstomove+"&arg2="+moveto);
		self.do_command_list([["move",itemstomove,moveto]]);
	}

	this.stopafter = function() {
        var cmds = [];
        if (player.status.repeat == 1) {
            cmds.push(["repeat", 0]);
        }
        cmds.push(["single", 1]);
        self.do_command_list(cmds);
	}

	this.cancelSingle = function() {
		self.do_command_list([["single",0]]);
	}

	this.doOutput = function(id, state) {
		if (state) {
	        self.do_command_list([["enableoutput",id]]);
		} else {
	        self.do_command_list([["disableoutput",id]]);
		}
	}

    this.search = function(command) {
        var terms = {};
        var termcount = 0;
        lastsearchcmd = command;
        $("#collectionsearcher").find('.searchterm').each( function() {
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
        if (prefs.search_limit_limitsearch) {
            domains = $("#mopidysearchdomains").makeDomainChooser("getSelection");
        }
        if (termcount > 0) {
            $("#searchresultholder").empty();
            doSomethingUseful('searchresultholder', language.gettext("label_searching"));
            var st = {
                command: command,
                resultstype: prefs.displayresultsas,
                domains: domains
            };
            debug.log("PLAYER","Doing Search:", terms,st);
            if ((termcount == 1 && (terms.tag || terms.rating)) ||
                (termcount == 2 && (terms.tag && terms.rating))) {
                // Use the sql search engine if we're only looking for
                // tags and/or ratings
                st.terms = terms;
            } else {
                st.mpdsearch = terms;
            }
            $.ajax({
                    type: "POST",
                    url: "albums.php",
                    data: st,
                    success: function(data) {
                        $("#searchresultholder").html(data);
                        data = null;
                    }
            });
        }

    }

    this.reSearch = function() {
        player.controller.search(lastsearchcmd);
    }

    this.rawsearch = function(terms, sources, exact, callback) {
        $.ajax({
                type: "POST",
                url: "albums.php",
                dataType: 'json',
                data: {
                    rawterms: terms,
                    domains: sources,
                    command: exact ? "find" : "search"
                },
                success: function(data) {
                    callback(data);
                    data = null;
                },
                error: function(data) {
                    callback([]);
                    data = null;
                }
        });
    }

	this.postLoadActions = function() {
		self.checkProgress();
        playlist.radioManager.repopulate();
        if (thenowplayinghack) {
            // The Now PLaying Hack is so that when we switch the option for
            // 'display composer/performer in nowplaying', we can first reload the
            // playlist (to get the new artist metadata keys from the backend)
            // and then FORCE nowplaying to accept a new track with the same backendid
            // as the previous - this forces the nowplaying info to update
            thenowplayinghack = false;
            nowplaying.newTrack(playlist.getCurrentTrack(), true);
        }
	}

    this.doTheNowPlayingHack = function() {
        debug.log("MPD","Doing the nowplaying hack thing");
        thenowplayinghack = true;
        playlist.repopulate();
    }

    function clearProgressTimer() {
        clearTimeout(progresstimer);
    }

    this.checkProgress = function() {
        clearProgressTimer();
        // Track changes are detected based on the playlist id. This prevents us from repopulating
        // the browser every time the playlist gets repopulated.
        if (player.status.songid !== previoussongid) {
            debug.mark("MPD","Track has changed");
            playlist.trackHasChanged(player.status.songid);
            previoussongid = player.status.songid;
            safetytimer = 500;
        }

        progress = infobar.progress();
        duration = playlist.getCurrent('duration') || 0;
        percent = (duration == 0) ? 0 : (progress/duration) * 100;
        infobar.setProgress(percent.toFixed(2),progress,duration);

        if (player.status.state == "play") {
            if (duration > 0 && progress >= duration) {
                setTheClock(self.checkchange, safetytimer);
                if (safetytimer < 5000) { safetytimer += 500 }
            } else {
                AlanPartridge++;
                if (AlanPartridge < 5) {
                    setTheClock( self.checkProgress, 1000);
                } else {
                    AlanPartridge = 0;
                    setTheClock( self.checkchange, 1000);
                }                
            }
        } else {
            setTheClock(self.checkchange, 10000);
        }
    }

    this.checkchange = function() {
        clearProgressTimer();
        // Update the status to see if the track has changed
        if (playlist.getCurrent('type') == "stream") {
            self.do_command_list([], self.checkStream);
        } else {
            self.do_command_list([], null);
        }
    }

    this.checkStream = function() {
        updateStreamInfo();
        self.checkProgress();
    }

    this.onStop = function() {
        infobar.setProgress(0,-1,-1);
        self.checkProgress();
    }

    this.replayGain = function(event) {
        var x = $(event.target).attr("id").replace('replaygain_','');
        debug.log("MPD","Setting Replay Gain to",x);
        self.do_command_list([["replay_gain_mode",x]]);
    }

    this.addTracksToPlaylist = function(playlist,tracks,callback) {
        var cmds = new Array();
        for (var i in tracks) {
            if (tracks[i].uri) {
                cmds.push(['playlistadd',decodeURIComponent(playlist),tracks[i].uri]);
            } else if (tracks[i].dir) {
                cmds.push(['playlistadddir',decodeURIComponent(playlist),tracks[i].dir]);
            }
        }
        self.do_command_list(cmds,callback);
    }

    this.movePlaylistTracks = function(playlist,from,to,callback) {
        var cmds = new Array();
        cmds.push(['playlistmove',decodeURIComponent(playlist),from,to]);
        self.do_command_list(cmds,callback);        
    }

}