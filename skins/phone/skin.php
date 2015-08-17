<body class="mobile">

<div id="notifications"></div>
<div id="headerbar" class="noborder fullwidth containerbox">
    <div id="sourcescontrols" class="fixed noborder">
        <i class="icon-play-circled topimg choose_nowplaying"></i>
        <i class="icon-music topimg choose_albumlist"></i>
        <i class="icon-search topimg choose_searcher"></i>
        <i class="icon-folder-open-empty topimg choose_filelist"></i>
        <i class="icon-radio-tower topimg choose_radiolist"></i>
        <i class="icon-info-circled topimg choose_infopanel"></i>
    </div>
    <div class="expand"></div>
    <div id="playlistcontrols" class="fixed noborder">
        <div class="topdrop fixed"><i class="icon-volume-up topimg tleft"></i>
            <div class="topdropmenu rightmenu widemenu dropdown">
                <table><tr><td valign="top"><b>
<?php
include('player/mpd/outputs.php');
print get_int_text('config_audiooutputs').'</b><br/>';
printOutputCheckboxes();
?>
                </td><td>
                    <div id="volumecontrol"><div id="volume"></div></div>
                </td></tr></table>

            </div>
        </div>
        <i class="icon-doc-text topimg tleft choose_playlist"></i>
        <div class="topdrop fixed"><i class="icon-menu topimg tleft"></i>
            <div class="topdropmenu rightmenu normalmenu dropdown">
                <i class="clear_playlist icon-trash topimg"></i>
                <i class="choose_playlistman icon-doc-text topimg"></i>
                <i class="choose_pluginplaylists icon-wifi topimg"></i>
                <i class="choose_prefs icon-cog-alt topimg"></i>
            </div>
        </div>
    </div>
</div>

<div id="infobar" class="noborder mainpane containerbox vertical invisible">
    <div id="geoffreyboycott" class="fixed fullwidth">
        <div id="albumcover"><img id="albumpicture" class="notexist" /></div>
        <div id="cssisshit">
            <div id="buttons" class="button-mobile">
                <table align="center" cellpadding="8" width="100%">
                    <tr><td align="center">
                        <?php
                        print '<i title="'.get_int_text('button_previous').
                            '" class="icon-fast-backward clickicon controlbutton-small"></i>';
                        print '<i title="'.get_int_text('button_play').
                            '" class="icon-play-circled shiftleft clickicon controlbutton"></i>';
                        print '<i title="'.get_int_text('button_stop').
                            '" class="icon-stop-1 shiftleft2 clickicon controlbutton-small"></i>';
                        print '<i title="'.get_int_text('button_stopafter').
                            '" class="icon-to-end-1 shiftleft3 clickicon controlbutton-small"></i>';
                        print '<i title="'.get_int_text('button_next').
                            '" class="icon-fast-forward shiftleft4 clickicon controlbutton-small"></i>';
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
                <i class="icon-rss npicon clickicon"></i>
                <input type="hidden" id="nppodiput" value="" />
            </div>
            <div id="stars" class="invisible">
                <i id="ratingimage" class="icon-0-stars rating-icon-big"></i>
                <input type="hidden" value="-1" />
            </div>
            <div id="lastfm" class="invisible">
                <i class="icon-heart npicon clickicon" id="love"></i>
                <i class="icon-block npicon clickicon" id="ban"></i>
            </div>
            <div id="playcount"></div>
            <div id="dbtags" class="invisible">
            </div>
        </div>
    </div>
</div>

<div id="albumlist" class="noborder scroller mainpane invisible">
<?php
    print '<div class="menuitem containerbox" style="margin-top:12px;padding-left:8px">';
    print '<div class="fixed" style="padding-right:4px"><i onclick="toggleCollectionButtons()" '.
        'title="'.get_int_text('button_collectioncontrols').
        '" class="icon-menu playlisticon clickicon lettuce"></i></div>';
    print '<div class="expand" style="font-weight:bold;font-size:120%;padding-top:0.4em">'.
        get_int_text("button_local_music").'</div></div>';
?>
    <div id="collectionbuttons" class="invisible searchbox">
