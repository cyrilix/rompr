<?php
chdir('..');
ob_start();
include ("includes/vars.php");
include ("includes/functions.php");
debuglog("Requesting IP address location lookup","GETLOCATION");
$content = url_get_contents("http://www.telize.com/geoip");
if ($content['status'] == "200") {
	print $content['contents'];
} else {
	debuglog("Request to telize.com failed with status ".$content['status'],"GETLOCATION");
    print json_encode(array('country' => 'ERROR', 'country_code' => 'unclepeter'));
}
ob_flush();
?>
