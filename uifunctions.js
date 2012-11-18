function reloadPlaylistControls() {
    $('#playlistcontrols').load('playlistcontrols.php', function() {
        $("#playlistresizer").draggable({   containment: 'headerbar',
                                            axis: 'x'
        });
        $("#playlistresizer").bind("drag", function(event, ui){
            var size = getWindowSize();
            if ((size.x - ui.offset.left) < 120) { ui.offset.left = size.x - 120; }
            playlistwidthpercent = (((size.x - ui.offset.left))/size.x)*100;
            doThatFunkyThang();
            $(this).data('draggable').position.left = 0;
        });
        $("#playlistresizer").bind("dragstop", function(event, ui){
            debug.log("Saving playlist panel width");
            savePrefs({playlistwidthpercent: playlistwidthpercent.toString()})
        });        
    });
}

function setDraggable(element) {
    $(element).disableSelection();
    $(element).removeClass("nottweaked");
    $(element).draggable({  
                            connectToSortable: "#sortable",
                            addClasses: false,
                            helper: function(event) {
                                var dragger = document.createElement('div');
                                dragger.setAttribute("id", "dragger");
                                $(dragger).addClass("draggable dragsort");
                                if (!$(this).hasClass("selected")) {
                                    trackSelect(event, this);
                                }
                                $(".selected").clone().removeClass("selected").appendTo(dragger).children('td').removeAttr('width');
                                return dragger;
                            }
                        });
}

function doMenu(event, item) {

    event.stopImmediatePropagation();

    if ($('a[name|="'+item+'"]').html() == '<img src="images/toggle-closed.png">') {
        $('a[name|="'+item+'"]').html('<img src="images/toggle-open.png">');
        $('div[name|="'+item+'"]').children('div').children('table').find("#updateable").attr("src", function () {
            return $(this).attr("name");
        });
        $('div[name|="'+item+'"]').find(".nottweaked").each( function(index, element) {
            setDraggable(element);
        });
    } else {
        $('a[name|="'+item+'"]').html('<img src="images/toggle-closed.png">');
    }
    $('div[name|="'+item+'"]').slideToggle('fast');

}

function formatTimeString(duration) {
    if (duration > 0) {
        var secs=duration%60;
        var mins = (duration/60)%60;
        var hours = duration/3600;
        if (hours >= 1) {
            return parseInt(hours.toString()) + ":" + zeroPad(parseInt(mins.toString()), 2) + ":" + zeroPad(parseInt(secs.toString()),2);
        } else {
            return parseInt(mins.toString()) + ":" + zeroPad(parseInt(secs.toString()),2);
        }
    } else {
        return "Unknown";
    }
}

function changetheme() {
    $("#theme").attr({href: $("#themeselector").val()});
    savePrefs({theme: $("#themeselector").val()});
}

function toggleOption(thing) {
    var tocheck = (thing == "crossfade") ? "xfade" : thing;
    var new_value = (mpd.status[tocheck] == 0) ? 1 : 0;
    mpd.command("command="+thing+"&arg="+new_value);
    var options = new Object;
    options[thing] = new_value;
    savePrefs(options);
}

function setscrob(e) {
    var position = getPosition(e);
    var width = $('#scrobwrangler').width();
    var offset = $('#scrobwrangler').offset();
    scrobblepercent = ((position.x - offset.left)/width)*100;
    if (scrobblepercent < 50) { scrobblepercent = 50; }
    $('#scrobwrangler').progressbar("option", "value", parseInt(scrobblepercent.toString()));
    savePrefs({scrobblepercent: scrobblepercent});
}

function makeWaitingIcon(selector) {
    $("#"+selector).attr("src", "images/waiting2.gif");
}

function stopWaitingIcon(selector) {
    $("#"+selector).attr("src", "images/transparent-32x32.png");
}

