var info_spotify = function() {

	var me = "spotify";
    var medebug = "SPOTIFY PLUGIN";
    var maxwidth = 300;

    function getTrackHTML(data) {

    	debug.debug(medebug,"Making Track Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><b>'+language.gettext("label_pop")+': </b>'+data.popularity+'</div>';
    	if (data.explicit) {
    		h = h + '<i class="icon-explicit stright standout"></i>';
    	}
    	h = h + '</div>';
    	return h;
    }

    function getAlbumHTML(data) {

    	debug.debug(medebug,"Making Album Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}
        var html = '<div class="containerbox info-detail-layout">';
        html = html + '<div class="info-box-fixed info-box-list info-border-right">';
        html = html + '<ul><li>'+language.gettext("label_pop")+': '+data.popularity+'</li></ul>'+
        				'<ul><li>'+language.gettext("lastfm_releasedate")+': '+data.release_date+'</li></ul>'+
        				'</div>';

        html = html + '<div class="info-box-expand stumpy selecotron">';
	    html = html + trackListing(data)+'</div>';
        html = html + '<div class="cleft info-box-fixed">';
    	if (data.images && data.images[0]) {
    		html = html + '<img class="shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" ';
    		var w = $("#infopane").width();
    		var imgwidth = data.images[0].width;
    		if (imgwidth > w/layoutProcessor.shrinkerRatio) imgwidth = w/layoutProcessor.shrinkerRatio;
            imgwidth -= 48;
    		html = html + 'width="'+imgwidth+'" name="'+data.images[0].width+'"/>';
    	}
    	html = html + '</div>';
    	html = html + '</div>';
    	return html;
    }

    function getArtistHTML(data, parent, artistmeta) {

    	debug.debug(medebug,"Making Artist Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h = h + '<div class="standout stleft statsbox"><ul><li><b>'+language.gettext("label_pop")+': </b>'+data.popularity+'</li>';
        h = h + '<li><div class="containerbox menuitem infoclick clickstartsingleradio" style="padding-left:0px">'+
        		'<div class="fixed" style="vertical-align:middle;padding-right:4px"><i class="icon-wifi smallicon"></i></div>'+
        		'<div class="fixed">'+language.gettext("label_singleartistradio")+'</div>'+
                '</div></li>';
    	if (player.canPlay('spotify')) {
	        h = h + '<li><div class="containerbox menuitem infoclick clickstartradio" style="padding-left:0px">'+
	        		'<div class="fixed" style="vertical-align:middle;padding-right:4px"><i class="icon-wifi smallicon"></i></div>'+
	        		'<div class="fixed">'+language.gettext("label_artistradio")+'</div>'+
	                '</div></li>';
	    }
    	h = h + '</ul></div>';
    	if (data.images && data.images[0]) {
    		var w = $("#infopane").width();
    		var imgwidth = data.images[0].width;
            if (imgwidth > (w/layoutProcessor.shrinkerRatio)) imgwidth = w/layoutProcessor.shrinkerRatio;
            imgwidth -= 48;
            h = h + '<img class="stright standout shrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+data.images[0].url+'" width="'+imgwidth+'" name="'+data.images[0].width+'"/>';
    	}

    	h = h + '<div id="spartistinfo"></div>';
    	h = h + '</div>';
    	h = h + '<div class="containerbox"><div class="fixed"><h3><span class="title-menu infoclick clickshowalbums';
    	if (artistmeta.spotify.showing == "albums") {
    		h = h + ' bsel';
    	}
    	h = h + '">'+language.gettext("label_albumsby")+'</span>' +
    			'&nbsp;&nbsp;|&nbsp;&nbsp;' +
    			'<span class="title-menu infoclick clickshowartists';
    	if (artistmeta.spotify.showing == "artists") {
    		h = h + ' bsel';
    	}

    	h = h + '">'+language.gettext("label_related")+'</span></h3></div>' +
    			'<div class="fixed"><i id="hibbert" class="smallcover-svg title-menu invisible"></i></div></div>' +
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

		collection: function(parent, artistmeta, albummeta, trackmeta) {

			debug.log(medebug, "Creating data collection");

			var self = this;
            var displaying = false;
            if (artistmeta.spotify === undefined) {
            	artistmeta.spotify = {};
            }
            if (artistmeta.spotify.showing === undefined) {
            	artistmeta.spotify.showing = "albums";
            }

            this.populate = function() {
				self.track.populate();
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
                debug.log(medebug,parent.nowplayingindex,source,"is handling a click event");
                if (element.hasClass('clickzoomimage')) {
                	imagePopup.create(element, event, element.attr("src"));
                } else if (element.hasClass('clickopenalbum')) {
                	var id = element.parent().next().attr("id");
                	if (element.isOpen()) {
                        element.toggleClosed();
            			element.parent().next().menuReveal(browser.rePoint);
                	} else {
                        element.toggleOpen();
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().menuReveal(browser.rePoint);
                		} else {
            				spotify.album.getInfo(id, self.spotifyAlbumResponse, self.album.spotifyError, true);
            			}
            		}
                } else if (element.hasClass('clickopenartist')) {
                	var id = element.parent().next().attr("id");
                	if (element.isOpen()) {
	                	element.toggleClosed();
            			element.parent().next().menuReveal(browser.rePoint);
                	} else {
                		element.toggleOpen();
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().menuReveal(browser.rePoint);
                		} else {
            				spotify.artist.getAlbums(id, 'album,single', self.relatedArtistResponse, self.album.spotifyError, true);
            			}
            		}
                } else if (element.hasClass('clickshowalbums') && artistmeta.spotify.showing != "albums") {
                	artistmeta.spotify.showing = "albums";
                	$("#artistinformation .bsel").removeClass("bsel");
                	element.addClass("bsel");
                	$("#artistalbums").masonry('destroy');
                	self.getAlbums();
                } else if (element.hasClass('clickshowartists') && artistmeta.spotify.showing != "artists") {
                	artistmeta.spotify.showing = "artists";
                	$("#artistinformation .bsel").removeClass("bsel");
                	element.addClass("bsel");
                	$("#artistalbums").masonry('destroy');
                	self.getArtists();
                } else if (element.hasClass('clickstartradio')) {
                    playlist.radioManager.load("artistRadio", 'spotify:artist:'+artistmeta.spotify.id);
                }  else if (element.hasClass('clickstartsingleradio')) {
                    playlist.radioManager.load("singleArtistRadio", artistmeta.name);
                }
            }

        	this.getAlbums = function() {
        		$("#hibbert").makeSpinner();
	        	if (artistmeta.spotify.albums === undefined) {
	        		debug.log(medebug, "Getting Artist Album Info");
	        		spotify.artist.getAlbums(artistmeta.spotify.id, 'album,single', self.storeAlbums, self.artist.spotifyError, true)
	        	} else {
	        		self.doAlbums(artistmeta.spotify.albums);
	        	}
	        }

	        this.getArtists = function() {
        		$("#hibbert").makeSpinner()
	        	if (artistmeta.spotify.related === undefined) {
	        		debug.log(medebug, "Getting Artist Related Info");
	        		spotify.artist.getRelatedArtists(artistmeta.spotify.id, self.storeArtists, self.artist.spotifyError, true)
	        	} else {
	        		self.doArtists(artistmeta.spotify.related);
	        	}
	        }

	        this.storeAlbums = function(data) {
	        	artistmeta.spotify.albums = data;
	        	self.doAlbums(data);
	        }

	        this.storeArtists = function(data) {
	        	artistmeta.spotify.related = data;
	        	self.doArtists(data);
	        }

            this.doAlbums = function(data) {
            	debug.log(medebug,"DoAlbums",artistmeta.spotify.showing, displaying, data);
            	if (artistmeta.spotify.showing == "albums" && displaying && data) {
	            	debug.log(medebug,"Doing Albums For Artist",data);
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder2 selecotron'}).appendTo($("#artistalbums"));
	            		var img = '';
	            		if (data.items[i].images[0]) {
		            		img = 'getRemoteImage.php?url='+data.items[i].images[0].url
		            		for (var j in data.items[i].images) {
		            			if (data.items[i].images[j].width <= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
		            				break;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist infoclick clickable draggable clicktrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><i class="icon-toggle-closed menu infoclick clickopenalbum"></i><span class="title-menu infoclick draggable clickable clicktrack" name="'+data.items[i].uri+'">'+data.items[i].name+'</span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
            		$("#artistalbums").imagesLoaded( function() {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				browser.rePoint();
			        		$("#hibbert").stopSpinner();
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
		            			if (data.items[i].images[j].width <= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.items[i].images[j].url;
		            				break;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist2 infoclick clickable draggable clicktrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><i class="icon-toggle-closed menu infoclick clickopenalbum"></i><span class="title-menu infoclick clickable draggable clicktrack" name="'+data.items[i].uri+'">'+data.items[i].name+'</span></div>')
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+'"></div>')
	            	}
	            	$("#"+id).slideToggle('fast', browser.rePoint);
	            	$("#"+id).addClass("filled");
            		$.each($('.tagholder3'), function() { $(this).imagesLoaded( browser.rePoint )});
            	}
            }

            this.doArtists = function(data) {
            	if (artistmeta.spotify.showing == "artists" && displaying && data) {
	            	debug.log(medebug,"Doing Related Artists",data);
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.artists) {
	            		var x = $('<div>', {class: 'tagholder2'}).appendTo($("#artistalbums"));
	            		var img = '';
	            		if (data.artists[i].images[0]) {
		            		img = 'getRemoteImage.php?url='+data.artists[i].images[0].url;
		            		for (var j in data.artists[i].images) {
		            			if (data.artists[i].images[j].width <= maxwidth) {
		            				img = 'getRemoteImage.php?url='+data.artists[i].images[j].url;
		            				break;
		            			}
		            		}
	            		}
	            		x.append('<img class="masochist infoclick clickaddtrack" src="'+img+'" width="'+w+'" name="'+data.artists[i].uri+'"/>');
	            		x.append('<div class="tagh albumthing"><i class="icon-toggle-closed menu infoclick clickopenartist"></i><span class="title-menu infoclick clickaddtrack" name="'+data.artists[i].uri+'">'+data.artists[i].name+'</span></div>')
	            		x.append('<div class="tagh albumthing invisible edged selecotron" id="'+data.artists[i].id+'"></div>')
	            	}
            		$("#artistalbums").imagesLoaded( function() {
            			$("#artistalbums").slideToggle('fast', function() {
            				$("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
            				laidout = true;
            				browser.rePoint();
			        		$("#hibbert").stopSpinner();
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
                        if (trackmeta.spotify === undefined ||
                        	artistmeta.spotify.id === undefined) {
                        	if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
				        		self.track.doBrowserUpdate()
				        		self.artist.populate();
				        		self.album.populate();
				        	} else {
			            		if (trackmeta.spotify === undefined) {
			            			trackmeta.spotify = {id: parent.playlistinfo.location.substr(14, parent.playlistinfo.location.length) };
			            		}
		                		spotify.track.getInfo(trackmeta.spotify.id, self.track.spotifyResponse, self.track.spotifyError, true);
		                	}
			            } else {
			            	self.artist.populate();
			            }
                    },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Track Data",data);
                    	if (trackmeta.spotify.track === undefined) {
	                    	trackmeta.spotify.track = data;
	                    }
	                    if (albummeta.spotify === undefined) {
	                    	albummeta.spotify = {id: data.album.id};
	                    }
                    	for(var i in data.artists) {
                    		if (data.artists[i].name == artistmeta.name) {
                    			debug.log(medebug,parent.nowplayingindex,"Found Spotify ID for",artistmeta.name);
                    			artistmeta.spotify.id = data.artists[i].id;
                    		}
                    	}
                    	debug.debug(medebug,"Spotify Data now looks like",artistmeta, albummeta, trackmeta);
                    	self.track.doBrowserUpdate();
                    	self.artist.populate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && trackmeta.spotify !== undefined &&
                        	trackmeta.spotify.track !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"track was asked to display");
                            var accepted = browser.Update(
                            	null,
                            	'track',
                            	me,
                            	parent.nowplayingindex,
                            	{ name: trackmeta.spotify.track.name,
                                  link: trackmeta.spotify.track.external_urls.spotify,
                                  data: getTrackHTML(trackmeta.spotify.track)
                                }
                            );
                        } else if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
			                browser.Update(null, 'track', me, parent.nowplayingindex, { name: "",
			                    					link: "",
			                    					data: null
			                						}
							);
				        }
                    }
				}

			}();

			this.album = function() {

				return {

					populate: function() {
                        if (albummeta.spotify === undefined ||
                        	albummeta.spotify.album === undefined) {
				        	if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
				        		self.album.doBrowserUpdate();
				        	} else {
	                			spotify.album.getInfo(albummeta.spotify.id, self.album.spotifyResponse, self.album.spotifyError, true);
	                		}
			            }
			        },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Album Data",data);
                    	albummeta.spotify.album = data;
                    	self.album.doBrowserUpdate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && albummeta.spotify !== undefined &&
                        	albummeta.spotify.album !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"album was asked to display");
                            var accepted = browser.Update(
                            	null,
                            	'album',
                            	me,
                            	parent.nowplayingindex,
                            	{ name: albummeta.spotify.album.name,
                                  link: albummeta.spotify.album.external_urls.spotify,
                                  data: getAlbumHTML(albummeta.spotify.album)
                                }
                            );
                        } else if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
			                browser.Update(null, 'album', me, parent.nowplayingindex, { name: "",
			                    					link: "",
			                    					data: null
			                						}
							);
						}
                    }

				}

			}();

			this.artist = function() {

				return {

					populate: function() {
						if (artistmeta.spotify.id === undefined) {
							self.artist.search();
						} else {
	                        if (artistmeta.spotify.artist === undefined) {
		                		spotify.artist.getInfo(artistmeta.spotify.id, self.artist.spotifyResponse, self.artist.spotifyError, true);
				            } else {
				            	self.album.populate();
				            }
				        }
			        },

                    spotifyResponse: function(data) {
                    	debug.log(medebug, "Got Spotify Artist Data",data);
                    	artistmeta.spotify.artist = data;
                    	self.artist.doBrowserUpdate();
                    	self.album.populate();
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && artistmeta.spotify !== undefined &&
                        	artistmeta.spotify.artist !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"artist was asked to display");
                            var accepted = browser.Update(
                            	null,
                            	'artist',
                            	me,
                            	parent.nowplayingindex,
                            	{ name: artistmeta.spotify.artist.name,
                                  link: artistmeta.spotify.artist.external_urls.spotify,
                                  data: getArtistHTML(artistmeta.spotify.artist, parent, artistmeta)
                                }
                            );
                            if (accepted && artistmeta.spotify.artist.error == undefined) {
                            	debug.debug(medebug,"Update was accepted by browser");
                            	if (artistmeta.spotify.artist.external_urls &&
                            		artistmeta.spotify.artist.external_urls.spotify) {
	                            	$.get('browser/backends/getspotibio.php?url='+artistmeta.spotify.artist.external_urls.spotify)
	                            		.done( function(data) {
	                            			if (displaying) $("#spartistinfo").html(data);
	                            		})
	                            		.fail( function() {
	                            			if (displaying) $("#spartistinfo").html("");
	                            		});
	                            	}
                            	if (artistmeta.spotify.showing == "albums") {
	                        		self.getAlbums();
	                        	} else {
	                        		self.getArtists();
	                        	}
                            }
                        }

                    },

                    search: function() {
                    	if (parent.playlistinfo.type == "stream" && artistmeta.name == "" && trackmeta.name == "") {
	                    	debug.shout(medebug, "Searching Spotify for artist",albummeta.name)
	                    	spotify.artist.search(albummeta.name, self.artist.searchResponse, self.artist.searchFail, true);

                    	} else {
	                    	debug.shout(medebug, "Searching Spotify for artist",artistmeta.name)
	                    	spotify.artist.search(artistmeta.name, self.artist.searchResponse, self.artist.searchFail, true);
	                    }
                    },

                    searchFail: function() {
		        		artistmeta.spotify = { artist: { 	error: '<h3 align="center">'+language.gettext("label_noartistinfo")+'</h3>',
		        											name: artistmeta.name,
		        											external_urls: { spotify: '' }
		        										}
		        							};
		        		self.artist.doBrowserUpdate();
                    },

                    searchResponse: function(data) {
                    	debug.log(medebug,"Got Spotify Search Data",data);
						for (var i in data.artists.items) {
							if (data.artists.items[i].name.toLowerCase() == artistmeta.name.toLowerCase()) {
								artistmeta.spotify.id = data.artists.items[i].id;
								artistmeta.spotify.showing = "albums";
								break;
							}
						}
						if (artistmeta.spotify.id === undefined) {
							self.artist.searchFail();
						} else {
							self.artist.populate();
						}

                    }
				}
			}();
		}
	}
}();

nowplaying.registerPlugin("spotify", info_spotify, "icon-spotify-circled", "button_infospotify");
