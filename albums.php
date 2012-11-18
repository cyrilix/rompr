
<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

$count = 1;
$divtype = "album1";

$collection = doCollection("listallinfo");
createHTML($collection->getSortedArtistList(), "a", 'prefs/albums_'.$LISTVERSION.'.html');
close_mpd($connection);
$file = fopen('prefs/albums_'.$LISTVERSION.'.html', 'r');
while(!feof($file))
{
    echo fgets($file);
}
fclose($file);

?>  

