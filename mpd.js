function mpdController() {
	var self = this;
	this.status = {};

    this.command = function(cmd, callback) {
       debug.log("mpd command",cmd);
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            self.status = data;
            nowplaying.setStartTime(self.status.elapsed); 
            if (callback) { 
                callback();
                infobar.updateWindowValues(); 
            } else {
               playlist.checkProgress(); 
               infobar.updateWindowValues();
            }            
        })
        .fail( function(data) { alert("Failed to send command '"+cmd+"' to MPD") });
    }
    
    // Don't access mpd.status directly from outside this scope, it causes memory leaks.
    this.getStatus = function(key) {
        return self.status[key];
    }

    this.do_command_list = function(list, callback) {
        
        $.ajax({
            type: 'POST',
            url: 'postcommand.php',
            data: {'commands[]': list},
            success: function(data) {
                self.status = data;
                nowplaying.setStartTime(self.status.elapsed); 
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
        var list = [];
        for(var i in tracks) {
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
        list = null;
    }

}