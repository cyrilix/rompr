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
<link rel="stylesheet" type="text/css" href="layout.css" />
<?php
print '<link id="theme" rel="stylesheet" type="text/css" href="'.$prefs['theme'].'" />'."\n";
?>
<link type="text/css" href="jqueryui1.8.16/css/start/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
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
var windowScroll;
var useLocalStorage = false;
var coverscraper = null;
var running = false;
google.load('search', 1);

function getNewAlbumArt(div) {

    debug.log("Getting art in",div);
    $(div).find("img").filter( function() { return $(this).hasClass("notexist") } ).each( function() { coverscraper.GetNewAlbumArt($(this).attr('name')) } );
    if (running == false) {
        running = true;
        $("#harold").unbind("click");
        $("#harold").bind("click", reset );
        $("#harold").html("Stop Download");
    }

}

var reset = function() {
    coverscraper.reset(-1);
}

var onresize = function() {
    wobbleMyBottom();
}

var start = function() {
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
    $("#progress").progressbar("option", "value", 0);
}

$(document).ready(function () {

    $("#totaltext").html(numcovers+" albums");
    $("#progress").progressbar();
    wobbleMyBottom();
    $(window).bind('resize', onresize );
    if ("localStorage" in window && window["localStorage"] != null) {
        useLocalStorage = true;
    }
    coverscraper = new coverScraper(1, useLocalStorage, true, true);
    coverscraper.reset(albums_without_cover);
    $("#harold").click( start );
});

function wobbleMyBottom() {
    var ws = getWindowSize();
    var newheight = ws.y - $("#wobblebottom").offset().top;
    $("#wobblebottom").css("height", newheight.toString()+"px");
}

function doGoogleSearch(artist, album, key) {
    imagekey = key;
    windowScroll = getScrollXY();
    var googlePopup = popupWindow.create(700, 540, "googlepopup", false, "Choose Album Picture");

    $("#popupcontents").append('<div id="googleinput"></div>');
    $("#googleinput").append('<div name="g1" id="holdingcell"><h3>Upload A File</h3></div>');
    $('div[name="g1"]').append('<form id="uform" action="getalbumcover.php" method="post" enctype="multipart/form-data"></form>');
    $("#uform").append('<input type="hidden" name="key" value="'+imagekey+'" />');
    $("#uform").append('<table width="100%" cellpadding="0" cellspacing="0" id="gibbon"></table>');
    $("#gibbon").append('<tr><td><input style="color:#ffffff" class="tleft sourceform" type="file" size="80" name="ufile" /></td>'+
                        '<td><input style="width:8em" class="tright topformbutton" type="submit" value="Upload" /></td></tr>');
    $("#googleinput").append('<div name="g2" id="holdingcell" class="underlined"><h3>Or Search Google Images</h3></div>');
    $('div[name="g2"]').append('<table width="100%" cellpadding="0" cellspacing="0" id="penguin"></table>');
    $("#penguin").append('<tr><td><input type="text" id="searchphrase" class="tleft sourceform" size="80"></input></td>'+
                            '<td><button style="width:8em" class="tright topformbutton" onclick="research()">Search</button></td></tr>');
    $("#popupcontents").append('<div id="branding"></div>');
    $("#popupcontents").append('<div id="searchcontent"></div>');

    $("#searchphrase").attr("value", decodeURIComponent(artist)+" "+decodeURIComponent(album));
    popupWindow.open();
    imageSearch = new google.search.ImageSearch();
    imageSearch.setSearchCompleteCallback(this, googleSearchComplete, null);
    imageSearch.setResultSetSize(8);
    google.search.Search.getBranding('branding');
    imageSearch.execute(decodeURIComponent(artist)+" "+decodeURIComponent(album));  
    $("#uform").ajaxForm( function(data) {
        closeGooglePopup();
        $('img[name="'+imagekey+'"]').attr("src", "albumart/original/"+imagekey+".jpg");
        if ($('img[name="'+imagekey+'"]').hasClass("notexist") ||
            $('img[name="'+imagekey+'"]').hasClass("notfound")) {
            coverscraper.updateInfo(1);
            $('img[name="'+imagekey+'"]').removeClass("notexist");
            $('img[name="'+imagekey+'"]').removeClass("notfound");
        }
        if (useLocalStorage) {
            coverscraper.sendLocalStorageEvent(key);
        }
    });
}

function research() {
    var thing = $("#searchphrase").attr("value");
    imageSearch.execute(thing);
}

function closeGooglePopup() {
    $("#googlepopup").fadeOut('fast', function () {
        window.scroll(windowScroll.x, windowScroll.y);
    });
}

function googleSearchComplete() {

    if (imageSearch.results && imageSearch.results.length > 0) {
        $("#searchcontent").html("");
        var imagesizes = {w:0, h:0};
        var results = imageSearch.results;
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            $("#searchcontent").append('<div id="'+i+'" class="gimage"></div>');
            $("#"+i).append('<img id="img'+i+'" class="bumfinger" src="'+result.tbUrl+'"></img>');
            $("#img"+i).wrap('<a href="javascript:updateImage(\''+imagekey+'\', \''+result.url+'\')" />');
            var thisimagesize = {w:parseInt(result.tbWidth), h:parseInt(result.tbHeight)};
            if (thisimagesize.w > imagesizes.w) {
                imagesizes.w = thisimagesize.w;
            }
            if (thisimagesize.h > imagesizes.h) {
                imagesizes.h = thisimagesize.h;
            }
            $(".gimage").width(imagesizes.w);
            $(".gimage").height(imagesizes.h);
        }
    }
}

