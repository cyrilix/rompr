<?php
if (array_key_exists('name', $_REQUEST)) {
	$name = rawurldecode($_REQUEST['name']);
	if (file_exists($name)) {
		header('Content-Type: text/xml; charset=utf-8');
		$f = file_get_contents($name);
		print $f;
	}
}

if (array_key_exists('remove', $_REQUEST)) {
	$name = rawurldecode($_REQUEST['remove']);
	if (file_exists($name)) {
		system('rm "'.$name.'"');
		print '<html><body></body></html>';
	}
}

?>