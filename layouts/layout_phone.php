<body class="mobile">

<div id="notifications"></div>

<div id="infobar">
    <div id="geoffreyboycott" class="infobarlayout bordered">
        <!-- <div class="clearfix" style="margin-bottom:4px;overflow:hidden"> -->
            <div id="buttons">
            <img class="clickicon controlbutton" onclick="playlist.previous()" src="newimages/media-skip-backward.png"><img class="shiftleft clickicon controlbutton" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="newimages/media-playback-pause.png"><img class="shiftleft2 clickicon controlbutton" onclick="player.controller.stop()" src="newimages/media-playback-stop.png"><img class="shiftleft3 clickicon controlbutton" onclick="playlist.stopafter()" id="stopafterbutton" src="newimages/stopafter.png"><img class="shiftleft4 clickicon controlbutton" onclick="playlist.next()" src="newimages/media-skip-forward.png">
            </div>
            <div id="patrickmoore">
                <div id="albumcover">
                    <img id="albumpicture" class="notexist" src="" />
                </div>
                <div id="nowplaying"><div id="nptext"></div></div>
            </div>
        <!-- </div> -->
        <div id="progress"></div>
    </div>

</div>

<div id="headerbar" class="noborder fullwidth">
    <div id="controls" class="noborder fullwidth clearfix">
        <div id="ihatecss">
            <img onclick="toggleSearch()" height="20px" src="newimages/system-search.png" />
        </div>
        <div id="stars" class="invisible">
            <img id="ratingimage" onclick="nowplaying.setRating(event)" height="20px" src="newimages/0stars.png" />
            <input type="hidden" value="-1" />
        </div>
        <div id="lastfm" class="invisible">
            <a id="love" href="#" onclick="nowplaying.love()"><img height="20px" src="newimages/lastfm-love.png"></a>
            <a id="ban" href="#" onclick="infobar.ban()"><img height="20px" src="newimages/lastfm-ban.png"></a>
        </div>
        <a href="#" onclick="sourcecontrol('chooser')"><img class="tright topimg" src="newimages/preferences.png" height="24px"></a>
        <a href="#" onclick="makeitbigger()"><img class="tright topimg" src="newimages/pushbutton.png" height="24px"></a>
        <div class="tright">
            <a href="#" onclick="showVolumeControl()"><img class="topimg" src="newimages/volume.png" height="24px"></a>
            <div id="volumecontrol">
                <div id="volume"></div>
            </div>
        </div>
    </div>
</div>

<div id="bottompage">

    <div id="sources" class="fullwdith noborder scroller">

        <div id="albumlist" class="invisible noborder">
            <div id="search" class="invisible searchbox">
<?php
include("player/".$prefs['player_backend']."/search.php");
?>
            </div>
            <div id="collection" class="noborder"></div>
        </div>

        <div id="filelist" class="invisible noborder">
<?php
if ($prefs['player_backend'] == "mpd") {
            print '<div style="padding-left:12px;padding-top:4px">
                <a title="Search Files" href="#" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="newimages/system-search.png"></a>
            </div>
            <div id="filesearch" class="invisible searchbox"></div>';
}
?>
            <div id="filecollection" class="noborder"></div>
        </div>

        <div id="lastfmlist" class="invisible noborder">
        </div>

        <div id="infopane" class="invisible infowiki">
<?php
            print '<div id="artistinformation" class="infotext"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
            <div id="albuminformation" class="infotext"></div>
            <div id="trackinformation" class="infotext"></div>
        </div>

        <div id="radiolist" class="invisible">
            <div class="containerbox menuitem noselection">
                <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="yourradiolist"></div>
                <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/broadcast-32.png"></div>
<?php
                print '<div class="expand">'.get_int_text('label_yourradio').'</div>';
?>
            </div>
            <div id="yourradiolist" class="dropmenu"></div>

            <div class="containerbox menuitem noselection">
                <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="podcastslist"></div>
                <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/Apple_Podcast_logo.png"></div>
<?php
                print '<div class="expand">'.get_int_text('label_podcasts').'<span id="total_unlistened_podcasts"></span><span></span></div>';
?>
            </div>
            <div id="podcastslist" class="dropmenu"></div>

            <div class="containerbox menuitem noselection">
                <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="loadSomaFM()" name="somafmlist"></div>
                <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/somafm.png"></div>
<?php
                print '<div class="expand">'.get_int_text('label_somafm').'</div>';
?>
                <img id="somawait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
            </div>
            <div id="somafmlist" class="dropmenu"></div>

            <div class="containerbox menuitem noselection">
                <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="loadBigRadio()" name="bbclist"></div>
                <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/broadcast-32.png"></div>
<?php
                print '<div class="expand">'.get_int_text('label_streamradio').'</div>';
?>
                <img id="bbcwait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
            </div>
            <div id="bbclist" class="dropmenu"></div>

            <div class="containerbox menuitem noselection">
                <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="refreshMyDrink()" name="icecastlist"></div>
                <div class="smallcover fixed"><img height="32px" width="32px" src="newimages/icecast.png"></div>
<?php
                print '<div class="expand">'.get_int_text('label_icecast').'</div>';
?>
                <img id="icewait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
            </div>
            <div id="icecastlist" class="dropmenu"></div>

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
                print '<button onclick="player.controller.savePlaylist()">'.get_int_text('button_save').'</button>';
?>
            </div>
            <div class="pref">
                <div id="playlistslist"></div>
            </div>
        </div>
        <div id="prefsm" class="invisible noborder">
<?php
debug_print("Doing Prefs Panel","INIT");
include("includes/prefspanel.php")
?>
        </div>
    </div>

<!-- playlistm is OUTSIDE of sources so that we can display in two colum mode -->
    <div id="playlistm" class="invisible fullwidth scroller">
<?php
debug_print("Doing Playlist","INIT");
include("layouts/playlist.php");
?>
</div>
</div>
