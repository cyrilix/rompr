<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

$count = 1;
$divtype = "album1";
$collection = null;

$collection = doCollection(null, json_decode(file_get_contents('php://input')));
$output = new collectionOutput($ALBUMSLIST);
createXML($collection->getSortedArtistList(), "a", $output);
$output->closeFile();
dumpAlbums('aalbumroot');

function parse_mopidy_json_data($collection, $jsondata) {

	foreach($jsondata as $track) {

		$trackdata = array();
		if (property_exists($track, 'uri')) {
			$trackdata['file'] = $track->{'uri'};
		}
		if (property_exists($track, 'name')) {
			$trackdata['Title'] = $track->{'name'};
		}
		if (property_exists($track, 'length')) {
			$trackdata['Time'] = $track->{'length'}/1000;
		}
		if (property_exists($track, 'track_no')) {
			$trackdata['Track'] = $track->{'track_no'};
		}
		if (property_exists($track, 'date')) {
			$trackdata['Date'] = $track->{'date'};
		}
		if (property_exists($track, 'musicbrainz_id')) {
			$trackdata['MUSICBRAINZ_TRACKID'] = $track->{'musicbrainz_id'};
		}
		if (property_exists($track, 'artists')) {
			if (property_exists($track->{'artists'}[0], 'name')) {
				$trackdata['Artist'] = $track->{'artists'}[0]->{'name'};
			}
			if (property_exists($track->{'artists'}[0], 'musicbrainz_id')) {
				$trackdata['MUSICBRAINZ_ARTISTID'] = $track->{'artists'}[0]->{'musicbrainz_id'};
			}
		}
		if (property_exists($track, 'album')) {
			if (property_exists($track->{'album'}, 'musicbrainz_id')) {
				$trackdata['MUSICBRAINZ_ALBUMID'] = $track->{'album'}->{'musicbrainz_id'};
			}
			if (property_exists($track->{'album'}, 'name')) {
				$trackdata['Album'] = $track->{'album'}->{'name'};
			}
			if (property_exists($track->{'album'}, 'artists')) {
				if (property_exists($track->{'album'}->{'artists'}[0], 'name')) {
					$trackdata['AlbumArtist'] = $track->{'album'}->{'artists'}[0]->{'name'};
				}
				if (property_exists($track->{'album'}->{'artists'}[0], 'musicbrainz_id')) {
					$trackdata['MUSICBRAINZ_ALBUMARTISTID'] = $track->{'album'}->{'artists'}[0]->{'musicbrainz_id'};
				}
			}
		}

		process_file($collection, $trackdata);
	}

}

?>
