var artistRadio = function() {

	var sending = 0;
	var gotAllAlbums = false
	var artists = new Array();
	var artistname;
	var artistindex;

	function getArtistName(id) {
		spotify.artist.getInfo(id, artistRadio.gotArtistName, artistRadio.fail);
	}

	function getRelatedArtists(spotid) {
		artists.push({id :spotid});
		debug.log("ARTIST RADIO","Getting related artists for",spotid);
		spotify.artist.getRelatedArtists(spotid, artistRadio.gotRelatedArtists, artistRadio.fail);
	}

	function getAlbumsForNextArtist() {
		var id = null;
		find: {
			for (var i in artists) {
				if (artists[i].albums === undefined) {
					id = artists[i].id;
					debug.log("ARTIST RADIO","Getting Albums for artist index",i,id);
					break find;
				}
			}
		}
		if (id) {
			spotify.artist.getAlbums(id, 'album', artistRadio.gotSomeAlbums, artistRadio.failQuiet);
		} else {
			debug.mark("We've got all albums");
		}
	}

	function searchForArtist(name) {
		spotify.artist.search(name, artistRadio.gotArtists, artistRadio.fail);
	}

	function sendTracks(num) {
		var t = new Array();
		debug.log("ARTIST RADIO","Asked to send",num,"tracks, flag is",sending);
		debug.log("ARTIST RADIO", "Artistindex is",artistindex);
		// Safety counter just in case
		var c = 100;
		while (num > 0 && sending < 5 && c > 0) {
			if (artists[artistindex].albums !== undefined &&
				artists[artistindex].albums[artists[artistindex].albumindex] !== undefined &&
				artists[artistindex].albums[artists[artistindex].albumindex].tracks !== undefined) {
				t.push(artists[artistindex].albums[artists[artistindex].albumindex].tracks[artists[artistindex].albums[artists[artistindex].albumindex].trackindex]);
				sending++;
				num--;
			} else {
				debug.log("ARTIST RADIO","...something was undefined");
			}
			if (artists[artistindex].albums !== undefined &&
				artists[artistindex].albums[artists[artistindex].albumindex] !== undefined &&
				artists[artistindex].albums[artists[artistindex].albumindex].tracks !== undefined) {
				artists[artistindex].albums[artists[artistindex].albumindex].trackindex++;
				if (artists[artistindex].albums[artists[artistindex].albumindex].trackindex >= artists[artistindex].albums[artists[artistindex].albumindex].tracks.length) {
					artists[artistindex].albums[artists[artistindex].albumindex].trackindex = 0;
				}
			}
			if (artists[artistindex].albumindex !== undefined) {
				artists[artistindex].albumindex++;
				if (artists[artistindex].albumindex >= artists[artistindex].albums.length) {
					artists[artistindex].albumindex = 0;
				}
			}
			artistindex++;
			if (artistindex >= artists.length) {
				artistindex = 0;
			}
			c--;
		}
		if (t.length > 0) {
			debug.mark("ARTIST RADIO","Sending tracks to playlist",t);
			player.controller.addTracks(t, playlist.playFromEnd(), null);
		} else {
			debug.log("ARTIST RADIO","No tracks to send",num,sending,c);
		}
	}

	function randomiseartists(a,b) {
		if (Math.random() > 0.5) {
			return 1;
		} else {
			return -1;
		}
	}

	return {

		populate: function(artist) {
			if (artist) {
				debug.log("ARTIST RADIO","Populating with",artist);
				artists = new Array();
				sending = 0;
				artistindex = 0;

				if (artist.substr(0,15) == "spotify:artist:") {
					getArtistName(artist.substr(15,artist.length));
				} else {
					debug.log("ARTIST RADIO","Searching for artist",artist);
					artistname = artist;
					searchForArtist(artist);
				}
			} else {
				debug.log("ARTIST RADIO", "Repopulating");
				if (sending < 5) {
					debug.log("ARTIST RADIO", "...already populating. Doing nothing");
				} else {
					if (sending == 5) sending = 0;
					sendTracks(5);
				}
			}

		},

		modeHtml: function() {
			return '<img src="'+ipath+'broadcast-12.png" style="vertical-align:middle"/>&nbsp;<span style="vertical-align:middle">'+artistname+'&nbsp;'+language.gettext("label_radio")+'</span>';
		},

		stop: function() {
			sending = 5;
		},

		gotArtists: function(data) {
			var f = false;
			for (var i in data.artists.items) {
				if (data.artists.items[i].name.toLowerCase == artistname.toLowerCase) {
					artistname = data.artists.items[i].name;
					getRelatedArtists(data.artists.items[i].id);
					f = true;
					break;
				}
			}
			if (!f) {
				artistRadio.fail();
			}
		},

		gotArtistName: function(data) {
			artistname = data.name;
			getRelatedArtists(data.id);
		},

		gotRelatedArtists: function(data) {
			for (var i in data.artists) {
				artists.push({id: data.artists[i].id});
			}
			artists.sort(randomiseartists);
			debug.log("ARTIST RADIO","Got related artists",artists);
			getAlbumsForNextArtist();
		},

		gotSomeAlbums: function(data) {
			debug.log("ARTIST RADIO","Album data arrived:",data);
			var albums = new Array();
			var ids = new Array();
			for (var i in data.items) {
				albums.push({id: data.items[i].id});
				ids.push(data.items[i].id);
			}
			albums.sort(randomiseartists);
			for (var i in artists) {
				if (artists[i].id == data.reqid) {
					artists[i].albums = albums;
					artists[i].albumindex = 0;
					debug.log("ARTIST RADIO","Got Albums for artist index",i);
				}
			}
			while (ids.length > 0) {
				var temp = new Array();
				while (ids.length > 0 && temp.length < 20) {
					temp.push(ids.shift());
				}
				spotify.album.getMultiInfo(temp, artistRadio.gotSomeTracks, artistRadio.failQuiet);
			}
			getAlbumsForNextArtist();
		},


		gotSomeTracks: function(data) {
			for (var i in data.albums) {
				var tracks = new Array();
				for (var j in data.albums[i].tracks.items) {
					tracks.push({type: 'uri', name : data.albums[i].tracks.items[j].uri});
				}
				tracks.sort(randomiseartists);
				var reqid = data.albums[i].id;
				for (var k in artists) {
					for (var l in artists[k].albums) {
						if (artists[k].albums[l].id == reqid) {
							artists[k].albums[l].tracks = tracks;
							artists[k].albums[l].trackindex = 0;
							debug.log("ARTIST RADIO","Some Tracks arrived for artist",k,"and album",l);
						}
					}
				}
			}
			sendTracks(1);
		},

		fail: function(data) {
            debug.error("ARTIST RADIO","Failed to create playlist",data);
            infobar.notify(infobar.ERROR,"Failed to create Playlist");
            playlist.endSmartMode();
		},

		failQuiet: function(data) {
            debug.error("ARTIST RADIO","Spotify Failure!",data);
		},

		setup: function() {
            var html = '<div class="padright menuitem">';
            html = html + '<div class="containerbox dropdown-container">';
            html = html + '<div class="fixed playlisticon"><img src="'+ipath+'document-open-folder.png" height="12px" style="vertical-align:middle"></div>';
            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('label_artist')+'</span></div>';
            html = html + '<div class="expand dropdown-holder"><input class="searchterm enter sourceform" id="bubbles" type="text" style="width:100%;font-size:100%;vertical-align:middle"/></div>';
            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'artistRadio\', $(\'#bubbles\').val())">'+language.gettext('button_playradio')+'</button>';
            html = html + '</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);

		}

	}

}();

playlist.radioManager.register("artistRadio", artistRadio);
