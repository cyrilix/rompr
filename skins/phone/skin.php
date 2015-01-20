<body class="mobile">

<div id="notifications"></div>
<div id="headerbar" class="noborder fullwidth containerbox">
<div id="sourcescontrols" class="fixed noborder">
<?php
print '<i class="icon-play-circled topimg choose_nowplaying"></i>';
print '<i class="icon-music topimg choose_albumlist"></i>';
print '<i class="icon-search topimg choose_searcher"></i>';
print '<i class="icon-folder-open-empty topimg choose_filelist"></i>';
print '<i class="icon-radio-tower topimg choose_radiolist"></i>';
print '<i class="icon-info-circled topimg choose_infopanel"></i>';
?>
</div>
<div class="expand"></div>
<div id="playlistcontrols" class="fixed noborder">
<div class="tleft">
<?php
print '<i class="icon-volume-up topimg"></i>';
?>
<div id="volumecontrol"><div id="volume"></div></div>
</div>
<?php
print '<i class="icon-doc-text topimg tleft choose_playlist"></i>';
print '<i class="icon-cog-alt topimg tleft"></i>';
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
                        print '<i title="'.get_int_text('button_previous').'" class="icon-fast-backward clickicon controlbutton-small"></i>';
                        print '<i title="'.get_int_text('button_play').'" class="icon-play-circled shiftleft clickicon controlbutton"></i>';
                        print '<i title="'.get_int_text('button_stop').'" class="icon-stop-1 shiftleft2 clickicon controlbutton-small"></i>';
                        print '<i title="'.get_int_text('button_stopafter').'" class="icon-to-end-1 shiftleft3 clickicon controlbutton-small" id="stopafterbutton"></i>';
                        print '<i title="'.get_int_text('button_next').'" class="icon-fast-forward shiftleft4 clickicon controlbutton-small"></i>';
                        ?>
                    </td></tr>
                </table>
                <div id="progress"></div>
                <div id="playbackTime">
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
                print '<i class="icon-rss npicon clickicon"></i>';
                ?>
                <input type="hidden" id="nppodiput" value="" />
            </div>
            <div id="stars" class="invisible">
                <i id="ratingimage" class="icon-0-stars rating-icon-big"></i>
                <input type="hidden" value="-1" />
            </div>
            <div id="lastfm" class="invisible">
                <?php
                print '<i class="icon-heart npicon clickicon" id="love"></i>';
                print '<i class="icon-block npicon clickicon" id="ban"></i>';
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
<i class="icon-search topimg choose_filesearch"></i>
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
    print '<div class="chooser choose_nowplaying">'.get_int_text('button_now_playing').'</div>';
    print '<div class="chooser choose_albumlist">'.get_int_text('button_local_music').'</div>';
    print '<div class="chooser choose_searcher">'.get_int_text('button_searchmusic').'</div>';
    print '<div class="chooser choose_filelist">'.get_int_text('button_file_browser').'</div>';
    print '<div class="chooser choose_radiolist">'.get_int_text('button_internet_radio').'</div>';
    print '<div class="chooser choose_infopanel">'.get_int_text('button_infopanel').'</div>';
    print '<div class="chooser choose_playlist">'.get_int_text('button_playlist').'</div>';
    print '<div class="chooser choose_playlistman">'.get_int_text('button_playman').'</div>';
    print '<div class="chooser choose_pluginplaylists">'.get_int_text('label_pluginplaylists').'</div>';
    print '<div class="chooser choose_prefs">'.get_int_text('button_prefs').'</div>';
    print '<div class="chooser choose_history">'.get_int_text('button_mob_history').'</div>';
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
<?php
if ($prefs['playuer_backend'] == "mpd") {
    print '<div class="pref containerbox dropdown-container"><div class="fixed padright">';
    print get_int_text('button_saveplaylist');
    print '</div><div class="expand"><input id="playlistname" type="text" size="200"/></div>';
    print '<button class="fixed">'.get_int_text('button_save').'</button>';
    print '</div>';
}
?>
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


