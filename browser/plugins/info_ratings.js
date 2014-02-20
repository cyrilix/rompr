var info_ratings = function() {

	var me = "ratings";

	return {
		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent) {

			debug.log("RATINGS PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

            function doThingsWithData() {
                if (parent.isCurrentTrack()) {
                    $("#ratingimage").attr("src","newimages/"+parent.playlistinfo.metadata.track.usermeta.Rating+"stars.png");
                    $("#dbtags").html('<span style="margin-right:8px"><b>'+language.gettext("musicbrainz_tags")+'&nbsp;</b><a href="#" class="clicktext" onclick="tagAdder.show(event)">+</a></span>');
                    for(var i = 0; i < parent.playlistinfo.metadata.track.usermeta.Tags.length; i++) {
                        $("#dbtags").append('<span class="tag">'+parent.playlistinfo.metadata.track.usermeta.Tags[i]+'<span class="tagremover invisible"><a href="#" class="clicktext" onclick="nowplaying.removeTag(event)">x</a></span></span>');
                    }
                    $(".tag").hover( function() {
                        $(this).children().show();
                    }, function() {
                        $(this).children().hide();
                    });
                }
                // Make sure the browser updates the file info display
                browser.reDo(parent.index, 'file');
            }

            function hideTheInputs() {
                if (parent.isCurrentTrack()) {
                    $("#ratingimage").attr("src","newimages/transparent-32x32.png");
                    $("#dbtags").html('');
                }
            }

            function getPostData() {
                var data = {};
                if (parent.playlistinfo.title) {
                    data.title = parent.playlistinfo.title;
                }
                if (parent.playlistinfo.creator) {
                    data.artist = parent.playlistinfo.creator;
                }
                if (parent.playlistinfo.tracknumber) {
                    data.trackno = parent.playlistinfo.tracknumber;
                }
                if (parent.playlistinfo.duration) {
                    data.duration = parent.playlistinfo.duration;
                }
                if (parent.playlistinfo.albumartist && parent.playlistinfo.album != "SoundCloud") {
                    data.albumartist = parent.playlistinfo.albumartist;
                } else {
                    if (parent.playlistinfo.creator) {
                        data.albumartist = parent.playlistinfo.creator;
                    }
                }
                if (parent.playlistinfo.spotify.album) {
                    data.spotilink = parent.playlistinfo.spotify.album;
                }
                if (parent.playlistinfo.type != "stream" && parent.playlistinfo.image) {
                    data.image = parent.playlistinfo.image;
                }
                if ((parent.playlistinfo.type == "local" || parent.playlistinfo.type == "lastfmradio" || parent.playlistinfo.type == "podcast") &&
                    parent.playlistinfo.album) {
                    data.album = parent.playlistinfo.album;
                }
                if (parent.playlistinfo.type == "local" || parent.playlistinfo.type == "podcast") {
                    data.uri = parent.playlistinfo.location;
                }
                if (parent.playlistinfo.date) {
                    data.date = parent.playlistinfo.date;
                }
                return data;
            }

			this.displayData = function() {
                debug.error("RATINGS PLUGIN", "Was asked to display data!");
			}

			this.stopDisplaying = function() {
			}

			this.populate = function() {
                if (prefs.apache_backend == "sql") {
                    if (parent.playlistinfo.metadata.track.usermeta === undefined) {
                        var data = getPostData();
                        data.action = 'get';
                        $.ajax({
                            url: "userRatings.php",
                            type: "POST",
                            data: data,
                            dataType: 'json',
                            success: function(data) {
                                debug.log("RATING PLUGIN","Got Data",data);
                                parent.playlistinfo.metadata.track.usermeta = data;
                                doThingsWithData();
                            },
                            error: function(data) {
                                debug.log("RATING PLUGIN","Failure");
                                parent.playlistinfo.metadata.track.usermeta = null;
                                hideTheInputs();

                            }
                        });
                    } else {
                        debug.mark("RATINGS PLUGIN",parent.index,"is already populated");
                        doThingsWithData();
                    }
                }
		    }

            this.setMeta = function(action, type, value) {
                if (prefs.apache_backend == "sql") {
                    var data = getPostData();
                    debug.log("RATINGS PLUGIN",parent.index,"Doing",action,type,value,data);
                    data.action = action;
                    data.attribute = type;
                    data.value = value;
                    if (data.uri) {
                        self.updateDatabase(data);
                    } else {
                        faveFinder.findThisOne(data, self, true, false);
                    }
                }
            }

            this.updateDatabase = function(data) {
                debug.log("RATINGS","Update Database Function Called");
                if (!data.uri) {
                    infobar.notify(infobar.NOTIFY,language.gettext("label_addtow"));
                }
                $.ajax({
                    url: "userRatings.php",
                    type: "POST",
                    data: data,
                    dataType: 'json',
                    success: function(rdata) {
                        debug.log("RATING PLUGIN","Success",rdata);
                        if (rdata) {
                            parent.playlistinfo.metadata.track.usermeta = rdata.metadata;
                            doThingsWithData();
                            updateCollectionDisplay(rdata);
                        }
                    },
                    error: function(rdata) {
                        debug.warn("RATING PLUGIN","Failure");
                        infobar.notify(infobar.ERROR,"Failed! Have you read the Wiki?");
                        doThingsWithData();
                    }
                });
            }

			self.populate();

		}
	}
}();

