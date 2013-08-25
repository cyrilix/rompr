function mpdController() {
	var self = this;
	this.status = {};
    var updatetimer = null;

    // NOTE: These functions all clear the playlists's progress timer.
    // playlist.checkProgress restarts it if necessary. If a callback is supplied it MUST call
    // playlist.checkProgress at the end.

    this.command = function(cmd, callback) {
        debug.log("MPD           : ",cmd);
        playlist.clearProgressTimer();
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            debug.log("MPD           : Result for",cmd,data);
            if (cmd == "command=clearerror" && data.error) {
                // Ignore errors on clearerror - we get into an endless loop
                // (mopidy doesn't support clearerror)
                data.error = null;
            }
            self.status = data;
            nowplaying.setStartTime(self.status.elapsed);
            if (callback) {
                callback();
                infobar.updateWindowValues();
            } else {
               playlist.checkProgress();
               infobar.updateWindowValues();
            }
            if ((data.state == "pause" || data.state=="stop") && data.single == 1) {
                mpd.fastcommand("command=single&arg=0");
            }
            debug.log("MPD           : Status",self.status);
        })
        .fail( function() {
            alert("Failed to send command '"+cmd+"' to MPD");
            playlist.checkProgress();
        });
    }

    this.fastcommand = function(cmd, callback) {
        $.getJSON("ajaxcommand.php?fast", cmd)
        .done(function() { if (callback) { callback(); } })
        .fail(function() { if (callback) { callback(); } })
    }

    this.do_command_list = function(list, callback) {
        debug.log("MPD           : Command List",list);
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
                nowplaying.setStartTime(self.status.elapsed);
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

    }

    this.deleteTracksByID = function(tracks, callback) {
        // Disable event listeners, cos we keep getting 'new track' events
        // if we delete the current album while it's playing.
        player.setMopidyEvents(false);
        var list = [];
        for(var i in tracks) {
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, function() {
            player.setMopidyEvents(true);
            callback();
        });
    }

    this.getStatus = function(key) {
        return self.status[key];
    }

    this.deferredupdate = function(time) {
        // Use this to force us to re-check mpd's status after some commands
        // eg sometimes when we seek it doesn't happen immediately.
        // Calling mpd.command with no parameters is fine.
        clearTimeout(updatetimer);
        updatetimer = setTimeout(mpd.command, time);
    }

    // NEED an event handler for volume changes
    //      and also Name , Title and stuff

    this.setState = function(data) {
        switch(data.new_state) {
            case "playing":
                self.status.state = "play";
                break;
            case "stopped":
                self.status.state = "stop";
                break;
            case "paused":
                self.status.state = "pause";
                break;
        }
        //playlist.checkProgress();
        infobar.updateWindowValues();
    }

    this.setTrackState = function(data) {
        debug.log("MPD           : New Track Started",data);
        self.status.songid = data.tl_track.tlid || 0;
        self.status.file = data.tl_track.track.uri;
        self.status.Date = data.tl_track.track.date;
        self.status.elapsed = 0;
        nowplaying.setStartTime(0);
        playlist.checkProgress();
        infobar.updateWindowValues();
    }

    this.trackSeeked = function(data) {
        self.status.elapsed = data.time_position/1000;
        nowplaying.setStartTime(self.status.elapsed);
        playlist.checkProgress();
        infobar.updateWindowValues();
    }


}