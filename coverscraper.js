function coverScraper(size, useLocalStorage, sendUpdates, enabled) {

    var self = this;
    var timer;
    var timer_running = false;
    var formObjects = [];
    var numAlbums = 0;
    var albums_without_cover = 0;
    var imgobj = null;
    var infotext = $('#infotext');
    var progress = $('#progress');
    var statusobj = $('#status');
    var waitingicon = ['images/waiting2.gif', 'images/image-update.gif'];
    var blankicon = ['images/album-unknown-small.png', 'images/album-unknown.png'];
    var name = null;
    var artist = null;
    var album = null;
    var stream = null;
    var update = null;
    var mbid = null;

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    
    // Pass the img name to this function
    this.GetNewAlbumArt = function(name) {
        if (enabled) {
            debug.log("New Album Pushed to coverscraper", name);
            formObjects.push(name);
            numAlbums++;
            if (timer_running == false) {
                timer_running = true;
                doNextImage(500);
            }
        }
    };
    
    this.toggle = function(o) {
        enabled = o;
    };
    
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
    };
    
    this.updateInfo = function(n) {
        if (sendUpdates) {
            albums_without_cover = albums_without_cover - n;
            var html = albums_without_cover+" albums without a cover";
            $(infotext).html(html);
            html = null;
        }
    };
    
    function doNextImage(time) {
        if (sendUpdates) {
            var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
            $(progress).progressbar("option", "value", parseInt(percent.toString()));
        }
        if (formObjects.length > 0) {
            timer = setTimeout(self.processForm, time);
            timer_running = true;
        } else {
            $(statusobj).html("");
            timer_running = false;
            aADownloadFinished();
        }
    }

   this.processForm = function() {
        if (timer_running) {
            clearTimeout(timer);
        }
        name = formObjects.shift();
        imgobj = $('img[name="'+name+'"]');
        artist = $(imgobj).attr("romprartist");
        album = $(imgobj).attr("rompralbum");
        stream = $(imgobj).attr("romprstream");
        update = $(imgobj).attr("romprupdate");
        mbid = $(imgobj).attr("rompralbumid");
        
        debug.log("Getting Cover for", artist, album, mbid);
        if (sendUpdates) {
            var html = "Getting "+decodeURIComponent(album);
            $(statusobj).html(html);
            html = null;
        }
        $(imgobj).attr('src', waitingicon[size]);
        
        //Don't use the Musicbrainz tag on Last.FM requests, it's not as accurate as artist/album lookup !!??!!

        // I'm using REST requests (XML response) instead of JSONP. This works better cross-site
        // Also, every jsonp response is interpreted as a script, which means it stays in memory.
        // Using jsonp leaks RAM by the megabyte.
        $.ajax({
                url: "http://ws.audioscrobbler.com/2.0/",
                type: "GET",
                data: "method=album.getinfo&api_key="+lastfm_api_key+"&album="+album+"&artist="+artist+"&autocorrect=1",
                contentType: "text/xml; charset=utf-8",
                dataType: "xml",
                timeout: 60000,
                success: self.gotLastfmImage,
                error: self.gotNoLastfmImage
        });
                    
    };
    
    this.gotLastfmImage = function(data) {
        var image = "";
        var pic = "";
        $(data).find("image").each( function() {
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
            .done( self.gotImage )
            .fail( self.gotNoLastfmImage );
        } else {
            debug.log("     No Last.FM Image Found");
            self.gotNoLastfmImage();
        }
    }

    this.gotNoLastfmImage = function(data) {
        data = null;
        debug.log("  No LastFM Cover Found");
        if (mbid) {
            // Try musicbrainz
            debug.log("    Looking up on musicbrainz for mbid",mbid);
            var getstring = "key="+encodeURIComponent(name)+"&src="+encodeURIComponent("http://coverartarchive.org/release/"+mbid+"/front");
            if (typeof(stream) != "undefined") {
                getstring = getstring + "&stream="+stream;
            }
            $.get("getalbumcover.php", getstring)
            .done( self.gotImage )
            .fail( self.everythingFailed );
        } else {
            self.everythingFailed();
        }
   }

   this.gotImage = function() {
        if (size == 0) {
            $(imgobj).attr("src", "albumart/small/"+name+".jpg");
        } else {
            $(imgobj).attr("src", "albumart/original/"+name+".jpg");
        }
        $(imgobj).removeClass("notexist");
        self.updateInfo(1);
        if (useLocalStorage || update == "yes") {
            self.sendLocalStorageEvent(name, update);
        }
        doNextImage(1000);
   }

    this.everythingFailed = function() {
        debug.log("  Everything failed for",name);
        $.get("getalbumcover.php", "key="+encodeURIComponent(name)+"&flag=notfound")
        .done( self.revertCover )
        .fail( self.revertCover );
    }
    
    this.revertCover = function() {
        debug.log("  Revert Cover");
        $(imgobj).attr('src', blankicon[size]);
        $(imgobj).removeClass("notexist");
        $(imgobj).addClass("notfound");
        if (useLocalStorage || update == "yes") {
            self.sendLocalStorageEvent("!"+name, update);
        }
        doNextImage(1000);
    }

    this.sendLocalStorageEvent = function(key, update) {
        if (update == "yes") {
//             var e = new Object;
//             e.newValue = key;
//             onStorageChanged(e);
            onStorageChanged({newValue: key});
        } else {
            debug.log("    Setting Local Storage key to",key);
            localStorage.setItem("key", key);
        }
    }
        
}


