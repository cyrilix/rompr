function currentArtist(lfm, mpdd) {

    var self = this;

    this.mpd_data = mpdd;
    this.lfm_data = lfm;
    debug.log("Creating New Artist");

    this.name = function() {
        return self.lfm_data.name();
    }
}

function currentAlbum(lfm, mpdd) {
    
    var self = this;

    this.mpd_data = mpdd;
    this.lfm_data = lfm;

    if (this.mpd_data.image != "") { changeAlbumPicture(this.mpd_data.image); }
    debug.log("Creating New Album");

    this.name = function() {
        return self.lfm_data.name();
    }
    
    this.gotAlbumInfo = function(object) {
        infobar.setNowPlayingInfo();
        // Get album image, if we need it
        if(this.mpd_data.image == "") {
            debug.log("Using album art from last.FM");
            var albumart = self.lfm_data.image("medium") || "images/album-unknown.png";
            changeAlbumPicture(albumart);
        }
    }

    function changeAlbumPicture(url) {
        // Animate the change of album art
        $('#albumpicture').fadeOut(1000, function () {
            $('#albumpicture').attr("src", url);
            $('#albumpicture').fadeIn(1000);
        });
    }

}
    
function currentTrack(lfm, mpdd) {
    
    var self = this;

    this.scrobbled = false;
    this.nowplaying_updated = false;
    this.mpd_data = mpdd;
    this.lfm_data = lfm;
    var date = new Date();
    this.starttime = (date.getTime())/1000 - parseFloat(mpd.status.elapsed);
    debug.log("Creating New Track",mpdd);

    this.name = function() {
        // This will return the mpd name if it hasn't been populated
        return self.lfm_data.name();
    }

    this.duration = function() {
        var d = self.mpd_data.duration;
        if (d == 0 && self.mpd_data.type != "stream") {
            d = self.lfm_data.duration();
        }
        return d;
    }

    this.setStartTime = function(elapsed) {
        var date = new Date();
        self.starttime = (date.getTime())/1000 - parseFloat(elapsed);
        debug.log("Setting Start Time to",self.starttime);
    }

    this.progress = function() {
        var date = new Date();
        var progress = (date.getTime())/1000 - self.starttime;
        if (mpd.status.state == "stop") { progress = 0; };
        return progress;
    }
    
}

function playInfo() {
 
    var self = this;
    self.track = new currentTrack(emptylfmtrack, emptytrack);
    self.album = new currentAlbum(emptylfmalbum, emptytrack);
    self.artist = new currentArtist(emptylfmartist, emptytrack);
    
    this.newTrack = function(mpdinfo) {
        // Track has changed
        var history = { 
            track: nowplaying.track.lfm_data,
            album: nowplaying.album.lfm_data,
            artist: nowplaying.artist.lfm_data
        };
        history.track = new lfmtrack(mpdinfo.title, mpdinfo.creator, infobar.setNowPlayingInfo);
        self.track = new currentTrack(history.track, mpdinfo);
        history.track.populate();
        if (mpdinfo.creator != nowplaying.artist.mpd_data.creator) {
            history.artist = new lfmartist(mpdinfo.creator, infobar.setNowPlayingInfo);
            self.artist = new currentArtist(history.artist, mpdinfo);
            history.artist.populate();
        }
        if (mpdinfo.album != nowplaying.album.mpd_data.album) {
            history.album = new lfmalbum(mpdinfo.album, mpdinfo.creator, self.gotAlbumInfo);
            self.album = new currentAlbum(history.album, mpdinfo);
            history.album.populate();
        }
        infobar.setNowPlayingInfo();
        browser.updatesComing(history);
    }
    
    this.gotAlbumInfo = function() { self.album.gotAlbumInfo() }
        
}