function expandInfo(side) {
    switch(side) {
        case "left":
            if (sourceshidden) {
                sourceshidden = false;
                $("#expandleft").attr("src", "images/arrow-left-double.png");
            } else {
                sourceshidden = true;
                $("#expandleft").attr("src", "images/arrow-right-double.png");
            }
            break;
        case "right":
            if (playlisthidden) {
                playlisthidden = false;
                $("#expandright").attr("src", "images/arrow-right-double.png");
            } else {
                playlisthidden = true;
                $("#expandright").attr("src", "images/arrow-left-double.png");
            }
            break;
        case "both":
            sourceshidden = true;
            $("#expandleft").attr("src", "images/arrow-right-double.png");
            playlisthidden = true;
            $("#expandright").attr("src", "images/arrow-left-double.png");
            break;        

    }
    savePrefs({ sourceshidden: sourceshidden.toString(),
                playlisthidden: playlisthidden.toString()});
    doThatFunkyThang();

}

function doThatFunkyThang() {

    var sourcesweight = (sourceshidden) ? 0 : 1;
    var playlistweight = (playlisthidden) ? 0 : 1;
    var browserweight = (browser.hiddenState()) ? 0 : 1;

    var browserwidth = (100 - (playlistwidthpercent*playlistweight) - (sourceswidthpercent*sourcesweight))*browserweight;
    var sourceswidth = (100 - (playlistwidthpercent*playlistweight) - browserwidth)*sourcesweight;
    var playlistwidth = (100 - sourceswidth - browserwidth)*playlistweight;

    // debug.log("Widths:",sourceswidth,browserwidth,playlistwidth)
    $("#sources").css("width", sourceswidth.toString()+"%");
    $("#albumcontrols").css("width", sourceswidth.toString()+"%");
    $("#playlist").css("width", playlistwidth.toString()+"%");
    $("#pcholder").css("width", playlistwidth.toString()+"%");
    $("#infopane").css("width", browserwidth.toString()+"%");
    $("#infocontrols").css("width", browserwidth.toString()+"%");

    if (sourceshidden != $("#sources").is(':hidden')) {
        $("#sources").toggle("fast");
        $("#albumcontrols").toggle("fast");
    }

    if (playlisthidden != $("#playlist").is(':hidden')) {
        $("#playlist").toggle("fast");
        $("#playlistcontrols").toggle("fast");
    }

    if (browser.hiddenState() != $("#infopane").is(':hidden')) {
        $("#infopane").toggle("fast");
        $("#infocontrols").toggle("fast");
    }

}

function lastfmlogin() {
    var user = $("#configpanel").find('input[name|="user"]').attr("value");
    lastfm.login(user);
    $("#configpanel").fadeOut(1000);
}

function sethistorylength() {
    var length = $("#configpanel").find('input[name|="historylength"]').attr("value");
    max_history_length = parseInt(length);
    $("#configpanel").fadeOut(1000);
    savePrefs({historylength: max_history_length});    
}

function getArray(data) {
    try {
        switch (typeof data) {
            case "object":
                if (data.length) {
                    return data;
                } else {
                    return [data];
                }
                break;
            case "undefined":
                return [];
                break;
            default:
                return [data];
                break;
        }
    } catch(err) {
        return [];
    }
}

function doInternetRadio(input) {
    var url = $("#"+input).attr("value");
    getInternetPlaylist(url, null, null, null, true);
}

function getInternetPlaylist(url, image, station, creator, usersupplied) {
    playlist.waiting();
    data = {url: encodeURIComponent(url)};
    if (image) { data.image = encodeURIComponent(image) }
    if (station) { data.station = encodeURIComponent(station) }
    if (creator) { data.creator = encodeURIComponent(creator) }
    if (usersupplied) { data.usersupplied = "true" }

    $.ajax( {
        type: "GET",
        url: "getInternetPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: data,
        dataType: "xml",
        success: function(data) {
            playlist.newInternetRadioStation(data);
            if (usersupplied) {
                $("#yourradiolist").load("yourradio.php");
            }
        },
        error: function(data, status) { 
            playlist.repopulate();
            alert("Failed To Tune Radio Station"); 
        }
    } );
}

function addIceCast(name) {
    playlist.waiting();
    debug.log("Adding IceCast Station",name);
    $.ajax( {
        type: "GET",
        url: "getIcecastPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: {name: name},
        dataType: "xml",
        success: playlist.newInternetRadioStation,
        error: function(data, status) { 
            playlist.repopulate();
            alert("Failed To Tune Radio Station"); 
        }
    } );
}

