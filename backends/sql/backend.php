<?php

include( "backends/sql/connect.php");
connect_to_database();
$artist_created = false;
$album_created = false;
$find_track = null;
$update_track = null;
$transaction_open = false;
$numdone = 0;
$doing_search = false;

// In the following, we're using a mixture of prepared statements and raw queries.
// Raw queries are easier to handle in many cases, but prepared statements take a lot of fuss away
// when dealing with strings, as it automatically escapes everything.

// So what are Hidden tracks?
// These are used to count plays from online sources when those tracks are not in the collection.
// Doing this does increase the size of the database. Quite a lot. But without it the stats for charts
// and fave artists etc don't make a lot of sense in a world where a proportion of your listening
// is in response to searches of Spotify or youtube etc.

// Wishlist items have Uri as NULL and Album might also be NULL

// Assumptions are made in the code that Wishlist items will not be hidden tracks and that hidden
// tracks have no metadata apart from a Playcount. Always be aware of this.

// For tracks, LastModified controls whether a collection update will update any of its data.
// Tracks added by hand (by tagging or rating, via userRatings.php) must have LastModified as NULL
// - this is how we prevent the collection update from removing them.

// TODO. If we find a wishlist item and we're doing a SET, or ADD, or INC we really ought to update
// the album and URI details if we can. Doing a collection update will do this but adding things by
// rating or tagging ar adding a spotify album don't.

// Search:
// The database is now used to handle the search results as well.
// Tracktable.isSearchResult is set to:
//		1 on any existing track that comes up in the search
//		2 for any track that comes up the search and has to be added - i.e it's not part of
//			the main collection.
//		3 for any hidden track that comes up in search so it can be re-hidden later.
//		The reason for doing search through the database like this is that
//		a) It means we can dump the old xml backend
//		b) The search results will obey the same sort options as the collection
//		c) We can include rating info in the search results just like in the collection.

function find_item($uri,$title,$artist,$album,$albumartist,$urionly) {

	// find_item is used by userRatings to find tracks on which to update or display metadata.
	// It is NOT used when the collection is created

	// When Setting Metadata we do not use a URI because we might have mutliple versions of the
	// track in the database or someone might be rating a track from Spotify that they already have
	// in Local. So in this case we check using an increasingly wider check to find the track,
	// returning as soon as one of these produces matches.
	// 		First by Track, Track Artist, and Album
	//		Then by Track, Album Artist, and Album
	//		Then by Track, Artist, and Album NULL (meaning wishlist)
	// We return ALL tracks found, because you might have the same track on multiple backends,
	// and set metadata on them all.
	// This means that when getting metadata it doesn't matter which one we match on.
	// When we Get Metadata we do supply a URI BUT we don't use it if we have one, just because.
	// $urionly can be set to force looking up only by URI. This is used by when we need to import a
	// specific version of the track  - currently from either the Last.FM importer or when we add a
	// spotify album to the collection

	// If we don't supply an album to this function that's because we're listening to the radio.
	// In that case we look for a match where there is something in the album field and then for
	// where album is NULL

	// FIXME! There is one scenario where the above fails.
	// If you tag or rate a track, and then add it to the collection again from another backend
	// later on, the rating doesn't get picked up by the new copy.
	// Looking everything up by name/album/artist (i.e. ignoring the URI in find_item)
	// doesn't fix this because the collection display still doesn't show the rating as that's
	// looked up by TTindex.


	debuglog("Looking for item ".$title,"MYSQL");
	$ttids = array();

	if ($urionly && $uri) {
		debuglog("  Trying by URI ".$uri,"MYSQL");
		if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable WHERE Uri = ?", $uri)) {
			while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
				debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
				$ttids[] = $ttidobj->TTindex;
			}
		}
	}

	if ($artist == null || $title == null || ($urionly && $uri)) {
		return $ttids;
	}

	if (count($ttids) == 0) {
		if ($album) {
			// Note. We regard the same track on a different album as a different version.
			// So, first try looking up by title, track artist, and album
			debuglog("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
			if ($stmt = sql_prepare_query(
				"SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable ".
				"USING (Albumindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) ".
				"AND LOWER(Albumname) = LOWER(?)", $title, $artist, $album)) {
				while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
					debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
					$ttids[] = $ttidobj->TTindex;
				}
			}

			// Track artists can vary by backend, and can come back in a different order sometimes
			// so we could have $artist = "A & B" but it's in the database as "B & A".
			if (count($ttids) == 0 && $albumartist !== null) {
				debuglog("  Trying by albumartist ".$albumartist." album ".$album." and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query(
					"SELECT TTindex FROM Tracktable JOIN Albumtable USING (Albumindex) JOIN Artisttable ".
					"ON Albumtable.AlbumArtistindex = Artisttable.Artistindex WHERE LOWER(Title) = LOWER(?) ".
					"AND LOWER(Artistname) = LOWER(?) AND LOWER(Albumname) = LOWER(?)",
					$title, $albumartist, $album)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}

			// Finally look for album NULL which will be a wishlist item added via a radio station
			if (count($ttids) == 0) {
				debuglog("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query(
					"SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE ".
					"LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NULL",
					$title, $artist)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}
		} else {
			// No album supplied - ie this is from a radio stream. First look for a match where
			// there is something in the album field
			debuglog("  Trying by artist ".$artist." album NOT NULL and track ".$title,"MYSQL");
			if ($stmt = sql_prepare_query(
				"SELECT TTindex FROM Tracktable JOIN Artisttable USING ".
				"(Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND ".
				"Albumindex IS NOT NULL", $title, $artist)) {
				while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
					debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
					$ttids[] = $ttidobj->TTindex;
				}
			}

			if (count($ttids) == 0) {
				debuglog("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query(
					"SELECT TTindex FROM Tracktable JOIN Artisttable USING ".
					"(Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) ".
					"AND Albumindex IS NULL", $title, $artist)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debuglog("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}
		}
	}

	return $ttids;
}

