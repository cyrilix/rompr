function coverScraper(flag, ls, u, o) {

    var formObjects = new Array();
    var timer;
    var timer_running = false;
    var self = this;
    var size = flag;
    var numAlbums = 0;
    var albums_without_cover = 0;
    var useLocalStorage = ls;
    var sendUpdates = u;
    var enabled = o;
    var timerlink = processForm();
    
    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    
    // Pass the img object to this function
    this.getNewAlbumArt = function(object) {
        if (enabled) {
            debug.log("New Album Pushed to coverscraper", object);
            formObjects.push(object);
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
        formObjects = new Array();
        if (timer_running) {
            clearTimeout(timer);
            timer_running = false;
        }
        self.updateInfo(0);
        aADownloadFinished();
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
            var object = formObjects.shift();
            var artist = $(object).attr("romprartist");
            var album = $(object).attr("rompralbum");
            var stream = $(object).attr("romprstream");
            var key = $(object).attr("name");
            var update = $(object).attr("romprupdate");
            var mbid = $(object).attr("rompralbumid");
            
            debug.log("Getting Cover for", artist, album, key, mbid);
            if (sendUpdates) {
                $("#status").html("Getting "+decodeURIComponent(album));
            }
            if (size == 0) {
                $(object).attr("src", "images/waiting2.gif");
            } else {
                $(object).attr("src", "images/image-update.gif");
            }
            
            //Don't use the Musicbrainz tag on Last.FM requests, it's not as accurate as artist/album lookup !!??!!
            var url = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album="+album+"&artist="+artist+"&autocorrect=1&api_key="+lastfm_api_key+"&format=json&callback=?";
            debug.log("   URL is:",url);
            var success = gotLastfmImage(object, stream, key, update, mbid);
            var failure = gotNoLastfmImage(object, stream, key, update, mbid);
            $.jsonp({url: url,
                    success: success,
                    error: failure
            });
        });
    }

    function gotNoLastfmImage(object, stream, key, update, mbid) {
        return (function() {
            var noImg = everythingFailed(object, stream, key, update, mbid);
            var gotImg = gotImage(object, stream, key, update, mbid);
            debug.log("  No LastFM Cover Found");
            if (mbid) {
                // Try musicbrainz
                debug.log("    Looking up on musicbrainz for mbid",mbid);
                var getstring = "key="+encodeURIComponent(key)+"&src="+encodeURIComponent("http://coverartarchive.org/release/"+mbid+"/front");
                if (typeof(stream) != "undefined") {
                    getstring = getstring + "&stream="+stream;
                }
                $.get("getalbumcover.php", getstring)
                .done( gotImg )
                .fail( noImg );
            } else {
                noImg();
            }
        });
   }

   function gotImage(object, stream, key, update, mbid) {
       return (function() {
            if (size == 0) {
                $(object).attr("src", "albumart/small/"+key+".jpg");
            } else {
                $(object).attr("src", "albumart/original/"+key+".jpg");
            }
            $(object).removeClass("notexist");
            self.updateInfo(1);
            if (useLocalStorage || update == "yes") {
                sendLocalStorageEvent(key, update);
            }
            doNextImage(1000);
       });
   }

   
    function everythingFailed(object, stream, key, update, mbid) {
        return (function() {
            var finalCall = revertCover(object, key, update);
            debug.log("  Everything failed for",key);
            $.get("getalbumcover.php", "key="+encodeURIComponent(key)+"&flag=notfound")
            .done( finalCall )
            .fail( finalCall );
        });
    }

    function gotLastfmImage (object, stream, key, update, mbid) {
        return (function(data) {
            var successRef = gotImage(object, stream, key, update, mbid);
            debug.log("   Got Last.FM response",data);
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
                if (!mbid && data.album.mbid) {
                    debug.log("     last.fm has given us a mbid");
                    mbid = data.album.mbid;
                }
            }
            data = null;
            var funcRef = gotNoLastfmImage(object, stream, key, update, mbid);
            if (image != "") {
                debug.log("     Getting",image);
                var getstring = "key="+encodeURIComponent(key)+"&src="+encodeURIComponent(image);
                if (typeof(stream) != "undefined") {
                    getstring = getstring + "&stream="+stream;
                }
                $.get("getalbumcover.php", getstring)
                .done( successRef )
                .fail( funcRef );
            } else {
                debug.log("     No Last.FM Image Found");
                funcRef();
            }
        });
    }
    
    function revertCover(object, key, update) {
        return (function() {
            debug.log("  Revert Cover");
            if (size == 0) {
                $(object).attr("src", "images/album-unknown-small.png");
            } else {
                $(object).attr("src", "images/album-unknown.png");
            }
            $(object).removeClass("notexist");
            $(object).addClass("notfound");
            if (useLocalStorage || update == "yes") {
                sendLocalStorageEvent("!"+key, update);
            }
            doNextImage(1000);
        });
    }
    
    this.updateInfo = function(n) {
        if (sendUpdates) {
            albums_without_cover = albums_without_cover - n;
            $("#infotext").html(albums_without_cover+" albums without a cover");
        }
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