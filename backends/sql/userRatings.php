<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");
debug_print("--------------------------START---------------------","USERRATING");
include ("backends/sql/backend.php");

$error = 0;
$count = 1;
$divtype = "album1";
$returninfo = array();
$download_file = "";
$nodata = array (
	'Rating' => 0,
	'Tags' => array()
);

if ($mysqlc == null) {
	debug_print("Can't Do ratings stuff as no SQL connection!","RATINGS");
	header('HTTP/1.0 403 Forbidden');
	exit(0);
}

$title = array_key_exists('title', $_POST) ? $_POST['title'] : null;
$artist = array_key_exists('artist', $_POST) ? $_POST['artist'] : null;;
$trackno = array_key_exists('trackno', $_POST) ? $_POST['trackno'] : null;
$duration = array_key_exists('duration', $_POST) ? $_POST['duration'] : null;
$albumartist = array_key_exists('albumartist', $_POST) ? $_POST['albumartist'] : $artist;
$spotilink = array_key_exists('spotilink', $_POST) ? $_POST['spotilink'] : null;
$image = array_key_exists('image', $_POST) ? $_POST['image'] : null;
$album = array_key_exists('album', $_POST) ? $_POST['album'] : null;
$uri = array_key_exists('uri', $_POST) ? $_POST['uri'] : null;
$date = array_key_exists('date', $_POST) ? getYear($_POST['date']) : null;
$urionly = array_key_exists('urionly', $_POST) ? true : false;
$dontcreate = array_key_exists('dontcreate', $_POST) ? true : false;
$disc = array_key_exists('disc', $_POST) ? $_POST['disc'] : 1;
$trackimage = array_key_exists('trackimage', $_POST) ? $_POST['trackimage'] : null;
if (substr($image,0,4) == "http") {
	$image = "getRemoteImage.php?url=".$image;
}
$attributes = array_key_exists('attributes', $_POST) ? $_POST['attributes'] : null;
if ( array_key_exists('attribute', $_POST) &&
	 array_key_exists('value', $_POST)) {
	debug_print("WARNING! Old-style attribute-value pair. Update the code!","USERRATING");
	$attributes = array(
		array( "attribute" => $_POST['attribute'], "value" => $_POST['value'] )
	);
}

open_transaction();

