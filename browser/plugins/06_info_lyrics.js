var info_lyrics = function() {

	var me = "lyrics";

	return {
		getRequirements: function(parent) {
			return ['file'];
		},

		collection: function(parent) {

			debug.log("LYRICS PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

			function formatLyrics(data) {
				debug.log("LYRICS PLUGIN","Formatting Lyrics");
				data = data.replace(/^(\w)/, '<font size="120%">$1</font>')
				data = data.replace(/\n/g, '<br>');
				return '<div class="lyrics"><h2>'+language.gettext("lyrics_lyrics")+'</h2><p>'+data+'</p></div>';
			}

			this.displayData = function() {
				displaying = true;
                browser.Update('album', me, parent.index, { name: "",
                    					link: "",
                    					data: null
                						}
				);
                browser.Update('artist', me, parent.index, { name: "",
                    					link: "",
                    					data: null
                						}
				);
				self.doBrowserUpdate();
			}

			this.stopDisplaying = function() {
				displaying = false;
			}

            this.startAfterSpecial = function() {

            }

            this.tryReadingTags = function() {
            	$.get("getLyrics.php?file="+encodeURIComponent(player.status.file))
            		.done(function(data) {
            			parent.playlistinfo.metadata.track.lyrics = data;
            			self.doBrowserUpdate();
            		});
            }

			this.populate = function() {
				if (parent.playlistinfo.metadata.track.lyrics === undefined) {
					debug.log("LYRICS PLUGIN",parent.index,"No lyrics yet, trying again in 1 second");
					setTimeout(self.populate, 1000);
					return;
				}
				if (parent.playlistinfo.metadata.track.lyrics === null) {
					self.tryReadingTags();
				} else {
					self.doBrowserUpdate();
				}

		    }

			this.doBrowserUpdate = function() {
				if (displaying && parent.playlistinfo.metadata.track.lyrics !== undefined) {
	                browser.Update('track', me, parent.index, { name: parent.playlistinfo.title,
	                    					link: "",
	                    					data: formatLyrics(parent.playlistinfo.metadata.track.lyrics)
	                						}
					);
				}
			}

			self.populate();

		}

	}


}();

nowplaying.registerPlugin("lyrics", info_lyrics, "newimages/lyrics.jpg", "button_lyrics");
