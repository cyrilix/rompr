
<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
<?php
print '<img title="'.get_int_text('button_previous').'" class="clickicon controlbutton lettuce" onclick="playlist.previous()" src="'.$ipath.'media-skip-backward.png">';
print '<img title="'.get_int_text('button_play').'" class="shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="'.$ipath.'media-playback-pause.png">';
print '<img title="'.get_int_text('button_stop').'" class="shiftleft2 clickicon controlbutton lettuce" onclick="player.controller.stop()" src="'.$ipath.'media-playback-stop.png">';
print '<img title="'.get_int_text('button_stopafter').'" class="shiftleft3 clickicon controlbutton lettuce" onclick="playlist.stopafter()" id="stopafterbutton" src="'.$ipath.'stopafter.png">';
print '<img title="'.get_int_text('button_next').'" class="shiftleft4 clickicon controlbutton lettuce" onclick="playlist.next()" src="'.$ipath.'media-skip-forward.png">';
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

    <div id="patrickmoore" class="infobarlayout tleft bordered noselection">
        <div id="albumcover">
            <img id="albumpicture" class="notexist" src="" />
        </div>
            <div id="nowplaying">
                <div id="nptext"></div>
            </div>
            <div id="amontobin" class="clearfix">
                <div id="stars" class="invisible">
                    <img id="ratingimage" onclick="nowplaying.setRating(event)" height="20px" src="newimages/0stars.png">
                    <input type="hidden" value="-1" />
                </div>
                <div id="lastfm" class="invisible">
<?php
print '<img title="'.get_int_text('button_love').'" class="clickicon lettuce" id="love" onclick="nowplaying.love()" height="20px" src="'.$ipath.'lastfm-love.png">';
print '<img title="'.get_int_text('button_ban').'" class="clickicon lettuce" id="ban" href="#" onclick="infobar.ban()" height="20px" src="'.$ipath.'lastfm-ban.png">';
?>
                </div>
                <div id="playcount"></div>
                <div id="dbtags" class="invisible">
                </div>
            </div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">

<div id="albumcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox leftbox">
<?php
print '<img title="'.get_int_text('button_local_music').'" onclick="sourcecontrol(\'albumlist\')" id="choose_albumlist" class="tooltip topimg" height="24px" src="'.$ipath.'audio-x-generic.png">';
print '<img title="'.get_int_text('button_searchmusic').'" onclick="toggleSearch()" id="choose_searcher" class="topimg tooltip" height="24px" src="'.$ipath.'system-search.png">';
print '<img title="'.get_int_text('button_file_browser').'" onclick="sourcecontrol(\'filelist\')" id="choose_filelist" class="tooltip topimg" height="24px" src="'.$ipath.'folder.png">';
print '<img title="'.get_int_text('button_internet_radio').'" onclick="sourcecontrol(\'radiolist\')" id="choose_radiolist" class="tooltip topimg" height="24px" src="'.$ipath.'broadcast-24.png">';
print '<a href="albumart.php" title="'.get_int_text('button_albumart').'" target="_blank" class="tooltip"><img class="topimg" src="'.$ipath.'cd_case.png" height="24px"></a>';
?>
</div>
<div class="fixed topbox">
<?php
print '<img id="sourcesresizer" height="24px" src="'.$ipath.'resize2.png" style="cursor:move">';
?>
</div>
</div>
</div>

<div id="infocontrols" class="cmiddle noborder tleft">
<div class="containerbox fullwidth">
<div class="fixed topbox">
<?php
 print '<img title="'.get_int_text('button_togglesources').'" class="tooltip clickicon" onclick="expandInfo(\'left\')" id="expandleft" height="24px" src="'.$ipath.'arrow-left-double.png" style="padding-left:4px">';
 ?>
</div>
<div class="expand containerbox center topbox">
<div id="chooserbuttons" class="noborder fixed">
<?php
print '<img title="'.get_int_text('button_back').'" id="backbutton" class="topimg tooltip" height="24px" src="'.$ipath.'backbutton_disabled.png">';
?>
<ul class="topnav">
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_history').'" class="tooltip"><img src="'.$ipath.'history_icon.png" class="topimg" height="24px"></a>';
?>
        <ul id="hpscr" class="subnav widel dropshadow">
            <div id="historypanel" class="clearfix">
<?php
print '<li class="wider"><b>'.get_int_text('menu_history').'</b></li>';
?>
            </div>
        </ul>
    </li>
</ul>
<?php
print '<img title="'.get_int_text('button_forward').'" id="forwardbutton" class="tooltip topimg" height="24px" src="'.$ipath.'forwardbutton_disabled.png">';
?>
</div>
</div>
<div class="fixed topbox">
<?php
print '<img height="24px" class="tooltip clickicon" title="'.get_int_text('button_toggleplaylist').'" onclick="expandInfo(\'right\')" id="expandright" src="'.$ipath.'arrow-right-double.png" style="padding-right:4px">';
?>
</div>
</div>
</div>

<div id="playlistcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<?php
print '<img id="playlistresizer" src="'.$ipath.'resize2.png" height="24px" style="cursor:move">';
?>
</div>
<div class="fixed topbox">

