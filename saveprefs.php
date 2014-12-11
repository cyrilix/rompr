<?php
include ("includes/vars.php");
debug_print("Saving prefs","SAVEPREFS");
foreach($_POST as $key => $value) {
    debug_print($key."=".$value,"SAVEPREFS");
    $prefs[$key] = $value;
}
savePrefs();
?>
<html><body></body></html>