<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
?>
<div id="columntitle">
<div class="tleft">
<h2></h2>
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
            <li class="wide">
                    <ul id="lastfmconfig">
                        <li class="wide">THEME</li>
                        <li class="wide"><select id="themeselector" onchange="changetheme()">
<?php
                        $themes = glob("*.css");
                        foreach($themes as $theme) {
                            print '<option value="'.$theme.'">'.$theme.'</option>';
                        }
?>
                        </select></li>
                        <li class="wide"><button class="topform topformbutton" onclick="editkeybindings()">Edit Keyboard Shortcuts...</button></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="browser.hide()" id="hideinfobutton">Hide Information Panel</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="infobar.toggle('random')" id="shufflebutton">Playlist Shuffle</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="infobar.toggle('crossfade')" id="xfadebutton">Crossfade Tracks</input></li>
                        <li class="wide"><input type="checkbox" class="topcheck" onclick="infobar.toggle('repeat')" id="repeatbutton">Repeat Playlist</input></li>
                        <li class="wide">VOLUME</li>
                        <li class="wide"><div id="volume"></div></li>
<?php
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="scrobbling">Last.FM Scrobbling Enabled</input></li>';
?>
                <li class="wide">Percentage of track to play before scrobbling</li>
                <li class="wide"><div id="scrobwrangler"></div></li>
<?php
                print '<li class="wide"><input type="checkbox" class="topcheck" onclick="lastfm.setscrobblestate()" id="autocorrect">Last.FM Autocorrect Enabled</input></li>';
                print '<li class="wide">Last.FM Username</li>';
                print '<li class="wide"><button class="topform topformbutton" onclick="lastfmlogin()">Login</button><input class="topform" name="user" type="text" size="45" value="'.$prefs['lastfm_user'].'"/></li>';
?>

                    </ul>
            </li>
        </ul>
    </li>

    <li>
        <a href="#" title="Clear Playlist"><img src="images/edit-clear-list.png" height="24px"></a>
        <ul id="clrplst" class="subnav">
            <li><b>Clear Playlist</b></li>
            <li>
                <form id="clearplaylist" action="ajaxcommand.php" method="get">
                    <input type="hidden" name="command" value="clear"/>
                    <button class="topform topformbutton" type="submit">I'm Sure About This</button>
                </form>
            </li>
        </ul>
    </li>
    <li>
        <a href="#" title="Load Saved Playlist"><img src="images/document-open-folder.png" height="24px"></a>
        <ul id="playlistslist" class="subnav wide">
            <li><b>Playlists</b></li>
<?php
            $playlists = do_mpd_command($connection, "listplaylists", null, true);
            if (!is_array($playlists['playlist'])) {
                $temp = $playlists['playlist'];
                $playlists = array();
                $playlists['playlist'][0] = $temp;
            }
            sort($playlists['playlist'], SORT_STRING);
            print '<li class="tleft wide"><table width="100%">';
            foreach ($playlists['playlist'] as $pl) {

                print '<tr><td align="left"><a href="#" onclick="infobar.command(\'command=load&arg='.rawurlencode($pl).'\', playlist.repopulate)">'.$pl.'</a></td>';
                print '<td align="right"><a href="#" onclick="infobar.command(\'command=rm&arg='.rawurlencode($pl).'\', reloadPlaylistControls)"><img src="images/edit-delete.png"></a></td></tr>';

            }
            print '</table></li>';
?>
        </ul>
    </li>
    <li>
        <a href="#" title="Save Playlist"><img src="images/document-save.png" height="24px"></a>
        <ul id="saveplst" class="subnav wide">
            <li class="wide"><b>Save Playlist As</b></li>
            <li class="wide">
                <form id="saveplaylist" action="ajaxcommand.php" method="get">
                    <input type="hidden" name="command" value="save"/>
                    <button class="topform topformbutton" type="submit">Save</button>
                    <input class="topform" name="arg" type="text" size="37"/>
                </form>
            </li>
        </ul>
    </li>
</ul>
</div>
</div>

<script type="text/javascript">

$('#clearplaylist').ajaxForm(function() {
    $('#clearplaylist').parents("ul.subnav").slideToggle('fast');
    playlist.repopulate();
    infobar.update();

});

$('#saveplaylist').ajaxForm(function() {
    reloadPlaylistControls();
});

$("ul.topnav li a").click(function() {
    $(this).parent().find("ul.subnav").slideToggle('fast');
});

$("#playlistslist").hover(function() {}, function() { $("#playlistslist").slideToggle('fast') });
$("#clrplst").hover(function() {}, function() { $("#clrplst").slideToggle('fast') });
$("#saveplst").hover(function() {}, function() { $("#saveplst").slideToggle('fast') });

$("#volume").progressbar();
$("#volume").click(function(evt) { infobar.setvolume(evt) });
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

    print '    $("#volume").progressbar("option", "value", ';
    print $prefs['volume'];
    print ");\n";

   print '$("#themeselector").val("'.$prefs['theme'].'");'."\n";


?>
lastfm.setscrobblestate();


</script>

<?php
close_mpd($connection);
?>
