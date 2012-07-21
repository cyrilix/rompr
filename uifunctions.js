function reloadPlaylistControls() {
    $('#playlistcontrols').load('playlistcontrols.php');
}

function doCommand(div, url, command) {
    $('#'+div).load(url, command, function () {
        if (div == 'infopane') {
            $('#infopane').animate({ scrollTop: 0}, { duration: 'fast', easing: 'swing'});
        }
    });
}

function doMenu(item) {

    if ($('a[name|="'+item+'"]').html() == '<img src="images/toggle-closed.png">') {
        $('a[name|="'+item+'"]').html('<img src="images/toggle-open.png">');
        $('div[name|="'+item+'"]').find("#updateable").attr("src", function () {
            // The image doesn't have to exist because we have a custom redirect in place
            return $(this).attr("name");
        });
    } else {
        $('a[name|="'+item+'"]').html('<img src="images/toggle-closed.png">');
    }
    $('div[name|="'+item+'"]').slideToggle('fast');
}

function formatTimeString(duration) {
    if (duration > 0) {
        var mins=duration/60;
        var secs=duration%60;
        return parseInt(mins.toString()) + ":" + zeroPad(parseInt(secs.toString()),2);
    } else {
        return "Unknown";
    }
}

function changetheme() {
    $("#theme").attr({href: $("#themeselector").val()});
    savePrefs({theme: $("#themeselector").val()});
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


function expandInfo(side) {
    switch(side) {
        case "left":
            if (sourceshidden) {
                sourceshidden = false;
                if (playlisthidden) {
                    $("#infopane").css("width", "78%");
                    $("#infocontrols").css("width", "78%");
                } else {
                    $("#infopane").css("width", "56%");
                    $("#infocontrols").css("width", "56%");
                }
                $("#sources").toggle("fast");
                $("#expandleft").attr("src", "images/arrow-left-double.png");
                $("#albumcontrols").toggle("fast");
            } else {
                sourceshidden = true;
                $("#sources").toggle("fast");
                if (playlisthidden) {
                    $("#infopane").css("width", "100%");
                    $("#infocontrols").css("width", "100%");
                } else {
                    $("#infopane").css("width", "78%");
                    $("#infocontrols").css("width", "78%");
                }
                $("#expandleft").attr("src", "images/arrow-right-double.png");
                $("#albumcontrols").toggle("fast");
            }
            break;
        case "right":
            if (playlisthidden) {
                playlisthidden = false;
                if (sourceshidden) {
                    $("#infopane").css("width", "78%");
                    $("#infocontrols").css("width", "78%");
                } else {
                    $("#infopane").css("width", "56%");
                    $("#infocontrols").css("width", "56%");
                }
                $("#playlist").toggle("fast");
                $("#expandright").attr("src", "images/arrow-right-double.png");
                $("#playlistcontrols").toggle("fast");
            } else {
                playlisthidden = true;
                $("#playlist").toggle("fast");
                if (sourceshidden) {
                    $("#infopane").css("width", "100%");
                    $("#infocontrols").css("width", "100%");
                } else {
                    $("#infopane").css("width", "78%");
                    $("#infocontrols").css("width", "78%");
                }
                $("#expandright").attr("src", "images/arrow-left-double.png");
                $("#playlistcontrols").toggle("fast");
            }

    }

}

function lastfmlogin() {
    var user = $("#lastfmconfig").find('input[name|="user"]').attr("value");
    lastfm.login(user);
    $("#configpanel").fadeOut(1000);
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

function doASXStream(url, image) {
    doHourglass();
    $.ajax({
                type: "GET",
                url: "getASXStream.php",
                cache: false,
                contentType: "text/xml; charset=utf-8",
                data: {url: url, image: image},
                dataType: "xml",
                success: playlist.newLastFMRadioStation,
                error: function(data, status) { revertPointer(); }
    });
}

function doPLSStream(url, image, station) {
    doHourglass();
    $.ajax({
                type: "GET",
                url: "getPLSStream.php",
                cache: false,
                contentType: "text/xml; charset=utf-8",
                data: {url: url, image: image, station: encodeURIComponent(station)},
                dataType: "xml",
                success: playlist.newLastFMRadioStation,
                error: function(data, status) { revertPointer(); }
    });
}

function utf8_encode(s)
{
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
    doHourglass();
    var xspf = lastfm.radio.tune({station: url}, lastFMIsTuned, lastFMTuneFailed);
}

function lastFMIsTuned(data) {
    //debug.log("Tuned Last.FM", data);
    if (data && data.error) { lastFMTuneFailed(data); return false; };
    lastfm.radio.getPlaylist({discovery: 0, rtp: 1, bitrate: 128}, playlist.newLastFMRadioStation, lastFMTuneFailed);
}

function lastFMTuneFailed(data) {
    //debug.log("Tune failed", data);
    revertPointer();
    alert("Failed to tune Last.FM Radio Station");
}

function doHourglass() {
    $("body").css("cursor", "wait");
    $("a").css("cursor", "wait");
    $("button").css("cursor", "wait");
}

function revertPointer() {
    $("body").css("cursor", "auto");
    $("a").css("cursor", "auto");
    $("button").css("cursor", "auto");
}

function addLastFMTrack(artist, track) {
    //debug.log("Doing Last.FM Track Thing");
    lastfm.track.getInfo({track: track, artist: artist}, gotTrackInfoForStream, browser.gotFailure);
}

function gotTrackInfoForStream(data) {

    if (data.error) { return false };
    var url = "lastfm://play/tracks/"+data.track.id;
    lastfm.track.getPlaylist({url: url}, playlist.newLastFMRadioStation, lastFMTuneFailed);

}

function savePrefs(options) {
    $.post("saveprefs.php", options);
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

function getNeighbours() {

    if (!gotNeighbours) {
        doHourglass();
        lastfm.user.getNeighbours({user: lastfm.username()}, gotNeighbourData, gotNoNeighbours);
    } else {
        doMenu("neighbours");
    }

}

function getFriends() {

    if (!gotFriends) {
        doHourglass();
        lastfm.user.getFriends({user: lastfm.username()}, gotFriendsData, gotNoNeighbours);
    } else {
        doMenu("friends");
    }

}

function gotNoNeighbours(data) {
    revertPointer();
}

function toggleSearch() {
    $("#search").slideToggle('fast');
}

function toggleFileSearch() {
    $("#filesearch").slideToggle('fast');
}

function gotNeighbourData(data) {
    revertPointer();
    gotNeighbours = true;
    var html = "";
    if (data.neighbours.user) {
        var userdata = getArray(data.neighbours.user);
        html = html + '<table width="100%" cellpadding="0" cellspacing="2px">';
        for(var i in userdata) {
            html = html + '<td colspan="2"><h3>'+userdata[i].name+'</h3></td></tr>';
            html = html + '<tr><td rowspan="4" align="center"><a href="'+userdata[i].url+'" target="_blank"><img src="'+userdata[i].image[0]['#text']+'" style="vertical-align:middle" width="40px"></a></td>';

            html = html + '<td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmuser\', \''+userdata[i].name+'\')">&nbsp;Library Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmmix\', \''+userdata[i].name+'\')">&nbsp;Mix Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmrecommended\', \''+userdata[i].name+'\')">&nbsp;Recommended Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmneighbours\', \''+userdata[i].name+'\')">&nbsp;Neighbourhood Radio</a></td></tr>';

        }
        html = html + '</table>';
    }
    $('div[name="neighbours"]').html(html);
    doMenu("neighbours");
}

function gotFriendsData(data) {
    revertPointer();
    gotFriends = true;
    var html = "";
    if (data.friends.user) {
        var userdata = getArray(data.friends.user);
        html = html + '<table width="100%" cellpadding="0" cellspacing="2px">';
        for(var i in userdata) {
            html = html + '<td colspan="2"><h3>'+userdata[i].name+'</h3></td></tr>';
            html = html + '<tr><td rowspan="4" align="center"><a href="'+userdata[i].url+'" target="_blank"><img src="'+userdata[i].image[0]['#text']+'" style="vertical-align:middle" width="40px"></a></td>';

            html = html + '<td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmuser\', \''+userdata[i].name+'\')">&nbsp;Library Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmmix\', \''+userdata[i].name+'\')">&nbsp;Mix Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmrecommended\', \''+userdata[i].name+'\')">&nbsp;Recommended Radio</a></td></tr>';
            html = html + '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" onclick="doLastFM(\'lastfmneighbours\', \''+userdata[i].name+'\')">&nbsp;Neighbourhood Radio</a></td></tr>';

        }
        html = html + '</table>';
    }
    $('div[name="friends"]').html(html);
    doMenu("friends");
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

    debug.log("Loading Key Bindings");
    $.getJSON("getkeybindings.php")
        .done(function(data) {
            shortcut.add(getHotKey(data['nextrack']),   function(){ infobar.command('command=next') }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['prevtrack']),  function(){ infobar.command('command=previous') }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['stop']),       function(){ infobar.command('command=stop') }, {'disable_in_input':true});
            shortcut.add(getHotKey(data['play']),       function(){ infobar.playpausekey() }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumeup']),   function(){ infobar.volumeKey(5) }, {'disable_in_input':true} );
            shortcut.add(getHotKey(data['volumedown']), function(){ infobar.volumeKey(-5) }, {'disable_in_input':true} );
        })
        .fail( function(data) {  });
}

function getHotKey(st) {

    var bits = st.split("+++");
    debug.log("Hotkey is", bits[0]);
    return bits[0];

}

function getHotKeyDisplay(st) {

    var bits = st.split("+++");
    debug.log("Hotkey Display is", bits[1]);
    return bits[1];

}

function editkeybindings() {

    $("#configpanel").slideToggle('fast');

    $.getJSON("getkeybindings.php")
        .done(function(data) {
            var keybpu = popupWindow.create(500,300,"keybpu",true);
            $("#popupcontents").append('<table align="center" cellpadding="4" id="keybindtable" width="80%"></table>');
            $("#keybindtable").append('<tr><td align="center" colspan="2"><h2>Keyboard Shortcuts</h2></td></tr>');

            $("#keybindtable").append('<tr><td width="35%" align="right">Next Track</td><td>'+format_keyinput('nextrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Previous Track</td><td>'+format_keyinput('prevtrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Stop</td><td>'+format_keyinput('stop', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Play/Pause</td><td>'+format_keyinput('play', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Volume Up</td><td>'+format_keyinput('volumeup', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">Volume Down</td><td>'+format_keyinput('volumedown', data)+'</td></tr>');

            $("#keybindtable").append('<tr><td colspan="2"><button class="tleft sourceform" onclick="popupWindow.close()">Cancel</button>'+
                                        '<button class="tright sourceform" onclick="saveKeyBindings()">OK</button></td></tr>');

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

    debug.log("Key",key,"Pressed In",source);
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
        create:function(w,h,id,shrink) {
            if (popup == null) {
                popup = document.createElement('div');
                $(popup).addClass("popupwindow");
                document.body.appendChild(popup);
            }
            popup.setAttribute('id',id);
            $(popup).html('');
            popup.style.height = 'auto';
            $(popup).append('<div id="cheese"></div>');
            $("#cheese").append('<div class="tright"><a href="#" onclick="javascript:popupWindow.close()"><img src="images/edit-delete.png"></a></div>');
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
            var calcheight = $("#popupcontents").outerHeight(true)+18;
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
