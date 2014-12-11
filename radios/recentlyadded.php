<?php
chdir('..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/sql/backend.php");

$mode = $_REQUEST['mode'];
debug_print("Populating Recently Added Sorted By ".$mode, "RECENTLY ADDED");

$uris = array();
$qstring = "";
if ($mode == "random") {
	$qstring = "SELECT Uri FROM Tracktable WHERE (DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded) AND Hidden = 0 AND Uri IS NOT NULL AND Title != 'Cue Sheet' ORDER BY RAND()";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($uris, $obj->Uri);
		}
	}
} else {
	// This rather cumbersome code gives us albums in a random order but tracks in order.
	// All attempts to do this with a single SQL query hit a brick wall.
	// But then I don't know much about SQL.
	$albums = array();
	$qstring = "SELECT Uri, Albumindex, TrackNo FROM Tracktable WHERE DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded AND Hidden = 0 AND Uri IS NOT NULL";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists($obj->Albumindex, $albums)) {
				$albums[$obj->Albumindex] = array($obj->TrackNo => $obj->Uri);
			} else {
				if (array_key_exists($obj->TrackNo, $albums[$obj->Albumindex])) {
					array_push($albums[$obj->Albumindex], $obj->Uri);
				} else {
					$albums[$obj->Albumindex][$obj->TrackNo] = $obj->Uri;
				}
			}
		}
		shuffle($albums);
		foreach($albums as $a) {
			ksort($a);
			foreach ($a as $t) {
				array_push($uris, $t);
			}
		}
	}

	print json_encode($uris);

}

?>