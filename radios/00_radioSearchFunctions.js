function searchRadio() {

	var self = this;
	this.artists = new Array();
	this.running = false;
	this.sending = 0;
	this.artistindex = 0;
	var populatetimer = null;
	var sendingtimer = null;

	function searchArtist(name) {
		debug.mark("SEARCHRADIO ARTIST","Creating",name);
		var tracks = null;
		var myself = this;
		this.populated = false;

		this.populate = function() {
			if (!myself.populated) {
				debug.log("SEARCHRADIO","Getting tracks for",name);
				player.controller.rawsearch({artist: [name]}, [], myself.gotTracks);
				myself.populated = true;
			}
		}

		this.gotTracks = function(data) {
			debug.debug("SEARCHRADIO ARTIST","Got Tracks",data);
			tracks = new Array();
			for (var j in data) {
				if (data[j].hasOwnProperty('tracks')) {
					for (var k in data[j].tracks) {
						if (data[j].tracks[k].hasOwnProperty('artists')) {
							for (var l in data[j].tracks[k].artists) {
								if (data[j].tracks[k].artists[l].name.toLowerCase() == name.toLowerCase()) {
									tracks.push({type: 'uri', name: data[j].tracks[k].uri});
									break;
								}
							}
						}
					}
				}
			}
			if (tracks.length > 0) {
				tracks = tracks.sort(randomsort);
				debug.log("SEARCHRADIO","Got",tracks.length,"tracks for",name);
				if (self.sending > 0) {
					myself.sendATrack();
				}
			}
			self.populateNext(2000);
		}

		this.sendATrack = function() {
			debug.log("SEARCHRADIO",name,"is sending a track");
			if (self.running && tracks && tracks.length > 0) {
				self.sending--;
        		player.controller.addTracks([tracks.shift()], playlist.playFromEnd(), null);
        	}
		}
	}

	this.newArtist = function(name) {
		self.artists.push(new searchArtist(name));
	}

	this.populateNext = function(timeout) {
		clearTimeout(populatetimer);
		if (self.running) {
			for (var i in self.artists) {
				if (!self.artists[i].populated) {
					populatetimer = setTimeout(self.artists[i].populate, timeout);
					break;
				}
			}
		}
	}

	this.startSending = function() {
		clearTimeout(sendingtimer);
		if (self.sending > 0) {
			self.artists[self.artistindex].sendATrack();
			self.artistindex++;
			if (self.artistindex >= self.artists.length) self.artistindex = 0;
			sendingtimer = setTimeout(self.startSending, 2000);
		}
	}
}