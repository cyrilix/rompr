function currentArtist(name, lfm) {
    this.mpd_name = name;
    this.name = name;
    var self = this;
    this.artistdata = lfm;
    
    this.gotArtistInfo = function(object) {
        // self.artistdata = object;
        debug.log("Infobar: Got artist info for", self.artistdata.name());
        self.name = self.artistdata.name() || self.name;
        infobar.setNowPlayingInfo();
    }
}

function currentAlbum(name, image, lfm) {
    
    this.mpd_name = name;
    this.albumart = image;
    this.name =  name;
    var self = this;
    if (image != "") { changeAlbumPicture(image); }
    this.albumdata = lfm;
    
    this.gotAlbumInfo = function(object) {
        // self.albumdata = object;
        debug.log("Infobar: Got album info for", self.albumdata.name());
        self.name = self.albumdata.name() || self.name;
        infobar.setNowPlayingInfo();
        // Get album image, if we need it
        if(self.albumart == "") {
            self.albumart = self.albumdata.image("medium") || "images/album-unknown.png";
            debug.log("Using album art from last.fm");
            changeAlbumPicture(self.albumart);
        }
    }

    function changeAlbumPicture(url) {
        // Animate the change of album art
        $('#albumpicture').fadeOut('slow', function () {
            $('#albumpicture').attr("src", url);
            $('#albumpicture').fadeIn('slow');
        });
    }

}
    
function currentTrack(name, elapsed, dur, lfm) {
    
    this.mpd_name = name;
    this.name = name;
    this.scrobbled = false;
    this.nowplaying_updated = false;
    var self = this;
    var date = new Date();
    self.starttime = (date.getTime())/1000 - parseFloat(elapsed);
    var duration = parseFloat(dur) || 0;
    if (duration == 0) { duration = playlist.current('duration') }
    if (duration == "") { duration = 0 }
    this.duration = duration;
    this.trackdata = lfm;
    
    this.setStartTime = function(elapsed) {
        var date = new Date();
        self.starttime = (date.getTime())/1000 - parseFloat(elapsed);
    }

    this.gotTrackInfo = function(object) {
        // self.trackdata = object;
        debug.log("Infobar: Got track info for", self.trackdata.name());
        if (self.duration == 0 && playlist.current('type') != "stream") {
            self.duration = self.trackdata.duration();
        }
        self.name = self.trackdata.name() || self.name;
        infobar.setNowPlayingInfo();
    }
    
}

function playInfo() {
 
    var self = this;
    self.track = new currentTrack(null, 0, 0);
    self.album = new currentAlbum(null, null);
    self.artist = new currentArtist(null);
    
    this.newTrack = function(artist, name, elapsed, dur) {
        var lfm = new lfmtrack(name, artist, self.gotTrackInfo);
        self.track = new currentTrack(name, elapsed, dur, lfm);
        lfm.populate();
        return lfm;
    }
    
    this.newAlbum = function(artist, name, image) {
        var lfma = new lfmalbum(name, artist, self.gotAlbumInfo);
        self.album = new currentAlbum(name, image, lfma);
        lfma.populate();
        return lfma;
    }
    
    this.newArtist = function(name) {
        var lfmb = new lfmartist(name, self.gotArtistInfo);
        self.artist = new currentArtist(name, lfmb);
        lfmb.populate();
        return lfmb;
    }

    this.gotTrackInfo = function(object) { self.track.gotTrackInfo(object) }
    this.gotAlbumInfo = function(object) { self.album.gotAlbumInfo(object) }
    this.gotArtistInfo = function(object) { self.artist.gotArtistInfo(object) }
        
}

function playControl() {
    var self = this;
    self.state = "";

    this.setState = function(state) {
        if (state != self.state) {
            self.state = state;
             switch(state)
            {
                case "play":
                    $("#playbuttonimg").attr("src", "images/media-playback-pause.png");
                    $("#playbutton").attr("onclick", "infobar.command('command=pause')");
                    break;
                case "pause":
                case "stop":
                    $("#playbuttonimg").attr("src", "images/media-playback-start.png");
                    $("#playbutton").attr("onclick", "infobar.command('command=play')");
                    break;
            }
        }
    }
}

function volumeControl() {
    var self = this;
    self.volume = 0;

    this.setState = function(volume) {
        if (volume != self.volume && volume > 0) {
            self.volume = volume;
            $("#volume").slider("option", "value", parseInt(volume));
        }
    }

    this.restoreState = function() {
        $("#volume").slider("option", "value", parseInt(self.volume));
    }
}

