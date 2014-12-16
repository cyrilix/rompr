<?php

define('SQL_RANDOM_SORT', 'RAND()');

function connect_to_database() {
	global $mysqlc, $prefs;
	try {
		$dsn = "mysql:host=".$prefs['mysql_host'].";port=".$prefs['mysql_port'].";dbname=".$prefs['mysql_database'];
		$mysqlc = new PDO($dsn, $prefs['mysql_user'], $prefs['mysql_password']);
		debug_print("Connected to MySQL","SQL_CONNECT");
	} catch (Exception $e) {
		debug_print("Database connect failure - ".$e,"SQL_CONNECT");
		sql_init_fail($e->getMessage());
	}
}

function check_sql_tables() {
	global $mysqlc;
	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tracktable(".
		"TTindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
		"PRIMARY KEY(TTindex), ".
		"Title VARCHAR(255), ".
		"Albumindex INT UNSIGNED, ".
		"TrackNo SMALLINT UNSIGNED, ".
		"Duration INT UNSIGNED, ".
		"Artistindex INT UNSIGNED, ".
		"Disc TINYINT(3) UNSIGNED, ".
		"Uri VARCHAR(2000), ".
		"LastModified INT UNSIGNED, ".
		"Hidden TINYINT(1) UNSIGNED DEFAULT 0, ".
		"DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ".
		"INDEX(Albumindex), ".
		"INDEX(Title), ".
		"INDEX(TrackNo)) ENGINE=InnoDB"))
	{
		debug_print("  Tracktable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Tracktable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Albumtable(".
		"Albumindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
		"PRIMARY KEY(Albumindex), ".
		"Albumname VARCHAR(255), ".
		"AlbumArtistindex INT UNSIGNED, ".
		"Spotilink VARCHAR(255), ".
		"Year YEAR, ".
		"Searched TINYINT(1) UNSIGNED, ".
		"ImgKey CHAR(32), ".
		"mbid CHAR(40), ".
		"Domain CHAR(32), ".
		"Image VARCHAR(255), ".
		"INDEX(Albumname), ".
		"INDEX(AlbumArtistindex), ".
		"INDEX(Domain), ".
		"INDEX(ImgKey)) ENGINE=InnoDB"))
	{
		debug_print("  Albumtable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Albumtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Artisttable(".
		"Artistindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
		"PRIMARY KEY(Artistindex), ".
		"Artistname VARCHAR(255), ".
		"INDEX(Artistname)) ENGINE=InnoDB"))
	{
		debug_print("  Artisttable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Artisttable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Ratingtable(".
		"TTindex INT UNSIGNED, ".
		"PRIMARY KEY(TTindex), ".
		"Rating TINYINT(1) UNSIGNED) ENGINE=InnoDB"))
	{
		debug_print("  Ratingtable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Ratingtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tagtable(".
		"Tagindex INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE, ".
		"PRIMARY KEY(Tagindex), ".
		"Name VARCHAR(255)) ENGINE=InnoDB"))
	{
		debug_print("  Tagtable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Tagtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS TagListtable(".
		"Tagindex INT UNSIGNED NOT NULL REFERENCES Tagtable(Tagindex), ".
		"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
		"PRIMARY KEY (Tagindex, TTindex)) ENGINE=InnoDB"))
	{
		debug_print("  TagListtable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking TagListtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Playcounttable(".
		"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
		"Playcount INT UNSIGNED NOT NULL, ".
		"PRIMARY KEY (TTindex)) ENGINE=InnoDB"))
	{
		debug_print("  Playcounttable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Playcounttable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Trackimagetable(".
		"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
		"Image VARCHAR(500), ".
		"PRIMARY KEY (TTindex)) ENGINE=InnoDB"))
	{
		debug_print("  Trackimagetable OK","MYSQL_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Trackimagetable : ".$err);
	}

	if (!generic_sql_query("CREATE TABLE IF NOT EXISTS Statstable(Item CHAR(11), PRIMARY KEY(Item), Value INT UNSIGNED) ENGINE=InnoDB")) {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Statstable : ".$err);
	}
	// Check schema version and update tables as necessary
	$sv = 0;
	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = 'SchemaVer'")) {
		if ($result->rowCount() == 0) {
			debug_print("No Schema Version Found - initialising table","SQL_CONNECT");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ListVersion', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ArtistCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('AlbumCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TrackCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TotalTime', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '".ROMPR_SCHEMA_VERSION."')");
			$sv = ROMPR_SCHEMA_VERSION;
			debug_print("Statstable populated", "MYSQL_CONNECT");
		} else {
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$sv = $obj->Value;
			}
		}
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Database Schema Version : ".$err);
	}

	if ($sv > ROMPR_SCHEMA_VERSION) {
		debug_print("Schema Mismatch! We are version ".ROMPR_SCHEMA_VERSION." but database is version ".$sv,"MYSQL_CONNECT");
		return array(false, "Your database has version number ".$sv." but this version of rompr only handles version ".ROMPR_SCHEMA_VERSION);
	}

	while ($sv < ROMPR_SCHEMA_VERSION) {
		switch ($sv) {
			case 0:
				debug_print("BIG ERROR! No Schema Version found!!","SQL");
				return array(false, "Database Error - could not read schema version. Cannot continue.");
				break;

			case 1:
				debug_print("Updating FROM Schema version 1 TO Schema version 2","SQL");
				generic_sql_query("ALTER TABLE Albumtable DROP Directory");
				generic_sql_query("UPDATE Statstable SET Value = 2 WHERE Item = 'SchemaVer'");
				break;

			case 2:
				debug_print("Updating FROM Schema version 2 TO Schema version 3","SQL");
				generic_sql_query("ALTER TABLE Tracktable ADD Hidden TINYINT(1) UNSIGNED DEFAULT 0");
				generic_sql_query("UPDATE Tracktable SET Hidden = 0 WHERE Hidden IS NULL");
				generic_sql_query("UPDATE Statstable SET Value = 3 WHERE Item = 'SchemaVer'");
				break;

			case 3:
				debug_print("Updating FROM Schema version 3 TO Schema version 4","SQL");
				generic_sql_query("UPDATE Tracktable SET Disc = 1 WHERE Disc IS NULL OR Disc = 0");
				generic_sql_query("UPDATE Statstable SET Value = 4 WHERE Item = 'SchemaVer'");
				break;

			case 4:
				debug_print("Updating FROM Schema version 4 TO Schema version 5","SQL");
				generic_sql_query("UPDATE Albumtable SET Searched = 0 WHERE Image NOT LIKE 'albumart%'");
				generic_sql_query("ALTER TABLE Albumtable DROP Image");
				generic_sql_query("UPDATE Statstable SET Value = 5 WHERE Item = 'SchemaVer'");
				break;

			case 5:
				debug_print("Updating FROM Schema version 5 TO Schema version 6","SQL");
				generic_sql_query("DROP INDEX Disc on Tracktable");
				generic_sql_query("UPDATE Statstable SET Value = 6 WHERE Item = 'SchemaVer'");
				break;

			case 6:
				debug_print("Updating FROM Schema version 6 TO Schema version 7","SQL");
				// This was going to be a nice datestamp but newer versions of mysql don't work that way
				generic_sql_query("ALTER TABLE Tracktable ADD DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
				generic_sql_query("UPDATE Tracktable SET DateAdded = FROM_UNIXTIME(LastModified) WHERE LastModified IS NOT NULL AND LastModified > 0");
				generic_sql_query("UPDATE Statstable SET Value = 7 WHERE Item = 'SchemaVer'");
				break;

			case 7:
				debug_print("Updating FROM Schema version 7 TO Schema version 8","SQL");
				// Since we've changed the way we're joining artist names together,
				// rather than force the database to be recreated and screw up everyone's
				// tags and rating, just modify the artist data.
				$stmt = sql_prepare_query_later("UPDATE Artisttable SET Artistname = ? WHERE Artistindex = ?");
				if ($stmt !== FALSE) {
					if ($result = generic_sql_query("SELECT * FROM Artisttable")) {
						while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
							$artist = (string) $obj->Artistname;
							$art = explode(' & ', $artist);
							if (count($art) > 2) {
							    $f = array_slice($art, 0, count($art) - 1);
							    $newname = implode($f, ", ")." & ".$art[count($art) - 1];
							    debug_print("Updating artist name from ".$artist." to ".$newname,"UPGRADE_SCHEMA");
							    $stmt->execute(array($newname, $obj->Artistindex));
							}
						}
						generic_sql_query("UPDATE Statstable SET Value = 8 WHERE Item = 'SchemaVer'");
					} else {
						$err = $mysqlc->errorInfo()[2];
						debug_print("Error Updating to version 8 ".$err, "MYSQL_CONNECT");
						return array(false, "There was an error while updating your database to version 8 : ".$err);
					}
				} else {
					$err = $mysqlc->errorInfo()[2];
					debug_print("Error Updating to version 8 ".$err, "MYSQL_CONNECT");
					return array(false, "There was an error while updating your database to version 8 : ".$err);
				}
				break;

			case 8:
				debug_print("Updating FROM Schema version 8 TO Schema version 9","SQL");
				// We removed the image column earlier, but I've decided we need it again
				// because some mopidy backends supply images and archiving them all makes
				// creating the collection take waaaaay too long.
				generic_sql_query("ALTER TABLE Albumtable ADD Image VARCHAR(255)");
				// So we now need to recreate the image database. Sadly this means that people using Beets
				// will lose their album images.
				if ($result = generic_sql_query("SELECT Albumindex, ImgKey FROM Albumtable")) {
					while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
						if (file_exists('albumart/small/'.$obj->ImgKey.'.jpg')) {
							generic_sql_query("UPDATE Albumtable SET Image = 'albumart/small/".$obj->ImgKey.".jpg', Searched = 1 WHERE Albumindex = ".$obj->Albumindex);
						} else {
							generic_sql_query("UPDATE Albumtable SET Image = '', Searched = 0 WHERE Albumindex = ".$obj->Albumindex);
						}
					}
					generic_sql_query("UPDATE Statstable SET Value = 9 WHERE Item = 'SchemaVer'");
			    } else {
					$err = $mysqlc->errorInfo()[2];
					debug_print("Error Updating to version 8 ".$err, "MYSQL_CONNECT");
					return array(false, "There was an error while updating your database to version 9 : ".$err);
			    }
			    break;

			case 9:
				debug_print("Updating FROM Schema version 9 TO Schema version 10","SQL");
				generic_sql_query("ALTER TABLE Albumtable DROP NumDiscs");
				generic_sql_query("UPDATE Statstable SET Value = 10 WHERE Item = 'SchemaVer'");
				break;

			case 10:
				debug_print("Updating FROM Schema version 10 TO Schema version 11","SQL");
				generic_sql_query("ALTER TABLE Albumtable DROP IsOneFile");
				generic_sql_query("UPDATE Statstable SET Value = 11 WHERE Item = 'SchemaVer'");
				break;

		}
		$sv++;
	}

	return array(true, "");
}

