function playerController() {

    var self = this;
	var updatetimer = null;
    var progresstimer = null;
    var safetytimer = 500;
    var consumeflag = true;
    var previoussongid = null;
    var AlanPartridge = 0;

    function updateStreamInfo() {

        // When playing a stream, mpd returns 'Title' in its status field.
        // This usually has the form artist - track. We poll this so we know when
        // the track has changed (note, we rely on radio stations setting their
        // metadata reliably)

        if (playlist.currentTrack && playlist.currentTrack.type == "stream") {
            var temp = cloneObject(playlist.currentTrack);
            if (player.status.Title) {
                var tit = player.status.Title;
                var parts = tit.split(" - ");
                if (parts[0] && parts[1]) {
                    temp.creator = parts.shift();
                    temp.title = parts.join(" - ");
                }
            }
            if (player.status.Name && !player.status.Name.match(/^\//)) {
                // NOTE: 'Name' is returned by MPD - it's the station name
                // as read from the station's stream metadata
                checkForUpdateToUnknownStream(player.status.file, player.status.Name);
                temp.album = player.status.Name;
            }

            if (playlist.currentTrack.title != temp.title ||
                playlist.currentTrack.album != temp.album ||
                playlist.currentTrack.creator != temp.creator)
            {
                temp.musicbrainz.artistid = "";
                temp.musicbrainz.albumid = "";
                temp.musicbrainz.trackid = "";
                temp.musicbrainz.albumartistid = "";
                playlist.currentTrack = temp;
                debug.log("STREAMHANDLER","Detected change of track",playlist.currentTrack);
                nowplaying.newTrack(playlist.currentTrack);
            }
            temp = null;
        }
    }

    function checkForUpdateToUnknownStream(url, name) {
        // If our playlist for this station has 'Unknown Internet Stream' as the
        // station name, let's see if we can update it from the metadata.
        // (Note, recent updates to the code mean this function will rarely do anything)
        var m = playlist.currentTrack.album;
        if (m.match(/^Unknown Internet Stream/)) {
            debug.log("PLAYLIST","Updating Stream",name);
            $.post("updateplaylist.php", { url: url, name: name })
            .done( function() {
                playlist.repopulate();
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").empty();
                    $("#yourradiolist").load("yourradio.php");
                }
            });
        }
    }

    function setTheClock(callback, timeout) {
        clearProgressTimer();
        progresstimer = setTimeout(callback, timeout);
    }

    this.initialise = function() {
    	self.command("", playlist.repopulate);
		if (!player.collectionLoaded) {
            debug.log("MPD", "Checking Collection");
            player.collectionLoaded = true;
            checkCollection();
        }
		self.reloadPlaylists();
        playlist.radioManager.init();
    }

	this.command = function(cmd, callback) {
        debug.debug("MPD","'"+cmd+"'");
        clearProgressTimer();
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            debug.debug("MPD","Result for","'"+cmd+"'",data);
            if (cmd == "command=clearerror" && data.error) {
                // Ignore errors on clearerror - we get into an endless loop
                data.error = null;
            }
            player.status = data;
            infobar.setStartTime(player.status.elapsed);
            if (callback) {
                callback();
                infobar.updateWindowValues();
            } else {
               self.checkProgress();
               infobar.updateWindowValues();
            }
            if ((data.state == "pause" || data.state=="stop") && data.single == 1) {
                self.fastcommand("command=single&arg=0");
            }
            debug.debug("MPD","Status",player.status);
        })
        .fail( function() {
            alert("Failed to send command '"+cmd+"' to MPD");
            self.checkProgress();
        });
	}

	this.fastcommand = function(cmd, callback) {
        $.getJSON("ajaxcommand.php?fast", cmd)
        .done(function() { if (callback) { callback(); } })
        .fail(function() { if (callback) { callback(); } })
	}

	this.do_command_list = function(list, callback) {
        debug.log("MPD","Command List",list);
        clearProgressTimer();
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
                player.status = data;
                infobar.setStartTime(player.status.elapsed);
                if (callback) {
                    callback();
                    infobar.updateWindowValues();
                } else {
                    self.checkProgress();
                    infobar.updateWindowValues();
                }

            },
            error: function() {
                alert("Failed sending command list to mpd");
                playlist.checkProgress();
            },
            dataType: 'json'
        });
	}

    this.deferredupdate = function(time) {
        // Use this to force us to re-check mpd's status after some commands
        // eg sometimes when we seek it doesn't happen immediately.
        // Calling mpd.command with no parameters is fine.
        clearTimeout(updatetimer);
        updatetimer = setTimeout(self.command, time);
    }

    this.updateCollection = function(cmd) {
        prepareForLiftOff(language.gettext("label_updating"));
        prepareForLiftOff2(language.gettext("label_updating"));
        $.getJSON("ajaxcommand.php", "command="+cmd, function() {
                    update_load_timer = setTimeout( pollAlbumList, 2000);
                    update_load_timer_running = true;
        });
    }

    this.reloadAlbumsList = function(uri) {
       	$("#collection").load(uri);
    }

    this.reloadFilesList = function(uri) {
        $("#filecollection").load(uri);
        $('#filesearch').load("filesearch.php");
    }

	this.reloadPlaylists = function() {
        $.get("loadplaylists.php", function(data) {
            var html = '';
            if (mobile == "no") {
                html = html + '<table width="100%">';
            } else {
                html = html + '<table width="90%">';
            }
            html = html + data + "</table>";
            $("#storedplaylists").html(html);
            // addCustomScrollBar("#tigger");
        });
	}

	this.loadPlaylist = function(name) {
        self.command('command=load&arg='+name, playlist.repopulate);
	}

	this.deletePlaylist = function(name) {
		self.fastcommand('command=rm&arg='+escape(name), self.reloadPlaylists);
	}

	this.clearPlaylist = function() {
	    self.command('command=clear', playlist.repopulate);
	}

	this.savePlaylist = function() {

	    var name = $("#playlistname").val();
	    debug.log("GENERAL","Save Playlist",name);
	    if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) {
	        alert(language.gettext("error_playlistname"));
	    } else {
	        self.fastcommand("command=save&arg="+encodeURIComponent(name), function() {
	            self.reloadPlaylists();
	            infobar.notify(infobar.NOTIFY, language.gettext("label_savedpl", [name]));
	        });
	        $("#saveplst").slideToggle('fast');
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
        self.command('command=play');
	}

	this.pause = function() {
        self.command('command=pause');
	}

	this.stop = function() {
        self.command("command=stop", self.onStop )
	}

	this.next = function() {
		if (player.status.state == 'play') {
            self.command("command=next");
		}
	}

	this.previous = function() {
		if (player.status.state == 'play') {
            self.command("command=previous");
		}
	}

	this.seek = function(seekto) {
        self.command("command=seek&arg="+player.status.song+"&arg2="+parseInt(seekto.toString()),
            function() { self.deferredupdate(1000) });
	}

	this.playId = function(id) {
        self.command("command=playid&arg="+id);
	}

	this.playByPosition = function(pos) {
        self.command("command=play&arg="+pos.toString());
	}

	this.clearerror = function() {
		self.command('command=clearerror');
	}

	this.volume = function(volume, callback) {
        if (player.status.state != "stop") {
            self.command("command=setvol&arg="+parseInt(volume.toString()), callback);
        } else {
            infobar.notify(infobar.ERROR, language.gettext("label_mpd_no"));
            if (callback) {
                callback();
            }
            return false;
        }
        return true;
	}

	this.removeId = function(ids) {
		var cmdlist = [];
		$.each(ids, function(i,v) {
			cmdlist.push("deleteid "+v);
		});
		self.do_command_list(cmdlist, playlist.repopulate);
	}

	this.toggleRandom = function() {
	    var new_value = (player.status.random == 0) ? 1 : 0;
	    self.command("command=random&arg="+new_value);
	}

	this.toggleCrossfade = function() {
	    var new_value = (player.status.xfade == 0) ? 1 : 0;
	    if (new_value == 1) {
	        new_value = prefs.crossfade_duration;
	    }
	    self.command("command=crossfade&arg="+new_value);
	}

	this.setCrossfade = function(v) {
	    self.command("command=crossfade&arg="+v);
	}

	this.toggleRepeat = function() {
	    var new_value = (player.status.repeat == 0) ? 1 : 0;
	    self.command("command=repeat&arg="+new_value);
	}

	this.toggleConsume = function() {
	    var new_value = (player.status.consume == 0) ? 1 : 0;
	    self.command("command=consume&arg="+new_value);
	}

	this.addTracks = function(tracks, playpos, at_pos) {
		if (mobile != "no") {
    		infobar.notify(infobar.NOTIFY, language.gettext("label_addingtracks"));
    	}
		debug.log("MPD","Adding Tracks",tracks,playpos,at_pos);
		var cmdlist = [];
		var pl = player.status.playlistlength;
		$.each(tracks, function(i,v) {
			switch (v.type) {
				case "uri":
    				cmdlist.push('add "'+v.name+'"');
    				break;
				case "cue":
    				cmdlist.push('load "'+v.name+'"');
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
					pl--;
    				break;
    		}
		});
		// Note : playpos, if set, will point to the first track position
		// BEFORE we move it.
		if (playpos !== null && playpos > -1) {
			cmdlist.push('play "'+playpos.toString()+'"');
		}
		self.do_command_list(cmdlist, function() {
			if (at_pos == 0 || at_pos) {
				self.move(pl, player.status.playlistlength - pl, at_pos);
			} else {
				playlist.repopulate();
			}
		});
	}

	this.move = function(first, num, moveto) {
		var itemstomove = first.toString();
		if (num > 1) {
			itemstomove = itemstomove + ":" + (parseInt(first)+parseInt(num));
		}
		debug.log("PLAYER", "Move command is move&arg="+itemstomove+"&arg2="+moveto);
		self.command("command=move&arg="+itemstomove+"&arg2="+moveto, playlist.repopulate);
	}

	this.stopafter = function() {
        var cmds = [];
        if (player.status.repeat == 1) {
            cmds.push("repeat 0");
        }
        cmds.push("single 1");
        self.do_command_list(cmds);
	}

	this.cancelSingle = function() {
		self.command("command=single&arg=0");
	}

	this.doOutput = function(id, state) {
		if (state) {
	        self.command("command=enableoutput&arg="+id);
		} else {
	        self.command("command=disableoutput&arg="+id);
		}
	}

    this.search = function() {
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
        if (termcount > 0) {
            $("#searchresultholder").empty();
            doSomethingUseful('searchresultholder', language.gettext("label_searching"));
            debug.log("PLAYER","Doing Search:", terms);
            var st;
            if ((termcount == 1 && (terms.tag || terms.rating)) ||
                (termcount == 2 && (terms.tag && terms.rating))) {
                // Use the sql search engine if we're only looking for
                // tags and/or ratings
                st = {terms: terms};
            } else {
                st = {mpdsearch: terms};
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

    this.rawsearch = function(terms, ,sources, callback) {
        $.ajax({
                type: "POST",
                url: "albums.php",
                dataType: 'json',
                data: {rawterms: terms},
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

    this.rawfindexact = function(terms, callback) {
        // MPD doesn't suuport findexact so search will have to do
        player.controller.rawsearch(terms, [], callback);
    }

	this.postLoadActions = function() {
		self.checkProgress();
	}

    function clearProgressTimer() {
        clearTimeout(progresstimer);
    }

    this.checkProgress = function() {
        clearProgressTimer();
        // Track changes are detected based on the playlist id. This prevents us from repopulating
        // the browser every time the playlist gets repopulated.
        if (player.status.songid != previoussongid) {
            debug.mark("PLAYLIST","Track has changed");
            playlist.trackchanged();

            playlist.findCurrentTrack();

            if (player.status.consume == 1 && consumeflag) {
                debug.log("PLAYLIST","Repopulating due to consume being on");
                // If consume is one, we must repopulate
                consumeflag = false;
                playlist.repopulate();
                return 0;
            }

            if (playlist.currentTrack) {
                debug.log("PLAYLIST","Creating new track",playlist.currentTrack);
                nowplaying.newTrack(playlist.currentTrack);
            } else {
                player.status.songid = undefined;
                player.status.elapsed = undefined;
                player.status.file = undefined;
                nowplaying.newTrack(playlist.emptytrack);
                infobar.setProgress(0);
                $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
                $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
            }

            previoussongid = player.status.songid;
            consumeflag = true;
            safetytimer = 500;
        }

        if (playlist.currentTrack === null) {
            return;
        }

        progress = infobar.progress();
        duration = playlist.currentTrack.duration || 0;
        percent = (duration == 0) ? 0 : (progress/duration) * 100;
        infobar.setProgress(percent.toFixed(2),progress,duration);

        if (player.status.state == "play") {
            if (progress > 4) { infobar.updateNowPlaying() };
            if (percent >= prefs.scrobblepercent) { infobar.scrobble(); }
            // MPD interface. We need to poll.
            if (duration > 0 && playlist.currentTrack.type != "stream") {
                if (progress >= duration) {
                    // Check to see if the track has changed. The safety timer
                    // is there because sometimes the track length we are given is not correct
                    setTheClock(self.checkchange, safetytimer);
                    if (safetytimer < 5000) { safetytimer += 500 }
                } else {
                    setTheClock( self.checkProgress, 1000);
                }
            } else {
                // It's a stream. Every 5 seconds we poll mpd to see if the track has changed
                AlanPartridge++;
                if (AlanPartridge < 5) {
                    setTheClock( self.checkProgress, 1000);
                } else {
                    AlanPartridge = 0;
                    setTheClock( self.streamfunction, 1000);
                }
            }
        }
    }

    this.checkchange = function() {
        // Update the status to see if the track has changed
        self.command("", self.checkProgress);
    }

    this.streamfunction = function() {
        clearProgressTimer();
        self.command("", self.checkStream);
    }

    this.checkStream = function() {
        clearProgressTimer();
        updateStreamInfo();
        self.checkProgress();
    }

    this.onStop = function() {
        playlist.stopped();
        self.checkProgress();
    }

}