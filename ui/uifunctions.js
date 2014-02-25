function changetheme() {
    $("#theme").attr({href: 'themes/'+$("#themeselector").val()});
    prefs.save({theme: $("#themeselector").val()});
}

function changefontsize() {
    debug.log("CHICKEN","Setting font size to ",$("#fontselector").val());
    $("#fontsize").attr({href: "sizes/"+$("#fontselector").val()});
    prefs.save({fontsize: $("#fontselector").val()});
}

function changefontfamily() {
    debug.log("CHICKEN","Setting font family to ",$("#fontfamselector").val());
    $("#fontfamily").attr({href: "fonts/"+$("#fontfamselector").val()});
    prefs.save({fontfamily: $("#fontfamselector").val()});
}

function changelanguage() {
    prefs.save({language: $("#langselector").val()}, function() {
        location.reload(true);
    });
}

function changecountry() {
    prefs.save({lastfm_country_code: $("#countryselector").val()});
}

function changeClickPolicy() {
    prefs.save({clickmode: $('[name=clickselect]:checked').val()});
    setClickHandlers();
}

function saveTextBoxes() {
    clearTimeout(textSaveTimer);
    textSaveTimer = setTimeout(doTheSave, 1000);
}

function setSLValue() {
    prefs.save({synclovevalue: $("#synclovevalue").val()});
}

function doTheSave() {
    prefs.save({lastfmlang: $('[name=clicklfmlang]:checked').val(),
                user_lang: $('[name=userlanguage]').val(),
                music_directory_albumart: $("#configpanel").find('input[name|="music_directory_albumart"]').attr("value"),
                autotagname: $("#configpanel").find('input[name|="taglovedwith"]').attr("value")});
    debug.log("DEBUG","Setting music directory to ",prefs.music_directory_albumart);
    $.post("setFinklestein.php", {dir: $("#configpanel").find('input[name|="music_directory_albumart"]').attr("value")});
}

function changeradiocountry() {
    $("#bbclist").load("bbcradio.php?country="+$("#radioselector").val());
}

function setXfadeDur() {
    // $("#configpanel").fadeOut(1000);
    prefs.save({crossfade_duration: $("#configpanel").find('input[name|="michaelbarrymore"]').attr("value")});
    debug.log("DEBUG","Setting xfade to ",prefs.crossfade_duration);
    if (player.status.xfade > 0) {
        player.controller.setCrossfade($("#configpanel").find('input[name|="michaelbarrymore"]').attr("value"));
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
    if (typeof(selector) == "string") {
        $("#"+selector).attr("src", "newimages/waiter.png");
        $("#"+selector).removeClass("nospin");
        $("#"+selector).addClass("spinner");
    } else {
        selector.attr("src", "newimages/waiter.png");
        selector.removeClass("nospin");
        selector.addClass("spinner");
    }
}

function stopWaitingIcon(selector) {
    $("#"+selector).attr("src", "newimages/transparent-32x32.png");
    $("#"+selector).removeClass("spinner");
    $("#"+selector).addClass("nospin");
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

        var browserwidth = (100 - (prefs.playlistwidthpercent*playlistweight) - (prefs.sourceswidthpercent*sourcesweight));
        var sourceswidth = (100 - (prefs.playlistwidthpercent*playlistweight) - browserwidth)*sourcesweight;
        var playlistwidth = (100 - sourceswidth - browserwidth)*playlistweight;

        $("#sources").css("width", sourceswidth.toString()+"%");
        $("#albumcontrols").css("width", sourceswidth.toString()+"%");
        $("#playlist").css("width", playlistwidth.toString()+"%");
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

        var i = (prefs.sourceshidden) ? "newimages/arrow-right-double.png" : "newimages/arrow-left-double.png";
        $("#expandleft").attr("src", i);
        i = (prefs.playlisthidden) ? "newimages/arrow-left-double.png" : "newimages/arrow-right-double.png";
        $("#expandright").attr("src", i);
        tagManager.redoLayout();
    }
}

