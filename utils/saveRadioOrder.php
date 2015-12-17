<?php
chdir('..');
include("includes/vars.php");
if (array_key_exists('order', $_POST)) {
	$fp = fopen('prefs/radioorder.txt', 'w');
	if ($fp) {
		if (is_array($_POST['order'])) {
		    foreach ($_POST['order'] as $order) {
		        fwrite($fp, $order."\n");
		        debuglog("Radio Station ".$order,"SAVERADIOORDER");
		    }
		} else {
	        fwrite($fp, $_POST['order']."\n");
	        debuglog("Radio Station ".$_POST['order'],"SAVERADIOORDER");
		}
	    fclose($fp);
	} else {
	    debuglog("ERROR! Could not open file to save radio order","SAVERADIOORDER");
	}
}
?>
<html></html>
