<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/".$_POST['backend']."/backend.php");
include ("collection/collection.php");
include ("player/mopidy/connection.php");

$atpos = array_key_exists('atpos', $_POST) ? $_POST['atpos'] : false;
$urilist = array('uris' => array());
if ($atpos || $atpos === 0) {
	$urilist['at_position'] = (int) $atpos;
}

debug_print("Adding Tracks at position ".$atpos." using ".$_POST['backend']." backend","MOPIDY");

$tk = json_decode($_POST['add']);
$trackbytrack = false;

foreach ($tk as $t) {
	switch ($t->type) {
		case 'uri':
		case 'playlist':
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
	// Add them in bulk groups of 50-ish to keep things moving and make sure we never
	// create an array so vast it destroys the universe.
	if (count($urilist['uris']) > 50) {
		mopidy_post_command("core.tracklist.add", $urilist, true);
		$urilist['uris'] = array();
		if ($atpos || $atpos === 0) {
			$urilist['at_position'] = $urilist['at_position'] + count($urilist['uris']);
		}
	}
}

if (count($urilist['uris']) > 0) {
	mopidy_post_command("core.tracklist.add", $urilist, true);
}

function add_uri($uri) {
	global $urilist;
	debug_print("   Track Uri : ".$uri,"MOPIDY");
	array_push($urilist['uris'], $uri);
}

function add_spotify_artist($t) {
	global $collection;
	debug_print("Adding Artist","MOPIDY");
	$params = (array) $t->findexact;
	$params['uris'] = $t->filterdomain;
	$params['exact'] = true;
	doCollection('core.library.search', $params, array("Track"), true);
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