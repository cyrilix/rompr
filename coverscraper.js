function coverScraper(size, useLocalStorage, sendUpdates, enabled) {

    var self = this;
    var timer_running = false;
    var formObjects = [];
    var numAlbums = 0;
    var albums_without_cover = 0;
    var imgobj = null;
    var infotext = $('#infotext');
    var progress = $('#progress');
    var statusobj = $('#status');
    var waitingicon = ['images/album-unknown-small.png', 'images/image-update.gif'];
    var blankicon = ['images/album-unknown-small.png', 'images/album-unknown.png'];
    var name = null;
    var artist = null;
    var album = null;
    var stream = null;
    var mbid = null;
    var albumpath = null;
    var spotilink = null;
    var covertimer = null;

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout
    
    // Pass the img name to this function
    this.GetNewAlbumArt = function(name) {
        debug.log("getNewAlbumArt",name);
        if (enabled) {
            formObjects.push(name);
            numAlbums = (formObjects.length)-1;
            if (timer_running == false) {
                doNextImage();
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
        timer_running = false;
        self.updateInfo(0);
        aADownloadFinished();
    }
    
    this.updateInfo = function(n) {
        if (sendUpdates) {
            albums_without_cover = albums_without_cover - n;
            infotext.html(albums_without_cover+" albums without a cover");
        }
    }
    
    function doNextImage(time) {
        clearTimeout(covertimer);
        if (formObjects.length > 0) {
            timer_running = true;
            covertimer = setTimeout(processForm, 1000);
        } else {
            $(statusobj).empty();
            timer_running = false;
            aADownloadFinished();
        }
    }

    function processForm() {

        name = formObjects.shift();

        artist = null;
        album = null;
        stream = null;
        mbid = null;
        albumpath = null;
        spotilink = null;
        
        imgobj = document.getElementsByName(name);
        if (!imgobj) {
            doNextImage();
            return 0;
        }
        for(var i = 0; i < imgobj.length; i++) {
            if (!artist) {
                artist = imgobj[i].getAttribute("romprartist");
            }
            if (!album) {
                album = imgobj[i].getAttribute("rompralbum");
            }
            if (!stream) {
                stream = imgobj[i].getAttribute("romprstream");
            }
            if (!mbid) {
                mbid = imgobj[i].getAttribute("rompralbumid");
            }
            if (!albumpath) {
                albumpath = imgobj[i].getAttribute("romprpath");
            }
            if (!spotilink) {
                spotilink = imgobj[i].getAttribute("romprspotilink")
            }
        }
        
        debug.log("Getting Cover for", artist, album, mbid);
         if (sendUpdates) {
             statusobj.empty().html("Getting "+decodeURIComponent(artist)+" - "+decodeURIComponent(album));
             var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
             progress.progressbar("option", "value", parseInt(percent.toString()));
         }
         
        for(var i = 0; i < imgobj.length; i++) {
            imgobj[i].setAttribute('src', waitingicon[size]);
        }
        
        var options = { key: name,
                        artist: decodeURIComponent(artist),
                        album: decodeURIComponent(album),
                        mbid: mbid
        };
        if (stream) {
            options.stream = stream;
        }
        if (albumpath) {
            options.albumpath = decodeURIComponent(albumpath);
        }
        if (spotilink) {
            options.spotilink = decodeURIComponent(spotilink);
        }
        $.post("getalbumcover.php", options)
        .done( gotImage )
        .fail( revertCover );
        
    }

    this.archiveImage = function(name, url) {
        $.post("getalbumcover.php", {key: name, src: url})
        .done( )
        .fail( );
    }
   
    function gotImage(data) {
        debug.log("    Retrieved Image", data);
        $src = $(data).find('url').text();
        debug.log("       Source is",$src);
        $.each($('img[name="'+name+'"]'), function() {
            $(this).attr("src", $src);
            $(this).removeClass("notexist");
        });
        self.updateInfo(1);
        if (useLocalStorage) {
            sendLocalStorageEvent(name);
        }
        doNextImage();
   }
    
    function revertCover() {
        debug.log("  Revert Cover");
        for(var i = 0; i < imgobj.length; i++) {
            imgobj[i].setAttribute('src', blankicon[size]);
        }
        $.each($('img[name="'+name+'"]'), function() {
            $(this).removeClass("notexist");
            $(this).addClass("notfound");
        });
        if (useLocalStorage) {
            sendLocalStorageEvent("!"+name);
        }
        doNextImage();
    }
    
}

function sendLocalStorageEvent(key) {
    debug.log("    Setting Local Storage key to",key);
    localStorage.setItem("key", key);
}
        

