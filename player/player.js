function multiProtocolController() {

    var self = this;

    // These are all the mpd status fields the program currently cares about.
    // We don't need to initialise them here; this is for reference
    this.status = {
    	file: null,
    	bitrate: null,
    	audio: null,
    	state: null,
    	volume: -1,
    	song: -1,
    	elapsed: 0,
    	songid: 0,
    	consume: 0,
    	xfade: 0,
    	repeat: 0,
    	random: 0,
    	error: null,
    	Date: null,
    	Genre: null,
    	Title: null,
    }

    this.collectionLoaded = false;

    this.controller = new playerController();

}