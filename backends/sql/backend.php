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
$dont_change_search_status = false;

// In the following, we're using a mixture of prepared statements and raw queries.
// Raw queries are easier to handle in many cases, but prepared statements take a lot of fuss away
// when dealing with strings, as it automatically escapes everything.

// So what are Hidden tracks?
// These are used to count plays from online sources when those tracks are not in the collection.
// Doing this does increase the size of the database. Quite a lot. But without it the stats for charts
// and fave artists etc don't make a lot of sense in a world where a proportion of your listening
// is in response to searches of Spotify or youtube etc.

// Wishlist items have Uri as NULL and Album might also be NULL

// Assumptions are made in the code that Wishlist items will not be hidden tracks and that hidden tracks have no metadata
// apart from a Playcount. Always be aware of this.

// For tracks, LastModified controls whether a collection update will update any of its data.
// Tracks added by hand (by tagging or rating, via userRatings.php) must have LastModified as NULL
// - this is how we prevent the collection update from removing them.

// TODO. If we find a wishlist item and we're doing a SET, or ADD, or INC we really ought to update the album and URI details if we can.
// Doing a collection update will do this but adding things by rating or tagging ar adding a spotify album don't.

// Search:
// The database is now used to handle the search results as well.
// Tracktable.isSearchResult is set to 1 on any existing track that comes up in the search
//		and is set to 2 for any track that comes up the search and has to be added - i.e it's not part of
//		the main collection. The reason for doing search through the database like this is that
//		a) It means we can dump the old xml backend
//		b) The search results will obey the same sort options as the collection
//		c) We can include rating info in the search results just like in the collection.

function find_item($uri,$title,$artist,$album,$albumartist,$urionly) {

	// find_item is used by userRatings to find tracks on which to update or display metadata.
	// It is NOT used when the collection is created

	// When Setting Metadata we do not use a URI because we might have mutliple versions of the track in the database
	// or someone might be rating a track from Spotify that they already have in Local. So in this case we check
	// using an increasingly wider check to find the track, returning as soon as one of these produces matches.
	// 		First by Track, Track Artist, and Album
	//		Then by Track, Album Artist, and Album
	//		Then by Track, Artist, and Album NULL (meaning wishlist)
	// We return ALL tracks found, because you might have the same track on multiple backends, and set metadata on them all.
	// This means that when getting metadata it doesn't matter which one we match on.
	// When we Get Metadata we do supply a URI if we have one, just because.

	// If we don't supply an album to this function that's because we're listening to the radio.
	// In that case we look for a match where there is something in the album field and then for where album is NULL

	// $urionly can be set to force looking up only by URI. This is used by when we need to import a specific version of
	// the track  - currently from either the Last.FM importer or when we add a spotify album to the collection

	debug_print("Looking for item ".$title,"MYSQL");
	$ttids = array();

	if ($uri) {
		debug_print("  Trying by URI ".$uri,"MYSQL");
		if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable WHERE Uri = ?", $uri)) {
			while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
				debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
				$ttids[] = $ttidobj->TTindex;
			}
		}
	}

	if ($artist == null || $title == null || ($urionly && $uri)) {
		return $ttids;
	}

	if (count($ttids) == 0) {
		if ($album) {
			// Note. We regard the same track on a different album as a different version. So, first try looking up by title, track artist, and album
			debug_print("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
			if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable USING (Albumindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND LOWER(Albumname) = LOWER(?)", $title, $artist, $album)) {
				while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
					debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
					$ttids[] = $ttidobj->TTindex;
				}
			}

			// Track artists can vary by backend, and can come back in a different order sometimes so we could have $artist = "A & B" but it's in the database as "B & A".
			if (count($ttids) == 0 && $albumartist !== null) {
				debug_print("  Trying by albumartist ".$albumartist." album ".$album." and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Albumtable USING (Albumindex) JOIN Artisttable ON Albumtable.AlbumArtistindex = Artisttable.Artistindex WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND LOWER(Albumname) = LOWER(?)", $title, $albumartist, $album)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}

			// Finally look for album NULL which will be a wishlist item added via a radio station
			if (count($ttids) == 0) {
				debug_print("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NULL", $title, $artist)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}
		} else {
			// No album supplied - ie this is from a radio stream. First look for a match where there is something in the album field
			debug_print("  Trying by artist ".$artist." album NOT NULL and track ".$title,"MYSQL");
			if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NOT NULL", $title, $artist)) {
				while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
					debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
					$ttids[] = $ttidobj->TTindex;
				}
			}

			if (count($ttids) == 0) {
				debug_print("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NULL", $title, $artist)) {
					while ($ttidobj = $stmt->fetch(PDO::FETCH_OBJ)) {
						debug_print("    Found TTindex ".$ttidobj->TTindex,"MYSQL");
						$ttids[] = $ttidobj->TTindex;
					}
				}
			}
		}
	}

	return $ttids;
}

