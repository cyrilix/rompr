<?php
chdir('..');
include ("includes/vars.php");
include ("includes/functions.php");

$url = $_POST['url'];
$name = $_POST['name'];
update_stream_playlist($url, $name, null, "", "", "stream", "STREAM");

?>
