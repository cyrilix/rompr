
<?php

// Automatic Collection Updates can be performed using cURL:
// curl -b "currenthost=Default;player_backend=mpd" http://localhost/rompr/albums.php?rebuild > /dev/null
// where currenthost is the name of one of the Players defined in the Configuration menu
// and player_backend MUST be mpd or mopidy, depending on what your player is.
// You can also use -b "debug_enabled=8;currenthost=MPD;player_backend=mpd"
// to get more debug info in the webserver error log.

include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");

set_time_limit(800);
$error = 0;
include("backends/sql/backend.php");

if (array_key_exists('item', $_REQUEST)) {
    // Populate a dropdown in the collection or search results
	dumpAlbums($_REQUEST['item']);
} else if (array_key_exists("mpdsearch", $_REQUEST)) {
    // Handle an mpd-style search request
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    $doing_search = true;
    $cmd = $_REQUEST['command'];
    $domains = checkDomains($_REQUEST);
    foreach ($_REQUEST['mpdsearch'] as $key => $term) {
        if ($key == "tag") {
            $dbterms['tags'] = $term;
        } else if ($key == "rating") {
            $dbterms['rating'] = $term;
        } else {
            $cmd .= " ".$key.' "'.format_for_mpd(html_entity_decode($term[0])).'"';
        }
    }
    debuglog("Search command : ".$cmd,"MPD SEARCH");
    if ($_REQUEST['resultstype'] == "tree") {
        doFileSearch($cmd, $domains);
    } else {
        cleanSearchTables();
        prepareCollectionUpdate();
        doCollection($cmd, $domains);
        createAlbumsList();
        dumpAlbums($_REQUEST['dump']);
    }
    close_mpd();
} else if (array_key_exists('browsealbum', $_REQUEST)) {
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    $doing_search = true;
    $domains = array();
    $a = preg_match('/(a|b)(.*?)(\d+|root)/', $_REQUEST['browsealbum'], $matches);
    if (!$a) {
        print '<h3>'.get_int_text("label_general_error").'</h3>';
        debuglog('Browse Album Failed - regexp failed to match '.$_REQUEST['browsealbum'],"DUMPALBUMS",3);
        return false;
    }
    $why = $matches[1];
    $what = $matches[2];
    $who = $matches[3];
    $albumlink = get_albumlink($who);
    $cmd = 'find file "'.$albumlink.'"';
    debuglog("Doing Album Browse : ".$cmd,"MPD");
    prepareCollectionUpdate();
    doCollection($cmd, $domains);
    createAlbumsList();
    if (preg_match('/^.+?:album:/', $albumlink)) {
        print do_tracks_from_database($why, $what, $who, true);
    } else {
        $matches = array();
        $artistid = find_artist_from_album($who);
        // Remove the 'Artist Link' album as it's no longer relevant
        remove_album_from_database($who);
        do_albums_from_database($why, 'album', $artistid, false, true);
    }
    close_mpd();
} else if (array_key_exists("rawterms", $_REQUEST)) {
    // Handle an mpd-style search request requiring tl_track format results
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    $domains = checkDomains($_REQUEST);
    $cmd = "search";
    foreach ($_REQUEST['rawterms'] as $key => $term) {
        if ($key == "track_name") {
            $cmd .= ' title "'.format_for_mpd(html_entity_decode($term[0])).'"';
        } else {
            $cmd .= " ".$key.' "'.format_for_mpd(html_entity_decode($term[0])).'"';
        }
    }
    debuglog("Search command : ".$cmd,"MPD SEARCH");
    $doing_search = true;
    doCollection($cmd, $domains);
    print json_encode($collection->tracks_as_array());
    close_mpd();
} else if (array_key_exists('terms', $_REQUEST)) {
    // SQL database search request
    $domains = checkDomains($_REQUEST);
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    include("collection/dbsearch.php");
    $doing_search = true;
    if ($_REQUEST['resultstype'] == "tree") {
    } else {
        cleanSearchTables();
        prepareCollectionUpdate();
     }
    doDbCollection($_REQUEST['terms'], $domains, $_REQUEST['resultstype']);
    if ($_REQUEST['resultstype'] == "tree") {
    } else {
        createAlbumsList();
        dumpAlbums($_REQUEST['dump']);
    }
    close_mpd();
} else if (array_key_exists('wishlist', $_REQUEST)) {
    include ("collection/collection.php");
    include("collection/dbsearch.php");
    getWishlist();
} else if (array_key_exists('rebuild', $_REQUEST)) {
    // This is a request to rebuild the music collection coming from either
    // the mpd or mopidy controller
    debuglog("======================================================================","TIMINGS",4);
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    debuglog("== Starting Collection Update","TIMINGS",4);
    $initmem = memory_get_usage();
    debuglog("Memory Used is ".$initmem,"COLLECTION",4);
    $now2 = time();
    $trackbytrack = true;
    cleanSearchTables();
    prepareCollectionUpdate();
	doCollection("listallinfo");

    debuglog("== Time Spent Reading Socket Data                      : ".$parse_time,"TIMTINGS",4);
    debuglog("== Time Spent Parsing Socket Data                      : ".$rtime,"TIMTINGS",4);
    debuglog("== Time Spent Checking/Writing to Database             : ".$db_time,"TIMTINGS",4);
    debuglog("== Time Spent Putting Stuff into Collection Structures : ".$coll_time,"TIMTINGS",4);

    createAlbumsList();
    $whattodump = (array_key_exists('dump', $_REQUEST)) ? $_REQUEST['dump'] : false;
    if ($whattodump === false) {
        print '<html></html>';
    } else {
        dumpAlbums($whattodump);
    }
    close_mpd();
    debuglog("== Collection Update And Send took ".format_time(time() - $now2),"TIMINGS",4);
    $peakmem = memory_get_peak_usage();
    $ourmem = $peakmem - $initmem;
    debuglog("Peak Memory Used Was ".number_format($peakmem)." bytes  - meaning we used ".number_format($ourmem)." bytes.","COLLECTION",4);
    debuglog("======================================================================","TIMINGS",4);
}

function checkDomains($d) {
    if (array_key_exists('domains', $d)) {
        $arse = $d['domains'];
        if (in_array('podcast', $d['domains'])) {
            // Mopidy's podcast backend supports FIVE different domains. Sheeee-it.
            $arse = array_merge($arse, array("podcast http","podcast https","podcast ftp","podcast file"));
        }
        return $arse;
    }
    return null;
}

?>

