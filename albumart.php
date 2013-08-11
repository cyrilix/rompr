<?php
include ("vars.php");
include ("functions.php");
set_time_limit(240);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR Album Art</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="cache-control" content="max-age=0" />
<meta http-equiv="cache-control" content="no-cache" />
<meta http-equiv="expires" content="0" />
<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
<meta http-equiv="pragma" content="no-cache" />
<link rel="stylesheet" type="text/css" href="layout.css" />
<?php
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="ba-debug.js"></script>
<script type="text/javascript" src="coverscraper.js"></script>
<script src="https://www.google.com/jsapi?key=ABQIAAAAD8fM_RJ2TaPVvDsHb-8MdxS61EkEqhmzf3WQQFI0-v4LA4gElhRtzkt_mX1FPwUDz9DchkRCsKg3SA"></script>
<script language="JavaScript">
// debug.setLevel(0);

var imageSearch;
var mobile = "no";
var imagekey = '';
var imgobj = null;
var useLocalStorage = false;
var running = false;
var clickindex = null;
var wobblebottom;
var searchcontent;
var localimages;
var allshown = true;
var firefoxcrapnesshack = 0;
google.load('search', 1);

function getNewAlbumArt(div) {

    debug.log("Getting art in",div);
    $.each($(div).find("img").filter(filterImages), myMonkeyHasBigEars );
    if (running == false) {
        running = true;
        $("#progress").fadeIn('slow');
        $("#harold").unbind("click");
        $("#harold").bind("click", reset );
        $("#harold").html("Stop Download");
    }

}

// Does anybody ever read the comments in code?
// I hope they do, because most of the comments in my code are entirely useless.

function filterImages() {
    return $(this).hasClass("notexist");
}

function myMonkeyHasBigEars() {
    var a = this.getAttribute('name');
    covergetter.GetNewAlbumArt(a);
}

function reset() {
    covergetter.reset(-1);
}

function onresize() {
    wobbleMyBottom();
}

function start() {
    getNewAlbumArt('#wobblebottom');
}

function aADownloadFinished() {
    if (running == true) {
        running = false;
        $("#harold").unbind("click");
        $("#harold").bind("click", start );
        $("#harold").html("Get Missing Covers");
    }
    $("#status").html("");
    $("#progress").fadeOut('slow');
    $("#progress").progressbar("option", "value", 0);
}

function onWobblebottomClicked(event) {
    
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickalbumcover")) {
        event.stopImmediatePropagation();
        doGoogleSearch(clickedElement.attr('romprartist'), clickedElement.attr('rompralbum'), 
            clickedElement.attr('name'), clickedElement.attr('romprpath'));
    } 
}

function onGoogleSearchClicked(event) {    
    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickgimage")) {
        debug.log("Doing :",clickedElement.attr('romprsrc'), clickedElement.attr('romprindex'));
        event.stopImmediatePropagation();
        updateImage(clickedElement.attr('romprsrc'), clickedElement.attr('romprindex'));
    } 
}

function findClickableElement(event) {

    var clickedElement = $(event.target);
    // Search upwards through the parent elements to find the clickable object
    while (!clickedElement.hasClass("clickable") &&
            clickedElement.prop("id") != "wobblebottom" &&
            clickedElement.prop("id") != "searchcontent") {
        clickedElement = clickedElement.parent();
    }
    return clickedElement;
    
}

function boogerbenson() {
    if (allshown) {
        $("img", "#wobblebottom").filter( onlywithcovers ).parent().parent().hide();
        $("#finklestein").html("Show All Covers");
        $(".albumsection").filter( emptysections ).hide();
        $(".bigholder").filter( emptysections2 ).hide();
    } else {
        $(".bigholder").filter( emptysections2 ).show();
        $(".albumsection").filter( emptysections ).show();
        $("img", "#wobblebottom").filter( onlywithcovers ).parent().parent().show();
        $("#finklestein").html("Show Only Albums Without Covers");
    }
    allshown = !allshown;
}

function onlywithcovers() {
    return !($(this).hasClass('notexist') || $(this).hasClass('notfound'));
}

