function mpdController() {
	var self = this;
	this.status = {};

    // NOTE: These functions all clear the playlists's progress timer.
    // playlist.checkProgress restarts it if necessary. If a callback is supplied it MUST call
    // playlist.checkProgress at the end.
    
    this.command = function(cmd, callback) {
        playlist.clearProgressTimer();
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
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
        var list = [];
        for(var i in tracks) {
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
    }

    this.getStatus = function(key) {
        return self.status[key];
    }

}