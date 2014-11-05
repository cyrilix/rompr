<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/sql/backend.php");

$mode = $_REQUEST['mode'];
debug_print("Populating Recently Added Sorted By ".$mode, "RECENTLY ADDED");

$mostrecent = 0;
if ($result = mysqli_query($mysqlc, "SELECT DISTINCT LastModified FROM Tracktable ORDER BY LastModified DESC LIMIT 1")) {
	while ($obj = mysqli_fetch_object($result)) {
		// This'll give us tracks added within the last month
		// This is correct for mopidy and only for its local backend.
		$mostrecent = $obj->LastModified - 2592000;
	}
	mysqli_free_result($result);
	$uris = array();
	$qstring = "";
	if ($mode == "random") {
		$qstring = "SELECT Uri FROM Tracktable WHERE LastModified > ".$mostrecent." ORDER BY RAND()";
	} else {
		// This rather cumbersome query gives us albums in a random order but tracks in the correct order.
		$qstring = "SELECT Uri FROM (SELECT DISTINCT Albumindex FROM Tracktable WHERE LastModified > ".$mostrecent." ORDER BY RAND()) as x JOIN (SELECT Uri, Albumindex FROM Tracktable ORDER BY Disc, Trackno) AS y USING (Albumindex)";
	}
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($uris, $obj->Uri);
		}
		print json_encode($uris);
	} else {
		debug_print("  ERROR Getting Track List ".mysqli_error($mysqlc), "RECENTLY ADDED");
	}
} else {
	debug_print("  ERROR Reading LastModified ".mysqli_error($mysqlc), "RECENTLY ADDED");
}

?>