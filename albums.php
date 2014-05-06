
<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");

set_time_limit(600);

$player_backend = $prefs['player_backend'];
$apache_backend = "xml";
if (array_key_exists('rebuild', $_REQUEST) ||
    (array_key_exists('item', $_REQUEST) && substr($_REQUEST['item'],0,1) == "a")) {
    // At the moment, the sql backend only does the main collection. Search is still XML
    $apache_backend = $prefs['apache_backend'];
}
// Don't include the player backend or collection at this point
// because it slows things down and makes the UI look unresponsive
include ("backends/".$apache_backend."/backend.php");

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
    $collection = doCollection($cmd);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
    close_player();
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
    $collection = doCollection($cmd);
    mopidyfy($collection);
    close_player();
} else if (array_key_exists('terms', $_REQUEST)) {
    // SQL database search request
    $domains = (array_key_exists('domains', $_REQUEST)) ? $_REQUEST['domains'] : null;
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $collection = doDbCollection($_REQUEST['terms'], $domains);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
} else if (array_key_exists('wishlist', $_REQUEST)) {
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $collection = doDbCollection(array('wishlist' => 1), null);
    createAlbumsList('prefs/w_list.xml', "w");
    dumpAlbums('walbumroot');
} else if (array_key_exists('rebuild', $_REQUEST)) {
    // This is a request to rebuild the music collection coming from either
    // the mpd or mopidy controller
    $now = time();
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
	$collection = doCollection("listallinfo");
    createAlbumsList($ALBUMSLIST, "a");
	dumpAlbums('aalbumroot');
    close_player();
    debug_print("Collection Update took ".format_time(time() - $now),"COLLECTION");
} else {
    // This can only be a mopidy search requiring parsing
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $collection = doCollection(null);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
}

function mopidyfy($collection) {
    // Output a collection as mopidy format search results
    // Note these only contain the info relevant to FaveFinder,
    // which isn't very much.
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
                    $trackartist = ($trackobj->artist != null && $trackobj->artist != '.') ? $trackobj->artist : $albumartist;
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

