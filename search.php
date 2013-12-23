<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
include ("international.php");
$mopidy_detected = detect_mopidy();

if (!$mopidy_detected) {

//
// MPD - style search
//

?>
    <div class="containerbox" style="width:100%">
    <form name="search" action="search.php" method="get">
    <ul class="sourcenav">
<?php
print '<li><b>'.get_int_text("label_searchfor").'</b></li>';
print '<li><input type="radio" name="stype" value="title"> '.get_int_text("label_track").'</input></li>';
print '<li><input type="radio" name="stype" value="album"> '.get_int_text("label_album").'</input></li>';
print '<li><input type="radio" name="stype" value="artist"> '.get_int_text("label_artist").'</input></li>';
print '<li><input class="sourceform winkle" name="searchtitle" type="text" size="60" />';
print '<button id="henrythegippo" type="submit" onclick="doSomethingUseful(\'search\',\''.get_int_text("label_searching").'\')">'.get_int_text("button_search").'</button></li>';
?>
    </ul>
    </form>
    </div>
<?php

    $cmd = "";

    if(array_key_exists("searchtitle", $_REQUEST)) {
        $cmd = "search ".$_REQUEST['stype'].' "'.format_for_mpd(html_entity_decode($_REQUEST['searchtitle'])).'"';
    }

    if ($cmd != "") {

        $count = 1;
        $divtype = "album1";
        $collection = doCollection($cmd);
        $output = new collectionOutput($ALBUMSEARCH);
        createXML($collection->getSortedArtistList(), "b", $output);
        $output->closeFile();
        print '<div class="menuitem">';
        print '<h3>'.get_int_text("label_searchresults")."</h3>";
        print "</div>";
        dumpAlbums('balbumroot');
        print '<div class="separator"></div>';

    }

    close_mpd($connection);

?>

    <script type="text/javascript">
    $('form[name="search"]').ajaxForm(function(data) {
        $('#search').html(data);
    });

<?php
    $pigeon = "artist";
    if (array_key_exists("stype", $_REQUEST)) {
        $pigeon = $_REQUEST['stype'];
    }

    print '    $(\'input[value="'.$pigeon.'"]\').attr("checked", true);'."\n";

    if (array_key_exists("searchtitle", $_REQUEST)) {
        print '    $(\'input[name="searchtitle"]\').val(\''.addslashes($_REQUEST['searchtitle']).'\');'."\n";
    }
?>
    </script>
<?php
} else {

//
// Mopidy - style search
//
?>
    <div id="mopidysearcher" style="padding:6px">
        <div class="containerbox padright">
<?php
print '<h3>'.get_int_text("label_searchfor").'</h3>';
?>
        </div>
        <div class="containerbox padright wibble">
<?php
print '<i>'.get_int_text("label_multiterms").'</i>';
?>
        </div>

        <div class="containerbox padright">
<?php
$labia = strlen(get_int_text("label_artist"));
foreach(array(get_int_text("label_album"), get_int_text("label_track"), get_int_text("label_anything")) as $a) {
    if (strlen($a) > $labia) {
        $labia = strlen($a);
    }
}
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_artist").'</b></div>';
?>
            <div class="expand"><input class="searchterm enter sourceform" name="artist" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_album").'</b></div>';
?>
            <div class="expand"><input class="searchterm enter sourceform" name="album" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_track").'</b></div>';
?>
            <div class="expand"><input class="searchterm enter sourceform" name="track_name" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_anything").'</b></div>';
?>
            <div class="expand"><input class="searchterm enter sourceform" name="any" type="text" size="90" style="width:95%" /></div>
        </div>

<?php
        print '<div class="indent containerbox padright">';
        print '<input type="checkbox" id="limitsearch" value="1" onclick="weaselBurrow()"';
        if ($prefs['search_limit_limitsearch'] == 1) {
            print ' checked';
        }
        print '>'.get_int_text("label_limitsearch").'</input>';
        print '</div>';

        print '<div class="dropmenu" id="mopidysearchdomains" style="margin-top:4px';
        if ($prefs['search_limit_limitsearch'] == 1) {
            print ';display:block';
        }
        print '">';
        foreach ($searchlimits as $domain => $text) {
            print '<div class="indent containerbox padright">';
            print '<input type="checkbox" class="searchdomain" value="'.$domain.'"';
            if ($prefs['search_limit_'.$domain] == 1) {
                print ' checked';
            }
            print '>'.$text.'</input>';
            print '</div>';
        }
        print '</div>';
?>
        <div class="indent containerbox padright">
            <div class="expand"></div>
<?php
print '<button class="fixed" onclick="player.http.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
            <!-- <button class="fixed" onclick="player.doMopidySearch('findExact')">Find Exact Match</button> -->
        </div>


        <div id="searchresultholder" class="noselection fullwidth"></div>

    </div>
    <script type="text/javascript">
        $("#mopidysearcher input").keyup( function(event) {
            if (event.keyCode == 13) {
                player.http.search('search');
            }
        } );
    </script>


<?php
}
?>