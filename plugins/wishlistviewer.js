var wishlistViewer = function() {

	var wlv = null;

	function removeTrackFromWl(element) {

		// Find the div containing the track title
		while (!element.hasClass('clicktrack')) {
			element = element.parent();
		}
		var trackDiv = element;
		var trackDivContainer = trackDiv.parent();
		var tracktitle = trackDiv.find('.expand').first().children('.fixed').first().html();

		var albumtitle = null;
		var artistname = null;
		var albumDiv = null;
		var artistDiv = null;

		var test = trackDiv.parent().attr('id');
		if (test.match(/wishlistartist/)) {
			artistDiv = trackDiv.parent().prev();
			artistAlbumContainer = trackDiv.parent();
			artistname = artistDiv.children('.expand').first().html();
		} else if (test.match(/wishlistalbum/)) {
			albumDiv = trackDiv.parent().prev();
			artistAlbumContainer = albumDiv.parent();
			albumtitle = albumDiv.children('.expand').first().html();
			artistDiv = albumDiv.parent().prev();
			artistname = artistDiv.children('.expand').first().html();
		} else {
			debug.error("WISHLIST","Couldn't parse layout!!");
            infobar.notify(infobar.ERROR, "Failed to remove track!");
			return false;
		}

	    debug.log("DB_TRACKS","Remove track from database",tracktitle,albumtitle,artistname);
	    // Note: The returninfo method we use for deleting collection tracks doesn't work here
	    // because that doesn't count albums where the tracks have no URI as visible albums.
	    // - which is what it needs to do. So we fudge.
	    $.ajax({
	        url: "backends/sql/userRatings.php",
	        type: "POST",
	        data: {action: 'deletewl', artist: artistname, album: albumtitle, title: tracktitle},
	        dataType: 'json',
	        success: function(rdata) {
	            debug.log("DB TRACKS","Track was removed");
	            trackDiv.fadeOut('fast', function() {
	                trackDiv.remove();
	                if (albumDiv) {
	                	if (trackDivContainer.children().length == 0) {
	                		debug.log("WISHLIST","Album Div is Empty");
	                		trackDivContainer.remove();
	                		albumDiv.remove();
	                	}
	                }
                	if (artistAlbumContainer.children().length == 0) {
                		debug.log("WISHLIST","Artist Has No More Tracks");
                		artistAlbumContainer.remove();
                		artistDiv.remove();
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
		// Find the div containing the track title
		var clickedElement = element;
		while (!element.hasClass('clicktrack')) {
			element = element.parent();
		}
		var trackDiv = element;
		var tracktitle = unescapeHtml(trackDiv.find('.expand').first().html());

		var test = trackDiv.parent().attr('id');
		if (test.match(/wishlistartist/)) {
			artistDiv = trackDiv.parent().prev();
		} else if (test.match(/wishlistalbum/)) {
			albumDiv = trackDiv.parent().prev();
			artistDiv = albumDiv.parent().prev();
		} else {
			debug.error("WISHLIST","Couldn't parse layout!!");
            infobar.notify(infobar.ERROR, "Failed to find links for track!");
			return false;
		}
		artistname = unescapeHtml(artistDiv.children('.expand').first().html());
	    debug.log("DB_TRACKS","Getting Buy Links For",tracktitle,artistname);
	    clickedElement.makeSpinner();
	    var bugger = clickedElement.parent();
	    lastfm.track.getBuylinks({track: tracktitle, artist: artistname},
	    	function(data) {
	    		bugger.fadeOut('fast', function() {
	    			// bugger.prev().removeClass('expand').addClass('fixed');
	    			bugger.removeClass('fixed').addClass('expand')
	    				.html('<div class="standout"><ul>'+lastfm.getBuyLinks(data)+'</ul></div>')
		    			.slideToggle('fast');
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