function find_wishlist_item($artist, $album, $title) {
	debug_print("Looking for wishlist item","MYSQL");
	$ttid = null;
	if ($album) {
		debug_print("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
		if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable USING (Albumindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND LOWER(Albumname) = LOWER(?) AND Tracktable.Uri IS NULL", $title, $artist, $album)) {
			$ttidobj = $stmt->fetch(PDO::FETCH_OBJ);
			$ttid = $ttidobj ? $ttidobj->TTindex : null;
			if ($ttid) {
				debug_print("    Found TTindex ".$ttid,"MYSQL");
			}
		}
	} else {
		debug_print("  Trying by artist ".$artist." and track ".$title,"MYSQL");
		if ($stmt = sql_prepare_query("SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE LOWER(Title) = LOWER(?) AND LOWER(Artistname) = LOWER(?) AND Albumindex IS NULL AND Tracktable.Uri IS NULL", $title, $artist)) {
			$ttidobj = $stmt->fetch(PDO::FETCH_OBJ);
			$ttid = $ttidobj ? $ttidobj->TTindex : null;
			if ($ttid) {
				debug_print("    Found TTindex ".$ttid,"MYSQL");
			}
		}
	}
	return $ttid;
}

function create_new_track($title, $artist, $trackno, $duration, $albumartist, $spotilink, $image, $album, $date, $uri,
						  $trackai, $albumai, $albumi, $searched, $imagekey, $lastmodified, $disc, $ambid,
						  $domain, $hidden, $trackimage, $searchflag) {
	global $mysqlc;
	global $artist_created;
	global $album_created;

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
			$albumi = check_album($album, $albumai, $spotilink, $image, $date, $searched, $imagekey, $ambid, $domain, true);
			if ($albumi == null) {
				return null;
			}
		}
	}

	$retval = null;
	if ($stmt = sql_prepare_query("INSERT INTO Tracktable (Title, Albumindex, Trackno, Duration, Artistindex, Disc, Uri, LastModified, Hidden, isSearchResult) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		$title, $albumi, $trackno, $duration, $trackai, $disc, $uri, $lastmodified, $hidden, $searchflag))
	{
		$retval = $mysqlc->lastInsertId();
		// debug_print("Created track ".$title." with TTindex ".$retval,"MYSQL");
	}

	if ($retval && $trackimage) {
		// What are trackimages?
		// Certain backends (youtube and soundcloud) return an image but using it as an album image doesn't make
		// a lot of sense visually. So for these tracks we use it as a track image which will be displayed
		// alongside the track in the collection and the playlist. The album images for these sites
		// will always be the site logo, as set when the collection is created
		if ($stmt = sql_prepare_query("INSERT INTO Trackimagetable (TTindex, Image) VALUES (?, ?)", $retval, $trackimage)) {
			debug_print("Added Image for track","MYSQL");
		}
	}

	return $retval;
}

function check_artist($artist, $upflag = false) {
	global $artist_created;
	$index = null;
	if ($stmt = sql_prepare_query("SELECT Artistindex FROM Artisttable WHERE LOWER(Artistname) = LOWER(?)", $artist)) {
		$obj = $stmt->fetch(PDO::FETCH_OBJ);
		$index = $obj ? $obj->Artistindex : null;
	    if ($index) {
	    	if ($upflag) {
				// For when we add new album artists...
				// Need to check whether the artist we now have has any VISIBLE albums - we need to know if we've added a
				// new albumartist so we can return the correct html fragment to the javascript
				if ($result = generic_sql_query("SELECT COUNT(Albumindex) AS num FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) WHERE AlbumArtistindex = ".$index." AND Hidden = 0 AND isSearchResult < 2 AND Uri IS NOT NULL")) {
					$obj = $result->fetch(PDO::FETCH_OBJ);
					if ($obj->num == 0) {
						debug_print("Revealing artist ".$index,"MYSQL");
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
	global $artist_created;
	$retval = null;
	if ($stmt = sql_prepare_query("INSERT INTO Artisttable (Artistname) VALUES (?)", $artist)) {
		$retval = $mysqlc->lastInsertId();
		debug_print("Created artist ".$artist." with Artistindex ".$retval,"MYSQL");
		if ($upflag) {
			$artist_created = $retval;
			debug_print("  Adding artist to display ".$retval,"MYSQL");
		}
	}
	return $retval;
}

function check_album($album, $albumai, $spotilink, $image, $date, $searched, $imagekey, $mbid, $domain, $upflag) {
	global $album_created;
	$index = null;
	$year = null;
	$img = null;
	if ($stmt = sql_prepare_query("SELECT Albumindex, Year, Image, Spotilink FROM Albumtable WHERE LOWER(Albumname) = LOWER(?) AND AlbumArtistindex = ? AND Domain = ?", $album, $albumai, $domain)) {
		$obj = $stmt->fetch(PDO::FETCH_OBJ);
		$index = $obj ? $obj->Albumindex : 0;
		if ($index) {
			$year = $obj->Year;
			$img = $obj->Image;
			$sl = $obj->Spotilink;
			if (($year == null && $date != null) ||
				(($img == null || $img = "") && ($image != "" && $image != null)) ||
				($sl == null && $spotilink != null)) {
				debug_print("Updating Details For Album ".$album ,"MYSQL");
				if ($up = sql_prepare_query("UPDATE Albumtable SET Year=?, Image=?, Spotilink=? WHERE Albumindex=?",$date,$image,$spotilink,$index)) {
					debug_print("   ...Success","MYSQL");
				} else {
					debug_print("   ...Failed","MYSQL");
					return false;
				}
			}
			if ($upflag) {
				if ($result = generic_sql_query("SELECT COUNT(TTindex) AS num FROM Tracktable WHERE Albumindex = ".$index." AND Hidden = 0 AND isSearchResult < 2 AND Uri IS NOT NULL")) {
					$obj = $result->fetch(PDO::FETCH_OBJ);
					if ($obj->num == 0) {
						$album_created = $index;
						debug_print("We're using album ".$album." that was previously invisible","MYSQL");
					}
				}
			}
		} else {
			$index = create_new_album($album, $albumai, $spotilink, $image, $date, $searched, $imagekey, $mbid, $domain);
		}
	}
	return $index;
}

function create_new_album($album, $albumai, $spotilink, $image, $date, $searched, $imagekey, $mbid, $domain) {

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
	if ($stmt = sql_prepare_query("INSERT INTO Albumtable (Albumname, AlbumArtistindex, Spotilink, Year, Searched, ImgKey, mbid, Domain, Image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		$album, $albumai, $spotilink, $date, $i, $imagekey, $mbid, $domain, $image)) {
		$retval = $mysqlc->lastInsertId();
			debug_print("Created Album ".$album." with Albumindex ".$retval,"MYSQL");
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

	debug_print("(Increment) Setting ".$attribute." to ".$value." for TTID ".$ttid, "MYSQL");
	if ($stmt = sql_prepare_query("UPDATE ".$attribute."table SET ".$attribute."=? WHERE TTindex=?", $value, $ttid)) {
		if ($stmt->rowCount() == 0) {
			debug_print("  Update affected 0 rows, creating new value","MYSQL");
			if ($stmt = sql_prepare_query("INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)", $ttid, $value)) {
				debug_print("    New Value Created", "MYSQL");
			} else {
				debug_print("    Failed to create new value", "MYSQL");
				return false;
			}
		}
	} else {
		debug_print("    Failed to increment value", "MYSQL");
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

	global $album_created;
	global $artist_created;

	// We're setting an attribute.
	// If we're setting it on a hidden track we have to:
	// 1. Work out if this will cause a new artist and/or album to appear in the collection
	// 2. Unhide the track
	if (track_is_hidden($ttid)) {
		debug_print("Setting attribute on a hidden track","MYSQL");
		if ($artist_created == false) {
			// See if this means we're revealing a new artist
			if ($result = generic_sql_query("SELECT COUNT(AlbumArtistindex) AS num FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) WHERE AlbumArtistindex IN 
				(SELECT AlbumArtistindex FROM Albumtable JOIN Tracktable USING (Albumindex) WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query("SELECT AlbumArtistindex FROM Tracktable LEFT JOIN Albumtable USING (Albumindex) WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$artist_created = $obj->AlbumArtistindex;
							debug_print("Revealing Artist Index ".$artist_created,"MYSQL");
						}
					}
				}
			}
		}
		if ($artist_created == false && $album_created == false) {
			// See if this means we're revealing a new album
			if ($result = generic_sql_query("SELECT COUNT(TTindex) AS num FROM Tracktable WHERE Albumindex = (SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query("SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$album_created = $obj->Albumindex;
							debug_print("Revealing Album Index ".$album_created,"MYSQL");
						}
					}
				}
			}
		}
		generic_sql_query("UPDATE Tracktable SET Hidden=0 WHERE TTindex=".$ttid);
	}

	// Similarly, if it's a search result of type 2, it needs to become a type 1
	if (track_is_searchresult($ttid)) {
		debug_print("Setting attribute on a search result track","MYSQL");
		if ($artist_created == false && $album_created == false) {
			// See if this means we're revealing a new artist
			if ($result = generic_sql_query("SELECT COUNT(AlbumArtistindex) AS num FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) WHERE AlbumArtistindex IN 
				(SELECT AlbumArtistindex FROM Albumtable JOIN Tracktable USING (Albumindex) WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL AND isSearchResult < 2")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query("SELECT AlbumArtistindex FROM Tracktable LEFT JOIN Albumtable USING (Albumindex) WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$artist_created = $obj->AlbumArtistindex;
							debug_print("Revealing Artist Index ".$artist_created,"MYSQL");
						}
					}
				}
			}
		}
		if ($artist_created == false && $album_created == false) {
			// See if this means we're revealing a new album
			if ($result = generic_sql_query("SELECT COUNT(TTindex) AS num FROM Tracktable WHERE Albumindex = (SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid.") AND Hidden = 0 AND Uri IS NOT NULL AND isSearchResult < 2")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					if ($result = generic_sql_query("SELECT Albumindex FROM Tracktable WHERE TTindex = ".$ttid)) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$album_created = $obj->Albumindex;
							debug_print("Revealing Album Index ".$album_created,"MYSQL");
						}
					}
				}
			}
		}
		// NOTE we must set LastModified to NULL if it's a search result, otherwise we don't get the cross next to it
		// and a collection update will remove it.
		generic_sql_query("UPDATE Tracktable SET isSearchResult = 1, LastModified = NULL WHERE TTindex=".$ttid);
	}
	

	if ($attribute == 'Tags') {
		return addTags($ttid, $value);
	} else {
		debug_print("Setting ".$attribute." to ".$value." on ".$ttid,"MYSQL");
		if ($stmt = sql_prepare_query("UPDATE ".$attribute."table SET ".$attribute."=? WHERE TTindex=?", $value, $ttid)) {
			if ($stmt->rowCount() == 0 && $value !== 0) {
				debug_print("  Update affected 0 rows, creating new value","MYSQL");
				if ($stmt = sql_prepare_query("INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)", $ttid, $value)) {
					debug_print("    New Value Created", "MYSQL");
				} else {
					// NOTE - we could get here if the attribute we are setting already exists
					// (eg setting Rating to 5 on a track that already has rating set to 5).
					// We don't check that because the database is set up such that this
					// can't happen twice - because the rating table uses TWO indices to keep things unique.
					// Hence an error here is probably not a problem, so we ignore them.
					// debug_print("  Error Executing mySql", "MYSQL");
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
		debug_print("Adding Tag ".$t." to ".$ttid,"MYSQL");
		$tagindex = null;
		if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name=?", $t)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$tagindex = $obj->Tagindex;
			}
			if ($tagindex == null) {
				$tagindex = create_new_tag($t);
			}
			if ($tagindex == null) {
				debug_print("    Could not create tag","MYSQL");
				return false;
			}
			if ($result = generic_sql_query("SELECT COUNT(*) AS num FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
				$obj = $result->fetch(PDO::FETCH_OBJ);
				if ($obj->num == 0) {
					debug_print("Adding new tag relation","MYSQL");
					if ($result = generic_sql_query("INSERT INTO TagListtable (TTindex, Tagindex) VALUES ('".$ttid."', '".$tagindex."')")) {
						debug_print("Success","MYSQL");
					} else {
						return false;
					}
				} else {
					debug_print("Tag relation already exists","MYSQL");
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
	debug_print("Creating new tag ".$tag,"MYSQL");
	$tagindex = null;
	if ($result = sql_prepare_query("INSERT INTO Tagtable (Name) VALUES (?)", $tag)) {
		$tagindex = $mysqlc->lastInsertId();
	}
	return $tagindex;
}

function remove_tag($ttid, $tag) {
	debug_print("Removing Tag ".$tag." from ".$ttid,"MYSQL");
	$tagindex = null;
	if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name = ?", $tag)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$tagindex = $obj->Tagindex;
		}
		if ($tagindex == null) {
			debug_print("  ..  Could not find tag!","MYSQL");
			return false;
		}
		if ($result = generic_sql_query("DELETE FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
			debug_print(" .. Success","MYSQL");
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
	if ($result = generic_sql_query("SELECT t.Name, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname, al.Image, al.AlbumArtistindex, tr.Uri FROM Tagtable AS t JOIN TagListtable AS tl USING (Tagindex) JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) ORDER BY t.Name, a.Artistname, al.Albumname, tr.TrackNo")) {
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
			if ($result = generic_sql_query("SELECT Artistname FROM Artisttable WHERE Artistindex = ".$tags[$r][$s]['AAIndex'])) {
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
	if ($result = generic_sql_query("SELECT r.Rating, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname, al.Image, al.AlbumArtistindex, tr.Uri FROM Ratingtable AS r JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) WHERE r.Rating > 0 ORDER BY r.Rating, a.Artistname, al.Albumname, tr.TrackNo")) {
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
			if ($result = generic_sql_query("SELECT Artistname FROM Artisttable WHERE Artistindex = ".$ratings[$r][$s]['AAIndex'])) {
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
	if ($result = generic_sql_query("SELECT pl.Playcount, a.Artistname, tr.Title, tr.TrackNo, tr.Duration, tr.Disc, al.Albumname, al.Image, al.AlbumArtistindex, tr.Uri FROM Playcounttable AS pl JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) WHERE pl.Playcount > 0")) {
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
		if ($result = generic_sql_query("SELECT Artistname FROM Artisttable WHERE Artistindex = ".$playcounts[$r]['AAIndex'])) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$playcounts[$r]['Albumartist'] = $obj->Artistname;
			}
		}
	}
	return $playcounts;
}

function remove_tag_from_db($tag) {
	$r = true;
	debug_print("Removing Tag ".$tag." from database","MYSQL");
	if ($result = sql_prepare_query("SELECT Tagindex FROM Tagtable WHERE Name=?", $tag)) {
		$obj = $result->fetch(PDO::FETCH_OBJ);
		$tagindex = $obj ? $obj->Tagindex : null;
		if ($tagindex !== null) {
			$r = generic_sql_query("DELETE FROM TagListtable WHERE Tagindex = ".$tagindex);
			if ($r) {
				$r = generic_sql_query("DELETE FROM Tagtable WHERE Tagindex = ".$tagindex);
			}
		} else {
			debug_print(" .. Could not find tag!","MYSQL");
			$r = false;
		}
	} else {
		$r = false;
	}
	return $r;
}

function get_all_data($ttid) {

	// Misleadingly named function which should be used to get ratings and tags (and whatever else we might add) based on a TTindex

	global $nodata;
	$data = $nodata;
	if ($result = generic_sql_query("SELECT Rating FROM Ratingtable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$data['Rating'] = $obj ? $obj->Rating : 0;
			debug_print("Rating is ".$data['Rating'],"MYSQL");
		}
	}
	if ($result = generic_sql_query("SELECT Name FROM Tagtable JOIN TagListtable USING(Tagindex) WHERE TagListtable.TTindex = '".$ttid."' ORDER BY Name")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($data['Tags'], $obj->Name);
			debug_print("Got Tag ".$obj->Name,"MYSQL");
		}
	}
	if ($result = generic_sql_query("SELECT Playcount FROM Playcounttable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$data['Playcount'] = $obj ? $obj->Playcount : 0;
			debug_print("Playcount is ".$data['Playcount'],"MYSQL");
		}
	}

	return $data;
}

function get_imagesearch_info($key) {

	// Used by getalbumcover.php to get album and artist names etc based on an Image Key
	$retval = array(false, null, null, null, null, null, false);
	if ($result = generic_sql_query("SELECT Artistname, Albumname, mbid, Albumindex, Spotilink FROM Albumtable JOIN Artisttable ON AlbumArtistindex = Artistindex WHERE ImgKey = '".$key."'")) {
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
				$retval[4] = get_album_directory($obj->Albumindex, $obj->Spotilink);
			}
			if ($retval[5] == null || $retval[5] == "") {
				$retval[5] = $obj->Spotilink;
			}
			$retval[0] = true;
			$retval[6] = true;
			debug_print("Found album ".$key." in database","GETALBUMCOVER");
		}
	}
	return $retval;
}

function get_albumlink($which) {
	$matches = array();
	$link = "";
	if (preg_match('/(\d+)/', $which, $matches)) {
		$albumindex = $matches[1];
		if ($result = generic_sql_query("SELECT Spotilink FROM Albumtable WHERE Albumindex = '".$albumindex."'")) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$link = $obj ? $obj->Spotilink : "";
			}
		}
	}
	return $link;
}

function get_album_directory($albumindex, $uri) {
	global $prefs;
	$retval = null;
	// Get album directory by using the Uri of one of its tracks, making sure we choose only local tracks
	if (!preg_match('/\w+?:album/', $uri)) {
		if ($result2 = generic_sql_query("SELECT Uri FROM Tracktable WHERE Albumindex = ".$albumindex." LIMIT 1")) {
			while ($obj2 = $result2->fetch(PDO::FETCH_OBJ)) {
				$retval = dirname($obj2->Uri);
				$retval = preg_replace('#^local:track:#', '', $retval);
				$retval = preg_replace('#^file://#', '', $retval);
				$retval = preg_replace('#^beetslocal:\d+:'.$prefs['music_directory_albumart'].'/#', '', $retval);
				debug_print("Got album directory using track Uri - ".$retval,"SQL");
			}
		}
	}
	return $retval;
}

function update_image_db($key, $notfound, $imagefile) {
	$val = ($notfound == 0) ? $imagefile : "";
	if ($stmt = sql_prepare_query("UPDATE Albumtable SET Image=?, Searched = 1 WHERE ImgKey=?", $val, $key)) {
		debug_print("    Database Image URL Updated","MYSQL");
	} else {
		debug_print("    Failed To Update Database Image URL","MYSQL");
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
	if ($result = generic_sql_query("SELECT isSearchResult FROM Tracktable WHERE TTindex=".$ttid)) {
		$h = 0;
		while ($obj =$result->fetch(PDO::FETCH_OBJ)) {
			$h = $obj->isSearchResult;
		}
		if ($h == 2) {
			return true;
		}
	}
	return false;
}

function albumartist_sort_query($flag) {
	global $prefs;
	// This query gives us album artists only. It also makes sure we only get artists for whom we have actual tracks
	// (no album artists who appear only on the wishlist or who have only hidden tracks)
	$sflag = ($flag == 'b') ? "AND t.isSearchResult > 0" : "AND t.isSearchResult < 2";
	$qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex WHERE t.Uri IS NOT NULL AND t.Hidden = 0 ".$sflag." GROUP BY a.Artistindex ORDER BY ";
	foreach ($prefs['artistsatstart'] as $a) {
		$qstring .= "CASE WHEN LOWER(Artistname) = LOWER('".$a."') THEN 1 ELSE 2 END, ";
	}
	if (count($prefs['nosortprefixes']) > 0) {
		$qstring .= "(CASE ";
		foreach($prefs['nosortprefixes'] AS $p) {
			$phpisshitsometimes = strlen($p)+2;
			$qstring .= "WHEN LOWER(Artistname) LIKE '".strtolower($p)." %' THEN LOWER(SUBSTR(Artistname,".$phpisshitsometimes.")) ";
		}
		$qstring .= "ELSE LOWER(Artistname) END)";
	} else {
		$qstring .= "LOWER(Artistname)";
	}
	return $qstring;
}

function is_various_artists($index) {
	$qstring = "SELECT Artistname FROM Artisttable WHERE Artistindex = '".$index."'";
	$va = false;
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if ($obj->Artistname == "Various Artists") {
				$va = true;
			}
		}
	}
	return $va;
}

function do_artists_from_database($which) {
	global $divtype;
	$singleheader = array();
	debug_print("Generating ".$which." from database","DUMPALBUMS");
	$singleheader['type'] = 'insertAfter';
	$singleheader['where'] = 'fothergill';

	if ($result = generic_sql_query(albumartist_sort_query(substr($which,0,1)))) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if ($which == "aalbumroot") {
				artistHeader('aartist'.$obj->Artistindex, null, $obj->Artistname);
			} else if ($which == "balbumroot") {
				artistHeader('bartist'.$obj->Artistindex, null, $obj->Artistname);
			} else {
				if ($obj->Artistindex != $which) {
					$singleheader['where'] = "aartist".$obj->Artistindex;
					$singleheader['type'] = 'insertAfter';
				} else {
					ob_start();
					artistHeader('aartist'.$obj->Artistindex, null, $obj->Artistname);
					$singleheader['html'] = ob_get_contents();
					ob_end_clean();
					return $singleheader;
				}
			}
			$divtype = ($divtype == "album1") ? "album2" : "album1";
		}
	} else {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
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

function do_albums_from_database($which, $fragment = false, $use_artistindex = false) {
	global $prefs;
	$singleheader = array();
	if ($prefs['sortcollectionby'] == "artist") {
		$singleheader['type'] = 'insertAtStart';
		$singleheader['where'] = $which;
	} else {
		$singleheader['type'] = 'insertAfter';
		$singleheader['where'] = 'fothergill';
	}
	debug_print("Generating ".$which." from database","DUMPALBUMS");
	$a = preg_match("/artist(\d+|root)/", $which, $matches);
	if (!$a) {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
		return false;
	}
	debug_print("Looking for artistID ".$matches[1],"DUMPALBUMS");
	$t = substr($which,0,1);
	$sflag = ($t == "b") ? "AND Tracktable.isSearchResult > 0" : "AND Tracktable.isSearchResult < 2";

	$qstring = "SELECT";
	if ($use_artistindex) {
		$qstring .= "* FROM Albumtable ";
	} else {
		$qstring .= " Albumtable.*, Artisttable.Artistname FROM Albumtable JOIN Artisttable ON (Albumtable.AlbumArtistindex = Artisttable.Artistindex) ";
	}
	$qstring .= "WHERE ";

	if (!$use_artistindex && $matches[1] != "root" && !($fragment !== false && $prefs['sortcollectionby'] == "album")) {
		$qstring .= "AlbumArtistindex = '".$matches[1]."' AND ";
	}
	if ($use_artistindex) {
		$qstring .= "Albumindex IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE Tracktable.Artistindex = ".$matches[1]." AND ";
	} else {
		$qstring .= "Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex = Albumtable.Albumindex AND ";
	}

	$qstring .= "Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0 ".$sflag.")";
	$qstring .= " ORDER BY CASE WHEN Albumname LIKE '".get_int_text('label_allartist')."%' THEN 1 ELSE 2 END,";
	if (!$prefs['sortbydate'] ||
		(is_various_artists($matches[1]) && $prefs['notvabydate'])) {
		$qstring .= ' LOWER(Albumname)';
	} else {
		$qstring .= ' Year, LOWER(Albumname)';
	}

	if ($result = generic_sql_query($qstring)) {
		$count = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$artistthing = (!$use_artistindex && $prefs['sortcollectionby'] == "album") ? $obj->Artistname : null;
			if ($fragment === false) {
				$exists = ($obj->Image && $obj->Image !== "") ? "yes" : "no";
				$albumlink = ($t == "a" || preg_match('/:album:|:artist:/', $obj->Spotilink)) ? rawurlencode($obj->Spotilink) : null;
				albumHeader(
					$obj->Albumname,
					$albumlink,
					$t."album".$obj->Albumindex,
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
					ob_start();
					$exists = ($obj->Image && $obj->Image !== "") ? "yes" : "no";
					albumHeader(
						$obj->Albumname,
						rawurlencode($obj->Spotilink),
						"aalbum".$obj->Albumindex,
						$exists,
						($obj->Searched == 1 || $exists == "yes") ? "yes" : "no",
						$obj->ImgKey,
						$obj->Image,
						$obj->Year,
						null,
						$artistthing
					);
					$singleheader['html'] = ob_get_contents();
					ob_end_clean();
					return $singleheader;
				}
			}
			$count++;
		}
		if ($count == 0) {
			noAlbumsHeader();
		}
	} else {
		print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
}

function remove_album_from_database($albumid) {
	generic_sql_query("DELETE FROM Tracktable WHERE Albumindex = ".$albumid);
	generic_sql_query("DELETE FROM Albumtable WHERE Albumindex = ".$albumid);
}

function get_list_of_albums($aid) {
	global $prefs;
	$vals = array();

	$qstring = "SELECT * FROM Albumtable WHERE AlbumArtistindex = '".$aid."' AND ";
	$qstring .= "Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex = Albumtable.Albumindex AND Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0 AND Tracktable.isSearchResult < 2)";
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
		$spotilink = null;
		$qstring = "SELECT Spotilink FROM Albumtable WHERE Albumindex = '".$index."'";
		if ($result = generic_sql_query($qstring)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$spotilink = $obj->Spotilink;
			}
		}
		if ($spotilink !== null) {
			debug_print("Using full album link for albumindex ".$index,"SQL");
			if (strtolower(pathinfo($spotilink, PATHINFO_EXTENSION)) == "cue") {
				array_push($retarr, 'load "'.$spotilink.'"');
			} else {
				array_push($retarr, 'add "'.$spotilink.'"');
			}
			return $retarr;
		}
	}
	$cmd = ($cmd === null) ? 'add' : $cmd;
	$sflag = ($flag == "b") ? "AND isSearchResult > 0" : "AND isSearchResult < 2";
	debug_print("Getting Album Tracks for Albumindex ".$index,"MYSQL");
	$qstring = "SELECT Uri FROM Tracktable WHERE Albumindex = '".$index."' AND Uri IS NOT NULL AND Hidden = 0 ".$sflag." ORDER BY Disc, TrackNo";
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
	debug_print("Getting Tracks for AlbumArtist ".$index,"MYSQL");
	$qstring = "SELECT Albumindex FROM Albumtable WHERE AlbumArtistindex = ".$index;
	if (!$prefs['sortbydate'] ||
		(is_various_artists($index) && $prefs['notvabydate'])) {
		$qstring .= ' ORDER BY LOWER(Albumname)';
	} else {
		$qstring .= ' ORDER BY Year, LOWER(Albumname)';
	}
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$retarr = array_merge($retarr, get_album_tracks_from_database($obj->Albumindex, $cmd, $flag));
		}
	}
	return $retarr;
}

function do_tracks_from_database($which, $fragment = false) {
    debug_print("Generating ".$which." from database","DUMPALBUMS");
	if ($fragment) {
		ob_start();
	}
	$track_is_album = false;
	$track_is_artist = false;
	$sflag = substr($which,0,1);
	$a = preg_match("/album(\d+)/", $which, $matches);
	if (!$a) {
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	} else {
		debug_print("Looking for albumID ".$matches[1],"DUMPALBUMS");
		$numdiscs = 1;
		if ($result2 = generic_sql_query("SELECT MAX(Disc) AS NumDiscs FROM Tracktable WHERE Albumindex = '".$matches[1]."' AND Uri IS NOT NULL AND Hidden=0")) {
			$obj2 = $result2->fetch(PDO::FETCH_OBJ);
			$numdiscs = $obj2->NumDiscs;
		} else {
			debug_print("ERROR! Couldn't find NumDiscs for Albumindex ".$matches[1],"MYSQL");
		}
		$t = ($sflag == "b") ? "AND isSearchResult > 0" : "AND isSearchResult < 2";
		if ($result = generic_sql_query("SELECT t.*, a.Artistname, b.AlbumArtistindex, r.Rating, ti.Image FROM Tracktable AS t JOIN Artisttable AS a ON t.Artistindex = a.Artistindex JOIN Albumtable AS b ON t.Albumindex = b.Albumindex LEFT JOIN Ratingtable AS r ON r.TTindex = t.TTindex LEFT JOIN Trackimagetable AS ti ON ti.TTindex = t.TTindex WHERE t.Albumindex = '".$matches[1]."' AND Uri IS NOT NULL AND Hidden=0 ".$t." ORDER BY CASE WHEN t.Title LIKE 'Album: %' THEN 1 ELSE 2 END, t.Disc, t.TrackNo")) {
			$trackarr = $result->fetchAll(PDO::FETCH_OBJ);
			$numtracks = count($trackarr);
			$currdisc = -1;
			while ($obj = array_shift($trackarr)) {
				if ($numdiscs > 1 && $obj->Disc != $currdisc && $obj->Disc > 0) {
                    $currdisc = $obj->Disc;
	                print '<div class="discnumber indent">'.ucfirst(strtolower(get_int_text("musicbrainz_disc"))).' '.$currdisc.'</div>';
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
					format_time($obj->Duration),
					$obj->LastModified,
					$obj->Image
				);
			}
			if ($track_is_artist !== false) {
				debug_print("Album has no tracks, just an artist link","SQL");
				print '<input type="hidden" class="expandartist"/>';
			} else if ($track_is_album !== false) {
				debug_print("Album has no tracks, just an album link","SQL");
				print '<input type="hidden" class="expandalbum"/>';
			}
		} else {
	        print '<h3>'.get_int_text("label_general_error").'</h3>';
		}
	}
	if ($fragment) {
		$s = ob_get_contents();
		ob_end_clean();
		return $s;
	}
}

function getAllURIs($sqlstring, $limit, $tags, $random = true) {

	// Get all track URIs using a supplied SQL string. For playlist generators
	debug_print("Selector is ".$sqlstring,"SMART PLAYLIST");
	$rndstr = $random ? " ORDER BY ".SQL_RANDOM_SORT : " ORDER BY Albumindex, TrackNo";

	generic_sql_query("CREATE TEMPORARY TABLE pltemptable(TTindex INT UNSIGNED NOT NULL UNIQUE)",true);
	if ($tags) {
		$stmt = sql_prepare_query_later("INSERT INTO pltemptable(TTindex) ".$sqlstring." AND NOT Tracktable.TTindex IN (SELECT TTindex FROM pltable)".$rndstr." LIMIT ".$limit);
		if ($stmt !== FALSE) {
			$stmt->execute($tags);
		}
	} else {
		generic_sql_query("INSERT INTO pltemptable(TTindex) ".$sqlstring." AND NOT Tracktable.TTindex IN (SELECT TTindex FROM pltable)".$rndstr." LIMIT ".$limit);
	}
	generic_sql_query("INSERT INTO pltable (TTindex) SELECT TTindex FROM pltemptable",true);

	$uris = array();
	if ($result = generic_sql_query("SELECT Uri FROM Tracktable WHERE TTindex IN (SELECT TTindex FROM pltemptable)",true)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($uris, $obj->Uri);
			debug_print("URI : ".$obj->Uri,"SMART PLAYLIST");
		}
	}
	return $uris;
}

function get_fave_artists() {
	// Can we have a tuning slider to increase the 'Playcount > x' value?
	generic_sql_query("CREATE TEMPORARY TABLE aplaytable AS SELECT SUM(Playcount) AS playtotal, Artistindex FROM (SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex) WHERE Playcount > 10) AS derived GROUP BY Artistindex");

	$artists = array();
	if ($result = generic_sql_query("SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM (SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex)) AS derived GROUP BY Artistindex) AS alias JOIN Artisttable USING (Artistindex) WHERE playtot > (SELECT AVG(playtotal) FROM aplaytable) ORDER BY ".SQL_RANDOM_SORT)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			debug_print("Artist : ".$obj->Artistname,"FAVEARTISTS");
			array_push($artists, array( 'name' => $obj->Artistname, 'plays' => $obj->playtot));
		}
	}
	return $artists;
}