function find_wishlist_item($artist, $album, $title) {
	debuglog("Looking for wishlist item","MYSQL");
	$ttid = null;
	if ($album) {
		debuglog("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
		if ($stmt = sql_prepare_query(
			"SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable ".
			"USING (Albumindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND ".
			"LOWER(Albumname) = LOWER(?) AND Tracktable.Uri IS NULL", $title, $artist, $album)) {
			$ttidobj = $stmt->fetch(PDO::FETCH_OBJ);
			$ttid = $ttidobj ? $ttidobj->TTindex : null;
			if ($ttid) {
				debuglog("    Found TTindex ".$ttid,"MYSQL");
			}
		}
	} else {
		debuglog("  Trying by artist ".$artist." and track ".$title,"MYSQL");
		if ($stmt = sql_prepare_query(
			"SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE ".
			"LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NULL AND ".
			"Tracktable.Uri IS NULL", $title, $artist)) {
			$ttidobj = $stmt->fetch(PDO::FETCH_OBJ);
			$ttid = $ttidobj ? $ttidobj->TTindex : null;
			if ($ttid) {
				debuglog("    Found TTindex ".$ttid,"MYSQL");
			}
		}
	}
	return $ttid;
}

function create_new_track($title, $artist, $trackno, $duration, $albumartist, $albumuri, $image,
						$album, $date, $uri, $trackai, $albumai, $albumi, $searched, $imagekey,
						$lastmodified, $disc, $ambid, $domain, $hidden, $trackimage, $searchflag) {
	
	global $mysqlc, $artist_created, $album_created, $returninfo;

	if ($albumai == null) {
		// Does the albumartist exist?
		$albumai = check_artist($albumartist, true);
	}

	// Does the track artist exist?
	if ($trackai == null) {
		if ($artist != $albumartist) {
			$trackai = check_artist($artist, false);
		} else {
			$trackai = $albumai;
		}
	}

	if ($albumai == null || $trackai == null) {
		return null;
	}

	if ($albumi == null) {
		// Does the album exist?
		if ($album) {
			$albumi = check_album($album, $albumai, $albumuri, $image, $date, $searched, $imagekey,
				$ambid, $domain, true);
			if ($albumi == null) {
				return null;
			}
		}
	}

	$retval = null;
	if ($stmt = sql_prepare_query(
		"INSERT INTO Tracktable (Title, Albumindex, Trackno, Duration, Artistindex, Disc, Uri, ".
			"LastModified, Hidden, isSearchResult) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		$title, $albumi, $trackno, $duration, $trackai, $disc, $uri, $lastmodified, $hidden, $searchflag))
	{
		$retval = $mysqlc->lastInsertId();
		$returninfo['displaynewtrack'] = array(
			'artistindex' => $albumai,
			'albumindex' => $albumi,
			'trackuri' =>  rawurlencode($uri)
		);
		// debuglog("Created track ".$title." with TTindex ".$retval,"MYSQL",8);
	}

	if ($retval && $trackimage) {
		// What are trackimages?
		// Certain backends (youtube and soundcloud) return an image but using it as an album image doesn't make
		// a lot of sense visually. So for these tracks we use it as a track image which will be displayed
		// alongside the track in the collection and the playlist. The album images for these sites
		// will always be the site logo, as set when the collection is created
		if ($stmt = sql_prepare_query("INSERT INTO Trackimagetable (TTindex, Image) VALUES (?, ?)",
			$retval, $trackimage)) {
			debuglog("Added Image for track","MYSQL",8);
		}
	}

	return $retval;
}

function check_artist($artist, $upflag = false) {
	global $artist_created, $prefs;
	$index = null;
	if ($stmt = sql_prepare_query(
		"SELECT Artistindex FROM Artisttable WHERE LOWER(Artistname) = LOWER(?)", $artist)) {
		$obj = $stmt->fetch(PDO::FETCH_OBJ);
		$index = $obj ? $obj->Artistindex : null;
	    if ($index) {
	    	if ($upflag && $prefs['sortcollectionby'] == 'artist') {
				// For when we add new album artists...
				// Need to check whether the artist we now have has any VISIBLE albums -
				// we need to know if we've added a new albumartist so we can return the correct
				// html fragment to the javascript
				if ($result = generic_sql_query(
					"SELECT COUNT(Albumindex) AS num FROM Albumtable LEFT JOIN Tracktable USING ".
					"(Albumindex) WHERE AlbumArtistindex = ".$index." AND Hidden = 0 AND ".
					"isSearchResult < 2 AND Uri IS NOT NULL")) {
					$obj = $result->fetch(PDO::FETCH_OBJ);
					if ($obj->num == 0) {
						debuglog("Revealing artist ".$index,"MYSQL",6);
						$artist_created = $index;
					}
				}
			}
	    } else {
			$index = create_new_artist($artist, $upflag);
	    }
	}
	return $index;
}

function create_new_artist($artist, $upflag) {
	global $mysqlc;
	global $artist_created, $prefs;
	$retval = null;
	if ($stmt = sql_prepare_query("INSERT INTO Artisttable (Artistname) VALUES (?)", $artist)) {
		$retval = $mysqlc->lastInsertId();
		debuglog("Created artist ".$artist." with Artistindex ".$retval,"MYSQL",7);
		if ($upflag && $prefs['sortcollectionby'] == 'artist') {
			$artist_created = $retval;
			debuglog("  Adding artist to display ".$retval,"MYSQL",6);
		}
	}
	return $retval;
}

function check_album($album, $albumai, $albumuri, $image, $date, $searched, $imagekey, $mbid, $domain, $upflag) {
	global $album_created;
	$index = null;
	$year = null;
	$img = null;
	if ($stmt = sql_prepare_query(
		"SELECT Albumindex, Year, Image, AlbumUri FROM Albumtable WHERE LOWER(Albumname) = LOWER(?)".
		" AND AlbumArtistindex = ? AND Domain = ?", $album, $albumai, $domain)) {
		$obj = $stmt->fetch(PDO::FETCH_OBJ);
		$index = $obj ? $obj->Albumindex : 0;
		if ($index) {
			$year = $obj->Year;
			$img = $obj->Image;
			$sl = $obj->AlbumUri;
			if (($year == null && $date != null) ||
				(($img == null || $img = "") && ($image != "" && $image != null)) ||
				($sl == null && $albumuri != null)) {
				debuglog("Updating Details For Album ".$album ,"MYSQL",7);
				if ($up = sql_prepare_query(
					"UPDATE Albumtable SET Year=?, Image=?, AlbumUri=? WHERE Albumindex=?",
					$date,$image,$albumuri,$index)) {
					debuglog("   ...Success","MYSQL",9);
				} else {
					debuglog("   Album ".$album." update FAILED","MYSQL",3);
					return false;
				}
			}
			if ($upflag) {
				if ($result = generic_sql_query(
					"SELECT COUNT(TTindex) AS num FROM Tracktable WHERE Albumindex = ".$index.
					" AND Hidden = 0 AND isSearchResult < 2 AND Uri IS NOT NULL")) {
					$obj = $result->fetch(PDO::FETCH_OBJ);
					if ($obj->num == 0) {
						$album_created = $index;
						debuglog("We're using album ".$album." that was previously invisible","MYSQL",6);
					}
				}
			}
		} else {
			$index = create_new_album($album, $albumai, $albumuri, $image, $date,
				$searched, $imagekey, $mbid, $domain);
		}
	}
	return $index;
}

function create_new_album($album, $albumai, $albumuri, $image, $date,
							$searched, $imagekey, $mbid, $domain) {

	global $mysqlc, $album_created;
	$retval = null;

	// See if the image needs to be archived.
	// This archives stuff that is currently in prefs/imagecache -
	// these have come from coverscraper/getAlbumCover for albums that are in the search or playlist.
	// We can't use images from prefs/imagecache because they will eventually get removed.

	if (preg_match('#^prefs/imagecache/#', $image)) {
        $image = preg_replace('#_small\.jpg|_asdownloaded\.jpg#', '', $image);
		system( 'cp '.$image.'_small.jpg albumart/small/'.$imagekey.'.jpg');
		system( 'cp '.$image.'_asdownloaded.jpg albumart/asdownloaded/'.$imagekey.'.jpg');
		$image = 'albumart/small/'.$imagekey.'.jpg';
	}

	$i = checkImage($imagekey);
	if ($stmt = sql_prepare_query(
		"INSERT INTO Albumtable (Albumname, AlbumArtistindex, AlbumUri, Year, Searched, ImgKey, ".
		"mbid, Domain, Image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		$album, $albumai, $albumuri, $date, $i, $imagekey, $mbid, $domain, $image)) {
		$retval = $mysqlc->lastInsertId();
			debuglog("Created Album ".$album." with Albumindex ".$retval,"MYSQL",7);
			$album_created = $retval;
	}
	return $retval;
}

function checkImage($imagekey) {
	if (file_exists('albumart/small/'.$imagekey.'.jpg')) {
		return 1;
	}
	return 0;
}

function increment_value($ttid, $attribute, $value) {

	// Increment_value doesn't 'increment' as such - it's used for setting values on tracks without
	// unhiding them. It's used for Playcount, which was originally an 'increment' type function but
	// that changed because multiple rompr instances cause multiple increments

	debuglog("(Increment) Setting ".$attribute." to ".$value." for TTID ".$ttid, "MYSQL",8);
	if ($stmt = sql_prepare_query(
		"UPDATE ".$attribute."table SET ".$attribute."=? WHERE TTindex=?", $value, $ttid)) {
		if ($stmt->rowCount() == 0) {
			debuglog("  Update affected 0 rows, creating new value","MYSQL",8);
			if ($stmt = sql_prepare_query(
				"INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)",
				$ttid, $value)) {
				debuglog("    New Value Created", "MYSQL",8);
			} else {
				debuglog("    Failed to create new value", "MYSQL",3);
				return false;
			}
		}
	} else {
		return false;
	}
	return true;

}

function set_attribute($ttid, $attribute, $value) {

	// NOTE:
	// This will set value for an EXISTING attribute to 0, but it will NOT create a NEW attribute
	// when $value is 0. This is because 0 is meant to represent 'no attribute'.
	// This keeps the table size down and ALSO means import functions
	// can cause new tracks to be added just by tring to set Rating to 0.

	global $album_created, $artist_created, $returninfo;

	// We're setting an attribute.
	// If we're setting it on a hidden track we have to:
	// 1. Work out if this will cause a new artist and/or album to appear in the collection
	// 2. Unhide the track
	$unhidden = false;
	if (track_is_hidden($ttid)) {
		$unhidden = true;
		debuglog("Setting attribute on a hidden track","MYSQL",6);
		if ($artist_created == false && $prefs['sortcollectionby'] == 'artist') {
			// See if this means we're revealing a new artist
			if ($result = generic_sql_query(
				"SELECT COUNT(AlbumArtistindex) AS num FROM Albumtable LEFT JOIN Tracktable USING
				(Albumindex) WHERE AlbumArtistindex IN
				(SELECT AlbumArtistindex FROM Albumtable JOIN Tracktable USING (Albumindex)
				WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query(
						"SELECT AlbumArtistindex FROM Tracktable LEFT JOIN
						Albumtable USING (Albumindex) WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$artist_created = $obj->AlbumArtistindex;
							debuglog("Revealing Artist Index ".$artist_created,"MYSQL",6);
						}
					}
				}
			}
		}
		if ($artist_created == false && $album_created == false) {
			// See if this means we're revealing a new album
			if ($result = generic_sql_query(
				"SELECT COUNT(TTindex) AS num FROM Tracktable WHERE Albumindex = (SELECT Albumindex ".
				"FROM Tracktable WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query(
						"SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$album_created = $obj->Albumindex;
							debuglog("Revealing Album Index ".$album_created,"MYSQL",6);
						}
					}
				}
			}
		}
		generic_sql_query("UPDATE Tracktable SET Hidden=0 WHERE TTindex=".$ttid);
	}

	// Similarly, if it's a search result of type 2, it needs to become a type 1
	if (track_is_searchresult($ttid)) {
		$unhidden = true;
		debuglog("Setting attribute on a search result track","MYSQL",6);
		if ($artist_created == false && $album_created == false && $prefs['sortcollectionby'] == 'artist') {
			// See if this means we're revealing a new artist
			if ($result = generic_sql_query("SELECT COUNT(AlbumArtistindex) AS num FROM Albumtable
				LEFT JOIN Tracktable USING (Albumindex) WHERE AlbumArtistindex IN
				(SELECT AlbumArtistindex FROM Albumtable JOIN Tracktable USING (Albumindex) WHERE
				TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL AND isSearchResult < 2")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query("SELECT AlbumArtistindex FROM Tracktable LEFT JOIN
						Albumtable USING (Albumindex) WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$artist_created = $obj->AlbumArtistindex;
							debuglog("Revealing Artist Index ".$artist_created,"MYSQL",6);
						}
					}
				}
			}
		}
		if ($artist_created == false && $album_created == false) {
			// See if this means we're revealing a new album
			if ($result = generic_sql_query("SELECT COUNT(TTindex) AS num FROM Tracktable WHERE
				Albumindex = (SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid.") AND
				Hidden = 0 AND Uri IS NOT NULL AND isSearchResult < 2")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query(
						"SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$album_created = $obj->Albumindex;
							debuglog("Revealing Album Index ".$album_created,"MYSQL",6);
						}
					}
				}
			}
		}
		// NOTE we must set LastModified to NULL if it's a search result, otherwise
		// we don't get the cross next to it and a collection update will remove it.
		generic_sql_query("UPDATE Tracktable SET isSearchResult = 1,
			LastModified = NULL WHERE TTindex=".$ttid);
	}
	
	if ($unhidden) {
		if ($result = generic_sql_query("SELECT Uri, Albumindex, AlbumArtistindex FROM
			Tracktable JOIN Albumtable USING (Albumindex) WHERE Tracktable.TTindex = ".$ttid)) {
			$obj = $result->fetch(PDO::FETCH_OBJ);
			$returninfo['displaynewtrack'] = array(
				'artistindex' => $obj->AlbumArtistindex,
				'albumindex' => $obj->Albumindex,
				'trackuri' =>  rawurlencode($obj->Uri)
			);
		}
	}

	if ($attribute == 'Tags') {
		return addTags($ttid, $value);
	} else {
		debuglog("Setting ".$attribute." to ".$value." on ".$ttid,"MYSQL",8);
		if ($stmt = sql_prepare_query(
			"UPDATE ".$attribute."table SET ".$attribute."=? WHERE TTindex=?", $value, $ttid)) {
			if ($stmt->rowCount() == 0 && $value !== 0) {
				debuglog("  Update affected 0 rows, creating new value","MYSQL",8);
				if ($stmt = sql_prepare_query(
					"INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)", $ttid, $value)) {
					debuglog("    New Value Created", "MYSQL",8);
				} else {
					// NOTE - we could get here if the attribute we are setting already exists
					// (eg setting Rating to 5 on a track that already has rating set to 5).
					// We don't check that because the database is set up such that this
					// can't happen twice - because the rating table uses TWO indices to keep things unique.
					// Hence an error here is probably not a problem, so we ignore them.
					// debuglog("  Error Executing mySql", "MYSQL");
				}
			}
		} else {
			return false;
		}
		return true;
	}
}

function addTags($ttid, $tags) {
	foreach ($tags as $tag) {
		$t = trim($tag);
		debuglog("Adding Tag ".$t." to ".$ttid,"MYSQL",8);
		$tagindex = null;
		if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name=?", $t)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$tagindex = $obj->Tagindex;
			}
			if ($tagindex == null) {
				$tagindex = create_new_tag($t);
			}
			if ($tagindex == null) {
				debuglog("    Could not create tag ".$t,"MYSQL",2);
				return false;
			}
			if ($result = generic_sql_query(
				"SELECT COUNT(*) AS num FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					debuglog("Adding new tag relation","MYSQL",8);
					if ($result = generic_sql_query(
						"INSERT INTO TagListtable (TTindex, Tagindex) VALUES ('".$ttid."', '".$tagindex."')")) {
						debuglog("Success","MYSQL");
					} else {
						return false;
					}
				} else {
					debuglog("Tag relation already exists","MYSQL",9);
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	return true;
}

function create_new_tag($tag) {
	global $mysqlc;
	debuglog("Creating new tag ".$tag,"MYSQL",7);
	$tagindex = null;
	if ($result = sql_prepare_query("INSERT INTO Tagtable (Name) VALUES (?)", $tag)) {
		$tagindex = $mysqlc->lastInsertId();
	}
	return $tagindex;
}

function remove_tag($ttid, $tag) {
	debuglog("Removing Tag ".$tag." from ".$ttid,"MYSQL",5);
	$tagindex = null;
	if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name = ?", $tag)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$tagindex = $obj->Tagindex;
		}
		if ($tagindex == null) {
			debuglog("  ..  Could not find tag ".$tag,"MYSQL",2);
			return false;
		}
		if ($result = generic_sql_query(
			"DELETE FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
			debuglog(" .. Success","MYSQL",8);
		} else {
			return false;
		}
	} else {
		return false;
	}
	return true;
}

function list_tags() {
	$tags = array();
	if ($result = generic_sql_query("SELECT Name FROM Tagtable ORDER BY LOWER(Name)")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($tags, $obj->Name);
		}
	}
	return $tags;
}

function list_all_tag_data() {
	$tags = array();
	if ($result = generic_sql_query(
		"SELECT t.Name, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname,
		al.Image, al.AlbumArtistindex, tr.Uri FROM Tagtable AS t JOIN TagListtable AS tl USING
		(Tagindex) JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex)
		JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) ORDER BY
		t.Name, a.Artistname, al.Albumname, tr.TrackNo")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists($obj->Name, $tags)) {
				$tags[$obj->Name] = array();
			}
			array_push($tags[$obj->Name], array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => imagePath($obj->Image),
				'Uri' => $obj->Uri,
				'Trackno' => $obj->TrackNo,
				'Duration' => $obj->Duration,
				'Disc' => $obj->Disc,
				'AAIndex' => $obj->AlbumArtistindex
			));
		}
	}
	foreach ($tags as $r => $a) {
		foreach ($tags[$r] as $s => $b) {
			if ($result = generic_sql_query(
				"SELECT Artistname FROM Artisttable WHERE Artistindex = ".$tags[$r][$s]['AAIndex'])) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$tags[$r][$s]['Albumartist'] = $obj->Artistname;
				}
			}
		}
	}
	return $tags;
}

