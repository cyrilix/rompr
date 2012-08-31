
function playControl() {
    var self = this;
    self.state = "";

    this.clicked = function() {
        switch(mpd.status.state)
        {
            case "play":
                mpd.command('command=pause');
                break;
            case "pause":
            case "stop":
                mpd.command('command=play');
                break;
        }
    }

    this.setState = function(state) {
        if (state != self.state) {
            self.state = state;
             switch(state)
            {
                case "play":
                    $("#playbuttonimg").attr("src", "images/media-playback-pause.png");
                    break;
                case "pause":
                case "stop":
                    $("#playbuttonimg").attr("src", "images/media-playback-start.png");
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
    
    var self = this;
    this.playbutton = new playControl();
    var volumeslider = new volumeControl();
            
    this.updateWindowValues = function() {
        volumeslider.setState(mpd.status.volume);
        self.playbutton.setState(mpd.status.state);
    }
    
    this.setNowPlayingInfo = function() {
        //Now playing info
        var contents = '<p class="larger"><b>';
        var doctitle = "RompR";
        contents=contents+nowplaying.track.name();
        if (nowplaying.track.name() != "") {
            doctitle = nowplaying.track.name();
        }
        contents=contents+'</b></p>';
        if (nowplaying.artist.name()) {
            contents=contents+'<p>by <b>'+nowplaying.artist.name()+'</b></p>';
            doctitle = doctitle + " - " + nowplaying.artist.name();
        }
        if (nowplaying.album.name()) {
            contents=contents+'<p>on <b>'+nowplaying.album.name()+'</b></p>';
        }
        $("#nowplaying").html(contents);
        document.title = doctitle;
        if (nowplaying.track.name() == "") {
            lastfm.hideloveban();
        } else {
            lastfm.revealloveban();
        }
    }


    this.love = function() {
        lastfm.track.love(nowplaying.track.name(), nowplaying.artist.name(), self.donelove);
    }

    this.donelove = function(track,artist) {
        $("#love").effect('pulsate', {times: 1}, 2000);
        browser.justloved(track,artist);
    }
        
    this.seek = function(e) {
        if (nowplaying.track.duration() > 0) {
            var position = getPosition(e);
            var width = $('#progress').width();
            var offset = $('#progress').offset();
            var seekto = ((position.x - offset.left)/width)*parseFloat(nowplaying.track.duration());
            mpd.command("command=seek&arg="+mpd.status.song+"&arg2="+parseInt(seekto.toString()));
        }
    }
    
    this.setvolume = function(e) {
        if (mpd.status.state == "play") {
            var volume = $("#volume").slider("value");
            mpd.command("command=setvol&arg="+parseInt(volume.toString()));
            savePrefs({volume: parseInt(volume.toString())});
        } else {
            alert("MPD can only set the volume while playing.");
            volumeslider.restoreState();
        }
    }
    
    this.volumeKey = function(inc) {
        if (mpd.status.state == "play") {
            var volume = parseInt(mpd.status.volume);
            if (volume == -1) { volume = 100 };
            volume = volume + inc;
            if (volume > 100) { volume = 100 };
            if (volume < 0) { volume = 0 };
            mpd.command("command=setvol&arg="+parseInt(volume.toString()));
            savePrefs({volume: parseInt(volume.toString())});
        } else {
            alert("MPD can only set the volume while playing.");
        }
    }

}
