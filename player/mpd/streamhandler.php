<?php
$streamdomains = array(
    "http", "https", "mms", "mmsh", "mmst", "mmsu", "gopher", "rtp", "rtsp", "rtmp", "rtmpt",
    "rtmps", "dirble", "tunein", "radio-de", "audioaddict", "oe1");

function is_stream($domain, $filedata) {
    global $streamdomains;
    $f = $filedata['file'][0];
    debuglog("Checking ".$f." from ".$domain,"STREAMHANDLER",4);
	if (in_array($domain, $streamdomains) &&
        !preg_match('#/item/\d+/file$#', $f) &&
        strpos($f, 'vk.me') === false &&
        strpos($f, 'oe1:archive') === false &&
        strpos($f, 'http://leftasrain.com') === false)
    {
		debuglog("   It IS a stream","STREAMHANDLER",4);
        return true;
	} else {
        return false;
	}
}

// MPD Stream handling function
function getStreamInfo($filedata, $domain) {

    $url = $filedata['file'][0];

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

        if ($filedata['Name'] !== null) {
            debuglog("Setting album to ".$filedata['Name'][0],"STREAMHANDLER");
            $album = $filedata['Name'][0];
        }

        if ($filedata['Title'] !== null && $filedata['Name'] == null) {
            $name = '';
            $album = $filedata['Title'][0];
        }

        if ($filedata['Genre'][0] == "Podcast") {
            $album = ($filedata['Album'] !== null) ? $filedata['Album'][0] : $album;
            $name = ($filedata['Title'] !== null) ? $filedata['Title'][0] : "";
            $artist = ($filedata['Artist'] !== null) ? concatenate_artist_names($filedata['Artist']) : "";
            $image = "newimages/podcast-logo.svg";
            $type = "podcast";
        }

        // This is for sorting out some kind of Mopidy-related oddness but I can't remember
        // what it was or whether it's still relevant.
        if ($filedata['Album'] != null && $filedata['Artist'] != null && $filedata['Title'] != null) {
            $album = $filedata['Album'][0];
            $artist = $filedata['Title'][0];
            $name = $filedata['Artist'][0];
        }

        if ($filedata['Album'] == null && $filedata['Artist'] != null && $filedata['Title'] != null) {
            $artist = concatenate_artist_names($filedata['Artist']);
            $album = $filedata['Title'][0];
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
                if (strpos($url, 'bassdrive.com') !== false) {
                    $image = "newimages/bassdrive-logo.svg";
                    $album = "Bassdrive";
                }
                break;
        }

        $image = ($filedata['X-AlbumImage'][0] != null) ? $filedata['X-AlbumImage'][0] : $image;
        $duration = ($filedata['Time'][0] != 0) ? $filedata['Time'][0] : $duration;
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