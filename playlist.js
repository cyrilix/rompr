
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
    var rolledup = rolledup;

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
            html = html + '<div id="track" name="'+tracks[trackpointer].playlistpos+'"';
            if (rolledup) {
                html = html + ' class="invisible"';
            }
            html = html + '><table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
            html = html + '<tr><td ';
            if (showartist) {
                html = html + 'rowspan="2" ';
            }
            html = html + 'class="tracknumbr">'+format_tracknum(tracks[trackpointer].tracknumber)+'</td><td';
            var l = tracks[trackpointer].location;
            if (l.substring(0, 7) == "spotify") {
                html = html + ' class="tracknumbr"><img height="12px" src="images/spotify-logo.png" /';
            }
            html = html + '></td><td align="left"><a href="#" class="album" onclick="mpd.command(\'command=playid&arg='+tracks[trackpointer].backendid+'\')">'+
                            tracks[trackpointer].title+'</a></td>';

            html = html + '<td align="right" width="7em" class="tiny">'+formatTimeString(tracks[trackpointer].duration)+'</td>';

            html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.delete(\''+tracks[trackpointer].backendid+'\',\''+tracks[trackpointer].playlistpos+'\')">'+
                            '<img src="images/edit-delete.png"></a></td></tr>';
            if (showartist) {
                html = html + '<tr><td align="left" colspan="4" class="playlistrow2">'+tracks[trackpointer].creator+'</td></tr>';
            }
            html = html + '</table></div>';
        }
        return html;
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table class="playlisttitle" name="'+self.index+'" width="100%"><tr><td rowspan="2" width="40px">';
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        if (tracks[0].image) {
            html = html + '<img width="32" height="32" src="'+tracks[0].image+'"/>';
        } else {
            html = html +   '<img class="notexist" name="'+hex_md5(self.artist+" "+self.album)+'" width="32" height="32"'
                        +   ' romprartist="'+encodeURIComponent(self.artist)+'" rompralbum="'+encodeURIComponent(self.album)+'" romprupdate="yes"'
                        +   ' src="images/album-unknown-small.png"/>';
        }
        html = html + '</a>';
        html = html + '</td><td align="left" colspan="2">';
        html = html + self.artist+'</td></tr><tr><td align="left" ><i><a href="#" class="album" onclick="mpd.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'+self.album+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';
        html = html + '</tr></table></div>';
        return html;
    }

    this.rollUp = function() {
        for (var i in tracks) {
            $('#track[name="'+tracks[i].playlistpos+'"]').slideToggle('slow');
        }
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
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            $("#"+tracks[i].playlistpos).fadeOut('fast');
            todelete.push(tracks[i].backendid);
        }
        $('#item[name="'+self.index+'"]').fadeOut('fast');
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
            html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'"';
            if (rolledup) {
                html = html + ' class="invisible"';
            }
            html = html + '><table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
            html = html + '<tr>';
            html = html + '<td colspan="2" align="left" class="tiny" style="font-weight:normal">'+
                            tracks[trackpointer].stream+'</td></tr>';
            html = html + '<tr><td width="20px"><img src="images/broadcast.png" width="16px"></td>'+
                            '<td align="left" class="tiny" style="font-weight:normal"><a href="#" class="album" onclick="mpd.command(\'command=playid&arg='+tracks[trackpointer].backendid+'\')">'+
                            tracks[trackpointer].location+'</a></td></tr>';
            html = html + '</table></div>';
        }
        return html;
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table name="'+self.index+'" width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        if (tracks[0].image) {
            html = html + '<img src="'+tracks[0].image+'" height="32px" width="32px"/></td><td>';
        } else {
            html = html + '<img src="images/broadcast.png" height="32px" width="32px"/></a></td><td>';
        }

        html = html + tracks[0].creator+'</td><td class="playlisticon" align="right">'
                        +'<a href="#" title="Add Station to Favourites" onclick="playlist.addFavourite(\''+self.index+'\')"><img height="14px" width="14px" src="images/broadcast.png"></a>'
                        +'</td></tr><tr><td align="left"><i>'
                        +'<a class="album" href="#" onclick="mpd.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
                        +tracks[0].album+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';
        html = html + '</tr></table></div>';
        return html;
    }

    this.rollUp = function() {
        for (var i in tracks) {
            $('#booger[name="'+tracks[i].playlistpos+'"]').slideToggle('slow');
        }
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
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            $("#"+tracks[i].playlistpos).fadeOut('fast');
            todelete.push(tracks[i].backendid);
        }
        $('#item[name="'+self.index+'"]').fadeOut('fast');
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
            html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'"';
            var opac = (1/(parseInt(trackpointer)+1)) + 0.3;
            if (opac > 1) { opac = 1 }
            html = html + ' style="opacity:'+opac.toString()+'"';
            if (rolledup) {
                html = html + ' class="invisible"';
            }
            html = html + '><table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
            html = html + '<tr><td rowspan="2" width="38px"><img src="'+tracks[trackpointer].image+'" width="32" height="32"></td>';
            html = html + '<td colspan="3" align="left" class="album">'+tracks[trackpointer].title+'</a></td></tr>';
            html = html + '<tr><td class="playlistrow2" align="left" width="40%">'+tracks[trackpointer].creator+'</td><td align="left" class="playlistrow2">'+tracks[trackpointer].album+'</td>'
            // Use checkSongIdAfterStop to delete tracks because that will make sure the station gets updated
            html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.checkSongIdAfterStop(\''+tracks[trackpointer].backendid+'\')">'+
                            '<img src="images/edit-delete.png"></a></td></tr></table>';

            html = html + '</div>';
        }
        return html;
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table name="'+self.index+'" width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        html = html + '<img src="images/lastfm.png"/>';
        html = html + '</a>';
        html = html + '</td><td colspan="2" align="left">';
        html = html + 'Last.FM</td></tr><tr><td align="left" ><i><a class="album" href="#" onclick="mpd.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
                        +self.station+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';
        html = html + '</tr></table></div>';
        return html;
    }

    this.rollUp = function() {
        for (var i in tracks) {
            $('#booger[name="'+tracks[i].playlistpos+'"]').slideToggle('slow');
        }
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
                $('div[name="'+tracks[i].playlistpos+'"]').filter('[id=booger]').fadeOut('fast');
                index = i;
            } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                debug.log("Removing track which was playing but has been skipped")
                $('div[name="'+tracks[i].playlistpos+'"]').filter('[id=booger]').fadeOut('fast');
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
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                result = tracks[i];
                break;
            }
        }
        return result;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for (var i in tracks) {
            todelete.push(tracks[i].backendid);
            $("#"+tracks[i].playlistpos).fadeOut('fast');
        }
        $('#item[name="'+self.index+'"]').fadeOut('fast');
        $.post("removeStation.php", {remove: hex_md5(self.station)});
        mpd.deleteTracksByID(todelete, playlist.repopulate);
    }

    this.invalidateOnStop = function(songid) {
        var result = false;
        for (var i in tracks) {
            if (tracks[i].backendid == songid) {
                playlist.removelfm([songid], tuneurl, (parseInt(tracks[tracks.length-1].playlistpos))+1);
                $('div[name="'+tracks[i].playlistpos+'"]').filter('[id=booger]').fadeOut('fast');
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
        
        // Invisible empty div tacked on the end gives something to drop draggables onto
        html = html + '<div name="waiter"><table width="100%" class="playlistitem"><tr><td align="left"><img src="images/transparent-32x32.png"></td></tr></table></div>';

        $("#sortable").html(html);

        $("#sortable").sortable({ items: "div" });
        $("#sortable").disableSelection();
        $("#sortable").sortable({ 
            axis: 'y', 
            containment: '#sortable', 
            scroll: 'true', 
            scrollSpeed: 10,
            tolerance: 'pointer' 
        });
        $("#sortable").sortable({ 
            start: function(event, ui) { 
                ui.item.css("background", "#555555"); 
                ui.item.css("opacity", "0.7") 
            } 
        });
        $("#sortable").sortable({ 
            stop: function(event, ui) {
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
                    $(ui.item).find('tr').each(function (index, element) {
                        if (!$(element).hasClass("dir")) {
                            var link = $(element).attr("ondblclick");
                            var r = /playlist.addtrack\(\'(.*?)\'/;
                            var result = r.exec(link);
                            if (result && result[1]) {
                                cmdlist.push('add "'+decodeURIComponent(result[1])+'"');
                            }
                        }
                    });
                    var elbow = (parseInt(finaltrack))+1;
                    var arse = elbow+cmdlist.length;
                    cmdlist.push('move "'+elbow.toString()+":"+arse.toString()+'" "'+moveto.toString()+'"');
                    mpd.do_command_list(cmdlist, playlist.repopulate);
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
                    mpd.command("command=move&arg="+itemstomove+"&arg2="+moveto, self.repopulate);
                }
            }
        });

        if (scrollto > -1) {
            $("#playlist").scrollTo('div[name="'+scrollto.toString()+'"]');
            scrollto = -1;
        }

        self.checkProgress();
        
            // Would like to search for missing album art in the playlist, and it's easy to do.
            // Trouble is it re-searches for missing art at every playlist refresh.
            // The check I put in here stops it searching for art which has been marked as notfound 
            // in the albums list or search pane

         $("#sortable").find(".notexist").each( function() {
             if ($('img[name="'+$(this).attr("name")+'"]', '#collection').hasClass('notexist') ||
                 $('img[name="'+$(this).attr("name")+'"]', '#search').hasClass('notexist')
            ) {
                coverscraper.getNewAlbumArt(this);
             }
         });

    }

    this.delete = function(id, pos) {
        $("#"+pos).fadeOut('fast');
        mpd.command("command=deleteid&arg="+id, playlist.repopulate);
    }

    this.waiting = function() {
        var html = '<table width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<img src="images/waiting2.gif" height="32px"/></td><td colspan="2" align="left">';
        html = html + 'Incoming....</td></tr><tr><td align="left" ></td>';
        html = html + '<td class="playlisticon" align="right"></td>';
        html = html + '</tr></table>';
        $('div[name="waiter"]').attr("id", "item");
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
                $(".playlistcurrentitem").attr("class", "playlistitem");
                $(".playlistcurrenttitle").attr("class", "playlisttitle");
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

    this.addtrack = function(url) {
        self.waiting();
        if (mpd.status.state == "stop") {
            var cmdlist = new Array();
            cmdlist.push('add "'+decodeURIComponent(url)+'"');
            cmdlist.push('play "'+(((finaltrack)+1).toString())+'"');
            mpd.do_command_list(cmdlist, playlist.repopulate);
        } else {
            mpd.command("command=add&arg="+url, playlist.repopulate);
        }
        scrollto = (finaltrack)+1;
    }

    this.addalbum = function(key) {
        self.waiting();
        var list = new Array();
        $('div[name="'+key+'"]').find('tr').each(function (index, element) { 
            var link = $(element).attr("ondblclick");
            var r = /playlist.addtrack\(\'(.*?)\'/;
            var result = r.exec(link);
            if (result && result[1]) {
                list.push('add "'+decodeURIComponent(result[1])+'"');
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