function list_all_rating_data() {
	$ratings = array(
		"1" => array(),
		"2" => array(),
		"3" => array(),
		"4" => array(),
		"5" => array()
	);
	if ($result = generic_sql_query(
		"SELECT r.Rating, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname,
		al.Image, al.AlbumArtistindex, tr.Uri FROM Ratingtable AS r JOIN Tracktable AS tr USING
		(TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON
		(tr.Artistindex = a.Artistindex) WHERE r.Rating > 0 ORDER BY
		r.Rating, a.Artistname, al.Albumname, tr.TrackNo")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($ratings[$obj->Rating], array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => imagePath($obj->Image),
				'Uri' => $obj->Uri,
				'Trackno' => $obj->TrackNo,
				'Duration' => $obj->Duration,
				'Disc' => $obj->Disc,
				'AAIndex' => $obj->AlbumArtistindex
			));
		}
	}
	foreach ($ratings as $r => $a) {
		foreach ($ratings[$r] as $s => $b) {
			if ($result = generic_sql_query(
				"SELECT Artistname FROM Artisttable WHERE Artistindex = ".$ratings[$r][$s]['AAIndex'])) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$ratings[$r][$s]['Albumartist'] = $obj->Artistname;
				}
			}
		}
	}
	return $ratings;
}

function list_all_playcount_data() {
	$playcounts = array();
	if ($result = generic_sql_query(
		"SELECT pl.Playcount, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname,
		al.Image, al.AlbumArtistindex, tr.Uri FROM Playcounttable AS pl JOIN Tracktable AS tr USING
		(TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON
		(tr.Artistindex = a.Artistindex) WHERE pl.Playcount > 0")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($playcounts, array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => imagePath($obj->Image),
				'Uri' => $obj->Uri,
				'Playcount' => $obj->Playcount,
				'Trackno' => $obj->TrackNo,
				'Duration' => $obj->Duration,
				'Disc' => $obj->Disc,
				'AAIndex' => $obj->AlbumArtistindex
			));
		}
	}
	foreach ($playcounts as $r => $a) {
		if ($result = generic_sql_query(
			"SELECT Artistname FROM Artisttable WHERE Artistindex = ".$playcounts[$r]['AAIndex'])) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$playcounts[$r]['Albumartist'] = $obj->Artistname;
			}
		}
	}
	return $playcounts;
}

function remove_tag_from_db($tag) {
	$r = true;
	debuglog("Removing Tag ".$tag." from database","MYSQL",5);
	if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name=?", $tag)) {
		$obj = $result->fetch(PDO::FETCH_OBJ);
		$tagindex = $obj ? $obj->Tagindex : null;
		if ($tagindex !== null) {
			$r = generic_sql_query("DELETE FROM TagListtable WHERE Tagindex = ".$tagindex);
			if ($r) {
				$r = generic_sql_query("DELETE FROM Tagtable WHERE Tagindex = ".$tagindex);
			}
		} else {
			debuglog(" .. Could not find tag ".$tag." to remove!","MYSQL",2);
			$r = false;
		}
	} else {
		$r = false;
	}
	return $r;
}

function get_all_data($ttid) {

	// Misleadingly named function which should be used to get ratings and tags
	// (and whatever else we might add) based on a TTindex

	global $nodata;
	$data = $nodata;
	if ($result = generic_sql_query("SELECT Rating FROM Ratingtable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$data['Rating'] = $obj ? $obj->Rating : 0;
			debuglog("Rating is ".$data['Rating'],"MYSQL",7);
		}
	}
	if ($result = generic_sql_query(
		"SELECT Name FROM Tagtable JOIN TagListtable USING(Tagindex) WHERE TagListtable.TTindex = '".
		$ttid."' ORDER BY Name")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($data['Tags'], $obj->Name);
			debuglog("Got Tag ".$obj->Name,"MYSQL",7);
		}
	}
	if ($result = generic_sql_query(
		"SELECT Playcount FROM Playcounttable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$data['Playcount'] = $obj ? $obj->Playcount : 0;
			debuglog("Playcount is ".$data['Playcount'],"MYSQL",7);
		}
	}

	return $data;
}

