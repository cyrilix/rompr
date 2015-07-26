<?php

define('ROMPR_MULTIVALUE_SEPARATOR',';');

function musicCollectionUpdate() {
	global $prefs;
	$monitor = fopen('prefs/monitor','w');
    $dirs = $prefs['mopidy_collection_folders'];
    while (count($dirs) > 0) {
        $dir = array_shift($dirs);
        if ($dir == "Spotify Playlists") {
        	musicCollectionSpotifyPlaylistHack($monitor);
        } else {
	        debuglog("Scanning Directory ".$dir, "COLLECTION",8);
	        fwrite($monitor, "\nScanning Directory ".$dir);
	        doMpdParse('lsinfo "'.format_for_mpd(local_media_check($dir)).'"', $dirs, null);
	    }
    }
    fclose($monitor);
}

function musicCollectionSpotifyPlaylistHack() {
	$dirs = array();
	$playlists = do_mpd_command("listplaylists", true, true);
    if (array_key_exists('playlist', $playlists)) {
        foreach ($playlists['playlist'] as $pl) {
	    	debuglog("Scanning Playlist ".$pl,"COLLECTION",8);
	        fwrite($monitor, "\nScanning Playlist ".$pl);
	    	doMpdParse('listplaylistinfo "'.format_for_mpd($pl).'"',$dirs, array("spotify"));
	    }
	}
}

function local_media_check($dir) {
	if ($dir == "Local media") {
		// Mopidy-Local-SQlite contains a virtual tree sorting things by various keys
		// If we scan the whole thing we scan every file about 8 times. This is stoopid.
		// Check to see if 'Local media/Albums' is browseable and use that instead if it is.
		// Using Local media/Folders causes every file to be re-scanned every time we update
		// the collection, which takes fucking ages and includes all the m3u and pls shite we don't want
		$r = do_mpd_command('lsinfo "'.$dir.'/Albums"', false, false);
		if ($r === false) {
			return $dir;
		} else {
			return $dir.'/Albums';
		}
	}
	return $dir;
}

?>