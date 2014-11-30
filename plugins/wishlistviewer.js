var wishlistViewer = function() {

	var wlv = null;

	function removeTrackFromWl(element) {
	    var trackDiv = element.parent().parent();
	    var albumDiv = trackDiv.parent();
	    var albumHeaderDiv = albumDiv.prev();
	    var albumContainer = albumHeaderDiv.parent();
	    var artistDiv = albumContainer.parent();

	    var title = $(trackDiv.children()[0]).children('.expand').html();
	    var album = albumHeaderDiv.children('.expand').html();
	    album = album.replace(/\s*<span.*$/,'');
	    var artist = $(artistDiv.children()[0]).children('.expand').html();
	    debug.log("DB_TRACKS","Remove track from database",title,album,artist);
	    $.ajax({
	        url: "backends/sql/userRatings.php",
	        type: "POST",
	        data: {action: 'deletewl', artist: artist, album: album, title: title},
	        dataType: 'json',
	        success: function(rdata) {
	            debug.log("DB TRACKS","Track was removed");
	            if (rdata && rdata.hasOwnProperty('stats')) {
	                $("#fothergill").html(rdata.stats);
	            }
	            trackDiv.fadeOut('fast', function() {
	                trackDiv.remove();
	                if (albumDiv.children().length == 5) {
	                    // All album dropdowns contain 5 meta- children which are used for cache control
	                    // JQuery counts these as children
	                    debug.log("DB_TRACK", "Album Div Is Empty");
	                    albumDiv.remove();
	                    albumHeaderDiv.fadeOut('fast', function() {
	                        albumHeaderDiv.remove();
	                        if (albumContainer.children().length == 5) {
	                            debug.log("DB_TRACK", "Artist Div Is Empty");
	                            artistDiv.fadeOut('fast', function() {
	                                artistDiv.remove();
	                            });
	                        }
	                    });
	                    doDbCleanup();
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
	    var trackDiv = element.parent().parent().parent();
	    var albumDiv = trackDiv.parent();
	    var albumHeaderDiv = albumDiv.prev();
	    var albumContainer = albumHeaderDiv.parent();
	    var artistDiv = albumContainer.parent();
	    var title = unescapeHtml($(trackDiv.children()[0]).children('.expand').html());
	    var artist = unescapeHtml($(artistDiv.children()[0]).children('.expand').html());
	    debug.log("DB_TRACKS","Getting Buy Links For",title,artist);
	    makeWaitingIcon(element);
	    var bugger = element.parent();
	    lastfm.track.getBuylinks({track: title, artist: artist},
	    	function(data) {
	    		bugger.fadeOut('fast', function() {
		    		bugger.html('<div class="standout"><ul>'+getBuyHtml(data)+'</ul></div>');
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
	        	if (prefs.apache_backend != 'sql') {
		            $("#wlvfoldup").append('<h3 align="center">'+language.gettext("label_nosql")+'</h3>');
		            $("#wlvfoldup").append('<h3 align="center"><a href="http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>');
		            wlv.slideToggle('fast');
		            return;
	        	}
	            $("#wlvfoldup").append('<div id="wishlistlist"></div>');
	            $("#wishlistlist").load("albums.php?wishlist=1", function() {
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
addPlugin(language.gettext("label_viewwishlist"), "wishlistViewer.open()");