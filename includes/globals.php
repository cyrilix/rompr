
<script language="javascript">

<?php
$searchlimits = array(  "local" => "Local Files",
                        "spotify" => "Spotify",
                        "soundcloud" => "Soundcloud",
                        "beets" => "Beets",
                        "beetslocal" => "Beets Local",
                        "gmusic" => "Google Play Music",
                        "youtube" => "YouTube",
                        "internetarchive" => "Internet Archive",
                        "leftasrain" => "Left As Rain",
                        "podcast" => "Podcasts",
                        "tunein" => "Tunein Radio",
                        // Note that radio-de is here as radio_de. Can't have a prefs key with a
                        // - sign in it because javascript tries to do maths on it.
                        "radio_de" => "Radio.de",
                        );

print "var skin = '".$skin."';\n";
print 'var prefs = '.json_encode($prefs)."\n";
?>

prefs.prefsInLocalStorage = ["sourceshidden", "playlisthidden", "infosource", "playlistcontrolsvisible",
                            "sourceswidthpercent", "playlistwidthpercent", "downloadart", "clickmode", "chooser",
                            "hide_albumlist", "hide_filelist", "hide_radiolist", "hidebrowser",
                            "shownupdatewindow", "scrolltocurrent", "volume", "alarm_ramptime", "alarm_snoozetime",
                            "lastfmlang", "user_lang", "fontsize", "fontfamily", "alarmtime", "alarmon", "synctags",
                            "synclove", "synclovevalue", "alarmramp", "radiomode", "radioparam", "onthefly",
                            "theme", "icontheme", "coversize"];

// Update old pre-JSON prefs
if (localStorage.getItem("prefs.prefversion") == null) {
    for (var i in window.localStorage) {
        if (i.match(/^prefs\.(.*)/)) {
            var val = localStorage.getItem(i);
            if (val === "true") {
                val = true;
            }
            if (val === "false") {
                val = false;
            }
            localStorage.setItem(i, JSON.stringify(val));
        }
    }
    localStorage.setItem('prefs.prefversion', JSON.stringify(2));
}

// Read in locally saved prefs
prefs.prefsInLocalStorage.forEach(function(p) {
    if (localStorage.getItem("prefs."+p) != null && localStorage.getItem("prefs."+p) != "") {
        prefs[p] = JSON.parse(localStorage.getItem("prefs."+p));
    }
});

$("#albumcoversize").attr("href", "coversizes/"+prefs.coversize);
$("#theme").attr("href", "themes/"+prefs.theme);
$("#fontsize").attr("href", "sizes/"+prefs.fontsize);
$("#fontfamily").attr("href", "fonts/"+prefs.fontfamily);
$("#icontheme-theme").attr("href", "iconsets/"+prefs.icontheme+"/theme.css");
$("#icontheme-adjustments").attr("href", "iconsets/"+prefs.icontheme+"/adjustments.css");

prefs.checkSet = function(key) {
    if (prefs.prefsInLocalStorage.indexOf(key) > -1) {
        if (localStorage.getItem("prefs."+key) != null && localStorage.getItem("prefs."+key) != "") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

prefs.save = function(options, callback) {
    var prefsToSave = {};
    var postSave = false;
    for (var i in options) {
        prefs[i] = options[i];
        if (prefs.prefsInLocalStorage.indexOf(i) > -1) {
            debug.log("PREFS", "Setting",i,"to",options[i],"in local storage");
            localStorage.setItem("prefs."+i, JSON.stringify(options[i]));
        } else {
            debug.log("PREFS", "Setting",i,"to",options[i],"on backend");
            prefsToSave[i] = options[i];
            postSave = true;
        }
    }
    if (postSave) {
        $.post('saveprefs.php', {prefs: JSON.stringify(prefsToSave)}, function() {
            if (callback) {
                callback();
            }
        });
    } else if (callback) {
        callback();
    }
}

var language = function() {

<?php
print "    var tags = ".json_encode($translations);
?>

    return {
        gettext: function(key, args) {
            if (key === null) {
                return "";
            }
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
        },

        getUCtext: function(key, args) {
            return language.gettext(key, args).toUpperCase();
        }

    }
}();

<?php
if ($prefs['apache_backend'] == "sql") {
    print "var albumslistexists = ".check_albumslist().";\n";
} else {
    if (file_exists(ROMPR_XML_COLLECTION)) {
        print "var albumslistexists = true;\n";
    } else {
        print "var albumslistexists = false;\n";
    }
}
if (file_exists(ROMPR_FILEBROWSER_LIST) || $prefs['player_backend'] == "mopidy") {
    // Mopidy doesn't require a files list as it's generated on the fly
    print "var fileslistexists = true;\n";
} else {
    print "var fileslistexists = false;\n";
}
if ($prefs['debug_enabled']) {
    print "debug.setLevel(8);\n";
} else {
    print "debug.setLevel(0);\n";
}

print "var interfaceLanguage = '".$interface_language."';\n";
print "var browserLanguage = '".$browser_language."';\n";
// Three translation keys are needed so regularly it makes sense to
// have them as static variables, instead of looking them up every time
print "var frequentLabels = {\n";
print "    of: '".get_int_text("label_of")."',\n";
print "    by: '".get_int_text("label_by")."',\n";
print "    on: '".get_int_text("label_on")."'\n";
print "};\n";
print 'var mopidy_version = "'.ROMPR_MOPIDY_MIN_VERSION.'";'."\n";
?>
var lastfm_api_key = "15f7532dff0b8d84635c757f9f18aaa3";
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
var last_selected_element = null;
var textSaveTimer = null;
var scrobwrangler = null;
var serverTimeOffset = 0;
</script>
