<?php
include ("vars.php");
include ("functions.php");
include('international.php');
if ($prefs['lastfm_user'] != "") {
?>

<div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <img src="newimages/lastfm.png" class="fixed smallcover">
<?php
print '<h3>'.get_int_text('label_lastfmradio', array(get_int_text('label_lastfm'))).'</h3>';
?>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmuser">
        <div class="expand">
<?php
print get_int_text("label_userlibrary", array($prefs['lastfm_user']));
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmmix">
        <div class="expand">
<?php
print get_int_text("label_usermix", array($prefs['lastfm_user']));
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmrecommended">
        <div class="expand">
<?php
print get_int_text("label_userrecommended", array($prefs['lastfm_user']));
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmneighbours">
        <div class="expand">
<?php
print get_int_text("label_neighbourhood", array($prefs['lastfm_user']));
?>
        </div>
    </div>

<?php
    if ($prefs['autotagname'] != "" && $prefs['lastfm_user'] != "") {
        print '<div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmloved">';
        print '<div class="expand">';
        print get_int_text("label_lovedtagradio", array($prefs['autotagname']));
        print '</div>';
        print '</div>';
    }
?>

    <div class="indent containerbox padright">
<?php
print '<h3>'.get_int_text("label_artistradio", array(get_int_text("label_lastfm"))).'</h3>';
?>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform" name="albert" id="lastfmartist" type="text" size="60"/>
<?php
print '<button class="fixed" onclick="doLastFM(\'lastfmartist\')">'.get_int_text("button_playradio").'</button>';
?>
    </div>

    <div class="indent containerbox padright">
<?php
print '<h3>'.get_int_text("label_fanradio", array(get_int_text("label_lastfm"))).'</h3>';
?>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform expand" name="gary" id="lastfmfan" type="text" size="60"/>
<?php
print '<button class="fixed" onclick="doLastFM(\'lastfmfan\')">'.get_int_text("button_playradio").'</button>';
?>
    </div>

    <div class="indent containerbox padright">
<?php
print '<h3>'.get_int_text("label_tagradio", array(get_int_text("label_lastfm"))).'</h3>';
?>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform expand" name="throatwobbler" id="lastfmglobaltag" type="text" size="60"/>
<?php
print '<button class="fixed" onclick="doLastFM(\'lastfmglobaltag\')">'.get_int_text("button_playradio").'</button>';
?>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getTopTags(event)" name="lfmtoptags"></div>
        <div class="expand">
<?php
print get_int_text("label_toptags", array($prefs['lastfm_user']));
?>
        <img id="toptagswait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
        </div>
    </div>
    <div id="lfmtoptags" class="dropmenu"></div>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getTopArtists(event)" name="lfmtopartists"></div>
        <div class="expand">
<?php
print get_int_text("label_topartists", array($prefs['lastfm_user']));
?>
        <img id="topartistswait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
        </div>
    </div>
    <div id="lfmtopartists" class="dropmenu"></div>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getFriends(event)" name="lfmfriends"></div>
        <div class="expand">
<?php
print get_int_text("label_freinds", array($prefs['lastfm_user']));
?>
        <img id="freindswait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
        </div>
    </div>
    <div id="lfmfriends" class="dropmenu"></div>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getNeighbours(event)" name="lfmneighbours"></div>
        <div class="expand">
<?php
print get_int_text("label_neighbours", array($prefs['lastfm_user']));
?>
        <img id="neighbourwait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
        </div>
    </div>
    <div id="lfmneighbours" class="dropmenu"></div>
    </div>


</div>

<?php
} else {
?>
<div class="noselection fullwidth">
<div class="indent">
<?php
print '<h3>'.get_int_text("label_notloggedin", array(get_int_text('label_lastfm'),get_int_text('label_lastfm'))).'</h3>';
print '<p>'.get_int_text("label_notloggedin2", array(get_int_text("label_lastfm"))).'</p>';
?>
</div>
</div>
<?php
}
?>
<script language="javascript">
    $("#lastfmlist .enter").keyup( onKeyUp );
</script>