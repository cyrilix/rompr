<?php

include( "backends/sql/connect.php");

function doDbCollection($terms, $domains) {

	// This can actually be used to search the database for title, album, artist, anything, rating, and tag
	// But it isn't because we let Mopidy/MPD search for anything they support because otherwise we
	// have to duplicate their entire database, whcih is daft.
	// This function was written before I realised that... :)
	// It's still used for searches where we're only looking for tags and/or ratings

	global $mysqlc;
	if ($mysqlc === null) {
		connect_to_database();
	}

	$collection = new musicCollection(null);

	$qstring = "SELECT t.*, al.*, a1.*, a2.Artistname AS AlbumArtistName ";
	if (array_key_exists('rating', $terms)) {
		$qstring .= ",rat.Rating ";
	}
	$qstring .= "FROM Tracktable AS t ";
	if (array_key_exists('tag', $terms)) {
		$qstring .= "JOIN (SELECT DISTINCT TTindex FROM TagListtable JOIN Tagtable AS tag USING (Tagindex) WHERE";
		$tagterms = array();
		foreach ($terms['tag'] as $tag) {
			array_push($tagterms, " tag.Name LIKE '".mysqli_real_escape_string($mysqlc, trim($tag))."'");
		}
		$qstring .= implode(" OR",$tagterms);
		$qstring .=") AS j ON j.TTindex = t.TTindex ";
	}
	if (array_key_exists('rating', $terms)) {
		$qstring .= "JOIN (SELECT * FROM Ratingtable WHERE Rating = ".$terms['rating'].") AS rat ON rat.TTindex = t.TTindex ";
	}
	$qstring .= "JOIN Artisttable AS a1 ON a1.Artistindex = t.Artistindex ";
	$qstring .= "JOIN Albumtable AS al ON al.Albumindex = t.Albumindex ";
	$qstring .= "JOIN Artisttable AS a2 ON al.AlbumArtistindex = a2.Artistindex ";
	if (array_key_exists('wishlist', $terms)) {
		$qstring .= "WHERE t.Uri IS NULL";
	} else {
		$qstring .= "WHERE t.Uri IS NOT NULL ";
	}

	if (array_key_exists('artist', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$qstring .= "a1.Artistname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['artist'][0]))."%' ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "OR a1.Artistname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%') ";
		}
	} else if (array_key_exists('any', $terms)) {
		$qstring .= "OR a1.Artistname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%' ";
	}

	if (array_key_exists('album', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$qstring .= "al.Albumname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['album'][0]))."%' ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "OR al.Albumname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%') ";
		}
	} else if (array_key_exists('any', $terms)) {
		$qstring .= "OR al.Albumname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%' ";
	}

	if (array_key_exists('track_name', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$qstring .= "t.Title LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['track_name'][0]))."%' ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "OR t.Title LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%') ";
		}
	} else if (array_key_exists('any', $terms)) {
		$qstring .= "OR t.Title LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['any'][0]))."%' ";
	}

	if ($domains !== null) {
		$qstring .= "AND (";
		$domainterms = array();
		foreach ($domains as $dom) {
			array_push($domainterms, "t.Uri LIKE '".mysqli_real_escape_string($mysqlc, trim($dom))."%'");
		}
		$qstring .= implode(" OR ",$domainterms);
		$qstring .= ")";
	}

	debug_print("SQL Search String is ".$qstring,"SEARCH");

	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$filedata = array(
				'Artist' => $obj->Artistname,
				'Album' => $obj->Albumname,
				'AlbumArtist' => $obj->AlbumArtistName,
				'file' => $obj->Uri,
				'Title' => $obj->Title,
				'Track' => $obj->TrackNo,
				'Image' => $obj->Image,
				'Time' => $obj->Duration,
				'SpotiAlbum' => $obj->Spotilink,
				'Date' => $obj->Year,
				'Last-Modified' => $obj->LastModified
			);
			process_file($collection, $filedata);
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	return $collection;

}

function getWishlist() {

	global $mysqlc;
	if ($mysqlc === null) {
		connect_to_database();
	}

	$collection = new musicCollection(null);

	// For the wishlist - get the tracks which have no uri
	$qstring = "SELECT Tracktable.*, Artisttable.*, Albumtable.* FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable ON Tracktable.Albumindex = Albumtable.Albumindex WHERE Uri IS NULL AND Hidden = 0";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$filedata = array(
				'Artist' => $obj->Artistname,
				'file' => $obj->Uri,
				'Title' => $obj->Title,
				'Track' => $obj->TrackNo,
				'Time' => $obj->Duration,
				'Last-Modified' => $obj->LastModified,
				'Image' => $obj->Image,
				'Album' => $obj->Albumname
			);
			process_file($collection, $filedata);
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	$qstring = "SELECT Tracktable.*, Artisttable.* FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE Albumindex IS NULL AND Uri IS NULL AND Hidden = 0";
	if ($result = mysqli_query($mysqlc, $qstring)) {
		while ($obj = mysqli_fetch_object($result)) {
			$filedata = array(
				'Artist' => $obj->Artistname,
				'file' => $obj->Uri,
				'Title' => $obj->Title,
				'Track' => $obj->TrackNo,
				'Time' => $obj->Duration,
				'Last-Modified' => $obj->LastModified,
				'Image' => $obj->Image,
				'Album' => "[Unknown]"
			);
			process_file($collection, $filedata);
		}
		mysqli_free_result($result);
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
	}

	return $collection;

}

function check_url_against_database($url, $tags, $rating) {
	global $mysqlc;
	if ($mysqlc === null) {
		connect_to_database();
	}
	$qstring = "SELECT t.TTindex FROM Tracktable AS t ";
	if ($tags !== null) {
		$qstring .= "JOIN (SELECT DISTINCT TTindex FROM TagListtable JOIN Tagtable AS tag USING (Tagindex) WHERE";
		$tagterms = array();
		foreach ($tags as $tag) {
			array_push($tagterms, " tag.Name LIKE '".mysqli_real_escape_string($mysqlc, trim($tag))."'");
		}
		$qstring .= implode(" OR",$tagterms);
		$qstring .=") AS j ON j.TTindex = t.TTindex ";
	}
	if ($rating !== null) {
		$qstring .= "JOIN (SELECT * FROM Ratingtable WHERE Rating >= ".$rating.") AS rat ON rat.TTindex = t.TTindex ";
	}
	$qstring .= "WHERE t.Uri = '".mysqli_real_escape_string($mysqlc, $url)."'";
	// debug_print("SQL Search String is ".$qstring,"SEARCH");
	if ($result = mysqli_query($mysqlc, $qstring)) {
		if (mysqli_num_rows($result) > 0) {
			// debug_print("  DATABASE Match!","RESULT");
			mysqli_free_result($result);
			return true;
		} else {
			// debug_print("  DATABASE NOT Match!","RESULT");
			mysqli_free_result($result);
			return false;
		}
	} else {
		debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		return false;
	}
}
?>
