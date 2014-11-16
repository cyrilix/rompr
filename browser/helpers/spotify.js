var spotify = function() {

	var baseURL = 'https://api.spotify.com';
	var queue = new Array();
	var throttle = null;
	var collectedobj = null;

	function objFirst(obj) {
		for (var a in obj) {
			return a;
		}
	}

	return {

		request: function(reqid, url, success, fail, prio) {

			if (prio && queue.length > 1) {
				queue.splice(1, 0, {flag: false, reqid: reqid, url: url, success: success, fail: fail } );
			} else {
				queue.push( {flag: false, reqid: reqid, url: url, success: success, fail: fail } );
			}
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
	                	debug.debug("SPOTIFY","Request success",c,data);
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
		                	var root = objFirst(data);
		                	if (data[root].next) {
		                		debug.log("SPOTIFY","Got a response with a next page!");
		                		if (data[root].previous == null) {
		                			collectedobj = data;
		                		} else {
		                			collectedobj[root].items = collectedobj[root].items.concat(data[root].items);
		                		}
		                		queue.unshift({flag: false, reqid: '', url: data[root].next, success: req.success, fail: req.fail});
		                	} else if (data[root].previous) {
	                			collectedobj[root].items = collectedobj[root].items.concat(data[root].items);
		                		debug.log("SPOTIFY","Returning concatenate multi-page result");
	                			req.success(collectedobj);
		                	} else {
		                    	req.success(data);
		                    }
		                }

	                	if (c == "From Cache") {
	                		throttle = setTimeout(spotify.getrequest, 100);
	                	} else {
	                		throttle = setTimeout(spotify.getrequest, 1500);
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

			getInfo: function(id, success, fail, prio) {
				var url = baseURL + '/v1/tracks/' + id;
				spotify.request('', url, success, fail, prio);
			}

		},

		album: {

			getInfo: function(id, success, fail, prio) {
				var url = baseURL + '/v1/albums/' + id;
				spotify.request(id, url, success, fail, prio);
			},

			getMultiInfo: function(ids, success, fail, prio) {
				var url = baseURL + '/v1/albums/?ids=' + ids.join();
				spotify.request('', url, success, fail, prio);
			}

		},

		artist: {

			getInfo: function(id, success, fail, prio) {
				var url = baseURL + '/v1/artists/' + id;
				spotify.request('', url, success, fail, prio);
			},

			getRelatedArtists: function(id, success, fail, prio) {
				var url = baseURL + '/v1/artists/' + id + '/related-artists'
				spotify.request('', url, success, fail, prio);
			},

			getTopTracks: function(id, success, fail, prio) {
				var url = baseURL + '/v1/artists/' + id + '/top-tracks'
				spotify.request('', url, success, fail, prio);
			},

			getAlbums: function(id, types, success, fail, prio) {
				var url = baseURL + '/v1/artists/'+id+'/albums?album_type='+types+'&market='+prefs.lastfm_country_code+'&limit=50';
				spotify.request(id, url, success, fail, prio);
			},

			search: function(name, success, fail, prio) {
				var url = baseURL + '/v1/search?q='+name.replace(/ /g,'+')+'&type=artist';
				spotify.request('', url, success, fail, prio);
			}

		}

	}
}();
