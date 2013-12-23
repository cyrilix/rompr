
<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
<?php
print '<img title="'.get_int_text('button_previous').'" class="clickicon controlbutton lettuce" onclick="playlist.previous()" src="newimages/media-skip-backward.png">';
print '<img title="'.get_int_text('button_play').'" class="shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="newimages/media-playback-pause.png">';
print '<img title="'.get_int_text('button_stop').'" class="shiftleft2 clickicon controlbutton lettuce" onclick="player.controller.stop()" src="newimages/media-playback-stop.png">';
print '<img title="'.get_int_text('button_stopafter').'" class="shiftleft3 clickicon controlbutton lettuce" onclick="playlist.stopafter()" id="stopafterbutton" src="newimages/stopafter.png">';
print '<img title="'.get_int_text('button_next').'" class="shiftleft4 clickicon controlbutton lettuce" onclick="playlist.next()" src="newimages/media-skip-forward.png">';
?>
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
        </div>
    </div>

    <div class="infobarlayout tleft bordered">
<?php
print '<div title="'.get_int_text('button_volume').'" id="volumecontrol" class="lettuce"><div id="volume"></div></div>';
?>
    </div>

    <div id="patrickmoore" class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" class="notexist" src="" />
        </div>
        <div id="lastfm" class="invisible">
<?php
print '<div><ul class="topnav"><img title="'.get_int_text('button_love').'" class="clickicon lettuce" id="love" onclick="nowplaying.love()" height="24px" src="newimages/lastfm-love.png"></ul></div>';
print '<div><ul class="topnav"><img title="'.get_int_text('button_ban').'" class="clickicon lettuce" id="ban" href="#" onclick="infobar.ban()" height="24px" src="newimages/lastfm-ban.png"></ul></div>';
?>
        </div>
        <div id="nowplaying"></div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">
</div>

<div id="bottompage">

<div id="sources" class="tleft column noborder">

    <div id="albumlist" class="invisible noborder">
    <div style="padding-left:12px">
<?php
print '<img title="'.get_int_text('button_searchmusic').'" onclick="toggleSearch()" class="topimg clickicon lettuce" height="20px" src="newimages/system-search.png">';
?>
    </div>
    <div id="search" class="invisible noborder"></div>
    <div id="collection" class="noborder"></div>
    </div>

    <div id="filelist" class="invisible">
    <div style="padding-left:12px">
<?php
print '<img title="'.get_int_text('button_searchfiles').'" href="#" onclick="toggleFileSearch()" class="topimg clickicon lettuce" height="20px" src="newimages/system-search.png">';
?>
    </div>
    <div id="filesearch" class="invisible searchbox">
    </div>
    <div id="filecollection" class="noborder"></div>
    </div>

    <div id="lastfmlist" class="invisible">
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
</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<?php
print '<div id="artistinformation" class="infotext"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
<div id="albuminformation" class="infotext"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
    <div id="horse" style="padding-left:12px">
<?php
print '<img title="'.get_int_text('button_playlistcontrols').'" onclick="togglePlaylistButtons()" class="topimg clickicon lettuce" height="20px" src="newimages/pushbutton.png">';
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
