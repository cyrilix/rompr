function Info(target, source) {

    var target_frame = target;
    var self = this;
    var current_source = source;
    var hidden = false;
    var history = [];
    var displaypointer = -1;
    var panelclosed = {artist: false, album: false, track: false};

    /*
    /
    /     Various Functions to do with receiving and storing our history
    /
    */

    this.trackHasChanged = function(npinfo) {
        /* nowplaying is telling us that something has changed but it dosn't yet have data to display */
        if (displaypointer > -1 && displaypointer >= (history.length)-1) {
            var currentnames = nowplaying.getmpdnames(history[displaypointer].nowplayingindex);
            playTheWaitingGame( npinfo,
                                (currentnames.artist != npinfo.artist),
                                (currentnames.album != npinfo.album),
                                (currentnames.track != npinfo.track)
            );
        }
    }
    
    function playTheWaitingGame(npinfo, doartist, doalbum, dotrack) {
        
        clearSelection();
        if (!hidden) {
            if (doartist) {
                $("#artistinformation").html(waitingBanner('Artist', npinfo.artist));
            }
            if (doalbum) {
                $("#albuminformation").html(waitingBanner('Album', npinfo.album));
            }
            if (dotrack) {
                $("#trackinformation").html(waitingBanner('Track', npinfo.track));
            }
        }
    }
    
    function waitingBanner(title, name) {    
        var html = '<div class="infosection">';
        html = html + '<h3>'+title+' : ' + name + '  (Getting Info....)</h3>';
        html = html + '</div>';
        return html;
    }

    
    this.newTrack = function(index) {
     
        /* nowplaying is giving us some new data */
        switch (true) {
            case (displaypointer == -1):
                /* This is the first one, so yes we care, and we've nothing to compare with
                   so just go straight ahead and give us everything */
                showMeTheMonkey(index, true, true, true, nowplaying.getnames(index));
                break;
            case (displaypointer < (history.length)-1):
                /* We are not displaying the most recent entry in our history, so we don't want to update
                   but we do want to put the entry into our history*/
                var newnames = nowplaying.getnames(index);
                showMeTheMonkey(index, 
                                false,
                                false,
                                false,
                                newnames
                               );
                break;
            case (current_source == "lastfm"):
                /* When we're displaying LastFM stuff, we always care about changes */
                var currentnames = nowplaying.getnames(history[displaypointer].nowplayingindex);
                var newnames = nowplaying.getnames(index);
                showMeTheMonkey(index, 
                                (currentnames.artist != newnames.artist),
                                (currentnames.album != newnames.album),
                                (currentnames.track != newnames.track),
                                newnames
                               );
                break;
            case (current_source == "slideshow" || current_source == "wikipedia"):
                var currentnames = nowplaying.getnames(history[displaypointer].nowplayingindex);
                var newnames = nowplaying.getnames(index);
                if (currentnames.artist != newnames.artist) {
                    showMeTheMonkey(index, true, false, false, newnames);
                }
                break;
            default:
                debug.log("AWOOOOGA! Something I hadn't anticipated has just happened");
                break;
        }
    }
    
    function showMeTheMonkey(npi, showartist, showalbum, showtrack, names) {
        var thisone = history.length;
        history[thisone] = { nowplayingindex: npi,
                             source: current_source,
                             artist: names.artist,
                             album: names.album,
                             track: names.track };
        if (showartist || showalbum || showtrack) {
            displaypointer = thisone;
        }
        updateHistory();
        clearSelection();
        $('#artistinformation').stop();
        $('#albuminformation').stop();
        $('#trackinformation').stop();
        if (!hidden) {
            if (showartist) { updateArtistBrowser() };
            if (showalbum)  { updateAlbumBrowser() };
            if (showtrack)  { updateTrackBrowser() };
        }
    }
    
    this.doHistory = function(index) {
        displaypointer = index;
        updateHistory();
        clearSelection();
        if (!hidden) {
            updateArtistBrowser();
            updateAlbumBrowser();
            updateTrackBrowser();
        }
        return false;
    }
    
    this.switchSource = function(source) {
        current_source = source;
        savePrefs({infosource: source});
        self.slideshow.killTimer();
        showMeTheMonkey(nowplaying.getcurrentindex(), 
                        true,
                        (source == "lastfm" ? true : false),
                        (source == "lastfm" ? true : false),
                        nowplaying.getnames(nowplaying.getcurrentindex()));
        return false;
    }

    this.back = function() {
        self.doHistory(displaypointer-1);
        return false;
    }

    this.forward = function() {
        self.doHistory(displaypointer+1);
        return false;
    }

    this.getWiki = function(link) {
        debug.log("Getting Wiki:",link);
        var currentdisplay = {  
            artist: history[displaypointer].artist,
            album: history[displaypointer].album,
            track: history[displaypointer].track,
            nowplayingindex: history[displaypointer].nowplayingindex,
            source: "wikipedia",
            wiki: link 
        };
        history.splice(displaypointer+1,(history.length)-displaypointer,currentdisplay);
        displaypointer++;
        updateHistory();
        updateArtistBrowser();
        return false;
    }

    /*
    /
    /    Updating the three panels to show the current information
    /
    */

    function prepareArtistPane() {
        $("#infopane").removeClass("infoslideshow");
        $("#infopane").removeClass("infowiki");
        $("#infopane").addClass("infowiki");
    }

    updateArtistBrowser = function() {
        switch(history[displaypointer].source) {
            case "wikipedia":
                $("#albuminformation").fadeOut('fast');
                $("#trackinformation").fadeOut('fast');
                prepareArtistPane();
                $('#artistinformation').fadeOut('fast', function() {
                    if (history[displaypointer].artist != "") {
                        $('#artistinformation').empty();
                        setWikiWaiting('#artistinformation', "images/Wikipedia-logo.png");
                        if (history[displaypointer].wiki) {
                            $('#artistinformation').load("info_wikipedia.php?wiki="+history[displaypointer].wiki, function () {
                                $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
                            });
                        } else {
                            $('#artistinformation').load("info_wikipedia.php?artist="+encodeURIComponent(history[displaypointer].artist), function () {
                                $('#'+target_frame).animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
                            });
                        }
                    }
                });
                break;

            case "lastfm":
                prepareArtistPane();
                $('#artistinformation').fadeOut('fast', function() {
                    if (history[displaypointer].artist != "") {
                        //$('#artistinformation').empty();
                        doArtistUpdate();
                        $('#artistinformation').fadeIn(1000);
                    }
                });
                break;

            case "slideshow":
                $("#albuminformation").fadeOut('fast');
                $("#trackinformation").fadeOut('fast');
                $("#infopane").removeClass("infoslideshow");
                $("#infopane").removeClass("infowiki");
                $("#infopane").addClass("infoslideshow");
                $('#artistinformation').fadeOut('fast', function() {
                    if (history[displaypointer].artist != "") {
                        //$('#artistinformation').empty();
                        getSlideShow(history[displaypointer].artist);
                    }
                });
                break;

        }
    }

    updateAlbumBrowser = function(lfmdata) {
        switch(history[displaypointer].source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
                $('#albuminformation').fadeOut('fast', function() {
                    if (history[displaypointer].album != "") {
                        //$('#albuminformation').empty();
                        doAlbumUpdate();
                        $('#albuminformation').fadeIn(1000);
                    }
                });
                break;
        }
    }

    updateTrackBrowser = function(lfmdata) {
        switch(history[displaypointer].source) {
            case "wikipedia":
            case "slideshow":
                break;

            case "lastfm":
                $('#trackinformation').fadeOut('fast', function() {
                    if (history[displaypointer].track != "") {
                        //$('#trackinformation').empty();
                        doTrackUpdate();
                        $('#trackinformation').fadeIn(1000);
                    }
                });
                break;
        }
    }

    function setWikiWaiting(frame,image) {
        var html = '<div class="infosection">'+
                    '<table width="100%"><tr><td width="80%">'+
                    '<h2 id="flashthis">Loading...</h2>'+
                    '</td><td align="right">'+
                    '<img src="'+image+'">'+
                    '</td></tr></table>'+
                    '</div>';
        $(frame).html(html);
        html = null;
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

    function doArtistUpdate() {
        
        var lfmdata = new lfmDataExtractor(nowplaying.getArtistData(history[displaypointer].nowplayingindex));
        var html = lastFmBanner(lfmdata, "Artist", panelclosed.artist, history[displaypointer].artist);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            html = html + '<br><li class="tiny">Hear artists similar to '+history[displaypointer].artist+'&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmartist\', \''+history[displaypointer].artist+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
            html = html + '<br><li class="tiny">Play what fans of '+history[displaypointer].artist+' are listening to&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmfan\', \''+history[displaypointer].artist+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></li>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            if (lastfm.isLoggedIn()) {
                html = html + tagsInput("artist");
                html = html + doUserTags("artist");
            }

            html = html + '</div><div class="statsbox">';

            imageurl = lfmdata.image("extralarge");
            if (imageurl != '') {
                html = html +  '<img class="stright" src="' + imageurl + '" class="standout" />';
            }
            html = html +  '<p>';
            html = html + formatBio(lfmdata.bio());
            html = html + '</p></div>';
            if (lfmdata.mbid()) {
                html = html + '<p class="tiny"><img style="vertical-align:middle" src="images/musicbrainz_logo.png" width="24px"><a href="http://musicbrainz.org/artist/'+lfmdata.mbid()+'" target="_blank">View '+history[displaypointer].artist+' on Musicbrainz.org</a></p>';
            }
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
        html = null;
        $("#artistinformation .frog").click( toggleArtistInfo );
        lfmdata = null;

        if (lastfm.isLoggedIn()) {
            nowplaying.getusertags(history[displaypointer].nowplayingindex, 'artist');
        }
    }
    
    function toggleArtistInfo() {
        $("#artistinformation .foldup").toggle('slow');
        panelclosed.artist = !panelclosed.artist;
        if (panelclosed.artist) {
            $("#artistinformation .frog").text("CLICK TO SHOW");
        } else {
            $("#artistinformation .frog").text("CLICK TO HIDE");
        }
        return false;
    }

    function doAlbumUpdate() {
        
        var lfmdata = new lfmDataExtractor(nowplaying.getAlbumData(history[displaypointer].nowplayingindex));
        
        var html = lastFmBanner(lfmdata, "Album", panelclosed.album, history[displaypointer].album);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            html = html + '<br><ul id="buyalbum"><li><b>BUY THIS ALBUM&nbsp;</b><a href="#" onclick="browser.buyAlbum()"><img height="20px" id"buyalbumbutton" style="vertical-align:middle" src="images/cart.png"></a></li></ul>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            if (lastfm.isLoggedIn()) {
                html = html + tagsInput("album");
                html = html + doUserTags("album");
            }

            html = html + '</div><div class="statsbox">';
            imageurl = lfmdata.image("large");
            if (imageurl != '') {
                html = html +  '<img class="stright" src="' + imageurl + '" class="standout" />';
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
            html = html + '</div>'
            if (lfmdata.mbid()) {
                html = html + '<p class="tiny"><img style="vertical-align:middle" src="images/musicbrainz_logo.png" width="24px"><a href="http://musicbrainz.org/release/'+lfmdata.mbid()+'" target="_blank">View '+history[displaypointer].album+' on Musicbrainz.org</a></p>';
            }
            html = html + '</div>';
        }
        html = html + '</div>';
        $("#albuminformation").html(html);
        html = null;
        $("#albuminformation .frog").click( toggleAlbumInfo );
        lfmdata = null;
        if (lastfm.isLoggedIn()) {
            nowplaying.getusertags(history[displaypointer].nowplayingindex, 'album');
        }

    }
            
     function toggleAlbumInfo() {
        $("#albuminformation .foldup").toggle('slow');
        panelclosed.album = !panelclosed.album;
        if (panelclosed.album) {
            $("#albuminformation .frog").text("CLICK TO SHOW");
        } else {
            $("#albuminformation .frog").text("CLICK TO HIDE");
        }
        return false;
    }
    
    function doTrackUpdate() {
        var lfmdata = new lfmDataExtractor(nowplaying.getTrackData(history[displaypointer].nowplayingindex));
        var html = lastFmBanner(lfmdata, "Track", panelclosed.track, history[displaypointer].track);
        if (lfmdata.error()) {
            html = html + formatLastFmError(lfmdata);
        } else {
            html = html + sectionHeader(lfmdata);
            html = html + '<li name="userloved">';
            html = html +'</li>';
            
            //html = html + '<li><div class="rating"><div id="trackratebar" class="ratebar"></div><img class="stars" src="images/star.png" /></div></li>';
            
            
            html = html + '<br><ul id="buytrack"><li><b>BUY THIS TRACK&nbsp;</b><img class="clickicon" onclick="browser.buyTrack()" height="20px" id="buytrackbutton" style="vertical-align:middle" src="images/cart.png"></li></ul>';
            html = html + '</ul><br>';

            html = html + doTags(lfmdata.tags());
            if (lastfm.isLoggedIn()) {
                html = html + tagsInput("track");
                html = html + doUserTags("track");
            }
            html = html + '</div>';
            html = html + '<p>'+formatBio(lfmdata.bio())+'</p>';
            if (lfmdata.mbid()) {
                html = html + '<p class="tiny"><img style="vertical-align:middle" src="images/musicbrainz_logo.png" width="24px"><a href="http://musicbrainz.org/recording/'+lfmdata.mbid()+'" target="_blank">View '+history[displaypointer].track+' on Musicbrainz.org</a></p>';
            }            
            html = html + '</div>';
        }
        html = html + '</div>';
        $("#trackinformation").html(html);
        html = null;
        if (lastfm.isLoggedIn()) {
            if (lfmdata.userloved()) {
                doUserLoved(true)
            } else {
                doUserLoved(false);
            }
        }
        $("#trackinformation .frog").click( toggleTrackInfo )
        lfmdata = null;
        if (lastfm.isLoggedIn()) {
            nowplaying.getusertags(history[displaypointer].nowplayingindex, 'track');
        }

    }
    
    function toggleTrackInfo() {
        $("#trackinformation .foldup").toggle('slow');
        panelclosed.track = !panelclosed.track;
        if (panelclosed.track) {
            $("#trackinformation .frog").text("CLICK TO SHOW");
        } else {
            $("#trackinformation .frog").text("CLICK TO HIDE");
        }
        return false;
    }
            
    function doUserLoved(flag) {
        var html = "";
        if (flag) {
            html = html + '<b>Loved:</b> Yes';
            html = html+'&nbsp;&nbsp;&nbsp;<a title="Unlove This Track" href="#" onclick="browser.unlove()"><img src="images/lastfm-unlove.png" height="12px"></a>';
        } else {
            html = html + '<li><b>Loved:</b> No';
            html = html+'&nbsp;&nbsp;&nbsp;<a title="Love This Track" href="#" onclick="browser.love()"><img src="images/lastfm-love.png" height="12px"></a>';
        }
        $('li[name="userloved"]').html(html);
        html = null;
    }

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

    function lastFmBanner(data, title, hidden, name) {    
        var html = '<div class="infosection">';
        html = html + '<table width="100%"><tr><td width="80%">';
        html = html + '<h2>'+title+' : ' + name + '</h2>';
        html = html + '</td><td align="left"><a href="#" class="frog">';
        if (hidden) {
            html = html + "CLICK TO SHOW";
        } else {
            html = html + "CLICK TO HIDE";
        }
        html = html + '</a></td><td align="right">';
        html = html + '<a href="' + data.url() + '" title="View In New Tab" target="_blank"><img src="images/lastfm.png"></a>';
        html = html + '</td></tr></table>';
        html = html + '</div>';
        html = html + '<div class="foldup"';
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
        var html = '<ul class="holdingcell"><li><b>ADD TAGS</b></li>';
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

    this.userTagsIncoming = function(taglist, name, index) {
        if (index == history[displaypointer].nowplayingindex && history[displaypointer].source == "lastfm") {
            debug.log("Receieved user tag data for",name,taglist);
            stopWaitingIcon("tagadd"+name);
            $('table[name="'+name+'tagtable"]').find("tr").remove();
            for(var i in taglist) {
                appendTag(name, taglist[i].name, taglist[i].url);
            }
        }
    }

    this.addTags = function (type) {
        makeWaitingIcon("tagadd"+type);
        nowplaying.addtags(history[displaypointer].nowplayingindex, type, $("#add"+type+"tags").attr("value"));
    }

    this.tagAddFailed = function(type,tags) {
        stopWaitingIcon("tagadd"+type);
        infobar.notify(infobar.ERROR, "Failed to add "+tags+" to "+type);
    }

    this.tagRemoveFailed = function(type,tags) {
        stopWaitingIcon("tagadd"+type);
        infobar.notify(infobar.ERROR, "Failed to remove tag "+tags);
    }
    
    this.gotFailure = function(data) {
        debug.log("FAILED with something:",data);
        infobar.notify(infobar.ERROR, "Unspecified, non-serious error. Carry on as if nothing had happened");
    }

    function appendTag(table, name, url) {
        var html = '<tr class="newtag" name="'+table+name+'"><td><a href="'+url+'" target="_blank">'+name+'</a></td>';
        html = html + '<td><a href="#" id="'+table+'tag" name="'+name+'"><img style="vertical-align:middle" src="images/edit-delete.png" height="12px"></a></td>';
        html = html + '<td align="right"><a href="#" onclick="doLastFM(\'lastfmglobaltag\', \''+name+'\')"><img style="vertical-align:middle" src="images/start.png" height="12px"></a></td></tr>';
        $('table[name="'+table+'tagtable"]').append(html);
        html = null;
        $(".newtag").toggle(1000);
        $(".newtag").each( function(index, element) {
            $(element).removeClass("newtag");
            $(element).find("#"+table+"tag").click( function() {
                var tag = $(element).find("#"+table+"tag").attr("name");
                nowplaying.removetags(history[displaypointer].nowplayingindex, table, tag);
            });
            return true;
        });

    }

    /*
    /    Generating the HTML for the Buy Album and Buy Track sections
    */

    this.buyAlbum = function() {
        makeWaitingIcon("buyalbumbutton");
        lastfm.album.getBuylinks({album: history[displaypointer].album, artist: nowplaying.albumartist(history[displaypointer].nowplayingindex)}, browser.showAlbumBuyLinks, browser.noAlbumBuyLinks);
    }

    this.noAlbumBuyLinks = function() {
        stopWaitingIcon("buyalbumbutton");
        infobar.notify(infobar.NOTIFY, "Could not find any information on buying this album");
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
        lastfm.track.getBuylinks({track: history[displaypointer].track, artist: history[displaypointer].artist}, browser.showTrackBuyLinks, browser.noTrackBuyLinks);
        return false;
    }

    this.noTrackBuyLinks = function() {
        stopWaitingIcon("buytrackbutton");
        infobar.notify(infobar.NOTIFY, "Could not find any information on buying this track");
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
    
    this.thePubsCloseTooEarly = function() {
        /* nowplaying has truncated its history by removing the first one in its list.
         * This means that all of our stored indices are now out by one
         * so we must adjust them
         */
        debug.log("Reducing the badger episodes becasue of too many carrots");
        for (var i in history) {
            var sidePocketForAToad = history[i].nowplayingindex;
            history[i].nowplayingindex = sidePocketForAToad-1;
        }
    }

    function updateHistory() {
        if (displaypointer > 0) {
            if (history.length > max_history_length) {
                var t = history.shift();
                displaypointer--;
            }
        }

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
            html = html + '"></td><td><a href="#" onclick="browser.doHistory('+count.toString()+')">';
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
                        s = this.artist;
                    }
                    html = html + s.replace(/_/g, " ");
                    break;
                case "lastfm":
                    html = html + this.track;
                    if (this.track != "" && this.artist != "") {
                        html = html + " <small><i>by</i></small> "
                    }
                    html = html + this.artist;
                    if ((this.track != "" || this.artist != "") && this.album != "") {
                        html = html + " <small><i>on</i></small> "
                    }
                    html = html + this.album;
                    break;
            }
            if (count == displaypointer) {
                html = html + '</b>';
            }
            html = html + '</a></td></tr>'
            count++;
        });
        html = html + '</table></li>';
        $("#historypanel").empty();
        $("#historypanel").html(html);
        html = null;
    }

    /*
    /
    /    Love and Ban
    /
    */

    this.love = function() {
        nowplaying.love(history[displaypointer].nowplayingindex);
        return false;
    }

    this.unlove = function() {
        nowplaying.unlove(history[displaypointer].nowplayingindex);
        return false;
    }

    this.justloved = function(index, flag) {
        if (index == history[displaypointer].nowplayingindex) {
            debug.log("The track we are viewing has just been loved. Aaaaahhhhhhh");
            if (history[displaypointer].source == "lastfm") {
                debug.log("We shall reflect that change");
                doUserLoved(flag);
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
    
    this.noImages = function() {
        infobar.notify(infobar.NOTIFY, "No images found for "+artist);
    }

    this.prepareSlideshow = function(data) {
        var html = '<div class="controlholder"><table id="slidecon" class="invisible" border="0" cellpadding="0" cellspacing ="0" width="100%">';
        html = html + '<tr height="62px"><td align="center" class="infoslideshow">';
        html = html + '<img class="clickicon" onclick="browser.slideshow.nextimage(-1)" src="images/backward.png">';
        html = html + '<img class="clickicon" onclick="browser.slideshow.toggle()" id="lastfmimagecontrol" src="images/pause.png">';
        html = html + '<img class="clickicon" onclick="browser.slideshow.nextimage(1)" src="images/forward.png"></td></tr></table></div>';
        html = html + '<table border="0" cellpadding="0" cellspacing ="0" width="100%"><tr><td align="center" class="infoslideshow"><img id="lastfmimage"></td></tr></table>';
        $("#artistinformation").html(html);
        html = null;
        $("#artistinformation").hover(function() { $("#slidecon").fadeIn(500); }, function() { $("#slidecon").fadeOut(500); });
        $("#artistinformation").fadeIn(1000);
        self.slideshow.slideshowGo(data);
    }

    this.slideshow = function() {
        
        // var running = false;
        var paused = false;
        var images = [];
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
                    self.slideshow.cacheImage();
                }
                if (timer_running) {
                    clearTimeout(timer);
                    timer_running = false;
                }
                self.slideshow.displayimage(false);
            },

            timerExpiry: function() {
                debug.log("Timer Expired");
                timer_running = false;
                self.slideshow.displayimage(paused);
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
                    self.slideshow.displayimage(paused);
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
                if (counter >= images.length) { counter = 0; }
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
                        timer = setTimeout( browser.slideshow.timerExpiry, 10000);
                        timer_running = true;
                    }
                }
            }
        }

    }();

}
