<body class="mobile">

<div id="infobar">
    <div id="notifications"></div>
    <div id="geoffreyboycott" class="infobarlayout bordered">
        <div id="buttons">
            <div class="tleft">
<img class="clickicon controlbutton" onclick="playlist.previous()" src="newimages/media-skip-backward.png"><img class="shiftleft clickicon controlbutton" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="newimages/media-playback-pause.png"><img class="shiftleft2 clickicon controlbutton" onclick="player.controller.stop()" src="newimages/media-playback-stop.png"><img class="shiftleft3 clickicon controlbutton" onclick="playlist.stopafter()" id="stopafterbutton" src="newimages/stopafter.png"><img class="shiftleft4 clickicon controlbutton" onclick="playlist.next()" src="newimages/media-skip-forward.png">
            </div>
            <div id="albumcover">
                <img id="albumpicture" class="notexist" src="" />
            </div>
        </div>
        <div id="progress"></div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">
<div id="controls" class="noborder fullwidth">
<div id="lastfm" class="invisible tleft">
<a id="love" href="#" onclick="nowplaying.love()"><img height="20px" src="newimages/lastfm-love.png"></a>
<a id="ban" href="#" onclick="infobar.ban()"><img height="20px" src="newimages/lastfm-ban.png"></a>
</div>
<div id="nowplaying" class="tleft"></div>
<a href="#" id="volbutton" onclick="sourcecontrol('chooser')"><img class="tright topimg" src="newimages/preferences.png" height="24px"></a>
<a href="#" onclick="makeitbigger()"><img class="tright topimg" src="newimages/pushbutton.png" height="24px"></a>
<div class="tright">
<a href="#" onclick="showVolumeControl()"><img class="topimg" src="newimages/volume.png" height="24px"></a>
<div id="volumecontrol"><div id="volume"></div></div>
</div>
</div>

<div id="bottompage">

<div id="sources" class="fullwdith noborder scroller">

    <div id="albumlist" class="invisible noborder">
    <div style="padding-left:12px">
    <a title="Search Music" href="#" onclick="toggleSearch()"><img class="topimg clickicon" height="20px" src="newimages/system-search.png"></a>
    </div>
    <div id="search" class="invisible searchbox"></div>
    <div id="collection" class="noborder"></div>
    </div>

    <div id="filelist" class="invisible noborder">
    <div style="padding-left:12px">
    <a title="Search Files" href="#" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="newimages/system-search.png"></a>
    </div>
    <div id="filesearch" class="invisible searchbox">
    </div>
    <div id="filecollection" class="noborder"></div>
    </div>

    <div id="lastfmlist" class="invisible noborder">
    </div>

    <div id="radiolist" class="invisible">
    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="yourradiolist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/broadcast-32.png"></div>
<?php
print '<div class="expand">'.get_int_text('label_yourradio').'</div>';
?>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="podcastslist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/Apple_Podcast_logo.png"></div>
<?php
print '<div class="expand">'.get_int_text('label_podcasts').'<span id="total_unlistened_podcasts"></span><span></span></div>';
?>
    </div>
    <div id="podcastslist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="somafmlist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/somafm.png"></div>
<?php
print '<div class="expand">'.get_int_text('label_somafm').'</div>';
?>
    </div>
    <div id="somafmlist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="bbclist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/bbcr.png"></div>
<?php
print '<div class="expand">'.get_int_text('label_bbcradio').'</div>';
?>
    </div>
    <div id="bbclist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="icecastlist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/icecast.png"></div>
<?php
print '<div class="expand">'.get_int_text('label_icecast').'</div>';
?>
    </div>
    <div id="icecastlist" class="dropmenu">
    </div>

    </div>

    <div id="infopane" class="invisible infowiki">
<?php
print '<div id="artistinformation" class="infotext"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
        <div id="albuminformation" class="infotext"></div>
        <div id="trackinformation" class="infotext"></div>
    </div>

    <div id="chooser" class="invisible noborder">
