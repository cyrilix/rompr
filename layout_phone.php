<body class="mobile">

<div id="infobar">
    <div id="notifications"></div>
    <div class="infobarlayout bordered">
        <div id="buttons">
            <div class="tleft">
            <img title="Previous Track" class="clickicon controlbutton" onclick="playlist.previous()" src="newimages/media-skip-backward.png">
            <img title="Play/Pause" class="shiftleft clickicon controlbutton" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="newimages/media-playback-pause.png">
            <img title="Stop" class="shiftleft2 clickicon controlbutton" onclick="player.controller.stop()" src="newimages/media-playback-stop.png">
            <img title="Stop After Current Track" class="shiftleft3 clickicon controlbutton" onclick="playlist.stopafter()" id="stopafterbutton" src="newimages/stopafter.png">
            <img title="Next Track" class="shiftleft4 clickicon controlbutton" onclick="playlist.next()" src="newimages/media-skip-forward.png">
            </div>
            <div id="playinginfo" class="tleft invisible">
            <div id="albumcover">
                <img id="albumpicture" src="" />
            </div>
            </div>
            <div id="lastfm" class="invisible">
            <div><ul class="topnav"><a title="Love this track" id="love" href="#" onclick="nowplaying.love()"><img height="20px" src="newimages/lastfm-love.png"></a></ul></div>
            <div><ul class="topnav"><a title="Ban this track" id="ban" href="#" onclick="infobar.ban()"><img height="20px" src="newimages/lastfm-ban.png"></a></ul></div>
            </div>
        </div>
        <div id="progress"></div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">
<div id="controls" class="noborder fullwidth">
<div id="nowplaying" class="tleft">
</div>
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
        <div class="expand">Your Radio Stations</div>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="podcastslist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/Apple_Podcast_logo.png"></div>
        <div class="expand">Podcasts</div>
    </div>
    <div id="podcastslist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="somafmlist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/somafm.png"></div>
        <div class="expand">Soma FM</div>
    </div>
    <div id="somafmlist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="bbclist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/bbcr.png"></div>
        <div class="expand">Live BBC Radio</div>
    </div>
    <div id="bbclist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="icecastlist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/icecast.png"></div>
        <div class="expand">Icecast Radio</div>
    </div>
    <div id="icecastlist" class="dropmenu">
    </div>

    </div>

    <div id="infopane" class="invisible infowiki">
        <div id="artistinformation" class="infotext"><h2 align="center">This is the information panel. Interesting stuff will appear here when you play some music</h2></div>
        <div id="albuminformation" class="infotext"></div>
        <div id="trackinformation" class="infotext"></div>
    </div>

    <div id="chooser" class="invisible noborder">
        <div id="choose_albumlist" class="chooser"><a href="#" onclick="sourcecontrol('albumlist')">Albums List</a></div>
        <div id="choose_filelist" class="chooser"><a href="#" onclick="sourcecontrol('filelist')">Files List</a></div>
        <div id="choose_lastfmlist" class="chooser"><a href="#" onclick="sourcecontrol('lastfmlist')">Last.FM</a></div>
        <div id="choose_radiolist" class="chooser"><a href="#" onclick="sourcecontrol('radiolist')">Radio Stations</a></div>
        <div id="chooseplaylist" class="chooser"><a href="#" onclick="sourcecontrol('playlistm')">Playlist</a></div>
        <div class="chooser"><a href="#" onclick="clearPlaylist()">Clear Playlist</a></div>
        <div class="chooser"><a href="#" onclick="sourcecontrol('playlistman')">Playlist Management</a></div>
        <div class="chooser"><a href="#" onclick="sourcecontrol('prefsm')">Preferences</a></div>
        <div class="chooser penbehindtheear"><a href="#" onclick="sourcecontrol('historypanel')">Info Panel History</a></div>
    </div>

    <div id="historypanel" class="invisible noborder">
    </div>

    <div id="playlistman" class="invisible noborder">
        <div class="pref">
            Save Playlist As
            <input class="winkle" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>
            <button onclick="savePlaylist()">Save</button>
        </div>
        <div class="pref">

            <div id="playlistslist"></div>
        </div>
    </div>

    <div id="prefsm" class="invisible noborder">
        <div class="pref"><b>THEME</b><select id="themeselector" class="topformbutton" onchange="changetheme()">
<?php
            $themes = glob("*.css");
            foreach($themes as $theme) {
                if ($theme != "layout.css" && $theme != "layout_mobile.css") {
                    print '<option value="'.$theme.'">'.preg_replace('/\.css$/', "", $theme).'</option>';
                }
            }
?>
            </select>
        </div>

        <div class="pref">
            <input type="checkbox" onclick="hidePanel('albumlist')" id="button_hide_albumlist">Hide Albums List</input>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="keepsearchopen()" id="button_keep_search_open">...but Keep Search Box Visible</input>
        </div>
