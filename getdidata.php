<?php
include ("vars.php");
include ("functions.php");
$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GETDIDATA");

$content = url_get_contents($uri);
$s = $content['status'];
debug_print("Response Status was ".$s, "GETDIDATA");
if ($s == "200") {
	print $content['contents'];
} else {
	$a = array( 'error' => 'There was a network error or Discogs refused to reply');
	print json_encode($a);
}

?>
