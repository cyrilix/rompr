<?php

$mysqlc = null;
$dbtype = "xml";

function connect_to_database() {
	global $mysqlc, $prefs, $dbtype;
	debug_print("Attempting to connect to MYSQL Server","SQL_CONNECT");
	try {
		$dsn = "mysql:host=".$prefs['mysql_host'].";port=".$prefs['mysql_port'].";dbname=".$prefs['mysql_database'];
		$mysqlc = new PDO($dsn, $prefs['mysql_user'], $prefs['mysql_password']);
		debug_print("Connected to MySQL","SQL_CONNECT");
		$dbtype = "mysql";
	} catch (Exception $e) {
		debug_print("Database connect failure - ".$e,"SQL_CONNECT");
		$mysqlc = null;
	}
	// if ($mysqlc == null) {
	// 	debug_print("Attempting to use SQLite Database");
	// 	try {
	// 		$dsn = "sqlite:prefs/collection.sq3";
	// 		$mysqlc = new PDO($dsn);
	// 		debug_print("Connected to SQLite","MYSQL");
	// 		$dbtype = "sqlite";
	// 	} catch (Exception $e) {
	// 		debug_print("Database connect failure - ".$e,"MYSQL");
	// 		$mysqlc = null;
	// 	}
	// }
}

//
// Initialisation
//

function show_sql_error($text = "    MYSQL Error: ", $stmt = null) {
	global $mysqlc;
	$obj = $stmt == null ? $mysqlc : $stmt;
	debug_print($text." : ".$obj->errorInfo()[2],"MYSQL");
}

function generic_sql_query($qstring, $log = false, $showerror = true) {
	global $mysqlc;
	if ($log) debug_print($qstring,"SQL_QUERY");
	if (($result = $mysqlc->query($qstring)) !== FALSE) {
		if ($log) debug_print("Done : ".($result->rowCount())." rows affected","SQL_QUERY");
	} else {
		if ($log) {
			show_sql_error();
		} else {
			if ($showerror) {
				debug_print("Command Failed : ".$qstring,"SQL_QUERY");
				show_sql_error();
			}
		}
	}
	return $result;

}

// Debug function for prepared statement
function dbg_params($string,$data) {
	$indexed = $data==array_values($data);

	foreach($data as $k=>$v) {
		if (is_string($v)) {
			$v = "'$v'";
		}
		if($indexed) {
			$string = preg_replace('/\?/', $v, $string, 1);
		} else {
			$string=str_replace(":$k", $v, $string);
        }
    }
    return $string;
}

// Variable arguments, first is query
function sql_prepare_query() {
	global $mysqlc;
	$numArgs = func_num_args();
	$query = func_get_arg(0);
	if (!is_string($query)) {
		$callers=debug_backtrace();
		var_dump($callers[1]); exit(0); //['function'];
	}
	$stmt = $mysqlc->prepare($query);
	if ($stmt !== FALSE) {
		$args = array();
		for ($i = 1; $i < $numArgs; $i++) $args[] = func_get_arg($i);
		// debug_print("Pseudo query: ".dbg_params($query, $args),"SQL_QUERY");
		return $stmt->execute($args) ? $stmt : FALSE;
	} else {
		show_sql_error();
	}
	return FALSE;
}

function sql_prepare_query_later($query) {
	global $mysqlc;
	// debug_print($query,"SQL_QUERY");
	$stmt = $mysqlc->prepare($query);
	if ($stmt === FALSE) {
		show_sql_error("Query Prep Error For ".$query);
	}
	return $stmt;
}

function check_sql_tables() {

	// Check all our tables exist and create them if necessary

	debug_print("Checking Database Tables","SQL_CONNECT");
	global $dbtype;
	$current_schema_version = 11;
	switch ($dbtype) {
		case "mysql":
			return mysql_init($current_schema_version);
			break;
		case "sqlite":
			return sqlite_init($current_schema_version);
			break;
	}

}

