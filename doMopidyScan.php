<?php
include("vars.php");
include("functions.php");

set_time_limit(1800);
$path = find_executable("mopidy_scan");
$o = exec( $path."mopidy-scan > mopidy-tags/tag_cache" , $o, $result);
debug_print("Result of mopidy_scan is ".$result,"MOPIDYSCAN");
exec('chmod ugo+rw mopidy-tags/tag_cache');
if ($result != 0) {
	header("HTTP/1.1 404 Not Found");
}

if (file_exists($ALBUMSLIST)) {
    unlink($ALBUMSLIST);
}
if (file_exists($FILESLIST)) {
    unlink($FILESLIST);
}

?>

<html></html>
