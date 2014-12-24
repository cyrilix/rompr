<?php
debug_print("Doing Layout For PHONE","LAYOUT");
?>
<body class="mobile">

<div id="notifications"></div>
<div id="headerbar" class="noborder fullwidth containerbox">
<div id="albumcontrols" class="fixed noborder">
<?php
print '<i title="'.get_int_text('button_now_playing').'" onclick="layoutProcessor.sourceControl(\'infobar\')" id="choose_nowplaying" class="icon-play-circled tooltip topimg"></i>';
print '<img title="'.get_int_text('button_local_music').'" onclick="layoutProcessor.sourceControl(\'albumlist\')" id="choose_albumlist" class="tooltip topimg" src="'.$ipath.'audio-x-generic.png">';
print '<img title="'.get_int_text('button_searchmusic').'" onclick="toggleSearch()" id="choose_searcher" class="topimg tooltip" src="'.$ipath.'system-search.png">';
print '<img title="'.get_int_text('button_file_browser').'" onclick="layoutProcessor.sourceControl(\'filelist\')" id="choose_filelist" class="tooltip topimg" src="'.$ipath.'folder.png">';
print '<img title="'.get_int_text('button_internet_radio').'" onclick="layoutProcessor.sourceControl(\'radiolist\')" id="choose_radiolist" class="tooltip topimg" src="'.$ipath.'broadcast-24.png">';
print '<img title="'.get_int_text('button_infopanel').'" onclick="layoutProcessor.sourceControl(\'infopane\')" id="choose_infopanel" class="tooltip topimg" src="'.$ipath.'dialog-information.png">';
?>
</div>
<div class="expand"></div>
<div id="playlistcontrols" class="fixed noborder">
<div class="tleft">
<?php
print '<i class="icon-volume-up topimg" onclick="showVolumeControl()"></i>';
?>
<div id="volumecontrol"><div id="volume"></div></div>
</div>
<?php
print '<img id="choose_playlist" class="topimg tleft" src="'.$ipath.'document-open-folder.png" onclick="layoutProcessor.sourceControl(\'playlistm\')"">';
print '<img class="topimg tleft" src="'.$ipath.'preferences.png" onclick="layoutProcessor.sourceControl(\'chooser\')"">';
?>
</div>
</div>

<div id="bottompage">

        <div id="infobar" class="noborder mainpane containerbox vertical">
            <div id="geoffreyboycott" class="fixed fullwidth">
                <div id="albumcover"><img id="albumpicture" class="notexist" src=""></div>
                <div id="cssisshit">
                    <div id="buttons" class="button-mobile">
                        <table align="center" cellpadding="8" width="100%">
                            <tr><td align="center">
                                <?php
                                // print '<img title="'.get_int_text('button_previous').'" class="clickicon controlbutton lettuce" onclick="playlist.previous()" src="'.$ipath.'media-skip-backward.png">';
                                print '<i title="'.get_int_text('button_previous').'" class="icon-fast-backward clickicon controlbutton-small lettuce" onclick="playlist.previous()"></i>';
                                // print '<img title="'.get_int_text('button_play').'" class="shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()" id="playbuttonimg" src="'.$ipath.'media-playback-pause.png">';
                                print '<i title="'.get_int_text('button_play').'" class="icon-play-circled shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()"></i>';
                                // print '<img title="'.get_int_text('button_stop').'" class="shiftleft2 clickicon controlbutton lettuce" onclick="player.controller.stop()" src="'.$ipath.'media-playback-stop.png">';
                                print '<i title="'.get_int_text('button_stop').'" class="icon-stop-1 shiftleft2 clickicon controlbutton-small lettuce" onclick="player.controller.stop()"></i>';
                                // print '<img title="'.get_int_text('button_stopafter').'" class="shiftleft3 clickicon controlbutton lettuce" onclick="playlist.stopafter()" id="stopafterbutton" src="'.$ipath.'stopafter.png">';
                                print '<i title="'.get_int_text('button_stopafter').'" class="icon-to-end-1 shiftleft3 clickicon controlbutton-small lettuce" onclick="playlist.stopafter()" id="stopafterbutton"></i>';
                                // print '<img title="'.get_int_text('button_next').'" class="shiftleft4 clickicon controlbutton lettuce" onclick="playlist.next()" src="'.$ipath.'media-skip-forward.png">';
                                print '<i title="'.get_int_text('button_next').'" class="icon-fast-forward shiftleft4 clickicon controlbutton-small lettuce" onclick="playlist.next()"></i>';
                                ?>
                            </td></tr>
                        </table>
                        <div id="progress"></div>
                    </div>
                </div>
            </div>
            <div id="patrickmoore" class="containerbox vertical fullwidth">
                <div id="nowplaying" class="expand">
                    <div id="nptext"></div>
                </div>
                <div id="amontobin">
                    <div id="subscribe" class="invisible">
                        <?php
                        print '<img title="'.get_int_text('button_subscribe').'" class="clickicon lettuce" onclick="podcasts.doPodcast(\'nppodiput\')" src="newimages/rss.png">';
                        ?>
                        <input type="hidden" id="nppodiput" value="" />
                    </div>
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

        <div id="albumlist" class="noborder scroller mainpane">
            <div id="collection" class="noborder selecotron"></div>
        </div>

        <div id='searchpane' class="noborder scroller mainpane fullwidth">
        <div id="search" class="noborder searchbox selecotron">
