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
        type: "",
        date: ""
    };

    /*
    We keep count of how many ongoing requests we have sent to Apache
    If this ever exceeds 1, all responses we receive will be ignored until
    the count reaches zero. We then do one more afterwards, because we can't be
    sure the responses have come back in the right order.
    */

    this.repopulate = function() {
        debug.log("PLAYLIST","Repopulating....");
        updatecounter++;
        player.controller.getPlaylist();
        coverscraper.clearCallbacks();
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
            debug.log("PLAYLIST","Doing delayed playlist update");
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
        self.setHeight();

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

    this.setHeight = function() {
        var newheight = $("#bottompage").height() - $("#horse").height();
        if ($("#playlistbuttons").is(":visible")) {
            newheight -= $("#playlistbuttons").height();
            if (mobile != "no") {
                newheight -= 2;
            }
        }
        $("#pscroller").css("height", newheight.toString()+"px");
        if (mobile == "no") {
            $('#pscroller').mCustomScrollbar("update");
        }
    }

    this.load = function(name) {
        $("#sortable").empty();
        makeFictionalCharacter();
        playlist.waiting();
        if (mobile == "no") {
            if ($("#lpscr").is(':visible')) {
                $("#lpscr").slideToggle('fast');
            }
        } else {
            sourcecontrol('playlistm');
        }
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
                                    options.findexact = {artist: $(element).children('.saname').text()};
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
        if ($("#"+$(this).attr('name')).hasClass('notfilled') || $(this).hasClass('onefile')) {
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
            debug.log("PLAYLIST","Playfromend",finaltrack+1);
            return finaltrack+1;
        } else {
            debug.log("PLAYLIST","Disabling auto-play");
            return -1;
        }
    }

    this.getfinaltrack = function() {
        return finaltrack;
    }

    this.saveTrackPlaylist = function(xml) {
        $.post("newplaylist.php", { type: "track", xml: xml});
    }

    this.findCurrentTrack = function() {
        debug.log("PLAYLIST","Looking For Current Track",player.status.songid);
        self.currentTrack = null;
        $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
        $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
        for(var i in tracklist) {
            self.currentTrack = tracklist[i].findcurrent(player.status.songid);
            if (self.currentTrack) {
                currentalbum = i;
                scrollToCurrentTrack();
                if (self.currentTrack.playlistpos == finaltrack) {
                    playlist.radioManager.repopulate();
                }
                break;
            }
        }
        return self.currentTrack;
    }

    function scrollToCurrentTrack() {
        if (prefs.scrolltocurrent &&
            $('.track[romprid="'+player.status.songid+'"]').offset() &&
                scrollto === -1) {
            debug.log("PLAYLIST","Scrolling to",player.status.songid);
            if (mobile == "no") {
                $('#pscroller').mCustomScrollbar(
                    "scrollTo",
                    $('div.track[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2,
                    { scrollInertia: 0 }
                );
            } else {
                $('#pscroller').animate({
                   scrollTop: $('div.track[romprid="'+player.status.songid+'"]').offset().top - $('#sortable').offset().top - $('#pscroller').height()/2
                }, 500);
            }
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
                $("#stopafterbutton").effect('pulsate', {times: repeats}, 4000);
            } else {
                player.controller.cancelSingle();
                $("#stopafterbutton").stop(true, true);
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

    this.addtrack = function(element) {
        self.waiting();
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
        var data = { station: tracklist[index].getFnackle() };
        if (self.currentTrack) {
            data.uri = self.currentTrack.location;
        }
        $.post("addfave.php", data)
            .done( function() {
                if (!prefs.hide_radiolist) {
                    $("#yourradiolist").load("yourradio.php");
                }
            });
    }

    this.getCurrent = function(thing) {
        return self.currentTrack[thing];
    }

    this.radioManager = function() {

        var mode = null;
        var radios = new Object();

        return {

            register: function(name, fn) {
                radios[name] = fn;
            },

            init: function() {
                if (prefs.apache_backend == "sql") {
                    for(var i in radios) {
                        radios[i].setup();
                        if (prefs.radiomode == i) {
                            if (playlist.getfinaltrack() > -1) {
                                debug.mark("RADIOMANAGER","Found saved radio playlist state",prefs.radiomode, prefs.radioparam);
                                radios[i].populate(prefs.radioparam);
                                mode = prefs.radiomode;
                            } else {
                                prefs.save({radiomode: ''});
                            }
                        }
                    }
                }
            },

            load: function(which, param) {
                debug.log("PLAYLIST","Loading Smart",which);
                playlist.waiting();
                if (mode && mode != which) {
                    radios[mode].stop();
                }
                mode = which;
                radios[which].populate(param);
                prefs.save({radiomode: which, radioparam: param});
                if (mobile == "phone") {
                    sourcecontrol('playlistm');
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
                }
                mode = null;
                prefs.save({radiomode: '', radioparam: ''});
            },

            setHeader: function() {
                var html = '';
                if (mode) {
                    html = radios[mode].modeHtml() +
                        '<img class="clickicon" height="14px" style="margin-left:8px;vertical-align:middle" src="'+ipath+
                        'edit-delete.png" onclick="playlist.radioManager.stop()" />';
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
                var l = tracks[trackpointer].location;
                if (l.substring(0,11) == "soundcloud:" ||
                    l.substring(0,8) == "youtube:" ||
                    l.substring(0,3) == "yt:") {
                    html = html + '<div class="smallcover fixed"><img class="smallcover" src="'+tracks[trackpointer].image+'" /></div>';
                } else if (tracks[trackpointer].type == "podcast") {
                    html = html + '<div class="tracknumbr fixed">';
                    html = html + '<img src="'+ipath+'Apple_Podcast_logo.png" height="16px" />';
                    html = html + '</div>';
                } else{
                    html = html + '<div class="tracknumbr fixed"';
                    if (tracks.length > 99 ||
                        tracks[trackpointer].tracknumber > 99) {
                        html = html + ' style="width:3em"';
                    }
                    html = html + '>'+format_tracknum(tracks[trackpointer].tracknumber)+'</div>';
                }
                if (l.substring(0, 7) == "spotify") {
                    html = html + '<div class="playlisticon fixed"><img height="12px" src="'+ipath+'spotify-logo.png" /></div>';
                } else if (l.substring(0, 6) == "gmusic") {
                    html = html + '<div class="playlisticon fixed"><img height="12px" src="newimages/play-logo.png" /></div>';
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
                html = html + '<div class="playlisticonr fixed clickable clickicon clickremovetrack" romprid="'+tracks[trackpointer].backendid+'"><img src="'+ipath+'edit-delete.png" /></div>';
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
                html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="'+ipath+'soundcloud-logo.png"/></div>';
            } else if (l.substring(0,8) == "youtube:" || l.substring(0,3) == "yt:") {
                html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" src="newimages/Youtube-logo.png"/></div>';
            } else {
                if (tracks[0].image && tracks[0].image != "") {
                    // An image was supplied - either a local one or supplied by the backend
                    html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed" name="'+tracks[0].key+'" src="'+tracks[0].image+'"/></div>';
                } else {
                    // This is so we can get albumart when we're playing spotify
                    // Once mopidy starts supplying us with images, we can dump this code
                    // Note - this is reuired for when we load a spotify playlist because the albums won't be
                    // present in the window anywhere else
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
            html = html + '<div class="playlisticonr fixed clickable clickicon clickremovealbum" name="'+self.index+'"><img src="'+ipath+'edit-delete.png" /></div>';
            html = html + '</div>';
            html = html + '<div class="trackgroup';
            if (rolledup) {
                html = html + ' invisible';
            }
            html = html + '" name="'+self.index+'">';
            return html;
        }

        this.getFnackle = function() {
            return tracks[0].album;
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
                tracks[trackpointer].origimage = src.replace(/_original/, '_asdownloaded');
            }
            infobar.albumImage.setSecondarySource( {key: tracks[0].key, image: src, origimage: src.replace(/_original/, '_asdownloaded')});
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
                html = html + '<div class="playlisticon fixed"><img height="12px" src="'+ipath+'broadcast.png" /></div>';
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
            var image = (tracks[0].image) ? tracks[0].image : ipath+"broadcast.png";
            html = html + '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover" name="'+tracks[0].key+'"" src="'+image+'"/></div>';
            html = html + '<div class="containerbox vertical expand">';
            html = html + '<div class="line">'+tracks[0].creator+'</div>';
            html = html + '<div class="line">'+tracks[0].album+'</div>';
            html = html + '</div>';
            html = html + '<div class="containerbox vertical fixed">';
            html = html + '<div class="playlisticonr clickable clickicon clickaddfave" name="'+self.index+'"><img height="12px" width="12px" src="'+ipath+'broadcast-12.png"></div>';
            html = html + '<div class="playlisticonr clickable clickicon clickremovealbum" name="'+self.index+'"><img src="'+ipath+'edit-delete.png"></div>';
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
            return tracks[0].album;
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