switch ($_POST['action']) {

	case 'getplaylist':
		preparePlaylist();
	case 'repopulate':
		doPlaylist($_POST['playlist'], $_POST['numtracks']);
		break;

	case 'taglist':
		print json_encode(list_all_tag_data());
		break;

	case 'ratlist':
		print json_encode(list_all_rating_data());
		break;

	case 'metabackup':
		file_put_contents('prefs/tagbackup.json', json_encode(list_all_tag_data()));
		file_put_contents('prefs/ratbackup.json', json_encode(list_all_rating_data()));
		file_put_contents('prefs/plcbackup.json', json_encode(list_all_playcount_data()));
		print '<html></html>';
		break;

	case 'getbackupdata':
		$backup = array();
		$backup['Ratings'] = json_decode(file_get_contents('prefs/ratbackup.json'));
		$backup['Tags'] = json_decode(file_get_contents('prefs/tagbackup.json'));
		$backup['Playcounts'] = json_decode(file_get_contents('prefs/plcbackup.json'));
		print json_encode($backup);
		break;

	case 'deletetag':
		if (remove_tag_from_db($_POST['value'])) {
			print '<html></html>';
		} else {
			header('HTTP/1.0 403 Forbidden');
		}
		break;

	case 'get':
		if ($artist === null || $title === null) {
			header('HTTP/1.0 403 Forbidden');
			exit(0);
		}
		$ttids = find_item(	$uri,
							$title,
							$artist,
							$album,
							$albumartist,
							forcedUriOnly(false, getDomain($uri)));
		if (count($ttids) > 0) {
			print json_encode(get_all_data(array_shift($ttids)));
		} else {
			print json_encode( $nodata );
		}
		break;

	case 'inc':
		// NOTE : 'inc' does not do what you might expect.
		// This is not an 'increment' function, it still does a SET but it will create a hidden track
		// if the track can't be found, compare to SET which creates a new unhidden track.
		if ($artist === null ||
			$title === null ||
			$attributes == null) {
			debug_print("Something is not set","USERRATING");
			header('HTTP/1.0 403 Forbidden');
			exit(0);
		}
		$ttids = find_item(	forcedUriOnly(false,getDomain($uri)) ? $uri : null,
							$title,
							$artist,
							$album,
							$albumartist,
							forcedUriOnly(false,getDomain($uri)));

		if (count($ttids) == 0) {
			debug_print("Doing an INCREMENT action - Found NOTHING so creating hidden track","USERRATING");
			// So we need to create a new hidden track
			check_album_image();
			$ttids[0] = create_new_track(	$title,
											$artist,
											$trackno,
											$duration,
											$albumartist,
											$spotilink,
											$image,
											$album,
											$date,
											$uri,
											null, null, null, null,
											md5($albumartist." ".$album),
											null,
											$disc,
											null,
											$uri === null ? "local" : getDomain($uri),
											1,
											$trackimage);

		}

		if (count($ttids) > 0) {
			foreach ($ttids as $ttid) {
				debug_print("Doing an INCREMENT action - Found TTID ".$ttid,"USERRATING");
				foreach ($attributes as $pair) {
					debug_print("Setting ".$pair["attribute"]." to ".$pair["value"],"USERRATING");
					increment_value($ttid, $pair["attribute"], $pair["value"]);
				}
				$returninfo['metadata'] = get_all_data($ttid);
				$artist_created = false;
				$album_created = false;
			}
			print json_encode($returninfo);
		}
		break;

	case "add":

		// This is used for adding specific tracks so we need urionly to be true
		// We don't simply call into this using 'set' with urionly set to true
		// because that might result in the rating being changed

		$ttids = find_item(	$uri,
							$title,
							$artist,
							$album,
							$albumartist,
							true);

		// As we check by URI we can only have one result.
		$ttid = null;
		if (count($ttids) > 0) {
			$ttid = array_shift($ttids);
		}
		if ($ttid != null) {

			// If we found it, just make sure it's not hidden. This is slightly trickier than it sounds
			// because if it is it might cause a new album and/or artist to appear in the collection when
			// we unhide it.
			// The code to do this already exists in set_attribute. If it's hidden it will have no attributes
			// (except a playcount) so we can check if it's hidden and if it is, set its rating to 0.
			if (track_is_hidden($ttid)) {
				set_attribute($ttid, "Rating", "0");
				update_track_stats();
				send_list_updates($artist_created, $album_created, $ttid);
			} else {
				if ($uri && $album) {
					if (check_wishlist_doodads(array($ttid))) {
						update_track_stats();
						send_list_updates($artist_created, $album_created, $ttid);
					}
				}
			}
		} else {
			check_album_image();
			$ttid = create_new_track(	$title,
										$artist,
										$trackno,
										$duration,
										$albumartist,
										$spotilink,
										$image,
										$album,
										$date,
										$uri,
										null, null, null, null,
										md5($albumartist." ".$album),
										null,
										$disc,
										null,
										$uri === null ? "local" : getDomain($uri),
										0,
										$trackimage);
			update_track_stats();
			send_list_updates($artist_created, $album_created, $ttid);
		}
		break;

	case 'set':
		if ($artist === null ||
			$title === null ||
			$attributes == null) {
			debug_print("Something is not set","USERRATING");
			header('HTTP/1.0 403 Forbidden');
			exit(0);
		}

		$ttids = find_item(	forcedUriOnly($urionly, getDomain($uri)) ? $uri : null,
							$title,
							$artist,
							$album,
							$albumartist,
							forcedUriOnly($urionly, getDomain($uri)));

		if (count($ttids) == 0 && $dontcreate == false) {

			// dontcreate prevents us from creating a track if it doesn't already exist. It's used by the
			// Tag Manager and Rating Manager as a means of preventing us adding stuff from the search
			// panel, because it requires a shedload more code to get the title, artist etc details

			// NOTE: This is adding new tracks without putting them through the collectioniser.
			// This is probably OK, since the collectioniser was designed for coping with
			// local files that had bad or partial tags. Stuff coming from online sources
			// is usually OK. I hope.

			check_album_image();
			$ttids[0] = create_new_track(	$title,
											$artist,
											$trackno,
											$duration,
											$albumartist,
											$spotilink,
											$image,
											$album,
											$date,
											$uri,
											null, null, null, null,
											md5($albumartist." ".$album),
											null,
											$disc,
											null,
											$uri === null ? "local" : getDomain($uri),
											0,
											$trackimage);
			debug_print("Created New Track with TTindex ".$ttids[0],"USERRATINGS");
		} else if (count($ttids) == 1) {
			// Check to see if the track we've returned is a wishlist track, and update its info
			if ($uri && $album) {
				check_wishlist_doodads($ttids);
			}
		}
		if (count($ttids) > 0) {
			foreach($ttids as $ttid) {
				foreach ($attributes as $pair) {
					$dbg = $pair["value"];
					if (is_array($pair["value"])) {
						$dbg = implode($pair["value"], ", ");
					}
					debug_print("Setting ".$pair["attribute"]." to ".$dbg." on TTindex ".$ttid,"USERRATING");
					$result = true;
					$r = set_attribute($ttid, $pair["attribute"], $pair["value"]);
					if ($r == false) {
						debug_print("FAILED Setting ".$pair["attribute"]." to ".$dbg,"USERRATING");
						$result = false;
					}
				}
				if ($result && $uri) {
					send_list_updates($artist_created, $album_created, $ttid, false);
					$returninfo['metadata'] = get_all_data($ttid);
				}
				$artist_created = false;
				$album_created = false;
			}
			update_track_stats();
			$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
			print json_encode($returninfo);
		} else {
			debug_print("TTID Not Found","USERRATING");
			header('HTTP/1.0 403 Forbidden');
		}
		break;

	case 'remove':
		if ($artist === null || $title === null) {
			header('HTTP/1.0 403 Forbidden');
			exit(0);
		}
		$ttids = find_item(	$uri,
							$title,
							$artist,
							$album,
							$albumartist,
							forcedUriOnly(false, getDomain($uri)));
		if (count($ttids) > 0) {
			foreach ($ttids as $ttid) {
				foreach ($attributes as $pair) {
					debug_print("Removing ".$pair["attribute"]." ".$pair["value"],"USERRATING");
					$result = true;
					$r = remove_tag($ttid, $pair["value"]);
					if ($r == false) {
						debug_print("FAILED Removing ".$pair["attribute"]." ".$pair["value"],"USERRATING");
						$result = false;
					}
				}
				if ($result) {
					send_list_updates($artist_created, $album_created, $ttid, false);
					$returninfo['metadata'] = get_all_data($ttid);
				}
			}
			print json_encode($returninfo);
		} else {
			header('HTTP/1.0 403 Forbidden');
		}
		break;


	case 'delete':
		$ttids = find_item($uri, null, null, null, null, false);
		if (count($ttids) == 0) {
			header('HTTP/1.0 403 Forbidden');
		} else {
			delete_track(array_shift($ttids));
		}
		break;

	case 'deletewl':
		$ttid = find_wishlist_item(html_entity_decode($artist), html_entity_decode($album), html_entity_decode($title));
		if ($ttid == null) {
			header('HTTP/1.0 403 Forbidden');
		} else {
			delete_track($ttid);
		}
		break;

	case 'cleanup':
		remove_cruft();
		update_track_stats();
		$returninfo = array();
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
		print json_encode($returninfo);
		break;

	case 'gettags':
		print json_encode(list_tags());
		break;

	case 'getfaveartists':
		print json_encode(get_fave_artists());
		break;

	case 'getcharts':
		$charts = array();
		$charts['Artists'] = get_artist_charts();
		$charts['Albums'] = get_album_charts();
		$charts['Tracks'] = get_track_charts();
		print json_encode($charts);
		break;

	case 'geturis':
		$uris = getItemsToAdd($uri, "");
		print json_encode($uris);
		break;

}

