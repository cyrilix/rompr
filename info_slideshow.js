var info_slideshow = function() {

	var me = "slideshow";

	return {
        getRequirements: function(parent) {
            return [];
        },

		collection: function(parent) {

			debug.log("SLIDESHOW PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

			this.displayData = function() {
				displaying = true;
				if (!($("#infopane").hasClass('infoslideshow'))) {
					$("#infopane").addClass('infoslideshow');
				}
				self.artist.doBrowserUpdate();
				self.album.doBrowserUpdate();
				self.track.doBrowserUpdate();
			}

			this.stopDisplaying = function(waitingon) {
				if (waitingon.artist) {
					displaying = false;
					if (parent.playlistinfo.metadata.artist.slideshow !== undefined) {
						parent.playlistinfo.metadata.artist.slideshow.teardown();
					}
					$("#infopane").removeClass('infoslideshow');
				}
			}

			this.artist = function() {

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.artist.images === undefined) {
							debug.log("SLIDESHOW PLUGIN",parent.index,"artist is populating",parent.playlistinfo.creator);
					        lastfm.artist.getImages({ artist: parent.playlistinfo.creator }, self.artist.lfmResponseHandler, self.artist.noImages);
					    } else {
							debug.log("SLIDESHOW PLUGIN",parent.index,"artist is already populated",parent.playlistinfo.creator);
					    }
					},

					lfmResponseHandler: function(data) {
		                if (data) {
		                	if (data.images.image) {
		                		var simages = new Array();
                    			var imagedata = getArray(data.images.image);
                    			debug.debug("SLIDESHOW PLUGIN","Image Array",imagedata);
                    			for(var i in imagedata) {
                        			simages.push(imagedata[i].sizes.size[0]["#text"]);
                    			}
		                        parent.playlistinfo.metadata.artist.images = simages;
		                        self.artist.doBrowserUpdate();
		                    } else {
		                    	self.artist.noImages();
		                    }
		                } else {
	                        self.artist.noImages();
		                }
					},

					noImages: function() {
                        parent.playlistinfo.metadata.artist.images = {error: 'No Images Found For '+parent.playlistinfo.creator};
                        self.artist.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.artist.images !== undefined) {
							debug.log("SLIDESHOW PLUGIN",parent.index,"artist was asked to display");
							if (parent.playlistinfo.metadata.artist.images.error) {
		                        browser.Update('artist', me, parent.index, { name: "",
		                                            					 link: "",
		                                            					 data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.images.error+'</h3>'
		                                        						}
		                        );
							} else {
								// Cheat slightly
		                        var accepted = browser.Update('artist', me, parent.index, { name: "",
		                                            					 link: "",
		                                            					 data: null
		                                        						}
		                        );
		                        debug.log("SLIDESHOW PLUGIN","Creating Projector");
		                        if (parent.playlistinfo.metadata.artist.slideshow === undefined) {
		                        	parent.playlistinfo.metadata.artist.slideshow = new slideshow(parent.playlistinfo.metadata.artist.images, 'infopane', true);
		                        }
		                        if (accepted) {
		                        	parent.playlistinfo.metadata.artist.slideshow.Go();
		                        }

							}
						}

					}

				}
			}();

			this.album = function() {

				return {

					doBrowserUpdate: function() {
						if (displaying) {
	                        browser.Update('album', me, parent.index, { name: "",
	                                            					link: "",
	                                            					data: null
	                                        						}
							);
						}
					}
				}
			}();

			this.track = function() {

				return {

					doBrowserUpdate: function() {
						if (displaying) {
	                        browser.Update('track', me, parent.index, { name: "",
	                                            					link: "",
	                                            					data: null
	                                        						}
							);
						}
					}
				}

			}();

			self.artist.populate();
		}
	}

}();

nowplaying.registerPlugin("slideshow", info_slideshow, "images/slideshow.png", "Info Panel (Slideshow)");
