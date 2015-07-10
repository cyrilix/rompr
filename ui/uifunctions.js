function openAlbumArtManager() {
    window.open('albumart.php');
}

function reloadWindow() {
    location.reload(true);
}

function forceCollectionReload() {
    collection_status = 0;
    checkCollection(false, false);
}

function saveSelectBoxes(event) {
    var prefobj = new Object();
    var prefname = $(event.target).attr("id").replace(/selector/,'');
    prefobj[prefname] = $(event.target).val();
    var callback = null;

    switch(prefname) {
        case "theme":
            $("#theme").attr({href: 'themes/'+$("#themeselector").val()});
            setTimeout(layoutProcessor.adjustLayout, 1000);
            break;

        case "icontheme":
            $("#icontheme-theme").attr("href", "iconsets/"+$("#iconthemeselector").val()+"/theme.css");
            $("#icontheme-adjustments").attr("href", "iconsets/"+$("#iconthemeselector").val()+"/adjustments.css");
            setTimeout(layoutProcessor.adjustLayout, 1000);
            break;

        case "fontsize":
            $("#fontsize").attr({href: "sizes/"+$("#fontsizeselector").val()});
            setTimeout(setSearchLabelWidth, 1000);
            setTimeout(infobar.biggerize, 1000);
            break;

        case "fontfamily":
            $("#fontfamily").attr({href: "fonts/"+$("#fontfamilyselector").val()});
            setTimeout(setSearchLabelWidth, 1000);
            setTimeout(infobar.biggerize, 1000);
            break;

        case "lastfm_country_code":
            prefobj.country_userset = true;
            break;

        case "coversize":
            $("#albumcoversize").attr({href: "coversizes/"+$("#coversizeselector").val()});
            setTimeout(browser.rePoint, 1000);
            break;

    }
    prefs.save(prefobj, callback);
}

function changelanguage() {
    prefs.save({language: $("#langselector").val()}, function() {
        location.reload(true);
    });
}

function togglePref(event) {
    var prefobj = new Object;
    var prefname = $(event.target).attr("id");
    prefobj[prefname] = $("#"+prefname).is(":checked");
    var callback = null;
    switch (prefname) {
        case 'downloadart':
            coverscraper.toggle($("#"+prefname).is(":checked"));
            break;

        case 'hide_albumlist':
            callback = function() { hidePanel('albumlist') }
            break;

        case 'hide_filelist':
            callback = function() { hidePanel('filelist') }
            break;

        case 'hide_radiolist':
            callback = function() { hidePanel('radiolist') }
            break;

        case 'hidebrowser':
            callback = hideBrowser;
            break;

        case 'search_limit_limitsearch':
            callback = weaselBurrow;
            break;

        case 'ignore_unplayable':
        case 'sortbycomposer':
        case 'composergenre':
            $("#donkeykong").makeFlasher({flashtime: 0.5, repeats: 3});
            break;

        case 'displaycomposer':
        debug.log("PREFS","Display Composer Option was changed");
            callback = player.controller.doTheNowPlayingHack;
            break

        case "sortbydate":
        case "notvabydate":
            callback = forceCollectionReload;
            break;

    }
    prefs.save(prefobj, callback);
}

function toggleRadio(event) {
    var prefobj = new Object;
    var prefname = $(event.target).attr("name");
    prefobj[prefname] = $('[name='+prefname+']:checked').val();
    var callback = null;
    switch(prefname) {
        case 'clickmode':
            callback = setClickHandlers;
            break;

        case 'sortcollectionby':
            callback = forceCollectionReload;
            break;

        case 'displayresultsas':
            callback = function() {
                player.controller.reSearch();
            }
            break;
    }
    prefs.save(prefobj, callback);
}

function saveTextBoxes() {
    clearTimeout(textSaveTimer);
    textSaveTimer = setTimeout(doTheSave, 1000);
}

function doTheSave() {
    var felakuti = new Object;
    var callback = null;
    $(".saveotron").each( function() {
        if ($(this).hasClass("arraypref")) {
            felakuti[$(this).attr("id")] = $(this).attr("value").split(',');
        } else {
            felakuti[$(this).attr("id")] = $(this).attr("value");
        }
        switch ($(this).attr("id")) {
            case "composergenrename":
                if (felakuti.composergenrename != prefs.composergenrename) {
                    $("#donkeykong").makeFlasher({flashtime:0.5, repeats: 3});
                }
                break;

            case "artistsatstart":
            case "nosortprefixes":
                if (felakuti.artistsatstart != prefs.artistsatstart ||
                    felakuti.nosortprefixes != prefs.nosortprefixes) {
                    callback = forceCollectionReload;
                }
                break;

            case "crossfade_duration":
                if (felakuti.crossfade_duration != player.status.xfade && 
                    player.status.xfade !== undefined && 
                    player.status.xfade !== null && 
                    player.status.xfade > 0) {
                    callback = function() { player.controller.setCrossfade(felakuti.crossfade_duration) }
                }
                break;
        }
    });
    prefs.save(felakuti, callback);
}

