<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
include("international.php");

$count = 1;
$divtype = "album1";
$collection = null;

$collection = doCollection(null, json_decode(file_get_contents('php://input')));
$output = new collectionOutput($ALBUMSLIST);
createXML($collection->getSortedArtistList(), "a", $output);
$output->closeFile();
dumpAlbums('aalbumroot');

?>
