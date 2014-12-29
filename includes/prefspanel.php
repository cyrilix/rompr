<?php

$labia = strlen(htmlspecialchars_decode(get_int_text("settings_interface"), ENT_QUOTES));
if (strlen(htmlspecialchars_decode(get_int_text("config_theme"), ENT_QUOTES)) > $labia) {
    $labia = strlen(htmlspecialchars_decode(get_int_text("config_theme"), ENT_QUOTES));
}
if (strlen(htmlspecialchars_decode(get_int_text("config_fontsize"), ENT_QUOTES)) > $labia) {
    $labia = strlen(htmlspecialchars_decode(get_int_text("config_fontsize"), ENT_QUOTES));
}
if (strlen(htmlspecialchars_decode(get_int_text("config_fontname"), ENT_QUOTES)) > $labia) {
    $labia = strlen(htmlspecialchars_decode(get_int_text("config_fontname"), ENT_QUOTES));
}
if (strlen(htmlspecialchars_decode(get_int_text("config_icontheme"), ENT_QUOTES)) > $labia) {
    $labia = strlen(htmlspecialchars_decode(get_int_text("config_icontheme"), ENT_QUOTES));
}
$labia -= 2;

print '<div class="pref textcentre"><b>'.get_int_text('settings_appearance').'</b></div>';

// Theme
print '<div class="pref"><div style="display:inline-block;width:'.$labia.'em"><b>'.get_int_text('config_theme').'</b></div><select id="themeselector" class="saveomatic">';
$themes = glob("themes/*.css");
foreach($themes as $theme) {
    print '<option value="'.basename($theme).'">'.preg_replace('/\.css$/', "", basename($theme)).'</option>';
}
print '</select></div>';

// Icon Theme
print '<div class="pref"><div style="display:inline-block;width:'.$labia.'em"><b>'.get_int_text('config_icontheme').'</b></div><select id="iconthemeselector" class="saveomatic">';
$themes = glob("iconsets/*");
foreach($themes as $theme) {
    print '<option value="'.basename($theme).'">'.basename($theme).'</option>';
}
print '</select></div>';

// Font
print '<div class="pref"><div style="display:inline-block;width:'.$labia.'em"><b>'.get_int_text('config_fontname').'</b></div><select id="fontfamilyselector" class="saveomatic">';
$themes = glob("fonts/*.css");
foreach($themes as $theme) {
    print '<option value="'.preg_replace("#fonts/#", "", $theme).'">'.preg_replace('/fonts\/(.*?)\.css$/', "$1", $theme).'</option>';
}
print '</select></div>';

//Font Size
print '<div class="pref prefsection"><div style="display:inline-block;width:'.$labia.'em"><b>'.get_int_text('config_fontsize').'</b></div><select id="fontsizeselector" class="saveomatic">';
$themes = glob("sizes/*.css");
foreach($themes as $theme) {
    print '<option value="'.preg_replace("#sizes/#", "", $theme).'">'.preg_replace('/sizes\/\d+-(.*?)\.css$/', "$1", $theme).'</option>';
}
print '</select></div>';


// Sources Panel Hiding
print '<div class="pref textcentre"><b>'.get_int_text('settings_panels').'</b></div>';
print '<div class="pref">
<div><input class="autoset toggle" type="checkbox" id="hide_albumlist">'.get_int_text('config_hidealbumlist').'</input></div>
</div>';
print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="hide_filelist">'.get_int_text('config_hidefileslist').'</input>
</div>';
if ($layout == "desktop") {
    print '<div class="pref">';
} else {
    print '<div class="pref prefsection">';
}
print '<input class="autoset toggle" type="checkbox" id="hide_radiolist">'.get_int_text('config_hideradio').'</input>
</div>';
if ($layout == "desktop") {
print '<div class="pref prefsection">
<input class="autoset toggle" type="checkbox" id="hidebrowser">'.get_int_text('config_hidebrowser').'</input>
</div>';
}

// Biography and Language
print '<div class="pref textcentre ucfirst"><b>'.get_int_text('settings_language').'</b></div>';

