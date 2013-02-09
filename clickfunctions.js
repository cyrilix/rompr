function onCollectionClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickmode == "double") {
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

function onLastFMClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickedElement.hasClass("clicklfmuser")) {
        event.stopImmediatePropagation();
        window.open("http://www.last.fm/user/"+clickedElement.attr("name"), "_blank");
    } else if (clickmode == "single") {
        onLastFMDoubleClicked(event);
    }
}

function onLastFMDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clicklfm")) {
        event.stopImmediatePropagation();
        doLastFM(clickedElement.attr("name"), lastfm.username());
    } else if (clickedElement.hasClass("clicklfm2")) {
        event.stopImmediatePropagation();
        doLastFM(clickedElement.attr("name"), clickedElement.attr("username"));
    }
}

function onRadioClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickedElement.hasClass("clickradioremove")) {
        event.stopImmediatePropagation();
        removeUserStream(clickedElement.attr("name"));
    } else if (clickmode == "single") {
        onRadioDoubleClicked(event);
    }
}

function onRadioDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickicecast")) {
        event.stopImmediatePropagation();
        addIceCast(clickedElement.attr("name"));
    } else if (clickedElement.hasClass("clickbbc")) {
        event.stopImmediatePropagation();
        getInternetPlaylist(clickedElement.attr("name"), clickedElement.attr("bbcimg"));
    } else if (clickedElement.hasClass("clicksoma")) {
        event.stopImmediatePropagation();
        getInternetPlaylist(clickedElement.attr("name"), clickedElement.attr("somaimg"), clickedElement.attr("somaname"), 'Soma FM');
    } else if (clickedElement.hasClass("clickradio")) {
        event.stopImmediatePropagation();
        playUserStream(clickedElement.attr("name"));
    }
}

function onPlaylistClicked(event) {
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickplaylist")) {
        event.stopImmediatePropagation();
        mpd.command("command=playid&arg="+clickedElement.attr("romprid"));
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
    } else if (clickedElement.hasClass("clickremovelfmtrack")) {
        event.stopImmediatePropagation();
        playlist.clearProgressTimer();
        playlist.checkSongIdAfterStop(clickedElement.attr("romprid"));
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
    $('#'+menutoopen).slideToggle('fast');
    if (element.attr("src") == "images/toggle-closed.png") {
        element.attr("src", "images/toggle-open.png");
        $('#'+menutoopen).find(".updateable").each(noAnonymousFunctions);
    } else if (element.attr("src") == "images/toggle-open.png"){
        element.attr("src", "images/toggle-closed.png");
    }
    return false;

}

function noAnonymousFunctions() {
    $(this).removeClass("updateable");
    if ($(this).hasClass("notexist")) {
        coverscraper.GetNewAlbumArt($(this).attr('name'));
    } else if ($(this).hasClass("notfound")) {
    } else {
        $(this).attr("src", "albumart/small/" + $(this).attr("name") + ".jpg");
    }
}    

function setDraggable(divname) {

    $("#"+divname).draggable({  
        connectToSortable: "#sortable",
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
                } else if (clickedElement.hasClass("clicktrack")) {
                    trackSelect(event, clickedElement);
                }
            }
            $(".selected").clone().removeClass("selected").appendTo(dragger);
            return dragger;
        }
    });    
}

function srDrag(event, ui) {
    var size = getWindowSize();
    if (ui.offset.left < 120) { ui.offset.left = 120; }
    sourceswidthpercent = ((ui.offset.left+8)/size.x)*100;
    doThatFunkyThang();
    $(this).data('draggable').position.left = 0;
}

function srDragStop(event, ui) {
    savePrefs({sourceswidthpercent: sourceswidthpercent.toString()});
}    
