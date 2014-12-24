
<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered">
        <div id="buttons">
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

    <div id="patrickmoore" class="infobarlayout tleft bordered noselection containerbox">
        <div id="albumcover" class="fixed">
            <img id="albumpicture" class="notexist" src="" />
        </div>
        <div class="expand">
            <div id="nowplaying">
                <div id="nptext"></div>
            </div>
            <div id="amontobin" class="clearfix">
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
</div>

<div id="headerbar" class="noborder fullwidth">

<div id="albumcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<?php
print '<i title="'.get_int_text('button_local_music').'" onclick="layoutProcessor.sourceControl(\'albumlist\')" id="choose_albumlist" class="icon-music tooltip topimg"></i>';
print '<i title="'.get_int_text('button_searchmusic').'" onclick="toggleSearch()" id="choose_searcher" class="icon-search topimg tooltip"></i>';
print '<i title="'.get_int_text('button_file_browser').'" onclick="layoutProcessor.sourceControl(\'filelist\')" id="choose_filelist" class="icon-folder-open-empty tooltip topimg"></i>';
print '<i title="'.get_int_text('button_internet_radio').'" onclick="layoutProcessor.sourceControl(\'radiolist\')" id="choose_radiolist" class="icon-radio-tower tooltip topimg"></i>';
print '<i title="'.get_int_text('button_albumart').'" onclick="openAlbumArtManager()" id="choose_radiolist" class="icon-cd tooltip topimg"></i>';
?>
</div>
<div class="fixed topbox">
<?php
print '<i id="sourcesresizer" class="icon-resize-horizontal topimg" style="cursor:move"></i>';
?>
</div>
</div>
</div>

<div id="infocontrols" class="cmiddle noborder tleft">
<div class="containerbox fullwidth">

<div class="fixed topbox">
<?php
 print '<i title="'.get_int_text('button_togglesources').'" class="icon-angle-double-left tooltip topimg" onclick="expandInfo(\'left\')" id="expandleft"></i>';
 ?>
</div>

<div class="expand containerbox center topbox">
<div id="chooserbuttons" class="noborder fixed">
<?php
print '<div class="topdrop"><i class="icon-menu topimg"></i>';
?>
<div class="topdropmenu dropshadow leftmenu normalmenu">
    <div id="specialplugins" class="clearfix"></div>
</div>
</div>
<?php
print '<div class="topdrop"><i class="icon-versions topimg tooltip" title="'.get_int_text('button_history').'"></i>';
?>
<div class="topdropmenu dropshadow leftmenu widemenu" id="hpscr">
    <div id="historypanel" class="clearfix"></div>
</div>
</div>

<?php
print '<i title="'.get_int_text('button_back').'" id="backbutton" class="icon-left-circled topimg tooltip button-disabled"></i>';
print '<i title="'.get_int_text('button_forward').'" id="forwardbutton" class="icon-right-circled tooltip topimg button-disabled"></i>';
?>
</div>
</div>

<div class="fixed topbox">
<?php
print '<i class="icon-angle-double-right tooltip topimg" title="'.get_int_text('button_toggleplaylist').'" onclick="expandInfo(\'right\')" id="expandright"></i>';
?>
</div>
</div>
</div>

<div id="playlistcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<?php
print '<i id="playlistresizer" class="icon-resize-horizontal topimg" style="cursor:move"></i>';
?>
</div>
<div class="fixed topbox" id="righthandtop">

<?php
print '<div class="topdrop"><i class="icon-cog-alt topimg tooltip" title="'.get_int_text('button_prefs').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen" id="configpanel">
<?php
include ("includes/prefspanel.php");
?>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-trash topimg tooltip" title="'.get_int_text('button_clearplaylist').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu normalmenu">
<?php
print '<div class="prefsection textcentre"><b>'.get_int_text('menu_clearplaylist').'</b></div>';
print '<button style="width:100%" class="topformbutton" onclick="playlist.clear()">'.get_int_text('button_imsure').'</button>';
?>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-wifi topimg tooltip" title="'.get_int_text('label_pluginplaylists').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen" id="ppscr">
<?php
print '<div class="prefsection textcentre"><b>'.get_int_text('label_pluginplaylists').'</b></div>';
?>
<div class="clearfix containerbox vertical" id="pluginplaylists"></div>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-doc-text topimg tooltip" title="'.get_int_text('button_loadplaylist').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen" id="lpscr">
<?php
print '<div class="prefsection textcentre"><b>'.get_int_text('button_loadplaylist').'</b></div>';
?>
<div class="clearfix selecotron" id="storedplaylists"></div>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-floppy topimg tooltip" title="'.get_int_text('button_saveplaylist').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu">
<?php
print '<div class="prefsection textcentre"><b>'.get_int_text('button_saveplaylist').'</b></div>';
print '<input class="enter sourceform" style="width:280px" name="nigel" id="playlistname" type="text" size="200"/>';
print '<button class="topformbutton" onclick="player.controller.savePlaylist()">'.get_int_text('button_save').'</button>';
?>
</div>
</div>

</div>
</div>
</div>

</div>

<div id="bottompage">

<div id="sources" class="column noborder tleft">

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
<i title="'.get_int_text('button_searchfiles').'" onclick="toggleFileSearch()" class="icon-search topimg lettuce"></i>
    </div>
    <div id="filesearch" class="invisible searchbox selecotron">
    </div>';
}
?>
    <div id="filecollection" class="noborder selecotron"></div>
    </div>

    <div id="radiolist" class="invisible">

<?php
$sp = glob("streamplugins/*.php");
foreach($sp as $p) {
    include($p);
}
?>
</div>
</div>

<div id="infopane" class="cmiddle noborder infowiki tleft">
    <div id="artistchooser" class="infotext noselection invisible"></div>
<?php
print '<div id="artistinformation" class="infotext noselection"><h2 align="center">'.get_int_text('label_emptyinfo').'</h2></div>';
?>
<div id="albuminformation" class="infotext noselection"></div>
<div id="trackinformation" class="infotext"></div>
</div>

<div id="playlist" class="column noborder tright">
<?php
include("layouts/playlist.php");
?>
</div>
</div>
