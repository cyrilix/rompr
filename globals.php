
<script language="javascript">

var prefsInLocalStorage = ["hidebrowser", "sourceshidden", "playlisthidden", "infosource", "playlistcontrolsvisible",
                            "sourceswidthpercent", "playlistwidthpercent", "downloadart", "clickmode", "chooser",
                            "hide_albumlist", "hide_filelist", "hide_lastfmlist", "hide_radiolist", "twocolumnsinlandscape",
                            "shownupdatewindow", "keep_search_open", "showfileinfo", "scrolltocurrent"];

var prefs = function() {

    var useLocal = false;
    if ("localStorage" in window && window["localStorage"] != null) {
        useLocal = true;
    }

    return {
<?php
 foreach ($prefs as $index => $value) {
    if ($index == 'clickmode' && $mobile != "no") {
        $value = 'single';
    }
    if ($value == "true" || $value == "false" || is_numeric($value)) {
        print "        ".$index.": ".$value.",\n";
    } else {
        print "        ".$index.": '".$value."',\n";
    }
}
?>
        updateLocal: function() {
            if (useLocal) {
                prefsInLocalStorage.forEach(function(p) {
                    if (localStorage.getItem("prefs."+p) != null && localStorage.getItem("prefs."+p) != "") {
                        prefs[p] = localStorage.getItem("prefs."+p);
                        if (prefs[p] == "false") {
                            prefs[p] = false;
                        }
                        if (prefs[p] == "true") {
                            prefs[p] = true;
                        }
                    }
                });
            }
            if (prefs.use_mopidy_tagcache == 1 ||
                prefs.use_mopidy_http == 1) {
                prefs.hide_filelist = true;
                if (prefs.chooser == "filelist") {
                    prefs.chooser = "albumlist";
                }
            }
        },

        save: function(options) {
            var prefsToSave = {};
            var postSave = false;
            for (var i in options) {
                prefs[i] = options[i];
                if (options[i] === true || options[i] === false) {
                    options[i] = options[i].toString();
                }
                if (useLocal) {
                    if (prefsInLocalStorage.indexOf(i) > -1) {
                        localStorage.setItem("prefs."+i, options[i]);
                    } else {
                        prefsToSave[i] = options[i];
                        postSave = true;
                    }
                } else {
                    prefsToSave[i] = options[i];
                    postSave = true;
                }
            }
            if (postSave) {
                $.post('saveprefs.php', prefsToSave);
            }
        }

    }
}();

prefs.updateLocal();
if (prefs.infosource == "slideshow") {
    // slideshow plugin has been removed since last.fm have removed artist.getImages from their API
    prefs.infosource = "lastfm";
}

<?php
if (file_exists($ALBUMSLIST)) {
    print "var albumslistexists = true;\n";
} else {
    print "var albumslistexists = false;\n";
}
if (file_exists($FILESLIST)) {
    print "var fileslistexists = true;\n";
} else {
    print "var fileslistexists = false;\n";
}
if (preg_match('#^/usr/share/rompr/#', $_SERVER['SCRIPT_FILENAME'])) {
    print "var debinstall = true;\n";
} else {
    print "var debinstall = false;\n";
}
print "var lang = '".substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2)."';\n";
?>
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";
var lastfm_session_key;
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
var last_selected_element = null;
var landscape = false;
var itisbigger = false;
// TODO why are these global?
var gotNeighbours = false;
var gotFriends = false;
var gotTopTags = false;
var gotTopArtists = false;
var scrobwrangler = null;
var serverTimeOffset = 0;
var prefsbuttons = ["newimages/button-off.png", "newimages/button-on.png"];

</script>
