<div id="columntitle">
<table width="100%"><tr><td name="sourcecontrol" align="left">
<h2 name="artistslabel"></h2>
</td></tr></table>
</div>

<script language="JavaScript">
var sources = new Array();
var update_load_timer = 0;
var update_load_timer_running = false;
$.getJSON("ajaxcommand.php", "command=update", function(data) {  });
$('h2[name|="artistslabel"]').html("Updating Collection").effect('pulsate', { times:100 }, 2000);
update_load_timer = setTimeout("pollAlbumList()", 500);
update_load_timer_running = true;

function pollAlbumList() {
    if(update_load_timer_running) {
        clearTimeout(update_load_timer);
        update_load_timer_running = false;
    }
    $.getJSON("ajaxcommand.php", "command=status", function(data) {
        if (data.updating_db) {
            update_load_timer = setTimeout("pollAlbumList()", 1000);
            update_load_timer_running = true;
        } else {
            $('h2[name|="artistslabel"]').html("Loading Collection");
            $("#albumlist").load("albums.php", function() {
                $('h2[name|="artistslabel"]').stop(true, true);
                $("#filelist").load("dirbrowser.php");
                $('td[name|="sourcecontrol"]').html('<a href="#" title="Local Music" onclick="sourcecontrol(\'albumlist\')">'+
                                                    '<img class="topimg" height="24px" src="images/audio-x-generic.png"></a>'+
                                                    '<a href="#" title="File Browser" onclick="sourcecontrol(\'filelist\')">'+
                                                    '<img class="topimg" height="24px" src="images/folder.png"></a>'+
                                                    '<a href="#" title="Last.FM Radio" onclick="sourcecontrol(\'lastfmlist\')">'+
                                                    '<img class="topimg" height="24px" src="images/lastfm.png"></a>'+
                                                    '<a href="#" title="Live BBC Radio" onclick="sourcecontrol(\'bbclist\')">'+
                                                    '<img class="topimg" height="24px" src="images/bbcr.png"></a>'+
                                                    '<a href="#" title="IceCast Radio" onclick="sourcecontrol(\'icecastlist\')">'+
                                                    '<img class="topimg" height="24px" src="images/icecast.png"></a>'+
                                                    '<a href="#" title="soma fm radio" onclick="sourcecontrol(\'somafmlist\')">'+
                                                    '<img class="topimg" width="36px" src="images/somafm.png"></a>'
                );
            })
        }
    });
}

function sourcecontrol(source) {
    
    sources = ["lastfmlist", "albumlist", "filelist", "bbclist", "icecastlist", "somafmlist"];
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
        $("#"+source).fadeIn('fast');
    }
} 

</script>