<?php
include("player/".$prefs['player_backend']."/search.php");
?>
        </div>
        </div>

        <div id="filelist" class="noborder scroller mainpane">
<?php
if ($prefs['player_backend'] == "mpd") {
            print '<div style="padding-left:12px;padding-top:4px">
                <a title="Search Files" href="#" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="'.$ipath.'system-search.png"></a>
            </div>
            <div id="filesearch" class="invisible searchbox selecotron"></div>';
}
?>
            <div id="filecollection" class="noborder selecotron"></div>
        </div>

        <div id="infopane" class="infowiki scroller mainpane">
            <div id="artistchooser" class="infotext invisible"></div>
<?php
            print '<div id="artistinformation" class="infotext"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
            <div id="albuminformation" class="infotext"></div>
            <div id="trackinformation" class="infotext"></div>
        </div>

        <div id="radiolist" class="scroller mainpane">

<?php
$sp = glob("streamplugins/*.php");
foreach($sp as $p) {
    include($p);
}
?>
        </div>

        <div id="chooser" class="noborder scroller mainpane">
<?php
            print '<div id="choose_infobar" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'infobar\')">'.get_int_text('button_now_playing').'</a></div>';
            print '<div id="choose_albumlist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'albumlist\')">'.get_int_text('button_local_music').'</a></div>';
            print '<div id="choose_filelist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'filelist\')">'.get_int_text('button_file_browser').'</a></div>';
            print '<div id="choose_radiolist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'radiolist\')">'.get_int_text('button_internet_radio').'</a></div>';
            print '<div id="chooseplaylist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'playlistm\')">'.get_int_text('button_playlist').'</a></div>';
            print '<div class="chooser"><a href="#" onclick="clearPlaylist()">'.get_int_text('button_clearplaylist').'</a></div>';
            print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'playlistman\')">'.get_int_text('button_playman').'</a></div>';
            print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'pluginplaylists\')">'.get_int_text('label_pluginplaylists').'</a></div>';
            print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'prefsm\')">'.get_int_text('button_prefs').'</a></div>';
            print '<div class="chooser penbehindtheear"><a href="#" onclick="layoutProcessor.sourceControl(\'historypanel\')">'.get_int_text('button_mob_history').'</a></div>';
?>
        </div>

        <div id="historypanel" class="noborder scroller mainpane">
        </div>

        <div id="pluginplaylists" class="containerbox vertical pref scroller mainpane">
<?php
        print '<div class="containerbox spacer prefsection"><div class="expand textcentre"><b>'.get_int_text('label_pluginplaylists').'</b></div></div>';
?>
        </div>

        <div id="playlistman" class="noborder scroller mainpane">
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
                <div id="playlistslist">
<?php
                    print '<div class="prefsection textcentre"><b>'.get_int_text("menu_playlists").'</b></div>';
                    print '<div id="storedplaylists"></div>';
?>
                </div>
            </div>
        </div>
        <div id="prefsm" class="noborder scroller mainpane">
        <div id="configpanel">
<?php
include("includes/prefspanel.php")
?>
        </div>
        </div>

        <div id="playlistm" class="scroller mainpane">
<?php
debug_print("Doing Playlist","INIT");
include("layouts/playlist.php");
?>
        </div>

</div>
