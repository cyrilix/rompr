var wishlistViewer = function() {

	var wlv = null;

	function removeTrackFromWl(element) {
	    var trackDiv = element.parent();
	    var albumDiv = trackDiv.parent();
	    var albumHeaderDiv = albumDiv.prev();
	    var albumContainer = albumHeaderDiv.parent();
	    var artistDiv = albumContainer.prev();

	    var title = trackDiv.children('.expand').html();
	    var album = albumHeaderDiv.children('.expand').html();
	    album = album.replace(/\s*<span.*$/,'');
	    var artist = artistDiv.children('.expand').html();
	    debug.log("DB_TRACKS","Remove track from database",title,album,artist);
	    // Note: The returninfo method we use for deleting collection tracks doesn't work here
	    // because that doesn't count albums where the tracks have no URI as visible albums.
	    // - which is what it needs to do. So we fudge.
	    $.ajax({
	        url: "backends/sql/userRatings.php",
	        type: "POST",
	        data: {action: 'deletewl', artist: artist, album: album, title: title},
	        dataType: 'json',
	        success: function(rdata) {
	            debug.log("DB TRACKS","Track was removed");
	            trackDiv.fadeOut('fast', function() {
	                trackDiv.remove();
	                if (albumDiv.children().length == 0) {
	                    debug.log("DB_TRACK", "Album Div Is Empty");
	                    albumDiv.remove();
	                    albumHeaderDiv.fadeOut('fast', function() {
	                        albumHeaderDiv.remove();
	                        if (albumContainer.children().length == 0) {
	                            debug.log("DB_TRACK", "Artist Div Is Empty");
	                            albumContainer.remove();
	                            artistDiv.fadeOut('fast', function() {
	                                artistDiv.remove();
	                            });
	                        }
	                    });
	                }
	            });
	        },
	        error: function() {
	            debug.log("DB TRACKS", "Failed to remove track");
	            infobar.notify(infobar.ERROR, "Failed to remove track!");
	        }
	    });
	}

	function getTrackBuyLinks(element) {
	    var trackDiv = element.parent().parent();
	    var artistDiv = trackDiv.parent().parent().prev();
	    var title = unescapeHtml(trackDiv.children('.expand').html());
	    var artist = unescapeHtml(artistDiv.children('.expand').html());
	    debug.log("DB_TRACKS","Getting Buy Links For",title,artist);
	    element.makeSpinner();
	    var bugger = element.parent();
	    lastfm.track.getBuylinks({track: title, artist: artist},
	    	function(data) {
	    		bugger.fadeOut('fast', function() {
		    		bugger.html('<div class="standout"><ul>'+lastfm.getBuyLinks(data)+'</ul></div>');
		    		bugger.slideToggle('fast');
	    		});
	    	},
	    	function(data) {
	    		bugger.html('No Buy Links Found');
                infobar.notify(infobar.NOTIFY, data.message);
	    	}
	    );
	}

	return {

		open: function() {

        	if (wlv == null) {
	        	wlv = browser.registerExtraPlugin("wlv", language.gettext("label_wishlist"), wishlistViewer);
	            $("#wlvfoldup").append('<div id="wishlistlist"></div>');
	            $("#wishlistlist").load("albums.php?wishlist=1", function() {
                    $("#wishlistlist").find('.menu').addClass("infoclick plugclickable");
                    $("#wishlistlist").find('.clickremdb').addClass("infoclick plugclickable").removeClass('clickable')
                            .prev().html('<i class="icon-basket-circled smallicon infoclick clickbuytrack plugclickable"></i>');
		            wlv.slideToggle('fast', function() {
			        	browser.goToPlugin("wlv");
		            });
		            $("#wishlistlist").find('.menu').addClass("infoclick plugclickable");
	            });
	        } else {
	        	browser.goToPlugin("wlv");
	        }

		},

		handleClick: function(element, event) {
			if (element.hasClass('menu')) {
				doAlbumMenu(event, element, true);
			} else if (element.hasClass('clickremdb')) {
				removeTrackFromWl(element);
			} else if (element.hasClass('clickbuytrack')) {
				getTrackBuyLinks(element);
			}
		},

		close: function() {
			wlv = null;
		}

	}

}();

pluginManager.addPlugin(language.gettext("label_viewwishlist"), wishlistViewer.open, null);