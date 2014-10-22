var browser = function() {

    var current_source = prefs.infosource;
    var history = [];
    var displaypointer = -1;
    var panelclosed = {artist: false, album: false, track: false};
    var waitingon = {artist: false, album: false, track: false, index: -1, source: null};
    var extraPlugins = [];

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
        html = html + '<h3 class="expand ucfirst">'+language.gettext("label_"+which)+' : '+language.gettext("info_gettinginfo")+'</h3>';
        html = html + '<div class="fixed" style="vertical-align:middle"><img height="32px" src="newimages/waiter.png" class="spinner"></div>';
        html = html + '</div>';
        return html;
    }

    function banner(data, title, hidden, source, close) {
        var html = '<div class="containerbox infosection menuitem bordered">';
        if (source) {
            html = html + '<h2 class="expand"><span class="ucfirst">'+language.gettext("label_"+title)+'</span> : ' + data.name + '</h2>';
        } else {
            html = html + '<h2 class="expand">' + data.name + '</h2>';
        }
        html = html + '<div class="fixed" style="vertical-align:middle;padding:12px"><a href="#" class="infoclick frog">';
        if (hidden) {
            html = html + language.gettext("info_clicktoshow");
        } else {
            html = html + language.gettext("info_clicktohide");
        }
        html = html + '</a></div>';
        if (source) {
            if (data.link === null) {
                html = html + '<div class="fixed" style="vertical-align:middle"><img height="32px" src="'+sources[source].icon+'"></div>';
            } else {
                html = html + '<div class="fixed" style="vertical-align:middle"><a href="'+
                            data.link + '" title="'+language.gettext("info_newtab")+'" target="_blank"><img height="32px" src="'+sources[source].icon+'"></a></div>';
            }
        } else if (close) {
            html = html + '<div class="fixed" style="vertical-align:middle"><img class="infoclick clickicon tadpole" height="16px" src="'+ipath+'edit-delete.png"></div>';
        }
        html = html + '</div>';
        html = html + '<div class="foldup" id="'+title+'foldup"';
        if (hidden) {
            html = html + ' style="display:none"';
        }
        html = html + '>';
        return html;
    }

    function toggleSection(element) {
        var foldup = element.parent().parent().next();
        var section = element.parent().parent().parent().attr("id");
        $(foldup).slideToggle('slow');
        section = section.replace(/information/,'');
        panelclosed[section] = !panelclosed[section];
        if (panelclosed[section]) {
            $("#"+section+"information .frog").text(language.gettext("info_clicktoshow"));
        } else {
            $("#"+section+"information .frog").text(language.gettext("info_clicktohide"));
        }
    }

    function updateHistory() {

        if (displaypointer == 0) {
            $("#backbutton").unbind('click');
            $("#backbutton").attr("src", ipath+"backbutton_disabled.png");
        }
        if (displaypointer > 0 && $("#backbutton").attr("src")==ipath+"backbutton_disabled.png") {
            $("#backbutton").click( browser.back );
            $("#backbutton").attr("src", ipath+"backbutton.png");
        }
        if (displaypointer == (history.length)-1) {
            $("#forwardbutton").unbind('click');
            $("#forwardbutton").attr("src", ipath+"forwardbutton_disabled.png");
        }
        if (displaypointer < (history.length)-1 && $("#forwardbutton").attr("src")==ipath+"forwardbutton_disabled.png") {
            $("#forwardbutton").click( browser.forward );
            $("#forwardbutton").attr("src", ipath+"forwardbutton.png");
        }

        var html;
        if (mobile == "no") {
            html = '<li class="wider"><b>'+language.gettext("menu_history")+'</b></li><li class="wider">';
        } else {
            html = '<h3 align="center">'+language.gettext("menu_history")+'</h3>';
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
                html = html + language.gettext("label_artist")+' : '+history[i].playlistinfo.creator+'<br>';
            }
            if (history[i].specials.album) {
                html = html + history[i].specials.album.name+'<br>';
            } else {
                html = html + language.gettext("label_album")+' : '+history[i].playlistinfo.album+'<br>';
            }
            if (history[i].specials.track) {
                html = html + history[i].specials.track.name;
            } else {
                html = html + language.gettext("label_track")+' : '+history[i].playlistinfo.title;
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

    function removeSection(section) {
        extraPlugins[section].parent.close();
        extraPlugins[section].div.fadeOut('fast', function() {
            extraPlugins[section].div.empty();
            extraPlugins[section].div.remove();
            extraPlugins[section].div = null;
        });
    }

    return {

        createButtons: function() {
            for (var i in sources) {
                if (sources[i].icon !== null) {
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
            }
            if (mobile == "no") {
                $("#button_source"+current_source).addClass("currentbun");
                $(".dildo").tipTip({delay: 1000, edgeOffset: 8});
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
                    $("#"+type+"information").find("[title]").tipTip({delay:1000, edgeOffset: 8});
                } else {
                    $("#"+type+"information").html("");
                }
                waitingon[type] = false;
                return true;
            } else {
                return false;
            }
        },

        reDo: function(index, source) {
            if (index == history[displaypointer].nowplayingindex && source == current_source) {
                debug.log("BROWSER","Re-disaplying data for",source,"index",index);
                displayTheData(displaypointer, true, true, true);
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
                toggleSection(element);
            } else if (element.hasClass('tadpole')) {
                removeSection(source);
            } else if (element.hasClass('plugclickable')) {
                extraPlugins[source].parent.handleClick(element, event);
            } else if (element.hasClass('draggable')) {
                if (prefs.clickmode == "double") {
                    trackSelect(event, element);
                } else {
                    playlist.addtrack(element);
                }
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
            var sp;
            switch (panel) {
                case "artist":
                    sp = $("#artistinformation").position();
                    $("#artistinformation").html(banner(data, source, panelclosed.artist, source)+data.data);
                    $("#artistinformation").find("[title]").tipTip({delay:1000, edgeOffset: 8});
                    break;

                case "album":
                    sp = $("#albuminformation").position();
                    $("#albuminformation").html(banner(data, source, panelclosed.album, source)+data.data);
                    $("#albuminformation").find("[title]").tipTip({delay:1000, edgeOffset: 8});
                    break;

                case "track":
                    sp = $("#trackinformation").position();
                    $("#trackinformation").html(banner(data, source, panelclosed.track, source)+data.data);
                    $("#trackinformation").find("[title]").tipTip({delay:1000, edgeOffset: 8});
                    break;
            }
            if (mobile == "no") {
                $("#infopane").mCustomScrollbar("scrollTo",sp.top);
            } else {
                $("#infopane").scrollTo("#"+panel+"information");
            }
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
            if (mobile == "no") {
                $("#infopane").mCustomScrollbar("scrollTo",0);
            } else {
                $("#infopane").scrollTo("#artistinformation");
            }
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

        registerExtraPlugin: function(id, name, parent) {
            if (prefs.hidebrowser) {
                hideBrowser();
                $("#button_hide_browser").attr("checked", prefs.hidebrowser);
            }
            var displayer = $('<div>', {id: id+"information", class: "infotext invisible"}).insertBefore('#artistinformation');
            displayer.html(banner({name: name}, id, false, false, true));
            panelclosed[id] = false;
            displayer.unbind('click');
            displayer.click(onBrowserClicked);
            extraPlugins[id] = { div: displayer, parent: parent };
            return displayer;
        },

        goToPlugin: function(id) {
            if (mobile == "no") {
                $("#configpanel").slideToggle('fast');
                $("#infopane").mCustomScrollbar("scrollTo", "#"+id+"information");
            } else {
                sourcecontrol("infopane");
            }
        },

        rePoint: function() {

            var w = $("#infopane").width();
            var h = $(".masonified");
            if (h.length > 0) {
                if (w < 500) {
                    $(".tagholder").css("width", "100%");
                } else if (w > 500 && w <= 1000) {
                    $(".tagholder").css("width", "50%");
                } else if (w > 1000 && w <= 1400) {
                    $(".tagholder").css("width", "33%");
                } else if (w > 1400 && w <= 1600) {
                    $(".tagholder").css("width", "25%");
                } else if (w > 1600) {
                    $(".tagholder").css("width", "20%");
                }
                h.masonry();
            }

            var h = $(".masonified2");
            if (h.length > 0) {
                var b = browser.calcMWidth();
                if (w < 350) {
                    $(".tagholder2").css("width", "100%");
                } else if (w > 350 && w < 500) {
                    $(".tagholder2").css("width", "50%");
                } else if (w > 500 && w <= 1000) {
                    $(".tagholder2").css("width", "33%");
                } else if (w > 1000 && w <= 1400) {
                    $(".tagholder2").css("width", "25%");
                } else if (w > 1400 && w <= 1600) {
                    $(".tagholder2").css("width", "20%");
                } else if (w > 1600) {
                    $(".tagholder2").css("width", "16.6%");
                }
                $(".masochist").attr("width", b);
                $(".masochist2").attr("width", b-24);
                h.masonry();
            }

            $.each($(".shrinker"), function(){
                var mw = $(this).attr("name");
                var cw = $(this).attr("width");
                var tw = w/$(this).attr("thing");
                if (cw < tw) {
                    $(this).attr("width", tw);
                } else {
                    if (mw > tw && cw != mw) {
                        $(this).attr("width", tw);
                    }
                }
            });

        },

        calcMWidth: function() {
            var w = $("#infopane").width();
            var retval = w-64;
            if (w < 350) {
                retval = w-64
            } else if (w > 350 && w < 500) {
                retval = retval / 2;
            } else if (w > 500 && w <= 1000) {
                retval = retval / 3;
            } else if (w > 1000 && w <= 1400) {
                retval = retval / 4;
            } else if (w > 1400 && w <= 1600) {
                retval = retval / 5;
            } else if (w > 1600) {
                retval = retval / 6;
            }
            return retval;

        },

        dumpHistory: function() {
            for (var i in history) {
                debug.log("HISTORY", history[i]);
            }
        }
    }
}();
