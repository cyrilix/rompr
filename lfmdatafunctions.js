// These are pretty much all the same.
// The playlist creates these. The callback is for use by the playlist
// so these objects can tell it when they are populated with information

// The browser will use showMe() to request that these objects call back into it
// when they are populated with information (which includes tag information).
// The callback into the browser is hardcoded, but probably doesn't need to be.
// Mind you, the callback into the playlist could be hardcoded too.

// I wish Javascript did proper subclassing.

function lfmtrack(track, artist, callback) {
    var self = this;
    this.mpd_name = track;
    this.artist = artist;
    this.trackinfo = null;
    this.userTags = null;
    this.callback = callback;
    this.display = false;
    this.redotags = false;

    this.gotTrackInfo = function(data) {
        self.trackinfo = data;
        if (data.error) {
            self.trackinfo.track = {};        
        }
        self.checkToUpdate();
    }

    this.gotNoTrackInfo = function(data) {
        self.gotTrackInfo({error: 1, message: "Could not find information about this track"});
    }

    this.gotTagInfo = function(data) {
        self.userTags = data;
        self.checkToUpdate();
    }

    this.gotNoTagInfo = function(data) {
        self.gotTagInfo({tags: {}});
    }

    this.populate = function() {
        if (self.mpd_name == "") {
            self.gotNoTagInfo();
            self.gotNoTrackInfo();
        } else {
            if (self.trackinfo == null) {
                lastfm.track.getInfo(
                    {  
                        track: encodeURIComponent(self.mpd_name), 
                        artist: encodeURIComponent(self.artist)
                    }, 
                    self.gotTrackInfo, 
                    self.gotNoTrackInfo
                );
            }
            if (self.userTags == null) {
                lastfm.track.getTags(
                    {  
                        track: encodeURIComponent(self.mpd_name), 
                        artist: encodeURIComponent(self.artist)
                    }, 
                    self.gotTagInfo, 
                    self.gotNoTagInfo
                );
            }
        }
    }

    this.checkToUpdate = function() {
        if (self.trackinfo != null) {
            if (self.callback != null) {
                self.callback(self);
                self.callback = null;
            }
            if (self.userTags != null) {
                if (self.display) {
                    browser.updateTrackBrowser(self);
                    self.display = false;
                }
                if (self.redotags) {
                    browser.updateUserTags(self.usertags(), "track");
                    self.redotags = false;
                }
            }
        }
    }

    this.addTags = function(taglist) {
        self.userTags = null;
        var options = new Object;
        options.track = self.name();
        options.artist = self.artist;
        options.tags = taglist;
        self.redotags = true;
        lastfm.track.addTags(options, self.populate, browser.tagAddFailed);
    }

    this.showMe = function() {
        self.display = true;
        self.checkToUpdate();
    }

    this.error = function() {
        if (self.trackinfo.error) {
            return self.trackinfo.message;
        } else {
            return false;
        }
    }

    this.name = function() {
        try {
            return self.trackinfo.track.name || self.mpd_name;
        } catch(err) {
            return self.mpd_name;
        }
    }

    this.id = function() {
        return self.trackinfo.track.id || "";
    }

    this.listeners = function() {
        return  self.trackinfo.track.listeners || 0;
    }

    this.playcount = function() {
        return  self.trackinfo.track.playcount || 0;
    }

    this.duration = function() {
        if (self.trackinfo) {
            return self.trackinfo.track.duration || 0;
        } else {
            return 0;
        }
    }

    this.userplaycount = function() {
        return  self.trackinfo.track.userplaycount || 0;
    }

    this.url = function() {
        return  self.trackinfo.track.url || 0;
    }

    this.bio = function() {
        if(self.trackinfo.track.wiki) { 
            return self.trackinfo.track.wiki.content; 
        }
        else { return false; }
    }

    this.userloved = function() {
        var loved =  self.trackinfo.track.userloved || 0;
        return (loved == 1) ? true : false;
    }

    this.tags = function() {
        try {
            return getArray(self.trackinfo.track.toptags.tag);
        } catch(err) {
            return [];
        }
    }

    this.usertags = function() {
        try {
            return getArray(this.userTags.tags.tag);
        } catch(err) {
            return [];
        }
    }
}

