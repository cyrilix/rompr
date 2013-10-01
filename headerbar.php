<?php
include ("vars.php");
include ("functions.php");
?>

<div id="albumcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox leftbox">
<img title="Local Music" onclick="sourcecontrol('albumlist')" id="choose_albumlist" class="tooltip topimg" height="24px" src="newimages/audio-x-generic.png">
<img title="File Browser" onclick="sourcecontrol('filelist')" id="choose_filelist" class="tooltip topimg" height="24px" src="newimages/folder.png">
<img title="Last.FM Radio" onclick="sourcecontrol('lastfmlist')" id="choose_lastfmlist" class="tooltip topimg" height="24px" src="newimages/lastfm.png">
<img title="Internet Radio Stations and Podcasts" onclick="sourcecontrol('radiolist')" id="choose_radiolist" class="tooltip topimg" height="24px" src="newimages/broadcast-24.png">
<a href="albumart.php" title="Album Art Manager" target="_blank" class="tooltip"><img class="topimg" src="newimages/cd_jewel_case.jpg" height="24px"></a>
</div>
<div class="fixed topbox">
<img id="sourcesresizer" height="24px" src="newimages/resize2.png" style="cursor:move">
</div>
</div>
</div>

<div id="infocontrols" class="cmiddle noborder tleft">
<div class="containerbox fullwidth">
<div class="fixed topbox">
<img title="Toggle Sources Panel" class="tooltip clickicon" onclick="expandInfo('left')" id="expandleft" height="24px" src="newimages/arrow-left-double.png" style="padding-left:4px">
</div>
<div class="expand containerbox center topbox">
<div id="chooserbuttons" class="noborder fixed">
<img title="Back" id="backbutton" class="topimg tooltip" height="24px" src="newimages/backbutton_disabled.png">
<ul class="topnav">
    <li>
        <a href="#" title="History" class="tooltip"><img src="newimages/history_icon.png" class="topimg" height="24px"></a>
        <ul id="historypanel" class="subnav widel">
            <li class="wider"><b>HISTORY</b></li>
        </ul>
    </li>
</ul>
<img title="Forward" id="forwardbutton" class="tooltip topimg" height="24px" src="newimages/forwardbutton_disabled.png">
</div>
</div>
<div class="fixed topbox">
<img height="24px" class="tooltip clickicon" title="Toggle Playlist" onclick="expandInfo('right')" id="expandright" src="newimages/arrow-right-double.png" style="padding-right:4px">
</div>
</div>
</div>

<div id="playlistcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<img id="playlistresizer" src="newimages/resize2.png" height="24px" style="cursor:move">
</div>
<div class="fixed topbox">
<ul class="topnav">
    <li>
        <a href="#" title="RompR Preferences" class="tooltip"><img class="topimg" src="newimages/preferences.png" height="24px"></a>
        <ul id="configpanel" class="subnav wide">
            <li class="wide"><b>CONFIGURATION</b></li>
                        <li class="wide">THEME <select id="themeselector" class="topformbutton" onchange="changetheme()">
<?php
                        $themes = glob("*.css");
                        foreach($themes as $theme) {
                            if ($theme != "layout.css" && $theme != "layout_mobile.css") {
                                print '<option value="'.$theme.'">'.preg_replace('/\.css$/', "", $theme).'</option>';
                            }
                        }
?>
                        </select></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel('albumlist')" id="button_hide_albumlist">Hide Albums List</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="keepsearchopen()" id="button_keep_search_open">...but Keep Search Box Visible</input></li>
<?php
if ($prefs['use_mopidy_tagcache'] == 0 &&
    $prefs['use_mopidy_http'] == 0) {
?>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel('filelist')" id="button_hide_filelist">Hide Files List</input></li>
<?php
}
?>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel('lastfmlist')" id="button_hide_lastfmlist">Hide Last.FM Stations</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="hidePanel('radiolist')" id="button_hide_radiolist">Hide Radio Stations</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="browser.hide()" id="hideinfobutton">Hide Information Panel</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('fullbiobydefault')" id="fullbiobydefault">Retrieve full artist biographies from Last.FM</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('downloadart')" id="downloadart">Automatically Download Covers</input></li>
                        <li class="wide tiny">To use art from your music folders, enter the path to your music in this box:</li>
<?php
                        print '<li class="wide"><input class="enter topform" name="music_directory_albumart" type="text" size="40" value="'.$prefs['music_directory_albumart'].'"/><button class="topformbutton" onclick="setMusicDirectory()">Set</button></li>';
?>
                        <li class="wide">Crossfade Duration (seconds)</li>
<?php
                        print '<li class="wide"><input class="enter topform" name="michaelbarrymore" type="text" size="3" value="'.$prefs['crossfade_duration'].'"/><button class="topformbutton" onclick="setXfadeDur()">Set</button></li>';
?>

                        <li class="wide"><b>Music Selection Click Behaviour</b></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="double">Double-click to add, Click to select</input></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="single">Click to add, no selection</input></li>

