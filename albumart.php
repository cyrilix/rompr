<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/sql/backend.php");
if ($prefs['player_backend'] == "mpd") {
    include("player/mpd/connection.php");
}
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
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="stylesheet" type="text/css" href="css/albumart.css" />
<link rel="stylesheet" type="text/css" href="skins/desktop/skin.css" />
<link rel="stylesheet" id="theme" type="text/css" />
<link rel="stylesheet" id="fontsize" type="text/css" />
<link rel="stylesheet" id="fontfamily" type="text/css" />
<link rel="stylesheet" id="icontheme-theme" type="text/css" />
<link rel="stylesheet" id="icontheme-adjustments" type="text/css" />
<link type="text/css" href="css/jquery.mCustomScrollbar.css" rel="stylesheet" />
<script type="text/javascript" src="jquery/jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="jquery/jquery.mCustomScrollbar.concat.min.js"></script>
<script type="text/javascript" src="skins/desktop/skin.js"></script>
<script type="text/javascript" src="ui/functions.js"></script>
<script type="text/javascript" src="ui/uifunctions.js"></script>
<script type="text/javascript" src="ui/debug.js"></script>
<script type="text/javascript" src="ui/coverscraper.js"></script>
<?php
$skin = "desktop";
include ("includes/globals.php");
?>
<script language="JavaScript">

var imagekey = '';
var imgobj = null;
var running = false;
var clickindex = null;
var wobblebottom;
var searchcontent;
var localimages;
var allshown = true;
var firefoxcrapnesshack = 0;
var stream = "";
var theCatSatOnTheMat = null;
var progress = null;
var googleSearchURL = "https://www.googleapis.com/customsearch/v1?key=AIzaSyDAErKEr1g1J3yqHA0x6Ckr5jubNIF2YX4&cx=013407992060439718401:d3vpz2xaljs&searchType=image&alt=json";

function getNewAlbumArt(div) {

    debug.group("ALBUMART","Getting art in",div);
    $.each($(div).find("img").filter(filterImages), function () {
            var a = this.getAttribute('name');
            covergetter.GetNewAlbumArt(a);
        }
    );
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

function reset() {
    covergetter.reset(-1);
    debug.groupend();
}

// I like badgers

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
    progress.setProgress(0);
    debug.groupend();
}

function onWobblebottomClicked(event) {

    var clickedElement = findClickableElement(event);
    if (clickedElement.hasClass("clickalbumcover")) {
        event.stopImmediatePropagation();
        imageEditor.show(clickedElement);
    }
    if (clickedElement.hasClass('clickselectartist')) {
        event.stopImmediatePropagation();
        var a = clickedElement.attr("id");
        $(".clickselectartist").filter('.selected').removeClass('selected');
        clickedElement.addClass('selected');
        if (a == "allartists") {
            $(".cheesegrater").show();
            if (!allshown) {
                boogerbenson();
                boogerbenson();
            }
        } else {
            $(".cheesegrater").filter('[name!="'+a+'"]').hide();
            $('[name="'+a+'"]').show();
        }
        joinEmTogether(allshown);
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

// It's not raining

function boogerbenson() {
    if (allshown) {
        $("img", "#wobblebottom").filter( onlywithcovers ).parent().parent().hide();
        $("#finklestein").html(language.gettext("albumart_showall"));
        $(".albumsection").filter( emptysections ).hide();
        $(".bigholder").filter( emptysections2 ).hide();
        joinEmTogether(false);
    } else {
        $(".bigholder").show();
        $(".albumsection").show();
        $("img", "#wobblebottom").parent().parent().show();
        $("#finklestein").html(language.gettext("albumart_onlyempty"));
        joinEmTogether(true);
    }
    allshown = !allshown;
}

function onlywithcovers() {
    if ($(this).hasClass('notexist') || $(this).hasClass('notfound')) {
        return false;
    }
    if ($(this).prop("naturalHeight") === 0 && $(this).prop("naturalWidth") === 0) {
        return false;
    }
    return true;
}

// This comment is useless

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

function joinEmTogether(flag) {
    var maxinarow = Math.round($("#coverslist").width() / 136);
    imageEditor.save();
    var container = 0;
    $(".covercontainer").addClass("getridofit");
    $(".bigholder").each(function() {
        var holder = this;
        var count = maxinarow;
        $(this).find(".closet").each( function() {
            if (count == maxinarow) {
                count = 0;
                h = $('<div>', {class: "containerbox covercontainer", id: "covers"+container}).appendTo($(holder));
            }
            container++;
            $(this).appendTo(h);
            if (flag || !$(this).is(':hidden')) {
                count++;
            }
        });

    });

    $(".getridofit").remove();
    // Annoyingly, javascript permits you to bind the same event multiple times,
    // so we have to unbind it before we rebind it. Duh.
    $('.droppable').unbind('dragenter');
    $('.droppable').unbind('dragover');
    $('.droppable').unbind('dragleave');
    $('.droppable').unbind('drop');
    $('.droppable').on('dragenter', dragEnter);
    $('.droppable').on('dragover', dragOver);
    $('.droppable').on('dragleave', dragLeave);
    $('.droppable').on('drop', handleDrop);
    imageEditor.putback();
}

function removeUnusedFiles() {
    $("#unusedimages").empty();
    doSomethingUseful($("#unusedimages"), language.gettext("albumart_deleting"));
    $.ajax({
        type: "GET",
        url: "albumart.php?cleanup",
        success: function(data) {
            window.location="albumart.php";
        },
        error: function(data) {
            alert(language.gettext("albumart_error"));
        }
    });
}

function filterImages() {
    if ($(this).hasClass("notexist") || $(this).hasClass("notfound")) {
        return true;
    } else {
        if ($(this).prop("naturalHeight") === 0 && $(this).prop("naturalWidth") === 0) {
            return true;
        }
    }
    return false;
}

$(document).ready(function () {

    debug.log("ALBUMART","Document is ready");
    covergetter = new coverScraper(1, true, true, true);
    $("#fontsize").attr({href: "sizes/"+prefs.fontsize});
    $("#fontfamily").attr({href: "fonts/"+prefs.fontfamily});
    progress = new progressBar('progress', 'horizontal');
    $(window).bind('resize', wobbleMyBottom );
    $("#harold").click( start );
    $("#finklestein").click( boogerbenson );
    wobblebottom = $('#wobblebottom');
    wobbleMyBottom();
    $('#artistcoverslist').mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 80,
        advanced: {
            updateOnContentResize: true,
            autoScrollOnFocus: false
        },
    });
    $('#coverslist').mCustomScrollbar({
        theme: "light-thick",
        scrollInertia: 80,
        advanced: {
            updateOnContentResize: true,
            autoScrollOnFocus: false
        },
    });
    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
    }, false);
    wobblebottom.click(onWobblebottomClicked);
});

