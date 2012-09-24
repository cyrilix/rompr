<?php

$file = "prefs/LFMRADIO_".$_POST['remove'].".xspf";
error_log("Asked to remove ".$file);

if (file_exists($file)) {
	error_log("Removing it...");
	system('rm "'.$file.'"');
	print '<html><body></body></html>';
}

?>