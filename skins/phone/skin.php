<body class="mobile">

<div id="notifications"></div>
<div id="headerbar" class="noborder fullwidth containerbox">
<div id="sourcescontrols" class="fixed noborder">
<?php
print '<i title="'.get_int_text('button_now_playing').'" onclick="layoutProcessor.sourceControl(\'infobar\')" id="choose_nowplaying" class="icon-play-circled tooltip topimg"></i>';
print '<i title="'.get_int_text('button_local_music').'" onclick="layoutProcessor.sourceControl(\'albumlist\')" id="choose_albumlist" class="icon-music tooltip topimg"></i>';
print '<i title="'.get_int_text('button_searchmusic').'" onclick="toggleSearch()" id="choose_searcher" class="icon-search topimg tooltip"></i>';
print '<i title="'.get_int_text('button_file_browser').'" onclick="layoutProcessor.sourceControl(\'filelist\')" id="choose_filelist" class="icon-folder-open-empty tooltip topimg"></i>';
print '<i title="'.get_int_text('button_internet_radio').'" onclick="layoutProcessor.sourceControl(\'radiolist\')" id="choose_radiolist" class="icon-radio-tower tooltip topimg"></i>';
print '<i title="'.get_int_text('button_infopanel').'" onclick="layoutProcessor.sourceControl(\'infopane\')" id="choose_infopanel" class="icon-info-circled tooltip topimg"></i>';
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
print '<i id="choose_playlist" class="icon-doc-text topimg tleft playlistchoose" onclick="layoutProcessor.sourceControl(\'playlistm\')"></i>';
print '<i class="icon-cog-alt topimg tleft" onclick="layoutProcessor.sourceControl(\'chooser\')"></i>';
?>
</div>
</div>

<div id="infobar" class="noborder mainpane containerbox vertical invisible">
    <div id="geoffreyboycott" class="fixed fullwidth">
        <div id="albumcover"><img id="albumpicture" class="notexist" src=""></div>
        <div id="cssisshit">
            <div id="buttons" class="button-mobile">
                <table align="center" cellpadding="8" width="100%">
                    <tr><td align="center">
                        <?php
                        print '<i title="'.get_int_text('button_previous').'" class="icon-fast-backward clickicon controlbutton-small lettuce" onclick="playlist.previous()"></i>';
                        print '<i title="'.get_int_text('button_play').'" class="icon-play-circled shiftleft clickicon controlbutton lettuce" onclick="infobar.playbutton.clicked()"></i>';
                        print '<i title="'.get_int_text('button_stop').'" class="icon-stop-1 shiftleft2 clickicon controlbutton-small lettuce" onclick="player.controller.stop()"></i>';
                        print '<i title="'.get_int_text('button_stopafter').'" class="icon-to-end-1 shiftleft3 clickicon controlbutton-small lettuce" onclick="playlist.stopafter()" id="stopafterbutton"></i>';
                        print '<i title="'.get_int_text('button_next').'" class="icon-fast-forward shiftleft4 clickicon controlbutton-small lettuce" onclick="playlist.next()"></i>';
                        ?>
                    </td></tr>
                </table>
                <div id="progress"></div>
                <div id="playbackTime">§
                </div>
            </div>
        </div>
    </div>
    <div id="patrickmoore" class="fullwidth">
        <div id="nowplayingfiddler"></div>
        <div id="nowplaying">
            <div id="nptext"></div>
        </div>
        <div id="amontobin">
            <div id="subscribe" class="invisible">
                <?php
                print '<i title="'.get_int_text('button_subscribe').'" class="icon-rss npicon clickicon lettuce" onclick="podcasts.doPodcast(\'nppodiput\')"></i>';
                ?>
                <input type="hidden" id="nppodiput" value="" />
            </div>
            <div id="stars" class="invisible">
                <i id="ratingimage" onclick="nowplaying.setRating(event)" class="icon-0-stars rating-icon-big"></i>
                <input type="hidden" value="-1" />
            </div>
            <div id="lastfm" class="invisible">
                <?php
                print '<i title="'.get_int_text('button_love').'" class="icon-heart npicon clickicon lettuce" id="love" onclick="nowplaying.love()"></i>';
                print '<i title="'.get_int_text('button_ban').'" class="icon-block npicon clickicon lettuce" id="ban" onclick="infobar.ban()""></i>';
                ?>
            </div>
            <div id="playcount"></div>
            <div id="dbtags" class="invisible">
            </div>
        </div>
    </div>
