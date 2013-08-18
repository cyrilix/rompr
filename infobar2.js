var infobar = function() {
    
    var notifytimer = null;
    var img = new Image();
    var mousepos;
    var sliderclamps = 0;

    var volumeslider = function() {
        volume = 0;
        return {
            setState: function(v) {
                if (v != volume && v > 0) {
                    volume = v;
                    $("#volume").slider("option", "value", parseInt(volume));
                }
            },
            restoreState: function() {
                $("#volume").slider("option", "value", parseInt(self.volume));
            }
        }
    }();
    
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
            if (mpd.getStatus('error') && mpd.getStatus('error') != null) { 
                alert("MPD Error: "+mpd.getStatus('error'));
                mpd.command('command=clearerror');
            }
        },
            
        setNowPlayingInfo: function(info) {
            //Now playing info
            debug.log("Setting now playing info",info);
            var doctitle = "RompR";
            if (mobile == "no") {
                var contents = '<span class="larger"><b>';
                contents=contents+info.track;
                if (info.track != "") {
                    doctitle = info.track;
                }
                contents=contents+'</b></span>';
                if (info.artist) {
                    contents=contents+'<p>by <b>'+info.artist+'</b></p>';
                    doctitle = doctitle + " - " + info.artist;
                }
                if (info.album) {
                    contents=contents+'<p>on <b>'+info.album+'</b></p>';
                }
            } else {
                var contents = '<span class="larger"><b>';
                contents=contents+info.track;
                if (info.track != "") {
                    doctitle = info.track;
                }
                contents=contents+'</b></span><br>';
                if (info.artist) {
                    contents=contents+'<span>by <b>'+info.artist+'</b></span><br>';
                    doctitle = doctitle + " - " + info.artist;
                }
            }
            $("#nowplaying").empty().html(contents);
            contents = null;
            document.title = doctitle;
            doctitle = null;
            lastfm.showloveban((info.track != ""));
            if (nowplaying.mpd(-1,'type') == "local") {
                $("#progress").css("cursor", "pointer");
            } else {
                $("#progress").css("cursor", "default");
            }
            if (info.location !== undefined) {
                // Location is only set when we get the initial mpd data from
                // nowplaying. It's not set when nowplaying calls us again with the corrected Last.FM
                // data. The name for the image tag has to be set from the mpd data, hence we use
                // location simply as a flag.
                $("#albumpicture").attr("name", hex_md5(info.albumartist+" "+info.album));
            }
            if (info.image !== undefined) {
                $('#albumpicture').attr("src", info.image);
                if (info.image == "") {
                    $('#albumpicture').fadeOut('fast');
                } 
                // Note - the albumpicture onload event takes care of fading it back in
                if (info.origimage !== undefined) {
                    img.src = info.origimage;
                    $("#albumpicture").unbind('click').bind('click', infobar.displayimage);
                    $("#albumpicture").removeClass('clickicon').addClass('clickicon');
                } else {
                    $("#albumpicture").unbind('click');
                    $("#albumpicture").removeClass('clickicon');
                }
            }
        },
        
        displayimage: function(event) {
            var mousepos = getPosition(event);
            var dimensions = imagePopup.create(img.width, img.height, mousepos.x, mousepos.y);
            imagePopup.contents('<img src="'+img.src+'" height="'+parseInt(dimensions.height)+'" width="'+parseInt(dimensions.width)+'">');
            imagePopup.show();
        },
        
        love: function() {
            nowplaying.love(-1, infobar.donelove);
            return false;
        },

        donelove: function(track,artist) {
            $("#love").effect('pulsate', {times: 1}, 2000);
        },

        seek: function(e) {
            // Streams and last.fm tracks can't be seeked, and seeking while stopped soesn't work
            if (nowplaying.mpd(-1,'type') == "local" && mpd.getStatus('state') != 'stop') {
                var d = nowplaying.duration(-1);
                if (d > 0) {
                    var position = getPosition(e);
                    var width = $('#progress').width();
                    var offset = $('#progress').offset();
                    var seekto = ((position.x - offset.left)/width)*parseFloat(d);
                    mpd.command("command=seek&arg="+mpd.getStatus('song')+"&arg2="+parseInt(seekto.toString()));
                }
            }
            return false;
        },
        
        setvolume: function(e, u) {
            // Gold ol' mopidy can set the volume while idle :)
            if (prefs.use_mopidy_tagcache || prefs.use_mopidy_http || mpd.getStatus('state') != "stop") {
                var volume = u.value;
                mpd.command("command=setvol&arg="+parseInt(volume.toString()));
                prefs.save({volume: parseInt(volume.toString())});
            } else {
                infobar.notify(infobar.ERROR, "MPD cannot adjust volume while playback is stopped");
                volumeslider.restoreState();
            }
        },
        
        volumemoved: function(e, u) {
            if (mpd.getStatus('state') != "stop") {
                if (sliderclamps == 0) {
                    // Double interlock to prevent hammering mpd:
                    // We don't send another volume request until two things happen:
                    // 1. The previous volume command returns
                    // 2. The timer expires
                    sliderclamps = 2;
                    debug.log("Setting Volume on drag to",u.value.toString());
                    mpd.fastcommand("command=setvol&arg="+parseInt(u.value.toString()), infobar.releaseTheClamps);
                    setTimeout(infobar.releaseTheClamps, 250);
                }
            }
        },
        
        releaseTheClamps: function() {
            sliderclamps--;
        },

        volumeKey: function(inc) {
            if (mpd.getStatus('state') == "play") {
                var volume = parseInt(mpd.getStatus('volume'));
                volume = volume + inc;
                if (volume > 100) { volume = 100 };
                if (volume < 0) { volume = 0 };
                mpd.command("command=setvol&arg="+parseInt(volume.toString()));
                prefs.save({volume: parseInt(volume.toString())});
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
            $('#notifications').empty().html(html);
            html = null;
            if (notifytimer != null) {
                clearTimeout(notifytimer);
                notifytimer = null;
            } else {
                $('#notifications').slideDown('slow');
                notifytimer = setTimeout(this.removenotify, 5000);
            }
        },
        
        removenotify: function() {
            notifytimer = null;
            $('#notifications').slideUp('slow');
        }
    }
}();
       

                        