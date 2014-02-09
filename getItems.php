<?php

include ("includes/vars.php");
include ("includes/functions.php");
$apache_backend = "xml";
if (array_key_exists('item', $_REQUEST) && substr($_REQUEST['item'],0,2) == "aa") {
    // At the moment, the sql backend only does the main collection. Search and files are still XML
    $apache_backend = $prefs['apache_backend'];
}

include ("backends/".$apache_backend."/backend.php");

debug_print("Getting Items for ".$_REQUEST['item']." from ".$apache_backend,"GETITEMS");

$items = getItemsToAdd($_REQUEST["item"]);
$result = array();
foreach ($items as $i => $uri) {

	$result[$i] = array( 	"type" => "uri",
							"name" => preg_replace('/^add /', '', $uri));

}

print json_encode($result);

?>