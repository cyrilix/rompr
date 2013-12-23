<?php
include ("vars.php");
include ("functions.php");
include ("international.php");
set_time_limit(240);
$mobile = "no";
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
<script type="text/javascript" src="jquery-1.8.3-min.js"></script>
<script type="text/javascript" src="functions.js"></script>
<script type="text/javascript" src="uifunctions.js"></script>
<script type="text/javascript" src="debug.js"></script>
<script type="text/javascript" src="coverscraper.js"></script>
<?php
include ("globals.php");
?>
<script language="JavaScript">
<?php
if ($prefs['debug_enabled'] == 1) {
    print "debug.setLevel(8);\n";
} else {
    print "debug.setLevel(0);\n";
}
?>

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
var origsauce = "";
var origbigsauce = "";
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
    // Annoylingly, javascript permits you to bind the same event multiple times,
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
    $("#totaltext").html(numcovers+" "+language.gettext("label_albums"));
    progress = new progressBar('progress', 'horizontal');
    $(window).bind('resize', wobbleMyBottom );
    if ("localStorage" in window && window["localStorage"] != null) {
        useLocalStorage = true;
    }
    covergetter = new coverScraper(1, useLocalStorage, true, true);
    covergetter.reset(albums_without_cover);
    $("#harold").click( start );
    $("#finklestein").click( boogerbenson );
    wobblebottom = $('#wobblebottom');
    wobbleMyBottom();
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
        $(this).attr("src", "newimages/album-unknown.png");
    });
    covergetter.updateInfo(albums_without_cover - count);
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
                        imgobj.attr("src", "newimages/album-unknown.png");
                        imgobj.removeClass('nospin').addClass('spinner');
                        if (src.match(/image\/.*;base64/)) {
                            debug.log("ALBUMART","Looks like Base64");
                            // For some reason I no longer care about, doing this with jQuery.post doesn't work
                            var formData = new FormData();
                            formData.append('base64data', src);
                            formData.append('key', imagekey);
                            var xhr = new XMLHttpRequest();
                            xhr.open('POST', 'getalbumcover.php');
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    uploadComplete(xhr.responseText);
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
                        imgobj.attr("src", "newimages/album-unknown.png");
                        imgobj.removeClass('nospin').addClass('spinner');
                        // For some reason I no longer care about, doing this with jQuery.post doesn't work
                        var formData = new FormData();
                        formData.append('ufile', files[0]);
                        formData.append('key', imagekey);
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', 'getalbumcover.php');
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                uploadComplete(xhr.responseText);
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
                bigdiv = $('<div>', {id: "imageeditor", class: "containerbox covercontainer"}).insertAfter(position);
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
                origsauce = imgobj.attr("src");
                var phrase =  decodeURIComponent(where.prev('input').val());
                var path =  where.prev('input').prev('input').val();

                bigdiv.append($('<div>', { id: "searchcontent", style: "padding:8px"}));
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
                uform.append(               $('<input>', { id: 'imagekey', type: 'hidden', name: 'key', value: '' }),
                                            $('<input>', { name: 'ufile', type: 'file', size: '80', class: 'tleft sourceform', style: 'color:#ffffff' }),
                                            $('<input>', { type: 'button', class: 'tright topformbutton', value: language.gettext("albumart_uploadbutton"), style: 'width:8em', onclick: "imageEditor.uploadFile()" }),
                                            '<div class="holdingcell"><p>'+language.gettext("albumart_dragdrop")+'</p></div>');

                $("#editcontrols").append(  '<div id="g" class="tleft bleft clickable bmenu">'+language.gettext("albumart_googlesearch")+'</div>'+
                                            '<div id="f" class="tleft bleft bmid clickable bmenu">'+language.gettext("albumart_local")+'</div>'+
                                            '<div id="u" class="tleft bleft bmid clickable bmenu">'+language.gettext("albumart_upload")+'</div>'+
                                            '<div class="tleft bleft bmid clickable"><a href="http://www.google.com/search?q='+phrase+'&hl=en&site=imghp&tbm=isch" target="_blank">'+language.gettext("albumart_newtab")+'</a></div>');

                $("#editcontrols").append(  $('<img>', { class: "tright clickicon", onclick: "imageEditor.close()", src: "newimages/edit-delete.png", style: "height:16px"}));

                $("#"+current).addClass("bsel");

                $("#brian").append(         $('<input>', { type: 'text', id: 'searchphrase', class: 'tleft sourceform', size: '80' }),
                                            $('<button>', { class: 'tright topformbutton', onclick: 'imageEditor.research()', style: 'width:8em' }));

                $("#brian button").html('Search');
                $("#searchphrase").val(phrase);

                var bigsauce = origsauce;
                var m = origsauce.match(/albumart\/original\/(.*)/);
                if (m && m[1]) {
                    bigsauce = 'albumart/asdownloaded/'+m[1];
                }
                bigimg.src = bigsauce;
                origbigsauce = bigsauce;

                imageEditor.search();
                if (path) {
                    $.getJSON("findLocalImages.php?path="+path, imageEditor.gotLocalImages)
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
            origsauce = null;
            origbigsauce = null;
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
            var fiddleheight = bo.top - (to.top + here.parent().next().height()) + 4;
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
                $("#origimage").empty().append($("<div>", { id: 'firefoxsucksballs', height: h, width: w }));
                $("#firefoxsucksballs").append($("<img>", { src: bigimg.src, height: h, width: w }));
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
                    // romprsrc: v.link,
                    // romprindex: index,
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
            $("#searchresultsholder").append('<div id="morebutton" style="width:80%;display:table" class="gradbutton bigbutton" onclick="imageEditor.search()"><b>'+language.gettext("albumart_showmore")+'</b></div>');

        },

        onGoogleSearchClicked: function(event) {
            var clickedElement = findClickableElement(event);
            if (clickedElement.hasClass("clickgimage")) {
                debug.group("ALBUMART","Search Result clicked :",clickedElement.attr('romprsrc'), clickedElement.attr('romprindex'));
                event.stopImmediatePropagation();
                // updateImage(clickedElement.attr('romprsrc'), clickedElement.attr('romprindex'));
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
            bigimg.src = "";
            bigimg.src = url;
        },

        showError: function(message) {
            $("#morebutton").remove();
            $("#searchresults").append('<div id="morebutton" style="width:80%;display:table" class="gradbutton"><b>'+language.gettext("albumart_googleproblem")+' "'+message+'"</b></div>');
        },

        gotLocalImages: function(data) {
            debug.log("ALBUMART","Retreived Local Images: ",data);
            if (data && data.length > 0) {
                $.each(data, function(i,v) {
                    debug.log("ALBUMART","Local Image ",i, v);
                    $("#fsearch").append($("<img>", {
                                                        id: "img"+(i+100000).toString(),
                                                        //romprsrc: encodeURIComponent(v),
                                                        //romprindex: i+100000,
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
            imgobj.attr('src', 'newimages/album-unknown.png');
            imageEditor.updateBigImg('newimages/album-unknown.png');
            startAnimation();
            var formElement = document.getElementById("uform");
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "getalbumcover.php");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    uploadComplete(xhr.responseText);
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
    imgobj.attr('src', 'newimages/album-unknown.png');
    imageEditor.updateBigImg('newimages/album-unknown.png');
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
    $('#img'+clickindex).removeClass('noflash').addClass('flasher');
}

function animationStop() {
    imgobj.removeClass('spinner').addClass('nospin');
    $('#img'+clickindex).removeClass('flasher').addClass('noflash');
}

function searchFail() {
    debug.log("ALBUMART","No Source Found");
    $('#img'+clickindex).attr('src', 'newimages/imgnotfound.png');
    imgobj.attr('src', origsauce);
    imageEditor.updateBigImg(origbigsauce);
    animationStop();
    debug.groupend();
}

function uploadComplete(data) {
    debug.log("ALBUMART","Upload Complete");
    var src = $(data).find('url').text();
    if (!src || src == "") {
        searchFail();
        return;
    }
    animationStop();
    debug.log("ALBUMART","Success for",imagekey);
    if (imgobj.hasClass('notexist') || imgobj.hasClass('notfound')) {
        covergetter.updateInfo(1);
        imgobj.removeClass("notexist");
        imgobj.removeClass("notfound");
    }
    firefoxcrapnesshack++;

    imgobj.attr('src', "");
    imgobj.attr('src', "albumart/original/firefoxiscrap/"+imagekey+"---"+firefoxcrapnesshack.toString());

    var os = $(data).find('origurl').text();
    debug.log("ALBUMART","Returned big sauce ",os);
    if (os) {
        imageEditor.updateBigImg("albumart/asdownloaded/firefoxiscrap/"+imagekey+"---"+firefoxcrapnesshack.toString());
    }

    if (useLocalStorage) {
        sendLocalStorageEvent(imagekey);
    }
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
print '<tr><td class="outer" id="totaltext"></td><td><div class="invisible" id="progress" style="font-size:12pt"></div></td><td class="outer" align="right"><button id="harold" class="topformbutton">'.get_int_text("albumart_getmissing").'</button></td></tr>';
print '<tr><td class="outer" id="infotext"></td><td align="center"><div class="inner" id="status">'.get_int_text("albumart_instructions").'</div></td><td class="outer" align="right"><button id="finklestein" class="topformbutton">'.
        get_int_text("albumart_onlyempty").'</button></td></tr>';
?>
</table>
</div>
</div>
<div id="wobblebottom">

<div id="artistcoverslist" class="tleft noborder" style="width:20%">
    <div class="noselection fullwidth">
<?php
$acount = 0;
if (file_exists($ALBUMSLIST)) {
    $collection = simplexml_load_file($ALBUMSLIST);
    print '<div class="containerbox menuitem clickable clickselectartist selected" id="allartists"><div class="expand" style="padding-top:2px;padding-bottom:2px">'.get_int_text("albumart_allartists").'</div></div>';
    print '<div class="containerbox menuitem clickable clickselectartist" id="radio"><div class="expand" style="padding-top:2px;padding-bottom:2px">'.get_int_text("label_yourradio").'</div></div>';
    print '<div class="containerbox menuitem clickable clickselectartist" id="unused"><div class="expand" style="padding-top:2px;padding-bottom:2px">'.get_int_text("albumart_unused").'</div></div>';
    foreach($collection->artists->artist as $artist) {
        print '<div class="containerbox menuitem clickable clickselectartist';
        print '" id="artistname'.$acount.'">';
        print '<div class="expand" style="padding-top:2px;padding-bottom:2px">'.$artist->name.'</div>';
        print '</div>';
        $acount++;
    }
}
?>
    </div>
</div>
<div id="coverslist" class="tleft noborder" style="width:80%">

<?php

// Do Local Albums

$allfiles = glob("albumart/original/*.jpg");
debug_print("There are ".count($allfiles)." Images", "ALBUMART");

$count = 0;
$albums_without_cover = 0;
if (file_exists($ALBUMSLIST)) {
    $collection = simplexml_load_file($ALBUMSLIST);
    $acount = 0;
    foreach($collection->artists->artist as $artist) {
        print '<div class="cheesegrater" name="artistname'.$acount.'">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2 style="margin:8px">'.$artist->name.'</h2></div><div class="tright rightpad"><button class="topformbutton" style="margin-top:8px" onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
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
                $src = "newimages/album-unknown.png";
            } else {
                $src = $album->image->src;
                if (dirname($src) == "albumart/small") {
                    $src = "albumart/original/".basename($src);
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

} else {
    print '<h3>'.get_int_text("albumart_nocovers").'<h3>';
}

do_radio_stations();

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

function do_radio_stations() {

    global $count;
    global $albums_without_cover;
    global $allfiles;
    $playlists = glob("prefs/USERSTREAM*.xspf");
    if (count($playlists) > 0) {
        print '<div class="cheesegrater" name="radio">';
        print '<div class="albumsection crackbaby">';
        print '<div class="tleft"><h2 style="margin:8px">Radio Stations</h2></div><div class="tright rightpad"><button class="topformbutton" style="margin-top:8px" onclick="getNewAlbumArt(\'#album'.$count.'\')">'.get_int_text("albumart_getthese").'</button></div>';
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
                    $artname = md5($track->album);
                    $class = "";
                    $src = "newimages/broadcast.png";
                    if ($track->image != "newimages/broadcast.png") {
                        $src = $track->image;
                        if(($key = array_search($src, $allfiles)) !== false) {
                            unset($allfiles[$key]);
                        }
                    } else if (file_exists("albumart/original/".$artname.".jpg")) {
                        $src = "albumart/original/".$artname.".jpg";
                        if(($key = array_search($src, $allfiles)) !== false) {
                            unset($allfiles[$key]);
                        }
                    } else {
                        $class = " notexist";
                        $albums_without_cover++;
                    }

                    print '<input type="hidden" value="'.$track->album.'" />';
                    print '<img class="clickable clickicon clickalbumcover droppable"'.$class.'" romprstream="'.$file.'" name="'.$artname.'" height="82px" width="82px" src="'.$src.'" />';
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

function do_unused_images() {
    global $allfiles;
    print '<div class="cheesegrater" name="unused">';
    print '<div class="albumsection crackbaby">';
    print '<div class="tleft"><h2 style="margin:8px">'.count($allfiles).' '.get_int_text("albumart_unused").'</h2></div><div class="tright rightpad"><button class="topformbutton" style="margin-top:8px" onclick="removeUnusedFiles()">'.get_int_text("albumart_deletethese").'</button></div>';
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
