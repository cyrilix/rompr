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
    var lastfmcleanuptimer = null;
    var ignorecounter = 0;
    var progresstimer = null;

    this.emptytrack = {
        album: "",
        albumartist: "",
        backendid: "",
        compilation: "",
        creator: "",
        dir: "",
        duration: "",
        expires: "",
        image: "",
        key: "",
        location: "",
        musicbrainz: {
            albumartistid: "",
            albumid: "",
            artistid: "",
            trackid: ""
        },
        origimage: "",
        playlistpos: "",
        spotify: {
            album: ""
        },
        station: "",
        stationurl: "",
        stream: "",
        title: "",
        tracknumber: "",
        type: ""
    };

    /*
        There are three mechanisms for preventing multiple repeated updates of the playlist
        1. We keep count of how many ongoing requests we have sent to Apache
            If this ever exceeds 1, all responses we receive will be ignored until
            the count reaches zero. We then do one more. This, however, only decreases
            the load on US, not on mpd/mopidy

        2. Every update request we receive starts a timer. Subsequent reqeusts restart it
            if it hasn't expired. We only request a new playlist from mpd/mopidy when the
            timer expires

        3. Functions can tell us to ignore the next n repopulate reqeusts

    */

    this.repopulate = function() {
        if (ignorecounter > 0) {
            debug.log("PLAYLIST","Ignoring repopulate request, as requested");
            ignorecounter--;
            return;
        }
        debug.log("PLAYLIST","Repopulating....");
        updatecounter++;
        player.controller.getPlaylist();
        self.cleanupCleanupTimer();
        coverscraper.clearCallbacks();
    }

    this.ignoreupdates = function(num) {
        // Every single track we add or remove, mopidy sends us an update.
        // If we act on all of them we waste a lot of time.
        // Functions that know how many items they're going to modify in the playlist
        // can tell the playlist to ignore some of them (probably n-1 of them)
        ignorecounter += num;
        debug.log("PLAYLIST","Will ignore the next",ignorecounter,"updates");
    }

    this.updateFailure = function() {
        debug.error("PLAYLIST","Got notified that an update FAILED");
        updatecounter--;
        if (updatecounter == 0 && ignorecounter == 0) {
            debug.log("PLAYLIST","Update failed and no more are expected. Doing another");
            self.repopulate();
        }
    }

    this.newXSPF = function(list) {
        var item;
        var count = 0;
        var current_album = "";
        var current_artist = "";
        var current_station = "";
        var current_type = "";
        // var track;
        var expiresin = null;

        self.cleanupCleanupTimer();

        // This is a mechanism to prevent multiple repeated updates of the playlist in the case
        // where, for example, the user is clicking rapidly on the delete button for lots of tracks
        // and the playlist is slow to update from mpd
        updatecounter--;
        if (updatecounter > 0 || ignorecounter > 0) {
            debug.log("PLAYLIST","Received playlist update but ",updatecounter," more are coming and ",ignorecounter," are expected - ignoring");
            if (ignorecounter == 0) {
                do_delayed_update = true;
            }
            return 0;
        }

        if (do_delayed_update) {
            // Once all the repeated updates have been received from mpd, ignore them all
            // (because we can't be sure which order they will have come back in),
            // do one more of our own, and use that one
            do_delayed_update = false;
            debug.log("PLAYLIST","Doing delayed playlist update");
            self.repopulate();
            return 0;
        }
        // ***********

        debug.log("PLAYLIST","Got Playlist from Apache",list);
        self.clearProgressTimer();
        finaltrack = -1;
        currentsong = -1;
        currentalbum = -1;
        tracklist = [];
        var totaltime = 0;

        var unixtimestamp = Math.round(new Date()/1000);
        for (var i in list) {
            track = list[i];
            track.duration = parseFloat(track.duration);
            totaltime += track.duration;
            var sortartist = (track.albumartist == "") ? track.creator : track.albumartist;
            if ((track.compilation != "yes" && sortartist.toLowerCase() != current_artist.toLowerCase()) ||
                track.album.toLowerCase() != current_album.toLowerCase() ||
                track.type != current_type)
            {
                current_type = track.type;
                current_artist = sortartist;
                current_album = track.album;
                switch (track.type) {
                    case "local":
                        if (track.compilation == "yes") {
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
                        var expirytime = parseInt(track.expires)-unixtimestamp;
                        if (expirytime > 0 && (expiresin === null || expirytime < expiresin)) {
                            expiresin = expirytime;
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
            finaltrack = parseInt(track.playlistpos);

        }

        // After all that, which will have taken a finite time - which could be a long time on
        // a slow device or with a large playlist, let's check that no more updates are pending
        // before we put all this stuff into the window. (More might have come in while we were organising this one)
        // This might all seem like a faff, but you do not want stuff you've just removed
        // suddenly re-appearing in front of your eyes and then vanishing again. It looks crap.
        if (updatecounter > 0 || ignorecounter > 0) {
            debug.log("PLAYLIST","Aborting update because counter is non-zero");
            return;
        }

        $("#sortable").empty();
        if (finaltrack > -1) {
            $("#sortable").append('<div class="booger"><table width="100%" class="playlistitem"><tr><td align="left">'
                                    +(finaltrack+1).toString()
                                    +' '+language.gettext("label_tracks")+'</td><td align="right">'+language.gettext("label_duration")+' : '
                                    +formatTimeString(totaltime)+'</td></tr></table></div>');
        }

        for (var i in tracklist) {
            $("#sortable").append(tracklist[i].getHTML());
        }

        makeFictionalCharacter();
        findCurrentTrack();
        if (scrollto > -1) {
            if (mobile == "no") {
                $('#pscroller').mCustomScrollbar("scrollTo", 'div[name="'+scrollto.toString()+'"]', {scrollInertia:500});
            } else {
                $("#pscroller").scrollTo('div[name="'+scrollto.toString()+'"]');
            }
            scrollto = -1;
        }

        self.checkProgress();

        if (expiresin != null) {
            debug.log("PLAYLIST","Last.FM Items in this playlist expire in",expiresin);
            lastfmcleanuptimer = setTimeout(self.lastfmcleanup, (expiresin+1)*1000);
        }

    }

    function makeFictionalCharacter() {
        // Invisible empty div tacked on the end is where we add our 'Incoming' animation
        $("#sortable").append('<div id="waiter" class="containerbox"></div>');
    }

    this.load = function(name) {
        self.clearProgressTimer();
        self.cleanupCleanupTimer();
        $("#sortable").empty();
        makeFictionalCharacter();
        playlist.waiting();
        if (mobile == "no") {
           $("#lpscr").slideToggle('fast');
        } else {
            sourcecontrol('playlistm');
        }
        debug.log("PLAYLIST","Loading Playlist",name);
        player.controller.loadPlaylist(name);
    }

    this.lastfmcleanup = function() {
        debug.log("PLAYLIST","Running last.fm cleanup");
        for(var i in tracklist) {
            if (tracklist[i].invalidateOldTracks(player.status.song, -1)) { break; }
        }
    }

    this.cleanupCleanupTimer = function() {
        clearTimeout(lastfmcleanuptimer);
    }

    this.draggedToEmpty = function(event, ui) {
        debug.log("PLAYLIST","Something was dropped on the empty playlist area",event,ui);
        ui.item = ui.helper;
        playlist.waiting();
        playlist.dragstopped(event,ui);
    }

    this.dragstopped = function(event, ui) {
        debug.log("PLAYLIST","Drag Stopped",event,ui);

        event.stopImmediatePropagation();
        var moveto  = (function getMoveTo(i) {
            debug.log("Drag Stopped",i.next());
            if (i.next().hasClass('track')) {
                return parseInt(i.next().attr("name"));
            }
            if (i.next().hasClass('item')) {
                return tracklist[parseInt(i.next().attr("name"))].getFirst();
            }
            if (i.parent().hasClass('trackgroup')) {
                return getMoveTo(i.parent());
            }
            return (parseInt(finaltrack))+1;
        })($(ui.item));
        if (ui.item.hasClass("draggable")) {
            // Something dragged from the albums list
            var tracks = new Array();
            $.each($('.selected').filter(removeOpenItems), function (index, element) {
                var uri = $(element).attr("name");
                if (uri) {
                    if ($(element).hasClass('clickalbum')) {
                        tracks.push({  type: "item",
                                        name: uri});
                    } else {
                        tracks.push({  type: "uri",
                                        name: decodeURIComponent(uri)});
                    }
                }
            });
            player.controller.addTracks(tracks, null, moveto);
            $('.selected').removeClass('selected');
            $("#dragger").remove();
        } else {
            // Something dragged within the playlist
            var elementmoved = ui.item.hasClass('track') ? 'track' : 'item';
            switch (elementmoved) {
                case "track":
                    var firstitem = parseInt(ui.item.attr("name"));
                    var numitems = 1;
                    break;
                case "item":
                    var firstitem = tracklist[parseInt(ui.item.attr("name"))].getFirst();
                    var numitems = tracklist[parseInt(ui.item.attr("name"))].getSize();
                    break;
            }
            // If we move DOWN we have to calculate what the position will be AFTER the items have been moved.
            // It's understandable, but slightly counter-intuitive
            if (firstitem < moveto) {
                moveto = moveto - numitems;
                if (moveto < 0) { moveto = 0; }
            }
            player.controller.move(firstitem, numitems, moveto);
        }
    }

    function removeOpenItems(index) {
        if ($(this).hasClass('clicktrack')) {
            return true;
        }
        // Filter out artist and album items whose dropdowns have been populated -
        // In these cases the individual tracks will exist and will be selected
        // (and might only have partial selections even if the header is selected)
        if ($("#"+$(this).attr('name')).hasClass('notfilled')) {
            return true;
        } else {
            return false;
        }
    }

    this.delete = function(id) {
        $('.track[romprid="'+id.toString()+'"]').remove();
        player.controller.removeId([parseInt(id)]);
    }

    this.waiting = function() {
        $("#waiter").empty();
        doSomethingUseful('waiter', language.gettext("label_incoming"));
    }

    // This is used for adding stream playlists ONLY
    this.newInternetRadioStation = function(list) {
        scrollto = (finaltrack)+1;
        var tracks = [];
        $(list).find("track").each( function() {
            tracks.push({   type: "uri",
                            name: $(this).find("location").text()}
            );
        });
        player.controller.addTracks(tracks, playlist.playFromEnd(), null);
    }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.playFromEnd = function() {
        if (player.status.state == "stop") {
            debug.log("PLAYLIST","Playfromend",finaltrack+1);
            return finaltrack+1;
        } else {
            debug.log("PLAYLIST","Disabling auto-play");
            return -1;
        }
    }

    this.removelfm = function(tracks, u, w) {
        debug.log("PLAYLIST","Playlist removing tracks from",u,tracks);
        lfmprovider.getTracks(u, tracks.length, w, false, tracks);
    }

    this.getfinaltrack = function() {
        return finaltrack;
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    function findCurrentTrack() {
        debug.log("PLAYLIST","Looking For Current Track");
        for(var i in tracklist) {
            currentTrack = tracklist[i].findcurrent(player.status.songid);
            if (currentTrack) {
                currentalbum = i;
                currentsong = currentTrack.playlistpos;
                debug.debug("PLAYLIST",".. found it!");
                if (prefs.scrolltocurrent && $('.track[romprid="'+player.status.songid+'"]').offset()) {
                    debug.log("PLAYLIST","Scrolling to",player.status.songid);
                    if (mobile == "no") {
                        $('#pscroller').mCustomScrollbar("scrollTo", $('.track[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2, {scrollInertia:500});
                    } else {
                        $('#pscroller').animate({
                           scrollTop: $('div[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2
                        }, 500);
                    }
                }
                break;
            }
        }
    }

    this.checkProgress = function() {
        self.clearProgressTimer();
        if (finaltrack == -1) {
            // Playlist is empty
            debug.log("PLAYLIST","Playlist is empty");
            nowplaying.newTrack(self.emptytrack);
            infobar.setProgress(0,-1,-1);
        } else {
            // Track changes are detected based on the playlist id. This prevents us from repopulating
            // the browser every time the playlist gets repopulated.
            if (player.status.songid != previoussong) {
                debug.log("PLAYLIST","Updating current song");
                $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
                $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
                if (player.status.songid === undefined) {
                    debug.warn("PLAYLIST","Nanoo Nanoo");
                    currentTrack = self.emptytrack;
                } else {
                    findCurrentTrack();
                    if (!currentTrack) {
                        // That can happen if a mopidy state change event comes in before we've
                        // updated the playlist - as often happens when we add new tracks and start
                        // playback immediately.
                        // We must return, otherwise previoussong will get updated this time and
                        // no info will update when the playlist repopulates.
                        debug.log("PLAYLIST","Could not find current track!");
                        return 0;
                    }

                }

                if (player.status.consume == 1 && consumeflag && !prefs.mopidy_detected) {
                    consumeflag = false;
                    self.repopulate();
                    return 0;
                }
                debug.log("PLAYLIST","Track has changed");
                if (!prefs.mopidy_detected) {
                    if (currentTrack && currentTrack.type == "stream" && streamflag) {
                        debug.log("PLAYLIST","Waiting for stream info......");
                        // If it's a new stream, don't update immediately, instead give it 5 seconds
                        // to let mpd extract any useful track info from the stream
                        // This avoids us displaying some random nonsense then switching to the track
                        // data 5 seconds later
                        streamflag = false;
                        infobar.setNowPlayingInfo({ title: language.gettext("label_waitingforstation")});
                        infobar.albumImage.setSource({image: currentTrack.image});
                        setTheClock(playlist.streamfunction, 5000);
                        return 0;
                    }
                }
                if ((!prefs.mopidy_detected && currentTrack && currentTrack.type != "stream") ||
                    (prefs.mopidy_detected && currentTrack)) {
                    debug.log("PLAYLIST","Creating new track",currentTrack);
                    nowplaying.newTrack(currentTrack);
                }
                for(var i in tracklist) {
                    if (tracklist[i].invalidateOldTracks(currentsong, previoussong)) { break; }
                }
                previoussong = player.status.songid;
                streamflag = true;
                consumeflag = true;
                safetytimer = 500;
            }

            if (currentTrack === null) {
                return;
            }

             progress = infobar.progress();
             duration = currentTrack.duration || 0;
             percent = (duration == 0) ? 0 : (progress/duration) * 100;
             infobar.setProgress(Math.round(percent),progress,duration);
             html = null;

             if (player.status.state == "play") {
                if (progress > 4) { infobar.updateNowPlaying() };
                if (percent >= prefs.scrobblepercent) { infobar.scrobble(); }
                if (duration > 0 && currentTrack.type != "stream") {
                    if (!prefs.mopidy_detected) {
                        // When using mopidy HTTP, we get state change events when tracks change,
                        // so there's no need to poll like this.
                        if (progress >= duration) {
                            debug.log("PLAYLIST","Starting safety timer");
                            setTheClock(playlist.checkchange, safetytimer);
                            if (safetytimer < 5000) { safetytimer += 500 }
                        } else {
                            setTheClock( playlist.checkProgress, 1000);
                        }
                    } else {
                        setTheClock( playlist.checkProgress, 1000);
                    }
                } else {
                   if (!prefs.mopidy_detected) {
                        AlanPartridge++;
                        if (AlanPartridge < 7) {
                            setTheClock( playlist.checkProgress, 1000);
                        } else {
                            AlanPartridge = 0;
                            setTheClock( playlist.streamfunction, 1000);
                        }
                    } else {
                        setTheClock( playlist.checkProgress, 1000);
                    }
                }
            }
        }
    }

    this.checkchange = function() {
        player.mpd.command("");
    }

    this.streamfunction = function() {
        player.mpd.command("", playlist.checkStream);
    }

    this.checkStream = function() {
        self.clearProgressTimer();
        updateStreamInfo();
        self.checkProgress();
    }

    function updateStreamInfo() {
        // This function is entirely unsuitable when using Mopidy's HTTP
        // interface, since player.status.Name has no meaning in that context
        if (currentTrack && currentTrack.type == "stream") {
            var temp = cloneObject(currentTrack);
            temp.title = player.status.Title || currentTrack.title;
            temp.album = currentTrack.creator + " - " + currentTrack.album;
            if (player.status.Title) {
                var tit = player.status.Title;
                var parts = tit.split(" - ");
                if (parts[0] && parts[1]) {
                    temp.creator = parts.shift();
                    temp.title = parts.join(" - ");
                }
            }
            if (player.status.Name) {
                // NOTE: 'Name' is returned by MPD - it's the station name
                // as read from the station's stream metadata
                checkForUpdateToUnknownStream(player.status.file, player.status.Name);
                temp.album = player.status.Name;
            } else if (player.status.Name === undefined) {
                // No name. Either we have a station with no Metadata
                // or a player that can't read it. Let's put SOMETHING in the album name
                // so we don't get 'Unknown Internet Stream' all over the bloody place.
                var a = currentTrack.stream;
                a = a.replace(/\(.*?\)\s*/,'');
                if (a != "") {
                    checkForUpdateToUnknownStream(player.status.file, a);
                    temp.album = a;
                }
            }
            if (currentTrack.title != temp.title ||
                currentTrack.album != temp.album ||
                currentTrack.creator != temp.creator ||
                !streamflag)
            {
                temp.musicbrainz.artistid = "";
                temp.musicbrainz.albumid = "";
                temp.musicbrainz.trackid = "";
                temp.musicbrainz.albumartistid = "";
                currentTrack = temp;
                nowplaying.newTrack(temp);
            } else {
                temp = null;
            }
        }
    }

    function checkForUpdateToUnknownStream(url, name) {
        var m = currentTrack.album;
        if (m.match(/^Unknown Internet Stream/)) {
            debug.log("PLAYLIST","Updating Stream",name);
            $.post("updateplaylist.php", { url: url, name: name })
            .done( function() {
                playlist.repopulate();
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").empty();
                    $("#yourradiolist").load("yourradio.php");
                }
            });
        }
    }

    function setTheClock(callback, timeout) {
        self.clearProgressTimer();
        progresstimer = setTimeout(callback, timeout);
    }

    this.clearProgressTimer = function() {
        clearTimeout(progresstimer);
    }

    this.stop = function() {
        self.checkSongIdAfterStop(previoussong);
    }

    this.stopafter = function() {
        if (currentTrack.type == "stream") {
            infobar.notify(infobar.ERROR, language.gettext("label_notforradio"));
        } else if (player.status.state == "play") {
            player.controller.stopafter();
            var timeleft = currentTrack.duration - infobar.progress();
            if (timeleft < 0) { timeleft = 300 };
            var repeats = Math.round(timeleft / 4);
            $("#stopafterbutton").effect('pulsate', {times: repeats}, 4000);
        }
    }

    this.previous = function() {
        if (currentalbum >= 0) {
            tracklist[currentalbum].previoustrackcommand(currentsong);
        }
    }

    this.next = function() {
        if (currentalbum >= 0) {
            tracklist[currentalbum].nexttrackcommand(currentsong);
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
        scrollto = (finaltrack)+1;
        var n = decodeURIComponent(element.attr("name"));

        var options = [{    type: "uri",
                            name: n,
                      }];

        $.each(element.children('input'), function() {
            switch ($(this).val()) {
                case "needsfiltering":
                    options[0].findexact = {artist: element.children('.saname').text()};
                    options[0].filterdomain = ['spotify:'];
                    debug.log("PLAYLIST", "Adding Spotify artist",element.children('.saname').text());
                    break;
            }
        });

        player.controller.addTracks(options,
                                    playlist.playFromEnd(),
                                    null);
    }

    this.addalbum = function(element) {
        self.waiting();
        scrollto = (finaltrack)+1;
        player.controller.addTracks([{  type: "item",
                                        name: element.attr("name")}],
                                    playlist.playFromEnd(), null);
    }

    this.addFavourite = function(index) {
        debug.log("PLAYLIST","Adding Fave Station, index",index, tracklist[index].album);
        $.post("addfave.php", { station: tracklist[index].album })
            .done( function() {
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").load("yourradio.php");
                }
            });
    }

    this.getCurrent = function(thing) {
        return currentTrack[thing];
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
                if (tracks[trackpointer].compilation == "yes" ||
                    (tracks[trackpointer].albumartist != "" && tracks[trackpointer].albumartist != tracks[trackpointer].creator)) {
                    showartist = true;
                }
                html = html + '<div name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="track clickable clickplaylist sortable containerbox playlistitem menuitem">';
                var l = tracks[trackpointer].location;
                if (l.substring(0,11) == "soundcloud:") {
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="'+tracks[trackpointer].image+'" /></div>';
                } else {
                    html = html + '<div class="tracknumbr fixed"';
                    if (tracks.length > 99 ||
                        tracks[trackpointer].tracknumber > 99) {
                        html = html + ' style="width:3em"';
                    }
                    html = html + '>'+format_tracknum(tracks[trackpointer].tracknumber)+'</div>';
                }
                if (l.substring(0, 7) == "spotify") {
                    html = html + '<div class="playlisticon fixed"><img height="12px" src="newimages/spotify-logo.png" /></div>';
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
                html = html + '<div class="playlisticon fixed clickable clickicon clickremovetrack" romprid="'+tracks[trackpointer].backendid+'"><img src="newimages/edit-delete.png" /></div>';
                html = html + '</div>';
            }
            // Close the rollup div we added in the header
            html = html + '</div>'
            return html;
        }

        this.header = function() {
            var html = "";
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox menuitem playlisttitle">';
            var l = tracks[0].location;
            if (l.substring(0,11) == "soundcloud:") {
                html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="newimages/soundcloud-logo.png"/></div>';
            } else {
                if (tracks[0].image && tracks[0].image != "") {
                    // An image was supplied - either a local one or supplied by the backend
                    html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed" name="'+tracks[0].key+'" src="'+tracks[0].image+'"/></div>';
                } else {
                    // This is so we can get albumart when we're playing spotify
                    // Once mopidy starts supplying us with images, we can dump this code
                    var i = findImageInWindow(tracks[0].key);
                    if (i !== false) {
                        debug.log("PLAYLIST","Playlist using image already in window");
                        this.updateImages(i);
                        html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed" name="'+tracks[0].key+'" src="'+i+'"/></div>';
                    } else {
                        html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index
                                    + '"><img class="smallcover updateable notexist fixed clickable clickicon clickrollup" romprname="'+self.index
                                    +'" name="'+tracks[0].key+'" src=""/></div>';
                        coverscraper.setCallback(this.updateImages, tracks[0].key);
                        coverscraper.GetNewAlbumArt(tracks[0].key);
                    }
                }
            }
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+self.artist+'</div>';
            html = html + '<div class="line">'+self.album+'</div>';
            html = html + '</div>';
            html = html + '<div class="playlisticon fixed clickable clickicon clickremovealbum" name="'+self.index+'"><img src="newimages/edit-delete.png" /></div>';
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

        this.updateImages = function(src) {
            for (var trackpointer in tracks) {
                tracks[trackpointer].image = src;
                tracks[trackpointer].origimage = src.replace(/albumart\/original/, 'albumart/asdownloaded');
            }
            infobar.albumImage.setSecondarySource( {key: tracks[0].key, image: src, origimage: src.replace(/albumart\/original/, 'albumart/asdownloaded')});
        }

        this.getFirst = function() {
            return parseInt(tracks[0].playlistpos);
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.isLast = function(id) {
            if (id == tracks[tracks.length - 1].backendid) {
                return true;
            } else {
                return false;
            }
        }

        this.invalidateOldTracks = function(which, why) {
            return false;
        }

        this.findcurrent = function(which) {
            var result = null;
            for(var i in tracks) {
                if (tracks[i].backendid == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.track[romprid="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
                    result = tracks[i];
                    break;
                }
            }
            return result;
        }

        this.deleteSelf = function() {
            var todelete = [];
            $('.item[name="'+self.index+'"]').next().remove();
            $('.item[name="'+self.index+'"]').remove();
            for(var i in tracks) {
                todelete.push(tracks[i].backendid);
            }
            player.controller.removeId(todelete)
        }

        this.invalidateOnStop = function() {
            return false;
        }

        this.previoustrackcommand = function(which) {
            player.controller.previous();
        }

        this.nexttrackcommand = function(which) {
            player.controller.next();
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
                html = html + '<div class="playlisticon fixed"><img height="12px" src="newimages/broadcast.png" /></div>';
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
            var image = (tracks[0].image) ? tracks[0].image : "newimages/broadcast.png";
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" name="'+hex_md5(tracks[0].album)+'"" src="'+image+'"/></div>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+tracks[0].creator+'</div>';
            html = html + '<div class="line">'+tracks[0].album+'</div>';
            html = html + '</div>';
            html = html + '<div class="containerbox vertical fixed">';
            html = html + '<div class="playlisticon clickable clickicon clickaddfave" name="'+self.index+'"><img height="12px" width="12px" src="newimages/broadcast-12.png"></div>';
            html = html + '<div class="playlisticon clickable clickicon clickremovealbum" name="'+self.index+'"><img src="newimages/edit-delete.png"></div>';
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
            return parseInt(tracks[0].playlistpos);
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.isLast = function(id) {
            if (id == tracks[tracks.length - 1].backendid) {
                return true;
            } else {
                return false;
            }
        }

        this.invalidateOldTracks = function(which, why) {
            return false;
        }

        this.findcurrent = function(which) {
            var result = null;
            for(var i in tracks) {
                if (tracks[i].backendid == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.booger[romprid="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
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
            player.controller.removeId(todelete)
        }

        this.invalidateOnStop = function() {
            return false;
        }

        this.previoustrackcommand = function(which) {
            player.controller.playByPosition(parseInt(tracks[0].playlistpos)-1);
        }

        this.nexttrackcommand = function(which) {
            player.controller.playByPosition(parseInt(tracks[(tracks.length)-1].playlistpos)+1);
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
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="newimages/album-unknown-small.png"/></div>';
                }
                html = html + '<div class="containerbox vertical expand">';
                html = html + '<div class="line">'+tracks[trackpointer].title+'</div>';
                html = html + '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';
                html = html + '<div class="line playlistrow2">'+tracks[trackpointer].album+'</div>';
                html = html + '</div>';
                html = html + '<div class="tiny fixed">'+formatTimeString(tracks[trackpointer].duration)+'</div>';
                html = html + '<div class="playlisticon fixed clickable clickicon clickremovelfmtrack" romprid="'+tracks[trackpointer].backendid+'"><img src="newimages/edit-delete.png" /></div>';
                html = html + '</div>';
                opacity -= 0.15;
            }
            html = html + '</div>'
            return html;
        }

        this.header = function() {
            var html = "";

            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox menuitem playlisttitle">';
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="newimages/lastfm.png"/></div>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">Last.FM</div>';
            html = html + '<div class="line">'+self.station+'</div>';
            html = html + '</div>';
            html = html + '<div class="playlisticon fixed clickable clickicon clickremovealbum" name="'+self.index+'"><img src="newimages/edit-delete.png" /></div>';
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
            return parseInt(tracks[0].playlistpos);
        }

        this.getSize = function() {
            return tracks.length;
        }

        this.isLast = function(id) {
            if (id == tracks[tracks.length - 1].backendid) {
                return true;
            } else {
                return false;
            }
        }

        this.invalidateOldTracks = function(currentsong, previoussong) {
            var todelete = [];
            var unixtimestamp = Math.round(new Date()/1000);
            var index = -1;
            var startindex = -1;
            var result = false;
            debug.log("PLAYLIST","Checking Last.FM Playlist item");
            for(var i in tracks) {
                debug.log("PLAYLIST","Track",i,"expires in", parseInt(tracks[i].expires) - unixtimestamp);
                if (unixtimestamp > parseInt(tracks[i].expires) &&
                    !(player.status.state == "play" && currentsong == tracks[i].playlistpos)) {
                    // Remove track if it has expired, but not if it's currently playing
                    debug.log("PLAYLIST","Track",i,"has expired",currentsong,tracks[i].playlistpos);
                    $('.booger[name="'+tracks[i].playlistpos+'"]').slideUp('fast');
                    index = i;
                    if (startindex == -1) { startindex = i }
                } else if (previoussong == tracks[i].backendid && currentsong != tracks[i].playlistpos) {
                    debug.log("PLAYLIST","Removing track which was playing but has been skipped")
                    $('.booger[name="'+tracks[i].playlistpos+'"]').slideUp('fast');
                    index = i;
                    startindex = 0;
                } else if (tracks[i].playlistpos == currentsong && i>0) {
                    debug.log("PLAYLIST","Currently playing track number",i,"in a LastFM Station. Removing earlier tracks")
                    index = i-1;
                    startindex = 0;
                }
            }

            if (index >= 0) {
                playlist.cleanupCleanupTimer();
                for(var j = startindex; j <= index; j++) {
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
                if (tracks[i].backendid == which) {
                    $('.item[name="'+self.index+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                    $('.booger[romprid="'+which+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
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
            player.controller.removeId(todelete);
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
            player.controller.previous();
        }

        this.nexttrackcommand = function(which) {
            player.controller.next();
        }

    }

}