function playUserStream(xspf) {
    playlist.waiting();
    $.ajax( {
        type: "GET",
        url: "getUserStreamPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: {name: xspf},
        dataType: "xml",
        success: playlist.newInternetRadioStation,
        error: function(data, status) { 
            playlist.repopulate();
            alert("Failed To Tune Radio Station"); 
        }
    } );
}

function removeUserStream(xspf) {
    $.ajax( {
        type: "GET",
        url: "getUserStreamPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: {remove: xspf},
        success: function(data, status) {
            $("#yourradiolist").load("yourradio.php");
        },
        error: function(data, status) { 
            playlist.repopulate();
            alert("Failed To Remove Station"); 
        }
    } );    
}

function utf8_encode(s) {
  return unescape(encodeURIComponent(s));
}

function doLastFM(station, value) {
    if(typeof value == "undefined") {
        value = $("#"+station).attr("value");
    }
    var url = "";
    switch (station) {
        case "lastfmuser":
            url = "lastfm://user/"+value+"/";
            break;
        case "lastfmmix":
            url = "lastfm://user/"+value+"/mix";
            break;
        case "lastfmrecommended":
            url = "lastfm://user/"+value+"/recommended";
            break;
        case "lastfmneighbours":
            url = "lastfm://user/"+value+"/neighbours";
            break;
        case "lastfmartist":
            url = "lastfm://artist/"+value+"/similarartists";
            break;
        case "lastfmfan":
            url = "lastfm://artist/"+value+"/fans";
            break;
        case "lastfmglobaltag":
            url = "lastfm://globaltags/"+value;
            break;
    }
    playlist.waiting();
    lfmprovider.getTracks(url, 5, -1, true, null);
}

function lastFMTuneFailed(data) {
    playlist.repopulate();
    alert("Failed to tune Last.FM Radio Station");
}

function addLastFMTrack(artist, track) {
    playlist.waiting();
    lastfm.track.getInfo({track: track, artist: artist}, gotTrackInfoForStream, lastFMTuneFailed);
}

function gotTrackInfoForStream(data) {
    if (data && data.error) { lastFMTuneFailed(data); return false };
    var url = "lastfm://play/tracks/"+data.track.id;
    lastfm.track.getPlaylist({url: url}, playlist.newInternetRadioStation, lastFMTuneFailed);

}

function scrobble() {
    if (!nowplaying.track.scrobbled) {
        if (nowplaying.track.name() != "" && nowplaying.artist.name() != "") {
            var options = { 
                timestamp: parseInt(nowplaying.track.starttime.toString()),
                track: nowplaying.track.name(),
                artist: nowplaying.artist.name(),
                album: nowplaying.album.name()
            };
            if (nowplaying.track.mpd_data.type == 'local') {
                options.chosenByUser = "1";
            } else {
                options.chosenByUser = "0";
            }
            debug.log("Scrobbling", options.track);
            lastfm.track.scrobble( options );
            nowplaying.track.scrobbled = true;
        }
    }
}

function updateNowPlaying() {
    if (!nowplaying.track.nowplaying_updated) {
        if (nowplaying.track.name() != "" && nowplaying.artist.name() != "") {
            debug.log("Updating Now Playing", nowplaying.track.name());
            lastfm.track.updateNowPlaying( { 
                track: nowplaying.track.name(), 
                album: nowplaying.album.name(),
                artist: nowplaying.artist.name()
            });
            nowplaying.track.nowplaying_updated = true;
        }
    }
}

function savePrefs(options) {
    $.post("saveprefs.php", options);
}

function togglePref(pref) {
    var prefobj = new Object;
    prefobj[pref] = ($("#"+pref).is(":checked")).toString();
    savePrefs( prefobj );
}


function getWikimedia(url) {
    var mousepos = getPosition();
    url = "http://en.wikipedia.org/w/api.php?action=query&iiprop=url|size&prop=imageinfo&titles=" + url + "&format=json&callback=?";
    $.getJSON(url, function(data) {
        $.each(data.query.pages, function(index, value) {
            var dimensions = imagePopup.create(value.imageinfo[0].width, value.imageinfo[0].height, mousepos.x, mousepos.y);
            imagePopup.contents('<img src="'+value.imageinfo[0].url+'" height="'+parseInt(dimensions.height)+'" width="'+parseInt(dimensions.width)+'">');
            imagePopup.show();
            return false;
        });
    });
}

