<?php

$mysqlc = null;
$mysqlc = mysqli_connect($prefs['mysql_host'],$prefs['mysql_user'],$prefs['mysql_password'],'romprdb');
if (mysqli_connect_errno()) {
	debug_print("Failed to connect to MySQL: ".mysqli_connect_error(), "MYSQL");
	$mysqlc = null;
} else {
	debug_print("Connected to MySQL","MYSQL");
}

function doCollection($terms, $domains) {

	global $mysqlc;
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
		$qstring .= "JOIN (SELECT * FROM Ratingtable WHERE Rating >= ".$terms['rating'].") AS rat ON rat.TTindex = t.TTindex ";
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
		$qstring .= "AND a1.Artistname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['artist'][0]))."%' ";
	}
	if (array_key_exists('album', $terms)) {
		$qstring .= "AND al.Albumname LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['album'][0]))."%' ";
	}
	if (array_key_exists('track_name', $terms)) {
		$qstring .= "AND t.Title LIKE '%".mysqli_real_escape_string($mysqlc, trim($terms['track_name'][0]))."%' ";
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

	// For the wishlist - get the tracks which have no album
	if (array_key_exists('wishlist', $terms)) {
		$qstring = "SELECT t.*, a1.* FROM Tracktable AS t JOIN Artisttable AS a1 ON a1.Artistindex = t.Artistindex WHERE t.Uri IS NULL AND t.Albumindex IS NULL";
		if ($result = mysqli_query($mysqlc, $qstring)) {
			while ($obj = mysqli_fetch_object($result)) {
				$filedata = array(
					'Artist' => $obj->Artistname,
					'file' => $obj->Uri,
					'Title' => $obj->Title,
					'Track' => $obj->TrackNo,
					'Time' => $obj->Duration,
					'Last-Modified' => $obj->LastModified
				);
				process_file($collection, $filedata);
			}
			mysqli_free_result($result);
		} else {
			debug_print("    MYSQL Error: ".mysqli_error($mysqlc),"MYSQL");
		}
	}


	return $collection;

}

?>
