<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

$count = 1;
$divtype = "album1";
$collection = null;

$collection = doCollection(null, json_decode(file_get_contents('php://input')));
$output = new collectionOutput($ALBUMSEARCH);
createXML($collection->getSortedArtistList(), "b", $output);
$output->closeFile();
print '<div class="menuitem">';
print "<h3>Search Results:</h3>";
print "</div>";
dumpAlbums('balbumroot');
print '<div class="separator"></div>';

?>
