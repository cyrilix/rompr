function Track(options) {

    var self = this;
    for(var i in options) {
        this[i] = options[i];
    }
}

function Album(artist, album, index, rolledup) {

    var self = this;
    var tracks = new Array();
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
            html = html + '<div id="track" name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="clickable clickplaylist sortable containerbox playlistitem menuitem">';
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
        html = html + '<div id="item" name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="clickable clickplaylist sortable containerbox menuitem playlisttitle">';
        if (tracks[0].image) {
            html = html + '<img class="smallcover updateable fixed clickable clickicon clickrollup" romprname="'+self.index+'" src="'+tracks[0].image+'"/>';
        } else {
            html = html +   '<img class="smallcover updateable notexist fixed clickable clickicon clickrollup" romprname="'+self.index+'" name="'+hex_md5(self.artist+" "+self.album)+'" '
                        +   ' romprartist="'+encodeURIComponent(self.artist)+'" rompralbum="'+encodeURIComponent(self.album)+'" romprupdate="yes"'
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
                $('#item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                $('#track[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            $('#track[name="'+tracks[i].playlistpos+'"]').remove();
             todelete.push(tracks[i].backendid);
        }
        $('#item[name="'+self.index+'"]').remove();
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

function Stream(index, album, rolledup) {
    var self = this;
    var tracks = new Array();
    this.index = index;
    var rolledup = rolledup;
    this.album = album;

    this.newtrack = function (track) {
        tracks.push(track);
    }

    this.getHTML = function() {
        var html = self.header();
        for (var trackpointer in tracks) {
            html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="clickable clickplaylist containerbox playlistitem menuitem">';
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
        html = html + '<div id="item" name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="clickable clickplaylist sortable containerbox menuitem playlisttitle">';
        var image = (tracks[0].image) ? tracks[0].image : "images/broadcast.png";
        html = html + '<img class="smallcover updateable fixed clickable clickicon clickrollup" romprname="'+self.index+'" src="'+image+'"/>';
        html = html + '<div class="containerbox vertical expand">';
        html = html + '<div class="line">'+tracks[0].creator+'</div>';
        html = html + '<div class="line">'+tracks[0].album+'</div>';
        html = html + '</div>';
        html = html + '<div class="containerbox vertical fixed">';
        html = html + '<div class="playlisticon clickable clickicon clickaddfave" name="'+self.index+'"><img height="14px" width="14px" src="images/broadcast.png"></div>';
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
                $('#item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                $('#booger[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            $('#booger[name="'+tracks[i].playlistpos+'"]').remove();
            todelete.push(tracks[i].backendid);
        }
        $('#item[name="'+self.index+'"]').remove();
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

function LastFMRadio(tuneurl, station, index, rolledup) {
    var self = this;
    var tracks = new Array();
    this.station = station;
    var tuneurl = tuneurl;
    this.index = index;
    var rolledup = rolledup;

    this.newtrack = function (track) {
        tracks.push(track);
    }

    this.getHTML = function() {
        var html = self.header();
        for (var trackpointer in tracks) {
            html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="containerbox playlistitem menuitem">';
            html = html + '<img class="smallcover fixed" src="'+tracks[trackpointer].image+'"/>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+tracks[trackpointer].title+'</div>';
            html = html + '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';            
            html = html + '<div class="line playlistrow2">'+tracks[trackpointer].album+'</div>';            
            html = html + '</div>';
            html = html + '<div class="playlisticon fixed clickable clickicon clickremovelfmtrack" romprid="'+tracks[trackpointer].backendid+'"><img src="images/edit-delete.png" /></div>';
            html = html + '</div>';
        }
        html = html + '</div>'
        return html;
    }

    this.header = function() {
        var html = "";
        
        html = html + '<div id="item" name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="clickable clickplaylist sortable containerbox menuitem playlisttitle">';
        html = html + '<img class="smallcover updateable fixed clickable clickicon clickrollup" romprname="'+self.index+'" src="images/lastfm.png"/>';
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
        var todelete = new Array();
        var unixtimestamp = Math.round(new Date()/1000);
        var index = -1;
        var result = false;
        debug.log("Checking Last.FM Playlist item");
        for(var i in tracks) {
            debug.log("Track",i,"expires in", parseInt(tracks[i].expires) - unixtimestamp);
            if (unixtimestamp > parseInt(tracks[i].expires)) {
                $('#booger[name="'+tracks[i].playlistpos+'"]').remove();
                index = i;
            } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                debug.log("Removing track which was playing but has been skipped")
                $('#booger[name="'+tracks[i].playlistpos+'"]').remove();
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
                $('#item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                $('#booger[name="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for (var i in tracks) {
            $('#booger[name="'+tracks[i].playlistpos+'"]').remove();
            todelete.push(tracks[i].backendid);
        }
        $('#item[name="'+self.index+'"]').remove();
        $.post("removeStation.php", {remove: hex_md5(self.station)});
        mpd.deleteTracksByID(todelete, playlist.repopulate);
    }

    this.invalidateOnStop = function(songid) {
        var result = false;
        for (var i in tracks) {
            if (tracks[i].backendid == songid) {
                playlist.removelfm([songid], tuneurl, (parseInt(tracks[tracks.length-1].playlistpos))+1);
                $('#booger[name="'+tracks[i].playlistpos+'"]').remove();
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

function Playlist() {

    var self = this;
    var tracklist = new Array();
    var currentsong = 0;
    var currentalbum = -1;
    var progresstimer = null;
    var progress_timer_running = false;
    var safetytimer = 500;
    var currentTrack = null;
    var AlanPartridge = 0;
    var streamflag = true;
    var finaltrack = -1;
    var previoussong = -1;
    this.rolledup = new Array();
    var updatecounter = 0;
    var do_delayed_update = false;
    var scrollto = -1;
    var searchedimages = new Array();

    this.repopulate = function() {
        debug.log("Repopulating Playlist");
        updatecounter++;        
        $.ajax({
            type: "POST",
            url: "getplaylist.php",
            cache: false,
            contentType: "text/xml; charset=utf-8",
            data: "{}",
            dataType: "xml",
            success: playlist.newXSPF,
            error: function(data, status) { 
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

        finaltrack = -1;
        currentsong = -1;
        currentalbum = -1;
        tracklist = [];
        var totaltime = 0;

        $(list).find("track").each( function() {

            track = new Track({ 
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
                type: $(this).find("type").text(),
                station: $(this).find("station").text(),
                stationurl: $(this).find("stationurl").text(),
                stream: $(this).find("stream").text(),
                compilation: $(this).find("compilation").text()
            });
            
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
                            item = new Album("Various Artists", track.album, count, hidden);
                        } else {
                            var hidden = (self.rolledup[sortartist+track.album]) ? true : false;
                            item = new Album(sortartist, track.album, count, hidden);
                        }
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "stream":
                        // Streams are hidden by default - hence we use the opposite logic for the flag
                        var hidden = (self.rolledup["StReAm"+track.album]) ? false : true;
                        item = new Stream(count, track.album, hidden);
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "lastfmradio":
                        if (track.station != current_station) {
                            var hidden = (self.rolledup[track.station]) ? true : false;
                            item = new LastFMRadio(track.stationurl, track.station, count, hidden);
                            current_station = track.station;
                            tracklist[count] = item;
                            count++;
                        }
                        break;
                    default:
                        item = new Album(sortartist, track.album, count);
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
            html = '<div id="booger"><table width="100%" class="playlistitem"><tr><td align="left">'
                    +(finaltrack+1).toString()+
                    ' tracks</td><td align="right">Duration : '+formatTimeString(totaltime)+'</td></tr></table></div>';
        }
        for (var i in tracklist) {
            html = html + tracklist[i].getHTML();
        }
        
        
        // Remove the contents of the playlist
        $('#sortable').empty();
        
        // Invisible empty div tacked on the end gives something to drop draggables onto
        html = html + '<div name="waiter"><table width="100%" class="playlistitem"><tr><td align="left"><img src="images/transparent-32x32.png"></td></tr></table></div>';
        $("#sortable").html(html);


        if (scrollto > -1) {
            $("#playlist").scrollTo('div[name="'+scrollto.toString()+'"]');
            scrollto = -1;
        }

        self.checkProgress();
        
        // Would like to search for missing album art in the playlist, and it's easy to do.
        // Trouble is it re-searches for missing art at every playlist refresh.
        // The check I put in here stops it searching for art which has been marked as notfound 
        // in the albums list or search pane.
        // Also we keep a list of stuff we've searched for, just in case it's not in either list
        // (eg it's got there via a playlist loaded in from spotify)
        // All this is to keep to an absolute minimum the number of requests we make to last.fm

        $("#sortable").find(".notexist").each( function() {
            var name = $(this).attr("name");
            if (typeof(searchedimages[name]) == "undefined") {
                searchedimages[name] = true;
                colobj = $('img[name="'+name+'"]', '#collection');
                schobj = $('img[name="'+name+'"]', '#search');
                if (colobj.length == 0 ||
                    schobj.length == 0 ||
                    colobj.hasClass('notexist') ||
                    schobj.hasClass('notexist')
                ) {
                    coverscraper.getNewAlbumArt(this);
                }
            }
         });

    }
    
    this.dragstopped = function(event, ui) {
        var itemstomove;
        var firstmoveitem;
        var numitems;
        var moveto;
        var elementmoved = ui.item.attr("id");
        var nextelement = $(ui.item).next().attr("id");
        if (nextelement == "track") { 
            moveto = $(ui.item).next().attr("name") 
        }
        if (nextelement == "item" ) { 
            moveto = tracklist[parseInt($(ui.item).next().attr("name"))].getFirst() 
        }
        if (typeof(moveto) == "undefined") {
            moveto = (parseInt(finaltrack))+1;
        }
        if (ui.item.hasClass("draggable")) {
            var cmdlist = new Array();
            $(ui.item).find('.clicktrack').each(function (index, element) {
                var uri = $(element).attr("name");
                if (uri) {
                    cmdlist.push('add "'+decodeURIComponent(uri)+'"');
                }
            });
            var elbow = (parseInt(finaltrack))+1;
            var arse = elbow+cmdlist.length;
            cmdlist.push('move "'+elbow.toString()+":"+arse.toString()+'" "'+moveto.toString()+'"');
            mpd.do_command_list(cmdlist, playlist.repopulate);
            $('.selected').removeClass('selected');
        } else {
            if (elementmoved == "track") {
                itemstomove = ui.item.attr("name");
                firstmoveitem = itemstomove;
                numitems = 1;
            }
            if (elementmoved == "item") {
                itemstomove = tracklist[parseInt(ui.item.attr("name"))].getRange();
                firstmoveitem = tracklist[parseInt(ui.item.attr("name"))].getFirst();
                numitems = tracklist[parseInt(ui.item.attr("name"))].getSize();

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
        $('#track[romprid="'+id.toString()+'"]').remove();
        mpd.command("command=deleteid&arg="+id, playlist.repopulate);
    }

    this.waiting = function() {
        var html = '<div id="item" class="containerbox menuitem playlisttitle">';
        html = html + '<img class="smallcover fixed" src="images/waiting2.gif"/>';
        html = html + '<div class="expand">Incoming....</div></div>';
        $('div[name="waiter"]').html(html);
    }

    // This is used for adding stream playlists ONLY
    this.newInternetRadioStation = function (list) {
        var cmdlist = new Array();
        $(list).find("track").each( function() {
            cmdlist.push('add "'+$(this).find("location").text()+'"');
        });
        if (mpd.status.state == 'stop') {
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
        clearProgressTimer();
        if (finaltrack == -1) {
            // Playlist is empty
            debug.log("Playlistis empty");
            nowplaying.newTrack(emptytrack);
            $("#progress").progressbar("option", "value", 0);
            $("#playbackTime").html("");
        } else {
            // currentsong is used mainly so we can update the playlist to highlight the currently playing song
            // A change in currentsong is not taken as a new track being played, because currentsong
            // is set to -1 every time we repopulate.
            if (mpd.status.song != currentsong || mpd.status.songid != previoussong) {
                debug.log("Updating current song");
                currentsong = mpd.status.song;
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
            if (mpd.status.songid != previoussong) {
                debug.log("Track has changed");
                if (currentTrack && currentTrack.type == "stream" && streamflag) {
                    debug.log("Waiting for stream info......");
                    // If it's a new stream, don't update immediately, instead give it 5 seconds
                    // to let mpd extract any useful track info from the stream
                    // This avoids us displaying some random nonsense then switching to the track
                    // data 5 seconds later
                    streamflag = false;
                    $('#albumpicture').fadeOut('fast', function () {
                        $('#albumpicture').attr("src", currentTrack.image);
                        $('#albumpicture').fadeIn('fast');
                    });
                    $("#nowplaying").html('<p class="larger"><b>Waiting for station info...</b></p>');
                    progresstimer = setTimeout('mpd.command("", playlist.checkStream)', 5000);
                    progress_timer_running = true;
                    return 0;
                }
                if (currentTrack && currentTrack.type != "stream") {
                    debug.log("Creating new track");
                    nowplaying.newTrack(currentTrack);
                }
                for(var i in tracklist) {
                    if (tracklist[i].invalidateOldTracks(currentsong, previoussong)) { break; }
                }
                previoussong = mpd.status.songid;
                streamflag = true;
            }

            var progress = nowplaying.track.progress();
            var duration = nowplaying.track.duration();
            var percent = (duration == 0) ? 0 : (progress/duration) * 100;
            $("#progress").progressbar("option", "value", Math.round(percent));
            $("#playbackTime").html(formatTimeString(progress) + " of " + formatTimeString(duration));
            
            if (mpd.status.state == "play") {
                if (progress > 4) { updateNowPlaying() };
                if (percent >= scrobblepercent) { scrobble(); }
                if (duration > 0 && nowplaying.track.type != "stream") {
                    if (progress >= duration) {
                        progresstimer = setTimeout("mpd.update()", safetytimer);
                        debug.log("Starting safety timer");
                        if (safetytimer < 5000) { safetytimer += 500 }
                    } else {
                        progresstimer = setTimeout("playlist.checkProgress()", 1000);
                    }
                    progress_timer_running = true;
                } else {
                    AlanPartridge++;
                    if (AlanPartridge < 7) {
                        progresstimer = setTimeout("playlist.checkProgress()", 1000);
                    } else {
                        AlanPartridge = 0;
                        progresstimer = setTimeout('mpd.command("", playlist.checkStream)', 1000);
                    }
                    progress_timer_running = true;
                }
            }
        }
    }

    this.checkStream = function() {
        clearProgressTimer();
        updateStreamInfo();
        self.checkProgress();
    }

    function updateStreamInfo() {
        if (currentTrack && currentTrack.type == "stream") {
            var temp = cloneObject(currentTrack);
            temp.title = currentTrack.stream || mpd.status.Title || currentTrack.title;
            temp.album = currentTrack.creator + " - " + currentTrack.album;
            if (mpd.status.Title) {
                var tit = mpd.status.Title;
                var parts = tit.split(" - ", 2);
                if (parts[0] && parts[1]) {
                    temp.creator = parts[0];
                    temp.title = parts[1];
                }
            }
            if (mpd.status.Name) {
                checkForUpdateToUnknownStream(mpd.status.file, mpd.status.Name);
                temp.album = mpd.status.Name;
            }
            if (nowplaying.track.mpd_data.title != temp.title || 
                nowplaying.track.mpd_data.album != temp.album || 
                nowplaying.track.mpd_data.creator != temp.creator) {
                nowplaying.newTrack(temp);
            }
        }
    }

    function checkForUpdateToUnknownStream(url, name) {
        if (currentTrack.album == "Unknown Internet Stream") {
            debug.log("Updating Stream",name);
            $.post("updateplaylist.php", { url: url, name: name })
            .done( function() { 
                playlist.repopulate();
                $("#yourradiolist").load("yourradio.php");
            });
        }
    }

    function clearProgressTimer() {
        if (progress_timer_running) {
            clearTimeout(progresstimer);
            progress_timer_running = false;
        }     
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
        if (mpd.status.state == "stop") {
            var cmdlist = new Array();
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
        var list = new Array();
        $('#'+element.attr("name")).find('.clicktrack').each(function (index, element) { 
            var uri = $(element).attr("name");
            if (uri) {
                list.push('add "'+decodeURIComponent(uri)+'"');
            }
        });
        if (mpd.status.state == 'stop') {
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
}
