function LastFM(user) {

    var lastfm_secret="3ddf4cb9937e015ca4f30296a918a2b0";
    var logged_in = false;
    var username = user;
    var token = "";
    var self=this;
    var lovebanshown = false;
    var queue = new Array();
    var throttle = null;
    var throttleTime = 1000;

    if (prefs.lastfm_session_key !== "" || typeof lastfm_session_key !== 'undefined') {
        logged_in = true;
    }

    this.getBuyLinks = function(data) {
        var html = "";
        if (data.affiliations) {
            if (data.affiliations.physicals) {
                html += '<li><b>'+language.gettext("lastfm_buyoncd")+'</b></li>';
                html += doBuyTable(getArray(data.affiliations.physicals.affiliation));
            }
            if (data.affiliations.downloads) {
                html += '<li><b>'+language.gettext("lastfm_download")+'</b></li>';
                html += doBuyTable(getArray(data.affiliations.downloads.affiliation));
            }
        }
        return html;
    }

    function doBuyTable(values) {
        var html = "";
        for(var i in values) {
            html += '<li><span><img width="12px" src="'+values[i].supplierIcon+'">&nbsp;<a href="'+values[i].buyLink+'" target="_blank">'+
                            values[i].supplierName+'</a>';
            if (values[i].price) {
                if (values[i].price.formatted) {
                    html += '&nbsp;&nbsp;'+values[i].price.formatted;
                } else {
                    html += '&nbsp;&nbsp;'+values[i].price.amount;
                }
            }
            html = html +'</span></li>';
        }
        return html;
    }

    this.setThrottling = function(t) {
        throttleTime = Math.max(500,t);
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

    this.getLanguage = function() {
        switch (prefs.lastfmlang) {
            case "default":
                return null;
                break;
            case "interface":
                return interfaceLanguage;
                break;
            case "browser":
                return browserLanguage;
                break;
            case "user":
                if (prefs.user_lang != "") {
                    return prefs.user_lang;
                } else {
                    return null;
                }
                break;
        }
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

            var lfmlog = popupWindow.create(500,400,"lfmlog",true,language.gettext("lastfm_loginwindow"));
            $("#popupcontents").append('<table align="center" cellpadding="2" id="lfmlogintable" width="90%"></table>');
            $("#lfmlogintable").append('<tr><td>'+language.gettext("lastfm_login1")+'</td></tr>');
            $("#lfmlogintable").append('<tr><td>'+language.gettext("lastfm_login2")+'</td></tr>');
            $("#lfmlogintable").append('<tr><td align="center"><a href="http://www.last.fm/api/auth/?api_key='+lastfm_api_key+'&token='+token+'" target="_blank">'+
                                        '<button>'+language.gettext("lastfm_loginbutton")+'</button></a></td></tr>');
            $("#lfmlogintable").append('<tr><td>'+language.gettext("lastfm_login3")+'</td></tr>');
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
                var lastfm_session_key = $(data).find("key").text();
                logged_in = true;
                prefs.save({
                    lastfm_session_key: lastfm_session_key,
                    lastfm_user: username
                });
                popupWindow.close();
            },
            function(data) {
                popupWindow.close();
                alert(language.gettext("lastfm_loginfailed"));
            }
        );
    }

    this.flushReqids = function() {
        clearTimeout(throttle);
        for (var i = queue.length-1; i >= 0; i--) {
            if (queue[i].flag == false && queue[i].reqid) {
                queue.splice(i, 1);
            }
        }
        throttle = setTimeout(lastfm.getRequest, throttleTime);
    }

    function LastFMGetRequest(options, cache, success, fail, reqid) {
        debug.trace("LASTFM","New Request");
        options.format = "json";
        if (!cache) {
            options.callback = "?";
        }
        var url = "http://ws.audioscrobbler.com/2.0/";
        var adder = "?";
        var keys = getKeys(options);
        for(var key in keys) {
            url=url+adder+keys[key]+"="+(options[keys[key]] == "?" ? "?" : encodeURIComponent(options[keys[key]]));
            adder = "&";
        }
        queue.push({url: url, success: success, fail: fail, flag: false, cache: cache, reqid: reqid, retries: 0});
        if (throttle == null && queue.length == 1) {
            lastfm.getRequest();
        }
    }

    this.getRequest = function() {
        var req = queue[0];
        clearTimeout(throttle);
        if (req) {
            if (req.flag) {
                debug.error("LASTFM","Request pulled from queue is already being handled!")
                return;
            }
            queue[0].flag = true;
            debug.trace("LASTFM","Taking next request from queue",req.url);
            // Don't use JQuery's getJSON function for cross-site requests as it ignores any
            // error callbacks you give it. I'm using the jsonp plugin, which works.
            if (req.url == "POST") {
                debug.log("LASTFM", "Handling POST request via queue");
                $.ajax({
                    method: "POST",
                    url: "http://ws.audioscrobbler.com/2.0/",
                    data: req.options,
                    dataType: 'xml',
                    timeout: 5000,
                    success: function(data,status,xhr) {
                        throttle = setTimeout(lastfm.getRequest, throttleTime);
                        req = queue.shift();
                        debug.log("LASTFM", req.options.method,"request success");
                        var s = $(data).find('lfm').attr("status");
                        if (s == "ok") {
                            req.success(data);
                        } else {
                            debug.warn("LASTFM","Last FM signed request failed with status",$(data).find('error').text(),xhr.status);
                            req.fail(data);
                        }
                    },
                    error: function(xhr,status,err) {
                        throttle = setTimeout(lastfm.getRequest, throttleTime);
                        req = queue.shift();
                        debug.error("LASTFM",req.options.method,"request error",xhr.status,status,err);
                        if (req.retries < 3) {
                            debug.log("LASTFM","Retrying...");
                            req.retries++;
                            req.flag = false;
                            queue.unshift(req);
                        } else {
                            req.fail(null);
                        }
                    }
                });
            } else if (req.cache) {
                var getit = $.ajax({
                    dataType: 'json',
                    url: 'browser/backends/getlfmdata.php?uri='+encodeURIComponent(req.url),
                    success: function(data) {
                        var c = getit.getResponseHeader('Pragma');
                        debug.debug("LASTFM","Request success",c,data);
                        if (c == "From Cache") {
                            throttle = setTimeout(lastfm.getRequest, 100);
                        } else {
                            throttle = setTimeout(lastfm.getRequest, throttleTime);
                        }
                        req = queue.shift();
                        if (data === null) {
                            data = {error: language.gettext("lastfm_error")};
                        }
                        if (data.error) {
                            if (req.reqid || req.reqid === 0) {
                                req.fail(data, req.reqid);
                            } else {
                                req.fail(data);
                            }
                        } else {
                            debug.trace("LASTFM","Calling success callback");
                            if (req.reqid || req.reqid === 0) {
                                req.success(data, req.reqid);
                            } else {
                                req.success(data);
                            }
                        }
                    },
                    error: function(xhr,status,err) {
                        throttle = setTimeout(lastfm.getRequest, throttleTime);
                        req = queue.shift();
                        debug.warn("LASTFM", "Get Request Failed",xhr.status,status,err);
                        if (req.reqid || req.reqid === 0) {
                            req.fail(null, req.reqid);
                        } else {
                            req.fail();
                        }
                    }
                });
            } else {
                $.jsonp({
                    url: req.url,
                    timeout: 30000,
                    success: function(data) {
                        debug.trace("LASTFM","Request success",data);
                        throttle = setTimeout(lastfm.getRequest, throttleTime);
                        req = queue.shift();
                        if (data.error) {
                            if (req.reqid || req.reqid === 0) {
                                req.fail(data, req.reqid);
                            } else {
                                req.fail(data);
                            }
                        } else {
                            debug.trace("LASTFM","Calling success callback");
                            if (req.reqid || req.reqid === 0) {
                                req.success(data, req.reqid);
                            } else {
                                req.success(data);
                            }
                        }
                    },
                    error: function(xhr,status,err) {
                        throttle = setTimeout(lastfm.getRequest, throttleTime);
                        req = queue.shift();
                        if (req.reqid || req.reqid === 0) {
                            debug.warn("LASTFM", "Get Request Failed",xhr.status,status,err);
                            req.fail(null, req.reqid);
                        } else {
                            req.fail();
                        }
                    }
                });
            }
        } else {
            throttle = null;
        }
    }

    // function LastFMSignedRequest(options, success, fail) {
    //     $.ajax({
    //         type: "POST",
    //         data: options,
    //         url: "utils/lastfm_proxy.php",
    //         dataType: 'xml',
    //         success: function(data) {
    //             var s = $(data).find('lfm').attr("status");
    //             if (s == "ok") {
    //                 success(data);
    //             } else {
    //                 debug.warn("LASTFM","Last FM signed request failed with status",$(data).find('error').text());
    //                 fail(data);
    //             }
    //         },
    //         error: function(data) {
    //             debug.error("LASTFM","Last FM signed request error",$(data.responseText).find('error').text());
    //             fail(data.responseText);
    //         }
    //     });
    // }

    function LastFMSignedRequest(options, success, fail) {

        // We've passed an object but we need the properties to be in alphabetical order
        var keys = getKeys(options);
        var it = "";
        for(var key in keys) {
            it = it+keys[key]+options[keys[key]];
        }
        it = it+lastfm_secret;
        options.api_sig = hex_md5(it);
        queue.push({
            url: "POST",
            options: options,
            success: success,
            fail: fail,
            flag: false,
            retries : 0
        });
        if (throttle == null && queue.length == 1) {
            lastfm.getRequest();
        }
        // $.post("http://ws.audioscrobbler.com/2.0/", options)
        //     .done( function(data) {
        //         var s = $(data).find('lfm').attr("status");
        //         if (s == "ok") {
        //             success(data);
        //         } else {
        //             debug.warn("LASTFM","Last FM signed request failed with status",$(data).find('error').text());
        //             fail(data);
        //         }
        //     })
        //     .fail( function(data) {
        //         debug.error("LASTFM","Last FM signed request error",$(data.responseText).find('error').text());
        //         fail(data);
        //     });
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
        options.sk = prefs.lastfm_session_key;
        options.method = method;
    }

    this.track = {

        love : function(options,callback) {
            if (logged_in) {
                addSetOptions(options, "track.love");
                LastFMSignedRequest(
                    options,
                    function() {
                        infobar.notify(infobar.NOTIFY, language.gettext("label_loved")+" "+options.track);
                        callback(true);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, language.gettext("label_lovefailed"));
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
                        infobar.notify(infobar.NOTIFY, language.gettext("label_unloved")+" "+options.track);
                        callback(false);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, language.gettext("label_unlovefailed"));
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
                        $("#ban").makeFlasher({flashtime:2, repeats: 1});
                        infobar.notify(infobar.NOTIFY, language.gettext("label_banned")+" "+options.track);
                    },
                    function() {
                        infobar.notify(infobar.ERROR, language.gettext("label_banfailed")+" "+options.track);
                    }
                );
            }
        },

        getInfo : function(options, callback, failcallback, reqid) {
            if (username != "") { options.username = username; }
            addGetOptions(options, "track.getInfo");
            if (self.getLanguage()) {
                options.lang = self.getLanguage();
            }
            LastFMGetRequest(
                options,
                true,
                callback,
                function(data) { failcallback({ error: 1,
                                                message: language.gettext("label_notrackinfo")}) },
                reqid
            );
        },

        getTags: function(options, callback, failcallback, reqid) {
            if (username != "") { options.user = username; }
            addGetOptions(options, "track.getTags");
            LastFMGetRequest(
                options,
                false,
                callback,
                failcallback,
                reqid
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
                    function() { debug.warn("LAST FM","Failed to update Now Playing",options) }
                );
            }
        },

        scrobble : function(options) {
            if (logged_in && prefs.lastfm_scrobbling) {
                debug.log("LAST FM","Last.FM is scrobbling");
                addSetOptions(options, "track.scrobble");
                LastFMSignedRequest(
                    options,
                    function() {  },
                    function() { infobar.notify(infobar.ERROR, language.gettext("label_scrobblefailed")+" "+options.track) }
                );
            }
        },

        getBuylinks: function(options, callback, failcallback) {
            addGetOptions(options, "track.getBuylinks");
            options.country = prefs.lastfm_country_code;
            LastFMGetRequest(
                options,
                true,
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
            if (self.getLanguage()) {
                options.lang = self.getLanguage();
            }
            LastFMGetRequest(
                options,
                true,
                callback,
                function() { failcallback({ error: 1,
                                            message: language.gettext("label_noalbuminfo")}); }
            );
        },

        getTags: function(options, callback, failcallback) {
            addGetOptions(options, "album.getTags");
            if (username != "") { options.user = username }
            LastFMGetRequest(
                options,
                false,
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
                true,
                callback,
                failcallback
            );
        }

    }

    this.artist = {

        getInfo: function(options, callback, failcallback) {
            addGetOptions(options, "artist.getInfo");
            if (username != "") { options.username = username }
            if (self.getLanguage()) {
                options.lang = self.getLanguage();
            }
            LastFMGetRequest(
                options,
                true,
                callback,
                function() { failcallback({error: 1,
                                            message: language.gettext("label_noartistinfo")}); }
            );
        },

        getTags: function(options, callback, failcallback) {
            if (username != "") { options.user = username }
            addGetOptions(options, "artist.getTags");
            LastFMGetRequest(
                options,
                false,
                callback,
                failcallback
            );
        },

        addTags : function(options, callback, failcallback) {
            if (logged_in) {
                addSetOptions(options, "artist.addTags");
                LastFMSignedRequest(
                    options,
                    false,
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

    this.library = {

        getTracks: function(perpage, page, callback, failcallback) {
            var options = {user: username,
                        page: page,
                           limit: perpage
                       };
            addGetOptions(options, "library.getTracks");
            LastFMGetRequest(
                options,
                callback,
                failcallback,
                1
            )
        }

    }
}