function lfmalbum(album, artist, callback)  {
    var self = this;
    this.mpd_name = album;
    this.artistname = artist;
    this.albuminfo = null;
    this.userTags = null;
    this.callback = callback;
    this.redotags = false;
    this.display = false;

    this.gotAlbumInfo = function(data) {
        self.albuminfo = data;
        if (data.error) {
            self.albuminfo.album = {};        
        }
        self.checkToUpdate();
    }

    this.gotNoAlbumInfo = function(data) {
        self.gotAlbumInfo({error: 1, message: "Could not find information about this album"});
    }

    this.gotTagInfo = function(data) {
        self.userTags = data;
        self.checkToUpdate();
    }

    this.gotNoTagInfo = function(data) {
        self.gotTagInfo({tags: {}});
    }

    this.populate = function() {
        if (self.mpd_name == "") {
            self.gotNoTagInfo();
            self.gotNoAlbumInfo();
        } else {
            if (self.albuminfo == null) {
                lastfm.album.getInfo(
                    {  
                        album: encodeURIComponent(self.mpd_name), 
                        artist: encodeURIComponent(self.artistname)
                    }, 
                    self.gotAlbumInfo, 
                    self.gotNoAlbumInfo
                );
            }
            if (self.userTags == null) {
                lastfm.album.getTags(
                    {  
                        album: encodeURIComponent(self.mpd_name), 
                        artist: encodeURIComponent(self.artistname)
                    }, 
                    self.gotTagInfo, 
                    self.gotNoTagInfo
                );
            }
        }
    }

    this.checkToUpdate = function() {
        if (self.albuminfo != null) {
            if (self.callback != null) {
                self.callback(self);
                self.callback = null;
            }
            if (self.userTags != null) {
                if (self.display) {
                    browser.updateAlbumBrowser(self);
                    self.display = false;
                }
                if (self.redotags) {
                    browser.updateUserTags(self.usertags(), "album");
                    self.redotags = false;
                }
            }
        }
    }

    this.addTags = function(taglist) {
        self.userTags = null;
        var options = new Object;
        options.album = self.name();
        options.artist = self.artistname;
        options.tags = taglist;
        self.redotags = true;
        lastfm.album.addTags(options, self.populate, browser.tagAddFailed);
    }

    this.showMe = function() {
        self.display = true;
        self.checkToUpdate();
    }

    this.error = function() {
        if (self.albuminfo.error) {
            return self.albuminfo.message;
        } else {
            return false;
        }
    }

    this.name = function() {
        try {
            return self.albuminfo.album.name || self.mpd_name;
        } catch (err) {
            return self.mpd_name;
        }
    }

    this.artist = function() {
        return self.albuminfo.album.artist || "";
    }

    this.listeners = function() {
        return  self.albuminfo.album.listeners || 0;
    }

    this.playcount = function() {
        return  self.albuminfo.album.playcount || 0;
    }

    this.userplaycount = function() {
        return  self.albuminfo.album.userplaycount || 0;
    }

    this.releasedate = function() {
        return  self.albuminfo.album.releasedate || "Unknown";
    }

    this.url = function() {
        return  self.albuminfo.album.url || "";
    }

    this.tags = function() {
        try {
            return getArray(self.albuminfo.album.toptags.tag);
        } catch(err) {
            return [];
        }
    }

    this.usertags = function() {
        try {
            return getArray(this.userTags.tags.tag);
        } catch(err) {
            return [];
        }
    }

    this.tracklisting = function() {
        try {
            return getArray(self.albuminfo.album.tracks.track);
        } catch(err) {
            return [];
        }
    }

    this.bio = function() {
        if(self.albuminfo.album.wiki) { 
            return self.albuminfo.album.wiki.content; 
        }
        else { return false }
    }

    this.image = function(size) {
        // Get image of the specified size.
        // If no image of that size exists, return a different one - 
        // just so we've got one.
        try {
            var url = "";
            var temp_url = "";
            for(var i in self.albuminfo.album.image) {
                temp_url = self.albuminfo.album.image[i]['#text'];
                if (self.albuminfo.album.image[i].size == size) {
                    url = temp_url;
                    break;
                }
            }
            if (url == "") { url = temp_url; }
            return url;
        } catch(err) {
            return "";
        }
    }

}

