<?php

ob_start();
include ("includes/vars.php");
include ("includes/functions.php");
$content = url_get_contents("http://freegeoip.net/json/");
if ($content['status'] == "200") {
	print $content['contents'];
} else {
    header('HTTP/1.1 400 Bad Request');
}

ob_flush();

?>
