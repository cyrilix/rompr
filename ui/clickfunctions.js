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
    $("#storedplaylists").unbind('click');
    $("#storedplaylists").unbind('dblclick');

    $("#collection").click(onCollectionClicked);
    $("#filecollection").click(onFileCollectionClicked);
    $("#search").click(onCollectionClicked);
    $("#filesearch").click(onFileCollectionClicked);
    $("#radiolist").click(onRadioClicked);
    $("#storedplaylists").click(onFileCollectionClicked);

    if (prefs.clickmode == "double") {
        $("#collection").dblclick(onCollectionDoubleClicked);
        $("#filecollection").dblclick(onFileCollectionDoubleClicked);
        $("#search").dblclick(onCollectionDoubleClicked);
        $("#filesearch").dblclick(onFileCollectionDoubleClicked);
        $("#radiolist").dblclick(onRadioDoubleClicked);
        $("#storedplaylists").dblclick(onFileCollectionDoubleClicked);
    }

    $('.infotext').unbind('click');
    $('.infotext').click(onBrowserClicked);

    $('.infotext').unbind('dblclick');
    $('.infotext').dblclick(onBrowserDoubleClicked);

}

function setControlClicks() {
    $('i[title="'+language.gettext('button_previous')+'"]').click(playlist.previous);
    $('i[title="'+language.gettext('button_play')+'"]').click(infobar.playbutton.clicked);
    $('i[title="'+language.gettext('button_stop')+'"]').click(player.controller.stop);
    $('i[title="'+language.gettext('button_stopafter')+'"]').click(playlist.stopafter);
    $('i[title="'+language.gettext('button_next')+'"]').click(playlist.next);
}

function onBrowserClicked(event) {
    var clickedElement = findClickableBrowserElement(event);
    if (clickedElement.hasClass("infoclick")) {
        var parentElement = $(event.currentTarget.id).selector;
        var source = parentElement.replace('information', '');
        debug.log("BROWSER","A click has occurred in",parentElement,source);
        event.preventDefault();
        browser.handleClick(source, clickedElement, event);
        return false;
    } else {
        debug.log("BROWSER","Was clicked on non-infoclick element");
        return true;
    }
}

function onBrowserDoubleClicked(event) {
    var clickedElement = findClickableBrowserElement(event);
    if (clickedElement.hasClass("infoclick") && clickedElement.hasClass("draggable") && prefs.clickmode == "double") {
        debug.log("BROWSER","Was double clicked on element",clickedElement);
        debug.log("BROWSER","Track element was double clicked");
        event.preventDefault();
        playlist.addItems(clickedElement, null);
        return false;
    } else {
        return true;
    }
}

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
        if (clickedElement.parent().hasClass('clickdir')) {
            doFileMenu(event, clickedElement);
        } else {
            doAlbumMenu(event, clickedElement, false);
        }
    } else if (clickedElement.hasClass("clickremdb")) {
        event.stopImmediatePropagation();
        removeTrackFromDb(clickedElement);
    } else if (prefs.clickmode == "double") {
        if (clickedElement.hasClass("clickalbum")) {
            event.stopImmediatePropagation();
            albumSelect(event, clickedElement);
        } else if (clickedElement.hasClass("clicktrack") || clickedElement.hasClass("clickcue")) {
            event.stopImmediatePropagation();
            trackSelect(event, clickedElement);
        }
    } else {
        onCollectionDoubleClicked(event);
    }
}

function onCollectionDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass('clickalbum') ||
        clickedElement.hasClass('clickartist') ||
        clickedElement.hasClass('searchdir') ||
        clickedElement.hasClass('clicktrack') ||
        clickedElement.hasClass('clickcue')) {
        event.stopImmediatePropagation();
        playlist.addItems(clickedElement, null);
    }
}

function onFileCollectionClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doFileMenu(event, clickedElement);
    } else if (clickedElement.hasClass('clickdeleteplaylist')) {
        event.stopImmediatePropagation();
        player.controller.deletePlaylist(clickedElement.parent().children('input').first().attr('name'));
    } else if (clickedElement.hasClass('clickdeleteuserplaylist')) {
        event.stopImmediatePropagation();
        player.controller.deleteUserPlaylist(clickedElement.prev().prev().html());
    } else if (clickedElement.hasClass('clickrenameplaylist')) {
        event.stopImmediatePropagation();
        player.controller.renamePlaylist(clickedElement.parent().children('input').first().attr('name'), event);
    } else if (clickedElement.hasClass('clickrenameuserplaylist')) {
        event.stopImmediatePropagation();
        player.controller.renameUserPlaylist(clickedElement.prev().html(), event);
    } else if (clickedElement.hasClass('clickdeleteplaylisttrack')) {
        event.stopImmediatePropagation();
        player.controller.deletePlaylistTrack(clickedElement.parent().parent().prev().children('input').first().attr('name'), clickedElement.attr('name'), false);
    } else if (prefs.clickmode == "double") {
        if (clickedElement.hasClass("clickalbum") ||
            clickedElement.hasClass("clickloadplaylist") ||
            clickedElement.hasClass("clickloaduserplaylist")) {
            event.stopImmediatePropagation();
            albumSelect(event, clickedElement);
        } else if (clickedElement.hasClass("clicktrack") || clickedElement.hasClass("clickcue")) {
            event.stopImmediatePropagation();
            trackSelect(event, clickedElement);
        }
    } else {
        onFileCollectionDoubleClicked(event);
    }
}

function onFileCollectionDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass('searchdir') ||
        clickedElement.hasClass('clickalbum') ||
        clickedElement.hasClass('clicktrack') ||
        clickedElement.hasClass('clickcue') ||
        clickedElement.hasClass("clickloadplaylist") ||
        clickedElement.hasClass("clickloaduserplaylist")) {
        event.stopImmediatePropagation();
        playlist.addItems(clickedElement, null);
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
        playlist.addItems(clickedElement, null);
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
    } else if (clickedElement.hasClass("clickaddwholealbum")) {
        event.stopImmediatePropagation();
        playlist.addAlbumToCollection(clickedElement.attr("name"));
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
            clickedElement.prop("id") != "sources" && clickedElement.prop("id") != "sortable" &&
            !clickedElement.hasClass("mainpane") && !clickedElement.hasClass("topdropmenu")) {
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
        var x = $('#'+menutoopen);
        // If the dropdown doesn't exist then create it
        if (x.length == 0) {
            if (element.parent().hasClass('album1')) {
                var c = 'dropmenu notfilled album1';
            } else if (element.parent().hasClass('album2')) {
                var c = 'dropmenu notfilled album2';
            } else {
                var c = 'dropmenu notfilled';
            }
            var t = $('<div>', {id: menutoopen, class: c}).insertAfter(element.parent());
        }
        if ($('#'+menutoopen).hasClass("notfilled")) {
            $('#'+menutoopen).load("albums.php?item="+menutoopen, function() {
                $(this).removeClass("notfilled");
                $(this).menuReveal(function() {
                    scootTheAlbums($(this));
                    $.each($(this).find('input.expandalbum'), function() {
                        debug.log("CLICKFUNCTIONS", "Album has link to get all tracks");
                        element.makeSpinner();
                        $.ajax({
                            type: 'GET',
                            url: 'albums.php?browsealbum='+menutoopen,
                            success: function(data) {
                                element.stopSpinner();
                                $("#"+menutoopen).html(data);
                            },
                            error: function(data) {
                                element.stopSpinner();
                            }
                        });
                    });
                    $.each($(this).find('input.expandartist'), function() {
                        debug.log("CLICKFUNCTIONS", "Album has link to get all tracks for artist");
                        element.makeSpinner();
                        $.ajax({
                            type: 'GET',
                            url: 'albums.php?browsealbum='+menutoopen,
                            success: function(data) {
                                element.stopSpinner();
                                var spunk = $("#"+menutoopen).parent();
                                spunk.html(data);
                                scootTheAlbums(spunk);
                            },
                            error: function(data) {
                                element.stopSpinner();
                            }
                        });
                    });
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
        var x = $('#'+menutoopen);
        // If the dropdown doesn't exist then create it
        if (x.length == 0) {
            var c = 'dropmenu notfilled';
            var t = $('<div>', {id: menutoopen, class: c}).insertAfter(element.parent());
        }
        element.toggleOpen();
        if ($('#'+menutoopen).hasClass("notfilled")) {
            element.makeSpinner();
            var string;
            var plname = element.parent().children('input').attr('name');
            if (menutoopen.match(/^pholder\d/)) {
                debug.log("MPD","Browsing playlist",plname);
                string = "player/mpd/loadplaylists.php?playlist="+plname;
            } else {
                string = "dirbrowser.php?path="+plname+'&prefix='+menutoopen;
            }
            $('#'+menutoopen).load(string, function() {
                $(this).removeClass("notfilled");
                var callback = null;
                if (string.match(/loadplaylists\.php/)) {
                    callback = plMenuHack;
                }
                $(this).menuReveal(callback);
                element.stopSpinner();
            });
        } else {
            $('#'+menutoopen).menuReveal(plMenuHack);
        }
    } else {
        $('#'+menutoopen).menuHide(plMenuHack);
        element.toggleClosed();
    }
    return false;
}

function plMenuHack() {
    layoutProcessor.fanoogleMenus($("#lpscr"));
}

function setDraggable(divname) {

    if (layoutProcessor.supportsDragDrop) {
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
                $(dragger).addClass("draggable dragsort containerbox vertical dropshadow");
                if (!clickedElement.hasClass("selected")) {
                    if (clickedElement.hasClass("clickalbum") ||
                        clickedElement.hasClass("clickloadplaylist")) {
                        albumSelect(event, clickedElement);
                    } else if (clickedElement.hasClass("clicktrack") || clickedElement.hasClass("clickcue")) {
                        trackSelect(event, clickedElement);
                    }
                }
                if ($(".selected").length > 6) {
                    $(dragger).append('<div class="containerbox menuitem">'+
                        '<div class="smallcover fixed"><i class="icon-music smallcover-svg"></i></div>'+
                        '<div class="expand"><h3>'+$(".selected").length+' Items</h3></div>'+
                        '</div>');
                } else {
                    $(".selected").clone().removeClass("selected").appendTo(dragger);
                }
                // Little hack to make dragging from the various tag/rating/playlist managers
                // look prettier
                $(dragger).find('tr').wrap('<table></table>');
                $(dragger).find('.icon-cancel-circled').remove();

                var pos = {top: event.pageY - 12, left: event.pageX - 80};
                $(dragger).css({top: pos.top+"px", left: pos.left+"px"});

                return dragger;
            }
        });
    }
}

function onKeyUp(e) {
    if (e.keyCode == 13) {
        debug.log("KEYUP","Enter was pressed");
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
        $("#"+div_to_select).find(".clickable").filter(noActionButtons).each(function() {
            $(this).removeClass("selected");
            last_selected_element = $(this);
        });
    } else {
        element.addClass("selected");
        last_selected_element = element;
        $("#"+div_to_select).find(".clickable").filter(noActionButtons).each(function() {
            $(this).addClass("selected");
            last_selected_element = $(this);
        });
    }
}

function noActionButtons(i) {
    if ($(this).hasClass('clickdeleteplaylisttrack')) {
        return false;
    }
    return true;
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
    var it = first;
    while(!it.hasClass('selecotron')) {
        it = it.parent();
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

function ihatefirefox() {
    if (prefs.search_limit_limitsearch) {
        $("#mopidysearchdomains").show();
    } else {
        $("#mopidysearchdomains").hide();
    }
}
