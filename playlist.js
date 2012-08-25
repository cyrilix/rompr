
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
    var trackpointer = 0;
    var rolledup = rolledup;

    this.newtrack = function (track) {
        tracks.push(track);
    }

    this.getNextTrack = function() {
        var html = "";
        if (trackpointer >= tracks.length) { return null };
        if (trackpointer == 0) {
            html = html + self.header();
        }
        var showartist = false;
        if (tracks[trackpointer].compilation || (tracks[trackpointer].albumartist != "" && tracks[trackpointer].albumartist != tracks[trackpointer].creator)) {
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
        html = html + 'class="tracknumbr">'+format_tracknum(tracks[trackpointer].tracknumber)+'</td>';
        html = html + '<td align="left"><a href="#" class="album" onclick="mpd.command(\'command=play&arg='+tracks[trackpointer].playlistpos+'\')">'+
                        tracks[trackpointer].title+'</a></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.delete(\''+tracks[trackpointer].playlistpos+'\')">'+
                        '<img src="images/edit-delete.png"></a></td></tr>';
        if (showartist) {
            html = html + '<tr><td align="left" colspan="2" class="playlistrow2">'+tracks[trackpointer].creator+'</td></tr>';
        }
        html = html + '</table></div>';
        trackpointer++;
        return html;
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table class="playlisttitle" name="'+self.index+'" width="100%"><tr><td rowspan="2" width="40px">';
        var artname = "albumart/small/"+hex_md5(self.artist+" "+self.album)+".jpg";
        if (tracks[0].image) {
            artname = tracks[0].image;
        }
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        html = html + '<img width="32" height="32" src="'+artname+'"/>';
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
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                return tracks[i];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        mpd.deleteTracksByID(todelete, playlist.repopulate)
    }

    this.invalidateOnStop = function() {
        return true;
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
    var firstplaylistpos = -1;
    var lastplaylistpos = -1;
    var trackpointer = 0;
    this.index = index;
    var rolledup = rolledup;
    this.album = album;

    this.newtrack = function (track) {
        tracks.push(track);
        lastplaylistpos = track.playlistpos;
        if (firstplaylistpos == -1) { firstplaylistpos = track.playlistpos; }
    }


    this.getNextTrack = function() {
        var html = "";
        if (trackpointer >= tracks.length) { return null };
        if (trackpointer == 0) {
            html = html + self.header();
        }
        html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'"';
        if (rolledup) {
            html = html + ' class="invisible"';
        }
        html = html + '><table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
        html = html + '<tr>';
        html = html + '<td colspan="2" align="left" class="tiny" style="font-weight:normal">'+
                        tracks[trackpointer].stream+'</td></tr>';
        html = html + '<tr><td width="20px"><img src="images/broadcast.png" width="16px"></td>'+
                        '<td align="left" class="tiny" style="font-weight:normal"><a href="#" class="album" onclick="mpd.command(\'command=play&arg='+tracks[trackpointer].playlistpos+'\')">'+
                        tracks[trackpointer].location+'</a></td></tr>';
        html = html + '</table></div>';
        trackpointer++;
        return html;
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table name="'+self.index+'" width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        if (tracks[0].image) {
            html = html + '<img src="'+tracks[0].image+'" height="32px" width="32px"/></td><td colspan="2">';
        } else {
            html = html + '<img src="images/album-unknown-small.png"/></a></td><td cellpadding="2px" colspan="2" align="left">';
        }

        html = html + tracks[0].creator+'</td></tr><tr><td align="left"><i><a class="album" href="#" onclick="mpd.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
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
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                return tracks[i];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        mpd.deleteTracksByID(todelete, playlist.repopulate)
    }

    this.invalidateOnStop = function() {
        return true;
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

function LastFMRadio(station, index, rolledup) {
    var self = this;
    var tracks = new Array();
    var firstplaylistpos = -1;
    var lastplaylistpos = -1;
    var trackpointer = 0;
    this.station = station;
    this.index = index;
    var rolledup = rolledup;

    this.newtrack = function (track) {
        tracks.push(track);
        lastplaylistpos = track.playlistpos;
        if (firstplaylistpos == -1) { firstplaylistpos = track.playlistpos; }
    }

    this.getNextTrack = function() {
        var html = "";
        if (trackpointer >= tracks.length) { return null };
        if (trackpointer == 0) {
            html = html + self.header();
        }

        html = html + '<div id="booger" name="'+tracks[trackpointer].playlistpos+'"';
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
        trackpointer++;
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
        for(var i in tracks) {
            debug.log("Track",i,"expires in", parseInt(tracks[i].expires) - unixtimestamp);
            if (unixtimestamp > parseInt(tracks[i].expires)) {
                debug.log("Expiring track", i, tracks[i].expires, unixtimestamp);
                todelete.push(tracks[i].backendid);
            } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                debug.log("Removing track which was playing but has been skipped")
                todelete.push(tracks[i].backendid);
            }
        }
        // This is making sure there aren't any tracks before the current track in our list.
        // This should never happen but with complex callback driven stuff like this
        // you just never know.... :)
        if (todelete.length == 0) {
            var srumbliscious = new Array();
            for(var i in tracks) {
                if (tracks[i].playlistpos == currentsong && i>0) {
                    debug.log("This should never happen");
                    todelete = srumbliscious;
                    break;
                }
                srumbliscious.push(tracks[i].backendid);
            }
        }

        if (todelete.length > 0) {
            if (todelete.length == tracks.length) {
                var pos = (parseInt(tracks[0].playlistpos))-1;
                if (pos < 0) { pos=0 }
                playlist.dontplay = true;
                playlist.setEndofradio(pos);
                lastfm.radio.tune({station: tracks[0].stationurl}, lastFMIsTuned, lastFMTuneFailed);
            }
            if (todelete.length == (tracks.length)-1) {
                playlist.setEndofradio(parseInt(tracks[0].playlistpos)+1);
                lastfm.radio.tune({station: tracks[0].stationurl}, lastFMIsTuned, lastFMTuneFailed);
            }
            mpd.deleteTracksByID(todelete, playlist.repopulate);
            return true;
        }
        return false;
    }

    this.findcurrent = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                $('table[name="'+self.index+'"]').attr("class", "playlistcurrenttitle");
                $("#"+which).attr("class", "playlistcurrentitem");
                return tracks[i];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for (var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        mpd.deleteTracksByID(todelete, playlist.repopulate)
    }

    this.invalidateOnStop = function(songid) {
        for (var i in tracks) {
            if (tracks[i].backendid == songid) {
                debug.log("Removing current track, which was playing and has been stopped");
                if (tracks.length == 2) {
                    debug.log("...and repopulating");
                    playlist.dontplay = true;
                    playlist.setEndofradio(parseInt(tracks[i].playlistpos));
                    lastfm.radio.tune({station: tracks[i].stationurl}, lastFMIsTuned, lastFMTuneFailed);
                }
                mpd.deleteTracksByID([songid], playlist.repopulate);
                break;
            }
        }
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
    var endofradio = -1;
    var finaltrack = -1;
    var previoussong = -1;
    this.dontplay = false;
    this.rolledup = new Array();

    this.repopulate = function() {
        debug.log("Repopulating Playlist");
        tracklist = [];
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
        debug.log("Got Playlist from MPD");
        var item;
        var count = 0;
        var current_album = "";
        var current_artist = "";
        var current_station = "";
        var track;
        finaltrack = -1;
        currentsong = -1;
        currentalbum = -1;
        //previoussong = -1;

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

            var sortartist = track.creator;
            if (track.albumartist != "") { sortartist = track.albumartist }
            if ((sortartist.toLowerCase() != current_artist.toLowerCase() && track.compilation != "yes") || track.album.toLowerCase() != current_album.toLowerCase()) {
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
                            item = new LastFMRadio(track.station, count, hidden);
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
        }

        debug.log("Playlist: finaltrack is",finaltrack);

        var html = "";
        var stuff = "";
        for (var i in tracklist) {
            do {
                if (stuff) { html = html + stuff; }
                stuff = tracklist[i].getNextTrack();
            } while (stuff)
        }
        $("#sortable").html(html);

        $("#sortable").sortable({ items: "div" });
        $("#sortable").disableSelection();
        $("#sortable").sortable({ 
            axis: 'y', 
            containment: '#sortable', 
            scroll: 'true', 
            tolerance: 'intersect' 
        });
        $("#sortable").sortable({ 
            start: function(event, ui) { 
                ui.item.css("background", "#555555"); 
                ui.item.css("opacity", "0.7") 
            } 
        });
        $("#sortable").sortable({ 
            update: function(event, ui) {
                var itemstomove;
                var firstmoveitem;
                var numitems;
                var moveto;
                var elementmoved = ui.item.attr("id");
                var nextelement = $(ui.item).next().attr("id");
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
                if (nextelement == "track") { 
                    moveto = $(ui.item).next().attr("name") 
                }
                if (nextelement == "item" ) { 
                    moveto = tracklist[parseInt($(ui.item).next().attr("name"))].getFirst() 
                }
                // If we move DOWN we have to calculate what the position will be AFTER the items
                // have been moved. Bit daft, that.
                if (parseInt(firstmoveitem) < parseInt(moveto)) {
                    var a = parseInt(moveto);
                    a = a - parseInt(numitems);
                    if (a<0) { a=0 }
                    moveto = a;
                }
                mpd.command("command=move&arg="+itemstomove+"&arg2="+moveto, self.repopulate);
            }
        });

        self.checkProgress();

    }

    this.delete = function(pos) {
        mpd.command("command=delete&arg="+pos, playlist.repopulate);
    }

    this.waiting = function() {
        var html = "";
        html = html + '<div id="item" name="waiter"><table width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<img src="images/waiting2.gif" height="32px"/></td><td colspan="2" align="left">';
        html = html + 'Incoming....</td></tr><tr><td align="left" ></td>';
        html = html + '<td class="playlisticon" align="right"></td>';
        html = html + '</tr></table></div>';
        $('#sortable').append(html);
    }

    // This is actually used for adding any new radio playlist, not just Last.FM
    // The albums list does NOT use this. Perhaps it should, but that's just extra work and extra code.
    this.newInternetRadioStation = function (list) {
        var numtracks = 0;
        var cmdlist = new Array();
        var playfrom = finaltrack+1;
        $(list).find("track").each( function() {
            cmdlist.push('add "'+$(this).find("location").text()+'"');
            numtracks++;
        });
        if (endofradio > -1 && endofradio < finaltrack) {
            var elbow = (finaltrack)+1;
            var arse = (finaltrack)+numtracks+1;
            playfrom = null;
            cmdlist.push('move '+elbow.toString()+':'+arse.toString()+' '+endofradio.toString());
        }
        if (mpd.status.state == 'stop' && playfrom != null && !self.dontplay) {
            cmdlist.push('play '+playfrom.toString());
        }
        mpd.do_command_list(cmdlist, playlist.repopulate);
        self.dontplay = false;
        endofradio = -1;
    }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.saveLastFMPlaylist = function(xml) {
        var oSerializer = new XMLSerializer(); 
        var xmlString = oSerializer.serializeToString(xml);
        $.post("newplaylist.php", 
            { 
                type: "radio", 
                xml: xmlString, 
                stationurl: lastfm.tunedto 
            })
            .done( function() { 
                self.newInternetRadioStation(xml) 
            });
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    this.setEndofradio = function(pos) {
        endofradio = pos;
    }

    this.checkProgress = function() {
        clearProgressTimer();
        if (finaltrack == -1) {
            // Playlist is empty
            nowplaying.newTrack(emptytrack);
        } else {
            if (mpd.status.song != currentsong || mpd.status.songid != previoussong) {
                debug.log("Updating current song");
                currentsong = mpd.status.song;
                $(".playlistcurrentitem").attr("class", "playlistitem");
                $(".playlistcurrenttitle").attr("class", "playlisttitle");
                for(var i in tracklist) {
                    currentTrack = tracklist[i].findcurrent(currentsong);
                    if (currentTrack) {
                        currentalbum = i;
                        break;
                    }
                }
            }

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
                    var contents = "";
                    contents = '<p class="larger"><b>';
                    contents=contents+"Waiting for station info..."
                    contents=contents+'</b></p>';
                    $("#nowplaying").html(contents);
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
            $("#progress").progressbar("option", "value", parseInt(percent.toString()));
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
                // This could be dangerous... we call into here from updateStreamInfo,
                // which is called from checkStream, which is called from etc etc
                // I see a race condition where this call goes into playlist.repopulate
                // while it's still repopulating or something.
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
            tracklist[i].invalidateOnStop(songid);
        }
    }

    this.addtrack = function(url) {
        if (mpd.status.state == "stop") {
            var cmdlist = new Array();
            cmdlist.push('add "'+decodeURIComponent(url)+'"');
            cmdlist.push("play "+(((finaltrack)+1).toString()));
            mpd.do_command_list(cmdlist, playlist.repopulate);
        } else {
            mpd.command("command=add&arg="+url, playlist.repopulate);
        }
    }

    this.addalbum = function(key) {
        var list = new Array();
        $('div[name="'+key+'"]').find('a').each(function (index, element) { 
            var link = $(element).attr("onclick");
            var r = /playlist.addtrack\(\'(.*?)\'/;
            var result = r.exec(link);
            if (result[1]) {
                list.push('add "'+decodeURIComponent(result[1])+'"');
            }
        });
        if (mpd.status.state == 'stop') {
            var f = finaltrack+1;
            list.push('play '+f.toString());
        }
        mpd.do_command_list(list, playlist.repopulate);        
    }    

}
