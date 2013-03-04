
<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");

$count = 1;
$tree = null;

if (array_key_exists('item', $_REQUEST) && file_exists($FILESLIST)) {
	debug_print("Doing Big Weasel Function ".$_REQUEST['item']);
	dumpTree($_REQUEST['item']);
} else {
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