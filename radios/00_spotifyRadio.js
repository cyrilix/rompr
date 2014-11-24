function spotifyRadio() {

	var self = this;
	this.sending = 0;
	this.artists = new Array();
	this.running = false;
	this.artistindex = 0;
	var sendingTimer = null;

	function mixArtist(name, id, findrelated) {
		debug.mark("SPOTIRADIO ARTIST","Creating",name,id);
		var albums = null;

		this.gotSomeAlbums = function(data) {
			debug.debug("SPOTIRADIO ARTIST","Got albums for",name,data);
			albums = new mixAlbum(name, data.items);
		}

		this.gotRelatedArtists = function(data) {
			debug.debug("SPOTIRADIO ARTIST","Got related artists for",name,data);
			for (var i in data.artists) {
				ac: {
	        		for (var j in self.artists) {
	        			if (self.artists[j].getName() == data.artists[i].name) {
	        				debug.shout("SPOTIRADIO", "Ignoring artist",data.artists[i].name,"because it already exists");
	        				break ac;
	        			}
	        		}
					// add a new artist in a random position in the array
					self.artists.splice(Math.floor(Math.random() * self.artists.length), 0, new mixArtist(data.artists[i].name, data.artists[i].id, false));
	        	}
			}
		}

		this.failQuiet = function(data) {
			debug.warn("SPOTIRADIO ARTIST", "Spotify Error On",name,data);
		}

		this.sendATrack = function() {
			if (albums === null) {
				debug.shout("SPOTIRADIO ARTIST","Artist",name,"was asked to send a track but has no albums");
				return false;
			}
			debug.debug("SPOTIRADIO ARTIST","Artist",name,"was asked to send a track");
			albums.sendATrack();
		}

		this.getName = function() {
			return name;
		}

		if (self.running) {
			spotify.artist.getAlbums(id, 'album', this.gotSomeAlbums, this.failQuiet);
			if (findrelated) {
				debug.mark("SPOTIRADIO ARTIST", "Getting Related Artists For",name);
				spotify.artist.getRelatedArtists(id, this.gotRelatedArtists, this.failQuiet);
			}
		}
	}

	function mixAlbum(name, items) {
		var myself = this;
		debug.mark("SPOTIRADIO ALBUM", "Getting tracks for artist",name);
		var tracks = new Array();

		this.gotTracks = function(data) {
			debug.debug("SPOTIRADIO ALBUM", "Got Tracks For",name,data);
			for (var i in data.albums) {
				for (var j in data.albums[i].tracks.items) {
					tracks.push({type: 'uri', name: data.albums[i].tracks.items[j].uri});
				}
			}
			tracks.sort(randomsort);
			if (self.sending > 0) {
				myself.sendATrack();
			}
		}

		this.failQuiet = function(data) {
			debug.warn("SPOTIRADIO ALBUM", "Spotify Error On",name,data);
		}

		this.sendATrack = function() {
			if (self.running && tracks.length > 0) {
				self.sending--;
				debug.shout("SPOTIRADIO ALBUM",name,"is sending a track!",self.sending,"left");
	        	player.controller.addTracks([tracks.shift()], playlist.playFromEnd(), null);
			} else {
				debug.debug("SPOTIRADIO ALBUM",name,"was asked for a track but doesn't have any");
			}
		}

		if (self.running) {
			var ids = new Array();
			for (var i in items) {
				ids.push(items[i].id);
			}
			while (ids.length > 0) {
				ids.sort(randomsort);
				var temp = new Array();
				while (ids.length > 0 && temp.length < 20) {
					// Can only multi-query 20 albums at a time.
					temp.push(ids.shift());
				}
				spotify.album.getMultiInfo(temp, this.gotTracks, this.failQuiet, true);
			}
		}
	}

	this.startSending = function() {
		clearTimeout(sendingTimer);
		if (self.sending > 0) {
			debug.shout("MIX RADIO","Asking Artist",self.artistindex,"to send a track");
			self.artists[self.artistindex].sendATrack();
			self.artistindex++;
			if (self.artistindex >= self.artists.length) self.artistindex = 0;
			sendingTimer = setTimeout(self.startSending, 2000);
		}
	}

	this.newArtist = function(name, id, getrelated) {
		self.artists.push(new mixArtist(name, id, getrelated));
	}

}