function get_artist_charts() {
	$artists = array();
	if ($result = generic_sql_query("SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM (SELECT Playcount, Artistindex FROM Tracktable JOIN Playcounttable USING (TTindex)) AS arse GROUP BY Artistindex) AS cheese JOIN Artisttable USING (Artistindex) ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($artists, array( 'label_artist' => $obj->Artistname, 'soundcloud_plays' => $obj->playtot));
		}
	}
	return $artists;
}

function get_album_charts() {
	$albums = array();
	if ($result = generic_sql_query("SELECT playtot, Albumname, Artistname, Spotilink FROM (SELECT SUM(Playcount) AS playtot, Albumindex FROM (SELECT Playcount, Albumindex FROM Tracktable JOIN Playcounttable USING (TTindex)) AS arse GROUP BY Albumindex) AS cheese JOIN Albumtable USING (Albumindex) JOIN Artisttable ON (Albumtable.AlbumArtistIndex = Artisttable.Artistindex) ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($albums, array( 'label_artist' => $obj->Artistname, 'label_album' => $obj->Albumname, 'soundcloud_plays' => $obj->playtot, 'uri' => $obj->Spotilink));
		}
	}
	return $albums;
}

function get_track_charts() {
	$tracks = array();
	if ($result = generic_sql_query("SELECT Title, Playcount, Artistname, Uri FROM Tracktable JOIN Playcounttable USING (TTIndex) JOIN Artisttable USING (Artistindex) ORDER BY Playcount DESC LIMIT 40")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			array_push($tracks, array( 'label_artist' => $obj->Artistname, 'label_track' => $obj->Title, 'soundcloud_plays' => $obj->Playcount, 'uri' => $obj->Uri));
		}
	}
	return $tracks;
}

