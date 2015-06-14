<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
if (array_key_exists('command', $_REQUEST) && $_REQUEST['command'] == "clear") {
    $playlists = glob("prefs/*.xspf");
    foreach($playlists as $i => $file) {
        if (!preg_match('/USERSTREAM/', basename($file))) {
            system("rm ".$file);
        }
    }
}
?>
<html></html>