function get_imagesearch_info($key) {

	// Used by getalbumcover.php to get album and artist names etc based on an Image Key
	$retval = array(false, null, null, null, null, null, false);
	if ($result = generic_sql_query(
		"SELECT Artistname, Albumname, mbid, Albumindex, AlbumUri FROM Albumtable JOIN Artisttable
		ON AlbumArtistindex = Artistindex WHERE ImgKey = '".$key."'")) {
		// This can come back with multiple results if we have the same album on multiple backends
		// So we make sure we combine the data to get the best possible set
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if ($retval[1] == null) {
				$retval[1] = $obj->Artistname;
			}
			if ($retval[2] == null) {
				$retval[2] = $obj->Albumname;
			}
			if ($retval[3] == null || $retval[3] == "") {
				$retval[3] = $obj->mbid;
			}
			if ($retval[4] == null) {
				$retval[4] = get_album_directory($obj->Albumindex, $obj->AlbumUri);
			}
			if ($retval[5] == null || $retval[5] == "") {
				$retval[5] = $obj->AlbumUri;
			}
			$retval[0] = true;
			$retval[6] = true;
			debuglog("Found album ".$key." in database","GETALBUMCOVER",6);
		}
	}
	return $retval;
}

function get_albumlink($albumindex) {
	$link = "";
	if ($result = generic_sql_query(
		"SELECT AlbumUri FROM Albumtable WHERE Albumindex = '".$albumindex."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$link = $obj ? $obj->AlbumUri : "";
		}
	}
	return $link;
}

function get_album_directory($albumindex, $uri) {
	global $prefs;
	$retval = null;
	// Get album directory by using the Uri of one of its tracks, making sure we choose only local tracks
	if (!preg_match('/\w+?:album/', $uri)) {
		if ($result2 = generic_sql_query(
			"SELECT Uri FROM Tracktable WHERE Albumindex = ".$albumindex." LIMIT 1")) {
			while ($obj2 = $result2->fetch(PDO::FETCH_OBJ)) {
				$retval = dirname($obj2->Uri);
				$retval = preg_replace('#^local:track:#', '', $retval);
				$retval = preg_replace('#^file://#', '', $retval);
				$retval = preg_replace('#^beetslocal:\d+:'.$prefs['music_directory_albumart'].'/#', '', $retval);
				debuglog("Got album directory using track Uri - ".$retval,"SQL",8);
			}
		}
	}
	return $retval;
}

function update_image_db($key, $notfound, $imagefile) {
	$val = ($notfound == 0) ? $imagefile : "";
	if ($stmt = sql_prepare_query(
		"UPDATE Albumtable SET Image=?, Searched = 1 WHERE ImgKey=?", $val, $key)) {
		debuglog("    Database Image URL Updated","MYSQL",8);
	} else {
		debuglog("    Failed To Update Database Image URL","MYSQL",2);
	}
}

function track_is_hidden($ttid) {
	if ($result = generic_sql_query("SELECT Hidden FROM Tracktable WHERE TTindex=".$ttid)) {
		$h = 0;
		while ($obj =$result->fetch(PDO::FETCH_OBJ)) {
			$h = $obj->Hidden;
		}
		if ($h != 0) {
			return true;
		}
	}
	return false;
}

function track_is_searchresult($ttid) {
	// This is for detecting tracks that were added as part of a search, or un-hidden as part of a search
	if ($result = generic_sql_query("SELECT isSearchResult FROM Tracktable WHERE TTindex=".$ttid)) {
		$h = 0;
		while ($obj =$result->fetch(PDO::FETCH_OBJ)) {
			$h = $obj->isSearchResult;
		}
		if ($h > 1) {
			return true;
		}
	}
	return false;
}

function albumartist_sort_query($flag) {
	global $prefs;
	// This query gives us album artists only. It also makes sure we only get artists for whom we
	// have actual tracks (no album artists who appear only on the wishlist or who have only hidden tracks)
	$sflag = ($flag == 'b') ? "AND t.isSearchResult > 0" : "AND t.isSearchResult < 2";
	$qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON
		a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex
		WHERE t.Uri IS NOT NULL AND t.Hidden = 0 ".$sflag." GROUP BY a.Artistindex ORDER BY ";
	foreach ($prefs['artistsatstart'] as $a) {
		$qstring .= "CASE WHEN LOWER(Artistname) = LOWER('".$a."') THEN 1 ELSE 2 END, ";
	}
	if (count($prefs['nosortprefixes']) > 0) {
		$qstring .= "(CASE ";
		foreach($prefs['nosortprefixes'] AS $p) {
			$phpisshitsometimes = strlen($p)+2;
			$qstring .= "WHEN LOWER(Artistname) LIKE '".strtolower($p).
				" %' THEN LOWER(SUBSTR(Artistname,".$phpisshitsometimes.")) ";
		}
		$qstring .= "ELSE LOWER(Artistname) END)";
	} else {
		$qstring .= "LOWER(Artistname)";
	}
	return $qstring;
}

function do_artists_from_database($why, $what, $who) {
	global $divtype;
	$singleheader = array();
	debuglog("Generating artist ".$who." from database","DUMPALBUMS",7);
	$singleheader['type'] = 'insertAfter';
	$singleheader['where'] = 'fothergill';
	$count = 0;
	if ($result = generic_sql_query(albumartist_sort_query($why))) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if ($who == "root") {
				print artistHeader($why.$what.$obj->Artistindex, $obj->Artistname);
				$count++;
			} else {
				if ($obj->Artistindex != $who) {
					$singleheader['type'] = 'insertAfter';
					$singleheader['where'] = $why.$what.$obj->Artistindex;
				} else {
					$singleheader['html'] = artistHeader($why.$what.$obj->Artistindex, $obj->Artistname);
					return $singleheader;
				}
			}
			$divtype = ($divtype == "album1") ? "album2" : "album1";
		}
	} else {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
	return $count;
}

function get_list_of_artists() {
	$vals = array();
	if ($result = generic_sql_query(albumartist_sort_query("a"))) {
		while ($v = $result->fetch(PDO::FETCH_ASSOC)) {
			array_push($vals, $v);
		}
	}
	return $vals;
}

function do_albums_from_database($why, $what, $who, $fragment = false, $use_artistindex = false) {
	global $prefs;
	$singleheader = array();
	if ($prefs['sortcollectionby'] == "artist") {
		$singleheader['type'] = 'insertAtStart';
		$singleheader['where'] = $why.$what.$who;
	} else {
		$singleheader['type'] = 'insertAfter';
		$singleheader['where'] = 'fothergill';
	}
	debuglog("Generating albums for ".$why.$what.$who." from database","DUMPALBUMS",7);

	$sflag = ($why == "b") ? "AND Tracktable.isSearchResult > 0" : "AND Tracktable.isSearchResult < 2";

	$qstring = "SELECT Albumtable.*, Artisttable.Artistname FROM Albumtable JOIN Artisttable ON
			(Albumtable.AlbumArtistindex = Artisttable.Artistindex) WHERE ";

	if (!$use_artistindex && $who != "root" && $prefs['sortcollectionby'] != 'album' &&
		$prefs['sortcollectionby'] != 'albumbyartist') {
		$qstring .= "AlbumArtistindex = '".$who."' AND ";
	}
	if ($use_artistindex) {
		$qstring .= "Albumindex IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE
			Tracktable.Artistindex = ".$who." AND ";
	} else {
		$qstring .= "Albumindex IN (SELECT Albumindex FROM Tracktable WHERE
			Tracktable.Albumindex = Albumtable.Albumindex AND ";
	}

	$qstring .= "Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0 ".$sflag.")";
	$qstring .= " ORDER BY ";
	if ($prefs['sortcollectionby'] == "albumbyartist" && !$use_artistindex) {
		foreach ($prefs['artistsatstart'] as $a) {
			$qstring .= "CASE WHEN LOWER(Artisttable.Artistname) = LOWER('".$a."') THEN 1 ELSE 2 END, ";
		}
		if (count($prefs['nosortprefixes']) > 0) {
			$qstring .= "(CASE ";
			foreach($prefs['nosortprefixes'] AS $p) {
				$phpisshitsometimes = strlen($p)+2;
				$qstring .= "WHEN LOWER(Artisttable.Artistname) LIKE '".strtolower($p).
					" %' THEN LOWER(SUBSTR(Artisttable.Artistname,".$phpisshitsometimes.")) ";
			}
			$qstring .= "ELSE LOWER(Artisttable.Artistname) END),";
		} else {
			$qstring .= "LOWER(Artisttable.Artistname),";
		}
	}
	$qstring .= " CASE WHEN Albumname LIKE '".get_int_text('label_allartist')."%' THEN 1 ELSE 2 END,";
	if ($prefs['sortbydate']) {
		if ($prefs['notvabydate']) {
			$qstring .= " CASE WHEN Artisttable.Artistname = 'Various Artists' THEN LOWER(Albumname) ELSE Year END,";
		} else {
			$qstring .= ' Year,';
		}
	}
	$qstring .= ' LOWER(Albumname)';

	$count = 0;
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$artistthing = (!$use_artistindex &&
							($prefs['sortcollectionby'] == "album" ||
								$prefs['sortcollectionby'] == "albumbyartist")) ?
									$obj->Artistname : null;
			$exists = ($obj->Image && $obj->Image !== "") ? "yes" : "no";
			$albumlink = ($why == "a" || preg_match('/:album:|:artist:/', $obj->AlbumUri) ||
				preg_match('/^podcast/', $obj->AlbumUri)) ? rawurlencode($obj->AlbumUri) : null;
			if ($fragment === false) {
				print albumHeader(
					$obj->Albumname,
					$albumlink,
					$why.$what.$obj->Albumindex,
					$exists,
					($obj->Searched == 1 || $exists == "yes") ? "yes" : "no",
					$obj->ImgKey,
					$obj->Image,
					$obj->Year,
					null,
					$artistthing
				);
			} else {
				if ($obj->Albumindex != $fragment) {
					$singleheader['where'] = 'aalbum'.$obj->Albumindex;
					$singleheader['type'] = 'insertAfter';
				} else {
					$singleheader['html'] = albumHeader(
						$obj->Albumname,
						$albumlink,
						$why.$what.$obj->Albumindex,
						$exists,
						($obj->Searched == 1 || $exists == "yes") ? "yes" : "no",
						$obj->ImgKey,
						$obj->Image,
						$obj->Year,
						null,
						$artistthing
					);
					return $singleheader;
				}
			}
			$count++;
		}
		if ($count == 0 && !($why == 'a' && $who=='root')) {
			noAlbumsHeader();
		}
	} else {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
	return $count;
}