function getAveragePlays() {
	$avgplays = 0;
	if ($result = generic_sql_query("SELECT avg(Playcount) as avgplays FROM Playcounttable")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$avgplays = $obj->avgplays;
			debug_print("Average Plays is ".$avgplays, "SMART PLAYLIST");
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
	debug_print("Removing track ".$ttid,"MYSQL");
	if ($result = generic_sql_query("SELECT Uri FROM Tracktable WHERE TTindex = '".$ttid."'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists('deletedtracks', $returninfo)) {
				$returninfo['deletedtracks'] = array();
			}
			array_push($returninfo['deletedtracks'], rawurlencode($obj->Uri));
		}
	}

	// Deleting tracks will delete their associated playcounts. While it might seem like a good idea
	// to hide them instead, in fact this results in a situation where we have tracks in our database
	// that no longer exist in physical form - eg if local tracks are removed. This is really bad if we then
	// later play those tracks from an online source and rate them. find_item will return the hidden local track,
	// which will get rated and appear back in the collection. So now we have an unplayable track in our collection.
	// There's no real way round it, (without creating some godwaful lookup table of backends it's safe to do this with)
	// so we just delete the track and lose the playcount information.
	if ($result = generic_sql_query("DELETE FROM Tracktable WHERE TTindex = '".$ttid."'")) {
		$retval = true;
	}

	return $retval;
}

