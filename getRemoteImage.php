<?php
include ("vars.php");
include ("functions.php");

$url = $_REQUEST['url'];
$url = str_replace("https://", "http://", $url);
debug_print("Getting Remote Image ".$url,"TOMATO");

$ext = explode('.',$url);

$contents = file_get_contents($url);
header('Content-type: image/'.end($ext));
echo $contents;

?>
