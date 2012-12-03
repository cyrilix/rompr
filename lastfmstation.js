function lastfmstation(tuneurl) {

	var self = this;
	this.url = tuneurl;
	this.tracks = new Array();
	this.numtrackswanted = 0;
	this.trackinsertpos = -1;
	this.playafterinsert = false;
    this.toremove = null;
    debug.log("Creating new last.fm station for",tuneurl);

	this.repopulate = function() {
        lastfm.radio.tune({station: self.url}, self.weAreTuned, lastFMTuneFailed);
	}

	this.weAreTuned = function(data) {
        if (data && data.error) { lastFMTuneFailed(data); return false; };
        lastfm.radio.getPlaylist({discovery: 0, rtp: lastfm.getScrobbling(), bitrate: 128}, self.gotNewTracks, lastFMTuneFailed);
	}

	this.gotNewTracks = function(xml) {
        debug.log("Got tracks for",self.url);
        $(xml).find("track").each( function() {
            self.tracks.push($(this).find("location").text());
            debug.log($(this).find("location").text(), $(this).find("title").text());
        });
        var oSerializer = new XMLSerializer(); 
        var xmlString = oSerializer.serializeToString(xml);
        $.post("newplaylist.php", 
            { 
                type: "radio", 
                xml: xmlString, 
                stationurl: self.url
            })
            .done( function() { 
                self.doWeNeedToUpdate();
            });
    }

    this.doWeNeedToUpdate = function() {

        if (self.tracks.length == 0) {
            debug.log("Station out of tracks",self.url);
            self.repopulate();
            return 0;
        }
        var pushtracks = new Array();
        var counter = self.numtrackswanted;
        while (counter > 0 && self.tracks.length > 0) {
            pushtracks.push(self.tracks.shift());
            counter--;
        }
        if (counter == 0 && self.numtrackswanted > 0) {
            var cmdlist = new Array();
            for (var i in pushtracks) {
                debug.log("Pushing last.fm track",pushtracks[i]);
                cmdlist.push('add "'+pushtracks[i]+'"');
            }
            if (self.trackinsertpos > -1) {
                var elbow = playlist.getfinaltrack()+1;
                var arse = elbow+pushtracks.length;
                cmdlist.push('move '+elbow.toString()+':'+arse.toString()+' '+self.trackinsertpos.toString());
                debug.log("Move command is : "+'move '+elbow.toString()+':'+arse.toString()+' '+self.trackinsertpos.toString());
            }
            if (self.toremove != null) {
                for(var i in self.toremove) {
                    debug.log("Deleting track by ID",self.toremove[i]);
                    cmdlist.push('deleteid "'+self.toremove[i]+'"');
                }
            }
            if (self.playafterinsert && mpd.status.state == 'stop') {
                cmdlist.push(playlist.playfromend());
            }
            self.numtrackswanted = 0;
            self.toremove = null;
            mpd.do_command_list(cmdlist, playlist.repopulate);
        }
        if (counter > 0) {
            // We didn't get enough tracks
            self.tracks = pushtracks;
            self.repopulate();
        }

    }

    this.giveMeTracks = function(number, where, play, remove) {
        self.numtrackswanted = number;
        self.trackinsertpos = where;
        self.playafterinsert = play;
        self.toremove = remove;
        self.doWeNeedToUpdate();
    }

    this.checkurl = function(u) {
        if (u == self.url) {
            return true;
        } else {
            return false;
        }
    }

}

function lastFMprovider() {
    var self = this;
    var stations = new Array();

    this.getTracks = function(tuneurl, numtracks, insertpos, play, remove) {
        debug.log("Getting tracks for",tuneurl,numtracks,insertpos,play);
        var stn = getStation(tuneurl);
        stn.giveMeTracks(numtracks, insertpos, play, remove);
    }

    function getStation(u) {
        for (var i in stations) {
            if (stations[i].checkurl(u)) {
                return stations[i];
            }
        }
        var s = new lastfmstation(u);
        stations.push(s);
        return s;
    }
}