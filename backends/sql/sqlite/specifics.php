<?php

define('SQL_RANDOM_SORT', 'RANDOM()');

function connect_to_database() {
	global $mysqlc, $prefs;
	if ($mysqlc !== null) {
		debuglog("AWOOOGA! ATTEMPTING MULTIPLE DATABASE CONNECTIONS!","SQLITE",1);
		return;
	}
	try {
		$dsn = "sqlite:prefs/collection_".$prefs['player_backend'].".sq3";
		$mysqlc = new PDO($dsn);
		debuglog("Connected to SQLite","MYSQL",8);
	} catch (Exception $e) {
		debuglog("Couldn't Connect To SQLite - ".$e,"MYSQL",1);
		sql_init_fail($e->getMessage());
	}
}

function close_database() {
	global $mysqlc;
	$mysqlc = null;
}

function check_sql_tables() {
	global $mysqlc;
	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tracktable(".
		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
		"Title VARCHAR(255), ".
		"Albumindex INTEGER, ".
		"TrackNo SMALLINT, ".
		"Duration INTEGER, ".
		"Artistindex INTEGER, ".
		"Disc TINYINT(3), ".
		"Uri VARCHAR(2000) ,".
		"LastModified INTEGER, ".
		"Hidden TINYINT(1) DEFAULT 0, ".
		"DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ".
		"isSearchResult TINYINT(1) DEFAULT 0)"))
	{
		debuglog("  Tracktable OK","SQLITE_CONNECT");
		if (generic_sql_query("CREATE TRIGGER IF NOT EXISTS updatetime AFTER UPDATE ON Tracktable BEGIN UPDATE Tracktable SET DateAdded = CURRENT_TIMESTAMP WHERE TTindex = old.TTindex; END")) {
			debuglog("    Update Trigger Created","SQLITE_CONNECT");
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS ai ON Tracktable (Albumindex)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS ti ON Tracktable (Title)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS tn ON Tracktable (TrackNo)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS di ON Tracktable (Disc)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Tracktable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Albumtable(".
		"Albumindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
		"Albumname VARCHAR(255), ".
		"AlbumArtistindex INTEGER, ".
		"Spotilink VARCHAR(255), ".
		"Year YEAR, ".
		"Searched TINYINT(1), ".
		"ImgKey CHAR(32), ".
		"mbid CHAR(40), ".
		"Domain CHAR(32), ".
		"Image VARCHAR(255))"))
	{
		debuglog("  Albumtable OK","SQLITE_CONNECT");
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS ni ON Albumtable (Albumname)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS aai ON Albumtable (AlbumArtistindex)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS di ON Albumtable (Domain)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS ii ON Albumtable (ImgKey)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Albumtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Artisttable(".
		"Artistindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
		"Artistname VARCHAR(255))"))
	{
		debuglog("  Artisttable OK","SQLITE_CONNECT");
		if (generic_sql_query("CREATE INDEX IF NOT EXISTS ni ON Artisttable (Artistname)")) {
		} else {
			$err = $mysqlc->errorInfo()[2];
			return array(false, "Error While Checking Tracktable : ".$err);
		}
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Artisttable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Ratingtable(".
		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
		"Rating TINYINT(1))"))
	{
		debuglog("  Ratingtable OK","SQLITE_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Ratingtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tagtable(".
		"Tagindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
		"Name VARCHAR(255))"))
	{
		debuglog("  Tagtable OK","SQLITE_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Tagtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS TagListtable(".
		"Tagindex INTEGER NOT NULL REFERENCES Tagtable(Tagindex), ".
		"TTindex INTEGER NOT NULL REFERENCES Tracktable(TTindex), ".
		"PRIMARY KEY (Tagindex, TTindex))"))
	{
		debuglog("  TagListtable OK","SQLITE_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking TagListtable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Playcounttable(".
		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE REFERENCES Tracktable(TTindex), ".
		"Playcount INT UNSIGNED NOT NULL)"))
	{
		debuglog("  Playcounttable OK","SQLITE_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Playcounttable : ".$err);
	}

	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Trackimagetable(".
		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE REFERENCES Tracktable(TTindex), ".
		"Image VARCHAR(500))"))
	{
		debuglog("  Trackimagetable OK","SQLITE_CONNECT");
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Trackimagetable : ".$err);
	}

	if (!generic_sql_query("CREATE TABLE IF NOT EXISTS Statstable(Item CHAR(11), Value INTEGER, PRIMARY KEY(Item))")) {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Statstable : ".$err);
	}
	// Check schema version and update tables as necessary
	$sv = 0;
	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = 'SchemaVer'")) {
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$sv = $obj->Value;
		}
		if ($sv == 0) {
			debuglog("No Schema Version Found - initialising table","SQL_CONNECT");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ListVersion', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ArtistCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('AlbumCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TrackCount', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TotalTime', '0')");
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '".ROMPR_SCHEMA_VERSION."')");
			$sv = ROMPR_SCHEMA_VERSION;
			debuglog("Statstable populated", "SQLITE_CONNECT");
		}
	} else {
		$err = $mysqlc->errorInfo()[2];
		return array(false, "Error While Checking Database Schema Version : ".$err);
	}

	if ($sv > ROMPR_SCHEMA_VERSION) {
		debuglog("Schema Mismatch! We are version ".ROMPR_SCHEMA_VERSION." but database is version ".$sv,"MYSQL_CONNECT");
		return array(false, "Your database has version number ".$sv." but this version of rompr only handles version ".ROMPR_SCHEMA_VERSION);
	}

	while ($sv < ROMPR_SCHEMA_VERSION) {
		switch ($sv) {
			case 0:
				debuglog("BIG ERROR! No Schema Version found!!","SQL");
				return array(false, "Database Error - could not read schema version. Cannot continue.");
				break;

			case 11:
				debuglog("Updating FROM Schema version 11 TO Scheme version 12","SQL");
				generic_sql_query("ALTER TABLE Tracktable ADD isSearchResult TINYINT(1) DEFAULT 0");
				generic_sql_query("UPDATE Statstable SET Value = 12 WHERE Item = 'SchemaVer'");
				break;

		}
		$sv++;
	}

	return array(true, "");
}

