var info_file = function() {

	var me = "file";

	function createInfoFromPlayerInfo() {

        var html = "";
        var file = unescape(player.status.file);
        file = file.replace(/^file:\/\//, '');
        var filetype = "";
        if (file) {
            var n = file.match(/.*\.(.*?)$/);
            if (n) {
                filetype = n[n.length-1];
                filetype = filetype.toLowerCase();
            }
        }
        if (file == "null") file = "";
        html = html + '<div class="indent"><table><tr><td class="fil">'+language.gettext("info_file")+'</td><td>'+file;
        if (file.match(/^http:\/\/.*item\/\d+\/file/)) html = html + ' <i>'+language.gettext("info_from_beets")+'</i>';
        if (player.status.file) {
            var f = player.status.file.match(/^podcast\:(http.*?)\#/);
            if (f && f[1]) {
                html = html + '<button class="sourceform" onclick="podcasts.doPodcast(\'filepodiput\')">'+language.gettext('button_subscribe')+'</button>'+
                                '<input type="hidden" id="filepodiput" value="'+f[1]+'" />';
            }
        }
        html = html + '</td></tr>';
        if (filetype != "") {
            html = html + '<tr><td class="fil">'+language.gettext("info_format")+'</td><td>'+filetype+'</td></tr>';
        }
        if (player.status.bitrate && player.status.bitrate != 'None' && player.status.bitrate != 0) {
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
        if (player.status.Date) html = html + '<tr><td class="fil">'+language.gettext("info_date")+'</td><td>'+player.status.Date+'</td></tr>';

        if (player.status.Genre) html = html + '<tr><td class="fil">'+language.gettext("info_genre")+'</td><td>'+player.status.Genre+'</td></tr>';

        if (player.status.performers) {
            var text = player.status.performers;
            if (typeof(player.status.performers) == "object") {
                var t = new Array();
                for (var i in player.status.performers) {
                    t.push(player.status.performers[i].name);
                }
                text = t.join(' & ');
            }
            html = html + '<tr><td class="fil">'+language.gettext("info_performers")+'</td><td>'+text+'</td></tr>';
        }
        if (player.status.composers) {
            var text = player.status.composers;
            if (typeof(player.status.composers) == "object") {
                var t = new Array();
                for (var i in player.status.composers) {
                    t.push(player.status.composers[i].name);
                }
                text = t.join(' & ');
            }
            html = html + '<tr><td class="fil">'+language.gettext("info_composers")+'</td><td>'+text+'</td></tr>';
        }
        if (player.status.Comment) html = html + '<tr><td class="fil">'+language.gettext("info_comment")+'</td><td>'+player.status.Comment+'</td></tr>';
        setBrowserIcon(filetype);
        return html;
    }

	function createInfoFromBeetsInfo(data) {

        var html = "";
        var file = unescape(player.status.file);
        var gibbons = [ 'year', 'genre', 'label', 'disctitle', 'encoder'];
        if (!file) { return "" }
        html = html + '<div class="indent"><table class="motherfucker"><tr><td class="fil">'+language.gettext("info_file")+'</td><td>'+file;
        html = html + ' <i>'+language.gettext("info_from_beets")+'</i>';
        html = html +'</td></tr>';
        html = html + '<tr><td class="fil">'+language.gettext("info_format")+'</td><td>'+data.format+'</td></tr>';
        if (data.bitrate)  html = html + '<tr><td class="fil">'+language.gettext("info_bitrate")+'</td><td>'+data.bitrate+'</td></tr>';
        html = html + '<tr><td class="fil">'+language.gettext("info_samplerate")+'</td><td>'+data.samplerate+' Hz, '+data.bitdepth+' Bit, ';
        if (data.channels == 1) {
            html = html + language.gettext("info_mono");
        } else if (data.channels == 2) {
            html = html +language.gettext("info_stereo");
        } else {
            html = html + data.channels +' '+language.gettext("info_channels");
        }
        html = html + '</td></tr>';
        $.each(gibbons, function (i,g) {
            if (data[g]) html = html + '<tr><td class="fil">'+language.gettext("info_"+g)+'</td><td>'+data[g]+'</td></tr>';
        });
        if (data.composer) html = html + '<tr><td class="fil">'+language.gettext("info_composers")+'</td><td>'+data.composer+'</td></tr>';
        if (data.comments) html = html + '<tr><td class="fil">'+language.gettext("info_comment")+'</td><td>'+data.comments+'</td></tr>';
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
            	browser.setPluginIcon(me, ipath+"audio-x-generic.png");
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

            this.handleClick = function(source, element, event) {
                if (element.hasClass("clicksetrating")) {
                    nowplaying.setRating(event);
                } else if (element.hasClass("clickremtag")) {
                    nowplaying.removeTag(event, parent.index);
                } else if (element.hasClass("clickaddtags")) {
                    tagAdder.show(event, parent.index);
                }
            }

			this.populate = function() {
                if (parent.playlistinfo.metadata.track.fileinfo === undefined) {
    				var file = parent.playlistinfo.location;
    				var m = file.match(/(^http:\/\/.*item\/\d+)\/file/)
    		        if (m && m[1]) {
    		        	debug.log("FILE PLUGIN","File is from beets server",m[1]);
                        self.updateBeetsInformation(m[1]);
    		        } else {
        	            setTimeout(function() {
                    		player.controller.command("", self.updateFileInformation)
                		}, 1000);
    		        }
                } else {
                    debug.mark("FILE PLUGIN",parent.index,"is already populated");
                }
		    }

		    this.updateFileInformation = function() {
                parent.playlistinfo.metadata.track.fileinfo = {beets: null, player: true};
		    	parent.playlistinfo.metadata.track.lyrics = null;
                player.controller.checkProgress();
		    	self.doBrowserUpdate();
		    }

            this.updateBeetsInformation = function(thing) {
                // Get around possible same origin policy restriction by using a php script
                $.getJSON('getBeetsInfo.php', 'uri='+thing)
                .done(function(data) {
                    debug.log("FILE PLUGIN",'Got info from beets server',data);
                    parent.playlistinfo.metadata.track.fileinfo = {beets: data, player: false};
                    if (data.lyrics) {
                        parent.playlistinfo.metadata.track.lyrics = data.lyrics;
                    } else {
                        parent.playlistinfo.metadata.track.lyrics = null;
                    }
                    self.doBrowserUpdate();

                })
                .fail( function() {
                    debug.error("FILE PLUGIN", "Error getting info from beets server");
                    self.updateFileInformation();
                });
            }

            this.ratingsInfo = function() {
                var html = "";
                if (parent.playlistinfo.metadata.track.usermeta) {
                    if (parent.playlistinfo.metadata.track.usermeta.Playcount) {
                        html = html + '<tr><td class="fil">Play Count:</td><td>'+parent.playlistinfo.metadata.track.usermeta.Playcount;
                        html = html + '</td></tr>';
                    }
                    html = html + '<tr><td class="fil">Rating:</td><td><img class="infoclick clicksetrating" height="20px" src="newimages/'+parent.playlistinfo.metadata.track.usermeta.Rating+'stars.png" />';
                    html = html + '<input type="hidden" value="'+parent.index+'" />';
                    html = html + '</td></tr>';
                    html = html + '<tr><td class="fil" style="vertical-align:top">Tags:</td><td>';
                    html = html + '<table>';
                    for(var i = 0; i < parent.playlistinfo.metadata.track.usermeta.Tags.length; i++) {
                        html = html + '<tr><td><span class="tag">'+parent.playlistinfo.metadata.track.usermeta.Tags[i]+'<span class="tagremover"><a href="#" class="clicktext infoclick clickremtag">x</a></span></span></td></tr>';
                    }
                    html = html + '<tr><td><a href="#" class="infoclick clickaddtags">ADD TAGS</a></td></tr>';
                    html = html + '</table>';
                    html = html + '</td></tr>';
                }
                html = html + '</table>';
                html = html + '</div>';
                return html;
            }

			this.doBrowserUpdate = function() {
				if (displaying && parent.playlistinfo.metadata.track.fileinfo !== undefined) {
                    var data = (parent.playlistinfo.metadata.track.fileinfo.player) ? createInfoFromPlayerInfo() : createInfoFromBeetsInfo(parent.playlistinfo.metadata.track.fileinfo.beets);
                    data = data + self.ratingsInfo();
	                browser.Update('track', me, parent.index, { name: parent.playlistinfo.title,
	                    					link: "",
	                    					data: data
	                						}
					);
				}
			}

			self.populate();

		}
	}
}();

nowplaying.registerPlugin("file", info_file, ipath+"audio-x-generic.png", "button_fileinfo");
