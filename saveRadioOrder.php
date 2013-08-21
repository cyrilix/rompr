<?php
include("vars.php");
if (array_key_exists('order', $_POST)) {
	$fp = fopen('prefs/radioorder.txt', 'w');
	if ($fp) {
		if (is_array($_POST['order'])) {
		    foreach ($_POST['order'] as $order) {
		        fwrite($fp, $order."\n");
		        debug_print("Radio Station ".$order);
		    }
		} else {
	        fwrite($fp, $_POST['order']."\n");
	        debug_print("Radio Station ".$_POST['order']);
		}
	    fclose($fp);
	} else {
	    debug_print("ERROR! Could not open file to save radio order");
	}
}
?>
<html></html>
