var info_lastfm = function() {

	var me = "lastfm";
    var medebug = "LASTFM PLUGIN";

    function formatLastFmError(lfmdata) {
        return '<h3 align="center">'+lfmdata.error()+'</h3>';
    }

    function sectionHeader(data) {
        var html = '<div class="holdingcell">';
        html = html + '<div class="standout stleft statsbox"><ul>';
        html = html + '<li><b>Listeners:</b> '+data.listeners()+'</li>';
        html = html + '<li><b>Plays:</b> '+data.playcount()+'</li>';
        html = html + '<li><b>Your Plays:</b> '+data.userplaycount()+'</li>';
        return html;
    }

    function doTags(taglist) {
    	debug.debug(medebug,"    Doing Tags");
        var html = '<ul><li><b>TOP TAGS:</b></li><li><table width="100%">';
        for(var i in taglist) {
            html = html + '<tr><td><a href="'+taglist[i].url+'" target="_blank">'+taglist[i].name+'</a></td>';
            html = html + '<td align="right"><a href="#" title="Play Tag Radio Station" onclick="doLastFM(\'lastfmglobaltag\', \''+taglist[i].name+'\')"><img style="vertical-align:middle" src="newimages/start.png" height="12px"></a></td></tr>';
        }
        html = html + '</table></li></ul>';
        return html;
    }

    function formatBio(bio, link) {
    	debug.debug(medebug,"    Formatting Bio");
        if (bio) {
            bio = bio.replace(/\n/g, "</p><p>");
            bio = bio.replace(/(<a .*?href="http:\/\/.*?")/g, '$1 target="_blank"');
            if (link) {
                link = link.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
                var re = new RegExp("<a href=\""+link+"\" target=\"_blank\">Read more about.*?</a>");
                bio = bio.replace(re, '<a href="#" class="infoclick clickbiolink">Read Full Biography</a>');
            }
            return bio;
        } else {
            return "";
        }
    }

    function tagsInput(type) {
        var html = '<ul class="holdingcell"><li><b>ADD TAGS</b></li>';
        html = html + '<li class="tiny">Add tags, comma-separated</li>';
        html = html + '<li><input class="enter tiny inbrowser" type="text"></input>';
        html = html + '<button class="infoclick clickaddtags tiny">ADD</button>'+
                        '<img class="tright waiting" id="tagadd'+type+'" height="20px" src="newimages/transparent-32x32.png"></li></ul>';
        return html;
    }

    function doUserTags(name) {
        var html = '<ul><li><b>YOUR TAGS:</b></li><li><table name="'+name+'tagtable" width="100%">';
        html = html + '</table></li></ul>';
        return html;
    }

    function findTag(name, taglist) {
        for(var i in taglist) {
            if (name == taglist[i].name) {
                debug.debug("FINDTAG", "Found tag",name);
                return true;
            }
        }
        return false;
    }

    function findTag2(name, table) {
        var retval = false;
        table.find('tr').each( function() {
            if ($(this).find('a').text() == name) {
                debug.debug("FINDTAG 2",'Found Tag',name);
                retval = true;
            }
        });
        return retval;
    }

    function appendTag(table, name, url) {
        var html = '<tr class="newtag"><td><a href="'+url+'" target="_blank">'+name+'</a></td>';
        html = html + '<td><img class="infoclick clickremovetag" style="vertical-align:middle" src="newimages/edit-delete.png" height="12px"></td>';
        html = html + '<td align="right"><img class="clickicon" style="vertical-align:middle" onclick="doLastFM(\'lastfmglobaltag\', \''+name+'\')" src="newimages/start.png" height="12px"></td></tr>';
        $('table[name="'+table+'tagtable"]').append(html);
        $(".newtag").fadeIn('fast', function(){ $(this).removeClass('newtag')});
    }

    function getBuyHtml(data) {
        var html = "";
        if (data.affiliations) {
            if (data.affiliations.physicals) {
                html = html + '<li><b>BUY ON CD:</b></li>';
                html = html + doBuyTable(getArray(data.affiliations.physicals.affiliation));
            }
            if (data.affiliations.downloads) {
                html = html + '<li><b>DOWNLOAD:</b></li>';
                html = html + doBuyTable(getArray(data.affiliations.downloads.affiliation));
            }
        }
        return html;
    }

    function doBuyTable(values) {
        var html = "";
        for(var i in values) {
            html = html + '<li><img width="12px" src="'+values[i].supplierIcon+'">&nbsp;<a href="'+values[i].buyLink+'" target="_blank">'+
                            values[i].supplierName+'</a>';
            if (values[i].price) {
                if (values[i].price.formatted) {
                    html = html + '    '+values[i].price.formatted;
                } else {
                    html = html + '    '+values[i].price.amount;
                }
            }
            html = html +'</li>';
        }
        return html;
    }

    function getArtistHTML(lfmdata, parent) {
        var html = sectionHeader(lfmdata);
        if (mobile == "no") {
            var imageurl = lfmdata.image("extralarge");
            var bigurl = lfmdata.image("mega");
        } else {
            var imageurl = lfmdata.image("large");
            if (imageurl != '') {
                html = html + '<img src="' + imageurl + '" class="clrbth" />';
            }
        }
        html = html + '<br><li class="tiny">Hear artists similar to '+lfmdata.name()+'&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmartist\', \''+lfmdata.name()+'\')"><img style="vertical-align:middle" src="newimages/start.png" height="12px"></a></li>';
        html = html + '<br><li class="tiny">Play what fans of '+lfmdata.name()+' are listening to&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmfan\', \''+lfmdata.name()+'\')"><img style="vertical-align:middle" src="newimages/start.png" height="12px"></a></li>';
        html = html + '</ul><br>';

        html = html + doTags(lfmdata.tags());
        if (lastfm.isLoggedIn()) {
             html = html + tagsInput("artist");
             html = html + doUserTags("artist");
        }

        html = html + '</div><div class="statsbox">';

        if (mobile == "no" && imageurl != '') {
            html = html +  '<img class="stright standout'
            if (bigurl && bigurl != imageurl) {
                html = html + ' infoclick clickzoomimage';
            }
            html = html + '" src="' + imageurl + '" />';
            if (bigurl && bigurl != imageurl) {
                html = html + '<input type="hidden" value="'+bigurl+'" />';
            }
        }
        html = html +  '<div id="artistbio">';
        if (parent.playlistinfo.metadata.artist.lastfm.fullbio !== undefined &&
            parent.playlistinfo.metadata.artist.lastfm.fullbio !== null) {
            html = html + formatBio(parent.playlistinfo.metadata.artist.lastfm.fullbio, null);
        } else {
            html = html + formatBio(lfmdata.bio(), lfmdata.url());
        }
        html = html + '</div></div>';
        html = html + '</div>';

        var similies = lfmdata.similar();
        html = html + '<div id="similarartists"><h3 align="center">Similar Artists</h3>';
        html = html + '<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><div class="smlrtst">';
        for(var i in similies) {
            html = html + '<div class="simar">';
            html = html + '<table><tr><td align="center"><img class="infoclick clickzoomimage" src="'+lfmdata.similarimage(i, "medium")+'"><input type="hidden" value="'+lfmdata.similarimage(i, "mega")+'" /></td></tr>';
            html = html + '<tr><td align="center"><a href="'+similies[i].url+'" target="_blank">'+similies[i].name+'</a></td></tr>';
            html = html + '<tr><td align="center"><a href="#" title="Play Artist Radio Station" onclick="doLastFM(\'lastfmartist\', \''+similies[i].name+'\')"><img src="newimages/start.png" height="12px"></a></td></tr></table>';
            html = html + '</div>';
        }
        html = html + '</div></td></tr></table></div>';
        return html;
    }

    function getAlbumHTML(lfmdata) {
        var html = sectionHeader(lfmdata);
        html = html + '<br><ul id="buyalbum"><li><b>BUY THIS ALBUM&nbsp;</b><img class="infoclick clickbuy" height="20px" id="buyalbumbutton" style="vertical-align:middle" src="newimages/cart.png"></li></ul>';
        html = html + '</ul><br>';

        html = html + doTags(lfmdata.tags());
        if (lastfm.isLoggedIn()) {
            html = html + tagsInput("album");
            html = html + doUserTags("album");
        }

        html = html + '</div><div class="statsbox">';
        var imageurl;
        if (mobile == "no") {
            var imageurl = lfmdata.image("large");
            var bigurl = lfmdata.image("mega");
        } else {
            var imageurl = lfmdata.image("medium");
        }
        if (imageurl != '') {
            html = html +  '<img class="stright standout'
            if (bigurl && bigurl != imageurl) {
                html = html + ' infoclick clickzoomimage';
            }
            html = html + '" src="' + imageurl + '" />';
            if (bigurl && bigurl != imageurl) {
                html = html + '<input type="hidden" value="'+bigurl+'" />';
            }
        }
        html = html +  '<p>';
        html = html + '<b>Release Date : </b>'+lfmdata.releasedate();
        html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
        html = html +  '</p><p><b>Track Listing:</b></p><table>';
        var tracks = lfmdata.tracklisting();
        for(var i in tracks) {
            html = html + '<tr><td>';
            if (tracks[i]['@attr']) { html = html + tracks[i]['@attr'].rank+':'; }
            html = html + '</td><td>'+tracks[i].name+'</td><td>'+formatTimeString(tracks[i].duration)+'</td>';
            html = html + '<td align="right"><a target="_blank" title="View Track On Last.FM" href="'+tracks[i].url+'"><img src="newimages/lastfm.png" height="12px"></a></td><td align="right">';
            if (tracks[i].streamable) {
                if (tracks[i].streamable['#text'] == "1") {
                    var tit = "Play Sample";
                    if (tracks[i].streamable.fulltrack == "1") { tit = "Play Track"; }
                    html = html + '<a href="#" title="'+tit+'" onclick="addLastFMTrack(\''+encodeURIComponent(lfmdata.artist())+'\', \''+
                    encodeURIComponent(tracks[i].name)+'\')"><img src="newimages/start.png" height="12px"></a>';
                }
            }
            html = html + '</td></tr>';
        }
        html = html + '</table>';
        html = html + '</div>'
        html = html + '</div>';
        return html;
    }

    function getTrackHTML(lfmdata) {
        var html = sectionHeader(lfmdata);
        html = html + '<li name="userloved">';
        html = html +'</li>';

        html = html + '<br><ul id="buytrack"><li><b>BUY THIS TRACK&nbsp;</b><img class="infoclick clickbuy" height="20px" id="buytrackbutton" style="vertical-align:middle" src="newimages/cart.png"></li></ul>';
        html = html + '</ul><br>';

        html = html + doTags(lfmdata.tags());
        if (lastfm.isLoggedIn()) {
            html = html + tagsInput("track");
            html = html + doUserTags("track");
        }
        html = html + '</div>';
        html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
        html = html + '</div>';
        return html;
    }

	return {
        getRequirements: function(parent) {
            return [];
        },

		collection: function(parent) {

			debug.log(medebug, "Creating data collection");

			var self = this;
            var displaying = false;

            this.displayData = function() {
                displaying = true;
                self.artist.doBrowserUpdate();
                self.album.doBrowserUpdate();
                self.track.doBrowserUpdate();
            }

            this.stopDisplaying = function() {
                displaying = false;
			}

            this.handleClick = function(source, element, event) {
                debug.log(medebug,parent.index,source,"is handling a click event");
                if (element.hasClass('clickremovetag')) {
                    var tagname = element.parent().prev().children().text();
                    debug.log(medebug,parent.index,source,"wants to remove tag",tagname);
                    self[source].removetags(tagname);
                } else if (element.hasClass('clickaddtags')) {
                    var tagname = element.prev().val();
                    debug.log(medebug,parent.index,source,"wants to add tags",tagname);
                    self[source].addtags(tagname);
                } else if (element.hasClass('clickbuy')) {
                    self[source].unfetteredCapitalism();
                } else if (element.hasClass('clickbiolink')) {
                    self[source].getFullBio(self[source].updateBio,self[source].gotNoBio);
                } else if (element.hasClass('clickzoomimage')) {
                    imagePopup.create(element, event, element.next().val());
                } else if (element.hasClass('clickunlove')) {
                    self[source].unlove();
                } else if (element.hasClass('clicklove')) {
                    self[source].love();
                }
            }

            this.somethingfailed = function(data) {
                debug.warn(medebug,"Something went wrong",data);
            }

            this.justaddedtags = function(type, tags) {
                debug.log(medebug,parent.index,"Just added or removed tags",tags,"on",type);
                self[type].resetUserTags();
                self[type].getUserTags();
            }

            this.tagAddFailed = function(type, tags) {
                stopWaitingIcon("tagadd"+type);
                infobar.notify(infobar.ERROR, "Failed to modify tags");
                debug.warn(medebug,"Failed to modify tags",type,tags);
            }

            function formatUserTagData(name, taglist, displaying) {
                if (displaying) {
                    debug.debug("FUTD","Doing",name,"tags");
                    var toAdd = new Array();
                    var toRemove = new Array();
                    $('table[name="'+name+'tagtable"]').find("tr").each( function() {
                        if (!(findTag($(this).find('a').text(), taglist))) {
                            debug.debug("FUTD","Marking tag",$(this).find('a').text(),"for removal");
                            toRemove.push($(this));
                        }
                    });
                    for(var i in taglist) {
                        debug.debug("FUTD","Checking for addition",taglist[i].name);
                        if (!(findTag2(taglist[i].name, $('table[name="'+name+'tagtable"]')))) {
                            debug.debug("FUTD","Marking Tag",taglist[i].name,"for addition");
                            toAdd.push(taglist[i])
                        }
                    }
                    for (var i in toRemove) {
                        toRemove[i].fadeOut('fast', function() { $(this).remove() });
                    }
                    for (var i in toAdd) {
                        appendTag(name, toAdd[i].name, toAdd[i].url);
                    }
                }
            }

            function doUserLoved(flag) {
                var html = "";
                if (flag) {
                    html = html + '<b>Loved:</b> Yes';
                    html = html+'&nbsp;&nbsp;&nbsp;<a title="Unlove This Track" href="#" class="infoclick clickunlove"><img src="newimages/lastfm-unlove.png" height="12px"></a>';
                } else {
                    html = html + '<li><b>Loved:</b> No';
                    html = html+'&nbsp;&nbsp;&nbsp;<a title="Love This Track" href="#" class="infoclick clicklove"><img src="newimages/lastfm-love.png" height="12px"></a>';
                }
                $('li[name="userloved"]').html(html);
                html = null;
            }

            function getSearchArtist() {
                return (parent.playlistinfo.albumartist && parent.playlistinfo.albumartist != "") ? parent.playlistinfo.albumartist : self.artist.name();
            }

			this.artist = function() {

                return {

					populate: function() {
                        if (parent.playlistinfo.metadata.artist.lastfm === undefined) {
    						debug.mark(medebug,parent.index,"artist is populating",parent.playlistinfo.creator);
    						lastfm.artist.getInfo( {artist: parent.playlistinfo.creator},
    												this.lfmResponseHandler,
    												this.lfmResponseHandler
    						);
                        } else {
                            debug.mark(medebug,parent.index,"artist is already populated",parent.playlistinfo.creator);
                            self.album.populate();
                        }
					},

		            lfmResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got artist data for",parent.playlistinfo.creator,data);
		                if (data) {
		                    if (data.error) {
		                        parent.playlistinfo.metadata.artist.lastfm = {artist: data};
		                    } else {
		                        parent.playlistinfo.metadata.artist.lastfm = data;
		                    }
		                } else {
		                    parent.playlistinfo.metadata.artist.lastfm = {artist: {error: 1,
		                                                                  message: "Artist Not Found"}
		                    };
		                }

		                if (parent.playlistinfo.musicbrainz.artistid == "") {
                            var mbid = null;
                            try {
                                mbid = data.artist.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
		                	debug.log(medebug,parent.index,"has found a musicbrainz artist ID",mbid);
		                	parent.updateData({musicbrainz: {artistid: mbid }}, null);
		                }
                        self.album.populate();
		                self.artist.doBrowserUpdate();
		            },

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.artist.lastfm !== undefined) {
                            debug.mark(medebug,parent.index,"artist was asked to display");
				        	var lfmdata = new lfmDataExtractor(parent.playlistinfo.metadata.artist.lastfm.artist);
				        	var html = "";
					        if (lfmdata.error()) {
					            html = formatLastFmError(lfmdata);
					        } else {
                                if (prefs.fullbiobydefault && lfmdata.url() && parent.playlistinfo.metadata.artist.lastfm.fullbio === undefined) {
                                    self.artist.getFullBio(null, null);
                                    return;
                                }
                                html = getArtistHTML(lfmdata, parent);
					        }

					        var accepted = browser.Update('artist', me, parent.index, { name: self.artist.name(),
					        											            link: lfmdata.url(),
					        											            data: html
					        										             }
					        );

                            if (accepted && lastfm.isLoggedIn() && !lfmdata.error()) {
                                self.artist.getUserTags();
                                $("#artistinformation .enter").keyup( onKeyUp );
                            }

						}
					},

                    name: function() {
                        try {
                            return parent.playlistinfo.metadata.artist.lastfm.artist.name || parent.playlistinfo.creator;
                        } catch(err) {
                            return parent.playlistinfo.creator;
                        }
                    },

                    getFullBio: function(callback, failcallback) {
                        debug.log(medebug,parent.index,"Getting Bio URL:", parent.playlistinfo.metadata.artist.lastfm.artist.url);
                        $.get("getLfmBio.php?url="+encodeURIComponent(parent.playlistinfo.metadata.artist.lastfm.artist.url))
                            .done( function(data) {
                                parent.playlistinfo.metadata.artist.lastfm.fullbio = data;
                                if (callback) {
                                    callback(data);
                                } else {
                                    self.artist.doBrowserUpdate();
                                }
                            })
                            .fail( function(data) {
                                parent.playlistinfo.metadata.artist.lastfm.fullbio = null;
                                if (failcallback) {
                                    failcallback();
                                } else {
                                    self.artist.doBrowserUpdate();
                                }
                            })
                    },

                    updateBio: function(data) {
                        if (displaying) {
                            $("#artistbio").html(formatBio(data, null));
                        }
                    },

                    goNoBio: function() {
                        debug.warn(medebug,parent.index,"No Bio Available")
                        infobar.notify(infobar.NOTIFY, "No full biography available");
                    },

                    resetUserTags: function() {
                        parent.playlistinfo.metadata.artist.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.index,"Getting Artist User Tags");
                        if (parent.playlistinfo.metadata.artist.lastfm.usertags) {
                            formatUserTagData('artist', parent.playlistinfo.metadata.artist.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: self.artist.name() };
                            if (parent.playlistinfo.musicbrainz.artistid != "") {
                                options.mbid = parent.playlistinfo.musicbrainz.artistid;
                            }
                            lastfm.artist.getTags(
                                options,
                                self.artist.gotUserTags,
                                self.artist.somethingfailed
                            );
                        }

                    },

                    somethingfailed: function(data) {
                        stopWaitingIcon("tagaddartist");
                        debug.warn(medebug,"Something went wrong",data);
                    },

                    gotUserTags: function(data) {
                        stopWaitingIcon("tagaddartist");
                        try {
                            tags = getArray(data.tags.tag);
                        } catch(err) {
                            tags = [];
                        }
                        parent.playlistinfo.metadata.artist.lastfm.usertags = tags;
                        formatUserTagData('artist', parent.playlistinfo.metadata.artist.lastfm.usertags, displaying);
                    },

                    addtags: function(tags) {
                        makeWaitingIcon("tagaddartist");
                        lastfm.artist.addTags({ artist: self.artist.name(),
                                                tags: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    },

                    removetags: function(tags) {
                        makeWaitingIcon("tagaddartist");
                        lastfm.artist.removeTag({   artist: self.artist.name(),
                                                    tag: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    }

				}

			}();

            this.album = function() {

                return {

                    populate: function() {
                        if (parent.playlistinfo.metadata.album.lastfm === undefined) {
                            if (parent.playlistinfo.type == "stream") {
                                debug.mark(medebug,"This album is a radio stream");
                                parent.playlistinfo.metadata.album.lastfm = {album: {error: 99, message: parent.playlistinfo.album}};
                                if (parent.playlistinfo.musicbrainz.albumid == "") {
                                    parent.playlistinfo.musicbrainz.albumid = null;
                                }
                                self.track.populate();
                                self.album.doBrowserUpdate();
                            } else {
                                debug.mark(medebug,"Getting last.fm data for album",parent.playlistinfo.album);
                                lastfm.album.getInfo({  artist: getSearchArtist(),
                                                        album: parent.playlistinfo.album},
                                                    this.lfmResponseHandler,
                                                    this.lfmResponseHandler );
                            }
                        } else {
                            debug.mark(medebug,"Album is already populated",parent.playlistinfo.album);
                            self.track.populate();
                        }

                    },

                    lfmResponseHandler: function(data) {
                        debug.mark(medebug,"Got Album Info for",parent.playlistinfo.album, data);
                        if (data) {
                            if (data.error) {
                                parent.playlistinfo.metadata.album.lastfm = {album: data};
                            } else {
                                parent.playlistinfo.metadata.album.lastfm = data;
                            }
                        } else {
                            parent.playlistinfo.metadata.album.lastfm = {album: {error: 1,
                                                                        message: "Album Not Found"}
                            };
                        }
                        if (parent.playlistinfo.musicbrainz.albumid == "") {
                            var mbid = null;
                            try {
                                mbid = data.album.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
                            debug.log(medebug,parent.index,"has found a musicbrainz album ID",mbid);
                            parent.updateData({musicbrainz: {albumid: mbid }}, null);
                        }
                        self.track.populate();
                        self.album.doBrowserUpdate();
                    },

                    doBrowserUpdate: function() {
                        if (displaying && parent.playlistinfo.metadata.album.lastfm !== undefined) {
                            debug.mark(medebug,parent.index,"album was asked to display");
                            var lfmdata = new lfmDataExtractor(parent.playlistinfo.metadata.album.lastfm.album);
                            var html = "";
                            if (lfmdata.error()) {
                                html = formatLastFmError(lfmdata);
                            } else {
                                html = getAlbumHTML(lfmdata);
                            }

                            var accepted = browser.Update('album', me, parent.index, {  name: lfmdata.name(),
                                                                                    link: lfmdata.url(),
                                                                                    data: html
                                                                                }
                            );

                            if (accepted && lastfm.isLoggedIn() && !lfmdata.error()) {
                                self.album.getUserTags();
                                $("#albuminformation .enter").keyup( onKeyUp );
                            }
                        }
                    },

                    name: function() {
                        try {
                            return parent.playlistinfo.metadata.album.lastfm.album.name || parent.playlistinfo.album;
                        } catch(err) {
                            return parent.playlistinfo.album;
                        }
                    },

                    image: function(size) {
                        if (parent.playlistinfo.metadata.album.lastfm.album) {
                            var lfmdata = new lfmDataExtractor(parent.playlistinfo.metadata.album.lastfm.album);
                            return lfmdata.image(size);
                        }
                        return "";
                    },

                    resetUserTags: function() {
                        parent.playlistinfo.metadata.album.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.index,"Getting Album User Tags");
                        if (parent.playlistinfo.metadata.album.lastfm.usertags) {
                            formatUserTagData('album', parent.playlistinfo.metadata.album.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: getSearchArtist(), album: self.album.name() };
                            if (parent.playlistinfo.musicbrainz.albumid != "") {
                                options.mbid = parent.playlistinfo.musicbrainz.albumid;
                            }
                            lastfm.album.getTags(
                                options,
                                self.album.gotUserTags,
                                self.album.somethingfailed
                            );
                        }

                    },

                    somethingfailed: function(data) {
                        stopWaitingIcon("tagaddalbum");
                        debug.warn(medebug,"Something went wrong",data);
                    },

                    gotUserTags: function(data) {
                        stopWaitingIcon("tagaddalbum");
                        try {
                            tags = getArray(data.tags.tag);
                        } catch(err) {
                            tags = [];
                        }
                        parent.playlistinfo.metadata.album.lastfm.usertags = tags;
                        formatUserTagData('album', parent.playlistinfo.metadata.album.lastfm.usertags, displaying);
                    },

                    addtags: function(tags) {
                        makeWaitingIcon("tagaddalbum");
                        lastfm.album.addTags({  artist: getSearchArtist(),
                                                album: self.album.name(),
                                                tags: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    },

                    removetags: function(tags) {
                        makeWaitingIcon("tagaddalbum");
                        lastfm.album.removeTag({    artist: getSearchArtist(),
                                                    album: self.album.name(),
                                                    tag: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    },

                    unfetteredCapitalism: function() {
                        makeWaitingIcon("buyalbumbutton");
                        lastfm.album.getBuylinks({  album: self.album.name(),
                                                    artist: getSearchArtist()},
                                                self.album.showBuyLinks,
                                                self.album.noBuyLinks);
                    },

                    showBuyLinks: function(data) {
                        debug.log(medebug,"Got album buy links",data);
                        stopWaitingIcon("buyalbumbutton");
                        $("#buyalbum").fadeOut('fast', function() {
                            $("#buyalbum").html(getBuyHtml(data));
                            $("#buyalbum").fadeIn("fast");
                        });
                    },

                    noBuyLinks: function(data) {
                        debug.fail(medebug,"No album buy links",data);
                        stopWaitingIcon("buyalbumbutton");
                        infobar.notify(infobar.NOTIFY, data.message);
                    }
                }
            }();

            this.track = function() {

                return {

                    populate: function() {
                        if (parent.playlistinfo.metadata.track.lastfm === undefined) {
                            debug.mark(medebug,"Getting last.fm data for track",parent.playlistinfo.title);
                            lastfm.track.getInfo( { artist: self.artist.name(), track: parent.playlistinfo.title },
                                                    this.lfmResponseHandler,
                                                    this.lfmResponseHandler );
                        } else {
                            debug.mark(medebug,"Track is already populated",parent.playlistinfo.title);
                        }
                    },

                    lfmResponseHandler: function(data) {
                        debug.mark(medebug,"Got Track Info for",parent.playlistinfo.title, data);
                        if (data) {
                            if (data.error) {
                                parent.playlistinfo.metadata.track.lastfm = {track: data};
                            } else {
                                parent.playlistinfo.metadata.track.lastfm = data;
                            }
                        } else {
                            parent.playlistinfo.metadata.track.lastfm = {track: {error: 1,
                                                                        message: "Track Not Found"}
                            };
                        }
                        if (parent.playlistinfo.musicbrainz.trackid == "") {
                            var mbid = null;
                            try {
                                mbid = data.track.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
                            debug.log(medebug,parent.index,"has found a musicbrainz track ID",mbid);
                            parent.updateData({musicbrainz: {trackid: mbid }}, null);
                        }

                        try {
                            var updates = { creator: self.artist.name(),
                                            album: self.album.name(),
                                            title: self.track.name(),
                                            image: self.album.image('medium'),
                                            origimage: self.album.image('mega') };
                            nowplaying.setLastFMCorrections(parent.index, updates);
                        } catch(err) {
                            debug.fail(medebug,"Not enough information to send corrections");
                        }

                        self.track.doBrowserUpdate();
                    },

                    doBrowserUpdate: function() {
                        if (displaying && parent.playlistinfo.metadata.track.lastfm !== undefined) {
                            debug.mark(medebug,parent.index,"track was asked to display");
                            var lfmdata = new lfmDataExtractor(parent.playlistinfo.metadata.track.lastfm.track);
                            var html = (lfmdata.error()) ? formatLastFmError(lfmdata) : getTrackHTML(lfmdata);
                            var accepted = browser.Update('track', me, parent.index, { name: self.track.name(),
                                                                                    link: lfmdata.url(),
                                                                                    data: html
                                                                                }
                            );

                            if (accepted && lastfm.isLoggedIn() && !lfmdata.error()) {
                                self.track.getUserTags();
                                if (lfmdata.userloved()) {
                                    doUserLoved(true)
                                } else {
                                    doUserLoved(false);
                                }
                                $("#trackinformation .enter").keyup( onKeyUp );
                            }
                        }
                    },

                    name: function() {
                        try {
                            return parent.playlistinfo.metadata.track.lastfm.track.name || parent.playlistinfo.title;
                        } catch(err) {
                            return parent.playlistinfo.title;
                        }
                    },

                    resetUserTags: function() {
                        parent.playlistinfo.metadata.track.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.index,"Getting Track User Tags");
                        if (parent.playlistinfo.metadata.track.lastfm.usertags) {
                            formatUserTagData('track', parent.playlistinfo.metadata.track.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: self.artist.name(), track: self.track.name() };
                            if (parent.playlistinfo.musicbrainz.trackid != "") {
                                options.mbid = parent.playlistinfo.musicbrainz.trackid;
                            }
                            lastfm.track.getTags(
                                options,
                                self.track.gotUserTags,
                                self.track.somethingfailed
                            );
                        }

                    },

                    somethingfailed: function(data) {
                        stopWaitingIcon("tagaddtrack");
                        debug.warn(medebug,"Something went wrong",data);
                    },

                    gotUserTags: function(data) {
                        stopWaitingIcon("tagaddtrack");
                        try {
                            tags = getArray(data.tags.tag);
                        } catch(err) {
                            tags = [];
                        }
                        parent.playlistinfo.metadata.track.lastfm.usertags = tags;
                        formatUserTagData('track', parent.playlistinfo.metadata.track.lastfm.usertags, displaying);
                    },

                    addtags: function(tags) {
                        makeWaitingIcon("tagaddtrack");
                        lastfm.track.addTags({  artist: self.artist.name(),
                                                track: self.track.name(),
                                                tags: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    },

                    removetags: function(tags) {
                        makeWaitingIcon("tagaddtrack");
                        lastfm.track.removeTag({    artist: self.artist.name(),
                                                    track: self.track.name(),
                                                    tag: tags},
                                            self.justaddedtags,
                                            self.tagAddFailed
                        );
                    },

                    unfetteredCapitalism: function() {
                        makeWaitingIcon("buytrackbutton");
                        lastfm.track.getBuylinks({  track: self.track.name(),
                                                    artist: self.artist.name()},
                                                self.track.showBuyLinks,
                                                self.track.noBuyLinks);
                    },

                    showBuyLinks: function(data) {
                        debug.log(medebug,"Got track buy links",data);
                        stopWaitingIcon("buytrackbutton");
                        $("#buytrack").fadeOut('fast', function() {
                            $("#buytrack").html(getBuyHtml(data));
                            $("#buytrack").fadeIn("fast");
                        });
                    },

                    noBuyLinks: function(data) {
                        debug.fail(medebug,"No track buy links",data);
                        stopWaitingIcon("buytrackbutton");
                        infobar.notify(infobar.NOTIFY, data.message);
                    },

                    love: function() {
                        lastfm.track.love({ track: self.track.name(), artist: self.artist.name() }, self.track.donelove);
                    },

                    unlove: function(callback) {
                        lastfm.track.unlove({ track: self.track.name(), artist: self.artist.name() }, self.track.donelove);
                    },

                    donelove: function(loved) {
                        if (loved) {
                            // Rather than re-get all the details, we can just edit the track data directly.
                            parent.playlistinfo.metadata.track.lastfm.track.userloved = 1;
                            if (prefs.autotagname != '') {
                                self.track.addtags(prefs.autotagname);
                            }
                            if (displaying) { doUserLoved(true) }
                        } else {
                            parent.playlistinfo.metadata.track.lastfm.track.userloved = 0;
                            if (prefs.autotagname != '') {
                                self.track.removetags(prefs.autotagname);
                            }
                            if (displaying) { doUserLoved(false) }
                        }
                    }

                }
            }();

			self.artist.populate();

		}
	}

}();

function lfmDataExtractor(data) {

    this.error = function() {
        if (data && data.error) {
            return data.message;
        } else {
            return false;
        }
    }

    this.errorno = function() {
        if (data && data.error) {
            return data.error;
        } else {
            return 0;
        }
    }

    this.id = function() {
        return data.id || "";
    }

    this.artist = function() {
        return data.artist || "";
    }

    this.name = function() {
        if (data.error && data.error == 99) {
            return "(Internet Radio)";
        }
    	return data.name || "";
    }


    this.listeners = function() {
        try {
            return data.stats.listeners || 0;
        } catch(err) {
            try {
                return  data.listeners || 0;
            } catch (err) {
                return 0;
            }
        }
    }

    this.playcount = function() {
        try {
            return data.stats.playcount || 0;
        } catch(err) {
            try {
                return  data.playcount || 0;
            } catch(err) {
                return 0;
            }
        }
    }

    this.duration = function() {
        try {
            return data.duration || 0;
        } catch(err) {
            return 0;
        }
    }

    this.releasedate = function() {
        try {
            return  data.releasedate || "Unknown";
        } catch(err) {
            return "Unknown";
        }
    }

    this.mbid = function() {
        try {
            return data.mbid || false;
        } catch(err) {
            return false;
        }
    }

    this.userplaycount = function() {
        try {
            return data.stats.userplaycount || 0;
        } catch(err) {
            return  data.userplaycount || 0;
        }
    }

    this.url = function() {
        try {
            return  data.url || null;
        } catch(err) {
            return null;
        }
    }

    this.bio = function() {
        try {
            if(data.wiki) {
                return data.wiki.content;
            }
            else if (data.bio) {
                return data.bio.content;
            } else {
                return false;
            }
        } catch(err) {
            return false;
        }
    }

    this.userloved = function() {
        var loved =  data.userloved || 0;
        return (loved == 1) ? true : false;
    }

    this.tags = function() {
        if (data.tags) {
            try {
                return getArray(data.tags.tag);
            } catch(err) {
                return [];
            }
        } else {
            try {
                return getArray(data.toptags.tag);
            } catch(err) {
                return [];
            }
        }
    }

    this.tracklisting = function() {
        try {
            return getArray(data.tracks.track);
        } catch(err) {
            return [];
        }
    }

    this.image = function(size) {
        // Get image of the specified size.
        // If no image of that size exists, return a different one - just so we've got one.
        try {
            var url = "";
            var temp_url = "";
            for(var i in data.image) {
                temp_url = data.image[i]['#text'];
                if (data.image[i].size == size) {
                    url = temp_url;
                }
            }
            if (url == "") { url = temp_url; }
            return url;
        } catch(err) {
            return "";
        }
    }

    this.similar = function() {
        try {
            return getArray(data.similar.artist);
        } catch(err) {
            return [];
        }
    }

    this.similarimage = function(index, size) {
        try {
            var url = "";
            var temp_url = "";
            for(var i in data.similar.artist[index].image) {
                temp_url = data.similar.artist[index].image[i]['#text'];
                if (data.similar.artist[index].image[i].size == size) {
                    url = temp_url;
                    break;
                }
            }
            if (url == "") {
                url = temp_url;
            }
            return url;
        } catch(err) {
            return "";
        }

    }

    this.url = function() {
        return data.url  || null;
    }

}

nowplaying.registerPlugin("lastfm", info_lastfm, "newimages/lastfm.png", "Info Panel (Last.FM)");
