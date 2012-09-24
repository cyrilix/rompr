<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
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
<script type="text/javascript" src="jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="jquery.form.js"></script>
<script type="text/javascript" src="jqueryui1.8.16/js/jquery-ui-1.8.23.custom.js"></script>
<script type="text/javascript" src="jquery.jsonp-2.3.1.min.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="ba-debug.js"></script>
<script src="https://www.google.com/jsapi?key=ABQIAAAAD8fM_RJ2TaPVvDsHb-8MdxS61EkEqhmzf3WQQFI0-v4LA4gElhRtzkt_mX1FPwUDz9DchkRCsKg3SA"></script>
<script language="JavaScript">
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";

$.fn.getValue = function() {
    return $(this).attr("value");
}

var formObjects = new Array();
var numAlbums;
google.load('search', '1');
var imageSearch;
var imagekey = '';
var input;
var windowScroll;
var timer;
var timer_running = false;

function getNewAlbumArt() {

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    $("form").each(function(i) {
        if ($(this).find("#flag").getValue() == 0) {
            formObjects.push(this);
        }
    });
    numAlbums = formObjects.length;
    doNextImage(100);

}

function doNextImage(timer) {
    var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
    $("#progress").progressbar("option", "value", parseInt(percent.toString()));
    if (formObjects.length > 0) {
        timer = setTimeout("processForm()", timer);
        timer_running = true;
    } else {
        $("#status").html("");
    }
}

function processForm() {

    if (timer_running) {
        clearTimeout(timer);
        timer_running = false;
    }
    var object = formObjects.shift();
    var artist = decodeURIComponent($(object).find("#artist").getValue());
    var album = decodeURIComponent($(object).find("#album").getValue());
    var flag = $(object).find("#flag").getValue();

    if (flag == 0) {
        $("#status").html("Getting "+album);

        var url = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album="+encodeURIComponent(album)+"&artist="+encodeURIComponent(artist)+"&autocorrect=1&api_key="+lastfm_api_key+"&format=json&callback=?";
        $.jsonp({url: url,
                success: function(data) {
                    var image = "";
                    if (data.album) {
                        $.each(data.album.image, function (index, value) {
                            var pic = "";
                            $.each(value, function (index, value) {
                                if (index == "#text") { pic = value; }
                                if (index == "size" && value == "large") { image = pic; }
                                if (image == "") { image = pic; }
                            });
                        });
                    }
                    if (image != "") {
                        key = $(object).attr("name");
                        $.get("getalbumcover.php", "key="+encodeURIComponent(key)+"&src="+encodeURIComponent(image), function () {
                            $(object).find("#albumimage").attr("src", "albumart/original/"+key+".jpg");
                            $(object).find("#flag").attr("value", "2");
                            albums_without_cover--;
                            updateInfo();
                            doNextImage(750);
                        });
                    } else {
                        doNextImage(800);
                    }
                },
                error: function() { doNextImage(1000); }
        });
    } else {
        doNextImage(100);
    }

}

$(document).ready(function () {
    $("#totaltext").html(numcovers+" albums");
    updateInfo();
    $("#progress").progressbar();
});

function updateInfo() {
    $("#infotext").html(albums_without_cover+" albums without a cover");
}