function getNeighbours(event) {
    if (!gotNeighbours) {
        makeWaitingIcon("neighbourwait");
        lastfm.user.getNeighbours({user: lastfm.username()}, gotNeighbourData, gotNoNeighbours);
    }
    doMenu(event, "neighbours");
}

function getFriends(event) {
    if (!gotFriends) {
        makeWaitingIcon("freindswait");
        lastfm.user.getFriends({user: lastfm.username()}, gotFriendsData, gotNoFriends);
    }
    doMenu(event, "friends");
}

function gotNoNeighbours(data) {
    stopWaitingIcon("neighbourwait");
}

function gotNoFriends(data) {
    stopWaitingIcon("freindswait");
}

function toggleSearch() {
    $("#search").slideToggle('fast');
}

function toggleFileSearch() {
    $("#filesearch").slideToggle('fast');
}

function gotNeighbourData(data) {
    gotNeighbours = true;
    if (data.neighbours.user) {
        $('div[name="neighbours"]').html(getLfmPeople(data.neighbours));
    }
    stopWaitingIcon("neighbourwait");
}

function gotFriendsData(data) {
    gotFriends = true;
    var html = "";
    if (data.friends.user) {
        $('div[name="friends"]').html(getLfmPeople(data.friends));
    }
    stopWaitingIcon("freindswait");
}

function getLfmPeople(data) {
    var userdata = getArray(data.user);
    var html = '<table width="100%" class="filetable">';
    for(var i in userdata) {
        html = html + '<tr><td colspan="2" style="padding-top:8px"><b>'+userdata[i].name+'</b></td></tr>';
        html = html + '<tr><td rowspan="4" align="center"><a href="'+userdata[i].url+'" target="_blank"><img src="'+userdata[i].image[0]['#text']+'" style="vertical-align:middle" width="40px"></a></td>';

        html = html + '<td><a href="#" onclick="doLastFM(\'lastfmuser\', \''+userdata[i].name+'\')">&nbsp;Library Radio</a></td></tr>';
        html = html + '<tr><td><a href="#" onclick="doLastFM(\'lastfmmix\', \''+userdata[i].name+'\')">&nbsp;Mix Radio</a></td></tr>';
        html = html + '<tr><td><a href="#" onclick="doLastFM(\'lastfmrecommended\', \''+userdata[i].name+'\')">&nbsp;Recommended Radio</a></td></tr>';
        html = html + '<tr><td><a href="#" onclick="doLastFM(\'lastfmneighbours\', \''+userdata[i].name+'\')">&nbsp;Neighbourhood Radio</a></td></tr>';

    }
    html = html + '</table>';
    return html;
}

var imagePopup=function(){
    var wikipopup;
    var imagecontainer;
    var ie = document.all ? true : false;
    return {
        create:function(w,h,x,y){
            if(wikipopup == null){
                wikipopup = document.createElement('div');
                wikipopup.setAttribute('id',"wikipopup");
                wikipopup.setAttribute('onclick','imagePopup.close()');
                document.body.appendChild(wikipopup);

                imagecontainer = document.createElement('div');
                imagecontainer.setAttribute('onclick','imagePopup.close()');
                imagecontainer.setAttribute('id', "imagecontainer");
                document.body.appendChild(imagecontainer);
            }
            // Calculate popup size and position
            var width = w;
            var height = h;
            // Make sure it's not bigger than the window
            var winsize=getWindowSize();
            // Hack to allow for scrollbars
            winsize.x = winsize.x - 32;
            var scrollPos=getScrollXY();
            if (width+36 > winsize.x) {
                width = winsize.x-36;
                height = h * (width/w);
            }
            if (height+36 > winsize.y) {
                height = winsize.y-36;
                width = w * (height/h);
            }
            var top = (y - (height/2));
            var left = (x - (width/2));
            if ((left-scrollPos.x+width+18) > winsize.x) {
                left = winsize.x - width + scrollPos.x - 18;
            }
            if ((top-scrollPos.y+height+18) > winsize.y) {
                top = winsize.y - height + scrollPos.y - 18;
            }
            if (top-18 < scrollPos.y) {
                top = scrollPos.y+18;
            }
            if (left-18 < scrollPos.x) {
                left = scrollPos.x+18;
            }
            wikipopup.style.width = parseInt(width+36) + 'px';
            wikipopup.style.height = parseInt(height+36) + 'px';
            wikipopup.style.top = parseInt(top-18) + 'px';
            wikipopup.style.left = parseInt(left-18) + 'px';
            imagecontainer.style.top = parseInt(top) + 'px';
            imagecontainer.style.left = parseInt(left) + 'px';
            imagecontainer.style.width = parseInt(width) + 'px';
            imagecontainer.style.height = parseInt(height) + 'px';
            return({width: width, height: height});
        },
        contents:function(html) {
            $('#imagecontainer').html(html);
        },
        show:function() {
            $('#wikipopup').fadeIn('slow');
            $('#imagecontainer').fadeIn('slow');
        },
        close:function() {
            $('#wikipopup').fadeOut('slow');
            $('#imagecontainer').fadeOut('slow');
        }
    };
}();

