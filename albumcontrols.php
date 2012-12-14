<?php
include ("vars.php");
?>

<div id="columntitle" style="padding-right:0px">
<table width="100%"><tr><td name="sourcecontrol" align="left">
<a href="#" title="Local Music" onclick="sourcecontrol('albumlist')"><img class="topimg" height="24px" src="images/audio-x-generic.png"></a>
<a href="#" title="File Browser" onclick="sourcecontrol('filelist')"><img class="topimg" height="24px" src="images/folder.png"></a>
<a href="#" title="Last.FM Radio" onclick="sourcecontrol('lastfmlist')"><img class="topimg" height="24px" src="images/lastfm.png"></a>
<a href="#" title="Internet Radio Stations" onclick="sourcecontrol('radiolist')"><img class="topimg" height="24px" src="images/broadcast.png"></a>
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
    // error_log("Rebuilding Music Cache");
    print "updateCollection('update');\n";
} else {
    // error_log("Loading Music Cache");
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

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("ajaxcommand.php", "", function(data) {
        if (data.updating_db) {
            debug.log("Updating DB");
            update_load_timer = setTimeout( pollAlbumList, 1000);
            update_load_timer_running = true;
        } else {
            loadCollection("albums.php", "dirbrowser.php");
        }
    });
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
