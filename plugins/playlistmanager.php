<?php
chdir('..');

include ("includes/vars.php");
include ("includes/functions.php");
include ("collection/collection.php");
include ("player/mpd/connection.php");
include ("backends/xml/backend.php");

switch ($_REQUEST['action']) {

	case "getlist":
		print_playlists_as_json();
		break;

}

function print_playlists_as_json() {
	global $connection, $putinplaylistarray, $playlist;
    $playlists = do_mpd_command($connection, "listplaylists", null, true);
    if (!is_array($playlists)) {
        $playlists = array();
    } else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
        $temp = $playlists['playlist'];
        $playlists = array();
        $playlists['playlist'][0] = $temp;
    }

    $pls = array();
    $putinplaylistarray = true;
    foreach ($playlists['playlist'] as $name) {
    	$playlist = array();
    	$pls[$name] = array();
        doCollection('listplaylistinfo "'.$name.'"', null, array("TlTrack"), true);
        $c = 0;
        $plimage = "";
        $key = md5("Playlist ".$name);
        if (file_exists('albumart/asdownloaded/'.$key.".jpg")) {
        	$plimage = 'albumart/asdownloaded/'.$key.".jpg";
        }
        foreach($playlist as $track) {
	        $matches = array();
	        $link = $track->url;
	        if (preg_match("/api\.soundcloud\.com\/tracks\/(\d+)\//", $track->url, $matches)) {
	            debug_print(" ... Link is SoundCloud","PLAYLISTS");
	            $link = "soundcloud://track/".$matches[1];
	        }
	        $pls[$name][] = array(
	        	'Uri' => $link,
	        	'Title' => $track->name,
	            "Album" => $track->album,
    	        "Artist" => $track->artist,
	        	'albumartist' => $track->albumobject->artist,
	        	'duration' => $track->duration,
	        	'Image' => $track->albumobject->getImage('small'),
	        	'key' => $track->albumobject->getKey(),
	        	'pos' => $c,
	        	'plimage' => $plimage
	        );
	        $c++;
	    }
    }

    print json_encode($pls);

}

?>
