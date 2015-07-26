function faveFinder(returnall) {

    // faveFinder is used to find tracks which have just been tagged or rated but don't have a URI.
    // These would be tracks from a radio station. It's also used by lastFMImporter.
    var self = this;
    var queue = new Array();
    var throttle = null;
    var withalbum = false;
    var priority = [];

    // Prioritize - local, beetslocal, beets, gmusic, spotify - in that order
    // Everything else can take its chance. This is only really relevant for
    // lastFmImporter. These are the default priorities, but they can be changed
    // from the lastfm importer gui.
    // There's currently no way to change these for tracks that are rated from radio stations
    // which means that these are the only domains that will be searched.
    if (prefs.player_backend == 'mopidy') {
        priority = ["spotify", "gmusic", "beets", "beetslocal", "local"];
    }

    function getImageUrl(list) {
        var im = null;
        for (var i in list) {
            if (list[i] != "") {
                im = list[i];
                break;
            }
        }
        if (im && im.substr(0,4) == "http") {
            im = "getRemoteImage.php?url="+im;
        }
        return im;
    }

    function compare_tracks(lookingfor, found, titleonly) {
        if (lookingfor.title.removePunctuation().toLowerCase() !=
                found.title.removePunctuation().toLowerCase()) {
            return false;
        }
        if (titleonly) return true;

        var artists = new Array();
        artists = artists.concat(found.albumartist.split(/&/));
        artists = artists.concat(found.artist.split(/&/));
        var sa = lookingfor.artist.removePunctuation().toLowerCase();
        for (var i in artists) {
            if (artists[i].removePunctuation().toLowerCase() == sa) {
                return true;
            }
        }
        return false;
    }

    this.getPriorities = function() {
        return priority.reverse();
    }

    this.setPriorities = function(p) {
        priority = p;
        debug.log("FAVEFINDER","Priorities Set To (reverse order)",priority);
    }

    this.queueLength = function() {
        return queue.length;
    }

    this.handleResults = function(data) {

        var f = false;
        var req = queue[0];

        debug.trace("FAVEFINDER","Raw Results for",req,data);

        $.each(priority,
            function(j,v) {
                var spot = null;
                for (var i in data) {
                    var match = new RegExp('^'+v+':');
                    if (match.test(data[i].uri)) {
                        spot = i;
                        break;
                    }
                }
                if (spot !== null) {
                    data.unshift(data.splice(spot, 1)[0]);
                }
            }
        );

        debug.mark("FAVEFINDER","Sorted Search Results are",data);

        var results = new Array();
        if (returnall) {
            // Using $.each here creates too many closures and leaks.
            for (var i in data) {
                if (data[i].tracks) {
                    for (var k = 0; k < data[i].tracks.length; k++) {
                        debug.trace("FAVEFINDER","Found Track",data[i].tracks[k]);
                        f = true;
                        var r = cloneObject(req);
                        // r.data = data[i].tracks[k];
                        for (var g in data[i].tracks[k]) {
                            r.data[g] = data[i].tracks[k][g];
                        }
                        // Prioritise results with a matching album, unless that's
                        // already been done
                        if (req.data.album &&
                            r.data.album &&
                            r.data.album.toLowerCase() == req.data.album.toLowerCase() &&
                            results[0] &&
                            results[0].album &&
                            results[0].album.toLowerCase() != req.data.album.toLowerCase()) {
                            
                            results.unshift(r.data);
                        } else {
                            results.push(r.data);
                        }
                    }
                }
            }
        } else {
            for (var i in data) {
                if (data[i].tracks) {
                    for (var k = 0; k < data[i].tracks.length; k++) {
                        if (compare_tracks(req.data, data[i].tracks[k], true)) {
                            debug.log("FAVEFINDER","Found Track",data[i].tracks[k]);
                            f = true;
                            for (var g in data[i].tracks[k]) {
                                req.data[g] = data[i].tracks[k][g];
                            }
                            break;
                        }
                    }
                }
                if (f) break;
            }
        }
        if (f) {
            debug.log("FAVEFINDER","Track Found - Updating Database");
            if (returnall) {
                req.callback(results);
                results = null;
            } else {
                req.callback(req.data);
            }
            throttle = setTimeout(self.next, 4000);
            queue.shift();
            // I know 4 seconds between requests is a long time
            // but we risk killing Mopidy if we go much faster than this
            // (as I found out). Also it's nicer to Spotify.
        } else {
            if (withalbum) {
                debug.log("FAVEFINDER", "Trying without album name");
                withalbum = false;
                queue[0].image = null;
                self.searchForTrack();
            } else {
                debug.log("FAVEFINDER","Nothing found");
                if (returnall) {
                    req.callback([req.data]);
                } else {
                    req.callback(req.data);
                }
                throttle = setTimeout(self.next, 4000);
                queue.shift();
            }
        }
    }

    this.findThisOne = function(data, callback, withalbum) {
        debug.log("FAVEFINDER","New thing to look for",data);
        queue.push({data: data, callback: callback, withalbum: withalbum});
        if (throttle == null && queue.length == 1) {
            self.next();
        }
    }

    this.next = function() {
        var req = queue[0];
        clearTimeout(throttle);
        if (req) {
            withalbum = req.withalbum;
            self.searchForTrack();
        } else {
            throttle = null;
        }
    }

    this.searchForTrack = function() {
        var req = queue[0];
        var st = {};
        if (req.data.title) {
            st.track_name = [req.data.title];
        }
        if (req.data.artist) {
            st.artist = [req.data.artist];
        }
        if (withalbum) {
            if (req.data.album) {
                st.album = [req.data.album];
            } else {
                withalbum = false;
            }
        }
        debug.log("FAVEFINDER","Performing search",st,priority);
        player.controller.rawsearch(st, priority, true, self.handleResults);
    }

}