//
// Database Global Stats and Version Control
//

function update_track_stats() {
	debug_print("Updating Track Stats","MYSQL");
	if ($result = generic_sql_query("SELECT COUNT(*) AS NumArtists FROM (SELECT DISTINCT AlbumArtistIndex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0 AND isSearchResult < 2) AS t")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumArtists;
		}
		update_stat('ArtistCount',$ac);
	}

	if ($result = generic_sql_query("SELECT COUNT(*) AS NumAlbums FROM (SELECT DISTINCT Albumindex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0 AND isSearchResult < 2) AS t")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumAlbums;
		}
		update_stat('AlbumCount',$ac);
	}

	if ($result = generic_sql_query("SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND isSearchResult < 2")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->NumTracks;
		}
		update_stat('TrackCount',$ac);
	}

	if ($result = generic_sql_query("SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND isSearchResult < 2")) {
		$ac = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$ac = $obj->TotalTime;
		}
		update_stat('TotalTime',$ac);
	}
	debug_print("Track Stats Updated","MYSQL");
}

function update_stat($item, $value) {
	generic_sql_query("UPDATE Statstable SET Value='".$value."' WHERE Item='".$item."'", true);
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
	if ($find_track = sql_prepare_query_later("SELECT TTindex, Disc, LastModified, Hidden, isSearchResult FROM Tracktable WHERE Title=? AND ((Albumindex=? AND TrackNo=? AND Disc=?)".
	// ... then tracks that are in the wishlist. These will have TrackNo as NULL but Albumindex might not be.
		" OR (Artistindex=? AND TrackNo IS NULL AND Uri IS NULL))")) {
	} else {
		show_sql_error();
        exit(1);
	}

	if ($update_track = sql_prepare_query_later("UPDATE Tracktable SET Trackno=?, Duration=?, Disc=?, LastModified=?, Uri=?, Albumindex=?, isSearchResult=?, Hidden=0 WHERE TTindex=?")) {
	} else {
		show_sql_error();
        exit(1);
	}
}

