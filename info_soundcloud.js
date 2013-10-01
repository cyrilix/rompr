var info_soundcloud = function() {

	var me = "soundcloud";
	var tempcanvas = document.createElement('canvas');
	var scImg = new Image();

	function getTrackHTML(data) {

        debug.log("SOUNDCLOUD PLUGIN","Creating track HTML from",data);
        var html = '<div class="containerbox">';
        html = html + '<div class="fixed bright">';

        if (data.artwork_url) {
            html = html +  '<img src="' + data.artwork_url + '" class="clrboth" style="margin:8px" />';
        }
        html = html + '<ul><li><h3>Track Info:</h3></li>';
        html = html + '<li><b>Plays:</b> '+formatSCMessyBits(data.playback_count)+'</li>';
        html = html + '<li><b>Downloads:</b> '+formatSCMessyBits(data.download_count)+'</li>';
        html = html + '<li><b>Faves:</b> '+formatSCMessyBits(data.favoritings_count)+'</li>';
        html = html + '<li><b>State:</b> '+formatSCMessyBits(data.state)+'</li>';
        html = html + '<li><b>Genre:</b> '+formatSCMessyBits(data.genre)+'</li>';
        html = html + '<li><b>Label:</b> '+formatSCMessyBits(data.label_name)+'</li>';
        html = html + '<li><b>License:</b> '+formatSCMessyBits(data.license)+'</li>';
        if (data.purchase_url) {
            html = html + '<li><b><a href="' + data.purchase_url + '" target="_blank">Buy Track</a></b></li>';
        }
        html = html + '<li><a href="' + data.permalink_url + '" title="View In New Tab" target="_blank"><b>View on SoundCloud</b></a></li>';
        html = html + '</ul>';
        html = html + '</div>';

        html = html + '<div class="expand stumpy">';
		html = html + '<div id="similarartists" class="bordered" style="position:relative">'+
                    '<div id="scprog" class="infowiki" style="position:absolute;width:2px;top:0px;opacity:0.6;z-index:100;left:0px"></div>'+
                    '<canvas style="position:relative;left:64px" id="gosblin"></canvas>'+
                    '</div>';
        var d = formatSCMessyBits(data.description);
        d = d.replace(/\n/g, "</p><p>");
        html = html + '<p>'+d+'</p>';
        html = html + '</div>';
        html = html + '</div>';
        return html;

	}

	function getArtistHTML(data) {
        debug.log("SOUNDCLOUD PLUGIN","Creating artist HTML from",data);
        var html = '<div class="containerbox">';
        html = html + '<div class="fixed bright">';

        if (data.avatar_url) {
            html = html +  '<img src="' + data.avatar_url + '" class="clrboth" style="margin:8px" />';
        }
        html = html + '<ul><li><h3>SoundCloud User:</h3></li>';
        html = html + '<li><b>Full Name:</b> '+formatSCMessyBits(data.full_name)+'</li>';
        html = html + '<li><b>Country:</b> '+formatSCMessyBits(data.country)+'</li>';
        html = html + '<li><b>City:</b> '+formatSCMessyBits(data.city)+'</li>';
        if (data.website) {
            html = html + '<li><b><a href="' + data.website + '" target="_blank">Visit Website</a></b></li>';
        }
        html = html + '</ul>';
        html = html + '</div>';
        html = html + '<div class="expand stumpy">';
        var f = formatSCMessyBits(data.description)
        f = f.replace(/\n/g, "</p><p>");
        html = html + '<p>'+ f +'</p>';
        html = html + '</div>';
        html = html + '</div>';
		return html;
	}

    function formatSCMessyBits(bits) {
        try {
            if (bits) {
                return bits;
            } else {
                return "";
            }
        } catch(err) {
            return "";
        }
    }

	return {
		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent) {
			debug.log("SOUNDCLOUD PLUGIN", "Creating data collection");

			var self = this;
			var wi = 0;
			var displaying = false;

			this.displayData = function(waitingon) {
				displaying = true;
				self.artist.doBrowserUpdate();
				self.album.doBrowserUpdate();
				self.track.doBrowserUpdate();
			}

			this.stopDisplaying = function(waitingon) {
				displaying = false;
			}

			this.progressUpdate = function(percent) {
				self.track.updateProgress(percent);
			}

			this.artist = function() {

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.track.soundcloud.track.error) {
			                browser.Update('artist', me, parent.index, { name: "",
							                    					link: "",
							                    					data: null
						                						}
							);
						} else {
		            		if (parent.playlistinfo.metadata.artist.soundcloud.artist === undefined) {
		            			debug.log("SOUNDCLOUD PLUGIN","Artist is populating");
			                	soundcloud.getUserInfo(parent.playlistinfo.metadata.artist.soundcloud.id, self.artist.scResponseHandler);
			                }
						}
					},

					scResponseHandler: function(data) {
						parent.playlistinfo.metadata.artist.soundcloud.artist = data;
						self.artist.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.track.soundcloud.track !== undefined) {
							if (parent.playlistinfo.metadata.track.soundcloud.track.error) {
				                browser.Update('artist', me, parent.index, { name: "",
								                    					link: "",
								                    					data: null
							                						}
								);
							} else if (parent.playlistinfo.metadata.artist.soundcloud !== undefined &&
										parent.playlistinfo.metadata.artist.soundcloud.artist !== undefined) {
								if (parent.playlistinfo.metadata.artist.soundcloud.artist.error) {
									browser.Update('artist', me, parent.index, {	name: parent.playlistinfo.creator,
																				link: "",
																				data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.soundcloud.artist.error+'</h3>'
																			}
									);
								} else {
									var accepted = browser.Update('artist', me, parent.index, {	name: parent.playlistinfo.creator,
																				link: parent.playlistinfo.metadata.artist.soundcloud.artist.permalink_url,
																				data: getArtistHTML(parent.playlistinfo.metadata.artist.soundcloud.artist)
																			}
									);
								}
							}
							try {
								var image = parent.playlistinfo.metadata.track.soundcloud.track.artwork_url;
								if (!image) {
									image = parent.playlistinfo.metadata.artist.soundcloud.artist.avatar_url
								}
								nowplaying.setSoundCloudCorrections(parent.index, {
									creator: parent.playlistinfo.metadata.artist.soundcloud.artist.username,
									album: 'SoundCloud',
									title: parent.playlistinfo.metadata.track.soundcloud.track.title,
									image: image,
									origimage: image
								});
							} catch(err) {
								debug.warn("SOUNDCLOUD PLUGIN", "Not enough data to send corrections");
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

			// I do not have a pet alligator

			this.track = function() {

				return {

		            populate: function() {
		            	if (parent.playlistinfo.metadata.artist.soundcloud === undefined) {
		            		parent.playlistinfo.metadata.artist.soundcloud = {};
		            	}
		            	if (parent.playlistinfo.metadata.track.soundcloud === undefined) {
		            		parent.playlistinfo.metadata.track.soundcloud = {};
			            	var t = parent.playlistinfo.location;
			            	if (t.substring(0,11) !== 'soundcloud:') {
			            		parent.playlistinfo.metadata.track.soundcloud.track = {error: "This panel will only display information about music from SoundCloud"};
			            		self.artist.populate();
			            		self.track.doBrowserUpdate();
			            	} else {
		                		soundcloud.getTrackInfo(parent.playlistinfo.location, self.track.scResponseHandler);
			                }
			            } else {
			            	self.artist.populate();
			            }
		            },

	               scResponseHandler: function(data) {
		                debug.log("SOUNDCLOUD PLUGIN","Got SoundCloud Track Data:",data);
		                parent.playlistinfo.metadata.track.soundcloud.track = data;
		                parent.playlistinfo.metadata.artist.soundcloud.id = data.user_id;
		                self.artist.populate();
		                self.track.doBrowserUpdate();
		            },

		            doBrowserUpdate: function() {
						if (displaying  && parent.playlistinfo.metadata.track.soundcloud.track !== undefined) {
							debug.log("SOUNDCLOUD PLUGIN","Track was asked to display");
							if (parent.playlistinfo.metadata.track.soundcloud.track.error) {
								browser.Update('track', me, parent.index, {	name: parent.playlistinfo.title,
																		link: "",
																		data: '<h3 align="center">'+parent.playlistinfo.metadata.track.soundcloud.track.error+'</h3>'
																		}
								);
							} else {
								var accepted = browser.Update('track', me, parent.index, {	name: parent.playlistinfo.title,
																		link: parent.playlistinfo.metadata.track.soundcloud.track.permalink_url,
																		data: getTrackHTML(parent.playlistinfo.metadata.track.soundcloud.track)
																		}
								);
								if (accepted) {
							        scImg.onload = self.track.doSCImageStuff;
							        scImg.src = "getRemoteImage.php?url="+formatSCMessyBits(parent.playlistinfo.metadata.track.soundcloud.track.waveform_url);
								}
							}
						}
		            },

				    doSCImageStuff: function() {
				        var bgColor = $(".infowiki").css('background-color');
				        var rgbvals = /rgb\((.+),(.+),(.+)\)/i.exec(bgColor);
				        tempcanvas.width = scImg.width;
				        tempcanvas.height = scImg.height;
				        var ctx = tempcanvas.getContext("2d");
				        ctx.drawImage(scImg,0,0,tempcanvas.width,tempcanvas.height);
				        var pixels = ctx.getImageData(0,0,tempcanvas.width,tempcanvas.height);
				        var data = pixels.data;
				        for (var i = 0; i<data.length; i += 4) {
				            data[i] = parseInt(rgbvals[1]);
				            data[i+1] = parseInt(rgbvals[2]);
				            data[i+2] = parseInt(rgbvals[3]);
				        }
				        ctx.clearRect(0,0,tempcanvas.width,tempcanvas.height);
				        ctx.putImageData(pixels,0,0);
				        // We can't jump directly to the drawing of the image - we have to return from the
				        // onload routine first, otherwise the image width and height seem to get messed up
				        setTimeout(self.track.secondRoutine, 250);
				    },

				    checkSize: function() {
				    	// Browsers don't fire resize events when a div gets resized, hence we have to poll
				    	if ($("#similarartists").width() != wi) {
				    		self.track.drawSCWaveform()
				    	} else {
			                setTimeout(self.track.checkSize, 1000);
			            }
				    },

		           	secondRoutine: function() {
		    			if (displaying) {
			        		scImg.onload = self.track.drawSCWaveform;
			        		scImg.src = tempcanvas.toDataURL();
			    		}
		    		},

				    drawSCWaveform: function() {
				        if (displaying) {
				            wi = $("#similarartists").width();
				            w = Math.round(wi*0.95);
				            var l = Math.round((wi-w)/2);
				            var h = Math.round((w/scImg.width)*(scImg.height*0.7));
				            var c = document.getElementById("gosblin");
				            if (c) {
				                c.style.left = l.toString()+"px";
				                c.width = w;
				                c.height = h;
				                var ctx = c.getContext("2d");
				                ctx.clearRect(0,0,c.width,c.height);
				                var gradient = ctx.createLinearGradient(0,0,0,h);
				                gradient.addColorStop(0,'#ff6600');
				                gradient.addColorStop(0.5,'#882200');
				                gradient.addColorStop(1,'#222222');
				                ctx.fillStyle = gradient;
				                ctx.fillRect(0,0,w,h);
				                ctx.drawImage(scImg,0,0,w,h);
				                $("#scprog").css({height: h.toString()+"px"});
				                setTimeout(self.track.checkSize, 1000);
				            }
				        }
				    },

					updateProgress: function(percent) {
						if (displaying) {
						    var p = $("#gosblin").position();
						    if (p) {
						        var w = Math.round($("#gosblin").width()*percent/100)+p.left;
						        $("#scprog").stop().animate({left: w.toString()+"px"}, 1000, "linear");
						    }
						}
					}
				}
			}();

			self.track.populate();
		}

	}

}();

nowplaying.registerPlugin("soundcloud", info_soundcloud, "newimages/soundcloud-logo.png", "Info Panel (Soundcloud)");
