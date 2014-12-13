<?php

require_once('JSONParser/JSONParser.php');

$current_object = null;
$plos = 0;
$models_to_use = array();
$collection = null;
$domainsdone = array();

// This contains two mechanisms for parsing JSON data.
// One is a stream-based handwritten mopidy parser designed to reduce memory usage.
// This, by default, is used to creating the collection, on-the-fly, and search.
// The other method uses jsopn_decode, whcih is massively faster but uses 10 times
// as much RAM. This is used for getting the tracklist and other simple commands
// that don't return much output.
// $fast is a boolean flag used to switch this behaviour
// mopidy_post_command will create a collection using a global $collection is $fast is false;
// Otherwise it will return parsed JSON results which can be collectionised using parse_mopidy_json_data

function doCollection($command, $params = null, $models = array(), $fast = false) {

    // Even when we're using mopidy's HTTP API we do 3 things almost purely in PHP
    // using the POST request form of that API instead of the websocket.
    // These are: building the collection, reading the playlist, and searching
    // This is because all of these commands need to go through the collectioniser
    // before being displayed. If we do them in the browser via the websocket then
    // we have to:
    //      send request to mopidy, get response, send response to here, get collection response back.
    // This is inefficient and uses a lot of browser memory. Much better to:
    //      send request to here, here sends request to mopidy and sends collection response back
    // The switch statement below has silly mpd commands in it for compatability reasons.

    // We also add tracks using this API because the to-ing and fro-ing of track lookups
    // is faster and easier to manage this way.
    global $models_to_use, $collection, $plpos, $domainsdone, $prefs;
    $collection = new musicCollection(null);
    $models_to_use = $models;
    $plpos = 0;
    $domainsdone = array();

    debug_print("Starting Up. Memory Used is ".memory_get_usage(),"COLLECTION");

    $files = array();
    $filecount = 0;
    if ($params === null) $params = (object) array();
    switch($command) {
        case "listallinfo":
            $now = time();
            debug_print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
            debug_print("Refreshing Mopidy's Library","MOPIDY");
            mopidy_post_command("core.library.refresh", $params, true);
            $dur = format_time(time() - $now);
            debug_print("Library Refresh Took ".$dur,"TIMINGS");
            $now = time();
            debug_print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","TIMINGS");
            debug_print("Starting Collection Creation/Track-By-Track Update","MOPIDY");
            debug_print("1. Memory Used is ".memory_get_usage(),"COLLECTION");
            prepareCollectionUpdate();
            $json = mopidy_post_command("core.library.search", $params, $prefs['lowmemorymode'] == "false" ? true : false);
            if ($prefs['lowmemorymode'] == "false") {
                parse_mopidy_json_data($collection, $json);
            }
            $dur = format_time(time() - $now);
            debug_print("Collection Creation/Track-By-Track Update Took ".$dur,"TIMINGS");
            break;
        case "playlistinfo":
            $json = mopidy_post_command("core.tracklist.get_tl_tracks", $params, true);
            parse_mopidy_json_data($collection, $json);
            break;
        default:
            mopidy_post_command($command, $params, $fast);
            if ($fast) {
                parse_mopidy_json_data($collection, $json);
            }
            break;
    }
    return $collection;

}

function mopidy_post_command($rpc, $paramlist, $fast = true) {
    global $prefs, $current_object;
    $parser = new JSONParser();
    $parser->setArrayHandlers('arrayStart', 'arrayEnd');
    $parser->setObjectHandlers('objStart', 'objEnd');
    $parser->setScalarHandler('scalar');

    $current_object = new genericMopidyThing(null, null);

    $jsonrpc = array(
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => $rpc,
        "params" => $paramlist
    );
    $poststring = json_encode($jsonrpc);
    debug_print("Sending Mopidy POST Command : ".$poststring,"MOPIDY");
    $params = array('http' => array(
                                    'method' => 'POST',
                                    'content' => $poststring
                    ));
    $ctx = stream_context_create($params);
    $fp = @fopen("http://".$prefs['mopidy_http_address'].":".$prefs['mopidy_http_port']."/mopidy/rpc", 'rb', false, $ctx);
    if (!$fp) {
        debug_print("Failed to open stream to http://".$prefs['mopidy_http_address'].":".$prefs['mopidy_http_port']."/mopidy/rpc","MOPIDY");
        header("HTTP/1.1 500 Internal Server Error");
        print get_int_text("label_update_error").": Failed To Communicate With Mopidy";
        exit(0);
    }
    if ($fast === false) {
        $parser->parseDocument($fp);
        fclose($fp);
        return (object) array();
    } else {
        $json = @stream_get_contents($fp);
        if ($json === false) {
            debug_print("Failed to read stream from http://".$prefs['mopidy_http_address'].":".$prefs['mopidy_http_port']."/mopidy/rpc","MOPIDY");
            header("HTTP/1.1 500 Internal Server Error");
            print get_int_text("label_update_error").": Failed To Communicate With Mopidy";
            exit(0);
        }
        fclose($fp);
        $data = json_decode($json);
        return $data->{'result'};
    }
}

