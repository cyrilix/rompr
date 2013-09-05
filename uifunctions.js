
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
        return "";
    }
}

function changetheme() {
    $("#theme").attr({href: $("#themeselector").val()});
    prefs.save({theme: $("#themeselector").val()});
}

function changecountry() {
    prefs.save({lastfm_country_code: $("#countryselector").val()});
}

function changeClickPolicy() {
    prefs.save({clickmode: $('[name=clickselect]:checked').val()});
    setClickHandlers();
}

function setClickHandlers() {

    // Set up all our click event listeners

    $("#collection").unbind('click');
    $("#collection").unbind('dblclick');
    $("#filecollection").unbind('click');
    $("#filecollection").unbind('dblclick');
    $("#search").unbind('click');
    $("#search").unbind('dblclick');
    $("#filesearch").unbind('click');
    $("#filesearch").unbind('dblclick');
    $("#lastfmlist").unbind('click');
    $("#lastfmlist").unbind('dblclick');
    $("#radiolist").unbind('click');
    $("#radiolist").unbind('dblclick');

    $("#collection").click(onCollectionClicked);
    $("#filecollection").click(onFileCollectionClicked);
    $("#search").click(onCollectionClicked);
    $("#filesearch").click(onFileCollectionClicked);
    $("#lastfmlist").click(onLastFMClicked);
    $("#radiolist").click(onRadioClicked);

    if (prefs.clickmode == "double") {
        $("#collection").dblclick(onCollectionDoubleClicked);
        $("#filecollection").dblclick(onFileCollectionDoubleClicked);
        $("#search").dblclick(onCollectionDoubleClicked);
        $("#filesearch").dblclick(onCollectionDoubleClicked);
        $("#lastfmlist").dblclick(onLastFMDoubleClicked);
        $("#radiolist").dblclick(onRadioDoubleClicked);
    }
}

function setscrob(e) {
    var position = getPosition(e);
    var width = $('#scrobwrangler').width();
    var offset = $('#scrobwrangler').offset();
    var scrobblepercent = ((position.x - offset.left)/width)*100;
    if (scrobblepercent < 50) { scrobblepercent = 50; }
    scrobwrangler.setProgress(scrobblepercent);
    prefs.save({scrobblepercent: scrobblepercent});
    return false;
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
            var p = !prefs.sourceshidden;
            prefs.save({sourceshidden: p});
            break;
        case "right":
            var p = !prefs.playlisthidden;
            prefs.save({playlisthidden: p});
            break;
    }
    doThatFunkyThang();
    return false;

}

function doThatFunkyThang() {

    if (mobile == "no") {
        var sourcesweight = (prefs.sourceshidden) ? 0 : 1;
        var playlistweight = (prefs.playlisthidden) ? 0 : 1;
        var browserweight = (prefs.hidebrowser) ? 0 : 1;

        var browserwidth = (100 - (prefs.playlistwidthpercent*playlistweight) - (prefs.sourceswidthpercent*sourcesweight))*browserweight;
        var sourceswidth = (100 - (prefs.playlistwidthpercent*playlistweight) - browserwidth)*sourcesweight;
        var playlistwidth = (100 - sourceswidth - browserwidth)*playlistweight;

        $("#sources").css("width", sourceswidth.toString()+"%");
        $("#albumcontrols").css("width", sourceswidth.toString()+"%");
        $("#playlist").css("width", playlistwidth.toString()+"%");
    //     $("#pcholder").css("width", playlistwidth.toString()+"%");
        $("#playlistcontrols").css("width", playlistwidth.toString()+"%");
        $("#infopane").css("width", browserwidth.toString()+"%");
        $("#infocontrols").css("width", browserwidth.toString()+"%");

        if (prefs.sourceshidden != $("#sources").is(':hidden')) {
            $("#sources").toggle("fast");
            $("#albumcontrols").toggle("fast");
        }

        if (prefs.playlisthidden != $("#playlist").is(':hidden')) {
            $("#playlist").toggle("fast");
            $("#playlistcontrols").toggle("fast");
        }

        if (prefs.hidebrowser != $("#infopane").is(':hidden')) {
            $("#infopane").toggle("fast");
            $("#infocontrols").toggle("fast");
        }

        var i = (prefs.sourceshidden) ? "images/arrow-right-double.png" : "images/arrow-left-double.png";
        $("#expandleft").attr("src", i);
        i = (prefs.playlisthidden) ? "images/arrow-left-double.png" : "images/arrow-right-double.png";
        $("#expandright").attr("src", i);
    }
}

