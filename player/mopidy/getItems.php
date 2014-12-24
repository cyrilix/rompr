<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/".$_POST['backend']."/backend.php");
include ("collection/collection.php");
include ("player/mopidy/connection.php");

$atpos = array_key_exists('atpos', $_POST) ? $_POST['atpos'] : false;
debug_print("Adding Tracks at position ".$atpos." using ".$_POST['backend']." backend","MOPIDY");

$tk = json_decode($_POST['add']);
$trackbytrack = false;

foreach ($tk as $t) {
	switch ($t->type) {
		case 'uri':
			if (property_exists($t, 'findexact')) {
				add_spotify_artist($t);
			} else {
				add_uri($t->name);
			}
			break;

		case 'item':
			$items = getItemsToAdd($t->name);
			foreach ($items as $i => $uri) {
				add_uri(preg_replace('/^add /', '', $uri));
			}
			break;

		default:
			debug_print("ERROR - Unknown Item type ".$t->type,"MOPIDY");
			exit(1);
			break;

	}
}

function add_uri($uri) {
	global $atpos;
	debug_print("   Track Uri : ".$uri,"MOPIDY");
	$p = array( 'uri' => $uri);
	if ($atpos || $atpos === 0) {
		$p['at_position'] = (int) $atpos;
		$atpos++;
	}
	mopidy_post_command("core.tracklist.add", $p, true);
}

function add_spotify_artist($t) {
	$params = (array) $t->findexact;
	$params['uris'] = $t->filterdomain;
	$collection = doCollection('core.library.find_exact', $params, array("Track"), true);
    $artistlist = $collection->getSortedArtistList();
    foreach($artistlist as $artistkey) {
	    $albumlist = array();
	    if ($artistkey == "various artists") {
			$albumlist = $collection->getAlbumList($artistkey, false);
	    } else {
		    $albumlist = $collection->getAlbumList($artistkey, true);
	    }
	    foreach ($albumlist as $album) {
	    	$album->sortTracks();
	    	foreach ($album->tracks as $trackobj) {
	    		add_uri($trackobj->url);
	    	}
	    }
    }
}

?>
<html></html>