function parse_mopidy_json_data($collection, $jsondata) {

    global $dbterms, $backend_in_use;
    $plpos = 0;
    foreach($jsondata as $searchresults) {

        if ($searchresults->{'__model__'} == "SearchResult") {

            if (property_exists($searchresults, 'artists') && $backend_in_use == "xml") {
                foreach ($searchresults->artists as $track) {
                    parseArtist($collection, $track);
                }
            }

            if (property_exists($searchresults, 'albums') && $backend_in_use == "xml") {
                foreach ($searchresults->albums as $track) {
                    parseAlbum($collection, $track);
                }
            }

            if (property_exists($searchresults, 'tracks')) {
                foreach ($searchresults->tracks as $track) {
                    parseTrack($collection, $track);
                }
            }

        } else if ($searchresults->{'__model__'} == "TlTrack") {
            parseTrack($collection, $searchresults->track, $plpos, $searchresults->{'tlid'});
            $plpos++;
        }
    }

}

class genericMopidyThing {

    public $current_array = null;
    public $parent = null;
    public $prop_name = null;

    public function __construct($parent, $prop_name) {
        $this->parent = $parent;
        $this->prop_name = $prop_name;
        $this->root = array();
        $this->current_array = 'root';
        $this->__model__ = "dummy";
    }

    public function newArray($name) {
        $this->{$name} = array();
        $this->current_array = $name;
    }

    public function newObject($name) {
        global $current_object;
        $current_object = new genericMopidyThing($this, $name);
        if ($name == "") {
            array_push($this->{$this->current_array}, $current_object);
        } else {
            $this->{$name} = $current_object;
        }
    }

    public function newProperty($name, $value) {
        if ($name == "") {
            array_push($this->{$this->current_array}, $value);
        } else {
            $this->{$name} = $value;
        }
    }

    public function finish() {
        global $current_object, $domainsdone;
        if (property_exists($this, '__model__') && $this->{'__model__'} == "Playlist") {
            debug_print("Finished Parsing Playlist ".$this->uri,"JSON");
            $d = getDomain($this->uri);
            if (!array_key_exists($d, $domainsdone)) {
                generic_sql_query("INSERT INTO Existingtracks (TTindex) SELECT TTindex FROM Tracktable WHERE Uri LIKE '".$d."%' AND LastModified IS NOT NULL AND Hidden = 0");
                $domainsdone[$d] = 1;
            }
        }
        if ($this->prop_name == "error") {
            debug_print("Mopidy POST Failed : ".$this->{'message'},"MOPIDY");
            exit(0);
        }
        return $this->prop_name;
    }

    public function propertyParsed() {
        global $models_to_use, $orig_object;
        // Here we remove the object we need from the array, and parse it if it needs to be parsed
        // Then we throw it away to keep memory usage to a minimum.
        // The 'live' memory we need is only enough to hold one tl_track object plus a bit more for
        // our base parser object
        if (count($this->{$this->current_array}) > 0) {
            if (in_array($this->{$this->current_array}[0]->{'__model__'}, $models_to_use) && (($this->parent !== null && $this->parent->current_array == "result") || $this->current_array == "result")) {
                $object = array_shift($this->{$this->current_array});
                parse_object($object);
                $object = null;
            } else if ($this->current_array == "result") {
                $object = array_shift($this->{$this->current_array});
                $object = null;
            }
        }
    }

}

function parse_object($object) {
    global $plpos, $collection;
    switch($object->{'__model__'}) {
        case "Track":
            parseTrack($collection, $object, null, null);
            break;

        case "Album":
            parseAlbum($collection, $object);
            break;

        case "Artist":
            parseArtist($collection, $object);
            break;

        case "TlTrack":
            parseTrack($collection, $object->track, $plpos, $object->{'tlid'});
            $plpos++;
            break;

    }
}

function objStart($value, $property) {
    global $current_object;
    $current_object->newObject($property);
}

function objEnd($value, $property) {
    global $current_object;
    $pn = $current_object->finish();
    $current_object = $current_object->parent;
    if ($current_object !== null && $pn == "") {
        $current_object->propertyParsed();
    }
}

function arrayStart($value, $property) {
    global $current_object;
    $current_object->newArray($property);
}

function arrayEnd($value, $property) {
}

function scalar($value, $property) {
    global $current_object;
    $current_object->newProperty($property, $value);
}

function parseArtist($collection, $track) {
    $trackdata = array();
    $trackdata['linktype'] = ROMPR_ARTIST;
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
    $trackdata['linktype'] = ROMPR_ALBUM;
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

function parseTrack($collection, $track, $plpos = null, $plid = null) {

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
    if (property_exists($track, 'disc_no') && $track->{'disc_no'} != 0) {
        $trackdata['Disc'] = $track->{'disc_no'};
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

    process_file($collection, $trackdata);

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