<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("international.php");
$mopidy_detected = detect_mopidy();
?>

<div id="albumcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox leftbox">
<?php
print '<img title="'.get_int_text('button_local_music').'" onclick="sourcecontrol(\'albumlist\')" id="choose_albumlist" class="tooltip topimg" height="24px" src="newimages/audio-x-generic.png">';
print '<img title="'.get_int_text('button_file_browser').'" onclick="sourcecontrol(\'filelist\')" id="choose_filelist" class="tooltip topimg" height="24px" src="newimages/folder.png">';
print '<img title="'.get_int_text('button_lastfm').'" onclick="sourcecontrol(\'lastfmlist\')" id="choose_lastfmlist" class="tooltip topimg" height="24px" src="newimages/lastfm.png">';
print '<img title="'.get_int_text('button_internet_radio').'" onclick="sourcecontrol(\'radiolist\')" id="choose_radiolist" class="tooltip topimg" height="24px" src="newimages/broadcast-24.png">';
print '<a href="albumart.php" title="'.get_int_text('button_albumart').'" target="_blank" class="tooltip"><img class="topimg" src="newimages/cd_jewel_case.jpg" height="24px"></a>';
?>
</div>
<div class="fixed topbox">
<img id="sourcesresizer" height="24px" src="newimages/resize2.png" style="cursor:move">
</div>
</div>
</div>

<div id="infocontrols" class="cmiddle noborder tleft">
<div class="containerbox fullwidth">
<div class="fixed topbox">
<?php
 print '<img title="'.get_int_text('button_togglesources').'" class="tooltip clickicon" onclick="expandInfo(\'left\')" id="expandleft" height="24px" src="newimages/arrow-left-double.png" style="padding-left:4px">';
 ?>
</div>
<div class="expand containerbox center topbox">
<div id="chooserbuttons" class="noborder fixed">
<?php
print '<img title="'.get_int_text('button_back').'" id="backbutton" class="topimg tooltip" height="24px" src="newimages/backbutton_disabled.png">';
?>
<ul class="topnav">
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_history').'" class="tooltip"><img src="newimages/history_icon.png" class="topimg" height="24px"></a>';
?>
        <ul id="hpscr" class="subnav widel">
            <div id="historypanel" class="clearfix">
<?php
print '<li class="wider"><b>'.get_int_text('menu_history').'</b></li>';
?>
            </div>
        </ul>
    </li>
</ul>
<?php
print '<img title="'.get_int_text('button_forward').'" id="forwardbutton" class="tooltip topimg" height="24px" src="newimages/forwardbutton_disabled.png">';
?>
</div>
</div>
<div class="fixed topbox">
<?php
print '<img height="24px" class="tooltip clickicon" title="'.get_int_text('button_toggleplaylist').'" onclick="expandInfo(\'right\')" id="expandright" src="newimages/arrow-right-double.png" style="padding-right:4px">';
?>
</div>
</div>
</div>

<div id="playlistcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<img id="playlistresizer" src="newimages/resize2.png" height="24px" style="cursor:move">
</div>
<div class="fixed topbox">
<ul class="topnav">
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_prefs').'" class="tooltip"><img class="topimg" src="newimages/preferences.png" height="24px"></a>';
print '<ul id="configpanel" class="subnav wide">';
print '<li class="wide"><b>'.get_int_text('menu_config').'</b></li>';

print '<li class="wide">'.get_int_text('config_language').' <select id="langselector" class="topformbutton" onchange="changelanguage()">';
$langs = glob("international/*.php");
foreach($langs as $lang) {
    if (basename($lang) != "en.php" && basename($lang) != $interface_language.".php") {
        include($lang);
    }
}
foreach($langname as $key => $value) {
    print '<option value="'.$key.'">'.$value.'</option>';
}
print '</select></li>';

