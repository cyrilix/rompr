<?php

$station = $_POST['station'];
$found = false;
        
$playlists = glob("prefs/STREAM*.xspf");
foreach($playlists as $i => $file) {
	$x = simplexml_load_file($file);
    if($x->trackList->track[0]->album == $station) {
        error_log("Found Station ".$station." in ".$file);
        $newname = "prefs/USER".basename($file);
        system('mv "'.$file.'" "'.$newname.'"');
        $found = true;
        break;
    }
}

print '<html><body></body></html>';

?>