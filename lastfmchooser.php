<?php
include ("vars.php");

if ($prefs['lastfm_user'] != "") {
?>

<div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <img src="newimages/lastfm.png" class="fixed smallcover">
        <h3>Last.FM Personal Radio</h3>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmuser">
        <div class="expand">
<?php
            print $prefs['lastfm_user']."'s ";
            print "Library Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmmix">
        <div class="expand">
<?php
            print $prefs['lastfm_user']."'s ";
            print "Mix Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmrecommended">
        <div class="expand">
<?php
            print $prefs['lastfm_user']."'s ";
            print "Recommended Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmneighbours">
        <div class="expand">
<?php
            print $prefs['lastfm_user']."'s ";
            print "Neighbourhood Radio";
?>
        </div>
    </div>

<?php
    if ($prefs['autotagname'] != "" && $prefs['lastfm_user'] != "") {
        print '<div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmloved">';
        print '<div class="expand">';
        print "Tracks Tagged With '".$prefs['autotagname']."'";
        print '</div>';
        print '</div>';
    }
?>

    <div class="indent containerbox padright">
        <h3>Last.FM Artist Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform" name="albert" id="lastfmartist" type="text" size="60"/>
        <button class="fixed" onclick="doLastFM('lastfmartist')">Play</button>
    </div>

    <div class="indent containerbox padright">
        <h3>Last.FM Artist Fan Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform expand" name="gary" id="lastfmfan" type="text" size="60"/>
        <button class="fixed" onclick="doLastFM('lastfmfan')">Play</button>
    </div>

    <div class="indent containerbox padright">
        <h3>Last.FM Global Tag Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="enter sourceform expand" name="throatwobbler" id="lastfmglobaltag" type="text" size="60"/>
        <button class="fixed" onclick="doLastFM('lastfmglobaltag')">Play</button>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getTopTags(event)" name="lfmtoptags"></div>
        <div class="expand">
<?php
            print $prefs['lastfm_user']."'s ";
            print "Top Tags";
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
            print $prefs['lastfm_user']."'s ";
            print "Top Artists";
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
        Friends
        <img id="freindswait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
        </div>
    </div>
    <div id="lfmfriends" class="dropmenu"></div>
    </div>

    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" onclick="getNeighbours(event)" name="lfmneighbours"></div>
        <div class="expand">
        Neighbours
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
<h3>Please log in to Last.FM to use Last.FM radio</h3>
<p>Please Note: Last.FM radio requires a subscription and may not be available in your country</p>
</div>
</div>
<?php
}
?>
<script language="javascript">
    $("#lastfmlist .enter").keyup( onKeyUp );
</script>