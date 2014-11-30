<?php
chdir('..');
include ("utils/keybindings.php");
foreach($_POST as $key => $value) {
    $keys[$key] = $value;
}
saveKeyBindings();
?>
<html></html>