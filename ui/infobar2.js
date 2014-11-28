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
    var fontsize = 8;
    var ftimer = null;

    var volumeslider = function() {
        volume = 0;
        return {
            setState: function(v) {
                if (v > 0) {
                    volume = v;
                    volumecontrol.setProgress(parseInt(volume));
                }
            },

            restoreState: function() {
                volume = prefs.volume;
                volumecontrol.setProgress(parseInt(prefs.volume));
            },

            getVolume: function() {
                return volume;
            },

            dragging: false
        }
    }();

    function setTheText(info) {
        debug.log("INFOBAR","Setting now playing info");
        var doctitle = "RompR";
        var contents = "";
        if (info.title != "") {
            contents = '<span class="npinfo nptitle"><b>'+info.title+'</b></span>';
            doctitle = info.title;
        }
        var s = info.creator;
        if (info.metadata && info.metadata.artists && !(info.type == "stream" && s != "")) {
            var an = new Array();
            for (var i in info.metadata.artists) {
                an.push(info.metadata.artists[i].name);
            }
            s = concatenate_artist_names(an);
        }
        if (s != "") {
            contents = contents + '<br /><span class="npinfo npartist"><i>'+frequentLabels.by+'</i> <b>'+s+'</b></span>';
            doctitle = doctitle + " . " + s;
        }
        if (info.album) {
            contents = contents+' <span id="smokey" class="npinfo npalbum">';
            if (info.title != "" || s != "") {
                contents=contents+ '<i>'+frequentLabels.on+'</i> ';
            }
            contents = contents + '<b>'+info.album+'</b></span>';
            if (info.title == "" && s == "" && info.stream != "") {
                contents = contents + '<br /><span class="npinfo npstream">'+info.stream+'</span>';
            }
        }
        $("#nptext").empty().html(contents);
        contents = null;
        document.title = doctitle;
        infobar.biggerize();
        doctitle = null;
    }

    return {
        NOTIFY: 0,
        ERROR: 1,
        PERMERROR: 2,

        biggerize: function() {

            // $("#nowplaying").css("font-family")
            //   -> "'Lucida Grande', 'Lucida Sans Unicode', sans-serif"

            // var canvas = document.createElement("canvas")
            // var ctx = canvas.getContext("2d")
            // var fs = $("#nowplaying").css("font-family").split(',')[0]
            // fs = fs.replace(/'/g,"")
            // ctx.font = "bold 20px "+fs
            // var metrics = ctx.measureText("Incense And Peppermints - Stereo Version")
            // metrics.width is the width. Height is just the chosen font size in pxiels

            var wehaveapasty = false;
            $("#pasty").remove();
            if ($("#nptext").html() != "" && !itisbigger) {
                var containersize = {
                    bottom: $("#nowplaying").offset().top + $("#nowplaying").height(),
                    width: $("#nowplaying").width() - $("#albumcover").outerWidth()
                };
                $("#nptext").css("top", "0px");
                while ($("#nptext").offset().top + $("#nptext").height() <= containersize.bottom) {
                    fontsize += 0.2;
                    $("#pasty").remove();
                    $("#nowplaying").css("font-size", fontsize.toFixed(1)+"pt");
                }
                while ($("#nptext").offset().top + $("#nptext").height() > containersize.bottom && fontsize >= 6) {
                    fontsize -= 0.2;
                    if (fontsize.toFixed(1) == '8.4') {
                        $("#pasty").remove();
                        $("#smokey").before('<br id="pasty" />');
                        wehaveapsty = true;
                    }
                    $("#nowplaying").css("font-size", fontsize.toFixed(1)+"pt");
                }
                while ($("#nptext").outerWidth() > containersize.width && fontsize >= 6) {
                    fontsize -= 0.2;
                    if (fontsize.toFixed(1) == '8.4') {
                        $("#pasty").remove();
                        $("#smokey").before('<br id="pasty" />');
                        wehaveapsty = true;
                    }
                    $("#nowplaying").css("font-size", fontsize.toFixed(1)+"pt");
                }
                while ($("#nptext").outerWidth() < containersize.width &&
                        wehaveapasty &&
                        $("#nptext").offset().top + $("#nptext").height() <= containersize.bottom) {
                    fontsize += 0.2;
                    $("#nowplaying").css("font-size", fontsize.toFixed(1)+"pt");
                }
                // if ($("#nptext").height() < ($("#nowplaying").height() - $("#smokey").height()) && !wehaveapasty) {
                //     $("#smokey").before('<br id="pasty" />');
                // }
            }
        },

        rejigTheText: function() {
            clearTimeout(ftimer);
            ftimer = setTimeout(infobar.biggerize, 500);
        },

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
                    if (data.image === null || data.image == "") {
                        aImg.src = "newimages/album-unknown.png";
                        oImg.src = "newimages/album-unknown.png";
                        aImg.className = "notexist";
                    } else {
                        if (aImg.src != data.image) {
                            aImg.src = data.image;
                        }
                        if (oImg.src != data.origimage) {
                            oImg.src = data.origimage;
                        }
                    }
                },

                setSecondarySource: function(data) {
                    if (data.key === undefined || data.key == aImg.getAttribute('name')) {
                        debug.log("ALBUMPICTURE","Secondary Source is being set to ",data.image,aImg);
                        if (data.image != "" && data.image !== null && (aImg.src == "" || aImg.className == "notexist")) {
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
                        debug.log("INFOBAR","Setting Play Button State");
                        state = s;
                        switch (state) {
                            case "play":
                                $("#playbuttonimg").attr("src", ipath+"media-playback-pause.png");
                                break;
                            case "pause":
                            case "stop":
                                $("#playbuttonimg").attr("src", ipath+"media-playback-start.png");
                                break;
                        }
                    }
                }
            }
        }(),

        updateWindowValues: function() {
            if (player.status.volume == -1) {
                volumeslider.setState(prefs.volume);
            } else {
                volumeslider.setState(player.status.volume);
            }
            infobar.playbutton.setState(player.status.state);
            setPlaylistButtons();
            if (player.status.error && player.status.error != null) {
                alert(language.gettext("label_playererror")+": "+player.status.error);
                player.controller.clearerror();
            }
        },

        setNowPlayingInfo: function(info) {
            //Now playing info
            debug.log("INFOBAR","NPinfo",info);
            trackinfo = info;
            lfminfo = {};
            scrobbled = false;
            nowplaying_updated = false;
            setTheText(info);
            lastfm.showloveban((info.title != ""));
            if (info.title != "") {
                $("#stars").fadeIn('fast');
                $("#dbtags").fadeIn('fast');
                $("#playcount").fadeIn('fast');
            }
            if (info.type == "local") {
                $("#progress").css("cursor", "pointer");
            } else {
                $("#progress").css("cursor", "default");
            }
            if (info.location != "") {
                var f = info.location.match(/^podcast\:(http.*?)\#/);
                if (f && f[1]) {
                    $("#nppodiput").attr("value", f[1]);
                    $("#subscribe").fadeIn('fast');
                } else {
                    $("#subscribe").fadeOut('fast');
                }
            }
            if (info == playlist.emptytrack) {
                debug.log("INFOBAR","Fading out Album Picture")
                $("#albumpicture").fadeOut('fast');
                $("#stars").fadeOut('fast');
                $("#dbtags").fadeOut('fast');
                $("#playcount").fadeOut('fast');
                $("#subscribe").fadeOut('fast');
                infobar.albumImage.setSource({    image: "newimages/transparent-32x32.png",
                                                  origimage: "newimages/transparent-32x32.png"
                                            });
            } else {
                infobar.albumImage.setKey(info.key);
                if (info.trackimage) {
                    infobar.albumImage.setSource({    image: info.trackimage,
                                                      origimage: info.trackimage
                                                });

                } else {
                    debug.log("INFOBAR","Setting Album Image to",info.image);
                    infobar.albumImage.setSource({    image: info.image,
                                                      origimage: info.origimage == "" ? info.image : info.origimage
                                                });
                }
            }
        },

        setLastFMCorrections: function(info) {
            lfminfo = info;
            if (prefs.lastfm_autocorrect && trackinfo.metadata.iscomposer == 'false' && trackinfo.type != "stream" && trackinfo.type != "podcast") {
                setTheText(info);
            }
            infobar.albumImage.setSecondarySource(info);
        },

        setStartTime: function(elapsed) {
            starttime = (Date.now())/1000 - parseFloat(elapsed);
        },

        progress: function() {
            return (player.status.state == "stop") ? 0 : (Date.now())/1000 - starttime;
        },

        scrobble: function() {
            if (!scrobbled) {
                debug.debug("INFOBAR","Track is not scrobbled");
                if (lastfm.isLoggedIn()) {
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
                if (prefs.apache_backend == 'sql') {
                    debug.log("INFOBAR","Track playcount being updated");
                    nowplaying.incPlaycount(null);
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
                    debug.debug("INFOBAR","is updating nowplaying",opts);
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
            if (player.controller.volume(volume)) {
                prefs.save({volume: parseInt(volume.toString())});
            } else {
                volumeslider.restoreState();
            }
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
            if (volumeslider.dragging) {
                volumeslider.dragging = false;
                infobar.setvolume(null, { value: volumeslider.getVolume() });
            }
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
            if (player.controller.volume(volume)) {
                volumeslider.setState(volume);
                prefs.save({volume: parseInt(volume.toString())});
            }
        },

        notify: function(type, message) {
            var html = '<div class="containerbox menuitem">';
            if (type == infobar.NOTIFY) {
                html = html + '<img class="fixed" src="'+ipath+'dialog-information.png" />';
            } else if (type == infobar.ERROR || type == infobar.PERMERROR) {
                html = html + '<img class="fixed" src="'+ipath+'dialog-error.png" />';
            }
            html = html + '<div class="expand indent">'+message+'</div></div>';
            $('#notifications').empty().html(html);
            html = null;
            clearTimeout(notifytimer);
            $('#notifications').slideDown('slow');
            if (type !== infobar.PERMERROR) {
                notifytimer = setTimeout(this.removenotify, 5000);
            }
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


