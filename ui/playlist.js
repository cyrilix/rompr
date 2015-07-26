function Playlist() {

    var self = this;
    var tracklist = [];
    var currentalbum = -1;
    var finaltrack = -1;
    this.rolledup = [];
    var updatecounter = 0;
    var do_delayed_update = false;
    var updateErrorFlag = 0;
    var pscrolltimer = null;
    var pageloading = true;

    // Minimal set of information - just what infobar requires to make sure
    // it blanks everything out
    // playlistpos is for radioManager
    // backendid must not be undefined
    var emptyTrack = {
        album: "",
        creator: "",
        location: "",
        title: "",
        type: "",
        playlistpos: 0,
        backendid: -1
    };

    var currentTrack = emptyTrack;

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
            infobar.notify(infobar.ERROR, language.gettext("label_playlisterror"));
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
                        break;
                    case "stream":
                        // Streams are hidden by default - hence we use the opposite logic for the flag
                        var hidden = (self.rolledup["StReAm"+track.album]) ? false : true;
                        item = new Stream(count, track.album, hidden);
                        tracklist[count] = item;
                        count++;
                        break;
                    default:
                        item = new Album(sortartist, track.album, count);
                        tracklist[count] = item;
                        count++;
                        break;

                }
            }
            item.newtrack(track);
            if (track.backendid == player.status.songid) {
                currentalbum = count - 1;
                currentTrack.playlistpos = track.playlistpos;
            }
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

        for (var i in tracklist) {
            $("#sortable").append(tracklist[i].getHTML());
        }
        // Invisible empty div tacked on the end is where we add our 'Incoming' animation
        $("#sortable").append('<div id="waiter" class="containerbox"></div>');
        layoutProcessor.setPlaylistHeight();

        self.radioManager.setHeader();
        if (playlist.radioManager.isPopulating()) {
            playlist.waiting();
        }
        player.controller.postLoadActions();

    }

    this.clear = function() {
        playlist.radioManager.stop();
        player.controller.clearPlaylist();
    }

    this.draggedToEmpty = function(event, ui) {
        debug.log("PLAYLIST","Something was dropped on the empty playlist area",event,ui);
        playlist.addItems($('.selected').filter(removeOpenItems), "");
    }

    this.dragstopped = function(event, ui) {
        debug.log("PLAYLIST","Drag Stopped",event,ui);

        event.stopImmediatePropagation();
        var moveto  = (function getMoveTo(i) {
            debug.log("PLAYLIST", "Finding Next Item In List",i.next(),i.parent());
            if (i.next().hasClass('track')) {
                debug.log("PLAYLIST","Next Item Is Track");
                return parseInt(i.next().attr("name"));
            }
            if (i.next().hasClass('trackgroup') && i.next().is(':hidden')) {
                debug.log("PLAYLIST","Next Item is hidden trackgroup");
                // Need to account for these - you can't see them so it
                // looks like you're dragging to the next item below it therfore
                // that's how we must behave
                return getMoveTo(i.next());
            }
            if (i.next().hasClass('item') || i.next().hasClass('trackgroup')) {
                debug.log("PLAYLIST","Next Item Is Item or Trackgroup",
                    parseInt(i.next().attr("name")),
                    tracklist[parseInt(i.next().attr("name"))].getFirst());
                return tracklist[parseInt(i.next().attr("name"))].getFirst();
            }
            if (i.parent().hasClass('trackgroup')) {
                debug.log("PLAYLIST","Parent Item is Trackgroup");
                return getMoveTo(i.parent());
            }
            debug.log("PLAYLIST","Dropped at end?");
            return (parseInt(finaltrack))+1;
        })(ui);

        if (ui.hasClass("draggable")) {
            // Something dragged from the albums list
            debug.log("PLAYLIST","Something was dropped from the albums list");
            doSomethingUseful(ui.attr('id'), language.gettext('label_incoming'));
            playlist.addItems($('.selected').filter(removeOpenItems), moveto);
        } else if (ui.hasClass('track') || ui.hasClass('item')) {
            // Something dragged within the playlist
            var elementmoved = ui.hasClass('track') ? 'track' : 'item';
            switch (elementmoved) {
                case "track":
                    var firstitem = parseInt(ui.attr("name"));
                    var numitems = 1;
                    break;
                case "item":
                    var firstitem = tracklist[parseInt(ui.attr("name"))].getFirst();
                    var numitems = tracklist[parseInt(ui.attr("name"))].getSize();
                    break;
            }
            // If we move DOWN we have to calculate what the position will be AFTER the items have been moved.
            // It's understandable, but slightly counter-intuitive
            if (firstitem < moveto) {
                moveto = moveto - numitems;
                if (moveto < 0) { moveto = 0; }
            }
            player.controller.move(firstitem, numitems, moveto);
        } else {
            return false;
        }
    }

    this.addItems = function(elements, moveto) {
        var tracks = new Array();
        $.each(elements, function (index, element) {
            var uri = $(element).attr("name");
            if (uri) {
                if ($(element).hasClass('searchdir')) {
                    var s = addSearchDir($(element));
                    // concat doesn't work if the first array is empty????? WTF????
                    if (tracks.length == 0) {
                        tracks = s;
                    } else {
                        tracks.concat(s);
                    }
                } else if ($(element).hasClass('directory')) {
                    tracks.push({   type: "uri",
                                    name: decodeURIComponent($(element).children('input').first().attr('name'))});
                } else if ($(element).hasClass('clickalbum')) {
                    tracks.push({  type: "item",
                                    name: uri});
                } else if ($(element).hasClass('clickartist')) {
                    tracks.push({  type: "artist",
                                    name: uri});
                } else if ($(element).hasClass('clickcue')) {
                    tracks.push({  type: "cue",
                                    name: decodeURIComponent(uri)});
                } else if ($(element).hasClass('clickstream')) {
                    tracks.push({  type: "stream",
                                    url: decodeURIComponent(uri),
                                    image: $(element).attr('streamimg') || 'null',
                                    station: $(element).attr('streamname') || 'null',
                                    usersupplied: $(element).attr('supply') || 'null'
                                });
                } else if ($(element).hasClass('clickradio')) {
                    tracks.push({  type: "userstream",
                                    name: decodeURIComponent(uri),
                                });
                } else if ($(element).hasClass('clickloadplaylist')) {
                    tracks.push({ type: "playlist",
                                    name: decodeURIComponent($(element).children().first().attr('name'))});
                } else if ($(element).hasClass('clickloaduserplaylist')) {
                    tracks.push({ type: (prefs.player_backend == 'mpd') ? "playlist" : 'uri',
                                    name: decodeURIComponent($(element).children().first().attr('name'))});
                } else {
                    tracks.push({ type: "uri",
                                    name: decodeURIComponent(uri)});
                }
            }
        });
        if (tracks.length > 0) {
            if (moveto === null || moveto == "") { self.waiting(); }
            var playpos = (moveto === null) ? playlist.playFromEnd() : null;
            player.controller.addTracks(tracks, playpos, moveto);
            $('.selected').removeClass('selected');
        }
    }

    function addSearchDir(element) {
        var options = new Array();
        element.next().find('.clickable').each(function(index, elem){
            if ($(elem).hasClass('searchdir')) {
                options.concat(addSearchDir($(elem)));
            } else {
                options.push({
                    type: 'uri',
                    name: decodeURIComponent($(elem).attr('name'))
                });
            }
        });
        return options;
    }

    this.delete = function(id) {
        $('.track[romprid="'+id.toString()+'"]').remove();
        player.controller.removeId([parseInt(id)]);
    }

    this.waiting = function() {
        debug.log("PLAYLIST","Adding Incoming Bar");
        $("#waiter").empty();
        doSomethingUseful('waiter', language.gettext("label_incoming"));
    }

    // This is used for adding stream playlists ONLY
    // this.newInternetRadioStation = function(list) {
    //     var tracks = [];
    //     $(list).find("track").each( function() {
    //         tracks.push({   type: "uri",
    //                         name: $(this).find("location").text()}
    //         );
    //     });
    //     if (tracks.length > 0) {
    //         player.controller.addTracks(tracks, playlist.playFromEnd(), null);
    //     }
    // }

    this.hideItem = function(i) {
        tracklist[i].rollUp();
    }

    this.playFromEnd = function() {
        if (player.status.state == "stop") {
            debug.trace("PLAYLIST","Playfromend",finaltrack+1);
            return finaltrack+1;
        } else {
            debug.trace("PLAYLIST","Disabling auto-play");
            return -1;
        }
    }

    this.getfinaltrack = function() {
        return finaltrack;
    }

    this.trackHasChanged = function(backendid) {
        if (backendid != currentTrack.backendid) {
            debug.log("PLAYLIST","Looking For Current Track",backendid);
            $(".playlistcurrentitem").removeClass('playlistcurrentitem').addClass('playlistitem');
            $('.track[romprid="'+backendid+'"],.booger[romprid="'+backendid+'"]').removeClass('playlistitem').addClass('playlistcurrentitem');
            if (backendid && tracklist.length > 0) {
                for(var i in tracklist) {
                    if (tracklist[i].findcurrent(backendid)) {
                        if (currentalbum != i) {
                            currentalbum = i;
                            $(".playlistcurrenttitle").removeClass('playlistcurrenttitle').addClass('playlisttitle');
                            $('.item[name="'+i+'"]').removeClass('playlisttitle').addClass('playlistcurrenttitle');
                        }
                        break;
                    }
                }
            } else {
                currentTrack = emptyTrack;
            }
            playlist.radioManager.repopulate();
            nowplaying.newTrack(currentTrack, false);
        }
        clearTimeout(pscrolltimer);
        if (pageloading) {
            pscrolltimer = setTimeout(playlist.scrollToCurrentTrack, 3000);
        } else {
            playlist.scrollToCurrentTrack();
        }
    }

    this.getNextTrack = function() {
        var t = tracklist[currentalbum].getNextTrack(player.status.songid);
    }

    this.scrollToCurrentTrack = function() {
        pageloading = false;
        layoutProcessor.scrollPlaylistToCurrentTrack();
    }

    this.stopafter = function() {
        if (currentTrack.type == "stream") {
            infobar.notify(infobar.ERROR, language.gettext("label_notforradio"));
        } else if (player.status.state == "play") {
            if (player.status.single == 0) {
                player.controller.stopafter();
                var timeleft = currentTrack.duration - infobar.progress();
                if (timeleft < 4) { timeleft = 300 };
                var repeats = Math.round(timeleft / 4);
                $(".icon-to-end-1").makeFlasher({flashtime:4, repeats: repeats});
            } else {
                player.controller.cancelSingle();
                $(".icon-to-end-1").stopFlasher();
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
        tracklist[index].deleteSelf();
    }

    this.addAlbumToCollection = function(index) {
        infobar.notify(infobar.NOTIFY, "Adding Album To Collection");
        tracklist[index].addToCollection();
    }

    this.addFavourite = function(index) {
        debug.log("PLAYLIST","Adding Fave Station, index",index, tracklist[index].album);
        var data = tracklist[index].getFnackle();
        if (currentTrack.location) {
            data.uri = currentTrack.location;
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
        return currentTrack[thing];
    }

    this.getCurrentTrack = function() {
        var temp = cloneObject(currentTrack);
        return temp;
    }

    this.setCurrent = function(items) {
        for (var i in items) {
            currentTrack[i] = items[i];
        }
    }

    this.radioManager = function() {

        var mode = null;
        var radios = new Object();
        var oldconsume = null;
        var oldbuttonstate = null;
        var chunksize = 10;
        var rptimer = null;
        var startplaybackfrom = -1;
        var populating = false;

        return {

            register: function(name, fn) {
                debug.log("RADIO MANAGER","Registering Plugin",name);
                radios[name] = fn;
            },

            init: function() {
                for(var i in radios) {
                    debug.log("RADIO MANAGER","Activating Plugin",i);
                    radios[i].setup();
                }
                if (prefs.player_backend == "mopidy") {
                    $("#radiodomains").makeDomainChooser({
                        default_domains: trackFinder.getPriorities(),
                        sources_not_to_choose: {
                                    bassdrive: 1,
                                    dirble: 1,
                                    tunein: 1,
                                    audioaddict: 1,
                                    oe1: 1,
                                    podcast: 1,
                            }
                    });
                }
            },

            checkSavedState: function() {
                if (prefs.radiomode != "") {
                    playlist.radioManager.load(prefs.radiomode, prefs.radioparam);
                }
            },

            load: function(which, param) {
                debug.mark("RADIO MANAGER","Loading Smart",which,param);
                if (mode == which && (!param || param == prefs.radioparam)) {
                    debug.log("RADIO MANAGER", " .. that radio is already playing");
                    return false;
                }
                if ((mode && mode != which) || (mode && param && param != prefs.radioparam)) {
                    radios[mode].stop();
                }
                mode = which;
                prefs.save({radiomode: mode, radioparam: param});
                layoutProcessor.playlistLoading();
                if (prefs.consumeradio) {
                    oldbuttonstate = $("#playlistbuttons").is(":visible");
                    player.controller.checkConsume(1, playlist.radioManager.beffuddle);
                    if (!oldbuttonstate) {
                        togglePlaylistButtons();
                    }
                }
                populating = true;
                startplaybackfrom = 0;
                // Clearing the playlist causes us to repopulate and is best done there
                player.controller.clearPlaylist();
            },

            beffuddle: function(originalstate) {
                oldconsume = originalstate;
            },

            playbackStartPos: function() {
                var a = startplaybackfrom;
                startplaybackfrom = -1;
                return a;
            },

            repopulate: function() {
                // The timer is a mechanism to stop us repeatedly calling this when
                // lots of asynchronous stuff is happening at once. There are several routes
                // that call into this function to handle all the cases we need to handle
                // but we only want to act on one of them.
                clearTimeout(rptimer);
                rptimer = setTimeout(playlist.radioManager.actuallyRepopulate, 2000);
            },

            actuallyRepopulate: function() {
                if (updatecounter == 0) {
                    // Don't do anything if we're waiting on playlist updates
                    var fromend = playlist.getfinaltrack()+1 - currentTrack.playlistpos;
                    populating = false;
                    debug.blurt("RADIO MANAGER","Repopulate Check : Final Track :",playlist.getfinaltrack()+1,"Fromend :",fromend,"Chunksize :",chunksize,"Mode :",mode);
                    if (fromend < chunksize && mode) {
                        playlist.waiting();
                        radios[mode].populate(prefs.radioparam, chunksize - fromend);
                    }
                }
            },

            stop: function() {
                if (mode) {
                    radios[mode].stop();
                    prefs.save({radiomode: '', radioparam: ''});
                    mode = null;
                    populating = false;
                    playlist.repopulate();
                    if (prefs.consumeradio) {
                        player.controller.checkConsume(oldconsume, false);
                        if (oldbuttonstate == false && $("#playlistbuttons").is(":visible")) {
                            togglePlaylistButtons();
                        }
                    }
                }
            },

            setHeader: function() {
                var html = '';
                if (mode) {
                    var x = radios[mode].modeHtml(prefs.radioparam);
                    if (x) {
                        html = x + '<i class="icon-cancel-circled playlisticon clickicon" style="margin-left:8px" onclick="playlist.radioManager.stop()"></i>';
                    }
                }
                $("#plmode").html(html);
            },

            isPopulating: function() {
                return populating;
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
                html += '<div name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="track clickable clickplaylist sortable containerbox ';
                if (tracks[trackpointer].backendid == player.status.songid) {
                    html += 'playlistcurrentitem menuitem">';
                } else {
                    html += 'playlistitem menuitem">';
                }
                if (tracks[trackpointer].trackimage) {
                    html += '<div class="smallcover fixed"><img class="smallcover" src="'+tracks[trackpointer].trackimage+'" /></div>';
                }
                var l = tracks[trackpointer].location;
                if (tracks[trackpointer].tracknumber) {
                    html += '<div class="tracknumbr fixed"';
                    if (tracks.length > 99 ||
                        tracks[trackpointer].tracknumber > 99) {
                        html += ' style="width:3em"';
                    }
                    html += '>'+format_tracknum(tracks[trackpointer].tracknumber)+'</div>';
                }
                if (l.substring(0, 7) == "spotify") {
                    html += '<i class="icon-spotify-circled playlisticon fixed"></i>';
                } else if (l.substring(0, 6) == "gmusic") {
                    html += '<i class="icon-gmusic-circled playlisticon fixed"></i>';
                } else if (tracks[trackpointer].type == "podcast") {
                    html += '<i class="icon-podcast-circled playlisticon fixed"></i>';
                }
                if (showartist) {
                    html += '<div class="containerbox vertical expand">';
                    html += '<div class="line">'+tracks[trackpointer].title+'</div>';
                    html += '<div class="line playlistrow2">'+tracks[trackpointer].creator+'</div>';
                    html += '</div>';
                } else {
                    html += '<div class="expand line">'+tracks[trackpointer].title+'</div>';
                }
                html += '<div class="tracktime tiny fixed">'+formatTimeString(tracks[trackpointer].duration)+'</div>';
                html += '<i class="icon-cancel-circled playlisticonr fixed clickable clickicon clickremovetrack" romprid="'+tracks[trackpointer].backendid+'"></i>';
                html += '</div>';
            }
            // Close the rollup div we added in the header
            html += '</div>'
            return html;
        }

        this.header = function() {
            var html = "";
            html += '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox playlistalbum ';
            if (self.index == currentalbum) {
                html += 'playlistcurrenttitle">';
            } else {
                html += 'playlisttitle">';
            }
            if (tracks[0].image && tracks[0].image != "") {
                // An image was supplied - either a local one or supplied by the backend
                html += '<div class="smallcover fixed clickable clickicon clickrollup selfcentered" romprname="'+self.index+'"><img class="smallcover fixed" name="'+tracks[0].key+'" src="'+tracks[0].image+'"/></div>';
            } else {
                if (prefs.downloadart) {
                    // This is so we can get albumart when we're playing spotify
                    // Once mopidy starts supplying us with images, we can dump this code
                    // Note - this is required for when we load a spotify playlist because the albums won't be
                    // present in the window anywhere else
                    html += '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index
                                + '"><img class="smallcover updateable notexist fixed clickable clickicon clickrollup" romprname="'+self.index
                                +'" name="'+tracks[0].key+'" /></div>';
                    coverscraper.setCallback(this.updateImages, tracks[0].key);
                    coverscraper.GetNewAlbumArt(tracks[0].key);
                } else {
                    html += '<div class="smallcover fixed clickable clickicon clickrollup" romprname="'+self.index+'"><img class="smallcover fixed notexist" name="'+tracks[0].key+'"/></div>';
                }
            }
            html += '<div class="containerbox vertical expand selfcentered">';
            html += '<div class="bumpad">'+self.artist+'</div>';
            html += '<div class="bumpad">'+self.album+'</div>';
            html += '</div>';

            html += '<div class="containerbox vertical fixed">';
            // These next two currently need wrapping in divs for the sake of Safari
            html += '<div class="expand clickable clickicon clickremovealbum" name="'+self.index+'"><i class="icon-cancel-circled playlisticonr"></i></div>';
            if (tracks[0].metadata.album.uri && tracks[0].metadata.album.uri.substring(0,7) == "spotify") {
                html += '<div class="fixed clickable clickicon clickaddwholealbum" name="'+self.index+'"><i class="icon-music playlisticonr"></i></div>';
            }
            html += '</div>';
            html += '</div>';
            html += '<div class="trackgroup';
            if (rolledup) {
                html += ' invisible';
            }
            html += '" name="'+self.index+'">';
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
            for(var i in tracks) {
                if (tracks[i].backendid == which) {
                    currentTrack = tracks[i];
                    return true;
                }
            }
            return false;
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
            if (tracks[0].metadata.album.uri && tracks[0].metadata.album.uri.substring(0,14) == "spotify:album:") {
                spotify.album.getInfo(tracks[0].metadata.album.uri.substring(14,tracks[0].metadata.album.uri.length), addAlbumTracksToCollection, failedToAddAlbum, false)
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
                html += '<div name="'+tracks[trackpointer].playlistpos+'" romprid="'+tracks[trackpointer].backendid+'" class="booger clickable clickplaylist containerbox playlistitem menuitem">';
                html += '<i class="icon-radio-tower playlisticon fixed"></i>';
                html += '<div class="containerbox vertical expand">';
                html += '<div class="playlistrow2 line">'+tracks[trackpointer].stream+'</div>';
                html += '<div class="tiny line">'+tracks[trackpointer].location+'</div>';
                html += '</div>';
                html += '</div>';
            }
            // Close the rollup div we added in the header
            html += '</div>';
            return html;
        }

        this.header = function() {
            var html = "";
            html += '<div name="'+self.index+'" romprid="'+tracks[0].backendid+'" class="item clickable clickplaylist sortable containerbox playlistalbum ';
            if (self.index == currentalbum) {
                html += 'playlistcurrenttitle">';
            } else {
                html += 'playlisttitle">';
            }
            var image = (tracks[0].image) ? tracks[0].image : "newimages/broadcast.svg";
            html += '<div class="smallcover fixed clickable clickicon clickrollup selfcentered" romprname="'+self.index+'"><img class="smallcover" name="'+tracks[0].key+'"" src="'+image+'"/></div>';
            html += '<div class="containerbox vertical expand selfcentered">';
            html += '<div class="bumpad">'+tracks[0].creator+'</div>';
            html += '<div class="bumpad">'+tracks[0].album+'</div>';
            html += '</div>';
            html += '<div class="containerbox vertical fixed">';
            html += '<div class="clickable clickicon clickremovealbum expand" name="'+self.index+'"><i class="icon-cancel-circled playlisticonr"></i></div>';
            html += '<div class="clickable clickicon clickaddfave fixed" name="'+self.index+'"><i class="icon-radio-tower playlisticonr"></i></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="trackgroup';
            if (rolledup) {
                html += ' invisible';
            }
            html += '" name="'+self.index+'">';
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
            for(var i in tracks) {
                if (tracks[i].backendid == which) {
                    currentTrack = tracks[i];
                    return true;
                }
            }
            return false;
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
