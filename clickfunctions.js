function onCollectionClicked(event) {
    
    var clickedElement = findClickableElement(event);
    debug.log("Collection was clicked",clickedElement);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickedElement.hasClass("clickalbum")) {
        event.stopImmediatePropagation();
        albumSelect(event, clickedElement);
    } else if (clickedElement.hasClass("clicktrack")) {
        event.stopImmediatePropagation();
        albumSelect(event, clickedElement);
    }
    
}

function onCollectionDoubleClicked(event) {

    var clickedElement = findClickableElement(event);
    debug.log("Collection was double clicked",clickedElement);
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
    debug.log("Last.FM was clicked",clickedElement);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    }
}

function onLastFMDoubleClicked(event) {
    
    var clickedElement = findClickableElement(event);
    debug.log("Last.FM was clicked",clickedElement);
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
    debug.log("Radio was clicked",clickedElement);
    if (clickedElement.hasClass("menu")) {
        doMenu(event, clickedElement);
    } else if (clickedElement.hasClass("clickradioremove")) {
        event.stopImmediatePropagation();
        removeUserStream(clickedElement.attr("name"));
    }
}

function onRadioDoubleClicked(event) {
    var clickedElement = findClickableElement(event);
    debug.log("Radio was double clicked",clickedElement);
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
    debug.log("Playlist was clicked",clickedElement);
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
        playlist.checkSongIdAfterStop(clickedElement.attr("romprid"));
    }
}

function findClickableElement(event) {

    var clickedElement = $(event.target);
    // Search upwards through the parent elements to find the clickable object
    while (!clickedElement.hasClass("clickable") && !clickedElement.hasClass("menu") && clickedElement.prop("id") != "sources") {
        clickedElement = clickedElement.parent();
    }
    return clickedElement;
    
}

function doMenu(event, element) {

    if (event) {
        event.stopImmediatePropagation();
    }
    var menutoopen = element.attr("name");
    debug.log("Blahdeblah",menutoopen);
    if (element.attr("src") == "images/toggle-closed.png") {
        element.attr("src", "images/toggle-open.png");
        $('#'+menutoopen).find(".updateable").attr("src", function () {
            $(this).removeClass("updateable");
            if ($(this).hasClass("notexist")) {
                coverscraper.getNewAlbumArt(this);
                return "images/album-unknown-small.png";
            } else if ($(this).hasClass("notfound")) {
                return "images/album-unknown-small.png";
            } else {
                return "albumart/small/" + $(this).attr("name") + ".jpg";
            }
        });
    } else if (element.attr("src") == "images/toggle-open.png"){
        element.attr("src", "images/toggle-closed.png");
    }
    $('#'+menutoopen).slideToggle('fast');

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
                albumSelect(event, clickedElement);
            }
            $(".selected").clone().removeClass("selected").appendTo(dragger);
            return dragger;
        }
    });    
}

