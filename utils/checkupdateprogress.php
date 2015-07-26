<?php
chdir('..');
include("includes/vars.php");
$LastLine = "";
if ($fp = fopen('prefs/monitor', 'r')) {
	fseek($fp, -1, SEEK_END);
	$pos = ftell($fp);
	// Loop backward util "\n" is found.
	if ($pos > 0) {
    	fseek($fp, $pos--);
	}
	while((($C = fgetc($fp)) != "\n") && ($pos > 0)) {
    	$LastLine = $C.$LastLine;
    	fseek($fp, $pos--);
	}
	fclose($fp);
	debuglog("Update Progress Is ".$LastLine,"COLLECTION",3);
}
print json_encode(array('current' => $LastLine));
?>