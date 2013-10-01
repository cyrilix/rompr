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
				return '<div class="lyrics"><h2>Lyrics</h2><p>'+data+'</p></div>';
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

			this.populate = function() {
				if (parent.playlistinfo.metadata.track.lyrics === undefined) {
					debug.log("LYRICS PLUGIN",parent.index,"No lyrics yet, trying again in 1 second");
					setTimeout(self.populate, 1000);
					return;
				}
				if (parent.playlistinfo.metadata.track.lyrics === null) {
					parent.playlistinfo.metadata.track.lyrics = '<h3 align=center>No Lyrics were found</h3><p>To use the lyrics viewer, you need to use Mopidy with a Beets server and ensure your files are tagged with lyrics</p>';
				}
				self.doBrowserUpdate()
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

nowplaying.registerPlugin("lyrics", info_lyrics, "newimages/lyrics.jpg", "Info Panel (Lyrics)");
