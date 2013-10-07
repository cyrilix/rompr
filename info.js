String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var browser = function() {

    var current_source = prefs.infosource;
    var history = [];
    var displaypointer = -1;
    var panelclosed = {artist: false, album: false, track: false};
    var waitingon = {artist: false, album: false, track: false, index: -1, source: null};

    var sources = nowplaying.getAllPlugins();

    function displayTheData(ptr, showartist, showalbum, showtrack) {
        var a = waitingon.artist;
        var b = waitingon.album;
        var c = waitingon.track;
        waitingon = {   artist: a || showartist,
                        album:  b || showalbum,
                        track:  c || showtrack,
                        index: history[ptr].nowplayingindex,
                        source: history[ptr].source
        };
        for (var i in waitingon) {
            if (waitingon[i] === true) {
                $("#"+i+"information").html(waitingBanner(i));
            }
        }
        nowplaying.giveUsTheData(waitingon);
        debug.log("BROWSER", "Waiting on source",waitingon.source,"for index", waitingon.index);
    }

    function waitingBanner(which) {
        var html = '<div class="containerbox infosection menuitem bordered">';
        html = html + '<h3 class="expand ucfirst">'+which+' : (Getting Info....)</h3>';
        html = html + '<div class="fixed" style="vertical-align:middle"><img height="32px" src="newimages/waiter.png" class="spinner"></div>';
        html = html + '</div>';
        return html;
    }

    function banner(data, title, hidden, source) {
        var html = '<div class="containerbox infosection menuitem bordered">';
        html = html + '<h2 class="expand"><span class="ucfirst">'+title+'</span> : ' + data.name + '</h2>';
        html = html + '<div class="fixed" style="vertical-align:middle;padding:12px"><a href="#" class="infoclick frog">';
        if (hidden) {
            html = html + "CLICK TO SHOW";
        } else {
            html = html + "CLICK TO HIDE";
        }
        html = html + '</a></div>';
        if (data.link === null) {
            html = html + '<div class="fixed" style="vertical-align:middle"><img height="32px" src="'+sources[source].icon+'"></div>';
        } else {
            html = html + '<div class="fixed" style="vertical-align:middle"><a href="'+
                        data.link + '" title="View In New Tab" target="_blank"><img height="32px" src="'+sources[source].icon+'"></a></div>';
        }
        html = html + '</div>';
        html = html + '<div class="foldup" id="artistfoldup"';
        if (hidden) {
            html = html + ' style="display:none"';
        }
        html = html + '>';
        return html;
    }

    function toggleSection(section) {
        $("#"+section+"information .foldup").slideToggle('slow');
        panelclosed[section] = !panelclosed[section];
        if (panelclosed[section]) {
            $("#"+section+"information .frog").text("CLICK TO SHOW");
        } else {
            $("#"+section+"information .frog").text("CLICK TO HIDE");
        }
    }

    function updateHistory() {

        if (displaypointer == 0) {
            $("#backbutton").unbind('click');
            $("#backbutton").attr("src", "newimages/backbutton_disabled.png");
        }
        if (displaypointer > 0 && $("#backbutton").attr("src")=="newimages/backbutton_disabled.png") {
            $("#backbutton").click( browser.back );
            $("#backbutton").attr("src", "newimages/backbutton.png");
        }
        if (displaypointer == (history.length)-1) {
            $("#forwardbutton").unbind('click');
            $("#forwardbutton").attr("src", "newimages/forwardbutton_disabled.png");
        }
        if (displaypointer < (history.length)-1 && $("#forwardbutton").attr("src")=="newimages/forwardbutton_disabled.png") {
            $("#forwardbutton").click( browser.forward );
            $("#forwardbutton").attr("src", "newimages/forwardbutton.png");
        }

        var html;
        if (mobile == "no") {
            html = '<li class="wider"><b>HISTORY</b></li><li class="wider">';
        } else {
            html = '<h3>HISTORY</h3>';
        }
        html = html + '<table class="histable" width="100%">';
        for (var i in history) {
            var clas="top";
            if (i == displaypointer) {
                clas = clas + " current";
            }
            if (mobile == "no") {
                html = html + '<tr class="'+clas+'" onclick="browser.doHistory('+i+')">';
            } else {
                html = html + '<tr class="'+clas+'" onclick="browser.doHistory('+i+');sourcecontrol(\'infopane\')">';
            }
            html = html + '<td><img height="24px" src="'+sources[history[i].source].icon+'" /></td>';
            html = html + '<td>';
            if (history[i].specials.artist) {
                html = html + history[i].specials.artist.name+'<br>';
            } else {
                html = html + 'Artist : '+history[i].playlistinfo.creator+'<br>';
            }
            if (history[i].specials.album) {
                html = html + history[i].specials.album.name+'<br>';
            } else {
                html = html + 'Album : '+history[i].playlistinfo.album+'<br>';
            }
            if (history[i].specials.track) {
                html = html + history[i].specials.track.name;
            } else {
                html = html + 'Track : '+history[i].playlistinfo.title;
            }
            html = html + '</td></tr>';
        }
        html = html + '</table>';
        if (mobile == "no") {
            html = html + '</li>';
        }
        $("#historypanel").html(html);
        html = null;
    }

    return {

        createButtons: function() {
            for (var i in sources) {
                debug.log("BROWSER", "Found plugin", i,sources[i].icon);
                if (mobile == "no") {
                    $("#chooserbuttons").append($('<img>', {
                        src: sources[i].icon,
                        onclick: "browser.switchsource('"+i+"')",
                        title: sources[i].text,
                        class: 'topimg sep dildo',
                        id: "button_source"+i
                    }));
                } else {
                    $("#chooser").append('<div class="chooser penbehindtheear"><a href="#" onclick="browser.switchsource(\''+i+'\');sourcecontrol(\'infopane\')">'+sources[i].text+'</a></div>');
                }
            }
            if (mobile == "no") {
                $("#button_source"+current_source).addClass("currentbun");
                $(".dildo").tipTip({delay: 1000});
            }
        },

        trackHasChanged: function(npindex, pinfo) {
            // Nowplaying is telling us the track has changed. Do we, or do we not, want to display it?
            debug.mark("BROWSER", "A new track has arrived",npindex);
            history.push({
                nowplayingindex: npindex,
                playlistinfo: pinfo,
                source: current_source,
                specials: {}
            });
            switch (true) {
                case (displaypointer < 0):
                    displaypointer = history.length - 1;
                    $("#button_source"+current_source).removeClass("currentbun");
                    current_source = history[displaypointer].source;
                    $("#button_source"+current_source).addClass("currentbun");
                    displayTheData(displaypointer, true, true, true);
                    break;

                case (displaypointer == history.length-2):
                    // We are showing the most recent entry, so accept the update
                    var compareartist1 = (pinfo.albumartist == "") ? pinfo.creator : pinfo.albumartist;
                    var compareartist2 = (history[displaypointer].playlistinfo.albumartist == "") ? history[displaypointer].playlistinfo.creator : history[displaypointer].playlistinfo.albumartist;
                    var showalbum = pinfo.album != history[displaypointer].playlistinfo.album || compareartist1 != compareartist2;
                    displaypointer = history.length-1;
                    displayTheData( displaypointer,
                                    (pinfo.creator != history[displaypointer-1].playlistinfo.creator),
                                    showalbum,
                                    (pinfo.title != history[displaypointer-1].playlistinfo.title || showalbum)
                    );
                    break;
            }
            updateHistory();
        },

        Update: function(type, source, nowplayingindex, data) {
            debug.mark("BROWSER", "Got",type,"info from",source,"for index",nowplayingindex);
            if (source == waitingon.source && nowplayingindex == waitingon.index && waitingon[type]) {
                debug.log("BROWSER", "  .. and we are going to display it");
                if (data.data !== null) {
                    $("#"+type+"information").html(banner(data, type, panelclosed[type], source)+data.data);
                } else {
                    $("#"+type+"information").html("");
                }
                waitingon[type] = false;
                return true;
            } else {
                return false;
            }
        },

        switchsource: function(src) {
            debug.log("BROWSER", "Source switched to",src);
            $("#button_source"+current_source).removeClass("currentbun");
            current_source = src;
            $("#button_source"+current_source).addClass("currentbun");
            prefs.save({infosource: current_source});
            if (displaypointer >= 0) {
                var p = history.length - 1;
                history.push({
                    nowplayingindex: history[p].nowplayingindex,
                    playlistinfo: history[p].playlistinfo,
                    source: current_source,
                    specials: {}
                });
                displaypointer = history.length-1;
                updateHistory();
                displayTheData(displaypointer, true, true, true);
            }
        },

        handleClick: function(source, element, event) {
            if (element.hasClass('frog')) {
                toggleSection(source);
            } else {
                nowplaying.clickPassThrough(
                    history[displaypointer].nowplayingindex,
                    history[displaypointer].source,
                    source,
                    element,
                    event
                );
            }
        },

        setPluginIcon: function(source, icon) {
            sources[source].icon = icon;
        },

        // This function is for links which are followed internally by one of the panels
        // eg wikipedia
        speciaUpdate: function(source, panel, data) {
            debug.mark("BROWSER","Special Update from",source,"for",panel);
            // We CLONE the HISTORY object but this DOES NOT clone the playlistinfo object
            // The reason for cloning the history objects is that we need a UNIQUE reference
            // to which special items this history element is displaying
            var p = cloneObject(history[displaypointer]);
            p.specials[panel] = data;
            history.splice(displaypointer+1,0,p);
            displaypointer++;
            updateHistory();
            switch (panel) {
                case "artist":
                    $("#artistinformation").html(banner(data, source, panelclosed.artist, source)+data.data);
                    break;

                case "album":
                    $("#albuminformation").html(banner(data, source, panelclosed.album, source)+data.data);
                    break;

                case "track":
                    $("#trackinformation").html(banner(data, source, panelclosed.track, source)+data.data);
                    break;
            }
            $("#infopane").scrollTo("#"+panel+"information");

        },

        doHistory: function(index) {
            debug.log("BROWSER", "Doing history, index is",index);
            var showartist = false;
            var showalbum = false;
            var showtrack = false;
            var compareartist1 = (history[index].playlistinfo.albumartist == "") ? history[index].playlistinfo.creator : history[index].playlistinfo.albumartist;
            var compareartist2 = (history[displaypointer].playlistinfo.albumartist == "") ? history[displaypointer].playlistinfo.creator : history[displaypointer].playlistinfo.albumartist;
            if (history[index].specials.artist) {
                $("#artistinformation").html(
                    banner(
                        history[index].specials.artist,
                        history[index].source,
                        panelclosed.artist,
                        history[index].source
                    )+history[index].specials.artist.data);
            } else {
                if (history[index].playlistinfo.creator != history[displaypointer].playlistinfo.creator ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].specials.artist)
                {
                    showartist = true;
                }
            }
            if (history[index].specials.album) {
                $("#albuminformation").html(
                    banner(
                        history[index].specials.album,
                        history[index].source,
                        panelclosed.album,
                        history[index].source
                    )+history[index].specials.album.data);
            } else {
                if (history[index].playlistinfo.album != history[displaypointer].playlistinfo.album ||
                    compareartist1 != compareartist2 ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].specials.album)
                {
                    showalbum = true;
                }
            }
            if (history[index].specials.track) {
                $("#trackinformation").html(
                    banner(
                        history[index].specials.track,
                        history[index].source,
                        panelclosed.track,
                        history[index].source
                    )+history[index].specials.track.data);
            } else {
                if (history[index].playlistinfo.title != history[displaypointer].playlistinfo.title ||
                    history[index].playlistinfo.album != history[displaypointer].playlistinfo.album ||
                    compareartist1 != compareartist2 ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].specials.track)
                {
                    showtrack = true;
                }
            }
            $("#button_source"+history[displaypointer].source).removeClass("currentbun");
            displaypointer = index;
            $("#button_source"+history[displaypointer].source).addClass("currentbun");
            debug.log("BROWSER","History flags are",showartist,showalbum,showtrack);
            displayTheData(displaypointer, showartist, showalbum, showtrack);
            updateHistory();
            $("#infopane").scrollTo("#artistinformation");
        },

        forward: function() {
            browser.doHistory(displaypointer+1);
            return false;
        },

        back: function() {
            browser.doHistory(displaypointer-1);
            return false;
        },

        thePubsCloseTooEarly: function() {
            /* nowplaying has truncated its history by removing the first one in its list.
             * This means that all of our stored indices are now out. We must remove any history
             * entries that have a nowplaying index of 1 */
            debug.log("INFO PANEL","Reducing the badger episodes becasue of too many carrots");
            var temp = history[displaypointer].source;
            var chop = 0;
            for (var i in history) {
                if (history[i].nowplayingindex == 1) {
                    chop++;
                }
            }
            if (chop > 0) {
                debug.debug("INFO PANEL","Removing",chop,"entries");
                history.splice(0,chop);
                displaypointer -= chop;
                // NOTE: This could make displaypointer negative... however this function gets called
                // just before nowplaying sends us a new track. trackHasChanged handles this situation
                // by making sure we display the new data. We CANNOT leave the user viewing data
                // that nowplaying has deleted, because the trackDataCollection objects no longer exist
                if (displaypointer < 0) {
                    $("#button_source"+temp).removeClass("currentbun");
                }
                for (var i in history) {
                    history[i].nowplayingindex = history[i].nowplayingindex - 1;
                }
                updateHistory();
            }
        },

        dumpHistory: function() {
            for (var i in history) {
                debug.log("HISTORY", history[i]);
            }
        }
    }
}();

