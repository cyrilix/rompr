<?php
chdir('../..');

include ("includes/vars.php");
include ("includes/functions.php");
include ("collection/collection.php");
include ("player/mpd/connection.php");
include ("backends/sql/backend.php");

switch ($_REQUEST['action']) {

	case "getlist":
		print_playlists_as_json();
		break;

}

function print_playlists_as_json() {
	global $putinplaylistarray, $playlist, $prefs;
    $playlists = do_mpd_command("listplaylists", true, true);
    $pls = array();
    $putinplaylistarray = true;
    if (array_key_exists('playlist', $playlists)) {
        foreach ($playlists['playlist'] as $name) {
        	$playlist = array();
        	$pls[rawurlencode($name)] = array();
            doCollection('listplaylistinfo "'.$name.'"');
            $c = 0;
            $plimage = "";
            $key = md5("Playlist ".htmlentities($name));
            if (file_exists('albumart/asdownloaded/'.$key.".jpg")) {
            	$plimage = 'albumart/asdownloaded/'.$key.".jpg";
            }
            foreach($playlist as $track) {
                list($flag, $link) = $track->get_checked_url();
    	        $pls[rawurlencode($name)][] = array(
    	        	'Uri' => $link,
    	        	'Title' => $track->tags['Title'],
    	            "Album" => $track->albumobject->name,
        	        "Artist" => $track->get_artist_string(),
    	        	'albumartist' => $track->albumobject->artist,
    	        	'duration' => $track->tags['Time'],
    	        	'Image' => $track->albumobject->getImage('small'),
    	        	'key' => $track->albumobject->getKey(),
    	        	'pos' => $c,
    	        	'plimage' => $plimage
    	        );
    	        $c++;
    	    }
        }
    }

    print json_encode($pls);

}

?>
