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

    $url = unwanted_array($filedata['file']);

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
            $albumartist) = getStuffFromXSPF($url);

    if (!$track_found) {

        if ($album == "Unknown Internet Stream" && strrpos($url, '#') !== false) {
            # Fave radio stations added by Cantata/MPDroid
            $album = substr($url, strrpos($url, '#')+1, strlen($url));
        }

        if (array_key_exists('Name', $filedata) && $album == "Unknown Internet Stream") {
            $album = unwanted_array($filedata['Name']);
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