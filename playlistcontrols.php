<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
?>
<div id="columntitle" style="padding-left:0px">
<div class="tleft">
<img id="playlistresizer" src="images/resize_handle.png" style="cursor:move">
</div>
<div class="tright">
<ul class="topnav">
    <li>
        <a href="albumart.php" title="Album Art Manager" target="_blank"><img src="images/cd_jewel_case.jpg" height="24px"></a>
    </li>
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
                        <li class="wide"><button class="topformbutton" onclick="editkeybindings()">Edit Keyboard Shortcuts...</button></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="browser.hide()" id="hideinfobutton">Hide Information Panel</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="toggleOption('random')" id="shufflebutton">Playlist Shuffle</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="toggleOption('crossfade')" id="xfadebutton">Crossfade Tracks</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="toggleOption('repeat')" id="repeatbutton">Repeat Playlist</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('downloadart')" id="downloadart">Automatically Download Covers</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="togglePref('updateeverytime')" id="updateeverytime">Update Collection On Start</input></li>
                        <li class="wide"><button class="topformbutton" onclick="updateCollection('update')">Update Collection Now</button></li>
                        <li class="wide"><button class="topformbutton" onclick="updateCollection('rescan')">Full Collection Rescan</button></li>
<?php
                print '<li class="wide">Information Panel History Depth</li>';
                print '<li class="wide"><input class="topform" name="historylength" type="text" size="3" value="'.$prefs['historylength'].'"/><button class="topformbutton" onclick="sethistorylength()">Set</button></li>';
                print '<li class="wide">Last.FM Username</li>';
                print '<li class="wide"><input class="topform" name="user" type="text" size="45" value="'.$prefs['lastfm_user'].'"/><button class="topformbutton" onclick="lastfmlogin()">Login</button></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="scrobbling">Last.FM Scrobbling Enabled</input></li>';
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="radioscrobbling">Don&#39;t Scrobble Radio Tracks</input></li>';
?>
                <li class="wide">Percentage of track to play before scrobbling</li>
                <li class="wide"><div id="scrobwrangler"></div></li>
<?php
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="autocorrect">Last.FM Autocorrect Enabled</input></li>';
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
        <ul id="playlistslist" class="subnav wide">
            <li class="tleft wide"><b>Playlists</b></li>
<?php
            $playlists = do_mpd_command($connection, "listplaylists", null, true);
            if ($playlists['playlist'] && !is_array($playlists['playlist'])) {
                $temp = $playlists['playlist'];
                $playlists = array();
                $playlists['playlist'][0] = $temp;
            }
            if (is_array($playlists['playlist'])) {
                sort($playlists['playlist'], SORT_STRING);
                print '<li class="tleft wide"><table width="100%">';
                foreach ($playlists['playlist'] as $pl) {

                    print '<tr><td align="left"><a href="#" onclick="mpd.command(\'command=load&arg='.rawurlencode($pl).'\', playlist.repopulate)">'.htmlspecialchars($pl).'</a></td>';
                    print '<td class="playlisticon" align="right"><a href="#" onclick="mpd.command(\'command=rm&arg='.rawurlencode($pl).'\', reloadPlaylistControls)"><img src="images/edit-delete.png"></a></td></tr>';

                }
                print '</table></li>';
            }
?>
        </ul>
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

<script type="text/javascript">

$("ul.topnav li a").unbind('click');
$("ul.topnav li a").click(function() {
    $(this).parent().find("ul.subnav").slideToggle('fast');
});

$("#scrobwrangler").progressbar();
$("#scrobwrangler").progressbar("option", "value", parseInt(scrobblepercent.toString()));
$("#scrobwrangler").click(function(evt) { setscrob(evt) });

<?php
    print '    $("#scrobbling").attr("checked", ';
    if ($prefs['lastfm_scrobbling'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#radioscrobbling").attr("checked", ';
    if ($prefs['dontscrobbleradio'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#hideinfobutton").attr("checked", '.$prefs['hidebrowser'].");\n";

    print '    $("#autocorrect").attr("checked", ';
    if ($prefs['lastfm_autocorrect'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#shufflebutton").attr("checked", ';
    if ($prefs['random'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#xfadebutton").attr("checked", ';
    if ($prefs['crossfade'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#repeatbutton").attr("checked", ';
    if ($prefs['repeat'] == 0) {
        print 'false';
    } else {
        print 'true';
    }
    print ");\n";

    print '    $("#updateeverytime").attr("checked", '.$prefs['updateeverytime'].");\n";
    print '    $("#downloadart").attr("checked", '.$prefs['downloadart'].");\n";

    
   print '$("#themeselector").val("'.$prefs['theme'].'");'."\n";

?>
lastfm.setscrobblestate();

</script>

<?php
close_mpd($connection);
?>
