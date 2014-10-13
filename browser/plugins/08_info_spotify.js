var info_spotify = function() {

	var me = "spotify";
    var medebug = "SPOTIFY PLUGIN";
    var maxwidth = 400;

    function getTrackHTML(data) {

    	debug.log(medebug,"Making Track Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>POPULARITY: </b>'+data.popularity+'</div>';
    	if (data.explicit) {
    		h = h + '<img class="stright standout" src="newimages/advisory.png" />';
    	}
    	h = h + '</div>';
    	return h;
    }

    function getAlbumHTML(data) {

    	debug.log(medebug,"Making Album Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}
    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>POPULARITY: </b>'+data.popularity+
    			'<br/><b>RELEASE DATE: </b>'+data.release_date+
    			'</div>';
    	if (data.images && data.images[0]) {
    		h = h + '<img class="stright standout shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" ';
    		var w = $("#infopane").width();
    		var imgwidth = data.images[0].width;
    		if (imgwidth > (w/4)) imgwidth = w/4;
    		h = h + 'width="'+imgwidth+'" name="'+data.images[0].width+'" thing="4"/>';
    	}

    	h = h + trackListing(data);
    	h = h + '</div>';
    	return h;

    }

    function getArtistHTML(data) {

    	debug.log(medebug,"Making Artist Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>POPULARITY: </b>'+data.popularity+
    			'</div>';
    	if (data.images && data.images[0]) {
    		h = h + '<img class="stright standout shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" ';
    		var w = $("#infopane").width();
    		var imgwidth = data.images[0].width;
    		if (imgwidth > (w/3)) imgwidth = w/3;
    		h = h + 'width="'+imgwidth+'" name="'+data.images[0].width+'" thing="3"/>';
    	}

    	h = h + '<div id="spartistinfo"></div>';
    	h = h + '</div>';
    	h = h + '<div class="containerbox"><div class="fixed"><h3><span class="infoclick clickshowalbums bsel">Albums By This Artist</span>' +
    			'&nbsp;&nbsp;|&nbsp;&nbsp;' +
    			'<span class="infoclick clickshowartists">Related Artists</span></h3></div>' +
    			'<div class="fixed"><img id="hibbert" height="32px" src="newimages/waiter.png" class="invisible" /></div></div>' +
    			'<div class="holdingcell masonified2" id="artistalbums"></div>';
    	return h;

    }

    function trackListing(data) {
    	var h = '<table width="100%">';
        for(var i in data.tracks.items) {
            h = h + '<tr>';
            h = h + '<td>'+data.tracks.items[i].track_number+'</td>';
            h = h + '<td>'+data.tracks.items[i].name+'</td>';
            h = h + '<td>'+formatTimeString(data.tracks.items[i].duration_ms/1000)+'</td>';
            h = h + '<td align="right"><img class="infoclick clickaddtrack" src="'+ipath+'start.png" name="'+data.tracks.items[i].uri+'"/></td>';
            h = h + '</tr>';
        }
        h = h + '</table>';
        return h;
      }

	return {

		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent) {

			debug.log(medebug, "Creating data collection");

			var self = this;
            var displaying = false;
            var laidout = true;
            if (parent.playlistinfo.metadata.artist.spotify === undefined) {
            	parent.playlistinfo.metadata.artist.spotify = {};
            }
            if (parent.playlistinfo.metadata.artist.spotify.showing === undefined) {
            	parent.playlistinfo.metadata.artist.spotify.showing = "albums";
            	laidout = false;
            }

            this.displayData = function() {
                displaying = true;
                self.artist.doBrowserUpdate();
                self.album.doBrowserUpdate();
                self.track.doBrowserUpdate();
            }

            this.stopDisplaying = function() {
                displaying = false;
			}

            this.handleClick = function(source, element, event) {
                debug.log(medebug,parent.index,source,"is handling a click event");
                if (element.hasClass('clickzoomimage')) {
                	imagePopup.create(element, event, element.attr("src"));
                } else if (element.hasClass('clickaddtrack')) {
                	playlist.waiting();
                	player.controller.addTracks([{type: 'uri', name: element.attr("name")}],
                								playlist.playFromEnd(),
                                    			null);
                } else if (element.hasClass('clickopenalbum')) {
                	var id = element.parent().next().attr("id");
                	if (element.attr("src") == ipath+"toggle-open-new.png") {
	                	element.attr("src",ipath+"toggle-closed-new.png");
            			element.parent().next().slideToggle('fast', browser.rePoint);
                	} else {
                		element.attr("src",ipath+"toggle-open-new.png");
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().slideToggle('fast', browser.rePoint);
                		} else {
            				spotify.album.getInfo(id, self.spotifyAlbumResponse, self.album.spotifyError);
            			}
            		}
                } else if (element.hasClass('clickopenartist')) {
                	var id = element.parent().next().attr("id");
                	if (element.attr("src") == ipath+"toggle-open-new.png") {
	                	element.attr("src",ipath+"toggle-closed-new.png");
            			element.parent().next().slideToggle('fast', browser.rePoint);
                	} else {
                		element.attr("src",ipath+"toggle-open-new.png");
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().slideToggle('fast', browser.rePoint);
                		} else {
            				spotify.artist.getAlbums(id, 'album,single', self.relatedArtistResponse, self.album.spotifyError);
            			}
            		}
                } else if (element.hasClass('clickshowalbums') && parent.playlistinfo.metadata.artist.spotify.showing != "albums") {
                	parent.playlistinfo.metadata.artist.spotify.showing = "albums";
                	$(".bsel").removeClass("bsel");
                	element.addClass("bsel");
                	self.getAlbums();
                } else if (element.hasClass('clickshowartists') && parent.playlistinfo.metadata.artist.spotify.showing != "artists") {
                	parent.playlistinfo.metadata.artist.spotify.showing = "artists";
                	$(".bsel").removeClass("bsel");
                	element.addClass("bsel");
                	self.getArtists();
                }
            }

        	this.getAlbums = function() {
        		$("#hibbert").addClass('spinner').removeClass('invisible');
	        	if (parent.playlistinfo.metadata.artist.spotify.albums === undefined) {
	        		debug.log(medebug, "Getting Artist Album Info");
	        		spotify.artist.getAlbums(parent.playlistinfo.metadata.artist.spotify.ids[0], 'album,single', self.storeAlbums, self.artist.spotifyError)
	        	} else {
	        		self.doAlbums(parent.playlistinfo.metadata.artist.spotify.albums);
	        	}
	        }

	        this.getArtists = function() {
        		$("#hibbert").addClass('spinner').removeClass('invisible');
	        	if (parent.playlistinfo.metadata.artist.spotify.related === undefined) {
	        		debug.log(medebug, "Getting Artist Related Info");
	        		spotify.artist.getRelatedArtists(parent.playlistinfo.metadata.artist.spotify.ids[0], self.storeArtists, self.artist.spotifyError)
	        	} else {
	        		self.doArtists(parent.playlistinfo.metadata.artist.spotify.related);
	        	}
	        }

	        this.storeAlbums = function(data) {
	        	parent.playlistinfo.metadata.artist.spotify.albums = data;
	        	self.doAlbums(data);
	        }

	        this.storeArtists = function(data) {
	        	parent.playlistinfo.metadata.artist.spotify.related = data;
	        	self.doArtists(data);
	        }

            this.doAlbums = function(data) {
            	debug.log(medebug,"DoAlbums",parent.playlistinfo.metadata.artist.spotify.showing, displaying, data);
            	if (parent.playlistinfo.metadata.artist.spotify.showing == "albums" && displaying && data) {
	            	debug.log(medebug,"Doing Albums For Artist",data);
	            	if (laidout) $("#artistalbums").masonry('destroy');
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder2'}).appendTo($("#artistalbums"));
	            		var img = '';
	            		if (data.items[i].images[0]) {
		            		img = 'getRemoteImage.php?url='+data.items[i].images[0].url
		            		for (var j in data.items[i].images) {
		            			if (data.items[i].images[j].width >= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist infoclick clickaddtrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenalbum" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick clickaddtrack" name="'+data.items[i].uri+'"><b>'+data.items[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
            		$("#artistalbums").imagesLoaded( function() {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				laidout = true;
            				browser.rePoint();
			        		$("#hibbert").addClass('invisible').removeClass('spinner');
            			});
            		});
	            }
            }

            this.relatedArtistResponse = function(data) {
            	debug.log(medebug, "Got Related Artist Response",data);
            	if (displaying) {
            		var id = data.reqid;
            		var w = browser.calcMWidth() - 24;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder3'}).appendTo($("#"+id));
	            		var img = '';
	            		if (data.items[i].images[0]) {
		            		img = 'getRemoteImage.php?url='+data.items[i].images[0].url
		            		for (var j in data.items[i].images) {
		            			if (data.items[i].images[j].width >= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist2 infoclick clickaddtrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenalbum" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick clickaddtrack" name="'+data.items[i].uri+'"><b>'+data.items[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
	            	$("#"+id).slideToggle('fast', browser.rePoint);
	            	$.each($('.tagholder3'), function() { $(this).imagesLoaded( browser.rePoint )});
	            	$("#"+id).addClass("filled");
            	}
            }

            this.doArtists = function(data) {
            	if (parent.playlistinfo.metadata.artist.spotify.showing == "artists" && displaying && data) {
	            	debug.log(medebug,"Doing Related Artists",data);
	            	if (laidout) $("#artistalbums").masonry('destroy');
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.artists) {
	            		var x = $('<div>', {class: 'tagholder2'}).appendTo($("#artistalbums"));
	            		var img = '';
	            		if (data.artists[i].images[0]) {
		            		img = 'getRemoteImage.php?url='+data.artists[i].images[0].url;
		            		for (var j in data.artists[i].images) {
		            			if (data.artists[i].images[j].width >= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.artists[i].images[j].url;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist infoclick clickaddtrack" src="'+img+'" width="'+w+'" name="'+data.artists[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenartist" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick clickaddtrack" name="'+data.artists[i].uri+'"><b>'+data.artists[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible edged" id="'+data.artists[i].id+'"></div>')
	            	}
            		$("#artistalbums").imagesLoaded( function() {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				laidout = true;
            				browser.rePoint();
			        		$("#hibbert").addClass('invisible').removeClass('spinner');
            			});
            		});
	            }
            }

            this.spotifyAlbumResponse = function(data) {
            	$("#"+data.id).html(trackListing(data));
            	$("#"+data.id).slideToggle('fast', browser.rePoint)
            	$("#"+data.id).addClass("filled");
            }

			this.track = function() {

				return {

					populate: function() {
                        if (parent.playlistinfo.metadata.track.spotify === undefined) {
		            		parent.playlistinfo.metadata.track.spotify = {};
                        	var t = parent.playlistinfo.location;
			            	if (t.substring(0,8) !== 'spotify:') {
				                browser.Update('album', me, parent.index, { name: "", data: null });
				                browser.Update('artist', me, parent.index, { name: "", data: null });
				                browser.Update('track', me, parent.index, { name: parent.playlistinfo.title, data: '<h3 align="center">'+language.gettext("spotify_not")+'</h3>' });
			            	} else {
			            		parent.playlistinfo.metadata.track.spotify.id = t.substr(14, t.length);
		                		spotify.track.getInfo(parent.playlistinfo.metadata.track.spotify.id, self.track.spotifyResponse, self.track.spotifyError);
			                }
			            } else {
			            	self.artist.populate();
			            }
                    },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Track Data",data);
                    	parent.playlistinfo.metadata.track.spotify.track = data;
                    	parent.playlistinfo.metadata.album.spotify = {id: data.album.id};
                    	parent.playlistinfo.metadata.artist.spotify.ids = [];
                    	for(var i in data.artists) {
                    		parent.playlistinfo.metadata.artist.spotify.ids.push(data.artists[i].id);
                    	}
                    	debug.log(medebug,"Spotify Data now looks like",parent.playlistinfo.metadata);
                    	self.track.doBrowserUpdate();
                    	self.artist.populate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && parent.playlistinfo.metadata.track.spotify !== undefined &&
                        	parent.playlistinfo.metadata.track.spotify.track !== undefined) {
                            debug.mark(medebug,parent.index,"track was asked to display");
                            var accepted = browser.Update('track', me, parent.index, { name: parent.playlistinfo.metadata.track.spotify.track.name,
                                                                                    link: parent.playlistinfo.metadata.track.spotify.track.external_urls.spotify,
                                                                                    data: getTrackHTML(parent.playlistinfo.metadata.track.spotify.track)
                                                                                }
                            );
                        }

                    }
				}

			}();

			this.album = function() {

				return {

					populate: function() {
                        if (parent.playlistinfo.metadata.album.spotify.album === undefined) {
	                		spotify.album.getInfo(parent.playlistinfo.metadata.album.spotify.id, self.album.spotifyResponse, self.album.spotifyError);
			            }
			        },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Album Data",data);
                    	parent.playlistinfo.metadata.album.spotify.album = data;
                    	self.album.doBrowserUpdate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && parent.playlistinfo.metadata.album.spotify !== undefined &&
                        	parent.playlistinfo.metadata.album.spotify.album !== undefined) {
                            debug.mark(medebug,parent.index,"album was asked to display");
                            var accepted = browser.Update('album', me, parent.index, { name: parent.playlistinfo.metadata.album.spotify.album.name,
                                                                                    link: parent.playlistinfo.metadata.album.spotify.album.external_urls.spotify,
                                                                                    data: getAlbumHTML(parent.playlistinfo.metadata.album.spotify.album)
                                                                                }
                            );
                        }

                    }

				}

			}();

			this.artist = function() {

				return {

					populate: function() {
                        if (parent.playlistinfo.metadata.artist.spotify.artist === undefined) {
	                		spotify.artist.getInfo(parent.playlistinfo.metadata.artist.spotify.ids[0], self.artist.spotifyResponse, self.artist.spotifyError);
			            } else {
			            	self.album.populate();
			            }
			        },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Artist Data",data);
                    	parent.playlistinfo.metadata.artist.spotify.artist = data;
                    	self.artist.doBrowserUpdate();
                    	self.album.populate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && parent.playlistinfo.metadata.artist.spotify !== undefined &&
                        	parent.playlistinfo.metadata.artist.spotify.artist !== undefined) {
                            debug.mark(medebug,parent.index,"artist was asked to display");
                            var accepted = browser.Update('artist', me, parent.index, { name: parent.playlistinfo.metadata.artist.spotify.artist.name,
                                                                                    link: parent.playlistinfo.metadata.artist.spotify.artist.external_urls.spotify,
                                                                                    data: getArtistHTML(parent.playlistinfo.metadata.artist.spotify.artist)
                                                                                }
                            );
                            if (accepted) {
                            	$.get('getspotibio.php?url='+parent.playlistinfo.metadata.artist.spotify.artist.external_urls.spotify)
                            		.done( function(data) {
                            			if (displaying) $("#spartistinfo").html(data);
                            		})
                            		.fail( function() {
                            			if (displaying) $("#spartistinfo").html("");
                            		});
	                        	self.getAlbums();
                            }
                        }

                    }
				}

			}();

			self.track.populate();

		}

	}

}();

nowplaying.registerPlugin("spotify", info_spotify, ipath+"spotify-logo-big.png", "button_infospotify");
