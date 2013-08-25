var infobar = function() {

    var notifytimer = null;
    var mousepos;
    var sliderclamps = 0;

    var volumeslider = function() {
        volume = 0;
        return {
            setState: function(v) {
                debug.log("INFOBAR       : Setting Volume Slider to",v);
                if (mobile == "no") {
                    if (v != volume && v > 0) {
                        volume = v;
                        $("#volume").slider("option", "value", parseInt(volume));
                    }
                } else {
                    if (v > 0) {
                        volume = v;
                        var h = $("#volumecontrol").height();
                        var p = h-((h/100)*volume);
                        $("#volumeslider").css("top", p.toString()+"px");
                    }
                }
            },
            restoreState: function() {
                if (mobile == "no") {
                    $("#volume").slider("option", "value", parseInt(self.volume));
                } else {
                    var h = $("#volumecontrol").height();
                    var p = h-((h/100)*self.volume);
                    $("#volumeslider").css("top", p.toString()+"px");
                }
            },
            getVolume: function() {
                return volume;
            }
        }
    }();

    return {
        NOTIFY: 0,
        ERROR: 1,

        albumImage: function() {
            var aImg = new Image();
            var oImg = new Image();

            aImg.className = "notfound";

            aImg.onload = function() {
                debug.log("ALBUMPICTURE  : Image Loaded",$(this).attr("src"));
                aImg.className = "";
                $("#albumpicture").attr("src", $(this).attr("src")).fadeIn('fast');
            }
            aImg.onerror = function() {
                debug.log("ALBUMPICTURE  : Image Failed To Load",$(this).attr("src"));
                $('img[name="'+$(this).attr('name')+'"]').addClass("notfound");
                aImg.className = "notfound";
                $("#albumpicture").fadeOut('fast');
                // Don't call coverscraper here - the playlist will do it for us and
                // its callback will call setSecondarySource
            }

            oImg.onload = function() {
                debug.log("ALBUMPICTURE  : Original Image Loaded",$(this).attr("src"));
                $("#albumpicture").unbind('click').bind('click', infobar.albumImage.displayOriginalImage);
                $("#albumpicture").removeClass('clickicon').addClass('clickicon');
            }
            oImg.onerror = function() {
                $("#albumpicture").unbind('click');
                $("#albumpicture").removeClass('clickicon');
            }

            return {
                setSource: function(data) {
                    debug.log("ALBUMPICTURE  : Source is being set to ",data.image,aImg);
                    if (aImg.src != data.image) {
                        aImg.src = data.image;
                    }

                    if (oImg.src != data.origimage) {
                        oImg.src = data.origimage;
                    }
                },

                setSecondarySource: function(data) {
                    if (data.key === undefined || data.key == aImg.getAttribute('name')) {
                        debug.log("ALBUMPICTURE  : Secondary Source is being set to ",data.image,aImg);
                        if (data.image != "" && (aImg.src == "" || aImg.className == "notfound")) {
                            debug.log("ALBUMPICTURE  :   OK, the criteria have been met");
                            aImg.src = data.image;
                            oImg.src = data.origimage;
                        }
                    }
                },

                setKey: function(key) {
                    debug.log("ALBUMPICTURE  : Setting Image Key to ",key);
                    aImg.setAttribute("name", key);
                    aImg.className = "notfound";
                },

                displayOriginalImage: function(event) {
                    var mousepos = getPosition(event);
                    var dimensions = imagePopup.create(oImg.width, oImg.height, mousepos.x, mousepos.y);
                    imagePopup.contents('<img src="'+oImg.src+'" height="'+parseInt(dimensions.height)+'" width="'+parseInt(dimensions.width)+'">');
                    imagePopup.show();
                },

            }

        }(),

        playbutton: function() {
            state = 0;

            return {
                clicked: function() {
                    switch (mpd.getStatus('state')) {
                        case "play":
                            player.procrastinate();
                            break;
                        case "pause":
                        case "stop":
                            player.gogogo();
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

        setVolumeState: function(v) {
            // For initialising the volume slider when we're
            // running the mobile client
            volumeslider.setState(v);
        },

        setNowPlayingInfo: function(info) {
            //Now playing info
            debug.log("INFOBAR       : Setting now playing info",info);
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
            if (info.track =="" && info.album == "" && info.artist == "") {
                debug.log("INFOBAR       : Fading out Album Picture")
                $("#albumpicture").fadeOut('fast');
                return 0;
            }
            if (info.location !== undefined) {
                // Location is only set when we get the initial mpd data from
                // nowplaying. It's not set when nowplaying calls us again with the corrected Last.FM
                // data. The name for the image tag has to be set from the mpd data, hence we use
                // location simply as a flag.
                infobar.albumImage.setKey(hex_md5(info.albumartist+" "+info.album));
            }
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
            if (nowplaying.mpd(-1,'type') == "local") {
                var d = nowplaying.duration(-1);
                if (d > 0) {
                    var position = getPosition(e);
                    var width = $('#progress').width();
                    var offset = $('#progress').offset();
                    var seekto = ((position.x - offset.left)/width)*parseFloat(d);
                    player.seek(seekto);
                }
            }
            return false;
        },

        setvolume: function(e, u) {
            // Gold ol' mopidy can set the volume while idle :)
            if (prefs.use_mopidy_tagcache || prefs.use_mopidy_http || mpd.getStatus('state') != "stop") {
                var volume = u.value;
                debug.log("INFOBAR       : Saving volume",volume);
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
                    mpd.fastcommand("command=setvol&arg="+parseInt(u.value.toString()), infobar.releaseTheClamps);
                    setTimeout(infobar.releaseTheClamps, 250);
                }
            }
        },

        volumeTouch: function(e) {
            infobar.volumemoved(null, infobar.vCalc(e));
        },

        volumeTouchEnd: function() {
            infobar.setvolume(null, { value: volumeslider.getVolume() });
        },

        vCalc: function(e) {
            var t = $("#volumecontrol").offset().top;
            var h = $("#volumecontrol").height();
            var v = ((h-(e.pageY-t))/h)*100;
            if (v > 100) {
                v = 100;
            } else if (v < 0) {
                v = 0;
            }
            volumeslider.setState(v);
            return {value: v};
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