$(window).load(function () {
    debug.log("ALBUMART","Document has loaded");
    var count = 0;
    $.each($(document).find("img").filter(filterImages), function() {
        count++;
        $(this).addClass("notexist");
    });
    $("#totaltext").html(numcovers+" "+language.gettext("label_albums"));
    covergetter.reset(albums_without_cover);
    covergetter.updateInfo(albums_without_cover - count);
    $("#status").html(language.gettext("albumart_instructions"));
});

function dragEnter(ev) {
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    $(ev.target).parent().addClass("highlighted");
    return false;
}

function dragOver(ev) {
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    return false;
}

function dragLeave(ev) {
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    $(ev.target).parent().removeClass("highlighted");
    return false;
}

function handleDrop(ev) {
    debug.group("ALBUMART","Dropped",ev);
    evt = ev.originalEvent;
    evt.stopPropagation();
    evt.preventDefault();
    $(ev.target).parent().removeClass("highlighted");
    imageEditor.update($(ev.target));
    imgobj = $(ev.target);
    imagekey = imgobj.attr("name");
    stream = imgobj.attr("stream");
    clickindex = null;

    if (evt.dataTransfer.types) {
        for (var i in evt.dataTransfer.types) {
            type = evt.dataTransfer.types[i];
            debug.log("ALBUMART","Checking...",type);
            var data = evt.dataTransfer.getData(type);
            switch (type) {

                case "text/html":       // Image dragged from another browser window (Chrome and Firefox)
                    var srces = data.match(/src\s*=\s*"(.*?)"/);
                    if (srces && srces[1]) {
                        src = srces[1];
                        debug.log("ALBUMART","Image Source",src);
                        imgobj.removeClass('nospin notexist notfound').addClass('spinner notexist');
                        if (src.match(/image\/.*;base64/)) {
                            debug.log("ALBUMART","Looks like Base64");
                            // For some reason I no longer care about, doing this with jQuery.post doesn't work
                            var formData = new FormData();
                            formData.append('base64data', src);
                            formData.append('key', imagekey);
                            var xhr = new XMLHttpRequest();
                            xhr.open('POST', 'getalbumcover.php');
                            xhr.responseType = "json";
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    uploadComplete(xhr.response);
                                } else {
                                    searchFail();
                                }
                            };
                            xhr.send(formData);
                        } else {
                            $.ajax({
                                url: "getalbumcover.php",
                                type: "POST",
                                data: { key: imagekey,
                                        src: src
                                },
                                cache:false,
                                success: uploadComplete,
                                error: searchFail,
                            });
                        }
                        return false;
                    }
                    break;

                case "Files":       // Local file upload
                    debug.log("ALBUMART","Found Files");
                    var files = evt.dataTransfer.files;
                    if (files[0]) {
                        imgobj.removeClass('nospin notexist notfound').addClass('spinner notexist');
                        // For some reason I no longer care about, doing this with jQuery.post doesn't work
                        var formData = new FormData();
                        formData.append('ufile', files[0]);
                        formData.append('key', imagekey);
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', 'getalbumcover.php');
                        xhr.responseType = "json";
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                uploadComplete(xhr.response);
                            } else {
                                searchFail();
                            }
                        };
                        xhr.send(formData);
                        return false;
                    }
                    break;
            }

        }
    }
    // IF we get here, we didn't find anything. Let's try the basic text,
    // which might give us something if we're lucky.
    // Safari returns a plethora of MIME types, but none seem to be useful.
    var data = evt.dataTransfer.getData('Text');
    var src = data;
    debug.log("ALBUMART","Trying last resort methods",src);
    if (src.match(/^http:\/\//)) {
        debug.log("ALBUMART","Appears to be a URL");
        var u = src.match(/images.google.com.*imgurl=(.*?)&/)
        if (u && u[1]) {
            src = u[1];
            debug.log("ALBUMART","Found possible Google Image Result",src);
        }
        $.ajax({
            url: "getalbumcover.php",
            type: "POST",
            data: { key: imagekey,
                    src: src
            },
            cache:false,
            success: uploadComplete,
            error: searchFail,
        });
    }
    return false;
}

