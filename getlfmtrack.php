<?php
include ("vars.php");
include("functions.php");
header('Content-Type: text/xml; charset=utf-8');
$content = url_get_contents("http://ws.audioscrobbler.com/1.0/webclient/getresourceplaylist.php?sk=".$_REQUEST['sk']."&url=".$_REQUEST['url']."&desktop=1");
$xml = $content['contents'];
print $xml;
?>
