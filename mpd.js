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
        
        $.ajax({
            type: 'POST',
            url: 'postcommand.php',
            data: {'commands[]': list},
            success: function(data) {
                self.status = data;
                nowplaying.track.setStartTime(self.status.elapsed); 
                if (callback) { 
                    infobar.updateWindowValues(); 
                    callback();
                } else {
                    playlist.checkProgress(); 
                    infobar.updateWindowValues();
                }
            
            },
            dataType: 'json'
        });
        
    }

    this.deleteTracksByID = function(tracks, callback) {
        var list = new Array();
        for(var i in tracks) {
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
    }

}