print '<div class="pref"><div style="display:inline-block;margin-right:2em"><b>'.get_int_text('settings_interface').'</b></div><select id="langselector" onchange="changelanguage()">';
$langs = glob("international/*.php");
foreach($langs as $lang) {
    if (basename($lang) != "en.php" && basename($lang) != $interface_language.".php") {
        include($lang);
    }
}
foreach($langname as $key => $value) {
    print '<option value="'.$key.'">'.$value.'</option>';
}
print '</select></div>';

print '<div class="pref">
<div><b>'.get_int_text("config_lastfmlang").'</b></div>
<div><input type="radio" class="topcheck savulon" name="lastfmlang" value="default">'.get_int_text('config_lastfmdefault').'</input></div>
<div><input type="radio" class="topcheck savulon" name="lastfmlang" value="interface">'.get_int_text('config_lastfminterface').'</input></div>
<div><input type="radio" class="topcheck savulon" name="lastfmlang" value="browser">'.get_int_text('config_lastfmbrowser').'</input></div>
<div><input type="radio" class="topcheck savulon" name="lastfmlang" value="user">'.get_int_text('config_lastfmlanguser').'</input><input class="saveotron" id="user_lang" style="width:4em;margin-left:1em" type="text" size="4" /></div>
<div><span class="tiny">'.get_int_text('config_langinfo').'</span></div>
</div>';

print '<div class="pref prefsection"><b>'.get_int_text('config_country').'</b><select class="prefinput saveomatic" id="lastfm_country_codeselector">';
$x = simplexml_load_file('iso3166.xml');
foreach($x->CountryEntry as $i => $c) {
    print '<option value="'.$c->CountryCode.'">'.mb_convert_case($c->CountryName, MB_CASE_TITLE, "UTF-8")."</option>\n";
}
print '</select>
</div>';

// Local Music Options
print '<div class="pref textcentre ucfirst"><b>'.get_int_text('button_local_music').'</b></div>';
print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="updateeverytime">'.get_int_text('config_updateonstart').'</input>
</div>
<div class="pref textcentre">
<button onclick="checkCollection(true, false)">'.get_int_text('config_updatenow').'</button>
</div>';
if ($prefs['player_backend'] == "mpd") {
    print '<div class="pref textcentre">
    <button onclick="checkCollection(true, true)">'.get_int_text('config_rescan').'</button>
    </div>';
} else {
    print '<div class="pref">
    <input class="autoset toggle" type="checkbox" id="ignore_unplayable">'.get_int_text('config_ignore_unplayable').'</input>
    </div>';
}
if ($prefs['apache_backend'] == "sql") {
    print '<div class="pref">
    <input class="autoset toggle" type="checkbox" id="onthefly">'.get_int_text('config_onthefly').'</input>
    </div>';
}
print '<div class="pref prefsection"></div>';
print '<div class="pref textcentre ucfirst"><b>'.get_int_text('config_sortoptions').'</b></div>';

print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="sortbycomposer">'.get_int_text('config_sortbycomposer').'</input>
</div>';
print '<div class="pref indent">
<input class="autoset toggle" type="checkbox" id="composergenre">'.get_int_text('config_composergenre').'</input>
</div>';
print '<div class="pref indent">
<input class="saveotron prefinput" id="composergenrename" type="text" size="40" />
</div>';
print '<div class="pref indent">
<input class="autoset toggle" type="checkbox" id="displaycomposer">'.get_int_text('config_displaycomposer').'</input>
</div>';

if ($prefs['apache_backend'] == "sql") {
    print '<div class="pref"><b>'.get_int_text('config_artistfirst').'
    <input class="saveotron prefinput arraypref" id="artistsatstart" type="text" size="256" />
    </b></div>';
    print '<div class="pref"><b>'.get_int_text('config_nosortprefixes').'
    <input class="saveotron prefinput arraypref" id="nosortprefixes" type="text" size="128" />
    </b></div>';
    print '<div class="pref"><b>'.get_int_text('config_sortcollectionby').'</b>';
    print '<div><input type="radio" class="topcheck savulon" name="sortcollectionby" value="artist">'.get_int_text('label_artist').'</input></div>
    <div><input type="radio" class="topcheck savulon" name="sortcollectionby" value="album">'.get_int_text('label_album').'</input></div>';
    print '</div>';
}

