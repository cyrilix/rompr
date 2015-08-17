var browser = function() {

    var history = [{
                    source: "",
                    artist: {
                        name: "",
                    },
                    album: {
                        name: "",
                        artist: "",
                    },
                    track: {
                        name: "",
                    }
                }];
    var displaypointer = 0;
    var panelclosed = {artist: false, album: false, track: false};
    var waitingon = {artist: false, album: false, track: false, index: -1, source: null};
    var extraPlugins = [];
    var maxhistorylength = 20;
    var sources = nowplaying.getAllPlugins();

    function displayTheData(ptr, showartist, showalbum, showtrack) {
        var a = waitingon.artist;
        var b = waitingon.album;
        var c = waitingon.track;
        waitingon = {   artist: a || showartist,
                        album:  b || showalbum,
                        track:  c || showtrack,
                        index: history[ptr].mastercollection.nowplayingindex,
                        source: history[ptr].source
        };
        debug.log("BROWSER", "Waiting on source",waitingon.source,"for index", waitingon.index);
        if (waitingon.source != prefs.infosource) {
            // Need to do this here rather than in switchsource otherwise it prevents
            // the browser from accepting the update
            $("#button_source"+prefs.infosource).removeClass("currentbun");
            prefs.save({infosource: waitingon.source});
            debug.log("BROWSER", "Source switched to",prefs.infosource);
            $("#button_source"+prefs.infosource).addClass("currentbun");
        }
        for (var i in waitingon) {
            if (waitingon[i] === true) {
                $("#"+i+"information").html(waitingBanner(i));
            }
        }
        for (var i = 1; i < history.length-1; i++) {
            history[i].mastercollection.stopDisplaying();
        }
        // Remember, here we tell artist, album, and track to display even if we only want one of them.
        // This is because we need the new collections to handle clicks and other stuff,
        // as otherwise it all gets very out of hand and impossible to follow,
        // mainly because it's super tricky to keep the stopDisplaying/displayData displaying flags
        // all in sync since they're global to one dataCollection and not individual for artist,
        // album, and track. (This was tried before and got stupid).
        history[ptr].mastercollection.sendDataToBrowser(waitingon);
        if (displaypointer == history.length-1) {
            // We only allow artist switching on the current playing track.
            // It's not that it doesn't work, but it means the artist switch gets added to
            // the end of history and then you have to go back to get to the current track,
            // which means things stop auto-updating.
            // Also it makes truncating the history really hard.
            // TODO perhaps artist switches should be spliced in?
            history[ptr].mastercollection.doArtistChoices();
        } else {
            if ($("#artistchooser").is(':visible')) {
                $("#artistchooser").slideUp('fast');
            }
        }

    }

    function waitingBanner(which) {
        var html = '<div class="containerbox infosection menuitem">';
        html += '<h2 class="expand"><span class="ucfirst">'+language.gettext("label_"+which)+
            '</span> : '+language.gettext("info_gettinginfo")+'</h2>';
        html += '<div class="fixed" style="vertical-align:middle">'+
            '<i class="icon-spin6 smallcover-svg spinner"></i></div>';
        html += '</div>';
        return html;
    }

    function banner(data, title, hidden, source, close) {
        var html = '<div class="containerbox infosection menuitem">';
        if (source) {
            html += '<h2 class="expand"><span class="ucfirst">'+
                language.gettext("label_"+title)+'</span> : ' + data.name + '</h2>';
        } else {
            html += '<h2 class="expand">' + data.name + '</h2>';
        }
        html += '<div class="fixed" style="vertical-align:middle;padding:12px">';
            // '<a href="#" class="infoclick frog">';
        html += '<i class="icon-menu topimg infoclick clickicon frog"></i>';
        html += '</div>';
        if (source) {
            if (data.link === null) {
                html += '<div class="fixed" style="vertical-align:middle"><i class="'+
                    sources[source].icon+' smallcover-svg"></i></div>';
            } else {
                html += '<div class="fixed" style="vertical-align:middle"><a href="'+
                    data.link + '" title="'+language.gettext("info_newtab")+'" target="_blank">'+
                    '<i class="'+sources[source].icon+' smallcover-svg"></i></a></div>';
            }
        } else if (close) {
            html += '<div class="fixed" style="vertical-align:middle">'+
                '<i class="icon-cancel-circled playlisticon infoclick clickicon tadpole"></i></div>';
        }
        html += '</div>';
        html += '<div class="foldup" id="'+title+'foldup"';
        if (hidden) {
            html += ' style="display:none"';
        }
        html += '>';
        return html;
    }

    function toggleSection(element) {
        var foldup = element.parent().parent().next();
        var section = element.parent().parent().parent().attr("id");
        $(foldup).slideToggle('slow', function() {
            if ($(this).is(':visible')) {
                browser.rePoint();
            }
        });
        section = section.replace(/information/,'');
        panelclosed[section] = !panelclosed[section];
    }

    function updateHistory() {

        if (displaypointer == 1) {
            $("#backbutton").unbind('click');
            $("#backbutton").addClass('button-disabled');
        }
        if (displaypointer > 1 && $("#backbutton").hasClass('button-disabled')) {
            $("#backbutton").click( browser.back );
            $("#backbutton").removeClass('button-disabled');
        }
        if (displaypointer == (history.length)-1) {
            $("#forwardbutton").unbind('click');
            $("#forwardbutton").addClass('button-disabled');
        }
        if (displaypointer < (history.length)-1 && $("#forwardbutton").hasClass('button-disabled')) {
            $("#forwardbutton").click( browser.forward );
            $("#forwardbutton").removeClass('button-disabled');
        }

        var html;
        var bits = ["artist","album","track"];
        html = '<div class="configtitle textcentre"><b>'+language.gettext("button_history")+'</b></div>';
        html += '<table class="histable" width="100%">';
        for (var i = 1; i < history.length; i++) {
            var clas="top";
            if (i == displaypointer) {
                clas = clas + " current";
            }
            html += '<tr class="'+clas+'" onclick="browser.doHistory('+i+')">';
            html += '<td><i class="'+sources[history[i].source].icon+' medicon"></i></td>';
            html += '<td>';
            bits.forEach(function(n) {
                if (history[i][n].collection) {
                    html += history[i][n].collection.bannername()+'<br />';
                } else {
                    html += language.gettext("label_"+n)+' : '+history[i][n].name+'<br>';
                }
            });
            html += '</td></tr>';
        }
        html += '</table>';
        $("#historypanel").html(html);
    }

    function removeSection(section) {
        extraPlugins[section].parent.close();
        extraPlugins[section].div.fadeOut('fast', function() {
            extraPlugins[section].div.empty();
            extraPlugins[section].div.remove();
            extraPlugins[section].div = null;
        });
    }

    function checkHistoryLength() {
        if (history.length > maxhistorylength) {
            debug.shout("BROWSER", "Truncating History");
            var np = history[1].mastercollection.nowplayingindex;
            history.splice(1,1);
            displaypointer--;
            for (var i = 1; i < history.length; i++) {
                // Scan our history to see if this nowplayingindex is being used anywhere else
                if (history[i].mastercollection.nowplayingindex == np) {
                    return;
                }
            }
            debug.log("BROWSER","Telling nowplaying to remove nowplayingindex",np);
            nowplaying.remove(np);
        }
    }

    return {

        areweatfront: function() {
            debug.log("BROWSER","displaypointer:",displaypointer,"historylength",history.length);
            return (displaypointer == history.length - 1);
        },

        createButtons: function() {
            for (var i in sources) {
                if (sources[i].icon !== null) {
                    debug.log("BROWSER", "Found plugin", i,sources[i].icon);
                    layoutProcessor.addInfoSource(i, sources[i]);
                }
            }
            layoutProcessor.setupInfoButtons();
        },

        nextSource: function(direction) {
            var s = new Array();
            for (var i in sources) {
                if (sources[i].icon !== null) {
                    s.push(i);
                }
            }
            var cursourceidx = s.indexOf(prefs.infosource);
            var newsourceidx = cursourceidx+direction;
            if (newsourceidx >= s.length) newsourceidx = 0;
            if (newsourceidx < 0) newsourceidx = s.length-1;
            browser.switchsource(s[newsourceidx]);
        },

        dataIsComing: function(mastercollection, isartistswitch, nowplayingindex, source, creator, artist, albumartist, album, track) {
            debug.log("BROWSER","Data is coming",isartistswitch, nowplayingindex, source, artist, albumartist, album, track)
            if (prefs.hidebrowser) {
                debug.log("BROWSER","Browser is hidden. Ignoring Data");
                return;
            }
            var showalbum  = (album != history[displaypointer].album.name || albumartist != history[displaypointer].album.artist || source != prefs.infosource);
            var showartist = (isartistswitch || artist != history[displaypointer].artist.name || source != prefs.infosource ||
                (showalbum && artist != history[displaypointer].artist.name));
            var showtrack  = (track != history[displaypointer].track.name || showalbum || source != prefs.infosource);

            checkHistoryLength();

            history.push( {
                mastercollection: mastercollection,
                source: source,
                creator: creator,
                artist: {
                    name: artist,
                    collection: null
                },
                album: {
                    name: album,
                    artist: albumartist,
                    collection: null
                },
                track: {
                    name: track,
                    collection: null
                }
            });

            // Display the new data only if either:
            //  We are currently displaying the most recent track (ie continuous updates)
            //  This is an artist switch request
            //  This is a source switch request
            //  History has been truncated such that the currently displayed info needs to be removed
            if (displaypointer == history.length - 2 || isartistswitch || source != prefs.infosource || displaypointer < 1) {
                displaypointer = history.length - 1;
                displayTheData( displaypointer,
                                showartist,
                                showalbum,
                                showtrack );
            }
            updateHistory();
        },

        Update: function(collection, type, source, nowplayingindex, data, scrollto, force) {
            if (prefs.hidebrowser) {
                return false;
            }
            debug.mark("BROWSER", "Got",type,"info from",source,"for index",nowplayingindex,force,waitingon);
            if (force === true || (source == waitingon.source && nowplayingindex == waitingon.index)) {
                if (force === true || waitingon[type]) {
                    debug.trace("BROWSER", "  .. and we are going to display it");
                    if (data.data !== null && (source == "file" || data.name !== "")) {
                        if ($("#"+type+"information").is(':hidden')) {
                            $("#"+type+"information").show();
                        }
                        $("#"+type+"information").html(banner(data, (collection === null) ? type : collection.bannertitle(), panelclosed[type], source)+data.data);
                        $("#"+type+"information").find("[title]").tipTip({delay:1000, edgeOffset: 8});
                    } else {
                        $("#"+type+"information").html("");
                        if ($("#"+type+"information").is(':visible')) {
                            $("#"+type+"information").hide();
                        }
                    }
                    waitingon[type] = false;
                    if (scrollto) {
                        layoutProcessor.goToBrowserPanel(type);
                    }
                    return true;
                } else {
                    return false;
                }
            }
        },

        reDo: function(index, source) {
            if (history[displaypointer].mastercollection && index == history[displaypointer].mastercollection.nowplayingindex && source == prefs.infosource) {
                debug.log("BROWSER","Re-displaying data for",source,"index",index);
                displayTheData(displaypointer, true, true, true);
            }
        },

        switchsource: function(src) {
            debug.log("BROWSER","Switching to",src);
            if (displaypointer >= 1) {
                displaypointer = history.length - 1;
                history[displaypointer].mastercollection.populate(src, true);
                updateHistory();
            }
        },

        handleClick: function(source, element, event) {
            debug.log("BROWSER","Was clicked on",source,element);
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
                    playlist.addItems(element, null);
                }
            } else if (element.hasClass('clickartistchoose')) {
                nowplaying.switchArtist(history[displaypointer].source, element.next().val());
            } else {
                history[displaypointer].mastercollection.handleClick(history[displaypointer].source, source, element, event);
            }
        },

        // This function is for links which are followed internally by one of the panels
        // eg wikipedia
        speciaUpdate: function(source, panel, data) {
            debug.mark("BROWSER","Special Update from",source,"for",panel);
            var n = new specialUpdateCollection(source, panel, data);

            history.splice(displaypointer+1,0, {
                mastercollection: history[displaypointer].mastercollection,
                source: source,
                creator: history[displaypointer].creator,
                artist: {
                    name: history[displaypointer].artist.name,
                    collection: (panel == "artist") ? n : history[displaypointer].artist.collection
                },
                album: {
                    name: history[displaypointer].album.name,
                    albumartist: history[displaypointer].albumartist,
                    collection: (panel == "album") ? n : history[displaypointer].album.collection
                },
                track: {
                    name: history[displaypointer].track.name,
                    collection: (panel == "track") ? n : history[displaypointer].track.collection
                }
            });

            waitingon[panel] = true;
            waitingon.source = source;
            waitingon.index = history[displaypointer].mastercollection.nowplayingindex;
            displaypointer++;
            updateHistory();
            browser.Update(n, panel, source, waitingon.index, data, true);
        },

        doHistory: function(index) {
            debug.log("BROWSER", "Doing history, index is",index);

            var showartist = (history[index].artist.collection === null &&
                (history[index].artist.name != history[displaypointer].artist.name ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].artist.collection !== null));

            var showalbum = (history[index].album.collection === null &&
                (history[index].album.name != history[displaypointer].album.name ||
                    history[index].album.artist != history[displaypointer].album.artist ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].album.collection !== null));

            var showtrack = (history[index].track.collection === null &&
                (history[index].track.name != history[displaypointer].track.name ||
                    history[index].album.name != history[displaypointer].album.name ||
                    history[index].album.artist != history[displaypointer].album.artist ||
                    history[index].source != history[displaypointer].source ||
                    history[displaypointer].track.collection !== null));

            displaypointer = index;
            debug.log("BROWSER","History flags are",showartist,showalbum,showtrack);
            // Calling displayTheData is important even if all the showxxx flags are false
            // since it makes sure the correct trackDataCollection gets its displaying flag set.
            displayTheData(displaypointer, showartist, showalbum, showtrack);
            updateHistory();

            var bits = ["artist","album","track"];
            bits.forEach(function(n) {
                if (history[index][n].collection) {
                    waitingon[n] = true;
                    waitingon.source = history[index].source;
                    waitingon.index = history[index].mastercollection.nowplayingindex;
                    browser.Update(history[index][n].collection, n, waitingon.source, waitingon.index, history[index][n].collection.getData());
                }
            });
            layoutProcessor.afterHistory();
        },

        forward: function() {
            browser.doHistory(displaypointer+1);
            return false;
        },

        back: function() {
            browser.doHistory(displaypointer-1);
            return false;
        },

        registerExtraPlugin: function(id, name, parent) {
            if (prefs.hidebrowser) {
                $("#hidebrowser").prop("checked", !$("#hidebrowser").is(':checked'));
                prefs.save({hidebrowser: $("#hidebrowser").is(':checked')}, hideBrowser);
            }
            var displayer = $('<div>', {id: id+"information", class: "infotext invisible"}).insertBefore('#artistinformation');
            displayer.html(banner({name: name}, id, false, false, true));
            panelclosed[id] = false;
            displayer.unbind('click');
            displayer.click(onBrowserClicked);
            displayer.dblclick(onBrowserDoubleClicked);
            extraPlugins[id] = { div: displayer, parent: parent };
            return displayer;
        },

        goToPlugin: function(id) {
            layoutProcessor.goToBrowserPlugin(id);
        },

        rePoint: function() {
            var w = $("#infopane").width();
            if (prefs.hidebrowser || w == 0) { return }
            var h = $(".masonified");
            if (h.length > 0) {
                var t = $(".tagholder");
                if (t.length == 1 || w < 500) {
                    t.css("width", "100%");
                } else if (t.length == 2 || w > 500 && w <= 1000) {
                    t.css("width", "50%");
                } else if (t.length == 3 || w > 1000 && w <= 1400) {
                    t.css("width", "33%");
                } else if (t.length == 4 || w > 1400 && w <= 1600) {
                    t.css("width", "25%");
                } else if (w > 1600) {
                    t.css("width", "20%");
                }
                h.masonry();
            }

            var h = $(".masonified2");
            if (h.length > 0) {
                var t = $(".tagholder2");
                var b = browser.calcMWidth();
                if (t.length == 1 || w < 350) {
                    t.css("width", "100%");
                } else if (t.length == 2 || w > 350 && w < 500) {
                    t.css("width", "50%");
                } else if (t.length == 3 || w > 500 && w <= 1000) {
                    t.css("width", "33%");
                } else if (t.length == 4 || w > 1000 && w <= 1400) {
                    t.css("width", "25%");
                } else if (t.length == 5 || w > 1400 && w <= 1600) {
                    t.css("width", "20%");
                } else if (w > 1600) {
                    t.css("width", "16.6%");
                }
                $(".masochist").attr("width", b);
                $(".masochist2").attr("width", b-24);
                h.masonry();
            }

            $.each($(".shrinker"), function(){
                var mw = $(this).attr("name");
                var cw = $(this).attr("width");
                var tw = w/layoutProcessor.shrinkerRatio;
                tw -= 48;
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
    }
}();

function specialUpdateCollection(source, panel, data) {

    this.bannertitle = function() {
        return source;
    }

    this.bannername = function() {
        return data.name;
    }

    this.getData = function() {
        return data;
    }

}