function setPrefs() {
    $("#langselector").val(interfaceLanguage);

    scrobwrangler = new progressBar('scrobwrangler', 'horizontal');
    scrobwrangler.setProgress(parseInt(prefs.scrobblepercent.toString()));
    $("#scrobwrangler").click( setscrob );

    $.each($('.autoset'), function() {
        $(this).attr("checked", prefs[$(this).attr("id")]);
    });

    $.each($('.saveotron'), function() {
        if ($(this).hasClass('arraypref')) {
            var a = prefs[$(this).attr("id")];
            $(this).val(a.join());
        } else {
            $(this).val(prefs[$(this).attr("id")]);
        }
    });

    $.each($('.saveomatic'), function() {
        var prefname = $(this).attr("id").replace(/selector/,'');
        $(this).val(prefs[prefname]);
    });

    $.each($('.savulon'), function() {
        var prefname = $(this).attr("name");
        $("[name="+prefname+"][value="+prefs[prefname]+"]").attr("checked", true);
    });

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

function togglePlaylistButtons() {
    if (!$("#playlistbuttons").is(":visible")) {
        // Make the playlist scroller shorter so the window doesn't get a vertical scrollbar
        // while the buttons are being slid down
        var newheight = $("#pscroller").height() - 48;
        $("#pscroller").css("height", newheight.toString()+"px");
    }
    $("#playlistbuttons").slideToggle('fast', layoutProcessor.setPlaylistHeight);
    var p = !prefs.playlistcontrolsvisible;
    prefs.save({ playlistcontrolsvisible: p });
    return false;
}

function toggleCollectionButtons() {
    $("#collectionbuttons").slideToggle('fast');
    var p = !prefs.collectioncontrolsvisible;
    prefs.save({ collectioncontrolsvisible: p });
    return false;    
}

function lastfmlogin() {
    var user = $("#configpanel").find('input[name|="user"]').attr("value");
    lastfm.login(user);
    $("#configpanel").fadeOut(1000);
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

    $.ajax( {
        type: "GET",
        url: "utils/getInternetPlaylist.php",
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
        url: "utils/getUserStreamPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: {name: xspf},
        dataType: "xml",
        success: playlist.newInternetRadioStation,
        error: function(data, status) {
            playlist.repopulate();
            infobar.notify(infobar.ERROR, language.gettext("label_tunefailed"));
        }
    } );
}

function removeUserStream(xspf) {
    $.ajax( {
        type: "GET",
        url: "utils/getUserStreamPlaylist.php",
        cache: false,
        contentType: "text/xml; charset=utf-8",
        data: {remove: xspf},
        success: function(data, status) {
            if (!prefs.hide_radiolist) {
                $("#yourradiolist").load("streamplugins/00_yourradio.php?populate",
                    function() { saveRadioOrder() });
            }
        },
        error: function(data, status) {
            playlist.repopulate();
            infobar.notify(infobar.ERROR, language.gettext("label_general_error"));
        }
    } );
}

var imagePopup = function() {
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
            debug.log("IMAGEPOPUP", "Current popup source is",image.src);
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
            wikipopup.append($('<i>', {class: 'icon-spin6 smallcover-svg spinner', style: 'position:relative;top:8px;left:8px'}));
            wikipopup.fadeIn('fast');
            if (source !== undefined) {
                if (source == image.src) {
                    imagePopup.show();
                } else {
                    image.src = "";
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
                    wikipopup.append($('<i>', {class: 'icon-cancel-circled playlisticon tright clickicon', style: 'margin-top:4px;margin-right:4px'}));
                }
            );
        },

        close:function() {
            wikipopup.fadeOut('slow');
            imagecontainer.fadeOut('slow');
        }
    }
}();

function outputswitch(id) {
    player.controller.doOutput(id, $('#outputbutton'+id).isToggledOff());
    $('#outputbutton'+id).switchToggle($('#outputbutton'+id).isToggledOff());
}

