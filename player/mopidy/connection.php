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
    // $numresults = 0;
    // foreach($jsondata as $searchresults) {
    //     if ($searchresults->{'__model__'} == "SearchResult") {

    //         if (property_exists($searchresults, 'artists')) {
    //             $numresults += count($searchresults->artists);
    //         }

    //         if (property_exists($searchresults, 'albums')) {
    //             $numresults += count($searchresults->albums);
    //         }

    //         if (property_exists($searchresults, 'tracks')) {
    //             $numresults += count($searchresults->tracks);
    //         }
    //     }
    // }
    // $numprocessed = 0;
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
                    // $numprocessed++;
                    // put_progress(($numprocessed/$numresults)*50);
                }
            }

            if (property_exists($searchresults, 'albums')) {
                foreach ($searchresults->albums as $track) {
                    parseAlbum($collection, $track);
                    // $numprocessed++;
                    // put_progress(($numprocessed/$numresults)*50);
                }
            }

            if (property_exists($searchresults, 'tracks')) {
                foreach ($searchresults->tracks as $track) {
                    process_file($collection, parseTrack($track));
                    // $numprocessed++;
                    // put_progress(($numprocessed/$numresults)*50);
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
        $trackdata['Image'] = $track->{'images'}[0];
        if (substr($trackdata['Image'],0,4) == "http") {
           $trackdata['Image'] = "getRemoteImage.php?url=".$trackdata['Image'];
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
        $trackdata['Artist'] = joinartists($track->{'artists'});
        if (property_exists($track->{'artists'}[0], 'uri')) {
            $trackdata['SpotiArtist'] = $track->{'artists'}[0]->{'uri'};
        }

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
        $trackdata['Artist'] = joinartists($track->{'artists'});
        if (property_exists($track->{'artists'}[0], 'musicbrainz_id')) {
            $trackdata['MUSICBRAINZ_ARTISTID'] = $track->{'artists'}[0]->{'musicbrainz_id'};
        }
    }
    if (property_exists($track, 'composers')) {
        $trackdata['Composer'] = joinartists($track->{'composers'});
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
            $im = "";
            foreach ($track->{'album'}->{'images'} as $i) {
                if ($im === "") {
                    $im = $i;
                }
            }
            if (substr($im,0,4) == "http") {
                $im = "getRemoteImage.php?url=".$im;
            }
            $trackdata['Image'] = $im;
        }
        if (property_exists($track->{'album'}, 'uri')) {
            $trackdata['SpotiAlbum'] = $track->{'album'}->{'uri'};
        }
        if (property_exists($track->{'album'}, 'artists')) {
            $trackdata['AlbumArtist'] = joinartists($track->{'album'}->{'artists'});
            if (property_exists($track->{'album'}->{'artists'}[0], 'musicbrainz_id')) {
                $trackdata['MUSICBRAINZ_ALBUMARTISTID'] = $track->{'album'}->{'artists'}[0]->{'musicbrainz_id'};
            }
            if (property_exists($track->{'album'}->{'artists'}[0], 'uri')) {
                $trackdata['SpotiArtist'] = $track->{'album'}->{'artists'}[0]->{'uri'};
            }
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

function joinartists($artists) {

    // NOTE : This function is duplicated in the javascript side. It's important the two stay in sync
    // See uifunctions.js

    $art = array();
    foreach($artists as $a) {
        if (property_exists($a, 'name')) {
            if (preg_match('/ & /', $a->{'name'}) || preg_match('/ and /i', $a->{'name'})) {
                // This might be a problem in Mopidy BUT Spotify tracks are coming back with eg
                // artist[0] = King Tubby, artist[1] = Johnny Clarke, artist[2] = King Tubby & Johnny Clarke
                $art = array( $a->name );
                break;
            } else {
                array_push($art, $a->{'name'});
            }
        }
    }
    if (count($art) == 1) {
        return $art[0];
    } else if (count($art) == 2) {
        return implode(' & ',$art);
    } else {
        $f = array_slice($art, 0, count($art) - 1);
        return implode($f, ", ")." & ".$art[count($art) - 1];
    }
}

function close_player() {
	return true;
}

?>