function setBottomPaneSize() {
    var ws = getWindowSize();
    if (mobile != "no") {
        if (itisbigger) {
            // The nowplaying area has ben hidden
            var newheight = ws.y-28;
        } else {
            // The nowplaying area is visible
            var newheight = ws.y - 112;
        }
        // 'landscape' determines whether we're showing 2 columns or one
        var oldls = landscape;
        if (ws.x > ws.y) {
            landscape = prefs.twocolumnsinlandscape;
        } else {
            landscape = false;
        }
        if (oldls != landscape) {
            switchColumnMode(landscape);
            sourcecontrol(prefs.chooser);
        }
        // Set the height of the volume control bar
        var v = newheight - 32;
        $("#volumecontrol").css("height", v.toString()+"px");
        // This is called here purely to make sure the 'progress bar' in the
        // resized volume control gets updated
        infobar.updateWindowValues();
        // Width of the nowplaying area
        var gibbon = ws.x-160;
        $("#patrickmoore").css('width', gibbon.toString()+"px");
        // Hack for some themes that have a 1 pixel border on nowplaying
        // or the top of the albums list/info pane.
        // This cuases it to overflow bottompage, and on a mobile device
        // we get a second scrollbar because of it.
        var cockfeature = newheight-2;
        $("#infopane").css("height", cockfeature.toString()+"px");
    } else {
        // x-position of the notification rollup
        var notpos = ws.x - 340;
        $("#notifications").css("left", notpos.toString()+"px");
        // Width of the nowplaying area
        var lp = ws.x - 328;
        $('#patrickmoore').css("width", lp.toString()+"px");
        // Height of the bottom pane (chooser, info, playlist container)
        var newheight = ws.y - 148;
        // Make sure the dropdown menus don't overflow the window
        // They have max-height as 500 in the css.
        if (newheight < 500) {
            $('ul.subnav').each(function() {
                if ($(this).height() > newheight) {
                    $(this).css('height', newheight.toString()+"px");
                }
            });
        } else {
            $('ul.subnav').css('height', "");
        }
    }
    $("#bottompage").css("height", newheight.toString()+"px");
    newheight = null;
    playlist.setHeight();
    infobar.rejigTheText();
    tagManager.redoLayout();
}

