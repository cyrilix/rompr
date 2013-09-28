<?php
include ("vars.php");
include ("functions.php");
$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GETMBDATA");

$content = url_get_contents($uri);
$s = $content['status'];
debug_print("Response Status was ".$s, "GETMBDATA");
if ($s == "200") {
	print $content['contents'];
} else {
	$a = array( 'error' => 'Did not get a response from MusicBrainz');
	print json_encode($a);
}

?>
