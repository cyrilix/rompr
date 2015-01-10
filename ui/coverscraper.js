function coverScraper(size, useLocalStorage, sendUpdates, enabled) {

    var self = this;
    var timer_running = false;
    var formObjects = [];
    var numAlbums = 0;
    var albums_without_cover = 0;
    var imgobj = null;
    var infotext = $('#infotext');
    var statusobj = $('#status');
    // var blankicon = 'newimages/compact_disc.svg';
    var name = null;
    var artist = null;
    var album = null;
    var stream = null;
    var mbid = null;
    var albumpath = null;
    var spotilink = null;
    var covertimer = null;
    var callbacks = new Array();

    // I need to try and limit the number of lookups per second I do to last.fm
    // Otherwise they will set the lions on me - hence the use of setTimeout

    // Pass the img name to this function
    this.GetNewAlbumArt = function(name) {
        debug.log("COVERSCRAPER","getNewAlbumArt",name);
        if (enabled && name !== undefined) {
            formObjects.push(name);
            numAlbums = (formObjects.length)-1;
            if (timer_running == false) {
                doNextImage(1);
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
            infotext.html(albums_without_cover+" "+language.gettext("albumart_nocovercount"));
        }
    }

    // Is there something else I could be doing?

    function doNextImage(time) {
        debug.groupend();
        clearTimeout(covertimer);
        if (formObjects.length > 0) {
            debug.group("COVERSCRAPER","Next Image, delay time is",time);
            timer_running = true;
            covertimer = setTimeout(processForm, time);
        } else {
            $(statusobj).empty();
            timer_running = false;
            aADownloadFinished();
        }
    }

    function processForm() {

        name = formObjects.shift();

        if ($('[name="'+name+'"]').length == 0) {
            doNextImage(1);
            return 0;
        }

        debug.log("COVERSCRAPER","Getting Cover for", name);

        var i = findImageInWindow(name);
        if (i !== false) {
            debug.log("COVERSCRAPER","Using image already in window");
            finaliseImage(i,1);
            return 0;
        }

        if (sendUpdates) {
            var x = $('img[name="'+name+'"]').prev('input').val();
            statusobj.empty().html(language.gettext("albumart_getting")+" "+decodeURIComponent(x));
            var percent = ((numAlbums - formObjects.length)/numAlbums)*100;
            progress.setProgress(percent.toFixed(2));
         }

        var stream = "";
        $.each($('[name="'+name+'"]'), function() {
            if (stream == "") {
                stream = $(this).attr('romprstream') || "";
            }
        });
        debug.log("COVERSCRAPER","Stream is", stream);
        animateWaiting();

        var options = { key: name,
                        stream: stream };

        $.post("getalbumcover.php", options)
        .done( gotImage )
        .fail( revertCover );

    }

    function animateWaiting() {
        $('img[name="'+name+'"]').removeClass('nospin').addClass('spinner');
    }

    function stopAnimation() {
        $('img[name="'+name+'"]').removeClass('spinner').addClass('nospin');
    }

    // Hello

    this.archiveImage = function(name, url) {
        $.post("getalbumcover.php", {key: name, src: url})
        .done( )
        .fail( );
    }

    function gotImage(data) {
        debug.log("COVERSCRAPER","Retrieved Image", data);
        finaliseImage(data);
   }

   function finaliseImage(data) {
        debug.log("COVERSCRAPER","Source is",data.url);
        if (data.url == "" || data.url === null) {
            revertCover(data.delaytime);
        } else {
            angle = 0;
            stopAnimation();
            $.each($('img[name="'+name+'"]'), function() {
                // Use large images for playlist and nowplaying
                if ($(this).hasClass("clickrollup") || $(this).attr("id") == "albumpicture") {
                    $(this).attr("src", data.origimage);
                } else {
                    $(this).attr("src", data.url);
                }
                $(this).removeClass("notexist");
                $(this).removeClass("notfound");
            });
            self.updateInfo(1);
            if (useLocalStorage) {
                sendLocalStorageEvent(name);
            }
            if (callbacks[name] !== undefined) {
                debug.log("COVERSCRAPER","calling back for",name,data);
                callbacks[name](data);
            }
            doNextImage(data.delaytime);
        }
    }

    function revertCover(delaytime) {
        if (!delaytime) {
            delaytime = 800;
        }
        stopAnimation();
        debug.log("COVERSCRAPER","No Cover Found. Reverting to the blank icon");
        $.each($('img[name="'+name+'"]'), function() {
            // $(this).attr("src", blankicon);
            // Remove this class to prevent it being searched again
            $(this).removeClass("notexist");
            $(this).removeClass("notfound").addClass("notfound");
        });
        if (useLocalStorage) {
            sendLocalStorageEvent("!"+name);
        }
        doNextImage(delaytime);
    }

    this.setCallback = function(callback, imgname) {
        callbacks[imgname] = callback;
    }

    this.clearCallbacks = function() {
        callbacks = new Array();
    }

}

function sendLocalStorageEvent(key) {
    debug.log("COVERSCRAPER","Sending local storage event",key);
    // Event only fires when the key value actually CHANGES
    localStorage.setItem("key", "Blerugh");
    localStorage.setItem("key", key);
}


