<?php
chdir('..');

include ("includes/vars.php");
include ("includes/functions.php");
include ("collection/collection.php");
include ("player/mpd/connection.php");
include ("backends/sql/backend.php");
$trackbytrack = false;

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
    	        $matches = array();
    	        $link = $track->url;
    	        if ($prefs['player_backend'] == "mpd" && preg_match("/api\.soundcloud\.com\/tracks\/(\d+)\//", $track->url, $matches)) {
    	            debuglog(" ... Link is SoundCloud","PLAYLISTS");
    	            $link = "soundcloud://track/".$matches[1];
    	        }
    	        $pls[rawurlencode($name)][] = array(
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
    }

    print json_encode($pls);

}

?>
