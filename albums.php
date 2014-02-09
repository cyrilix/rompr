
<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");

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
    $cmd = "search";
    foreach ($_REQUEST['mpdsearch'] as $key => $term) {
        $cmd .= " ".$key.' "'.format_for_mpd(html_entity_decode($term[0])).'"';
    }
    debug_print("Search command : ".$cmd,"MPD SEARCH");
    $collection = doCollection($cmd);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
    close_player();
} else if (array_key_exists('terms', $_REQUEST)) {
    // SQL database search request
    $domains = (array_key_exists('domains', $_REQUEST)) ? $_REQUEST['domains'] : null;
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $collection = doCollection($_REQUEST['terms'], $domains);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
} else if (array_key_exists('wishlist', $_REQUEST)) {
    include ("collection/collection.php");
    include( "collection/dbsearch.php");
    $collection = doCollection(array('wishlist' => 1), null);
    createAlbumsList('prefs/w_list.xml', "w");
    dumpAlbums('walbumroot');
} else if (array_key_exists('rebuild', $_REQUEST)) {
    // This is a request to rebuild the music collection coming from either
    // the mpd or mopidy controller
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
	$collection = doCollection("listallinfo");
    createAlbumsList($ALBUMSLIST, "a");
	dumpAlbums('aalbumroot');
    close_player();
} else {
    // This can only be a mopidy search requiring parsing
    include ("player/".$player_backend."/connection.php");
    include ("collection/collection.php");
    $collection = doCollection(null);
    createAlbumsList($ALBUMSEARCH, "b");
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';
}
?>

