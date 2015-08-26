
<script language="javascript">

<?php

print "var skin = '".$skin."';\n";
print 'var prefs = '.json_encode($prefs)."\n";
?>

prefs.prefsInLocalStorage = [
    "sourceshidden",
    "playlisthidden",
    "infosource",
    "playlistcontrolsvisible",
    "sourceswidthpercent",
    "playlistwidthpercent",
    "downloadart",
    "clickmode",
    "chooser",
    "hide_albumlist",
    "hide_filelist",
    "hide_radiolist",
    "hidebrowser",
    "shownupdatewindow",
    "scrolltocurrent",
    "alarmtime",
    "alarmon",
    "alarm_ramptime",
    "alarm_snoozetime",
    "lastfmlang",
    "user_lang",
    "synctags",
    "synclove",
    "synclovevalue",
    "alarmramp",
    "radiomode",
    "radioparam",
    "consumeradio",
    "theme",
    "icontheme",
    "coversize",
    "fontsize",
    "fontfamily",
    "mediacentremode",
    "collectioncontrolsvisible",
    "displayresultsas",
    "crossfade_duration",
    "radiocountry",
    "search_limit_limitsearch",
    "scrobblepercent",
    "updateeverytime",
    "fullbiobydefault",
    "mopidy_search_domains",
    "skin",
    "outputsvisible",
    "wheelscrollspeed"
];

// 'skin' is stored in local storage - it's only use is for setting the correct item
// in the dropdown.

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

// Because this is used to set the radio buttons to the correct state
prefs.currenthost = getCookie('currenthost');
// Because player_backend might be overridden by another user in another browser
setCookie('player_backend',prefs.player_backend,1);

$("#albumcoversize").attr("href", "coversizes/"+prefs.coversize);
setTheme(prefs.theme);
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
        debug.log("PREFS",JSON.stringify(prefsToSave),prefsToSave);
        $.post('saveprefs.php', {prefs: JSON.stringify(prefsToSave)}, function() {
            if (callback) {
                callback();
            }
        });
    } else if (callback) {
        callback();
    }
}

function setTheme(theme) {
    $('html').css('background-image', '');
    $('html').css('background-size', '');
    $('html').css('background-repeat', '');
    $("#theme").attr("href", "themes/"+theme);
    $.getJSON('backimage.php?getbackground='+theme, function(data) {
        if (data.image) {
            $('html').css('background-image', 'url("'+data.image+'")');
            $('html').css('background-size', 'cover');
            $('html').css('background-repeat', 'no-repeat');
            $('#cusbgname').html(data.image.split(/[\\/]/).pop())
        } else {
            $('#cusbgname').html('');
        }
    });
}

function clearBgImage() {
    $('html').css('background-image', '');
    $.getJSON('backimage.php?clearbackground='+prefs.theme, function(data) {
        $('[name=imagefile').val('');
    });
    $('#cusbgname').html('');
}

var google_api_key = "AIzaSyDAErKEr1g1J3yqHA0x6Ckr5jubNIF2YX4";

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
print "var collection_status = ".checkCollectionStatus().";\n";
print "prefs.skin = '".$skin."';\n";
print "debug.setLevel(".$prefs['debug_enabled'].");\n";

print "var interfaceLanguage = '".$interface_language."';\n";
print "var browserLanguage = '".$browser_language."';\n";
print "var rompr_version = '".ROMPR_VERSION."';\n";
print "var mopidy_min_version = '".ROMPR_MOPIDY_MIN_VERSION."';\n";
print "var player_ip = '".get_player_ip()."';\n";
if ($oldmopidy) {
    print "var mopidy_is_old = true;\n";
} else {
    print "var mopidy_is_old = false;\n";
}
// Three translation keys are needed so regularly it makes sense to
// have them as static variables, instead of looking them up every time
print "var frequentLabels = {\n";
print "    of: '".get_int_text("label_of")."',\n";
print "    by: '".get_int_text("label_by")."',\n";
print "    on: '".get_int_text("label_on")."'\n";
print "};\n";
?>
</script>
