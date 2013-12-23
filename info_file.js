var info_file = function() {

	var me = "file";

	function createInfoFromPlayerInfo() {

        var html = "";
        var file = unescape(player.status.file);
        if (!file) { return "" }
        file = file.replace(/^file:\/\//, '');
        var filetype = "";
        if (file) {
            var n = file.match(/.*\.(.*?)$/);
            if (n) {
                filetype = n[n.length-1];
                filetype = filetype.toLowerCase();
            }
        } else {
            return "";
        }
        html = html + '<div class="indent"><table><tr><td class="fil">'+language.gettext("info_file")+'</td><td>'+file;
        if (file.match(/^http:\/\/.*item\/\d+\/file/)) {
            html = html + ' <i>'+language.gettext("info_from_beets")+'</i>';
        }
        if (filetype != "") {
            html = html + '<tr><td class="fil">'+language.gettext("info_format")+'</td><td>'+filetype+'</td></tr>';
        }
        if (player.status.bitrate && player.status.bitrate != 'None') {
            html = html + '<tr><td class="fil">'+language.gettext("info_bitrate")+'</td><td>'+player.status.bitrate+'</td></tr>';
        }
        var ai = player.status.audio;
        if (ai) {
            var p = ai.split(":");
            html = html + '<tr><td class="fil">'+language.gettext("info_samplerate")+'</td><td>'+p[0]+' Hz, '+p[1]+' Bit, ';
            if (p[2] == 1) {
                html = html + language.gettext("info_mono");
            } else if (p[2] == 2) {
                html = html + language.gettext("info_stereo");
            } else {
                html = html + p[2]+' '+language.gettext("info_channels");
            }
            '</td></tr>';
        }
        if (player.status.Date) {
            html = html + '<tr><td class="fil">'+language.gettext("info_date")+'</td><td>'+player.status.Date+'</td></tr>';
        }
        if (player.status.Genre) {
            html = html + '<tr><td class="fil">'+language.gettext("info_genre")+'</td><td>'+player.status.Genre+'</td></tr>';
        }
        if (player.status.performers) {
            html = html + '<tr><td class="fil">'+language.gettext("info_performers")+'</td><td>'+player.status.performers+'</td></tr>';
        }
        if (player.status.composers) {
            html = html + '<tr><td class="fil">'+language.gettext("info_composers")+'</td><td>'+player.status.composers+'</td></tr>';
        }
        if (player.status.comment) {
            html = html + '<tr><td class="fil">'+language.gettext("info_comment")+'</td><td>'+player.status.comment+'</td></tr>';
        }
        html = html + '</table></div>';
        playlist.checkProgress();
        setBrowserIcon(filetype);
        return html;
    }

	function createInfoFromBeetsInfo(data) {

        var html = "";
        var file = unescape(player.status.file);
        if (!file) { return "" }
        html = html + '<div class="indent"><table class="motherfucker"><tr><td class="fil">'+language.gettext("info_file")+'</td><td>'+file;
        html = html + ' <i>'+language.gettext("info_from_beets")+'</i>';
        html = html +'</td></tr>';
        html = html + '<tr><td class="fil">'+language.gettext("info_format")+'</td><td>'+data.format+'</td></tr>';
        if (data.bitrate) {
            html = html + '<tr><td class="fil">'+language.gettext("info_bitrate")+'</td><td>'+data.bitrate+'</td></tr>';
        }
        html = html + '<tr><td class="fil">'+language.gettext("info_samplerate")+'</td><td>'+data.samplerate+' Hz, '+data.bitdepth+' Bit, ';
        if (data.channels == 1) {
            html = html + language.gettext("info_mono");
        } else if (data.channels == 2) {
            html = html +language.gettext("info_stereo");
        } else {
            html = html + data.channels +' '+language.gettext("info_channels");
        }
        html = html + '</td></tr>';
        if (data.year) {
            html = html + '<tr><td class="fil">'+language.gettext("info_year")+'</td><td>'+data.year+'</td></tr>';
        }
        if (data.composer) {
            html = html + '<tr><td class="fil">'+language.gettext("info_composers")+'</td><td>'+data.composer+'</td></tr>';
        }
        if (data.genre) {
            html = html + '<tr><td class="fil">'+language.gettext("info_genre")+'</td><td>'+data.genre+'</td></tr>';
        }
        if (data.label) {
            html = html + '<tr><td class="fil">'+language.gettext("info_label")+'</td><td>'+data.label+'</td></tr>';
        }
        if (data.comments) {
            html = html + '<tr><td class="fil">'+language.gettext("info_comment")+'</td><td>'+data.comments+'</td></tr>';
        }
        if (data.disctitle) {
            html = html + '<tr><td class="fil">'+language.gettext("info_disctitle")+'</td><td>'+data.disctitle+'</td></tr>';
        }
        if (data.encoder) {
            html = html + '<tr><td class="fil">'+language.gettext("info_encoder")+'</td><td>'+data.encoder+'</td></tr>';
        }
        html = html + '</table></div>';
        setBrowserIcon(data.format);
        return html;
    }

    function setBrowserIcon(filetype) {
        switch(filetype) {
            case "mp3":
            case "MP3":
                browser.setPluginIcon(me, "newimages/mp3-audio.jpg");
                break;

            case "mp4":
            case "m4a":
            case "aac":
            case "MP4":
            case "M4A":
            case "AAC":
                browser.setPluginIcon(me, "newimages/aac-audio.jpg");
                break;

            case "flac":
            case "FLAC":
                browser.setPluginIcon(me, "newimages/flac-audio.jpg");
                break;

            default:
            	browser.setPluginIcon(me, "newimages/audio-x-generic.png");
            	break;
        }
    }

	return {
		getRequirements: function(parent) {
			return [];
		},

		collection: function(parent) {

			debug.log("FILE PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

			this.displayData = function() {
				displaying = true;
				self.doBrowserUpdate();
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
			}

			this.stopDisplaying = function() {
				displaying = false;
			}

			this.populate = function() {
                if (parent.playlistinfo.metadata.track.fileinfo === undefined) {
    				var file = parent.playlistinfo.location;
    				var m = file.match(/(^http:\/\/.*item\/\d+)\/file/)
    		        if (m && m[1]) {
    		        	debug.log("FILE PLUGIN","File is from beets server",m[1]);
    		        	// Get around possible same origin policy restriction by using a php script
    		        	$.getJSON('getBeetsInfo.php', 'uri='+m[1])
    		        	.done(function(data) {
    		            	debug.log("FILE PLUGIN",'Got info from beets server',data);
    		            	parent.playlistinfo.metadata.track.fileinfo = createInfoFromBeetsInfo(data);
    		            	if (data.lyrics) {
    		            		parent.playlistinfo.metadata.track.lyrics = data.lyrics;
    		            	} else {
    		            		parent.playlistinfo.metadata.track.lyrics = null;
    		            	}
    		            	self.doBrowserUpdate();

    			        })
    			        .fail( function() {
    			            debug.fail("FILE PLUGIN", "Error getting info from beets server");
    			            self.updateFileInformation();
    			        });

    		        } else {
        	            setTimeout(function() {
                    		player.mpd.command("", self.updateFileInformation)
                		}, 3000);
    		        }
                } else {
                    debug.mark("FILE PLUGIN",parent.index,"is already populated");
                }
		    }

		    this.updateFileInformation = function() {
		    	parent.playlistinfo.metadata.track.fileinfo = createInfoFromPlayerInfo();
		    	parent.playlistinfo.metadata.track.lyrics = null;
                playlist.checkProgress();
		    	self.doBrowserUpdate();
		    }


			this.doBrowserUpdate = function() {
				if (displaying && parent.playlistinfo.metadata.track.fileinfo !== undefined) {
	                browser.Update('track', me, parent.index, { name: parent.playlistinfo.title,
	                    					link: "",
	                    					data: parent.playlistinfo.metadata.track.fileinfo
	                						}
					);
				}
			}

			self.populate();

		}
	}
}();

nowplaying.registerPlugin("file", info_file, "newimages/audio-x-generic.png", "button_fileinfo");
