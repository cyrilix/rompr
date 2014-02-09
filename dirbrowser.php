
<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("backends/xml/backend.php");
include ("backends/xml/filelister.php");

$count = 1;
$tree = null;

if (array_key_exists('item', $_REQUEST) && file_exists($FILESLIST)) {
	dumpTree($_REQUEST['item']);
} else {
	include ("player/mpd/connection.php");
	$tree = doFileList("listall");
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