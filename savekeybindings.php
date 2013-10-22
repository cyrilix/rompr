<?php
include ("keybindings.php");
foreach($_POST as $key => $value) {
    // debug_print($key."=".$value);
    $keys[$key] = $value;
}
saveKeyBindings();
?>
<html><body></body></html>