function open_transaction() {
	global $transaction_open;
	if (generic_sql_query("START TRANSACTION",true)) {
		$transaction_open = true;
	}
}

function check_transaction() {
	global $numdone, $transaction_open, $numtracks;
	if ($transaction_open && $numdone >= ROMPR_MAX_TRACKS_PER_TRANSACTION) {
		generic_sql_query("COMMIT", true);
		$numdone = 0;
		generic_sql_query("START TRANSACTION",true);
	}
}

function close_transaction() {
	global $transaction_open;
    if ($transaction_open) {
    	if (generic_sql_query("COMMIT",true)) {
    		$transaction_open = false;
    	}
    }
}

function create_foundtracks() {
	generic_sql_query("CREATE TEMPORARY TABLE Foundtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex))");
	generic_sql_query("CREATE TEMPORARY TABLE Existingtracks(TTindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(TTindex))");
}

function delete_oldtracks() {
	generic_sql_query("DELETE Tracktable FROM Tracktable JOIN Playcounttable USING (TTindex) WHERE Hidden = 1 AND DATE_SUB(CURDATE(), INTERVAL 6 MONTH) > DateAdded AND Playcount < 2", true);
}

function delete_orphaned_artists() {
	generic_sql_query("CREATE TEMPORARY TABLE Croft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) AS SELECT Artistindex FROM Tracktable UNION SELECT AlbumArtistindex FROM Albumtable", true);
	generic_sql_query("CREATE TEMPORARY TABLE Cruft(Artistindex INT UNSIGNED NOT NULL UNIQUE, PRIMARY KEY(Artistindex)) AS SELECT Artistindex FROM Artisttable WHERE Artistindex NOT IN (SELECT Artistindex FROM Croft)", true);
	generic_sql_query("DELETE Artisttable FROM Artisttable INNER JOIN Cruft ON Artisttable.Artistindex = Cruft.Artistindex", true);
}

function sql_recent_tracks() {
	return "SELECT Uri FROM Tracktable WHERE (DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded) AND Hidden = 0 AND Uri IS NOT NULL AND Title != 'Cue Sheet' ORDER BY RAND()";
}

function sql_recent_albums() {
	return "SELECT Uri, Albumindex, TrackNo FROM Tracktable WHERE DATE_SUB(CURDATE(),INTERVAL 30 DAY) <= DateAdded AND Hidden = 0 AND Uri IS NOT NULL";
}

?>