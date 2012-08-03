
function Track(options) {

    var self = this;
    for(var i in options) {
        this[i] = options[i];
    }
}

function format_tracknum(tracknum) {
    var r = /^(\d+)/;
    var result = r.exec(tracknum) || "";
    return result[1] || "";
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
        html = html + '<td align="left"><a href="#" class="album" onclick="infobar.command(\'command=play&arg='+tracks[trackpointer].playlistpos+'\')">'+
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
        html = html + '<div id="item" name="'+self.index+'"><table class="playlisttitle" width="100%"><tr><td rowspan="2" width="40px">';
        var artname = "albumart/small/"+hex_md5(self.artist+" "+self.album)+".jpg";
        if (tracks[0].image) {
            artname = tracks[0].image;
        }
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        html = html + '<img width="32" height="32" src="'+artname+'"/>';
        html = html + '</a>';
        html = html + '</td><td align="left" colspan="2">';
        html = html + self.artist+'</td></tr><tr><td align="left" ><i><a href="#" class="album" onclick="infobar.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'+self.album+'</a></i></td>';
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
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                $("#"+which).attr("class", "playlistcurrentitem");
                // if (rolledup) {
                //     var artname = "albumart/small/"+hex_md5(self.artist+" "+self.album)+".jpg";
                //     if (tracks[0].image) {
                //         artname = tracks[0].image;
                //     }
                //     $('img[src="'+artname+'"]').effect('pulsate', {times: 1000}, 5000);
                // }
                break;
            }
        }
        return false;
    }

    this.findcurrent = function(which, what) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                return tracks[i][what];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        infobar.deleteTracksByID(todelete, playlist.repopulate)
    }

    this.invalidateOnStop = function() {
        return true;
    }

    this.previoustrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                return "previous";
            }
        }
        return null;
    }

    this.nexttrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                return "next";
            }
        }
        return null;
    }

}

function Stream(index) {
    var self = this;
    var tracks = new Array();
    var firstplaylistpos = -1;
    var lastplaylistpos = -1;
    var trackpointer = 0;
    this.index = index;

    debug.log("Playlist: New Stream Created");

    this.newtrack = function (track) {
        tracks.push(track);
        lastplaylistpos = track.playlistpos;
        if (firstplaylistpos == -1) { firstplaylistpos = track.playlistpos; }
    }

    this.getNextTrack = function() {
        if (trackpointer >= tracks.length) { return null };
        if (trackpointer == 0) {
            trackpointer++;
            return self.header();
        }
        trackpointer++;
        return "";
    }

    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table width="100%" id="'+tracks[0].playlistpos+'" class="playlistitem"><tr><td rowspan="2" width="40px">';
        if (tracks[0].image) {
            html = html + '<img src="'+tracks[0].image+'" height="32px" width="32px"/></td><td colspan="2">';
        } else {
            html = html + '<img src="images/album-unknown-small.png"/></td><td cellpadding="2px" colspan="2" align="left">';
        }

        html = html + tracks[0].creator+'</td></tr><tr><td align="left"><i><a class="album" href="#" onclick="infobar.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
                        +(tracks[0].title || tracks[0].album)+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';
        html = html + '</tr></table></div>';
        return html;
    }

    this.rollUp = function() {
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
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                $("#"+tracks[0].playlistpos).attr("class", "playlistcurrentitem");
                break;
            }
        }
        return false;
    }

    this.findcurrent = function(which, what) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                // if (what == 'title') {
                //     return tracks[i].title == "Unknown" ? "" : tracks[i].title;
                // }
                return tracks[i][what];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for(var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        infobar.deleteTracksByID(todelete, playlist.repopulate)
    }

    this.invalidateOnStop = function() {
        return true;
    }

    this.previoustrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                var t = parseInt(tracks[0].playlistpos)-1;
                return "play "+t;
            }
        }
        return null;
    }

    this.nexttrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                var t = parseInt(tracks[(tracks.length)-1].playlistpos)+1;
                return "play "+t.toString();
            }
        }
        return null;
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
        html = html + '<div id="item" name="'+self.index+'"><table width="100%" class="playlisttitle"><tr><td rowspan="2" width="40px">';
        html = html + '<a href="#" title="Click to Roll Up" onclick="javascript:playlist.hideItem('+self.index+')">';
        html = html + '<img src="images/lastfm.png"/>';
        html = html + '</a>';
        html = html + '</td><td colspan="2" align="left">';
        html = html + 'Last.FM</td></tr><tr><td align="left" ><i><a class="album" href="#" onclick="infobar.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
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
            if (tracks[i].playlistpos == currentsong) {
                $("#"+currentsong).attr("class", "playlistcurrentitem");
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
                playlist.setEndofradio(pos);
                lastfm.radio.tune({station: tracks[0].stationurl}, lastFMIsTuned, lastFMTuneFailed);
            }
            if (todelete.length == (tracks.length)-1) {
                playlist.setEndofradio(parseInt(tracks[0].playlistpos)+1);
                lastfm.radio.tune({station: tracks[0].stationurl}, lastFMIsTuned, lastFMTuneFailed);
            }
            infobar.deleteTracksByID(todelete, playlist.repopulate);
            return true;
        }
        return false;
    }

    this.findcurrent = function(which, what) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                debug.log("Stream at",which,"returning",tracks[i][what],"for",what);
                return tracks[i][what];
            }
        }
        return null;
    }

    this.deleteSelf = function() {
        var todelete = new Array();
        for (var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        infobar.deleteTracksByID(todelete, playlist.repopulate)
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
                infobar.deleteTracksByID([songid], playlist.repopulate);
                break;
            }
        }
    }

    this.previoustrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                return "previous";
            }
        }
        return null;
    }

    this.nexttrackcommand = function(which) {
        for(var i in tracks) {
            if (tracks[i].playlistpos == which) {
                return "next";
            }
        }
        return null;
    }

}

