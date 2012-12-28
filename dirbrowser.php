
<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
// debug_print("Building Files List");
$count = 1;
doFileCollection($FILESLIST);
close_mpd($connection);

function doFileCollection($file) {

    $output = new collectionOutput($file);
    $tree = doFileList("list file");
    $tree->getHTML("a", $output);
    $output->closeFile();
    $output->dumpFile();

}

?>