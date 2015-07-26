function openAlbumArtManager() {
    window.open('albumart.php');
}

function reloadWindow() {
    var a = window.location.href;
    if (a.match(/index.php/)) {
        location.assign(a.replace(/index.php/,''));
    } else {
        location.reload(true);
    }
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
            // $("#theme").attr({href: 'themes/'+$("#themeselector").val()});
            setTheme($("#themeselector").val());
            setTimeout(layoutProcessor.adjustLayout, 1000);
            break;

        case "icontheme":
            $("#icontheme-theme").attr("href", "iconsets/"+$("#iconthemeselector")
                .val()+"/theme.css");
            $("#icontheme-adjustments").attr("href",
                "iconsets/"+$("#iconthemeselector").val()+"/adjustments.css");
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
            $('[name="donkeykong"]').makeFlasher({flashtime: 0.5, repeats: 3});
            break;

        case 'displaycomposer':
            debug.log("PREFS","Display Composer Option was changed");
            callback = player.controller.doTheNowPlayingHack;
            break

        case "sortbydate":
        case "notvabydate":
            callback = forceCollectionReload;
            break;

        case "alarmon":
            callback = alarm.toggle;
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

        case 'currenthost':
            callback = function() {
                setCookie('currenthost',prefs.currenthost,3650);
                reloadWindow();
            }
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
            felakuti[$(this).attr("id")] = $(this).val().split(',');
        } else {
            felakuti[$(this).attr("id")] = $(this).val();
        }
        switch ($(this).attr("id")) {
            case "composergenrename":
                if (felakuti.composergenrename != prefs.composergenrename) {
                    $('[name="donkeykong"]').makeFlasher({flashtime:0.5, repeats: 3});
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
        $(this).prop("checked", prefs[$(this).attr("id")]);
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
        $("[name="+prefname+"][value="+prefs[prefname]+"]").prop("checked", true);
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
    var user = $("#configpanel").find('input[name|="user"]').val();
    lastfm.login(user);
    $("#configpanel").fadeOut(1000);
}

function doInternetRadio(input) {
    var el = new Array();
    el.push($('<div>', {class: 'invisible clickstream', name: $("#"+input).val(), supply: 'user'}));
    playlist.addItems(el, null);
    el[0].remove();
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

function changeBackgroundImage() {
    $('[name="currbackground"]').val(prefs.theme);
    var formElement = document.getElementById('backimageform');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "backimage.php");
    xhr.responseType = "json";
    xhr.onload = function () {
        if (xhr.status === 200) {
            debug.log("BIMAGE", xhr.response);
            if (xhr.response.image) {
                $('body').css('background-image', 'url("'+xhr.response.image+'")');
                $('body').css('background-size', 'cover');
                $('body').css('background-repeat', 'no-repeat');
                $('#cusbgname').html(xhr.response.image.split(/[\\/]/).pop());
            }
        } else {
            debug.fail("BIMAGE", "FAILED");
        }
    };
    xhr.send(new FormData(formElement));

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
                wikipopup = $('<div>', { id: 'wikipopup', onclick: 'imagePopup.close()',
                    class: 'dropshadow'}).appendTo($('body'));
                imagecontainer = $('<img>', { id: 'imagecontainer', onclick: 'imagePopup.close()',
                    src: ''}).appendTo($('body'));
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
            wikipopup.append($('<i>', {class: 'icon-spin6 smallcover-svg spinner',
                style: 'position:relative;top:8px;left:8px'}));
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
            debug.log("POPUP","Calculated Image size is",imgwidth,imgheight,(imgwidth/image.width),
                (imgheight/image.height));
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
                    wikipopup.append($('<i>', {class: 'icon-cancel-circled playlisticon tright clickicon',
                        style: 'margin-top:4px;margin-right:4px'}));
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
    player.controller.doOutput(id, !$('#outputbutton_'+id).is(':checked'));
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
            $("#cheese").append('<table width="100%"><tr><td width="30px"></td><td align="center"><h2>'+
                title+
                '</h2></td><td align="right" width="30px">'+
                '<i class="icon-cancel-circled playlisticon clickicon" onclick="popupWindow.close()">'+
                '</i></td></tr></table>');
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
            var lsize = layoutProcessor.maxPopupSize(winsize);
            var psize = $("#cheese").outerHeight(true)+$("#popupcontents")
                .children().first().children().first().outerHeight(true)+16;
            if (psize < wantedheight && psize < winsize.y && psize < lsize.height) {
                $(popup).css('height',(psize+16)+"px");
                $("#popupcontents").css('height', $("#popupcontents").children().first()
                    .children().first().outerHeight(true)+"px");
            }
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
    if (player.status.xfade !== undefined && player.status.xfade !== null &&
        player.status.xfade > 0 && player.status.xfade != prefs.crossfade_duration) {
        prefs.save({crossfade_duration: player.status.xfade});
        $("#crossfade_duration").val(player.status.xfade);
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

function prepareForLiftOff(text) {
    infobar.notify(infobar.PERMNOTIFY,text);
    $("#collection").empty();
    doSomethingUseful('collection', text);
    var x = $('<div>',{ id: 'updatemonitor', class: 'tiny', style: 'padding-left:1em;margin-right:1em'}).insertAfter($('#spinner_collection'));
}

function prepareForLiftOff2(text) {
    $("#filecollection").empty();
    doSomethingUseful("filecollection", text);
}

/* This is called when the page loads. It checks to see if the albums/files cache exists
    and builds them, if necessary. If they are there, it loads them
*/

function checkCollection(forceup, rescan) {
    if (forceup && player.updatingcollection) {
        infobar.notify(infobar.ERROR, "Already Updating Collection!");
        return;
    }
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
        player.updatingcollection = true;
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
        if (prefs.hide_filelist && !prefs.hide_albumlist) {
            loadCollection('albums.php?rebuild=yes', null);
        } else if (prefs.hidealbumlist && !prefs.hide_filelist) {
            loadCollection(null, 'dirbrowser.php');
        } else if (!prefs.hidealbumlist && !prefs.hide_filelist) {
            loadCollection('albums.php?rebuild=yes', 'dirbrowser.php');
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
    html += '<div class="fixed" style="vertical-align:middle;padding-left:8px">'+
        '<i class="icon-spin6 smallcover-svg spinner"></i></div>';
    html += '<h3 class="expand ucfirst label">'+text+'</h3>';
    html += '</div>';
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
    var lowalpha = 0.8;
    var highalpha = 1;

    return "rgba(150,75,0,"+lowalpha+") 0%,rgba("+highr+","+highg+",0,"+highalpha+") "+percent+
        "%,rgba(0,0,0,0.1) "+percent+"%,rgba(0,0,0,0.1) 100%)";

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
    dbQueue.request(
        {action: 'delete', uri: decodeURIComponent(trackToGo)},
        updateCollectionDisplay,
        function() {
            infobar.notify(infobar.ERROR, "Failed to remove track!");
        }
    );
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
                    $("#specialplugins").append('<div class="backhi clickable clickicon noselection'+
                        ' menuitem" name="'+i+'">'+plugins[i].label+'</div>');
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
            track.albumuri = data.uri;
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
        updateCollectionDisplay(rdata, true);
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
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewingmobile")+
                ' <a href="/rompr/?skin=desktop">/rompr/?skin=desktop</a></p>');
        } else {
            $("#fnarkler").append('<p align="center">'+language.gettext("intro_viewmobile")+
                ' <a href="/rompr/?skin=phone">/rompr/?skin=phone</a></p>');
        }
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_basicmanual")+
            ' <a href="https://sourceforge.net/p/rompr/wiki/Basic%20Manual/" target="_blank">'+
            'http://sourceforge.net/p/rompr/wiki/Basic%20Manual/</a></p>');
        $("#fnarkler").append('<p align="center">'+language.gettext("intro_forum")+
            ' <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">'+
            'http://sourceforge.net/p/rompr/discussion/</a></p>');
        $("#fnarkler").append('<p align="center">RompR needs translators! If you want to get'+
            ' involved, please read <a href="https://sourceforge.net/p/rompr/wiki/Translating%20RompR/"'+
            ' target="_blank">this</a></p>');
        if (prefs.player_backend == "mopidy") {
            $("#fnarkler").append('<p align="center"><b>Mopidy is STILL SUPPORTED! Rompr now uses '+
                'the Mopidy MPD frontend</b></p>');
            $("#fnarkler").append('<p align="center"><b>'+language.gettext("intro_mopidy")+'</b></p>');
            $("#fnarkler").append('<p align="center"><a href="https://sourceforge.net/p/rompr/wiki/Rompr%20and%20Mopidy/"'+
                ' target="_blank">'+language.gettext("intro_mopidywiki")+'</a></p>');
        }
        $("#fnarkler").append('<p><button style="width:8em" class="tright" onclick="popupWindow.close()">OK</button></p>');
        popupWindow.open();
        prefs.save({shownupdatewindow: rompr_version});
    }
}