var popupWindow = function() {

    var popup;
    var userheight;
    var wantedwidth;
    var wantedheight;
    var wantshrink;
    var closeCall = null;

    return {
        create:function(w,h,id,shrink,title,xpos,ypos) {
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
                '<i class="icon-cancel-circled playlisticon clickicon" onclick="popupWindow.close()"></i></td></tr></table>');
            $(popup).append('<div id="popupcontents"></div>');
            var winsize = getWindowSize();
            var windowScroll = getScrollXY();
            var lsize = layoutProcessor.maxPopupSize(winsize);
            if (lsize.width > w) { lsize.width = w; }
            if (lsize.height > h) { lsize.height = h; }
            if (typeof xpos == "undefined") {
                var x = (winsize.x - lsize.width)/2 + windowScroll.x;
                var y = (winsize.y - lsize.height)/2 + windowScroll.y;
            } else {
                var x = Math.min(xpos, (winsize.x - lsize.width));
                var y = Math.min(ypos, (winsize.y - lsize.height));
            }
            popup.style.width = parseInt(lsize.width) + 'px';
            userheight = lsize.height;
            if (!shrink) {
                popup.style.height = parseInt(lsize.height) + 'px';
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
            var winsize = getWindowSize();
            var windowScroll = getScrollXY();
            var lsize = layoutProcessor.maxPopupSize(winsize);
            if (lsize.width > wantedwidth) { lsize.width = wantedwidth; }
            if (lsize.height > wantedheight) { lsize.height = wantedheight; }
            var x = (winsize.x - lsize.width)/2 + windowScroll.x;
            var y = (winsize.y - lsize.height)/2 + windowScroll.y;
            popup.style.width = parseInt(lsize.width) + 'px';
            userheight = lsize.height;
            if (!wantshrink) {
                popup.style.height = parseInt(lsize.height) + 'px';
            }
            popup.style.top = parseInt(y) + 'px';
            popup.style.left = parseInt(x) + 'px';
        },
        onClose: function(callback) {
            closeCall = callback;
        }
    };
}();

function setPlaylistButtons() {
    c = (player.status.xfade === undefined || player.status.xfade === null || player.status.xfade == 0) ? "off" : "on";
    $("#crossfade").switchToggle(c);
    $.each(['random', 'repeat', 'consume'], function(i,v) {
        $("#"+v).switchToggle(player.status[v]);
    });
    if (player.status.replay_gain_mode) {
        $.each(["off","track","album","auto"], function(i,v) {
            if (player.status.replay_gain_mode == v) {
                $("#replaygain_"+v).switchToggle("on");
            } else {
                $("#replaygain_"+v).switchToggle("off");
            }
        });
    }
}

function onStorageChanged(e) {

    debug.log("GENERAL","Storage Event",e);

    if (e.key == "key" && e.newValue != "Blerugh") {
        var key = e.newValue;
        debug.log("GENERAL","Updating album image for key",key,e);
        if (key.substring(0,1) == "!") {
            key = key.substring(1,key.length);
            $('img[name="'+key+'"]').removeClass("notexist").addClass("notfound");
        } else {
            $('img[name="'+key+'"]').removeClass("notexist notfound").attr("src", "").hide().show();
            var fch = Math.random()*1000;
            $('img[name="'+key+'"]').attr("src", "albumart/asdownloaded/firefoxiscrap/"+key+"---"+fch.toString());
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
            url: 'utils/saveRadioOrder.php',
            data: {'order[]': radioOrder}
    });
}

function doingOnTheFly() {
    return (player.collectionLoaded && prefs.onthefly);
}

function prepareForLiftOff(text) {
    if (doingOnTheFly()) {
        doSomethingUseful('fothergill', text);
        infobar.notify(infobar.PERMNOTIFY,text);
    } else {
        $("#collection").empty();
        doSomethingUseful('collection', text);
    }
}

function prepareForLiftOff2(text) {
    $("#filecollection").empty();
    doSomethingUseful("filecollection", text);
}

/* This is called when the page loads. It checks to see if the albums/files cache exists
    and builds them, if necessary. If they are there, it loads them
*/

function checkCollection(forceup, rescan) {
    var update = forceup;
    if (prefs.updateeverytime) {
        debug.mark("GENERAL","Updating Collection due to preference");
        update = true;
    } else {
        if (!prefs.hide_albumlist && collection_status == 1) {
            debug.mark("GENERAL","Updating Collection because it is out of date");
            collection_status = 0;
            update = true;
        }
    }
    if (update) {
        $("#searchresultholder").html('');
        player.controller.scanFiles(rescan ? 'rescan' : 'update');
    } else {
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            loadCollection('albums.php?item=aalbumroot', null);
        } else if (prefs.hide_albumlist && !prefs.hide_filelist) {
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hide_albumlist && !prefs.hide_filelist) {
            loadCollection('albums.php?item=aalbumroot', 'dirbrowser.php');
        }
    }
}

