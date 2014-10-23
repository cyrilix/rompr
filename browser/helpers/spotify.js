var spotify = function() {

	var baseURL = 'https://api.spotify.com';
	var queue = new Array();
	var throttle = null;

	return {

		request: function(reqid, url, success, fail) {

			queue.push( {flag: false, reqid: reqid, url: url, success: success, fail: fail } );
			debug.debug("SPOTIFY","New request",url);
			if (throttle == null && queue.length == 1) {
				spotify.getrequest();
			}

		},

		getrequest: function() {

			var req = queue[0];
			clearTimeout(throttle);

            if (req) {
            	if (req.flag) {
            		debug.error("SPOTIFY","Request just pulled from queue is already being handled");
            		return;
            	}
				queue[0].flag = true;
				debug.debug("SPOTIFY","Taking next request from queue",req.url);
	            var getit = $.ajax({
	                dataType: "json",
	                url: "getspdata.php?uri="+encodeURIComponent(req.url),
	                success: function(data) {
	                	var c = getit.getResponseHeader('Pragma');
	                	debug.debug("SPOTIFY","Request success",c);
	                	if (c == "From Cache") {
	                		throttle = setTimeout(spotify.getrequest, 100);
	                	} else {
	                		throttle = setTimeout(spotify.getrequest, 1500);
	                	}
	                	req = queue.shift();
	                	if (data === null) {
		                	debug.warn("SPOTIFY","No data in response",req);
	                		data = {error: language.gettext("spotify_error")};
	                	}
	                	if (req.reqid != '') {
	                		data.reqid = req.reqid;
	                	}
		                if (data.error) {
		                	debug.warn("SPOTIFY","Request failed",req,data);
		                    req.fail(data);
		                } else {
		                    req.success(data);
		                }
		            },
	                error: function(data) {
	                	throttle = setTimeout(spotify.getrequest, 1500);
	                	req = queue.shift();
	                	debug.warn("SPOTIFY","Request failed",req,data);
	                	data = {error: language.gettext("spotify_noinfo")}
	                	if (req.reqid != '') {
	                		data.reqid = req.reqid;
	                	}
	                	req.fail(data);
	                }
	            });
	        } else {
            	throttle = null;
	        }
		},

		track: {

			getInfo: function(id, success, fail) {
				var url = baseURL + '/v1/tracks/' + id;
				spotify.request('', url, success, fail);
			}

		},

		album: {

			getInfo: function(id, success, fail) {
				var url = baseURL + '/v1/albums/' + id;
				spotify.request(id, url, success, fail);
			},

			getMultiInfo: function(ids, success, fail) {
				var url = baseURL + '/v1/albums/?ids=' + ids.join();
				spotify.request('', url, success, fail);
			}

		},

		artist: {

			getInfo: function(id, success, fail) {
				var url = baseURL + '/v1/artists/' + id;
				spotify.request('', url, success, fail);
			},

			getRelatedArtists: function(id, success, fail) {
				var url = baseURL + '/v1/artists/' + id + '/related-artists'
				spotify.request('', url, success, fail);
			},

			getTopTracks: function(id, success, fail) {
				var url = baseURL + '/v1/artists/' + id + '/top-tracks'
				spotify.request('', url, success, fail);
			},

			getAlbums: function(id, types, success, fail) {
				//TODO - the market is required = we must somehow work it out!
				var url = baseURL + '/v1/artists/'+id+'/albums?album_type='+types+'&market='+prefs.lastfm_country_code+'&limit=50';
				spotify.request(id, url, success, fail);
			},

			search: function(name, success, fail) {
				var url = baseURL + '/v1/search?q='+name.replace(/ /g,'+')+'&type=artist';
				spotify.request('', url, success, fail);
			}

		}

	}
}();
