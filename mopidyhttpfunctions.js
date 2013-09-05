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


    this.mopidyReloadPlaylists = function() {
        if (self.mopidyReady) {
        }
    }

    this.loadPlaylist = function(uri) {
        if (self.mopidyReady) {
        } else {
            alert("Your HTTP connection to Mopidy has been lost!")
        }
    }

    this.setMopidyEvents = function(state) {
        if (self.mopidyReady) {
        }
    }



    this.reloadPlaylists = function() {
        if (self.mopidyReady) {
            self.mopidyReloadPlaylists();
        } else {
        }
    }

    this.mopidyUpdate = function() {
        prepareForLiftOff();
        $("#loadinglabel").html("Loading Collection");
        if (self.mopidyReady) {
            debug.log("PLAYER          : Forcing mopidy to reload its library");
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
                            debug.log("PLAYER          : Forcing mopidy to reload its library");
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
                debug.log("PLAYER          : Getting list of files using mopidy websocket search");
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
        } else {
            alert("Your HTTP connection to Mopidy has been lost!")
        }
    }


    this.getPlaylist = function() {
        if (self.mopidyReady) {
        } else {
        }
    }

    this.gogogo = function() {
        if (self.mopidyReady) {
        } else {
        }
    }

    this.procrastinate = function() {
    }

    this.stop = function() {
    }

    this.next = function() {
    }

    this.previous = function() {
    }

    this.seek = function(seekto) {
        if (self.mopidyReady) {
        } else {
        }
    }

    this.playId = function(id) {
        if (self.mopidyReady) {
        } else {
        }
    }

    this.playByPosition = function(pos) {
        if (self.mopidyReady) {
        } else {
        }
    }


}