function createAlbumsList() {

    global $collection, $transaction_open, $numdone, $doing_search;

    debug_print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
    debug_print("Starting Database Update From Collection","TIMINGS");
    $now = time();

    foreach(array_keys($collection->artists) as $artistkey) {
        do_artist_database_stuff($artistkey, false);
    }

	$dur = format_time(time() - $now);
	debug_print("Database Update From Collection Took ".$dur,"TIMINGS");
    debug_print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
    // Find tracks that have been removed
    if (!$doing_search) {
	    debug_print("Starting Cruft Removal","TIMINGS");
	    $now = time();
	    debug_print("Finding tracks that have been deleted","MYSQL");
	    generic_sql_query("DELETE FROM Tracktable WHERE LastModified IS NOT NULL AND TTindex NOT IN (SELECT TTindex FROM Foundtracks) AND Hidden = 0", true);
	    remove_cruft();
		update_stat('ListVersion',ROMPR_COLLECTION_VERSION);
		update_track_stats();
		$dur = format_time(time() - $now);
		debug_print("Cruft Removal Took ".$dur,"TIMINGS");
	    debug_print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
	}
	close_transaction();
}

function remove_cruft() {
	global $prefs;
	// To try and keep the db size down, if a track has only been played once in the last 6 months and it has no tags or ratings, remove it.
	// We don't need to check if it's in the Ratingtable or TagListtable because if Hidden == 1 it can't be.
	debug_print("Removing once-played tracks not played in 6 months","MYSQL");
	delete_oldtracks();

    debug_print("Removing orphaned albums","MYSQL");
    // NOTE - the Albumindex IS NOT NULL is essential - if any albumindex is NULL the entire () expression returns NULL
    generic_sql_query("DELETE FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE Albumindex IS NOT NULL)", true);

    debug_print("Removing orphaned artists","MYSQL");
    delete_orphaned_artists();

    debug_print("Tidying Metadata","MYSQL");
    generic_sql_query("DELETE FROM Ratingtable WHERE Rating = '0'", true);
	generic_sql_query("DELETE FROM Ratingtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)", true);
	generic_sql_query("DELETE FROM TagListtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)", true);
	generic_sql_query("DELETE FROM Tagtable WHERE Tagindex NOT IN (SELECT Tagindex FROM TagListtable)", true);
	generic_sql_query("DELETE FROM Playcounttable WHERE Playcount = '0'", true);
	generic_sql_query("DELETE FROM Playcounttable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)", true);
	generic_sql_query("DELETE FROM Trackimagetable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)", true);
}

function do_artist_database_stuff($artistkey, $sendupdates = false) {

    global $collection, $artist_created, $album_created, $find_track, $update_track, $prefs, $onthefly;
    if ($sendupdates === false) {
    	$sendupdates = $onthefly;
    }

    $artistname = $collection->artistName($artistkey);

    // CHECK. This prevents us creating album artists when those artists have no albums with tracks.
    // These might be artists who appear on compilations, but check_and_update_track will
    // create the artist if it's needed as a track artist.
    // It speeds things up a bit and stops us unnecessarily creating artists when certain backends
    // return only albums.
    if ($collection->artistNumTracks($artistkey) == 0) {
    	// debug_print("Artist ".$artistname." has no albums. Ignoring it","MYSQL");
    	return false;
    }

    $albumlist = array();
    if ($artistkey == "various artists") {
		$albumlist = $collection->getAlbumList($artistkey, false);
    } else {
	    $albumlist = $collection->getAlbumList($artistkey, true);
    }

	$artist_created = false;
    $artistindex = check_artist($artistname, $sendupdates);
    if ($artistindex == null) {
    	debug_print("ERROR! Checked artist ".$artistname." and index is still null!","MYSQL");
        return false;
    }

    foreach($albumlist as $album) {

    	if ($album->trackCount() == 0) {
    		// This is another of those things that can happen with some mopidy backends
    		// that return search results as an album only. Internet Archive is one such
    		// and many radio backends are also the same. We don't want these in the database;
    		// they don't get added even without this check because there are no tracks BUT
    		// the album does get created and then remove_cruft has to delete it again).
    		// debug_print("Album ".$album->name." has no tracks. Ignoring it","MYSQL");
    		continue;
    	}

		$album_created = false;
		// Although we don't need to sort the tracks, we do need to call sortTracks
		// because this sorts them by disc in the case where there are no disc numbers
        $album->sortTracks();
        $albumindex = check_album(
            $album->name,
            $artistindex,
            $album->spotilink,
            $album->getImage('small'),
            $album->getDate(),
            "0",
            md5($album->artist." ".$album->name),
            $album->musicbrainz_albumid,
            $album->domain,
            $sendupdates
        );

        if ($albumindex == null) {
        	debug_print("ERROR! Album index for ".$album->name." is still null!","MYSQL");
    		continue;
        }

        $ttidupdate = false;
        foreach($album->tracks as $trackobj) {
			$ttidupdate = check_and_update_track($trackobj, $albumindex, $artistindex, $artistname, $sendupdates);
        }

    	if ($sendupdates && ($artist_created == false || $prefs['sortcollectionby'] == "album") && $album_created) {
    		send_list_updates(false, $album_created, null, false);
    	} else if ($ttidupdate) {
        	// We only need to send_list_updates once per album since it sends the entire track listing for that album.
        	send_list_updates(false, false, $ttidupdate, false);
        }
    } /* End of Artist Album Loop */

    if ($sendupdates && $artist_created && $prefs['sortcollectionby'] == "artist") {
		send_list_updates($artist_created, false, null, false);
	}
}

