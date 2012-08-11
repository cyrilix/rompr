<?php

$name = rawurldecode($_REQUEST['name']);

// error_log("Looking for playlist : ".$name);

if (file_exists($name)) {
	header('Content-Type: text/xml; charset=utf-8');
	$f = file_get_contents($name);
	print $f;
}

?>