var info_spotify = function() {

	var me = "spotify";
    var medebug = "SPOTIFY PLUGIN";
    var maxwidth = 300;

    function getTrackHTML(data) {

    	debug.trace(medebug,"Making Track Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

    	var h = '<div class="holdingcell">';
    	h += '<div class="standout stleft statsbox"><b>'+language.gettext("label_pop")+': </b>'+
            data.popularity+'</div>';
    	if (data.explicit) {
    		h += '<i class="icon-explicit stright standout"></i>';
    	}
    	h += '</div>';
    	return h;
    }

    function getAlbumHTML(data) {

    	debug.trace(medebug,"Making Album Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}
        var html = '<div class="containerbox standout info-detail-layout">';
        html += '<div class="info-box-fixed info-box-list info-border-right">';
        html += '<ul><li>'+language.gettext("label_pop")+': '+data.popularity+'</li></ul>'+
				'<ul><li>'+language.gettext("lastfm_releasedate")+': '+data.release_date+
                '</li></ul>'+
				'</div>';

        html += '<div class="info-box-expand stumpy selecotron">';
	    html += trackListing(data)+'</div>';
        html += '<div class="cleft info-box-fixed">';
    	if (data.images && data.images[0]) {
    		html += '<img class="cshrinker infoclick clickzoomimage" src="getRemoteImage.php?url='+
                data.images[0].url+'" />';
    	}
    	html += '</div>';
    	html += '</div>';
    	return html;
    }

    function getArtistHTML(data, parent, artistmeta) {

    	debug.trace(medebug,"Making Artist Info From",data);
    	if (data.error) {
    		return '<h3 align="center">'+data.error+'</h3>';
    	}

        var h = "";

        if (artistmeta.spotify.possibilities && artistmeta.spotify.possibilities.length > 1) {
            h += '<div class="spotchoices clearfix">'+
            '<table><tr><td>'+
            '<div class="bleft tleft spotthing"><span class="spotpossname">All possibilities for "'+
                artistmeta.spotify.artist.name+'"</span></div>'+
            '</td><td>';
            for (var i in artistmeta.spotify.possibilities) {
                h += '<div class="tleft infoclick bleft ';
                if (i == artistmeta.spotify.currentposs) {
                    h += 'bsel ';
                }
                h += 'clickchooseposs" name="'+i+'">';
                if (artistmeta.spotify.possibilities[i].image) {
                    h += '<img class="spotpossimg title-menu" src="getRemoteImage.php?url='+
                        artistmeta.spotify.possibilities[i].image+'" />';
                }
                h += '<span class="spotpossname">'+artistmeta.spotify.possibilities[i].name+'</span>';
                h += '</div>';
            }
            h += '</td></tr></table>';
            h += '</div>';
        }

        h += '<div class="holdingcell">';
    	h += '<div class="standout stleft statsbox"><ul><li><b>'+language.gettext("label_pop")+
            ': </b>'+data.popularity+'</li>';
        h += '<li><div class="containerbox menuitem infoclick clickstartsingleradio" style="padding-left:0px">'+
    		'<div class="fixed" style="vertical-align:middle;padding-right:4px">'+
            '<i class="icon-wifi smallicon"></i></div>'+
    		'<div class="fixed">'+language.gettext("label_singleartistradio")+'</div>'+
            '</div></li>';
    	if (player.canPlay('spotify')) {
	        h += '<li>'+
                '<div class="containerbox menuitem infoclick clickstartradio" style="padding-left:0px">'+
        		'<div class="fixed" style="vertical-align:middle;padding-right:4px">'+
                '<i class="icon-wifi smallicon"></i></div>'+
        		'<div class="fixed">'+language.gettext("lastfm_simar")+'</div>'+
                '</div></li>';
	    }
    	h += '</ul></div>';
    	if (data.images && data.images[0]) {
            h += '<img class="stright standout cshrinker infoclick clickzoomimage" '+
                'src="getRemoteImage.php?url='+data.images[0].url+'" />';
    	}

    	h += '<div id="spartistinfo"></div>';
    	h += '</div>';
    	h += '<div class="containerbox" id="bumhole"><div class="fixed infoclick clickshowalbums bleft';
    	if (artistmeta.spotify.showing == "albums") {
    		h += ' bsel';
    	}
    	h += '">'+language.gettext("label_albumsby") + '</div>' +
			'<div class="fixed infoclick clickshowartists bleft bmid';
    	if (artistmeta.spotify.showing == "artists") {
    		h += ' bsel';
    	}

    	h += '">'+language.gettext("lastfm_simar")+'</div>' +
			'<div class="fixed"><i id="hibbert" class="smallcover-svg title-menu invisible">'+
            '</i></div></div>' +
			'<div class="holdingcell masonified2" id="artistalbums"></div>';
    	return h;

    }

    function trackListing(data) {
     	var h = '';
        for(var i in data.tracks.items) {
        	if (player.canPlay('spotify')) {
	     		h += '<div class="infoclick draggable clickable clicktrack fullwidth" name="'+
                    data.tracks.items[i].uri+'">';
	     	} else {
	     		h += '<div class="fullwidth clickaddtrack">';
	     	}
	     	h += '<div class="containerbox line">'+
     			'<div class="tracknumber fixed">'+data.tracks.items[i].track_number+'</div>'+
     			'<div class="expand">'+data.tracks.items[i].name+'</div>'+
     			'<div class="fixed playlistrow2">'+
                formatTimeString(data.tracks.items[i].duration_ms/1000)+'</div>'+
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

			debug.trace(medebug, "Creating data collection");

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
                debug.trace(medebug,parent.nowplayingindex,source,"is handling a click event");
                if (element.hasClass('clickzoomimage')) {
                	imagePopup.create(element, event, element.attr("src"));
                } else if (element.hasClass('clickopenalbum')) {
                	var id = element.parent().next().attr("id");
                	if (element.isOpen()) {
                        element.toggleClosed();
            			element.parent().next().menuHide(browser.rePoint);
                	} else {
                        element.toggleOpen();
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().menuReveal(browser.rePoint);
                		} else {
            				spotify.album.getInfo(id, spotifyAlbumResponse, self.album.spotifyError,
                                true);
            			}
            		}
                } else if (element.hasClass('clickopenartist')) {
                	var id = element.parent().next().attr("id");
                	if (element.isOpen()) {
	                	element.toggleClosed();
            			element.parent().next().menuHide(browser.rePoint);
                	} else {
                		element.toggleOpen();
                		if (element.parent().next().hasClass("filled")) {
                			element.parent().next().menuReveal(browser.rePoint);
                		} else {
            				spotify.artist.getAlbums(id, 'album,single', relatedArtistResponse,
                                self.album.spotifyError, true);
            			}
            		}
                } else if (element.hasClass('clickchooseposs')) {
                    var poss = element.attr("name");
                    if (poss != artistmeta.spotify.currentposs) {
                        artistmeta.spotify = {
                            currentposs: poss,
                            possibilities: artistmeta.spotify.possibilities,
                            id: artistmeta.spotify.possibilities[poss].id,
                            showing: "albums"
                        }
                        self.artist.force = true;
                        self.artist.populate();
                    }
                } else if (element.hasClass('clickshowalbums') &&
                        artistmeta.spotify.showing != "albums") {
                	artistmeta.spotify.showing = "albums";
                	$("#bumhole .bsel").removeClass("bsel");
                	element.addClass("bsel");
                	$("#artistalbums").masonry('destroy');
                	getAlbums();
                } else if (element.hasClass('clickshowartists') &&
                        artistmeta.spotify.showing != "artists") {
                	artistmeta.spotify.showing = "artists";
                	$("#bumhole .bsel").removeClass("bsel");
                	element.addClass("bsel");
                	$("#artistalbums").masonry('destroy');
                	getArtists();
                } else if (element.hasClass('clickstartradio')) {
                    playlist.radioManager.load("artistRadio", 'spotify:artist:'+
                        artistmeta.spotify.id);
                }  else if (element.hasClass('clickstartsingleradio')) {
                    playlist.radioManager.load("singleArtistRadio", artistmeta.name);
                }
            }

        	function getAlbums() {
        		$("#hibbert").makeSpinner();
	        	if (artistmeta.spotify.albums === undefined) {
	        		debug.trace(medebug, "Getting Artist Album Info");
	        		spotify.artist.getAlbums(artistmeta.spotify.id, 'album,single',
                        storeAlbums, self.artist.spotifyError, true)
	        	} else {
	        		doAlbums(artistmeta.spotify.albums);
	        	}
	        }

	        function getArtists() {
        		$("#hibbert").makeSpinner()
	        	if (artistmeta.spotify.related === undefined) {
	        		debug.trace(medebug, "Getting Artist Related Info");
	        		spotify.artist.getRelatedArtists(artistmeta.spotify.id,
                        storeArtists, self.artist.spotifyError, true)
	        	} else {
                    doArtists(artistmeta.spotify.related);
	        	}
	        }

	        function storeAlbums(data) {
	        	artistmeta.spotify.albums = data;
	        	doAlbums(data);
	        }

	        function storeArtists(data) {
	        	artistmeta.spotify.related = data;
	        	doArtists(data);
	        }

            function doAlbums(data) {
            	debug.trace(medebug,"DoAlbums",artistmeta.spotify.showing, displaying);
            	if (artistmeta.spotify.showing == "albums" && displaying && data) {
                    var images = {};
                    var imgcount = 0;
	            	debug.trace(medebug,"Doing Albums For Artist",data);
	            	$("#artistalbums").empty().hide();
            		var w = browser.calcMWidth();;
	            	for (var i in data.items) {
	            		var x = $('<div>', {class: 'tagholder2 selecotron'}).
                            appendTo($("#artistalbums"));
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
                        images['masimg_'+imgcount] = img;
                        if (player.canPlay("spotify")) {
	            		    x.append('<img id="masimg_'+imgcount+
                                '" class="masochist infoclick clickable draggable clicktrack" '+
                                'src="" width="'+w+'" name="'+data.items[i].uri+'"/>');
	            		    x.append('<div class="tagh albumthing">'+
                                '<i class="icon-toggle-closed menu infoclick clickopenalbum"></i>'+
                                '<span class="title-menu infoclick draggable clickable clicktrack"'+
                                ' name="'+data.items[i].uri+'">'+data.items[i].name+'</span></div>');
                        } else {
                            x.append('<img id="masimg_'+imgcount+
                                '" class="masochist clicktrack" src="" width="'+w+'"/>');
                            x.append('<div class="tagh albumthing">'+
                                '<i class="icon-toggle-closed menu infoclick clickopenalbum"></i>'+
                                '<span class="title-menu clicktrack">'+data.items[i].name+
                                '</span><a href="'+data.items[i].external_urls['spotify']+
                                '" target="_blank"><i class="icon-spotify-circled playlisticonr">'+
                                '</i></a></div>');
                        }
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+
                            '"></div>')
                        imgcount++;
	            	}
                    // This may seems like a faff - creeating the images and then setting their src
                    // attributes afterwards but in rare cases, if we don't do this, the images load
                    // before we set up the imagesLoaded handler and then the imagesloaded event
                    // never fires.
                    $("#artistalbums").imagesLoaded( doBlockLayout );
                    $("#artistalbums").find('img').each( function() {
                        $(this).attr('src', images[$(this).attr('id')]);
                    });
	            }
            }

            function doBlockLayout() {
                if (displaying) {
                    $("#artistalbums").slideDown('fast', function() {
                        $("#artistalbums").masonry({ itemSelector: '.tagholder2', gutter: 0});
                         browser.rePoint();
                        $("#hibbert").stopSpinner();
                    });
                }
            }

            function relatedArtistResponse(data) {
            	debug.trace(medebug, "Got Related Artist Response",data);
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
                        if (player.canPlay("spotify")) {
	            		    x.append('<img class="masochist2 infoclick clickable draggable '+
                                'clicktrack" src="'+img+'" width="'+w+'" name="'+data.items[i].uri+
                                '"/>');
	            		    x.append('<div class="tagh albumthing"><i class="icon-toggle-closed '+
                                'menu infoclick clickopenalbum"></i><span class="title-menu '+
                                'infoclick clickable draggable clicktrack" name="'+
                                data.items[i].uri+'">'+data.items[i].name+'</span></div>');
                        } else {
                            x.append('<img class="masochist2 clicktrack" src="'+img+'" width="'+w
                                +'"/>');
                            x.append('<div class="tagh albumthing"><i class="icon-toggle-closed '+
                                'menu infoclick clickopenalbum"></i><span class="title-menu '+
                                'clicktrack">'+data.items[i].name+'</span><a href="'+
                                data.items[i].external_urls['spotify']+'" target="_blank">'+
                                '<i class="icon-spotify-circled playlisticonr"></i></a></div>');
                        }
	            		x.append('<div class="tagh albumthing invisible" id="'+data.items[i].id+
                            '"></div>')
	            	}
	            	$("#"+id).menuReveal(browser.rePoint);
	            	$("#"+id).addClass("filled");
            		$.each($('.tagholder3'), function() { $(this).imagesLoaded( browser.rePoint )});
            	}
            }

            function doArtists(data) {
            	if (artistmeta.spotify.showing == "artists" && displaying && data) {
	            	debug.trace(medebug,"Doing Related Artists",data);
                    var images = {};
                    var imgcount = 0;
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
                        images['masimg_'+imgcount] = img;
                        if (player.canPlay("spotify")) {
    	            		x.append('<img id="masimg_'+imgcount+'" class="masochist infoclick'+
                                ' clickaddtrack" src="" width="'+w+'" name="'+
                                data.artists[i].uri+'"/>');
    	            		x.append('<div class="tagh albumthing"><i class="icon-toggle-closed'+
                                ' menu infoclick clickopenartist"></i><span class="title-menu '+
                                'infoclick clickaddtrack" name="'+data.artists[i].uri+
                                '">'+data.artists[i].name+'</span></div>');
                        } else {
                            x.append('<img id="masimg_'+imgcount+
                                '" class="masochist clickaddtrack" src="" width="'+w+'"/>');
                            x.append('<div class="tagh albumthing">'+
                                '<i class="icon-toggle-closed menu infoclick clickopenartist"></i>'+
                                '<span class="title-menu clickaddtrack">'+data.artists[i].name+
                                '</span><a href="'+data.artists[i].external_urls['spotify']+
                                '" target="_blank"><i class="icon-spotify-circled playlisticonr">'+
                                '</i></a></div>');
                        }
	            		x.append('<div class="tagh albumthing invisible edged selecotron '+
                            'dropshadow" id="'+data.artists[i].id+'"></div>')
                        imgcount++;
	            	}
                    $("#artistalbums").imagesLoaded( doBlockLayout );
                    $("#artistalbums").find('img').each( function() {
                        $(this).attr('src', images[$(this).attr('id')]);
                    });
	            }
            }

            function spotifyAlbumResponse(data) {
            	$("#"+data.id).html(trackListing(data));
                $("#"+data.id).menuReveal(browser.rePoint)
            	$("#"+data.id).addClass("filled");
            }

			this.track = function() {

                function spotifyResponse(data) {
                    debug.trace(medebug, "Got Spotify Track Data");
                    debug.trace(medebug, data);
                    if (trackmeta.spotify.track === undefined) {
                        trackmeta.spotify.track = data;
                    }
                    if (albummeta.spotify === undefined) {
                        albummeta.spotify = {id: data.album.id};
                    }
                    for(var i in data.artists) {
                        if (data.artists[i].name == artistmeta.name) {
                            debug.trace(medebug,parent.nowplayingindex,"Found Spotify ID for"
                                ,artistmeta.name);
                            artistmeta.spotify.id = data.artists[i].id;
                        }
                    }
                    debug.trace(medebug,"Spotify Data now looks like",artistmeta, albummeta,
                        trackmeta);
                    self.track.doBrowserUpdate();
                    self.artist.populate();
                }

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
			            			trackmeta.spotify = {id: parent.playlistinfo.location.substr(
                                        14, parent.playlistinfo.location.length) };
			            		}
		                		spotify.track.getInfo(trackmeta.spotify.id, spotifyResponse,
                                    self.track.spotifyError, true);
		                	}
			            } else {
			            	self.artist.populate();
			            }
                    },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && trackmeta.spotify !== undefined &&
                        	trackmeta.spotify.track !== undefined) {
                            debug.trace(medebug,parent.nowplayingindex,"track was asked to display");
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

                function spotifyResponse(data) {
                    debug.trace(medebug, "Got Spotify Album Data");
                    debug.trace(medebug, data);
                    albummeta.spotify.album = data;
                    self.album.doBrowserUpdate();
                }

				return {

					populate: function() {
                        if (albummeta.spotify === undefined ||
                        	albummeta.spotify.album === undefined) {
				        	if (parent.playlistinfo.location.substring(0,8) !== 'spotify:') {
				        		self.album.doBrowserUpdate();
				        	} else {
	                			spotify.album.getInfo(albummeta.spotify.id, spotifyResponse,
                                    self.album.spotifyError, true);
	                		}
			            }
			        },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && albummeta.spotify !== undefined &&
                        	albummeta.spotify.album !== undefined) {
                            debug.trace(medebug,parent.nowplayingindex,"album was asked to display");
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

                var triedWithoutBrackets = false;

                function spotifyResponse(data) {
                    debug.trace(medebug, "Got Spotify Artist Data");
                    debug.trace(medebug, data);
                    artistmeta.spotify.artist = data;
                    self.artist.doBrowserUpdate();
                    self.album.populate();
                }

                function search(aname) {
                    if (parent.playlistinfo.type == "stream" && artistmeta.name == "" &&
                        trackmeta.name == "") {
                        debug.shout(medebug, "Searching Spotify for artist",albummeta.name)
                        spotify.artist.search(albummeta.name, searchResponse, searchFail, true);
                    } else {
                        debug.shout(medebug, "Searching Spotify for artist",aname)
                        spotify.artist.search(aname, searchResponse, searchFail, true);
                    }
                }

                function searchResponse(data) {
                    debug.trace(medebug,"Got Spotify Search Data",data);
                    var m = data.artists.href.match(/\?query=(.+?)\&/);
                    var match;
                    if (m && m[1]) {
                        match = decodeURIComponent(m[1]);
                        match = match.replace(/\+/g,' ');
                        debug.trace(medebug,"We searched for : ",match);
                        match = match.toLowerCase();
                    } else {
                        debug.warn(medebug, "Unable to match href for search artist name");
                        match = artistmeta.name.toLowerCase();
                    }
                    artistmeta.spotify.possibilities = new Array();
                    for (var i in data.artists.items) {
                        if (data.artists.items[i].name.toLowerCase() == match) {
                            artistmeta.spotify.possibilities.push({
                                name: data.artists.items[i].name,
                                id: data.artists.items[i].id,
                                image: (data.artists.items[i].images &&
                                    data.artists.items[i].images.length > 0) ?
                                data.artists.items[i].images[data.artists.items[i].images.length-1].url : null
                            });
                        }
                    }
                    if (artistmeta.spotify.possibilities.length > 0) {
                        artistmeta.spotify.currentposs = 0;
                        artistmeta.spotify.id = artistmeta.spotify.possibilities[0].id;
                        artistmeta.spotify.showing = "albums";
                    }
                    if (artistmeta.spotify.id === undefined) {
                        searchFail();
                    } else {
                        self.artist.populate();
                    }
                }

                function searchFail() {
                    debug.trace("SPOTIFY PLUGIN","Couldn't find anything for",artistmeta.name);
                    if (!triedWithoutBrackets) {
                        triedWithoutBrackets = true;
                        var test = artistmeta.name.replace(/ \(+.+?\)+$/, '');
                        if (test != artistmeta.name) {
                            debug.trace("SPOTIFY PLUGIN","Searching instead for",test);
                            search(test);
                            return;
                        }
                    }
                    artistmeta.spotify = { artist: {    error: '<h3 align="center">'+
                                                            language.gettext("label_noartistinfo")+
                                                            '</h3>',
                                                        name: artistmeta.name,
                                                        external_urls: { spotify: '' }
                                                    }
                                        };
                    self.artist.doBrowserUpdate();
                }

				return {

                    force: false,

					populate: function() {
						if (artistmeta.spotify.id === undefined) {
							search(artistmeta.name);
						} else {
	                        if (artistmeta.spotify.artist === undefined) {
		                		spotify.artist.getInfo(artistmeta.spotify.id, spotifyResponse,
                                    self.artist.spotifyError, true);
				            } else {
				            	self.album.populate();
				            }
				        }
			        },

                    spotifyError: function() {
                    	debug.error(medebug, "Spotify Error!");
                    },

                    doBrowserUpdate: function() {
                        if (displaying && artistmeta.spotify !== undefined &&
                        	artistmeta.spotify.artist !== undefined) {
                            debug.trace(medebug,parent.nowplayingindex,"artist was asked to display");
                            var accepted = browser.Update(
                            	null,
                            	'artist',
                            	me,
                            	parent.nowplayingindex,
                            	{ name: artistmeta.spotify.artist.name,
                                  link: artistmeta.spotify.artist.external_urls.spotify,
                                  data: getArtistHTML(artistmeta.spotify.artist, parent, artistmeta)
                                },
                                false,
                                self.artist.force
                            );
                            if (accepted && artistmeta.spotify.artist.error == undefined) {
                            	debug.trace(medebug,"Update was accepted by browser");
                            	if (artistmeta.spotify.artist.external_urls &&
                            		artistmeta.spotify.artist.external_urls.spotify) {
	                            	$.get('browser/backends/getspotibio.php?url='+
                                        artistmeta.spotify.artist.external_urls.spotify)
	                            		.done( function(data) {
	                            			if (displaying) $("#spartistinfo").html(data);
	                            		})
	                            		.fail( function() {
	                            			if (displaying) $("#spartistinfo").html("");
	                            		});
	                            	}
                            	if (artistmeta.spotify.showing == "albums") {
	                        		getAlbums();
	                        	} else {
	                        		getArtists();
	                        	}
                            }
                        }
                    }
				}
			}();
		}
	}
}();

nowplaying.registerPlugin("spotify", info_spotify, "icon-spotify-circled", "button_infospotify");
