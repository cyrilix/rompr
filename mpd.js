function mpdController() {
	var self = this;
	this.status = {};

	this.update = function() {
		self.command("");
	}

    this.command = function(cmd, callback) {
        debug.log("command : ",cmd);
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            self.status = data;
            if (self.status.error) { 
                alert("MPD Error: "+self.status.error); 
            }
            //if (cmd == "command=play" || cmd == "command=pause") {
                nowplaying.track.setStartTime(self.status.elapsed); 
            //}
            switch (self.status.state) {
                case "stop":
                    playlist.checkSongIdAfterStop(self.status.songid);
                    break;
            }
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
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
    }

}