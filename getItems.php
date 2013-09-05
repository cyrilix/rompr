<?php

include ("vars.php");
include ("functions.php");

debug_print("Getting Items for ".$_REQUEST['item'],"GETITEMS");

$items = getItemsToAdd($_REQUEST["item"]);
$result = array();
foreach ($items as $i => $uri) {

	$result[$i] = array( 	"type" => "uri",
							"name" => preg_replace('/^add /', '', $uri));

}

print json_encode($result);

?>