var imageEditor = function() {

    var start = 1;
    var position = null;
    var bigdiv = null;
    var bigimg = new Image();
    var savedstate = ({pos: null, window: null});
    var current = "g";
    bigimg.onload = function() {
        imageEditor.displayBigImage();
    }

    return {

        show: function(where) {
            newpos = where.parent().parent().parent();
            if (position === null || newpos.attr("id") != position.attr("id")) {
                debug.log("IMAGEEDITOR","Parent position has moved");
                imageEditor.close();
                position = newpos;
                bigdiv = $('<div>', {id: "imageeditor", class: "containerbox"}).insertAfter(position);
                bigdiv.bind('click', imageEditor.onGoogleSearchClicked);
                start = 1;
            }
            if (savedstate.pos === null || where.attr("name") != savedstate.pos.attr("name")) {
                start = 1;
                debug.log("IMAGEEDITOR","Rebuilding due to changed image");
                if (savedstate.pos) {
                    savedstate.pos.parent().parent().removeClass('highlighted');
                    $("#fiddler").remove();
                }
                savedstate.pos = where;
                where.parent().parent().addClass('highlighted');
                where.parent().parent().append($('<div>', {id: 'fiddler'}));
                imageEditor.fiddlerOnTheRoof(where);

                bigimg.src = "";
                bigdiv.empty();
                imgobj = where;
                imagekey = imgobj.attr('name');
                stream = imgobj.attr('romprstream');
                var phrase =  decodeURIComponent(where.prev('input').val());
                var path =  where.prev('input').prev('input').val();

                bigdiv.append($('<div>', { id: "searchcontent" }));
                bigdiv.append($('<div>', { id: "origimage"}));

                $("#searchcontent").append( $('<div>', {id: "editcontrols", class: "fullwidth holdingcell"}),
                                            $('<div>', {id: "gsearch", class: "noddy fullwidth holdingcell invisible"}),
                                            $('<div>', {id: "fsearch", class: "noddy fullwidth holdingcell invisible"}),
                                            $('<div>', {id: "usearch", class: "noddy fullwidth holdingcell invisible"}));

                $("#"+current+"search").removeClass("invisible");

                $("#gsearch").append(       $('<div>', {id: "brian", class: "fullwidth holdingcell"}),
                                            $('<div>', {id: "searchresultsholder", class: "fullwidth holdingcell"}));

                $("#searchresultsholder").append($('<div>', {id: "searchresults", class: "fullwidth holdingcell"}));

                var uform =                 $('<form>', { id: 'uform', action: 'getalbumcover.php', method: 'post', enctype: 'multipart/form-data' }).appendTo($("#usearch"));
                var fdiv =                  $('<div>', {class: "containerbox dropdown-container"}).appendTo(uform);
                fdiv.append(                $('<input>', { id: 'imagekey', type: 'hidden', name: 'key', value: '' }),
                                            $('<input>', { type: 'button', class: 'fixed', value: language.gettext("albumart_uploadbutton"), style: 'width:8em', onclick: "imageEditor.uploadFile()" }),
                                            $('<input>', { name: 'ufile', type: 'file', size: '80', class: 'expand inbrowser', style: "margin-left:8px" }));
                $("#usearch").append(      '<div class="holdingcell"><p>'+language.gettext("albumart_dragdrop")+'</p></div>');

                $("#editcontrols").append(  '<div id="g" class="tleft bleft clickable bmenu">'+language.gettext("albumart_googlesearch")+'</div>'+
                                            '<div id="f" class="tleft bleft bmid clickable bmenu">'+language.gettext("albumart_local")+'</div>'+
                                            '<div id="u" class="tleft bleft bmid clickable bmenu">'+language.gettext("albumart_upload")+'</div>'+
                                            '<div class="tleft bleft bmid clickable"><a href="http://www.google.com/search?q='+phrase+'&hl=en&site=imghp&tbm=isch" target="_blank">'+language.gettext("albumart_newtab")+'</a></div>');

                $("#editcontrols").append(  $('<i>', { class: "icon-cancel-circled smallicon tright clickicon", onclick: "imageEditor.close()"}));

                $("#"+current).addClass("bsel");

                $("#brian").append('<div class="containerbox"><div class="expand"><input type="text" id="searchphrase" /></div><button class="fixed" onclick="imageEditor.research()">Search</button></div>');

                $("#searchphrase").val(phrase);

                var bigsauce = imgobj.attr("src");
                var m = bigsauce.match(/albumart\/small\/(.*)/);
                if (m && m[1]) {
                    bigsauce = 'albumart/asdownloaded/'+m[1];
                }
                bigimg.src = bigsauce;

                imageEditor.search();
                if (path) {
                    $.getJSON("utils/findLocalImages.php?path="+path, imageEditor.gotLocalImages)
                }

                $("#imagekey").attr("value", imagekey);
                $('#searchphrase').keyup(imageEditor.bumblefuck);
            }
        },

        update: function(where) {
            if (bigdiv) {
                imageEditor.show(where);
            }
        },

        close: function() {
            if (bigdiv) {
                bigdiv.remove();
                bigdiv = null;
            }
            if (savedstate.pos) {
                savedstate.pos.parent().parent().removeClass('highlighted');
                $("#fiddler").remove();
            }
            position = null;
            savedstate.pos = null;
        },

        save: function() {
            if (bigdiv) {
                savedstate.window = bigdiv.detach();
            }
        },

        putback: function() {
            if (savedstate.pos) {
                position = savedstate.pos.parent().parent().parent();
                bigdiv = savedstate.window;
                bigdiv.insertAfter(position);
                imageEditor.fiddlerOnTheRoof(savedstate.pos);
            }
        },

        fiddlerOnTheRoof: function(here) {
            var to = here.parent().next().offset();
            var bo = bigdiv.offset();
            var fiddleheight = bo.top - (to.top + here.parent().next().height()) - 4;

            $("#fiddler").css("height", fiddleheight+"px");
            if ($("body").css('background-image') != "none") {
                $("#fiddler").css("background-image", $("body").css('background-image'));
            } else {
                $("#fiddler").css("background-color", $("body").css('background-color'));
            }
        },

        displayBigImage: function() {
            if (bigdiv) {
                var h = bigimg.height;
                if (h > 468) {
                    h = 468;
                }
                w = Math.round(bigimg.width * (h/bigimg.height));
                if (w > $("#coverslist").width() - 320) {
                    w = $("#coverslist").width() - 340;
                    h = Math.round(bigimg.height * (w/bigimg.width));
                }

                $("#origimage").empty().append($("<img>", { src: bigimg.src, height: h, width: w, id: 'browns' }));
            }
        },

        research: function() {
            $("#searchresults").empty();
            start = 1;
            imageEditor.search();
        },

        search: function() {
            var searchfor = $("#searchphrase").attr("value");
            debug.log("IMAGEEDITOR","Searching Google for", searchfor);
            $.ajax({
                dataType: "json",
                url: googleSearchURL+"&q="+encodeURIComponent(searchfor)+"&start="+start,
                success: imageEditor.googleSearchComplete,
                error: function(data) {
                    debug.log("IMAGEEDITOR","FUCKING RAT'S COCKS",data);
                    imageEditor.showError($.parseJSON(data.responseText).error.message);
                }
            });

        },

        googleSearchComplete: function(data) {
            debug.log("IMAGEEDITOR","Google Search Results", data);
            $("#morebutton").remove();
            if (data.queries.nextPage) {
                start = data.queries.nextPage[0].startIndex;
            } else {
                start = 1;
            }
            $.each(data.items, function(i,v){
                var index = start+i;
                $("#searchresults").append($('<img>', {
                    id: 'img'+index,
                    class: "gimage clickable clickicon clickgimage",
                    src: v.image.thumbnailLink
                }));
                $("#searchresults").append($('<input>', {
                    type: 'hidden',
                    value: v.link,
                }));
                $("#searchresults").append($('<input>', {
                    type: 'hidden',
                    value: index,
                }));

            });
            $(".gimage").css("height", "120px");
            $("#searchresultsholder").append('<div id="morebutton" class="gradbutton bigbutton" onclick="imageEditor.search()"><b>'+language.gettext("albumart_showmore")+'</b></div>');

        },

        onGoogleSearchClicked: function(event) {
            var clickedElement = findClickableElement(event);
            if (clickedElement.hasClass("clickgimage")) {
                debug.group("ALBUMART","Search Result clicked :",clickedElement.next().val(), clickedElement.next().next().val());
                event.stopImmediatePropagation();
                updateImage(clickedElement.next().val(), clickedElement.next().next().val());
            } else if (clickedElement.hasClass("bmenu")) {
                var menu = clickedElement.attr("id");
                $(".noddy").filter(':visible').fadeOut('fast', function() {
                    $("#"+menu+"search").fadeIn('fast');
                });
                $(".bleft").removeClass('bsel');
                clickedElement.addClass('bsel');
                current = menu;
            }
        },

        updateBigImg: function(url) {
            if (typeof url == "string") {
                $("#browns").removeClass("notfound notexist");
                bigimg.src = "";
                bigimg.src = url;
            } else {
                $("#browns").removeClass("notfound notexist");
                if (url || bigimg.src == "") $("#browns").addClass('notfound');
            }
        },

        showError: function(message) {
            $("#morebutton").remove();
            $("#searchresults").append('<div id="morebutton" class="gradbutton"><b>'+language.gettext("albumart_googleproblem")+' "'+message+'"</b></div>');
        },

        gotLocalImages: function(data) {
            debug.log("ALBUMART","Retreived Local Images: ",data);
            if (data && data.length > 0) {
                $.each(data, function(i,v) {
                    debug.log("ALBUMART","Local Image ",i, v);
                    $("#fsearch").append($("<img>", {
                                                        id: "img"+(i+100000).toString(),
                                                        class: "gimage clickable clickicon clickgimage" ,
                                                        src: v
                                                    })
                                        );
                    $("#fsearch").append($('<input>', {
                        type: 'hidden',
                        value: v,
                    }));
                    $("#fsearch").append($('<input>', {
                        type: 'hidden',
                        value: i+100000,
                    }));
                });
                $(".gimage").css("height", "120px");
            }
        },

        bumblefuck: function(e) {
            if (e.keyCode == 13) {
                imageEditor.research();
            }
        },

        uploadFile: function() {
            imgobj.removeClass('notfound notexist').addClass('notfound');
            imageEditor.updateBigImg(true);
            startAnimation();
            var formElement = document.getElementById("uform");
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "getalbumcover.php");
            xhr.responseType = "json";
            xhr.onload = function () {
                if (xhr.status === 200) {
                    uploadComplete(xhr.response);
                } else {
                    searchFail();
                }
            };
            xhr.send(new FormData(formElement));
        }

    }

}();