function do_track_by_track($artistname, $albumname, $domain, $spotialbum, $trackobject, $sendupdates = false) {

	// The difference between this and the above function is that this one takes tracks as they come in direct
	// from the backend - without being collectionised. This is faster and uses less RAM but does rely on the tags
	// being correct - they're filtered before being sent here.
	// Tracks must have disc and albumartist tags to be handled by this method.
	// The collectionizer was designed to sort tracks without those tags so if those tags exist they don't need
	// to be collectionized.

	global $mysqlc, $album_created, $artist_created, $find_track, $update_track, $prefs, $onthefly;
    if ($sendupdates === false) {
    	$sendupdates = $onthefly;
    }

	static $current_albumartist = null;
	static $current_album = null;
	static $current_domain = null;
	static $current_albumlink= null;

	static $albumindex = null;
	static $albumartistindex = null;

	static $wecreatedartist = null;
	static $wecreatedalbum = null;

	static $createdartists = array();
	static $createdalbums = array();

	if ($current_albumartist != $artistname) {
		$artist_created = false;
		$albumartistindex = check_artist($artistname, $sendupdates);
	}
    if ($albumartistindex == null) {
    	debug_print("ERROR! Checked artist ".$artistname." and index is still null!","MYSQL_TBT");
        return false;
    }

    $albumobj = new album($albumname, $artistname, $domain);
    $albumobj->newTrack($trackobject);
    $albumobj->spotilink = $spotialbum;

    if ($current_albumartist != $artistname || $current_album != $albumname || $current_domain != $domain ||
    	($spotialbum != null && $spotialbum != $current_albumlink)) {
    	$album_created = false;
        $albumindex = check_album(
            $albumobj->name,
            $albumartistindex,
            $albumobj->spotilink,
            $albumobj->getImage('small'),
            $albumobj->getDate(),
            "0",
            md5($albumobj->artist." ".$albumobj->name),
            $albumobj->musicbrainz_albumid,
            $albumobj->domain,
            $sendupdates
        );

        if ($albumindex == null) {
        	debug_print("ERROR! Album index for ".$albumobj->name." is still null!","MYSQL_TBT");
    		return false;
        }
    }

    $current_albumartist = $artistname;
    $current_album = $albumname;
    $current_domain = $domain;
    $current_albumlink = $spotialbum;

	foreach ($albumobj->tracks as $trackobj) {
		// The album we've just created must only have one track, but this makes sure we use the track object
		// that is part of the album. This MAY be important due to various assumptions and the fact that PHP
		// insists on copying variables rather than passing by reference.
		$ttidupdate = check_and_update_track($trackobj, $albumindex, $albumartistindex, $artistname, $sendupdates);
	}

	if ($sendupdates) {
		if ($artist_created && $current_albumartist != $wecreatedartist && $prefs['sortcollectionby'] == "artist") {
			debug_print("Sending List Updates for Artist ".$artist_created,"TBT");
			send_list_updates($artist_created, false, null, false);
			$wecreatedartist = $current_albumartist;
			$createdartists[] = (int) $artist_created;
		} else if ($album_created  && $current_album != $wecreatedalbum && (!(in_array((int) $albumartistindex, $createdartists)) ||  $prefs['sortcollectionby'] == "album")) {
			debug_print("Sending List Updates for Album ".$album_created,"TBT");
			send_list_updates(false, $album_created, null, false);
			$wecreatedalbum = $current_album;
			$createdalbums[] = (int) $album_created;
		} else if ($ttidupdate && !(in_array((int) $albumartistindex, $createdartists)) && !(in_array((int) $albumindex, $createdalbums))) {
			debug_print("Sending List Updates for Track ".$ttidupdate,"TBT");
	    	send_list_updates(false, false, $ttidupdate, false);
		}
	}
}