function emptysections() {
    var empty = true;
    $.each($(this).next().find('.albumimg'), function() { if (!$(this).is(':hidden')) { empty = false } });
    return empty;
}

function emptysections2() {
    var empty = true;
    $.each($(this).find('.albumimg'), function() { if (!$(this).is(':hidden')) { empty = false } });
    return empty;
}

$(document).ready(function () {

    $("#totaltext").html(numcovers+" albums");
    $("#progress").progressbar();
    $(window).bind('resize', onresize );
    if ("localStorage" in window && window["localStorage"] != null) {
        useLocalStorage = true;
    }
    covergetter = new coverScraper(1, useLocalStorage, true, true);
    covergetter.reset(albums_without_cover);
    $("#harold").click( start );
    $("#finklestein").click( boogerbenson );
    imageSearch = new google.search.ImageSearch();
    imageSearch.setSearchCompleteCallback(this, googleSearchComplete, null);
    imageSearch.setRestriction(
        google.search.Search.RESTRICT_SAFESEARCH,
        google.search.Search.SAFESEARCH_OFF
    );    
    imageSearch.setResultSetSize(8);
    createPopup();
    wobblebottom = $('#wobblebottom');
    wobblebottom.click(onWobblebottomClicked);
    wobbleMyBottom();
});

function createPopup() {

    popupWindow.create(700, 540, "googlepopup", false, "Choose Album Picture");
    
    var googleinput = $('<div>', { id: 'googleinput' }).appendTo($("#popupcontents"));
    var g1 = $('<div>', { class: 'holdingcell' }).append('<h3>Upload A File</h3>').appendTo(googleinput);
    var uform = $('<form>', { id: 'uform', action: 'getalbumcover.php', method: 'post', enctype: 'multipart/form-data' }).appendTo(g1);

    uform.append($('<input>', { id: 'imagekey', type: 'hidden', name: 'key', value: '' }));
    uform.append($('<input>', { name: 'ufile', type: 'file', size: '80', class: 'tleft sourceform', style: 'color:#ffffff' }));
    uform.append($('<input>', { type: 'submit', class: 'tright topformbutton', value: 'Upload', style: 'width:8em' }));
    
    var g2 = $('<div>', { class: 'holdingcell underlined' }).append('<h3>Or Search Google Images</h3>').appendTo(googleinput);
    g2.append($('<input>', { type: 'text', id: 'searchphrase', class: 'tleft sourceform', size: '80' }));
    var b = $('<button>', { class: 'tright topformbutton', onclick: 'research()', style: 'width:8em' }).appendTo(g2);
    b.html('Search');
    
    $("#popupcontents").append($('<div>', {id: 'branding'}));
    searchcontent = $('<div>', {class: 'holdingcell'}).appendTo($("#popupcontents"));
    localimages = $('<div>', {class: 'holdingcell'}).appendTo($("#popupcontents"));
    google.search.Search.getBranding('branding');
    uform.ajaxForm( uploadComplete );
    searchcontent.click(onGoogleSearchClicked);
    localimages.click(onGoogleSearchClicked);
    $('#searchphrase').keyup(bumblefuck);

}

function bumblefuck(e) {
    if (e.keyCode == 13) {
        research();
    }
}

function wobbleMyBottom() {
    var ws = getWindowSize();
    var newheight = ws.y - wobblebottom.offset().top;
    wobblebottom.css("height", newheight.toString()+"px");
}

function doGoogleSearch(artist, album, key, path) {
    wobblebottom.unbind("click");
    imagekey = key;
    imgobj = $('img[name="'+imagekey+'"]');
    var monkeybrains = decodeURIComponent(artist)+" "+decodeURIComponent(album);
    $("#searchphrase").attr("value", monkeybrains);
    $("#imagekey").attr("value", imagekey);
    popupWindow.setsize();
    imageSearch.execute(monkeybrains);
    if (path) {
        $.getJSON("findLocalImages.php?path="+path, gotLocalImages)
    }
    popupWindow.open();
}

function research() {
    searchcontent.empty();
    imageSearch.execute($("#searchphrase").attr("value"));
}