function lfmartist(artist, callback)  {
    var self = this;
    this.mpd_name = artist;
    this.artistinfo = null;
    this.userTags = null;
    this.callback = callback;
    this.display = false;
    this.redotags = false;

    this.gotArtistInfo = function(data) {
        self.artistinfo = data;
        if (data.error) {
            self.artistinfo.artist = {};        
        }
        self.checkToUpdate();
    }

    this.gotNoArtistInfo = function(data) {
        self.gotArtistInfo({error: 1, message: "Could not find information about this artist"});
    }

    this.gotTagInfo = function(data) {
        self.userTags = data;
        self.checkToUpdate();
    }

    this.gotNoTagInfo = function(data) {
        self.gotTagInfo({tags: {}});
   }

    this.populate = function() {
        if (self.mpd_name == "") {
            self.gotNoTagInfo();
            self.gotNoArtistInfo();
        } else {
            if (self.artistinfo == null) {
                lastfm.artist.getInfo(
                    { 
                        artist: encodeURIComponent(self.mpd_name)
                    }, 
                    self.gotArtistInfo, 
                    self.gotNoArtistInfo
                );
            }
            if (self.userTags == null) {
                lastfm.artist.getTags(
                    { 
                        artist: encodeURIComponent(self.mpd_name)
                    }, 
                    self.gotTagInfo, 
                    self.gotNoTagInfo
                );
            }
        }
    }

    this.checkToUpdate = function() {
        if (self.artistinfo != null) {
            if (self.callback != null) {
                self.callback(self);
                self.callback = null;
            }
            if (self.userTags != null) {
                if (self.display) {
                    browser.updateArtistBrowser(self);
                    self.display = false;
                }
                if (self.redotags) {
                    browser.updateUserTags(self.usertags(), "artist");
                    self.redotags = false;
                }
            }
        }
    }

    this.addTags = function(taglist) {
        self.userTags = null;
        var options = new Object;
        options.artist = self.name();
        options.tags = taglist;
        self.redotags = true;
        lastfm.artist.addTags(options, self.populate, browser.tagAddFailed);
    }

    this.showMe = function() {
        self.display = true;
        self.checkToUpdate();
    }

    this.error = function() {
        if (self.artistinfo.error) {
            return self.artistinfo.message;
        } else {
            return false;
        }
    }

    this.name = function() {
        try {
            return self.artistinfo.artist.name || self.mpd_name;
        } catch(err) {
            return self.mpd_name;
        }
    }

    this.bio = function() {
        if(self.artistinfo.artist.bio) { 
            return self.artistinfo.artist.bio.content; 
        }
        else { 
            return false; 
        }
    }

    this.image = function(size) {
        // Get image of the specified size.
        // If no image of that size exists, return a different one - just so we've got one.
        try {
            var url = "";
            var temp_url = "";
            for(var i in self.artistinfo.artist.image) {
                temp_url = self.artistinfo.artist.image[i]['#text'];
                if (self.artistinfo.artist.image[i].size == size) {
                    url = temp_url;
                }
            }
            if (url == "") { url = temp_url; }
            return url;
        } catch(err) {
            return "";
        }
    }

    this.listeners = function() {
        try {
            return self.artistinfo.artist.stats.listeners || 0;
        } catch(err) {
            return 0;
        }
    }

    this.playcount = function() {
        try {
            return self.artistinfo.artist.stats.playcount || 0;
        } catch(err) {
            return 0;
        }
    }

    this.userplaycount = function() {
        try {
            return self.artistinfo.artist.stats.userplaycount || 0;
        } catch(err) {
            return 0;
        }
    }

    this.tags = function() {
        try {
            return getArray(self.artistinfo.artist.tags.tag);
        } catch(err) {
            return [];
        }
    }

    this.usertags = function() {
        try {
            return getArray(this.userTags.tags.tag);
        } catch(err) {
            return [];
        }
    }

    this.similar = function() {
        try {
            return getArray(self.artistinfo.artist.similar.artist);
        } catch(err) {
            return [];
        }
    }

    this.similarimage = function(index, size) {
        try {
            var url = "";
            var temp_url = "";
            for(var i in self.artistinfo.artist.similar.artist[index].image) {
                temp_url = self.artistinfo.artist.similar.artist[index].image[i]['#text'];
                if (self.artistinfo.artist.similar.artist[index].image[i].size == size) {
                    url = temp_url;
                    break;
                }
            }
            if (url == "") { 
                url = temp_url; 
            }
            return url;
        } catch(err) {
            return "";
        }

    }

    this.url = function() {
        return self.artistinfo.artist.url || "";
    }
}
