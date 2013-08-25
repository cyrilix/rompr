/*
/ Functions here are mostly things where we can use either the mpd command
/ or the mopidy WebSocket. These functions will, if we are connected to mopidy,
/ use the mopidy command first with the mpd command as a fallback
*/

function dualPlayerController() {

    var self = this;
    var mopidy = null;
    var urischemes = {};
    var tracklist = null;
    self.mopidyReady = false;

    self.mp = null;;

    this.doMopidyInit = function() {
        debug.log("PLAYER        : Connected to Mopidy");
        self.mopidyReady = true;
        self.setMopidyEvents(true);
        self.mopidyReloadPlaylists();
        playlist.repopulate();
        mopidy.getUriSchemes().then( function(data) {
            for(var i =0; i < data.length; i++) {
                urischemes[data[i]] = true;
            }
            $("#mopidysearcher").find('.searchdomain').each( function() {
                var v = $(this).attr("value");
                if (!urischemes.hasOwnProperty(v)) {
                    $(this).parent().remove();
                }
            });
        });
    }

    this.doMopidyOffline = function() {
        debug.log("PLAYER        : Mopidy Has Gone Offline");
        self.mopidyReady = false;
        self.setMopidyEvents(false);
    }

    this.mopidyReloadPlaylists = function() {
        if (self.mopidyReady) {
            debug.log("PLAYER        : Retreiving Playlists from Mopidy");
            mopidy.playlists.getPlaylists().then(function (data) {
                        var html = "";
                        if (mobile == "no") {
                            html = html + '<li class="tleft wide"><b>Playlists</b></li>';
                            html = html + '<li class="tleft wide"><table width="100%">';
                        } else {
                            html = html + '<h3>Playlists</h3>';
                            html = html + '<table width="90%">';
                        }
                        $.each(data, function() {
                            var uri = this.uri;
                            html = html + '<tr><td class="playlisticon" align="left">';
                            var protocol = uri.substr(0, uri.indexOf(":"));
                            switch (protocol) {
                                case "soundcloud":
                                    html = html + '<img src="images/soundcloud-logo.png" height="12px" style="vertical-align:middle"></td>';
                                    html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\', true)">'+this.name+'</a></td>';
                                    break;
                                case "spotify":
                                    html = html + '<img src="images/spotify-logo.png" height="12px" style="vertical-align:middle"></td>';
                                    html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\', true)">'+this.name+'</a></td>';
                                    break;
                                default:
                                    html = html + '<img src="images/folder.png" width="12px" style="vertical-align:middle"></td>';
                                    html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+escape(this.name)+'\', false)">'+this.name+'</a></td>';
                                    break;
                            }
                            switch (protocol) {
                                case "spotify":
                                case "soundcloud":
                                    html = html + '<td></td></tr>';
                                    break;
                                default:
                                    html = html + '<td class="playlisticon" align="right"><a href="#" onclick="mpd.fastcommand(\'command=rm&arg='+escape(this.name)+'\', player.reloadPlaylists)"><img src="images/edit-delete.png" style="vertical-align:middle"></a></td></tr>';
                                    break;
                            }
                        });
                        if (mobile == "no") {
                            html = html + '</table></li>';
                        } else {
                            html = html + "</table>";
                        }
                        $("#playlistslist").html(html);
                    }, consoleError);
        }
    }

    this.loadPlaylist = function(uri) {
        if (self.mopidyReady) {
            mopidy.playlists.lookup(uri).then( function(list) {
                debug.log("PLAYER        : Playlist : ",list);
                mopidy.tracklist.add(list.tracks).then( playlist.repopulate );
            });
        } else {
            alert("Your HTTP connection to Mopidy has been lost!")
        }
    }

    this.setMopidyEvents = function(state) {
        if (self.mopidyReady) {
            if (state) {
                mopidy.on("event:playbackStateChanged", function(data) {
                    debug.log("PLAYER        : Mopidy State Change",data);
                    mpd.setState(data);
                });
                mopidy.on("event:trackPlaybackStarted", function(data) {
                    debug.log("PLAYER        : Track Playback Started",data);
                    mpd.setTrackState(data);
                });
                mopidy.on("event:seeked", function(data) {
                    debug.log("PLAYER        : Track Seeked",data);
                    mpd.trackSeeked(data);
                });
                mopidy.on("event:trackPlaybackEnded", function(data) {
                    debug.log("PLAYER        : Track Playback Ended",data);
                });
            } else {
                mopidy.off("event:playbackStateChanged");
                mopidy.off("event:trackPlaybackStarted");
                mopidy.off("event:seeked");
                mopidy.off("event:trackPlaybackEnded");
            }
        }
    }

    var consoleError = console.error.bind(console);

    if (prefs.use_mopidy_http == 1) {
        debug.log("PLAYER        : Connecting to Mopidy HTTP frontend");
        mopidy = new Mopidy({
            webSocketUrl: "ws://"+prefs.mpd_host+":"+prefs.mopidy_http_port+"/mopidy/ws/"
        });
        mopidy.on("state:online", self.doMopidyInit);
        mopidy.on("state:offline", self.doMopidyOffline);
        mopidy.on("event:playlistsLoaded", self.mopidyReloadPlaylists);
        self.mp = mopidy;
    }

    this.reloadPlaylists = function() {
        if (self.mopidyReady) {
            self.mopidyReloadPlaylists();
        } else {
            $("#playlistslist").load("loadplaylists.php?mobile="+mobile);
        }
    }

    this.mopidyUpdate = function() {
        prepareForLiftOff();
        $("#loadinglabel").html("Loading Collection");
        if (self.mopidyReady) {
            debug.log("PLAYER        : Forcing mopidy to reload its library");
            mopidy.library.refresh('file:').then( function() { checkPoll({data: 'dummy' }) });
        } else {
            checkPoll({data: 'dummy' });
        }
    }

    this.updateCollection = function(cmd) {
        debug.log("PLAYER        : Updating collection with command", cmd);
        prepareForLiftOff();
        prepareForLiftOff2();
        if (prefs.use_mopidy_tagcache == 1) {
            if (cmd == "rescan") {
                $.ajax({
                    type: 'GET',
                    url: 'doMopidyScan.php',
                    cache: false,
                    timeout: 1800000,
                    success: function() {
                        if (self.mopidyReady) {
                            debug.log("PLAYER        : Forcing mopidy to reload its library");
                            mopidy.library.refresh('file:').then( function() { checkPoll({data: 'dummy' }) });
                        } else {
                            checkPoll({data: 'dummy' });
                        }
                    },
                    error: function() {
                        alert("Failed to create mopidy tag cache");
                        checkPoll({data: 'dummy' });
                    }
                });
            } else {
                checkPoll({data: 'dummy' });
            }
        } else {
            $.getJSON("ajaxcommand.php", "command="+cmd, function() {
                        update_load_timer = setTimeout( pollAlbumList, 2000);
                        update_load_timer_running = true;
            });
        }
    }

    this.reloadAlbumsList = function(uri) {
        if (uri.indexOf("?") < 0) {
            // This means we want to update the cache
            if (self.mopidyReady) {
                // Get the list of files from mopidy using the HTTP connection
                debug.log("PLAYER        : Getting list of files using mopidy websocket search");
                var be = new Array();
                if (prefs.use_mopidy_file_backend) {
                    be.push('file:');
                }
                if (prefs.use_mopidy_beets_backend) {
                    be.push('beets:');
                }
                if (be.length == 0) {
                    alert("You have not chosen a backend to build a collection with!");
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
                            }
                        });
                }, consoleError);

            } else {
                // If running mopidy and use_mopidy_tagcache is true,
                // this will read the tag cache file. If running mpd
                // then this just does the normal thing
                $("#collection").load(uri);
            }
        } else {
            $("#collection").load(uri);
        }
    }

    this.doMopidySearch = function(searchtype) {
        if (self.mopidyReady) {
            var terms = {};
            var cunt = 0;
            $("#mopidysearcher").find('.searchterm').each( function() {
                var key = $(this).attr('name');
                var value = $(this).attr("value");
                debug.log("PLAYER        : Searching for",key, value);
                if (value != "") {
                    terms[key] = [value];
                    cunt++;
                }
            });
            var domains = new Array();
            var fanny = 0;
            var prefssave = { search_limit_limitsearch: $("#limitsearch").is(':checked') ? 1 : 0 };
            $("#mopidysearcher").find('.searchdomain').each( function() {
                if (checkDomain(this)) {
                    debug.log("PLAYER        : Search Type", $(this).attr("value"));
                    domains.push($(this).attr("value")+":");
                    fanny++;
                }
                prefssave['search_limit_'+$(this).attr("value")] = $(this).is(':checked') ? 1 : 0;
            });
            prefs.save(prefssave);
            if (cunt > 0 && (!($("#limitsearch").is(':checked')) || fanny > 0)) {
                $("#searchresultholder").empty();
                doSomethingUseful('search');
                debug.log("PLAYER:Doing Search:", terms, domains);
                mopidy.library[searchtype](terms, domains).then( function(data) {
                    debug.log("PLAYER:Search Results",data);
                    $.ajax({
                            type: "POST",
                            url: "parseMopidySearch.php",
                            data: JSON.stringify(data),
                            contentType: "application/json",
                            success: function(data) {
                                $("#searchresultholder").html(data);
                                $("#usefulbar").remove();
                                data = null;
                            }
                        });
                    data = null;
                }, consoleError);
            }
        } else {
            alert("Your HTTP connection to Mopidy has been lost!")
        }
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

    this.getPlaylist = function() {
        if (self.mopidyReady) {
            debug.log("PLAYER        : Using Mopidy HTTP connection for playlist");
            mopidy.tracklist.getTlTracks().then( function (data) {
                debug.log("PLAYER        : Got Playlist from Mopidy:", data);
                tracklist = data;
                $.ajax({
                        type: "POST",
                        url: "parseMopidyPlaylist.php",
                        data: JSON.stringify(data),
                        contentType: "application/json",
                        dataType: "xml",
                        success: playlist.newXSPF,
                        error: function(data) {
                            alert("Something went wrong retrieving the playlist!");
                        }
                    });
            }, consoleError);
        } else {
            debug.log("PLAYER        : Using fallback playlist populator");
            $.ajax({
                type: "GET",
                url: "getplaylist.php",
                cache: false,
                contentType: "text/xml; charset=utf-8",
                dataType: "xml",
                success: playlist.newXSPF,
                error: function(data) {
                    alert("Something went wrong retrieving the playlist!");
                }
            });
        }
    }

    this.gogogo = function() {
        if (self.mopidyReady) {
            mopidy.playback.play();
        } else {
            mpd.command('command=play');
        }
    }

    this.procrastinate = function() {
        if (self.mopidyReady) {
            mopidy.playback.pause();
        } else {
            mpd.command('command=pause');
        }
    }

    this.stop = function() {
        if (self.mopidyReady) {
            mopidy.playback.stop().then( playlist.stop );
        } else {
            mpd.command("command=stop", playlist.stop )
        }
    }

    this.seek = function(seekto) {
        if (self.mopidyReady) {
            mopidy.playback.seek(seekto*1000).then(function(data){debug.log("SEEK RESULT   : ",data)}, consoleError);
        } else {
            mpd.command("command=seek&arg="+mpd.getStatus('song')+"&arg2="+parseInt(seekto.toString()),
                function() { mpd.deferredupdate(1000) });
        }
    }

    this.playId = function(id) {
        debug.log("PLAYER        : Playing ID",id);
        if (self.mopidyReady) {
            for(var i = 0; i < tracklist.length; i++) {
                if (tracklist[i].tlid == id ||
                    (id == 0 && !tracklist[i].tlid)) {
                    debug.log("PLAYER        : Playing Track",tracklist[i]);
                    mopidy.playback.play(tracklist[i],1).then( function(data){ }, function(){
                        // Fallback in case the above fails due to some known but
                        // as yet not understood mopidy problem
                        debug.log("PLAYER       : Mopidy error, using fallback");
                        mpd.command("command=playid&arg="+id);
                    });
                    break;
                }
            }
        } else {
            mpd.command("command=playid&arg="+id);
        }

    }

    // this.getSongData = function(data) {
    //     var s = new Object();
    //     mopidy.playback.getTimePosition().then(function(time) {
    //         s.elapsed = time/1000;
    //         mpd.gotTrackState(s);
    //     })
    // }

    this.test = function() {
        mopidy.playback.getCurrentTlTrack().then(function(tltrack) {
            mopidy.tracklist.index(tltrack).then(function(index) {
                debug.log(index);
            }, consoleError);
        }, consoleError);
    }

}

