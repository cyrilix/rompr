/*
/ Functions here are things where we can use either the mpd command
/ or the mopidy WebSocket. These functions will, if we are connected to mopidy,
/ use the mopidy command first with the mpd command as a fallback
*/

function dualPlayerController() {

    var self = this;
    var mopidy = null;
    self.mopidyReady = false;

    self.mp = null;;

    this.doMopidyInit = function() {
        debug.log("Connected to Mopidy");
        self.mopidyReady = true;
        mopidyReloadPlaylists();
    }

    var consoleError = console.error.bind(console);

    if (prefs.use_mopidy_http == 1) {
        debug.log("Connecting to Mopidy HTTP frontend");
        mopidy = new Mopidy({
            webSocketUrl: "ws://"+prefs.mpd_host+":"+prefs.mopidy_http_port+"/mopidy/ws/"
        });
        mopidy.on("state:online", self.doMopidyInit);
        self.mp = mopidy;
    }

    function mopidyReloadPlaylists() {
    	if (self.mopidyReady) {
            debug.log("Retreiving Playlists from Mopidy");
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
                        			html = html + '<img src="images/soundcloud-logo.png" height="12px" style="vertical-align:middle">';
                        			break;
                        		case "spotify":
                        			html = html + '<img src="images/spotify-logo.png" height="12px" style="vertical-align:middle">';
                        			break;
                        		default:
                        			html = html + '<img src="images/folder.png" width="12px" style="vertical-align:middle">';
                        			break;
                        	}
                        	html = html + "</td>";
    			            html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+encodeURIComponent(this.name)+'\')">'+this.name+'</a></td>';
                        	switch (protocol) {
                        		case "spotify":
                        		case "soundcloud":
                        			html = html + '<td></td></tr>';
                        			break;
                        		default:
    					            html = html + '<td class="playlisticon" align="right"><a href="#" onclick="mpd.fastcommand(\'command=rm&arg='+encodeURIComponent(this.name)+'\', player.reloadPlaylists)"><img src="images/edit-delete.png" style="vertical-align:middle"></a></td></tr>';
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

    this.reloadPlaylists = function() {
        if (self.mopidyReady) {
            mopidyReloadPlaylists();
        } else {
            $("#playlistslist").load("loadplaylists.php?mobile="+mobile);
        }
    }

    this.mopidyUpdate = function() {
        prepareForLiftOff();
        $("#loadinglabel").html("Loading Collection");
        if (self.mopidyReady) {
            debug.log("Forcing mopidy to reload its library");
            mopidy.library.refresh('file:').then( function() { checkPoll({data: 'dummy' }) });
        } else {
            checkPoll({data: 'dummy' });
        }
    }

    this.updateCollection = function(cmd) {
        debug.log("Updating collection with command", cmd);
        prepareForLiftOff();
        if (prefs.use_mopidy_tagcache == 1) {
            if (cmd == "rescan") {
                $.ajax({
                    type: 'GET',
                    url: 'doMopidyScan.php',
                    cache: false,
                    timeout: 1200000,
                    success: function() { 
                        if (self.mopidyReady) {
                            debug.log("Forcing mopidy to reload its library");
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
                debug.log("Getting list of files using mopidy websocket search");
                mopidy.library.search({}, ['file:']).then( function(data) {
                    $.ajax({
                            type: "POST",
                            url: "parseMopidyTracks.php", 
                            data: JSON.stringify(data[0].tracks),
                            contentType: "application/json",
                            success: function(data) {
                                $("#collection").html(data);
                            }
                        });
                }, console.error.bind(console));

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

}

