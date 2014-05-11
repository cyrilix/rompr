<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
include ("international.php");
include ("backends/sql/backend.php");

$error = 0;
$count = 1;
$download_file = "";
$divtype = "album1";
$collection = null;
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
$date = array_key_exists('date', $_POST) ? $_POST['date'] : null;
$urionly = array_key_exists('urionly', $_POST) ? true : false;
$forceupdate = array_key_exists('forceupdate', $_POST) ? true : false;

switch ($_POST['action']) {

	case 'getplaylist':
		preparePlaylist();
		doPlaylist($_POST['playlist']);
		break;

	case 'repopulate':
		doPlaylist($_POST['playlist']);
		break;

	case 'taglist':
		print json_encode(list_all_tag_data());
		break;

	case 'ratlist':
		print json_encode(list_all_rating_data());
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
		$ttid = find_item(	$uri,
							$title,
							$artist,
							$album);
		if ($ttid) {
			print json_encode(get_all_data($ttid));
		} else {
			print json_encode( $nodata );
		}
		break;

	case 'set':
		if ($artist === null ||
			$title === null ||
			!array_key_exists('attribute', $_POST) ||
			!array_key_exists('value', $_POST)) {
			debug_print("Something is not set","USERRATING");
			header('HTTP/1.0 403 Forbidden');
			exit(0);
		}
		$ttid = find_item(	$uri,
							$title,
							$artist,
							$album,
							$urionly);
		if ($ttid == null) {

			// NOTE: This is adding new tracks without putting them through the collectioniser.
			// This is probably OK, since the collectioniser was designed for coping with
			// local files that had bad or partial tags. Stuff coming from online sources
			// is usually OK. I hope.

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
										null, null, null, null, null,
										md5($artist." ".$album),
										null, null, null, null,
										$uri === null ? "local" : getDomain($uri));
		}
		if ($ttid) {
			update_track_stats();
			if (set_attribute($ttid, $_POST['attribute'], $_POST['value'])) {
				if ($uri || $forceupdate) {
					// Don't tell the browser to add stuff to the collection
					// if we didn't have a URI. Except if forceupdate is set -
					// this is used by the rating manager in the wibbly wibbly world of cod.
					send_list_updates($artist_created, $album_created, $ttid);
				}
			} else {
				debug_print("Set Attribute Failed","USERRATING");
				header('HTTP/1.0 403 Forbidden');
			}
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
		$ttid = find_item(	$uri,
							$title,
							$artist,
							$album);
		if ($ttid) {
			if (remove_tag($ttid, trim($_POST['value']))) {
				send_list_updates($artist_created, $album_created, $ttid);
			} else {
				header('HTTP/1.0 403 Forbidden');
			}
		} else {
			header('HTTP/1.0 403 Forbidden');
		}
		break;


	case 'delete':
		$ttid = find_item($uri, null, null, null);
		if ($ttid == null) {
			header('HTTP/1.0 403 Forbidden');
		} else {
			delete_track($ttid);
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

}

function preparePlaylist() {
	generic_sql_query("DROP TABLE IF EXISTS pltable");
	generic_sql_query("CREATE TABLE pltable(TTindex INT UNSIGNED NOT NULL UNIQUE)");
}

function doPlaylist($playlist) {
	global $mysqlc;
	debug_print("Loading Playlist ".$playlist,"RATINGS");
	$sqlstring = "";
	switch($playlist) {
		case "1stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Rating > 0";
			break;
		case "2stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Rating > 1";
			break;
		case "3stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Rating > 2";
			break;
		case "4stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Rating > 3";
			break;
		case "5stars":
			$sqlstring = "SELECT TTindex FROM Tracktable JOIN Ratingtable USING (TTindex) WHERE Uri IS NOT NULL AND Rating > 4";
			break;
		default:
			if (preg_match('/tag\+(.*)/', $playlist, $matches)) {
				$taglist = split(',', $matches[1]);
				$sqlstring = "SELECT DISTINCT TTindex FROM Tracktable JOIN TagListtable USING (TTindex) JOIN Tagtable USING (Tagindex) WHERE (";
				foreach ($taglist as $i => $tag) {
					debug_print("Getting tag playlist for ".$tag,"PLAYLISTS");
					if ($i > 0) {
						$sqlstring .= " OR ";
					}
					$sqlstring .=  "Tagtable.Name = '".mysqli_real_escape_string($mysqlc, trim($tag))."'";

				}
				$sqlstring .= ") AND Tracktable.Uri IS NOT NULL";
			}
			break;
	}
	$uris = getAllURIs($sqlstring);
	$json = array();
	foreach ($uris as $u) {
		array_push($json, array( 'type' => 'uri', 'name' => $u));
	}
	print json_encode($json);
}

function delete_track($ttid) {
	if (remove_ttid($ttid)) {
		update_track_stats();
		$returninfo = array();
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
		print json_encode($returninfo);
	} else {
		header('HTTP/1.0 403 Forbidden');
	}
}

function send_list_updates($artist_created, $album_created, $ttid) {
	global $mysqlc;
	$returninfo = array();
	if ($artist_created !== false) {
		debug_print("Artist was created","USER RATING");
		// We had to create a new albumartist, so we send back the artist HTML header
		// We need to know the artist details and where in the list it is supposed to go.
		archive_image();
		$returninfo = do_artists_from_database($artist_created);
	} else if ($album_created !== false) {
		debug_print("Album was created","USER RATING");
		archive_image();
		// Find the artist
		$artistid = find_artist_from_album($album_created);
		if ($artistid === null) {
			debug_print("ERROR - no artistID found!","USER RATING");
		} else {
			$returninfo = do_albums_from_database('aartist'.$artistid, $album_created);
		}
	}  else {
		debug_print("A Track was modified","USER RATING");
		$albumid = find_album_from_track($ttid);
		if ($albumid === null) {
			debug_print("ERROR - no albumID found!","USER RATING");
		} else {
			$returninfo['type'] = 'insertInto';
			$returninfo['where'] = 'aalbum'.$albumid;
			$returninfo['html'] = printHeaders().do_tracks_from_database($returninfo['where'], true).printTrailers();
		}

	}
	$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
	$returninfo['metadata'] = get_all_data($ttid);
	print json_encode($returninfo);
}

function archive_image() {
	global $image;
	global $convert_path;
	global $error;
	global $download_file;
	global $albumartist;
	global $album;
	$key = md5($albumartist." ".$album);
	if (!preg_match('/^albumart/', $image)) {
		debug_print("Archiving Image For Album","USER RATING");
		if (preg_match('#prefs/imagecache/#', $image)) {
            $image = preg_replace('#_small\.jpg|_original\.jpg#', '', $image);
			system( 'cp '.$image.'_small.jpg albumart/small/'.$key.'.jpg');
			system( 'cp '.$image.'_original.jpg albumart/original/'.$key.'.jpg');
			system( 'cp '.$image.'_asdownloaded.jpg albumart/asdownloaded/'.$key.'.jpg');
			update_image_db($key, 0, 'albumart/small/'.$key.'.jpg');
		} else {
			$convert_path = find_executable("convert");
			$image = preg_replace('#getRemoteImage.php\?url=#', '', $image);
			$download_file = download_file($image, $key, $convert_path);
			if ($error == 0) {
				list ($small_file, $main_file, $big_file) = saveImage($key, true, '');
				update_image_db($key, $error, $small_file);
			}
		}
	}

}

?>