function updateImage(key, url) {
    closeGooglePopup();
    $('img[name="'+key+'"]').attr("src", "images/image-update.gif");
    var getstring = "key="+encodeURIComponent(key)+"&src="+encodeURIComponent(url);
    var stream = $('img[name="'+key+'"]').attr("romprstream");
    debug.log("stream",stream);
    if (typeof(stream) != "undefined") {
        getstring = getstring + "&stream="+stream;
    }
    $.get("getalbumcover.php", getstring)
    .done(function () {
        if (useLocalStorage) {
            coverscraper.sendLocalStorageEvent(key);
        }
        $('img[name="'+key+'"]').attr("src", "albumart/original/"+key+".jpg");
        if ($('img[name="'+key+'"]').hasClass("notexist") ||
            $('img[name="'+key+'"]').hasClass("notfound")) {
            coverscraper.updateInfo(1);
            $('img[name="'+key+'"]').removeClass("notexist");
            $('img[name="'+key+'"]').removeClass("notfound");
        }
    })
    .fail(function () {
        debug.log("Album Cover Get Failed");
        $('img[name="'+key+'"]').attr("src", "images/album-unknown.png");
    });
}

</script>
</head>
<body>
<div id="albumcovers">
<div id="infosection">
<table width="100%"><tr><td>
<h2>Album Art</h2></td></tr>
<tr><td><p id="totaltext"></p><p id="infotext"></p></td>
<td width="40%"><div id="progress"></div><br><div id="status"></div></td>
<td align="right">
<button id="harold" class="topformbutton">Get Missing Covers</button>
</td></tr>
<?php
if(array_key_exists("nocover", $_REQUEST)) {
?>
<tr><td></td><td></td><td align="right"><a href="albumart.php">Show All Albums</a></td></tr>
<?php
} else {
?>
<tr><td></td><td></td><td align="right"><a href="albumart.php?nocover=yes">Show Only Albums Without Covers</a></td></tr>
<?php
}
?>
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
        print '<div id="albumsection">';
        print '<div class="tleft"><h2>'.$artist.'</h2></div><div class="tright"><button class="topformbutton" onclick="getNewAlbumArt(\'#album'.$count.'\')">Get These Covers</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'">';
        $albumnames = array();
        print '<table align="center" cellpadding="4"><tr>';
        $colcount = 0;
        foreach($albumlist as $album) {
            print '<td align="center">';
            $artname = md5($album->artist . " " . $album->name);
            // Do some album name munging to try and help us get things - Last.FM seems to work best with this combination
            // of things removed from album names, at least with my collection.
            $b = munge_album_name($album->name);
            print '<a href="#" onclick="doGoogleSearch(\''.rawurlencode($artist).'\', \''.rawurlencode($b).'\', \''.$artname.'\')">';
            $class = "";
            $src = 'albumart/original/'.$artname.'.jpg';
            if (!file_exists("albumart/original/".$artname.".jpg")) {
               $class = "notexist";
               $src = "images/album-unknown.png";
               $albums_without_cover++;
            }
            print '<img class="'.$class.'" romprartist="'.rawurlencode($album->artist).'" rompralbum="'.rawurlencode($b).'"';
            if ($album->musicbrainz_albumid) {
                print ' rompralbumid="'.$album->musicbrainz_albumid.'"';
            }
            print ' name="'.$artname.'" style="vertical-align:middle" height="82px" width="82px" src="'.$src.'">';

            print '</a>';
            array_push($albumnames, $album->name);
            print '</td>';
            $colcount++;
            if ($colcount == 7) {
                print "</tr><tr>\n";
                foreach($albumnames as $key => $value) {
                    print '<td align="center">'.$value."</td>";
                }
                print "</tr><tr>";
                $colcount = 0;
                $albumnames = array();
            }
            $count++;
        }
        while ($colcount < 7) {
            print "<td></td>";
            $colcount++;
        }
        print "</tr><tr>\n";
        foreach($albumnames as $key => $value) {
            print '<td align="center">'.$value."</td>";
        }

        print "</tr>\n";
        print "</table>\n";
        print "</div>\n";
    }
}

function do_radio_stations($covers) {

    global $count;
    global $albums_without_cover;
    $playlists = glob("prefs/USERSTREAM*.xspf");
    if (count($playlists) > 0) {
        print '<div id="albumsection">';
        print '<h2>Radio Stations</h2>';
        print "</div>\n";
        print '<div id="artistinfo">';
        $albumnames = array();
        print '<table align="center" cellpadding="4"><tr>';
        $colcount = 0;

        foreach ($playlists as $i => $file) {
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
                    print '<td align="center">';
                    print '<a href="#" onclick="doGoogleSearch(\'Internet%20Radio\', \''.rawurlencode($track->album).'\', \''.$artname.'\')">';
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
                    array_push($albumnames, $track->album);
                    print '<img class="'.$class.'" romprartist="Internet%20Radio" rompralbum="'.rawurlencode($track->album).'" romprstream="'.$file.'" name="'.$artname.'" style="vertical-align:middle" height="94" src="'.$src.'">';
                    print '</a>';
                    print '</td>';
                    $colcount++;
                    if ($colcount == 7) {
                        print "</tr><tr>\n";
                        foreach($albumnames as $key => $value) {
                            print '<td align="center">'.$value."</td>";
                        }
                        print "</tr><tr>";
                        $colcount = 0;
                        $albumnames = array();
                    }
                    $count++;
                    break;
                }
            }
        }

        while ($colcount < 7) {
            print "<td></td>";
            $colcount++;
        }
        print "</tr><tr>\n";
        foreach($albumnames as $key => $value) {
            print '<td align="center">'.$value."</td>";
        }

        print "</tr>\n";
        print "</table>\n";
        print "</div>\n";
    }
}