function gotLocalImages(data) {
    debug.log("Local Images: ",data);
    if (data && data.length > 0) {
        localimages.append("<h3>&nbsp;&nbsp;Or Choose An Image From The Album Folder</h3>")
        for (var i in data) {
            var result = data[i];
            debug.log(result);
             localimages.append($("<img>", { 
                                                id: "img"+(i+100).toString(),
                                                romprsrc: result,
                                                romprindex: i+100,
                                                class: "gimage clickable clickicon clickgimage" ,
                                                src: result
                                            })
                                );
        }
        $(".gimage").css("height", "120px");
    }
}

function closeGooglePopup() {
    popupWindow.close();
}

function iveHadEnoughOfThis() {
    searchcontent.empty();
    localimages.empty();
    wobblebottom.click(onWobblebottomClicked);
}

function googleSearchComplete() {
    if (imageSearch.results && imageSearch.results.length > 0) {
        for (var i in imageSearch.results) {
            var result = imageSearch.results[i];
             searchcontent.append($("<img>", { 
                                                id: "img"+i,
                                                romprsrc: result.url,
                                                romprindex: i,
                                                class: "gimage clickable clickicon clickgimage" ,
                                                src: result.tbUrl
                                            })
                                );
        }
        $(".gimage").css("height", "120px");
    } else {
        searchcontent.html('<h3>No Images Found</h3>');
    }
}

function updateImage(url, index) {
    clickindex = index;
    $('#img'+clickindex).attr('src', 'images/image-update.gif');
    var options = { key: imagekey,
                    src: url
                    };
    var stream = imgobj.attr("romprstream");
    if (typeof(stream) != "undefined") {
        options.stream = stream;
    }
    $.ajax({
        url: "getalbumcover.php",
        type: "POST",
        data: options,
        cache:false,
        success: uploadComplete,
        error: searchFail
    });
}

function searchFail() {
    $('#img'+clickindex).attr('src', 'images/notfound.png');
}

function uploadComplete() {
    debug.log("Success for",imagekey);
    closeGooglePopup();
    
    // In nearly every browser we can just update the src attribute of the image and even
    // though the URL hasn't changed the browser will check with the server and update the image.
    // But not firefox, oh no. Not firefox. Just for Mozilla, because these days they can't be
    // trusted to do ANYTHING properly, we have to delete the image and create a new one.
    // And EVEN THAT isn't enough because the new image has the same URL as the old one and firefox
    // STILL won't just check with the server EVEN THOUGH we have used every cache-control setting
    // known to mankind. So we concoct a made-up URL that has to be different EVERY TIME and let our 404
    // redirect it to the actual image. 
    // Although I don't know what the hell's going on at Mozilla these days, I'd hazard a guess
    // that the reason they've gone from being the exciting new kids on the block to being the
    // stodgy old unreliable mess they now are is one word - management. They need less of it.    
    
    var p = imgobj.parent();
    var ra = imgobj.attr("romprartist");
    var rl = imgobj.attr("rompralbum");
    var n = imgobj.attr("name");
    var pth = imgobj.attr("romprpath");
    if (imgobj.hasClass('notexist') || imgobj.hasClass('notfound')) {
        covergetter.updateInfo(1);
    }
    imgobj.remove();
    var newimg = $('<img>', {   class: 'clickable clickicon clickalbumcover',
                                romprartist: ra,
                                rompralbum: rl,
                                name: n,
                                romprpath: pth,
                                height: '82px',
                                width: '82px',
                                src: "albumart/firefoxiscrap/"+imagekey+"---"+firefoxcrapnesshack.toString()
                            }
                    );
    firefoxcrapnesshack++;
    p.append(newimg);
    if (useLocalStorage) {
        sendLocalStorageEvent(imagekey);
    }
}

</script>
</head>
<body>
<div id="albumcovers">
<div class="infosection">
<table width="100%">
<tr><td colspan="3"><h2>Album Art</h2></td></tr>
<tr><td class="outer" id="totaltext"></td><td class="inner"><div class="inner invisible" id="progress"></div></td><td class="outer" align="right"><button id="harold" class="topformbutton">Get Missing Covers</button></td></tr>
<tr><td class="outer" id="infotext"></td><td class="inner" align="center"><div class="inner" id="status"></div></td><td class="outer" align="right"><button id="finklestein" class="topformbutton">Show Only Albums Without Covers</button></td></tr>
</table>
</div>
</div>
<div id="wobblebottom">
<?php

