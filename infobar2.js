var infobar = function() {
    
    var notifytimer = null;
    var volumeslider = function() {
        volume = 0;
        return {
            setState: function(v) {
                if (v != volume && v > 0) {
                    volume = v;
                    $("#volume").slider("option", "value", parseInt(volume));
                }
            },
            restorestate: function() {
                $("#volume").slider("option", "value", parseInt(self.volume));
            }
        }
    }()
    
    return {
        NOTIFY: 0,
        ERROR: 1,
                
        playbutton: function() {
            state = 0;
            
            return {
                clicked: function() {
                    switch (mpd.getStatus('state')) {
                        case "play":
                            mpd.command('command=pause');
                            break;
                        case "pause":
                        case "stop":
                            mpd.command('command=play');
                            break;
                    }
                },
                
                setState: function(s) {
                    if (s != state) {
                        state = s;
                        switch (state) {
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
        }(),
            
        updateWindowValues: function() {
            volumeslider.setState(mpd.getStatus('volume'));
            infobar.playbutton.setState(mpd.getStatus('state'));
            if (mpd.getStatus('error')) { 
                alert("MPD Error: "+mpd.getStatus('error'));
                if ((/error decoding/i).test(mpd.getStatus('error'))) {
                    mpd.command("command=next", playlist.repopulate);
                }
            }
        },
            
        setNowPlayingInfo: function(info) {
            //Now playing info
            debug.log("Setting now playing info",info);
            var contents = '<p class="larger"><b>';
            var doctitle = "RompR";
            contents=contents+info.track;
            if (info.track != "") {
                doctitle = info.track;
            }
            contents=contents+'</b></p>';
            if (info.artist) {
                contents=contents+'<p>by <b>'+info.artist+'</b></p>';
                doctitle = doctitle + " - " + info.artist;
            }
            if (info.album) {
                contents=contents+'<p>on <b>'+info.album+'</b></p>';
            }
            //$("#nowplaying").empty();
            $("#nowplaying").html(contents);
            contents = null;
            document.title = doctitle;
            doctitle = null;
            if (info.track == "") {
                lastfm.hideloveban();
            } else {
                lastfm.revealloveban();
            }
            if (info.image && $('#albumpicture').attr("src") != info.image) {
                $('#albumpicture').fadeOut(1000, function () {
                    $('#albumpicture').attr("src", info.image);
                    $('#albumpicture').fadeIn(1000);
                });
            }
        },
        
        love: function() {
            nowplaying.love(-1, self.donelove);
        },

        donelove: function(track,artist) {
            $("#love").effect('pulsate', {times: 1}, 2000);
        },

        seek: function(e) {
            var d = nowplaying.duration(-1);
            if (d > 0) {
                var position = getPosition(e);
                var width = $('#progress').width();
                var offset = $('#progress').offset();
                var seekto = ((position.x - offset.left)/width)*parseFloat(d);
                mpd.command("command=seek&arg="+mpd.getStatus('song')+"&arg2="+parseInt(seekto.toString()));
            }
        },
        
        setvolume: function(e) {
            if (mpd.getStatus('state') == "play") {
                var volume = $("#volume").slider("value");
                mpd.command("command=setvol&arg="+parseInt(volume.toString()));
                savePrefs({volume: parseInt(volume.toString())});
            } else {
                infobar.notify(infobar.ERROR, "MPD can only set the volume while playing.");
                volumeslider.restoreState();
            }
        },

        volumeKey: function(inc) {
            if (mpd.getStatus('state') == "play") {
                var volume = parseInt(mpd.getStatus('volume'));
                volume = volume + inc;
                if (volume > 100) { volume = 100 };
                if (volume < 0) { volume = 0 };
                mpd.command("command=setvol&arg="+parseInt(volume.toString()));
                savePrefs({volume: parseInt(volume.toString())});
            } else {
                infobar.notify(infobar.ERROR, "MPD can only set the volume while playing.");
            }
        },
        
        notify: function(type, message) {
            var html = '<div class="containerbox menuitem">';
            if (type == infobar.NOTIFY) {
                html = html + '<img class="fixed" src="images/dialog-information.png" />';
            } else if (type == infobar.ERROR) {
                html = html + '<img class="fixed" src="images/dialog-error.png" />';
            }
            html = html + '<div class="expand indent">'+message+'</div></div>';
            $('#notifications').html(html);
            html = null;
            if (notifytimer != null) {
                clearTimeout(notifytimer);
                notifytimer = null;
            } else {
                $('#notifications').show('slow');
                notifytimer = setTimeout(this.removenotify, 5000);
            }
        },
        
        removenotify: function() {
            notifytimer = null;
            $('#notifications').hide('slow');
        }
    }
}();
       

                        