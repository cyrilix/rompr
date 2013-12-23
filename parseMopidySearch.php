<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
include ("international.php");

$count = 1;
$divtype = "album1";
$collection = null;

$collection = doCollection(null, json_decode(file_get_contents('php://input')));
$output = new collectionOutput($ALBUMSEARCH);
createXML($collection->getSortedArtistList(), "b", $output);
$output->closeFile();
print '<div class="menuitem">';
print "<h3>".get_int_text("label_searchresults")."</h3>";
print "</div>";
dumpAlbums('balbumroot');
print '<div class="separator"></div>';

?>
