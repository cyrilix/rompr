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
    $("#radiolist").unbind('click');
    $("#radiolist").unbind('dblclick');

    $("#collection").click(onCollectionClicked);
    $("#filecollection").click(onFileCollectionClicked);
    $("#search").click(onCollectionClicked);
    $("#filesearch").click(onFileCollectionClicked);
    $("#radiolist").click(onRadioClicked);

    if (prefs.clickmode == "double") {
        $("#collection").dblclick(onCollectionDoubleClicked);
        $("#filecollection").dblclick(onFileCollectionDoubleClicked);
        $("#search").dblclick(onCollectionDoubleClicked);
        $("#filesearch").dblclick(onCollectionDoubleClicked);
        $("#radiolist").dblclick(onRadioDoubleClicked);
    }

    $('.infotext').unbind('click');
    $('.infotext').click(onBrowserClicked);

    $('.infotext').unbind('dblclick');
    $('.infotext').dblclick(onBrowserDoubleClicked);

    $(".dropdown-button").unbind('click');
    $(".dropdown-button").click(onDropdownClicked);
}

function onDropdownClicked(event) {
    var dropbox = $(this).prev().find('.drop-box');
    if (dropbox.is(':visible')) {
        dropbox.slideToggle('fast');
    } else {
        $(".tagmenu-contents").empty();
        $.ajax({
            url: "userRatings.php",
            type: "POST",
            data: { action: 'gettags' },
            dataType: 'json',
            success: function(data) {
                for (var i in data) {
                    $(".tagmenu-contents").append('<div class="backhi tagmenu-item">'+data[i]+"</div>");
                }
                data = null;
                dropbox.slideToggle('fast', function() {
                    if (mobile == "no") {
                        dropbox.mCustomScrollbar("update");
                    }

                });
                $('.tagmenu-item').click(chooseNewTag);
            },
            error: function() {
                debug.error("DB TRACKS", "Failed to get tags");
            }
        });
    }
}

function onBrowserClicked(event) {
    var clickedElement = findClickableBrowserElement(event);
    if (clickedElement.hasClass("infoclick")) {
        var parentElement = $(event.currentTarget.id).selector;
        var source = parentElement.replace('information', '');
        debug.debug("BROWSER","A click has occurred in",parentElement,source);
        event.preventDefault();
        browser.handleClick(source, clickedElement, event);
        return false;
    } else {
        return true;
    }
};

function onBrowserDoubleClicked(event) {
    var clickedElement = findClickableBrowserElement(event);
    debug.log("BROWSER","Was double clicked on element",clickedElement);
    if (clickedElement.hasClass("draggable") && prefs.clickmode == "double") {
        debug.log("BROWSER","Track element was double clicked");
        event.preventDefault();
        playlist.addtrack(clickedElement);
        return false;
    } else {
        return true;
    }
};

function findClickableBrowserElement(event) {
    var clickedElement = $(event.target);
    // Search upwards through the parent elements to find the clickable object
    while ( !clickedElement.hasClass("infoclick") &&
            !clickedElement.hasClass("infotext")) {
        clickedElement = clickedElement.parent();
    }
    return clickedElement;
}

function onCollectionClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doAlbumMenu(event, clickedElement, false);
    } else if (clickedElement.hasClass("clickremdb")) {
        event.stopImmediatePropagation();
        removeTrackFromDb(clickedElement);
    } else if (prefs.clickmode == "double") {
        if (clickedElement.hasClass("clickalbum")) {
            event.stopImmediatePropagation();
            albumSelect(event, clickedElement);
        } else if (clickedElement.hasClass("clicktrack")) {
            event.stopImmediatePropagation();
            trackSelect(event, clickedElement);
        }
    } else {
        onCollectionDoubleClicked(event);
    }
}

function onCollectionDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickalbum")) {
        event.stopImmediatePropagation();
        playlist.addalbum(clickedElement);
    } else if (clickedElement.hasClass("clicktrack")) {
        event.stopImmediatePropagation();
        playlist.addtrack(clickedElement);
    }
}

function onFileCollectionClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doFileMenu(event, clickedElement);
    } else if (prefs.clickmode == "double") {
        if (clickedElement.hasClass("clickalbum")) {
            event.stopImmediatePropagation();
            albumSelect(event, clickedElement);
        } else if (clickedElement.hasClass("clicktrack") || clickedElement.hasClass("clickcue") ||
            clickedElement.hasClass("clickplaylist")) {
            event.stopImmediatePropagation();
            trackSelect(event, clickedElement);
        }
    } else {
        onCollectionDoubleClicked(event);
    }
}

function onFileCollectionDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickalbum")) {
        event.stopImmediatePropagation();
        playlist.addalbum(clickedElement);
    } else if (clickedElement.hasClass("clicktrack")) {
        event.stopImmediatePropagation();
        playlist.addtrack(clickedElement);
    } else if (clickedElement.hasClass("clickcue")) {
        event.stopImmediatePropagation();
        playlist.addcue(clickedElement);
    } else if (clickedElement.hasClass("clickplaylist")) {
        event.stopImmediatePropagation();
        player.controller.loadSpecial(decodeURIComponent(clickedElement.attr("name")), playlist.playFromEnd(), null);
    }
}

function onRadioClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickedElement.hasClass("clickradioremove")) {
        event.stopImmediatePropagation();
        removeUserStream(clickedElement.attr("name"));
    } else if (clickedElement.hasClass("podconf")) {
        event.stopImmediatePropagation();
        $("#"+clickedElement.attr('name')).slideToggle('fast');
    } else if (clickedElement.hasClass("podrefresh")) {
        event.stopImmediatePropagation();
        clickedElement.addClass('spinner');
        var n = clickedElement.attr('name');
        podcasts.refreshPodcast(n.replace(/podrefresh_/, ''));
    } else if (clickedElement.hasClass("podremove")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        podcasts.removePodcast(n.replace(/podremove_/, ''));
    } else if (clickedElement.hasClass("podtrackremove")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        var m = clickedElement.parent().attr('name');
        podcasts.removePodcastTrack(n.replace(/podtrackremove_/, ''), m.replace(/podcontrols_/,''));
    } else if (clickedElement.hasClass("poddownload")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        var m = clickedElement.parent().attr('name');
        podcasts.downloadPodcast(n.replace(/poddownload_/, ''), m.replace(/podcontrols_/,''));
    } else if (clickedElement.hasClass("podgroupload")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        podcasts.downloadPodcastChannel(n.replace(/podgroupload_/, ''));
    } else if (clickedElement.hasClass("podmarklistened")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        var m = clickedElement.parent().attr('name');
        podcasts.markEpisodeAsListened(n.replace(/podmarklistened_/, ''), m.replace(/podcontrols_/,''));
    } else if (clickedElement.hasClass("podgrouplisten")) {
        event.stopImmediatePropagation();
        var n = clickedElement.attr('name');
        podcasts.markChannelAsListened(n.replace(/podgrouplisten_/, ''));
    } else if (prefs.clickmode == "single") {
        onRadioDoubleClicked(event);
    }
}

function onRadioDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickstream")) {
        event.stopImmediatePropagation();
        getInternetPlaylist(clickedElement.attr("name"), clickedElement.attr("streamimg"), clickedElement.attr("streamname"), null);
    } else if (clickedElement.hasClass("clickradio")) {
        event.stopImmediatePropagation();
        playUserStream(clickedElement.attr("name"));
    } else if (clickedElement.hasClass("clicktrack")) {
        event.stopImmediatePropagation();
        playlist.addtrack(clickedElement);
    }
}

function onPlaylistClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickplaylist")) {
        event.stopImmediatePropagation();
        player.controller.playId(clickedElement.attr("romprid"));
    } else if (clickedElement.hasClass("clickremovetrack")) {
        event.stopImmediatePropagation();
        playlist.delete(clickedElement.attr("romprid"));
    } else if (clickedElement.hasClass("clickremovealbum")) {
        event.stopImmediatePropagation();
        playlist.deleteGroup(clickedElement.attr("name"));
    } else if (clickedElement.hasClass("clickrollup")) {
        event.stopImmediatePropagation();
        playlist.hideItem(clickedElement.attr("romprname"));
    } else if (clickedElement.hasClass("clickaddfave")) {
        event.stopImmediatePropagation();
        playlist.addFavourite(clickedElement.attr("name"));
    }
}

function findClickableElement(event) {

    var clickedElement = $(event.target);
    // Search upwards through the parent elements to find the clickable object
    while (!clickedElement.hasClass("clickable") && !clickedElement.hasClass("menu") &&
            clickedElement.prop("id") != "sources" && clickedElement.prop("id") != "sortable") {
        clickedElement = clickedElement.parent();
    }
    return clickedElement;

}

function doMenu(event, element) {

    if (event) {
        event.stopImmediatePropagation();
    }
    var menutoopen = element.attr("name");
    if (element.isClosed()) {
        element.toggleOpen();
        $('#'+menutoopen).menuReveal();
    } else {
        element.toggleClosed();
        $('#'+menutoopen).menuHide();
    }
    return false;
}