nowplaying.registerPlugin("ratings", info_ratings, null, null);

var faveFinder = function() {

    // faveFinder is used to find tracks which have just been tagged or rated but don't have a URI.
    // These would be tracks from a radio station
    // (including Last.FM radio because last.fm URIs are only useful once)

    var queue = new Array();
    var throttle = null;
    var withalbum = false;

    function searchForTrack() {
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
        debug.log("FAVEFINDER","Performing search",st);
        player.controller.rawsearch(st, faveFinder.handleResults);
    }

    return {

        queueLength: function() {
            return queue.length;
        },

        handleResults: function(data) {
            debug.debug("FAVEFINDER","Search Results were",data);
            var f = false;
            var req = queue[0];
            // First - prioritise local tracks
            // Well, in fact, de-prioritise spotify tracks
            var spot = null;
            for (var i in data) {
                var dom = data[i].uri;
                if (dom.match(/^spotify:/)) {
                    spot = i;
                    break;
                }
            }
            if (spot !== null) {
                data.push(data.splice(spot, 1)[0]);
                debug.debug("FAVEFINDER", "With spotify tracks last:",data);
            }
            var results = new Array();
            if (req.returnall) {
                // Using $.each here creates too many closures and leaks.
                for (var i in data) {
                    if (data[i].tracks) {
                        for (var k = 0; k < data[i].tracks.length; k++) {
                            //debug.log("FAVEFINDER","Found Track",data[i].tracks[k]);
                            f = true;
                            var r = cloneObject(req);
                            r.data.uri = data[i].tracks[k].uri;
                            r.data.album = data[i].tracks[k].album.name;
                            r.data.title = data[i].tracks[k].name;
                            r.data.artist = mopidyDoesWierdThings(data[i].tracks[k].artists);
                            r.data.albumartist = mopidyDoesWierdThings(data[i].tracks[k].album.artists);
                            if (data[i].tracks[k].track_no) {
                                r.data.trackno = data[i].tracks[k].track_no;
                            }
                            var u = ""+data[i].tracks[k].album.uri;
                            if (u.match(/^spotify:album:/)) {
                                r.data.spotilink = u;
                            }
                            // Prioritise results with a matching album, unless that's
                            // already been done
                            if (req.data.album &&
                                    r.data.album.toLowerCase() == req.data.album.toLowerCase() &&
                                    results[0] &&
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
                            debug.log("FAVEFINDER","Found Track",data[i].tracks[k]);
                            f = true;
                            req.data.uri = data[i].tracks[k].uri;
                            req.data.album = data[i].tracks[k].album.name;
                            req.data.title = data[i].tracks[k].name;
                            req.data.artist = mopidyDoesWierdThings(data[i].tracks[k].artists);
                            req.data.albumartist = mopidyDoesWierdThings(data[i].tracks[k].album.artists);
                            if (data[i].tracks[k].track_no) {
                                req.data.trackno = data[i].tracks[k].track_no;
                            }
                            var u = ""+data[i].tracks[k].album.uri;
                            if (u.match(/^spotify:album:/)) {
                                req.data.spotilink = u;
                            }
                            break;
                        }
                    }
                    if (f) break;
                }
            }
            if (f) {
                debug.log("FAVEFINDER","Track Found - Updating Database");
                if (req.returnall) {
                    req.host.updateDatabase(results);
                    results = null;
                } else {
                    req.host.updateDatabase(req.data);
                }
                throttle = setTimeout(faveFinder.next, 4000);
                queue.shift();
                // I know 4 seconds between requests is a long time
                // but we risk killing Mopidy if we go much faster than this
                // (as I found out). Also it's nicer to Spotify.
            } else {
                if (withalbum) {
                    debug.log("FAVEFINDER", "Trying without album name");
                    withalbum = false;
                    queue[0].image = null;
                    searchForTrack();
                } else {
                    debug.log("FAVEFINDER","Nothing found - Updating Database");
                    if (req.returnall) {
                        req.host.updateDatabase([req.data]);
                    } else {
                        req.host.updateDatabase(req.data);
                    }
                    throttle = setTimeout(faveFinder.next, 4000);
                    queue.shift();
                }
            }
        },

        findThisOne: function(data, host, withalbum, returnall) {
            debug.log("FAVEFINDER","New thing to look for",data);
            queue.push({data: data, host: host, withalbum: withalbum, returnall: returnall});
            if (throttle == null && queue.length == 1) {
                faveFinder.next();
            }
        },

        next: function() {
            var req = queue[0];
            clearTimeout(throttle);
            if (req) {
                withalbum = req.withalbum;
                searchForTrack();
            } else {
                throttle = null;
            }
        }

    }

}();

function updateCollectionDisplay(rdata) {
    // rdata contains an HTML fragment to insert into the collection
    // and a marker for where to insert it. Otherwise we would have
    // to rebuild the whole artist list every time and this would
    // (a) take a long time and
    // (b) cause any opened dropdowns to be mysteriously closed
    //      - which would just look shit.
    if (rdata && rdata.hasOwnProperty('type') && rdata.hasOwnProperty('where') && rdata.hasOwnProperty('html')) {
        var el = "#"+rdata.where;
        switch (rdata.type) {
            case 'insertAfter':
                debug.log("RATING PLUGIN", "insertAfter",el);
                if (el.match(/aartist/)) {
                    var d = $(el).parent();
                    $(rdata.html).insertAfter(d);
                } else {
                    $(rdata.html).insertAfter(el);
                }
                break;

            case 'insertInto':
                debug.log("RATING PLUGIN", "insertInto",el);
                if (!$(el).hasClass('notfilled')) {
                    $(el).html(rdata.html);
                }
                break;

            case 'insertAtStart':
                debug.log("RATING PLUGIN", "insertAtStart",el);
                $(rdata.html).prependTo(el);
                break;
        }
    }
    if (rdata && rdata.hasOwnProperty('stats')) {
        // stats is another html fragment which is the contents of the
        // statistics box at the top of the collection
        $("#fothergill").html(rdata.stats);
    }
}

function mopidyDoesWierdThings(artists) {
    var a = [];
    for (var i in artists) {
        var flub = ""+artists[i].name;
        if (flub.match(/ & /)) {
            a = [artists[i].name];
            break;
        } else {
            a.push(artists[i].name);
        }
    }
    return a.join(' & ');
}