close_transaction();

debug_print("---------------------------END----------------------","USERRATING");

function forcedUriOnly($u,$d) {

	// Some mopidy backends - YouTube and SoundCloud - can return the same artist/album/track info
	// for multiple different tracks. This gives us a problem because find_item will thinkk they're the same.
	// So for those backends we always force urionly to be true
	debug_print("Checking the spanner monkey : ".$d,"USERRATINGS");

	if ($u || $d == "youtube" || $d == "soundcloud") {
		return true;
	} else {
		return false;
	}

}

function preparePlaylist() {
	generic_sql_query("DROP TABLE IF EXISTS pltable");
	generic_sql_query("CREATE TABLE pltable(TTindex INT UNSIGNED NOT NULL UNIQUE)");
}

function doPlaylist($playlist, $limit) {
	debug_print("Loading Playlist ".$playlist,"RATINGS");
	$sqlstring = "";
	$tags = null;
	$random = true;
	switch($playlist) {
		case "1stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden=0 AND Rating > 0";
			break;
		case "2stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden=0 AND Rating > 1";
			break;
		case "3stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden=0 AND Rating > 2";
			break;
		case "4stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden=0 AND Rating > 3";
			break;
		case "5stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden=0 AND Rating > 4";
			break;
		case "mostplayed":
			// Used to be tracks with above average playcount, now also includes any rated tracks. Still called mostplayed :)
			$avgplays = getAveragePlays();
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Playcounttable USING (TTindex) LEFT JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Hidden = 0 AND (Playcount > ".$avgplays." OR Rating IS NOT NULL)";
			break;
		case "neverplayed":
			// LEFT JOIN (used here and above) means that the right-hand side of the JOIN will be NULL if TTindex doesn't exist on that side. Very handy.
			// http://dev.mysql.com/doc/refman/5.0/en/join.html
			$sqlstring = "SELECT Tracktable.TTindex FROM Tracktable LEFT JOIN Playcounttable ON Tracktable.TTindex = Playcounttable.TTindex WHERE Playcounttable.TTindex IS NULL";
			break;
		default:
			if (preg_match('/tag\+(.*)/', $playlist, $matches)) {
				$taglist = split(',', $matches[1]);
				$sqlstring = "SELECT DISTINCT TTindex FROM Tracktable JOIN TagListtable USING (TTindex) JOIN Tagtable USING (Tagindex) WHERE (";
				$tags = array();
				foreach ($taglist as $i => $tag) {
					debug_print("Getting tag playlist for ".$tag,"PLAYLISTS");
					$tags[] = trim($tag);
					if ($i > 0) {
						$sqlstring .= " OR ";
					}
					$sqlstring .=  "Tagtable.Name = ?";
				}
				$sqlstring .= ") AND Tracktable.Uri IS NOT NULL AND Tracktable.Hidden=0 ";
			}
			break;
	}
	$uris = getAllURIs($sqlstring, $limit, $tags, $random);
	$json = array();
	foreach ($uris as $u) {
		array_push($json, array( 'type' => 'uri', 'name' => $u));
	}
	print json_encode($json);
}

