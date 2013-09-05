<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

if ($prefs['use_mopidy_http'] == 0) {

//
// MPD - style search
//

?>
    <div class="containerbox" style="width:100%">
    <form name="search" action="search.php" method="get">
    <ul class="sourcenav">
    <li><b>Search For:</b></li>
    <li><input type="radio" name="stype" value="title"> Track</input></li>
    <li><input type="radio" name="stype" value="album"> Album</input></li>
    <li><input type="radio" name="stype" value="artist"> Artist</input></li>
    <li><input class="sourceform winkle" name="searchtitle" type="text" size="60" />
    <button id="henrythegippo" type="submit" onclick="doSomethingUseful('search','Searching...')">Search</button></li>
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
        print "<h3>Search Results:</h3>";
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
            <h3>Search For:</h3>
        </div>
        <div class="containerbox padright wibble">
            <i>Multiple search terms can be used at once</i>
        </div>
        <div class="containerbox padright wibble">
            <span class="tiny"><i>The search functionality of some backends may not match these options</i></span>
        </div>

        <div class="containerbox padright">
            <div class="fixed" style="width:7em"><b>Artist:</b></div>
            <div class="expand"><input class="searchterm enter sourceform" name="artist" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
            <div class="fixed" style="width:7em"><b>Album:</b></div>
            <div class="expand"><input class="searchterm enter sourceform" name="album" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
            <div class="fixed" style="width:7em"><b>Track:</b></div>
            <div class="expand"><input class="searchterm enter sourceform" name="track" type="text" size="90" style="width:95%" /></div>
        </div>
        <div class="containerbox padright">
            <div class="fixed" style="width:7em"><b>Anything:</b></div>
            <div class="expand"><input class="searchterm enter sourceform" name="any" type="text" size="90" style="width:95%" /></div>
        </div>

<?php
        print '<div class="indent containerbox padright">';
        print '<input type="checkbox" id="limitsearch" value="1" onclick="weaselBurrow()"';
        if ($prefs['search_limit_limitsearch'] == 1) {
            print ' checked';
        }
        print '>Limit Search To Specific Backends</input>';
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
            <button class="fixed" onclick="player.http.search('search')">Search</button>
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