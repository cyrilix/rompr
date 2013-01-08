function trackDataCollection(ind, mpdinfo, art, alb, tra) {
    
    var self = this;
    var mpd_data = mpdinfo;  /* From playlist - the basic mpd tags read from status and playlistinfo */
    var artist_data = art;
    var album_data = alb;
    var track_data = tra;
    var index = ind;
    var scrobbled = false;
    var nowplaying_updated = false;
    var starttime = (Date.now())/1000 - parseFloat(mpd.getStatus('elapsed'));
    
    /* Populating the data is daisy-chained, artist, album, track */
    this.artist = function() {
        return {
            populate: function() {
                if (artist_data == null) {
                    var options = {};
                    var options = { artist: mpd_data.creator };
                    debug.log("Getting last.fm data for artist",mpd_data.creator,options);
                    lastfm.artist.getInfo( options, 
                                        this.lfmResponseHandler, 
                                        this.lfmResponseHandler );
                } else {
                    self.album.populate();
                }
            },
            
            lfmResponseHandler: function(data) {
                debug.log("Got Artist Info for", mpd_data.creator, data);
                if (data.error) {
                    artist_data = {artist: data};
                } else {
                    artist_data = data;
                }
                self.album.populate();
            },
            
            name: function() {
                try {
                    return artist_data.artist.name || mpd_data.creator;
                } catch(err) {
                    return mpd_data.creator;
                }
            },
            
            lfmdata: function() {
                try {
                    return artist_data.artist;
                } catch(err) {
                    return {};
                }
            },
            
            getusertags: function() {
                if (artist_data.artist.usertags) {
                    debug.log("Sending stored usertag data for artist",this.name());
                    this.sendusertags(artist_data.artist.usertags);
                } else {
                    var options = { artist: this.name() };
                    if (this.mbid() != "") {
                        options.mbid = this.mbid();
                    }
                    debug.log("Getting usertag data for artist",this.name());
                    lastfm.artist.getTags(
                        options, 
                        this.sendusertags, 
                        this.sendusertags
                    );
                }
            },
            
            sendusertags: function(data) {
                debug.log("Artist got tag info", data);
                artist_data.artist.usertags = data;
                var tags = [];
                try {
                    tags = getArray(artist_data.artist.usertags.tags.tag);
                } catch(err) {
                    tags = [];
                }
                browser.userTagsIncoming(tags, 'artist', index);
            },
            
            addtags: function(tags) {
                debug.log("Artist adding tags", tags);
                lastfm.artist.addTags( {    artist: this.name(),
                                            tags: tags},
                                        self.justaddedtags, 
                                        browser.tagAddFailed
                );
            },
            
            removetags: function(tags) {
                debug.log("Artist removing tags", tags);
                lastfm.artist.removeTag( {  artist: this.name(),
                                            tag: tags},
                                        self.justaddedtags,
                                        browser.tagRemoveFailed
                );
            },
            
            resettags: function() {
                artist_data.artist.usertags = null;
            },

            mbid: function() {
                if (mpd_data.musicbrainz_artistid) {
                    debug.log("Using mbartistid from tags");
                    return mpd_data.musicbrainz_artistid;
                } else {
                    try {
                        debug.log("Using mbartistid from last.fm");
                        return artist_data.artist.mbid;
                    } catch(err) {
                        debug.log("No, there isn't one");
                        return "";
                    }
                }
            }
        }
    }();
    
    this.album = function() {
        return {
            populate: function() {
                if (mpd_data.type == "stream") {
                    album_data = {album: {error: 1, message: "(Internet Radio Station)"}};
                    self.track.populate();
                } else {
                    if (album_data == null) {
                        var searchartist = (mpd_data.albumartist && mpd_data.albumartist != "") ? mpd_data.albumartist : self.artist.name();
                        var options = { artist: searchartist, album: mpd_data.album };
                        debug.log("Getting last.fm data for album",mpd_data.album,"by",searchartist,options);
                        lastfm.album.getInfo( options,
                                                this.lfmResponseHandler, 
                                                this.lfmResponseHandler );
                    } else {
                        self.track.populate();
                    }
                }
            },

            lfmResponseHandler: function(data) {
                debug.log("Got Album Info for",mpd_data.album, data);
                if (data.error) {
                    album_data = {album: data};
                } else {
                    album_data = data;
                }
                debug.log("Calling track populator");
                self.track.populate();
            },
            
            name: function() {
                try {
                    return album_data.album.name || mpd_data.album;
                } catch(err) {
                    return mpd_data.album;
                }
            },
            
            image: function(size) {
                // Get image of the specified size.
                // If no image of that size exists, return a different one - 
                // just so we've got one.
                /* This function is duplicated in lastmDataExtractor for reasons of
                * expediency and laziness, with the latter much in the ascendancy
                */
                try {
                    var url = "";
                    var temp_url = "";
                    for(var i in album_data.album.image) {
                        temp_url = album_data.album.image[i]['#text'];
                        if (album_data.album.image[i].size == size) {
                            url = temp_url;
                            break;
                        }
                    }
                    if (url == "") { url = temp_url; }
                    return url;
                } catch(err) {
                    return "";
                }
            },
            
            lfmdata: function() {
                try {
                    return album_data.album;;
                } catch(err) {
                    return {};
                }
            },

            mbid: function() {
                if (mpd_data.musicbrainz_albumid) {
                    debug.log("Using mbalbumid from tags");
                    return mpd_data.musicbrainz_albumid;
                } else {
                    try {
                        debug.log("Using mbalbumid from last.fm");
                        return album_data.album.mbid;
                    } catch(err) {
                        debug.log("No, there isn't one");
                        return "";
                    }
                }
            },

            getusertags: function() {
                if (album_data.album.usertags) {
                    debug.log("Sending stored usertag data for album",this.name());
                    this.sendusertags(album_data.album.usertags);
                } else {
                    debug.log("Getting usertag data for album",this.name());
                    var searchartist = (mpd_data.albumartist && mpd_data.albumartist != "") ? mpd_data.albumartist : self.artist.name();
                    var options = { artist: searchartist, album: this.name() };
                    if (this.mbid() != "") {
                        options.mbid = this.mbid();
                    }
                    lastfm.album.getTags(
                        options, 
                        this.sendusertags, 
                        this.sendusertags
                    );
                }
            },
            
            sendusertags: function(data) {
                debug.log("Album got tag info", data);
                album_data.album.usertags = data;
                var tags = [];
                try {
                    tags = getArray(album_data.album.usertags.tags.tag);
                } catch(err) {
                    tags = [];
                }
                browser.userTagsIncoming(tags, 'album', index);
            },
            
            addtags: function(tags) {
                var searchartist = (mpd_data.albumartist && mpd_data.albumartist != "") ? mpd_data.albumartist : self.artist.name();
                debug.log("Album adding tags", searchartist, this.name(), tags);
                lastfm.album.addTags( {    artist: searchartist,
                                            album: this.name(),
                                            tags: tags},
                                        self.justaddedtags, 
                                        browser.tagAddFailed
                );
            },
            
            removetags: function(tags) {
                debug.log("Album removing tags", tags);
                var searchartist = (mpd_data.albumartist && mpd_data.albumartist != "") ? mpd_data.albumartist : self.artist.name();
                lastfm.album.removeTag( {  album: this.name(),
                                            artist: searchartist,
                                            tag: tags},
                                        self.justaddedtags,
                                        browser.tagRemoveFailed
                );
            },
            
            resettags: function() {
                album_data.album.usertags = null;
            },
            
            albumartist: function() {
                return (mpd_data.albumartist && mpd_data.albumartist != "") ? mpd_data.albumartist : self.artist.name();
            }
        }
    }();

    this.track = function() {
        return {
            populate: function() {
                if (track_data == null) {
                    var options = { artist: self.artist.name(), track: mpd_data.title };
//                     if (this.mbid() != "") {
//                         options.mbid = this.mbid();
//                     }
                    debug.log("Getting last.fm data for track",mpd_data.title,"by",self.artist.name(),options);
                    lastfm.track.getInfo( options,
                                            this.lfmResponseHandler, 
                                            this.lfmResponseHandler );
                } else {
                    self.finished();
                }
            },

            lfmResponseHandler: function(data) {
                debug.log("Got Track Info for",mpd_data.title, data);
                if (data.error) {
                    track_data = {track: data};
                } else {
                    track_data = data;
                }
                self.finished();
            },
            
            name: function() {
                try {
                    return track_data.track.name || mpd_data.title;
                } catch(err) {
                    return mpd_data.title;
                }
            },
            
            scrobble: function() {
                if (!scrobbled) {
                    if (self.track.name() != "" && self.artist.name() != "") {
                        var options = { 
                                        timestamp: parseInt(starttime.toString()),
                                        track: self.track.name(),
                                        artist: self.artist.name(),
                                        album: self.album.name()
                        };
                        options.chosenByUser = (mpd_data.type == 'local') ? 1 : 0;
                        // One of these is probably making it fail
//                         if (this.mbid()) {
//                             options.mbid = this.mbid();
//                         }
                         if (mpd_data.albumartist && mpd_data.albumartist != "" && (mpd_data.albumartist).toLowerCase() != (self.artist.name()).toLowerCase()) {
                             options.albumArtist = mpd_data.albumartist;
                         }
//                         if (mpd_data.duration && mpd_data.duration > 0) {
//                             options.duration = (Math.floor(mpd_data.duration)).toString();
//                         }
                        debug.log("Scrobbling", options);
                        lastfm.track.scrobble( options );
                        scrobbled = true;
                    }
                }
            },
            
            updatenowplaying: function() {
                if (!nowplaying_updated) {
                    if (self.track.name() != "" && self.artist.name() != "") {
                        lastfm.track.updateNowPlaying( { 
                            track: self.track.name(), 
                            album: self.album.name(),
                            artist: self.artist.name()
                        });
                        nowplaying_updated = true;
                    }
                }
            },
            
            duration: function() {
                if (mpd_data.duration == 0 && mpd_data.type != "stream") {
                    /* use duration from last.fm track info if none available from mpd */
                    try {
                        return track_data.track.duration || 0;
                    } catch(err) {
                        return 0;
                    }
                }
                return mpd_data.duration || 0;
            },
            
            love: function(callback) {
                lastfm.track.love({ track: self.track.name(), artist: self.artist.name() }, self.donelove, callback);
            },

            unlove: function(callback) {
                lastfm.track.unlove({ track: self.track.name(), artist: self.artist.name() }, self.donelove, callback);
            },
            
            ban: function() {
            lastfm.track.ban({ track: self.track.name(), artist: self.artist.name() });
            },
            
            lfmdata: function() {
                try {
                    return track_data.track;
                } catch(err) {
                    return {};
                }
            },

            getusertags: function() {
                if (track_data.track.usertags) {
                    debug.log("Sending stored usertag data for track",this.name());
                    this.sendusertags(track_data.track.usertags);
                } else {
                    debug.log("Getting usertag data for track",this.name());
                    var options = { artist: self.artist.name(), track: this.name() };
                    if (this.mbid() != "") {
                        options.mbid = this.mbid();
                    }
                    lastfm.track.getTags(
                        options, 
                        this.sendusertags, 
                        this.sendusertags
                    );
                }
            },
            
            sendusertags: function(data) {
                debug.log("Track got tag info", data);
                track_data.track.usertags = data;
                var tags = [];
                try {
                    tags = getArray(track_data.track.usertags.tags.tag);
                } catch(err) {
                    tags = [];
                }
                browser.userTagsIncoming(tags, 'track', index);
            },
            
            addtags: function(tags) {
                debug.log("Track adding tags", this.name(), tags);
                lastfm.track.addTags( {     artist: self.artist.name(),
                                            track: this.name(),
                                            tags: tags},
                                        self.justaddedtags, 
                                        browser.tagAddFailed
                );
            },
            
            removetags: function(tags) {
                debug.log("Track removing tags", tags);
                lastfm.track.removeTag( {   track: this.name(),
                                            artist: self.artist.name(),
                                            tag: tags},
                                        self.justaddedtags,
                                        browser.tagRemoveFailed
                );
            },
            
            resettags: function() {
                track_data.track.usertags = null;
            },
                    
            mbid: function() {
                if (mpd_data.musicbrainz_trackid) {
                    debug.log("Using mbtrackid from tags");
                    return mpd_data.musicbrainz_trackid;
                } else {
                    try {
                        debug.log("Using mdtrackid from last.fm");
                        return track_data.track.mbid;
                    } catch(err) {
                        debug.log("No, there isn't one");
                        return "";
                    }
                }
            }
        }
    }();
    
    this.populate = function() {
        self.artist.populate();
    }
    
    this.finished = function() {
        debug.log("Got all data for",mpd_data.title);
        nowplaying.gotdata(index);
    }
    
    this.mpd = function(key) {
        return mpd_data[key];
    }
    
    this.progress = function() {
         return (mpd.getStatus('state') == "stop") ? 0 : (Date.now())/1000 - starttime;
    }
    
    this.setstarttime = function(elapsed) {
        starttime = (Date.now())/1000 - parseFloat(elapsed);
    }
    
    this.justaddedtags = function(type, tags) {
        debug.log("Just added or removed tags",tags,"to",type);
        self[type].resettags();
        self[type].getusertags();
    }
    
    this.donelove = function(tr, ar, loved, callback) {
        if (callback) {
            callback();
        }
        browser.justloved(index, loved);
        if (loved) {
            infobar.notify(infobar.NOTIFY, "Loved "+tr);
            // Rather than re-get all the details, we can just edit the track data directly.
            track_data.track.userloved = 1;
            if (autotagname != '') {
                self.track.addtags(autotagname);
            }
        } else {
            infobar.notify(infobar.NOTIFY, "UnLoved "+tr);
            track_data.track.userloved = 0;
            if (autotagname != '') {
                self.track.removetags(autotagname);
            }
        }
    }

}

