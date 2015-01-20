<body>
<div id="notifications"></div>

<div id="infobar">
    <div class="infobarlayout tleft bordered" style="margin-left:12px">
        <div id="buttons">
<?php
print '<i title="'.get_int_text('button_previous').'" class="icon-fast-backward clickicon controlbutton-small lettuce"></i>';
print '<i title="'.get_int_text('button_play').'" class="icon-play-circled shiftleft clickicon controlbutton lettuce"></i>';
print '<i title="'.get_int_text('button_stop').'" class="icon-stop-1 shiftleft2 clickicon controlbutton-small lettuce"></i>';
print '<i title="'.get_int_text('button_stopafter').'" class="icon-to-end-1 shiftleft3 clickicon controlbutton-small lettuce" id="stopafterbutton"></i>';
print '<i title="'.get_int_text('button_next').'" class="icon-fast-forward shiftleft4 clickicon controlbutton-small lettuce"></i>';
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

    <div id="patrickmoore" class="infobarlayout bordered noselection containerbox">
        <div id="albumcover" class="fixed">
            <img id="albumpicture" class="notexist" src="" />
        </div>
        <div id="firefoxisshitwrapper" class="expand">
            <div id="nowplaying">
                <div id="nptext"></div>
            </div>
            <div id="amontobin" class="clearfix">
                <div id="subscribe" class="invisible topstats">
                    <?php
                    print '<i title="'.get_int_text('button_subscribe').'" class="icon-rss npicon clickicon lettuce"></i>';
                    ?>
                    <input type="hidden" id="nppodiput" value="" />
                </div>
                <div id="stars" class="invisible topstats">
                    <i id="ratingimage" class="icon-0-stars rating-icon-big"></i>
                    <input type="hidden" value="-1" />
                </div>
                <div id="lastfm" class="invisible topstats">
                    <?php
                    print '<i title="'.get_int_text('button_love').'" class="icon-heart npicon clickicon lettuce" id="love"></i>';
                    print '<i title="'.get_int_text('button_ban').'" class="icon-block npicon clickicon lettuce" id="ban"></i>';
                    ?>
                </div>
                <div id="playcount" class="topstats"></div>
                <div id="dbtags" class="invisible topstats">
                </div>
            </div>
        </div>
    </div>
</div>

<div id="headerbar" class="noborder fullwidth">

<div id="sourcescontrols" class="column noborder tleft containerbox headercontainer">
<div class="expand topbox">
<?php
print '<i title="'.get_int_text('button_local_music').'" class="icon-music tooltip topimg choose_albumlist"></i>';
print '<i title="'.get_int_text('button_searchmusic').'" class="icon-search topimg tooltip choose_searcher"></i>';
print '<i title="'.get_int_text('button_file_browser').'" class="icon-folder-open-empty tooltip topimg choose_filelist"></i>';
print '<i title="'.get_int_text('button_internet_radio').'" class="icon-radio-tower tooltip topimg choose_radiolist"></i>';
print '<i title="'.get_int_text('button_albumart').'" class="icon-cd tooltip topimg open_albumart"></i>';
?>
</div>
<?php
print '<i id="sourcesresizer" class="icon-resize-horizontal topimg fixed topbox" style="cursor:move"></i>';
?>
</div>

<div id="infopanecontrols" class="cmiddle noborder tleft containerbox headercontainer">
<?php
 print '<i title="'.get_int_text('button_togglesources').'" class="icon-angle-double-left tooltip topimg fixed topbox" id="expandleft"></i>';
 ?>

<div id="chooserbuttons" class="noborder expand center topbox containerbox">
<?php
print '<div class="topdrop fixed"><i class="icon-menu topimg"></i>';
?>
<div class="topdropmenu dropshadow leftmenu normalmenu">
    <div id="specialplugins" class="clearfix"></div>
</div>
</div>
<?php
print '<div class="topdrop fixed"><i class="icon-versions topimg tooltip" title="'.get_int_text('button_history').'"></i>';
?>
<div class="topdropmenu dropshadow leftmenu widemenu" id="hpscr">
    <div id="historypanel" class="clearfix"></div>
</div>
</div>

<?php
print '<i title="'.get_int_text('button_back').'" id="backbutton" class="icon-left-circled topimg tooltip button-disabled fixed"></i>';
print '<i title="'.get_int_text('button_forward').'" id="forwardbutton" class="icon-right-circled tooltip topimg button-disabled fixed"></i>';
?>
</div>

<?php
print '<i class="icon-angle-double-right tooltip topimg fixed topbox" title="'.get_int_text('button_toggleplaylist').'" id="expandright"></i>';
?>
</div>

<div id="playlistcontrols" class="column noborder tleft containerbox headercontainer">
<?php
print '<div class="expand"><i id="playlistresizer" class="icon-resize-horizontal topimg topbox" style="cursor:move"></i></div>';
?>
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
print '<div class="configtitle textcentre"><b>'.get_int_text('button_clearplaylist').'</b></div>';
print '<div class="textcentre"><button class="clear_playlist">'.get_int_text('button_imsure').'</button></div>';
?>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-wifi topimg tooltip" title="'.get_int_text('label_pluginplaylists').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen" id="ppscr">
<?php
print '<div class="configtitle textcentre"><b>'.get_int_text('label_pluginplaylists').'</b></div>';
?>
<div class="clearfix containerbox vertical" id="pluginplaylists"></div>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-doc-text topimg tooltip" title="'.get_int_text('button_loadplaylist').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen" id="lpscr">
<?php
print '<div class="configtitle textcentre"><b>'.get_int_text('button_loadplaylist').'</b></div>';
?>
<div class="clearfix selecotron" id="storedplaylists"></div>
</div>
</div>

<?php
print '<div class="topdrop"><i class="icon-floppy topimg tooltip" title="'.get_int_text('button_saveplaylist').'"></i>';
?>
<div class="topdropmenu dropshadow rightmenu widemenu stayopen">
<?php
print '<div class="configtitle textcentre"><b>'.get_int_text('button_saveplaylist').'</b></div>';
print '<div class="containerbox"><div class="expand"><input class="enter" id="playlistname" type="text" size="200"/></div>';
print '<button class="fixed">'.get_int_text('button_save').'</button></div>';
?>
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
<i title="'.get_int_text('button_searchfiles').'" class="icon-search topimg lettuce choose_filesearch"></i>
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
include("skins/playlist.php");
?>
</div>
</div>
