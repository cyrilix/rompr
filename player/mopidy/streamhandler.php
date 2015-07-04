<?php

function is_stream($domain, $filedata) {
	$streamdomains = array("http", "mms", "rtsp", "https", "rtmp", "rtmps", "dirble", "tunein", "radio-de", "audioaddict", "oe1");
    $f = unwanted_array($filedata['file']);
    if (in_array($domain, $streamdomains) &&
        !preg_match('#/item/\d+/file$#', $f) &&
        !preg_match('#oe1:archive:#', $f) &&
        !preg_match('#vk\.me#', $f) &&
        !preg_match('#http://leftasrain.com/#', $f)) {
		return true;
	} else {
		return false;
	}
}

// Mopidy Stream Handling Functions
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
            $albumartist) = getStuffFromXSPF(unwanted_array($filedata['file']));

    // Streams added to Mopidy by various backends return some useful metadata

    if (!$track_found ) {

    	// Mopidy's tracklist returns the staion name as the track name.
    	// This is a bit daft and I hope they change it.
        if (array_key_exists('Title', $filedata) &&
            !array_key_exists('Album', $filedata) &&
            !array_key_exists('Artist', $filedata)) {

            $t = unwanted_array($filedata['Title']);
            $f = unwanted_array($filedata['file']);
            if (!(preg_match('/'.preg_quote($t,'/').'/', $f))) {
                $album = unwanted_array($filedata['Title']);
            }
        } else if (array_key_exists('Album', $filedata) && array_key_exists('Artist', $filedata) && array_key_exists('Title', $filedata)) {
            $album = unwanted_array($filedata['Album']);
            $artist = unwanted_array($filedata['Title']);
            $name = unwanted_array($filedata['Artist']);
        }

        if (array_key_exists('Genre', $filedata)) {
            $g = unwanted_array($filedata['Genre']);
            if ($g == "Podcast") {
                $album = array_key_exists('Album', $filedata) ? $filedata['Album'] : $album;
                $name = array_key_exists('Title', $filedata) ? $filedata['Title'] : "";
                $artist = array_key_exists('Artist', $filedata) ? $filedata['Artist'] : "";
                $image = "newimages/podcast-logo.svg";
                $type = "podcast";
            }
        }

        // Pretty up the images for some mopidy stream domains
        switch ($domain) {
            case "audioaddict":
                $image = "newimages/".$domain."-logo.png";
                break;

            case "oe1":
            case "tunein":
            case "radio-de":
            case "dirble":
                $image = "newimages/".$domain."-logo.svg";
                break;

            case "http":
                if (unwanted_array($filedata['Title']) == 'Bassdrive - Worldwide Drum and Bass Radio') {
                    $image = "newimages/bassdrive-logo.svg";
                }
                break;
        }


        $image = (array_key_exists('Image', $filedata) && $filedata['Image'] !== null) ? unwanted_array($filedata['Image']) : $image;

        $duration = (array_key_exists('Time', $filedata) && $filedata['Time'][0] != 0) ? $filedata['Time'][0] : $duration;

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