function setBottomPaneSize() {
    var ws = getWindowSize();
    if (mobile != "no") {
        if (itisbigger) {
            var newheight = ws.y-36;
        } else {
            var newheight = ws.y - 116;
        }
        var gibbon = ws.x-136;
        $("#nowplaying").css('width', gibbon.toString()+"px");
        var oldls = landscape;
        if (ws.x > ws.y) {
            landscape = prefs.twocolumnsinlandscape;
            $("#playinginfo").show();
        } else {
            landscape = false;
            $("#playinginfo").hide();
        }
        if (oldls != landscape) {
            switchColumnMode(landscape);
            sourcecontrol(prefs.chooser);
        }
        var v = newheight - 32;
        $("#volumecontrol").css("height", v.toString()+"px");
        infobar.setVolumeState(prefs.volume);
    } else {
        var newheight = ws.y - 148;
        var notpos = ws.x - 340;
        var lp = ws.x - 362;
        var dd = lp -156;
        $('#patrickmoore').css("width", lp.toString()+"px");
        $('#nowplaying').css("width", dd.toString()+"px");
        $("#notifications").css("left", notpos.toString()+"px");
    }
    $("#bottompage").css("height", newheight.toString()+"px");
    newheight -= $("#horse").height();
    if ($("#playlistbuttons").is(":visible")) {
        newheight -= $("#playlistbuttons").height();
    }
    $("#pscroller").css("height", newheight.toString()+"px");

    browser.drawSCWaveform();
}

function togglePlaylistButtons() {
    $("#playlistbuttons").slideToggle('fast', setBottomPaneSize);
    var p = !prefs.playlistcontrolsvisible;
    prefs.save({ playlistcontrolsvisible: p });
    return false;
}

function switchColumnMode(flag) {
    if (flag) {
        $("#sources").css({'width' : '50%', 'float' : 'left'});
        $("#playlistm").css({'width' : '50%', 'float' : 'right'});
        $("#playlistm").show();
        $("#sources").show();
        if (prefs.chooser == "playlistm") {
            prefs.chooser = "albumlist";
        }
        $("#chooseplaylist").hide();
    } else {
        $("#sources").css({'width' : '100%', 'float' : 'none'});
        $("#playlistm").css({'width' : '100%', 'float' : 'none'});
        if (prefs.chooser == "playlistm") {
            $("#playlistm").show();
            $("#sources").hide();
        } else {
            $("#playlistm").hide();
            $("#sources").show();
        }
        $("#chooseplaylist").show();
    }
}

function lastfmlogin() {
    var user = $("#configpanel").find('input[name|="user"]').attr("value");
    lastfm.login(user);
    $("#configpanel").fadeOut(1000);
}

// function sethistorylength() {
//     var length = parseInt($("#configpanel").find('input[name|="historylength"]').attr("value"));
//     $("#configpanel").fadeOut(1000);
//     prefs.save({historylength: length});
// }

function setAutoTag() {
    $("#configpanel").fadeOut(1000);
    prefs.save({autotagname: $("#configpanel").find('input[name|="taglovedwith"]').attr("value")});
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
    getInternetPlaylist($("#"+input).attr("value"), null, null, null, true);
}

function getInternetPlaylist(url, image, station, creator, usersupplied) {
    debug.log("GENERAL","Getting Internet Playlist",url, image, station, creator, usersupplied);
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
            if (!prefs.hide_radiolist) {
                $("#yourradiolist").load("yourradio.php",
                    function() { saveRadioOrder() });
            }
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
        case "lastfmloved":
            url = "lastfm://globaltags/"+$('input[name="taglovedwith"]').attr("value");
            break;
    }
    playlist.waiting();
    lfmprovider.getTracks(url, 5, -1, true, null);
}

function lastFMTuneFailed(data) {
    playlist.repopulate();
    infobar.notify(infobar.ERROR, "Failed to tune Last.FM Radio Station : "+$(data).find('error').text());
}

function lastFMTrackFailed(data) {
    playlist.repopulate();
    infobar.notify(infobar.ERROR, "Failed to get Last.FM playlist : "+data.error);
}

function addLastFMTrack(artist, track) {
    debug.log("Adding Last.FM track",track,"by",artist);
    playlist.waiting();
    lastfm.track.getInfo({track: decodeURIComponent(track), artist: decodeURIComponent(artist)}, gotTrackInfoForStream, lastFMTrackFailed);
}

function gotTrackInfoForStream(data) {
    debug.log("Got Track Info For Stream",data);
    if (data && data.error) { lastFMTrackFailed(data); return false };
    var url = "lastfm://play/tracks/"+data.track.id;
    lastfm.track.getPlaylist({url: url}, playlist.newInternetRadioStation, lastFMTuneFailed);

}

function togglePref(pref) {
    var prefobj = new Object;
    prefobj[pref] = ($("#"+pref).is(":checked"));
    prefs.save( prefobj );
    if (pref == 'downloadart') {
        coverscraper.toggle($("#"+pref).is(":checked"));
    } else if (pref == 'twocolumnsinlandscape') {
        setBottomPaneSize();
    }
}

