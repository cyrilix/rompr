
function LastFM(user) {

    var lastfm_secret="3ddf4cb9937e015ca4f30296a918a2b0";
    var logged_in = false;
    var username = user;
    var token = "";
    this.tunedto = "";
    var self=this;
    var lovebanshown = false;

    if (typeof lastfm_session_key != "undefined") {
        logged_in = true;
    }

    this.getScrobbling = function() {
        return prefs.lastfm_scrobbling ? 1 : 0;
    }

    this.showloveban = function(flag) {
        if (logged_in && lovebanshown != flag) {
            lovebanshown = flag;
            if (lovebanshown) {
                $("#lastfm").fadeIn('fast');
            } else {
                $("#lastfm").fadeOut('fast');
            }
        }
    }

    this.isLoggedIn = function() {
        return logged_in;
    }

    this.setscrobblestate = function() {
        prefs.save({ lastfm_scrobbling: $("#scrobbling").is(":checked"),
                    lastfm_autocorrect: $("#autocorrect").is(":checked"),
                    dontscrobbleradio: $("#radioscrobbling").is(":checked")}
        );
    }

    this.username = function() {
        return username;
    }

    this.login = function (user, pass) {

        username = user;
        var options = {api_key: lastfm_api_key, method: "auth.getToken"};
        var keys = getKeys(options);
        var it = "";

        for(var key in keys) {
            it = it+keys[key]+options[keys[key]];
        }
        it = it+lastfm_secret;
        options.api_sig = hex_md5(it);
        var url = "http://ws.audioscrobbler.com/2.0/";
        var adder = "?";
        var keys = getKeys(options);
        for(var key in keys) {
            url=url+adder+keys[key]+"="+options[keys[key]];
            adder = "&";
        }
        $.get(url, function(data) {
            token = $(data).find("token").text();

            var lfmlog = popupWindow.create(500,400,"lfmlog",true,"Log In to Last.FM");
            $("#popupcontents").append('<table align="center" cellpadding="2" id="lfmlogintable" width="90%"></table>');
            $("#lfmlogintable").append('<tr><td>Please click the button below to open the Last.FM website in a new tab. Enter your Last.FM login details if required then give RompR permission to access your account</td></tr>');
            $("#lfmlogintable").append('<tr><td>You can close the new tab when you have finished but do not close this dialog!</td></tr>');
            $("#lfmlogintable").append('<tr><td align="center"><a href="http://www.last.fm/api/auth/?api_key='+lastfm_api_key+'&token='+token+'" target="_blank">'+
                                        '<button>Click Here To Log In</button></a></td></tr>');
            $("#lfmlogintable").append('<tr><td>Once you have logged in to Last.FM, click the OK button below to complete the process</td></tr>');
            $("#lfmlogintable").append('<tr><td align="center"><button onclick="lastfm.finishlogin()">OK</button></td></tr>');

            popupWindow.open();
        });
    }

    this.finishlogin = function() {
        LastFMSignedRequest(
            {
                token: token,
                api_key: lastfm_api_key,
                method: "auth.getSession"
            },
            function(data) {
                lastfm_session_key = $(data).find("key").text();
                logged_in = true;
                prefs.save({
                    lastfm_session_key: lastfm_session_key,
                    lastfm_user: username
                });
                popupWindow.close();
                $("#lastfmlist").load("lastfmchooser.php");
            },
            function(data) {
                popupWindow.close();
                alert("Failed to log in to Last.FM");
            }
        );
    }

    function LastFMGetRequest(options, success, fail) {
        options.format = "json";
        options.callback = "?";
        var url = "http://ws.audioscrobbler.com/2.0/";
        var adder = "?";
        var keys = getKeys(options);
        for(var key in keys) {
            url=url+adder+keys[key]+"="+(options[keys[key]] == "?" ? "?" : encodeURIComponent(options[keys[key]]));
            adder = "&";
        }
        // Don't use JQuery's getJSON function for cross-site requests as it ignores any
        // error callbacks you give it. I'm using the jsonp plugin, which works.
        $.jsonp({
            url: url,
            timeout: 30000,
            success: success,
            error: fail
        });
    }

    function LastFMSignedRequest(options, success, fail) {

        // We've passed an object but we need the properties to be in alphabetical order
        var keys = getKeys(options);
        var it = "";
        for(var key in keys) {
            it = it+keys[key]+options[keys[key]];
        }
        it = it+lastfm_secret;
        options.api_sig = hex_md5(it);
        $.post("http://ws.audioscrobbler.com/2.0/", options)
            .done(success)
            .fail(fail);

    }

    var getKeys = function(obj) {
        var keys = [];
        for(var key in obj){
            keys.push(key);
        }
        keys.sort();
        return keys;
    }

    function addGetOptions(options, method) {
        options.api_key = lastfm_api_key;
        options.autocorrect = prefs.lastfm_autocorrect ? 1 : 0;
        options.method = method;
    }

    function addSetOptions(options, method) {
        options.api_key = lastfm_api_key;
        options.sk = lastfm_session_key;
        options.method = method;
    }

    this.track = {

        love : function(options,callback,callback2) {
            if (logged_in) {
                addSetOptions(options, "track.love");
                LastFMSignedRequest(
                    options,
                    function() {
                        callback(options.track,options.artist,true,callback2);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, "Failed To Make Love");
                    }
                );
            }
        },

        unlove : function(options,callback,callback2) {
            if (logged_in) {
                addSetOptions(options, "track.unlove");
                LastFMSignedRequest(
                    options,
                    function() {
                        callback(options.track,options.artist,false,callback2);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, "Failed To Remove Love");
                    }
                );
            }
        },

        ban : function(options) {
            if (logged_in) {
                addSetOptions(options, "track.ban");
                LastFMSignedRequest(
                    options,
                    function() {
                        $("#ban").effect('pulsate', {times: 1}, 2000);
                        if (nowplaying.mpd(-1, 'type') != "stream") {
                            playlist.next();
                        }
                        infobar.notify(infobar.NOTIFY, "Banned "+options.track);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, "Failed to ban"+options.track);
                    }
                );
            }
        },

        getInfo : function(options, callback, failcallback) {
            if (username != "") { options.username = username; }
            addGetOptions(options, "track.getInfo");
            LastFMGetRequest(
                options,
                callback,
                function(data) { failcallback({error: "Could not find information about this track"}) }
            );
        },

        getTags: function(options, callback, failcallback) {
            if (username != "") { options.user = username; }
            addGetOptions(options, "track.getTags");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "track.addTags");
                LastFMSignedRequest(
                    options,
                    function() { callback("track", options.tags) },
                    function() { failcallback("track", options.tags) }
                );
            }
        },

        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "track.removeTag");
                LastFMSignedRequest(
                    options,
                    function() { callback("track", options.tag); },
                    function() { failcallback("track", options.tag); }
                );
            }
        },

        updateNowPlaying : function(options) {
            if (logged_in && prefs.lastfm_scrobbling) {
                addSetOptions(options, "track.updateNowPlaying");
                LastFMSignedRequest(
                    options,
                    function() {  },
                    function() { debug.log("LAST FM       : Failed to update Now Playing",options) }
                );
            }
        },

        scrobble : function(options) {
            if (logged_in && prefs.lastfm_scrobbling) {
                if (prefs.dontscrobbleradio && nowplaying.mpd(-1, 'type') != "local") {
                    debug.log("LAST FM       : Not Scrobbling because track is not local");
                    return 0;
                }
                debug.log("LAST FM       : Last.FM is scrobbling");
                addSetOptions(options, "track.scrobble");
                LastFMSignedRequest(
                    options,
                    function() { infobar.notify(infobar.NOTIFY, "Scrobbled "+options.track) },
                    function() { infobar.notify(infobar.ERROR, "Failed to scrobble "+options.track) }
                );
            }
        },

        getPlaylist: function(options, callback, failcallback) {
            $.get("getlfmtrack.php?url="+options.url+"&sk="+lastfm_session_key)
            .done( callback )
            .complete( function(data) {
                playlist.saveTrackPlaylist(data.responseText)
            })
            .fail( failcallback )
        },

        getBuylinks: function(options, callback, failcallback) {
            addGetOptions(options, "track.getBuylinks");
            options.country = prefs.lastfm_country_code;
            LastFMGetRequest(
                options,
                callback,
                failcallback
            );
        }

    }

    this.album = {

        getInfo: function(options, callback, failcallback) {
            addGetOptions(options, "album.getInfo");
            if (username != "") { options.username = username }
            options.autocorrect = prefs.lastfm_autocorrect ? 1 : 0;
            LastFMGetRequest(
                options,
                callback,
                function() { failcallback({error: "Could not find information about this album"}); }
            );
        },

        getTags: function(options, callback, failcallback) {
            addGetOptions(options, "album.getTags");
            if (username != "") { options.user = username }
            LastFMGetRequest(
                options,
                callback,
                failcallback
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "album.addTags");
                LastFMSignedRequest(
                    options,
                    function() { callback("album", options.tags) },
                    function() { failcallback("album", options.tags) }
                );
            }
        },

        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "album.removeTag");
                LastFMSignedRequest(
                    options,
                    function() { callback("album", options.tag); },
                    function() { failcallback("album", options.tag); }
                );
            }
        },

        getBuylinks: function(options, callback, failcallback) {
            addGetOptions(options, "album.getBuylinks");
            options.country = prefs.lastfm_country_code;
            LastFMGetRequest(
                options,
                callback,
                failcallback
            );
        }

    }

    this.artist = {

        getInfo: function(options, callback, failcallback) {
            addGetOptions(options, "artist.getInfo");
            if (username != "") { options.username = username }
            LastFMGetRequest(
                options,
                callback,
                function() { failcallback({error: "Could not find information about this artist"}); }
            );
        },

        getTags: function(options, callback, failcallback) {
            if (username != "") { options.user = username }
            addGetOptions(options, "artist.getTags");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "artist.addTags");
                LastFMSignedRequest(
                    options,
                    function() { callback("artist", options.tags) },
                    function() { failcallback("artist", options.tags) }
                );
            }
        },


        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "artist.removeTag");
                LastFMSignedRequest(
                    options,
                    function() { callback("artist", options.tag); },
                    function() { failcallback("artist", options.tag); }
                );
            }
        },

        getImages: function(options, callback, failcallback) {
            addGetOptions(options, "artist.getImages");
            options.limit = "100";
            LastFMGetRequest(
                options,
                callback,
                function() { failcallback( {images: {}}); }
            );
        },

    }

    this.radio = {

        tune: function(options, callback, failcallback) {
            if (logged_in) {
                if (options.station != self.tunedto) {
                    debug.log("LAST FM       : Last.FM: Tuning to", options.station);
                    self.tunedto = "";
                    addSetOptions(options, "radio.tune");
                    LastFMSignedRequest(
                        options,
                        function(data) {
                            self.tunedto = options.station;
                            callback(data);
                        },
                        failcallback
                    );
                } else {
                    callback();
                }
            }
        },

        getPlaylist: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "radio.getPlaylist");
                var keys = getKeys(options);
                var it = "";
                for(var key in keys) {
                    it = it+keys[key]+options[keys[key]];
                }
                it = it+lastfm_secret;
                options.api_sig = hex_md5(it);
                $.post("http://ws.audioscrobbler.com/2.0/", options)
                    .done(  callback )
                    .fail(  failcallback );
            }
        }
    }

    this.user = {

        getNeighbours: function(options, callback, failcallback) {
            addGetOptions(options, "user.getNeighbours");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            )
        },

        getFriends: function(options, callback, failcallback) {
            addGetOptions(options, "user.getFriends");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            )
        },

        getTopTags: function(options, callback, failcallback) {
            addGetOptions(options, "user.getTopTags");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            )
        },

        getTopArtists: function(options, callback, failcallback) {
            addGetOptions(options, "user.getTopArtists");
            LastFMGetRequest(
                options,
                callback,
                failcallback
            )
        }

    }
}
