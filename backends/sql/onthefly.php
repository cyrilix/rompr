<?php

// This does on-the-fly collection updates for mopidy users by reading in mopidy's playlists
// So it gets called when the javascript receives a 'playlists updated' message from Mopidy.
// Currently this only happens for Spotify

chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");
debuglog("------------------- STARTING -------------------","ONTHEFLY");
include ("backends/sql/backend.php");
include ("player/mpd/connection.php");
include ("collection/collection.php");

$error = 0;
$count = 1;
$divtype = "album1";
$returninfo = array();
$onthefly = true;
$nodata = array (
	'Rating' => 0,
	'Tags' => array()
);

if ($mysqlc == null) {
	debuglog("Can't Do on the fly stuff as no SQL connection!","ONTHEFLY");
	debuglog("------------------- FINISHED -------------------","ONTHEFLY");
	header('HTTP/1.0 403 Forbidden');
	exit(0);
}

$now2 = time();
$initmem = memory_get_usage();
debuglog("Memory Used is ".$initmem,"COLLECTION");

cleanSearchTables();
prepareCollectionUpdate();
doCollection($_REQUEST['command']);

debuglog("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
debuglog("Starting Database Update From Collection","TIMINGS");
$now = time();
foreach(array_keys($collection->artists) as $artistkey) {
    do_artist_database_stuff($artistkey, true);
}
$dur = format_time(time() - $now);
debuglog("Database Update From Collection Took ".$dur,"TIMINGS");
debuglog("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");

// Now to delete the tracks that were there and aren't any more
debuglog("Removing tracks that don't exist any more","ONTHEFLY");
$delcount = 0;
if ($result = generic_sql_query("SELECT TTindex FROM Tracktable WHERE LastModified IS NOT NULL AND TTindex NOT IN (SELECT TTindex FROM Foundtracks) AND Hidden = 0")) {
	while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
		remove_ttid($obj->TTindex);
		$delcount++;
	}
}

if ($delcount > 0) {
	checkAlbumsAndArtists();
}
remove_cruft();
update_stat('ListVersion',ROMPR_COLLECTION_VERSION);
update_track_stats();
close_transaction();
$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
$dur = format_time(time() - $now2);
debuglog("On The Fly Database Update Took ".$dur,"ONTHEFLY");
$peakmem = memory_get_peak_usage();
$ourmem = $peakmem - $initmem;
debuglog("Peak Memory Used Was ".number_format($peakmem)." bytes  - meaning we used ".number_format($ourmem)." bytes.","COLLECTION");
print json_encode($returninfo);
debuglog("------------------- FINISHED -------------------","ONTHEFLY");

?>