function open_transaction() {
	global $transaction_open;
	if (!$transaction_open) {
		if (generic_sql_query("BEGIN TRANSACTION")) {
			$transaction_open = true;
		}
	}
}

function check_transaction() {
	global $numdone, $transaction_open, $numtracks;
	if ($transaction_open && $numdone >= ROMPR_MAX_TRACKS_PER_TRANSACTION) {
		generic_sql_query("COMMIT", true);
		$numdone = 0;
		generic_sql_query("BEGIN TRANSACTION");
	}
}

function close_transaction() {
	global $transaction_open;
    if ($transaction_open) {
    	if (generic_sql_query("COMMIT")) {
    		$transaction_open = false;
    		$numdone = 0;
    	}
    }
}

function create_foundtracks() {
	generic_sql_query("DROP TABLE IF EXISTS Foundtracks");
	generic_sql_query("DROP TABLE IF EXISTS Existingtracks");
	generic_sql_query("CREATE TEMPORARY TABLE Foundtracks(TTindex INTEGER NOT NULL UNIQUE)");
	generic_sql_query("CREATE TEMPORARY TABLE Existingtracks(TTindex INTEGER NOT NULL UNIQUE)");
}

function delete_oldtracks() {
	generic_sql_query("DROP TABLE IF EXISTS OldTracks");
	generic_sql_query("CREATE TEMPORARY TABLE OldTracks AS SELECT TTindex FROM Tracktable JOIN Playcounttable USING (TTindex) WHERE Hidden = 1 AND DATETIME('now', '-6 MONTH') > DateAdded AND Playcount < 2", true);
	generic_sql_query("DELETE FROM Tracktable WHERE TTindex IN (SELECT TTindex FROM OldTracks)", true);
}

function delete_orphaned_artists() {
	generic_sql_query("DROP TABLE IF EXISTS Croft");
	generic_sql_query("CREATE TEMPORARY TABLE Croft AS SELECT Artistindex FROM Tracktable UNION SELECT AlbumArtistindex FROM Albumtable", true);
	generic_sql_query("DELETE FROM Artisttable WHERE Artistindex NOT IN (SELECT Artistindex FROM Croft)", true);
}

function sql_recent_tracks() {
	return "SELECT Uri FROM Tracktable WHERE DATETIME('now', '-1 MONTH') <= DATETIME(DateAdded) AND Hidden = 0 AND isSearchResult < 2 AND Uri IS NOT NULL ORDER BY RANDOM()";
}

function sql_recent_albums() {
	return "SELECT Uri, Albumindex, TrackNo FROM Tracktable WHERE DATETIME('now', '-1 MONTH') <= DATETIME(DateAdded) AND Hidden = 0 AND isSearchResult < 2 AND Uri IS NOT NULL";
}

?>
