function coverScraper(flag, ls, u, o) {

    var self = this;
    var timer;
    var timer_running = false;
    var formObjects = new Array();
    var size = flag;
    var numAlbums = 0;
    var albums_without_cover = 0;
    var useLocalStorage = ls;
    var sendUpdates = u;
    var enabled = o;
    var timerlink = processForm();

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    
    // Pass the img name to this function
    this.GetNewAlbumArt = function(name) {
        if (enabled) {
            debug.log("New Album Pushed to coverscraper", name);
            formObjects.push(name);
            numAlbums++;
            if (timer_running == false) {
                doNextImage(1000);
            }
        }
    }
    
    this.toggle = function(o) {
        enabled = o;
    }
    
    this.reset = function(awc) {
        numAlbums = 0;
        if (awc > -1) {
            albums_without_cover = awc;
        }
        formObjects = [];
        if (timer_running) {
            clearTimeout(timer);
            timer_running = false;
        }
        self.updateInfo(0);
        aADownloadFinished();
    }
    
    this.updateInfo = function(n) {
        if (sendUpdates) {
            albums_without_cover = albums_without_cover - n;
            var html = albums_without_cover+" albums without a cover";
            $("#infotext").html(html);
            html = null;
        }
    }

    function doNextImage(time) {
        if (sendUpdates) {
            var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
            $("#progress").progressbar("option", "value", parseInt(percent.toString()));
        }
        if (formObjects.length > 0) {
            timer = setTimeout(timerlink, time);
            timer_running = true;
        } else {
            $("#status").html("");
            timer_running = false;
            aADownloadFinished();
        }
    }

   function processForm() {
       return (function() {
            if (timer_running) {
                clearTimeout(timer);
            }
            var name = formObjects.shift();
            var artist = $('img[name="'+name+'"]').attr("romprartist");
            var album = $('img[name="'+name+'"]').attr("rompralbum");
            var stream = $('img[name="'+name+'"]').attr("romprstream");
            var update = $('img[name="'+name+'"]').attr("romprupdate");
            var mbid = $('img[name="'+name+'"]').attr("rompralbumid");
            
            debug.log("Getting Cover for", artist, album, mbid);
            if (sendUpdates) {
                $("#status").html("Getting "+decodeURIComponent(album));
            }
            if (size == 0) {
                $('img[name="'+name+'"]').attr("src", "images/waiting2.gif");
            } else {
                $('img[name="'+name+'"]').attr("src", "images/image-update.gif");
            }
            
            //Don't use the Musicbrainz tag on Last.FM requests, it's not as accurate as artist/album lookup !!??!!
            //var url = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album="+album+"&artist="+artist+"&autocorrect=1&api_key="+lastfm_api_key+"&format=json&callback=?";
            //debug.log("   URL is:",url);
//             $.jsonp({
//                     url: url,
//                     url: "http://ws.audioscrobbler.com/2.0/",
//                     data: "method=album.getinfo&album="+album+"&artist="+artist+"&autocorrect=1&api_key="+lastfm_api_key+"&format=json&callback=?",
//                     cache: false,
//                     pageCache: false,
//                     success: gotLastfmImage(name, stream, update, mbid),
//                     error: gotNoLastfmImage(name, stream, update, mbid)
//             });
//             $.get("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album="+album+"&artist="+artist+"&autocorrect=1&api_key="+lastfm_api_key)
//                 .done(doesthiswork(name, stream, update, mbid))
//                 .fail(gotNoLastfmImage(name, stream, update, mbid));

                // I'm using REST requests (XML response) instead of JSONP. This works better cross-site
                // Also, every jsonp response is interpreted as a script, which means it stays in memory.
                // Using jsonp leaks RAM by the megabyte.
                $.ajax({
                        //url: "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album="+album+"&artist="+artist+"&autocorrect=1&api_key="+lastfm_api_key,
                        url: "http://ws.audioscrobbler.com/2.0/",
                        type: "GET",
                        //cache: false,
                        data: "method=album.getinfo&api_key="+lastfm_api_key+"&album="+album+"&artist="+artist+"&autocorrect=1",
                        contentType: "text/xml; charset=utf-8",
                        dataType: "xml",
                        timeout: 60000,
                        success: gotLastfmImage(name, stream, update, mbid),
                        error: gotNoLastfmImage(name, stream, update, mbid) 
                        });
                       
       });
    }
    
    function gotLastfmImage(name, stream, update, mbid) {
        return (function(data) {
            var image = "";
            var pic = "";
            $(data).find("image").each( function() {
//                 debug.log($(this).text(), $(this).attr("size"));
                pic = $(this).text();
                if ($(this).attr("size") == "large") { image = $(this).text() }
            });
            if (!mbid) {
                mbid = $(data).find("album").children("mbid").text();
                debug.log("     LastFM MBID is",mbid);
            }
            if (image == "") { image = pic }
            data = null;
            if (image != "") {
                debug.log("     Getting",image);
                var getstring = "key="+encodeURIComponent(name)+"&src="+encodeURIComponent(image);
                if (typeof(stream) != "undefined") {
                    getstring = getstring + "&stream="+stream;
                }
                $.get("getalbumcover.php", getstring)
                .done( gotImage(name, stream, update, mbid) )
                .fail( gotNoLastfmImage(name, stream, update, mbid) );
            } else {
                debug.log("     No Last.FM Image Found");
                gotNoLastfmImage(name, stream, update, mbid)(null,null,null);
            }
        });
    }

//     function gotLastfmImage (name, stream, update, mbid) {
//         return (function(data,t,j) {
//             debug.log("   Got Last.FM response",data);
//             var image = "";
//             if (data.album) {
//                 $.each(data.album.image, function (index, value) {
//                     var pic = "";
//                     $.each(value, function (index, value) {
//                         if (index == "#text") { pic = value; }
//                         if (index == "size" && value == "large") { image = pic; }
//                         if (image == "") { image = pic; }
//                     });
//                 });
//                 if (!mbid && data.album.mbid) {
//                     debug.log("     last.fm has given us a mbid");
//                     mbid = data.album.mbid;
//                 }
//             }
//             data = null;
//             t= null;
//             j = null;
//             if (image != "") {
//                 debug.log("     Getting",image);
//                 var getstring = "key="+encodeURIComponent(name)+"&src="+encodeURIComponent(image);
//                 if (typeof(stream) != "undefined") {
//                     getstring = getstring + "&stream="+stream;
//                 }
//                 $.get("getalbumcover.php", getstring)
//                 .done( gotImage(name, stream, update, mbid) )
//                 .fail( gotNoLastfmImage(name, stream, update, mbid) );
//             } else {
//                 debug.log("     No Last.FM Image Found");
//                 gotNoLastfmImage(name, stream, update, mbid)(null,null,null);
//             }
//         });
//     }

    function gotNoLastfmImage(name, stream, update, mbid) {
        return (function(data,t,j) {
            debug.log("  No LastFM Cover Found");
            data = null;
            t= null;
            j = null;
            if (mbid) {
                // Try musicbrainz
                debug.log("    Looking up on musicbrainz for mbid",mbid);
                var getstring = "key="+encodeURIComponent(name)+"&src="+encodeURIComponent("http://coverartarchive.org/release/"+mbid+"/front");
                if (typeof(stream) != "undefined") {
                    getstring = getstring + "&stream="+stream;
                }
                $.get("getalbumcover.php", getstring)
                .done( gotImage(name, stream, update, mbid) )
                .fail( everythingFailed(name, stream, update, mbid) );
            } else {
                everythingFailed(name, stream, update, mbid)(null,null,null);
            }
        });
   }

   function gotImage(name, stream, update, mbid) {
       return (function(data,t,j) {
            data = null;
            t= null;
            j = null;
            if (size == 0) {
                $('img[name="'+name+'"]').attr("src", "albumart/small/"+name+".jpg");
            } else {
                $('img[name="'+name+'"]').attr("src", "albumart/original/"+name+".jpg");
            }
            $('img[name="'+name+'"]').removeClass("notexist");
            self.updateInfo(1);
            if (useLocalStorage || update == "yes") {
                sendLocalStorageEvent(name, update);
            }
            doNextImage(1000);
       });
   }

    function everythingFailed(name, stream, update, mbid) {
        return (function(data,t,j) {
            data = null;
            t= null;
            j = null;
            debug.log("  Everything failed for",name);
            $.get("getalbumcover.php", "key="+encodeURIComponent(name)+"&flag=notfound")
            .done( revertCover(name, update) )
            .fail( revertCover(name, update) );
        });
    }
    
    function revertCover(name, update) {
        return (function(data,t,j) {
            debug.log("  Revert Cover");
            data = null;
            t= null;
            j = null;
            if (size == 0) {
                $('img[name="'+name+'"]').attr("src", "images/album-unknown-small.png");
            } else {
                $('img[name="'+name+'"]').attr("src", "images/album-unknown.png");
            }
            $('img[name="'+name+'"]').removeClass("notexist");
            $('img[name="'+name+'"]').addClass("notfound");
            if (useLocalStorage || update == "yes") {
                sendLocalStorageEvent("!"+name, update);
            }
            doNextImage(1000);
        });
    }
    
}

function sendLocalStorageEvent(key, update) {
    if (update == "yes") {
        var e = new Object;
        e.newValue = key;
        onStorageChanged(e);
    } else {
        debug.log("    Setting Local Storage key to",key);
        localStorage.setItem("key", key);
    }
}