function remove_album_from_database($albumid) {
	generic_sql_query("DELETE FROM Tracktable WHERE Albumindex = ".$albumid);
	generic_sql_query("DELETE FROM Albumtable WHERE Albumindex = ".$albumid);
}

function get_list_of_albums($aid) {
	global $prefs;
	$vals = array();

	$qstring = "SELECT * FROM Albumtable WHERE AlbumArtistindex = '".$aid."' AND ";
	$qstring .= "Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex =
		Albumtable.Albumindex AND Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0 AND
		Tracktable.isSearchResult < 2)";
	$qstring .= ' ORDER BY LOWER(Albumname)';
	if ($result = generic_sql_query($qstring)) {
		while ($v = $result->fetch(PDO::FETCH_ASSOC)) {
			array_push($vals, $v);
		}
	}
	return $vals;
}

function get_album_tracks_from_database($index, $cmd, $flag) {
	$retarr = array();
	if ($flag == "a" && ($cmd === null || $cmd == "add")) {
		$albumuri = null;
		$qstring = "SELECT AlbumUri FROM Albumtable WHERE Albumindex = '".$index."'";
		if ($result = generic_sql_query($qstring)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$albumuri = $obj->AlbumUri;
			}
		}
		if ($albumuri !== null) {
			debuglog("Using full album link for albumindex ".$index,"SQL");
			if (strtolower(pathinfo($albumuri, PATHINFO_EXTENSION)) == "cue") {
				array_push($retarr, 'load "'.$albumuri.'"');
			} else {
				array_push($retarr, 'add "'.$albumuri.'"');
			}
			return $retarr;
		}
	}
	$cmd = ($cmd === null) ? 'add' : $cmd;
	$sflag = ($flag == "b") ? "AND isSearchResult > 0" : "AND isSearchResult < 2";
	debuglog("Getting Album Tracks for Albumindex ".$index,"MYSQL",7);
	$qstring = "SELECT Uri FROM Tracktable WHERE Albumindex = '".$index.
		"' AND Uri IS NOT NULL AND Hidden = 0 ".$sflag." ORDER BY Disc, TrackNo";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($retarr, $cmd.' "'.$obj->Uri.'"');
		}
	}
	return $retarr;
}

function get_artist_tracks_from_database($index, $cmd, $flag) {
	global $prefs;
	$retarr = array();
	debuglog("Getting Tracks for AlbumArtist ".$index,"MYSQL",7);
	$qstring = "SELECT Albumindex, Artistname FROM Albumtable JOIN Artisttable ON
		(Albumtable.AlbumArtistindex = Artisttable.Artistindex) WHERE AlbumArtistindex = ".$index." ORDER BY";
	if ($prefs['sortbydate']) {
		if ($prefs['notvabydate']) {
			$qstring .= " CASE WHEN Artistname = 'Various Artists' THEN LOWER(Albumname) ELSE Year END,";
		} else {
			$qstring .= ' Year,';
		}
	}
	$qstring .= ' LOWER(Albumname)';
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$retarr = array_merge($retarr, get_album_tracks_from_database($obj->Albumindex, $cmd, $flag));
		}
	}
	return $retarr;
}

function do_tracks_from_database($why, $what, $who, $fragment = false) {
    debuglog("Generating tracks for album ".$who." from database","DUMPALBUMS",7);
	if ($fragment) {
		ob_start();
	}
	$track_is_album = false;
	$track_is_artist = false;
	debuglog("Looking for albumID ".$who,"DUMPALBUMS",8);
	$numdiscs = 1;
	if ($result2 = generic_sql_query(
		"SELECT MAX(Disc) AS NumDiscs FROM Tracktable WHERE Albumindex = '".$who.
		"' AND Uri IS NOT NULL AND Hidden=0")) {
		$obj2 = $result2->fetch(PDO::FETCH_OBJ);
		$numdiscs = $obj2->NumDiscs;
	} else {
		debuglog("ERROR! Couldn't find NumDiscs for Albumindex ".$who,"MYSQL",3);
	}
	$t = ($why == "b") ? "AND isSearchResult > 0" : "AND isSearchResult < 2";
	if ($result = generic_sql_query(
		"SELECT t.*, a.Artistname, b.AlbumArtistindex, r.Rating, ti.Image FROM Tracktable AS t
		JOIN Artisttable AS a ON t.Artistindex = a.Artistindex JOIN Albumtable AS b ON
		t.Albumindex = b.Albumindex LEFT JOIN Ratingtable AS r ON r.TTindex = t.TTindex LEFT JOIN
		Trackimagetable AS ti ON ti.TTindex = t.TTindex WHERE t.Albumindex = '".$who.
		"' AND Uri IS NOT NULL AND Hidden=0 ".$t." ORDER BY
		CASE WHEN t.Title LIKE 'Album: %' THEN 1 ELSE 2 END, t.Disc, t.TrackNo")) {
		$trackarr = $result->fetchAll(PDO::FETCH_OBJ);
		$numtracks = count($trackarr);
		$currdisc = -1;
		while ($obj = array_shift($trackarr)) {
			if ($numdiscs > 1 && $obj->Disc != $currdisc && $obj->Disc > 0) {
                $currdisc = $obj->Disc;
                print '<div class="discnumber indent">'.
                ucfirst(strtolower(get_int_text("musicbrainz_disc"))).' '.$currdisc.'</div>';
			}
			$track_is_album = (preg_match('/^.+?:album:/', $obj->Uri)) ? $obj->Uri : false;
			$track_is_artist = (preg_match('/^.+?:artist:/', $obj->Uri)) ? $obj->Uri : false;
			albumTrack(
				$obj->Artistindex != $obj->AlbumArtistindex ? $obj->Artistname : null,
				$obj->Rating,
				rawurlencode($obj->Uri),
				$numtracks,
				$obj->TrackNo,
				$obj->Title,
				$obj->Duration,
				$obj->LastModified,
				$obj->Image
			);
		}
		if ($track_is_artist !== false) {
			debuglog("Album ".$who." has no tracks, just an artist link","SQL",6);
			print '<input type="hidden" class="expandartist"/>';
		} else if ($track_is_album !== false) {
			debuglog("Album ".$who." has no tracks, just an album link","SQL",6);
			print '<input type="hidden" class="expandalbum"/>';
		}
	} else {
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
	if ($fragment) {
		$s = ob_get_contents();
		ob_end_clean();
		return $s;
	}
}

function getAllURIs($sqlstring, $limit, $tags, $random = true) {

	// Get all track URIs using a supplied SQL string. For playlist generators
	debuglog("Selector is ".$sqlstring,"SMART PLAYLIST",6);
	$rndstr = $random ? " ORDER BY ".SQL_RANDOM_SORT : " ORDER BY Albumindex, TrackNo";

	generic_sql_query("CREATE TEMPORARY TABLE pltemptable(TTindex INT UNSIGNED NOT NULL UNIQUE)",true);
	if ($tags) {
		$stmt = sql_prepare_query_later(
			"INSERT INTO pltemptable(TTindex) ".$sqlstring.
			" AND NOT Tracktable.TTindex IN (SELECT TTindex FROM pltable)".$rndstr." LIMIT ".$limit);
		if ($stmt !== FALSE) {
			$stmt->execute($tags);
		}
	} else {
		generic_sql_query(
			"INSERT INTO pltemptable(TTindex) ".$sqlstring.
			" AND NOT Tracktable.TTindex IN (SELECT TTindex FROM pltable)".$rndstr." LIMIT ".$limit);
	}
	generic_sql_query("INSERT INTO pltable (TTindex) SELECT TTindex FROM pltemptable",true);

	$uris = array();
	if ($result = generic_sql_query(
		"SELECT Uri FROM Tracktable WHERE TTindex IN (SELECT TTindex FROM pltemptable)",true)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($uris, $obj->Uri);
			debuglog("URI : ".$obj->Uri,"SMART PLAYLIST");
		}
	}
	return $uris;
}

function get_fave_artists() {
	// Can we have a tuning slider to increase the 'Playcount > x' value?
	generic_sql_query(
		"CREATE TEMPORARY TABLE aplaytable AS SELECT SUM(Playcount) AS playtotal, Artistindex FROM
		(SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex) WHERE
		Playcount > 10) AS derived GROUP BY Artistindex");

	$artists = array();
	if ($result = generic_sql_query(
		"SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM
		(SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex)) AS
		derived GROUP BY Artistindex) AS alias JOIN Artisttable USING (Artistindex) WHERE
		playtot > (SELECT AVG(playtotal) FROM aplaytable) ORDER BY ".SQL_RANDOM_SORT)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			debuglog("Artist : ".$obj->Artistname,"FAVEARTISTS");
			array_push($artists, array( 'name' => $obj->Artistname, 'plays' => $obj->playtot));
		}
	}
	return $artists;
}

function get_artist_charts() {
	$artists = array();
	if ($result = generic_sql_query(
		"SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM
		(SELECT Playcount, Artistindex FROM Tracktable JOIN Playcounttable USING (TTindex)) AS arse
		GROUP BY Artistindex) AS cheese JOIN Artisttable USING (Artistindex)
		ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($artists, array( 'label_artist' => $obj->Artistname,
				'soundcloud_plays' => $obj->playtot));
		}
	}
	return $artists;
}