function check_and_update_track($trackobj, $albumindex, $artistindex, $artistname, $sendupdates) {
	global $find_track, $update_track, $artist_created, $album_created, $numdone, $prefs, $doing_search, $dont_change_search_status;
	static $current_trackartist = null;
	static $trackartistindex = null;
	$ttidupdate = false;
    $ttid = null;
    $lastmodified = null;
    $hidden = 0;
    $disc = 0;
    $uri = null;
    $issearchresult = 0;

    // Why are we not checking by URI? That should be unique, right?
    // Well, er. no. They're not. Especially Spotify returns the same URI multiple times if it's in mutliple playlists
    // We CANNOT HANDLE that. Nor do we want to.

    // The other advantage of this is that we can put an INDEX on Albumindex, TrackNo, and Title, which we can't do with Uri cos it's too long
    // - this speeds the whole process up by a factor of about 32 (9 minutes when checking by URI vs 15 seconds this way, on my collection)
    // Also, URIs might change if the user moves his music collection.

	if ($prefs['collection_type'] == "sqlite") {
		// Lord knows why, but we have to re-prepare these every single bloody time!
		prepare_findtracks();
	}

    if ($find_track->execute(array($trackobj->name, $albumindex, $trackobj->number, $trackobj->disc, $artistindex))) {
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

    if ($ttid) {
    	if (($lastmodified === null && $trackobj->lastmodified !== null) ||
    		$trackobj->lastmodified != $lastmodified ||
    		($trackobj->disc != $disc && $trackobj->disc !== '') ||
    		$hidden != 0 ||
    		($doing_search == false && $issearchresult == 2) ||
    		($doing_search && $issearchresult == 0)) {
	    	debug_print("  Updating track with ttid $ttid because :","MYSQL");
	    	if ($lastmodified === null) debug_print("    LastModified is not set in the database","MYSQL");
	    	if ($trackobj->lastmodified === null) debug_print("    TrackObj LastModified is NULL too!","MYSQL");
	    	if ($lastmodified != $trackobj->lastmodified) debug_print("    LastModified has changed: We have ".$lastmodified." but track has ".$trackobj->lastmodified,"MYSQL");
	    	if ($disc != $trackobj->disc) debug_print("    Disc Number has changed: We have ".$disc." but track has ".$trackobj->disc,"MYSQL");
	    	if ($hidden != 0) debug_print("    It is hidden","MYSQL");
	    	if ($doing_search == false && $issearchresult == 2) debug_print("    It's an external search result that should now be in the collection.");
	    	if ($doing_search && $issearchresult == 0) debug_print("    It needs to be marked as a search result");

	    	$newsearchflag = 0;
	    	if ($issearchresult == 2 && $doing_search) $newsearchflag = 2;
	    	if ($hidden != 0 && $doing_search) $newsearchflag = 2;
	    	if ($issearchresult > 0 && !$doing_search) $newsearchflag = 1;
	    	if ($issearchresult == 0 && $doing_search) $newsearchflag = 1;

			if ($update_track->execute(array($trackobj->number, $trackobj->duration, $trackobj->disc, $trackobj->lastmodified, $trackobj->url, $albumindex, $newsearchflag, $ttid))) {
				if ($sendupdates && $artist_created == false && $album_created == false) {
					$ttidupdate = $ttid;
				}
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
        	debug_print("ERROR! Trackartistindex is still null!","MYSQL_TBT");
            return false;
        }
        $current_trackartist = $a;
        $sflag = ($doing_search) ? 2 : 0;
        $ttid = create_new_track(
            $trackobj->name,
            null,
            $trackobj->number,
            $trackobj->duration,
            null,
            null,
            null,
            null,
            null,
            $trackobj->url,
            $trackartistindex,
            $artistindex,
            $albumindex,
            null,
            null,
            $trackobj->lastmodified,
            $trackobj->disc,
            null,
            null,
            0,
            $trackobj->getImage(),
            $sflag
        );
        $numdone++;
		check_transaction();
		if ($sendupdates && ($artist_created == false || $prefs['sortcollectionby'] == "album") && $album_created == false) {
			$ttidupdate = $ttid;
		}
	}
    if ($ttid == null) {
    	debug_print("ERROR! No ttid for track ".$trackobj->name,"MYSQL");
    } else {
    	if (!$doing_search) {
    		generic_sql_query("INSERT INTO Foundtracks (TTindex) VALUES (".$ttid.")", false, false);
    	}
    }
    return $ttidupdate;
}

function dumpAlbums($which) {

    global $divtype, $prefs;

    $t = substr($which,1,3);
    switch ($which) {
    	case 'aalbumroot':
    		// Dump the collection as HTML
	        print '<div id="fothergill">';
	        print alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
	        print '</div>';
	        if ($prefs['sortcollectionby'] == "album") {
	        	do_albums_from_database('aartistroot');
	        } else {
	        	$divtype = "album1";
	        	do_artists_from_database($which);
	        }
	        break;

	    case 'balbumroot':
	    	// Dump the search results as HTML
            print '<div class="menuitem"><h3>'.get_int_text("label_searchresults").'</h3></div>';
            $numartists = 0;
            $numalbums = 0;
            $numtracks = 0;
            $numtime = 0;
			if ($result = generic_sql_query("SELECT COUNT(*) AS NumArtists FROM (SELECT DISTINCT AlbumArtistIndex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0 AND isSearchResult > 0) AS t")) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$numartists = $obj->NumArtists;
				}
			}

			if ($result = generic_sql_query("SELECT COUNT(*) AS NumAlbums FROM (SELECT DISTINCT Albumindex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0 AND isSearchResult > 0) AS t")) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$numalbums = $obj->NumAlbums;
				}
			}

			if ($result = generic_sql_query("SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND isSearchResult > 0")) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$numtracks = $obj->NumTracks;
				}
			}

			if ($result = generic_sql_query("SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0 AND isSearchResult > 0")) {
				while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
					$numtime = $obj->TotalTime;
				}
			}

	        print alistheader($numartists, $numalbums, $numtracks, format_time($numtime));

	        if ($prefs['sortcollectionby'] == "album") {
	        	do_albums_from_database('bartistroot');
	        } else {
	        	$divtype = "album1";
	        	do_artists_from_database($which);
	        }
	        break;

	    default:
	    	if ($t == "art") {
	    		do_albums_from_database($which);
	    	} else {
	    		do_tracks_from_database($which);
	    	}
    }

}

function getItemsToAdd($which, $cmd = null) {
    $t = substr($which, 1, 3);
    $flag = substr($which,0,1);
    if ($t == "art") {
        $a = preg_match("/artist(\d+)/", $which, $matches);
        if (!$a) {
            return array();
        }
        return get_artist_tracks_from_database($matches[1], $cmd, $flag);
    } else {
        $a = preg_match("/album(\d+)/", $which, $matches);
        if (!$a) {
            return array();
        }
        return get_album_tracks_from_database($matches[1], $cmd, $flag);
    }
}

function send_list_updates($artist_created, $album_created, $ttid, $send = true) {
	global $mysqlc, $returninfo, $prefs;
	if (!array_key_exists('inserts', $returninfo)) {
		$returninfo['inserts'] = array();
	}
	if ($artist_created !== false && $prefs['sortcollectionby'] == "artist") {
		debug_print("Artist ".$artist_created." was created","USER RATING");
		// We had to create a new albumartist, so we send back the artist HTML header
		// We need to know the artist details and where in the list it is supposed to go.
		array_push($returninfo['inserts'], do_artists_from_database($artist_created));
	} else if ($album_created !== false) {
		debug_print("Album ".$album_created." was created","USER RATING");
		// Find the artist
		$artistid = find_artist_from_album($album_created);
		if ($artistid === null) {
			debug_print("ERROR - no artistID found!","USER RATING");
		} else {
			array_push($returninfo['inserts'], do_albums_from_database('aartist'.$artistid, $album_created));
		}
	}  else if ($ttid !== null) {
		debug_print("Track ".$ttid." was modified","USER RATING");
		$albumid = find_album_from_track($ttid);
		if ($albumid === null) {
			debug_print("ERROR - no albumID found!","USER RATING");
		} else {
			array_push($returninfo['inserts'], array( 	'type' => 'insertInto',
														'where' => 'aalbum'.$albumid,
														'html' => do_tracks_from_database('aalbum'.$albumid, true)));
		}
	}
	if ($send) {
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
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
	if ($result = generic_sql_query("SELECT Albumindex FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE Albumindex IS NOT NULL AND Hidden=0)")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			if (!array_key_exists('deletedalbums', $returninfo)) {
				$returninfo['deletedalbums'] = array();
			}
			array_push($returninfo['deletedalbums'], "aalbum".$obj->Albumindex);
		}
	}

	// Now find which artists have either no tracks or only hidden tracks
	if ($result = generic_sql_query("SELECT hidden.AlbumArtistindex FROM ".
									"(SELECT COUNT(Tracktable.Albumindex) AS numtracks, AlbumArtistindex FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) ".
									"WHERE Hidden = 1 ".
									"OR Tracktable.Albumindex IS NULL ".
									"GROUP BY AlbumArtistindex) AS hidden ".
									"LEFT OUTER JOIN ".
									"(SELECT COUNT(Tracktable.Albumindex) AS numtracks, AlbumArtistindex FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) ".
									"WHERE Hidden = 0 OR Hidden = 1 ".
									"OR Tracktable.Albumindex IS NULL ".
									"GROUP BY AlbumArtistindex) AS alltracks ".
									"ON hidden.numtracks = alltracks.numtracks AND hidden.AlbumArtistindex = alltracks.AlbumArtistindex WHERE alltracks.numtracks IS NOT NULL")) {
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

function prepareSearchTables() {
	// Clean up the database tables before performing a new search
	// First: Any track that was previously a '2' (added to database as search result) but now
	// has a playcount needs to become a zero and be hidden.
	generic_sql_query("UPDATE Tracktable SET Hidden = 1, isSearchResult = 0 WHERE TTindex IN (SELECT TTindex FROM Tracktable JOIN Playcounttable USING (TTindex) WHERE isSearchResult = 2)");

	// Second: remove any remaining '2's
	generic_sql_query("DELETE FROM Tracktable WHERE isSearchResult = 2");

	// Third: Set '1's back to '0's
	generic_sql_query("UPDATE Tracktable SET isSearchResult = 0 WHERE isSearchResult = 1");

	// This may leave some orphaned albums snd artists
	remove_cruft();
}

?>