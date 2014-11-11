<?php

include( "backends/sql/connect.php");
connect_to_database();
$artist_created = false;
$album_created = false;
$backend_in_use = "sql";
$download_file = "";
$convert_path = find_executable("convert");

// In the following, we're using a mixture of prepared statement (mysqli_prepare) and just raw queries.
// Raw queries are easier to handle in many cases, but prepared statements take a lot of fuss away
// when dealing with strings, as it automatically escapes everything.

// So what are Hidden tracks?
// These are used to count plays from online sources when those tracks are not in the collection.
// Doing this does increase the size of the database. Quite a lot. But without it the stats for charts
// and fave artists etc don't make a lot of sense in a world where a proportion of your listening
// is in response to searches of Spotify or youtube etc.

function find_item($uri,$title,$artist,$album,$urionly) {
	debug_print("Looking for item ".$title,"MYSQL");
	global $mysqlc;

	$ttid = null;
	if ($uri) {
		debug_print("  Trying by URI ".$uri,"MYSQL");
		if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable WHERE Uri = ?")) {
			mysqli_stmt_bind_param($stmt, "s", $uri);
			mysqli_stmt_execute($stmt);
		    mysqli_stmt_bind_result($stmt, $ttid);
		    mysqli_stmt_fetch($stmt);
		    mysqli_stmt_close($stmt);
		    if ($ttid) {
				debug_print("    Found TTindex ".$ttid,"MYSQL");
		    }
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	}
	if ($artist == null || $title == null || ($urionly && $uri)) {
		return $ttid;
	}
	// Not found by URI. Let's try looking it up by name
	if ($ttid == null) {
		if ($album) {
			// Note. We regard the same track on a different album as a different version. Unlike Last.FM do. Silly Buggers.
			debug_print("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
			if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable USING (Albumindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND STRCMP(Albumname, ?) = 0")) {
				mysqli_stmt_bind_param($stmt, "sss", $title, $artist, $album);
				mysqli_stmt_execute($stmt);
			    mysqli_stmt_bind_result($stmt, $ttid);
			    mysqli_stmt_fetch($stmt);
			    mysqli_stmt_close($stmt);
			    if ($ttid) {
					debug_print("    Found TTindex ".$ttid,"MYSQL");
			    }
			} else {
				debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
			}
			if ($ttid == null) {
				debug_print("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND Albumindex IS NULL")) {
					mysqli_stmt_bind_param($stmt, "ss", $title, $artist);
					mysqli_stmt_execute($stmt);
				    mysqli_stmt_bind_result($stmt, $ttid);
				    mysqli_stmt_fetch($stmt);
				    mysqli_stmt_close($stmt);
				    if ($ttid) {
						debug_print("    Found TTindex ".$ttid,"MYSQL");
				    }
				} else {
					debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
				}
			}
		} else {
			// No album supplied - ie this is from a radio stream. First look for a match where there is something in the album field
			debug_print("  Trying by artist ".$artist." album NOT NULL and track ".$title,"MYSQL");
			if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND Albumindex IS NOT NULL")) {
				mysqli_stmt_bind_param($stmt, "ss", $title, $artist);
				mysqli_stmt_execute($stmt);
			    mysqli_stmt_bind_result($stmt, $ttid);
			    mysqli_stmt_fetch($stmt);
			    mysqli_stmt_close($stmt);
			    if ($ttid) {
					debug_print("    Found TTindex ".$ttid,"MYSQL");
			    }
			} else {
				debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
			}
			if ($ttid == null) {
				debug_print("  Trying by artist ".$artist." album NULL and track ".$title,"MYSQL");
				if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND Albumindex IS NULL")) {
					mysqli_stmt_bind_param($stmt, "ss", $title, $artist);
					mysqli_stmt_execute($stmt);
				    mysqli_stmt_bind_result($stmt, $ttid);
				    mysqli_stmt_fetch($stmt);
				    mysqli_stmt_close($stmt);
				    if ($ttid) {
						debug_print("    Found TTindex ".$ttid,"MYSQL");
				    }
				} else {
					debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
				}
			}
		}
	}

	return $ttid;

}