function doGoogleSearch(artist, album, key) {

    imagekey = key;
    windowScroll = getScrollXY();
    var googlePopup = popupWindow.create(700, 540, "googlepopup", false, "Choose Album Picture");

    $("#popupcontents").append('<div id="googleinput"></div>');
    $("#googleinput").append('<div name="g1" id="holdingcell"><h3>Upload A File</h3></div>');
    $('div[name="g1"]').append('<form id="uform" action="uploadcover.php" method="post" enctype="multipart/form-data"></form>');
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
    if($('form[name="'+key+'"]').find("#flag").getValue() == 0) {
        albums_without_cover--;
        updateInfo();
    }
    $('form[name="'+key+'"]').find("#albumimage").attr("src", "images/image-update.gif");
    var getstring = "key="+encodeURIComponent(key)+"&src="+encodeURIComponent(url);
    var stream = $('form[name="'+key+'"]').find("#stream").attr("value");
    debug.log("stream",stream);
    if (typeof(stream) != "undefined") {
        getstring = getstring + "&stream="+stream;
    }
    $.get("getalbumcover.php", getstring, function () {
        $('form[name="'+key+'"]').find("#albumimage").attr("src", "albumart/original/"+key+".jpg");
        $('form[name="'+key+'"]').find("#flag").attr("value", "2");
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
<button class="topformbutton" onclick="getNewAlbumArt()">Get Missing Covers</button>
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

// Do User Radio Stations

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
                if (file_exists("albumart/original/".$artname.".jpg")) {
                    if ($covers) {
                        break;
                    }
                    print '<td align="center">';
                    print '<form name="'.$artname.'" action="getalbumcover.php" method="post">';
                    print '<input id="flag" type="hidden" name="changed" value="2" />';
                } else {
                    print '<td align="center">';
                    print '<form name="'.$artname.'" action="getalbumcover.php" method="post">';
                    print '<input id="flag" type="hidden" name="changed" value="0" />';
                    $albums_without_cover++;
                }
                print '<input id="artist" type="hidden" name="artist" value="Internet Radio" />';
                print '<input id="stream" type="hidden" name="stream" value="'.rawurlencode($file).'" />';
                print '<input id="album" type="hidden" name="album" value="'.rawurlencode($track->album).'" />';
                print '<a href="#" onclick="doGoogleSearch(\'Internet Radio\', \''.rawurlencode($track->album).'\', \''.$artname.'\')">';
                if (file_exists("albumart/original/".$artname.".jpg")) {
                   print '<img id="albumimage" src="albumart/original/'.$artname.'.jpg" width="94" height="94" />';
                } else {
                   print '<img id="albumimage" src="images/broadcast.png" width="94"  height="94" />';
                }
                print '</a>';
                array_push($albumnames, $track->album);

                print '</form>';
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


function do_albumcovers($artistkey, $comps, $covers) {

    global $collection;
    global $count;
    global $albums_without_cover;

    $albumlist = $collection->getAlbumList($artistkey, $comps, $covers);

    if (count($albumlist) > 0) {
        $artist = $collection->artistName($artistkey);
        print '<div id="albumsection">';
        print '<h2>'.$artist.'</h2>';
        print "</div>\n";
        print '<div id="artistinfo">';
        $albumnames = array();
        print '<table align="center" cellpadding="4"><tr>';
        $colcount = 0;
        foreach($albumlist as $album) {
            print '<td align="center">';
            $artname = md5($album->artist . " " . $album->name);
            print '<form name="'.$artname.'" action="getalbumcover.php" method="post">';
            if (file_exists("albumart/original/".$artname.".jpg")) {
                print '<input id="flag" type="hidden" name="changed" value="2" />';
            } else {
                print '<input id="flag" type="hidden" name="changed" value="0" />';
                $albums_without_cover++;
            }
            // Do some album name munging to try and help us get things - Last.FM seems to work best with this combination
            // of things removed from album names, at least with my collection.
            $b = preg_replace('/\[.*?\]/', "", $album->name);       // Anything inside [  ]
            $b = preg_replace('/\(disc\s*\d+.*?\)/i', "", $b);      // (disc 1) or (disc 1 of 2) or (disc 1-2) etc
            $b = preg_replace('/\(*cd\s*\d+.*?\)*/i', "", $b);      // (cd 1) or (cd 1 of 2) etc
            $b = preg_replace('/\sdisc\s*\d+.*?$/i', "", $b);       //  disc 1 or disc 1 of 2 etc
            $b = preg_replace('/\scd\s*\d+.*?$/i', "", $b);         //  cd 1 or cd 1 of 2 etc
            $b = preg_replace('/\(\d+\s*of\s*\d+\)/i', "", $b);     // (1 of 2) or (1of2)
            $b = preg_replace('/\(\d+\s*-\s*\d+\)/i', "", $b);      // (1 - 2) or (1-2)
            $b = preg_replace('/\(Remastered\)/i', "", $b);         // (Remastered)
            $b = preg_replace('/\s+-\s*$/', "", $b);                // Chops any stray - off the end that could have been left by the previous
            print '<input id="artist" type="hidden" name="artist" value="'.rawurlencode($artist).'" />';
            print '<input id="album" type="hidden" name="album" value="'.rawurlencode($b).'" />';
            print '<a href="#" onclick="doGoogleSearch(\''.rawurlencode($artist).'\', \''.rawurlencode($album->name).'\', \''.$artname.'\')">';
            if (file_exists("albumart/original/".$artname.".jpg")) {
               print '<img id="albumimage" src="albumart/original/'.$artname.'.jpg" width="94" height="94" />';
            } else {
               print '<img id="albumimage" src="images/album-unknown.png" width="94"  height="94" />';
            }
            print '</a>';
            array_push($albumnames, $album->name);

            print '</form>';
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

print "</div>\n";
print "</div>\n";
print '<script language="JavaScript">'."\n";
print 'var numcovers = '.$count.";\n";
print 'var albums_without_cover = '.$albums_without_cover.";\n";
print "</script>\n";
print "</body>\n";
print "</html>\n";