function doAlbumMenu(event, element, inbrowser) {

    if (event) {
        event.stopImmediatePropagation();
    }
    var menutoopen = element.attr("name");
    if (element.isClosed()) {
        if ($('#'+menutoopen).hasClass("notfilled")) {
            $('#'+menutoopen).load("albums.php?item="+menutoopen, function() {
                $(this).removeClass("notfilled");
                $(this).menuReveal(function() {
                    $.each($(this).find("img").filter(function() {
                        return $(this).hasClass('notexist');
                    }), function() {
                        coverscraper.GetNewAlbumArt($(this).attr('name'));
                    });
                    if (inbrowser) {
                        $(this).find('.menu').addClass("infoclick plugclickable");
                        $(this).find('.playlisticon').addClass("infoclick plugclickable").removeClass('clickable')
                            .prev().html('<img class="infoclick clickbuytrack plugclickable" height="20px" style="vertical-align:middle" src="'+ipath+'cart.png">');
                    }
                });
            });
        } else {
            $('#'+menutoopen).menuReveal();
        }
        element.toggleOpen();
    } else {
        $('#'+menutoopen).menuHide();
        element.toggleClosed();
    }
    return false;
}

function doFileMenu(event, element) {

    if (event) {
        event.stopImmediatePropagation();
    }
    var menutoopen = element.attr("name");
    if (element.isClosed()) {
        if ($('#'+menutoopen).hasClass("notfilled")) {
            if (prefs.player_backend == "mopidy") {
                player.controller.browse(element.parent().next().attr("name"), menutoopen);
            } else {
                $('#'+menutoopen).load("dirbrowser.php?item="+menutoopen, function() {
                    $(this).removeClass("notfilled");
                    $(this).menuReveal();
                });
            }
        } else {
            $('#'+menutoopen).menuReveal();
        }
        element.toggleOpen();
    } else {
        $('#'+menutoopen).menuHide();
        element.toggleClosed();
    }
    return false;
}

function setDraggable(divname) {

    $("#"+divname).draggable({
        connectToSortable: "#sortable",
        appendTo: 'body',
        scroll: false,
        addClasses: false,
        helperPos: true,
        helper: function(event) {
            var clickedElement = findClickableElement(event);
            var dragger = document.createElement('div');
            dragger.setAttribute("id", "dragger");
            $(dragger).addClass("draggable dragsort containerbox vertical");
            if (!clickedElement.hasClass("selected")) {
                if (clickedElement.hasClass("clickalbum")) {
                    albumSelect(event, clickedElement);
                } else if (clickedElement.hasClass("clicktrack") || clickedElement.hasClass("clickcue")) {
                    trackSelect(event, clickedElement);
                }
            }
            $(".selected").clone().removeClass("selected").appendTo(dragger);
            return dragger;
        }
    });
}

function onKeyUp(e) {
    if (e.keyCode == 13) {
        debug.debug("CLICKFUNCTIONS","Key Up",e.target.name);
        if ($(e.target).next("button").length > 0) {
            $(e.target).next("button").click();
        } else {
            $(e.target).parent().siblings("button").click();
        }
    }
}

function weaselBurrow() {
    $("#mopidysearchdomains").slideToggle('fast');
}

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

    // Which list are we selecting from?
    // var list = first.attr('id');
    var it = first;
    while(!it.hasClass('selecotron')) {
        it = it.parent();
        // list = it.attr("id");
    }

    var target = null;
    var done = false;
    $.each(it.find('.clickable'), function() {
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

function munge_album_name(album) {
    album = album.replace(/(\(|\[)disc\s*\d+.*?(\)|\])/i, "");        // (disc 1) or (disc 1 of 2) or (disc 1-2) etc (or with [ ])
    album = album.replace(/(\(|\[)*cd\s*\d+.*?(\)|\])*/i, "");        // (cd 1) or (cd 1 of 2) etc (or with [ ])
    album = album.replace(/\sdisc\s*\d+.*?$/i, "");                   //  disc 1 or disc 1 of 2 etc
    album = album.replace(/\scd\s*\d+.*?$/i, "");                     //  cd 1 or cd 1 of 2 etc
    album = album.replace(/(\(|\[)\d+\s*of\s*\d+(\)|\])/i, "");       // (1 of 2) or (1of2) (or with [ ])
    album = album.replace(/(\(|\[)\d+\s*-\s*\d+(\)|\])/i, "");        // (1 - 2) or (1-2) (or with [ ])
    album = album.replace(/(\(|\[)Remastered(\)|\])/i, "");           // (Remastered) (or with [ ])
    album = album.replace(/(\(|\[).*?bonus .*(\)|\])/i, "");          // (With Bonus Tracks) (or with [ ])
    album = album.replace(/\s+-\s*$/, "");                            // Chops any stray - off the end that could have been left by the previous
    album = album.replace(/\s+$/, '');
    album = album.replace(/^\s+/, '');
    return album.toLowerCase();

}

function checkServerTimeOffset() {
    $.ajax({
        type: "GET",
        url: "utils/checkServerTime.php",
        dataType: "json",
        success: function(data) {
            var time = Math.round(Date.now() / 1000);
            serverTimeOffset = time - data.time;
            debug.log("TIMECHECK","Browser Time is",time,". Server Time is",data.time,". Difference is",serverTimeOffset);
        },
        error: function(data) {
            debug.error("TIMECHECK","Failed to read server time");
        }
    });
}

