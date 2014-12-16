var info_file = function() {

	var me = "file";

	function createInfoFromPlayerInfo(info) {

        var html = "";
        var file = unescape(info.file);
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
        if (info.file) {
            var f = info.file.match(/^podcast[\:|\+](http.*?)\#/);
            if (f && f[1]) {
                html = html + '<button class="sourceform" onclick="podcasts.doPodcast(\'filepodiput\')">'+language.gettext('button_subscribe')+'</button>'+
                                '<input type="hidden" id="filepodiput" value="'+f[1]+'" />';
            }
        }
        html = html + '</td></tr>';
        if (filetype != "") {
            html = html + '<tr><td class="fil">'+language.gettext("info_format")+'</td><td>'+filetype+'</td></tr>';
        }
        if (info.bitrate && info.bitrate != 'None' && info.bitrate != 0) {
            html = html + '<tr><td class="fil">'+language.gettext("info_bitrate")+'</td><td>'+info.bitrate+'</td></tr>';
        }
        var ai = info.audio;
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
        if (info.Date) html = html + '<tr><td class="fil">'+language.gettext("info_date")+'</td><td>'+info.Date+'</td></tr>';

        if (info.Genre) html = html + '<tr><td class="fil">'+language.gettext("info_genre")+'</td><td>'+info.Genre+'</td></tr>';

        if (info.Performer) {
            html = html + '<tr><td class="fil">'+language.gettext("info_performers")+'</td><td>'+joinartists(info.Performer)+'</td></tr>';
        }
        if (info.Composer) {
            html = html + '<tr><td class="fil">'+language.gettext("info_composers")+'</td><td>'+joinartists(info.Composer)+'</td></tr>';
        }
        if (info.Comment) html = html + '<tr><td class="fil">'+language.gettext("info_comment")+'</td><td>'+info.Comment+'</td></tr>';
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

		collection: function(parent, artistmeta, albummeta, trackmeta) {

			debug.log("FILE PLUGIN", "Creating data collection");

			var self = this;
			var displaying = false;

			this.displayData = function() {
				displaying = true;
				self.doBrowserUpdate();
                browser.Update(null, 'album', me, parent.nowplayingindex,
                                { name: "", link: "", data: null }
                );
                browser.Update(null, 'artist', me, parent.nowplayingindex,
                                { name: "", link: "", data: null }
                );
			}

			this.stopDisplaying = function() {
				displaying = false;
			}

            this.handleClick = function(source, element, event) {
                if (element.hasClass("clicksetrating")) {
                    nowplaying.setRating(event);
                } else if (element.hasClass("clickremtag")) {
                    nowplaying.removeTag(event, parent.nowplayingindex);
                } else if (element.hasClass("clickaddtags")) {
                    tagAdder.show(event, parent.nowplayingindex);
                }
            }

			this.populate = function() {
                if (trackmeta.fileinfo === undefined) {
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
                    debug.mark("FILE PLUGIN",parent.nowplayingindex,"is already populated");
                }
		    }

		    this.updateFileInformation = function() {
                trackmeta.fileinfo = {beets: null, player: cloneObject(player.status)};
		    	trackmeta.lyrics = null;
                player.controller.checkProgress();
		    	self.doBrowserUpdate();
		    }

            this.updateBeetsInformation = function(thing) {
                // Get around possible same origin policy restriction by using a php script
                $.getJSON('browser/backends/getBeetsInfo.php', 'uri='+thing)
                .done(function(data) {
                    debug.log("FILE PLUGIN",'Got info from beets server',data);
                    trackmeta.fileinfo = {beets: data, player: null};
                    if (data.lyrics) {
                        trackmeta.lyrics = data.lyrics;
                    } else {
                        trackmeta.lyrics = null;
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
                if (trackmeta.usermeta) {
                    if (trackmeta.usermeta.Playcount) {
                        html = html + '<tr><td class="fil">Play Count:</td><td>'+trackmeta.usermeta.Playcount;
                        html = html + '</td></tr>';
                    }
                    html = html + '<tr><td class="fil">Rating:</td><td><img class="infoclick clicksetrating" height="20px" src="newimages/'+trackmeta.usermeta.Rating+'stars.png" />';
                    html = html + '<input type="hidden" value="'+parent.nowplayingindex+'" />';
                    html = html + '</td></tr>';
                    html = html + '<tr><td class="fil" style="vertical-align:top">Tags:</td><td>';
                    html = html + '<table>';
                    for(var i = 0; i < trackmeta.usermeta.Tags.length; i++) {
                        html = html + '<tr><td><span class="tag">'+trackmeta.usermeta.Tags[i]+'<span class="tagremover"><a href="#" class="clicktext infoclick clickremtag">x</a></span></span></td></tr>';
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
				if (displaying && trackmeta.fileinfo !== undefined) {
                    var data = (trackmeta.fileinfo.player !== null) ? createInfoFromPlayerInfo(trackmeta.fileinfo.player) : createInfoFromBeetsInfo(trackmeta.fileinfo.beets);
                    data = data + self.ratingsInfo();
	                browser.Update(
                        null,
                        'track',
                        me,
                        parent.nowplayingindex,
                        { name: trackmeta.name,
	                      link: "",
	                      data: data
	                	}
					);
				}
			}
		}
	}
}();

nowplaying.registerPlugin("file", info_file, ipath+"audio-x-generic.png", "button_fileinfo");
