<?php

include ("vars.php");

$station = $_POST['station'];
$found = false;

$playlists = glob("prefs/STREAM*.xspf");
foreach($playlists as $i => $file) {
	$x = simplexml_load_file($file);
    if($x->trackList->track[0]->album == $station) {
        debug_print("Found Station ".$station." in ".$file, "ADDFAVE");
        $newname = "prefs/USER".basename($file);
        system('mv "'.$file.'" "'.$newname.'"');
        $found = true;
        break;
    }
}

print '<html><body></body></html>';

?>