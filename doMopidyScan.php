<?php
include("vars.php");

if (file_exists($ALBUMSLIST)) {
    unlink($ALBUMSLIST);
}
if (file_exists($FILESLIST)) {
    unlink($FILESLIST);
}

set_time_limit(1200);
$o = exec( 'mopidy-scan > mopidy-tags/tag_cache' );

?>

<html></html>