<?php
if (!$mopidy_detected) {
?>
        <div class="pref">
            <input type="checkbox" onclick="hidePanel('filelist')" id="button_hide_filelist">Hide Files List</input>
        </div>
<?php
}
?>
        <div class="pref">
            <input type="checkbox" onclick="hidePanel('lastfmlist')" id="button_hide_lastfmlist">Hide Last.FM Stations</input>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="hidePanel('radiolist')" id="button_hide_radiolist">Hide Radio Stations</input>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="browser.hide()" id="hideinfobutton">Hide Information Panel</input>
        </div>

        <div class="pref">
            <input type="checkbox" onclick="togglePref('fullbiobydefault')" id="fullbiobydefault">Retrieve full artist biographies from Last.FM</input>
        </div>
        <div class="pref">
           <input type="checkbox" onclick="togglePref('lastfmlang')" id="lastfmlang">Use browser language for Last.FM</input>
        </div>
        <div class="pref">
           <input type="checkbox" onclick="togglePref('scrolltocurrent')" id="scrolltocurrent">Auto-Scroll playlist to current track</input>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="togglePref('downloadart')" id="downloadart">Automatically Download Covers</input>
        </div>

        <div class="pref">
            <span class="tiny">To use art from your music folders, enter the path to your music in this box:</span>
<?php
            print '<input class="winkle" name="music_directory_albumart" type="text" size="40" value="'.$prefs['music_directory_albumart'].'"/><button onclick="setMusicDirectory()">Set</button>';
?>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="togglePref('twocolumnsinlandscape')" id="twocolumnsinlandscape">Use 2 columns in landscape mode</input>
        </div>
        <div class="pref">
            Crossfade Duration:
<?php
            print '<input class="winkle" name="michaelbarrymore" type="text" size="3" value="'.$prefs['crossfade_duration'].'"/>';
?>
            <button onclick="setXfadeDur()">Set</button>
        </div>

        <div class="pref">
            <input type="checkbox" onclick="togglePref('updateeverytime')" id="updateeverytime">Update Collection On Start</input>
        </div>
        <div class="pref">
            <button onclick="player.controller.updateCollection('update')">Update Collection Now</button>
        </div>
<?php
if (!$mopidy_detected) {
?>
        <div class="pref">
            <button onclick="player.controller.updateCollection('rescan')">Full Collection Rescan</button>
        </div>
<?php
}
?>
        <div class="pref">
            <button onclick="editmpdoutputs()">MPD Audio Outputs...</button>
        </div>
        <div class="pref">
            <b>Last.FM</b>
        </div>
        <div class="pref">
            Last.FM Username
<?php
            print '<input class="winkle" name="user" type="text" size="30" value="'.$prefs['lastfm_user'].'"/><button onclick="lastfmlogin()">Login</button>';
?>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="lastfm.setscrobblestate()" id="scrobbling">Last.FM Scrobbling Enabled</input>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="lastfm.setscrobblestate()" id="radioscrobbling">Don&#39;t Scrobble Radio Tracks</input>
        </div>
        <div class="pref">
            Percentage of track to play before scrobbling
            <div id="scrobwrangler"></div>
        </div>
        <div class="pref">
            <input type="checkbox" onclick="lastfm.setscrobblestate()" id="autocorrect">Last.FM Autocorrect Enabled</input>
        </div>
        <div class="pref">
            Tag Loved Tracks With
<?php
            print '<input class="winkle" name="taglovedwith" type="text" size="40" value="'.$prefs['autotagname'].'"/><button onclick="setAutoTag()">Set</button>';
?>
        </div>

        <div class="pref">
            COUNTRY (for Last.FM) <select id="countryselector" onchange="changecountry()">
<?php
            $x = simplexml_load_file('iso3166.xml');
            foreach($x->CountryEntry as $i => $c) {
                print '<option value="'.$c->CountryCode.'">'.mb_convert_case($c->CountryName, MB_CASE_TITLE, "UTF-8")."</option>\n";
            }
?>
            </select>
        </div>

    </div>

</div>

<div id="playlistm" class="invisible fullwidth scroller">
    <div id="horse" style="padding-left:12px">
    <a title="Playlist Controls" href="#" onclick="togglePlaylistButtons()"><img class="topimg clickicon" height="20px" src="newimages/pushbutton.png"></a>
    </div>
    <div id="playlistbuttons" class="invisible searchbox">
        <table width="90%" align="center">
        <tr>
        <td align="right">SHUFFLE</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$mpd_status['random']].'" id="random" onclick="player.controller.toggleRandom()" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        $c = ($mpd_status['xfade'] == 0) ? 0 : 1;
        print '<img src="'.$prefsbuttons[$c].'" id="crossfade" onclick="player.controller.toggleCrossfade()" class="togglebutton clickicon" />';
?>
        </td>
        <td align="left">CROSSFADE</td>
        </tr>
        <tr>
        <td align="right">REPEAT</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$mpd_status['repeat']].'" id="repeat" onclick="player.controller.toggleRepeat()" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$mpd_status['consume']].'" id="consume" onclick="player.controller.toggleConsume()" class="togglebutton clickicon" />';
?>
        </td><td align="left">CONSUME</td>
        </tr>
        </table>
    </div>

    <div id="pscroller"><div id="sortable" class="noselection fullwidth"></div></div>
</div>



</div>
