function mpdController() {
	var self = this;
	this.status = {};

	this.update = function() {
		self.command("");
	}

    this.command = function(cmd, callback) {
        debug.log("mpd command",cmd);
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            self.status = data;
            nowplaying.track.setStartTime(self.status.elapsed); 
            if (callback) { 
                callback();
                infobar.updateWindowValues(); 
            } else {
               playlist.checkProgress(); 
               infobar.updateWindowValues();
            }
            
        })
        .fail( function(data) { alert("Failed to send command to MPD") });
    }

    this.do_command_list = function(list, callback) {
        $.post("postcommand.php", {'commands[]': list}, function(data) {
            self.command("", callback);
        });        
    }

    this.deleteTracksByID = function(tracks, callback) {
        var list = new Array();
        for(var i in tracks) {
            debug.log("Deleting track by ID",tracks[i]);
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
    }

}