function delete_track($ttid) {
	global $returninfo;
	if (remove_ttid($ttid)) {
		checkAlbumsAndArtists();
		remove_cruft();
		update_track_stats();
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
		print json_encode($returninfo);
	} else {
		header('HTTP/1.0 403 Forbidden');
	}
}

function check_album_image() {
	
	// This archives stuff with getRemoteImage, which will mostly come from the
	// last.FM importer
	global $album, $albumartist, $error, $download_file, $convert_path, $image;
	$imagekey = md5($albumartist." ".$album);
	if (preg_match('#^getRemoteImage\.php#', $image) && !file_exists('albumart/small/'.$imagekey.'.jpg')) {
		$u = get_base_url();
		$u = preg_replace('#backends/sql#', '', $u);
		$convert_path = find_executable('convert');
		$download_file = download_file($u.$image, $imagekey, $convert_path);
		if ($error !== 1) {
			list($image, $a) = saveImage($imagekey, true, "");
		}
	}

}

function check_wishlist_doodads($ttids) {
	global $uri, $albumartist, $album, $spotilink, $image, $date;
	$donesomething = false;
	if ($stmt = sql_prepare_query("SELECT Uri, Albumindex FROM Tracktable WHERE TTindex = ?", $ttids[0])) {
		while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
			if ($ttidobj->Uri == null) {
				if ($up1 = sql_prepare_query("UPDATE Tracktable SET Uri = ? WHERE TTindex = ?", $uri, $ttids[0])) {
					debug_print("  .. Updated track URI","USERRATINGS");
					$donesomething = true;
				} else {
					debug_print("  .. FAILED to update Track URI!","USERRATINGS");
				}
				if ($ttidobj->Albumindex == null) {
					$albumai = check_artist($albumartist, true);
					$albumindex = check_album($album, $albumai, $spotilink, $image, $date, "no", md5($albumartist." ".$album), null, getDomain($uri), true);
					if ($up2 = sql_prepare_query("UPDATE Tracktable SET Albumindex = ? WHERE TTindex = ?", $albumindex, $ttids[0])) {
						debug_print("  .. Updated track album index","USERRATINGS");
						$donesomething = true;
					} else {
						debug_print("  .. FAILED to update Track Album Index!","USERRATINGS");
					}
				}
			}
		}
	}
	return $donesomething;
}

?>