function getWikimedia(event) {
    event.stopImmediatePropagation();
    var mousepos = getPosition(event);
    var url = "http://en.wikipedia.org/w/api.php?action=query&iiprop=url|size&prop=imageinfo&titles=" + event.currentTarget.getAttribute('name') + "&format=json&callback=?";
    $.getJSON(url, function(data) {
        $.each(data.query.pages, function(index, value) {
            var dimensions = imagePopup.create(value.imageinfo[0].width, value.imageinfo[0].height, mousepos.x, mousepos.y);
            imagePopup.contents('<img src="'+value.imageinfo[0].url+'" height="'+parseInt(dimensions.height)+'" width="'+parseInt(dimensions.width)+'">');
            imagePopup.show();
            return false;
        });
    });
    return false;
}

function getNeighbours(event) {
    if (!gotNeighbours) {
        makeWaitingIcon("neighbourwait");
        lastfm.user.getNeighbours({user: lastfm.username()}, gotNeighbourData, gotNoNeighbours);
    }
}

function getFriends(event) {
    if (!gotFriends) {
        makeWaitingIcon("freindswait");
        lastfm.user.getFriends({user: lastfm.username()}, gotFriendsData, gotNoFriends);
    }
}

function getTopTags(event) {
    if (!gotTopTags) {
        makeWaitingIcon("toptagswait");
        lastfm.user.getTopTags({user: lastfm.username()}, gotTopTagsData, gotNoTopTags);
    }
}

function getTopArtists(event) {
    if (!gotTopArtists) {
        makeWaitingIcon("topartistswait");
        lastfm.user.getTopArtists({user: lastfm.username()}, gotTopArtistsData, gotNoTopArtists);
    }
}

function gotNoNeighbours(data) {
    stopWaitingIcon("neighbourwait");
    infobar.notify(infobar.NOTIFY, "Didn't find any neighbours");
}

function gotNoFriends(data) {
    stopWaitingIcon("freindswait");
    infobar.notify(infobar.NOTIFY, "You have 0 friends");
}

function gotNoTopTags(data) {
    stopWaitingIcon("toptagswait");
    infobar.notify(infobar.NOTIFY, "Didn't find any top tags");
}

function gotNoTopArtists(data) {
    stopWaitingIcon("topartistswait");
    infobar.notify(infobar.NOTIFY, "Didn't find any top artists");
}

function toggleSearch() {
    $("#search").slideToggle('fast');
    return false;
}

function toggleFileSearch() {
    $("#filesearch").slideToggle('fast');
    return false;
}

function gotTopTagsData(data) {
    gotTopTags = true;
    stopWaitingIcon("toptagswait");
    var tagdata = getArray(data.toptags.tag);
    var html = "";
    for (var i in tagdata) {
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmglobaltag" username="'+tagdata[i].name+'">';
        html = html + '<div class="playlisticon fixed"><img width="16px" src="images/lastfm.png" /></div>';
        html = html + '<div class="expand indent">'+tagdata[i].name+'&nbsp;('+tagdata[i].count+')</div>';
        html = html + '</div>';
    }
    $("#lfmtoptags").html(html);
    html = null;
}

function gotTopArtistsData(data) {
    gotTopArtists = true;
    stopWaitingIcon("topartistswait");
    var artistdata = getArray(data.topartists.artist);
    var html = "";
    for (var i in artistdata) {
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmartist" username="'+artistdata[i].name+'">';
        html = html + '<div class="playlisticon fixed"><img width="16px" src="images/lastfm.png" /></div>';
        html = html + '<div class="expand indent">'+artistdata[i].name+'&nbsp;('+artistdata[i].playcount+' plays)</div>';
        html = html + '</div>';
    }
    $("#lfmtopartists").html(html);
    html = null;
}

function gotNeighbourData(data) {
    gotNeighbours = true;
    if (data.neighbours.user) {
        var html = getLfmPeople(data.neighbours, "lfmn");
        $('#lfmneighbours').html(html);
        html = null;
    }
    stopWaitingIcon("neighbourwait");
}

function gotFriendsData(data) {
    gotFriends = true;
    if (data.friends.user) {
        var html = getLfmPeople(data.friends, "lfmf");
        $("#lfmfriends").html(html);
        html = null;
    }
    stopWaitingIcon("freindswait");
}

