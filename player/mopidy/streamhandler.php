<?php


	function is_stream($domain, $filedata) {
		$streamdomains = array("http", "mms", "rtsp", "https", "rtmp", "rtmps", "dirble", "tunein", "radio-de");
	    if (in_array($domain, $streamdomains) &&
	        !preg_match('#/item/\d+/file$#', $filedata['file']) &&
	        !preg_match('#http://leftasrain.com/#', $filedata['file'])) {
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
                $albumartist) = getStuffFromXSPF($filedata['file']);

        // Streams added to Mopidy by various backends return some useful metadata

        if (!$track_found ) {

        	// Mopidy's tracklist returns the staion name as the track name.
        	// This is a bit daft and I hope they change it.
            if (array_key_exists('Title', $filedata) &&
                !array_key_exists('Album', $filedata) &&
                !array_key_exists('Artist', $filedata) &&
                !(preg_match('/'.preg_quote($filedata['Title'],'/').'/', $filedata['file']))) {
                $album = $filedata['Title'];
            } else if (array_key_exists('Album', $filedata) && array_key_exists('Artist', $filedata) && array_key_exists('Title', $filedata)) {
                $album = $filedata['Album'];
                $name = $filedata['Title'];
                $artist = $filedata['Artist'];
            }

            if (array_key_exists('Genre', $filedata) && $filedata['Genre'] == "Podcast") {
                $album = array_key_exists('Album', $filedata) ? $filedata['Album'] : $album;
                $name = array_key_exists('Title', $filedata) ? $filedata['Title'] : "";
                $artist = array_key_exists('Artist', $filedata) ? $filedata['Artist'] : "";
                $type = "podcast";
            }

            $image = (array_key_exists('Image', $filedata)) ? $filedata['Image'] : $image;

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