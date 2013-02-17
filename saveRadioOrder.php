<?php
$fp = fopen('prefs/radioorder.txt', 'w');
if ($fp) {
    foreach ($_POST['order'] as $order) {
        fwrite($fp, $order."\n");
    }
    fclose($fp);
} else {
    debug_print("ERROR! Could not open file to save radio order");
}
?>
<html></html>