function getLfmPeople(data, prefix) {
    var userdata = getArray(data.user);
    var html = "";
    var count = 0;
    for(var i in userdata) {
        html = html + '<div class="containerbox menuitem">';
        html = html + '<div class="mh fixed"><img src="images/toggle-closed-new.png" class="menu fixed" name="'+prefix+count.toString()+'" /></div>';
        if (userdata[i].image[0]['#text'] != "") {
            html = html + '<div class="smallcover fixed"><img class="smallcover fixed clickable clickicon clicklfmuser" name="'+userdata[i].name+'" src="'+userdata[i].image[0]['#text']+'" /></div>';
        } else {
            html = html + '<div class="smallcover fixed"><img class="smallcover fixed clickable clickicon clicklfmuser" name="'+userdata[i].name+'" src="images/album-unknown-small.png" /></div>';
        }
        html = html + '<div class="expand">'+userdata[i].name+'</div>';
        html = html + '</div>';
        html = html + '<div id="'+prefix+count.toString()+'" class="dropmenu">';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmuser" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">Library Radio</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmmix" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">Mix Radio</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfrecommended" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">Recommended Radio</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmneighbours" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">Neighbourhood Radio</div>';
        html = html + '</div>';
        html = html + '</div>';
        count++;
    }
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
            shortcut.add(getHotKey(data['stop']),       function(){ player.controller.stop() }, {'disable_in_input':true});
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
        .fail( function() { alert("Failed To Read Key Bindings!") });

}

function editmpdoutputs() {

    $("#configpanel").slideToggle('fast');

    $.getJSON("getaudiooutputs.php")
        .done(function(data) {
            var audiopu = popupWindow.create(500,300,"audiopu",true,"Audio Outputs");
            $("#popupcontents").append('<table align="center" cellpadding="4" id="outputtable" width="80%"></table>');
            for (var i in data) {
                $("#outputtable").append('<tr><td width="50%" align="right">'+data[i].outputname+'</td><td>'+format_outputswitch(data[i].outputenabled, data[i].outputid)+'</td></tr>');
            }
            $("#outputtable").append('<tr><td colspan="2"><button  style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></td></tr>');
            popupWindow.open();
        })
        .fail( function() { alert("Failed To Get Audio Outputs From MPD!") });

}

function format_keyinput(inpname, data) {
    return '<input id="'+inpname+'" class="tleft sourceform buttonchange" type="text" size="10" value="'+getHotKeyDisplay(data[inpname])+'"></input>' +
            '<input name="'+inpname+'" class="buttoncode" type="hidden" value="'+getHotKey(data[inpname])+'"></input>';
}

function format_outputswitch(enabled, id) {
    if (enabled == 0) {
        return '<img src="images/button-off.png" id="outputbutton'+id+'" onclick="outputswitch(\''+id+'\')" class="togglebutton clickicon" />';
    } else {
        return '<img src="images/button-on.png" id="outputbutton'+id+'" onclick="outputswitch(\''+id+'\')" class="togglebutton clickicon" />';
    }
}

function outputswitch(id) {
    debug.log("GENERAL       : Output Switch for output",id);
    if ($('#outputbutton'+id).attr("src") == "images/button-off.png") {
        $('#outputbutton'+id).attr("src", "images/button-on.png");
        player.mpd.command("command=enableoutput&arg="+id);
    } else {
        $('#outputbutton'+id).attr("src", "images/button-off.png");
        player.mpd.command("command=disableoutput&arg="+id);
    }
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
            debug.log("GENERAL","Clearing Key Bindings");
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
    var wantedwidth;
    var wantedheight;
    var wantshrink;

    return {
        create:function(w,h,id,shrink,title) {
            if (popup == null) {
                popup = document.createElement('div');
                $(popup).addClass("popupwindow");
                document.body.appendChild(popup);
            }
            $(popup).empty();
            wantedwidth = w;
            wantedheight = h;
            wantshrink = shrink;
            popup.setAttribute('id',id);
            popup.style.height = 'auto';
            $(popup).append('<div id="cheese"></div>');
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+title+
                '</h2></td><td align="right" width="30px">'+
                '<img class="clickicon" onclick="popupWindow.close()" src="images/edit-delete.png"></td></tr></table>');
            $(popup).append('<div id="popupcontents"></div>');
            var winsize=getWindowSize();
            var windowScroll = getScrollXY();
            if (mobile == "no") {
                var width = winsize.x - 128;
                var height = winsize.y - 128;
            } else {
                var width = winsize.x - 8;
                var height = winsize.y - 8;
            }
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
            $(popup).show();
            var calcheight = $(popup).outerHeight(true);
            if (userheight > calcheight) {
                popup.style.height = parseInt(calcheight) + 'px';
                $("#popupcontents").css("height", parseInt(calcheight - $("#cheese").height()) + 'px');
            } else {
                popup.style.height = parseInt(userheight) + 'px';
                $("#popupcontents").css("height", parseInt(userheight - $("#cheese").height()) + 'px');
            }
        },
        close:function() {
            $(popup).hide();
        },
        setsize:function() {
            var winsize=getWindowSize();
            var windowScroll = getScrollXY();
            if (mobile == "no") {
                var width = winsize.x - 128;
                var height = winsize.y - 128;
            } else {
                var width = winsize.x - 8;
                var height = winsize.y - 8;
            }
            if (width > wantedwidth) { width = wantedwidth; }
            if (height > wantedheight) { height = wantedheight; }
            var x = (winsize.x - width)/2 + windowScroll.x;
            var y = (winsize.y - height)/2 + windowScroll.y;
            popup.style.width = parseInt(width) + 'px';
            userheight = height;
            if (!wantshrink) {
                popup.style.height = parseInt(height) + 'px';
            }
            popup.style.top = parseInt(y) + 'px';
            popup.style.left = parseInt(x) + 'px';
        }
    };
}();

