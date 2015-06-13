var soundcloud = function() {

	var clientid = "6f43d0d67acd6635273ffd6eeed302aa";
	var self = this;

	return {
		getTrackInfo: function(mopidyURI, callback) {
			// "soundcloud:song/King Tubby meets Soul Rebel Uptown.92868852"
			debug.log("SOUNDCLOUD","Trying to get track info from",mopidyURI);
			var a = mopidyURI.match(/(\d+)$/);
			var tracknum = a[1];
			debug.log("SOUNDCLOUD","Getting soundcloud info for track",tracknum);
			$.jsonp( {
				url: "https://api.soundcloud.com/tracks/"+tracknum+".json?client_id="+clientid+"&callback=?",
				timeout: 30000,
				success: callback,
				error: function(data) { debug.warn("SOUNDCLOUD","SoundCloud Error",data);
										callback(data);
				}
			});
		},

		getUserInfo: function(userid, callback) {
			debug.log("SOUNDCLOUD","Getting soundcloud info for user",userid);
			$.jsonp( {
				url: "https://api.soundcloud.com/users/"+userid+".json?client_id="+clientid+"&callback=?",
				timeout: 30000,
				success: callback,
				error: function(data) { debug.warn("SOUNDCLOUD","SoundCloud Error",data);
										callback(data);
				}
			});

		}
	}
}();