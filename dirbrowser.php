
<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
error_log("Building Files List");
$count = 1;
$tree = doFileList("list file");
$ihatephp = fopen('prefs/files_'.$LISTVERSION.'.html', 'w');
$tree->root->createHTML("a");
close_mpd($connection);
fclose($ihatephp);
$file = fopen('prefs/files_'.$LISTVERSION.'.html', 'r');
while(!feof($file))
{
    echo fgets($file);
}
fclose($file);

?>