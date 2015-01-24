<?php

function is_stream($domain, $filedata) {
	$streamdomains = array("http", "mms", "rtsp", "https", "rtmp", "rtmps");
	if (in_array($domain, $streamdomains)) {
		return true;
	} else {
		return false;
	}
}

// MPD Stream mhandling function
function getStreamInfo($filedata, $domain) {

    list (  $track_found,
            $name,
            $duration,
            $artist,
            $album,
            $folder,
            $type,
            $image,
            $station,
            $stream,
            $albumartist) = getStuffFromXSPF($filedata['file']);

    if (!$track_found) {

        if ($album == "Unknown Internet Stream" && strrpos($filedata['file'], '#') !== false) {
            # Fave radio stations added by Cantata/MPDroid
            $album = substr($filedata['file'], strrpos($filedata['file'], '#')+1, strlen($filedata['file']));
        }

        if (array_key_exists('Name', $filedata) && $album == "Unknown Internet Stream") {
            $album = $filedata['Name'];
        }

        if (array_key_exists('Genre', $filedata) && $filedata['Genre'] == "Podcast") {
            $album = array_key_exists('Album', $filedata) ? $filedata['Album'] : $album;
            $name = array_key_exists('Title', $filedata) ? $filedata['Title'] : "";
            $artist = array_key_exists('Artist', $filedata) ? $filedata['Artist'] : "";
            $type = "podcast";
        }

        $duration = (array_key_exists('Time', $filedata) && $filedata['Time'] != 0) ? $filedata['Time'] : $duration;
    }

	return array( $name,
            $duration,
            $artist,
            $album,
            $folder,
            $type,
            $image,
            $station,
            $stream,
            $albumartist);
}

?>