function togglePlaylistButtons() {
    if (!$("#playlistbuttons").is(":visible")) {
        // Make the playlist scroller shorter so the window doesn't get a vertical scrollbar
        // while the buttons are being slid down
        var newheight = $("#pscroller").height() - 48;
        $("#pscroller").css("height", newheight.toString()+"px");
    }
    $("#playlistbuttons").slideToggle('fast', playlist.setHeight);
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
    // if (usersupplied) { data.usersupplied = "true" }

    $.ajax( {
        type: "GET",
        url: "getInternetPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: data,
        dataType: "xml",
        success: function(data) {
            playlist.newInternetRadioStation(data);
        },
        error: function(data, status) {
            playlist.repopulate();
            infobar.notify(infobar.ERROR, language.gettext("label_tunefailed"));
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
            alert(language.gettext("label_tunefailed"));
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
            alert(language.gettext("label_general_error"));
        }
    } );
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

function lastFMTrackFailed(data) {
    playlist.repopulate();
    infobar.notify(infobar.ERROR, language.gettext("label_tunefailed")+" : "+data.error);
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

function loadSomaFM() {
    if ($("#somafmlist").is(':empty')) {
        makeWaitingIcon("somawait");
        $("#somafmlist").load("somafm.php", function() { stopWaitingIcon("somawait")});
    }
}

function loadBigRadio() {
    if ($("#bbclist").is(':empty')) {
        makeWaitingIcon("bbcwait");
        $("#bbclist").load("bbcradio.php", function() { stopWaitingIcon("bbcwait")});
    }
}

function gotNoNeighbours(data) {
    stopWaitingIcon("neighbourwait");
    infobar.notify(infobar.NOTIFY, language.gettext("label_noneighbours"));
}

function gotNoFriends(data) {
    stopWaitingIcon("freindswait");
    infobar.notify(infobar.NOTIFY, language.gettext("label_nofreinds"));
}

function gotNoTopTags(data) {
    stopWaitingIcon("toptagswait");
    infobar.notify(infobar.NOTIFY, language.gettext("label_notags"));
}

function gotNoTopArtists(data) {
    stopWaitingIcon("topartistswait");
    infobar.notify(infobar.NOTIFY, language.gettext("label_noartists"));
}

function toggleSearch() {
    if (mobile == "no") {
        if ($("#albumlist").is(':visible')) {
            if (albumScrollOffset < 20) {
                $("#search").slideToggle('fast');
            } else {
                $("#search").slideDown('fast');
            }
        } else {
            sourcecontrol("albumlist");
            $("#search").slideDown('fast');
        }
        $('#sources').mCustomScrollbar("scrollTo", 0, {scrollInertia:20});
        albumScrollOffset = 0;
    } else {
        $("#search").slideToggle('fast');
    }
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
        html = html + '<div class="playlisticon fixed"><img width="16px" src="newimages/lastfm.png" /></div>';
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
        html = html + '<div class="playlisticon fixed"><img width="16px" src="newimages/lastfm.png" /></div>';
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
        html = html + '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'+prefix+count.toString()+'" /></div>';
        if (userdata[i].image[0]['#text'] != "") {
            html = html + '<div class="smallcover fixed"><img class="smallcover fixed clickable clickicon clicklfmuser" name="'+userdata[i].name+'" src="'+userdata[i].image[0]['#text']+'" /></div>';
        } else {
            html = html + '<div class="smallcover fixed"><img class="smallcover fixed clickable clickicon clicklfmuser" name="'+userdata[i].name+'" src="newimages/album-unknown-small.png" /></div>';
        }
        html = html + '<div class="expand">'+userdata[i].name+'</div>';
        html = html + '</div>';
        html = html + '<div id="'+prefix+count.toString()+'" class="dropmenu">';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmuser" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">'+language.gettext("label_userlibrary", [userdata[i].name])+'</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmmix" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">'+language.gettext("label_usermix", [userdata[i].name])+'</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfrecommended" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">'+language.gettext("label_userrecommended", [userdata[i].name])+'</div>';
        html = html + '</div>';
        html = html + '<div class="clickable clicklfm2 indent containerbox padright menuitem" name="lastfmneighbours" username="'+userdata[i].name+'">';
        html = html + '<div class="expand">'+language.gettext("label_neighbourhood", [userdata[i].name])+'</div>';
        html = html + '</div>';
        html = html + '</div>';
        count++;
    }
    return html;
}

var imagePopup=function(){
    var wikipopup = null;
    var imagecontainer = null;
    var mousepos = null;
    var clickedelement = null;
    var image = new Image();
    image.onload = function() {
        debug.log("IMAGEPOPUP", "Image has loaded");
        imagePopup.show();
    }
    image.onerror = function() {
        debug.log("IMAGEPOPUP", "Image has NOT loaded");
        imagePopup.close();
    }

    return {
        create:function(element, event, source){
            debug.log("IMAGEPOPUP", "Creating new popup",source);
            if(wikipopup == null){
                wikipopup = $('<div>', { id: 'wikipopup', onclick: 'imagePopup.close()', class: 'dropshadow'}).appendTo($('body'));
                imagecontainer = $('<img>', { id: 'imagecontainer', onclick: 'imagePopup.close()', src: ''}).appendTo($('body'));
            } else {
                wikipopup.empty();
                imagecontainer.fadeOut('fast');
            }
            mousepos = getPosition(event);
            clickedelement = element;
            var scrollPos=getScrollXY();
            var top = (mousepos.y - 24);
            var left = (mousepos.x - 24);
            wikipopup.css({       width: '48px',
                                  height: '48px',
                                  top: top+'px',
                                  left: left+'px'});
            wikipopup.append($('<img>', {class: 'spinner', height: '32px', src: 'newimages/waiter.png', style: 'position:relative;top:8px;left:8px'}));
            wikipopup.fadeIn('fast');
            if (source !== undefined) {
                if (source == image.src) {
                    imagePopup.show();
                } else {
                    image.src = source;
                }
            }
        },

        show:function() {
            // Calculate popup size and position
            var imgwidth = image.width;
            var imgheight = image.height;
            debug.log("POPUP","Image size is",imgwidth,imgheight);
            // Make sure it's not bigger than the window
            var winsize=getWindowSize();
            // hack to allow for vertical scrollbar
            winsize.x = winsize.x - 32;
            // Allow for popup border
            var w = winsize.x - 63;
            var h = winsize.y - 36;
            debug.log("POPUP","Allowed size is",w,h);
            var scale = w/image.width;
            if (h/image.height < scale) {
                scale = h/image.height;
            }
            if (scale < 1) {
                imgheight = Math.round(imgheight * scale);
                imgwidth = Math.round(imgwidth * scale);
            }
            debug.log("POPUP","Calculated Image size is",imgwidth,imgheight,(imgwidth/image.width),(imgheight/image.height));
            var popupwidth = imgwidth+36;
            var popupheight = imgheight+36;

            var scrollPos=getScrollXY();
            var top = (mousepos.y - (popupheight/2));
            var left = (mousepos.x - (popupwidth/2));
            if ((left-scrollPos.x+popupwidth) > winsize.x) {
                left = winsize.x - popupwidth + scrollPos.x;
            }
            if ((top-scrollPos.y+popupheight) > winsize.y) {
                top = winsize.y - popupheight + scrollPos.y;
            }
            if (top< scrollPos.y) {
                top = scrollPos.y;
            }
            if (left < scrollPos.x) {
                left = scrollPos.x;
            }
            wikipopup.empty();
            wikipopup.animate(
                {
                    width: popupwidth+'px',
                    height: popupheight+'px',
                    top: top+'px',
                    left: left+'px'
                },
                'fast',
                'swing',
                function() {
                    imagecontainer.css({  top: (top+18)+'px',
                                          left: (left+18)+'px'});

                    imagecontainer.attr({ width: imgwidth+'px',
                                          height: imgheight+'px',
                                          src: image.src });

                    imagecontainer.fadeIn('slow');
                    wikipopup.append($('<img>', {src: 'newimages/edit-delete.png', height: "12px", class: 'tright', style: 'margin-top:4px;margin-right:4px'}));
                }
            );
        },

        close:function() {
            wikipopup.fadeOut('slow');
            imagecontainer.fadeOut('slow');
        }
    }
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

    debug.log("GENERAL", "Editing Key Bindings");

    $("#configpanel").slideToggle('fast');

    $.getJSON("getkeybindings.php")
        .done(function(data) {
            var keybpu = popupWindow.create(500,300,"keybpu",true,language.gettext("title_keybindings"));
            $("#popupcontents").append('<table align="center" cellpadding="4" id="keybindtable" width="80%"></table>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_next")+'</td><td>'+format_keyinput('nextrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_previous")+'</td><td>'+format_keyinput('prevtrack', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_stop")+'</td><td>'+format_keyinput('stop', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_play")+'</td><td>'+format_keyinput('play', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_volup")+'</td><td>'+format_keyinput('volumeup', data)+'</td></tr>');
            $("#keybindtable").append('<tr><td width="35%" align="right">'+language.gettext("button_voldown")+'</td><td>'+format_keyinput('volumedown', data)+'</td></tr>');

            $("#keybindtable").append('<tr><td colspan="2"><button style="width:8em" class="tleft topformbutton" onclick="popupWindow.close()">'+language.gettext("button_cancel")+'</button>'+
                                        '<button  style="width:8em" class="tright topformbutton" onclick="saveKeyBindings()">'+language.gettext("button_OK")+'</button></td></tr>');

            $(".buttonchange").keydown( function(ev) { changeHotKey(ev) } );
            popupWindow.open();
        })
        .fail( function() { alert("Failed To Read Key Bindings!") });

}

