<?php

function doCollection($command) {

    $collection = new musicCollection(null);

    $files = array();
    $filecount = 0;
    parse_mopidy_json_data($collection, json_decode(file_get_contents('php://input')));

    return $collection;

}

function parse_mopidy_json_data($collection, $jsondata) {

    global $dbterms;
    $plpos = 0;

    foreach($jsondata as $searchresults) {

        if ($searchresults->{'__model__'} == "DBTerms") {

            if (property_exists($searchresults, 'rating')) {
                $dbterms['rating'] = $searchresults->rating;
            }
            if (property_exists($searchresults, 'tags')) {
                $dbterms['tags'] = $searchresults->tags;
            }

        } else if ($searchresults->{'__model__'} == "SearchResult") {

            if (property_exists($searchresults, 'artists')) {
                foreach ($searchresults->artists as $track) {
                    parseArtist($collection, $track);
                }
            }

            if (property_exists($searchresults, 'albums')) {
                foreach ($searchresults->albums as $track) {
                    parseAlbum($collection, $track);
                }
            }

            if (property_exists($searchresults, 'tracks')) {
                foreach ($searchresults->tracks as $track) {
                    process_file($collection, parseTrack($track));
                }
            }

        } else if ($searchresults->{'__model__'} == "TlTrack") {
            process_file($collection, parseTrack($searchresults->track, $plpos, $searchresults->{'tlid'}));
        }
        $plpos++;
    }

}

function parseArtist($collection, $track) {
    $trackdata = array();
    $trackdata['linktype'] = 'artist';
    if (property_exists($track, 'uri')) {
        $trackdata['SpotiArtist'] = $track->{'uri'};
        $trackdata['file'] = $track->{'uri'};
    }
    if (property_exists($track, 'name')) {
        $trackdata['Artist'] = $track->{'name'};
        $trackdata['Title'] = "Artist:".$track->{'name'};
    }
    process_file($collection, $trackdata);
}

function parseAlbum($collection, $track) {
    $trackdata = array();
    $domain = null;
    $trackdata['linktype'] = 'album';
    if (property_exists($track, 'uri')) {
        $trackdata['file'] = $track->{'uri'};
        $domain = getDomain($track->{'uri'});
    }
    if (property_exists($track, 'images')) {
        foreach($track->{'images'} as $image) {
            if ($image != "") {
                $trackdata['Image'] = $image;
                if (substr($image,0,4) == "http") {
                   $trackdata['Image'] = "getRemoteImage.php?url=".$trackdata['Image'];
                }
            }
        }
    }
    if (property_exists($track, 'date')) {
        $trackdata['Date'] = $track->{'date'};
    }
    if (property_exists($track, 'name')) {
        $trackdata['Album'] = $track->{'name'};
        $trackdata['Title'] = "Album:".$track->{'name'};
    }
    if (property_exists($track, 'artists')) {
        $trackdata['Artist'] = joinartists($track->{'artists'}, 'name');
        $trackdata['SpotiArtist'] = joinartists($track->{'artists'}, 'uri');
    }
    if ($domain == "podcast" && !array_key_exists('Artist', $trackdata)) {
        $trackdata['Artist'] = "Podcasts";
    }

    process_file($collection, $trackdata);
}