<ul class="topnav">
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_alarm').'" class="tooltip"><img id="alarmclock" class="topimg" src="'.$ipath.'alarmclock_false.png" height="24px"></a>';
print '<ul id="alarmpanel" class="subnav" style="background-color:transparent;left:-62px;width:150px;font-size:10pt;border:none"><div style="width:150px;height:191px;background-image:url(\''.$ipath.'alarmclock_150.png\')">';
print '<div style="height:70px;width:150px"></div>';
include ("plugins/alarmclock.php");
?>
        </div>
    </ul>
    </li>


    <li>
<?php
print '<a href="#" title="'.get_int_text('button_prefs').'" class="tooltip"><img class="topimg" src="'.$ipath.'preferences.png" height="24px"></a>';
print '<ul id="configpanel" class="subnav wide dropshadow">';
include ("includes/prefspanel.php");
?>
        </ul>
    </li>

    <li>
<?php
print '<a href="#" title="'.get_int_text('button_clearplaylist').'" class="tooltip"><img class="topimg" src="'.$ipath.'edit-clear-list.png" height="24px"></a>';
print '<ul id="clrplst" class="subnav dropshadow">';
print '<li><b>'.get_int_text('menu_clearplaylist').'</b></li>';
print '<li>';
print '<button style="width:100%" class="topformbutton" onclick="clearPlaylist()">'.get_int_text('button_imsure').'</button>';
?>
            </li>
        </ul>
    </li>
    <li>
<?php
print '<a href="#" title="'.get_int_text('button_loadplaylist').'" class="tooltip"><img class="topimg" src="'.$ipath.'document-open-folder.png" height="24px"></a>';
print '<ul id="lpscr" class="subnav wide dropshadow"><div id="playlistslist" class="clearfix">';
// print '<div class="containerbox"><div class="expand"><b>'.get_int_text("menu_radios").'</b></div></div>';
// print '<div class="containerbox vertical" id="pluginplaylists"></div>';
print '<div class="containerbox"><div class="expand"><b>'.get_int_text("menu_playlists").'</b></div></div>';
print '<div id="storedplaylists"></div>';
print '</div></ul>';
print '</li>';

print '<li>';
print '<a href="#" title="'.get_int_text('button_saveplaylist').'" class="tooltip"><img class="topimg" src="'.$ipath.'document-save.png" height="24px"></a>';
print '<ul id="saveplst" class="subnav wide dropshadow">';
print '<li class="wide"><b>'.get_int_text('menu_saveplaylist').'</b></li>';
print '<li class="wide">';
print '<input class="enter" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>';
print '<button class="topformbutton" onclick="player.controller.savePlaylist()">'.get_int_text('button_save').'</button>';
print '</li></ul></li>';
?>
</ul>
</div>
</div>
</div>

</div>

<div id="bottompage">

<div id="sources" class="tleft column noborder">

    <div id="albumlist" class="invisible noborder">
    <div id="search" class="invisible noborder selecotron">
<?php
include("player/".$prefs['player_backend']."/search.php");
?>
    </div>
    <div id="collection" class="noborder selecotron"></div>
    </div>

    <div id="filelist" class="invisible">
<?php
if ($prefs['player_backend'] == "mpd") {
    print '<div style="padding-left:12px;padding-top:4px">
<img title="'.get_int_text('button_searchfiles').'" href="#" onclick="toggleFileSearch()" class="topimg clickicon lettuce" height="20px" src="'.$ipath.'system-search.png">
    </div>
    <div id="filesearch" class="invisible searchbox selecotron">
    </div>';
}
?>
    <div id="filecollection" class="noborder selecotron"></div>
    </div>

    <div id="radiolist" class="invisible">

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" name="pluginplaylists"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'broadcast-32.png"></div>';
print '<div class="expand">'.get_int_text('label_pluginplaylists').'</div>';
?>
    </div>
    <div id="pluginplaylists" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" name="yourradiolist"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'broadcast-32.png"></div>';
print '<div class="expand">'.get_int_text('label_yourradio').'</div>';
?>
    </div>
    <div id="yourradiolist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" name="podcastslist"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'Apple_Podcast_logo.png"></div>';
print '<div class="expand">'.get_int_text('label_podcasts').'<span id="total_unlistened_podcasts"></span><span></span></div>';
?>
    </div>
    <div id="podcastslist" class="dropmenu">
    </div>

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'/toggle-closed-new.png" class="menu fixed" onclick="loadSomaFM()" name="somafmlist"></div>';
?>
<?php
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'somafm.png"></div>';
print '<div class="expand">'.get_int_text('label_somafm').'</div>';
?>
    <img id="somawait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
    </div>
    <div id="somafmlist" class="dropmenu"></div>

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" onclick="loadBigRadio()" name="bbclist"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'broadcast-32.png"></div>';
print '<div class="expand">'.get_int_text('label_streamradio').'</div>';
?>
    <img id="bbcwait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
    </div>
    <div id="bbclist" class="dropmenu"></div>

    <div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" onclick="refreshMyDrink()" name="icecastlist"></div>';
?>
<?php
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'icecast.png"></div>';
print '<div class="expand">'.get_int_text('label_icecast').'</div>';
?>
    <img id="icewait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
    </div>
    <div id="icecastlist" class="dropmenu"></div>

</div>
</div>

<div id="infopane" class="tleft cmiddle noborder infowiki">
<?php
print '<div id="artistinformation" class="infotext noselection"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
<div id="albuminformation" class="infotext noselection"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="tright column noborder">
<?php
include("layouts/playlist.php");
?>
</div>
</div>