function find_wishlist_item($artist, $album, $title) {
	debug_print("Looking for wishlist item","MYSQL");
	global $mysqlc;

	$ttid = null;
	if ($album) {
		debug_print("  Trying by artist ".$artist." album ".$album." and track ".$title,"MYSQL");
		if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable USING (Albumindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND STRCMP(Albumname, ?) = 0 AND Tracktable.Uri IS NULL")) {
			mysqli_stmt_bind_param($stmt, "sss", $title, $artist, $album);
			mysqli_stmt_execute($stmt);
		    mysqli_stmt_bind_result($stmt, $ttid);
		    mysqli_stmt_fetch($stmt);
		    mysqli_stmt_close($stmt);
		    if ($ttid) {
				debug_print("    Found TTindex ".$ttid,"MYSQL");
		    }
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	} else {
		debug_print("  Trying by artist ".$artist." and track ".$title,"MYSQL");
		if ($stmt = mysqli_prepare($mysqlc, "SELECT TTindex FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE STRCMP(Title, ?) = 0 AND STRCMP(Artistname, ?) = 0 AND Albumindex IS NULL AND Tracktable.Uri IS NULL")) {
			mysqli_stmt_bind_param($stmt, "ss", $title, $artist);
			mysqli_stmt_execute($stmt);
		    mysqli_stmt_bind_result($stmt, $ttid);
		    mysqli_stmt_fetch($stmt);
		    mysqli_stmt_close($stmt);
		    if ($ttid) {
				debug_print("    Found TTindex ".$ttid,"MYSQL");
		    }
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	}
	return $ttid;

}

function create_new_track($title, $artist, $trackno, $duration, $albumartist, $spotilink, $image, $album, $date, $uri,
						  $trackai, $albumai, $albumi, $isonefile, $searched, $imagekey, $lastmodified, $disc, $ambid,
						  $numdiscs, $domain, $hidden, $trackimage) {
	debug_print("Adding New Track ".$title." No: ".$trackno." Hidden: ".$hidden,"MYSQL");
	global $mysqlc;
	global $artist_created;
	global $album_created;

	if ($albumai == null) {
		// Does the albumartist exist?
		$albumai = check_artist($albumartist, true);
		// For when we add new album artists...
		// Need to check whether the artist we now have has any VISIBLE albums associated with him
		// - we need to know if we've added a new albumartist so we can return the correct
		// html fragment to the javascript

		if ($result = mysqli_query($mysqlc, "SELECT Albumindex FROM Albumtable LEFT JOIN Tracktable USING (Albumindex) WHERE AlbumArtistindex = ".$albumai." AND Hidden = 0 AND Uri IS NOT NULL")) {
			if (mysqli_num_rows($result) == 0) {
				debug_print("We added a new album artist or we're using a new album artist","MYSQL");
				$artist_created = $albumai;
			}
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
		mysqli_free_result($result);

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
			$albumi = check_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $ambid, $numdiscs, $domain);
			if ($albumi == null) {
				return null;
			}
			if ($album_created === false) {
				// We didn't create a new album BUT we might be using one that has only hidden tracks.
				$result = mysqli_query($mysqlc, "SELECT TTindex FROM Tracktable WHERE Albumindex = ".$albumi." AND Hidden = 0 AND Uri IS NOT NULL");
				if (mysqli_num_rows($result) == 0) {
					$album_created = $albumi;
					debug_print("We're using an album that was previously invisible","MYSQL");
				}

			}
		}
	}

	$retval = null;
	if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Tracktable (Title, Albumindex, Trackno, Duration, Artistindex, Uri, LastModified, Disc, Hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
		mysqli_stmt_bind_param($stmt, "siiiisiii", $title, $albumi, $trackno, $duration, $trackai, $uri, $lastmodified, $disc, $hidden);
		if (mysqli_stmt_execute($stmt)) {
			$retval = mysqli_insert_id($mysqlc);
			debug_print("Created track ".$title." with TTindex ".$retval,"MYSQL");
		} else {
			debug_print("    MYSQL Error on track creation: ".mysqli_error($mysqlc),"MYSQL");
		}
	    mysqli_stmt_close($stmt);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($retval && $trackimage) {
		if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Trackimagetable (TTindex, Image) VALUES (?, ?)")) {
			mysqli_stmt_bind_param($stmt, "is", $retval, $trackimage);
			if (mysqli_stmt_execute($stmt)) {
				debug_print("Added Image for track","MYSQL");
			} else {
				debug_print("    MYSQL Error on track creation: ".mysqli_error($mysqlc),"MYSQL");
			}
		    mysqli_stmt_close($stmt);
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	}

	return $retval;
}

function check_artist($artist, $upflag) {
	global $mysqlc;
	$index = null;
	// debug_print("Checking for artist ".$artist,"MYSQL");
	if ($stmt = mysqli_prepare($mysqlc, "SELECT Artistindex FROM Artisttable WHERE STRCMP(Artistname, ?) = 0")) {
		mysqli_stmt_bind_param($stmt, "s", $artist);
		mysqli_stmt_execute($stmt);
	    mysqli_stmt_bind_result($stmt, $index);
	    mysqli_stmt_fetch($stmt);
	    mysqli_stmt_close($stmt);
	    if ($index) {
			// debug_print("    Found Artistindex ".$index,"MYSQL");
	    } else {
			$index = create_new_artist($artist, $upflag);
	    }
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $index;
}

function create_new_artist($artist, $upflag) {
	global $mysqlc;
	$retval = null;
	if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Artisttable (Artistname) VALUES (?)")) {
		mysqli_stmt_bind_param($stmt, "s", $artist);
		if (mysqli_stmt_execute($stmt)) {
			$retval = mysqli_insert_id($mysqlc);
			debug_print("Created artist ".$artist." with Artistindex ".$retval,"MYSQL");
		    mysqli_stmt_close($stmt);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function check_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain) {
	global $mysqlc;
	$index = null;
	$year = null;
	$nd = null;
	// debug_print("Checking for album ".$album." on ".$domain, "MYSQL");
	if ($stmt = mysqli_prepare($mysqlc, "SELECT Albumindex, Year, Numdiscs FROM Albumtable WHERE STRCMP(Albumname, ?) = 0 AND AlbumArtistindex = ? AND Domain = ?")) {
		mysqli_stmt_bind_param($stmt, "sis", $album, $albumai, $domain);
		mysqli_stmt_execute($stmt);
	    mysqli_stmt_bind_result($stmt, $index, $year, $nd);
	    mysqli_stmt_fetch($stmt);
	    mysqli_stmt_close($stmt);
	    if ($index) {
	    	if (($year == null && $date != null) || ($nd == null && $numdiscs != null)) {
	    		debug_print("Updating Album Details","MYSQL");
	    		$qarray = array();
	    		if ($date) {
	    			array_push($qarray,"Year=".$date);
	    		}
	    		if ($numdiscs) {
	    			array_push($qarray,"NumDiscs=".$numdiscs);
	    		}
	    		$qstring = "UPDATE Albumtable SET ".implode(", ", $qarray)." WHERE Albumindex=".$index;
	    		debug_print($qstring,"MYSQL");
				if ($result = mysqli_query($mysqlc, $qstring)) {
					debug_print("Success","MYSQL");
				} else {
					debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
					return false;
				}
	    	}
	    } else {
			$index = create_new_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain);
	    }
	}
	return $index;
}

function create_new_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain) {

	global $mysqlc;
	global $album_created;
	global $error;
	global $download_file;
	global $convert_path;
	global $ipath;
	$retval = null;

	// See if the image needs to be archived. The SQL database no longer stores image URLs.
	// Images for albums are expected to be in albumart.
	// This archives stuff that:
	//   i)   is currently in prefs/imagecache - these have come from coverscraper/getAlbumCover
	//        for albums that are in the search or playlist.
	//   OR
	//   ii)  begin with getRemoteImage.php - these will be albums in the collection for which
	//        a mopidy backend has passed us an image.
	//   OR
	//   iii) begin with newimages/ - these are things like podcasts, soundcloud, youtube etc
	// 	      tracks from mopidy searches or browse
	// That should cover everything.
	// (The trouble with leaving stuff in prefs/imagecache is that it eventually gets purged,
	//  and the mechanism I had for dealing with that didn't bloody work)
	// This might slow things down a bit but mostly it should just be moving stuff from one
	// cache to another.

	if (preg_match('#^prefs/imagecache/#', $image)) {
		debug_print("Archiving Image For Album ... copying it from image cache","NEW ALBUM");
        $image = preg_replace('#_small\.jpg|_original\.jpg#', '', $image);
		system( 'cp '.$image.'_small.jpg albumart/small/'.$imagekey.'.jpg');
		system( 'cp '.$image.'_original.jpg albumart/original/'.$imagekey.'.jpg');
		system( 'cp '.$image.'_asdownloaded.jpg albumart/asdownloaded/'.$imagekey.'.jpg');
	} else if (preg_match('#^getRemoteImage.php\?url=#', $image)) {
		$convert_path = find_executable('convert');
		debug_print("Archiving Image For Album ... downloading remote image ".$image,"NEW ALBUM");
		$download_file = download_file(get_base_url()."/".$image, $imagekey, $convert_path);
		if ($error == 0) {
			list ($small_file, $main_file, $big_file) = saveImage($imagekey, true, '');
		}
	} else if (preg_match('#^newimages/#', $image)) {
		$convert_path = find_executable('convert');
		debug_print("Archiving Image For Album ... saving local generic image ".$image,"NEW ALBUM");
		$download_file = download_file(get_base_url()."/".$image, $imagekey, $convert_path);
		if ($error == 0) {
			list ($small_file, $main_file, $big_file) = saveImage($imagekey, true, '');
		}
	}

	if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Albumtable (Albumname, AlbumArtistindex, Spotilink, Year, IsOneFile, Searched, ImgKey, mbid, NumDiscs, Domain) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
		mysqli_stmt_bind_param($stmt, "sisiiissis", $album, $albumai, $spotilink, $date, $isonefile, checkImage($imagekey), $imagekey, $mbid, $numdiscs, $domain);
		if (mysqli_stmt_execute($stmt)) {
			$retval = mysqli_insert_id($mysqlc);
			debug_print("Created Album ".$album." with Albumindex ".$retval,"MYSQL");
			$album_created = $retval;
		    mysqli_stmt_close($stmt);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function checkImage($imagekey) {
	global $ipath;
	if (file_exists('albumart/small/'.$imagekey.'.jpg')) {
		return 1;
	}
	return 0;
}

function increment_value($ttid, $attribute, $value) {

	global $mysqlc;
	debug_print("Incrementing ".$attribute." by ".$value." for TTID ".$ttid, "MYSQL");
	if ($stmt = mysqli_prepare($mysqlc, "UPDATE ".$attribute."table SET ".$attribute."=".$attribute."+? WHERE TTindex=?")) {
		mysqli_stmt_bind_param($stmt, "ii", $value, $ttid);
		if (mysqli_stmt_execute($stmt)) {
			if (mysqli_stmt_affected_rows($stmt) == 0) {
				debug_print("  Update affected 0 rows, creating new value","MYSQL");
			    mysqli_stmt_close($stmt);
				if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)")) {
					mysqli_stmt_bind_param($stmt, "ii", $ttid, $value);
					if (mysqli_stmt_execute($stmt)) {
						debug_print("    New Value Created", "MYSQL");
					} else {
						debug_print("  Error Executing mySql", "MYSQL");
					}
				}
			}
		} else {
			debug_print("  ERROR Executing mySql statement", "MYSQL");
			return false;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		return false;
	}
	return true;

}

function set_attribute($ttid, $attribute, $value) {

	// NOTE:
	// This function can only be used for integers!
	// It will set value for an EXISTING attribute to 0, but it will NOT create a NEW attribute
	// when $value is 0. This is because 0 is meant to represent 'no attribute'
	// and this keeps the table size down and ALSO means import functions
	// can cause new tracks to be added just by tring to set eg Rating to 0.

	global $mysqlc;
	global $album_created;
	global $artist_created;

	// We're setting an attribute.
	// If we're setting it on a hidden track we have to:
	// Unhide the track
	// Work out if this will cause a new artist and/or album to appear in the collection
	if ($result = mysqli_query($mysqlc, "SELECT Hidden FROM Tracktable WHERE TTindex=".$ttid)) {
		$h = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$h = $obj->Hidden;
		}
		mysqli_free_result($result);
		if ($h == 1) {
			debug_print("Setting attribute on a hidden track","MYSQL");
			// See if the album has any non-hidden tracks
			$result = mysqli_query($mysqlc, "SELECT TTindex FROM Tracktable JOIN Albumtable USING (Albumindex) WHERE Albumtable.Albumindex IN (SELECT Albumindex FROM Tracktable WHERE TTindex=".$ttid.") AND Hidden=0");
			if (mysqli_num_rows($result) == 0) {
				mysqli_free_result($result);
				$result = mysqli_query($mysqlc, "SELECT Albumindex FROM Tracktable WHERE TTindex =".$ttid);
				while ($obj = mysqli_fetch_object($result)) {
					$album_created = $obj->Albumindex;
					debug_print("Revealing Album Index ".$album_created,"MYSQL");
				}
				mysqli_free_result($result);
				// Now to find if this artist has any other albums. If not, its a new artist

				// TODO. This won't work if the artist has multiple hidden albums

				$result = mysqli_query($mysqlc, "SELECT Albumindex FROM Albumtable WHERE AlbumArtistindex IN (SELECT AlbumArtistindex FROM Albumtable WHERE Albumindex=".$album_created.")");
				if (mysqli_num_rows($result) < 2) {
					// This is the only album by that artist
					mysqli_free_result($result);
					$result = mysqli_query($mysqlc,"SELECT AlbumArtistindex FROM Albumtable WHERE Albumindex=".$album_created);
					while ($obj = mysqli_fetch_object($result)) {
						$artist_created = $obj->AlbumArtistindex;
						debug_print("Revealing Artist Index ".$artist_created,"MYSQL");
					}
				} else {
					mysqli_free_result($result);
				}
			} else {
				mysqli_free_result($result);
				// If we didn't "create" a new album then we didn't create a new artist either.
			}
			generic_sql_query("UPDATE Tracktable SET Hidden=0 WHERE TTindex=".$ttid);
		}

	} else {
		debug_print("  ERROR Looking up Hidden status".mysqli_error($mysqlc), "MYSQL");
	}

	if ($attribute == 'Tags') {
		return addTags($ttid, $value);
	} else {
		debug_print("Setting ".$attribute." to ".$value." on ".$ttid,"MYSQL");

		if ($stmt = mysqli_prepare($mysqlc, "UPDATE ".$attribute."table SET ".$attribute."=? WHERE TTindex=?")) {
			mysqli_stmt_bind_param($stmt, "ii", $value, $ttid);
			if (mysqli_stmt_execute($stmt)) {
				if (mysqli_stmt_affected_rows($stmt) == 0 && $value !== 0) {
					debug_print("  Update affected 0 rows, creating new value","MYSQL");
				    mysqli_stmt_close($stmt);
					if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO ".$attribute."table (TTindex, ".$attribute.") VALUES (?, ?)")) {
						mysqli_stmt_bind_param($stmt, "ii", $ttid, $value);
						if (mysqli_stmt_execute($stmt)) {
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
				}
			} else {
				debug_print("  ERROR Executing mySql statement", "MYSQL");
				return false;
			}
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
			return false;
		}
		return true;
	}
}

function addTags($ttid, $tags) {
	global $mysqlc;
	foreach ($tags as $tag) {
		$t = trim($tag);
		debug_print("Adding Tag ".$t." to ".$ttid,"MYSQL");
		$esctag = mysqli_real_escape_string($mysqlc, $t);
		$tagindex = null;
		if ($result = mysqli_query($mysqlc, "SELECT Tagindex FROM Tagtable WHERE Name = '".$esctag."'")) {
			while ($obj = mysqli_fetch_object($result)) {
				$tagindex = $obj->Tagindex;
			}
			mysqli_free_result($result);
			if ($tagindex == null) {
				$tagindex = create_new_tag($esctag);
			}
			if ($tagindex == null) {
				debug_print("    Could not create tag","MYSQL");
				return false;
			}
			if ($result = mysqli_query($mysqlc, "SELECT * FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
				if (mysqli_num_rows($result) == 0) {
					debug_print("Adding new tag relation","MYSQL");
					if ($result = mysqli_query($mysqlc, "INSERT INTO TagListtable (TTindex, Tagindex) VALUES ('".$ttid."', '".$tagindex."')")) {
						debug_print("Success","MYSQL");
					} else {
						debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
						return false;
					}
				} else {
					debug_print("Tag relation already exists","MYSQL");
				}
			} else {
				debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
				return false;
			}
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
			return false;
		}
	}
	return true;
}

function create_new_tag($tag) {
	global $mysqlc;
	debug_print("Creating new tag ".$tag,"MYSQL");
	$tagindex = null;
	if ($result = mysqli_query($mysqlc, "INSERT INTO Tagtable (Name) VALUES ('".$tag."')")) {
		$tagindex = mysqli_insert_id($mysqlc);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $tagindex;

}

function remove_tag($ttid, $tag) {
	global $mysqlc;
	debug_print("Removing Tag ".$tag." from ".$ttid,"MYSQL");
	$esctag = mysqli_real_escape_string($mysqlc, $tag);
	$tagindex = null;
	if ($result = mysqli_query($mysqlc, "SELECT Tagindex FROM Tagtable WHERE Name = '".$esctag."'")) {
		while ($obj = mysqli_fetch_object($result)) {
			$tagindex = $obj->Tagindex;
		}
		mysqli_free_result($result);
		if ($tagindex == null) {
			debug_print("    Could not find tag","MYSQL");
			return false;
		}
		if ($result = mysqli_query($mysqlc, "DELETE FROM TagListtable WHERE TTindex = '".$ttid."' AND Tagindex = '".$tagindex."'")) {
			debug_print("Success","MYSQL");
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
			return false;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		return false;
	}
	return true;

}

function list_tags() {
	global $mysqlc;
	$tags = array();
	if ($result = mysqli_query($mysqlc, "SELECT Name FROM Tagtable ORDER BY Name")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($tags, $obj->Name);
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $tags;
}

function list_all_tag_data() {
	global $mysqlc;
	$tags = array();
	if ($result = mysqli_query($mysqlc, "SELECT t.Name, a.Artistname, tr.Title, al.Albumname, al.ImgKey, tr.Uri FROM Tagtable AS t JOIN TagListtable AS tl USING (Tagindex) JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) ORDER BY t.Name, a.Artistname, al.Albumname, tr.TrackNo
")) {
		while ($obj = mysqli_fetch_object($result)) {
			if (!array_key_exists($obj->Name, $tags)) {
				$tags[$obj->Name] = array();
			}
			array_push($tags[$obj->Name], array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => imagePath($obj->ImgKey),
				'Uri' => $obj->Uri
			));
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $tags;
}

function list_all_rating_data() {
	global $mysqlc;
	$ratings = array(
		"1" => array(),
		"2" => array(),
		"3" => array(),
		"4" => array(),
		"5" => array()
	);
	if ($result = mysqli_query($mysqlc, "SELECT r.Rating, a.Artistname, tr.Title, al.Albumname, al.ImgKey, tr.Uri FROM Ratingtable AS r JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) WHERE r.Rating > 0 ORDER BY r.Rating, a.Artistname, al.Albumname, tr.TrackNo")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($ratings[$obj->Rating], array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => imagePath($obj->ImgKey),
				'Uri' => $obj->Uri
			));
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $ratings;
}

function remove_tag_from_db($tag) {
	global $mysqlc;
	$r = true;
	if ($result = mysqli_query($mysqlc, "SELECT Tagindex FROM Tagtable WHERE Name = '".mysqli_real_escape_string($mysqlc, $tag)."'")) {
		$obj = mysqli_fetch_object($result);
		$tagindex = $obj->Tagindex;
		$r = generic_sql_query("DELETE FROM TagListtable WHERE Tagindex = ".$tagindex);
		if ($r) {
			$r = generic_sql_query("DELETE FROM Tagtable WHERE Tagindex = ".$tagindex);
		}
	} else {
		$r = false;
	}
	return $r;
}

function get_all_data($ttid) {

	// Misleadingly named function which should be used to get ratings and tags (and whatever else we might add)
	// based on a TTindex

	global $mysqlc;
	global $nodata;
	$data = $nodata;
	if ($result = mysqli_query($mysqlc, "SELECT Rating FROM Ratingtable WHERE TTindex = '".$ttid."'")) {
		$num = mysqli_num_rows($result);
		if ($num > 0) {
			$obj = mysqli_fetch_object($result);
			$data['Rating'] = $obj->Rating;
			debug_print("Rating is ".$data['Rating'],"MYSQL");
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	if ($result = mysqli_query($mysqlc, "SELECT Name FROM Tagtable JOIN TagListtable USING(Tagindex) WHERE TagListtable.TTindex = '".$ttid."' ORDER BY Name")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($data['Tags'], $obj->Name);
			debug_print("Got Tag ".$obj->Name,"MYSQL");
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	if ($result = mysqli_query($mysqlc, "SELECT Playcount FROM Playcounttable WHERE TTindex = '".$ttid."'")) {
		$num = mysqli_num_rows($result);
		if ($num > 0) {
			$obj = mysqli_fetch_object($result);
			$data['Playcount'] = $obj->Playcount;
			debug_print("Playcount is ".$data['Playcount'],"MYSQL");
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	return $data;
}

function get_imagesearch_info($key) {

	// Used by getalbumcover.php to get album and artist names etc based on an Image Key

	global $mysqlc;
	$retval = array(false, null, null, null, null, null, false);
	//if ($result = mysqli_query($mysqlc, "SELECT Artistname, Albumname, mbid, Directory, Spotilink FROM Albumtable JOIN Artisttable ON AlbumArtistindex = Artistindex WHERE ImgKey = '".$key."'")) {
	if ($result = mysqli_query($mysqlc, "SELECT Artistname, Albumname, mbid, Albumindex, Spotilink FROM Albumtable JOIN Artisttable ON AlbumArtistindex = Artistindex WHERE ImgKey = '".$key."'")) {
		// This can come back with multiple results if we have the same album on multiple backends
		// Need to make sure we put appropriate values in the return list
		while ($obj = mysqli_fetch_object($result)) {
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
	} else {
		debug_print("MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function get_album_directory($albumindex, $uri) {
	global $mysqlc;
	$retval = null;
	if (!preg_match('/\w+?:album/', $uri)) {
		// Get album directory by using the Uri of one of its tracks, making sure we
		// choose only local tracks
		if ($result2 = mysqli_query($mysqlc, "SELECT Uri FROM Tracktable WHERE Albumindex = ".$albumindex." LIMIT 1")) {
			while ($obj2 = mysqli_fetch_object($result2)) {
				$retval = dirname($obj2->Uri);
	            $retval = preg_replace('#^local:track:#', '', $retval);
	            debug_print("Got album directory using track Uri - ".$retval,"SQL");
			}
		}
	}
	return $retval;
}

function update_image_db($key, $notfound, $imagefile) {
	generic_sql_query("UPDATE Albumtable SET Searched = 1 WHERE ImgKey = '".$key."'");
}

function do_artists_from_database($which) {
	global $mysqlc;
	global $divtype;
	$singleheader = array();
    debug_print("Generating ".$which." from database","DUMPALBUMS");
	$vai = null;
	$singleheader['type'] = 'insertAtStart';
	$singleheader['where'] = 'collection';
	$qstring = "SELECT Artistindex FROM Artisttable WHERE Artistname = 'Various Artists'";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			if ($which == "aalbumroot") {
				artistHeader('aartist'.$obj->Artistindex, null, "Various Artists");
			} else {
				$singleheader['where'] = "aartist".$obj->Artistindex;
				$singleheader['type'] = 'insertAfter';
			}
            $divtype = ($divtype == "album1") ? "album2" : "album1";
            $vai = $obj->Artistindex;
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	}

	// This query gives us album artists only, which is what we want. Also makes sure we only get artists for whom we have actual
	// tracks with URIs (eg no artists who appear only on the wishlist)
    $qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex WHERE t.Uri IS NOT NULL AND t.Hidden = 0 ";
    if ($vai != null) {
    	$qstring .= "AND a.Artistindex != '".$vai."' ";
    }
    $qstring .= "GROUP BY a.Artistindex ORDER BY TRIM(LEADING 'the ' FROM LOWER(Artistname))";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			if ($which == "aalbumroot") {
				artistHeader('aartist'.$obj->Artistindex, null, $obj->Artistname);
			} else {
				if ($obj->Artistindex != $which) {
					$singleheader['where'] = "aartist".$obj->Artistindex;
					$singleheader['type'] = 'insertAfter';
				} else {
					ob_start();
					artistHeader('aartist'.$obj->Artistindex, null, $obj->Artistname);
					$singleheader['html'] = printHeaders().ob_get_contents().printTrailers();
					ob_end_clean();
					return $singleheader;
				}
			}
            $divtype = ($divtype == "album1") ? "album2" : "album1";
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
}

function get_list_of_artists() {
	global $mysqlc;
	$vals = array();
    $qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex WHERE t.Uri IS NOT NULL AND t.Hidden = 0 ";
    $qstring .= "GROUP BY a.Artistindex ORDER BY TRIM(LEADING 'the ' FROM LOWER(Artistname))";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($v = mysqli_fetch_assoc($result)) {
			array_push($vals, $v);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $vals;
}

function do_albums_from_database($which, $fragment = false) {
	global $mysqlc;
	global $prefs;
	$singleheader = array();
	$singleheader['type'] = 'insertAtStart';
	$singleheader['where'] = $which;
    debug_print("Generating ".$which." from database","DUMPALBUMS");
	$a = preg_match("/aartist(\d+)/", $which, $matches);
	if (!$a) {
        print '<h3>'.get_int_text("label_general_error").'</h3>';
        return false;
	}
	$qstring = "SELECT Artistname FROM Artisttable WHERE Artistindex = '".$matches[1]."'";
	$va = false;
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			if ($obj->Artistname == "Various Artists") {
				$va = true;
			}
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
        print '<h3>'.get_int_text("label_general_error").'</h3>';
        return false;
	}

	debug_print("Looking for artistID ".$matches[1],"DUMPALBUMS");

	$qstring = "SELECT * FROM Albumtable WHERE AlbumArtistindex = '".$matches[1]."' AND Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex = Albumtable.Albumindex AND Tracktable.Uri IS NOT NULL AND Tracktable.Hidden = 0)";
	if ($prefs['sortbydate'] == "false" ||
		($va && $prefs['notvabydate'] == "true")) {
		$qstring .= ' ORDER BY LOWER(Albumname)';
	} else {
		$qstring .= ' ORDER BY Year, LOWER(Albumname)';
	}

	if ($result = mysqli_query($mysqlc, $qstring)) {
		$count = 0;
		while ($obj = mysqli_fetch_object($result)) {
			if ($fragment === false) {
				albumHeader(
					$obj->Albumname,
					rawurlencode($obj->Spotilink),
					"aalbum".$obj->Albumindex,
					$obj->IsOneFile,
					(file_exists('albumart/small/'.$obj->ImgKey.'.jpg')) ? "yes" : "no",
					$obj->Searched == 1 ? "yes" : "no",
					$obj->ImgKey,
					'albumart/small/'.$obj->ImgKey.'.jpg',
					$obj->Year
				);
			} else {
				if ($obj->Albumindex != $fragment) {
					$singleheader['where'] = 'aalbum'.$obj->Albumindex;
					$singleheader['type'] = 'insertAfter';
				} else {
					ob_start();
					albumHeader(
						$obj->Albumname,
						rawurlencode($obj->Spotilink),
						"aalbum".$obj->Albumindex,
						$obj->IsOneFile,
						(file_exists('albumart/small/'.$obj->ImgKey.'.jpg')) ? "yes" : "no",
						$obj->Searched == 1 ? "yes" : "no",
						$obj->ImgKey,
						'albumart/small/'.$obj->ImgKey.'.jpg',
						$obj->Year
					);
					$singleheader['html'] = printHeaders().ob_get_contents().printTrailers();
					ob_end_clean();
					return $singleheader;
				}
			}
			$count++;
		}
        if ($count == 0) {
            noAlbumsHeader();
        }
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	}
}

function get_list_of_albums($aid) {
	global $mysqlc;
	$vals = array();
	$qstring = "SELECT * FROM Albumtable WHERE AlbumArtistindex = '".$aid."' GROUP BY ImgKey ORDER BY LOWER(Albumname)";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($v = mysqli_fetch_assoc($result)) {
			array_push($vals, $v);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $vals;
}

function get_album_tracks_from_database($index) {
	global $mysqlc;
	$retarr = array();
	debug_print("Getting Album Tracks for Albumindex ".$index,"MYSQL");
	$qstring = "SELECT Uri FROM Tracktable WHERE Albumindex = '".$index."' AND Uri IS NOT NULL AND Hidden=0 ORDER BY Disc, TrackNo";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			if (preg_match('/\.cue$/', (string) $obj->Uri)) {
				array_push($retarr, "load ".$obj->Uri);
			} else {
				array_push($retarr, "add ".$obj->Uri);
			}
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retarr;
}

function get_artist_tracks_from_database($index) {
	global $mysqlc;
	global $prefs;
	$retarr = array();
	debug_print("Getting Tracks for AlbumArtist ".$index,"MYSQL");

	$qstring = "SELECT Artistname FROM Artisttable WHERE Artistindex = '".$index."'";
	$va = false;
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			if ($obj->Artistname == "Various Artists") {
				$va = true;
			}
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
        return $retarr;
	}

	$qstring = "SELECT Uri FROM Tracktable JOIN Albumtable ON Tracktable.Albumindex = Albumtable.Albumindex WHERE Albumtable.AlbumArtistindex = '".$index."' AND Uri IS NOT NULL AND Hidden=0";
	if ($prefs['sortbydate'] == "false" ||
		($va && $prefs['notvabydate'] == "true")) {
		$qstring .= ' ORDER BY LOWER(Albumname), Disc, TrackNo';
	} else {
		$qstring .= ' ORDER BY Year, LOWER(Albumname), Disc, Trackno';
	}
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($retarr, "add ".$obj->Uri);
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retarr;
}

function do_tracks_from_database($which, $fragment = false) {
	global $mysqlc;
    debug_print("Generating ".$which." from database","DUMPALBUMS");
	if ($fragment) {
		ob_start();
	}
	$a = preg_match("/aalbum(\d+)/", $which, $matches);
	if (!$a) {
        print '<h3>'.get_int_text("label_general_error").'</h3>';
	} else {
		debug_print("Looking for albumID ".$matches[1],"DUMPALBUMS");
		$qstring = "SELECT t.*, a.Artistname, b.AlbumArtistindex, b.NumDiscs, r.Rating, ti.Image FROM Tracktable AS t JOIN Artisttable AS a ON t.Artistindex = a.Artistindex JOIN Albumtable AS b ON t.Albumindex = b.Albumindex LEFT JOIN Ratingtable AS r ON r.TTindex = t.TTindex LEFT JOIN Trackimagetable AS ti ON ti.TTindex = t.TTindex WHERE t.Albumindex = '".$matches[1]."' AND Uri IS NOT NULL AND Hidden=0 ORDER BY t.Disc, t.TrackNo";
		if ($result = mysqli_query($mysqlc, $qstring)) {
			$numtracks = mysqli_num_rows($result);
			$currdisc = -1;
			$count = 0;
			while ($obj = mysqli_fetch_object($result)) {
				if (!preg_match('/\.cue$/', (string) $obj->Uri)) {
					if ($obj->NumDiscs > 1 && $obj->Disc && $obj->Disc != $currdisc) {
	                    $currdisc = $obj->Disc;
		                print '<div class="discnumber indent">Disc '.$currdisc.'</div>';
					}
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
					$count++;
				}
			}
	        if ($count == 0) {
	            noAlbumTracks();
	        }
			mysqli_free_result($result);
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	        print '<h3>'.get_int_text("label_general_error").'</h3>';
		}
	}
	if ($fragment) {
		$s = ob_get_contents();
		ob_end_clean();
		return $s;
	}
}

// function get_image_from_key($key){
// 	global $mysqlc;
// 	$qstring = "SELECT Image FROM Albumtable WHERE ImgKey = '".$key."'";
// 	$retval = null;
// 	if ($result = mysqli_query($mysqlc, $qstring)) {
// 		while ($obj = mysqli_fetch_object($result)) {
// 			$retval = $obj->Image;
// 		}
// 	} else {
// 		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
// 	}
// 	return $retval;
// }

function getAllURIs($sqlstring) {

	// Get all track URIs using a supplied SQL string. For playlist generators

	global $mysqlc;

	debug_print("Selector is ".$sqlstring,"SMART PLAYLIST");

	generic_sql_query("CREATE TEMPORARY TABLE pltemptable(TTindex INT UNSIGNED NOT NULL UNIQUE)");
	generic_sql_query("INSERT INTO pltemptable(TTindex) (".$sqlstring." AND NOT Tracktable.TTindex IN (SELECT TTindex FROM pltable) ORDER BY RAND() LIMIT 10)");
	generic_sql_query("INSERT INTO pltable (TTindex) (SELECT TTindex FROM pltemptable)");

	$uris = array();
	if ($result = mysqli_query($mysqlc, "SELECT Uri FROM Tracktable WHERE TTindex IN (SELECT TTindex FROM pltemptable)")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($uris, $obj->Uri);
			debug_print("URI : ".$obj->Uri,"SMART PLAYLIST");
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $uris;
}

function get_fave_artists() {
	global $mysqlc;
	generic_sql_query("CREATE TEMPORARY TABLE aplaytable (playtotal INT UNSIGNED, Artistindex INT UNSIGNED NOT NULL UNIQUE)");
	// Playcount > 5 in this query is totally arbitrary and may need tuning. Just trying to get the most popular artists by choosing anyone with an
	// above average number of plays, but we don't want all the 'played them a few times' artists dragging the average down.
	generic_sql_query("INSERT INTO aplaytable(playtotal, Artistindex) (SELECT SUM(Playcount) AS playtotal, Artistindex FROM (SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex) WHERE Playcount > 5) AS derived GROUP BY Artistindex)");

	$artists = array();
	if ($result = mysqli_query($mysqlc, "SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM (SELECT Playcount, Artistindex FROM Playcounttable JOIN Tracktable USING (TTindex)) AS derived GROUP BY Artistindex) AS alias JOIN Artisttable USING (Artistindex) WHERE playtot > (SELECT AVG(playtotal) FROM aplaytable) ORDER BY RAND()")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($artists, array( 'name' => $obj->Artistname, 'plays' => $obj->playtot));
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $artists;
}

function get_artist_charts() {
	global $mysqlc;
	$artists = array();
	if ($result = mysqli_query($mysqlc, "SELECT playtot, Artistname FROM (SELECT SUM(Playcount) AS playtot, Artistindex FROM (SELECT Playcount, Artistindex FROM Tracktable JOIN Playcounttable USING (TTindex)) AS arse GROUP BY Artistindex) AS cheese JOIN Artisttable USING (Artistindex) ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($artists, array( 'label_artist' => $obj->Artistname, 'soundcloud_plays' => $obj->playtot));
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $artists;
}

function get_album_charts() {
	global $mysqlc;
	$albums = array();
	if ($result = mysqli_query($mysqlc, "SELECT playtot, Albumname, Artistname, Spotilink FROM (SELECT SUM(Playcount) AS playtot, Albumindex FROM (SELECT Playcount, Albumindex FROM Tracktable JOIN Playcounttable USING (TTindex)) AS arse GROUP BY Albumindex) AS cheese JOIN Albumtable USING (Albumindex) JOIN Artisttable ON (Albumtable.AlbumArtistIndex = Artisttable.Artistindex) ORDER BY playtot DESC LIMIT 40")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($albums, array( 'label_artist' => $obj->Artistname, 'label_album' => $obj->Albumname, 'soundcloud_plays' => $obj->playtot, 'uri' => $obj->Spotilink));
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $albums;
}

function get_track_charts() {
	global $mysqlc;
	$tracks = array();
	if ($result = mysqli_query($mysqlc, "SELECT Title, Playcount, Artistname, Uri FROM Tracktable JOIN Playcounttable USING (TTIndex) JOIN Artisttable USING (Artistindex) ORDER BY Playcount DESC LIMIT 40")) {
		while ($obj = mysqli_fetch_object($result)) {
			array_push($tracks, array( 'label_artist' => $obj->Artistname, 'label_track' => $obj->Title, 'soundcloud_plays' => $obj->Playcount, 'uri' => $obj->Uri));
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $tracks;
}

function getAveragePlays() {

	global $mysqlc;
	$avgplays = 0;
	if ($result = mysqli_query($mysqlc, "SELECT avg(Playcount) as avgplays FROM Playcounttable")) {
		while ($obj = mysqli_fetch_object($result)) {
			$avgplays = $obj->avgplays;
			debug_print("Average Plays is ".$avgplays, "SMART PLAYLIST");
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return round($avgplays, 0, PHP_ROUND_HALF_DOWN);
}

function find_artist_from_album($albumid) {
	global $mysqlc;
	$retval = null;
	$qstring = "SELECT AlbumArtistindex FROM Albumtable WHERE Albumindex = '".$albumid."'";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$retval = $obj->AlbumArtistindex;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function find_album_from_track($ttid) {
	global $mysqlc;
	$retval = null;
	$qstring = "SELECT Albumindex FROM Tracktable WHERE TTindex = '".$ttid."'";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$retval = $obj->Albumindex;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function remove_ttid($ttid) {

	// Remove a track from the database.
	// Doesn't do any cleaning up.
	// You should call remove_cruft afterwards to remove orphaned
	// artists and albums

	global $mysqlc;
	$retval = false;
	debug_print("Removing track ".$ttid,"MYSQL");
	$result = mysqli_query($mysqlc, "SELECT Playcount FROM Playcounttable WHERE TTindex=".$ttid);
	if (mysqli_num_rows($result) > 0) {
		debug_print("  Track has a playcount. Hiding it instead","MYSQL");
		if ($result = mysqli_query($mysqlc, "UPDATE Tracktable SET Hidden = 1 WHERE TTindex = '".$ttid."'")) {
			// These probably aren't necessary as remove_cruft should get rid of this
			// generic_sql_query("DELETE FROM Ratingtable WHERE TTindex=".$ttid);
			// generic_sql_query("DELETE FROM TagListtable WHERE TTindex=".$ttid);
			$retval = true;
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	} else {
		if ($result = mysqli_query($mysqlc, "DELETE FROM Tracktable WHERE TTindex = '".$ttid."'")) {
			$retval = true;
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	}
	return $retval;
}

//
// Database Global Stats and Version Control
//

function update_track_stats() {
	debug_print("Updating Track Stats","MYSQL");
	global $mysqlc;
	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumArtists FROM (SELECT DISTINCT AlbumArtistIndex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0) AS t")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumArtists;
		}
		update_stat('ArtistCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumAlbums FROM (SELECT DISTINCT Albumindex FROM Albumtable INNER JOIN Tracktable USING (Albumindex) WHERE Albumname IS NOT NULL AND Uri IS NOT NULL AND Hidden = 0) AS t")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumAlbums;
		}
		update_stat('AlbumCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumTracks;
		}
		update_stat('TrackCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL AND Hidden=0")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->TotalTime;
		}
		update_stat('TotalTime',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	debug_print("Track Stats Updated","MYSQL");

}

function update_stat($item, $value) {
	generic_sql_query("UPDATE Statstable SET Value='".$value."' WHERE Item='".$item."'");
}

function get_stat($item) {
	global $mysqlc;
	$retval = 0;
	if ($result = mysqli_query($mysqlc, "SELECT Value FROM Statstable WHERE Item = '".$item."'")) {
		while ($obj = mysqli_fetch_object($result)) {
			$retval = $obj->Value;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

//
// Stuff to do with creating the database from a music collection (collection.php)
//

function put_progress($f) {
    $xml = '<?xml version="1.0" encoding="utf-8"?><progress><percent>';
    $xml = $xml . $f;
    $xml = $xml . '</percent></progress>';
    $fp = fopen('prefs/colprog.xml', 'w');
    if ($fp) {
    	$crap = true;
    	if (flock($fp, LOCK_EX, $crap)) {
		    fwrite($fp, $xml);
		    flock($fp, LOCK_UN);
    	}
    }
    fclose($fp);
}

function doDatabaseMagic() {
    global $collection;
    global $LISTVERSION;
    global $mysqlc;
    global $prefs;

    $now = time();
	generic_sql_query("CREATE TEMPORARY TABLE Foundtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex)) ENGINE MEMORY");

    $artistlist = $collection->getSortedArtistList();
    $ac = 0;
    foreach($artistlist as $artistkey) {
        do_artist_database_stuff($artistkey, $now);
        $ac++;
        put_progress((($ac/count($artistlist))*50)+50);
    }

    // Find tracks that have been removed
    debug_print("Finding tracks that have been deleted","MYSQL");

    // Hide tracks that have playcounts
    generic_sql_query("UPDATE Tracktable SET Hidden = 1 WHERE LastModified IS NOT NULL AND TTindex NOT IN (SELECT TTindex FROM Foundtracks) AND TTindex IN (SELECT TTindex FROM Playcounttable)");

    generic_sql_query("DELETE FROM Tracktable WHERE LastModified IS NOT NULL AND TTindex NOT IN (SELECT TTindex FROM Foundtracks) AND Hidden = 0");

    remove_cruft();
	update_stat('ListVersion',$LISTVERSION);
	update_track_stats();
	$dur = format_time(time() - $now);
	debug_print("Database Update Took ".$dur,"MYSQL");

}

function remove_cruft() {
    debug_print("Removing orphaned albums","MYSQL");
    // NOTE - the Albumindex IS NOT NULL is essential - if any albumindex is NULL the entire () expression returns NULL
    generic_sql_query("DELETE FROM Albumtable WHERE Albumindex NOT IN (SELECT DISTINCT Albumindex FROM Tracktable WHERE Albumindex IS NOT NULL)");

    debug_print("Removing orphaned artists","MYSQL");

    $t = time();
	generic_sql_query("CREATE TEMPORARY TABLE Croft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) SELECT Artistindex FROM Tracktable UNION SELECT AlbumArtistindex FROM Albumtable");
	$dur = format_time(time() - $t);
	debug_print("Croft table creation took ".$dur,"MYSQL");

    $t = time();
	// TODO
	// Try this syntax:
	// CREATE TEMPORARY TABLE Cruft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) SELECT Artisttable.Artistindex FROM Artisttable LEFT JOIN Croft ON Artisttable.Artistindex = Croft.Artistindex WHERE Croft.Artistindex IS NULL
	generic_sql_query("CREATE TEMPORARY TABLE Cruft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) SELECT Artistindex FROM Artisttable WHERE Artistindex NOT IN (SELECT Artistindex FROM Croft)");
	$dur = format_time(time() - $t);
	debug_print("Cruft table creation took ".$dur,"MYSQL");

    $t = time();
	generic_sql_query("DELETE Artisttable FROM Artisttable INNER JOIN Cruft ON Artisttable.Artistindex = Cruft.Artistindex");
	$dur = format_time(time() - $t);
	debug_print("Artist deletion took ".$dur,"MYSQL");

    debug_print("Tidying tags and ratings","MYSQL");
    generic_sql_query("DELETE FROM Ratingtable WHERE Rating = '0'");
	generic_sql_query("DELETE FROM Ratingtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)");
	generic_sql_query("DELETE FROM TagListtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable WHERE Hidden = 0)");
	generic_sql_query("DELETE FROM Tagtable WHERE Tagindex NOT IN (SELECT Tagindex FROM TagListtable)");
	generic_sql_query("DELETE FROM Playcounttable WHERE Playcount = '0'");
	generic_sql_query("DELETE FROM Playcounttable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)");
	generic_sql_query("DELETE FROM Trackimagetable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)");
}

function do_artist_database_stuff($artistkey, $now) {
    global $collection;
    global $mysqlc;
    $artistname = $collection->artistName($artistkey);

    // CHECK. This prevents us creating artists when those artists have no albums with tracks.
    // These MIGHT BE artists who appear only on compilations. Need to make sure a new database
    // works when we do this - the track artist should get checked lower down so we're probably OK.
    // It speeds things up a bit and stops us unnecessarily creating artists when certain backends
    // return only albums.
    if ($collection->artistNumTracks($artistkey) == 0) {
    	debug_print("Artist ".$artistname." has no tracks. Ignoring him or her or it","MYSQL");
    	return false;
    }

    $albumlist = array();
    $showartist = false;
    if ($artistkey == "various artists") {
		$albumlist = $collection->getAlbumList($artistkey, false);
		$showartist = true;
    } else {
	    $albumlist = $collection->getAlbumList($artistkey, true);
    }

	if ($stmt = mysqli_prepare($mysqlc, "UPDATE Tracktable SET Trackno=?, Duration=?, LastModified=?, Disc=?, Uri=?, Albumindex=?, Hidden=0 WHERE TTindex=?")) {
	} else {
        debug_print("    MYSQL Statement Error: ".mysqli_error($mysqlc),"MYSQL");
        return false;
	}

	// First find tracks that we already have ...
	if ($find_track = mysqli_prepare($mysqlc, "SELECT TTindex, LastModified, Hidden FROM Tracktable WHERE Title=? AND ((Albumindex=? AND TrackNo=?)".
	// ... then tracks that are in the wishlist. These will have TrackNo as NULL but Albumindex might not be.
		" OR (Artistindex=? AND TrackNo IS NULL AND Uri IS NULL))")) {
	} else {
        debug_print("    MYSQL Statement Error: ".mysqli_error($mysqlc),"MYSQL");
        return false;
	}
	// NOTE that SQL OR is not C-Style || - both sides of the OR will be evaluated. This probably doesn't matter.

    $artistindex = check_artist($artistname, false);
    if ($artistindex == null) {
    	debug_print("ERROR! Checked artist and index is still null!","MYSQL");
        return false;
    }

    foreach($albumlist as $album) {

    	if ($album->trackCount() == 0) {
    		// This is nother of those things that can happen with some mopidy backends
    		// that return search results as an album only. Internet Archive is one such
    		// and many radio backends are also the same. We don't want these in the database;
    		// they don't get added even without this check because there are no tracks BUT
    		// the album does get created and then remove_cruft has to delete it again).
    		debug_print("Album ".$album->name." has no tracks. Ignoring it","MYSQL");
    		continue;
    	}

        $albumindex = check_album(
            $album->name,
            $artistindex,
            $album->spotilink,
            $album->getImage('small'),
            $album->getDate(),
            $album->isOneFile() ? 1 : 0,
            "0",
            md5($album->artist." ".$album->name),
            $album->musicbrainz_albumid,
            $album->sortTracks(),
            $album->domain
        );

        if ($albumindex == null) {
        	debug_print("ERROR! Album index is still null!","MYSQL");
    		continue;
        }

        foreach($album->tracks as $trackobj) {
            $trackartistindex = null;
            $ttid = null;
            $lastmodified = null;
            $hidden = 0;

            // Why are we not checking by URI? That should be unique, right?
            // Well, er. no. They're not. Especially Spotify returns the same URI multiple times if it's in mutliple playlists
            // We CANNOT HANDLE that. Nor do we want to.

            // The other advantage of this is that we can put an INDEX on Albumindex, TrackNo, and Title, which we can't do with Uri cos it's too long
            // - this speeds the whole process up by a factor of about 32 (9 minutes when checking by URI vs 15 seconds this way, on my collection)
            // Also, URIs might change if the user moves his music collection.

            // debug_print("Checking for track ".$trackobj->name." ".$trackobj->number." ".$trackobj->url,"MYSQL");

            mysqli_stmt_bind_param($find_track, "siii", $trackobj->name, $albumindex, $trackobj->number, $artistindex);
			if (mysqli_stmt_execute($find_track)) {
			    mysqli_stmt_bind_result($find_track, $ttid, $lastmodified, $hidden);
			    mysqli_stmt_store_result($find_track);
			    while (mysqli_stmt_fetch($find_track)) {
			    	// PHP is the retarded bastard offspring of Perl and BASIC.
			    	// And not even BBC Basic. No. Microsoft Quick Basic.
			    }
			} else {
                debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
                continue;
	        }

		    if ($ttid) {
		    	if ($lastmodified === null ||
		    		$trackobj->lastmodified != $lastmodified ||
		    		$hidden == 1 ||
		    		$trackobj->needsupdate) {
			    	debug_print("  Updating track with ttid ".$ttid,"MYSQL");
					mysqli_stmt_bind_param($stmt, "iiiisii", $trackobj->number, $trackobj->duration, $trackobj->lastmodified, $trackobj->disc, $trackobj->url, $albumindex, $ttid);
					if (mysqli_stmt_execute($stmt)) {
						// debug_print("    Updated track","MYSQL");
					} else {
		                debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
					}
				}
		    } else {
		    	// debug_print("  Track not found","MYSQL");
                if (($showartist ||
                    ($artistname != null && ($artistname != $trackobj->artist))) &&
                    ($trackobj->artist != null && $trackobj->artist != '.' && $trackobj->artist != "")
                ){
                    $trackartistindex = check_artist($trackobj->artist, false);
                } else {
                    $trackartistindex = $artistindex;
                }
                if ($trackartistindex == null) {
		        	debug_print("ERROR! Trackartistindex is still null!","MYSQL");
                    continue;
                }
                $trackuri = $trackobj->url;
                if ($trackobj->playlist && count($album->tracks == 1)) {
                	$trackuri = $trackobj->playlist;
                }
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
                    $trackuri,
                    $trackartistindex,
                    $artistindex,
                    $albumindex,
                    null,
                    null,
                    null,
                    $trackobj->lastmodified,
                    $trackobj->disc,
                    null,
                    null,
                    null,
                    0,
                    null
                );

		    }

		    if ($ttid == null) {
		    	debug_print("ERROR! No ttid for track ".$trackobj->name,"MYSQL");
		    } else {
		    	generic_sql_query("INSERT INTO Foundtracks (TTindex) VALUES (".$ttid.")", false);
		    }
        }
    }
}

function dumpAlbums($which) {

    global $divtype;
    global $ARTIST;
    global $ALBUM;

    print printHeaders();
    $t = substr($which,1,3);
    if ($which == 'aalbumroot' || $which == 'balbumroot') {
        if ($which == 'aalbumroot') {
            print '<div class="menuitem"><h3>'.get_int_text("button_local_music").'</h3></div>';
        } else if ($which == 'balbumroot') {
            print '<div class="menuitem"><h3>'.get_int_text("label_searchresults").'</h3></div>';
        }
        print '<div id="fothergill">';
        print alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
        print '</div>';
        do_artists_from_database($which);
    } else  if ($t == "art") {
        do_albums_from_database($which);
    } else {
        do_tracks_from_database($which);
    }
    print printTrailers();
}

function createAlbumsList($file, $prefix) {
	doDatabaseMagic();
}

function getItemsToAdd($which) {
    $t = substr($which, 1, 3);
    if ($t == "art") {
        $a = preg_match("/aartist(\d+)/", $which, $matches);
        if (!$a) {
            return array();
        }
        return get_artist_tracks_from_database($matches[1]);
    } else {
        $a = preg_match("/aalbum(\d+)/", $which, $matches);
        if (!$a) {
            return array();
        }
        return get_album_tracks_from_database($matches[1]);
    }

}

function printHeaders() {
    return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'.
           '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">'.
           '<head>'.
           '<meta http-equiv="cache-control" content="max-age=0" />'.
           '<meta http-equiv="cache-control" content="no-cache" />'.
           '<meta http-equiv="expires" content="0" />'.
           '<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />'.
           '<meta http-equiv="pragma" content="no-cache" />'.
           '</head>'.
           '<body>';
}

function printTrailers() {
    return '</body></html>';

}

function send_list_updates($artist_created, $album_created, $ttid, $send = true) {
	global $mysqlc;
	global $returninfo;
	if (!array_key_exists('inserts', $returninfo)) {
		$returninfo['inserts'] = array();
	}
	if ($artist_created !== false) {
		debug_print("Artist was created","USER RATING");
		// We had to create a new albumartist, so we send back the artist HTML header
		// We need to know the artist details and where in the list it is supposed to go.
		array_push($returninfo['inserts'], do_artists_from_database($artist_created));
	} else if ($album_created !== false) {
		debug_print("Album was created","USER RATING");
		// Find the artist
		$artistid = find_artist_from_album($album_created);
		if ($artistid === null) {
			debug_print("ERROR - no artistID found!","USER RATING");
		} else {
			array_push($returninfo['inserts'], do_albums_from_database('aartist'.$artistid, $album_created));
		}
	}  else {
		debug_print("A Track was modified","USER RATING");
		$albumid = find_album_from_track($ttid);
		if ($albumid === null) {
			debug_print("ERROR - no albumID found!","USER RATING");
		} else {
			array_push($returninfo['inserts'], array( 'type' => 'insertInto', 'where' => 'aalbum'.$albumid,
			'html' => printHeaders().do_tracks_from_database('aalbum'.$albumid, true).printTrailers()));
		}
	}
	if ($send) {
		$returninfo['stats'] = alistheader(get_stat('ArtistCount'), get_stat('AlbumCount'), get_stat('TrackCount'), format_time(get_stat('TotalTime')));
		if ($ttid) $returninfo['metadata'] = get_all_data($ttid);
		print json_encode($returninfo);
	}
}

?>