function playInfo() {
 
    var self = this;
    var currenttrack = 0;
    var history = [];
    
    /* Initialise ourself with a dummy track - prevents early callbacks during loading from
     * producing errors - otherwise we'd have to check if (currenttrack == 0) all over the place
     */
    
    history[0] = new trackDataCollection(0, emptytrack, null, null, null);
    
    this.newTrack = function(mpdinfo) {
        
        /* Update the now playing info. This can be modified later when the last.fm data comes back */
        var npinfo = {  artist: mpdinfo.creator,
                        album: mpdinfo.album,
                        track: mpdinfo.title
        };
        if (mpdinfo.image && mpdinfo.image != "") {
            npinfo.image = mpdinfo.image;
        } else {
            npinfo.image = "images/album-unknown.png";
        }
        if (mpdinfo.origimage && mpdinfo.origimage != "") {
            npinfo.origimage = mpdinfo.origimage;
        }
        infobar.setNowPlayingInfo(npinfo);

        if (mpdinfo.creator == "" && mpdinfo.title == "" && mpdinfo.album == "") {
            return 0;
        }
        
        browser.trackHasChanged(npinfo);

        /* Need to check what's different between this one and the previous one so we can copy the data
         * - prevents us from repeatedly querying last.fm for the same data */
        
        var newartistdata = null;
        var newalbumdata = null;
        var newtrackdata = null;
        
        for (var i in history) {
            if (mpdinfo.creator == history[i].mpd('creator') && newartistdata == null) {
                debug.log("Copying Artist data");
                newartistdata = {artist: history[i].artist.lfmdata()};
            }
            if (mpdinfo.album == history[i].mpd('album') && newalbumdata == null) {
                debug.log("Copying Album data");
                newalbumdata = {album: history[i].album.lfmdata()};
            }
            if (mpdinfo.title == history[i].mpd('title') && newtrackdata == null) {
                debug.log("Copying Track data");
                newtrackdata = {track: history[i].track.lfmdata()};
            }
        }
        
        if (history.length > max_history_length) {
            var t = history.shift();
            currenttrack--;
            browser.thePubsCloseTooEarly();
        }
        
        currenttrack++;
        var t = new trackDataCollection(currenttrack, mpdinfo, newartistdata, newalbumdata, newtrackdata);
        history[currenttrack] = t;
        t.populate();
        debug.log("Started the large badger for track",currenttrack);
    }
    
    this.gotdata = function(index) {
        /* We got a response from a data collector */
        debug.log("Got response for badger",index);
        if (index == currenttrack) {
            /* Only use it here if this is info about the current track
             * This is asynchronous and it's possible that the user could be clicking
             * very quickly through tracks. We can't control the order the responses come back in */
            debug.log("...and it's data we need");
            /* Update now playing info with what we've got back - we might have autocorrections or album art */
            var npinfo = {  artist: history[index].artist.name(),
                            album: history[index].album.name(),
                            track: history[index].track.name()
            };
            if (!history[index].mpd('image') || history[index].mpd('image') == "") {
                debug.log("NO album image supplied");
                var img = history[index].album.image('medium');
                if (img != "") {
                    debug.log("Using Album Cover from Last.FM");
                    npinfo.image = img;
                }
            }
            infobar.setNowPlayingInfo(npinfo);
            browser.newTrack(index);
        }
    }
        
    /* All these functions are for retrieving data from the trackDataCollection objects.
     * Don't access those objects directly.
     * Functions that take an index can accept -1 to mean 'current track'
     * Functions that don't accept an index are those that make no sense in any other context
     */
    
    this.scrobble = function() {
        history[currenttrack].track.scrobble();
    }
    
    this.updateNowPlaying = function() {
        history[currenttrack].track.updatenowplaying();
    }

    this.progress = function(index) {
        return history[currenttrack].progress();
    }

    this.setStartTime = function(time) {
        history[currenttrack].setstarttime(time);
    }

    this.ban = function() {
        history[currenttrack].track.ban();
        return false;
    }

    this.mpd = function(index, key) {
        if (index == -1) { index = currenttrack };
        return history[index].mpd(key);
    }
    
    this.duration = function(index) {
        if (index == -1) { index = currenttrack };
        return history[index].track.duration();
    }
    
    this.love = function(index, callback) {
        /* optional callback to be used IN ADITION TO the standard one which calls into the browser */
        callback = typeof callback !== 'undefined' ? callback : null;
        if (index == -1) { index = currenttrack };
        history[index].track.love(callback);
    }

    this.unlove = function(index, callback) {
        /* optional callback to be used IN ADITION TO the standard one which calls into the browser */
        callback = typeof callback !== 'undefined' ? callback : null;
        if (index == -1) { index = currenttrack };
        history[index].track.unlove(callback);
    }
    
    this.getnames = function(index) {
        return {    artist: history[index].artist.name(),
                    album: history[index].album.name(),
                    track: history[index].track.name()
        }
    }
    
    this.getmpdnames = function(index) {
        return {    artist: history[index].mpd('creator'),
                    album: history[index].mpd('album'),
                    track: history[index].mpd('title') 
        };
    }
    
    this.getcurrentindex = function() {
        return currenttrack;
    }
    
    this.getusertags = function(index, key) {
        history[index][key].getusertags();
    }
    
    this.addtags = function(index, type, tags) {
        history[index][type].addtags(tags);
    }

    this.removetags = function(index, type, tags) {
        history[index][type].removetags(tags);
    }
    
    this.albumartist = function(index) {
        if (index = -1) { index = currenttrack }
        return history[index].album.albumartist();
    }

    /* These three functions return the actual last.fm data from the three objects.
     * The info browser uses these so it can do clever stuff.
     * The returned data can be used with lfmDataExtractor, which provides
     * generic methods for accessing the data
     * DO NOT ACCESS THE DATA DIRECTLY. THIS IS DANGEROUS AND COULD DESTROY THE INTERNET
     */
    
    this.getArtistData = function(index) {
        return history[index].artist.lfmdata();
    }

    this.getAlbumData = function(index) {
        return history[index].album.lfmdata();
    }

    this.getTrackData = function(index) {
        return history[index].track.lfmdata();
    }

}

