
<script language="javascript">

var prefsInLocalStorage = ["sourceshidden", "playlisthidden", "infosource", "playlistcontrolsvisible",
                            "sourceswidthpercent", "playlistwidthpercent", "downloadart", "clickmode", "chooser",
                            "hide_albumlist", "hide_filelist", "hide_radiolist", "hidebrowser",
                            "shownupdatewindow", "scrolltocurrent", "volume", "alarm_ramptime", "alarm_snoozetime",
                            "lastfmlang", "user_lang", "fontsize", "fontfamily", "alarmtime", "alarmon", "synctags",
                            "synclove", "synclovevalue", "alarmramp", "radiomode", "radioparam", "onthefly",
                            "theme", "icontheme", "coversize"];

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

print "var layout = '".$layout."';\n";
print 'var prefs = '.json_encode($prefs)."\n";
?>

prefs.updateLocal = function() {
    prefsInLocalStorage.forEach(function(p) {
        if (localStorage.getItem("prefs."+p) != null && localStorage.getItem("prefs."+p) != "") {
            prefs[p] = JSON.parse(localStorage.getItem("prefs."+p));
        }
    });
    if (layout == "phone") {
        prefs.clickmode = 'single';
    }
}

prefs.save = function(options, callback) {
    var prefsToSave = {};
    var postSave = false;
    for (var i in options) {
        prefs[i] = options[i];
        if (prefsInLocalStorage.indexOf(i) > -1) {
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

function convertPrefs() {
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

convertPrefs();
prefs.updateLocal();
if (prefs.infosource == "slideshow") {
    // slideshow plugin has been removed since last.fm have removed artist.getImages from their API
    prefs.infosource = "lastfm";
}

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
if (preg_match('#^/usr/share/rompr/#', $_SERVER['SCRIPT_FILENAME'])) {
    print "var debinstall = true;\n";
} else {
    print "var debinstall = false;\n";
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
var playlistScrollOffset = 0;
var albumScrollOffset = 0;
</script>
