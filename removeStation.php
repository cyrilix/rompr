<?php
include ("vars.php");

$file = "prefs/LFMRADIO_".$_POST['remove'].".xspf";
debug_print("Asked to remove ".$file);

if (file_exists($file)) {
	debug_print("Removing it...");
	system('rm "'.$file.'"');
	print '<html><body></body></html>';
}

?>