<?php
print '<div id="choose_albumlist" class="chooser"><a href="#" onclick="sourcecontrol(\'albumlist\')">'.get_int_text('button_local_music').'</a></div>';
print '<div id="choose_filelist" class="chooser"><a href="#" onclick="sourcecontrol(\'filelist\')">'.get_int_text('button_file_browser').'</a></div>';
print '<div id="choose_lastfmlist" class="chooser"><a href="#" onclick="sourcecontrol(\'lastfmlist\')">'.get_int_text('button_lastfm').'</a></div>';
print '<div id="choose_radiolist" class="chooser"><a href="#" onclick="sourcecontrol(\'radiolist\')">'.get_int_text('button_internet_radio').'</a></div>';
print '<div id="chooseplaylist" class="chooser"><a href="#" onclick="sourcecontrol(\'playlistm\')">'.get_int_text('button_playlist').'</a></div>';
print '<div class="chooser"><a href="#" onclick="clearPlaylist()">'.get_int_text('button_clearplaylist').'</a></div>';
print '<div class="chooser"><a href="#" onclick="sourcecontrol(\'playlistman\')">'.get_int_text('button_playman').'</a></div>';
print '<div class="chooser"><a href="#" onclick="sourcecontrol(\'prefsm\')">'.get_int_text('button_prefs').'</a></div>';
print '<div class="chooser penbehindtheear"><a href="#" onclick="sourcecontrol(\'historypanel\')">'.get_int_text('button_mob_history').'</a></div>';
?>
    </div>

    <div id="historypanel" class="invisible noborder">
    </div>

    <div id="playlistman" class="invisible noborder">
        <div class="pref">
    <?php
    print get_int_text('menu_saveplaylist');
    ?>
            <input class="winkle" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>
    <?php
    print '<button onclick="savePlaylist()">'.get_int_text('button_save').'</button>';
    ?>
        </div>
        <div class="pref">

            <div id="playlistslist"></div>
        </div>
    </div>

    <div id="prefsm" class="invisible noborder">





<?php
print '<div class="pref"><b>'.get_int_text('config_language').'</b><select id="langselector" class="topformbutton" onchange="changelanguage()">';
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

print '<div class="pref prefsection"><b>'.get_int_text('config_theme').'</b><select id="themeselector" class="topformbutton" onchange="changetheme()">';
$themes = glob("*.css");
foreach($themes as $theme) {
    if ($theme != "layout.css" && $theme != "layout_mobile.css") {
        print '<option value="'.$theme.'">'.preg_replace('/\.css$/', "", $theme).'</option>';
    }
}
print '</select></div>';

print '<div class="pref">
<div><input type="checkbox" onclick="hidePanel(\'albumlist\')" id="button_hide_albumlist">'.get_int_text('config_hidealbumlist').'</input></div>
<div><input type="checkbox" onclick="keepsearchopen()" id="button_keep_search_open">'.get_int_text('config_keepsearch').'</input></div>
</div>';

if (!$mopidy_detected) {
print '<div class="pref">
<input type="checkbox" onclick="hidePanel(\'filelist\')" id="button_hide_filelist">'.get_int_text('config_hidefileslist').'</input>
</div>';
}

print '<div class="pref">
<input type="checkbox" onclick="hidePanel(\'lastfmlist\')" id="button_hide_lastfmlist">'.get_int_text('config_hidelastfm').'</input>
</div>
<div class="pref prefsection">
<input type="checkbox" onclick="hidePanel(\'radiolist\')" id="button_hide_radiolist">'.get_int_text('config_hideradio').'</input>
</div>';


print '<div class="pref">
<input type="checkbox" onclick="togglePref(\'fullbiobydefault\')" id="fullbiobydefault">'.get_int_text('config_fullbio').'</input>
</div>
<div class="pref prefsection">
<div><b>'.get_int_text("config_lastfmlang").'</b></div>
<div><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="default">'.get_int_text('config_lastfmdefault').'</input></div>
<div><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="interface">'.get_int_text('config_lastfminterface').'</input></div>
<div><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="browser">'.get_int_text('config_lastfmbrowser').'</input></div>
<div><input type="radio" class="topcheck" onclick="changeLastFMLang()" name="clicklfmlang" value="user">'.get_int_text('config_lastfmlanguser').'</input><input class="winkle" name="userlanguage" style="width:4em;margin-left:1em" onkeyup="changeLastFMLang()" type="text" size="4" /></div>
<div><span class="tiny">'.get_int_text('config_langinfo').'</span></div>
</div>';

print '<div class="pref">
<input type="checkbox" onclick="togglePref(\'updateeverytime\')" id="updateeverytime">'.get_int_text('config_updateonstart').'</input>
</div>
<div class="pref">
<button onclick="player.controller.updateCollection(\'update\')">'.get_int_text('config_updatenow').'</button>
</div>';
if (!$mopidy_detected) {
    print '<div class="pref">
    <button onclick="player.controller.updateCollection(\'rescan\')">'.get_int_text('config_rescan').'</button>
    </div>';
}

print '<div class="pref prefsection">
<div><input type="checkbox" onclick="togglePref(\'sortbydate\')" id="sortbydate">'.get_int_text('config_sortbydate').'</input></div>
<div><input type="checkbox" onclick="togglePref(\'notvabydate\')" id="notvabydate">'.get_int_text('config_notvabydate').'</input></div>
<div><span class="tiny">'.get_int_text('config_dateinfo').'</span></div>
</div>';


print '<div class="pref">
<input type="checkbox" onclick="togglePref(\'downloadart\')" id="downloadart">'.get_int_text('config_autocovers').'</input>
</div>
<div class="pref prefsection">
<span class="tiny">'.get_int_text('config_musicfolders').'</span>
<input class="winkle" name="music_directory_albumart"  onkeyup="setMusicDirectory()" type="text" size="40" value="'.$prefs['music_directory_albumart'].'"/>
</div>';

