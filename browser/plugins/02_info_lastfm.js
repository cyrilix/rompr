var info_lastfm = function() {

	var me = "lastfm";
    var medebug = "LASTFM PLUGIN";

    function formatLastFmError(lfmdata) {
        return '<h3 align="center">'+lfmdata.error()+'</h3>';
    }

    function sectionHeader(data) {
        var html = '<div class="holdingcell">';
        html = html + '<div class="standout stleft statsbox"><ul>';
        html = html + '<li><b>'+language.gettext("lastfm_listeners")+'</b> '+data.listeners()+'</li>';
        html = html + '<li><b>'+language.gettext("lastfm_plays")+'</b> '+data.playcount()+'</li>';
        html = html + '<li><b>'+language.gettext("lastfm_yourplays")+'</b> '+data.userplaycount()+'</li>';
        return html;
    }

    function doTags(taglist) {
    	debug.debug(medebug,"    Doing Tags");
        var html = '<ul><li><b>'+language.gettext("lastfm_toptags")+'</b></li><li><table';
        if (mobile == "no") {
            html = html + ' width="100%"';
        }
        html = html + '>';
        for(var i in taglist) {
            html = html + '<tr><td><a href="'+taglist[i].url+'" target="_blank">'+taglist[i].name+'</a></td>';
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
                bio = bio.replace(re, '<a href="#" class="infoclick clickbiolink">'+language.gettext("lastfm_readfullbio")+'</a>');
            }
            return bio;
        } else {
            return "";
        }
    }

    function tagsInput(type) {
        var html = '<ul class="holdingcell"><li><b>'+language.gettext("lastfm_addtags")+'</b></li>';
        html = html + '<li class="tiny">'+language.gettext("lastfm_addtagslabel")+'</li>';
        html = html + '<li><input class="enter tiny inbrowser" type="text"></input>';
        html = html + '<button class="infoclick clickaddtags tiny">'+language.gettext("button_add")+'</button>'+
                        '<img class="tright waiting" id="tagadd'+type+'" height="20px" src="newimages/transparent-32x32.png"></li></ul>';
        return html;
    }

    function doUserTags(name) {
        var html = '<ul><li><b>'+language.gettext("lastfm_yourtags")+'</b></li><li><table name="'+name+'tagtable"';
        if (mobile == "no") {
            html = html + ' width="100%"';
        }
        html = html + '>';
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
            var n = $(this).find('a').text();
            if (n.toLowerCase() == name.toLowerCase()) {
                debug.debug("FINDTAG 2",'Found Tag',name);
                retval = true;
            }
        });
        return retval;
    }

    function appendTag(table, name, url) {
        var html = '<tr class="newtag"><td><a href="'+url+'" target="_blank">'+name+'</a></td>';
        html = html + '<td><img class="infoclick clickremovetag" title="'+language.gettext("lastfm_removetag")+'" style="vertical-align:middle" src="'+ipath+'edit-delete.png" height="12px"></td>';
        $('table[name="'+table+'tagtable"]').append(html);
        $(".newtag").fadeIn('fast', function(){
            $(this).find('[title]').tipTip({delay: 1000, edgeOffset: 8});
            $(this).removeClass('newtag');
        });
    }

    function getArtistHTML(lfmdata, parent, artistmeta) {
        if (lfmdata.error()) {
            return formatLastFmError(lfmdata);
        }
        var html = sectionHeader(lfmdata);
        var bigurl = lfmdata.image("mega");
        if (mobile == "no") {
            var imageurl = lfmdata.image("extralarge");
        } else {
            var imageurl = lfmdata.image("extralarge");
            if (imageurl != '') {
                html = html + '<img';
                if (bigurl && bigurl != imageurl) {
                    html = html + ' class="infoclick clickzoomimage"';
                }
                html = html + ' src="getRemoteImage.php?url=' + imageurl + '" />';
                if (bigurl && bigurl != imageurl) {
                    html = html + '<input type="hidden" value="getRemoteImage.php?url='+bigurl+'" />';
                }
            }
        }
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
            html = html + '" src="getRemoteImage.php?url=' + imageurl + '" />';
            if (bigurl && bigurl != imageurl) {
                html = html + '<input type="hidden" value="getRemoteImage.php?url='+bigurl+'" />';
            }
        }
        html = html +  '<div id="artistbio">';
        if (artistmeta.lastfm.fullbio !== undefined &&
            artistmeta.lastfm.fullbio !== null) {
            html = html + formatBio(artistmeta.lastfm.fullbio, null);
        } else {
            html = html + formatBio(lfmdata.bio(), lfmdata.url());
        }
        html = html + '</div></div>';
        html = html + '</div>';

        var similies = lfmdata.similar();
        html = html + '<div id="similarartists" class="bordered"><h3 align="center">'+language.gettext("lastfm_simar")+'</h3>';
        html = html + '<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><div class="smlrtst">';
        for(var i in similies) {
            html = html + '<div class="simar">';
            html = html + '<table><tr><td align="center"><img class="infoclick clickzoomimage" src="getRemoteImage.php?url='+lfmdata.similarimage(i, "medium")+'"><input type="hidden" value="getRemoteImage.php?url='+lfmdata.similarimage(i, "mega")+'" /></td></tr>';
            html = html + '<tr><td align="center"><a href="'+similies[i].url+'" target="_blank">'+similies[i].name+'</a></td></tr>';
            html = html + '</table>';
            html = html + '</div>';
        }
        html = html + '</div></td></tr></table></div>';
        return html;
    }

    function getAlbumHTML(lfmdata) {
        if (lfmdata.error()) {
            return formatLastFmError(lfmdata);
        }
        var html = sectionHeader(lfmdata);
        html = html + '<br><ul id="buyalbum"><li><b>'+language.gettext("lastfm_buyalbum")+'&nbsp;</b><img class="infoclick clickbuy" height="20px" id="buyalbumbutton" style="vertical-align:middle" src="'+ipath+'cart.png"></li></ul>';
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
            html = html + '" src="getRemoteImage.php?url=' + imageurl + '" />';
            if (bigurl && bigurl != imageurl) {
                html = html + '<input type="hidden" value="getRemoteImage.php?url='+bigurl+'" />';
            }
        }
        html = html +  '<p>';
        html = html + '<b>'+language.gettext("lastfm_releasedate")+' : </b>'+lfmdata.releasedate();
        html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
        html = html +  '</p><p><b>'+language.gettext("discogs_tracklisting")+'</b></p><table>';
        var tracks = lfmdata.tracklisting();
        for(var i in tracks) {
            html = html + '<tr><td>';
            if (tracks[i]['@attr']) { html = html + tracks[i]['@attr'].rank+':'; }
            html = html + '</td><td>'+tracks[i].name+'</td><td>'+formatTimeString(tracks[i].duration)+'</td>';
            html = html + '<td align="right"><a target="_blank" title="'+language.gettext("lastfm_viewtrack")+'" href="'+tracks[i].url+'"><img src="'+ipath+'lastfm.png" height="12px"></a></td><td align="right">';
            html = html + '</td></tr>';
        }
        html = html + '</table>';
        html = html + '</div>'
        html = html + '</div>';
        return html;
    }

    function getTrackHTML(lfmdata) {
        if (lfmdata.error()) {
            return formatLastFmError(lfmdata);
        }
        var html = sectionHeader(lfmdata);
        html = html + '<li name="userloved">';
        html = html +'</li>';

        html = html + '<br><ul id="buytrack"><li><b>'+language.gettext("lastfm_buytrack")+'&nbsp;</b><img class="infoclick clickbuy" height="20px" id="buytrackbutton" style="vertical-align:middle" src="'+ipath+'cart.png"></li></ul>';
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

		collection: function(parent, artistmeta, albummeta, trackmeta) {

			debug.log(medebug, "Creating data collection");

			var self = this;
            var displaying = false;

            this.populate = function() {
                self.artist.populate();
            }

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
                debug.log(medebug,parent.nowplayingindex,source,"is handling a click event");
                if (element.hasClass('clickremovetag')) {
                    var tagname = element.parent().prev().children().text();
                    debug.log(medebug,parent.nowplayingindex,source,"wants to remove tag",tagname);
                    self[source].removetags(tagname);
                    if (prefs.synctags) {
                        parent.setMeta('remove', 'Tags', tagname);
                    }
                } else if (element.hasClass('clickaddtags')) {
                    var tagname = element.prev().val();
                    debug.log(medebug,parent.nowplayingindex,source,"wants to add tags",tagname);
                    self[source].addtags(tagname);
                    if (prefs.synctags) {
                        parent.setMeta('set', 'Tags', tagname.split(','));
                    }
                } else if (element.hasClass('clickbuy')) {
                    self[source].unfetteredCapitalism();
                } else if (element.hasClass('clickbiolink')) {
                    self[source].getFullBio(self[source].updateBio,self[source].gotNoBio);
                } else if (element.hasClass('clickzoomimage')) {
                    imagePopup.create(element, event, element.next().val());
                } else if (element.hasClass('clickunlove')) {
                    self[source].unlove();
                    if (prefs.synclove) {
                        parent.setMeta('set', 'Rating', '0');
                    }
                } else if (element.hasClass('clicklove')) {
                    self[source].love();
                    if (prefs.synclove) {
                        parent.setMeta('set', 'Rating', prefs.synclovevalue);
                    }
                }
            }

            this.somethingfailed = function(data) {
                debug.warn(medebug,"Something went wrong",data);
            }

            this.justaddedtags = function(type, tags) {
                debug.log(medebug,parent.nowplayingindex,"Just added or removed tags",tags,"on",type);
                self[type].resetUserTags();
                self[type].getUserTags();
            }

            this.tagAddFailed = function(type, tags) {
                stopWaitingIcon("tagadd"+type);
                infobar.notify(infobar.ERROR, language.gettext("lastfm_tagerror"));
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
                    html = html + '<b>'+language.gettext("lastfm_loved")+':</b> '+language.gettext("label_yes");
                    html = html+'&nbsp;&nbsp;&nbsp;<a title="'+language.gettext("lastfm_unlove")+'" href="#" class="infoclick clickunlove"><img src="'+ipath+'lastfm-unlove.png" height="12px"></a>';
                } else {
                    html = html + '<li><b>'+language.gettext("lastfm_loved")+':</b> '+language.gettext("label_no");
                    html = html+'&nbsp;&nbsp;&nbsp;<a title="'+language.gettext("lastfm_lovethis")+'" href="#" class="infoclick clicklove"><img src="'+ipath+'lastfm-love.png" height="12px"></a>';
                }
                $('li[name="userloved"]').html(html);
                $('li[name="userloved"]').find("[title]").tipTip({delay: 1000, edgeOffset: 8});
                html = null;
            }

            function getSearchArtist() {
                return (albummeta.artist && albummeta.artist != "") ? albummeta.artist : parent.playlistinfo.creator;
            }

            function sendLastFMCorrections() {
                try {
                    var updates = { creator: (parent.playlistinfo.metadata.artists.length == 1) ? self.artist.name() : parent.playlistinfo.creator,
                                    album: self.album.name(),
                                    title: self.track.name(),
                                    image: self.album.image('medium'),
                                    origimage: self.album.image('mega') };
                    nowplaying.setLastFMCorrections(parent.currenttrack, updates);
                } catch(err) {
                    debug.fail(medebug,"Not enough information to send corrections");
                }
            }

			this.artist = function() {

                return {

					populate: function() {
                        if (artistmeta.lastfm === undefined) {
    						debug.mark(medebug,parent.nowplayingindex,"artist is populating",artistmeta.name);
    						lastfm.artist.getInfo( {artist: artistmeta.name},
    												this.lfmResponseHandler,
    												this.lfmResponseHandler
    						);
                        } else {
                            debug.mark(medebug,parent.nowplayingindex,"artist is already populated",artistmeta.name);
                            self.album.populate();
                        }
					},

		            lfmResponseHandler: function(data) {
						debug.mark(medebug,parent.nowplayingindex,"got artist data for",artistmeta.name,data);
		                if (data) {
		                    if (data.error) {
		                        artistmeta.lastfm = {artist: data};
		                    } else {
		                        artistmeta.lastfm = data;
		                    }
		                } else {
		                    artistmeta.lastfm = {artist: {error: 1,
		                                                  message: language.gettext("lastfm_notfound",[language.gettext("label_artist")])}
		                    };
		                }

		                if (artistmeta.musicbrainz_id == "") {
                            var mbid = null;
                            try {
                                mbid = data.artist.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
		                	debug.shout(medebug,parent.nowplayingindex,"has found a musicbrainz artist ID",mbid);
		                	artistmeta.musicbrainz_id = mbid;
		                }
                        self.album.populate();
		                self.artist.doBrowserUpdate();
		            },

					doBrowserUpdate: function() {
						if (displaying && artistmeta.lastfm !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"artist was asked to display");
                            var lfmdata = new lfmDataExtractor(artistmeta.lastfm.artist);
                            if (prefs.fullbiobydefault && lfmdata.url() && artistmeta.lastfm.fullbio === undefined) {
                                self.artist.getFullBio(null, null);
                                return;
                            }

					        var accepted = browser.Update(
                                null,
                                'artist',
                                me,
                                parent.nowplayingindex,
                                { name: self.artist.name(),
					        	  link: lfmdata.url(),
					        	  data: getArtistHTML(lfmdata, parent, artistmeta)
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
                            return artistmeta.lastfm.artist.name || artistmeta.name;
                        } catch(err) {
                            return artistmeta.name;
                        }
                    },

                    getFullBio: function(callback, failcallback) {
                        debug.log(medebug,parent.nowplayingindex,"Getting Bio URL:", artistmeta.lastfm.artist.url);
                        var url = "getLfmBio.php?url="+encodeURIComponent(artistmeta.lastfm.artist.url);
                        if (lastfm.getLanguage() !== null) {
                            url = url + "&lang="+lastfm.getLanguage();
                        }
                        $.get(url)
                            .done( function(data) {
                                artistmeta.lastfm.fullbio = data;
                                if (callback) {
                                    callback(data);
                                } else {
                                    self.artist.doBrowserUpdate();
                                }
                            })
                            .fail( function(data) {
                                artistmeta.lastfm.fullbio = null;
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
                        debug.warn(medebug,parent.nowplayingindex,"No Bio Available")
                        infobar.notify(infobar.NOTIFY, language.gettext("lastfm_nobio"));
                    },

                    resetUserTags: function() {
                        artistmeta.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.nowplayingindex,"Getting Artist User Tags");
                        if (artistmeta.lastfm.usertags) {
                            formatUserTagData('artist', artistmeta.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: self.artist.name() };
                            if (artistmeta.musicbrainz_id != "") {
                                options.mbid = artistmeta.musicbrainz_id;
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
                        artistmeta.lastfm.usertags = tags;
                        formatUserTagData('artist', artistmeta.lastfm.usertags, displaying);
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
                        lastfm.artist.removeTag({artist: self.artist.name(),
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
                        if (albummeta.lastfm === undefined) {
                            if (parent.playlistinfo.type == "stream") {
                                debug.mark(medebug,"This album is a radio stream");
                                albummeta.lastfm = {album: {error: 99, message: albummeta.name}};
                                if (albummeta.musicbrainz_id == "") {
                                    albummeta.musicbrainz_id = null;
                                }
                                self.track.populate();
                                self.album.doBrowserUpdate();
                            } else {
                                debug.mark(medebug,"Getting last.fm data for album",albummeta.name);
                                lastfm.album.getInfo({  artist: getSearchArtist(),
                                                        album: albummeta.name},
                                                    this.lfmResponseHandler,
                                                    this.lfmResponseHandler );
                            }
                        } else {
                            debug.mark(medebug,"Album is already populated",albummeta.name);
                            self.track.populate();
                        }

                    },

                    lfmResponseHandler: function(data) {
                        debug.mark(medebug,"Got Album Info for",albummeta.name, data);
                        if (data) {
                            if (data.error) {
                                albummeta.lastfm = {album: data};
                            } else {
                                albummeta.lastfm = data;
                            }
                        } else {
                            albummeta.lastfm = {album: {error: 1,
                                                        message: language.gettext("lastfm_notfound", [language.gettext("label_album")])}
                            };
                        }
                        if (albummeta.musicbrainz_id == "") {
                            var mbid = null;
                            try {
                                mbid = data.album.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
                            debug.shout(medebug,parent.nowplayingindex,"has found a musicbrainz album ID",mbid);
                            albummeta.musicbrainz_id = mbid;
                        }
                        self.track.populate();
                        self.album.doBrowserUpdate();
                    },

                    doBrowserUpdate: function() {
                        if (displaying && albummeta.lastfm !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"album was asked to display");
                            var lfmdata = new lfmDataExtractor(albummeta.lastfm.album);
                            var accepted = browser.Update(
                                null,
                                'album',
                                me,
                                parent.nowplayingindex,
                                { name: lfmdata.name() || albummeta.name,
                                  link: lfmdata.url(),
                                  data: getAlbumHTML(lfmdata)
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
                            return albummeta.lastfm.album.name || albummeta.name;
                        } catch(err) {
                            return albummeta.name;
                        }
                    },

                    image: function(size) {
                        if (albummeta.lastfm.album) {
                            var lfmdata = new lfmDataExtractor(albummeta.lastfm.album);
                            return lfmdata.image(size);
                        }
                        return "";
                    },

                    resetUserTags: function() {
                        albummeta.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.nowplayingindex,"Getting Album User Tags");
                        if (albummeta.lastfm.usertags) {
                            formatUserTagData('album', albummeta.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: getSearchArtist(), album: self.album.name() };
                            if (albummeta.musicbrainz_id != "") {
                                options.mbid = albummeta.musicbrainz_id;
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
                        albummeta.lastfm.usertags = tags;
                        formatUserTagData('album', albummeta.lastfm.usertags, displaying);
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
                        if (trackmeta.lastfm === undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"Getting last.fm data for track",trackmeta.name);
                            lastfm.track.getInfo( { artist: getSearchArtist(), track: trackmeta.name },
                                                    this.lfmResponseHandler,
                                                    this.lfmResponseHandler );
                        } else {
                            debug.mark(medebug,parent.nowplayingindex,"Track is already populated",trackmeta.name);
                            sendLastFMCorrections();
                        }
                    },

                    lfmResponseHandler: function(data) {
                        debug.mark(medebug,parent.nowplayingindex,"Got Track Info for",trackmeta.name, data);
                        if (data) {
                            if (data.error) {
                                trackmeta.lastfm = {track: data};
                            } else {
                                trackmeta.lastfm = data;
                            }
                        } else {
                            trackmeta.lastfm = {track: {error: 1,
                                                        message: language.gettext("lastfm_notfound", [language.gettext("label_track")])}
                            };
                        }
                        if (trackmeta.musicbrainz_id == "") {
                            var mbid = null;
                            try {
                                mbid = data.track.mbid || null;
                            } catch(err) {
                                mbid = null;
                            }
                            debug.shout(medebug,parent.nowplayingindex,"has found a musicbrainz track ID",mbid);
                            trackmeta.musicbrainz_id = mbid;
                        }
                        sendLastFMCorrections();
                        self.track.doBrowserUpdate();
                    },

                    doBrowserUpdate: function() {
                        if (displaying && trackmeta.lastfm !== undefined) {
                            debug.mark(medebug,parent.nowplayingindex,"track was asked to display");
                            var lfmdata = new lfmDataExtractor(trackmeta.lastfm.track);
                            var accepted = browser.Update(
                                null,
                                'track',
                                me,
                                parent.nowplayingindex,
                                { name: self.track.name(),
                                  link: lfmdata.url(),
                                  data: getTrackHTML(lfmdata)
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
                            return trackmeta.lastfm.track.name || trackmeta.name;
                        } catch(err) {
                            return trackmeta.name;
                        }
                    },

                    resetUserTags: function() {
                        trackmeta.lastfm.usertags = null;
                    },

                    getUserTags: function() {
                        debug.mark(medebug,parent.nowplayingindex,"Getting Track User Tags");
                        if (trackmeta.lastfm.usertags) {
                            formatUserTagData('track', trackmeta.lastfm.usertags, displaying);
                        } else {
                            var options = { artist: self.artist.name(), track: self.track.name() };
                            if (trackmeta.musicbrainz_id != "") {
                                options.mbid = trackmeta.musicbrainz_id;
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
                        trackmeta.lastfm.usertags = tags;
                        formatUserTagData('track', trackmeta.lastfm.usertags, displaying);
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
                        if (findTag2(tags, $('table[name="tracktagtable"]'))) {
                            makeWaitingIcon("tagaddtrack");
                            lastfm.track.removeTag({    artist: self.artist.name(),
                                                        track: self.track.name(),
                                                        tag: tags},
                                                self.justaddedtags,
                                                self.tagAddFailed
                            );
                        } else {
                            debug.warn(medebug, "Tag",tags,"not found on track");
                        }
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
                            trackmeta.lastfm.track.userloved = 1;
                            if (prefs.autotagname != '') {
                                self.track.addtags(prefs.autotagname);
                                if (prefs.synctags && prefs.synclove) {
                                    parent.setMeta('set', 'Tags', [prefs.autotagname]);
                                }
                            }
                            if (displaying) { doUserLoved(true) }
                        } else {
                            trackmeta.lastfm.track.userloved = 0;
                            if (prefs.autotagname != '') {
                                self.track.removetags(prefs.autotagname);
                                if (prefs.synctags && prefs.synclove) {
                                    parent.setMeta('remove', 'Tags', prefs.autotagname);
                                }
                            }
                            if (displaying) { doUserLoved(false) }
                        }
                    }

                }
            }();
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

nowplaying.registerPlugin("lastfm", info_lastfm, ipath+"lastfm.png", "button_infolastfm");
