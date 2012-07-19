function Info(target, source) {

    var target_frame = target;
    var self = this;
    var current_source = source;
    var hidden = false;

    this.slideshow = {
        running: false,
        paused: false,
        images: [],
        counter: 0,
        preload: new Image(),
        timer_running: false,
        timer: 0,

        slideshowGo: function(data) {
            self.slideshow.images = [];
            if(data.images.image) {
                var imagedata = getArray(data.images.image);
                for(var i in imagedata) {
                    var x = parseInt(imagedata[i].sizes.size[0].width);
                    var y = parseInt(imagedata[i].sizes.size[0].height);
                    var u = imagedata[i].sizes.size[0]["#text"];
                    self.slideshow.images.push({width: x, height: y, url: u});
                }
                // Preload the image - gets it in the cache so it fades in smoothly
                self.slideshow.preload.src = self.slideshow.images[0].url
                self.slideshow.counter = -1;
                self.slideshow.running = true;
                self.slideshow.nextimage();
            } else {
                if (self.slideshow.timer_running) {
                    clearTimeout(self.slideshow.timer);
                    self.slideshow.timer_running = false;
                }
                self.slideshow.running = false;
                self.noSlideshow();
            }

        },

        nextimage: function() {
            if (self.slideshow.timer_running) {
                clearTimeout(self.slideshow.timer);
                self.slideshow.timer_running = false;
            }
            if (self.slideshow.running) {
                $("#lastfmimage").fadeOut(1000, function() {
                    self.slideshow.counter++;
                    if (self.slideshow.counter == self.slideshow.images.length) { self.slideshow.counter = 0; }
                    self.slideshow.displayimage();
                    var nextimage = self.slideshow.counter+1;
                    if (nextimage == self.slideshow.images.length) { nextimage = 0; }
                    self.slideshow.preload.src = self.slideshow.images[nextimage].url
                    $("#lastfmimage").fadeIn(1500,function() {
                        if (self.slideshow.paused == false) {
                            self.slideshow.timer = setTimeout("browser.slideshow.nextimage()", 10000);
                            self.slideshow.timer_running = true;
                        }
                    })
                });
            }
        },

        previousimage: function() {
            if (self.slideshow.timer_running) {
                clearTimeout(self.slideshow.timer);
                self.slideshow.timer_running = false;
            }
            if (self.slideshow.running) {
                $("#lastfmimage").fadeOut(1000, function() {
                    self.slideshow.counter--;
                    if (self.slideshow.counter < 0) { self.slideshow.counter = self.slideshow.images.length-1; }
                    self.slideshow.displayimage();
                    var nextimage = self.slideshow.counter-1;
                    if (nextimage < 0) { nextimage = self.slideshow.images.length-1; }
                    self.slideshow.preload.src = self.slideshow.images[nextimage].url
                    $("#lastfmimage").fadeIn(1500,function() {
                        if (self.slideshow.paused == false) {
                            self.slideshow.timer = setTimeout("browser.slideshow.previousimage()", 10000);
                            self.slideshow.timer_running = true;
                        }
                    })
                });
            }
        },

        toggle: function() {
            if (self.slideshow.paused) {
                $('#lastfmimagecontrol').attr("src", "images/pause.png");
                self.slideshow.paused = false;
                self.slideshow.nextimage();
            } else {
                $('#lastfmimagecontrol').attr("src", "images/play.png");
                self.slideshow.paused = true;
                if (self.slideshow.timer_running) {
                    clearTimeout(self.slideshow.timer);
                    self.slideshow.timer_running = false;
                }
            }
        },

        displayimage: function() {
            var windowheight = $("#"+target_frame).height();
            var windowwidth = $("#"+target_frame).width();
            var imageheight = self.slideshow.images[self.slideshow.counter].height;
            var imagewidth = self.slideshow.images[self.slideshow.counter].width;
            var displaywidth = imagewidth;
            var displayheight = imageheight;
            if (imageheight+96 > windowheight) {
                displayheight = windowheight-96;
                displaywidth = imagewidth * (displayheight/imageheight);
            }
            if (displaywidth+36 > windowwidth) {
                displaywidth = windowwidth-36;
                displayheight = imageheight * (displaywidth/imagewidth);
            }
            $("#lastfmimage").attr("src", self.slideshow.images[self.slideshow.counter].url);
            $("#lastfmimage").attr("width", parseInt(displaywidth));
            $("#lastfmimage").attr("height", parseInt(displayheight));
        }

    }

    this.track = {
        trackinfo: new Object,
        userTags: new Object,

        new: function(data) {
            // Called when the track has changed and we have new Last.FM track data
            //debug.log("New track with last.fm", data);
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.TrackChanged();
            } else {
                self.track.trackinfo = data;
                self.track.userTags = {tags: {}};
                updateTrackBrowser();
            }
        },

        gotTags: function(data) {
            //debug.log("Got Track UserTags", data);
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.track.userTags = {tags: {}};
            } else {
                self.track.userTags = data;
                updateUserTags(self.track.usertags(), "track");
            }
        },

        name: function() {
            return this.trackinfo.track.name || "";
        },

        id: function() {
            return this.trackinfo.track.id || "";
        },

        listeners: function() {
            return  this.trackinfo.track.listeners || 0;
        },

        playcount: function() {
            return  this.trackinfo.track.playcount || 0;
        },

        duration: function() {
            return this.trackinfo.track.duration || 0;
        },

        userplaycount: function() {
            return  this.trackinfo.track.userplaycount || 0;
        },

        url: function() {
            return  this.trackinfo.track.url || 0;
        },

        bio: function() {
            if(this.trackinfo.track.wiki) { return formatBio(this.trackinfo.track.wiki.content) }
            else { return ""; }
        },

        userloved: function() {
            var loved =  this.trackinfo.track.userloved || 0;
            return (loved == 1) ? true : false;
        },

        tags: function() {
            try {
                return getArray(this.trackinfo.track.toptags.tag);
            } catch(err) {
                return [];
            }
        },

        usertags: function() {
            try {
                return getArray(this.userTags.tags.tag);
            } catch(err) {
                return [];
            }
        },
    }

    this.album = {
        albuminfo: new Object,
        userTags: new Object,

        new: function(data) {
            // Called when the album has changed and we have new Last.FM album data
            //debug.log("New album with last.fm",data);
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.AlbumChanged();
            } else {
                debug.log("New Album", data);
                self.album.albuminfo = data;
                self.album.userTags = {tags: {}};
                updateAlbumBrowser();
            }
        },

        gotTags: function(data) {
            //debug.log("Got Album UserTags", data);
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.album.userTags = {tags: {}};
            } else {
                self.album.userTags = data;
                updateUserTags(self.album.usertags(), "album");
            }
        },

        name: function() {
            return this.albuminfo.album.name || "";
        },

        artist: function() {
            return this.albuminfo.album.artist || "";
        },

        listeners: function() {
            return  this.albuminfo.album.listeners || 0;
        },

        playcount: function() {
            return  this.albuminfo.album.playcount || 0;
        },

        userplaycount: function() {
            return  this.albuminfo.album.userplaycount || 0;
        },

        releasedate: function() {
            return  this.albuminfo.album.releasedate || "Unknown";
        },

        url: function() {
            return  this.albuminfo.album.url || "";
        },

        tags: function() {
            try {
                return getArray(this.albuminfo.album.toptags.tag);
            } catch(err) {
                //debug.log("album tags error : ",err);
                return [];
            }
        },

        usertags: function() {
            try {
                return getArray(this.userTags.tags.tag);
            } catch(err) {
                return [];
            }
        },

        tracklisting: function() {
            try {
                return getArray(this.albuminfo.album.tracks.track);
            } catch(err) {
                return [];
            }
        },

        bio: function() {
            if(this.albuminfo.album.wiki) { return formatBio(this.albuminfo.album.wiki.content) }
            else { return "" }
        },

        image: function(size) {
            // Get image of the specified size.
            // If no image of that size exists, return a different one - just so we've got one.
            try {
                var url = "";
                var temp_url = "";
                for(var i in this.albuminfo.album.image) {
                    temp_url = this.albuminfo.album.image[i]['#text'];
                    if (this.albuminfo.album.image[i].size == size) {
                        url = temp_url;
                    }
                }
                if (url == "") { url = temp_url; }
                return url;
            } catch(err) {
                return "";
            }
        }

    }

    this.artist = {
        artistinfo: new Object,
        userTags: new Object,

        new: function(data) {
            // Called when the artist has changed and we have new Last.FM artist data
            // Note that "new Last.FM data" can also be an error response
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.ArtistChanged();
            } else {
                self.artist.artistinfo = data;
                //debug.log("Got ArtistInfo", data);
                self.artist.userTags = {tags: {}};
                updateArtistBrowser();
            }
        },

        gotTags: function(data) {
            //debug.log("Got Artist UserTags", data);
            if (data.error) {
                //debug.log("Last.FM Error",data.error,data.message);
                self.artist.userTags = {tags: {}};
            } else {
                self.artist.userTags = data;
                updateUserTags(self.artist.usertags(), "artist");
            }
        },

        name: function() {
            return this.artistinfo.artist.name || "";
        },

        bio: function() {
            if(this.artistinfo.artist.bio) { return formatBio(this.artistinfo.artist.bio.content) }
            else { return "" };
        },

        image: function(size) {
            // Get image of the specified size.
            // If no image of that size exists, return a different one - just so we've got one.
            try {
                var url = "";
                var temp_url = "";
                for(var i in this.artistinfo.artist.image) {
                    temp_url = this.artistinfo.artist.image[i]['#text'];
                    if (this.artistinfo.artist.image[i].size == size) {
                        url = temp_url;
                    }
                }
                if (url == "") { url = temp_url; }
                return url;
            } catch(err) {
                return "";
            }
        },

        listeners: function() {
            try {
                return this.artistinfo.artist.stats.listeners || 0;
            } catch(err) {
                return 0;
            }
        },

        playcount: function() {
            try {
                return this.artistinfo.artist.stats.playcount || 0;
            } catch(err) {
                return 0;
            }
        },

        userplaycount: function() {
            try {
                return this.artistinfo.artist.stats.userplaycount || 0;
            } catch(err) {
                return 0;
            }
        },

        tags: function() {
            try {
                return getArray(this.artistinfo.artist.tags.tag);
            } catch(err) {
                return [];
            }
        },

        usertags: function() {
            try {
                return getArray(this.userTags.tags.tag);
            } catch(err) {
                return [];
            }
        },

        similar: function() {
            try {
                return getArray(this.artistinfo.artist.similar.artist);
            } catch(err) {
                return [];
            }
        },

        similarimage: function(index, size) {
            try {
                var url = "";
                var temp_url = "";
                for(var i in this.artistinfo.artist.similar.artist[index].image) {
                    temp_url = this.artistinfo.artist.similar.artist[index].image[i]['#text'];
                    if (this.artistinfo.artist.similar.artist[index].image[i].size == size) {
                        url = temp_url;
                    }
                }
                if (url == "") { url = temp_url; }
                return url;
            } catch(err) {
                return "";
            }

        },

        url: function() {
            return this.artistinfo.artist.url || "";
        }
    }

    this.TrackChanged = function(data) {
        // Called when the track has changed and we got a Last.FM Error - either network error or data not found
        self.track.trackinfo = { track: {} };
        //debug.log("New track, no last.fm",current_source);
        if (current_source == "lastfm") {
            $("#trackinformation").fadeOut(1000, function() {
                $("#trackinformation").html('<h3 align="center">There is no information on Last.FM about this track</h3>');
                $("#trackinformation").fadeIn(1000);
            });
        }
    }

    this.AlbumChanged = function(data) {
        // Called when the album has changed and we got a Last.FM Error - either network error or data not found
        //debug.log("New album, no last.fm");
        self.album.albuminfo = { album: {} };
        if (current_source == "lastfm") {
            $("#albuminformation").fadeOut(1000, function() {
                $("#albuminformation").html('<h3 align="center">There is no information on Last.FM about this album</h3>');
                $("#albuminformation").fadeIn(1000);
            });
        }
    }

    this.ArtistChanged = function(data) {
        // Called when the artist has changed and we got a Last.FM Error - either network error or data not found
        self.artist.artistinfo = { artist: {} };
        //debug.log("New artist, no last.fm");
        $("#artistinformation").fadeOut(1000, function() {
            $("#artistinformation").html('<h3 align="center">There is no information on Last.FM about this artist</h3>');
            $("#artistinformation").fadeIn(1000);
        });
    }

    this.getWiki = function(link) {
        $('#artistinformation').fadeOut(1000, function() {
            $('#artistinformation').load("info_wikipedia.php?wiki="+link, function () {
                $('#artistinformation').fadeIn(1000);
                $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
            });
        });
    }

    this.switchSource = function(source) {
        //debug.log("Switching source to", source);
        doHourglass();
        current_source = source;
        switch(current_source) {
            case "wikipedia":
                self.slideshow.running = false;
                $("#albuminformation").fadeOut(1000, function() { $("#albuminformation").html(""); } );
                $("#trackinformation").fadeOut(1000, function() { $("#trackinformation").html(""); });
                updateArtistBrowser();
                $("#infopane").removeClass("infoslideshow");
                $("#infopane").addClass("infowiki");
                //$("#infopane").css("background-color", "#ffffff");
                break;
            case "lastfm":
                self.slideshow.running = false;
                updateArtistBrowser()
                updateAlbumBrowser();
                updateTrackBrowser();
                $("#infopane").removeClass("infoslideshow");
                $("#infopane").addClass("infowiki");
                //$("#infopane").css("background-color", "#ffffff");
                break;
            case "slideshow":
                $("#albuminformation").fadeOut(1000, function() { $("#albuminformation").html(""); } );
                $("#trackinformation").fadeOut(1000, function() { $("#trackinformation").html(""); });
                updateArtistBrowser();
                $("#infopane").removeClass("infowiki");
                $("#infopane").addClass("infoslideshow");
                //$("#infopane").css("background-color", "#333333");
                break;
        }
    }

    function updateArtistBrowser() {
        //debug.log("Updating Artist Browser");
         if (hidden) {
            return 0;
         }
        switch(current_source) {
            case "wikipedia":
                $('#artistinformation').fadeOut(1000, function() {
                    $('#artistinformation').load("info_wikipedia.php?artist="+encodeURIComponent(infobar.nowplaying.artist.name), function () {
                        $('#artistinformation').fadeIn(1000);
                        $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
                        revertPointer();
                    });
                });
                break;

            case "lastfm":
                $('#artistinformation').fadeOut(1000, function() {
                    //debug.log("Artist fadeout complete");
                    doArtistUpdate();
                    $('#artistinformation').fadeIn(1000);
                    revertPointer();
                });
                break;

            case "slideshow":
                $('#artistinformation').fadeOut(1000, function() {
                    getSlideShow();
                    revertPointer();
                });
                break;

        }
    }

    function updateAlbumBrowser() {
         if (hidden) {
            return 0;
         }
        switch(current_source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
                $('#albuminformation').fadeOut(1000, function() {
                    //debug.log("Album fadeout complete");
                    doAlbumUpdate();
                    $('#albuminformation').fadeIn(1000);
                });
                break;
        }
    }

    function updateTrackBrowser() {
         //debug.log("updateTrackBrowser");
         if (hidden) {
            return 0;
         }
        switch(current_source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
               // debug.log("Starting track fadeout");
                $('#trackinformation').fadeOut(1000, function() {
                    //debug.log("Track fadeout complete");
                    doTrackUpdate();
                    $('#trackinformation').fadeIn(1000);
                });
                break;
        }
    }

    this.hide = function() {
        if (hidden) {
            $("#playlist").css("width", "22%");
            $("#pcholder").css("width", "22%");
            $("#sources").css("width", "22%");
            $("#albumcontrols").css("width", "22%");
            $("#infocontrols").fadeIn('fast');
            $("#infopane").fadeIn('fast');
            hidden = false;
            self.switchSource(current_source);
        } else {
            $("#infocontrols").fadeOut('fast');
            $("#infopane").fadeOut('fast');
            $("#playlist").css("width", "50%");
            $("#pcholder").css("width", "50%");
            $("#sources").css("width", "50%");
            $("#albumcontrols").css("width", "50%");
            hidden = true;
        }
        savePrefs({hidebrowser: hidden.toString()});
    }


    function sectionHeader(data, title) {
        var html = '<div id="infosection">';
        html = html + '<table width="100%"><tr><td width="80%">';
        html = html + '<h2>'+title+' : ' + data.name() + '</h2>';
        html = html + '</td><td align="left"><a href="#" id="frog">CLICK TO HIDE</a></td><td align="right">';
        html = html + '<a href="' + data.url() + '" title="View In New Tab" target="_blank"><img src="images/lastfm.png"></a>';
        html = html + '</td></tr></table>';
        html = html + '</div>';
        html = html + '<div id="foldup">';
        html = html + '<div id="holdingcell">';
        html = html + '<div id="standout" class="stleft statsbox"><ul>';
        html = html + '<li><b>Listeners:</b> '+data.listeners()+'</li>';
        html = html + '<li><b>Plays:</b> '+data.playcount()+'</li>';
        html = html + '<li><b>Your Plays:</b> '+data.userplaycount()+'</li>';
        return html;
    }

    function doArtistUpdate() {
        //debug.log("Doing Artist Last.FM information update");
        var html = sectionHeader(self.artist, "Biography");

        html = html + '<br><li class="tiny">Hear artists similar to '+self.artist.name()+'&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmartist\', \''+self.artist.name()+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
        html = html + '<br><li class="tiny">Play what fans of '+self.artist.name()+' are listening to&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmfan\', \''+self.artist.name()+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
        html = html + '</ul><br>';

        html = html + doTags(self.artist.tags());
        html = html + tagsInput("artist");
        html = html + doUserTags("artist");

        html = html + '</div><div class="statsbox">';

        imageurl = self.artist.image("extralarge");
        if (imageurl != '') {
            html = html +  '<img class="stright" src="' + imageurl + '" id="standout" />';
        }
        html = html +  '<p>';
        html = html + self.artist.bio();
        html = html + '</p></div>';
        html = html + '</div>';

        html = html + '<div id="similarartists" class="bordered"><h3>&nbsp;&nbsp;&nbsp;&nbsp;Similar Artists</h3><table cellspacing="0" id="smlrtst"><tr>';
        var similies = self.artist.similar();
        for(var i in similies) {
            html = html + '<td class="simar" align="center"><a href="'+similies[i].url+'" target="_blank"><img src="'+self.artist.similarimage(i, "medium")+'"></a></td>';
        }
        html = html + '</tr><tr>';
        for(var i in similies) {
            html = html + '<td class="simar" align="center">'+similies[i].name+'</td>';
        }
        html = html + '</tr><tr>';
        for(var i in similies) {
            html = html + '<td class="simar" align="center"><a href="#" title="Play Artist Radio Station" onclick="doLastFM(\'lastfmartist\', \''+similies[i].name+'\')"><img src="images/start.png" height="12px"></a></td>';
        }
        html = html + '</tr></table></div>';
        html = html + '</div>';

        $("#artistinformation").html(html);
        $("#artistinformation #frog").click(function() {
            $("#artistinformation #foldup").toggle('slow');
            return false;
        });

        lastfm.artist.getTags({artist: encodeURIComponent(infobar.nowplaying.artist.name)}, browser.artist.gotTags, browser.gotFailure);
    }

    function doTags(taglist) {
        var html = '<ul><li><b>TOP TAGS:</b></li><li><table width="100%">';
        for(var i in taglist) {
            html = html + '<tr><td><a href="'+taglist[i].url+'" target="_blank">'+taglist[i].name+'</a></td>';
            html = html + '<td align="right"><a href="#" title="Play Tag Radio Station" onclick="doLastFM(\'lastfmglobaltag\', \''+taglist[i].name+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></td></tr>';
        }
        html = html + '</table></li></ul>';
        return html;
    }

    function tagsInput(type) {
        var html = '<ul id="holdingcell"><li><b>ADD TAGS</b></li>';
        html = html + '<li><input class="tiny" id="add'+type+'tags" type="text"></input></li>';
        html = html + '<li class="tiny">Add tags, comma-separated</li>';
        html = html + '<li><button class="topform topformbutton" onclick="browser.addTags(\''+type+'\')">ADD</button></li></ul>';
        return html;
    }

    function doUserTags(name) {
        var html = '<ul><li><b>YOUR TAGS:</b></li><li><table name="'+name+'tagtable" width="100%">';
        html = html + '</table></li></ul>';
        return html;
    }

    function updateUserTags(taglist, name) {
        //debug.log("Updating user tags", taglist, name);
        $('table[name="'+name+'tagtable"]').find("tr").remove();
        for(var i in taglist) {
            appendTag(name, taglist[i].name, taglist[i].url);
        }
    }

    this.addTags = function (type) {
        var tagstring = $("#add"+type+"tags").attr("value");
        //debug.log("Add tags",type, tagstring);
        var options = new Object;
        options.artist = infobar.nowplaying.artist.name;
        options[type] = infobar.nowplaying[type].name;
        options.tags = tagstring;
        lastfm[type].addTags(options, browser.tagsAdded, browser.tagAddFailed);
    }

    this.tagsAdded = function(type, tags) {
        //debug.log("Added "+tags+" to "+type);
        var options = new Object;
        options.artist = infobar.nowplaying.artist.name;
        options[type] = infobar.nowplaying[type].name;
        lastfm[type].getTags(options, browser[type].gotTags, browser[type].gotTags);
    }

    this.tagAddFailed = function(type,tags) {
        alert("Failed to add "+tags+" to "+type);
    }

    this.gotFailure = function(data) {
        //debug.log("FAILED with something:",data);
    }

    function appendTag(table, name, url) {
        var html = '<tr class="newtag" name="'+table+name+'"><td><a href="'+url+'" target="_blank">'+name+'</a></td>';
        html = html + '<td><a href="#" id="'+table+'tag" name="'+name+'"><img style="vertical-align:middle" src="images/edit-delete.png" height="12px"></a></td>';
        html = html + '<td align="right"><a href="#" onclick="doLastFM(\'lastfmglobaltag\', \''+name+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></td></tr>';
        $('table[name="'+table+'tagtable"]').append(html);
        $(".newtag").toggle(1000);
        $(".newtag").each( function(index, element) {
                                        $(element).removeClass("newtag");
                                        $(element).find("#"+table+"tag").click( function() {
                                                                var tag = $(element).find("#"+table+"tag").attr("name");
                                                                //debug.log("Clicked",tag);
                                                                var options = new Object;
                                                                options.tag = tag;
                                                                options.artist = infobar.nowplaying.artist.name;
                                                                options[table] = infobar.nowplaying[table].name;
                                                                lastfm[table].removeTag(options,
                                                                                        function(tag) {
                                                                                            //debug.log("Success for",tag);
                                                                                            $('tr[name="'+table+tag+'"]').fadeOut(1000, function() {
                                                                                                                                            $('tr[name="'+table+tag+'"]').remove();
                                                                                                                                    });
                                                                                        },
                                                                                        function(tag) {
                                                                                            alert("Failed to remove "+tag);
                                                                                        })
                                                        });
                                        return true;
                                    });

    }


    function doAlbumUpdate() {
        //debug.log("Doing Album Last.FM information update");
        var html = sectionHeader(self.album, "Album");

        html = html + '<br><ul id="buyalbum"><li><b>BUY THIS ALBUM&nbsp;</b><a href="#" onclick="browser.buyAlbum()"><img style="vertical-align:middle" src="images/cart.png"></a></li></ul>';
        html = html + '</ul><br>';

        html = html + doTags(self.album.tags());
        html = html + tagsInput("album");
        html = html + doUserTags("album");

        html = html + '</div><div class="statsbox">';
        imageurl = self.album.image("large");
        if (imageurl != '') {
            html = html +  '<img class="stright" src="' + imageurl + '" id="standout" />';
        }
        html = html +  '<p>';
        html = html + '<b>Release Date : </b>'+self.album.releasedate();
        html = html +  '</p><p><b>Track Listing:</b></p><table>';
        var tracks = self.album.tracklisting();
        for(var i in tracks) {
            html = html + '<tr><td>';
            if (tracks[i]['@attr']) { html = html + tracks[i]['@attr'].rank+':'; }
            html = html + '</td><td>'+tracks[i].name+'</td><td>'+formatTimeString(tracks[i].duration)+'</td>';
            html = html + '<td align="right"><a target="_blank" title="View Track On Last.FM" href="'+tracks[i].url+'"><img src="images/lastfm.png" height="12px"></a></td><td align="right">';
            if (tracks[i].streamable) {
                if (tracks[i].streamable['#text'] == "1") {
                    var tit = "Play Sample";
                    if (tracks[i].streamable.fulltrack == "1") { tit = "Play Track"; }
                    html = html + '<a href="#" title="'+tit+'" onclick="addLastFMTrack(\''+encodeURIComponent(self.album.artist())+'\', \''+
                    encodeURIComponent(tracks[i].name)+'\')"><img src="images/start.png" height="12px"></a>';
                }
            }
            html = html + '</td></tr>';
        }
        html = html + '</table>';
        html = html + '<p>'+self.album.bio()+'</p>';
        html = html + '</div></div></div>';
        $("#albuminformation").html(html);
        $("#albuminformation #frog").click(function() {
            $("#albuminformation #foldup").toggle('slow');
            return false;
        });
        lastfm.album.getTags({artist: encodeURIComponent(infobar.nowplaying.artist.name), album: encodeURIComponent(infobar.nowplaying.album.name)}, browser.album.gotTags, browser.gotFailure);

    }

    this.buyAlbum = function() {
        doHourglass();
        //mousepos = getPosition();
        //imagePopup.create(200,200,mousepos.x,mousepos.y);
        lastfm.album.getBuylinks({album: infobar.nowplaying.album.name, artist: infobar.nowplaying.artist.name}, browser.showAlbumBuyLinks, browser.noBuyLinks);
    }

    this.noBuyLinks = function() {
        revertPointer();
        alert("Could not find any information on buying this album");
    }

    function getBuyHtml(data) {
        revertPointer();
        var html = "";
        if (data.affiliations.physicals) {
            html = html + '<li><b>BUY ON CD:</b></li>';
            html = html + doBuyTable(getArray(data.affiliations.physicals.affiliation));
        }
        if (data.affiliations.downloads) {
            html = html + '<li><b>DOWNLOAD:</b></li>';
            html = html + doBuyTable(getArray(data.affiliations.downloads.affiliation));
        }
        return html;
    }

    this.showAlbumBuyLinks = function(data) {
        $("#buyalbum").slideUp('fast', function() {
            $("#buyalbum").css("display", "none");
            $("#buyalbum").html(getBuyHtml(data));
            $("#buyalbum").slideDown("fast").show();
        });
    }

    function doBuyTable(values) {
        var html = "";
        for(var i in values) {
            html = html + '<li><img width="12px" src="'+values[i].supplierIcon+'">&nbsp;<a href="'+values[i].buyLink+'" target="_blank">'+
                            values[i].supplierName+'</a>';
            if (values[i].price) {
                html = html + '    '+values[i].price.amount;
            }
            html = html +'</li>';
        }
        return html;
    }

    function formatBio(bio) {
        bio = bio.replace(/\n/g, "</p><p>");
        bio = bio.replace(/(<a href="http:\/\/.*?")/g, '$1 target="_blank"');
        return bio;
    }

    function doTrackUpdate() {
        //debug.log("Doing Track Last.FM information update");
        var html = sectionHeader(self.track, "Track");
        if (self.track.userloved()) {
            html = html + '<li><b>Loved:</b> Yes';
            html = html+'&nbsp;&nbsp;&nbsp;<a href="#" onclick="lastfm.track.unlove()"><img src="images/lastfm-unlove.png" height="12px"></a>';
        } else {
            html = html + '<li><b>Loved:</b> No';
            html = html+'&nbsp;&nbsp;&nbsp;<a href="#" onclick="lastfm.track.love()"><img src="images/lastfm-love.png" height="12px"></a>';
        }
        html = html  +'</li>';
        html = html + '<br><ul id="buytrack"><li><b>BUY THIS TRACK&nbsp;</b><a href="#" onclick="browser.buyTrack()"><img style="vertical-align:middle" src="images/cart.png"></a></li></ul>';
        html = html + '</ul><br>';

        html = html + doTags(self.track.tags());
        html = html + tagsInput("track");
        html = html + doUserTags("track");
        html = html + '</div>';
        html = html + '<p>'+self.track.bio()+'</p>';
        html = html + '</div>';
        html = html + '</div>';
        $("#trackinformation").html(html);

        $("#trackinformation #frog").click(function() {
            $("#trackinformation #foldup").toggle('slow');
            return false;
        });
        lastfm.track.getTags({artist: encodeURIComponent(infobar.nowplaying.artist.name), track: encodeURIComponent(infobar.nowplaying.track.name)}, browser.track.gotTags, browser.gotFailure);

    }

    this.buyTrack = function() {
        doHourglass();
        lastfm.track.getBuylinks({track: infobar.nowplaying.track.name, artist: infobar.nowplaying.artist.name}, browser.showTrackBuyLinks, browser.noBuyLinks);
    }

    this.showTrackBuyLinks = function(data) {
        $("#buytrack").slideUp('fast', function() {
            $("#buytrack").css("display", "none");
            $("#buytrack").html(getBuyHtml(data));
            $("#buytrack").slideDown("fast").show();
        });
    }


    function getSlideShow() {
        lastfm.artist.getImages({artist: infobar.nowplaying.artist.name, track: infobar.nowplaying.track.name}, browser.readySlideShow, browser.noSlideShow);
    }

    this.noSlideShow = function(data) {
        $("#artistinformation").html('<h2 align="center">No artist images could be found</h2>');
    }

    this.readySlideShow = function(data) {
        //debug.log("We got images", data);
        var html = '<div class="controlholder"><table id="slidecon" class="invisible" border="0" cellpadding="0" cellspacing ="0" width="100%">';
        html = html + '<tr height="62px"><td align="center" class="infoslideshow">';
        html = html + '<a href="#" onclick="browser.slideshow.previousimage()"><img src="images/backward.png"></a>';
        html = html + '<a href="#" onclick="browser.slideshow.toggle()"><img id="lastfmimagecontrol" src="images/pause.png"></a>';
        html = html + '<a href="#" onclick="browser.slideshow.nextimage()"><img src="images/forward.png"></a></td></tr></table></div>';
        html = html + '<table border="0" cellpadding="0" cellspacing ="0" width="100%"><tr><td align="center" class="infoslideshow"><img id="lastfmimage"></td></tr></table>';
        $("#artistinformation").html(html);
        $("#artistinformation").hover(function() { $("#slidecon").fadeIn(500); }, function() { $("#slidecon").fadeOut(500); });
        $("#artistinformation").fadeIn(1000);
        browser.slideshow.slideshowGo(data);
    }

}
