
<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");

set_time_limit(800);
$player_backend = $prefs['player_backend'];
$apache_backend = "xml";
$error = 0;
if (array_key_exists('rebuild', $_REQUEST) ||
    (array_key_exists('item', $_REQUEST) && substr($_REQUEST['item'],0,1) == "a")) {
    // At the moment, the sql backend only does the main collection. Search is still XML
    $apache_backend = $prefs['apache_backend'];
}
// Don't include the player backend or collection at this point
// because it slows things down and makes the UI look unresponsive
include ("backends/".$apache_backend."/backend.php");

debug_print("Performing Backend Player Action using player ".$player_backend." and backend ".$apache_backend,"ALBUMSLIST");

if (array_key_exists('item', $_REQUEST)) {
    // Populate a dropdown in the collection or search results
	dumpAlbums($_REQUEST['item']);
} else if (array_key_exists("mpdsearch", $_REQUEST)) {
    // Handle an mpd-style search request
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $cmd = "search";
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
    doCollection($cmd);
    createAlbumsList(ROMPR_XML_SEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
    close_player();
} else if (array_key_exists("mopidysearch", $_REQUEST)) {
    // Handle a mopidy search request via an HTTP POST request
    // - this is more efficient than searching via the HTTP WebSocket API
    // and then passing the results over here and then passing them back again
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $st = array();
    foreach ($_REQUEST['mopidysearch'] as $key => $term) {
        if ($key == "tag") {
            $dbterms['tags'] = $term;
        } else if ($key == "rating") {
            $dbterms['rating'] = $term;
        } else {
            $st[$key] = $term;
        }
    }
    if (array_key_exists('domains', $_REQUEST)) {
        $st['uris'] = $_REQUEST['domains'];
    }
    doCollection('core.library.search',$st,array("Track", "Artist", "Album"), $prefs['lowmemorymode'] ? false : true);
    createAlbumsList(ROMPR_XML_SEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
} else if (array_key_exists("rawterms", $_REQUEST)) {
    // Handle an mpd-style search request requiring tl_track format results
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
    $cmd = "search";
    foreach ($_REQUEST['rawterms'] as $key => $term) {
        if ($key == "track_name") {
            $cmd .= ' title "'.format_for_mpd(html_entity_decode($term[0])).'"';
        } else {
            $cmd .= " ".$key.' "'.format_for_mpd(html_entity_decode($term[0])).'"';
        }
    }
    debug_print("Search command : ".$cmd,"MPD SEARCH");
    doCollection($cmd);
    mopidyfy();
    close_player();
} else if (array_key_exists('terms', $_REQUEST)) {
    // SQL database search request
    $domains = (array_key_exists('domains', $_REQUEST)) ? $_REQUEST['domains'] : null;
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    doDbCollection($_REQUEST['terms'], $domains);
    createAlbumsList(ROMPR_XML_SEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
} else if (array_key_exists('wishlist', $_REQUEST)) {
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    getWishlist();
    createAlbumsList('prefs/w_list.xml', "w");
    dumpAlbums('walbumroot');
} else if (array_key_exists('rebuild', $_REQUEST)) {
    // This is a request to rebuild the music collection coming from either
    // the mpd or mopidy controller
    debug_print("======================================================================","TIMINGS");
    debug_print("== Starting Collection Update","TIMINGS");
    $initmem = memory_get_usage();
    debug_print("Memory Used is ".$initmem,"COLLECTION");
    $now2 = time();
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
	doCollection("listallinfo",null,array("Track"),$prefs['lowmemorymode'] ? false : true);
    createAlbumsList(ROMPR_XML_COLLECTION, "a");
    dumpAlbums('aalbumroot');
    close_player();
    debug_print("== Collection Update And Send took ".format_time(time() - $now2),"TIMINGS");
    $peakmem = memory_get_peak_usage();
    $ourmem = $peakmem - $initmem;
    debug_print("Peak Memory Used Was ".number_format($peakmem)." bytes  - meaning we used ".number_format($ourmem)." bytes.","COLLECTION");
    debug_print("======================================================================","TIMINGS");
}

function mopidyfy() {
    // Output a collection as mopidy format search results
    // Note these only contain the info relevant to FaveFinder,
    // which isn't very much.
    global $collection;
    $results = array();
    $results[0] = array(
        "__model__" => "SearchResult",
        "tracks" => array(),
        "uri" => "local:search"
    );
    $artistlist = $collection->getSortedArtistList();
    foreach($artistlist as $artistkey) {
        $albumartist = $collection->artistName($artistkey);
        $albumlist = $collection->getAlbumList($artistkey, false, false);
        if (count($albumlist) > 0) {
            foreach($albumlist as $album) {
                foreach($album->tracks as $trackobj) {
                    $a = $trackobj->get_artist_string();
                    $trackartist = ($a != null) ? $a : $albumartist;
                    $track = array(
                        "album" => array(
                            "artists" => array(
                                array(
                                    "name" => $albumartist
                                )
                            ),
                            "name" => $album->name
                        ),
                        "artists" => array(
                            array(
                                "name" => $trackartist
                            )
                        ),
                        "name" => $trackobj->name,
                        "track_no" => $trackobj->number,
                        "uri" => $trackobj->url
                    );
                    array_push($results[0]['tracks'], $track);
                }
            }
        }
    }
    print json_encode($results);
}

?>

