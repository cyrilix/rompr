var info_ratings = function() {

	var me = "ratings";

	return {
		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent, artistmeta, albummeta, trackmeta) {

			debug.log("RATINGS PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

            function doThingsWithData() {
                if (parent.isCurrentTrack() && trackmeta.usermeta !== null) {
                    if (trackmeta.usermeta.Playcount) {
                        $("#playcount").html("<b>PLAYS :</b>&nbsp;"+trackmeta.usermeta.Playcount);
                    } else {
                        $("#playcount").html("");
                    }
                    displayRating("#ratingimage", trackmeta.usermeta.Rating);
                    $("#dbtags").html('<span style="margin-right:8px"><b>'+language.gettext("musicbrainz_tags")+'&nbsp;</b><a href="#" class="clicktext" onclick="tagAdder.show(event)">+</a></span>');
                    for(var i = 0; i < trackmeta.usermeta.Tags.length; i++) {
                        $("#dbtags").append('<span class="tag">'+trackmeta.usermeta.Tags[i]+'<span class="tagremover invisible"><a href="#" class="clicktext" onclick="nowplaying.removeTag(event)">x</a></span></span>');
                    }
                    $(".tag").hover( function() {
                        $(this).children().show();
                    }, function() {
                        $(this).children().hide();
                    });
                }
                // Make sure the browser updates the file info display
                browser.reDo(parent.nowplayingindex, 'file');
            }

            function hideTheInputs() {
                if (parent.isCurrentTrack()) {
                    displayRating("#ratingimage", false);
                    $("#dbtags").html('');
                    $("#playcount").html('');
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
                if (parent.playlistinfo.disc) {
                    data.disc = parent.playlistinfo.disc;
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
                if (parent.playlistinfo.trackimage) {
                    data.trackimage = parent.playlistinfo.trackimage;
                }
                if ((parent.playlistinfo.type == "local" || parent.playlistinfo.type == "podcast") &&
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
                    if (trackmeta.usermeta === undefined) {
                        var data = getPostData();
                        data.action = 'get';
                        $.ajax({
                            url: "backends/sql/userRatings.php",
                            type: "POST",
                            data: data,
                            dataType: 'json',
                            success: function(data) {
                                debug.log("RATING PLUGIN","Got Data",data);
                                trackmeta.usermeta = data;
                                doThingsWithData();
                            },
                            error: function(data) {
                                debug.fail("RATING PLUGIN","Failure");
                                trackmeta.usermeta = null;
                                hideTheInputs();

                            }
                        });
                    } else {
                        debug.mark("RATINGS PLUGIN",parent.nowplayingindex,"is already populated");
                        doThingsWithData();
                    }
                }
		    }

            this.setMeta = function(action, type, value) {
                if (prefs.apache_backend == "sql") {
                    var data = getPostData();
                    debug.log("RATINGS PLUGIN",parent.nowplayingindex,"Doing",action,type,value,data);
                    data.action = action;
                    data.attributes = [{attribute: type, value: value}];
                    if (data.uri) {
                        self.updateDatabase(data);
                    } else {
                        faveFinder.findThisOne(data, self, true, false, []);
                    }
                }
            }

            this.updateDatabase = function(data) {
                debug.log("RATINGS","Update Database Function Called");
                if (!data.uri) {
                    infobar.notify(infobar.NOTIFY,language.gettext("label_addtow"));
                }
                $.ajax({
                    url: "backends/sql/userRatings.php",
                    type: "POST",
                    data: data,
                    dataType: 'json',
                    success: function(rdata) {
                        debug.log("RATING PLUGIN","Success");
                        if (rdata) {
                            trackmeta.usermeta = rdata.metadata;
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
		}
	}
}();

nowplaying.registerPlugin("ratings", info_ratings, null, null);

var faveFinder = function() {

    // faveFinder is used to find tracks which have just been tagged or rated but don't have a URI.
    // These would be tracks from a radio station

    var queue = new Array();
    var throttle = null;
    var withalbum = false;

    // Prioritize - local, beetslocal, beets, gmusic, spotify - in that order
    // Everything else can take its chance. This is only really relevant for
    // lastFmImporter. These are the default priorities, but they can be changed
    // from the lastfm importer gui.
    var priority = ["spotify", "gmusic", "beets", "beetslocal", "local"];

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
        debug.log("FAVEFINDER","Performing search",st,req.sources);
        player.controller.rawsearch(st, req.sources, faveFinder.handleResults);
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

    return {

        getPriorities: function() {
            return priority;
        },

        setPriorities: function(p) {
            priority = p;
            debug.log("FAVEFINDER","Priorities Set To (reverse order)",priority);
        },

        queueLength: function() {
            return queue.length;
        },

        handleResults: function(data) {
            var f = false;
            var req = queue[0];

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

            // debug.debug("FAVEFINDER","Sorted Search Results are",data);

            var results = new Array();
            if (req.returnall) {
                // Using $.each here creates too many closures and leaks.
                for (var i in data) {
                    if (data[i].tracks) {
                        for (var k = 0; k < data[i].tracks.length; k++) {
                            debug.debug("FAVEFINDER","Found Track",data[i].tracks[k]);
                            f = true;
                            var r = cloneObject(req);
                            r.data.uri = data[i].tracks[k].uri;
                            r.data.album = data[i].tracks[k].album.name;
                            r.data.title = data[i].tracks[k].name;
                            r.data.artist = joinartists(data[i].tracks[k].artists);
                            if (data[i].tracks[k].album.artists) {
                                r.data.albumartist = joinartists(data[i].tracks[k].album.artists);
                            } else {
                                r.data.albumartist = r.data.artist;
                            }
                            if (data[i].tracks[k].track_no) {
                                r.data.trackno = data[i].tracks[k].track_no;
                            }
                            if (data[i].tracks[k].disc_no) {
                                r.data.disc = data[i].tracks[k].disc_no;
                            }
                            var u = ""+data[i].tracks[k].album.uri;
                            if (u.match(/^spotify:album:/)) {
                                r.data.spotilink = u;
                            }
                            if (data[i].tracks[k].album.images) {
                                var u = ""+data[i].tracks[k].uri;
                                if (u.match(/^soundcloud:/)) {
                                    r.data.trackimage = getImageUrl(data[i].tracks[k].album.images);
                                    r.data.image = "newimages/soundcloud-logo.png";
                                } else if (u.match(/^youtube:/)) {
                                    r.data.trackimage = getImageUrl(data[i].tracks[k].album.images);
                                    r.data.image = "newimages/youtube-logo.png";
                                } else {
                                    r.data.image = getImageUrl(data[i].tracks[k].album.images);
                                }
                            }
                            // Prioritise results with a matching album, unless that's
                            // already been done
                            if (req.data.album && r.data.album &&
                                    r.data.album.toLowerCase() == req.data.album.toLowerCase() &&
                                    results[0] && results[0].album &&
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
                            req.data.artist = joinartists(data[i].tracks[k].artists);
                            if (data[i].tracks[k].album.artists) {
                                req.data.albumartist = joinartists(data[i].tracks[k].album.artists);
                            } else {
                                req.data.albumartist = req.data.artist;
                            }
                            if (data[i].tracks[k].track_no) {
                                req.data.trackno = data[i].tracks[k].track_no;
                            }
                            var u = ""+data[i].tracks[k].album.uri;
                            if (u.match(/^spotify:album:/)) {
                                req.data.spotilink = u;
                            }
                            if (data[i].tracks[k].album.images) {
                                var u = ""+data[i].tracks[k].uri;
                                if (u.match(/^soundcloud:/)) {
                                    req.data.trackimage = getImageUrl(data[i].tracks[k].album.images);
                                    req.data.image = "newimages/soundcloud-logo.png";
                                } else if (u.match(/^youtube:/)) {
                                    req.data.trackimage = getImageUrl(data[i].tracks[k].album.images);
                                    req.data.image = "newimages/youtube-logo.png";
                                } else {
                                   req.data.image = getImageUrl(data[i].tracks[k].album.images);
                                }
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

        findThisOne: function(data, host, withalbum, returnall, sources) {
            debug.log("FAVEFINDER","New thing to look for",data);
            queue.push({data: data, host: host, withalbum: withalbum, returnall: returnall, sources: sources});
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

function findPosition(key) {
    // The key is the id of a dropdown div.  But that div won't exist if the dropdown hasn't been
    // opened. So we see if it does, and if it doesn't then we use the name attribute of the
    // toggle arrow button to locate the position.
    if ($("#"+key).length > 0) { 
        return $("#"+key);
    } else {
        return $('i[name="'+key+'"]').parent()
    }
}
 
function updateCollectionDisplay(rdata) {
    // rdata contains an HTML fragment to insert into the collection
    // and a marker for where to insert it. Otherwise we would have
    // to rebuild the whole artist list every time and this would
    // (a) take a long time and
    // (b) cause any opened dropdowns to be mysteriously closed
    //      - which would just look shit.
    debug.log("RATING PLUGIN","Update Display",rdata);
    if (rdata && rdata.hasOwnProperty('inserts')) {
        for (var i in rdata.inserts) {
            switch (rdata.inserts[i].type) {
                case 'insertAfter':
                    // insertAfter is something to insert into a list - either the main list of
                    // artists or an artist's album dropdown.
                    debug.log("RATING PLUGIN", "insertAfter",rdata.inserts[i].where);
                    $(rdata.inserts[i].html).insertAfter(findPosition(rdata.inserts[i].where));
                    break;

                case 'insertInto':
                    // insertInto is html to replace the contents of a div.
                    // This will be a track listing for an album and we always return all tracks.
                    debug.log("RATING PLUGIN", "insertInto",rdata.inserts[i].where);
                    $("#"+rdata.inserts[i].where).html(rdata.inserts[i].html);
                    break;

                case 'insertAtStart':
                    // insertAtStart tells us to insert the html at the beginning of the specified dropdown.
                    // In this case if the dropdown doesn't exist we must do nothing
                    debug.log("RATING PLUGIN", "insertAtStart",rdata.inserts[i].where);
                    $(rdata.inserts[i].html).prependTo($('#'+rdata.inserts[i].where));
                    break;
            }
            $(rdata.inserts[i].html).find('img[src="newimages/compact_disc.svg"]').each(function() {
                debug.log("Getting Image for new album");
                coverscraper.GetNewAlbumArt($(this).attr('name'));
            });
        }
    }
    if (rdata && rdata.hasOwnProperty('deletedtracks')) {
        debug.debug("DELETED TRACKS",rdata.deletedtracks);
        for (var i in rdata.deletedtracks) {
            debug.log("REMOVING",rdata.deletedtracks[i]);
            $('div[name="'+rdata.deletedtracks[i]+'"]').remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('deletedalbums')) {
        debug.debug("DELETED ALBUMS",rdata.deletedalbums);
        for (var i in rdata.deletedalbums) {
            debug.log("REMOVING",rdata.deletedalbums[i]);
            $("#"+rdata.deletedalbums[i]).remove();
            findPosition(rdata.deletedalbums[i]).remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('deletedartists')) {
        debug.debug("DELETED ARTISTS",rdata.deletedartists);
        for (var i in rdata.deletedartists) {
            $("#"+rdata.deletedartists[i]).remove();
            findPosition(rdata.deletedartists[i]).remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('stats')) {
        // stats is another html fragment which is the contents of the
        // statistics box at the top of the collection
        $("#fothergill").html(rdata.stats);
    }
}
