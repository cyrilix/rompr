<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
include ("international.php");

header('Content-Type: text/xml; charset=utf-8');

$collection = doCollection("playlistinfo");
debug_print("Collection scan playlistinfo finished","GETPLAYLIST");
outputPlaylist();

debug_print("Playlist Output Is Done","GETPLAYLIST");

?>
