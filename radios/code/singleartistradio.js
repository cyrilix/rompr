var singleArtistRadio = function() {

	var tuner;
	var artist;

	return {

		populate: function(p, numtracks) {
			if (p && p != artist) {
				debug.shout("ARTIST RADIO","Populating",p);
				artist = p;
				if (typeof(searchRadio) == 'undefined') {
					debug.log("ARTIST RADIO","Loading Search Radio Tuner");
					$.getScript('radios/code/searchRadio.js',function() {
						singleArtistRadio.actuallyGo(numtracks)
					});
				} else {
					singleArtistRadio.actuallyGo(numtracks);
				}
			} else {
				debug.log("FAVE ARTIST RADIO","RePopulating");
				var a = tuner.sending;
				tuner.sending += (numtracks - tuner.sending);
				if (a == 0 && tuner.sending > 0) {
					tuner.startSending();
				}
				tuner.running = true;
			}
		},

		actuallyGo: function(numtracks) {
			tuner = new searchRadio();
			tuner.sending = numtracks;
			tuner.running = true;
			tuner.artistindex = 0;
			tuner.newArtist(artist);
			tuner.populateNext(10);
			setTimeout(tuner.startSending, 10000);
		},

		stop: function() {
			if (tuner) {
				tuner.sending = 0;
				tuner.running = false;
			}
			artist = null;
		},

		modeHtml: function(a) {
			return '<i class="icon-wifi modeimg"/></i><span class="modespan ucfirst">'+a+" "+
				language.gettext("label_radio")+'</span>';
		}
	}
}();

playlist.radioManager.register("singleArtistRadio", singleArtistRadio);
