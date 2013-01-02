function Playlist() {

    var self = this;
    var tracklist = [];
    var currentsong = 0;
    var currentalbum = -1;
    var safetytimer = 500;
    var currentTrack = null;
    var AlanPartridge = 0;
    var streamflag = true;
    var consumeflag = true;
    var finaltrack = -1;
    var previoussong = -1;
    this.rolledup = [];
    var updatecounter = 0;
    var do_delayed_update = false;
    var scrollto = -1;
    var searchedimages = [];
    var progress = null;
    var duration = null;
    var percent = null;

    this.repopulate = function() {
        debug.log("Repopulating Playlist");
        updatecounter++;        
        $.ajax({
            type: "GET",
            url: "getplaylist.php",
            cache: false,
            contentType: "text/xml; charset=utf-8",
            dataType: "xml",
            success: playlist.newXSPF,
            error: function(data) { 
                alert("Something went wrong retrieving the playlist!"); 
            }
        });
    }

    this.newXSPF = function(list) {
        var item;
        var count = 0;
        var current_album = "";
        var current_artist = "";
        var current_station = "";
        var current_type = "";
        var track;

        // This is a mechanism to prevent multiple repeated updates of the playlist in the case
        // where, for example, the user is clicking rapidly on the delete button for lots of tracks
        // and the playlist is slow to update from mpd 
        updatecounter--;
        if (updatecounter > 0) {
            debug.log("Received playlist update but more are coming - ignoring");
            do_delayed_update = true;
            return 0;
        }

        if (do_delayed_update) {
            // Once all the repeated updates have been received from mpd, ignore them all
            // (because we can't be sure which order they will have come back in),
            // do one more of our own, and use that one
            do_delayed_update = false;
            debug.log("Doing delayed playlist update");
            self.repopulate();
            return 0;
        }
        // ***********

        debug.log("Got Playlist from MPD");
        self.clearProgressTimer();
        finaltrack = -1;
        currentsong = -1;
        currentalbum = -1;
        tracklist = [];
        var totaltime = 0;

        $(list).find("track").each( function() {

            track = { 
                creator: $(this).find("creator").text(),
                albumartist: $(this).find("albumartist").text(),
                album: $(this).find("album").text(),
                title: $(this).find("title").text(),
                location: $(this).find("location").text(),
                duration: parseFloat($(this).find("duration").text()),
                backendid: $(this).find("backendid").text(),
                tracknumber: $(this).find("tracknumber").text(),
                playlistpos: $(this).find("playlistpos").text(),
                expires: $(this).find("expires").text(),
                image: $(this).find("image").text(),
                origimage: $(this).find("origimage").text(),
                type: $(this).find("type").text(),
                station: $(this).find("station").text(),
                stationurl: $(this).find("stationurl").text(),
                stream: $(this).find("stream").text(),
                compilation: $(this).find("compilation").text(),
                musicbrainz_artistid: $(this).find("mbartistid").text(),
                musicbrainz_albumid: $(this).find("mbalbumid").text(),
                musicbrainz_albumartistid: $(this).find("mbalbumartistid").text(),
                musicbrainz_trackid: $(this).find("mbtrackid").text(),
            };
            
            totaltime += track.duration;

            var sortartist = track.creator;
            if (track.albumartist != "") { sortartist = track.albumartist }
            if ((sortartist.toLowerCase() != current_artist.toLowerCase() && track.compilation != "yes") || 
                track.album.toLowerCase() != current_album.toLowerCase() ||
                track.type != current_type)
            {
                current_type = track.type;
                current_artist = sortartist;
                current_album = track.album;
                switch (track.type) {
                    case "local":
                        if (track.compilation) {
                            var hidden = (self.rolledup["Various Artists"+track.album]) ? true : false;
                            item = new playlist.Album("Various Artists", track.album, count, hidden);
                        } else {
                            var hidden = (self.rolledup[sortartist+track.album]) ? true : false;
                            item = new playlist.Album(sortartist, track.album, count, hidden);
                        }
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "stream":
                        // Streams are hidden by default - hence we use the opposite logic for the flag
                        var hidden = (self.rolledup["StReAm"+track.album]) ? false : true;
                        item = new playlist.Stream(count, track.album, hidden);
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "lastfmradio":
                        if (track.station != current_station) {
                            var hidden = (self.rolledup[track.station]) ? true : false;
                            item = new playlist.LastFMRadio(track.stationurl, track.station, count, hidden);
                            current_station = track.station;
                            tracklist[count] = item;
                            count++;
                        }
                        break;
                    default:
                        item = new playlist.Album(sortartist, track.album, count);
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;

                }

            }
            item.newtrack(track);

        });
        if (track) {
            finaltrack = parseInt(track.playlistpos);
            debug.log("Playlist: finaltrack is",finaltrack);
        }

        var html = "";
        if (finaltrack > -1) {
            html = '<div class="booger"><table width="100%" class="playlistitem"><tr><td align="left">'
                    +(finaltrack+1).toString()+
                    ' tracks</td><td align="right">Duration : '+formatTimeString(totaltime)+'</td></tr></table></div>';
        }
        for (var i in tracklist) {
            html = html + tracklist[i].getHTML();
        }
        
        // Remove the contents of the playlist
        //$('#sortable').empty();
        // Invisible empty div tacked on the end gives something to drop draggables onto
        html = html + '<div name="waiter"><table width="100%" class="playlistitem"><tr><td align="left"><img src="images/transparent-32x32.png"></td></tr></table></div>';
        $('#sortable').empty().html(html);
        html = null;

        if (scrollto > -1) {
            $("#playlist").scrollTo('div[name="'+scrollto.toString()+'"]');
            scrollto = -1;
        }

        self.checkProgress();
        
// Not sure this is necessary. Auto download should take care of this anyway in every conceivable situation
//         // Would like to search for missing album art in the playlist, and it's easy to do.
//         // Trouble is it re-searches for missing art at every playlist refresh.
//         // The check I put in here stops it searching for art which has been marked as notfound 
//         // in the albums list or search pane.
//         // Also we keep a list of stuff we've searched for, just in case it's not in either list
//         // (eg it's got there via a playlist loaded in from spotify)
//         // All this is to keep to an absolute minimum the number of requests we make to last.fm
// 
//         $('#sortable').find(".notexist").each( function() {
//             var name = $(this).attr("name");
//             if (typeof(searchedimages[name]) == "undefined") {
//                 searchedimages[name] = true;
//                 colobj = $('img[name="'+name+'"]', '#collection');
//                 schobj = $('img[name="'+name+'"]', '#search');
//                 if ((colobj.length == 0 || colobj.hasClass('notexist')) ||
//                     (schobj.length == 0 || schobj.hasClass('notexist')))
//                 {
//                     coverscraper.GetNewAlbumArt($(this).attr("name"));
//                 }
//             }
//          });

    }
    
    this.dragstopped = function(event, ui) {
        var itemstomove;
        var firstmoveitem;
        var numitems;
        var moveto;
        var elementmoved = bodgeitup(ui.item);
        var nextelement = bodgeitup($(ui.item).next());
        if (nextelement == "track") { 
            moveto = $(ui.item).next().attr("name") 
        }
        if (nextelement == "item" ) { 
            moveto = tracklist[parseInt($(ui.item).next().attr("name"))].getFirst() 
        }
        if (typeof(moveto) == "undefined") {
            moveto = (parseInt(finaltrack))+1;
        }
        debug.log(nextelement, moveto, finaltrack);
        if (ui.item.hasClass("draggable")) {
            var cmdlist = [];
            $(ui.item).find('.clicktrack').each(function (index, element) {
                var uri = $(element).attr("name");
                if (uri) {
                    cmdlist.push('add "'+decodeURIComponent(uri)+'"');
                }
                uri = null;
            });
            var elbow = (parseInt(finaltrack))+1;
            var arse = elbow+cmdlist.length;
            cmdlist.push('move "'+elbow.toString()+":"+arse.toString()+'" "'+moveto.toString()+'"');
            mpd.do_command_list(cmdlist, playlist.repopulate);
            $('.selected').removeClass('selected');
            $("#dragger").remove();
        } else {
            var nom = ui.item.attr("name");
            if (elementmoved == "track") {
                itemstomove = nom;
                firstmoveitem = itemstomove;
                numitems = 1;
            }
            if (elementmoved == "item") {
                itemstomove = tracklist[parseInt(nom)].getRange();
                firstmoveitem = tracklist[parseInt(nom)].getFirst();
                numitems = tracklist[parseInt(nom)].getSize();
            }
            // If we move DOWN we have to calculate what the position will be AFTER the items
            // have been moved. Bit daft, that.
            if (parseInt(firstmoveitem) < parseInt(moveto)) {
                moveto = parseInt(moveto) - parseInt(numitems);
                if (moveto < 0) { moveto = 0; }
            }
            mpd.command("command=move&arg="+itemstomove+"&arg2="+moveto, playlist.repopulate);
        }        
    }

    this.delete = function(id) {
        $('.track[romprid="'+id.toString()+'"]').remove();
        mpd.command("command=deleteid&arg="+id, playlist.repopulate);
    }

    this.waiting = function() {
        var html = '<div class="item containerbox menuitem playlisttitle">';
        html = html + '<img class="smallcover fixed" src="images/waiting2.gif"/>';
        html = html + '<div class="expand">Incoming....</div></div>';
        $('div[name="waiter"]').html(html);
        html = null;
    }

    // This is used for adding stream playlists ONLY
    this.newInternetRadioStation = function (list) {
        var cmdlist = [];
        $(list).find("track").each( function() {
            cmdlist.push('add "'+$(this).find("location").text()+'"');
        });
        if (mpd.getStatus('state') == 'stop') {
            cmdlist.push(self.playfromend());
        }
        mpd.do_command_list(cmdlist, playlist.repopulate);
        scrollto = (finaltrack)+1;
    }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.playfromend = function() {
        var playfrom = finaltrack+1;
        return 'play "'+playfrom.toString()+'"';
    }

    this.removelfm = function(tracks, u, w) {
        debug.log("Playlist removing tracks from",u,tracks);
        lfmprovider.getTracks(u, tracks.length, w, false, tracks);
    }

    this.getfinaltrack = function() {
        return finaltrack;
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    this.checkProgress = function() {
        self.clearProgressTimer();
        if (finaltrack == -1) {
            // Playlist is empty
            debug.log("Playlist is empty");
            nowplaying.newTrack(emptytrack);
            $("#progress").progressbar("option", "value", 0);
            $("#playbackTime").empty();
        } else {
            // currentsong is used mainly so we can update the playlist to highlight the currently playing song
            // A change in currentsong is not taken as a new track being played, because currentsong
            // is set to -1 every time we repopulate.
            if (mpd.getStatus('song') != currentsong || mpd.getStatus('songid') != previoussong) {
                debug.log("Updating current song");
                currentsong = mpd.getStatus('song');
                $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
                $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
                if (typeof(currentsong) == "undefined") {
                    currentTrack = emptytrack;
                } else {
                    for(var i in tracklist) {
                        currentTrack = tracklist[i].findcurrent(currentsong);
                        if (currentTrack) {
                            currentalbum = i;
                            break;
                        }
                    }
                }
            }

            // Track changes are detected based on the playlist id. This prevents us from repopulating
            // the browser every time the playlist gets repopulated.
            if (mpd.getStatus('songid') != previoussong) {
                if (mpd.getStatus('consume') == 1 && consumeflag) {
                    consumeflag = false;
                    self.repopulate();
                    return 0;
                }
                debug.log("Track has changed");
                if (currentTrack && currentTrack.type == "stream" && streamflag) {
                    debug.log("Waiting for stream info......");
                    // If it's a new stream, don't update immediately, instead give it 5 seconds
                    // to let mpd extract any useful track info from the stream
                    // This avoids us displaying some random nonsense then switching to the track
                    // data 5 seconds later
                    streamflag = false;
                    infobar.setNowPlayingInfo({ track: 'Waiting for station info...',
                                                image: currentTrack.image
                    });
                    setTheClock(playlist.streamfunction, 5000);
                    return 0;
                }
                if (currentTrack && currentTrack.type != "stream") {
                    debug.log("Creating new track");
                    nowplaying.newTrack(currentTrack);
                }
                for(var i in tracklist) {
                    if (tracklist[i].invalidateOldTracks(currentsong, previoussong)) { break; }
                }
                previoussong = mpd.getStatus('songid');
                streamflag = true;
                consumeflag = true;
                safetytimer = 500;
            }

             progress = nowplaying.progress();
             duration = nowplaying.duration(-1);
             percent = (duration == 0) ? 0 : (progress/duration) * 100;
             $("#progress").progressbar("option", "value", Math.round(percent));
             var html = formatTimeString(progress) + " of " + formatTimeString(duration);
             $("#playbackTime").empty().html(html);
             html = null;
            
            if (mpd.getStatus('state') == "play") {
                if (progress > 4) { nowplaying.updateNowPlaying() };
                if (percent >= scrobblepercent) { nowplaying.scrobble(); }
                if (duration > 0 && nowplaying.mpd(-1, "type") != "stream") {
                    if (progress >= duration) {
                        debug.log("Starting safety timer");
                        setTheClock(playlist.checkchange, safetytimer);
                        if (safetytimer < 5000) { safetytimer += 500 }
                    } else {
                        setTheClock( playlist.checkProgress, 1000);
                    }
                } else {
                    AlanPartridge++;
                    if (AlanPartridge < 7) {
                        setTheClock( playlist.checkProgress, 1000);
                    } else {
                        AlanPartridge = 0;
                        setTheClock( playlist.streamfunction, 1000);
                    }
                }
            }
        }
    }
    
    this.checkchange = function() {
        mpd.command("", false);
    }
    
    this.streamfunction = function() {
        mpd.command("", playlist.checkStream);
    }

    this.checkStream = function() {
        self.clearProgressTimer();
        updateStreamInfo();
        self.checkProgress();
    }

    function updateStreamInfo() {
        if (currentTrack && currentTrack.type == "stream") {
            var temp = cloneObject(currentTrack);
            temp.title = currentTrack.stream || mpd.getStatus('Title') || currentTrack.title;
            temp.album = currentTrack.creator + " - " + currentTrack.album;
            if (mpd.getStatus('Title')) {
                var tit = mpd.getStatus('Title');
                var parts = tit.split(" - ", 2);
                if (parts[0] && parts[1]) {
                    temp.creator = parts[0];
                    temp.title = parts[1];
                }
            }
            if (mpd.getStatus('Name')) {
                checkForUpdateToUnknownStream(mpd.getStatus('file'), mpd.getStatus('Name'));
                temp.album = mpd.getStatus('Name');
            }
            if (nowplaying.mpd(-1, 'title') != temp.title || 
                nowplaying.mpd(-1, 'album') != temp.album || 
                nowplaying.mpd(-1, 'creator') != temp.creator) {
                nowplaying.newTrack(temp);
            } else {
                temp = null;
            }
        }
    }

    function checkForUpdateToUnknownStream(url, name) {
        if (currentTrack.album == "Unknown Internet Stream") {
            debug.log("Updating Stream",name);
            $.post("updateplaylist.php", { url: url, name: name })
            .done( function() { 
                playlist.repopulate();
                $("#yourradiolist").empty();
                $("#yourradiolist").load("yourradio.php");
            });
        }
    }
    
    function setTheClock(callback, timeout) {
        // ONLY set the progresstimer by using this function!
        // Otherwise it's possible that we get multiple timers running
        // (seems to be a problem in Chrome)
        self.clearProgressTimer();
        progresstimer = setTimeout(callback, timeout);
    }

    this.clearProgressTimer = function() {
        clearTimeout(progresstimer);
    }        

    this.stop = function() {
        mpd.command("command=stop", function() {
            self.checkSongIdAfterStop(previoussong);
        });
    }

    this.previous = function() {
        if (currentalbum >= 0) {
            mpd.command("command="+tracklist[currentalbum].previoustrackcommand(currentsong));
        }
    }

    this.next = function() {
        if (currentalbum >= 0) {
            mpd.command("command="+tracklist[currentalbum].nexttrackcommand(currentsong));
        }
    }

    this.deleteGroup = function(index) {
        tracklist[index].deleteSelf();
    }

    this.checkSongIdAfterStop = function(songid) {
        for(var i in tracklist) {
            if (tracklist[i].invalidateOnStop(songid)) {
                return true;
            }
        }
        self.checkProgress();
    }

    this.addtrack = function(element) {
        self.waiting();
        if (mpd.getStatus('state') == "stop") {
            var cmdlist = [];
            cmdlist.push('add "'+decodeURIComponent(element.attr("name"))+'"');
            cmdlist.push('play "'+(((finaltrack)+1).toString())+'"');
            mpd.do_command_list(cmdlist, playlist.repopulate);
        } else {
            mpd.command("command=add&arg="+element.attr("name"), playlist.repopulate);
        }
        scrollto = (finaltrack)+1;
    }

    this.addalbum = function(element) {
        self.waiting();
        var list = [];
        $('#'+element.attr("name")).find('.clicktrack').each(function (index, element) { 
            var uri = $(element).attr("name");
            if (uri) {
                list.push('add "'+decodeURIComponent(uri)+'"');
            }
        });
        if (mpd.getStatus('state') == 'stop') {
            var f = finaltrack+1;
            list.push('play "'+f.toString()+'"');
        }
        mpd.do_command_list(list, playlist.repopulate);        
        scrollto = (finaltrack)+1;
    }   

    this.addFavourite = function(index) {
        debug.log("Adding Fave Station, index",index, tracklist[index].album);
        $.post("addfave.php", { station: tracklist[index].album })
            .done( function() { 
                $("#yourradiolist").load("yourradio.php");
            });
    }
    
    this.Album = function(artist, album, index, rolledup) {

        var self = this;
        var tracks = [];
        this.artist = artist;
        this.album = album;
        this.index = index;
        
        this.newtrack = function (track) {
            tracks.push(track);
        }

        this.getHTML = function() {
            var html = self.header();
            for (var trackpointer in tracks) {
                var showartist = false;
                if (tracks[trackpointer].compilation || 
                    (tracks[trackpointer].albumartist != "" && tracks[trackpointer].albumartist != tracks[trackpointer].creator)) {
                    showartist = true;
                }
                html = html + '<div name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="track clickable clickplaylist sortable containerbox playlistitem menuitem">';
                html = html + '<div class="tracknumbr fixed">'+format_tracknum(tracks[trackpointer].tracknumber)+'</div>';
                var l = tracks[trackpointer].location;
                if (l.substring(0, 7) == "spotify") {
                    html = html + '<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>';
                }
                if (showartist) {
                    html = html + '<div class="containerbox vertical expand">';
                    html = html + '<div class="line">'+tracks[trackpointer].title+'</div>';
                    html = html + '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';
                    html = html + '</div>';
                } else {
                    html = html + '<div class="expand line">'+tracks[trackpointer].title+'</div>';
                }
                html = html + '<div class="tiny fixed">'+formatTimeString(tracks[trackpointer].duration)+'</div>';
                html = html + '<div class="playlisticon fixed clickable clickicon clickremovetrack" romprid="'+tracks[trackpointer].backendid+'"><img src="images/edit-delete.png" /></div>';
                html = html + '</div>';
            }
            // Close the rollup div we added in the header
            html = html + '</div>'
            return html;
        }

        this.header = function() {        
            var html = "";
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox menuitem playlisttitle">';
            if (tracks[0].image) {
                html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="'+tracks[0].image+'"/></div>';
            } else {
                html = html +   '<img class="smallcover updateable notexist fixed clickable clickicon clickrollup" romprname="'+self.index+'" name="'+hex_md5(self.artist+" "+self.album)+'" '
                            +   ' romprartist="'+encodeURIComponent(self.artist)+'" rompralbum="'+encodeURIComponent(self.album)+'"'
                            +   ' src="images/album-unknown-small.png"/>';
            }
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+self.artist+'</div>';
            html = html + '<div class="line">'+self.album+'</div>';
            html = html + '</div>';
            html = html + '<div class="playlisticon fixed clickable clickicon clickremovealbum" name="'+self.index+'"><img src="images/edit-delete.png" /></div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.rollUp = function() {
            $('.trackgroup[name="'+self.index+'"]').slideToggle('slow');
            rolledup = !rolledup;
            if (rolledup) {
                playlist.rolledup[this.artist+this.album] = true;
            } else {
                playlist.rolledup[this.artist+this.album] = undefined;
            }
        }

        this.getFirst = function() {
            return tracks[0].playlistpos;
        }

        this.getRange = function() {
            var range = tracks[0].playlistpos+":"
            var end = parseInt(tracks[(tracks.length)-1].playlistpos)+1;
            return range+end;
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.invalidateOldTracks = function(which, why) {
            return false;
        }

        this.findcurrent = function(which) {
            var result = null;
            for(var i in tracks) {
                if (tracks[i].playlistpos == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.track[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                    result = tracks[i];
                    break;
                }
            }
            return result;
        }

        this.deleteSelf = function() {
            var todelete = [];
            for(var i in tracks) {
                $('.track[name="'+tracks[i].playlistpos+'"]').remove();
                todelete.push(tracks[i].backendid);
            }
            $('.item[name="'+self.index+'"]').remove();
            mpd.deleteTracksByID(todelete, playlist.repopulate)
        }

        this.invalidateOnStop = function() {
            return false;
        }

        this.previoustrackcommand = function(which) {
            return "previous";
        }

        this.nexttrackcommand = function(which) {
            return "next";
        }

        function format_tracknum(tracknum) {
            var r = /^(\d+)/;
            var result = r.exec(tracknum) || "";
            return result[1] || "";
        }

    }

    this.Stream = function(index, album, rolledup) {
        var self = this;
        var tracks = [];
        this.index = index;
        var rolledup = rolledup;
        this.album = album;

        this.newtrack = function (track) {
            tracks.push(track);
        }

        this.getHTML = function() {
            var html = self.header();
            for (var trackpointer in tracks) {
                html = html + '<div name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="booger clickable clickplaylist containerbox playlistitem menuitem">';
                html = html + '<div class="playlisticon fixed"><img height="12px" src="images/broadcast.png" /></div>';
                html = html + '<div class="containerbox vertical expand">';
                html = html + '<div class="playlistrow2 line">'+tracks[trackpointer].stream+'</div>';
                html = html + '<div class="tiny line">'+tracks[trackpointer].location+'</div>';
                html = html + '</div>';
                html = html + '</div>';
            }
            // Close the rollup div we added in the header
            html = html + '</div>';
            return html;
        }

        this.header = function() {
            var html = "";
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox menuitem playlisttitle">';
            var image = (tracks[0].image) ? tracks[0].image : "images/broadcast.png";
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="'+image+'"/></div>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+tracks[0].creator+'</div>';
            html = html + '<div class="line">'+tracks[0].album+'</div>';
            html = html + '</div>';
            html = html + '<div class="containerbox vertical fixed">';
            html = html + '<div class="playlisticon clickable clickicon clickaddfave" name="'+self.index+'"><img height="12px" width="12px" src="images/broadcast-12.png"></div>';
            html = html + '<div class="playlisticon clickable clickicon clickremovealbum" name="'+self.index+'"><img src="images/edit-delete.png"></div>';
            html = html + '</div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.rollUp = function() {
            $('.trackgroup[name="'+self.index+'"]').slideToggle('slow');
            rolledup = !rolledup;
            // Logic is backwards for streams, because they're hidden by default
            if (rolledup) {
                playlist.rolledup["StReAm"+this.album] = undefined;
            } else {
                playlist.rolledup["StReAm"+this.album] = true;
            }
        }

        this.getFirst = function() {
            return tracks[0].playlistpos;
        }

        this.getRange = function() {
            var range = tracks[0].playlistpos+":"
            var end = parseInt(tracks[(tracks.length)-1].playlistpos)+1;
            return range+end;
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.invalidateOldTracks = function(which, why) {
            return false;
        }

        this.findcurrent = function(which) {
            var result = null;
            for(var i in tracks) {
                if (tracks[i].playlistpos == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.booger[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                    result = tracks[i];
                    break;
                }
            }
            return result;
        }

        this.deleteSelf = function() {
            var todelete = [];
            for(var i in tracks) {
                $('.booger[name="'+tracks[i].playlistpos+'"]').remove();
                todelete.push(tracks[i].backendid);
            }
            $('.item[name="'+self.index+'"]').remove();
            mpd.deleteTracksByID(todelete, playlist.repopulate)
        }

        this.invalidateOnStop = function() {
            return false;
        }

        this.previoustrackcommand = function(which) {
            var t = parseInt(tracks[0].playlistpos)-1;
            return "play "+t;
        }

        this.nexttrackcommand = function(which) {
            var t = parseInt(tracks[(tracks.length)-1].playlistpos)+1;
            return "play "+t.toString();
        }
    }

    this.LastFMRadio = function(tuneurl, station, index, rolledup) {
        var self = this;
        var tracks = [];
        this.station = station;
        var tuneurl = tuneurl;
        this.index = index;
        var rolledup = rolledup;

        this.newtrack = function (track) {
            tracks.push(track);
        }

        this.getHTML = function() {
            var html = self.header();
            var opacity = 1;
            for (var trackpointer in tracks) {
                html = html + '<div style="opacity:'+opacity.toString()+'" name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="booger containerbox playlistitem menuitem noclick">';
                if (tracks[trackpointer].image) {
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="'+tracks[trackpointer].image+'"/></div>';
                } else {
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="images/album-unknown-small.png"/></div>';
                }
                html = html + '<div class="containerbox vertical expand">';
                html = html + '<div class="line">'+tracks[trackpointer].title+'</div>';
                html = html + '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';            
                html = html + '<div class="line playlistrow2">'+tracks[trackpointer].album+'</div>';            
                html = html + '</div>';
                html = html + '<div class="tiny fixed">'+formatTimeString(tracks[trackpointer].duration)+'</div>';
                html = html + '<div class="playlisticon fixed clickable clickicon clickremovelfmtrack" romprid="'+tracks[trackpointer].backendid+'"><img src="images/edit-delete.png" /></div>';
                html = html + '</div>';
                opacity -= 0.15;
            }
            html = html + '</div>'
            return html;
        }

        this.header = function() {
            var html = "";
            
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox menuitem playlisttitle">';
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="images/lastfm.png"/></div>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">Last.FM</div>';
            html = html + '<div class="line">'+self.station+'</div>';
            html = html + '</div>';
            html = html + '<div class="playlisticon fixed clickable clickicon clickremovealbum" name="'+self.index+'"><img src="images/edit-delete.png" /></div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.rollUp = function() {
            $('.trackgroup[name="'+self.index+'"]').slideToggle('slow');
            rolledup = !rolledup;
            if (rolledup) {
                playlist.rolledup[this.station] = true;
            } else {
                playlist.rolledup[this.station] = undefined;
            }
        }

        this.getFirst = function() {
            return tracks[0].playlistpos;
        }

        this.getRange = function() {
            var range = tracks[0].playlistpos+":"
            var end = parseInt(tracks[(tracks.length)-1].playlistpos)+1;
            return range+end;
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.invalidateOldTracks = function(currentsong, previoussong) {
            var todelete = [];
            var unixtimestamp = Math.round(new Date()/1000);
            var index = -1;
            var result = false;
            debug.log("Checking Last.FM Playlist item");
            for(var i in tracks) {
                debug.log("Track",i,"expires in", parseInt(tracks[i].expires) - unixtimestamp);
                if (unixtimestamp > parseInt(tracks[i].expires)) {
                    $('.booger[name="'+tracks[i].playlistpos+'"]').slideUp('fast');
                    index = i;
                } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                    debug.log("Removing track which was playing but has been skipped")
                    $('.booger[name="'+tracks[i].playlistpos+'"]').slideUp('fast');
                    index = i;
                } else if (tracks[i].playlistpos == currentsong && i>0) {
                    debug.log("We're in the middle of a field!")
                    index = i-1;
                }
            }

            if (index >= 0) {
                for(var j = 0; j <= index; j++) {
                    todelete.push(tracks[j].backendid);
                }
                playlist.removelfm(todelete, tuneurl, (parseInt(tracks[tracks.length - 1].playlistpos))+1);
                result = true;
            }

            return result;
        }

        this.findcurrent = function(which) {
            var result = null;
            for(var i in tracks) {
                if (tracks[i].playlistpos == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.booger[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                    result = tracks[i];
                    break;
                }
            }
            return result;
        }

        this.deleteSelf = function() {
            var todelete = [];
            for (var i in tracks) {
                $('.booger[name="'+tracks[i].playlistpos+'"]').remove();
                todelete.push(tracks[i].backendid);
            }
            $('.item[name="'+self.index+'"]').remove();
            $.post("removeStation.php", {remove: hex_md5(self.station)});
            mpd.deleteTracksByID(todelete, playlist.repopulate);
        }

        this.invalidateOnStop = function(songid) {
            var result = false;
            for (var i in tracks) {
                if (tracks[i].backendid == songid) {
                    playlist.removelfm([songid], tuneurl, (parseInt(tracks[tracks.length-1].playlistpos))+1);
                    $('.booger[name="'+tracks[i].playlistpos+'"]').slideUp('fast');
                    result = true;
                    break;
                }
            }
            return result;
        }

        this.previoustrackcommand = function(which) {
            return "previous";
        }

        this.nexttrackcommand = function(which) {
            return "next";
        }

    }
    
}