function format_keyinput(inpname, data) {
    return '<input id="'+inpname+'" class="tleft sourceform buttonchange" type="text" size="10" value="'+getHotKeyDisplay(data[inpname])+'"></input>' +
            '<input name="'+inpname+'" class="buttoncode" type="hidden" value="'+getHotKey(data[inpname])+'"></input>';
}

function outputswitch(id) {
    debug.log("GENERAL       : Output Switch for output",id);
    if ($('#outputbutton'+id).hasClass("togglebutton-0")) {
        $('#outputbutton'+id).removeClass("togglebutton-0").addClass("togglebutton-1");
        player.controller.doOutput(id, true);
    } else {
        $('#outputbutton'+id).removeClass("togglebutton-1").addClass("togglebutton-0");
        player.controller.doOutput(id, false);
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
    var closeCall = null;

    return {
        create:function(w,h,id,shrink,title) {
            if (popup == null) {
                popup = document.createElement('div');
                $(popup).addClass("popupwindow");
                $(popup).addClass("dropshadow");
                document.body.appendChild(popup);
            }
            $(popup).empty();
            closeCall = null;
            wantedwidth = w;
            wantedheight = h;
            wantshrink = shrink;
            popup.setAttribute('id',id);
            popup.style.height = 'auto';
            $(popup).append('<div id="cheese"></div>');
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+title+
                '</h2></td><td align="right" width="30px">'+
                '<img class="clickicon" onclick="popupWindow.close()" src="newimages/edit-delete.png"></td></tr></table>');
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
            addCustomScrollBar("#popupcontents");
        },
        close:function() {
            $(popup).hide();
            if (closeCall) {
                closeCall();
            }
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
        },
        onClose: function(callback) {
            closeCall = callback;
        }
    };
}();

function srDrag(event, ui) {
    var size = getWindowSize();
    if (ui.offset.left < 120) { ui.offset.left = 120; }
    prefs.sourceswidthpercent = ((ui.offset.left+8)/size.x)*100;
    doThatFunkyThang();
    $(this).data('draggable').position.left = 0;
}

function srDragStop(event, ui) {
    prefs.save({sourceswidthpercent: prefs.sourceswidthpercent});
}

function prDrag(event, ui) {
    var size = getWindowSize();
    if ((size.x - ui.offset.left) < 120) { ui.offset.left = size.x - 120; }
    prefs.playlistwidthpercent = (((size.x - ui.offset.left))/size.x)*100;
    doThatFunkyThang();
    $(this).data('draggable').position.left = 0;
}

function prDragStop(event, ui) {
    prefs.save({playlistwidthpercent: prefs.playlistwidthpercent})
}


function clearPlaylist() {
    playlist.clear();
    $("#clrplst").slideToggle('fast');
}

function setPlaylistButtons() {
    c = (player.status.xfade == 0) ? 0 : 1;
    $("#crossfade").removeClass("togglebutton-0 togglebutton-1").addClass("togglebutton-"+c);
    $.each(['random', 'repeat', 'consume'], function(i,v) {
        $("#"+v).removeClass("togglebutton-0 togglebutton-1").addClass("togglebutton-"+player.status[v]);
    });
}

