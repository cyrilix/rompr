<?php
include ("vars.php");
include ("functions.php");
?>
<div class="columntitle" style="padding-left:0px">
<div class="tleft">
<img id="playlistresizer" src="images/resize2.png" style="cursor:move">
</div>
<div class="tright">
<ul class="topnav">
    <li>
        <a href="#" title="RompR/mpd Preferences"><img src="images/preferences.png" height="24px"></a>
        <ul id="configpanel" class="subnav wide">
            <li class="wide"><b>CONFIGURATION</b></li>
                        <li class="wide">THEME <select id="themeselector" class="topformbutton" onchange="changetheme()">
<?php
                        $themes = glob("*.css");
                        foreach($themes as $theme) {
                            if ($theme != "layout.css") {
                                print '<option value="'.$theme.'">'.preg_replace('/\.css$/', "", $theme).'</option>';
                            }
                        }
?>
                        </select></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="browser.hide()" id="hideinfobutton">Hide Information Panel</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('downloadart')" id="downloadart">Automatically Download Covers</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('updateeverytime')" id="updateeverytime">Update Collection On Start</input></li>

                        <li class="wide"><b>Music Selection Click Behaviour</b></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="double">Double-click to add, Click to select</input></li>
                        <li class="wide"><input type="radio" class="topcheck" onclick="changeClickPolicy()" name="clickselect" value="single">Click to add, no selection</input></li>

                        <li class="wide"><button class="topformbutton" onclick="updateCollection('update')">Update Collection Now</button></li>
                        <li class="wide"><button class="topformbutton" onclick="updateCollection('rescan')">Full Collection Rescan</button></li>
                        <li class="wide"><button class="topformbutton" onclick="editkeybindings()">Edit Keyboard Shortcuts...</button></li>
                        <li class="wide"><button class="topformbutton" onclick="editmpdoutputs()">MPD Audio Outputs...</button></li>
<?php
                //print '<li class="wide">Information Panel History Depth</li>';
                //print '<li class="wide"><input class="topform" name="historylength" type="text" size="3" value="'.$prefs['historylength'].'"/><button class="topformbutton" onclick="sethistorylength()">Set</button></li>';
                print '<li class="wide">Last.FM Username</li>';
                print '<li class="wide"><input class="topform" name="user" type="text" size="45" value="'.$prefs['lastfm_user'].'"/><button class="topformbutton" onclick="lastfmlogin()">Login</button></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="scrobbling">Last.FM Scrobbling Enabled</input></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="radioscrobbling">Don&#39;t Scrobble Radio Tracks</input></li>';
?>
                <li class="wide">Percentage of track to play before scrobbling</li>
                <li class="wide"><div id="scrobwrangler"></div></li>
<?php
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="autocorrect">Last.FM Autocorrect Enabled</input></li>';
                print '<li class="wide">Tag Loved Tracks With:</li>';
                print '<li class="wide"><input class="topform" name="taglovedwith" type="text" size="40" value="'.$prefs['autotagname'].'"/><button class="topformbutton" onclick="setAutoTag()">Set</button></li>';

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
        <a href="#" title="Clear Playlist"><img src="images/edit-clear-list.png" height="24px"></a>
        <ul id="clrplst" class="subnav">
            <li><b>Clear Playlist</b></li>
            <li>
                <button style="width:100%" class="topformbutton" onclick="clearPlaylist()">I'm Sure About This</button>
            </li>
        </ul>
    </li>
    <li>
        <a href="#" title="Load Saved Playlist"><img src="images/document-open-folder.png" height="24px"></a>
        <ul id="playlistslist" class="subnav wide"></ul>
    </li>
    <li>
        <a href="#" title="Save Playlist"><img src="images/document-save.png" height="24px"></a>
        <ul id="saveplst" class="subnav wide">
            <li class="wide"><b>Save Playlist As</b></li>
            <li class="wide">
                <input class="topform" style="width:195px" id="playlistname" type="text" size="200"/>
                <button class="topformbutton" onclick="savePlaylist()">Save</button>
            </li>
        </ul>
    </li>
</ul>
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
    $("#updateeverytime").attr("checked", prefs.updateeverytime);
    $("#downloadart").attr("checked", prefs.downloadart);
    $("#themeselector").val(prefs.theme);
    $("#countryselector").val(prefs.lastfm_country_code);
    $("[name=clickselect][value="+prefs.clickmode+"]").attr("checked", true);        
</script>