</div>

<div id="albumlist" class="noborder scroller mainpane invisible">
    <div id="collection" class="noborder selecotron"></div>
</div>

<div id='searchpane' class="noborder scroller mainpane invisible">
<div id="search" class="noborder searchbox selecotron">
<?php
include("player/".$prefs['player_backend']."/search.php");
?>
</div>
</div>

<div id="filelist" class="noborder scroller mainpane invisible">
<?php
if ($prefs['player_backend'] == "mpd") {
    print '<div style="padding-left:12px;padding-top:4px">
<i title="'.get_int_text('button_searchfiles').'" onclick="toggleFileSearch()" class="icon-search topimg lettuce"></i>
    </div>
    <div id="filesearch" class="invisible searchbox selecotron"></div>';
}
?>
    <div id="filecollection" class="noborder selecotron"></div>
</div>

<div id="infopane" class="infowiki scroller mainpane invisible">
    <div class="containerbox headercontainer"><div id="chooserbuttons" class="noborder expand center topbox containerbox"></div></div>
    <div id="artistchooser" class="infotext invisible"></div>
<?php
    print '<div id="artistinformation" class="infotext"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
    <div id="albuminformation" class="infotext"></div>
    <div id="trackinformation" class="infotext"></div>
</div>

<div id="radiolist" class="scroller mainpane invisible">

<?php
$sp = glob("streamplugins/*.php");
foreach($sp as $p) {
include($p);
}
?>
</div>

<div id="chooser" class="noborder scroller mainpane invisible">
<?php
    print '<div id="choose_infobar" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'infobar\')">'.get_int_text('button_now_playing').'</a></div>';
    print '<div id="choose_albumlist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'albumlist\')">'.get_int_text('button_local_music').'</a></div>';
    print '<div id="choose_filelist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'filelist\')">'.get_int_text('button_file_browser').'</a></div>';
    print '<div id="choose_radiolist" class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'radiolist\')">'.get_int_text('button_internet_radio').'</a></div>';
    print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'infopane\')">'.get_int_text('button_infopanel').'</a></div>';
    print '<div id="chooseplaylist" class="chooser playlistchoose"><a href="#" onclick="layoutProcessor.sourceControl(\'playlistm\')">'.get_int_text('button_playlist').'</a></div>';
    print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'playlistman\')">'.get_int_text('button_playman').'</a></div>';
    print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'pluginplaylistholder\')">'.get_int_text('label_pluginplaylists').'</a></div>';
    print '<div class="chooser"><a href="#" onclick="layoutProcessor.sourceControl(\'prefsm\')">'.get_int_text('button_prefs').'</a></div>';
    print '<div class="chooser penbehindtheear"><a href="#" onclick="layoutProcessor.sourceControl(\'historypanel\')">'.get_int_text('button_mob_history').'</a></div>';
?>
</div>

<div id="historypanel" class="noborder scroller mainpane invisible">
</div>

<div id="pluginplaylistholder" class="containerbox vertical scroller mainpane invisible">
<?php
print '<div class="containerbox spacer configtitle"><div class="expand textcentre"><b>'.get_int_text('label_pluginplaylists').'</b></div></div>';
?>
<div class="pref"><div id="pluginplaylists"></div></div>
</div>

<div id="playlistman" class="noborder scroller mainpane invisible">
    <div class="pref containerbox dropdown-container"><div class="fixed padright">
<?php
        print get_int_text('button_saveplaylist');
?>
        </div><div class="expand"><input id="playlistname" type="text" size="200"/></div>
<?php
        print '<button class="fixed" onclick="player.controller.savePlaylist()">'.get_int_text('button_save').'</button>';
?>
    </div>
    <div class="pref">
        <div id="playlistslist">
<?php
            print '<div class="configtitle textcentre"><b>'.get_int_text("button_loadplaylist").'</b></div>';
            print '<div id="storedplaylists"></div>';
?>
        </div>
    </div>
</div>
<div id="prefsm" class="noborder scroller mainpane invisible">
    <div id="configpanel">
<?php
include("includes/prefspanel.php")
?>
    </div>
</div>

<div id="playlistm" class="scroller mainpane invisible">
<?php
include("skins/playlist.php");
?>
</div>