function infoBar() {
    
    var mpd_status = new Object;
    var progresstimer = 0;
    var progress_timer_running = 0;
    var safetytimer = 500;
    var self = this;
    var alanpartridge = 0;
    this.nowplaying = new playInfo();
    var playbutton = new playControl();
    var volumeslider = new volumeControl();
    
    this.update = function() {
        this.command("");
    }
    
    function clearProgressTimer() {
        if (progress_timer_running == 1) {
            clearTimeout(progresstimer);
            progress_timer_running = 0;
        }     
    }        
    
    // This is where pretty much all the basic start/stop/add communication with mpd comes through
    // If you provide a callback, it ought to call infobar.updateWindowValues() at some point.
    // If no callback is provided, this function calls that function.
    this.command = function(cmd, callback) {
        clearProgressTimer();
        debug.log("command : ",cmd);
        $.getJSON("ajaxcommand.php", cmd)
        .done(function(data) {
            mpd_status = {};   
            for(var key in data) {
                mpd_status[key] = data[key];
            }
            if (mpd_status.error) { alert("MPD Error: "+mpd_status.error); }
            if (mpd_status.state == "play" || mpd_status.state == "pause") { 
                self.nowplaying.track.setStartTime(mpd_status.elapsed); 
            }
            if (cmd == "command=stop") { playlist.checkSongIdAfterStop(mpd_status.songid); }
            if (callback) { callback(); } else { self.updateWindowValues(); }
            
        })
        .fail( function(data) { alert("Failed to send command to MPD") });
    }
    
    this.updateWindowValues = function() {
        playlist.updateCurrentSong(mpd_status.song, mpd_status.songid);        
        setVolumeSlider();
        playbutton.setState(mpd_status.state);
        checkAlbumChange();
        self.setNowPlayingInfo();
        self.setProgressBar();
    }
    
    this.playpausekey = function() {
        switch(mpd_status.state)
        {
            case "play":
                infobar.command('command=pause');
                break;
            case "pause":
            case "stop":
                infobar.command('command=play');
                break;
        }
    }
    
    function setVolumeSlider() {
        volumeslider.setState(mpd_status.volume);
    }
    
    this.setNowPlayingInfo = function() {
        //Now playing info
        var contents = "";
        contents = '<p class="larger"><b>';
        contents=contents+self.nowplaying.track.name;
        contents=contents+'</b></p>';
        if (self.nowplaying.artist.name) {
            contents=contents+'<p>by <b>'+self.nowplaying.artist.name+'</b></p>';
        }
        if (self.nowplaying.album.name) {
            contents=contents+'<p>on <b>'+self.nowplaying.album.name+'</b></p>';
        }
        $("#nowplaying").html(contents);
    }
            
    this.setProgressBar = function() {
        clearProgressTimer();
        var date = new Date();
        var currseconds = (date.getTime())/1000;
        var prog = (currseconds - self.nowplaying.track.starttime);
        if (mpd_status.state == "stop") { prog = 0; };
        var duration = self.nowplaying.track.duration;
        var percent = (duration == 0) ? 0 : (prog/duration) * 100;
        $("#progress").progressbar("option", "value", parseInt(percent.toString()));
        $("#playbackTime").html(formatTimeString(prog) + " of " + formatTimeString(duration));
        
        if (prog > 4 && mpd_status.state == "play") { updateNowPlaying() };
        if (percent >= scrobblepercent && mpd_status.state == "play") { scrobble(); }
        
        if (mpd_status.state == "play") {
            if (duration > 0) {
                if (prog >= duration) {
                    // Just in case - don't just call update, sometimes the track is longer than last.fm thinks it is
                    // This is a safety mechanism to prevent continuous calls to update() in this situation
                    // while still providing a quick response to a track change.
                    progresstimer = setTimeout("infobar.update()", safetytimer);
                    if (safetytimer<5000) { safetytimer+=500; }
                } else {
                    progresstimer = setTimeout("infobar.setProgressBar()", 1000);
                }
                progress_timer_running = 1;
            } else {
                var footonaspike = (playlist.current('type') == "stream") ? 10 : 5;
                alanpartridge++;
                if (alanpartridge < footonaspike) {
                    progresstimer = setTimeout("infobar.setProgressBar()", 1000);
                } else {
                    alanpartridge = 0;
                    progresstimer = setTimeout("infobar.update()", 1000);
                }
                progress_timer_running = 1;
            }
        }
    }

    this.love = function() {
        debug.log("Love was clicked on infobar");
        lastfm.track.love(self.nowplaying.track.name, self.nowplaying.artist.name, self.donelove);
    }

    this.donelove = function(track,artist) {
        debug.log("donelove",track,artist);
        $("#love").effect('pulsate', {times: 1}, 2000);
        browser.justloved(track,artist);
    }
    
    function scrobble() {
        if (!self.nowplaying.track.scrobbled) {
            if (self.nowplaying.track.name != "" && self.nowplaying.artist.name != "") {
                var options = { timestamp: parseInt(self.nowplaying.track.starttime.toString()),
                                track: self.nowplaying.track.name,
                                artist: self.nowplaying.artist.name,
                                album: self.nowplaying.album.name
                              };
                if (playlist.current('type') == 'local') {
                    options.chosenByUser = "1";
                } else {
                    options.chosenByUser = "0";
                }
                debug.log("Scrobbling", options.track);
                lastfm.track.scrobble( options );
                self.nowplaying.track.scrobbled = true;
            }
        }
    }
    
    function updateNowPlaying() {
        if (!self.nowplaying.track.nowplaying_updated) {
            if (self.nowplaying.track.name != "" && self.nowplaying.artist.name != "") {
                debug.log("Updating Now Playing", self.nowplaying.track.name);
                lastfm.track.updateNowPlaying({ track: self.nowplaying.track.name, 
                                                album: self.nowplaying.album.name,
                                                artist: self.nowplaying.artist.name
                                            });
                self.nowplaying.track.nowplaying_updated = true;
            }
        }
    }
    
    function checkAlbumChange() {
        // See if the playing track has changed
        // Get the current status FROM THE PLAYLIST because if we're playing
        // Last.FM only the playlist knows this information.
        var al = playlist.current('album');
        var ar = playlist.current('creator');
        var tr = playlist.current('title') || mpd_status.Title || "";
        var history = { track: self.nowplaying.track.trackdata,
                        album: self.nowplaying.album.albumdata,
                        artist: self.nowplaying.artist.artistdata};
        var toupdate = false;
        if (playlist.current('type') == "stream") {
            var parts = tr.split(" - ", 2);
            if (parts[0] && parts[1]) {
                ar = parts[0];
                tr = parts[1];
                al = playlist.current('creator') + " - " + playlist.current('album');
            }
        }
        // Compare with the names as returned from mpd, not from Last.FM corrections.
        if (ar != self.nowplaying.artist.mpd_name) {
            history.artist = self.nowplaying.newArtist(ar);
            toupdate = true;
        }
        if (tr != self.nowplaying.track.mpd_name)
        {
            safetytimer = 500;
            history.track = self.nowplaying.newTrack(ar, tr, mpd_status.elapsed, mpd_status.Time);
            toupdate = true;
        }
        if (al != self.nowplaying.album.mpd_name) {
            // We might, in some rare case, switch to a new artist with the same album
            // name as the previous one. In that case this won't fire and the album won't
            // get updated. On the other hand, if we trigger this on (album || artist) change
            // then the album gets updated for every track if we're playing a various artists
            // compilation. You can't win. This is better as the scenario in which this doesn't
            // work should be very rare.
            history.album = self.nowplaying.newAlbum(ar, al, playlist.current('image'));
            toupdate = true;
        }
        if (toupdate) {
            debug.log("Infobar: Sending toupdate");
            browser.updatesComing(history);
        }
    }
    
    this.toggle = function(thing) {
        var tocheck = (thing == "crossfade") ? "xfade" : thing;
        var new_value = (mpd_status[tocheck] == 0) ? 1 : 0;
        self.command("command="+thing+"&arg="+new_value);
        var options = new Object;
        options[thing] = new_value;
        savePrefs(options);
    }
    
    this.seek = function(e) {
        if (mpd_status.state == "play") {
            var position = getPosition(e);
            var width = $('#progress').width();
            var offset = $('#progress').offset();
            var seekto = ((position.x - offset.left)/width)*parseFloat(mpd_status.Time);
            self.command("command=seek&arg="+mpd_status.song+"&arg2="+parseInt(seekto.toString()));
        }
    }
    
    this.setvolume = function(e) {
        if (mpd_status.state == "play") {
            var volume = $("#volume").slider("value");
            self.command("command=setvol&arg="+parseInt(volume.toString()));
            savePrefs({volume: parseInt(volume.toString())});
        } else {
            alert("You can only set the volume while playing. This is mpd's fault!");
            volumeslider.restoreState();
        }
    }
    
    this.volumeKey = function(inc) {
        debug.log("Volume Key", inc);
        if (mpd_status.state == "play") {
            var volume = parseInt(mpd_status.volume);
            if (volume == -1) { volume = 100 };
            volume = volume + inc;
            if (volume > 100) { volume = 100 };
            if (volume < 0) { volume = 0 };
            self.command("command=setvol&arg="+parseInt(volume.toString()));
            savePrefs({volume: parseInt(volume.toString())});
        }
    }

    this.deleteTracksByID = function(tracks, callback) {
        var list = new Array();
        for(var i in tracks) {
            list.push('deleteid "'+tracks[i]+'"');
        }
        self.do_command_list(list, callback);
    }
    
    this.addalbum = function(key) {
        var list = new Array();
        $('div[name="'+key+'"]').find('a').each(function (index, element) { 
            var link = $(element).attr("onclick");
            var r = /\'command=(.*?)&arg=(.*?)\'/;
            var result = r.exec(link);
            list.push (result[1] + ' "'+decodeURIComponent(result[2])+'"');
        });
        if (mpd_status.state == 'stop') {
            var f = playlist.finaltrack+1;
            debug.log("Playing From",f,"because",playlist.finaltrack)
            list.push('play '+f.toString());
        }
        self.do_command_list(list, playlist.repopulate);        
    }

    this.do_command_list = function(list, callback) {
        $.post("postcommand.php", {'commands[]': list}, function(data) {
            debug.log("Command list callback");
            self.command("", callback);
        });        
    }

    this.getState = function() {
        debug.log("Getting state - returning",mpd_status.state);
        return mpd_status.state;
    }
        
}