<?php
if ($prefs['use_mopidy_tagcache'] == 0 &&
    $prefs['use_mopidy_http'] == 0) {
?>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('updateeverytime')" id="updateeverytime">Update Collection On Start</input></li>
                        <li class="wide"><button class="topformbutton" onclick="player.controller.updateCollection('update')">Update Collection Now</button></li>
<?php
} else {
?>
                        <li class="wide"><button class="topformbutton" onclick="player.controller.updateCollection('update')">Rebuild Albums List</button></li>
<?php
}
if (($prefs['use_mopidy_tagcache'] == 0 &&
    $prefs['use_mopidy_http'] == 0) ||
    $prefs['use_mopidy_tagcache'] == 1) {
?>
                        <li class="wide"><button class="topformbutton" onclick="player.controller.updateCollection('rescan')">Full Collection Rescan</button></li>
<?php
}
?>
                        <li class="wide"><button class="topformbutton" onclick="editkeybindings()">Edit Keyboard Shortcuts...</button></li>
<?php
if ($prefs['use_mopidy_tagcache'] == 0 &&
    $prefs['use_mopidy_http'] == 0) {
?>
                        <li class="wide"><button class="topformbutton" onclick="editmpdoutputs()">MPD Audio Outputs...</button></li>
<?php
}
?>
                <li class="wide"><img src="newimages/lastfm.png" height="24px" style="vertical-align:middle;margin-right:8px"/><b>Last.FM</b></li>
<?php
                //print '<li class="wide">Information Panel History Depth</li>';
                //print '<li class="wide"><input class="topform" name="historylength" type="text" size="3" value="'.$prefs['historylength'].'"/><button class="topformbutton" onclick="sethistorylength()">Set</button></li>';
                print '<li class="wide">Last.FM Username</li>';
                print '<li class="wide"><input class="enter topform" name="user" type="text" size="45" value="'.$prefs['lastfm_user'].'"/><button class="topformbutton" onclick="lastfmlogin()">Login</button></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="scrobbling">Last.FM Scrobbling Enabled</input></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="radioscrobbling">Don&#39;t Scrobble Radio Tracks</input></li>';
?>
                <li class="wide">Percentage of track to play before scrobbling</li>
                <li class="wide"><div id="scrobwrangler"></div></li>
<?php
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="autocorrect">Last.FM Autocorrect Enabled</input></li>';
                print '<li class="wide">Tag Loved Tracks With:</li>';
                print '<li class="wide"><input class="enter topform" name="taglovedwith" type="text" size="40" value="'.$prefs['autotagname'].'"/><button class="topformbutton" onclick="setAutoTag()">Set</button></li>';

                print '<li class="wide">COUNTRY (for Last.FM) <select id="countryselector" class="topformbutton" onchange="changecountry()">'."\n";
                $x = simplexml_load_file('iso3166.xml');
                foreach($x->CountryEntry as $i => $c) {
                    print '<option value="'.$c->CountryCode.'">'.mb_convert_case($c->CountryName, MB_CASE_TITLE, "UTF-8")."</option>\n";
                }
                print "</select></li>\n";

?>
        </ul>
    </li>

    <li>
        <a href="#" title="Clear Playlist" class="tooltip"><img class="topimg" src="newimages/edit-clear-list.png" height="24px"></a>
        <ul id="clrplst" class="subnav">
            <li><b>Clear Playlist</b></li>
            <li>
                <button style="width:100%" class="topformbutton" onclick="clearPlaylist()">I'm Sure About This</button>
            </li>
        </ul>
    </li>
    <li>
        <a href="#" title="Load Saved Playlist" class="tooltip"><img class="topimg" src="newimages/document-open-folder.png" height="24px"></a>
        <ul id="playlistslist" class="subnav wide"></ul>
    </li>
<?php
if ($prefs['use_mopidy_tagcache'] == 0 &&
    $prefs['use_mopidy_http'] == 0) {
?>
    <li>
        <a href="#" title="Save Playlist" class="tooltip"><img class="topimg" src="newimages/document-save.png" height="24px"></a>
        <ul id="saveplst" class="subnav wide">
            <li class="wide"><b>Save Playlist As</b></li>
            <li class="wide">
                <input class="enter topform" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>
                <button class="topformbutton" onclick="savePlaylist()">Save</button>
            </li>
        </ul>
    </li>
<?php
}
?>
</ul>
</div>
</div>
</div>

<script language="javascript">
    $("#scrobbling").attr("checked", prefs.lastfm_scrobbling);
    $("#radioscrobbling").attr("checked", prefs.dontscrobbleradio);
    $("#autocorrect").attr("checked", prefs.lastfm_autocorrect);
    $("#hideinfobutton").attr("checked", prefs.hidebrowser);
    $("#button_hide_albumlist").attr("checked", prefs.hide_albumlist);
    $("#button_keep_search_open").attr("checked", prefs.keep_search_open);
    $("#button_hide_filelist").attr("checked", prefs.hide_filelist);
    $("#button_hide_lastfmlist").attr("checked", prefs.hide_lastfmlist);
    $("#button_hide_radiolist").attr("checked", prefs.hide_radiolist);
    $("#updateeverytime").attr("checked", prefs.updateeverytime);
    $("#downloadart").attr("checked", prefs.downloadart);
    $("#fullbiobydefault").attr("checked", prefs.fullbiobydefault);
    $("#themeselector").val(prefs.theme);
    $("#countryselector").val(prefs.lastfm_country_code);
    $("[name=clickselect][value="+prefs.clickmode+"]").attr("checked", true);
    $("#playlistcontrols .enter").keyup( onKeyUp );
    $(".tooltip").tipTip({delay: 1000});
</script>