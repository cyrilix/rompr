
<?php

include ("vars.php");
include ("functions.php");

$count = 1;
$divtype = "album1";
$collection = null;

if (array_key_exists('item', $_REQUEST) && file_exists($ALBUMSLIST)) {
	dumpAlbums($_REQUEST['item']);
} else {
    include ("connection.php");
    include ("collection.php");
	$collection = doCollection("listallinfo");
	createAlbumsList($ALBUMSLIST);
	dumpAlbums('aalbumroot');
}

close_mpd($connection);

function createAlbumsList($file) {

    global $collection;
    $output = new collectionOutput($file);
    createXML($collection->getSortedArtistList(), "a", $output);
    $output->closeFile();

}


?>

