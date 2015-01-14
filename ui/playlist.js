function Playlist() {

    var self = this;
    var tracklist = [];
    var currentalbum = -1;
    this.currentTrack = null;
    var finaltrack = -1;
    this.rolledup = [];
    var updatecounter = 0;
    var do_delayed_update = false;
    var scrollto = -1;
    var updateErrorFlag = 0;

    // Minimal set of information - just what infobar requires to make sure
    // it blanks everything out
    this.emptytrack = {
        album: "",
        creator: "",
        location: "",
        title: "",
        type: "",
    };

    /*
    We keep count of how many ongoing requests we have sent to Apache
    If this ever exceeds 1, all responses we receive will be ignored until
    the count reaches zero. We then do one more afterwards, because we can't be
    sure the responses have come back in the right order.
    */

    this.repopulate = function() {
        debug.shout("PLAYLIST","Repopulating....");
        updatecounter++;
        player.controller.getPlaylist();
        coverscraper.clearCallbacks();
    }

    this.connectionbuggered = function() {
        updatecounter = 0;
    }

    this.updateFailure = function() {
        debug.error("PLAYLIST","Got notified that an update FAILED");
        infobar.notify(infobar.ERROR, language.gettext("label_playlisterror"));
        updatecounter--;
        updateErrorFlag++;
        // After 5 consecutive update failures, we give up because something is obviously wrong.
        if (updatecounter == 0 && updateErrorFlag < 6) {
            debug.log("PLAYLIST","Update failed and no more are expected. Doing another");
            self.repopulate();
        }
        if (updateErrorFlag > 5) {
            alert(language.gettext("label_playlisterror"));
        }
    }

    this.newXSPF = function(list) {
        var item;
        var count = 0;
        var current_album = "";
        var current_artist = "";
        var current_type = "";
        updateErrorFlag = 0;

        // This is a mechanism to prevent multiple repeated updates of the playlist in the case
        // where, for example, the user is clicking rapidly on the delete button for lots of tracks
        // and the playlist is slow to update from mpd
        updatecounter--;
        if (!player.controller.isConnected() || updatecounter < 0) {
            debug.log("PLAYLIST","Update counter is negative. Probably had a player screwup");
            return 0;
        }
        if (updatecounter > 0) {
            debug.log("PLAYLIST","Received playlist update but ",updatecounter," more are coming - ignoring");
            do_delayed_update = true;
            return 0;
        }

        if (do_delayed_update) {
            // Once all the repeated updates have been received from mpd, ignore them all
            // (because we can't be sure which order they will have come back in),
            // do one more of our own, and use that one
            do_delayed_update = false;
            debug.shout("PLAYLIST","Doing delayed playlist update");
            self.repopulate();
            return 0;
        }
        // ***********

        debug.log("PLAYLIST","Got Playlist from Apache",list);
        finaltrack = -1;
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
                    default:
                        item = new Album(sortartist, track.album, count);
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
        if (updatecounter > 0) {
            debug.log("PLAYLIST","Aborting update because counter is non-zero");
            return;
        }

        $("#sortable").empty();

        if (finaltrack > -1) {
            $("#pltracks").html((finaltrack+1).toString() +' '+language.gettext("label_tracks"));
            $("#pltime").html(language.gettext("label_duration")+' : '+formatTimeString(totaltime));
        } else {
            $("#pltracks").html("");
            $("#pltime").html("");
        }

        playlist.radioManager.setHeader();

        for (var i in tracklist) {
            $("#sortable").append(tracklist[i].getHTML());
        }
        makeFictionalCharacter();
        layoutProcessor.setPlaylistHeight();

        self.findCurrentTrack();
        if (finaltrack == -1) {
            // Playlist is empty
            debug.log("PLAYLIST","Playlist is empty");
            nowplaying.newTrack(self.emptytrack);
            infobar.setProgress(0,-1,-1);
        }
        player.controller.postLoadActions();

        // scrollto is now used only to prevent findCurrentTrack from scrolling to the current track.
        // This stops it from being really annoying where it scrolls to the current track
        // when you're in the middle of deleting some stuff lower down.
        // Scrolling when we have the custom scrollbars isn't necessary when we repopulate as the 'scrollbars'
        // basically just stay where they were.
        // Note that we currently set scrollto to 1 when we drag stuff onto or within the playlist. This prevents
        // the auto-scroll from moving the playlist around by itself, which is very confusing for the user.
        // We don't set it when stuff is added by double-click. This means auto-scroll will keep the playlist
        // on or around the current track when we do this. This seems to make the most sense.
        scrollto = -1;

    }

    function makeFictionalCharacter() {
        // Invisible empty div tacked on the end is where we add our 'Incoming' animation
        $("#sortable").append('<div id="waiter" class="containerbox"></div>');
    }

    this.load = function(name) {
        makeFictionalCharacter();
        playlist.waiting();
        layoutProcessor.playlistLoading();
        debug.log("PLAYLIST","Loading Playlist",name);
        playlist.radioManager.stop();
        player.controller.loadPlaylist(name);
    }

    this.clear = function() {
        playlist.radioManager.stop();
        player.controller.clearPlaylist();
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
            debug.log("PLAYLIST", "Drag Stopped",i.next());
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
            debug.log("PLAYLIST","Something was dropped from the albums list");
            var tracks = new Array();
            $.each($('.selected').filter(removeOpenItems), function (index, element) {
                var uri = $(element).attr("name");
                if (uri) {
                    if ($(element).hasClass('clickalbum')) {
                        tracks.push({  type: "item",
                                        name: uri});
                    } else if ($(element).hasClass('clickcue')) {
                        tracks.push({  type: "cue",
                                        name: decodeURIComponent(uri)});
                    } else {
                        var options = { type: "uri",
                                        name: decodeURIComponent(uri)};
                        $(element).find('input').each( function() {
                            switch ($(this).val()) {
                                case "needsfiltering":
                                    options.findexact = {artist: [$(element).children('.saname').text()]};
                                    options.filterdomain = ['spotify:'];
                                    debug.log("PLAYLIST", "Adding Spotify artist",$(element).children('.saname').text());
                                    break;
                            }
                        });
                        tracks.push(options);
                    }
                }
            });
            scrollto = 1;
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
            scrollto = 1;
            player.controller.move(firstitem, numitems, moveto);
        }
    }

    function removeOpenItems(index) {
        if ($(this).hasClass('clicktrack') || $(this).hasClass('clickcue')) {
            return true;
        }
        // Filter out artist and album items whose dropdowns have been populated -
        // In these cases the individual tracks will exist and will be selected
        // (and might only have partial selections even if the header is selected)
        if ($("#"+$(this).attr('name')).length == 0) {
            return true;
        } else if ($("#"+$(this).attr('name')).hasClass('notfilled') || $(this).hasClass('onefile')) {
            return true;
        } else {
            return false;
        }
    }

    this.delete = function(id) {
        scrollto = 1;
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
        if (tracks.length > 0) {
            player.controller.addTracks(tracks, playlist.playFromEnd(), null);
        }
    }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.playFromEnd = function() {
        if (player.status.state == "stop") {
            debug.debug("PLAYLIST","Playfromend",finaltrack+1);
            return finaltrack+1;
        } else {
            debug.debug("PLAYLIST","Disabling auto-play");
            return -1;
        }
    }

    this.getfinaltrack = function() {
        return finaltrack;
    }

    this.findCurrentTrack = function() {
        debug.debug("PLAYLIST","Looking For Current Track",player.status.songid);
        self.currentTrack = null;
        $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
        $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
        for(var i in tracklist) {
            self.currentTrack = tracklist[i].findcurrent(player.status.songid);
            if (self.currentTrack) {
                currentalbum = i;
                scrollToCurrentTrack();
                // finaltrack-1 prevents radios that add tracks slowly from trying to do multiple simultaneous
                // populates.
                if (self.currentTrack.playlistpos == finaltrack-1) {
                    playlist.radioManager.repopulate();
                }
                break;
            }
        }
        return self.currentTrack;
    }

    this.getNextTrack = function() {
        var t = tracklist[currentalbum].getNextTrack(player.status.songid);
    }

    function scrollToCurrentTrack() {
        if (prefs.scrolltocurrent && $('.track[romprid="'+player.status.songid+'"]').offset() && scrollto === -1) {
            layoutProcessor.scrollPlaylistToCurrentTrack();
        }
    }

    this.stopped = function() {
        infobar.setProgress(0,-1,-1);
    }

    this.trackchanged = function() {
        if (self.currentTrack && self.currentTrack.type == "podcast") {
            debug.log("PLAYLIST", "Seeing if we need to mark a podcast as listened");
            podcasts.checkMarkPodcastAsListened(self.currentTrack.location);
        }
    }

    this.stopafter = function() {
        if (self.currentTrack.type == "stream") {
            infobar.notify(infobar.ERROR, language.gettext("label_notforradio"));
        } else if (player.status.state == "play") {
            if (player.status.single == 0) {
                player.controller.stopafter();
                var timeleft = self.currentTrack.duration - infobar.progress();
                if (timeleft < 4) { timeleft = 300 };
                var repeats = Math.round(timeleft / 4);
                $("#stopafterbutton").makeFlasher({flashtime:4, repeats: repeats});
            } else {
                player.controller.cancelSingle();
                $("#stopafterbutton").stopFlasher();
            }

        }
    }

    this.previous = function() {
        if (currentalbum >= 0) {
            tracklist[currentalbum].previoustrackcommand();
        }
    }

    this.next = function() {
        if (currentalbum >= 0) {
            tracklist[currentalbum].nexttrackcommand();
        }
    }

    this.deleteGroup = function(index) {
        scrollto = 1;
        tracklist[index].deleteSelf();
    }

    this.addAlbumToCollection = function(index) {
        infobar.notify(infobar.NOTIFY, "Adding Album To Collection");
        tracklist[index].addToCollection();
    }

    this.addtrack = function(element) {
        self.waiting();
        var n = decodeURIComponent(element.attr("name"));
        var options = [{    type: "uri",
                            name: n,
                      }];

        $.each(element.children('input'), function() {
            switch ($(this).val()) {
                case "needsfiltering":
                    options[0].findexact = {artist: [element.children('.saname').text()]};
                    options[0].filterdomain = ['spotify:'];
                    debug.log("PLAYLIST", "Adding Spotify artist",element.children('.saname').text());
                    break;
            }
        });

        player.controller.addTracks(options,
                                    playlist.playFromEnd(),
                                    null);
    }

    this.addcue = function(element) {
        self.waiting();
        var n = decodeURIComponent(element.attr("name"));

        var options = [{    type: "cue",
                            name: n,
                      }];

        player.controller.addTracks(options,
                                    playlist.playFromEnd(),
                                    null);
    }

    this.addalbum = function(element) {
        self.waiting();
        player.controller.addTracks([{  type: "item",
                                        name: element.attr("name")}],
                                        playlist.playFromEnd(), null);
    }

    this.addFavourite = function(index) {
        debug.log("PLAYLIST","Adding Fave Station, index",index, tracklist[index].album);
        var data = tracklist[index].getFnackle();
        if (self.currentTrack) {
            data.uri = self.currentTrack.location;
        }
        $.post("utils/addfave.php", data)
            .done( function() {
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
                }
                infobar.notify(infobar.NOTIFY,"Added To Your Radio Stations");
            });
    }

    this.getCurrent = function(thing) {
        return self.currentTrack[thing];
    }

    this.radioManager = function() {

        var mode = null;
        var radios = new Object();
        var oldconsume = null;
        var oldbuttonstate = null;
        var inited = false;

        return {

            register: function(name, fn) {
                debug.log("RADIO MANAGER","Registering Plugin",name);
                radios[name] = fn;
            },

            init: function() {
                if (inited == false) {
                    if (prefs.apache_backend == "sql") {
                        for(var i in radios) {
                            debug.log("RADIO MANAGER","Activating Plugin",i);
                            radios[i].setup();
                            if (prefs.radiomode == i) {
                                debug.mark("RADIOMANAGER","Found saved radio playlist state",prefs.radiomode, prefs.radioparam);
                                radios[i].populate(prefs.radioparam, true);
                                mode = prefs.radiomode;
                            }
                        }
                    }
                    inited = true;
                }
            },

            load: function(which, param) {
                debug.log("PLAYLIST","Loading Smart",which);
                playlist.waiting();
                if ((mode && mode != which) || (mode && param && param != prefs.radioparam)) {
                    radios[mode].stop();
                }
                mode = which;
                radios[which].populate(param, false);
                prefs.save({radiomode: which, radioparam: param});
                layoutProcessor.playlistLoading();
                if (player.status.consume == 0 && prefs.consumeradio) {
                    oldbuttonstate = $("#playlistbuttons").is(":visible");
                    oldconsume = player.status.consume;
                    player.controller.toggleConsume();
                    if (!$("#playlistbuttons").is(":visible")) {
                        togglePlaylistButtons();
                    }
                }
            },

            repopulate: function() {
                if (mode) {
                    radios[mode].populate();
                }
            },

            stop: function() {
                if (mode) {
                    radios[mode].stop();
                    playlist.repopulate();
                    mode = null;
                    prefs.save({radiomode: '', radioparam: ''});
                    if (prefs.consumeradio) {
                        if (oldconsume != player.status.consume) {
                            player.controller.toggleConsume();
                        }
                        if (oldbuttonstate == false && $("#playlistbuttons").is(":visible")) {
                            togglePlaylistButtons();
                        }
                    }
                }
            },

            setHeader: function() {
                var html = '';
                if (mode) {
                    html = radios[mode].modeHtml() +
                        '<i class="icon-cancel-circled playlisticon clickicon" style="margin-left:8px" onclick="playlist.radioManager.stop()"></i>';
                }
                $("#plmode").html(html);
            }
        }
    }();

    function Album(artist, album, index, rolledup) {

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
                if (tracks[trackpointer].trackimage) {
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="'+tracks[trackpointer].trackimage+'" /></div>';
                }
                var l = tracks[trackpointer].location;
                if (tracks[trackpointer].tracknumber) {
                    html = html + '<div class="tracknumbr fixed"';
                    if (tracks.length > 99 ||
                        tracks[trackpointer].tracknumber > 99) {
                        html = html + ' style="width:3em"';
                    }
                    html = html + '>'+format_tracknum(tracks[trackpointer].tracknumber)+'</div>';
                }
                if (l.substring(0, 7) == "spotify") {
                    html = html + '<i class="icon-spotify-circled playlisticon fixed"></i>';
                } else if (l.substring(0, 6) == "gmusic") {
                    html = html + '<i class="icon-gmusic-circled playlisticon fixed"></i>';
                }
                if (showartist) {
                    html = html + '<div class="containerbox vertical expand">';
                    html = html + '<div class="line">'+tracks[trackpointer].title+'</div>';
                    html = html + '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';
                    html = html + '</div>';
                } else {
                    html = html + '<div class="expand line">'+tracks[trackpointer].title+'</div>';
                }
                html = html + '<div class="tracktime tiny fixed">'+formatTimeString(tracks[trackpointer].duration)+'</div>';
                html = html + '<i class="icon-cancel-circled playlisticonr fixed clickable clickicon clickremovetrack" romprid="'+tracks[trackpointer].backendid+'"></i>';
                html = html + '</div>';
            }
            // Close the rollup div we added in the header
            html = html + '</div>'
            return html;
        }

        this.header = function() {
            var html = "";
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox playlistalbum playlisttitle">';
            if (tracks[0].image && tracks[0].image != "") {
                // An image was supplied - either a local one or supplied by the backend
                html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed" name="'+tracks[0].key+'" src="'+tracks[0].image+'"/></div>';
            } else {
                if (prefs.downloadart) {
                    // This is so we can get albumart when we're playing spotify
                    // Once mopidy starts supplying us with images, we can dump this code
                    // Note - this is required for when we load a spotify playlist because the albums won't be
                    // present in the window anywhere else
                    html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index
                                + '"><img class="smallcover updateable notexist fixed clickable clickicon clickrollup" romprname="'+self.index
                                +'" name="'+tracks[0].key+'" /></div>';
                    coverscraper.setCallback(this.updateImages, tracks[0].key);
                    coverscraper.GetNewAlbumArt(tracks[0].key);
                } else {
                    html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed notexist" name="'+tracks[0].key+'"/></div>';
                }
            }
            html = html + '<div class="containerbox vertical expand selfcentered">';
            html = html + '<div class="bumpad">'+self.artist+'</div>';
            html = html + '<div class="bumpad">'+self.album+'</div>';
            html = html + '</div>';

            html = html + '<div class="containerbox vertical fixed">';
            // These next two currently need wrapping in divs for the sake of Safari
            html = html + '<div class="expand clickable clickicon clickremovealbum" name="'+self.index+'"><i class="icon-cancel-circled playlisticonr"></i></div>';
            if (tracks[0].spotify && tracks[0].spotify.album && tracks[0].spotify.album.substring(0,7) == "spotify" && prefs.apache_backend == "sql") {
                html = html + '<div class="fixed clickable clickicon clickaddwholealbum" name="'+self.index+'"><i class="icon-music playlisticonr"></i></div>';
            }
            html = html + '</div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.getFnackle = function() {
            return { station: tracks[0].album,
                     image: tracks[0].image,
                     location: tracks[0].location
            };
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

        this.updateImages = function(data) {
            for (var trackpointer in tracks) {
                tracks[trackpointer].image = data.origimage;
            }
            infobar.albumImage.setSecondarySource( {key: tracks[0].key, image: data.origimage });
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

        this.previoustrackcommand = function() {
            player.controller.previous();
        }

        this.nexttrackcommand = function() {
            player.controller.next();
        }

        this.addToCollection = function() {
            if (tracks[0].spotify && tracks[0].spotify.album && tracks[0].spotify.album.substring(0,14) == "spotify:album:") {
                spotify.album.getInfo(tracks[0].spotify.album.substring(14,tracks[0].spotify.album.length), addAlbumTracksToCollection, failedToAddAlbum, false)
            } else {
                debug.error("PLAYLIST","Trying to add non-spotify album to the collection!");
            }
        }

        function format_tracknum(tracknum) {
            var r = /^(\d+)/;
            var result = r.exec(tracknum) || "";
            return result[1] || "";
        }

    }

    function Stream(index, album, rolledup) {
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
                html = html + '<i class="icon-radio-tower playlisticon fixed"></i>';
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
            html = html + '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox playlistalbum playlisttitle">';
            var image = (tracks[0].image) ? tracks[0].image : "newimages/broadcast.svg";
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" name="'+tracks[0].key+'"" src="'+image+'"/></div>';
            html = html + '<div class="containerbox vertical expand selfcentered">';
            html = html + '<div class="bumpad">'+tracks[0].creator+'</div>';
            html = html + '<div class="bumpad">'+tracks[0].album+'</div>';
            html = html + '</div>';
            html = html + '<div class="containerbox vertical fixed">';
            html = html + '<div class="clickable clickicon clickremovealbum expand" name="'+self.index+'"><i class="icon-cancel-circled playlisticonr"></i></div>';
            html = html + '<div class="clickable clickicon clickaddfave fixed" name="'+self.index+'"><i class="icon-radio-tower playlisticonr"></i></div>';
            html = html + '</div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.getFnackle = function() {
            return { station: tracks[0].album,
                     image: tracks[0].image,
                     location: tracks[0].location
            };
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

        this.previoustrackcommand = function() {
            player.controller.playByPosition(parseInt(tracks[0].playlistpos)-1);
        }

        this.nexttrackcommand = function() {
            player.controller.playByPosition(parseInt(tracks[(tracks.length)-1].playlistpos)+1);
        }
    }

}