// Album Sorting
print '<div class="pref prefsection">
<div><input class="autoset toggle" type="checkbox" id="sortbydate">'.get_int_text('config_sortbydate').'</input></div>
<div><input class="autoset toggle" type="checkbox" id="notvabydate">'.get_int_text('config_notvabydate').'</input></div>
<div><span class="tiny">'.get_int_text('config_dateinfo').'</span></div>
</div>';

// Album Art
print '<div class="pref textcentre"><b>'.get_int_text('albumart_title').'</b></div>';
print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="downloadart">'.get_int_text('config_autocovers').'</input>
</div>
<div class="pref prefsection">
<span class="tiny">'.get_int_text('config_musicfolders').'</span>
<input class="saveotron prefinput" id="music_directory_albumart" type="text" size="40" />
</div>';

// Interface
print '<div class="pref textcentre"><b>'.get_int_text('settings_interface').'</b></div>';
if ($layout == "desktop") {
print '<div class="pref textcentre"><button onclick="shortcuts.edit()">'.get_int_text('config_editshortcuts').'</button></div>'."\n";
}
print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="scrolltocurrent">'.get_int_text('config_autoscroll').'</input>
</div>';
print '<div class="pref">
<input class="autoset toggle" type="checkbox" id="fullbiobydefault">'.get_int_text('config_fullbio').'</input>
</div>';
print '<div class="pref prefsection">
<input class="autoset toggle" type="checkbox" id="consumeradio">'.get_int_text('config_consumeradio').'</input>
</div>';

// Click Policy
print '<div class="pref prefsection" id="clickpolicy">';
print '<div class="pref textcentre"><b>'.get_int_text('config_clicklabel').'</b></div>';
print '<div><input type="radio" class="topcheck savulon" name="clickmode" value="double">'.get_int_text('config_doubleclick').'</input></div>
<div><input type="radio" class="topcheck savulon" name="clickmode" value="single">'.get_int_text('config_singleclick').'</input></div>
</div>';

// Audio Outputs
print '<div class="pref textcentre"><b>'.get_int_text('config_audiooutputs').'</b>';
include("player/".$prefs['player_backend']."/outputs.php");
print '</div>';
print '<div class="pref prefsection">'.get_int_text('config_crossfade').'
<input class="saveotron prefinput" id="crossfade_duration" type="text" size="3""/>
</div>';

// Last.FM
print '<div class="pref textcentre">
<i class="icon-lastfm-1 medicon"></i><b>'.get_int_text('label_lastfm').'</b>
</div>
<div class="pref">'.get_int_text('config_lastfmusername').'
<input class="prefinput" name="user" type="text" size="30" value="'.$prefs['lastfm_user'].'"/><button onclick="lastfmlogin()">'.get_int_text('config_loginbutton').'</button>
</div>
<div class="pref">
<input class="autoset toggle" type="checkbox" id="lastfm_scrobbling">'.get_int_text('config_scrobbling').'</input>
</div>
<div class="pref">
<div>'.get_int_text('config_scrobblepercent').'</div>
<div id="scrobwrangler"></div>
</div>
<div class="pref">
<input class="autoset toggle" type="checkbox" id="lastfm_autocorrect">'.get_int_text('config_autocorrect').'</input>
</div>
<div class="pref prefsection">'.get_int_text('config_tagloved').'
<input class="prefinput saveotron" id="autotagname" type="text" size="40" />
</div>';

// Tags and Ratings
if ($prefs['apache_backend'] == "sql") {
print '<div class="pref textcentre">
<b>'.get_int_text('config_tagrat').'</b>
</div>
<div class="pref">
<input class="autoset toggle" type="checkbox" id="synctags">'.get_int_text('config_synctags').'</input>';
?>
</div>
<div class="pref prefsection">
<?php
print '<input class="autoset toggle" type="checkbox" id="synclove">'.get_int_text('config_loveis').'</input>'."\n";
?>
<select id="synclovevalueselector" class="saveomatic">
<?php
print '<option value="5">5 '.get_int_text('stars').'</option>
<option value="4">4 '.get_int_text('stars').'</option>
<option value="3">3 '.get_int_text('stars').'</option>
<option value="2">2 '.get_int_text('stars').'</option>
<option value="1">1 '.get_int_text('star').'</option>';
?>
</select>
</div>
<?php
}
?>

