
function LastFM(user) {

    var lastfm_secret="3ddf4cb9937e015ca4f30296a918a2b0";
    var logged_in = false;
    var username = user;
    var token = "";
    var scrobbling = false;
    var autocorrect = 0;
    this.tunedto = "";
    var self=this;

    //debug.log("New Last.FM session for", username);
    if (typeof lastfm_session_key != "undefined") {
        //debug.log("Session key is set");
        logged_in = true;
    }

    this.getScrobbling = function() {
        if (scrobbling) {
            return 1;
        } else {
            return 0;
        }
    }

    this.revealloveban = function() {
        if (logged_in) {
            $("#lastfm").fadeIn(2000);
        }
    }

    this.setscrobblestate = function() {
        scrobbling = $("#scrobbling").is(":checked");
        autocorrect = $("#autocorrect").is(":checked") ? 1 : 0
        if (scrobbling) { savePrefs({ lastfm_scrobbling: "1", lastfm_autocorrect: autocorrect });
        } else { savePrefs({ lastfm_scrobbling: "0", lastfm_autocorrect: autocorrect }); }
    }

    this.username = function() {
        return username;
    }

    this.login = function (user, pass) {

        //debug.log("Last.FM Logging in ",user);
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
            //debug.log("getToken:", data);
            token = $(data).find("token").text();

            var lfmlog = popupWindow.create(500,400,"lfmlog",true);
            $("#popupcontents").append('<table align="center" cellpadding="2" id="lfmlogintable" width="90%"></table>');
            $("#lfmlogintable").append('<tr><td><h3>Log In to Last.FM</h3></td></tr>');
            $("#lfmlogintable").append('<tr><td>Please click the button below to open the Last.FM website in a new tab. Enter your Last.FM login details if required then give RompR permission to access your account</td></tr>');
            $("#lfmlogintable").append('<tr><td>You can close the new tab when you have finished but do not close this dialog!</td></tr>');
            $("#lfmlogintable").append('<tr><td align="center"><a href="http://www.last.fm/api/auth/?api_key='+lastfm_api_key+'&token='+token+'" target="_blank">'+
                                        '<button class="topformbutton">Click Here To Log In</button></a></td></tr>');
            $("#lfmlogintable").append('<tr><td>Once you have logged in to Last.FM, click the OK button below to complete the process</td></tr>');
            $("#lfmlogintable").append('<tr><td align="center"><a href="#" onclick="javascript:lastfm.finishlogin()">'+
                                        '<button class="topformbutton">OK</button></a></td></tr>');

            popupWindow.open();
        });
    }

    this.finishlogin = function() {
        LastFMSignedRequest( {token: token, api_key: lastfm_api_key, method: "auth.getSession"},
                             function(data) {   lastfm_session_key = $(data).find("key").text();
                                                debug.log("Session key is ",lastfm_session_key);
                                                logged_in = true;
                                                savePrefs({ lastfm_session_key: lastfm_session_key,
                                                            lastfm_user: username
                                                        });
                                                reloadPlaylistControls();
                                                lastfm.revealloveban();
                                                popupWindow.close();
                                            },
                            function(data) {
                                                popupWindow.close();
                                                alert("Failed to log in to Last.FM");
                                                //debug.log(data);
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
            url=url+adder+keys[key]+"="+options[keys[key]];
            adder = "&";
        }
        // Don't use JQuery's getJSON function for cross-site requests as it ignores any
        // error callbacks you give it. I'm using the jsonp plugin, which works.
        $.jsonp({url: url,
                success: success,
                error: fail});
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

    function addGetOptions(options,method) {
        options.api_key = lastfm_api_key;
        options.method = method;
    }

    function addSetOptions(options, method) {
        options.api_key = lastfm_api_key;
        options.sk = lastfm_session_key;
        options.method = method;
    }

    this.track = {

        love : function(tr,ar,callback) {
            if (logged_in) {
                debug.log("Loving",tr,ar);
                LastFMSignedRequest({   api_key: lastfm_api_key,
                                        artist: ar,
                                        method: "track.love",
                                        sk: lastfm_session_key,
                                        track: tr },
                                        function() { callback(tr,ar);
                                        },
                                        function() { alert("Love Failed!"); }
                                    );
            }
        },

        unlove : function(tr,ar,callback) {
            if (logged_in) {
                LastFMSignedRequest({   api_key: lastfm_api_key,
                                        artist: ar,
                                        method: "track.unlove",
                                        sk: lastfm_session_key,
                                        track: tr },
                                        function() { callback(tr,ar); 
                                        },
                                        function() { alert("Unlove Failed!"); }
                                    );
            }
        },

        ban : function() {
            if (logged_in) {
                LastFMSignedRequest({   api_key: lastfm_api_key,
                                        artist: infobar.nowplaying.artist.name,
                                        method: "track.ban",
                                        sk: lastfm_session_key,
                                        track: infobar.nowplaying.track.name },
                                        function() { $("#ban").effect('pulsate', {times: 1}, 2000);
                                                    infobar.command("command=next");
                                        },
                                        function() { alert("Ban Failed!"); }
                                    );
            }
        },

        getInfo : function(options, callback, failcallback) {
            if (username != "") {
                options.username = username;
            }
            options.api_key = lastfm_api_key;
            options.autocorrect = autocorrect;
            options.method = "track.getInfo";
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        getTags: function(options, callback, failcallback) {
            if (username != "") {
                options.user = username;
            }
            options.autocorrect = autocorrect;
            options.api_key = lastfm_api_key;
            options.method = "track.getTags";
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                //debug.log(options);
                //debug.log("Adding tags to track");
                options.api_key = lastfm_api_key;
                options.sk = lastfm_session_key;
                options.method = "track.addTags";
                LastFMSignedRequest(    options,
                                        function(data) { callback("track", options.tags) },
                                        function(data) { failcallback("track", options.tags) }
                                    );
            }
        },

        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                //debug.log("Remove",options.artist,options.track,options.tag);
                options.api_key = lastfm_api_key;
                options.sk = lastfm_session_key;
                options.method = "track.removeTag"
                LastFMSignedRequest(options,
                                    function(data) { callback(options.tag); },
                                    function(data) { failcallback(options.tag); }
                                    );
            }
        },

        updateNowPlaying : function(options) {
            //debug.log("updateNowPlaying has been called");
            if (logged_in && scrobbling) {
                options.api_key = lastfm_api_key;
                options.sk = lastfm_session_key;
                options.method = "track.updateNowPlaying";
                LastFMSignedRequest(    options,
                                        function(data) {  },
                                        function(data) {  }
                                    );
            }
        },

        scrobble : function(options) {
            //debug.log("Scrobble has been called");
            if (logged_in && scrobbling) {
                options.api_key = lastfm_api_key;
                options.sk = lastfm_session_key;
                options.method = "track.scrobble";
                LastFMSignedRequest(    options,
                                        function(data) {  },
                                        function(data) {  }
                                    );
            }
        },

        getPlaylist: function(options, callback, failcallback) {
            $.get("getlfmtrack.php?url="+options.url+"&sk="+lastfm_session_key)
            .done( function(data) { callback(data) })
            .complete( function(data) { playlist.saveTrackPlaylist(data.responseText) })
            .fail( function(data) { failcallback(data) })
        },

        getBuylinks: function(options, callback, failcallback) {
            addGetOptions(options, "track.getBuylinks");
            options.autocorrect = autocorrect;
            options.country = lastfm_country_code;
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        }

    }

    this.album = {

        getInfo: function(options, callback, failcallback) {
            addGetOptions(options, "album.getInfo");
            debug.log("album.getinfo",options);
            if (username != "") { options.username = username }
            options.autocorrect = autocorrect;
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        getTags: function(options, callback, failcallback) {
            addGetOptions(options, "album.getTags");
            if (username != "") { options.user = username }
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "album.addTags");
                LastFMSignedRequest(    options,
                                        function(data) { callback("album", options.tags) },
                                        function(data) { failcallback("album", options.tags) }
                                    );
            }
        },

        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "album.removeTag");
                LastFMSignedRequest(options,
                                    function(data) { callback(options.tag); },
                                    function(data) { failcallback(options.tag); }
                                    );
            }
        },

        getBuylinks: function(options, callback, failcallback) {
            addGetOptions(options, "album.getBuylinks");
            options.autocorrect = autocorrect;
            options.country = lastfm_country_code;
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        }

    }

    this.artist = {

        getInfo: function(options, callback, failcallback) {
            addGetOptions(options, "artist.getInfo");
            if (username != "") { options.username = username }
            options.autocorrect = autocorrect;
            LastFMGetRequest(options,
                             function(data) { debug.log("Got artist Info",data); callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        getTags: function(options, callback, failcallback) {
            debug.log("Getting Tags", options);
            if (username != "") { options.user = username }
            options.autocorrect = autocorrect;
            addGetOptions(options, "artist.getTags");
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "artist.addTags");
                LastFMSignedRequest(    options,
                                        function(data) { callback("artist", options.tags) },
                                        function(data) { failcallback("artist", options.tags) }
                                    );
            }
        },


        removeTag: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "artist.removeTag");
                LastFMSignedRequest(options,
                                    function(data) { callback(options.tag); },
                                    function(data) { failcallback(options.tag); }
                                    );
            }
        },

        getImages: function(options, callback, failcallback) {
            addGetOptions(options, "artist.getImages");
            options.autocorrect = autocorrect;
            options.limit = "100";
            LastFMGetRequest(options,
                             function(data) { callback(data); },
                             function(data) { failcallback(data); }
            );
        },

    }

    this.radio = {

        tune: function(options, callback, failcallback) {
            if (logged_in) {
                debug.log("Last.FM: Tuning to", options.station);
                if (options.station != self.tunedto) {
                    debug.log("Sending Tune Request");
                    self.tunedto = "";
                    addSetOptions(options, "radio.tune");
                    LastFMSignedRequest(options,
                                        function(data) { self.tunedto = options.station;
                                                        callback(data);
                                        },
                                        function(data) { failcallback(data); }
                    );
                } else {
                    callback();
                }
            }
        },

        getPlaylist: function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "radio.getPlaylist");
                // We've passed an object but we need the properties to be in alphabetical order
                var keys = getKeys(options);
                var it = "";
                for(var key in keys) {
                    it = it+keys[key]+options[keys[key]];
                }
                it = it+lastfm_secret;
                options.api_sig = hex_md5(it);
                $.post("http://ws.audioscrobbler.com/2.0/", options)
                    .done( function(data) {  callback(data) })
                    .fail( function(data) { failcallback(data) });
            }
        }
    }

    this.user = {

        getNeighbours: function(options, callback, failcallback) {
            addGetOptions(options, "user.getNeighbours");
            LastFMGetRequest(options,
                    function(data) { callback(data); },
                    function(data) { failcallback(data); }
            )
        },

        getFriends: function(options, callback, failcallback) {
            addGetOptions(options, "user.getFriends");
            LastFMGetRequest(options,
                    function(data) { callback(data); },
                    function(data) { failcallback(data); }
            )
        }

    }
}