print '<li class="wide">'.get_int_text('config_theme').' <select id="themeselector" class="topformbutton" onchange="changetheme()">';
$themes = glob("*.css");
foreach($themes as $theme) {
    if ($theme != "layout.css" && $theme != "layout_mobile.css") {
        print '<option value="'.$theme.'">'.preg_replace('/\.css$/', "", $theme).'</option>';
    }
}
print '</select></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel(\'albumlist\')" id="button_hide_albumlist">'.get_int_text('config_hidealbumlist').'</input></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="keepsearchopen()" id="button_keep_search_open">'.get_int_text('config_keepsearch').'</input></li>';
if (!$mopidy_detected) {
    print '<li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel(\'filelist\')" id="button_hide_filelist">'.get_int_text('config_hidefileslist').'</input></li>';
}
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel(\'lastfmlist\')" id="button_hide_lastfmlist">'.get_int_text('config_hidelastfm').'</input></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel(\'radiolist\')" id="button_hide_radiolist">'.get_int_text('config_hideradio').'</input></li>';

print '<li class="wide"><hr /></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'fullbiobydefault\')" id="fullbiobydefault">'.get_int_text('config_fullbio').'</input></li>';
print '<li class="wide"><b>'.get_int_text("config_lastfmlang").'</b></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="default">'.get_int_text('config_lastfmdefault').'</input></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="interface">'.get_int_text('config_lastfminterface').'</input></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="browser">'.get_int_text('config_lastfmbrowser').'</input></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="user">'.get_int_text('config_lastfmlanguser').'</input><input class="enter topform" name="userlanguage" style="width:4em;margin-left:1em" onkeyup="changeLastFMLang()" type="text" size="4" /></li>';
print '<li class="wide tiny">'.get_int_text('config_langinfo').'</li>';

print '<li class="wide"><hr /></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'updateeverytime\')" id="updateeverytime">'.get_int_text('config_updateonstart').'</input></li>'."\n";
print '<li class="wide"><button class="topformbutton" onclick="player.controller.updateCollection(\'update\')">'.get_int_text('config_updatenow').'</button></li>'."\n";
if (!$mopidy_detected) {
    print '<li class="wide"><button class="topformbutton" onclick="player.controller.updateCollection(\'rescan\')">'.get_int_text('config_rescan').'</button></li>'."\n";
}
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'sortbydate\')" id="sortbydate">'.get_int_text('config_sortbydate').'</input></li>'."\n";
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'notvabydate\')" id="notvabydate">'.get_int_text('config_notvabydate').'</input></li>'."\n";
print '<li class="wide tiny">'.get_int_text('config_dateinfo').'</li>';
print '<li class="wide"><b>'.get_int_text('config_clicklabel').'</b></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="double">'.get_int_text('config_doubleclick').'</input></li>';
print '<li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="single">'.get_int_text('config_singleclick').'</input></li>';

print '<li class="wide"><hr /></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'downloadart\')" id="downloadart">'.get_int_text('config_autocovers').'</input></li>';
print '<li class="wide tiny">'.get_int_text('config_musicfolders').'</li>';
print '<li class="wide"><input class="enter topform" name="music_directory_albumart" onkeyup="setMusicDirectory()" type="text" size="40" value="'.$prefs['music_directory_albumart'].'"/></li>';

print '<li class="wide"><hr /></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref(\'scrolltocurrent\')" id="scrolltocurrent">'.get_int_text('config_autoscroll').'</input></li>';
print '<li class="wide">'.get_int_text('config_crossfade').'<input class="enter topform" name="michaelbarrymore" type="text" onkeyup="setXfadeDur()" size="3" style="width:3em;margin-left:1em" value="'.$prefs['crossfade_duration'].'"/></li>';

print '<li class="wide"><button class="topformbutton" onclick="editkeybindings()">'.get_int_text('config_editshortcuts').'</button></li>'."\n";


print '<li class="wide"><hr /></li>';
print '<li class="wide"><b>'.get_int_text('config_audiooutputs').'</b></li>'."\n";
$outputs = do_mpd_command($connection, "outputs", null, true);
foreach ($outputs as $i => $n) {
    if (is_array($n)) {
        foreach ($n as $a => $b) {
            debug_print($i." - ".$b.":".$a,"AUDIO OUTPUT");
            $outputdata[$a][$i] = $b;
        }
    } else {
        debug_print($i." - ".$n,"AUDIO OUTPUT");
        $outputdata[0][$i] = $n;
    }
}

for ($i = 0; $i < count($outputdata); $i++) {
    print '<li class="wide">'.$outputdata[$i]['outputname'];
    print '<img src="'.$prefsbuttons[$outputdata[$i]['outputenabled']].'" id="outputbutton'.$i.'" style="margin-left:12px" onclick="outputswitch(\''.$i.'\')" class="togglebutton clickicon" />';
    print "</li>'\n";
}

print '<li class="wide"><hr /></li>';
print '<li class="wide"><img src="newimages/lastfm.png" height="24px" style="vertical-align:middle;margin-right:8px"/><b>'.get_int_text('label_lastfm').'</b></li>';
print '<li class="wide">'.get_int_text('config_lastfmusername').'</li>';
print '<li class="wide"><input class="enter topform" name="user" type="text" size="45" value="'.$prefs['lastfm_user'].'"/><button class="topformbutton" onclick="lastfmlogin()">'.get_int_text('config_loginbutton').'</button></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="scrobbling">'.get_int_text('config_scrobbling').'</input></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="radioscrobbling">'.get_int_text('config_radioscrobbling').'</input></li>';
print '<li class="wide">'.get_int_text('config_scrobblepercent').'</li>';
print '<li class="wide"><div id="scrobwrangler"></div></li>';
print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="autocorrect">'.get_int_text('config_autocorrect').'</input></li>';
print '<li class="wide">'.get_int_text('config_tagloved').'</li>';
print '<li class="wide"><input class="enter topform" name="taglovedwith" onkeyup="setAutoTag()" type="text" size="40" value="'.$prefs['autotagname'].'"/></li>';

print '<li class="wide">'.get_int_text('config_country').' <select id="countryselector" class="topformbutton" onchange="changecountry()">'."\n";
$x = simplexml_load_file('iso3166.xml');
foreach($x->CountryEntry as $i => $c) {
    print '<option value="'.$c->CountryCode.'">'.mb_convert_case($c->CountryName, MB_CASE_TITLE, "UTF-8")."</option>\n";
}
print "</select></li>\n";

?>
        </ul>
    </li>

    <li>
<?php
print '<a href="#" title="'.get_int_text('button_clearplaylist').'" class="tooltip"><img class="topimg" src="newimages/edit-clear-list.png" height="24px"></a>';
print '<ul id="clrplst" class="subnav">';
print '<li><b>'.get_int_text('menu_clearplaylist').'</b></li>';
print '<li>';
print '<button style="width:100%" class="topformbutton" onclick="clearPlaylist()">'.get_int_text('button_imsure').'</button>';
?>
            </li>
        </ul>
    </li>
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_loadplaylist').'" class="tooltip"><img class="topimg" src="newimages/document-open-folder.png" height="24px"></a>';
print '<ul id="lpscr" class="subnav wide"><div id="playlistslist" class="clearfix"></div></ul>';
print '</li>';

print '<li>';
print '<a href="#" title="'.get_int_text('button_saveplaylist').'" class="tooltip"><img class="topimg" src="newimages/document-save.png" height="24px"></a>';
print '<ul id="saveplst" class="subnav wide">';
print '<li class="wide"><b>'.get_int_text('menu_saveplaylist').'</b></li>';
print '<li class="wide">';
print '<input class="enter topform" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>';
print '<button class="topformbutton" onclick="savePlaylist()">'.get_int_text('button_save').'</button>';
print '</li></ul></li>';
?>
</ul>
</div>
</div>
</div>
<?php
close_mpd($connection);
?>

<script language="javascript">
    $("#scrobbling").attr("checked", prefs.lastfm_scrobbling);
    $("#radioscrobbling").attr("checked", prefs.dontscrobbleradio);
    $("#autocorrect").attr("checked", prefs.lastfm_autocorrect);
    $("#button_hide_albumlist").attr("checked", prefs.hide_albumlist);
    $("#button_keep_search_open").attr("checked", prefs.keep_search_open);
    $("#button_hide_filelist").attr("checked", prefs.hide_filelist);
    $("#button_hide_lastfmlist").attr("checked", prefs.hide_lastfmlist);
    $("#button_hide_radiolist").attr("checked", prefs.hide_radiolist);
    $("#updateeverytime").attr("checked", prefs.updateeverytime);
    $("#downloadart").attr("checked", prefs.downloadart);
    $("#fullbiobydefault").attr("checked", prefs.fullbiobydefault);
    $("#scrolltocurrent").attr("checked", prefs.scrolltocurrent);
    $("#sortbydate").attr("checked", prefs.sortbydate);
    $("#notvabydate").attr("checked", prefs.notvabydate);
    $("#themeselector").val(prefs.theme);
    if (prefs.language) {
        $("#langselector").val(prefs.language);
    }
    $("#countryselector").val(prefs.lastfm_country_code);
    $("[name=clickselect][value="+prefs.clickmode+"]").attr("checked", true);
    $("[name=clicklfmlang][value="+prefs.lastfmlang+"]").attr("checked", true);
    $("[name=userlanguage]").val(prefs.user_lang);
    $("#playlistcontrols .enter").keyup( onKeyUp );
    $(".tooltip").tipTip({delay: 1000});
</script>