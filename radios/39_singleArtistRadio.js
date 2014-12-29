var singleArtistRadio = function() {

	var tuner;
	var artist;

	return {

		populate: function(p, flag) {
			if (p && p != artist) {
				debug.shout("ARTIST RADIO","Populating",p);
				artist = p;
				tuner = new searchRadio();
				tuner.sending = 10;
				tuner.running = true;
				tuner.artistindex = 0;
				tuner.newArtist(artist);
				tuner.populateNext(10);
				setTimeout(tuner.startSending, 10000);
			} else {
				debug.log("FAVE ARTIST RADIO","RePopulating");
				if (tuner.sending <= 0) {
					tuner.sending = 10;
					tuner.startSending();
				}
			}
		},

		stop: function() {
			tuner.sending = 0;
			tuner.running = false;
		},

		modeHtml: function() {
			return '<i class="icon-wifi modeimg"/></i><span class="modespan ucfirst">'+artist+" "+language.gettext("label_radio")+'</span>';
		},

        setup: function() {
            var html = '<div class="containerbox dropdown-container spacer">';
            html = html + '<div class="fixed"><i class="icon-wifi smallicon"/></i></div>';
            html = html + '<div class="fixed padright"><span style="vertical-align:middle">'+language.gettext('label_singleartistradio')+'</span></div>';
            html = html + '<div class="expand dropdown-holder"><input class="enter" id="franklin" type="text" onkeyup="onKeyUp(event)" /></div>';
            html = html + '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="playlist.radioManager.load(\'singleArtistRadio\', $(\'#franklin\').val())">'+language.gettext('button_playradio')+'</button>';
            html = html + '</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);
        }
	}
}();

playlist.radioManager.register("singleArtistRadio", singleArtistRadio);