function loadKeyBindings() {
    $.getJSON("getkeybindings.php")
        .done(function(data) {
            shortcut.add(getHotKey(data['nextrack']),   function(){ playlist.next() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['prevtrack']),  function(){ playlist.previous() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['stop']),       function(){ playlist.stop() }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['play']),       function(){ infobar.playbutton.clicked() }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumeup']),   function(){ infobar.volumeKey(5) }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumedown']), function(){ infobar.volumeKey(-5) }, {'disable_in_input':true} );
        })
        .fail( function(data) {  });
}

function getHotKey(st) {
    var bits = st.split("+++");
    return bits[0];
}

function getHotKeyDisplay(st) {
    var bits = st.split("+++");
    return bits[1];
}

function editkeybindings() {

    $("#configpanel").slideToggle('fast');

    $.getJSON("getkeybindings.php")
        .done(function(data) {
            var keybpu = popupWindow.create(500,300,"keybpu",true,"Keyboard Shortcuts");
            $("#popupcontents").append('<table align="center" cellpadding="4" id="keybindtable" width="80%"></table>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Next Track</td><td>'+format_keyinput('nextrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Previous Track</td><td>'+format_keyinput('prevtrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Stop</td><td>'+format_keyinput('stop', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Play/Pause</td><td>'+format_keyinput('play', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Volume Up</td><td>'+format_keyinput('volumeup', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Volume Down</td><td>'+format_keyinput('volumedown', data)+'</td></tr>');

            $("#keybindtable").append('<tr><td colspan="2"><button style="width:8em" class="tleft topformbutton" onclick="popupWindow.close()">Cancel</button>'+
                                        '<button  style="width:8em" class="tright topformbutton" onclick="saveKeyBindings()">OK</button></td></tr>');

            $(".buttonchange").keydown( function(ev) { changeHotKey(ev) } );
            popupWindow.open();
        })
        .fail( function(data) {  });

}

function format_keyinput(inpname, data) {
    return '<input id="'+inpname+'" class="tleft sourceform buttonchange" type="text" size="10" value="'+getHotKeyDisplay(data[inpname])+'"></input>' +
            '<input name="'+inpname+'" class="buttoncode" type="hidden" value="'+getHotKey(data[inpname])+'"></input>';
}

function changeHotKey(ev) {

    var key = ev.which;
    // Ignore Shift, Ctrl, Alt, and Meta, and Esc
    if (key == 17 || key == 18 || key == 19 || key == 27 || key == 224) {
        return true;
    }

    ev.preventDefault();
    ev.stopPropagation();
    var source = $(ev.target).attr("id");

    var special_keys = {
        9: 'tab',
        32: 'space',
        13: 'return',
        8: 'backspace',
        145: 'scrolllock',
        20: 'capslock',
        144: 'numlock',
        19: 'pause',
        45: 'insert',
        36: 'home',
        46: 'delete',
        35: 'end',
        33: 'pageup',
        34: 'pagedown',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        112: 'f1',
        113: 'f2',
        114: 'f3',
        115: 'f4',
        116: 'f5',
        117: 'f6',
        118: 'f7',
        119: 'f8',
        120: 'f9',
        121: 'f10',
        122: 'f11',
        123: 'f12'
    }

    var keystring = special_keys[key] || String.fromCharCode(key).toUpperCase();

    if (ev.shiftKey) { keystring = "Shift+"+keystring };
    if (ev.metaKey) { keystring = "Meta+"+keystring };
    if (ev.ctrlKey) { keystring = "Ctrl+"+keystring };
    if (ev.altKey) { keystring = "Alt+"+keystring };

    var keydisplay = KeyCode.hot_key(KeyCode.translate_event(ev));

    $("#"+source).attr("value", keydisplay);
    $('input[name="'+source+'"]').attr("value", keystring);
}

function saveKeyBindings() {

    var bindings = new Object;
    $.getJSON("getkeybindings.php")
        .done(function(data) {
            debug.log("Clearing Key Bindings");
            $.each(data, function(i, v) { shortcut.remove(v)});
            $(".buttonchange").each( function(i) {
                bindings[$(this).attr("id")] = $(this).attr("value");
            });
            $(".buttoncode").each( function(i) {
                bindings[$(this).attr("name")] = $(this).attr("value")+"+++"+bindings[$(this).attr("name")];
            });

            $.post("savekeybindings.php", bindings, function() {
                loadKeyBindings();
                popupWindow.close();
            });
        })
        .fail( function(data) {  });
}

var popupWindow = function() {

    var popup;
    var userheight;

    return {
        create:function(w,h,id,shrink,title) {
            if (popup == null) {
                popup = document.createElement('div');
                $(popup).addClass("popupwindow");
                document.body.appendChild(popup);
            }
            popup.setAttribute('id',id);
            $(popup).html('');
            popup.style.height = 'auto';
            $(popup).append('<div id="cheese"></div>');
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+title+
                '</h2></td><td align="right" width="30px"><a href="#" onclick="javascript:popupWindow.close()">'+
                '<img src="images/edit-delete.png"></a></td></tr></table>');
            $(popup).append('<div id="popupcontents"></div>');
            var winsize=getWindowSize();
            var windowScroll = getScrollXY();
            var width = winsize.x - 128;
            var height = winsize.y - 128;
            if (width > w) { width = w; }
            if (height > h) { height = h; }
            var x = (winsize.x - width)/2 + windowScroll.x;
            var y = (winsize.y - height)/2 + windowScroll.y;
            popup.style.width = parseInt(width) + 'px';
            userheight = height;
            if (!shrink) {
                popup.style.height = parseInt(height) + 'px';
            }
            popup.style.top = parseInt(y) + 'px';
            popup.style.left = parseInt(x) + 'px';
            return popup;
        },
        open:function() {
            $(popup).fadeIn('slow');
            var calcheight = $(popup).outerHeight(true);
            if (userheight > calcheight) {
                popup.style.height = parseInt(calcheight) + 'px';
            } else {
                popup.style.height = parseInt(userheight) + 'px';
            }
        },
        close:function() {
            $(popup).fadeOut('fast');
        }
    };
}();

function trackSelect(event, elem) {
    var hc = $(elem).hasClass("selected") ? true : false;
    var album = null;
    if ($(elem).hasClass("talbum")) {
        var link = $(elem).attr("ondblclick");
        var r = /playlist.addalbum\(\'(.*?)\'/;
        var result = r.exec(link);
        if (result && result[1]) {
            album = result[1];
        }
    }
    if ($(elem).hasClass("dir")) {
        album = $(elem).attr("name");
    }
    if (!event.metaKey && !event.ctrlKey) {
        $(".selected").removeClass("selected");
    }
    if (!hc) {
        $(elem).addClass("selected");
        if($(elem).hasClass("playlistrow1")) {
            $(elem).next().addClass("selected");
        }
        if($(elem).hasClass("playlistrow2")) {
            $(elem).prev().addClass("selected");
        }
        if (album) {
            $('div[name="'+album+'"]').find('tr').addClass("selected");
        }
    }
    if (hc && (event.metaKey || event.ctrlKey)) {
        $(elem).removeClass("selected");
        if($(elem).hasClass("playlistrow1")) {
            $(elem).next().removeClass("selected");
        }
        if($(elem).hasClass("playlistrow2")) {
            $(elem).prev().removeClass("selected");
        }
        if (album) {
            $('div[name="'+album+'"]').find('tr').removeClass("selected");
        }
    }
}

function clearPlaylist() {
    mpd.command('command=clear', playlist.repopulate);
    $("#clrplst").slideToggle('fast');
}