function slideshow(images,target_frame,displaycontrols) {

    var self = this;
    var paused = false;
    var counter = -1;
    var timer_running = false;
    var timer = 0;
    var direction = 1;
    var running = true;
    var img = new Image();
    var elephant = null;
    var controls = null;
    var controlheight = 2;

    function setPauseButton() {
        if (paused) {
            $('#slidespause').attr("src", "newimages/play.png");
        } else {
            $('#slidespause').attr("src", "newimages/pause.png");
        }
    }

    this.Go = function() {
        debug.debug("SLIDESHOW","Starting Up",target_frame);
        if (displaycontrols && mobile == "no") {
            if (controls) {
                controls.remove();
            }
            controls = $('<table>', {class: "controlholder invisible", border: '0', cellpadding: '0', cellspacing: '0'}).appendTo($("#"+target_frame));
            controls.append('<tr><td align="center">'+
                            '<img class="clickicon" id="slidesback" src="newimages/backward.png">'+
                            '<img class="clickicon" id="slidespause" src="newimages/pause.png">'+
                            '<img class="clickicon" id="slidesforward" src="newimages/forward.png"></td></tr>');
            $("#"+target_frame).hover(function() { controls.fadeIn(500); }, function() { controls.fadeOut(500); });
            $('.clickicon').click(self.clickHandler);
            controlheight = 62;
        }
        if (elephant) {
            elephant.remove();
        }
        elephant = $('<img>', { style: "position:absolute" }).appendTo($("#"+target_frame));
        img.src="";
        img.onload = function() {
            debug.debug("SLIDESHOW","Next Image Loaded",target_frame);
            self.displayimage(paused);
        }

        img.onerror = function() {
            debug.debug("SLIDESHOW","Next Image Failed To Load",target_frame);
            self.cacheImage();
        }
        self.cacheImage();
        paused = false;
    }

    this.clickHandler = function(event) {
        var clickedelement = $(event.target);
        switch (clickedelement.attr('id')) {
            case 'slidesback':
                self.nextimage(-1);
                break;
            case 'slidesforward':
                self.nextimage(1);
                break;
            case 'slidespause':
                if (paused) {
                    self.unpause();
                } else {
                    self.pause();
                }
                setPauseButton();
                break;
        }
    }

    this.nextimage = function(dir) {
        if (direction != dir) {
            direction = dir;
            counter+=direction;
            self.cacheImage();
        }
        clearTimeout(timer);
        timer_running = false;
        self.displayimage(false);
    }

    this.timerExpiry = function() {
        timer_running = false;
        self.displayimage(paused);
    }

    this.killTimer = function() {
        clearTimeout(timer);
        timer_running = false;
    }

    this.pause = function() {
        debug.debug("SLIDESHOW","Pausing",target_frame);
        paused = true;
        self.killTimer();
    }

    this.unpause = function() {
        debug.debug("SLIDESHOW","UnPausing",target_frame);
        paused = false;
        self.displayimage(paused);
    }

    this.teardown = function() {
        self.killTimer();
        elephant.remove();
        if (controls !== null) { controls.remove() }
    }

    this.cacheImage = function() {
        counter += direction;
        if (counter >= images.length) { counter = 0; }
        if (counter < 0) { counter = images.length-1; }
        if (images[counter] != img.src) {
            img.src = images[counter];
            debug.debug("SLIDESHOW","Image Caching Started", img.src);
        }
    }

    this.displayimage = function(p) {
        if (!timer_running && img.complete && !p) {
            var windowheight = $("#"+target_frame).height();
            var windowwidth = $("#"+target_frame).width();
            var imageheight = img.height;
            var imagewidth = img.width;
            var displaywidth = imagewidth;
            var displayheight = imageheight;
            var ha = controlheight+8;
            var wa = 16;
            if (imageheight+ha > windowheight) {
                displayheight = windowheight-ha;
                displaywidth = imagewidth * (displayheight/imageheight);
            }
            if (displaywidth+wa > windowwidth) {
                displaywidth = windowwidth-wa;
                displayheight = imageheight * (displaywidth/imagewidth);
            }
            var left = Math.round((windowwidth-displaywidth)/2);
            var top = Math.round((windowheight-displayheight)/2);
            if (top < controlheight+4) {
                top = controlheight+4;
            }

            elephant.fadeOut(500, function() {

                    elephant.attr({ src: img.src,
                                    width:  parseInt(displaywidth),
                                    height: parseInt(displayheight) });
                    elephant.css("top", top+"px");
                    elephant.css("left", left+"px");

                    elephant.fadeIn(500, function() {self.cacheImage()});
            });

            if (!paused && images.length > 1) {
                timer = setTimeout( self.timerExpiry, 10000);
            }
            timer_running = true;
        }
    }
}

