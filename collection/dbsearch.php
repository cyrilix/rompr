<?php

include( "backends/sql/connect.php");

function doDbCollection($terms, $domains) {

	// This can actually be used to search the database for title, album, artist, anything, rating, and tag
	// But it isn't because we let Mopidy/MPD search for anything they support because otherwise we
	// have to duplicate their entire database, which is daft.
	// This function was written before I realised that... :)
	// It's still used for searches where we're only looking for tags and/or ratings

	global $mysqlc;
	if ($mysqlc === null) {
		connect_to_database();
	}

	$collection = new musicCollection(null);

	$parameters = array();
	$qstring = "SELECT t.*, al.*, a1.*, a2.Artistname AS AlbumArtistName ";
	if (array_key_exists('rating', $terms)) {
		$qstring .= ",rat.Rating ";
	}
	$qstring .= "FROM Tracktable AS t ";
	if (array_key_exists('tag', $terms)) {
		$qstring .= "JOIN (SELECT DISTINCT TTindex FROM TagListtable JOIN Tagtable AS tag USING (Tagindex) WHERE";
		$tagterms = array();
		foreach ($terms['tag'] as $tag) {
			$parameters[] = trim($tag);
			array_push($tagterms, " tag.Name LIKE ?");
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
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$parameters[] = "%".trim($terms['artist'][0])."%";
		$qstring .= "a1.Artistname LIKE ? ";
		if (array_key_exists('any', $terms)) {
			$parameters[] = "%".trim($terms['any'][0])."%";
			$qstring .= "OR a1.Artistname LIKE ?) ";
		}
	} else if (array_key_exists('any', $terms)) {
		$parameters[] = "%".trim($terms['any'][0])."%";
		$qstring .= "OR a1.Artistname LIKE ? ";
	}

	if (array_key_exists('album', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$parameters[] = "%".trim($terms['album'][0])."%";
		$qstring .= "al.Albumname LIKE ? ";
		if (array_key_exists('any', $terms)) {
			$parameters[] = "%".trim($terms['any'][0])."%";
			$qstring .= "OR al.Albumname LIKE ?) ";
		}
	} else if (array_key_exists('any', $terms)) {
		$parameters[] = "%".trim($terms['any'][0])."%";
		$qstring .= "OR al.Albumname LIKE ? ";
	}

	if (array_key_exists('track_name', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$parameters[] = "%".trim($terms['track_name'][0])."%";
		$qstring .= "t.Title LIKE ? ";
		if (array_key_exists('any', $terms)) {
			$parameters[] = "%".trim($terms['any'][0])."%";
			$qstring .= "OR t.Title LIKE ?) ";
		}
	} else if (array_key_exists('any', $terms)) {
		$parameters[] = "%".trim($terms['any'][0])."%";
		$qstring .= "OR t.Title LIKE ? ";
	}

	if ($domains !== null) {
		$qstring .= "AND (";
		$domainterms = array();
		foreach ($domains as $dom) {
			$parameters[] = trim($dom)."%";
			array_push($domainterms, "t.Uri LIKE ?");
		}
		$qstring .= implode(" OR ",$domainterms);
		$qstring .= ")";
	}

	debug_print("SQL Search String is ".$qstring,"SEARCH");

	if ($result = sql_prepare_query_later($qstring)) {
		if ($result->execute($parameters)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
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
		} else {
			show_sql_error();
		}
	} else {
		show_sql_error();
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
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
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
	}

	$qstring = "SELECT Tracktable.*, Artisttable.* FROM Tracktable JOIN Artisttable USING (Artistindex) WHERE Albumindex IS NULL AND Uri IS NULL AND Hidden = 0";
	if ($result = generic_sql_query($qstring)) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
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
	}

	return $collection;

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
			if ($stmt->rowCount() > 0) {
				return true;
			} else {
				return false;
			}
		} else {
			show_sql_error();
			return false;
		}
	} else {
		show_sql_error();
		return false;
	}
}
?>