function lfmDataExtractor(data) {
    
    this.error = function() {
        if (data.error) {
            return data.message;
        } else {
            return false;
        }
    }

    this.id = function() {
        return data.id || "";
    }

    this.artist = function() {
        return data.artist || "";
    }

    
    this.listeners = function() {
        try {
            return data.stats.listeners || 0;
        } catch(err) {
            return  data.listeners || 0;
        }
    }

    this.playcount = function() {
        try {
            return data.stats.playcount || 0;
        } catch(err) {
            return  data.playcount || 0;
        }
    }

    this.duration = function() {
        try {
            return data.duration || 0;
        } catch(err) {
            return 0;
        }
    }

    this.releasedate = function() {
        return  data.releasedate || "Unknown";
    }
    
    this.mbid = function() {
        return data.mbid || false;
    }
    
    this.userplaycount = function() {
        try {
            return data.stats.userplaycount || 0;
        } catch(err) {
            return  data.userplaycount || 0;
        }
    }

    this.url = function() {
        return  data.url || "";
    }

    this.bio = function() {
        if(data.wiki) { 
            return data.wiki.content; 
        }
        else if (data.bio) {
            return data.bio.content;
        } else {
            return false;
        }
    }

    this.userloved = function() {
        var loved =  data.userloved || 0;
        return (loved == 1) ? true : false;
    }

    this.tags = function() {
        if (data.tags) {
            try {
                return getArray(data.tags.tag);
            } catch(err) {
                return [];
            }
        } else {
            try {
                return getArray(data.toptags.tag);
            } catch(err) {
                return [];
            }
        }
    }

    this.tracklisting = function() {
        try {
            return getArray(data.tracks.track);
        } catch(err) {
            return [];
        }
    }

    this.image = function(size) {
        // Get image of the specified size.
        // If no image of that size exists, return a different one - just so we've got one.
        try {
            var url = "";
            var temp_url = "";
            for(var i in data.image) {
                temp_url = data.image[i]['#text'];
                if (data.image[i].size == size) {
                    url = temp_url;
                }
            }
            if (url == "") { url = temp_url; }
            return url;
        } catch(err) {
            return "";
        }
    }
 
    this.similar = function() {
        try {
            return getArray(data.similar.artist);
        } catch(err) {
            return [];
        }
    }

    this.similarimage = function(index, size) {
        try {
            var url = "";
            var temp_url = "";
            for(var i in data.similar.artist[index].image) {
                temp_url = data.similar.artist[index].image[i]['#text'];
                if (data.similar.artist[index].image[i].size == size) {
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
 
}