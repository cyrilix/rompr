var infobar = function() {

    var notifytimer = null;
    var mousepos;
    var sliderclamps = 0;
    var progressbar = null;
    var volumecontrol = null;
    var trackinfo = {};
    var lfminfo = {};
    var starttime = 0;
    var scrobbled = false;
    var nowplaying_updated = false;

    var volumeslider = function() {
        volume = 0;
        return {
            setState: function(v) {
                // debug.log("INFOBAR","Setting Volume Slider to",v);
                if (v > 0) {
                    volume = v;
                    volumecontrol.setProgress(parseInt(volume));
                }
            },

            restoreState: function() {
                volumecontrol.setProgress(parseInt(self.volume));
            },

            getVolume: function() {
                return volume;
            },

            dragging: false
        }
    }();

    function setTheText(info) {
        // debug.log("INFOBAR","Setting now playing info",info);
        var doctitle = "RompR";
        if (mobile == "no") {
            var contents = '<span class="larger"><b>';
            contents=contents+info.title;
            if (info.title != "") {
                doctitle = info.title;
            }
            contents=contents+'</b></span>';
            if (info.creator) {
                contents=contents+'<p>'+frequentLabels.by+' <b>'+info.creator+'</b></p>';
                doctitle = doctitle + " - " + info.creator;
            }
            if (info.album) {
                contents=contents+'<p>'+frequentLabels.on+' <b>'+info.album+'</b></p>';
            }
        } else {
            var contents = '<span><b>';
            contents=contents+info.title;
            if (info.title != "") {
                doctitle = info.title;
            }
            contents=contents+'</b></span><br>';
            if (info.creator) {
                contents=contents+'<span>'+frequentLabels.by+' <b>'+info.creator+'</b></span><br>';
                doctitle = doctitle + " - " + info.creator;
            }
        }
        $("#nowplaying").empty().html(contents);
        contents = null;
        document.title = doctitle;
        doctitle = null;
    }

    return {
        NOTIFY: 0,
        ERROR: 1,

        albumImage: function() {
            var aImg = new Image();
            var oImg = new Image();

            aImg.className = "notfound";

            aImg.onload = function() {
                debug.log("ALBUMPICTURE","Image Loaded",$(this).attr("src"));
                aImg.className = "";
                $("#albumpicture").attr("src", $(this).attr("src")).fadeIn('fast');
            }
            aImg.onerror = function() {
                debug.log("ALBUMPICTURE","Image Failed To Load",$(this).attr("src"));
                $('img[name="'+$(this).attr('name')+'"]').addClass("notfound");
                aImg.className = "notexist";
                $("#albumpicture").fadeOut('fast');
                // Don't call coverscraper here - the playlist will do it for us and
                // its callback will call setSecondarySource
            }

            oImg.onload = function() {
                debug.log("ALBUMPICTURE","Original Image Loaded",$(this).attr("src"));
                $("#albumpicture").unbind('click').bind('click', infobar.albumImage.displayOriginalImage);
                $("#albumpicture").removeClass('clickicon').addClass('clickicon');
            }
            oImg.onerror = function() {
                $("#albumpicture").unbind('click');
                $("#albumpicture").removeClass('clickicon');
            }

            return {
                setSource: function(data) {
                    debug.log("ALBUMPICTURE","Source is being set to ",data.image,aImg);
                    if (aImg.src != data.image) {
                        aImg.src = data.image;
                    }

                    if (oImg.src != data.origimage) {
                        oImg.src = data.origimage;
                    }
                },

                setSecondarySource: function(data) {
                    if (data.key === undefined || data.key == aImg.getAttribute('name')) {
                        debug.log("ALBUMPICTURE","Secondary Source is being set to ",data.image,aImg);
                        if (data.image != "" && (aImg.src == "" || aImg.className == "notexist")) {
                            debug.debug("ALBUMPICTURE","  OK, the criteria have been met");
                            aImg.src = data.image;
                            oImg.src = data.origimage;
                        }
                    }
                },

                setKey: function(key) {
                    debug.log("ALBUMPICTURE","Setting Image Key to ",key);
                    aImg.name = key;
                    $("#albumpicture").attr("name", key);
                    aImg.className = "notfound";
                },

                displayOriginalImage: function(event) {
                    imagePopup.create($(event.target), event, oImg.src);
                },

            }

        }(),

        playbutton: function() {
            state = 0;

            return {
                clicked: function() {
                    switch (player.status.state) {
                        case "play":
                            player.controller.pause();
                            break;
                        case "pause":
                        case "stop":
                            player.controller.play();
                            break;
                    }
                },

                setState: function(s) {
                    if (s != state) {
                        state = s;
                        switch (state) {
                            case "play":
                                $("#playbuttonimg").attr("src", "newimages/media-playback-pause.png");
                                break;
                            case "pause":
                            case "stop":
                                $("#playbuttonimg").attr("src", "newimages/media-playback-start.png");
                                break;
                        }
                    }
                }
            }
        }(),

        updateWindowValues: function() {
            volumeslider.setState(player.status.volume);
            infobar.playbutton.setState(player.status.state);
            if (player.status.error && player.status.error != null) {
                alert(language.gettext("label_playererror")+": "+player.status.error);
                player.controller.clearerror();
            }
        },

        setVolumeState: function(v) {
            // For initialising the volume slider
            volumeslider.setState(v);
        },

        setNowPlayingInfo: function(info) {
            //Now playing info
            trackinfo = info;
            lfminfo = {};
            scrobbled = false;
            nowplaying_updated = false;
            setTheText(info);
            lastfm.showloveban((info.title != ""));
            if (info.type == "local") {
                $("#progress").css("cursor", "pointer");
            } else {
                $("#progress").css("cursor", "default");
            }
            if (info == playlist.emptytrack) {
                debug.log("INFOBAR","Fading out Album Picture")
                $("#albumpicture").fadeOut('fast');
                infobar.albumImage.setSource({    image: "newimages/transparent-32x32.png",
                                                  origimage: "newimages/transparent-32x32.png"
                                            });
                return 0;
            }
            if (info.type == "stream") {
                infobar.albumImage.setKey(hex_md5(info.album));
            } else {
                infobar.albumImage.setKey(hex_md5(info.albumartist+" "+info.album));
            }
            infobar.albumImage.setSource({    image: info.image,
                                              origimage: info.origimage == "" ? info.image : info.origimage
                                        });
        },

        setLastFMCorrections: function(info) {
            lfminfo = info;
            setTheText(info);
            infobar.albumImage.setSecondarySource(info);
        },

        setStartTime: function(elapsed) {
            starttime = (Date.now())/1000 - parseFloat(elapsed);
        },

        progress: function() {
            return (player.status.state == "stop") ? 0 : (Date.now())/1000 - starttime;
        },

        scrobble: function() {
            if (!scrobbled && lastfm.isLoggedIn()) {
                if (prefs.dontscrobbleradio && trackinfo.type != "local") {
                    debug.log("INFOBAR","Not Scrobbling because track is not local");
                    scrobbled = true;
                    return 0;
                }
                if (trackinfo.title != "" && trackinfo.name != "") {
                    var options = {
                                    timestamp: parseInt(starttime.toString()),
                                    track: (lfminfo.title === undefined) ? trackinfo.title : lfminfo.title,
                                    artist: (lfminfo.creator === undefined) ? trackinfo.creator : lfminfo.creator,
                                    album: (lfminfo.album === undefined) ? trackinfo.album : lfminfo.album
                    };
                    options.chosenByUser = (trackinfo.type == 'local') ? 1 : 0;
                     if (trackinfo.albumartist && trackinfo.albumartist != "" && trackinfo.albumartist.toLowerCase() != trackinfo.creator.toLowerCase()) {
                         options.albumArtist = trackinfo.albumartist;
                     }
                    debug.log("INFOBAR","Scrobbling", options);
                    lastfm.track.scrobble( options );
                }
            }
            scrobbled = true;
        },

        updateNowPlaying: function() {
            if (!nowplaying_updated && lastfm.isLoggedIn()) {
                if (trackinfo.title != "" && trackinfo.type && trackinfo.type != "stream") {
                    var opts = {
                        track: (lfminfo.title === undefined) ? trackinfo.title : lfminfo.title,
                        artist: (lfminfo.creator === undefined) ? trackinfo.creator : lfminfo.creator,
                        album: (lfminfo.album === undefined) ? trackinfo.album : lfminfo.album
                    };
                    debug.log("INFOBAR","is updating nowplaying",opts);
                    lastfm.track.updateNowPlaying(opts);
                    nowplaying_updated = true;
                }
            }
        },

        ban: function() {
            if (lastfm.isLoggedIn()) {
                lastfm.track.ban({
                    track: (lfminfo.title === undefined) ? trackinfo.title : lfminfo.title,
                    artist: (lfminfo.creator === undefined) ? trackinfo.creator : lfminfo.creator
                });
                if (trackinfo.type != "stream") {
                    playlist.next();
                }
            }
        },

        seek: function(e) {
            // Streams and last.fm tracks can't be seeked
            if (trackinfo.type == "local") {
                var d = trackinfo.duration;
                if (d > 0) {
                    var position = getPosition(e);
                    var width = $('#progress').width();
                    var offset = $('#progress').offset();
                    var seekto = ((position.x - offset.left)/width)*parseFloat(d);
                    player.controller.seek(seekto);
                }
            }
            return false;
        },

        setvolume: function(e, u) {
            var volume = u.value;
            debug.log("INFOBAR","Saving volume",volume);
            player.controller.volume(volume);
            prefs.save({volume: parseInt(volume.toString())});
        },

        volumemoved: function(e, u) {
            if (sliderclamps == 0 && volumeslider.dragging) {
                // Double interlock to prevent hammering mpd:
                // We don't send another volume request until two things happen:
                // 1. The previous volume command returns
                // 2. The timer expires
                sliderclamps = 2;
                debug.log("INFOBAR","Setting volume",u.value);
                player.controller.volume(u.value, infobar.releaseTheClamps);
                setTimeout(infobar.releaseTheClamps, 250);
            }
        },

        volumeTouch: function(e) {
            volumeslider.dragging = true;
            infobar.volumemoved(null, infobar.vCalc(e));
        },

        volumeTouchEnd: function() {
            volumeslider.dragging = false;
            infobar.setvolume(null, { value: volumeslider.getVolume() });
        },

        volumeMouseMove: function(e) {
            if (volumeslider.dragging) {
                infobar.volumemoved(null, infobar.vCalc(e));
            }
        },

        volumeDragEnd: function(e) {
            volumeslider.dragging = false;
            infobar.setvolume(null, infobar.vCalc(e));
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
            var volume = parseInt(player.status.volume);
            debug.debug("INFOBAR","Volume key with volume on",volume);
            volume = volume + inc;
            if (volume > 100) { volume = 100 };
            if (volume < 0) { volume = 0 };
            player.controller.volume(volume);
            volumeslider.setState(volume);
            prefs.save({volume: parseInt(volume.toString())});
        },

        notify: function(type, message) {
            var html = '<div class="containerbox menuitem">';
            if (type == infobar.NOTIFY) {
                html = html + '<img class="fixed" src="newimages/dialog-information.png" />';
            } else if (type == infobar.ERROR) {
                html = html + '<img class="fixed" src="newimages/dialog-error.png" />';
            }
            html = html + '<div class="expand indent">'+message+'</div></div>';
            $('#notifications').empty().html(html);
            html = null;
            clearTimeout(notifytimer);
            $('#notifications').slideDown('slow');
            notifytimer = setTimeout(this.removenotify, 5000);
        },

        removenotify: function() {
            $('#notifications').slideUp('slow');
        },

        createProgressBar: function() {
            progressbar = new progressBar('progress', 'horizontal');
            volumecontrol = new progressBar('volume', 'vertical');
        },

        setProgress: function(percent, progress, duration) {
            progressbar.setProgress(percent);
            var progressString = formatTimeString(progress);
            var durationString = formatTimeString(duration);
            if (progressString != "" && durationString != "") {
                $("#playbackTime").html(progressString + " " + frequentLabels.of + " " + durationString);
            } else if (progressString != "" && durationString == "") {
                $("#playbackTime").html(progressString);
            } else if (progressString == "" && durationString != "") {
                $("#playbackTime").html("");
            } else if (progressString == "" && durationString == "") {
                $("#playbackTime").html("");
            }
            nowplaying.progressUpdate(percent);
        }
    }
}();


