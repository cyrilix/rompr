
<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
            <img title="Previous Track" class="clickicon controlbutton lettuce" onclick="playlist.previous()" src="newimages/media-skip-backward.png">
            <img title="Play/Pause" class="shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="newimages/media-playback-pause.png">
            <img title="Stop" class="shiftleft2 clickicon controlbutton lettuce" onclick="player.controller.stop()" src="newimages/media-playback-stop.png">
            <img title="Stop After Current Track" class="shiftleft3 clickicon controlbutton lettuce" onclick="playlist.stopafter()" id="stopafterbutton" src="newimages/stopafter.png">
            <img title="Next Track" class="shiftleft4 clickicon controlbutton lettuce" onclick="playlist.next()" src="newimages/media-skip-forward.png">
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
        </div>
    </div>

    <div class="infobarlayout tleft bordered">
        <div title="Drag to change volume" id="volumecontrol" class="lettuce"><div id="volume"></div></div>
    </div>

    <div id="patrickmoore" class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" class="notexist" src="" />
        </div>
        <div id="lastfm" class="invisible">
            <div><ul class="topnav"><img title="Love this track" class="clickicon lettuce" id="love" onclick="nowplaying.love()" height="24px" src="newimages/lastfm-love.png"></ul></div>
            <div><ul class="topnav"><img title="Ban this track" class="clickicon lettuce" id="ban" href="#" onclick="infobar.ban()" height="24px" src="newimages/lastfm-ban.png"></ul></div>
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
    <img title="Search Music" onclick="toggleSearch()" class="topimg clickicon lettuce" height="20px" src="newimages/system-search.png">
    </div>
    <div id="search" class="invisible noborder"></div>
    <div id="collection" class="noborder"></div>
    </div>

    <div id="filelist" class="invisible">
    <div style="padding-left:12px">
    <img title="Search Files" href="#" onclick="toggleFileSearch()" class="topimg clickicon lettuce" height="20px" src="newimages/system-search.png">
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
        <div class="expand">Your Radio Stations</div>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="podcastslist"></div>
        <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/Apple_Podcast_logo.png"></div>
        <div class="expand">Podcasts<span id="total_unlistened_podcasts"></span><span></span></div>
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
</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<div id="artistinformation" class="infotext"><h2 align="center">This is the information panel. Interesting stuff will appear here when you play some music</h2></div>
<div id="albuminformation" class="infotext"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
    <div id="horse" style="padding-left:12px">
    <img title="Playlist Controls" onclick="togglePlaylistButtons()" class="topimg clickicon lettuce" height="20px" src="newimages/pushbutton.png">
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