function get_album_charts() {
	$albums = array();
	if ($result = generic_sql_query(
		"SELECT playtot, Albumname, Artistname, AlbumUri FROM (SELECT SUM(Playcount) AS playtot,
		Albumindex FROM (SELECT Playcount, Albumindex FROM Tracktable JOIN Playcounttable USING (TTindex))
		AS arse GROUP BY Albumindex) AS cheese JOIN Albumtable USING (Albumindex) JOIN Artisttable
		ON (Albumtable.AlbumArtistIndex = Artisttable.Artistindex) ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($albums, array( 'label_artist' => $obj->Artistname,
				'label_album' => $obj->Albumname,
				'soundcloud_plays' => $obj->playtot, 'uri' => $obj->AlbumUri));
		}
	}
	return $albums;
}

function get_track_charts() {
	$tracks = array();
	if ($result = generic_sql_query(
		"SELECT Title, Playcount, Artistname, Uri FROM Tracktable JOIN Playcounttable USING (TTIndex)
		JOIN Artisttable USING (Artistindex) ORDER BY Playcount DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($tracks, array( 'label_artist' => $obj->Artistname,
				'label_track' => $obj->Title,
				'soundcloud_plays' => $obj->Playcount, 'uri' => $obj->Uri));
		}
	}
	return $tracks;
}

function getAveragePlays() {
	$avgplays = 0;
	if ($result = generic_sql_query("SELECT avg(Playcount) as avgplays FROM Playcounttable")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$avgplays = $obj->avgplays;
			debuglog("Average Plays is ".$avgplays, "SMART PLAYLIST",7);
		}
	}
	return round($avgplays, 0, PHP_ROUND_HALF_DOWN);
}

function find_artist_from_album($albumid) {
	$retval = null;
	$qstring = "SELECT AlbumArtistindex FROM Albumtable WHERE Albumindex = '".$albumid."'";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$retval = $obj->AlbumArtistindex;
		}
	}
	return $retval;
}

function find_album_from_track($ttid) {
	$retval = null;
	$qstring = "SELECT Albumindex FROM Tracktable WHERE TTindex = '".$ttid."'";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$retval = $obj->Albumindex;
		}
	}
	return $retval;
}

function remove_ttid($ttid) {

	// Remove a track from the database.
	// Doesn't do any cleaning up - call remove_cruft afterwards to remove orphaned artists and albums
	global $returninfo;
	$retval = false;
	$isr = 0;
	debuglog("Removing track ".$ttid,"MYSQL",5);
	if ($result = generic_sql_query("SELECT Uri, isSearchResult FROM Tracktable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists('deletedtracks', $returninfo)) {
				$returninfo['deletedtracks'] = array();
			}
			array_push($returninfo['deletedtracks'], rawurlencode($obj->Uri));
			$isr = $obj->isSearchResult;
		}
	}

	// Deleting tracks will delete their associated playcounts. While it might seem like a good idea
	// to hide them instead, in fact this results in a situation where we have tracks in our database
	// that no longer exist in physical form - eg if local tracks are removed. This is really bad if we then
	// later play those tracks from an online source and rate them. find_item will return the hidden local track,
	// which will get rated and appear back in the collection. So now we have an unplayable track in our collection.
	// There's no real way round it, (without creating some godwaful lookup table of backends it's safe to do this with)
	// so we just delete the track and lose the playcount information.
	if ($isr == 1) {
		// The only non-zero value for isSearchResult that is possible here is 1. I hope.
		if ($result = generic_sql_query("UPDATE Tracktable SET isSearchResult = 2 WHERE TTindex = '".$ttid."'")) {
			$retval = true;
		}
	} else {
		if ($result = generic_sql_query("DELETE FROM Tracktable WHERE TTindex = '".$ttid."'")) {
			$retval = true;
		}
	}

	return $retval;
}

//
// Database Global Stats and Version Control
//

function update_track_stats() {
	debuglog("Updating Track Stats","MYSQL",7);
	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumArtists FROM (SELECT DISTINCT AlbumArtistIndex FROM Albumtable
		INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL
		AND Hidden = 0 AND isSearchResult < 2) AS t")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumArtists;
		}
		update_stat('ArtistCount',$ac);
	}

	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumAlbums FROM (SELECT DISTINCT Albumindex FROM Albumtable
		INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL
		AND Hidden = 0 AND isSearchResult < 2) AS t")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumAlbums;
		}
		update_stat('AlbumCount',$ac);
	}

	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND
		isSearchResult < 2")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumTracks;
		}
		update_stat('TrackCount',$ac);
	}

	if ($result = generic_sql_query(
		"SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND
		isSearchResult < 2")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->TotalTime;
		}
		update_stat('TotalTime',$ac);
	}
	debuglog("Track Stats Updated","MYSQL",9);
}

function update_stat($item, $value) {
	generic_sql_query("UPDATE Statstable SET Value='".$value."' WHERE Item='".$item."'", false);
}

function get_stat($item) {
	$retval = 0;
	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = '".$item."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$retval = $obj->Value;
		}
	}
	return $retval;
}


function dumpAlbums($which) {

    global $divtype, $prefs;

    $a = preg_match('/(a|b)(.*?)(\d+|root)/', $which, $matches);
	if (!$a) {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
		debuglog('Artist dump failed - regexp failed to match '.$which,"DUMPALBUMS",3);
		return false;
	}
    $why = $matches[1];
    $what = $matches[2];
    $who = $matches[3];
    $count = null;

    switch ($who) {
    	case 'root':
	    	if ($why == 'a') {
	    		collectionStats();
	    	} else {
	    		searchStats();
	    	}
        	$divtype = "album1";
        	switch ($what) {
        		case 'artist':
        			$count = do_artists_from_database($why, $what, $who);
        			break;

        		case 'album':
        		case 'albumbyartist':
        			$count = do_albums_from_database($why, 'album', $who, false, false);
        			break;

        	}
	        if ($count == 0) {
	        	if ($why == 'a') {
	        		emptyCollectionDisplay();
	        	} else {
		        	emptySearchDisplay();
	        	}
	        }
	        break;

	    default:
	    	switch ($what) {
	    		case 'artist':
		    		do_albums_from_database($why, 'album', $who, false, false);
		    		break;
		    	case 'album':
		    		do_tracks_from_database($why, $what, $who, false);
		    		break;
	    	}
    }

}

function collectionStats() {
    print '<div id="fothergill">';
    print alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'),
    	get_stat('TrackCount'), format_time(get_stat('TotalTime')));
    print '</div>';
}

function searchStats() {
    $numartists = 0;
    $numalbums = 0;
    $numtracks = 0;
    $numtime = 0;
	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumArtists FROM (SELECT DISTINCT AlbumArtistIndex FROM Albumtable
		INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT
		NULL AND Hidden = 0 AND isSearchResult > 0) AS t")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$numartists = $obj->NumArtists;
		}
	}

	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumAlbums FROM (SELECT DISTINCT Albumindex FROM Albumtable
		INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT
		NULL AND Hidden = 0 AND isSearchResult > 0) AS t")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$numalbums = $obj->NumAlbums;
		}
	}

	if ($result = generic_sql_query(
		"SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL
		AND Hidden=0 AND isSearchResult > 0")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$numtracks = $obj->NumTracks;
		}
	}

	if ($result = generic_sql_query(
		"SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL AND
		Hidden=0 AND isSearchResult > 0")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$numtime = $obj->TotalTime;
		}
	}

    print alistheader($numartists, $numalbums, $numtracks, format_time($numtime));

}

function getItemsToAdd($which, $cmd = null) {
    $a = preg_match('/(a|b)(.*?)(\d+|root)/', $which, $matches);
    if (!$a) {
        debuglog('Regexp failed to match '.$which,"GETITEMSTOADD",3);
        return array();
    }
    $why = $matches[1];
    $what = $matches[2];
    $who = $matches[3];
    switch ($what) {
    	case "artist":
    		return get_artist_tracks_from_database($who, $cmd, $why);
    		break;

    	case "album":
    		return get_album_tracks_from_database($who, $cmd, $why);
    		break;

    	default:
	        debuglog('Unknown type '.$which,"GETITEMSTOADD",3);
	        return array();
	        break;
    }
}

function send_list_updates($artist_created, $album_created, $ttid, $send = true) {
	global $mysqlc, $returninfo, $prefs;
	if (!array_key_exists('inserts', $returninfo)) {
		$returninfo['inserts'] = array();
	}
	if ($artist_created !== false && $prefs['sortcollectionby'] == "artist") {
		debuglog("Artist ".$artist_created." was created","USER RATING",8);
		// We had to create a new albumartist, so we send back the artist HTML header
		// We need to know the artist details and where in the list it is supposed to go.
		array_push($returninfo['inserts'], do_artists_from_database('a', $prefs['sortcollectionby'], $artist_created));
	} else if ($album_created !== false) {
		debuglog("Album ".$album_created." was created","USER RATING",8);
		// Find the artist
		$artistid = find_artist_from_album($album_created);
		if ($artistid === null) {
			debuglog("ERROR - no artistID found!","USER RATING",1);
		} else {
			array_push($returninfo['inserts'],
				do_albums_from_database('a', 'album', $artistid, $album_created, false));
		}
	}  else if ($ttid !== null) {
		debuglog("Track ".$ttid." was modified","USER RATING",8);
		$albumid = find_album_from_track($ttid);
		if ($albumid === null) {
			debuglog("ERROR - no albumID found!","USER RATING",1);
		} else {
			array_push($returninfo['inserts'], array(
				'type' => 'insertInto',
				'where' => 'aalbum'.$albumid,
				'html' => do_tracks_from_database('a', 'album', $albumid, true)));
		}
	}
	if ($send) {
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'),
			get_stat('TrackCount'), format_time(get_stat('TotalTime')));
		if ($ttid) $returninfo['metadata'] = get_all_data($ttid);
		print json_encode($returninfo);
	}
}