function albumSelect(event, element) {

    // Is the clicked element currently selected?
    var is_currently_selected = element.hasClass("selected") ? true : false;

    // Unselect all selected items if Ctrl or Meta is not pressed
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        $(".selected").removeClass("selected");
        // If we've clicked a selected item without Ctrl or Meta,
        // then all we need to do is unselect everything. Nothing else to do
        if (is_currently_selected) {
            return 0;
        }
    }

    if (event.shiftKey && last_selected_element !== null) {
        selectRange(last_selected_element, element);
    }

    var div_to_select = element.attr("name");
    debug.log("GENERAL","Albumselect Looking for div",div_to_select);
    if (is_currently_selected) {
        element.removeClass("selected");
        last_selected_element = element;
        $("#"+div_to_select).find(".clickable").each(function() {
            $(this).removeClass("selected");
            last_selected_element = $(this);
        });
    } else {
        element.addClass("selected");
        last_selected_element = element;
        $("#"+div_to_select).find(".clickable").each(function() {
            $(this).addClass("selected");
            last_selected_element = $(this);
        });
    }


}

function trackSelect(event, element) {

    // Is the clicked element currently selected?
    var is_currently_selected = element.hasClass("selected") ? true : false;

    // Unselect all selected items if Ctrl or Meta is not pressed
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        $(".selected").removeClass("selected");
        // If we've clicked a selected item without Ctrl or Meta,
        // then all we need to do is unselect everything. Nothing else to do
        if (is_currently_selected) {
            return 0;
        }
    }

    if (event.shiftKey && last_selected_element !== null) {
        selectRange(last_selected_element, element);
    }

   if (is_currently_selected) {
        element.removeClass("selected");
    } else {
        element.addClass("selected");
    }

    last_selected_element = element;

}

function selectRange(first, last) {
    debug.log("GENERAL","Selecting a range between:",first.attr("name")," and ",last.attr("name"));
    var target = null;
    var done = false;
    $.each($('#collection .clickable'), function() {
        if ($(this).attr("name") == first.attr("name") && target === null) {
            target = last;
        }
        if ($(this).attr("name") == last.attr("name") && target === null) {
            target = first;
        }
        if (target !== null && $(this).attr("name") == target.attr("name")) {
            done = true;
        }
        if (!done && target !== null && !$(this).hasClass('selected')) {
            $(this).addClass('selected');
        }
    });
}


function clearPlaylist() {
    player.controller.clearPlaylist();
    $("#clrplst").slideToggle('fast');
}

function onStorageChanged(e) {

    if (e.key == "key" && e.newValue != "Blerugh") {
        var key = e.newValue;
        debug.log("GENERAL","Updating album image for key",key,e);
        if (key.substring(0,1) == "!") {
            key = key.substring(1,key.length);
            $('img[name="'+key+'"]').removeClass("notexist");
            $('img[name="'+key+'"]').addClass("notfound");
            $('img[name="'+key+'"]').attr("src", "images/album-unknown.png");
        } else {
            $('img[name="'+key+'"]').attr("src", "albumart/original/"+key+".jpg");
            $('img[name="'+key+'"]').removeClass("notexist");
            $('img[name="'+key+'"]').removeClass("notfound");
        }
    }
}

function savePlaylist() {

    var name = $("#playlistname").val();
    debug.log("GENERAL","Save Playlist",name);
    if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0) {
        alert("Playlist name cannot contain / or \\");
    } else {
        player.mpd.fastcommand("command=save&arg="+encodeURIComponent(name), function() {
            player.controller.reloadPlaylists();
            infobar.notify(infobar.NOTIFY, "Playlist saved as "+name);
        });
        $("#saveplst").slideToggle('fast');
    }
}

function saveRadioOrder() {

    debug.log("GENERAL","Saving Radio Order");
    var radioOrder = Array();
    $("#yourradiolist").find(".clickradio").each( function() {
        debug.log("GENERAL","Station",$(this).attr("name"));
        radioOrder.push($(this).attr("name"));
    });
    $.ajax({
            type: 'POST',
            url: 'saveRadioOrder.php',
            data: {'order[]': radioOrder}
    });

}

function prepareForLiftOff(text) {
    $("#collection").empty();
    doSomethingUseful('collection', text);
}