function onStorageChanged(e) {

    debug.log("GENERAL","Storage Event",e);

    if (e.key == "key" && e.newValue != "Blerugh") {
        var key = e.newValue;
        debug.log("GENERAL","Updating album image for key",key,e);
        if (key.substring(0,1) == "!") {
            key = key.substring(1,key.length);
            $('img[name="'+key+'"]').removeClass("notexist");
            $('img[name="'+key+'"]').addClass("notfound");
            $('img[name="'+key+'"]').attr("src", "newimages/album-unknown.png");
        } else {
            $('img[name="'+key+'"]').attr("src", "albumart/original/"+key+".jpg");
            $('img[name="'+key+'"]').removeClass("notexist");
            $('img[name="'+key+'"]').removeClass("notfound");
        }
    } else if (e.key == "podcast" && e.newValue == "true") {
        debug.log("GENERAL", "Podcasts have been updated");
        localStorage.setItem("podcastresponse", "OK");
        if (!prefs.hide_radiolist) {
            podcasts.loadList();
            switchsource('radiolist');
            if ($("#podcastslist").is(':hidden')) {
                $("#podcastslist").prev().find('.menu').click();
            }
        }
    }
}

function saveRadioOrder() {

    debug.log("GENERAL","Saving Radio Order");
    var radioOrder = Array();
    $("#yourradiolist").find(".stname").each( function() {
        radioOrder.push($(this).html());
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
        player.controller.reloadAlbumsList(albums);
    }
    if (files != null) {
        debug.log("GENERAL","Loading Files List");
        player.controller.reloadFilesList(files);
    }
}

function checkPoll(data) {
    if (data.updating_db) {
        update_load_timer = setTimeout( pollAlbumList, 1000);
        update_load_timer_running = true;
    } else {
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            debug.log("GENERAL","Building albums cache only");
            loadCollection('albums.php?rebuild=yes', null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Files Cache Only");
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Both Caches");
            loadCollection('albums.php?rebuild=yes', 'dirbrowser.php');
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
            sources = ["lastfmlist", "albumlist", "filelist", "radiolist", "infopane", "chooser", "historypanel", "playlistman", "prefsm"];
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
            setBottomPaneSize();
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
                //$("#bbclist").load("bbcradio.php");
                //$("#somafmlist").load("somafm.php");
                $("#yourradiolist").load("yourradio.php");
                // $("#icecastlist").html('<div class="dirname"><h2 id="loadinglabel3">'+language.gettext("label_loadingstations")+'</h2></div>');
                // refreshMyDrink('');
                podcasts.loadList();
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

function makeitbigger() {
    itisbigger = !itisbigger;
    $("#infobar").slideToggle('fast', function() {
        if (itisbigger) {
            $("#bottompage").css('top', "28px");
        } else {
            $("#bottompage").css('top', "112px");
        }
        setBottomPaneSize();
    });
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
    var html = '<div class="containerbox bar">';
    html = html + '<div class="fixed" style="vertical-align:middle;padding-left:8px"><img height="32px" src="newimages/waiter.png" class="spinner"></div>';
    html = html + '<h3 class="expand ucfirst label">'+text+'</h3>';
    html = html + '</div>';
    if (typeof div == "object") {
        div.append(html);
    } else if (typeof div == "string") {
        $("#"+div).append(html);
    }
}

function refreshMyDrink(path) {
    makeWaitingIcon("icewait");
    if ($("#icecastlist").is(':empty') || path === false) {
        $("#icecastlist").load("iceScraper.php", function() { stopWaitingIcon("icewait") });
    } else {
        debug.log("GENERAL","Fanoogling the hubstraff",path);
        $("#icecastlist").load("iceScraper.php?path="+path, function() { stopWaitingIcon("icewait") });
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
    sortOutTheLogicalCraziness();
}

function getBuyHtml(data) {
    var html = "";
    if (data.affiliations) {
        if (data.affiliations.physicals) {
            html = html + '<li><b>'+language.gettext("lastfm_buyoncd")+'</b></li>';
            html = html + doBuyTable(getArray(data.affiliations.physicals.affiliation));
        }
        if (data.affiliations.downloads) {
            html = html + '<li><b>'+language.gettext("lastfm_download")+'</b></li>';
            html = html + doBuyTable(getArray(data.affiliations.downloads.affiliation));
        }
    }
    return html;
}

function doBuyTable(values) {
    var html = "";
    for(var i in values) {
        html = html + '<li><img width="12px" src="'+values[i].supplierIcon+'">&nbsp;<a href="'+values[i].buyLink+'" target="_blank">'+
                        values[i].supplierName+'</a>';
        if (values[i].price) {
            if (values[i].price.formatted) {
                html = html + '    '+values[i].price.formatted;
            } else {
                html = html + '    '+values[i].price.amount;
            }
        }
        html = html +'</li>';
    }
    return html;
}

function keepsearchopen() {
    prefs.keep_search_open = !prefs.keep_search_open;
    prefs.save({keep_search_open: prefs.keep_search_open});
    sortOutTheLogicalCraziness();
    if (prefs.keep_search_open) {
        $("#search").show();
    }
}

function sortOutTheLogicalCraziness() {
    if (prefs.hide_albumlist) {
        $("#choose_albumlist").fadeOut('fast');
        if (!prefs.keep_search_open) {
            $("#choose_searcher").fadeOut('fast');
        } else {
            $("#choose_searcher").fadeIn('fast');
        }
    } else {
        $("#choose_albumlist").fadeIn('fast');
        $("#choose_searcher").fadeIn('fast');
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

function handleDropRadio(ev) {
    setTimeout(function() { doInternetRadio('yourradioinput') }, 1000);
}

function progressBar(divname, orientation) {

    var jobject = $("#"+divname);
    if (!jobject) {
        debug.error("PROGRESSBAR","Invalid DIV passed to progressbar!",divname);
        return 0;
    }

    if (orientation == "horizontal") {
        jobject.addClass('progressbar');
    } else if (orientation == "vertical") {
        jobject.addClass('progressbar_v');
    } else {
        debug.error("PROGRESSBAR","Invalid orientation passed to progressbar!",orientation);
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
        for (var i in gradients) {
            jobject.css("background", gradients[i]);
        }
        gradients = null;
    }
}

function preventDefault(ev) {
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    return false;
}

function scrollbarWidth() {
    var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
        $outer = jQuery('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
        inner = $inner[0],
        outer = $outer[0];

    jQuery('body').append(outer);
    var width1 = inner.offsetWidth;
    $outer.css('overflow', 'scroll');
    var width2 = outer.clientWidth;
    $outer.remove();
    return (width1 - width2);
}

function addCustomScrollBar(value) {
    if (mobile == "no") {
        $(value).mCustomScrollbar({
            theme: (prefs.theme == "Light.css" || prefs.theme == "BrushedAluminium.css" || prefs.theme == "Aqua.css") ? "dark-thick" : "light-thick",
            scrollInertia: 80,
            contentTouchScroll: true,
            advanced: {
                updateOnContentResize: true,
                autoScrollOnFocus: false
            },
            callbacks: {
                whileScrolling: function(){ playlistScrolled(this); }
            }
        });
    }
}

function playlistScrolled(el) {
    if (el.attr("id") == "pscroller") {
        playlistScrollOffset = -mcs.top;
    } else if (el.attr("id") == "sources") {
        albumScrollOffset = -mcs.top;
    }
}

function removeTrackFromDb(element) {
    var trackDiv = element.parent().parent();
    var albumDiv = trackDiv.parent();
    var albumHeaderDiv = albumDiv.prev();
    var albumContainer = albumHeaderDiv.parent();
    var artistDiv = albumContainer.parent();
    var trackToGo = trackDiv.attr("name");
    debug.log("DB_TRACKS","Remove track from database",trackToGo);
    $.ajax({
        url: "userRatings.php",
        type: "POST",
        data: {action: 'delete', uri: decodeURIComponent(trackToGo)},
        dataType: 'json',
        success: function(rdata) {
            debug.log("DB TRACKS","Track was removed");
            if (rdata && rdata.hasOwnProperty('stats')) {
                $("#fothergill").html(rdata.stats);
            }
            trackDiv.fadeOut('fast', function() {
                trackDiv.remove();
                if (albumDiv.children().length == 5) {
                    // All album dropdowns contain 5 meta- children which are used for cache control
                    // JQuery counts these as children
                    debug.log("DB_TRACK", "Album Div Is Empty");
                    albumDiv.remove();
                    albumHeaderDiv.fadeOut('fast', function() {
                        albumHeaderDiv.remove();
                        if (albumContainer.children().length == 5) {
                            debug.log("DB_TRACK", "Artist Div Is Empty");
                            artistDiv.fadeOut('fast', function() {
                                artistDiv.remove();
                            });
                        }
                    });
                    // Run a cleanup on the database to remove empty albums and artists.
                    // We Don't run this on removing the track - where it would slow down
                    // response of the GUI - because it's rather slow.
                    $.ajax({
                        url: "userRatings.php",
                        type: "POST",
                        data: { action: 'cleanup' },
                        dataType: 'json',
                        success: function(rdata) {
                            if (rdata && rdata.hasOwnProperty('stats')) {
                                $("#fothergill").html(rdata.stats);
                            }
                        },
                        error: function() {
                            debug.log("DB TRACKS", "Failed to run cleanup!");
                        }
                    });
                }
            });

        },
        error: function() {
            debug.log("DB TRACKS", "Failed to remove track");
            infobar.notify(infobar.ERROR, "Failed to remove track!");
        }
    });
}

var tagAdder = function() {

    var index = null;

    return {
        show: function(evt, idx) {
            index = idx;
            var position = getPosition(evt);
            $("#tagadder").css({top: position.y+8, left: position.x+8});
            $("#tagadder").slideToggle('fast');
        },

        add: function() {
            if (prefs.apache_backend == 'sql') {
                var toadd = $("#newtags").val();
                debug.log("TAGADDER","New Tags :",toadd);
                nowplaying.addTags(index, toadd);
                $("#tagadder").slideToggle('fast');
            } else {
                alert(language.gettext('label_nosql')+'. Please Read http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/');
            }
        }
    }
}();

function chooseNewTag(event) {
    var value = $(this).html();
    var tb = $(this);
    while (!tb.hasClass('drop-box')) {
        tb = tb.parent();
    }
    tb = tb.prev();
    var currvalue = tb.val();
    if (currvalue != "") {
        currvalue += ",";
    }
    currvalue += value;
    tb.val(currvalue);
}

function initDesktop() {
    $("#sortable").disableSelection();
    $("#sortable").sortable({
        items: ".sortable",
        axis: 'y',
        containment: '#sortable',
        scroll: true,
        scrollSpeed: 10,
        tolerance: 'pointer',
        scrollparent: "#pscroller",
        customscrollbars: true,
        scrollSensitivity: 60,
        start: function(event, ui) {
            ui.item.css("background", "#555555");
            ui.item.css("opacity", "0.7")
        },
        stop: playlist.dragstopped
    });

    $("#yourradiolist").sortable({
        items: ".clickradio,.clickstream",
        axis: "y",
        containment: "#yourradiolist",
        scroll: true,
        scrollSpeed: 10,
        tolerance: 'pointer',
        stop: saveRadioOrder
    });

    setDraggable('collection');
    setDraggable('filecollection');
    setDraggable('search');
    setDraggable('filesearch');

    // Make the entire playlist area accept drops from the collection
    $("#pscroller").droppable({
        //accept: ".draggable",
        addClasses: false,
        greedy: true,
        drop: playlist.draggedToEmpty,
        hoverClass: "highlighted"
    });

    // We have to set the sortable as droppable, even though the draggables
    // are connected to it. This means we can set the 'greedy' option.
    // Otherwise the drop event bubbles up when we drop over the sortable
    // and the pscroller event captures it first.
    $("#sortable").droppable({
        //accept: ".draggable",
        addClasses: false,
        greedy: true,
        drop: function() {},
    });

    $("#sourcesresizer").draggable({
        containment: '#headerbar',
        axis: 'x'
    });
    $("#sourcesresizer").bind("drag", srDrag);
    $("#sourcesresizer").bind("dragstop", srDragStop);
    $("#playlistresizer").draggable({
        containment: 'headerbar',
        axis: 'x'
    });
    $("#playlistresizer").bind("drag", prDrag);
    $("#playlistresizer").bind("dragstop", prDragStop);
    doThatFunkyThang();
    $("ul.topnav li a").click(function() {
        $(this).parent().find("ul.subnav").slideToggle('fast', function() {
            if ($(this).is(':visible')) {
                $(this).mCustomScrollbar("update");
                if ($(this).attr("id") == "hpscr") {
                    $('#hpscr').mCustomScrollbar("scrollTo", '.current', {scrollInertia:0});
                }
            }
        });
        return false;
    });

    loadKeyBindings();
    var obj = document.getElementById('volumecontrol');
    obj.addEventListener('mousedown', function(event) {
        event.preventDefault();
        infobar.volumeTouch(event);
    }, false);
    obj.addEventListener('mousemove', function(event) {
        event.preventDefault();
        infobar.volumeMouseMove(event);
    }, false);
    obj.addEventListener('mouseup', function(event) {
        infobar.volumeDragEnd(event);
    }, false);
    obj.addEventListener('mouseout', function(event) {
        infobar.volumeTouchEnd(event);
    }, false);
    $(".enter").keyup( onKeyUp );
    $(".lettuce,.tooltip").tipTip({delay: 1000, edgeOffset: 8});
    $.each([ "#sources", "#infopane", "#pscroller", "#lpscr", "#configpanel", "#hpscr", "#searchscr", ".drop-box" ], function( index, value ) {
        addCustomScrollBar(value);
    });
}

function initMobile() {
    var obj = document.getElementById('volumecontrol');
    obj.addEventListener('touchstart', function(event) {
        if (event.targetTouches.length == 1) {
            infobar.volumeTouch(event.targetTouches[0]);

        }
    }, false);
    obj.addEventListener('touchmove', function(event) {
        event.preventDefault();
        if (event.targetTouches.length == 1) {
            infobar.volumeTouch(event.targetTouches[0]);
        }
    }, false);
    obj.addEventListener('touchend', function(event) {
        infobar.volumeTouchEnd();
    }, false);
    $(window).touchwipe({
        wipeLeft: function() { swipeyswipe(1); },
        wipeRight: function() { swipeyswipe(-1) },
        min_move_x: 200,
        min_move_y: 1000,
        preventDefaultEvents: false
    });
}

function setPrefs() {
    $("#fontsize").attr({href: "sizes/"+prefs.fontsize});
    $("#fontfamily").attr({href: "fonts/"+prefs.fontfamily});
    $("#scrobbling").attr("checked", prefs.lastfm_scrobbling);
    $("#radioscrobbling").attr("checked", prefs.dontscrobbleradio);
    $("#autocorrect").attr("checked", prefs.lastfm_autocorrect);
    $("#button_hide_albumlist").attr("checked", prefs.hide_albumlist);
    $("#button_keep_search_open").attr("checked", prefs.keep_search_open);
    $("#button_hide_filelist").attr("checked", prefs.hide_filelist);
    $("#button_hide_lastfmlist").attr("checked", prefs.hide_lastfmlist);
    $("#button_hide_radiolist").attr("checked", prefs.hide_radiolist);
    $("#updateeverytime").attr("checked", prefs.updateeverytime);
    $("#downloadart").attr("checked", prefs.downloadart);
    $("#fullbiobydefault").attr("checked", prefs.fullbiobydefault);
    $("#scrolltocurrent").attr("checked", prefs.scrolltocurrent);
    $("#scrolltocurrent").attr("checked", prefs.scrolltocurrent);
    $("#sortbydate").attr("checked", prefs.sortbydate);
    $("#notvabydate").attr("checked", prefs.notvabydate);
    $("#themeselector").val(prefs.theme);
    $("#langselector").val(interfaceLanguage);
    $("#countryselector").val(prefs.lastfm_country_code);
    $("[name=clickselect][value="+prefs.clickmode+"]").attr("checked", true);
    $("[name=clicklfmlang][value="+prefs.lastfmlang+"]").attr("checked", true);
    $("[name=userlanguage]").val(prefs.user_lang);
    $("#twocolumnsinlandscape").attr("checked", prefs.twocolumnsinlandscape);
    $("#fontselector").val(prefs.fontsize);
    $("#fontfamselector").val(prefs.fontfamily);
    scrobwrangler = new progressBar('scrobwrangler', 'horizontal');
    scrobwrangler.setProgress(parseInt(prefs.scrobblepercent.toString()));
    $("#scrobwrangler").click( setscrob );
    $("#synctags").attr("checked", prefs.synctags);
    $("#synclove").attr("checked", prefs.synclove);
    $("#synclovevalue").val(prefs.synclovevalue);
}


function playlistMenuHeader() {
    var html = "";
    if (mobile == "no") {
        html = html + '<div class="containerbox"><div class="expand"><b>'+language.gettext("menu_playlists")+'</b></div></div>';
    } else {
        html = html + '<h3>'+language.gettext("menu_playlists")+'</h3>';
    }

    if (prefs.apache_backend == "sql") {
        html = html + '<div class="containerbox dropdown-container">'+
                        '<div class="fixed playlisticon"><img src="newimages/tag.png" height="12px" style="vertical-align:middle"></div>'+
                        '<div class="expand dropdown-holder">'+
                        '<input class="searchterm enter sourceform" id="cynthia" type="text" style="width:100%;font-size:100%"/>'+
                        '<div class="drop-box dropshadow tagmenu" id="tigger" style="width:100%">'+
                        '<div class="tagmenu-contents">'+
                        '</div>'+
                        '</div>'+
                        '</div>'+
                        '<div class="fixed dropdown-button" id="poohbear">'+
                        '<img src="newimages/dropdown.png">'+
                        '</div>'+
                        '<button class="fixed" style="margin-left:8px" onclick="playlist.loadSmart(\'tag\')">'+language.gettext('button_playradio')+'</button>'+
                        '</div>';
    }

    if (mobile == "no") {
        html = html + '<table width="100%">';
    } else {
        html = html + '<table width="90%">';
    }

    if (prefs.apache_backend == "sql") {
        html = html + '<tr><td class="playlisticon" align="left">';
        html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
        html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'1stars\')"><img src="newimages/1stars.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_xstar', ["1"])+'</a></td>';
        html = html + '<td></td></tr>';

        html = html + '<tr><td class="playlisticon" align="left">';
        html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
        html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'2stars\')"><img src="newimages/2stars.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_xstar', ["2"])+'</a></td>';
        html = html + '<td></td></tr>';

        html = html + '<tr><td class="playlisticon" align="left">';
        html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
        html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'3stars\')"><img src="newimages/3stars.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_xstar', ["3"])+'</a></td>';
        html = html + '<td></td></tr>';

        html = html + '<tr><td class="playlisticon" align="left">';
        html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
        html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'4stars\')"><img src="newimages/4stars.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_xstar', ["5"])+'</a></td>';
        html = html + '<td></td></tr>';

        html = html + '<tr><td class="playlisticon" align="left">';
        html = html + '<img src="newimages/singlestar.png" height="12px" style="vertical-align:middle"></td>';
        html = html + '<td align="left"><a href="#" onclick="playlist.loadSmart(\'5stars\')"><img src="newimages/5stars.png" height="12px" style="vertical-align:middle;margin-right:4px">'+language.gettext('playlist_5star')+'</a></td>';
        html = html + '<td></td></tr>';

    }
    return html;
}