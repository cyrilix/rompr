
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
    
function Album(artist, album, index) {
        
    var self = this;
    var tracks = new Array();
    this.artist = artist;
    this.album = album;
    this.index = index;
    var trackpointer = 0;
    
    this.newtrack = function (track) {
        tracks.push(track);
    }
    
    this.getNextTrack = function() {
        var html = "";
        if (trackpointer >= tracks.length) { return null };
        if (trackpointer == 0) {
            html = html + self.header();
        }
        html = html + '<div id="track" name="'+tracks[trackpointer].playlistpos+'"><table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
        html = html + '<tr><td class="tracknumbr">'+format_tracknum(tracks[trackpointer].tracknumber)+'</td>';
        html = html + '<td><a href="#" class="album" onclick="infobar.command(\'command=play&arg='+tracks[trackpointer].playlistpos+'\')">'+
                        tracks[trackpointer].title+'</a></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.delete(\''+tracks[trackpointer].playlistpos+'\')">'+
                        '<img src="images/edit-delete.png"></a></td></tr>';
        if (tracks[trackpointer].compilation || (tracks[trackpointer].albumartist != "" && tracks[trackpointer].albumartist != tracks[trackpointer].creator)) {
            html = html + '<tr><td colspan="3" class="playlistrow2">'+tracks[trackpointer].creator+'</td></tr>';
        }
        html = html + '</table></div>';
        trackpointer++;
        return html;
    }
    
    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table width="100%"><tr><td rowspan="2">';
        var artname = "albumart/small/"+hex_md5(self.artist+" "+self.album)+".jpg";
        if (tracks[0].image) {
            artname = tracks[0].image;
        }
        html = html + '<img width="32" height="32" src="'+artname+'"/></td><td cellpadding="2px" colspan="2">';
        html = html + self.artist+'</td></tr><tr><td cellpadding="2px"><i>'+self.album+'</i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';
        html = html + '</tr></table></div>';
        return html;
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
    
    this.invalidateOldTracks = function() {
        return false;
    }

    this.updateRadio = function() {
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

}

function Stream(index) {
    var self = this;
    var tracks = new Array();
    var firstplaylistpos = -1;
    var lastplaylistpos = -1;
    var trackpointer = 0;
    this.index = index;
    
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
        html = html + '<div id="item" name="'+self.index+'"><table width="100%"><tr><td rowspan="2">';
        if (tracks[0].image) {
            html = html + '<img src="'+tracks[0].image+'" height="32px" width="32px"/></td><td cellpadding="2px" colspan="2">';
        } else {
            html = html + '<img src="images/album-unknown-small.png"/></td><td cellpadding="2px" colspan="2">';
        }
            
        html = html + tracks[0].creator+'</td></tr><tr><td cellpadding="2px"><i><a class="album" href="#" onclick="infobar.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
                        +(tracks[0].title || tracks[0].album)+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';                        
        html = html + '</tr></table></div>';
        return html;
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
    
    this.invalidateOldTracks = function() {
        return false;
    }

    this.updateRadio = function() {
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
    
}    

function LastFMRadio(station, index) {
    var self = this;
    var tracks = new Array();
    var firstplaylistpos = -1;
    var lastplaylistpos = -1;
    var trackpointer = 0;
    this.station = station;
    this.index = index;
    
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
        html = html + '<table width="100%" class="playlistitem" id="'+tracks[trackpointer].playlistpos+'">';
        html = html + '<tr><td rowspan="2"><img src="'+tracks[trackpointer].image+'" width="32" height="32"></td>';
        html = html + '<td colspan="3" class="album">'+tracks[trackpointer].title+'</a></td></tr>';
        html = html + '<tr><td class="playlistrow2">'+tracks[trackpointer].creator+'</td><td class="playlistrow2">'+tracks[trackpointer].album+'</td>'
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.delete(\''+tracks[trackpointer].playlistpos+'\')">'+
                        '<img src="images/edit-delete.png"></a></td></tr></table>';
        trackpointer++;
        return html;
    }
    
    this.header = function() {
        var html = "";
        html = html + '<div id="item" name="'+self.index+'"><table width="100%"><tr><td rowspan="2">';
        html = html + '<img src="images/lastfm.png"/></td><td cellpadding="2px" colspan="2">';
        html = html + 'Last.FM</td></tr><tr><td cellpadding="2px"><i><a class="album" href="#" onclick="infobar.command(\'command=play&arg='+tracks[0].playlistpos+'\')">'
                        +self.station+'</a></i></td>';
        html = html + '<td class="playlisticon" align="right"><a href="#" onclick="playlist.deleteGroup(\''+self.index+'\')">'+
                        '<img src="images/edit-delete.png"></a></td>';                        
        html = html + '</tr></table></div>';
        return html;
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
        var unixtimestamp = Math.round(+new Date()/1000);
        for(var i in tracks) {
            if (unixtimestamp > parseInt(tracks[i].expires)) {
                debug.log("Expiring track", tracks[i].expires, unixtimestamp);
                todelete.push(tracks[i].backendid);
            } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                debug.log("Removing track which was playing but has been skipped")
                todelete.push(tracks[i].backendid);
            }
        }
        if (todelete.length > 0) {
//            if (todelete.length == tracks.length) {
//                // !! We've expired ALL our tracks!
//                // Force an update FIRST. 


            // All attempts to get the playlist to update a radio station in this circumstance
            // fell foul of asynchronous race conditions or massive recursion.
            // You're probably cleverer than me, you make it work :)


//                debug.log("All radio tracks expired! Forcing repopulate");
//            }
            infobar.deleteTracksByID(todelete, playlist.repopulate);
            return true;
        }    
        // This is a catchall - in normal operation we should never get any hits here
        // but just in case.....
        for(var i in tracks) {
            if (tracks[i].playlistpos == currentsong && i>0) {
                //debug.log("Found current playlist item in radio stream at position",i);
                infobar.deleteTracksByID(todelete, playlist.repopulate);
                // Return true - this prevents us trying to update the radio station
                // this time around and getting hopelessly out of sync
                return true;
            }
            todelete.push(tracks[i].backendid);
        }
        return false;
    }
    
    this.updateRadio = function() {
        if (tracks.length == 1) {
            playlist.setEndofradio(tracks[0].playlistpos);
            debug.log("Setting endofradio to",playlist.endofradio);
            lastfm.radio.tune({station: tracks[0].stationurl}, lastFMIsTuned, lastFMTuneFailed);
            return true;
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
        for (var i in tracks) {
            todelete.push(tracks[i].backendid);
        }
        infobar.deleteTracksByID(todelete, playlist.repopulate)
    }
    
    this.invalidateOnStop = function(songid) {
        if (tracks[0].backendid == songid) {
            debug.log("Removing current track, which was playing and has been stopped");
            infobar.deleteTracksByID([songid], playlist.repopulate);
        }
    }
    
}    
    

function Playlist() {
    
    var tracklist = new Array();
    var cojones = new Array();
    var currentsong = 0;
    var self = this;
    this.endofradio = -1;
    this.justadded = false;
    this.finaltrack = 0;
    this.previoustrack = -1;
    
    this.repopulate = function() {
        debug.log("Repopulating Playlist");
        tracklist = [];
        //$.get("getplaylist.php", "{}").done( playlist.newXSPF )
        //                        .fail(function(data, status) { debug.log("Playlist Fail"); debug.log(data, status); } );
        // $.get would probably work - I changed all this when I was tracking down a bug but it works
        // so for the moment it's staying as it is
        $.ajax({
                    type: "POST",
                    url: "getplaylist.php",
                    cache: false,
                    contentType: "text/xml; charset=utf-8",
                    data: "{}",
                    dataType: "xml",
                    success: playlist.newXSPF,
                    error: function(data, status) {  }
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
                           item = new Album("Various Artists", track.album, count);
                       } else {
                            item = new Album(sortartist, track.album, count);
                       }
                       tracklist[count] = item;
                       count++;
                       break;
                   case "stream":
                       item = new Stream(count);
                       tracklist[count] = item;
                       count++;
                       break;
                   case "lastfmradio":
                       if (track.station != current_station) {
                           item = new LastFMRadio(track.station, count);
                           current_station = track.station;
                           tracklist[count] = item;
                           count++;
                       }
                       break;
                   default:
                       item = new Album(sortartist, track.album, count);
                       tracklist[count] = item;
                       count++;
                       break;
                       
               }

           }
           item.newtrack(track);

        });
        if (track) {
            self.finaltrack = parseInt(track.playlistpos);
            debug.log("Setting finaltarck to",self.finaltrack);
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
    
    // This is actually used for adding any new radio playlist, not just Last.FM
    // - basically any new track which come in as XML format
    // The albums list does NOT use this. Perhaps it should, but that's just extra work and extra code.
    this.newLastFMRadioStation = function (list) {
        debug.log("New Last.FM Playlist");
        revertPointer();
        $(list).find("track").each( function() { 
            debug.log($(this).find("title").text());
            cojones.push(encodeURIComponent($(this).find("location").text()));
        });
        self.justadded = false;
        self.addNewTracks();
    }
    
    this.saveRadioPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "radio", xml: xml, stationurl: lastfm.tunedto });
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    this.addNewTracks = function() {
        debug.log("Add New Track : ", "endofradio", self.endofradio, "finaltrack", self.finaltrack, "justadded", self.justadded);
//        if (self.justadded && self.endofradio > -1 && self.endofradio < self.finaltrack) {
        if (self.justadded && (self.endofradio > -1) && (self.endofradio < self.finaltrack)) {
            debug.log("Moving track into position");
            self.justadded = false;
            self.finaltrack++;
            self.endofradio++;
            infobar.command("command=move&arg="+self.finaltrack+"&arg2="+self.endofradio, playlist.addNewTracks);
        } else {
            var t = cojones.shift();
            if (t) {
                self.justadded = true;
                debug.log("Adding Track");
                infobar.command("command=add&arg="+t, playlist.addNewTracks);
            } else {
                self.endofradio = -1;
                self.repopulate();
            }
        }
    }

    this.setEndofradio = function(pos) {
        self.endofradio = pos;
    }
    
    this.updateCurrentSong = function(pos, id) {
        debug.log("Updating current song");
        $(".playlistcurrentitem").attr("class", "playlistitem"); 
        $("#"+pos).attr("class", "playlistcurrentitem");
        currentsong = pos;
        var thing = false;
        for(var i in tracklist) {
            thing = tracklist[i].invalidateOldTracks(currentsong, self.previoussong);
            if (thing) {break}
        }
        if (!thing) {
            for(var i in tracklist) {
                thing = tracklist[i].updateRadio();
                if (thing) {break}
            }
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
    
    this.deleteGroup = function(index) {
        tracklist[index].deleteSelf();
    }
    
    this.checkSongIdAfterStop = function(songid) {
        for(var i in tracklist) {
            tracklist[i].invalidateOnStop(songid);
        }
    }
}

