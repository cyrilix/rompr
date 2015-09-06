<?php

function doDbCollection($terms, $domains, $resultstype) {

	// This can actually be used to search the database for title, album, artist, anything, rating, and tag
	// But it isn't because we let Mopidy/MPD search for anything they support because otherwise we
	// have to duplicate their entire database, which is daft.
	// This function was written before I realised that... :)
	// It's still used for searches where we're only looking for tags and/or ratings in conjunction with
	// any of the above terms, because mopidy often returns incomplete search results.

	global $mysqlc, $tree;
	if ($mysqlc === null) {
		connect_to_database();
	}

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
		$qstring .= "JOIN (SELECT * FROM Ratingtable WHERE Rating >= ".
			$terms['rating'].") AS rat ON rat.TTindex = t.TTindex ";
	}
	$qstring .= "JOIN Artisttable AS a1 ON a1.Artistindex = t.Artistindex ";
	$qstring .= "JOIN Albumtable AS al ON al.Albumindex = t.Albumindex ";
	$qstring .= "JOIN Artisttable AS a2 ON al.AlbumArtistindex = a2.Artistindex ";
	if (array_key_exists('wishlist', $terms)) {
		$qstring .= "WHERE t.Uri IS NULL";
	} else {
		$qstring .= "WHERE t.Uri IS NOT NULL ";
	}
	$qstring .= "AND t.Hidden = 0 AND t.isSearchResult < 2 ";
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

	if (array_key_exists('file', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$parameters[] = "%".trim($terms['file'][0])."%";
		$qstring .= "t.Uri LIKE ? ";
		if (array_key_exists('any', $terms)) {
			$parameters[] = "%".trim($terms['any'][0])."%";
			$qstring .= "OR t.Uri LIKE ?) ";
		}
	} else if (array_key_exists('any', $terms)) {
		$parameters[] = "%".trim($terms['any'][0])."%";
		$qstring .= "OR t.Uri LIKE ? ";
	}

	if (array_key_exists('albumartist', $terms)) {
		$qstring .= "AND ";
		if (array_key_exists('any', $terms)) {
			$qstring .= "(";
		}
		$parameters[] = "%".trim($terms['albumartist'][0])."%";
		$qstring .= "AlbumArtistName LIKE ? ";
		if (array_key_exists('any', $terms)) {
			$parameters[] = "%".trim($terms['any'][0])."%";
			$qstring .= "OR AlbumArtistName LIKE ?) ";
		}
	} else if (array_key_exists('any', $terms)) {
		$parameters[] = "%".trim($terms['any'][0])."%";
		$qstring .= "OR AlbumArtistName LIKE ? ";
	}

	if (array_key_exists('date', $terms)) {
		$qstring .= "AND ";
		$parameters[] = trim($terms['date'][0]);
		$qstring .= "al.Year = ? ";
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

	debuglog("SQL Search String is ".$qstring,"SEARCH");
	$fcount = 0;

	if ($result = sql_prepare_query_later($qstring)) {
		if ($result->execute($parameters)) {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				if ($resultstype == "tree") {
					$filedata = array(
						'Artist' => array($obj->Artistname),
						'Album' => $obj->Albumname,
						'AlbumArtist' => array($obj->AlbumArtistName),
						'file' => $obj->Uri,
						'Title' => $obj->Title,
						'Track' => $obj->TrackNo,
						'Image' => $obj->Image,
						'Time' => $obj->Duration,
						'AlbumUri' => $obj->AlbumUri,
						'Date' => $obj->Year,
						'Last-Modified' => $obj->LastModified
					);
                    $tree->newItem($filedata);
					$fcount++;
				} else {
					debuglog('Updating isSearchResult for TTindex '.$obj->TTindex,"DBSEARCH",8);
					generic_sql_query("UPDATE Tracktable SET isSearchResult = 1 WHERE TTindex = ".$obj->TTindex);
				}
			}
		} else {
			show_sql_error();
		}
	} else {
		show_sql_error();
	}

	return $fcount;

}
?>
