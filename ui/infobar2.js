var infobar = function() {

    var notifytimer = null;
    var mousepos;
    var sliderclamps = 0;
    var progressbar = null;
    var volumecontrol = null;
    var trackinfo = {};
    var lfminfo = {};
    var npinfo = {};
    var starttime = 0;
    var scrobbled = false;
    var nowplaying_updated = false;
    var fontsize = 8;
    var ftimer = null;
    var canvas = null;
    var context = null;

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
        var stuff = mungeTrackInfo(info);
        document.title = stuff.doctitle;
        npinfo = stuff.textbits
        debug.log("INFOBAR","Now Playing Info",npinfo);
        infobar.biggerize(2);
    }

    function getWidth(text, fontsize) {

        if (canvas == null) {
            canvas = document.createElement("canvas");
            context = canvas.getContext("2d");
        }
        var font = $("#nowplaying").css("font-family");
        context.font = "bold "+fontsize+"px "+font;
        var metrics = context.measureText(text);
        return metrics.width;
    }

    function checkLines(lines, maxwidth) {
        for (var i in lines) {
            if (lines[i].width > maxwidth) return true;
        }
    }

    return {
        NOTIFY: 0,
        ERROR: 1,
        PERMERROR: 2,

        biggerize: function(numlines) {

            // Fit the nowplaying text in the panel, always trying to make the best use of the available height
            // We adjust by checking width, since we don't wrap lines as that causes hell with the layout

            debug.log("INFOBAR","Biggerizing",npinfo,numlines);
            if (Object.keys(npinfo).length == 0 || $("#nptext").is(':hidden') || $("#infobar").is(':hidden')) {
                $("#nptext").html("");
                return;
            }
            // Start by trying with two lines:
            // Track Name
            // by Artist on Album
            if (!numlines) numlines = 2;
            var maxlines =  (npinfo.artist && npinfo.album && npinfo.title) ? 3 : 2;
            var maxheight = $("#nowplaying").height();
            if (!npinfo.title  && !npinfo.artist) {
                maxheight = $("#patrickmoore").height() - 8;
            }
            var maxwidth = $("#nowplaying").width() - 8;
            var lines = [
                {weight: (numlines == 2 ? 62 : 46), width: maxwidth+1, text: " "},
                {weight: (numlines == 2 ? 38 : 26), width: maxwidth+1, text: " "}
            ];
            if (numlines == 3) {
                lines.push({weight: 26, width: maxwidth+1, text: " "});
            }

            if (npinfo.title) {
                lines[0].text = npinfo.title;
            } else if (npinfo.album) {
                lines[0].text = npinfo.album;
            }

            if (numlines == 2) {
                if (npinfo.artist && npinfo.album) {
                    lines[1].text = frequentLabels.by+" "+npinfo.artist+" "+frequentLabels.on+" "+npinfo.album;
                } else if (npinfo.stream) {
                    lines[0].weight = 75;
                    lines[1].weight = 25;
                    lines[1].text = npinfo.stream;
                }
            } else {
                lines[1].text = frequentLabels.by+" "+npinfo.artist;
                lines[2].text = frequentLabels.on+" "+npinfo.album;
            }

            if (lines[1].text == " " && numlines == 2) {
                lines.pop();
                lines[0].weight = 100;
            }

            var totalheight = 0;
            while( checkLines(lines, maxwidth) ) {
                var factor = 100;
                totalheight = 0;
                for (var i in lines) {
                    var f = maxwidth/lines[i].width;
                    if (f < factor) factor = f;
                }
                for (var i in lines) {
                    lines[i].weight = lines[i].weight * factor;
                    // The 0.6666 comes in because the font height is 2/3rds of the line height,
                    // or to put it another way the line height is 1.5x the font height
                    lines[i].height = Math.round((maxheight/100)*lines[i].weight*0.6666);
                    lines[i].width = getWidth(lines[i].text, lines[i].height);
                    totalheight += Math.round(lines[i].height*1.5);
                }
            }

            // If this leaves enough space to split it into 3 lines, do that
            // Track Name
            // by Artist
            // on Album
            if (numlines < maxlines && totalheight < (maxheight - Math.round(lines[1].height*1.5))) {
                infobar.biggerize(numlines+1);
                return;
            }

            // Now, if there's still vertical space, we can make the title bigger.
            // Making one of the other two lines bigger looks bad
            if (totalheight < maxheight) {
                lines[0].height = Math.round(lines[0].height*(maxheight/totalheight));
                lines[0].width = getWidth(lines[0].text, lines[0].height);
                if (lines[0].width > maxwidth) {
                    lines[0].height = Math.round(lines[0].height*(maxwidth/lines[0].width));
                    lines[0].width = getWidth(lines[0].text, lines[0].height);
                }
            }

            // Min line neight is 7 pixels. This isn't completely safe but tests show it always seems to fit
            totalheight = 0;
            for (var i in lines) {
                if (lines[i].height < 7) {
                    lines[i].height = 7;
                }
                totalheight += Math.round(lines[i].height*1.5);
            }

            // Now adjust the text so it has appropriate italic and bold markup.
            // We measured it all in bold, because canvas doesn't support html tags,
            // but normal-italic is usally around the same width as bold.
            lines[0].text = '<b>'+lines[0].text+'</b>';
            if (numlines == 2) {
                if (npinfo.artist && npinfo.album) {
                    lines[1].text = '<i>'+frequentLabels.by+"</i> <b>"+npinfo.artist+"</b> <i>"+frequentLabels.on+"</i> <b>"+npinfo.album+'</b>';
                } else if (npinfo.stream) {
                    lines[1].text = '<i>'+npinfo.stream+'</i>';
                }
            } else {
                lines[1].text = '<i>'+frequentLabels.by+"</i> <b>"+npinfo.artist+'</b>';
                lines[2].text = '<i>'+frequentLabels.on+"</i> <b>"+npinfo.album+'</b>';
            }

            var html = "";
            for (var i in lines) {
                html = html + '<span style="font-size:'+lines[i].height+'px;line-height:'+Math.round(lines[i].height*1.5)+'px">'+lines[i].text+'</span>';
                if (i < lines.length-1) {
                    html = html + '<br />';
                }
            }

            var top = Math.floor((maxheight - totalheight)/2);
            if (top < 0) top = 0;
            $("#nptext").css("padding-top", top+"px");

            // Make sure the line spacing caused by the <br> is consistent
            if (lines[1]) {
                $("#nptext").css("font-size", lines[1].height+"px");
            } else {
                $("#nptext").css("font-size", lines[0].height+"px");
            }
            $("#nptext").empty().html(html);
        },

        rejigTheText: function() {
            clearTimeout(ftimer);
            ftimer = setTimeout(infobar.biggerize, 500);
        },

        albumImage: function() {
            var aImg = new Image();
            $("#albumpicture").attr('class', "notfound");

            aImg.onload = function() {
                debug.log("ALBUMPICTURE","Image Loaded",$(this).attr("src"));
                $("#albumpicture").attr('class', "clickicon");
                $("#albumpicture").attr("src", $(this).attr("src")).fadeIn('fast');
                $("#albumpicture").click(infobar.albumImage.displayOriginalImage);
                infobar.biggerize();
            }
            aImg.onerror = function() {
                debug.log("ALBUMPICTURE","Image Failed To Load",$(this).attr("src"));
                $('img[name="'+$(this).attr('name')+'"]').addClass("notfound");
                $("#albumpicture").attr('class', "notexist");
                $("#albumpicture").fadeOut('fast');
                $("#albumpicture").unbind('click');
                // Don't call coverscraper here - the playlist will do it for us and
                // its callback will call setSecondarySource
            }

            return {
                setSource: function(data) {
                    if (data.image === null || data.image == "") {
                        // aImg.src = "newimages/compact_disc.svg";
                        $("#albumpicture").unbind('click');
                        $("#albumpicture").removeClass('clickicon');
                        $("#albumpicture").attr('class', "notexist");
                    } else {
                        var re = new RegExp(data.image+'$');
                        if (!re.test(aImg.src)) {
                            debug.log("ALBUMPICTURE","Source is being set to ",data.image);
                            aImg.src = data.image;
                        }
                    }
                },

                setSecondarySource: function(data) {
                    if (data.key === undefined || data.key == aImg.getAttribute('name')) {
                        debug.log("ALBUMPICTURE","Secondary Source is being set to ",data.image,aImg);
                        if (data.image != "" && data.image !== null && (aImg.src == "" || aImg.className == "notexist")) {
                            debug.debug("ALBUMPICTURE","  OK, the criteria have been met");
                            $("#albumpicture").unbind('click');
                            $("#albumpicture").removeClass('clickicon');
                            aImg.src = data.image;
                        }
                    }
                },

                setKey: function(key) {
                    if (aImg.name != key) {
                        debug.log("ALBUMPICTURE","Setting Image Key to ",key);
                        aImg.name = key;
                        $("#albumpicture").attr("name", key);
                        aImg.className = "notfound";
                    }
                },

                displayOriginalImage: function(event) {
                    debug.log("ALBUMNPICTURE","Display Original Image");
                    imagePopup.create($(event.target), event, aImg.src);
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
                                $(".icon-play-circled").removeClass("icon-play-circled").addClass("icon-pause-circled");
                                break;
                            case "pause":
                            case "stop":
                                $(".icon-pause-circled").removeClass("icon-pause-circled").addClass("icon-play-circled");
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
            if (info.title != "" && info.creator != "") {
                $("#stars").fadeIn('fast');
                $("#dbtags").fadeIn('fast');
                $("#playcount").fadeIn('fast');
            } else {
                $("#stars").fadeOut('fast');
                $("#dbtags").fadeOut('fast');
                $("#playcount").fadeOut('fast');
            }
            if (info.type != "stream") {
                $("#progress").css("cursor", "pointer");
            } else {
                $("#progress").css("cursor", "default");
            }
            if (info.location != "") {
                var f = info.location.match(/^podcast[\:|\+](http.*?)\#/);
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
                infobar.albumImage.setSource({ image: "" });
            } else {
                infobar.albumImage.setKey(info.key);
                if (info.trackimage) {
                    infobar.albumImage.setSource({ image: info.trackimage });

                } else {
                    infobar.albumImage.setSource({ image: info.image });
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
                scrobbled = true;
                if (lastfm.isLoggedIn()) {
                    if (trackinfo.title != "" && trackinfo.creator != "") {
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
            if (trackinfo.type != "stream") {
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
                html = html + '<div class="fixed"><i class="icon-info-circled smallcover-svg"></i></div>';
            } else if (type == infobar.ERROR || type == infobar.PERMERROR) {
                html = html + '<div class="fixed"><i class="icon-attention-1 smallcover-svg"></i></div>';
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