<?php
    print '<div class="pref styledinputs">';
    print '<input type="radio" class="topcheck savulon" name="sortcollectionby" '.
        'value="artist" id="sortbyartist">
    <label for="sortbyartist">'.ucfirst(get_int_text('label_artists')).'</label><br/>
    <input type="radio" class="topcheck savulon" name="sortcollectionby" value="album" id="sortbyalbum">
    <label for="sortbyalbum">'.ucfirst(get_int_text('label_albums')).'</label><br/>
    </div><div class="pref textcentre">
    <button name="donkeykong" onclick="checkCollection(true, false)">'.get_int_text('config_updatenow').'</button>
    </div>';
?>
    </div>
    <div id="collection" class="noborder selecotron">
    </div>
</div>

<div id='searchpane' class="noborder scroller mainpane invisible">
<div id="search" class="noborder searchbox">
<?php
include("player/".$prefs['player_backend']."/search.php");
?>
</div>
<div id="searchresultholder" class="nosborder selecotron"></div>
</div>

<div id="filelist" class="noborder scroller mainpane invisible">
    <div id="filecollection" class="noborder selecotron"></div>
</div>

<div id="infopane" class="infowiki scroller mainpane invisible">
    <div class="containerbox headercontainer">
        <div id="chooserbuttons" class="noborder expand center topbox containerbox">
            <i id="choose_history" class="icon-versions topimg fixed"></i>
            <i id="backbutton" class="icon-left-circled topimg button-disabled fixed"></i>
            <i id="forwardbutton" class="icon-right-circled topimg button-disabled fixed"></i>
        </div>
    </div>
    <div id="artistchooser" class="infotext invisible"></div>
<?php
    print '<div id="artistinformation" class="infotext"><h2 align="center">'.
        get_int_text('label_emptyinfo').'</h2></div>';
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

<div id="historypanel" class="noborder scroller mainpane invisible">
</div>

<?php
if ($use_smartradio) {
?>
<div id="pluginplaylistholder" class="containerbox vertical scroller mainpane invisible">
<?php
print '<div class="containerbox spacer configtitle"><div class="expand textcentre"><b>'.
    get_int_text('label_pluginplaylists').'</b></div></div>';
?>
<div class="pref">
    <div id="pluginplaylists">
<?php
if ($prefs['player_backend'] == "mopidy") {
    print '<div class="textcentre textunderline"><b>Music From Your Collection</b></div>';
}
?>
</div>
<div class="clearfix containerbox vertical" id="pluginplaylists_spotify">
<?php
if ($prefs['player_backend'] == "mopidy") {
    print '<div class="textcentre textunderline"><b>Music From Spotify</b></div>';
}
?>
</div>
<div class="clearfix containerbox vertical" id="pluginplaylists_everywhere">
<?php
if ($prefs['player_backend'] == "mopidy") {
    print '<div class="textcentre textunderline"><b>Music From Everywhere</b></div>';
    print '<div id="radiodomains" class="pref"><b>Play From These Sources:</b></div>';
}
?>
</div>
</div>
</div>
</div>
<?php
}
?>

<div id="playlistman" class="noborder scroller mainpane invisible">
    <div class="pref containerbox dropdown-container"><div class="fixed padright">
<?php
        print get_int_text('button_saveplaylist');
?>
        </div><div class="expand"><input id="playlistname" type="text" size="200"/></div>
<?php
        print '<button class="fixed" onclick="player.controller.savePlaylist()">'.
            get_int_text('button_save').'</button>';
?>
    </div>
    <div class="pref">
        <div id="playlistslist">
<?php
            print '<div class="configtitle textcentre"><b>'.
                get_int_text("button_loadplaylist").'</b></div>';
            print '<div id="storedplaylists"></div>';
?>
        </div>
    </div>
</div>
<div id="prefsm" class="noborder scroller mainpane invisible">
<?php
include("includes/prefspanel.php")
?>
</div>

<div id="playlistm" class="scroller mainpane invisible">
<?php
include("skins/playlist.php");
?>
</div>

<div id="popupwindow" class="noborder scroller mainpane invisible">
</div>