print '<div class="pref">
<input type="checkbox" onclick="togglePref(\'scrolltocurrent\')" id="scrolltocurrent">'.get_int_text('config_autoscroll').'</input>
</div>
<div class="pref">
<input type="checkbox" onclick="togglePref(\'twocolumnsinlandscape\')" id="twocolumnsinlandscape">'.get_int_text('config_2columns').'</input>
</div>
<div class="pref prefsection">'.get_int_text('config_crossfade').'
<input class="winkle" name="michaelbarrymore" onkeyup="setXfadeDur()" type="text" size="3" value="'.$prefs['crossfade_duration'].'"/>
</div>';

print '<div class="pref prefsection"><b>'.get_int_text('config_audiooutputs').'</b>';
$outputdata = array();
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
    print '<div>'.$outputdata[$i]['outputname'];
    print '<img src="'.$prefsbuttons[$outputdata[$i]['outputenabled']].'" id="outputbutton'.$i.'" style="margin-left:12px" onclick="outputswitch(\''.$i.'\')" class="togglebutton clickicon" />';
    print "</div>";
}
print '</div>';
close_mpd($connection);

print '<div class="pref">
<img src="newimages/lastfm.png" height="24px" style="vertical-align:middle;margin-right:8px"/><b>'.get_int_text('label_lastfm').'</b>
</div>
<div class="pref">'.get_int_text('config_lastfmusername').'
<input class="winkle" name="user" type="text" size="30" value="'.$prefs['lastfm_user'].'"/><button onclick="lastfmlogin()">'.get_int_text('config_loginbutton').'</button>
</div>
<div class="pref">
<input type="checkbox" onclick="lastfm.setscrobblestate()" id="scrobbling">'.get_int_text('config_scrobbling').'</input>
</div>
<div class="pref">
<input type="checkbox" onclick="lastfm.setscrobblestate()" id="radioscrobbling">'.get_int_text('config_radioscrobbling').'</input>
</div>
<div class="pref">
<div>'.get_int_text('config_scrobblepercent').'</div>
<div id="scrobwrangler"></div>
</div>
<div class="pref">
<input type="checkbox" onclick="lastfm.setscrobblestate()" id="autocorrect">'.get_int_text('config_autocorrect').'</input>
</div>
<div class="pref">'.get_int_text('config_tagloved').'
<input class="winkle" name="taglovedwith" onkeyup="setAutoTag()" type="text" size="40" value="'.$prefs['autotagname'].'"/>
</div>
<div class="pref">'.get_int_text('config_country').'
<select id="countryselector" onchange="changecountry()">';
$x = simplexml_load_file('iso3166.xml');
foreach($x->CountryEntry as $i => $c) {
    print '<option value="'.$c->CountryCode.'">'.mb_convert_case($c->CountryName, MB_CASE_TITLE, "UTF-8")."</option>\n";
}
print '</select>
</div>';

?>
    </div>

</div>

<div id="playlistm" class="invisible fullwidth scroller">
    <div id="horse" style="padding-left:12px">
<?php
print '<a title="'.get_int_text('button_playlistcontrols').'" href="#" onclick="togglePlaylistButtons()"><img class="topimg clickicon" height="20px" src="newimages/pushbutton.png"></a>';
?>
    </div>
    <div id="playlistbuttons" class="invisible searchbox">
        <table width="90%" align="center">
        <tr>
<?php
print '<td align="right">'.get_int_text('button_shuffle').'</td>';
print '<td class="togglebutton">';
print '<img src="'.$prefsbuttons[$mpd_status['random']].'" id="random" onclick="player.controller.toggleRandom()" class="togglebutton clickicon" />';
print '</td>';
print '<td class="togglebutton">';
$c = ($mpd_status['xfade'] == 0) ? 0 : 1;
print '<img src="'.$prefsbuttons[$c].'" id="crossfade" onclick="player.controller.toggleCrossfade()" class="togglebutton clickicon" />';
print '</td>';
print '<td align="left">'.get_int_text('button_crossfade').'</td>';
print '</tr><tr>';
print '<td align="right">'.get_int_text('button_repeat').'</td>';
print '<td class="togglebutton">';
print '<img src="'.$prefsbuttons[$mpd_status['repeat']].'" id="repeat" onclick="player.controller.toggleRepeat()" class="togglebutton clickicon" />';
print '</td><td class="togglebutton">';
print '<img src="'.$prefsbuttons[$mpd_status['consume']].'" id="consume" onclick="player.controller.toggleConsume()" class="togglebutton clickicon" />';
print '</td><td align="left">'.get_int_text('button_consume').'</td>';
?>
        </tr>
        </table>
    </div>

    <div id="pscroller"><div id="sortable" class="noselection fullwidth"></div></div>
</div>



</div>
