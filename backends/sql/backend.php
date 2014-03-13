<?php

include( "backends/sql/connect.php");
connect_to_database();
$artist_created = false;
$album_created = false;
$backend_in_use = "sql";

// In the following, we're using a mixture of prepared statement (mysqli_prepare) and just raw queries.
// Raw queries are easier to handle in many cases, but prepared statements take a lot of fuss away
// when dealing with strings, as it automatically escapes everything.

function find_item($uri,$title,$artist,$album,$urionly = false) {
	debug_print("Looking for item","MYSQL");
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
						  $trackai = null, $albumai = null, $albumi = null, $isonefile = null, $searched = null,
						  $imagekey = null, $lastmodified = null, $disc = null, $ambid = null, $numdiscs = null, $domain = null,
						  $directory = null) {
	debug_print("Adding New Track ".$title." ".$trackno,"MYSQL");
	global $mysqlc;
	global $artist_created;

	if ($albumai == null) {
		// Does the albumartist exist?
		$albumai = check_artist($albumartist, true);
		// For when we add new album artists...
		// Need to check whether the artist we now have has any albums associated with him
		// - we need to know if we've added a new albumartist so we can return the correct
		// html fragment to the javascript
		if ($result = mysqli_query($mysqlc, "SELECT Albumindex FROM Albumtable WHERE AlbumArtistindex = '".$albumai."'")) {
			if (mysqli_num_rows($result) == 0) {
				debug_print("We added a new album artist or we're using a new album artist","MYSQL");
				$artist_created = $albumai;
			}
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}

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
			$albumi = check_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $ambid, $numdiscs, $domain, $directory);
			if ($albumi == null) {
				return null;
			}
		}
	}

	$retval = null;
	if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Tracktable (Title, Albumindex, Trackno, Duration, Artistindex, Uri, LastModified, Disc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")) {
		mysqli_stmt_bind_param($stmt, "siiiisii", $title, $albumi, $trackno, $duration, $trackai, $uri, $lastmodified, $disc);
		if (mysqli_stmt_execute($stmt)) {
			$retval = mysqli_insert_id($mysqlc);
			debug_print("Created track with TTindex ".$retval,"MYSQL");
		} else {
			debug_print("    MYSQL Error on track creation: ".mysqli_error($mysqlc),"MYSQL");
		}
	    mysqli_stmt_close($stmt);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
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
			debug_print("Created artist with Artistindex ".$retval,"MYSQL");
		    mysqli_stmt_close($stmt);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function check_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain, $directory) {
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
			$index = create_new_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain, $directory);
	    }
	}
	return $index;
}