function prepareForLiftOff2(text) {
    $("#filecollection").empty();
    doSomethingUseful("filecollection", text);
}

/* This is called when the page loads. It checks to see if the albums/files cache exists
    and builds them, if necessary. If they are there, it loads them
*/

function checkCollection() {
    var update = false;
    if (prefs.updateeverytime) {
        debug.log("GENERAL","Updating Collection due to preference");
        update = true;
    } else {
        if (!albumslistexists && !prefs.hide_albumlist) {
            debug.log("GENERAL","Updating because albums list doesn't exist and it's not hidden");
            update = true;
        }
        if (!fileslistexists && !prefs.hide_filelist) {
            debug.log("GENERAL","Updating because files list doesn't exist and it's not hidden");
            update = true;
        }
    }
    if (update) {
        player.controller.updateCollection('update');
    } else {
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            debug.log("GENERAL","Loading albums cache only");
            loadCollection('albums.php?item=aalbumroot', null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Loading Files Cache Only");
            loadCollection(null, 'dirbrowser.php?item=adirroot');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Loading Both Caches");
            loadCollection('albums.php?item=aalbumroot', 'dirbrowser.php?item=adirroot');
        }
    }
}

function loadCollection(albums, files) {
    if (albums != null) {
        debug.log("GENERAL","Loading Albums List");
        prepareForLiftOff("Loading Collection");
        player.controller.reloadAlbumsList(albums);
    }
    if (files != null) {
        debug.log("GENERAL","Loading Files List");
        prepareForLiftOff2("Loading Files List");
        $("#filecollection").load(files);
        $('#filesearch').load("filesearch.php");
    }
}

function checkPoll(data) {
    if (data.updating_db) {
        update_load_timer = setTimeout( pollAlbumList, 1000);
        update_load_timer_running = true;
    } else {
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            debug.log("GENERAL","Building albums cache only");
            loadCollection('albums.php', null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Files Cache Only");
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Both Caches");
            loadCollection('albums.php', 'dirbrowser.php');
        }
    }
}

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("ajaxcommand.php", checkPoll);
}

function sourcecontrol(source) {

    if (mobile == "no") {
        sources = ["lastfmlist", "albumlist", "filelist", "radiolist"];
    } else if (mobile == "phone") {
        if (landscape) {
            sources = ["lastfmlist", "albumlist", "filelist", "radiolist", "infopane", "chooser", "prefsm"];
        } else {
            sources = ["lastfmlist", "albumlist", "filelist", "radiolist", "infopane", "playlistm", "chooser", "historypanel", "playlistman", "prefsm"];
        }
    }
    for(var i in sources) {
        if (sources[i] == source) {
            sources.splice(i, 1);
            break;
        }
    }
    switchsource(source);
    return false;
}

function switchsource(source) {

    var togo = sources.shift();
    if (togo) {
        if ($("#"+togo).is(':visible')) {
            if (mobile == "no") {
                $("#"+togo).fadeOut(200, function() { switchsource(source) });
            } else {
                $("#"+togo).hide();
                switchsource(source);
            }
        } else {
            switchsource(source);
        }
    } else {
        prefs.save({chooser: source});
        if (mobile == "no") {
            $("#"+source).fadeIn(200);
        } else {
            $("#"+source).show();
            if (landscape) {
                switchColumnMode(source != "infopane");
            } else {
                if (source == "playlistm") {
                    $("#sources").hide();
                } else {
                    $("#sources").show();
                }
            }
        }
    }
    if (prefs.keep_search_open) {
        $("#search").show();
    }

}

function hidePanel(panel) {
    var is_hidden = $("#"+panel).is(':hidden');
    var new_state = !prefs["hide_"+panel];
    debug.log("GENERAL","Hide Panel",panel,is_hidden,new_state);
    var newprefs = {};
    newprefs["hide_"+panel] = new_state;
    prefs.save(newprefs);
    if (mobile == "no") {
        if (is_hidden != new_state) {
            if (new_state && prefs.chooser == panel) {
                $("#"+panel).fadeOut('fast');
                var s = ["albumlist", "filelist", "lastfmlist", "radiolist"];
                for (var i in s) {
                    if (s[i] != panel && !prefs["hide_"+s[i]]) {
                        switchsource(s[i]);
                        break;
                    }
                }
            }
            if (!new_state && prefs.chooser == panel) {
                $("#"+panel).fadeIn('fast');
            }
        }
    }
    if (new_state) {
        //$("#choose_"+panel).fadeOut('fast');
        switch (panel) {
            case "lastfmlist":
                $("#lastfmlist").empty();
                break;
            case "radiolist":
                $("#bbclist").empty();
                $("#somafmlist").empty();
                $("#yourradiolist").empty();
                $("#icecastlist").empty();
                break;
            case "albumlist":
                if (update_load_timer_running == false) {
                    $("#collection").empty();
                    // $("#search").empty();
                }
                break;
            case "filelist":
                if (update_load_timer_running == false) {
                    $("#filecollection").empty();
                    $("#filesearch").empty();
                }
                break;
        }
    } else {
        //$("#choose_"+panel).fadeIn('fast');
        switch (panel) {
            case "lastfmlist":
                $("#lastfmlist").load("lastfmchooser.php");
                break;
            case "radiolist":
                $("#bbclist").load("bbcradio.php");
                $("#somafmlist").load("somafm.php");
                $("#yourradiolist").load("yourradio.php");
                $("#icecastlist").html('<div class="dirname"><h2 id="loadinglabel3">Loading Stations...</h2></div>');
                refreshMyDrink('');
                break;
            case "albumlist":
                if (update_load_timer_running == false) {
                    loadCollection('albums.php?item=aalbumroot', null);
                }
                break;
            case "filelist":
                if (update_load_timer_running == false) {
                    loadCollection(null, 'dirbrowser.php?item=adirroot');
                }
                break;
        }
    }
    setChooserButtons();
}

