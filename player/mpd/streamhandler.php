<?php

function is_stream($domain, $filedata) {
    $streamdomains = array(
        "http", "https", "mms", "mmsh", "mmst", "mmsu", "gopher", "rtp", "rtsp", "rtmp", "rtmpt",
        "rtmps", "dirble", "tunein", "radio-de", "audioaddict", "oe1");
    $f = unwanted_array($filedata['file']);
	if (in_array($domain, $streamdomains) &&
        !preg_match('#/item/\d+/file$#', $f) &&
        !preg_match('#oe1:archive:#', $f) &&
        !preg_match('#vk\.me#', $f) &&
        !preg_match('#http://leftasrain.com/#', $f)) {
		return true;
	} else {
        # Need to return false if this is NOT a stream (i.e Time > 0)
		// return (!array_key_exists('Time', $filedata) || unwanted_array($filedata['Time'] == 0));
	}
}

// MPD Stream handling function
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

        debuglog(
            "Stream Track ".$url." from ".$domain." was not found in stored library","STREAMHANDLER"
            ,5
        );

        if (strrpos($url, '#') !== false) {
            # Fave radio stations added by Cantata/MPDroid
            $album = substr($url, strrpos($url, '#')+1, strlen($url));
        }

        if (array_key_exists('Name', $filedata)) {
            debuglog("Setting album to ".unwanted_array($filedata['Name']),"STREAMHANDLER");
            $album = unwanted_array($filedata['Name']);
        }

        if (array_key_exists('Title', $filedata) && !array_key_exists('Name', $filedata)) {
            $name = '';
            $album = unwanted_array($filedata['Title']);
        }

        if (array_key_exists('Genre', $filedata) && unwanted_array($filedata['Genre']) == "Podcast") {
            $album = array_key_exists('Album', $filedata) ? $filedata['Album'] : $album;
            $name = array_key_exists('Title', $filedata) ? $filedata['Title'] : "";
            $artist = array_key_exists('Artist', $filedata) ? $filedata['Artist'] : "";
            $image = "newimages/podcast-logo.svg";
            $type = "podcast";
        }

        // This is to do with something odd that Mopidy does, but I forget what.
        if (array_key_exists('Album', $filedata) &&
            array_key_exists('Artist', $filedata) &&
            array_key_exists('Title', $filedata) &&
            unwanted_array($filedata['Album']) != "" &&
            unwanted_array($filedata['Artist']) != "" &&
            unwanted_array($filedata['Title']) != "") {
            $album = unwanted_array($filedata['Album']);
            $artist = unwanted_array($filedata['Title']);
            $name = unwanted_array($filedata['Artist']);
        }

        if ((!array_key_exists('Album', $filedata) || unwanted_array($filedata['Album']) == "") &&
            array_key_exists('Artist', $filedata) &&
            array_key_exists('Title', $filedata)) {
            $artist = unwanted_array($filedata['Artist']);
            $album = unwanted_array($filedata['Title']);
            $name= "";
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
                if (array_key_exists('Title', $filedata) &&
                    unwanted_array($filedata['Title']) ==
                    'Bassdrive - Worldwide Drum and Bass Radio') {
                        $image = "newimages/bassdrive-logo.svg";
                }
                if (preg_match('/archives.bassdrivearchive.com/', $url)) {
                    $image = "newimages/bassdrive-logo.svg";
                }
                break;
        }

        $image = (array_key_exists('Image', $filedata) && $filedata['Image'] !== null) ?
            unwanted_array($filedata['Image']) : $image;
        $duration = (array_key_exists('Time', $filedata) && $filedata['Time'] != 0) ?
            unwanted_array($filedata['Time']) : $duration;
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