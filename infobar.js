function currentArtist(name) {
    this.mpd_name = name;
    this.name = name;
    var self = this;
    
    this.gotArtistInfo = function(data) {
        browser.artist.new(data);
        self.name = browser.artist.name() || self.name;
        infobar.setNowPlayingInfo();
    }
}

function currentAlbum(name, image) {
    
    //debug.log("New currentAlbum", name, image);
    
    this.mpd_name = name;
    this.albumart = image;
    this.name =  name;
    var self = this;
    if (image != "") { changeAlbumPicture(image); }
    
    this.gotAlbumInfo = function(data) {
        browser.album.new(data);
        self.name = browser.album.name() || self.name;
        infobar.setNowPlayingInfo();
        // Get album image, if we need it
        if(self.albumart == "") {
            self.albumart = browser.album.image("medium") || "images/album-unknown.png";
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
    
function currentTrack(name, elapsed, dur) {
    
    //debug.log("New Track : ",name, elapsed, dur);
    
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
    
    this.setStartTime = function(elapsed) {
        var date = new Date();
        self.starttime = (date.getTime())/1000 - parseFloat(elapsed);
    }

    this.gotTrackInfo = function(data) {
        browser.track.new(data);
        if (self.duration == 0 && playlist.current('type') != "stream") {
            self.duration = browser.track.duration();
        }
        self.name = browser.track.name() || self.name;
        infobar.setNowPlayingInfo(); 
    }
    
}

function playInfo() {
 
    var self = this;
    self.track = new currentTrack("", 0, 0);
    self.album = new currentAlbum("", "");
    self.artist = new currentArtist("");
    
    this.newTrack = function(name, elapsed, dur) {
        self.track = new currentTrack(name, elapsed, dur);
    }
    
    this.newAlbum = function(name, image) {
        self.album = new currentAlbum(name, image);
    }
    
    this.newArtist = function(name) {
        self.artist = new currentArtist(name);
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
        .fail( function(data) {  });
    }
    
    this.updateWindowValues = function() {
        //if (mpd_status.consume == "1") { playlist.repopulate() };
        playlist.updateCurrentSong(mpd_status.song,mpd_status.songid);        
        setVolumeSlider();
        setPlayButton();
        checkAlbumChange();
        self.setNowPlayingInfo();
        self.setProgressBar();
    }
    
    function setVolumeSlider() {
        // Volume
        if (mpd_status.volume > 0) {
            $("#volume").progressbar("option", "value", parseInt(mpd_status.volume));
        }
    }
    
    function setPlayButton() {
       // Play/Pause button
        switch(mpd_status.state)
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
        $("#infodiv").html(contents);
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
        if (percent > 50 && mpd_status.state == "play") { scrobble(); }
        
        if (mpd_status.state == "play") {
            if (duration > 0) {
                if (prog >= duration) {
                    // Just in case - don't just call update, sometimes the track is longer than last.fm thinks it is
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
                lastfm.track.scrobble( options );
                self.nowplaying.track.scrobbled = true;
            }
        }
    }
    
    function updateNowPlaying() {
        if (!self.nowplaying.track.nowplaying_updated) {
            if (self.nowplaying.track.name != "" && self.nowplaying.artist.name != "") {            
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
        var al = playlist.current('album');
        var ar = playlist.current('creator');
        var tr = playlist.current('title') || mpd_status.Title || "";
        if (tr != self.nowplaying.track.mpd_name)
        {
            // Track has changed.
            //debug.log("Track has changed from", self.nowplaying.track.mpd_name, "to", tr);
            safettyimer = 500;
            self.nowplaying.newTrack(tr, mpd_status.elapsed, mpd_status.Time);
            if (tr != "" && ar != "") {
                lastfm.track.getInfo({track: encodeURIComponent(tr), artist: encodeURIComponent(ar)}, self.nowplaying.track.gotTrackInfo, browser.TrackChanged);
            } else {
                browser.TrackChanged();
            }
        }
        if (al != self.nowplaying.album.mpd_name || ar != self.nowplaying.artist.mpd_name) {
            //debug.log("Album or artist has changed");
            // We can assume that if the artist has changed then so has the album
            // even if the album has the same name. Hence always update the album
            self.nowplaying.newAlbum(al, playlist.current('image'));
            if (al != "" && ar != "") {
                lastfm.album.getInfo({album: encodeURIComponent(al), artist: encodeURIComponent(ar)}, self.nowplaying.album.gotAlbumInfo, browser.AlbumChanged);
            } else {
                browser.AlbumChanged();
            }
            if (ar != self.nowplaying.artist.mpd_name) {
                self.nowplaying.newArtist(ar);
                if (ar != "") {
                    lastfm.artist.getInfo({artist: encodeURIComponent(ar)}, self.nowplaying.artist.gotArtistInfo, browser.ArtistChanged);
                } else {
                    browser.ArtistChanged();
                }
            }
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
    
    this.seek = function() {
        if (mpd_status.state == "play") {
            var position = getPosition();
            var width = $('#progress').width();
            var offset = $('#progress').offset();
            var seekto = ((position.x - offset.left)/width)*parseFloat(mpd_status.Time);
            self.command("command=seek&arg="+mpd_status.song+"&arg2="+parseInt(seekto.toString()));
        }
    }
    
    this.setvolume = function() {
        if (mpd_status.state == "play") {
            var position = getPosition();
            var width = $('#volume').width();
            var offset = $('#volume').offset();
            var volume = ((position.x - offset.left)/width)*100;
            self.command("command=setvol&arg="+parseInt(volume.toString()));
            savePrefs({volume: parseInt(volume.toString())});
        } else {
            alert("You can only set the volume while playing. This is mpd's fault!");
        }
    }

    this.deleteTracksByID = function(tracks, callback) {
        var list = "";
        for(var i in tracks) {
            list = list+'deleteid "'+tracks[i]+'"'+"||||";
        }
        self.command("list="+encodeURIComponent(list), callback);
    }
    
    this.addalbum = function(key) {
        var list = "";
        $('div[name="'+key+'"]').find('a').each(function (index, element) { 
            var link = $(element).attr("onclick");
            var r = /\'command=(.*?)&arg=(.*?)\'/;
            var result = r.exec(link);
            list = list + result[1] + ' "'+decodeURIComponent(result[2])+'"'+"||||";
        });
        self.command("list="+encodeURIComponent(list), playlist.repopulate);        
    }
        
}
