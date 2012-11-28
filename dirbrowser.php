
<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
// error_log("Building Files List");
$count = 1;
doFileCollection($FILESLIST);
close_mpd($connection);

function doFileCollection($file) {

    $output = new collectionOutput($file);
    $tree = doFileList("list file");
    $tree->root->createHTML("a", $output);
    $output->closeFile();
    $output->dumpFile();

}

?>