
<?php

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
    $trackbytrack = false;
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
    debug_print("Search command : ".$cmd,"MPD SEARCH");
    if ($_REQUEST['resultstype'] == "tree") {
        doFileSearch($cmd, $domains);
    } else {
        prepareSearchTables();
        doCollection($cmd, $domains);
        createAlbumsList();
        dumpAlbums('balbumroot');
    }
    print '<div class="separator"></div>';
    close_mpd();
} else if (array_key_exists('browsealbum', $_REQUEST)) {
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    $doing_search = true;
    $trackbytrack = false;
    $dont_change_search_status = true;
    $domains = array();
    $albumlink = get_albumlink($_REQUEST['browsealbum']);
    $cmd = 'find file "'.$albumlink.'"';
    debug_print("Doing Album Browse : ".$cmd,"MPD");
    doCollection($cmd, $domains);
    createAlbumsList();
    if (preg_match('/^.+?:album:/', $albumlink)) {
        print do_tracks_from_database($_REQUEST['browsealbum'], true);
    } else {
        $matches = array();
        if (preg_match('/(\d+)/', $_REQUEST['browsealbum'], $matches)) {
            $albumid = $matches[1];
            $artistid = find_artist_from_album($albumid);
            // Remove the 'Artist Link' album as it's no longer relevant
            remove_album_from_database($albumid);
            do_albums_from_database('bartist'.$artistid, false, true);
        }
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
    debug_print("Search command : ".$cmd,"MPD SEARCH");
    $doing_search = true;
    $trackbytrack = false;
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
    $trackbytrack = false;
    if ($_REQUEST['resultstype'] == "tree") {
    } else {
        prepareCollectionUpdate();
        prepareSearchTables();
     }
    doDbCollection($_REQUEST['terms'], $domains, $_REQUEST['resultstype']);
    if ($_REQUEST['resultstype'] == "tree") {
    } else {
        createAlbumsList();
        dumpAlbums('balbumroot');
    }
    print '<div class="separator"></div>';
    close_mpd();
} else if (array_key_exists('wishlist', $_REQUEST)) {
    include ("collection/collection.php");
    include("collection/dbsearch.php");
    getWishlist();
} else if (array_key_exists('rebuild', $_REQUEST)) {
    // This is a request to rebuild the music collection coming from either
    // the mpd or mopidy controller
    debug_print("======================================================================","TIMINGS");
    include ("player/mpd/connection.php");
    include ("collection/collection.php");
    debug_print("== Starting Collection Update","TIMINGS");
    $initmem = memory_get_usage();
    debug_print("Memory Used is ".$initmem,"COLLECTION");
    $now2 = time();
	doCollection("listallinfo");
    createAlbumsList();
    dumpAlbums('aalbumroot');
    close_mpd();
    debug_print("== Collection Update And Send took ".format_time(time() - $now2),"TIMINGS");
    $peakmem = memory_get_peak_usage();
    $ourmem = $peakmem - $initmem;
    debug_print("Peak Memory Used Was ".number_format($peakmem)." bytes  - meaning we used ".number_format($ourmem)." bytes.","COLLECTION");
    debug_print("======================================================================","TIMINGS");
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