function wobbleMyBottom() {
    clearTimeout(theCatSatOnTheMat);
    var ws = getWindowSize();
    var newheight = ws.y - wobblebottom.offset().top;
    wobblebottom.css("height", newheight.toString()+"px");
    theCatSatOnTheMat = setTimeout( function() {
        joinEmTogether(allshown);
    }, 500);
}

// Ceci n'est pas une commentaire

function updateImage(url, index) {
    clickindex = index;
    imgobj.removeClass('notfound notexist').addClass('notfound');
    imageEditor.updateBigImg(true);
    startAnimation();
    var options = { key: imagekey,
                    src: url,
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

function startAnimation() {
    imgobj.removeClass('nospin').addClass('spinner');
}

function animationStop() {
    imgobj.removeClass('spinner').addClass('nospin');
}

function searchFail() {
    debug.log("ALBUMART","No Source Found");
    $('#img'+clickindex).attr('src', 'newimages/imgnotfound.svg');
    imgobj.removeClass('notfound notexist');
    if (imgobj.attr("src") == "") imgobj.addClass('notexist');
    imageEditor.updateBigImg(false);
    animationStop();
    debug.groupend();
}

function uploadComplete(data) {
    debug.log("ALBUMART","Upload Complete");
    if (!data.url || data.url == "") {
        searchFail();
        return;
    }
    animationStop();
    debug.log("ALBUMART","Success for",imagekey);
    if (imgobj.attr("src") == "") {
        covergetter.updateInfo(1);
    }
    imgobj.removeClass("notexist notfound");
    firefoxcrapnesshack++;

    imgobj.attr('src', "");
    imgobj.attr('src', "albumart/small/firefoxiscrap/"+imagekey+"---"+firefoxcrapnesshack.toString());

    debug.log("ALBUMART","Returned big sauce ",data.origimage);
    if (data.origimage) {
        imageEditor.updateBigImg("albumart/asdownloaded/firefoxiscrap/"+imagekey+"---"+firefoxcrapnesshack.toString());
    }

    sendLocalStorageEvent(imagekey);
    debug.groupend();
}


</script>
</head>
<body>

<div class="albumcovers">
<div class="infosection">
<table width="100%">
<?php
print '<tr><td colspan="3"><h2>'.get_int_text("albumart_title").'</h2></td></tr>';
print '<tr><td class="outer" id="totaltext"></td><td><div class="invisible" id="progress"></div></td><td class="outer" align="right"><button id="harold">'.get_int_text("albumart_getmissing").'</button></td></tr>';
print '<tr><td class="outer" id="infotext"></td><td align="center"><div class="inner" id="status">Loading...</div></td><td class="outer" align="right"><button id="finklestein">'.
        get_int_text("albumart_onlyempty").'</button></td></tr>';
?>
</table>
</div>
</div>
<div id="wobblebottom">

<div id="artistcoverslist" class="tleft noborder">
    <div class="noselection fullwidth">
<?php
if ($mysqlc || file_exists(ROMPR_XML_COLLECTION)) {
    print '<div class="containerbox menuitem clickable clickselectartist selected" id="allartists"><div class="expand" class="artistrow">'.get_int_text("albumart_allartists").'</div></div>';
    if ($prefs['player_backend'] == "mpd") {
        print '<div class="containerbox menuitem clickable clickselectartist" id="playlist"><div class="expand" class="artistrow">Saved Playlists</div></div>';
    }
    print '<div class="containerbox menuitem clickable clickselectartist" id="radio"><div class="expand" class="artistrow">'.get_int_text("label_yourradio").'</div></div>';
    print '<div class="containerbox menuitem clickable clickselectartist" id="unused"><div class="expand" class="artistrow">'.get_int_text("albumart_unused").'</div></div>';
    if ($mysqlc) {
        do_artists_db_style();
    } else {
        do_artists_xml_style();
    }
}
?>
    </div>
</div>
<div id="coverslist" class="tleft noborder">

<?php

// Do Local Albums

$allfiles = glob("albumart/small/*.jpg");
debug_print("There are ".count($allfiles)." Images", "ALBUMART");

$count = 0;
$albums_without_cover = 0;
if ($mysqlc) {
    do_covers_db_style();
} else if (file_exists(ROMPR_XML_COLLECTION)) {
    do_covers_xml_style();
} else {
    print '<h3>'.get_int_text("albumart_nocollection").'<h3>';
}

if ($prefs['player_backend'] == "mpd") {
    do_playlists();
}

do_radio_stations();

if (file_exists('prefs/w_list.xml')) {
    do_wishlist_covers();
}

debug_print("There are ".count($allfiles)." unused images", "ALBUMART");
if (count($allfiles) > 0) {
    if (array_key_exists("cleanup", $_REQUEST)) {
        remove_unused_images();
    } else {
        do_unused_images();
    }
}

print '</div>';

print "</div>\n";
print "</div>\n";
print '<script language="JavaScript">'."\n";
print 'var numcovers = '.$count.";\n";
print 'var albums_without_cover = '.$albums_without_cover.";\n";
print "</script>\n";
print "</body>\n";
print "</html>\n";

function do_artists_xml_style() {
    $acount = 0;
    $collection = simplexml_load_file(ROMPR_XML_COLLECTION);
    foreach($collection->artists->artist as $artist) {
        print '<div class="containerbox menuitem clickable clickselectartist';
        print '" id="artistname'.$acount.'">';
        print '<div class="expand" class="artistrow">'.$artist->name.'</div>';
        print '</div>';
        $acount++;
    }
}

function do_artists_db_style() {
    $alist = get_list_of_artists();
    foreach ($alist as $artist) {
        print '<div class="containerbox menuitem clickable clickselectartist';
        print '" id="artistname'.$artist['Artistindex'].'">';
        print '<div class="expand" class="artistrow">'.$artist['Artistname'].'</div>';
        print '</div>';
    }
}

function do_covers_xml_style() {
    global $count;
    global $albums_without_cover;
    global $allfiles;
    $collection = simplexml_load_file(ROMPR_XML_COLLECTION);
    $acount = 0;
    foreach($collection->artists->artist as $artist) {
        print '<div class="cheesegrater" name="artistname'.$acount.'">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2>'.$artist->name.'</h2></div><div class="tright rightpad"><button onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        print '<div class="containerbox covercontainer" id="covers'.$count.'">';
        $colcount = 0;
        foreach ($artist->albums->album as $album) {
            print '<div class="expand containerbox vertical albumimg closet">';
            print '<div class="albumimg fixed">';

            $class = "clickable clickicon clickalbumcover droppable";
            $src = "";
            if ($album->image->exists == "no") {
                $class = $class . " notexist";
                $albums_without_cover++;
            } else {
                $src = $album->image->src;
                if (dirname($src) == "albumart/small") {
                    if(($key = array_search($src, $allfiles)) !== false) {
                        unset($allfiles[$key]);
                    }
                }
            }
            print '<input type="hidden" value="'.$album->directory.'" />';
            print '<input type="hidden" value="'.rawurlencode($artist->name." ".munge_album_name($album->name)).'" />';
            print '<img class="'.$class.'" name="'.$album->image->name.'" height="82px" width="82px" src="'.$src.'" />';

            print '</div>';
            print '<div class="albumimg fixed"><table><tr><td align="center">'.$album->name.'</td></tr></table></div>';
            print '</div>';

            $colcount++;
            if ($colcount == 8) {
                print "</div>\n".'<div class="containerbox covercontainer">';
                $colcount = 0;
            }
            $count++;
        }
        print "</div></div></div>\n";
        $acount++;
    }
}

function do_wishlist_covers() {
    global $count;
    global $albums_without_cover;
    global $allfiles;
    $collection = simplexml_load_file('prefs/w_list.xml');
    $acount = $count;
    print '<div class="albumsection crackbaby" style="margin-bottom:8px" name="wishlist">';
    print '<h2 align="center">Items In Wishlist</h2>';
    print '</div>';
    foreach($collection->artists->artist as $artist) {
        print '<div class="cheesegrater" name="artistname'.$acount.'">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2>'.$artist->name.'</h2></div><div class="tright rightpad"><button onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        print '<div class="containerbox covercontainer" id="covers'.$count.'">';
        $colcount = 0;
        foreach ($artist->albums->album as $album) {
            print '<div class="expand containerbox vertical albumimg closet">';
            print '<div class="albumimg fixed">';

            $class = "clickable clickicon clickalbumcover droppable";
            $src = "";
            if ($album->image->exists == "no") {
                $class = $class . " notexist";
                $albums_without_cover++;
            } else {
                $src = $album->image->src;
                if (dirname($src) == "albumart/small") {
                    if(($key = array_search($src, $allfiles)) !== false) {
                        unset($allfiles[$key]);
                    }
                }
            }
            print '<input type="hidden" value="'.$album->directory.'" />';
            print '<input type="hidden" value="'.rawurlencode($artist->name." ".munge_album_name($album->name)).'" />';
            print '<img class="'.$class.'" name="'.$album->image->name.'" height="82px" width="82px" src="'.$src.'" />';

            print '</div>';
            print '<div class="albumimg fixed"><table><tr><td align="center">'.$album->name.'</td></tr></table></div>';
            print '</div>';

            $colcount++;
            if ($colcount == 8) {
                print "</div>\n".'<div class="containerbox covercontainer">';
                $colcount = 0;
            }
            $count++;
        }
        print "</div></div></div>\n";
        $acount++;
    }

}

function do_covers_db_style() {
    global $count;
    global $albums_without_cover;
    global $allfiles;
    $alist = get_list_of_artists();
    foreach ($alist as $artist) {
        print '<div class="cheesegrater" name="artistname'.$artist['Artistindex'].'">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2>'.$artist['Artistname'].'</h2></div><div class="tright rightpad"><button onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        print '<div class="containerbox covercontainer" id="covers'.$count.'">';
        $colcount = 0;
        $blist = get_list_of_albums($artist['Artistindex']);
        foreach ($blist as $album) {
            print '<div class="expand containerbox vertical albumimg closet">';
            print '<div class="albumimg fixed">';

            $class = "clickable clickicon clickalbumcover droppable";
            $src = "";
            if ($album['Image'] && $album['Image'] !== "") {
                $src = $album['Image'];
                if(($key = array_search($src, $allfiles)) !== false) {
                    unset($allfiles[$key]);
                }
            } else {
                $class = $class . " notexist";
                $albums_without_cover++;
            }
            print '<input type="hidden" value="'.get_album_directory($album['Albumindex'], $album['Spotilink']).'" />';
            print '<input type="hidden" value="'.rawurlencode($artist['Artistname']." ".munge_album_name($album['Albumname'])).'" />';
            print '<img class="'.$class.'" name="'.$album['ImgKey'].'" height="82px" width="82px" src="'.$src.'" />';

            print '</div>';
            print '<div class="albumimg fixed"><table><tr><td align="center">'.$album['Albumname'].'</td></tr></table></div>';
            print '</div>';

            $colcount++;
            if ($colcount == 8) {
                print "</div>\n".'<div class="containerbox covercontainer">';
                $colcount = 0;
            }
            $count++;
        }

        print "</div></div></div>\n";

    }
}

function do_radio_stations() {

    global $count;
    global $albums_without_cover;
    global $allfiles;

    $playlists = glob("prefs/USERSTREAM*.xspf");
    if (count($playlists) > 0) {
        print '<div class="cheesegrater" name="radio">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2>Radio Stations</h2></div><div class="tright rightpad"><button onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';

        print '<div class="containerbox covercontainer" id="radios">';
        $colcount = 0;
        foreach ($playlists as $i => $file) {
            print '<div class="expand containerbox vertical albumimg closet">';
            print '<div class="albumimg fixed">';
            $x = simplexml_load_file($file);
            foreach($x->trackList->track as $i => $track) {
                if ($track->album) {
                    $c = $track->creator;
                    if ($c == "" || $c == null) {
                        $c = "Radio";
                    }
                    $artname = md5($c." ".$track->album);
                    $class = "";
                    $src = "newimages/broadcast.svg";
                    if ($track->image) {
                        $src = preg_replace('/asdownloaded/', 'small', $track->image);
                        if(($key = array_search($src, $allfiles)) !== false) {
                            unset($allfiles[$key]);
                        }
                    } else {
                        $class = " notexist";
                        $albums_without_cover++;
                    }

                    print '<input type="hidden" value="'.$track->album.'" />';
                    print '<img class="clickable clickicon clickalbumcover droppable'.$class.'" romprstream="'.$file.'" name="'.$artname.'" height="82px" width="82px" src="'.$src.'" />';
                    print '</div>';
                    print '<div class="albumimg fixed"><table><tr><td align="center">'.$track->album.'</td></tr></table></div>';
                    print '</div>';

                    $colcount++;
                    if ($colcount == 8) {
                        print "</div>\n".'<div class="containerbox covercontainer">';
                        $colcount = 0;
                    }
                    $count++;
                    break;
                }
            }
        }
        print "</div></div></div>\n";
    }

}

function do_playlists() {

    global $connection;
    global $count;
    global $albums_without_cover;
    global $allfiles;
    
    $playlists = do_mpd_command($connection, "listplaylists", null, true);
    if (!is_array($playlists)) {
        $playlists = array();
    } else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
        $temp = $playlists['playlist'];
        $playlists = array();
        $playlists['playlist'][0] = $temp;
    }
    $plfiles = glob('prefs/userplaylists/*');
    foreach ($plfiles as $f) {
        $playlists['playlist'][] = basename($f);
    }
    if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
        print '<div class="cheesegrater" name="playlist">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2>Saved Playlists</h2></div><div class="tright rightpad"><button onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
        print "</div>\n";
        print '<div id="album'.$count.'" class="fullwidth bigholder">';
        print '<div class="containerbox covercontainer" id="playlists">';
        sort($playlists['playlist'], SORT_STRING);
        $colcount = 0;
        foreach ($playlists['playlist'] as $pl) {
            print '<div class="expand containerbox vertical albumimg closet">';
            print '<div class="albumimg fixed">';
            $class = "";
            $artname = md5("Playlist ".$pl);
            $src = "newimages/playlist.svg";
            if (file_exists('albumart/small/'.$artname.'.jpg')) {
                $src = 'albumart/small/'.$artname.'.jpg';
                if(($key = array_search($src, $allfiles)) !== false) {
                    unset($allfiles[$key]);
                }
            } else {
                $class = " notexist";
                $albums_without_cover++;
            }

            print '<input type="hidden" value="'.$pl.'" />';
            print '<img class="clickable clickicon clickalbumcover droppable'.$class.'" name="'.$artname.'" height="82px" width="82px" src="'.$src.'" />';
            print '</div>';
            print '<div class="albumimg fixed"><table><tr><td align="center">'.$pl.'</td></tr></table></div>';
            print '</div>';

            $colcount++;
            if ($colcount == 8) {
                print "</div>\n".'<div class="containerbox covercontainer">';
                $colcount = 0;
            }
            $count++;
        }
        print "</div></div></div>\n";
    }

}

