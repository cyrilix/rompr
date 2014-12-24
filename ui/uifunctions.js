function openAlbumArtManager() {
    window.open('albumart.php');
}

function reloadWindow() {
    location.reload(true);
}

function saveSelectBoxes(event) {
    var prefobj = new Object();
    var prefname = $(event.target).attr("id").replace(/selector/,'');
    prefobj[prefname] = $(event.target).val();
    var callback = null;

    switch(prefname) {
        case "theme":
            $("#theme").attr({href: 'themes/'+$("#themeselector").val()});
            break;

        case "icontheme":
            $("#icontheme-theme").attr("href", "iconsets/"+$("#iconthemeselector").val()+"/theme.css");
            $("#icontheme-adjustments").attr("href", "iconsets/"+$("#iconthemeselector").val()+"/adjustments.css");
            break;

        case "fontsize":
            $("#fontsize").attr({href: "sizes/"+$("#fontsizeselector").val()});
            setTimeout(setSearchLabelWidth, 2000);
            setTimeout(infobar.biggerize, 2000);
            break;

        case "fontfamily":
            $("#fontfamily").attr({href: "fonts/"+$("#fontfamilyselector").val()});
            setTimeout(setSearchLabelWidth, 2000);
            setTimeout(infobar.biggerize, 2000);
            break;

        case "lastfm_country_code":
            prefobj.country_userset = true;
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
            callback = function() {
                albumslistexists = true;
                checkCollection(false, false);
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
    $(".saveotron").each( function() {
        if ($(this).hasClass("arraypref")) {
            felakuti[$(this).attr("id")] = $(this).attr("value").split(',');
        } else {
            felakuti[$(this).attr("id")] = $(this).attr("value");
        }
    });
    if (felakuti.crossfade_duration != player.status.xfade && player.status.xfade !== undefined && player.status.xfade !== null && player.status.xfade > 0) {
        player.controller.setCrossfade(felakuti.crossfade_duration);
    }
    prefs.save(felakuti);
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
            alert(language.gettext("label_tunefailed"));
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
            alert(language.gettext("label_general_error"));
        }
    } );
}

function toggleFileSearch() {
    $("#filesearch").slideToggle('fast');
    return false;
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
                    wikipopup.append($('<i>', {class: 'icon-cancel-circled playlisticon tright', style: 'margin-top:4px;margin-right:4px'}));
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
    if ($('#outputbutton'+id).hasClass("togglebutton-0")) {
        $('#outputbutton'+id).removeClass("togglebutton-0").addClass("togglebutton-1");
        player.controller.doOutput(id, true);
    } else {
        $('#outputbutton'+id).removeClass("togglebutton-1").addClass("togglebutton-0");
        player.controller.doOutput(id, false);
    }
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
                '<i class="icon-cancel-circled playlisticon clickicon" onclick="popupWindow.close()"></i></td></tr></table>');
            $(popup).append('<div id="popupcontents"></div>');
            var winsize = getWindowSize();
            var windowScroll = getScrollXY();
            var lsize = layoutProcessor.maxPopupSize(winsize);
            if (lsize.width > w) { lsize.width = w; }
            if (lsize.height > h) { lsize.height = h; }
            var x = (winsize.x - lsize.width)/2 + windowScroll.x;
            var y = (winsize.y - lsize.height)/2 + windowScroll.y;
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
    c = (player.status.xfade === undefined || player.status.xfade === null || player.status.xfade == 0) ? 0 : 1;
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
            $('img[name="'+key+'"]').attr("src", "albumart/small/"+key+".jpg");
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
            url: 'utils/saveRadioOrder.php',
            data: {'order[]': radioOrder}
    });
}

function doingOnTheFly() {
    return (prefs.apache_backend == "sql" && player.collectionLoaded && prefs.onthefly);
}

