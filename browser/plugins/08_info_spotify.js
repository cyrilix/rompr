var info_spotify = function() {

	var me = "spotify";
    var medebug = "SPOTIFY PLUGIN";
    var maxwidth = 400;

    function getTrackHTML(data) {

    	debug.debug(medebug,"Making Track Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>'+language.gettext("label_pop")+': </b>'+data.popularity+'</div>';
    	if (data.explicit) {
    		h = h + '<img class="stright standout" src="newimages/advisory.png" />';
    	}
    	h = h + '</div>';
    	return h;
    }

    function getAlbumHTML(data) {

    	debug.debug(medebug,"Making Album Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}
        if (mobile == "no") {
        	var html = '<div class="containerbox">';
        	html = html + '<div class="fixed bright">';
        } else {
        	var html = '<div class="containerbox vertical">';
        	html = html + '<div class="stumpy notbright">';
        }
        html = html + '<ul><li>'+language.gettext("label_pop")+': '+data.popularity+'</li></ul>'+
        				'<ul><li>'+language.gettext("lastfm_releasedate")+': '+data.release_date+'</li></ul>'+
        				'</div>';

        if (mobile == "no") {
	        html = html + '<div class="expand stumpy selecotron">';
	    } else {
	        html = html + '<div class="stumpy selecotron">';
	    }
	    html = html + trackListing(data)+'</div>';
        if (mobile == "no") {
	        html = html + '<div class="cleft fixed">';
	    } else {
	        html = html + '<div class="stumpy">';
	    }
    	if (data.images && data.images[0]) {
    		html = html + '<img class="shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" ';
    		var w = $("#artistinformation").width();
    		var imgwidth = data.images[0].width;
    		if (imgwidth > (w/4)) imgwidth = w/4;
    		html = html + 'width="'+imgwidth+'" name="'+data.images[0].width+'" thing="4"/>';
    	}
    	html = html + '</div>';
    	html = html + '</div>';
    	return html;
    }

    function getArtistHTML(data, parent) {

    	debug.debug(medebug,"Making Artist Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>'+language.gettext("label_pop")+': </b>'+data.popularity;
    	if (player.canPlay('spotify')) {
	        h = h + '<div class="containerbox menuitem infoclick clickstartradio"><div class="fixed">'+language.gettext("label_artistradio")+
	        		'&nbsp;&nbsp;</div><div class="fixed"><img src="'+ipath+'broadcast-24.png" /></div>' +
	                '</div>';
	    }
    	h = h + '</div>';
    	if (data.images && data.images[0]) {
    		h = h + '<img class="stright standout shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" ';
    		var w = $("#infopane").width();
    		var imgwidth = data.images[0].width;
    		if (imgwidth > (w/3)) imgwidth = w/3;
    		h = h + 'width="'+imgwidth+'" name="'+data.images[0].width+'" thing="3"/>';
    	}

    	h = h + '<div id="spartistinfo"></div>';
    	h = h + '</div>';
    	h = h + '<div class="containerbox"><div class="fixed"><h3><span class="infoclick clickshowalbums';
    	if (parent.playlistinfo.metadata.artist.spotify.showing == "albums") {
    		h = h + ' bsel';
    	}
    	h = h + '">'+language.gettext("label_albumsby")+'</span>' +
    			'&nbsp;&nbsp;|&nbsp;&nbsp;' +
    			'<span class="infoclick clickshowartists';
    	if (parent.playlistinfo.metadata.artist.spotify.showing == "artists") {
    		h = h + ' bsel';
    	}
    	h = h + '">'+language.gettext("label_related")+'</span></h3></div>' +
    			'<div class="fixed"><img id="hibbert" height="32px" src="newimages/waiter.png" class="invisible" /></div></div>' +
    			'<div class="holdingcell masonified2" id="artistalbums"></div>';
    	return h;

    }

    function trackListing(data) {
     	var h = '';
        for(var i in data.tracks.items) {
        	if (player.canPlay('spotify')) {
	     		h = h + '<div class="infoclick draggable clickable clicktrack fullwidth" name="'+data.tracks.items[i].uri+'">';
	     	} else {
	     		h = h + '<div class="fullwidth clickaddtrack">';
	     	}
	     	h = h + '<div class="containerbox line">'+
	     			'<div class="tracknumber fixed">'+data.tracks.items[i].track_number+'</div>'+
	     			'<div class="expand">'+data.tracks.items[i].name+'</div>'+
	     			'<div class="fixed playlistrow2">'+formatTimeString(data.tracks.items[i].duration_ms/1000)+'</div>'+
	     			'</div>'+
	     			'</div>';
	    }
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
            if (parent.playlistinfo.metadata.artist.spotify === undefined) {
            	parent.playlistinfo.metadata.artist.spotify = {};
            }
            if (parent.playlistinfo.metadata.artist.spotify.showing === undefined) {
            	parent.playlistinfo.metadata.artist.spotify.showing = "albums";
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
                	$("#artistalbums").masonry('destroy');
                	self.getAlbums();
                } else if (element.hasClass('clickshowartists') && parent.playlistinfo.metadata.artist.spotify.showing != "artists") {
                	parent.playlistinfo.metadata.artist.spotify.showing = "artists";
                	$(".bsel").removeClass("bsel");
                	element.addClass("bsel");
                	$("#artistalbums").masonry('destroy');
                	self.getArtists();
                } else if (element.hasClass('clickstartradio')) {
                    playlist.radioManager.load("artistRadio", 'spotify:artist:'+parent.playlistinfo.metadata.artist.spotify.ids[0]);
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
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder2 selecotron'}).appendTo($("#artistalbums"));
	            		if (mobile != "phone") {
		            		var img = '';
		            		if (data.items[i].images[0]) {
			            		img = 'getRemoteImage.php?url='+data.items[i].images[0].url
			            		for (var j in data.items[i].images) {
			            			if (data.items[i].images[j].width >= maxwidth) {
			            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
			            			}
			            		}
		            		}
		            		x.append('<img class="masochist infoclick clickable draggable clicktrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
		            	}
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenalbum" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick draggable clickable clicktrack" name="'+data.items[i].uri+'"><b>'+data.items[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
            		if (mobile != "phone") {
	            		$("#artistalbums").imagesLoaded( function() {
	            			$("#artistalbums").slideToggle('fast', function() {
	            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
	            				browser.rePoint();
				        		$("#hibbert").addClass('invisible').removeClass('spinner');
	            			});
	            		});
	            	} else {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				browser.rePoint();
			        		$("#hibbert").addClass('invisible').removeClass('spinner');
            			});
	            	}
	            }
            }

            this.relatedArtistResponse = function(data) {
            	debug.log(medebug, "Got Related Artist Response",data);
            	if (displaying) {
            		var id = data.reqid;
            		var w = browser.calcMWidth() - 24;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder3'}).appendTo($("#"+id));
	            		if (mobile != 'phone') {
		            		var img = '';
		            		if (data.items[i].images[0]) {
			            		img = 'getRemoteImage.php?url='+data.items[i].images[0].url
			            		for (var j in data.items[i].images) {
			            			if (data.items[i].images[j].width >= maxwidth) {
			            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
			            			}
			            		}
		            		}
		            		x.append('<img class="masochist2 infoclick clickable draggable clicktrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
		            	}
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenalbum" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick clickable draggable clicktrack" name="'+data.items[i].uri+'"><b>'+data.items[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
	            	$("#"+id).slideToggle('fast', browser.rePoint);
	            	$("#"+id).addClass("filled");
	            	if (mobile != "phone") {
	            		$.each($('.tagholder3'), function() { $(this).imagesLoaded( browser.rePoint )});
	            	}
            	}
            }

            this.doArtists = function(data) {
            	if (parent.playlistinfo.metadata.artist.spotify.showing == "artists" && displaying && data) {
	            	debug.log(medebug,"Doing Related Artists",data);
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.artists) {
	            		var x = $('<div>', {class: 'tagholder2'}).appendTo($("#artistalbums"));
	            		if (mobile != "phone") {
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
		            	}
	            		x.append('<div class="tagh albumthing"><img class="menu infoclick clickopenartist" src="'+ipath+'toggle-closed-new.png"/>&nbsp;<span class="infoclick clickaddtrack" name="'+data.artists[i].uri+'"><b>'+data.artists[i].name+'</b></span></div>')
	            		x.append('<div class="tagh albumthing invisible edged selecotron" id="'+data.artists[i].id+'"></div>')
	            	}
	            	if (mobile != "phone") {
	            		$("#artistalbums").imagesLoaded( function() {
	            			$("#artistalbums").slideToggle('fast', function() {
	            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
	            				laidout = true;
	            				browser.rePoint();
				        		$("#hibbert").addClass('invisible').removeClass('spinner');
	            			});
	            		});
	            	} else {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				laidout = true;
            				browser.rePoint();
			        		$("#hibbert").addClass('invisible').removeClass('spinner');
            			});
	            	}
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
				        	if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
				                browser.Update('track', me, parent.index, { name: "",
				                    					link: "",
				                    					data: null
				                						}
								);
				        		self.artist.populate();
				        		self.album.populate();
				        	} else {
			            		parent.playlistinfo.metadata.track.spotify = {};
			            		parent.playlistinfo.metadata.track.spotify.id = parent.playlistinfo.location.substr(14, parent.playlistinfo.location.length);
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
                    	debug.debug(medebug,"Spotify Data now looks like",parent.playlistinfo.metadata);
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
                        if (parent.playlistinfo.metadata.album.spotify === undefined ||
                        	parent.playlistinfo.metadata.album.spotify.album === undefined) {
				        	if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
				                browser.Update('album', me, parent.index, { name: "",
				                    					link: "",
				                    					data: null
				                						}
								);

				        	} else {
	                			spotify.album.getInfo(parent.playlistinfo.metadata.album.spotify.id, self.album.spotifyResponse, self.album.spotifyError);
	                		}
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
						if (parent.playlistinfo.location.substring(0,8) !== 'spotify:' &&
							parent.playlistinfo.metadata.artist.spotify.ids === undefined) {
							self.artist.search();
						} else {
	                        if (parent.playlistinfo.metadata.artist.spotify.artist === undefined) {
		                		spotify.artist.getInfo(parent.playlistinfo.metadata.artist.spotify.ids[0], self.artist.spotifyResponse, self.artist.spotifyError);
				            } else {
				            	self.album.populate();
				            }
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
                                                                                    data: getArtistHTML(parent.playlistinfo.metadata.artist.spotify.artist, parent)
                                                                                }
                            );
                            if (accepted && parent.playlistinfo.metadata.artist.spotify.artist.error == undefined) {
                            	debug.debug(medebug,"Update was accepted by browser");
                            	if (parent.playlistinfo.metadata.artist.spotify.artist.external_urls &&
                            		parent.playlistinfo.metadata.artist.spotify.artist.external_urls.spotify) {
	                            	$.get('getspotibio.php?url='+parent.playlistinfo.metadata.artist.spotify.artist.external_urls.spotify)
	                            		.done( function(data) {
	                            			if (displaying) $("#spartistinfo").html(data);
	                            		})
	                            		.fail( function() {
	                            			if (displaying) $("#spartistinfo").html("");
	                            		});
	                            	}
                            	if (parent.playlistinfo.metadata.artist.spotify.showing == "albums") {
	                        		self.getAlbums();
	                        	} else {
	                        		self.getArtists();
	                        	}
                            }
                        }

                    },

                    search: function() {
                    	debug.shout(medebug, "Searching Spotify for artist",parent.playlistinfo.creator)
                    	spotify.artist.search(parent.playlistinfo.creator, self.artist.searchResponse, self.artist.searchFail);
                    },

                    searchFail: function() {
		        		parent.playlistinfo.metadata.artist.spotify = { artist: { 	error: '<h3 align="center">'+language.gettext("label_noartistinfo")+'</h3>',
		        																 	name: parent.playlistinfo.creator,
		        																 	external_urls: { spotify: '' }
		        																 }
		        													};
		        		self.artist.doBrowserUpdate();
                    },

                    searchResponse: function(data) {
                    	debug.log(medebug,"Got Spotify Search Data",data);
						var f = false;
						for (var i in data.artists.items) {
							if (data.artists.items[i].name.toLowerCase() == parent.playlistinfo.creator.toLowerCase()) {
								f = true;
								parent.playlistinfo.metadata.artist.spotify = {ids: [data.artists.items[i].id]};
								parent.playlistinfo.metadata.artist.spotify.showing = "albums";
								break;
							}
						}
						if (!f) {
							self.artist.searchFail();
						} else {
							self.artist.populate();
						}

                    }
				}

			}();

			self.track.populate();

		}

	}

}();

nowplaying.registerPlugin("spotify", info_spotify, ipath+"spotify-logo-big.png", "button_infospotify");