function setXfadeDur() {
    $("#configpanel").fadeOut(1000);
    prefs.save({crossfade_duration: $("#configpanel").find('input[name|="michaelbarrymore"]').attr("value")});
    if (player.status.xfade > 0) {
        player.controller.setCrossfade($("#configpanel").find('input[name|="michaelbarrymore"]').attr("value"));
    }
}

function setMusicDirectory() {
    $("#configpanel").fadeOut(1000);
    prefs.save({music_directory_albumart: $("#configpanel").find('input[name|="music_directory_albumart"]').attr("value")});
    $.post("setFinklestein.php", {dir: $("#configpanel").find('input[name|="music_directory_albumart"]').attr("value")});
}

function makeitbigger() {
    itisbigger = !itisbigger;
    $("#infobar").slideToggle('fast', function() {
        if (itisbigger) {
            $("#bottompage").css('top', "36px");
        } else {
            $("#bottompage").css('top', "116px");
        }
    });
    setBottomPaneSize();
}

function swipeyswipe(dir) {
    var order = [];
    if (!prefs.hide_albumlist || (prefs.hide_albumlist && prefs.keep_search_open)) {
        order.push("albumlist")
    }
    if (!prefs.hide_filelist) {
        order.push("filelist")
    }
    if (!prefs.hide_lastfmlist) {
        order.push("lastfmlist")
    }
    if (!prefs.hide_radiolist) {
        order.push("radiolist")
    }
    if (!prefs.hidebrowser) {
        order.push("infopane");
    }
    if (landscape) {
        if (!prefs.twocolumnsinlandscape) {
            order.push("playlistm");
        }
    } else {
        order.push("playlistm");
    }
    for (var i in order) {
        if (order[i] == prefs.chooser) {
            var j = (i*1)+(dir*1);
            if (j<0) { j=order.length-1; }
            if (j>=order.length) { j = 0; }
            sourcecontrol(order[j]);
            break;
        }
    }
}

function doSomethingUseful(div,text) {
    debug.log("GENERAL","Doing Something Useful to",div);
    var html =  '<div id="usefulbar" class="containerbox bar">'+
                '<div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div>'+
                '<div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div><div class="expand"></div>'+
                '<div class="label"><h2 align="center">'+text+'</h2></div>'+
                '</div>'
    $("#"+div).append(html);
}

function faffing() {
    //$("#content").html("<h2>Searching....</h2>");
}

function refreshMyDrink(path) {
    faffing();
    if (path === false) {
        $("#icecastlist").load("iceScraper.php");
    } else {
        debug.log("GENERAL","Fanoogling the hubstraff",path);
        $("#icecastlist").load("iceScraper.php?path="+path);
    }
}

function setChooserButtons() {
    var s = ["filelist", "lastfmlist", "radiolist"];
    for (var i in s) {
        if (prefs["hide_"+s[i]]) {
            debug.log("GENERAL",s[i],"is hidden");
            $("#choose_"+s[i]).fadeOut('fast');
        } else {
            $("#choose_"+s[i]).fadeIn('fast');
        }
    }
    if (prefs.hide_albumlist && !prefs.keep_search_open) {
        $("#choose_albumlist").fadeOut('fast');
    } else {
        $("#choose_albumlist").fadeIn('fast');
    }
}

function keepsearchopen() {
    prefs.keep_search_open = !prefs.keep_search_open;
    prefs.save({keep_search_open: prefs.keep_search_open});
    if (prefs.hide_albumlist) {
        if (prefs.keep_search_open) {
            $("#choose_albumlist").fadeIn('fast');
        } else {
            $("#choose_albumlist").fadeOut('fast');
        }
    }
    if (prefs.keep_search_open) {
        $("#search").show();
    }
}

