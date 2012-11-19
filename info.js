function Info(target, source) {

    var target_frame = target;
    var self = this;
    var current_source = source;
    var hidden = false;
    var history = new Array();
    var displaypointer = -1;
    var autoupdate = true;
    var panelclosed = {artist: false, album: false, track: false};

    /*
    /
    /     Various Functions to do with receiving and storing our history
    /
    */

    this.updatesComing = function(stuff) {
        // nowplaying sends us this, populated with 3 last.fm objects every time
        // it detects that the playing track has changed.
        stuff.source = current_source;
        if ((current_source == "wikipedia" || current_source == "slideshow") && history.length > 0) {
            if (stuff.artist.mpd_name != history[(history.length)-1].artist.mpd_name && 
                stuff.artist.mpd_name != "") {
                // For Wikipedia or Slideshow, we only bother with the data if the artist is
                // different to the currently displayed artist and has a name, since we only care about artists
                history.push(stuff);
                if (autoupdate) {
                    self.doBrowserUpdates((history.length)-1);
                } else {
                    updateHistory();
                }
            }
        } else {
            if (stuff.artist.mpd_name != "" || stuff.album.mpd_name != "" || stuff.track.mpd_name != "") {
                // For Last.FM, so long as at least one of the items has a name, we use the data.
                // The case where no items have names is the case where nothing is in the playlist,
                // or the last playing track has been removed while the playlist was stopped,
                // or probably some other bizzarre edge case that mpd will throw at me some time.
                history.push(stuff);
                if (autoupdate) {
                    self.doBrowserUpdates((history.length)-1);
                } else {
                    updateHistory();
                }
            }
        }
    }

    this.doBrowserUpdates = function(which) {
        var hp_sauce = current_source;
        var hp_pointer = displaypointer;
        current_source = history[which].source;
        displaypointer = which;
        
        // 5 things we check for the artist before we decide to display the data:
        // 1. hp_pointer = -1 means this is the first thing we've displayed
        // 2. if either the new or current items are wiki items (links followed from wikipedia pages)
        //      then we must just display as the artist info in those is irrelevant and could be the same
        // 3. see above
        // 4. data source has changed
        // 5. artist name has changed
        // For track and album it's less complicated but much the same

        // Note that the last.fm objects exist but may contain no data at this point -
        //  they are populating themselves through the magic of asynchronous JSON requests
        //  If we want the data we tell them we want it and they will call us back when they have it

        if (hp_pointer == -1 || 
            history[which].wiki || 
            history[hp_pointer].wiki || 
            hp_sauce != history[which].source || 
            history[which].artist.mpd_name != history[hp_pointer].artist.mpd_name) 
        {
            history[which].artist.showMe();
        }
        if (hp_pointer == -1 || 
            hp_sauce != history[which].source || 
            history[which].album.mpd_name != history[hp_pointer].album.mpd_name) 
        {
            history[which].album.showMe();
        }
        if (hp_pointer == -1 || 
            hp_sauce != history[which].source || 
            history[which].track.mpd_name != history[hp_pointer].track.mpd_name) 
        {
            history[which].track.showMe();
        }
        if (displaypointer == (history.length)-1) {
            autoupdate = true;
        } else {
            autoupdate = false;
        }
        updateHistory();
    }

    this.switchSource = function(source) {
        var playingtrack = { 
            artist: nowplaying.artist.lfm_data,
            album: nowplaying.album.lfm_data,
            track: nowplaying.track.lfm_data,
            source: source 
        };
        history.push(playingtrack);
        savePrefs({infosource: source});
        self.slideshow.killTimer();
        self.doBrowserUpdates((history.length)-1)
    }

    this.back = function() {
        self.doBrowserUpdates(displaypointer-1);
    }

    this.forward = function() {
        self.doBrowserUpdates(displaypointer+1);
    }

    this.getWiki = function(link) {
        debug.log("Getting Wiki:",link);
        var currentdisplay = {  
            artist: history[displaypointer].artist,
            album: history[displaypointer].album,
            track: history[displaypointer].track,
            source: "wikipedia",
            wiki: link 
        };
        history.splice(displaypointer+1,(history.length)-displaypointer,currentdisplay);
        displaypointer++;
        updateHistory();
        self.updateArtistBrowser(currentdisplay.artist);
    }

    /*
    /
    /    Updating the three panels to show the current information
    /
    */

    function noNeedToDisplay(lfmdata, selector) {
        if (lfmdata.mpd_name == "") {
            $(selector).fadeOut('fast');
        }
        if (hidden || lfmdata.mpd_name == "") {
            return true;
        }
        return false;
    }

    function prepareArtistPane() {
        $("#infopane").removeClass("infoslideshow");
        $("#infopane").removeClass("infowiki");
        $("#infopane").addClass("infowiki");
    }

    this.updateArtistBrowser = function(lfmdata) {
        if (noNeedToDisplay(lfmdata, "#artistinformation")) { return 0; }
        switch(current_source) {
            case "wikipedia":
                $("#albuminformation").fadeOut('fast');
                $("#trackinformation").fadeOut('fast');
                prepareArtistPane();
                $('#artistinformation').fadeOut('fast', function() {
                    setWikiWaiting('#artistinformation', "images/Wikipedia-logo.png");
                    if (history[displaypointer].wiki) {
                        $('#artistinformation').load("info_wikipedia.php?wiki="+history[displaypointer].wiki, function () {
                            $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
                        });
                    } else {
                        $('#artistinformation').load("info_wikipedia.php?artist="+encodeURIComponent(history[displaypointer].artist.name()), function () {
                            $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
                        });
                    }
                });
                break;

            case "lastfm":
                prepareArtistPane();
                $('#artistinformation').fadeOut('fast', function() {
                    doArtistUpdate(lfmdata);
                    $('#artistinformation').fadeIn(1000);
                });
                break;

            case "slideshow":
                $("#albuminformation").fadeOut('fast');
                $("#trackinformation").fadeOut('fast');
                $("#infopane").removeClass("infoslideshow");
                $("#infopane").removeClass("infowiki");
                $("#infopane").addClass("infoslideshow");
                $('#artistinformation').fadeOut('fast', function() {
                    getSlideShow(lfmdata.mpd_name);
                });
                break;

        }
    }

    this.updateAlbumBrowser = function(lfmdata) {
        if (noNeedToDisplay(lfmdata, "#albuminformation")) { return 0; }
        switch(current_source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
                $('#albuminformation').fadeOut('fast', function() {
                    doAlbumUpdate(lfmdata);
                    $('#albuminformation').fadeIn(1000);
                });
                break;
        }
    }

    this.updateTrackBrowser = function(lfmdata) {
        if (noNeedToDisplay(lfmdata, "#trackinformation")) { return 0; }
        switch(current_source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
                $('#trackinformation').fadeOut('fast', function() {
                    doTrackUpdate(lfmdata);
                    $('#trackinformation').fadeIn(1000);
                });
                break;
        }
    }

    function setWikiWaiting(frame,image) {
        var html = '<div id="infosection">'+
                    '<table width="100%"><tr><td width="80%">'+
                    '<h2 id="flashthis">Loading...</h2>'+
                    '</td><td align="right">'+
                    '<img src="'+image+'">'+
                    '</td></tr></table>'+
                    '</div>';
        $(frame).html(html);
        $('#flashthis').effect('pulsate', { times:100 }, 2000);
        $(frame).fadeIn('fast');
    }

    this.hide = function() {
        if (hidden) {
            hidden = false;
            self.switchSource(current_source);
        } else {
            hidden = true;
        }
        savePrefs({hidebrowser: hidden.toString()});
        doThatFunkyThang();
    }

    this.hiddenState = function() {
        return hidden;
    }

    /*
    /
    /    Generating the HTML for each of the panels
    /
    */

    function doArtistUpdate(lfmdata) {
        var html = lastFmBanner(lfmdata, "Artist", panelclosed.artist);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            html = html + '<br><li class="tiny">Hear artists similar to '+lfmdata.name()+'&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmartist\', \''+lfmdata.name()+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
            html = html + '<br><li class="tiny">Play what fans of '+lfmdata.name()+' are listening to&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmfan\', \''+lfmdata.name()+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            html = html + tagsInput("artist");
            html = html + doUserTags("artist");

            html = html + '</div><div class="statsbox">';

            imageurl = lfmdata.image("extralarge");
            if (imageurl != '') {
                html = html +  '<img class="stright" src="' + imageurl + '" id="standout" />';
            }
            html = html +  '<p>';
            html = html + formatBio(lfmdata.bio());
            html = html + '</p></div>';
            html = html + '</div>';

            html = html + '<div id="similarartists" class="bordered"><h3 align="center">Similar Artists</h3><table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table cellspacing="0" id="smlrtst"><tr>';
            var similies = lfmdata.similar();
            for(var i in similies) {
                html = html + '<td class="simar" align="center"><a href="'+similies[i].url+'" target="_blank"><img src="'+lfmdata.similarimage(i, "medium")+'"></a></td>';
            }
            html = html + '</tr><tr>';
            for(var i in similies) {
                html = html + '<td class="simar" align="center">'+similies[i].name+'</td>';
            }
            html = html + '</tr><tr>';
            for(var i in similies) {
                html = html + '<td class="simar" align="center"><a href="#" title="Play Artist Radio Station" onclick="doLastFM(\'lastfmartist\', \''+similies[i].name+'\')"><img src="images/start.png" height="12px"></a></td>';
            }
            html = html + '</tr></table></td></tr></table></div>';
        }
        html = html + '</div>';

        $("#artistinformation").html(html);
        $("#artistinformation #frog").click(function() {
            $("#artistinformation #foldup").toggle('slow');
            panelclosed.artist = !panelclosed.artist;
            if (panelclosed.artist) {
                $("#artistinformation #frog").text("CLICK TO SHOW");
            } else {
                $("#artistinformation #frog").text("CLICK TO HIDE");
            }
            return false;
        });

        self.updateUserTags(lfmdata.usertags(), "artist")

    }

    function doAlbumUpdate(lfmdata) {
        var html = lastFmBanner(lfmdata, "Album", panelclosed.album);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            html = html + '<br><ul id="buyalbum"><li><b>BUY THIS ALBUM&nbsp;</b><a href="#" onclick="browser.buyAlbum()"><img height="20px" id"buyalbumbutton" style="vertical-align:middle" src="images/cart.png"></a></li></ul>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            html = html + tagsInput("album");
            html = html + doUserTags("album");

            html = html + '</div><div class="statsbox">';
            imageurl = lfmdata.image("large");
            if (imageurl != '') {
                html = html +  '<img class="stright" src="' + imageurl + '" id="standout" />';
            }
            html = html +  '<p>';
            html = html + '<b>Release Date : </b>'+lfmdata.releasedate();
            html = html +  '</p><p><b>Track Listing:</b></p><table>';
            var tracks = lfmdata.tracklisting();
            for(var i in tracks) {
                html = html + '<tr><td>';
                if (tracks[i]['@attr']) { html = html + tracks[i]['@attr'].rank+':'; }
                html = html + '</td><td>'+tracks[i].name+'</td><td>'+formatTimeString(tracks[i].duration)+'</td>';
                html = html + '<td align="right"><a target="_blank" title="View Track On Last.FM" href="'+tracks[i].url+'"><img src="images/lastfm.png" height="12px"></a></td><td align="right">';
                if (tracks[i].streamable) {
                    if (tracks[i].streamable['#text'] == "1") {
                        var tit = "Play Sample";
                        if (tracks[i].streamable.fulltrack == "1") { tit = "Play Track"; }
                        html = html + '<a href="#" title="'+tit+'" onclick="addLastFMTrack(\''+encodeURIComponent(lfmdata.artist())+'\', \''+
                        encodeURIComponent(tracks[i].name)+'\')"><img src="images/start.png" height="12px"></a>';
                    }
                }
                html = html + '</td></tr>';
            }
            html = html + '</table>';
            html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
            html = html + '</div></div>';
        }
        html = html + '</div>';
        $("#albuminformation").html(html);
        $("#albuminformation #frog").click(function() {
            $("#albuminformation #foldup").toggle('slow');
            panelclosed.album = !panelclosed.album;
            if (panelclosed.album) {
                $("#albuminformation #frog").text("CLICK TO SHOW");
            } else {
                $("#albuminformation #frog").text("CLICK TO HIDE");
            }
            return false;
        });
        self.updateUserTags(lfmdata.usertags(), "album")

    }

    function doTrackUpdate(lfmdata) {
        var html = lastFmBanner(lfmdata, "Track", panelclosed.track);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            if (lfmdata.userloved()) {
                html = html + '<li><b>Loved:</b> Yes';
                html = html+'&nbsp;&nbsp;&nbsp;<a href="#" onclick="browser.unlove()"><img src="images/lastfm-unlove.png" height="12px"></a>';
            } else {
                html = html + '<li><b>Loved:</b> No';
                html = html+'&nbsp;&nbsp;&nbsp;<a href="#" onclick="browser.love()"><img src="images/lastfm-love.png" height="12px"></a>';
            }
            html = html  +'</li>';
            html = html + '<br><ul id="buytrack"><li><b>BUY THIS TRACK&nbsp;</b><a href="#" onclick="browser.buyTrack()"><img height="20px" id="buytrackbutton" style="vertical-align:middle" src="images/cart.png"></a></li></ul>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            html = html + tagsInput("track");
            html = html + doUserTags("track");
            html = html + '</div>';
            html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
            html = html + '</div>';
        }
        html = html + '</div>';
        $("#trackinformation").html(html);

        $("#trackinformation #frog").click(function() {
            $("#trackinformation #foldup").toggle('slow');
            panelclosed.track = !panelclosed.track;
            if (panelclosed.track) {
                $("#trackinformation #frog").text("CLICK TO SHOW");
            } else {
                $("#trackinformation #frog").text("CLICK TO HIDE");
            }
            return false;
        });
        self.updateUserTags(lfmdata.usertags(), "track")

    }

    function formatLastFmError(lfmdata) {
        return '<h3 align="center">'+lfmdata.error()+'</h3>';
    }

    function sectionHeader(data) {
        var html = '<div id="holdingcell">';
        html = html + '<div id="standout" class="stleft statsbox"><ul>';
        html = html + '<li><b>Listeners:</b> '+data.listeners()+'</li>';
        html = html + '<li><b>Plays:</b> '+data.playcount()+'</li>';
        html = html + '<li><b>Your Plays:</b> '+data.userplaycount()+'</li>';
        return html;
    }

    function lastFmBanner(data, title, hidden) {    
        var html = '<div id="infosection">';
        html = html + '<table width="100%"><tr><td width="80%">';
        html = html + '<h2>'+title+' : ' + data.name() + '</h2>';
        html = html + '</td><td align="left"><a href="#" id="frog">';
        if (hidden) {
            html = html + "CLICK TO SHOW";
        } else {
            html = html + "CLICK TO HIDE";
        }
        html = html + '</a></td><td align="right">';
        html = html + '<a href="' + data.url() + '" title="View In New Tab" target="_blank"><img src="images/lastfm.png"></a>';
        html = html + '</td></tr></table>';
        html = html + '</div>';
        html = html + '<div id="foldup"';
        if (hidden) {
            html = html + ' class="invisible"';
        }
        html = html + '>';
        return html;
    }

    function formatBio(bio) {
        if (bio) {
            bio = bio.replace(/\n/g, "</p><p>");
            bio = bio.replace(/(<a .*?href="http:\/\/.*?")/g, '$1 target="_blank"');
            return bio;
        } else {
            return "";
        }
    }

    /*
    /    Generating HTML for the various Last.FM tag sections
    */

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
        html = html + '<li><input class="tiny inbrowser" id="add'+type+'tags" type="text"></input></li>';
        html = html + '<li class="tiny">Add tags, comma-separated</li>';
        html = html + '<li><button class="topformbutton tiny" onclick="browser.addTags(\''+type+'\')">ADD</button>'+
                        '<img class="tright waiting" id="tagadd'+type+'" height="20px" src="images/transparent-32x32.png"></li></ul>';
        return html;
    }

    function doUserTags(name) {
        var html = '<ul><li><b>YOUR TAGS:</b></li><li><table name="'+name+'tagtable" width="100%">';
        html = html + '</table></li></ul>';
        return html;
    }

    this.updateUserTags = function(taglist, name) {
        stopWaitingIcon("tagadd"+name);
        $('table[name="'+name+'tagtable"]').find("tr").remove();
        for(var i in taglist) {
            appendTag(name, taglist[i].name, taglist[i].url);
        }
    }

    this.addTags = function (type) {
        makeWaitingIcon("tagadd"+type);
        history[displaypointer][type].addTags($("#add"+type+"tags").attr("value"));
    }

    this.tagAddFailed = function(type,tags) {
        stopWaitingIcon("tagadd"+type);
        alert("Failed to add "+tags+" to "+type);
    }

    this.gotFailure = function(data) {
        debug.log("FAILED with something:",data);
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
                var options = new Object;
                options.tag = tag;
                options.artist = history[displaypointer].artist.name();
                options[table] = history[displaypointer][table].name();
                makeWaitingIcon("tagadd"+table);
                lastfm[table].removeTag(
                    options,
                    function(tag) {
                        $('tr[name="'+table+tag+'"]').fadeOut('fast', function() {
                            $('tr[name="'+table+tag+'"]').remove();
                            stopWaitingIcon("tagadd"+table);
                        });
                    },
                    function(tag) {
                        alert("Failed to remove "+tag);
                        stopWaitingIcon("tagadd"+table);
                    }
                );
            });
            return true;
        });

    }

    /*
    /    Generating the HTML for the Buy Album and Buy Track sections
    */

    this.buyAlbum = function() {
        makeWaitingIcon("buyalbumbutton");
        lastfm.album.getBuylinks({album: history[displaypointer].album.name(), artist: history[displaypointer].artist.name()}, browser.showAlbumBuyLinks, browser.noAlbumBuyLinks);
    }

    this.noAlbumBuyLinks = function() {
        stopWaitingIcon("buyalbumbutton");
        alert("Could not find any information on buying this album");
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

    this.buyTrack = function() {
        makeWaitingIcon("buytrackbutton");
        lastfm.track.getBuylinks({track: history[displaypointer].track.name(), artist: history[displaypointer].artist.name()}, browser.showTrackBuyLinks, browser.noTrackBuyLinks);
    }

    this.noTrackBuyLinks = function() {
        stopWaitingIcon("buytrackbutton");
        alert("Could not find any information on buying this track");
    }


    this.showTrackBuyLinks = function(data) {
        $("#buytrack").slideUp('fast', function() {
            $("#buytrack").css("display", "none");
            $("#buytrack").html(getBuyHtml(data));
            $("#buytrack").slideDown("fast").show();
        });
    }

    /*
    /
    /    History Buttons and Menu
    /
    */

    function updateHistory() {
        if (displaypointer > 0) {
            if (history.length > max_history_length) {
                var t = history.shift();
                displaypointer--;
            }
        }
        updateHistoryButtons();
        updateHistoryMenu();
    }

    function updateHistoryButtons() {
        if (displaypointer == 0) {
            $("#backbutton").unbind('click');
            $("#backbutton").removeAttr("href");
            $("#backbutton img").attr("src", "images/backbutton_disabled.png");
        }
        if (displaypointer > 0 && $("#backbutton").attr("href")==undefined) { 
            $("#backbutton").attr("href", "#");
            $("#backbutton").click(function () {browser.back()});
            $("#backbutton img").attr("src", "images/backbutton.png");
        }
        if (displaypointer == (history.length)-1) {
            $("#forwardbutton").unbind('click');
            $("#forwardbutton").removeAttr("href");
            $("#forwardbutton img").attr("src", "images/forwardbutton_disabled.png");
        }
        if (displaypointer < (history.length)-1 && $("#forwardbutton").attr("href")==undefined) { 
            $("#forwardbutton").attr("href", "#");
            $("#forwardbutton").click(function () {browser.forward()});
            $("#forwardbutton img").attr("src", "images/forwardbutton.png");
        }
    }

    function updateHistoryMenu() {
        var html = '<li class="wider"><b>HISTORY</b></li>';
        html = html + '<li class="wider"><table width="100%">';
        var count = 0;
        $.each(history, function() {
            if (count == displaypointer) {
                html = html + '<tr><td width="20px"><img height="16px" src="';
            } else {
                html = html + '<tr><td width="16px"><img height="12px" src="';
            }
            switch (this.source) {
                case "wikipedia":
                    html = html +  'images/Wikipedia-logo.png';
                    break;
                case "lastfm":
                    html = html + 'images/lastfm.png';
                    break;
                case "slideshow":
                    html = html + 'images/slideshow.png';
                    break;
            }
            html = html + '"></td><td><a href="#" onclick="browser.doBrowserUpdates('+count.toString()+')">';
            if (count == displaypointer) {
                html = html + '<b>';
            }
            switch (this.source) {
                case "wikipedia":
                case "slideshow":
                    var s;
                    if (this.wiki) {
                        s = this.wiki;
                    } else {
                        s = this.artist.mpd_name;
                    }
                    html = html + s.replace(/_/g, " ");
                    break;
                case "lastfm":
                    html = html + this.track.mpd_name;
                    if (this.track.mpd_name != "" && this.artist.mpd_name != "") {
                        html = html + " <small><i>by</i></small> "
                    }
                    html = html + this.artist.mpd_name;
                    if ((this.track.mpd_name != "" || this.artist.mpd_name != "") && this.album.mpd_name != "") {
                        html = html + " <small><i>on</i></small> "
                    }
                    html = html + this.album.mpd_name;
                    break;
            }
            if (count == displaypointer) {
                html = html + '</b>';
            }
            html = html + '</a></td></tr>'
            count++;
        });
        html = html + '</table></li>';
        $("#historypanel").html(html);
    }

    /*
    /
    /    Love and Ban
    /
    */

    this.love = function() {
        lastfm.track.love(history[displaypointer].track.name(), history[displaypointer].artist.name(), self.justloved);
    }

    this.unlove = function() {
        lastfm.track.unlove(history[displaypointer].track.name(), history[displaypointer].artist.name(), self.justloved);
    }

    this.justloved = function(track,artist) {
        if (track == history[displaypointer].track.name() &&
            artist == history[displaypointer].artist.name())
        {
            history[displaypointer].track.trackinfo = null;
            history[displaypointer].track.populate();
            if (current_source == "lastfm") {
                history[displaypointer].track.showMe();
            }
        }
    }

    /*
    /
    /    Slideshow
    /
    */
   
    function getSlideShow(artist) {
        lastfm.artist.getImages({artist: artist}, self.prepareSlideshow, self.noImages);
    }

    this.prepareSlideshow = function(data) {
        var html = '<div class="controlholder"><table id="slidecon" class="invisible" border="0" cellpadding="0" cellspacing ="0" width="100%">';
        html = html + '<tr height="62px"><td align="center" class="infoslideshow">';
        html = html + '<a href="#" onclick="browser.slideshow.nextimage(-1)"><img src="images/backward.png"></a>';
        html = html + '<a href="#" onclick="browser.slideshow.toggle()"><img id="lastfmimagecontrol" src="images/pause.png"></a>';
        html = html + '<a href="#" onclick="browser.slideshow.nextimage(1)"><img src="images/forward.png"></a></td></tr></table></div>';
        html = html + '<table border="0" cellpadding="0" cellspacing ="0" width="100%"><tr><td align="center" class="infoslideshow"><img id="lastfmimage"></td></tr></table>';
        $("#artistinformation").html(html);
        $("#artistinformation").hover(function() { $("#slidecon").fadeIn(500); }, function() { $("#slidecon").fadeOut(500); });
        $("#artistinformation").fadeIn(1000);
        self.slideshow.slideshowGo(data);
    }

    this.slideshow = function() {
        
        // var running = false;
        var paused = false;
        var images = new Array();
        var counter = 0;
        var timer_running = false;
        var timer = 0;
        var direction = 0;
        var img = new Image();
        img.onload = function() {
            debug.log("Next Image Loaded",img.src);
            browser.slideshow.displayimage(paused);
        }

        img.onerror = function() {
            debug.log("Next Image Failed To Load",img.src);
            browser.slideshow.displayimage(paused);
        }

        return {

            slideshowGo: function(data) {
                debug.log("Slideshow Initialising");
                images = [];
                if (timer_running) {
                    clearTimeout(timer);
                    timer_running = false;
                }
                if (data.images.image) {
                    var imagedata = getArray(data.images.image);
                    for(var i in imagedata) {
                        var u = imagedata[i].sizes.size[0]["#text"];
                        images.push({url: u});
                    }
                    counter = -1;
                    running = true;
                    direction = 1;
                    paused = false;
                    this.cacheImage();
                } else {
                    // running = false;
                    $("#artistinformation").html('<h3 align="center">No artist images could be found</h3>');
                }

            },

            // Used by the back/forward buttons
            nextimage: function(dir) {
                if (direction != dir) {
                    direction = dir;
                    counter+=direction;
                    this.cacheImage();
                }
                if (timer_running) {
                    clearTimeout(timer);
                    timer_running = false;
                }
                this.displayimage(false);
            },

            timerExpiry: function() {
                debug.log("Timer Expired");
                timer_running = false;
                this.displayimage(paused);
            },

            killTimer: function() {
                if (timer_running) {
                    clearTimeout(timer);
                    timer_running = false;
                }
            },

            toggle: function() {
                if (paused) {
                    $('#lastfmimagecontrol').attr("src", "images/pause.png");
                    paused = false;
                    this.displayimage(paused);
                } else {
                    $('#lastfmimagecontrol').attr("src", "images/play.png");
                    paused = true;
                    if (timer_running) {
                        clearTimeout(timer);
                        timer_running = false;
                    }
                }
            },

            cacheImage: function() {
                counter += direction;
                if (counter == images.length) { counter = 0; }
                if (counter < 0) { counter = images.length-1; }
                img.src = images[counter].url;
                debug.log("Image Caching Started", img.src);
            },

            displayimage: function(p) {
                if (!timer_running && img.complete && !p) {
                    debug.log("Displaying Image",img.src);
                    var windowheight = $("#"+target_frame).height();
                    var windowwidth = $("#"+target_frame).width();
                    var imageheight = img.height;
                    var imagewidth = img.width;
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

                    $("#lastfmimage").fadeOut(500, function() {  

                            $("#lastfmimage").attr( {   src:    img.src,
                                                        width:  parseInt(displaywidth),
                                                        height: parseInt(displayheight) });

                            $("#lastfmimage").fadeIn(500, function() {browser.slideshow.cacheImage()});
                    });

                    if (!paused && images.length > 1) {
                        timer = setTimeout("browser.slideshow.timerExpiry()", 10000);
                        timer_running = true;
                    }
                }
            }
        };

    }();

}
