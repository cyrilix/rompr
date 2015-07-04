<?php

$mysqlc = null;
if (array_key_exists('collection_type', $prefs)) {
	include("backends/sql/".$prefs['collection_type']."/specifics.php");
}

function probe_database() {
	// In the case where collection_type is not set, probe to see which type of DB to use
	// This keeps the behaviour the same as previous versions which auto-detected
	// the database type. This does mean we get some duplicate code but this is
	// so much better for the user.
	global $mysqlc, $prefs;
	debug_print("Attempting to connect to MYSQL Server","SQL_CONNECT");
	try {
		$dsn = "mysql:host=".$prefs['mysql_host'].";port=".$prefs['mysql_port'].";dbname=".$prefs['mysql_database'];
		$mysqlc = new PDO($dsn, $prefs['mysql_user'], $prefs['mysql_password']);
		debug_print("Connected to MySQL","SQL_CONNECT");
		$prefs['collection_type'] = 'mysql';
	} catch (Exception $e) {
		debug_print("Couldn't connect to MySQL - ".$e,"SQL_CONNECT");
		$mysqlc = null;
	}
	if ($mysqlc == null) {
		debug_print("Attempting to use SQLite Database");
		try {
			$dsn = "sqlite:prefs/collection_mpd.sq3";
			$mysqlc = new PDO($dsn);
			debug_print("Connected to SQLite","MYSQL");
			$prefs['collection_type'] = 'sqlite';
		} catch (Exception $e) {
			debug_print("Couldn't use SQLite Either - ".$e,"MYSQL");
			$mysqlc = null;
		}
	}
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
// This doesn't appear to work with MySQL when one of the arsg has to be an integer
// eg LIMIT ? doesn't work.
function sql_prepare_query() {
	global $mysqlc;
	$numArgs = func_num_args();
	$query = func_get_arg(0);
	// if (!is_string($query)) {
	// 	$callers=debug_backtrace();
	// 	var_dump($callers[1]); exit(0); //['function'];
	// }
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
	$stmt = $mysqlc->prepare($query);
	if ($stmt === FALSE) {
		show_sql_error("Query Prep Error For ".$query);
	}
	return $stmt;
}

function check_albumslist() {
	$retval = "false";
	if ($result = generic_sql_query("SELECT Value FROM Statstable WHERE Item = 'ListVersion'")) {
		$lv = 0;
		while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
			$lv = $obj->Value;
		}
		if ($lv == ROMPR_COLLECTION_VERSION) {
			debug_print("Collection version is correct","MYSQL");
			$retval = "true";
		} else {
			debug_print("Collection version is outdated - ".$lv, "MYSQL");
		}
	}
	return $retval;
}

?>