function prepareForLiftOff(text) {
    if (doingOnTheFly()) {
        doSomethingUseful('fothergill', text);
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
        player.controller.updateCollection(rescan ? 'rescan' : 'update');
    } else {
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            debug.log("GENERAL","Loading albums cache only");
            loadCollection('albums.php?item=aalbumroot', null);
        } else if (prefs.hide_albumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Loading Files Cache Only");
            loadCollection(null, 'dirbrowser.php?item=adirroot');
        } else if (!prefs.hide_albumlist && !prefs.hide_filelist) {
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
        var getalbums = 'albums.php?rebuild=yes';
        if (doingOnTheFly()) {
            getalbums = 'backends/sql/onthefly.php?command=listallinfo';
        }
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            debug.log("GENERAL","Building albums cache only");
            loadCollection(getalbums, null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Files Cache Only");
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            debug.log("GENERAL","Building Both Caches");
            loadCollection(getalbums, 'dirbrowser.php');
        }
    }
}

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("player/mpd/ajaxcommand.php", checkPoll);
}

function scootTheAlbums() {
    $.each($("#collection").find("img").filter(function() {
        return $(this).hasClass('notexist');
    }), function() {
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
        switch (panel) {
            case "radiolist":
                $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
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
            $("#choose_"+s[i]).fadeOut('fast');
        } else {
            $("#choose_"+s[i]).fadeIn('fast');
        }
    }
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

function findImageInWindow(key) {
    var result = false;
    $.each($('img[name="'+key+'"]'), function() {
        var u = $(this).attr("src");
        if (!$(this).hasClass('notexist') && !$(this).hasClass('notfound') && result === false &&
            u != "" &&
            u != "newimages/album-unknown.png" &&
            u != "newimages/album-unknown-small.png" &&
            u != "newimages/transparent-32x32.png") {
            result = { url: u, origimage: u.replace(/small/, 'asdownloaded'), delaytime: 100 };
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

function playlistScrolled(el) {
    if (el.attr("id") == "pscroller") {
        playlistScrollOffset = -mcs.top;
    } else if (el.attr("id") == "sources") {
        albumScrollOffset = -mcs.top;
    }
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

var tagAdder = function() {

    var index = null;

    return {
        show: function(evt, idx) {
            index = idx;
            var position = getPosition(evt);
            layoutProcessor.setTagAdderPosition(position);
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

function addPlugin(label, action) {
    $("#specialplugins").append('<div class="fullwidth backhi clickicon noselection menuitem dragsort" onclick="'+action+'">'+label+'</div>');
}

function joinartists(ob) {

    // NOTE : This function is duplicated in the php side. It's important the two stay in sync
    // See player/mopidy/connection.php and includes/functions.php
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
                // This might be a problem in Mopidy BUT Spotify tracks are coming back with eg
                // artist[0] = King Tubby, artist[1] = Johnny Clarke, artist[2] = King Tubby & Johnny Clarke
                if (flub.match(/ & /) || flub.match(/ and /i)) {
                    return flub;
                }
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
}

var globalPlugins = function() {

    var plugins = new Array();

    return {
        register: function(plugin) {
            plugins.push(plugin);
        },

        initialise: function() {
            for (var i in plugins) {
                plugins[i].setup();
            }
        }
    }

}();

function mungeTrackInfo(info) {
    var npinfo = {};
    var doctitle = "RompR";
    if (info.title != "") {
        npinfo.title = info.title;
        doctitle = info.title;
    }
    var s = info.creator;
    if (info.type != "stream" || s != "") {
        if (info.metadata && info.metadata.artists) {
            var an = new Array();
            for (var i in info.metadata.artists) {
                an.push(info.metadata.artists[i].name);
            }
            s = concatenate_artist_names(an);
        }
    }
    if (s != "") {
        npinfo.artist = s;
        doctitle = doctitle + " . " + s;
    }
    if (info.album) {
        npinfo.album = info.album;
        if (info.title == "" && s == "" && info.stream != "") {
            npinfo.stream = info.stream;
        } else if (info.title == "" && s == "" && info.stream == "" && info.albumartist != "") {
            npinfo.stream = info.albumartist;
        }
    }

    return {doctitle: doctitle, textbits: npinfo};

}