function mysql_init($current_schema_version) {
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
		"Uri VARCHAR(2000) ,".
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
			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '".$current_schema_version."')");
			$sv = $current_schema_version;
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

	if ($sv > $current_schema_version) {
		debug_print("Schema Mismatch! We are version ".$current_schema_version." but database is version ".$sv,"MYSQL_CONNECT");
		return array(false, "Your database has version number ".$sv." but this version of rompr only handles version ".$current_schema_version);
	}

	while ($sv < $current_schema_version) {
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

// function sqlite_init($current_schema_version) {
// 	global $mysqlc;
// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tracktable(".
// 		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
// 		"Title VARCHAR(255), ".
// 		"Albumindex INTEGER, ".
// 		"TrackNo SMALLINT, ".
// 		"Duration INTEGER, ".
// 		"Artistindex INTEGER, ".
// 		"Disc TINYINT(3), ".
// 		"Uri VARCHAR(2000) ,".
// 		"LastModified INTEGER, ".
// 		"Hidden TINYINT(1) DEFAULT 0, ".
// 		"DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
// 	{
// 		debug_print("  Tracktable OK","SQLITE_CONNECT");
// 		if (generic_sql_query("CREATE TRIGGER IF NOT EXISTS updatetime AFTER UPDATE ON Tracktable BEGIN UPDATE Tracktable SET DateAdded = CURRENT_TIMESTAMP WHERE TTindex = old.TTindex; END")) {
// 			debug_print("    Update Trigger Created","SQLITE_CONNECT");
// 		} else {
// 			$err = $mysqlc->errorInfo()[2];
// 			return array(false, "Error While Checking Tracktable : ".$err);
// 		}
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Tracktable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Albumtable(".
// 		"Albumindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
// 		"Albumname VARCHAR(255), ".
// 		"AlbumArtistindex INTEGER, ".
// 		"Spotilink VARCHAR(255), ".
// 		"Year YEAR, ".
// 		"Searched TINYINT(1), ".
// 		"ImgKey CHAR(32), ".
// 		"mbid CHAR(40), ".
// 		"Domain CHAR(32), ".
// 		"Image VARCHAR(255))"))
// 	{
// 		debug_print("  Albumtable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Albumtable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Artisttable(".
// 		"Artistindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
// 		"Artistname VARCHAR(255))"))
// 	{
// 		debug_print("  Artisttable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Artisttable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Ratingtable(".
// 		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
// 		"Rating TINYINT(1))"))
// 	{
// 		debug_print("  Ratingtable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Ratingtable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Tagtable(".
// 		"Tagindex INTEGER PRIMARY KEY NOT NULL UNIQUE, ".
// 		"Name VARCHAR(255))"))
// 	{
// 		debug_print("  Tagtable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Tagtable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS TagListtable(".
// 		"Tagindex INTEGER NOT NULL REFERENCES Tagtable(Tagindex), ".
// 		"TTindex INTEGER NOT NULL REFERENCES Tracktable(TTindex), ".
// 		"PRIMARY KEY (Tagindex, TTindex))"))
// 	{
// 		debug_print("  TagListtable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking TagListtable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Playcounttable(".
// 		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE REFERENCES Tracktable(TTindex), ".
// 		"Playcount INT UNSIGNED NOT NULL)"))
// 	{
// 		debug_print("  Playcounttable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Playcounttable : ".$err);
// 	}

// 	if (generic_sql_query("CREATE TABLE IF NOT EXISTS Trackimagetable(".
// 		"TTindex INTEGER PRIMARY KEY NOT NULL UNIQUE REFERENCES Tracktable(TTindex), ".
// 		"Image VARCHAR(500))"))
// 	{
// 		debug_print("  Trackimagetable OK","MYSQL_CONNECT");
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Trackimagetable : ".$err);
// 	}

// 	if (!generic_sql_query("CREATE TABLE IF NOT EXISTS Statstable(Item CHAR(11), Value INTEGER, PRIMARY KEY(Item))")) {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Statstable : ".$err);
// 	}
// 	// Check schema version and update tables as necessary
// 	$sv = 0;
// 	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = 'SchemaVer'")) {
// 		if ($result->rowCount() == 0) {
// 			debug_print("No Schema Version Found - initialising table","SQL_CONNECT");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ListVersion', '0')");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('ArtistCount', '0')");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('AlbumCount', '0')");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TrackCount', '0')");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('TotalTime', '0')");
// 			generic_sql_query("INSERT INTO Statstable (Item, Value) VALUES ('SchemaVer', '".$current_schema_version."')");
// 			$sv = $current_schema_version;
// 			debug_print("Statstable populated", "MYSQL_CONNECT");
// 		} else {
// 			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
// 				$sv = $obj->Value;
// 			}
// 		}
// 	} else {
// 		$err = $mysqlc->errorInfo()[2];
// 		return array(false, "Error While Checking Database Schema Version : ".$err);
// 	}

// 	return array(true, "");
// }



function check_albumslist() {
	global $mysqlc;
	global $LISTVERSION;
	$retval = "false";
	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = 'ListVersion'")) {
		if ($result->rowCount() > 0) {
			$lv = 0;
			while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
				$lv = $obj->Value;
			}
			if ($lv == $LISTVERSION) {
				debug_print("Albums List is OK","MYSQL");
				$retval = "true";
			} else {
				debug_print("Albums list is out of date", "MYSQL");
			}
		} else {
			debug_print("No stored value for ListVersion","MYSQL");
		}
	}
	return $retval;
}

?>