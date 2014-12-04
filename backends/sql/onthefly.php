<?php

// This does on-the-fly collection updates for mopidy users

// This does not put things through the collectioniser since we trust spotify to tag
// things correctly - although currently mopidy-spotify doesn't return disc numbers
// so multi-disc albums don't get sorted correctly. I don't intend to fix that problem
// in rompr, mopidy-spotify needs sorting out.
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");
debug_print("------------------- STARTING -------------------","ONTHEFLY");
include ("backends/sql/backend.php");
include ("player/mopidy/connection.php");
include ("collection/collection.php");

$error = 0;
$count = 1;
$divtype = "album1";
$returninfo = array();
$nodata = array (
	'Rating' => 0,
	'Tags' => array()
);

if ($mysqlc == null) {
	debug_print("Can't Do on the fly stuff as no SQL connection!","ONTHEFLY");
	debug_print("------------------- FINISHED -------------------","ONTHEFLY");
	header('HTTP/1.0 403 Forbidden');
	exit(0);
}

$now = time();
generic_sql_query("CREATE TEMPORARY TABLE Foundtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex)) ENGINE MEMORY");
generic_sql_query("CREATE TEMPORARY TABLE Existingtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex)) ENGINE MEMORY");
$collection = doCollection("core.playlists.get_playlists", null, null, "");

$artistlist = $collection->getSortedArtistList();
foreach($artistlist as $artistkey) {
    do_artist_database_stuff($artistkey, $now, true);
}

// Now to delete the tracks that were there and aren't any more
debug_print("Removing tracks that don't exist any more","ONTHEFLY");
$delcount = 0;
if ($result = mysqli_query($mysqlc, "SELECT TTindex FROM Existingtracks LEFT OUTER JOIN Foundtracks USING (TTindex) WHERE Foundtracks.TTindex IS NULL")) {
	while ($obj = mysqli_fetch_object($result)) {
		remove_ttid($obj->TTindex);
		$delcount++;
	}
	mysqli_free_result($result);
} else {
	debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
}

if ($delcount > 0) {
	checkAlbumsAndArtists();
}

remove_cruft();
update_track_stats();
$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
$dur = format_time(time() - $now);
debug_print("Database Update Took ".$dur,"ONTHEFLY");
print json_encode($returninfo);
debug_print("------------------- FINISHED -------------------","ONTHEFLY");

?>