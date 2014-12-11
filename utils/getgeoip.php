<?php
chdir('..');
ob_start();
include ("includes/vars.php");
include ("includes/functions.php");
debug_print("Requesting IP address location lookup","GETLOCATION");
$content = url_get_contents("http://www.telize.com/geoip");
if ($content['status'] == "200") {
	print $content['contents'];
} else {
	debug_print("Request to telize.com failed with status ".$content['status'],"GETLOCATION");
    header('HTTP/1.1 400 Bad Request');
}
ob_flush();
?>