function checkAlbumsAndArtists() {

	global $mysqlc;
	global $returninfo;
	// Now we need to find any albums or artists that need to be removed from the collection display
	// (because this is being done on-the-fly and not as part of a collection update).
	// This takes two SQL queries. We still use remove_cruft to actually remove them
	// because the two produce different results - this produces albums and albumartists with no
	// visible tracks, of which the cruft may only be a subset.

	// NOTE: this query does return albums for which we have only hidden tracks.
	// This is what we want, because one of those may still be displayed.
	// Any that aren't displayed don't matter because they can't be removed from the display anyway
	if ($result = generic_sql_query(
		"SELECT Albumindex FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM
			Tracktable WHERE Albumindex IS NOT NULL AND Hidden = 0 AND isSearchResult < 2)")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists('deletedalbums', $returninfo)) {
				$returninfo['deletedalbums'] = array();
			}
			array_push($returninfo['deletedalbums'], "aalbum".$obj->Albumindex);
		}
	}

	// Now find which artists have either no tracks or only hidden tracks
	if ($result = generic_sql_query(
		"SELECT hidden.AlbumArtistindex FROM ".
		"(SELECT COUNT(Tracktable.Albumindex) AS numtracks, AlbumArtistindex FROM Albumtable ".
			"LEFT JOIN Tracktable USING (Albumindex) ".
		"WHERE Hidden = 1 ".
		"OR isSearchResult > 1 ".
		"OR Tracktable.Albumindex IS NULL ".
		"GROUP BY AlbumArtistindex) AS hidden ".
		"LEFT OUTER JOIN ".
		"(SELECT COUNT(Tracktable.Albumindex) AS numtracks, AlbumArtistindex FROM Albumtable ".
			"LEFT JOIN Tracktable USING (Albumindex) ".
		"WHERE Hidden = 0 OR Hidden = 1 ".
		"OR Tracktable.Albumindex IS NULL ".
		"GROUP BY AlbumArtistindex) AS alltracks ".
		"ON hidden.numtracks = alltracks.numtracks AND ".
			"hidden.AlbumArtistindex = alltracks.AlbumArtistindex WHERE alltracks.numtracks IS NOT NULL")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists('deletedartists', $returninfo)) {
				$returninfo['deletedartists'] = array();
			}
			array_push($returninfo['deletedartists'], "aartist".$obj->AlbumArtistindex);
		}
	}
}

function check_url_against_database($url, $itags, $rating) {
	global $mysqlc;
	if ($mysqlc === null) {
		connect_to_database();
	}

	$qstring = "SELECT t.TTindex FROM Tracktable AS t ";
	$tags = array();
	if ($itags !== null) {
		$qstring .= "JOIN (SELECT DISTINCT TTindex FROM TagListtable JOIN Tagtable AS tag USING (Tagindex) WHERE";
		$tagterms = array();
		foreach ($itags as $tag) {
			$tags[] = trim($tag);
			array_push($tagterms, " tag.Name LIKE ?");
		}
		$qstring .= implode(" OR",$tagterms);
		$qstring .=") AS j ON j.TTindex = t.TTindex ";
	}
	if ($rating !== null) {
		$qstring .= "JOIN (SELECT * FROM Ratingtable WHERE Rating >= ".$rating.") AS rat ON rat.TTindex = t.TTindex ";
	}
	$tags[] = $url;
	$qstring .= "WHERE t.Uri = ?";
	if ($stmt = sql_prepare_query_later($qstring)) {
		if ($stmt->execute($tags)) {
			// rowCount() doesn't work for SELECT with SQLite
			while($obj = $stmt->fetch(PDO::FETCH_OBJ)) {
				return true;
			}
		} else {
			show_sql_error();
		}
	} else {
		show_sql_error();
	}
	return false;
}

function cleanSearchTables() {
	// Clean up the database tables before performing a new search or updating the collection

	debuglog("Cleaning Search Results","MYSQL",6);
	// Any track that was previously hidden needs to be re-hidden
	generic_sql_query("UPDATE Tracktable SET Hidden = 1, isSearchResult = 0 WHERE isSearchResult = 3");

	// Any track that was previously a '2' (added to database as search result) but now
	// has a playcount needs to become a zero and be hidden.
	hide_played_tracks();

	// remove any remaining '2's
	generic_sql_query("DELETE FROM Tracktable WHERE isSearchResult = 2");

	// Set '1's back to '0's
	generic_sql_query("UPDATE Tracktable SET isSearchResult = 0 WHERE isSearchResult = 1");

	// This may leave some orphaned albums and artists
	remove_cruft();

	//
	// remove_cruft creates some temporary tables and we need to remove them because
	// remove cruft will be called again later on if we're doing a collection update.
	// Sadly, DROP TABLE runs into locking problems, at least with SQLite, so instead
	// we close the DB connection and start again.
	// So this function must be called BEFORE prepareCollectionUpdate, as that creates
	// temporary tables of its own.
	//

	close_database();
	sleep(1);
	connect_to_database();

}

function emptyCollectionDisplay() {
	print '<div id="emptycollection" class="pref textcentre">
	<p>Your Music Collection Is Empty</p>
	<p>You can add files to it by tagging and rating them, or you can build a collection of all your music</p>
	</div>';
}

function emptySearchDisplay() {
	print '<div class="pref textcentre">
	<p>No Results</p>
	</div>';
}

//
// Stuff to do with creating the database from a music collection (collection.php)
//

function prepareCollectionUpdate() {
	create_foundtracks();
	prepare_findtracks();
	open_transaction();
}

