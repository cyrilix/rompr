<?php

$mysqlc = null;

function connect_to_database() {
	global $mysqlc;
	global $prefs;
	if (function_exists('mysqli_connect')) {
		try {
			$mysqlc = @mysqli_connect($prefs['mysql_host'],$prefs['mysql_user'],$prefs['mysql_password'],'romprdb',$prefs['mysql_port']);
			if (mysqli_connect_errno()) {
				debug_print("Failed to connect to MySQL: ".mysqli_connect_error(), "SEARCH");
				$mysqlc = null;
			} else {
				debug_print("Connected to MySQL","SEARCH");
			}
		} catch (Exception $e) {
			debug_print("Database connect failure - ".$e,"SEARCH");
		}
	} else {
		debug_print("PHP SQL driver is not installed","SEARCH");
	}
}

//
// Initialisation
//

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

function check_sql_tables() {

	// Check all our tables exist and create them if necessary

	global $mysqlc;

	$current_schema_version = 6;

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
			"Hidden TINYINT(1) UNSIGNED DEFAULT 0, ".
			"INDEX(Albumindex), ".
			"INDEX(Title), ".
			"INDEX(TrackNo)) ENGINE=InnoDB"))
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
			"AlbumArtistindex INT UNSIGNED, ".
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

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Playcounttable(".
			"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
			"Playcount INT UNSIGNED NOT NULL, ".
			"PRIMARY KEY (TTindex)) ENGINE=InnoDB"))
		{
			debug_print("  Playcounttable OK","MYSQL");
		} else {
			debug_print("Table Check/Create Error!", "MYSQL");
			mysqli_close($mysqlc);
			$mysqlc = null;
			return false;
		}

		if (generic_sql_query("CREATE TABLE IF NOT EXISTS Trackimagetable(".
			"TTindex INT UNSIGNED NOT NULL REFERENCES Tracktable(TTindex), ".
			"Image VARCHAR(500), ".
			"PRIMARY KEY (TTindex)) ENGINE=InnoDB"))
		{
			debug_print("  Trackimagetable OK","MYSQL");
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
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '".$current_schema_version."')");
		} else {
			debug_print("Statstable Exists","MYSQL");
			// Check schema version and update tables as necessary
			if ($result = mysqli_query($mysqlc, "SELECT Value FROM Statstable WHERE Item = 'SchemaVer'")) {
				$sv = 0;
				while ($obj = mysqli_fetch_object($result)) {
					$sv = $obj->Value;
				}
				while ($sv < $current_schema_version) {
					switch ($sv) {
						case 0:
							debug_print("BIG ERROR! No Schema Version found!!","SQL");
							break;

						case 1:
							debug_print("Updating FROM Schema version 1 TO Schema version 2","SQL");
							generic_sql_query("ALTER TABLE Albumtable DROP Directory");
							generic_sql_query("UPDATE Statstable SET Value = 2 WHERE Item = 'SchemaVer'");
							break;

						case 2:
							debug_print("Updating FROM Schema version 2 TO Schema version 3","SQL");
							generic_sql_query("ALTER TABLE Tracktable ADD Hidden TINYINT(1) UNSIGNED DEFAULT 0");
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

						case 5:
							debug_print("Updating FROM Schema version 5 TO Schema version 6","SQL");
							generic_sql_query("DROP INDEX Disc on Tracktable");
							generic_sql_query("UPDATE Statstable SET Value = 6 WHERE Item = 'SchemaVer'");
					}
					$sv++;
				}
			} else {
				debug_print("Error querying Schema Version: ".mysqli_error($mysqlc), "MYSQL");
			}
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

?>