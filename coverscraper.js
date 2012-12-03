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

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    
    // Pass the img object to this function
    this.getNewAlbumArt = function(object) {
        if (enabled) {
            debug.log("New Album Pushed to coverscraper", object);
            formObjects.push(object);
            numAlbums++;
            if (timer_running == false) {
                doNextImage(100);
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
            timer.stop();
            timer_running = false;
        }
        self.updateInfo(0);
    }

    function doNextImage(timer) {
        if (sendUpdates) {
            var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
            $("#progress").progressbar("option", "value", parseInt(percent.toString()));
        }
        if (formObjects.length > 0) {
            timer = setTimeout(self.processForm, timer);
            timer_running = true;
        } else {
            $("#status").html("");
            timer_running = false;
        }
    }

    this.processForm = function() {

        if (timer_running) {
            clearTimeout(timer);
        }
        var object = formObjects.shift();
        var artist = decodeURIComponent($(object).attr("romprartist"));
        var album = decodeURIComponent($(object).attr("rompralbum"));
        var stream = $(object).attr("romprstream");
        debug.log("stream",stream);
        var key = $(object).attr("name");
        var update = $(object).attr("romprupdate");
        
        debug.log("Getting Cover for",object,artist,album,key);
        if (sendUpdates) {
            $("#status").html("Getting "+album);
        }
        if (size == 0) {
            $(object).attr("src", "images/waiting2.gif");
        } else {
            $(object).attr("src", "images/image-update.gif");
        }
        
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
                        debug.log("   Getting",image);
                        var getstring = "key="+encodeURIComponent(key)+"&src="+encodeURIComponent(image);
                        if (typeof(stream) != "undefined") {
                            getstring = getstring + "&stream="+stream;
                        }
                        $.get("getalbumcover.php", getstring)
                        .done(function () {
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
                            //$(object).removeAttr("romprartist");
                            //$(object).removeAttr("rompralbum");
                            doNextImage(750);
                        })
                        .fail(function () {
                            debug.log("Album Cover Get Failed");
                            revertCover(object, key, update);
                        });
                    } else {
                        debug.log("    No Cover Found");
                        $.get("getalbumcover.php", "key="+encodeURIComponent(key)+"&flag=notfound")
                        .done(function () {
                            revertCover(object, key, update);
                        })
                        .fail(function () {
                            revertCover(object, key, update);
                        });
                    }
                },
                error: function() { doNextImage(1000); }
        });
    }
    
    function revertCover(object, key, update) {
        if (size == 0) {
            $(object).attr("src", "images/album-unknown-small.png");
        } else {
            $(object).attr("src", "images/album-unknown.png");
        }
        $(object).removeClass("notexist");
        $(object).addClass("notfound");
        //$(object).removeAttr("romprartist");
        //$(object).removeAttr("rompralbum");
        if (useLocalStorage || update == "yes") {
            sendLocalStorageEvent("!"+key, update);
        }
        doNextImage(750);
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
        debug.log("Setting Local Storage key to",key);
        localStorage.setItem("key", key);
    }
}