function create_new_album($album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain, $directory) {
	global $mysqlc;
	global $album_created;
	$retval = null;
	if ($stmt = mysqli_prepare($mysqlc, "INSERT INTO Albumtable (Albumname, AlbumArtistindex, Spotilink, Image, Year, IsOneFile, Searched, ImgKey, mbid, NumDiscs, Domain, Directory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
		mysqli_stmt_bind_param($stmt, "sissiiississ", $album, $albumai, $spotilink, $image, $date, $isonefile, $searched, $imagekey, $mbid, $numdiscs, $domain, $directory);
		if (mysqli_stmt_execute($stmt)) {
			$retval = mysqli_insert_id($mysqlc);
			debug_print("Created Album with Albumindex ".$retval,"MYSQL");
			$album_created = $retval;
		    mysqli_stmt_close($stmt);
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

function set_attribute($ttid, $attribute, $value) {

	// NOTE:
	// This function can only be used for integers!
	// It will set value for an EXISTING attribute to 0, but it will NOT create a NEW attribute
	// when $value is 0. This is because 0 is meant to represent 'no attribute'
	// and this keeps tha table size down and ALSO means import functions
	// can cause new tracks to be added just by tring to set eg Rating to 0.

	global $mysqlc;
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
	if ($result = mysqli_query($mysqlc, "SELECT t.Name, a.Artistname, tr.Title, al.Albumname, al.Image FROM Tagtable AS t JOIN TagListtable AS tl USING (Tagindex) JOIN Tracktable AS tr USING (TTindex) JOIN Albumtable AS al USING (Albumindex) JOIN Artisttable AS a ON (tr.Artistindex = a.Artistindex) ORDER BY t.Name, a.Artistname, al.Albumname, tr.TrackNo
")) {
		while ($obj = mysqli_fetch_object($result)) {
			if (!array_key_exists($obj->Name, $tags)) {
				$tags[$obj->Name] = array();
			}
			array_push($tags[$obj->Name], array(
				'Title' => $obj->Title,
				'Album' => $obj->Albumname,
				'Artist' => $obj->Artistname,
				'Image' => $obj->Image
			));
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $tags;
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

function generic_sql_query($qstring, $log = true) {
	global $mysqlc;
	if ($log) debug_print($qstring,"SQL_QUERY");
	if ($result = mysqli_query($mysqlc, $qstring)) {
		if ($log) debug_print("Done : ".mysqli_affected_rows($mysqlc)." rows affected","MYSQL");
		return true;
	} else {
		if ($log) debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		return false;
	}

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

	return $data;
}

function get_imagesearch_info($key) {

	// Used by getalbumcover.php to get album and artist names etc based on an Image Key

	global $mysqlc;
	$retval = array(false, null, null, null, null, null, false);
	if ($result = mysqli_query($mysqlc, "SELECT Artistname, Albumname, mbid, Directory, Spotilink FROM Albumtable JOIN Artisttable ON AlbumArtistindex = Artistindex WHERE ImgKey = '".$key."'")) {
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
				$p = $obj->Directory;
				// Make sure it's not a spotify/gmusic/whatever
				if (!preg_match('/\w+?:album/', $p)) {
					$retval[4] = $p;
				}
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

function update_image_db($key, $notfound, $imagefile) {
	global $mysqlc;
	$val = ($notfound == 0) ? $imagefile : null;
	if ($stmt = mysqli_prepare($mysqlc, "UPDATE Albumtable SET Image=?, Searched = 1 WHERE ImgKey=?")) {
		mysqli_stmt_bind_param($stmt, "ss", $val, $key);
		if (mysqli_stmt_execute($stmt)) {
			debug_print("    Database Image URL Updated","MYSQL");
		} else {
	        debug_print("    MYSQL Execution Error: ".mysqli_error($mysqlc),"MYSQL");

		}
	    mysqli_stmt_close($stmt);
	} else {
        debug_print("    MYSQL Statement Error: ".mysqli_error($mysqlc),"MYSQL");
	}

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
    $qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex WHERE t.Uri IS NOT NULL ";
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
    $qstring = "SELECT a.Artistname, a.Artistindex FROM Artisttable AS a JOIN Albumtable AS al ON a.Artistindex = al.AlbumArtistindex JOIN Tracktable AS t ON al.Albumindex = t.Albumindex WHERE t.Uri IS NOT NULL ";
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

	$qstring = "SELECT * FROM Albumtable WHERE AlbumArtistindex = '".$matches[1]."' AND Albumindex IN (SELECT Albumindex FROM Tracktable WHERE Tracktable.Albumindex = Albumtable.Albumindex AND Tracktable.Uri IS NOT NULL)";
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
					$obj->Image == null ? "no" : "yes",
					$obj->Searched == 1 ? "yes" : "no",
					$obj->ImgKey,
					$obj->Image,
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
						$obj->Image == null ? "no" : "yes",
						$obj->Searched == 1 ? "yes" : "no",
						$obj->ImgKey,
						$obj->Image,
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
	$qstring = "SELECT Uri FROM Tracktable WHERE Albumindex = '".$index."' AND Uri IS NOT NULL ORDER BY Disc, TrackNo";
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

	$qstring = "SELECT Uri FROM Tracktable JOIN Albumtable ON Tracktable.Albumindex = AlbumTable.Albumindex WHERE Albumtable.AlbumArtistindex = '".$index."' AND Uri IS NOT NULL";
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
		$qstring = "SELECT t.*, a.Artistname, b.AlbumArtistindex, b.NumDiscs, r.Rating FROM Tracktable AS t JOIN Artisttable AS a ON t.Artistindex = a.Artistindex JOIN Albumtable AS b ON t.Albumindex = b.Albumindex LEFT JOIN Ratingtable AS r ON r.TTindex = t.TTindex WHERE t.Albumindex = '".$matches[1]."' AND Uri IS NOT NULL ORDER BY t.Disc, t.TrackNo";
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
						$obj->LastModified
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

function get_image_from_key($key){
	global $mysqlc;
	$qstring = "SELECT Image FROM Albumtable WHERE ImgKey = '".$key."'";
	$retval = null;
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$retval = $obj->Image;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

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
	if ($result = mysqli_query($mysqlc, "DELETE FROM Tracktable WHERE TTindex = '".$ttid."'")) {
		$retval = true;
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

//
// Initialisation
//

function check_sql_tables() {

	// Check all our tables exist and create them if necessary

	global $mysqlc;
	if ($mysqlc) {

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tracktable(".
			"TTindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
			"PRIMARY KEY(TTindex), ".
			"Title VARCHAR(255), ".
			"Albumindex INT UNSIGNED, ".
			"TrackNo SMALLINT UNSIGNED, ".
			"Duration INT UNSIGNED, ".
			"Artistindex INT UNSIGNED, ".
			"Disc TINYINT(3) UNSIGNED, ".
			"Uri VARCHAR(2000) ,".
			"LastModified INT UNSIGNED, ".
			"INDEX(Albumindex), ".
			"INDEX(Title), ".
			"INDEX(TrackNo), ".
			"INDEX(Disc)) ENGINE=InnoDB"))
		{
			debug_print("  Tracktable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Albumtable(".
			"Albumindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
			"PRIMARY KEY(Albumindex), ".
			"Albumname VARCHAR(255), ".
			"Directory VARCHAR(255), ".
			"AlbumArtistindex INT UNSIGNED, ".
			"Image VARCHAR(255), ".
			"Spotilink VARCHAR(255), ".
			"Year YEAR, ".
			"IsOneFile TINYINT(1) UNSIGNED, ".
			"Searched TINYINT(1) UNSIGNED, ".
			"ImgKey CHAR(32), ".
			"mbid CHAR(40), ".
			"NumDiscs TINYINT(2), ".
			"Domain CHAR(32), ".
			"INDEX(Albumname), ".
			"INDEX(AlbumArtistindex), ".
			"INDEX(Domain), ".
			"INDEX(ImgKey)) ENGINE=InnoDB"))
		{
			debug_print("  Albumtable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Artisttable(".
			"Artistindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
			"PRIMARY KEY(Artistindex), ".
			"Artistname VARCHAR(255), ".
			"INDEX(Artistname)) ENGINE=InnoDB"))
		{
			debug_print("  Artisttable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Ratingtable(".
			"TTindex INT UNSIGNED, ".
			"PRIMARY KEY(TTindex), ".
			"Rating TINYINT(1) UNSIGNED) ENGINE=InnoDB"))
		{
			debug_print("  Ratingtable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tagtable(".
			"Tagindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
			"PRIMARY KEY(Tagindex), ".
			"Name VARCHAR(255)) ENGINE=InnoDB"))
		{
			debug_print("  Tagtable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS TagListtable(".
			"Tagindex INT UNSIGNED NOT NULL REFERENCES Tagtable(Tagindex), ".
			"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
			"PRIMARY KEY (Tagindex, TTindex)) ENGINE=InnoDB"))
		{
			debug_print("  TagListtable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		$result = mysqli_query($mysqlc, "SELECT * FROM information_schema.TABLES WHERE (TABLE_SCHEMA = 'romprdb') AND (TABLE_NAME = 'Statstable')");
		if (mysqli_num_rows($result) == 0) {
			debug_print("Statstable does not exist","MYSQL");
			$q = "CREATE TABLE Statstable(Item CHAR(11), PRIMARY KEY(Item), Value INT UNSIGNED) ENGINE=InnoDB";
			if (mysqli_query($mysqlc,$q)) {
				debug_print("Statstable created", "MYSQL");
			} else {
				debug_print("Error creating Statstable: ".mysqli_error($mysqlc), "MYSQL");
				mysqli_close($mysqlc);
				$mysqlc = null;
				return false;
			}
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ListVersion', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ArtistCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('AlbumCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TrackCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TotalTime', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '1')");
		} else {
			debug_print("Statstable OK","MYSQL");
		}

	}
}

function check_albumslist() {
	global $mysqlc;
	global $LISTVERSION;
	$retval = "false";
	if ($result = mysqli_query($mysqlc, "SELECT Value FROM Statstable WHERE Item = 'ListVersion'")) {
		if (mysqli_num_rows($result) > 0) {
			$lv = 0;
			while ($obj = mysqli_fetch_object($result)) {
				$lv = $obj->Value;
			}
			if ($lv == $LISTVERSION) {
				debug_print("Albums List is OK","MYSQL");
				//update_track_stats();
				$retval = "true";
			} else {
				debug_print("Albums list is out of date", "MYSQL");
			}
		} else {
			debug_print("No stored value for ListVersion","MYSQL");
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}
	return $retval;
}

//
// Database Global Stats and Version Control
//

function update_track_stats() {
	debug_print("Updating Track Stats","MYSQL");
	global $mysqlc;
	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumArtists FROM Artisttable")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumArtists;
		}
		update_stat('ArtistCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumAlbums FROM Albumtable")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumAlbums;
		}
		update_stat('AlbumCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT COUNT(*) AS NumTracks FROM Tracktable WHERE Uri IS NOT NULL")) {
		$ac = 0;
		while ($obj = mysqli_fetch_object($result)) {
			$ac = $obj->NumTracks;
		}
		update_stat('TrackCount',$ac);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	if ($result = mysqli_query($mysqlc, "SELECT SUM(Duration) AS TotalTime FROM Tracktable WHERE Uri IS NOT NULL")) {
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

function doDatabaseMagic() {
    global $collection;
    global $LISTVERSION;
    global $mysqlc;
    global $prefs;

    $now = time();
	generic_sql_query("CREATE TEMPORARY TABLE Foundtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex)) ENGINE MEMORY");

    $artistlist = $collection->getSortedArtistList();
    foreach($artistlist as $artistkey) {
        do_artist_database_stuff($artistkey, $now);
    }

    // Find tracks that have been removed
    debug_print("Finding tracks that have been deleted","MYSQL");
    generic_sql_query("DELETE FROM Tracktable WHERE LastModified IS NOT NULL AND TTindex NOT IN (SELECT TTindex FROM Foundtracks)");

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
	generic_sql_query("CREATE TEMPORARY TABLE Cruft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) SELECT Artistindex FROM Artisttable WHERE Artistindex NOT IN (SELECT Artistindex FROM Croft)");
	$dur = format_time(time() - $t);
	debug_print("Cruft table creation took ".$dur,"MYSQL");

    $t = time();
	generic_sql_query("DELETE Artisttable FROM Artisttable INNER JOIN Cruft ON Artisttable.Artistindex = Cruft.Artistindex");
	$dur = format_time(time() - $t);
	debug_print("Artist deletion took ".$dur,"MYSQL");

    debug_print("Tidying tags and ratings","MYSQL");
    generic_sql_query("DELETE FROM Ratingtable WHERE Rating = '0'");
	generic_sql_query("DELETE FROM Ratingtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)");
	generic_sql_query("DELETE FROM TagListtable WHERE TTindex NOT IN (SELECT TTindex FROM Tracktable)");
	generic_sql_query("DELETE FROM Tagtable WHERE Tagindex NOT IN (SELECT Tagindex FROM TagListtable)");
}

function do_artist_database_stuff($artistkey, $now) {
    global $collection;
    global $mysqlc;
    $artistname = $collection->artistName($artistkey);
    $albumlist = array();
    $showartist = false;
    if ($artistkey == "various artists") {
		$albumlist = $collection->getAlbumList($artistkey, false);
		$showartist = true;
    } else {
	    $albumlist = $collection->getAlbumList($artistkey, true);
    }

	if ($stmt = mysqli_prepare($mysqlc, "UPDATE Tracktable SET Trackno=?, Duration=?, LastModified=?, Disc=?, Uri=?, Albumindex=? WHERE TTindex=?")) {
	} else {
        debug_print("    MYSQL Statement Error: ".mysqli_error($mysqlc),"MYSQL");
        return false;
	}

	// First find tracks that we already have ...
	if ($find_track = mysqli_prepare($mysqlc, "SELECT TTindex, LastModified FROM Tracktable WHERE Title=? AND ((Albumindex=? AND TrackNo=? AND Disc=?)".
	// ... then tracks that are in the wishlist. These will have TrackNo as NULL but Albumindex might not be.
		" OR (Artistindex=? AND TrackNo IS NULL))")) {
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
            $album->domain,
            $album->folder
        );
        if ($albumindex == null) {
        	debug_print("ERROR! Album index is still null!","MYSQL");
            return false;
        }

        foreach($album->tracks as $trackobj) {
            $trackartistindex = null;
            $ttid = null;
            $lastmodified = null;

            // Why are we not checking by URI? That should be unique, right?
            // Well, er. no. They're not. Especially Spotify returns the same URI multiple times if it's in mutliple playlists
            // We CANNOT HANDLE that. Nor do we want to.

            // The other advantage of this is that we can put an INDEX on Albumindex, TrackNo, Disc, and Title, which we can't do with Uri cos it's too long
            // - this speeds the whole process up by a factor of about 32 (9 minutes when checking by URI vs 15 seconds this way, on my collection)
            // Also, URIs might change if the user moves his music collection.

            // debug_print("Checking for track ".$trackobj->name." ".$trackobj->number." ".$trackobj->url,"MYSQL");

            mysqli_stmt_bind_param($find_track, "siiii", $trackobj->name, $albumindex, $trackobj->number, $trackobj->disc, $artistindex);
			if (mysqli_stmt_execute($find_track)) {
			    mysqli_stmt_bind_result($find_track, $ttid, $lastmodified);
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
		    	if ($lastmodified === null || $trackobj->lastmodified != $lastmodified) {
			    	debug_print("  Updating track with ttid ".$ttid,"MYSQL");
					mysqli_stmt_bind_param($stmt, "iiiisii", $trackobj->number, $trackobj->duration, $trackobj->lastmodified, $trackobj->disc, $trackobj->url, $albumindex, $ttid);
					if (mysqli_stmt_execute($stmt)) {
						// debug_print("    Updated track","MYSQL");
					} else {
		                debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
					}
				}
		    } else {
		    	debug_print("  Track not found","MYSQL");
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
            return array();;
        }
        return get_artist_tracks_from_database($matches[1]);
    } else {
        $a = preg_match("/aalbum(\d+)/", $which, $matches);
        if (!$a) {
            return array();;
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

?>