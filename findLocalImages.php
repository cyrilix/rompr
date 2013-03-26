<?php
include ("vars.php");
include ("functions.php");
$donkeymolester = scan_for_images($_REQUEST['path']);
print json_encode($donkeymolester);
?>
