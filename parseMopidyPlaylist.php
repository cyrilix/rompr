<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
include ("international.php");

header('Content-Type: text/xml; charset=utf-8');

$collection = doCollection(null, json_decode(file_get_contents('php://input')));
outputPlaylist();

debug_print("Playlist Output Is Done","MOPIDYPARSER");

?>
