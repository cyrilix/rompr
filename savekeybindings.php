<?php
include ("keybindings.php");
foreach($_POST as $key => $value) {
    // error_log($key."=".$value);
    $keys[$key] = $value;
}
saveKeyBindings();
?>
<html><body></body></html>