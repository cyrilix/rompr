<?php
include ("vars.php");
?>

<div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <img src="images/lastfm.png" class="fixed smallcover">
        <h3>Last.FM Personal Radio</h3>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmuser">
        <div class="expand">
<?php
            if ($prefs['lastfm_user'] != "") {
                print $prefs['lastfm_user']."'s ";
            }
            print "Library Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmmix">
        <div class="expand">
<?php
            if ($prefs['lastfm_user'] != "") {
                print $prefs['lastfm_user']."'s ";
            }
            print "Mix Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmrecommended">
        <div class="expand">
<?php
            if ($prefs['lastfm_user'] != "") {
                print $prefs['lastfm_user']."'s ";
            }
            print "Recommended Radio";
?>
        </div>
    </div>
    <div class="clickable clicklfm indent containerbox padright menuitem", name="lastfmneighbours">
        <div class="expand">
<?php
            if ($prefs['lastfm_user'] != "") {
                print $prefs['lastfm_user']."'s ";
            }
            print "Neighbourhood Radio";
?>
        </div>
    </div>

    <div class="indent containerbox padright">
        <h3>Last.FM Artist Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="sourceform expand" id="lastfmartist" type="text" size="60"/>        
        <button class="topformbutton fixed" onclick="doLastFM('lastfmartist')">Play</button>
    </div>

    <div class="indent containerbox padright">
        <h3>Last.FM Artist Fan Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="sourceform expand" id="lastfmfan" type="text" size="60"/>        
        <button class="topformbutton fixed" onclick="doLastFM('lastfmfan')">Play</button>
    </div>

    <div class="indent containerbox padright">
        <h3>Last.FM Global Tag Radio</h3>
    </div>
    <div class="indent containerbox padright">
        <input class="sourceform expand" id="lastfmglobaltag" type="text" size="60"/>        
        <button class="topformbutton fixed" onclick="doLastFM('lastfmglobal')">Play</button>
    </div>
    
    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <img src="images/toggle-closed.png" class="menu fixed" onclick="getFriends(event)" name="lfmfriends">
        Friends
        <img id="freindswait" height="14px" width="14px" src="images/transparent-32x32.png" />
    </div>
    <div id="lfmfriends" class="dropmenu"></div>
    </div>
    
    <div class="noselection fullwidth">
    <div class="containerbox menuitem">
        <img src="images/toggle-closed.png" class="menu fixed" onclick="getNeighbours(event)" name="lfmneighbours">
        Neighbours
        <img id="neighbourwait" height="14px" width="14px" src="images/transparent-32x32.png" />
    </div>
    <div id="lfmneighbours" class="dropmenu"></div>
    </div>

    
</div>
