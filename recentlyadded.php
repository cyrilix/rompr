<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/sql/backend.php");

$mode = $_REQUEST['mode'];
debug_print("Populating Recently Added Sorted By ".$mode, "RECENTLY ADDED");

// This will get tracks added in the last 30 days.
// What we really want is:
// If this produces enough tracks fine, otherwise select the 100 or so most recently added tracks
// What's enough? 10? 30?

$uris = array();
$qstring = "";
if ($mode == "random") {
	$qstring = "SELECT Uri FROM Tracktable WHERE (DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded) AND Hidden = 0 ORDER BY RAND()";
} else {
	// This rather cumbersome query gives us albums in a random order but tracks in the correct order.
	$qstring = "SELECT Uri, Albumindex, TrackNo FROM Tracktable JOIN (SELECT DISTINCT Albumindex FROM Tracktable WHERE (DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded) AND Hidden = 0 AND Uri IS NOT NULL ORDER BY TrackNo, RAND()) AS x USING (Albumindex)";
}
if ($result = mysqli_query($mysqlc, $qstring)) {
	while ($obj = mysqli_fetch_object($result)) {
		array_push($uris, $obj->Uri);
	}
	print json_encode($uris);
} else {
	debug_print("  ERROR Getting Track List ".mysqli_error($mysqlc), "RECENTLY ADDED");
}

?>