<?php
include ("vars.php");
include ("functions.php");
$uri = rawurldecode($_REQUEST['uri']);
debug_print("Getting ".$uri, "GETBEETSINFO");

$content = url_get_contents($uri);
$s = $content['status'];
debug_print("Response Status was ".$s, "GETBEETSINFO");
if ($s == "200") {
	print $content['contents'];
} else {
   header("HTTP/1.1 404 Not Found");
}

?>
