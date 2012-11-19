
<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

$count = 1;
$divtype = "album1";

$collection = doCollection("listallinfo");
createAlbumsList($ALBUMSLIST);
close_mpd($connection);

function createAlbumsList($file) {

    global $collection;
    $output = new collectionOutput($file);
    createHTML($collection->getSortedArtistList(), "a", $output);
    $output->closeFile();
    $output->dumpFile();

}

?>  

