<?php

// This does on-the-fly collection updates for mopidy users
// Currently it only handles Spotify tracks, since that's the only thing that mopidy
// sends us on-the-fly updates for.
// This does not put things through the collectioniser since we trust spotify to tag
// things correctly - although currently mopidy-spotify doesn't return disc numbers
// so multi-disc albums don't get sorted correctly. I don't intend to fix that problem
// in rompr, mopidy-spotify needs sorting out.

include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");
include ("backends/sql/backend.php");
include ("player/mopidy/connection.php");

$error = 0;
$count = 1;
$divtype = "album1";
$collection = null;
$returninfo = array();
$nodata = array (
	'Rating' => 0,
	'Tags' => array()
);

if ($mysqlc == null) {
	debug_print("Can't Do on the fly stuff as no SQL connection!","RATINGS");
	header('HTTP/1.0 403 Forbidden');
	exit(0);
}

check_tracks_against_db(json_decode(file_get_contents('php://input')));

function check_tracks_against_db($json) {
	global $mysqlc;
	global $prefs;
	global $returninfo;
	global $artist_created;
	global $album_created;
	global $nodata;

	$tracks_in_db = array();
	if ($result = mysqli_query($mysqlc, "SELECT Uri, Hidden, TTindex, LastModified, TrackNo, Disc FROM Tracktable WHERE Uri LIKE 'spotify:%'")) {
		while ($obj = mysqli_fetch_object($result)) {
			$tracks_in_db[$obj->Uri] = array(	'hidden' => $obj->Hidden,
												'ttid' => $obj->TTindex,
												'removed' => true,
												'lastmodified' => $obj->LastModified,
												'trackno' => $obj->TrackNo,
												'disc' => $obj->Disc,
												'lastmodified' => $obj->LastModified
											);
		}
		mysqli_free_result($result);
	} else {
		debug_print("MySql Error ".mysqli_error($mysqlc),"MYSQL");
		return 0;
	}

	$stmt = mysqli_prepare($mysqlc, "UPDATE Tracktable SET TrackNo=?, Duration=?, LastModified=?, Hidden = 0 WHERE TTindex=?");
	foreach ($json as $p) {
		if ($p->{'__model__'} == "Playlist" &&
			getDomain($p->{'uri'}) == "spotify" &&
			property_exists($p, 'tracks')) {

			debug_print("Checking Playlist ".$p->{'name'},"MYSQL");
			foreach ($p->{'tracks'} as $t) {
				$track = parseTrack($t);
				if (array_key_exists($track['file'], $tracks_in_db)) {
					debug_print("Track ".$track['file']." ".$track['Title']." already exists","MYSQL");
			        if ($prefs['ignore_unplayable'] == "true" && substr($track['Title'], 0, 12) == "[unplayable]") {
						// debug_print("Track ".$track['file']." is unplayable, needs to be removed","MYSQL");
					} else {
						if ($track['Track'] 		!= $tracks_in_db[$track['file']]['trackno'] ||
							$track['Last-Modified'] != $tracks_in_db[$track['file']]['lastmodified'] ||
							$tracks_in_db[$track['file']]['lastmodified'] === null ||
							$tracks_in_db[$track['file']]['hidden'] == 1)
						{
							mysqli_stmt_bind_param($stmt, "iiii", $track['Track'], $track['Time'], $track['Last-Modified'], $tracks_in_db[$track['file']]['ttid']);
							if (mysqli_stmt_execute($stmt)) {
								debug_print(" ... Updated track ".$track['file'],"MYSQL");
							} else {
				                debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
							}
						}
						$tracks_in_db[$track['file']]['removed'] = false;
					}
				} else {
			        if ($prefs['ignore_unplayable'] == "true" && substr($track['Title'], 0, 12) == "[unplayable]") {
						// debug_print("Track ".$track['file']." is new but unplayable","MYSQL");
					} else if (substr($track['file'],0,9) == "[loading]") {
						debug_print("Track ".$track['file']." is loading. Must ignore it","MYSQL");
        			} else {
						debug_print("Track ".$track['file']." ".$track['Title']." is a new track","MYSQL");
						// Add new tracks here and call send_list_updates every time,

						// We've only checked by Uri. Need to find_wishlist_item first
						$ttid = find_wishlist_item(concatenate_artist_names($track['Artist']),$track['Album'],$track['Title']);
						if ($ttid) {
							debug_print(" ... found in wishlist. Removing that one.","MYSQL");
							generic_sql_query("DELETE FROM Tracktable WHERE TTindex=".$ttid);
						}
						$artist_created = false;
						$album_created = false;
					    list($name, $artist, $number, $duration, $albumartist, $spotialbum,
					            $image, $album, $date, $lastmodified, $disc, $mbalbum, $composer) = munge_filedata($track, $track['file']);

						$ttid = create_new_track(
							$name,
							concatenate_artist_names($artist),
						    $number,
							$duration,
							concatenate_artist_names($albumartist),
							$spotialbum,
							$image,
							$album,
							$date,
							$track['file'],
							null,
							null,
							null,
							null,
							null,
							md5(concatenate_artist_names($albumartist)." ".$album),
							$lastmodified,
							$disc,
							$mbalbum,
							null,
							getDomain($track['file']),
							0,
							null
						);
						send_list_updates($artist_created, $album_created, $ttid, false);
					}
				}
			}
		}
	}

	$delcount = 0;
	foreach ($tracks_in_db as $i => $u) {
		if ($u['removed'] && $u['hidden'] == 0 && $u['lastmodified'] !== null) {
			if (!array_key_exists('deletedtracks', $returninfo)) {
				$returninfo['deletedtracks'] = array();
			}
			debug_print("Track ".$i." has been removed","MYSQL");
			array_push($returninfo['deletedtracks'], rawurlencode($i));
			remove_ttid($u['ttid']);
			$delcount++;
		}
	}

	if ($delcount > 0) {

		// Now we need to find any albums or artists that need to be removed from the collection display
		// (because this is being done on-the-fly and not as part of a collection update).
		// This takes two SQL queries. We still use remove_cruft to actually remove them
		// because the two produce different results - this produces albums and albumartists with no
		// visible tracks, of which the cruft may only be a subset.

		// NOTE: this query does return albums for which we have only hidden tracks.
		// This is what we want, because one of those may still be displayed.
		// Any that aren't displayed don't matter because they can't be removed from the display anyway
		$albumartists = array();
		$result = mysqli_query($mysqlc, "SELECT Albumindex, AlbumArtistindex FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE Albumindex IS NOT NULL AND Hidden=0)");
		while ($obj = mysqli_fetch_object($result)) {
			if (!array_key_exists('deletedalbums', $returninfo)) {
				$returninfo['deletedalbums'] = array();
			}
			debug_print("Album ".$obj->Albumindex." is no longer needed","MYSQL");
			array_push($returninfo['deletedalbums'], "aalbum".$obj->Albumindex);
			$albumartists[$obj->AlbumArtistindex] = 1;
		}
		mysqli_free_result($result);


		// Now we need to count the number of visible albums for each albumartist
		// and remove them from the display if it's zero.
		foreach ($albumartists as $id => $na) {
			$result = mysqli_query($mysqlc, "SELECT COUNT(*) AS numalbums FROM Albumtable WHERE AlbumArtistindex = ".$id." AND Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex = Albumtable.Albumindex AND Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0)");
			while ($obj = mysqli_fetch_object($result)) {
				if ($obj->numalbums == 0) {
					debug_print("Artist index ".$id." needs to be removed");
					if (!array_key_exists('deletedartists', $returninfo)) {
						$returninfo['deletedartists'] = array();
					}
					array_push($returninfo['deletedartists'], "aartist".$id);
				}
			}
			mysqli_free_result($result);
		}
	}
	remove_cruft();
	update_track_stats();
	$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
	print json_encode($returninfo);

}

?>