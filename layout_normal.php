<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
            <img title="Previous Track" class="clickicon controlbutton" onclick="playlist.previous()" src="images/media-skip-backward.png">
            <img title="Play/Pause" class="shiftleft clickicon controlbutton" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="images/media-playback-pause.png">
            <img title="Stop" class="shiftleft2 clickicon controlbutton" onclick="playlist.stop()" src="images/media-playback-stop.png">
            <img title="Stop After Current Track" class="shiftleft3 clickicon controlbutton" onclick="playlist.stopafter()" id="stopafterbutton" src="images/stopafter.png">
            <img title="Next Track" class="shiftleft4 clickicon controlbutton" onclick="playlist.next()" src="images/media-skip-forward.png">
        </div>
        <div id="progress"></div>
        <div id="playbackTime">
            0:00 of 0:00
        </div>
    </div>

    <div class="infobarlayout tleft bordered">
        <div id="volumecontrol">
            <div id="volume">
            </div>
        </div>
    </div>

    <div id="patrickmoore" class="infobarlayout tleft bordered">
        <div id="albumcover">
            <img id="albumpicture" src="images/album-unknown.png" />
        </div>
        <div id="lastfm" class="invisible">
            <div><ul class="topnav"><a title="Love this track" id="love" href="#" onclick="infobar.love()"><img height="24px" src="images/lastfm-love.png"></a></ul></div>
            <div><ul class="topnav"><a title="Ban this track" id="ban" href="#" onclick="nowplaying.ban()"><img height="24px" src="images/lastfm-ban.png"></a></ul></div>
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
    <a title="Search Music" href="#" onclick="toggleSearch()"><img class="topimg clickicon" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="search" class="invisible noborder"></div>
    <div id="collection" class="noborder"></div>    
    </div>

    <div id="filelist" class="invisible">
    <div style="padding-left:12px">
    <a title="Search Files" href="#" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
    </div>
    <div id="filesearch" class="invisible searchbox">
    </div>
    <div id="filecollection" class="noborder"></div>   
    </div>

    <div id="lastfmlist" class="invisible">
    </div>

    <div id="radiolist" class="invisible">
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="yourradiolist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/broadcast-32.png"></div>
        <div class="expand">Your Radio Stations</div>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="somafmlist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/somafm.png"></div>
        <div class="expand">Soma FM</div>
    </div>
    <div id="somafmlist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="bbclist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/bbcr.png"></div>
        <div class="expand">Live BBC Radio</div>
    </div>
    <div id="bbclist" class="dropmenu">
    </div>
    
    <div class="containerbox menuitem noselection">
        <img src="images/toggle-closed.png" class="menu fixed" name="icecastlist">
        <div class="smallcover fixed"><img height="32px" width="32px" src="images/icecast.png"></div>
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
    <div style="padding-left:12px">
    <a title="Playlist Controls" href="#" onclick="togglePlaylistButtons()"><img class="topimg clickicon" height="20px" src="images/pushbutton.png"></a>
    </div>
        <div id="playlistbuttons" class="invisible searchbox">
        <table width="90%" align="center">
        <tr>
        <td align="right">SHUFFLE</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['random']].'" id="random" onclick="toggleoption(\'random\')" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        $c = ($prefs['crossfade'] == 0) ? 0 : 1;
        print '<img src="'.$prefsbuttons[$c].'" id="crossfade" onclick="toggleoption(\'crossfade\')" class="togglebutton clickicon" />';
?>
        </td>
        <td align="left">CROSSFADE</td>
        </tr>
        <tr>
        <td align="right">REPEAT</td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['repeat']].'" id="repeat" onclick="toggleoption(\'repeat\')" class="togglebutton clickicon" />';
?>
        </td>
        <td class="togglebutton">
<?php
        print '<img src="'.$prefsbuttons[$prefs['consume']].'" id="consume" onclick="toggleoption(\'consume\')" class="togglebutton clickicon" />';
?>
        </td><td align="left">CONSUME</td>
        </tr>
        </table>
    </div>

<div id="sortable" class="noselection fullwidth"></div>
</div>

</div>
</body>
