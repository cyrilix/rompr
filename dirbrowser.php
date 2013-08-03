
<?php
include ("vars.php");
include ("functions.php");
include ("filelister.php");

$count = 1;
$tree = null;

if (array_key_exists('item', $_REQUEST) && file_exists($FILESLIST)) {
	dumpTree($_REQUEST['item']);
} else {
	include ("connection.php");
	$tree = doFileList("list file");
	doFileCollection($FILESLIST);
   	dumpTree('adirroot');
}

close_mpd($connection);

function doFileCollection($file) {

    global $tree;
    $output = new collectionOutput($file);
    $tree->getXML("a", $output);
    $output->closeFile();

}

?>