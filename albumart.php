<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
set_time_limit(240);
// session_start();
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
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";

var imageSearch;
var imagekey = '';
var imgobj = null;
var useLocalStorage = false;
var running = false;
var clickindex = null;
var wobblebottom;
var searchcontent;
var allshown = true;
google.load('search', 1);

function getNewAlbumArt(div) {

    debug.log("Getting art in",div);
    $(div).find("img").filter( filterImages ).each( myMonkeyHasBigEars );
    if (running == false) {
        running = true;
        $("#progress").fadeIn('slow');
        $("#harold").unbind("click");
        $("#harold").bind("click", reset );
//         $("#harold").bind("click", stepthrough );
        $("#harold").html("Stop Download");
    }

}

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

// function stepthrough() {
//     covergetter.step();
// }

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
        doGoogleSearch(clickedElement.attr('romprartist'), clickedElement.attr('rompralbum'), clickedElement.attr('name'));
    } 
}

function onGoogleSearchClicked(event) {

    debug.log("Goo=gle Search Clicked");
    
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
    $(this).next().find('.albumimg').each( function() { if (!$(this).is(':hidden')) { empty = false } });
    return empty;
}

function emptysections2() {
    var empty = true;
    $(this).find('.albumimg').each( function() { if (!$(this).is(':hidden')) { empty = false } });
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
    searchcontent = $('<div>').appendTo($("#popupcontents"));
    google.search.Search.getBranding('branding');
    uform.ajaxForm( uploadComplete );
    searchcontent.click(onGoogleSearchClicked);

}

function wobbleMyBottom() {
    var ws = getWindowSize();
    var newheight = ws.y - wobblebottom.offset().top;
    wobblebottom.css("height", newheight.toString()+"px");
}

function doGoogleSearch(artist, album, key) {
    wobblebottom.unbind("click");
    imagekey = key;
    imgobj = $('img[name="'+imagekey+'"]');
    var monkeybrains = decodeURIComponent(artist)+" "+decodeURIComponent(album);
    $("#searchphrase").attr("value", monkeybrains);
    $("#imagekey").attr("value", imagekey);
    popupWindow.setsize();
    imageSearch.execute(monkeybrains);  
    popupWindow.open();
}

function research() {
    searchcontent.empty();
    imageSearch.execute($("#searchphrase").attr("value"));
}

function closeGooglePopup() {
    popupWindow.close();
}

function iveHadEnoughOfThis() {
    searchcontent.empty();
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
    imgobj.attr("src", "albumart/original/"+imagekey+".jpg");
    if (imgobj.hasClass("notexist") ||
        imgobj.hasClass("notfound")) {
        covergetter.updateInfo(1);
        imgobj.removeClass("notexist notfound");
    }
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
$covers = (array_key_exists("nocover", $_REQUEST)) ? true : false;
$collection = doCollection("listallinfo");
$artistlist = $collection->getSortedArtistList();
$count = 0;
$albums_without_cover = 0;
if (array_search("various artists", $artistlist)) {
    $key = array_search("various artists", $artistlist);
    unset($artistlist[$key]);
    do_albumcovers("various artists", false, $covers);
}
foreach($artistlist as $artistkey) {
    do_albumcovers($artistkey, true, $covers);
}

close_mpd($connection);

do_radio_stations($covers);

print "</div>\n";
print "</div>\n";
print '<script language="JavaScript">'."\n";
print 'var numcovers = '.$count.";\n";
print 'var albums_without_cover = '.$albums_without_cover.";\n";
print "</script>\n";
print "</body>\n";
print "</html>\n";

function do_albumcovers($artistkey, $comps, $covers) {

    global $collection;
    global $count;
    global $albums_without_cover;

    $albumlist = $collection->getAlbumList($artistkey, $comps, $covers);

    if (count($albumlist) > 0) {
        $artist = $collection->artistName($artistkey);
        print '<div class="albumsection">';
        print '<div class="tleft"><h2>'.$artist.'</h2></div><div class="tright rightpad"><button class="topformbutton" onclick="getNewAlbumArt(\'#album'.$count.'\')">Get These Covers</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        
        print '<div class="containerbox covercontainer">';
        $colcount = 0;
        foreach ($albumlist as $album) {
            print '<div class="expand containerbox vertical albumimg">';
            print '<div class="albumimg fixed">';
            $artname = md5($album->artist . " " . $album->name);
            $b = munge_album_name($album->name);
            $class = "";
            $src = 'albumart/original/'.$artname.'.jpg';
            if (!file_exists($src)) {
               $class = "notexist";
               $src = "images/album-unknown.png";
               $albums_without_cover++;
            }
            print '<img class="clickable clickicon clickalbumcover '.$class.'" romprartist="'.rawurlencode($album->artist).'" rompralbum="'.rawurlencode($b).'"';
            if ($album->musicbrainz_albumid) {
                print ' rompralbumid="'.$album->musicbrainz_albumid.'"';
            }
            print ' name="'.$artname.'" height="82px" width="82px" src="'.$src.'">';
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
            
}

function do_radio_stations($covers) {

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
                    if (file_exists("albumart/original/".$artname.".jpg") ||
                        $track->image != "images/broadcast.png") {
                        if ($covers) {
                            break;
                        }
                    }
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
    