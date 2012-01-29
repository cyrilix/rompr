<?php
include("functions.php");
header('Content-Type: text/xml; charset=utf-8');
# This works for soma fm playlists, probably nothing else

#[playlist]
#numberofentries=1
#File1=http://mp1.somafm.com:8808
#Title1=SomaFM: Lush (#1 130k aac): Sensuous and mellow vocals, mostly female, with an electronic influence.
#Length1=-1
#Version=2


$content = url_get_contents($_REQUEST['url'], 'RompR Media Player/0.1', false, true);
$pls = $content['contents'];
error_log("New PLS");
error_log($pls);

$matches = array();
preg_match('/File1=(.*?)$/m', $pls, $matches);
$linkurl = $matches[1];

error_log("Station : ".html_entity_decode(urldecode($_REQUEST['station'])));
error_log("URL : ".$linkurl);

$output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
            '<playlist>'."\n".
            xmlnode('creator', 'soma fm').
            '<trackList>'."\n";

$output = $output . "<track>\n".
                    xmlnode('album', html_entity_decode(urldecode($_REQUEST['station']))).
                    xmlnode('location', $linkurl).
                    xmlnode('creator', 'soma fm').
                    xmlnode('image', $_REQUEST['image']).
                    "</track>\n";


$output = $output . "</trackList>\n</playlist>\n";

$fp = fopen('prefs/STREAM_'.md5(html_entity_decode(urldecode($_REQUEST['station']))).'.xspf', 'w');
if ($fp) {
    fwrite($fp, $output);
}
fclose($fp);

print $output;

?>