function prepare_findtracks() {
	global $find_track, $update_track;
	if ($find_track = sql_prepare_query_later(
		"SELECT TTindex, Disc, LastModified, Hidden, isSearchResult FROM Tracktable WHERE Title=?
		AND ((Albumindex=? AND TrackNo=? AND Disc=?)".
	// ... then tracks that are in the wishlist. These will have TrackNo as NULL but Albumindex might not be.
		" OR (Artistindex=? AND TrackNo IS NULL AND Uri IS NULL))")) {
	} else {
		show_sql_error();
        exit(1);
	}

	if ($update_track = sql_prepare_query_later(
		"UPDATE Tracktable SET Trackno=?, Duration=?, Disc=?, LastModified=?, Uri=?, Albumindex=?,
		isSearchResult=?, Hidden=0 WHERE TTindex=?")) {
	} else {
		show_sql_error();
        exit(1);
	}
}

function createAlbumsList() {

    global $collection, $transaction_open, $numdone, $doing_search;

    debuglog("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS",4);
    debuglog("Starting Database Update From Collection","TIMINGS",4);
    $now = time();

    foreach(array_keys($collection->artists) as $artistkey) {
        do_artist_database_stuff($artistkey, false);
    }

	$dur = format_time(time() - $now);
	debuglog("Database Update From Collection Took ".$dur,"TIMINGS",4);
    debuglog("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS",4);
    // Find tracks that have been removed
    if (!$doing_search) {
	    debuglog("Starting Cruft Removal","TIMINGS",4);
	    $now = time();
	    debuglog("Finding tracks that have been deleted","MYSQL",7);
	    generic_sql_query(
	    	"DELETE FROM Tracktable WHERE LastModified IS NOT NULL AND TTindex NOT IN
	    	(SELECT TTindex FROM Foundtracks) AND Hidden = 0", true);
	    remove_cruft();
		update_stat('ListVersion',ROMPR_COLLECTION_VERSION);
		update_track_stats();
		$dur = format_time(time() - $now);
		debuglog("Cruft Removal Took ".$dur,"TIMINGS",4);
	    debuglog("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS",4);
	}
	close_transaction();
}

function remove_cruft() {
	global $prefs;
	// To try and keep the db size down, if a track has only been played once in the last 6 months
	// and it has no tags or ratings, remove it.
	// We don't need to check if it's in the Ratingtable or TagListtable because if Hidden == 1 it can't be.
	debuglog("Removing once-played tracks not played in 6 months","MYSQL",6);
	delete_oldtracks();

    debuglog("Removing orphaned albums","MYSQL",6);
    // NOTE - the Albumindex IS NOT NULL is essential - if any albumindex is NULL the entire () expression returns NULL
    generic_sql_query(
    	"DELETE FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM Tracktable
    	WHERE Albumindex IS NOT NULL)", true);

    debuglog("Removing orphaned artists","MYSQL",6);
    delete_orphaned_artists();

    debuglog("Tidying Metadata","MYSQL",6);
    generic_sql_query("DELETE FROM Ratingtable WHERE Rating = '0'", true);
	generic_sql_query(
		"DELETE FROM Ratingtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)", true);
	generic_sql_query(
		"DELETE FROM TagListtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)", true);
	generic_sql_query(
		"DELETE FROM Tagtable WHERE Tagindex NOT IN (SELECT Tagindex FROM TagListtable)", true);
	generic_sql_query(
		"DELETE FROM Playcounttable WHERE Playcount = '0'", true);
	generic_sql_query(
		"DELETE FROM Playcounttable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)", true);
	generic_sql_query(
		"DELETE FROM Trackimagetable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)", true);
}

function do_artist_database_stuff($artistkey) {

    global $collection, $find_track, $update_track, $prefs;

    $artistname = $collection->artistName($artistkey);

    // CHECK. This prevents us creating album artists when those artists have no albums with tracks.
    // These might be artists who appear on compilations, but check_and_update_track will
    // create the artist if it's needed as a track artist.
    // It speeds things up a bit and stops us unnecessarily creating artists when certain backends
    // return only albums.
    if ($collection->artistNumTracks($artistkey) == 0) {
    	debuglog("Artist ".$artistname." has no albums. Ignoring it","MYSQL",9);
    	return false;
    }

    $albumlist = array();
    if ($artistkey == "various artists") {
		$albumlist = $collection->getAlbumList($artistkey, false);
    } else {
	    $albumlist = $collection->getAlbumList($artistkey, true);
    }

	$artist_created = false;
    $artistindex = check_artist($artistname, false);
    if ($artistindex == null) {
    	debuglog("ERROR! Checked artist ".$artistname." and index is still null!","MYSQL",1);
        return false;
    }

    foreach($albumlist as $album) {

    	if ($album->trackCount() == 0) {
    		// This is another of those things that can happen with some mopidy backends
    		// that return search results as an album only. Internet Archive is one such
    		// and many radio backends are also the same. We don't want these in the database;
    		// they don't get added even without this check because there are no tracks BUT
    		// the album does get created and then remove_cruft has to delete it again).
    		debuglog("Album ".$album->name." has no tracks. Ignoring it","MYSQL",9);
    		continue;
    	}

		$album_created = false;
		// Although we don't need to sort the tracks, we do need to call sortTracks
		// because this sorts them by disc in the case where there are no disc numbers
        $album->sortTracks();
        $albumindex = check_album(
            $album->name,
            $artistindex,
            $album->uri,
            $album->getImage('small'),
            $album->getDate(),
            "0",
            $album->getKey(),
            $album->musicbrainz_albumid,
            $album->domain,
            false
        );

        if ($albumindex == null) {
        	debuglog("ERROR! Album index for ".$album->name." is still null!","MYSQL",1);
    		continue;
        }

        foreach($album->tracks as $trackobj) {
			check_and_update_track($trackobj, $albumindex, $artistindex, $artistname);
        }

    } /* End of Artist Album Loop */

}

function do_track_by_track($trackobject) {

	// The difference between this and the above function is that this one takes tracks as they come in direct
	// from the backend - without being collectionised. This is faster and uses less RAM but does rely on the tags
	// being correct - they're filtered before being sent here.
	// Tracks must have disc and albumartist tags to be handled by this method.
	// The collectionizer was designed to sort tracks without those tags so if those tags exist they don't need
	// to be collectionized.

	global $mysqlc, $find_track, $update_track, $prefs;

	static $current_albumartist = null;
	static $current_album = null;
	static $current_domain = null;
	static $current_albumlink= null;
	static $albumobj = null;

	static $albumindex = null;
	static $albumartistindex = null;

	$artistname = $trackobject->get_sort_artist();

	if ($current_albumartist != $artistname) {
		$albumartistindex = check_artist($artistname, false);
	}
    if ($albumartistindex == null) {
    	debuglog("ERROR! Checked artist ".$artistname." and index is still null!","MYSQL_TBT",1);
        return false;
    }

    if ($current_albumartist != $artistname || $current_album != $trackobject->tags['Album'] ||
    		$current_domain != $trackobject->tags['domain'] ||
    		($trackobject->tags['X-AlbumUri'] != null &&
    			$trackobject->tags['X-AlbumUri'] != $current_albumlink)) {

    	$albumobj = new album($trackobject->tags['Album'], $artistname, $trackobject->tags['domain']);
    	$albumobj->newTrack($trackobject);

        $albumindex = check_album(
            $albumobj->name,
            $albumartistindex,
            $albumobj->uri,
            $albumobj->getImage('small'),
            $albumobj->getDate(),
            "0",
            $albumobj->getKey(),
            $albumobj->musicbrainz_albumid,
            $albumobj->domain,
            false
        );

        if ($albumindex == null) {
        	debuglog("ERROR! Album index for ".$albumobj->name." is still null!","MYSQL_TBT",1);
    		return false;
        }
    } else {
    	$albumobj->newTrack($trackobject, true);
    }

    $current_albumartist = $artistname;
    $current_album = $albumobj->name;
    $current_domain = $albumobj->domain;
    $current_albumlink = $albumobj->uri;

	foreach ($albumobj->tracks as $trackobj) {
		// The album we've just created must only have one track, but this makes sure we use the track object
		// that is part of the album. This MAY be important due to various assumptions and the fact that PHP
		// insists on copying variables rather than passing by reference.
		check_and_update_track($trackobj, $albumindex, $albumartistindex, $artistname);
	}

}

function check_and_update_track($trackobj, $albumindex, $artistindex, $artistname) {
	global $find_track, $update_track, $numdone, $prefs, $doing_search;
	static $current_trackartist = null;
	static $trackartistindex = null;
    $ttid = null;
    $lastmodified = null;
    $hidden = 0;
    $disc = 0;
    $uri = null;
    $issearchresult = 0;

    // Why are we not checking by URI? That should be unique, right?
    // Well, er. no. They're not.
    // Especially Spotify returns the same URI multiple times if it's in mutliple playlists
    // We CANNOT HANDLE that. Nor do we want to.

    // The other advantage of this is that we can put an INDEX on Albumindex, TrackNo, and Title,
    // which we can't do with Uri cos it's too long - this speeds the whole process up by a factor
    // of about 32 (9 minutes when checking by URI vs 15 seconds this way, on my collection)
    // Also, URIs might change if the user moves his music collection.

	if ($prefs['collection_type'] == "sqlite") {
		// Lord knows why, but we have to re-prepare these every single bloody time!
		prepare_findtracks();
	}

    if ($find_track->execute(array($trackobj->tags['Title'], $albumindex, $trackobj->tags['Track'],
    	$trackobj->tags['Disc'], $artistindex))) {
    	$obj = $find_track->fetch(PDO::FETCH_OBJ);
    	if ($obj) {
    		$ttid = $obj->TTindex;
    		$lastmodified = $obj->LastModified;
    		$hidden = $obj->Hidden;
    		$disc = $obj->Disc;
    		$issearchresult = $obj->isSearchResult;
    	}
    } else {
    	show_sql_error();
    	return false;
    }

    // NOTE: It is imperative that the search results have been tidied up -
    // i.e. there are no 1s or 2s in the database before we do a collection update

    // When doing a search, we MUST NOT change lastmodified of any track, because this will cause
    // user-added tracks to get a lastmodified date, and lastmodified == NULL
    // is how we detect user-added tracks and prevent them being deleted on collection updates

    if ($ttid) {
    	if ((!$doing_search && $trackobj->tags['Last-Modified'] != $lastmodified) ||
    		($doing_search && $issearchresult == 0) ||
    		($trackobj->tags['Disc'] != $disc && $trackobj->tags['Disc'] !== '') ||
    		$hidden != 0) {
    		if ($prefs['debug_enabled'] > 6) {
    			# Don't bother doing all these string comparisons if debugging is disabled. It's slow.
		    	debuglog("  Updating track with ttid $ttid because :","MYSQL",7);
		    	if (!$doing_search && $lastmodified === null) debuglog(
		    		"    LastModified is not set in the database","MYSQL",7);
		    	if (!$doing_search && $trackobj->tags['Last-Modified'] === null) debuglog(
		    		"    TrackObj LastModified is NULL too!","MYSQL",7);
		    	if (!$doing_search && $lastmodified != $trackobj->tags['Last-Modified']) debuglog(
		    		"    LastModified has changed: We have ".$lastmodified." but track has ".
		    		$trackobj->tags['Last-Modified'],"MYSQL",7);
		    	if ($disc != $trackobj->tags['Disc']) debuglog(
		    		"    Disc Number has changed: We have ".$disc." but track has ".
		    		$trackobj->tags['Disc'],"MYSQL",7);
		    	if ($hidden != 0) debuglog("    It is hidden","MYSQL",7);
		    }
	    	$newsearchresult = 0;
	    	$newlastmodified = $trackobj->tags['Last-Modified'];
	    	if ($issearchresult == 0 && $doing_search) {
	    		$newsearchresult = ($hidden != 0) ? 3 : 1;
	    		debuglog(
	    			"    It needs to be marked as a search result : Value ".$newsearchresult,"MYSQL",7);
	    		$newlastmodified = $lastmodified;
	    	}

			if ($update_track->execute(array($trackobj->tags['Track'], $trackobj->tags['Time'],
				$trackobj->tags['Disc'], $newlastmodified, $trackobj->tags['file'], $albumindex,
				$newsearchresult, $ttid))) {
				$numdone++;
				check_transaction();
			} else {
				show_sql_error();
			}
		}
    } else {
    	$a = $trackobj->get_artist_string();
    	if ($a != $current_trackartist || $trackartistindex == null) {
	        if ($artistname != $a && $a != null) {
	            $trackartistindex = check_artist($a, false);
	        } else {
	            $trackartistindex = $artistindex;
	        }
	    }
        if ($trackartistindex == null) {
        	debuglog("ERROR! Trackartistindex is still null!","MYSQL_TBT",1);
            return false;
        }
        $current_trackartist = $a;
        $sflag = ($doing_search) ? 2 : 0;
        $ttid = create_new_track(
            $trackobj->tags['Title'],
            null,
            $trackobj->tags['Track'],
            $trackobj->tags['Time'],
            null,
            null,
            null,
            null,
            null,
            $trackobj->tags['file'],
            $trackartistindex,
            $artistindex,
            $albumindex,
            null,
            null,
            $trackobj->tags['Last-Modified'],
            $trackobj->tags['Disc'],
            null,
            null,
            0,
            $trackobj->getImage(),
            $sflag
        );
        $numdone++;
		check_transaction();
	}
    if ($ttid == null) {
    	debuglog("ERROR! No ttid for track ".$trackobj->tags['file'],"MYSQL",1);
    } else {
    	if (!$doing_search) {
    		generic_sql_query("INSERT INTO Foundtracks (TTindex) VALUES (".$ttid.")", false, false);
    	}
    }
}

?>