function do_unused_images() {
    global $allfiles;
    print '<div class="cheesegrater" name="unused">';
    print '<div class="albumsection crackbaby">';
    print '<div class="tleft"><h2>'.count($allfiles).' '.get_int_text("albumart_unused").'</h2></div><div class="tright rightpad"><button onclick="removeUnusedFiles()">'.get_int_text("albumart_deletethese").'</button></div>';
    print "</div>\n";
    print '<div id="unusedimages" class="fullwidth bigholder">';
    print '<div class="containerbox covercontainer">';
    $colcount = 0;
    foreach ($allfiles as $album) {
        print '<div class="expand containerbox vertical albumimg closet">';
        print '<div class="albumimg fixed">';
        print '<img height="82px" width="82px" src="'.$album.'">';
        print '</div>';
        print '</div>';

        $colcount++;
        if ($colcount == 7) {
            print "</div>\n".'<div class="containerbox covercontainer">';
            $colcount = 0;
        }
    }
    print "</div></div></div>\n";

}

function remove_unused_images() {
    global $allfiles;
    foreach($allfiles as $file) {
        if (file_exists($file)) {
            system('rm "'.$file.'"');
        }
        $file = "albumart/small/".basename($file);
        if (file_exists($file)) {
            system('rm "'.$file.'"');
        }
        $file = "albumart/asdownloaded/".basename($file);
        if (file_exists($file)) {
            system('rm "'.$file.'"');
        }
    }
}

?>
