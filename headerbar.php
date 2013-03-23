<?php
include ("vars.php");
include ("functions.php");
?>

<div id="albumcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox leftbox">
<a title="Local Music" href="#" onclick="sourcecontrol('albumlist')" id="choose_albumlist"><img class="topimg" height="24px" src="images/audio-x-generic.png"></a>
<a title="File Browser" href="#" onclick="sourcecontrol('filelist')" id="choose_filelist"><img class="topimg" height="24px" src="images/folder.png"></a>
<a title="Last.FM Radio" href="#" onclick="sourcecontrol('lastfmlist')" id="choose_lastfmlist"><img class="topimg" height="24px" src="images/lastfm.png"></a>
<a title="Internet Radio Stations" href="#" onclick="sourcecontrol('radiolist')" id="choose_radiolist"><img class="topimg" height="24px" src="images/broadcast-24.png"></a>
<a href="albumart.php" title="Album Art Manager" target="_blank"><img class="topimg" src="images/cd_jewel_case.jpg" height="24px"></a>
</div>
<div class="fixed topbox">
<img id="sourcesresizer" height="24px" src="images/resize2.png" style="cursor:move">
</div>
</div>
</div>

<div id="infocontrols" class="cmiddle noborder tleft">
<div class="containerbox fullwidth">
<div class="fixed topbox">
<a title="Toggle Sources Panel" href="#" onclick="expandInfo('left')"><img id="expandleft" height="24px" src="images/arrow-left-double.png" style="padding-left:4px"></a>
</div>
<div class="expand containerbox center topbox">
<div class="noborder fixed">
<a id="backbutton" title="Back"><img class="topimg" height="24px" src="images/backbutton_disabled.png"></a>
<ul class="topnav">
    <li>
        <a href="#" title="History"><img src="images/history_icon.png" class="topimg" height="24px"></a>
        <ul id="historypanel" class="subnav widel">
            <li class="wider"><b>HISTORY</b></li>
        </ul>
    </li>
</ul>
<a title="Artist Info from Wikipedia" href="#" onclick="browser.switchSource('wikipedia')"><img class="topimg" height="24px" src="images/Wikipedia-logo.png"></a>
<a title="Artist, Album, and Song Info from Last.FM" href="#" onclick="browser.switchSource('lastfm')"><img class="topimg" height="24px" src="images/lastfm.png"></a>
<a title="Artist Slideshow" href="#" onclick="browser.switchSource('slideshow')"><img class="topimg" height="24px" src="images/slideshow.png"></a>
<a id="forwardbutton" title="Forward"><img class="topimg" height="24px" src="images/forwardbutton_disabled.png"></a>
</div>
</div>
<div class="fixed topbox">
<a title="Toggle Playlist" href="#" onclick="expandInfo('right')"><img height="24px" id="expandright" src="images/arrow-right-double.png" style="padding-right:4px"></a>
</div>
</div>
</div>

<div id="playlistcontrols" class="column noborder tleft">
<div class="containerbox fullwidth">
<div class="expand topbox">
<img id="playlistresizer" src="images/resize2.png" height="24px" style="cursor:move">
</div>
<div class="fixed topbox">
<ul class="topnav">
    <li>
        <a href="#" title="RompR/mpd Preferences"><img class="topimg" src="images/preferences.png" height="24px"></a>
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
<?php
if ($prefs['use_mopidy_tagcache'] == 0) {
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

                        <li class="wide"><b>Music Selection Click Behaviour</b></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="double">Double-click to add, Click to select</input></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="single">Click to add, no selection</input></li>

                        <li class="wide">Crossfade Duration (seconds)</li>
<?php
                        print '<li class="wide"><input class="enter topform" name="michaelbarrymore" type="text" size="3" value="'.$prefs['crossfade_duration'].'"/><button class="topformbutton" onclick="setXfadeDur()">Set</button></li>';
?>                        
<?php
if ($prefs['use_mopidy_tagcache'] == 0) {
?>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('updateeverytime')" id="updateeverytime">Update Collection On Start</input></li>
                        <li class="wide"><button class="topformbutton" onclick="updateCollection('update')">Update Collection Now</button></li>
<?php
} else {
?>
                        <li class="wide"><button class="topformbutton" onclick="mopidyUpdate()">Re-read Mopidy Tag Cache</button></li>
<?php
}
?>
                        <li class="wide"><button class="topformbutton" onclick="updateCollection('rescan')">Full Collection Rescan</button></li>
                        <li class="wide"><button class="topformbutton" onclick="editkeybindings()">Edit Keyboard Shortcuts...</button></li>
                        <li class="wide"><button class="topformbutton" onclick="editmpdoutputs()">MPD Audio Outputs...</button></li>
                <li class="wide"><b>Last.FM</b></li>
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
        <a href="#" title="Clear Playlist"><img class="topimg" src="images/edit-clear-list.png" height="24px"></a>
        <ul id="clrplst" class="subnav">
            <li><b>Clear Playlist</b></li>
            <li>
                <button style="width:100%" class="topformbutton" onclick="clearPlaylist()">I'm Sure About This</button>
            </li>
        </ul>
    </li>
    <li>
        <a href="#" title="Load Saved Playlist"><img class="topimg" src="images/document-open-folder.png" height="24px"></a>
        <ul id="playlistslist" class="subnav wide"></ul>
    </li>
    <li>
        <a href="#" title="Save Playlist"><img class="topimg" src="images/document-save.png" height="24px"></a>
        <ul id="saveplst" class="subnav wide">
            <li class="wide"><b>Save Playlist As</b></li>
            <li class="wide">
                <input class="enter topform" style="width:195px" name="nigel" id="playlistname" type="text" size="200"/>
                <button class="topformbutton" onclick="savePlaylist()">Save</button>
            </li>
        </ul>
    </li>
</ul>
</div>
</div>
</div>

<script language="javascript">
    $("#scrobwrangler").progressbar();
    $("#scrobwrangler").progressbar("option", "value", parseInt(prefs.scrobblepercent.toString()));
    $("#scrobwrangler").click( setscrob );
    $("#scrobbling").attr("checked", prefs.lastfm_scrobbling);
    $("#radioscrobbling").attr("checked", prefs.dontscrobbleradio);
    $("#autocorrect").attr("checked", prefs.lastfm_autocorrect);
    $("#hideinfobutton").attr("checked", prefs.hidebrowser);
    $("#button_hide_albumlist").attr("checked", prefs.hide_albumlist);
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
</script>