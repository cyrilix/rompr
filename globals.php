
<script language="javascript">

var prefsInLocalStorage = ["hidebrowser", "sourceshidden", "playlisthidden", "infosource", "playlistcontrolsvisible",
                            "sourceswidthpercent", "playlistwidthpercent", "downloadart", "clickmode", "chooser",
                            "hide_albumlist", "hide_filelist", "hide_lastfmlist", "hide_radiolist", "twocolumnsinlandscape",
                            "shownupdatewindow", "keep_search_open", "showfileinfo", "scrolltocurrent", "lastfmlang", "user_lang"];

function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

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
            if (prefs.mopidy_detected) {
                prefs.hide_filelist = true;
                if (prefs.chooser == "filelist") {
                    prefs.chooser = "albumlist";
                }
            }
        },

        save: function(options, callback) {
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
                $.post('saveprefs.php', prefsToSave, function() {
                    if (callback) {
                        callback();
                    }
                });
            }
        }

    }
}();

var language = function() {

    var tags = {
<?php
foreach ($translations as $key => $value) {
    print "        ".$key.": \"".$value."\",\n";
}
?>
    };

    return {
        gettext: function(key, args) {
            if (tags[key] === undefined) {
                debug.error("LANGUAGE","Unknown key",key);
                return "UNKNOWN TRANSLATION KEY";
            } else {
                var s = tags[key];
                while (s.match(/\%s/)) {
                    s = s.replace(/\%s/, args.shift());
                }
                return escapeHtml(s);
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
print "var interfaceLanguage = '".$interface_language."';\n";
print "var browserLanguage = '".$browser_language."';\n";
// Three translation keys are need so regularly it makes sense to
// have them as static variables, instead of looking them up every time
print "var frequentLabels = {\n";
print "    of: '".get_int_text("label_of")."',\n";
print "    by: '".get_int_text("label_by")."',\n";
print "    on: '".get_int_text("label_on")."'\n";
print "};\n";
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
var playlistScrollOffset = 0;
</script>
