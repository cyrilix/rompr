<div id="columntitle">
<table width="100%"><tr><td name="sourcecontrol" align="left">
<a href="#" title="Local Music" onclick="sourcecontrol('albumlist')"><img class="topimg" height="24px" src="images/audio-x-generic.png"></a>
<a href="#" title="File Browser" onclick="sourcecontrol('filelist')"><img class="topimg" height="24px" src="images/folder.png"></a>
<a href="#" title="Last.FM Radio" onclick="sourcecontrol('lastfmlist')"><img class="topimg" height="24px" src="images/lastfm.png"></a>
<a href="#" title="Internet Radio Stations" onclick="sourcecontrol('radiolist')"><img class="topimg" height="24px" src="images/broadcast.png"></a>
</td></tr></table>
</div>

<script language="JavaScript">
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
$.getJSON("ajaxcommand.php", "command=update", function(data) {  });
$("#loadinglabel").html("Updating Collection").effect('pulsate', { times:100 }, 2000);
update_load_timer = setTimeout("pollAlbumList()", 1000);
update_load_timer_running = true;

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("ajaxcommand.php", "", function(data) {
        if (data.updating_db) {
            update_load_timer = setTimeout("pollAlbumList()", 1000);
            update_load_timer_running = true;
        } else {
            $("#loadinglabel").html("Loading Collection");
            $("#albumlist").load("albums.php");
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