function loadCollection(albums, files) {
    if (albums != null) {
        debug.log("GENERAL","Loading Collection from URL",albums);
        player.controller.loadCollection(albums);
    }
    if (files != null) {
        debug.log("GENERAL","Loading File Browser from URL",files);
        player.controller.reloadFilesList(files);
    }
}

function checkPoll(data) {
    if (data.updating_db) {
        update_load_timer = setTimeout( pollAlbumList, 1000);
        update_load_timer_running = true;
    } else {
        var getalbums = doingOnTheFly() ? 'backends/sql/onthefly.php?command=listallinfo' : 'albums.php?rebuild=yes';
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            loadCollection(getalbums, null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            loadCollection(getalbums, 'dirbrowser.php');
        }
    }
}

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("player/mpd/postcommand.php", checkPoll);
}

function scootTheAlbums(jq) {
    $.each(jq.find("img.notexist"), function() {
        coverscraper.GetNewAlbumArt($(this).attr('name'));
    });
}

function hidePanel(panel) {
    var is_hidden = $("#"+panel).is(':hidden');
    var new_state = prefs["hide_"+panel];
    debug.log("GENERAL","Hide Panel",panel,is_hidden,new_state);
    layoutProcessor.hidePanel(panel, is_hidden, new_state);
    if (new_state) {
        switch (panel) {
            case "radiolist":
                $("#bbclist").empty();
                $("#somafmlist").empty();
                $("#yourradiolist").empty();
                $("#icecastlist").empty();
                break;
            case "albumlist":
                if (update_load_timer_running == false) {
                    $("#collection").empty();
                    $("#collection").prev().hide();
                    $("#collection").prev().prev().hide();
                }
                break;
            case "filelist":
                if (update_load_timer_running == false) {
                    $("#filecollection").empty();
                }
                break;
        }
    } else {
        switch (panel) {
            case "radiolist":
                $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
                podcasts.loadList();
                break;
            case "albumlist":
                if (update_load_timer_running == false) {
                    loadCollection('albums.php?item=aalbumroot', null);
                }
                $("#collection").prev().show();
                $("#collection").prev().prev().show();
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

function doSomethingUseful(div,text) {
    var html = '<div class="containerbox bar">';
    if (typeof div == "string") {
        html = '<div class="containerbox bar" id= "spinner_'+div+'">';
    }
    html = html + '<div class="fixed" style="vertical-align:middle;padding-left:8px"><i class="icon-spin6 smallcover-svg spinner"></i></div>';
    html = html + '<h3 class="expand ucfirst label">'+text+'</h3>';
    html = html + '</div>';
    if (typeof div == "object") {
        div.append(html);
    } else if (typeof div == "string") {
        $("#"+div).append(html);
    }
}

function setChooserButtons() {
    var s = ["albumlist", "filelist", "radiolist"];
    for (var i in s) {
        if (prefs["hide_"+s[i]]) {
            $(".choose_"+s[i]).fadeOut('fast');
        } else {
            $(".choose_"+s[i]).fadeIn('fast');
        }
    }
}

function findImageInWindow(key) {
    $.each($('img[name="'+key+'"]'), function() {
        var u = $(this).attr("src");
        if (!$(this).hasClass('notexist') && !$(this).hasClass('notfound') && u != "") {
            return { url: u, origimage: u.replace(/small/, 'asdownloaded'), delaytime: 100 };
        }
    });
    return false;
}

function handleDropRadio(ev) {
    setTimeout(function() { doInternetRadio('yourradioinput') }, 1000);
}

function getrgbs(percent) {

    if (typeof percent != "number") {
        percent = parseFloat(percent);
    }

    percent = Math.min(percent, 100);
    var highr = Math.round(155+percent);
    var highg = Math.round(75+percent);
    // var lowalpha = Math.min(percent/75, 1);
    // var highalpha = Math.min(percent/25, 1);
    var lowalpha = 0.8;
    var highalpha = 1;

    return "rgba(150,75,0,"+lowalpha+") 0%,rgba("+highr+","+highg+",0,"+highalpha+") "+percent+"%,rgba(0,0,0,0.1) "+percent+"%,rgba(0,0,0,0.1) 100%)";

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

        var rgbs = getrgbs(percent);
        var gradients = new Array();

        if (orientation == "horizontal") {
            gradients.push("linear-gradient(to right, "+rgbs);
            gradients.push("-moz-linear-gradient(left, "+rgbs);
            gradients.push("-o-linear-gradient(left, "+rgbs);
        } else {
            gradients.push("linear-gradient(to top, "+rgbs);
            gradients.push("-moz-linear-gradient(bottom, "+rgbs);
            gradients.push("-o-linear-gradient(bottom, "+rgbs);
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

function removeTrackFromDb(element) {
    var trackDiv = element.parent();
    if (!trackDiv.hasClass('clicktrack')) {
        trackDiv = trackDiv.parent();
    }
    var trackToGo = trackDiv.attr("name");
    debug.log("DB_TRACKS","Remove track from database",trackToGo);
    trackDiv.fadeOut('fast');
    $.ajax({
        url: "backends/sql/userRatings.php",
        type: "POST",
        data: {action: 'delete', uri: decodeURIComponent(trackToGo)},
        dataType: 'json',
        success: function(rdata) {
            debug.log("DB TRACKS","Track was removed");
            updateCollectionDisplay(rdata);
        },
        error: function() {
            debug.log("DB TRACKS", "Failed to remove track");
            infobar.notify(infobar.ERROR, "Failed to remove track!");
        }
    });
}

function populateTagMenu(callback) {
    $.ajax({
        url: "backends/sql/userRatings.php",
        type: "POST",
        data: { action: 'gettags' },
        dataType: 'json',
        success: callback,
        error: function() {
            debug.error("DB TRACKS", "Failed to get tags");
        }
    });
}

var tagAdder = function() {

    var index = null;
    var lastelement = null;

    return {
        show: function(evt, idx) {
            if (evt.target == lastelement) {
                tagAdder.close();                
            }  else {
                index = idx;
                var position = getPosition(evt);
                layoutProcessor.setTagAdderPosition(position);
                $("#tagadder").fadeIn('fast');
                lastelement = evt.target;
            }
        },

        close: function() {
            $("#tagadder").fadeOut('fast');
            lastelement = null;
        },

        add: function(toadd) {
            debug.log("TAGADDER","New Tags :",toadd);
            nowplaying.addTags(index, toadd);
            $("#tagadder").slideToggle('fast');
        }
    }
}();

var pluginManager = function() {

    // Plugins (from the plugins directory) shoud call pluginManager.addPlugin at load time.
    // They must supply a label and either an action function, a setup function, or both.
    // The setup function will be called as soon as all the page scripts have loaded,
    // before the layout is initialised. If a plugin wishes to add icons to the layout,
    // or hotkeys, it should do it here. 
    // If an action function is provided the plugin's label will be added to the dropdown list 
    // above the info panel and the action function will be called when the label is clicked.
    // Note that plugins are not used in the mobile layout - for memory reasons. Most plugins
    // provide services that are not useful on a mobile screen anyway.

    var plugins = new Array();

    return {
        addPlugin: function(label, action, setup) {
            debug.log("PLUGINS","Adding Plugin",label);
            plugins.push({label: label, action: action, setup: setup});
        },

        doEarlyInit: function() {
            for (var i in plugins) {
                if (plugins[i].setup) {
                    debug.log("PLUGINS","Setting up Plugin",plugins[i].label);
                    plugins[i].setup();
                }
            }
        },

        setupPlugins: function() {
            for (var i in plugins) {
                if (plugins[i].action) {
                    debug.log("PLUGINS","Setting up Plugin",plugins[i].label);
                    $("#specialplugins").append('<div class="backhi clickable clickicon noselection menuitem" name="'+i+'">'+plugins[i].label+'</div>');
                }
            }
            $("#specialplugins .clickicon").click(function() {
                var index = parseInt($(this).attr('name'));
                plugins[index].action();
            });
        }
    }
}();

function joinartists(ob) {

    if (typeof(ob) != "object") {
        return ob;
    } else {
        if (typeof(ob[0]) == "string") {
            // As returned by MPD in its Status ie for Performer
            // However these are returned as an Object rather than as an Array and we need an array
            // (Yes, arrays and object are the same, more or less, but Objects don't have a slice method)
            var a = new Array();
            for (var i in ob) {
                a.push(ob[i]);
            }
            return concatenate_artist_names(a);
        } else {
            var t = new Array();
            for (var i in ob) {
                var flub = ""+ob[i].name;
                t.push(flub);
            }
            return concatenate_artist_names(t);
        }
    }
}

function concatenate_artist_names(t) {
    if (t.length == 0) {
        return "";
    } else if (t.length == 1) {
        return t[0];
    } else if (t.length == 2) {
        return t.join(" & ");
    } else {
        var f = t.slice(0, t.length-1);
        return f.join(", ") + " & " + t[t.length-1];
    }
}

function randomsort(a,b) {
    if (Math.random() > 0.5) {
        return 1;
    } else {
        return -1;
    }
}

var thisIsMessy = new Array();

function addAlbumTracksToCollection(data) {
    if (data.tracks && data.tracks.items) {
        infobar.notify(infobar.NOTIFY, "Adding Album To Collection");
        for (var i in data.tracks.items) {
            var track = {};
            track.title = data.tracks.items[i].name;
            track.artist = joinartists(data.tracks.items[i].artists);
            track.trackno = data.tracks.items[i].track_number;
            track.duration = data.tracks.items[i].duration_ms/1000;
            track.disc = data.tracks.items[i].disc_number;
            track.albumartist = joinartists(data.artists);
            track.spotilink = data.uri;
            if (data.images) {
                for (var j in data.images) {
                    if (data.images[j].url) {
                        track.image = "getRemoteImage.php?url="+data.images[j].url;
                        break;
                    }
                }
            }
            track.album = data.name;
            track.uri = data.tracks.items[i].uri;
            track.date = data.release_date;
            track.action = 'add';
            thisIsMessy.push(track);
        }
        if (thisIsMessy.length == data.tracks.items.length) {
            doTheTrackAddingThing();
        }
    } else {
        debug.fail("SPOTIFY","Failed to add album - no tracks",data);
        infobar.notify(infobar.ERROR, "Failed To Add Album To Collection");
    }
}

function doTheTrackAddingThing() {
    var data = thisIsMessy.shift();
    if (data) {
        $.ajax({
            url: "backends/sql/userRatings.php",
            type: "POST",
            data: data,
            dataType: 'json',
            success: addedATrack,
            error: didntAddATrack
        });
    }
}

function addedATrack(rdata) {
    debug.log("ADD ALBUM","Success",rdata);
    if (rdata) {
        updateCollectionDisplay(rdata);
    }
    doTheTrackAddingThing();
}

function didntAddATrack(rdata) {
    debug.error("ADD ALBUM","Failure",rdata);
    infobar.notify(infobar.ERROR,"Failed To Add Track!");
    doTheTrackAddingThing();
}

function failedToAddAlbum(data) {
    debug.fail("ADD ALBUM","Failed to add album",data);
    infobar.notify(infobar.ERROR, "Failed To Add Album To Collection");
}

function setSearchLabelWidth() {
    var w = 0;
    $.each($(".slt"), function() {
        if ($(this).width() > w) {
            w = $(this).width();
        }
    });
    w += 8;
    $(".searchlabel").css("width", w+"px");
    if (prefs.search_limit_limitsearch) {
        $("#mopidysearchdomains").show();
    } else {
        $("#mopidysearchdomains").hide();
    }
}

function audioClass(filetype) {
    filetype = filetype.toLowerCase();
    switch (filetype) {
        case "mp3":
            return 'icon-mp3-audio';
            break;

        case "mp4":
        case "m4a":
        case "aac":
        case "aacplus":
            return 'icon-aac-audio';
            break;

        case "flac":
            return 'icon-flac-audio';
            break;

        case "wma":
        case "windows media":
            return 'icon-wma-audio';
            break;

        case "ogg":
        case "ogg vorbis":
            return 'icon-ogg-audio';
            break;

        default:
            return 'icon-library';
            break;

    }
}

function displayRating(where, what) {
    $(where).removeClass("icon-0-stars icon-1-stars icon-2-stars icon-3-stars icon-4-stars icon-5-stars");
    if (what !== false) {
        $(where).addClass('icon-'+what+'-stars');
    }
}

function showUpdateWindow() {
    if (prefs.shownupdatewindow === true || prefs.shownupdatewindow < rompr_version) {
        var fnarkle = popupWindow.create(550,900,"fnarkle",true,language.gettext("intro_title"));
        $("#popupcontents").append('<div id="fnarkler" class="mw-headline"></div>');
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_welcome")+' '+rompr_version+'</p>');
        if (skin != "desktop") {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewingmobile")+' <a href="/rompr/?skin=desktop">/rompr/?skin=desktop</a></p>');
        } else {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewmobile")+' <a href="/rompr/?skin=phone">/rompr/?skin=phone</a></p>');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_basicmanual")+' <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_forum")+' <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">http://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p align="center">RompR needs translators! If you want to get involved, please read <a href="https://sourceforge.net/p/rompr/wiki/Translating%20RompR/" target="_blank">this</a></p>');
        if (prefs.player_backend == "mopidy") {
            $("#fnarkler").append('<p align="center"><b>Mopidy is STILL SUPPORTED! Rompr now uses the Mopidy MPD frontend</b></p>');
            $("#fnarkler").append('<p align="center"><b>'+language.gettext("intro_mopidy")+'</b></p>');
            $("#fnarkler").append('<p align="center"><a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/" target="_blank">'+language.gettext("intro_mopidywiki")+'</a></p>');
        }
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: rompr_version});
    }
}

function removeOpenItems(index) {
    if ($(this).hasClass('clicktrack') || $(this).hasClass('clickcue')) {
        return true;
    }
    // Filter out artist and album items whose dropdowns have been populated -
    // In these cases the individual tracks will exist and will be selected
    // (and might only have partial selections even if the header is selected)
    if ($("#"+$(this).attr('name')).length == 0) {
        return true;
    } else if ($("#"+$(this).attr('name')).hasClass('notfilled') || $(this).hasClass('onefile')) {
        return true;
    } else {
        return false;
    }
}

function doPluginDropStuff(name,attributes,fn) {
    var tracks = new Array();
    $.each($('.selected').filter(removeOpenItems), function (index, element) {
        var uri = unescapeHtml(decodeURIComponent($(element).attr("name")));
        debug.log("DROPPLUGIN","Dragged",uri,"to",name);
        if ($(element).hasClass('directory')) {
            tracks.push({
                uri: decodeURIComponent($(element).children('input').first().attr('name')),
                action: 'geturisfordir',
                attributes: attributes
            });
        } else if ($(element).hasClass('clickalbum')) {
            tracks.push({
                uri: uri,
                action: 'geturis',
                attributes: attributes
            });
        } else {
            tracks.push({
                uri: uri,
                artist: 'dummy',
                title: 'dummy',
                urionly: '1',
                action: 'set',
                attributes: attributes
            });
        }
    });

    (function dotags() {
        var track = tracks.shift();
        if (track) {
            if (track.action == 'geturis' ||
                track.action == 'geturisfordir') {
                $.ajax({
                    url: "backends/sql/userRatings.php",
                    type: "POST",
                    data: track,
                    dataType: 'json',
                    success: function(rdata) {
                        for (var i in rdata) {
                            var u = rdata[i];
                            u = u.replace(/ \"/,'');
                            u = u.replace(/\"$/, '');
                            tracks.push({
                                uri: u,
                                artist: 'dummy',
                                title: 'dummy',
                                urionly: '1',
                                action: 'set',
                                attributes: track.attributes
                            });
                        }
                        dotags();
                    },
                    error: function() {
                        debug.error("DROPPLUGIN","Error looking up track URIs");
                        infobar.notify(infobar.ERROR, "Failed To Set Attributes");
                        dotags();
                    }
                });
            } else {
                $.ajax({
                    url: "backends/sql/userRatings.php",
                    type: "POST",
                    data: track,
                    dataType: 'json',
                    success: function(rdata) {
                        dotags();
                    },
                    error: function(data) {
                        debug.warn("DROPPLUGIN","Failed to set attributes for",track,data);
                        infobar.notify(infobar.ERROR, "Failed To Set Attributes");
                        dotags();
                    }
                });
            }
        } else {
            tracks = null;
            fn(name);
        }
    })();
    
}

function makeHoverWork(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    var jq = $(ev.target);
    var position = getPosition(ev);
    var elemright = jq.width() + jq.offset().left;
    if (position.x > elemright - 14) {
        jq.css('cursor','pointer');
    } else {
        jq.css('cursor','auto');
    }
} 

function checkSearchDomains() {
    // $("#mopidysearchdomains").find('.searchdomain').each( function() {
    //     var v = $(this).attr("value");
    //     if (v == "radio_de") {
    //         v = "radio-de";
    //     }
    //     if (!player.canPlay(v)) {
    //         $(this).parent().remove();
    //     }
    // });
    $("#mopidysearchdomains").makeDomainChooser({
        default_domains: prefs.mopidy_search_domains,
    });
    $("#mopidysearchdomains").find('input.topcheck').each(function() {
        $(this).click(function() {
            prefs.save({mopidy_search_domains: $("#mopidysearchdomains").makeDomainChooser("getSelection")});
        });
    });
}

function doMopidyCollectionOptions() {

    // Mopidy Folders to browse when building the collection

    // spotifyweb folders are SLOW, but that's to be expected.
    // We use 'Albums' to get 'Your Music' because, although it requires more requests than 'Songs', each response will be small
    // enough to handle easily and there's less danger of timeouts or running into memory issues or pagination.

    var domains = {
        local: [{dir: "Local media", label: "Local Media"}],
        beetslocal: [{dir: "Local (beets)", label: "Local (beets)"}],
        spotify: [{dir: "Spotify Playlists", label: "Spotify Playlists"}],
        spotifyweb: [{dir: "Spotify Web Browse/Your Music/Albums", label: "Spotify 'Your Music'"},
                     {dir: "Spotify Web Browse/Your Artists", label: "Your Spotify Artists (Slow!)"}],
        gmusic: [{dir: "Google Music", label: "Google Music"}],
        soundcloud: [{dir: "SoundCloud/Liked", label: "SoundCloud Liked"}],
        vkontakte: [{dir: "VKontakte", label: "VKontakte" }]
    }

    for (var i in domains) {
        if (player.canPlay(i)) {
            for (var j in domains[i]) {
                var fum = 
                    '<div class="styledinputs indent">'+
                    '<input class="mopocol" type="checkbox" id="mopcol_'+i+j+'"';
                    if (prefs.mopidy_collection_folders.indexOf(domains[i][j].dir) > -1) {
                        fum += ' checked';
                    }
                    fum += '>'+
                    '<label for="mopcol_'+i+j+'">'+domains[i][j].label+'</label>'+
                    '<input type="hidden" name="'+domains[i][j].dir+'" />'+
                    '</div>';
                $("#mopidycollectionoptions").append(fum);
            }
        }
    }
    $('.mopocol').click(function() {
        var opts = new Array();
        $('.mopocol:checked').each(function() {
            opts.push($(this).next().next().attr('name'));
        });
        debug.log("MOPIDY","Collection Options Are",opts);
        prefs.save({mopidy_collection_folders: opts});
    });
}

$.widget("rompr.makeDomainChooser", {
    
    options: {
        default_domains: [],
        sources_not_to_choose: {
                file: 1,
                http: 1,
                https: 1,
                mms: 1,
                rtsp: 1,
                somafm: 1,
                spotifytunigo: 1,
                rtmp: 1,
                rtmps: 1,
                sc: 1,
                yt: 1,
                m3u: 1,
                spotifyweb: 1,
                'podcast+http': 1,
                'podcast+https': 1,
                'podcast+ftp': 1,
                'podcast+file': 1,
        }
    },

    _create: function() {
        var self = this;
        this.options.holder = $('<div>').appendTo(this.element);
        var p = faveFinder.getPriorities();
        p.reverse();
        for (var i in p) {
            if (player.canPlay(p[i])) {
                var makeunique = $("[id^='"+p[i]+"_import_domain']").length+1;
                var id = p[i]+'_import_domain_'+makeunique;
                this.options.holder.append('<div class="brianblessed styledinputs"><input type="checkbox" class="topcheck" id="'+id+'"><label for="'+id+'">'+p[i].capitalize()+'</label></div>');
            }
        }
        for (var i in player.urischemes) {
            if (p.indexOf(i) == -1 && !this.options.sources_not_to_choose.hasOwnProperty(i)) {
                var makeunique = $("[id^='"+i+"_import_domain']").length+1;
                var id = i+'_import_domain_'+makeunique;
                this.options.holder.append('<div class="brianblessed styledinputs"><input type="checkbox" class="topcheck" id="'+id+'"><label for="'+id+'">'+i.capitalize()+'</label></div>');
            }
        }
        this.options.holder.find('.topcheck').each(function() {
            var n = $(this).attr("id");
            var d = n.substr(0, n.indexOf('_'));
            if (self.options.default_domains.indexOf(d) > -1) {
                $(this).attr("checked", true);
            }
        });
        this.options.holder.disableSelection();        
    },

    _setOption: function(key, value) {
        this.options[key] = value;
    },

    getSelection: function() {
        var result = new Array();
        this.options.holder.find('.topcheck:checked').each( function() {
            var n = $(this).attr("id");
            result.push(n.substr(0, n.indexOf('_')));
        });
        return result;
    }

});
