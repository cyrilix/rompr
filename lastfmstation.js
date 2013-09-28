function lastfmstation(tuneurl) {

	var self = this;
	this.url = tuneurl;
	this.tracks = [];
	this.numtrackswanted = 0;
	this.trackinsertpos = -1;
	this.playafterinsert = false;
    this.notworking = false;
    this.toremove = null;
    debug.log("LASTFM RADIO","Creating new last.fm station for",tuneurl);

	this.repopulate = function() {
        if (!self.notworking) {
            lastfm.radio.tune({station: self.url}, self.weAreTuned, self.isBroken);
        }
	}

    this.isBroken = function(data) {
        self.notworking = true;
        lastFMTuneFailed(data);
    }

	this.weAreTuned = function(data) {
        debug.log("LASTFM RADIO","Station is tuned",data);
        lastfm.radio.getPlaylist({discovery: 0, rtp: lastfm.getScrobbling(), bitrate: 128}, self.gotNewTracks, lastFMTuneFailed);
	}

	this.gotNewTracks = function(xml) {
        debug.log("LASTFM RADIO","Got tracks for",self.url,xml);
        var expiry = $(xml).find("link").text();
        expiry = parseInt(expiry) + Math.round(new Date()/1000);
        debug.log("LASTFM RADIO","Last.FM: expiry at",expiry);
        $(xml).find("track").each( function() {
            var track = {
                url: $(this).find("location").text(),
                expiry: expiry
            };
            self.tracks.push( track );
            debug.log("LASTFM RADIO","New Track", $(this).find("location").text());
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
            debug.log("LASTFM RADIO","Station out of tracks",self.url);
            self.repopulate();
            return 0;
        }
        var pushtracks = [];
        var counter = self.numtrackswanted;
        while (counter > 0 && self.tracks.length > 0) {
            newtrack = self.tracks.shift();
            if (newtrack.expiry > (new Date()/1000)) {
                debug.debug("LASTFM RADIO","Shifted:",newtrack.url);
                pushtracks.push(newtrack);
                counter--;
            } else {
                debug.log("LASTFM RADIO",newtrack.url,"has expired");
            }
        }
        if (counter == 0 && self.numtrackswanted > 0) {
            var cmdlist = [];
            for (var i in pushtracks) {
                debug.log("LASTFM RADIO","Pushing last.fm track",pushtracks[i].url);
                cmdlist.push({type: 'uri', name: pushtracks[i].url});
            }
            if (self.toremove != null) {
                for(var i in self.toremove) {
                    debug.log("LASTFM RADIO","Deleting track by ID",self.toremove[i]);
                    cmdlist.push({type: 'delete', name: self.toremove[i] });
                }
            }
            if (self.trackinsertpos == -1) {
                self.trackinsertpos = null;
            }
            self.numtrackswanted = 0;
            self.toremove = null;
            var playpos = -1;
            if (self.playafterinsert) {
                playpos = playlist.playFromEnd();
            }
            player.controller.addTracks(cmdlist, playpos, self.trackinsertpos);
        }
        if (counter > 0) {
            // We didn't get enough tracks
            debug.warn("LASTFM RADIO","last.FM didn't get enough tracks");
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
    var stations = [];

    this.getTracks = function(tuneurl, numtracks, insertpos, play, remove) {
        debug.log("LASTFM RADIO","Getting tracks for",tuneurl,numtracks,insertpos,play);
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