function parseTrack($track, $plpos = null, $plid = null) {

    $trackdata = array();
    $trackdata['Pos'] = $plpos;
    $trackdata['Id'] = $plid;
    $domain = null;
    if (property_exists($track, 'uri')) {
        $trackdata['file'] = $track->{'uri'};
        $domain = getDomain($track->{'uri'});
    } else {
        $trackdata['file'] = "Broken Track!";
        $trackdata['Artist'] = "[Unknown]";
        $trackdata['Album'] = "[Unknown]";
    }
    if (property_exists($track, 'name')) {
        $trackdata['Title'] = $track->{'name'};
    }
    if (property_exists($track, 'length')) {
        $trackdata['Time'] = $track->{'length'}/1000;
    } else {
        $trackdata['Time'] = 0;
    }
    if (property_exists($track, 'track_no')) {
        $trackdata['Track'] = $track->{'track_no'};
    } else {
        $trackdata['Track'] = 0;
    }
    if (property_exists($track, 'disc_no')) {
        $trackdata['Disc'] = $track->{'disc_no'};
    } else {
        $trackdata['Disc'] = 1;
    }
    if (property_exists($track, 'date')) {
        $trackdata['Date'] = $track->{'date'};
    }
    if (property_exists($track, 'genre')) {
        $trackdata['Genre'] = $track->{'genre'};
    }
    if (property_exists($track, 'last_modified')) {
        $trackdata['Last-Modified'] = $track->{'last_modified'};
    } else {
        $trackdata['Last-Modified'] = 0;
    }
    if (property_exists($track, 'musicbrainz_id')) {
        $trackdata['MUSICBRAINZ_TRACKID'] = $track->{'musicbrainz_id'};
    }
    if (property_exists($track, 'artists')) {
        $trackdata['Artist'] = joinartists($track->{'artists'}, 'name');
        $trackdata['MUSICBRAINZ_ARTISTID'] = joinartists($track->{'artists'}, 'musicbrainz_id');
    }
    if (property_exists($track, 'composers')) {
        $trackdata['Composer'] = joinartists($track->{'composers'}, 'name');
    }
    if (property_exists($track, 'performers')) {
        $trackdata['Performer'] = joinartists($track->{'performers'}, 'name');
    }
    if (property_exists($track, 'album')) {
        if (property_exists($track->{'album'}, 'musicbrainz_id')) {
            $trackdata['MUSICBRAINZ_ALBUMID'] = $track->{'album'}->{'musicbrainz_id'};
        }
        // Album date overrides track date. I guess. Not sure. Probably a good idea.
        if (property_exists($track->{'album'}, 'date')) {
            $trackdata['Date'] = $track->{'album'}->{'date'};
        }
        if (property_exists($track->{'album'}, 'name')) {
            $trackdata['Album'] = $track->{'album'}->{'name'};
        }
        if (property_exists($track->{'album'}, 'images')) {
            foreach($track->{'album'}->{'images'} as $image) {
                if ($image != "") {
                    $trackdata['Image'] = $image;
                    if (substr($image,0,4) == "http") {
                       $trackdata['Image'] = "getRemoteImage.php?url=".$trackdata['Image'];
                    }
                }
            }
        }
        if (property_exists($track->{'album'}, 'uri')) {
            $trackdata['SpotiAlbum'] = $track->{'album'}->{'uri'};
        }
        if (property_exists($track->{'album'}, 'artists')) {
            $trackdata['AlbumArtist'] = joinartists($track->{'album'}->{'artists'}, 'name');
            $trackdata['MUSICBRAINZ_ALBUMARTISTID'] = joinartists($track->{'album'}->{'artists'}, 'musicbrainz_id');
            $trackdata['SpotiArtist'] = joinartists($track->{'album'}->{'artists'}, 'uri');
        }
    }

    if ($domain == "podcast" && !array_key_exists('Album', $trackdata)) {
        $trackdata['Album'] = "Podcasts";
    }

    if ($domain == "podcast" && !array_key_exists('Artist', $trackdata)) {
        $trackdata['Artist'] = "Podcasts";
    }

    return $trackdata;

}

function joinartists($artists, $key) {

    // NOTE : This function is duplicated in the javascript side. It's important the two stay in sync
    // See uifunctions.js

    $art = array();
    foreach($artists as $a) {
        if (property_exists($a, $key)) {
            if (preg_match('/ & /', $a->{$key}) || preg_match('/ and /i', $a->{$key})) {
                // This might be a problem in Mopidy BUT Spotify tracks are coming back with eg
                // artist[0] = King Tubby, artist[1] = Johnny Clarke, artist[2] = King Tubby & Johnny Clarke
                $art = array( $a->{$key} );
                break;
            } else {
                array_push($art, $a->{$key});
            }
        } else {
            array_push($art, "");
        }
    }
    return $art;
}

function close_player() {
	return true;
}

?>