// Do Local Albums

$count = 0;
$albums_without_cover = 0;
if (file_exists($ALBUMSLIST)) {
    $collection = simplexml_load_file($ALBUMSLIST);
    foreach($collection->artists->artist as $artist) {
        print '<div class="albumsection">';
        print '<div class="tleft"><h2>'.$artist->name.'</h2></div><div class="tright rightpad"><button class="topformbutton" onclick="getNewAlbumArt(\'#album'.$count.'\')">Get These Covers</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        print '<div class="containerbox covercontainer">';
        $colcount = 0;
        foreach ($artist->albums->album as $album) {
            print '<div class="expand containerbox vertical albumimg">';
            print '<div class="albumimg fixed">';

            $class = "clickable clickicon clickalbumcover";
            $src = "albumart/original/".$album->image->name.".jpg";
            if ($album->image->exists == "no") {
                $class = $class . " notexist";
                $albums_without_cover++;
                $src = "images/album-unknown.png";
            }
            print '<img class="'.$class.'" romprartist="'.$album->image->romprartist.'" rompralbum="'.$album->image->rompralbum.'"';
            if ($album->mbid) {
                print ' rompralbumid="'.$album->mbid.'"';
            }
            if ($album->directory) {
                print ' romprpath="'.$album->directory.'"';
            }
            print ' name="'.$album->image->name.'" height="82px" width="82px" src="'.$src.'">';
            print '</div>';
            print '<div class="albumimg fixed">'.$album->name.'</div>';
            print '</div>';
            
            $colcount++;
            if ($colcount == 7) {
                print "</div>\n".'<div class="containerbox covercontainer">';
                $colcount = 0;
            }
            $count++;
        }
        print "</div></div>\n";

    }

} else {
    print '<h3>Please create your music collection before trying to download covers<h3>';
}

do_radio_stations();

print "</div>\n";
print "</div>\n";
print '<script language="JavaScript">'."\n";
print 'var numcovers = '.$count.";\n";
print 'var albums_without_cover = '.$albums_without_cover.";\n";
print "</script>\n";
print "</body>\n";
print "</html>\n";


function do_radio_stations() {

    global $count;
    global $albums_without_cover;
    $playlists = glob("prefs/USERSTREAM*.xspf");
    if (count($playlists) > 0) {
        print '<div class="albumsection">';
        print '<div class="tleft"><h2>Radio Stations</h2></div><div class="tright rightpad"><button class="topformbutton" onclick="getNewAlbumArt(\'#album'.$count.'\')">Get These Covers</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        
        print '<div class="containerbox covercontainer">';
        $colcount = 0;
        foreach ($playlists as $i => $file) {
            print '<div class="expand containerbox vertical albumimg">';
            print '<div class="albumimg fixed">';
            $x = simplexml_load_file($file);
            foreach($x->trackList->track as $i => $track) {
                if ($track->album) {
                    $artname = md5($track->album);
                    $class = "";
                    $src = "images/broadcast.png";
                    if ($track->image != "images/broadcast.png") {
                        $src = $track->image;
                    } elseif (file_exists("albumart/original/".$artname.".jpg")) {
                        $src = "albumart/original/'.$artname.'.jpg";
                    } else {
                        $class = "notexist";
                        $albums_without_cover++;
                    }
                    print '<img class="clickable clickicon clickalbumcover '.$class.'" romprstream="'.$file.'" romprartist="Internet%20Radio" rompralbum="'.rawurlencode($track->album).'"';
                    print ' name="'.$artname.'" height="82px" width="82px" src="'.$src.'">';
                    print '</div>';
                    print '<div class="albumimg fixed">'.$track->album.'</div>';
                    print '</div>';
                    
                    $colcount++;
                    if ($colcount == 7) {
                        print "</div>\n".'<div class="containerbox covercontainer">';
                        $colcount = 0;
                    }
                    $count++;
                    break;
                }
            }
        }
        print "</div></div>\n";
    }
            
}
    