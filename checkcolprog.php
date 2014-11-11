<?php

include ("includes/vars.php");
include ("includes/functions.php");
$status = array( 'percent' => 0 );

function error_handler($a, $b) {
	exit(0);
}

set_error_handler("error_handler");

$fp = null;
if (file_exists('prefs/colprog.xml')) {
	if (get_file_lock('prefs/colprog.xml', $fp)) {
		$x = simplexml_load_file('prefs/colprog.xml');
		$status['percent'] = $x->percent;
	}
}

print json_encode($status);

?>
