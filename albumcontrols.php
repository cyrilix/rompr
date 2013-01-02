<?php
include ("vars.php");
?>

<div class="columntitle" style="padding-right:0px">
<table width="100%"><tr><td name="sourcecontrol" align="left">
<a title="Local Music" href="#" onclick="sourcecontrol('albumlist')"><img class="topimg" height="24px" src="images/audio-x-generic.png"></a>
<a title="File Browser" href="#" onclick="sourcecontrol('filelist')"><img class="topimg" height="24px" src="images/folder.png"></a>
<a title="Last.FM Radio" href="#" onclick="sourcecontrol('lastfmlist')"><img class="topimg" height="24px" src="images/lastfm.png"></a>
<a title="Internet Radio Stations" href="#" onclick="sourcecontrol('radiolist')"><img class="topimg" height="24px" src="images/broadcast-24.png"></a>
<a href="albumart.php" title="Album Art Manager" target="_blank"><img class="topimg" src="images/cd_jewel_case.jpg" height="24px"></a>
</td>
<td align="right"><img id="sourcesresizer" src="images/resize_handle.png" style="cursor:move"></td>
</tr></table>
</div>

<script language="JavaScript">
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
<?php
if ($prefs['updateeverytime'] == "true" ||
        !file_exists($ALBUMSLIST) ||
        !file_exists($FILESLIST)) 
{
    // debug_print("Rebuilding Music Cache");
    print "updateCollection('update');\n";
} else {
    // debug_print("Loading Music Cache");
    print "prepareForLiftOff()\n";
    print "loadCollection('".$ALBUMSLIST."', '".$FILESLIST."');\n";
}
?>

function prepareForLiftOff() {
    $("#collection").empty();
    $("#filecollection").empty();
    $("#collection").html('<div class="dirname"><h2 id="loadinglabel">Updating Collection...</h2></div>');
    $("#filecollection").html('<div class="dirname"><h2 id="loadinglabel2">Scanning Files...</h2></div>');
    $("#loadinglabel").effect('pulsate', { times:200 }, 2000);
    $("#loadinglabel2").effect('pulsate', { times:200 }, 2000);
}

function updateCollection(cmd) {
    debug.log("Updating collection with command", cmd);
    prepareForLiftOff();
    $.getJSON("ajaxcommand.php", "command="+cmd, function() { 
                update_load_timer = setTimeout( pollAlbumList, 2000);
                update_load_timer_running = true;
    });    
}

function loadCollection(albums, files) {
    $("#loadinglabel").html("Loading Collection");
    $("#loadinglabel2").html("Loading Files");
    $("#collection").load(albums);
    $('#search').load("search.php");
    $("#filecollection").load(files);
    $('#filesearch').load("filesearch.php");
}

function checkPoll(data) {
    if (data.updating_db) {
        debug.log("Updating DB");
        update_load_timer = setTimeout( pollAlbumList, 1000);
        update_load_timer_running = true;
    } else {
        loadCollection("albums.php", "dirbrowser.php");
    }
}

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("ajaxcommand.php", checkPoll);
}

function sourcecontrol(source) {

    sources = ["lastfmlist", "albumlist", "filelist", "radiolist"];
    for(var i in sources) {
        if (sources[i] == source) {
            sources.splice(i, 1);
            break;
        }
    }
    switchsource(source);
    return false;
}

function switchsource(source) {

    var togo = sources.shift();
    if (togo) {
        $("#"+togo).fadeOut('fast', function() { switchsource(source) });
    } else {
        savePrefs({chooser: source});
        $("#"+source).fadeIn('fast');
    }

}

</script>
