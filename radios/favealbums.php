<?php
chdir('..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("backends/sql/backend.php");

debug_print("Populating Favourite Album Radio", "FAVEALBUMS");

$uris = array();
$qstring = "";

generic_sql_query("CREATE TEMPORARY TABLE alplaytable AS SELECT SUM(Playcount) AS playtotal, Albumindex FROM (SELECT Playcount, Albumindex FROM Playcounttable JOIN Tracktable USING (TTindex) WHERE Playcount > 3) AS derived GROUP BY Albumindex ORDER BY ".SQL_RANDOM_SORT);
// This rather cumbersome code gives us albums in a random order but tracks in order.
// All attempts to do this with a single SQL query hit a brick wall.
// But then I don't know much about SQL.
$albums = array();
$uris = array();
if ($result = generic_sql_query("SELECT Uri, TrackNo, Albumindex FROM Tracktable JOIN alplaytable USING (Albumindex) WHERE playtotal > (SELECT AVG(playtotal) FROM alplaytable) AND Uri IS NOT NULL AND Hidden = 0")) {
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
	foreach($albums as $a) {
		ksort($a);
		foreach ($a as $t) {
			array_push($uris, $t);
		}
	}
}

print json_encode($uris);

?>