function removeOpenItems(index) {
    if ($(this).hasClass('clicktrack') ||
        $(this).hasClass('clickcue') ||
        $(this).hasClass('clickstream')) {
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
                        updateCollectionDisplay(rdata);
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
    // We use 'Albums' to get 'Your Music' because, although it requires more requests than 'Songs',
    // each response will be small enough to handle easily and there's less danger of timeouts or
    // running into memory issues or pagination.

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
        var p = this.options.default_domains;
        // p.reverse();
        for (var i in p) {
            if (player.canPlay(p[i])) {
                var makeunique = $("[id^='"+p[i]+"_import_domain']").length+1;
                var id = p[i]+'_import_domain_'+makeunique;
                this.options.holder.append('<div class="brianblessed styledinputs">'+
                    '<input type="checkbox" class="topcheck" id="'+id+'"><label for="'+id+'">'+
                    p[i].capitalize()+'</label></div>');
            }
        }
        for (var i in player.urischemes) {
            if (p.indexOf(i) == -1 && !this.options.sources_not_to_choose.hasOwnProperty(i)) {
                var makeunique = $("[id^='"+i+"_import_domain']").length+1;
                var id = i+'_import_domain_'+makeunique;
                this.options.holder.append('<div class="brianblessed styledinputs">'+
                    '<input type="checkbox" class="topcheck" id="'+id+'"><label for="'+id+'">'+
                    i.capitalize()+'</label></div>');
            }
        }
        this.options.holder.find('.topcheck').each(function() {
            var n = $(this).attr("id");
            var d = n.substr(0, n.indexOf('_'));
            if (self.options.default_domains.indexOf(d) > -1) {
                $(this).prop("checked", true);
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

function editPlayerDefs() {
    $("#configpanel").slideToggle('fast');
    var playerpu = popupWindow.create(600,600,"playerpu",true,"Players");

    $("#popupcontents").append('<div class="pref textcentre"><p>You can define as many players as '+
        'you like and switch between them or use them all simultaneously from different browsers. '+
        'All the players will share the same Collection database.</p>'+
        '<p><b>Do NOT access multiple players from the same browser simultaneously.</b></p></div>');

    $("#popupcontents").append('<table align="center" cellpadding="2" id="playertable" width="96%"></table>');
    $("#playertable").append('<tr><th>NAME</th><th>HOST</th><th>PORT</th><th>PASSWORD</th><th>UNIX SOCKET</th></tr>');
    for (var i in prefs.multihosts) {
        $("#playertable").append('<tr class="hostdef" name="'+escape(i)+'">'+
            '<td><input type="text" size="30" name="name" value="'+i+'"/></td>'+
            '<td><input type="text" size="30" name="host" value="'+prefs.multihosts[i]['host']+'"/></td>'+
            '<td><input type="text" size="30" name="port" value="'+prefs.multihosts[i]['port']+'"/></td>'+
            '<td><input type="text" size="30" name="password" value="'+prefs.multihosts[i]['password']+'"/></td>'+
            '<td><input type="text" size="30" name="socket" value="'+prefs.multihosts[i]['socket']+'"/></td>'+
            '<td><i class="icon-cancel-circled smallicon clickicon clickremhost"></i></td>'+
            '</tr>'
        );
    }
    $("#popupcontents").append('<div class="pref">'+
        '<i class="icon-plus smallicon clickicon tleft" onclick="addNewPlayerRow()"></i>'+
        '<button class="tright" onclick="updatePlayerChoices()">'+language.gettext('button_OK')+'</button>'+
        '<button class="tright" onclick="popupWindow.close()">'+language.gettext('button_cancel')+'</button>'+
        '</div>');
    $('.clickremhost').click(removePlayerDef);
    popupWindow.open();
}

function removePlayerDef(event) {
    if (unescape($(event.target).parent().parent().attr('name')) == prefs.currenthost) {
        infobar.notify(infobar.ERROR, "You cannot delete the player you're currently using");
    } else {
        $(event.target).parent().parent().remove();
        popupWindow.setsize();
    }
}

function updatePlayerChoices() {
    var newhosts = new Object();
    var reloadNeeded = false;
    var error = false;
    $("#playertable").find('tr.hostdef').each(function() {
        var currentname = unescape($(this).attr('name'));
        var newname = "";
        var temp = new Object();
        $(this).find('input').each(function() {
            if ($(this).attr('name') == 'name') {
                newname = $(this).val();
            } else {
                temp[$(this).attr('name')] = $(this).val();
            }
        });

        newhosts[newname] = temp;
        if (currentname == prefs.currenthost) {
            if (newname != currentname) {
                debug.log("Current Player renamed to "+newname,"PLAYERS");
                reloadNeeded = newname;
            }
            if (temp.host != prefs.mpd_host || temp.port != prefs.mpd_port
                || temp.socket != prefs.unix_socket || temp.password != prefs.mpd_password) {
                debug.log("Current Player connection details changed","PLAYERS");
                reloadNeeded = newname;
            }
        }
    });
    debug.log("PLAYERS",newhosts);
    if (reloadNeeded !== false) {
        prefs.save({currenthost: reloadNeeded}, function() {
            prefs.save({multihosts: newhosts}, function() {
                setCookie('currenthost',reloadNeeded,3650);
                reloadWindow();
            });
        });
    } else {
        prefs.save({multihosts: newhosts});
        replacePlayerOptions();
        setPrefs();
        $("#playerdefs > .savulon").click(toggleRadio);
    }
    popupWindow.close();
}

function replacePlayerOptions() {
    $("#playerdefs").empty();
    for (var i in prefs.multihosts) {
        $("#playerdefs").append('<input type="radio" class="topcheck savulon" name="currenthost" value="'+
            i+'" id="host_'+escape(i)+'">'+
            '<label for="host_'+escape(i)+'">'+i+'</label><br/>');
    }
}

function addNewPlayerRow() {
    $("#playertable").append('<tr class="hostdef" name="New">'+
        '<td><input type="text" size="30" name="name" value="New"/></td>'+
        '<td><input type="text" size="30" name="host" value=""/></td>'+
        '<td><input type="text" size="30" name="port" value=""/></td>'+
        '<td><input type="text" size="30" name="password" value=""/></td>'+
        '<td><input type="text" size="30" name="socket" value=""/></td>'+
        '<td><i class="icon-cancel-circled smallicon clickicon clickremhost"></i></td>'+
        '</tr>'
    );
    popupWindow.setsize();
    $('.clickremhost').unbind('click');
    $('.clickremhost').click(removePlayerDef);
}

$.widget("rompr.resizeHandle", $.ui.mouse, {
    widgetEventPrefix: "resize",
    options: {
        adjusticons: [],
        side: 'left'
    },

    _create: function() {
        this.dragging = false;
        this._mouseInit();
    },

    _mouseCapture: function(event) {
        this.dragging = true;
        this.startX = event.clientX;
        this.elementStartX = this.element.offset().left;
        this.winsize = getWindowSize();
        this.widthadjust = this.element.outerWidth(true);
        return true;
    },

    _mouseStart: function(event) {
        return true;
    },

    _mouseDrag: function(event) {
        if (this.dragging) {
            var distance = event.clientX - this.startX;
            if (this.options.side == 'left') {
                var size = Math.max(this.elementStartX + distance + this.widthadjust, 120);
                prefs.sourceswidthpercent = (size/this.winsize.x)*100;
            } else {
                var size = Math.max(this.winsize.x - (this.elementStartX + distance), 120);
                prefs.playlistwidthpercent = (size/this.winsize.x)*100;
            }
            if (prefs.sourceswidthpercent + prefs.playlistwidthpercent > 100 || prefs.hidebrowser) {
                if (this.options.side == 'left') {
                    prefs.playlistwidthpercent = 100 - prefs.sourceswidthpercent;
                } else {
                    prefs.sourceswidthpercent = 100 - prefs.playlistwidthpercent;
                }
            }
            doThatFunkyThang();
            setTopIconSize(this.options.adjusticons);
        }
        return true;
    },

    _mouseStop: function(event) {
        this.dragging = false;
        setTopIconSize(["#sourcescontrols", "#infopanecontrols", "#playlistcontrols"]);
        browser.rePoint();
        prefs.save({sourceswidthpercent: prefs.sourceswidthpercent});
        prefs.save({playlistwidthpercent: prefs.playlistwidthpercent});
        return true;
    }

});

$.widget("rompr.trackdragger", $.ui.mouse, {
    options: {

    },

    _create: function() {
        this.dragging = false;
        this._mouseInit();
    },

    _mouseCapture: function() {
        return true;
    },

    _mouseStart: function(event) {
        var clickedElement = findClickableElement(event);
        if (!clickedElement.hasClass('draggable')) {
            return false;
        }
        this.dragging = true;
        if (!clickedElement.hasClass("selected")) {
            if (clickedElement.hasClass("clickalbum") ||
                clickedElement.hasClass("clickloadplaylist")) {
                albumSelect(event, clickedElement);
            } else if (clickedElement.hasClass("clicktrack") ||
                        clickedElement.hasClass("clickcue") ||
                        clickedElement.hasClass('clickstream')) {
                trackSelect(event, clickedElement);
            }
        }
        this.dragger = $('<div>', {id: 'dragger', class: 'draggable dragsort containerbox vertical dropshadow'}).appendTo('body');
        if ($(".selected").length > 6) {
            this.dragger.append('<div class="containerbox menuitem">'+
                '<div class="smallcover fixed"><i class="icon-music smallcover-svg"></i></div>'+
                '<div class="expand"><h3>'+$(".selected").length+' Items</h3></div>'+
                '</div>');
        } else {
            $(".selected").clone().removeClass("selected").appendTo(this.dragger);
        }
        // Little hack to make dragging from the various tag/rating/playlist managers
        // look prettier
        this.dragger.find('tr').wrap('<table></table>');
        this.dragger.find('.icon-cancel-circled').remove();
        this.drag_x_offset = event.pageX - clickedElement.offset().left;
        var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
        this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
        this.dragger.fadeIn('fast');
        $('.trackacceptor').acceptDroppedTracks('dragstart');
        return true;
    },

    _mouseDrag: function(event) {
        if (this.dragging) {
            var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
            this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
        }
        $('.trackacceptor').each(function() {
            if ($(this).acceptDroppedTracks('checkMouseOver', event)) {
                // Break out of the each loop
                return false;
            }
        });
        return true;
    },

    _mouseStop: function(event) {
        this.dragging = false;
        this.dragger.remove();
        $('.trackacceptor').each(function() {
            if ($(this).acceptDroppedTracks('dragstop', event)) {
                return false;
            }
        });
        return true;
    }

});

$.widget("rompr.acceptDroppedTracks", {
    options: {
        ondrop: null,
        coveredby: null,
        scroll: false,
        scrollparent: ''
    },

    _create: function() {
        this.element.addClass('trackacceptor');
        this.dragger_is_over = false;
    },

    dragstart: function() {
        this.dragger_is_over = false;
        // For custom scrollbars the bounding box needs to be the scrollparent
        var vbox = (this.options.scroll) ? $(this.options.scrollparent) : this.element;
        this.bbox = {
            left:   this.element.offset().left,
            top:    Math.max(vbox.offset().top, this.element.offset().top),
            right:  this.element.offset().left + this.element.width(),
            bottom: Math.min(vbox.offset().top + vbox.height(), this.element.offset().top + this.element.height())
        }
        if (this.options.coveredby !== null) {
            // ONLY works in playlist for sending correct events to correct targets
            this.bbox.top = $(this.options.coveredby).offset().top + $(this.options.coveredby).height();
        }
        if (this.element.hasClass('sortabletracklist')) {
             this.element.sortableTrackList('dragstart');
        }

    },

    dragstop: function(event) {
        debug.log("UITHING","dragstop",this.element.attr("id"));
        if (this.dragger_is_over && this.options.ondrop !== null) {
            debug.log("UITHING","Dropped onto wotsit thingy",this.element.attr("id"));
            this.dragger_is_over = false;
            this.element.removeClass('highlighted');
            this.options.ondrop(event, this.element);
            return true;
        }
        if (this.dragger_is_over && this.element.hasClass('sortabletracklist')) {
            debug.log("UITHING","Dropped ontp sortable tracklist",this.element.attr("id"));
            this.dragger_is_over = false;
            this.element.removeClass('highlighted');
            this.element.sortableTrackList('dropped', event);
            return true;
        }
        this.dragger_is_over = false;
        this.element.removeClass('highlighted');
        return false;
    },

    checkMouseOver: function(event) {
        if (event.pageX > this.bbox.left && event.pageX < this.bbox.right &&
            event.pageY > this.bbox.top && event.pageY < this.bbox.bottom) {
            if (!this.dragger_is_over) {
                this.dragger_is_over = true;
                this.element.addClass('highlighted');
            }
            if (this.dragger_is_over && this.element.hasClass('sortabletracklist')) {
                this.element.sortableTrackList('do_intersect_stuff', event, $("#dragger"));
            }
            return true;
        } else {
            if (this.dragger_is_over) {
                debug.log("UITHING","Dragger is NOT over",this.element.attr("id"));
                this.element.removeClass('highlighted');
                if (this.element.hasClass('sortabletracklist')) {
                    this.element.sortableTrackList('dragleave');
                }
                this.dragger_is_over = false;
            }
            return false;
        }
    }

 });

$.widget("rompr.sortableTrackList", $.ui.mouse, {
    options: {
        items: '',
        outsidedrop: null,
        insidedrop: null,
        scroll: false,
        scrollparent: '',
        scrollspeed: 0,
        scrollzone: 0,
        allowdragout: false
    },

    _create: function() {
        this.element.addClass('sortabletracklist');
        this.helper = null;
        this.dragger = null;
        this.dragging = false;
        this.draggingout = false;
        this._scrollcheck = null;
        this._mouseInit();
    },

    dragstart: function() {
        // For custom scrollbars the bounding box needs to be the scrollparent
        var vbox = (this.options.scroll) ? $(this.options.scrollparent) : this.element;
        this.bbox = {
            left:   this.element.offset().left,
            top:    Math.max(vbox.offset().top, this.element.offset().top),
            right:  this.element.offset().left + this.element.width(),
            bottom: Math.min(vbox.offset().top + vbox.height(), this.element.offset().top + this.element.height())
        }
        if (this.helper) this.helper.remove();
        this.helper = null;
    },

    do_intersect_stuff: function(event, item) {
        // This is vertical sortable lists so we're only gonna care
        // about vertical sorting.
        var self = this;
        clearTimeout(this._scrollcheck);
        this._mouseEvent = event;
        this._item = item;
        var scrolled = this._checkScroll(event);
        this.element.find(this.options.items).each(function() {
            var jq = $(this);
            var bbox = {
                top: jq.offset().top,
                middle: jq.offset().top + jq.height()/2,
                bottom: jq.offset().top + jq.height()
            }
            if (event.pageY > bbox.top && event.pageY <= bbox.middle) {
                // Put a helper above the current item
                self._checkHelper.call(self, item);
                self.helper.detach().insertBefore(jq);
                return false;
            } else if (event.pageY > bbox.middle && event.pageY < bbox.bottom) {
                self._checkHelper.call(self, item);
                self.helper.detach().insertAfter(jq);
                return false;
            }
        });
        if (scrolled) {
            this._scrollcheck = setTimeout($.proxy(this._checkMouseHover, this), 100);
        }

    },

    _checkHelper: function(item) {
        if (this.helper) return true;
        if (this.element.find(this.options.items).first().is('tr')) {
            this.helper = $('<tr>', {
                id: this.element.attr('id')+'_sorthelper',
            });
        } else {
            this.helper = $('<div>', {
                id: this.element.attr('id')+'_sorthelper',
            });
        }
        this.helper.css('height', (item.height()+12)+"px");
        this.helper.attr('class', item.hasClass('draggable') ? 'draggable' : 'something');
        this.helper.empty();
    },

    _checkScroll: function(event) {
        // Custom Scrollbars ONLY
        var scrolled = false;
        if (this.options.scroll) {
            if (event.pageY < this.bbox.top + this.options.scrollzone) {
                $(this.options.scrollparent).mCustomScrollbar('scrollTo', '+='+
                    this.options.scrollspeed, {scrollInertia: 100, scrollEasing: "easeOut"});
                scrolled = true;
            } else if (event.pageY > this.bbox.bottom - this.options.scrollzone) {
                $(this.options.scrollparent).mCustomScrollbar('scrollTo', '-='+
                    this.options.scrollspeed, {scrollInertia: 100, scrollEasing: "easeOut"});
                scrolled = true;
            }
        }
        return scrolled;

    },

    _checkMouseHover: function() {
        this.do_intersect_stuff(this._mouseEvent, this._item);
    },

    dragleave: function() {
        this.helper.remove();
        this.helper = null;
        clearTimeout(this._scrollcheck);
    },

    dropped: function(event) {
        // This is called when something from OUTSIDE the list has been dropped onto us
        debug.log("STL","Dropped",event);
        clearTimeout(this._scrollcheck);
        this.options.outsidedrop(event, this.helper);
    },

    // Local dragging functions

    _findDraggable: function(event) {
        var el = $(event.target);
        while (!el.hasClass(this.options.items.replace(/^\./,'')) && el != this.element) {
            el = el.parent();
        }
        return el;
    },

    _mouseStart: function(event) {
        debug.log("SORTABLE","Mouse Start",event);
        var dragged = this._findDraggable(event);
        this.dragged_original_pos = dragged.prev();
        if (this.dragger) this.dragger.remove();
        this.dragger = dragged.clone().appendTo('body');
        this.dragger.find('.icon-cancel-circled').remove();
        if (this.dragger.is('tr')) {
            this.dragger.wrap('<table></table>');
        }
        this.dragger.css({
            position: 'absolute',
            top: dragged.offset().top + 'px',
            left: dragged.offset().left + 'px',
            width: dragged.width() + 'px'
        });
        this.drag_x_offset = event.pageX - this.dragger.offset().left;
        this.dragger.addClass('dropshadow');
        if (this.helper) this.helper.remove();
        this.helper = null;
        this._checkHelper(dragged);
        this.helper.detach().insertAfter(dragged);
        this.original = dragged.detach();
        this.dragstart();
        this.dragging = true;
        return true;
    },

    _mouseDrag: function(event) {
        clearTimeout(this._scrollcheck);
        if (this.dragging) {
            if ((event.pageX > this.bbox.right || event.pageX < this.bbox.left) &&
                this.options.allowdragout)
            {
                clearTimeout(this._scrollcheck);
                this.dragging = false;
                this.draggingout = true;
                var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
                this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
                this.original.insertAfter(this.dragged_original_pos);
                this.original.addClass('selected');
                this.helper.detach();
                this.dragger.attr('id','dragger');
                this.dragger.addClass('draggable');
                $('.trackacceptor').acceptDroppedTracks('dragstart');
            } else {
                var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
                if (pos.top > this.bbox.top && pos.top < this.bbox.bottom) {
                    this.dragger.css('top',pos.top+'px');
                    if (this.options.allowdragout) {
                        this.dragger.css('left',pos.left+'px');
                    }
                    this.do_intersect_stuff(event, this.dragger);
                }
            }
        } else if (this.draggingout) {
            var pos = {top: event.pageY - 12, left: event.pageX - this.drag_x_offset};
            this.dragger.css({top: pos.top+"px", left: pos.left+"px"});
            $('.trackacceptor').each(function() {
                if ($(this).acceptDroppedTracks('checkMouseOver', event)) {
                    // Break out of the each loop
                    return false;
                }
            });
        }
        return true;
    },

    _mouseStop: function(event) {
        clearTimeout(this._scrollcheck);
        if (this.dragging) {
            this.dragger.remove();
            this.original.insertAfter(this.helper);
            this.helper.remove();
            this.helper = null;
            this.dragging = false;
            if (this.options.insidedrop) {
                this.options.insidedrop(event, this.original);
            }
        } else if (this.draggingout) {
            debug.log("STL","Dragged out and onto something else");
            this.dragger.remove();
            this.draggedout = false;
            if (this.helper) this.helper.remove();
            this.helper = null;
            $('.trackacceptor').each(function() {
                if ($(this).acceptDroppedTracks('dragstop', event)) {
                    return false;
                }
            });
        }
        return true;
    }
});

$.widget("rompr.floatingMenu", $.ui.mouse, {
    options: {
        handleClass: null,
        addClassTo: null
    },

    _create: function() {
        var self = this;
        this.dragging = false;
        this._mouseInit();
        if (this.options.addClassTo) {
            this.element.find('.'+this.options.addClassTo).first().addClass(this.options.handleClass)
                .append('<i class="icon-cancel-circled playlisticonr tright clickicon closemenu"></i>');
        }
        this._parent = this.element.parent();
        this.element.find('.closemenu').click($.proxy(self.toggleMenu, self));
        this._parent.click($.proxy(self.toggleMenu, self));
    },

    _mouseCapture: function() {
        return true;
    },

    _findSourceElement: function(event) {
        var el = $(event.target);
        while (!el.hasClass(this.options.handleClass) &&
                el != this.element)
        {
            el = el.parent();
        }
        if (el.hasClass(this.options.handleClass)) {
            return true;
        } else {
            return false;
        }
    },

    _mouseStart: function(event) {
        if (this.options.handleClass && this._findSourceElement(event) === false) {
            return false;
        }
        this.dragging = true;
        this.drag_x_offset = event.pageX - this.element.offset().left;
        this.drag_y_offset = event.pageY - this.element.offset().top;
        this.element.detach().appendTo('body');
        this._mouseDrag(event);
        return true;
    },

    _mouseDrag: function(event) {
        if (this.dragging) {
            var pos = {top: event.pageY - this.drag_y_offset, left: event.pageX - this.drag_x_offset};
            this.element.css({top: pos.top+"px", left: pos.left+"px"});
        }
        return true;
    },

    _mouseStop: function(event) {
        this.dragging = false;
        return true;
    },

    toggleMenu: function() {
        var self = this;
        if (this.element.is(':visible')) {
            this.element.slideToggle('fast', function() {
                self.element.css({left: "", top: ""}).detach().appendTo(self._parent);
            });
        } else {
            $('.topdropmenu').each(function() {
                if ($(this).is(':visible') && $(this) != self.element && !$(this).parent().is('body')) {
                    $(this).slideToggle('fast');
                }
            });
            this.element.slideToggle('fast', function() {
                layoutProcessor.fanoogleMenus($(this));
            });
        }
    }

});

function findPosition(key) {
    // The key is the id of a dropdown div.  But that div won't exist if the dropdown hasn't been
    // opened. So we see if it does, and if it doesn't then we use the name attribute of the
    // toggle arrow button to locate the position.
    if ($("#"+key).length > 0) {
        return $("#"+key);
    } else {
        return $('i[name="'+key+'"]').parent()
    }
}
 
function updateCollectionDisplay(rdata, markit) {
    // rdata contains an HTML fragment to insert into the collection
    // and a marker for where to insert it. Otherwise we would have
    // to rebuild the whole artist list every time and this would
    // (a) take a long time and
    // (b) cause any opened dropdowns to be mysteriously closed
    //      - which would just look shit.
    debug.log("RATING PLUGIN","Update Display");
    if (rdata && rdata.hasOwnProperty('inserts')) {
        $('#emptycollection').remove();
        for (var i in rdata.inserts) {
            switch (rdata.inserts[i].type) {
                case 'insertAfter':
                    // insertAfter is something to insert into a list - either the main list of
                    // artists or an artist's album dropdown.
                    debug.log("RATING PLUGIN", "insertAfter",rdata.inserts[i].where);
                    $(rdata.inserts[i].html).insertAfter(findPosition(rdata.inserts[i].where));
                    break;

                case 'insertInto':
                    // insertInto is html to replace the contents of a div.
                    // This will be a track listing for an album and we always return all tracks.
                    debug.log("RATING PLUGIN", "insertInto",rdata.inserts[i].where);
                    $("#"+rdata.inserts[i].where).html(rdata.inserts[i].html);
                    break;

                case 'insertAtStart':
                    // insertAtStart tells us to insert the html at the beginning of
                    // the specified dropdown.
                    // In this case if the dropdown doesn't exist we must do nothing
                    debug.log("RATING PLUGIN", "insertAtStart",rdata.inserts[i].where);
                    $(rdata.inserts[i].html).prependTo($('#'+rdata.inserts[i].where));
                    break;
            }
        }
    }

    if (markit && rdata && rdata.hasOwnProperty('displaynewtrack')
        && rdata.displaynewtrack.albumindex != null && rdata.displaynewtrack.trackuri != "") {
        layoutProcessor.sourceControl('albumlist', function() {
            displayCollectionInsert(rdata.displaynewtrack);
        });
    }

    if (rdata && rdata.hasOwnProperty('deletedtracks')) {
        debug.trace("DELETED TRACKS",rdata.deletedtracks);
        for (var i in rdata.deletedtracks) {
            debug.log("REMOVING",rdata.deletedtracks[i]);
            $('div[name="'+rdata.deletedtracks[i]+'"]').remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('deletedalbums')) {
        debug.trace("DELETED ALBUMS",rdata.deletedalbums);
        for (var i in rdata.deletedalbums) {
            debug.log("REMOVING",rdata.deletedalbums[i]);
            $("#"+rdata.deletedalbums[i]).remove();
            findPosition(rdata.deletedalbums[i]).remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('deletedartists')) {
        debug.trace("DELETED ARTISTS",rdata.deletedartists);
        for (var i in rdata.deletedartists) {
            $("#"+rdata.deletedartists[i]).remove();
            findPosition(rdata.deletedartists[i]).remove();
        }
    }
    if (rdata && rdata.hasOwnProperty('stats')) {
        // stats is another html fragment which is the contents of the
        // statistics box at the top of the collection
        $("#fothergill").html(rdata.stats);
    }
    scootTheAlbums($("#collection"));
}

function flashTrack(uri) {
    $('[name="'+uri+'"]').makeFlasher({flashtime: 0.5, repeats: 5});
    layoutProcessor.scrollCollectionTo($('[name="'+uri+'"]'));
}

function displayCollectionInsert(details) {

    debug.log("COLLECTION","Displaying New Insert",details);

    if ($('i[name="aartist'+details.artistindex+'"]').isClosed()) {
        debug.log("COLLECTION","Opening Menu","aartist"+details.artistindex);
        doAlbumMenu(null, $('i[name="aartist'+details.artistindex+'"]'), false, function() {
            if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
                debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
                doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
                    flashTrack(details.trackuri);
                });
            } else {
                flashTrack(details.trackuri);
            }
        });
    } else if ($('i[name="aalbum'+details.albumindex+'"]').isClosed()) {
        debug.log("COLLECTION","Opening Menu","aalbum"+details.albumindex);
        doAlbumMenu(null, $('i[name="aalbum'+details.albumindex+'"]'), false, function() {
            flashTrack(details.trackuri);
        });
    } else {
        flashTrack(details.trackuri);
    }
}
