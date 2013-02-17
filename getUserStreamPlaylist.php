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
	// DON'T delete it, as it may be in the playlist
	// rename it from USERSTREAM to STREAM
    $newname = preg_replace('/USERSTREAM/', 'STREAM', $name);
	if (file_exists($name)) {
		system('mv "'.$name.'" "'.$newname.'"');
		print '<html><body></body></html>';
	}
}

?>