function showVolumeControl() {
    $("#volumecontrol").slideToggle('fast');
}

function findImageInWindow(key) {
    var result = false;
    $.each($('img[name="'+key+'"]'), function() {
        if (!$(this).hasClass('notexist') && !$(this).hasClass('notfound') && result === false) {
            result = $(this).attr("src");
        }
    });
    return result;
}

function formatPlaylistInfo(data) {

    var html = "";
    if (mobile == "no") {
        html = html + '<li class="tleft wide"><b>Playlists</b></li>';
        html = html + '<li class="tleft wide"><table width="100%">';
    } else {
        html = html + '<h3>Playlists</h3>';
        html = html + '<table width="90%">';
    }
    $.each(data, function() {
        var uri = this.uri;
        html = html + '<tr><td class="playlisticon" align="left">';
        var protocol = uri.substr(0, uri.indexOf(":"));
        switch (protocol) {
            case "soundcloud":
                html = html + '<img src="images/soundcloud-logo.png" height="12px" style="vertical-align:middle"></td>';
                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
                html = html + '<td></td></tr>';
                break;
            case "spotify":
                html = html + '<img src="images/spotify-logo.png" height="12px" style="vertical-align:middle"></td>';
                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
                html = html + '<td></td></tr>';
                break;
            default:
                html = html + '<img src="images/folder.png" width="12px" style="vertical-align:middle"></td>';
                html = html + '<td align="left"><a href="#" onclick="playlist.load(\''+this.uri+'\')">'+this.name+'</a></td>';
                html = html + '<td class="playlisticon" align="right"><a href="#" onclick="player.controller.deletePlaylist(\''+escape(this.name)+'\')"><img src="images/edit-delete.png" style="vertical-align:middle"></a></td></tr>';
                break;
        }
    });
    if (mobile == "no") {
        html = html + '</table></li>';
    } else {
        html = html + "</table>";
    }
    $("#playlistslist").html(html);

}

function handleDropRadio(ev) {
    setTimeout(function() { doInternetRadio('yourradioinput') }, 1000);
}

function progressBar(divname, orientation) {

    var jobject = $("#"+divname);
    if (!jobject) {
        debug.log("PROGRESSBAR","Invalid DIV passed to progressbar!",divname);
        return 0;
    }

    if (orientation == "horizontal") {
        jobject.addClass('progressbar');
    } else if (orientation == "vertical") {
        jobject.addClass('progressbar_v');
    } else {
        debug.log("PROGRESSBAR","Invalid orientation passed to progressbar!",orientation);
        return 0;
    }

    this.setProgress = function(percent) {

        if (percent > 100) {
            percent = 100;
        }
        var lowr = Math.round(150 + percent/2);
        var lowg= Math.round(75 + percent/2);
        var highr = Math.round(180 + percent/1.5);
        var highg= Math.round(90 + percent/1.5);

        var rgbs = "rgba("+lowr+","+lowg+",0,0.75) 0%,rgba("+highr+","+highg+",0,1) "+percent+"%,rgba(0,0,0,1) "+percent+"%,rgba(0,0,0,1) 100%)";
        var gradients = new Array();

        // Web standards. Don'cha love 'em?
        // W3C, recent webkit, firefox, opera, IE10, old webkit. In that order
        // Yes, I even put the one for IE in here. Why?
        if (orientation == "horizontal") {
            gradients.push("linear-gradient(to right, "+rgbs);
            gradients.push("-webkit-linear-gradient(left, "+rgbs);
            gradients.push("-moz-linear-gradient(left, "+rgbs);
            gradients.push("-o-linear-gradient(left, "+rgbs);
            gradients.push("-ms-linear-gradient(left, "+rgbs);
        } else {
            gradients.push("linear-gradient(to top, "+rgbs);
            gradients.push("-webkit-linear-gradient(bottom, "+rgbs);
            gradients.push("-moz-linear-gradient(bottom, "+rgbs);
            gradients.push("-o-linear-gradient(bottom, "+rgbs);
            gradients.push("-ms-linear-gradient(bottom, "+rgbs);
        }
        rgbs = "color-stop(0%,rgba("+lowr+","+lowg+",0,0.75)), color-stop("+percent+"%,rgba("+highr+","+highg+",0,1)), color-stop("+percent+"%,rgba(0,0,0,1)), color-stop(100%,rgba(0,0,0,1)))";
        if (orientation == "horizontal") {
            gradients.push("-webkit-gradient(linear, left top, right top, "+rgbs);
        } else {
            gradients.push("-webkit-gradient(linear, left bottom, left top, "+rgbs);
        }
        $.each(gradients, function(i,v) {
            jobject.css("background", v);
        });
    }
}

function preventDefault(ev) {
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    return false;
}
