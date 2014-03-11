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

?>