function Playlist() {

    var tracklist = new Array();
    var currentsong = 0;
    var self = this;
    this.endofradio = -1;
    this.finaltrack = -1;
    this.previoustrack = -1;
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
                    error: function(data, status) { alert("Something went wrong retrieving the playlist!") }
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
        self.finaltrack = -1;
        $(list).find("track").each( function() {

            track = new Track({ creator: $(this).find("creator").text(),
                                albumartist: $(this).find("albumartist").text(),
                                album: $(this).find("album").text(),
                                title: $(this).find("title").text(),
                                location: $(this).find("location").text(),
                                duration: $(this).find("duration").text(),
                                backendid: $(this).find("backendid").text(),
                                tracknumber: $(this).find("tracknumber").text(),
                                playlistpos: $(this).find("playlistpos").text(),
                                expires: $(this).find("expires").text(),
                                image: $(this).find("image").text(),
                                type: $(this).find("type").text(),
                                station: $(this).find("station").text(),
                                stationurl: $(this).find("stationurl").text(),
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
                            var hidden = false;
                            if (self.rolledup["Various Artists"+track.album]) {
                                hidden = true;
                            }
                            item = new Album("Various Artists", track.album, count, hidden);
                        } else {
                            var hidden = false;
                            if (self.rolledup[sortartist+track.album]) {
                                hidden = true;
                            }
                            item = new Album(sortartist, track.album, count, hidden);
                        }
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "stream":
                        item = new Stream(count);
                        tracklist[count] = item;
                        count++;
                        current_station = "";
                        break;
                    case "lastfmradio":
                        if (track.station != current_station) {
                            var hidden = false;
                            if (self.rolledup[track.station]) {
                                hidden = true;
                            }
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
            self.finaltrack = parseInt(track.playlistpos);
            debug.log("Setting finaltrack to",self.finaltrack);
        }

        var html = "";
        var stuff = "";
        for (var i in tracklist) {
            do {
                if (stuff) { html = html + stuff; }
                stuff = tracklist[i].getNextTrack();
            } while (stuff)
        }
        $("#sortable").html(html);

        infobar.updateWindowValues();

        $("#sortable").sortable({ items: "div" });
        $("#sortable").disableSelection();
        $("#sortable").sortable({ axis: 'y', containment: '#sortable', scroll: 'true', tolerance: 'intersect' });
        $("#sortable").sortable({ start: function(event, ui) { ui.item.css("background", "#555555"); ui.item.css("opacity", "0.7") } } );
        $("#sortable").sortable({ update: function(event, ui) {
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
                if (nextelement == "track") { moveto = $(ui.item).next().attr("name") }
                if (nextelement == "item" ) { moveto = tracklist[parseInt($(ui.item).next().attr("name"))].getFirst() }
                // Trouble is.... if we move DOWN we have to calculate what the position will be AFTER the items
                // have been moved.
                if (parseInt(firstmoveitem) < parseInt(moveto)) {
                    var a = parseInt(moveto);
                    a = a - parseInt(numitems);
                    if (a<0) { a=0 }
                    moveto = a;
                }

                //debug.log("Moving",itemstomove,"to",moveto);
                infobar.command("command=move&arg="+itemstomove+"&arg2="+moveto, self.repopulate);
            }
        });

    }

    this.delete = function(pos) {
        infobar.command("command=delete&arg="+pos, playlist.repopulate);
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
        debug.log("New Stream Playlist Has Arrived. Our flags are",self.endofradio,self.finaltrack);
        var numtracks = 0;
        var cmdlist = new Array();
        var playfrom = self.finaltrack+1;
        $(list).find("track").each( function() {
            //debug.log($(this).find("title").text());
            cmdlist.push('add "'+$(this).find("location").text()+'"');
            numtracks++;
        });
        if (self.endofradio > -1 && self.endofradio < self.finaltrack) {
            //debug.log("Tracks need to be moved into position");
            var elbow = (self.finaltrack)+1;
            var arse = (self.finaltrack)+numtracks+1;
            playfrom = null;
            cmdlist.push('move '+elbow.toString()+':'+arse.toString()+' '+self.endofradio.toString());
        }
        if (infobar.getState() == 'stop' && playfrom && !self.dontplay) {
            debug.log("Adding command to play from",playfrom.toString());
            cmdlist.push('play '+playfrom.toString());
        }
        infobar.do_command_list(cmdlist, playlist.repopulate);
        self.dontplay = false;
        self.endofradio = -1;
    }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.saveLastFMPlaylist = function(xml) {
        var oSerializer = new XMLSerializer(); 
        var xmlString = oSerializer.serializeToString(xml);
        $.post("newplaylist.php", { type: "radio", xml: xmlString, stationurl: lastfm.tunedto })
            .done( function() { self.newInternetRadioStation(xml) });
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    this.setEndofradio = function(pos) {
        debug.log("Setting and of radio to",pos);
        self.endofradio = pos;
    }

    this.updateCurrentSong = function(pos, id) {
        debug.log("Updating current song");
        $(".playlistcurrentitem").attr("class", "playlistitem");
        currentsong = pos;
        var thing = false;
        for(var i in tracklist) {
            thing = tracklist[i].invalidateOldTracks(currentsong, self.previoussong);
            if (thing) {break}
        }
        self.previoussong = id;
    }

    this.current = function(what) {
        for(var i in tracklist) {
            var it = tracklist[i].findcurrent(currentsong, what);
            if (it) { return it }
        }
        return "";
    }

    this.previous = function() {
        for(var i in tracklist) {
            var cmd = tracklist[i].previoustrackcommand(currentsong);
            if (cmd) { 
                infobar.command("command="+cmd);
                break;
            }
        }
    }

    this.next = function() {
        for(var i in tracklist) {
            var cmd = tracklist[i].nexttrackcommand(currentsong);
            if (cmd) { 
                infobar.command("command="+cmd);
                break;
            }
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
        if (infobar.getState() == "stop") {
            var cmdlist = new Array();
            cmdlist.push('add "'+decodeURIComponent(url)+'"');
            cmdlist.push("play "+(((self.finaltrack)+1).toString()));
            infobar.do_command_list(cmdlist, playlist.repopulate);
        } else {
            infobar.command("command=add&arg="+url, playlist.repopulate);
        }
    }

}
