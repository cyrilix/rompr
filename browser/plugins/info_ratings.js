var info_ratings = function() {

	var me = "ratings";
    var displayCollectionChanges = false;

	return {
		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent, artistmeta, albummeta, trackmeta) {

			debug.log("RATINGS PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

            function doThingsWithData() {
                if (parent.isCurrentTrack() && trackmeta.usermeta) {
                    if (trackmeta.usermeta.Playcount) {
                        $("#playcount").html("<b>PLAYS :</b>&nbsp;"+trackmeta.usermeta.Playcount);
                        if (typeof charts != 'undefined') {
                            charts.reloadAll();
                        }
                    } else {
                        $("#playcount").html("");
                    }
                    displayRating("#ratingimage", trackmeta.usermeta.Rating);
                    $("#dbtags").html('<span><b>'+language.gettext("musicbrainz_tags")+
                        '</b></span><i class="icon-plus clickicon playlisticon" '+
                        'onclick="tagAdder.show(event)" style="margin-left:2px;margin-top:0px;'+
                        'margin-right:0px"></i>');
                    for(var i = 0; i < trackmeta.usermeta.Tags.length; i++) {
                        $("#dbtags").append('<span class="tag">'+trackmeta.usermeta.Tags[i]+
                            '<i class="icon-cancel-circled clickicon tagremover playlisticon" '+
                            'onclick="nowplaying.removeTag(event)" style="display:none"></i></span>');
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
                } else {
                    data.duration = 0;
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
                if (parent.playlistinfo.metadata.album.uri) {
                    data.albumuri = parent.playlistinfo.metadata.album.uri;
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
                    if (parent.playlistinfo.location.match(/api\.soundcloud\.com\/tracks\/(\d+)\//)
                        && prefs.player_backend == "mpd") {
                        var sc = parent.playlistinfo.location.match(
                            /api\.soundcloud\.com\/tracks\/(\d+)\//);
                        data.uri = "soundcloud://track/"+sc[1];
                    } else {
                        data.uri = parent.playlistinfo.location;
                    }
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

            this.setMeta = function(action, type, value) {
                var data = getPostData();
                displayCollectionChanges = (type == 'Playcount') ? false : true;
                debug.log("RATINGS PLUGIN",parent.nowplayingindex,"Doing",action,type,value,data);
                data.action = action;
                data.attributes = [{attribute: type, value: value}];
                if (data.uri) {
                    self.updateDatabase(data);
                } else {
                    infobar.notify(infobar.NOTIFY,language.gettext('label_searching'));
                    trackFinder.findThisOne(data, self.updateDatabase, false);
                }
            }

            this.getMeta = function(meta) {
                if (trackmeta.usermeta) {
                    if (trackmeta.usermeta[meta]) {
                        return trackmeta.usermeta[meta];
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            }

            this.updateDatabase = function(data) {
                debug.log("RATINGS","Update Database Function Called",data);
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
                            updateCollectionDisplay(rdata, displayCollectionChanges);
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
