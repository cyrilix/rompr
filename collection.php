<?php

set_time_limit(240);
$COMPILATION_THRESHOLD = 6;
$numtracks = 0;
$totaltime = 0;

$xspf_loaded = false;
$lfm_xspfs = array();
$stream_xspfs = array();

$current_artist = "";
$current_album = "";
$abm = false;
$curr_is_spotify = false;

$playlist = array();

class album {
    public function __construct($name, $artist) {
        $this->artist = $artist;
        $this->name = $name;
        $this->tracks = array();
        $this->folder = null;
        $this->iscompilation = false;
        $this->musicbrainz_albumid = null;
        $this->datestamp = null;
        $this->spotilink = null;
        $this->is_spotify = false;
        $this->image = null;
    }

    public function newTrack($object) {
        if (substr($object->url,0,8) == "spotify:") {
            $this->is_spotify = true;
        }
        $this->tracks[] = $object;

        if ($this->folder == null) {
            $this->folder = $object->folder;
        }
        if ($this->image == null) {
            $this->image = $object->image;
        }
        if ($this->datestamp == null) {
            $this->datestamp = $object->datestamp;
        }
        $object->setAlbumObject($this);
    }

    public function isCompilation() {
        return $this->iscompilation;
    }
    
    public function setSpotilink($link) {
        //debug_print("Setting spotilink for album ".$this->name." to ".$link);
        $this->spotilink = $link;
        $this->is_spotify = true;
    }

    public function setImage($image) {
        $this->image = $image;
    }

    public function setDate($date) {
        $this->date = $date;
    }

    public function getImage($size, $trackimage = null) {
        // Return image for an album or track
        // $image = null;
        // // Default is no image
        // if ($size == "small") {
        //     $image = "images/album-unknown-small.png";
        // } else {
        //     $image = "images/album-unknown.png";
        // }
        $image = "";
        // If we have a backend-supplied album image
        if ($this->image) {
            $image = $this->image;
        } 
        // If the track supplied an image
        if ($trackimage) {
            $image = $trackimage;
        }
        // Finally, if there's a local image this overrides everything else
        $artname = md5($this->artist." ".$this->name);
        if (file_exists("albumart/".$size."/".$artname.".jpg")) {
            $image = "albumart/".$size."/".$artname.".jpg";
        }
        return $image;
    }

    public function setAsCompilation() {
        $this->artist = "Various Artists";
        $this->iscompilation = true;
    }

    public function trackCount() {
        return count($this->tracks);
    }

    public function sortTracks() {

        $temp = array();
        $number = 0;
        foreach ($this->tracks as $num => $ob) {
            if ($ob->number) {
                $index = $ob->number;
            } else {
                $index = $number;
            }
            # Just in case we have a multiple disc album with no disc number tags
            # (or mpd 0.16 and earlier which doesn't read Disc tags from m4a files)
            $discno = intval($ob->disc);
            if (!array_key_exists($discno, $temp)) {
            	$temp[$discno] = array();
            }
            while(array_key_exists(intval($index), $temp[$discno])) {
                $discno++;
	            if (!array_key_exists($discno, $temp)) {
    	        	$temp[$discno] = array();
                }
            }
            $temp[$discno][intval($index)] = $ob;
            $number++;
        }
        $numdiscs = count($temp);
        $this->tracks = array();
        $temp2 = array_keys($temp);
        sort($temp2, SORT_NUMERIC);
        foreach($temp2 as $i => $a) {
            $temp3 = array_keys($temp[$a]);
            sort($temp3, SORT_NUMERIC);
            $temp4 = array();
            foreach($temp3 as $cock) {
                $temp4[$cock] = $temp[$a][$cock];
            }
            foreach($temp4 as $r => $o) {
                $this->tracks[] = $o;
            }
        }
        return $numdiscs;
    }

    public function getDate() {
        if (preg_match('/(\d\d\d\d)/', $this->datestamp, $matches)) {
            return $matches[1];
        } else {
            return null;
        }
    }

}

class artist {

    public function __construct($name) {
        $this->name = $name;
        $this->albums = array();
        $this->spotilink = null;
    }

    public function newAlbum($object) {
        // Pass an album object to this function
        $key = strtolower($object->name);
        while (array_key_exists($key, $this->albums)) {
            debug_print("Trying to add new album '" . $key . "' to artist '" . $this->name . "' but it already exists");
            $key = $key."1";
        }
        $this->albums[$key] = $object;
    
//         if (array_key_exists(strtolower($object->name), $this->albums)) {
//             debug_print("Trying to add new album '" . $object->name . "' to artist '" . $this->name . "' but it already exists");
//         } else {
//             $this->albums[strtolower($object->name)] = $object;
//         }
    }

}

class track {
    public function __construct($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                                $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage) {

        $this->artist = $artist;
        $this->album = $album;
        $this->name = $name;
        $this->url = $file;
        $this->duration = $duration;
        $this->number = $number;
        $this->datestamp = $date;
        $this->genre = $genre;
        $this->folder = $directory;
        $this->albumartist = $albumartist;
        $this->disc = $disc;
        $this->original_image = $origimage;
        // Only used by playlist
        $this->albumobject = null;
        $this->type = $type;
        $this->image = $image;
        $this->backendid = $backendid;
        $this->playlistpos = $playlistpos;
        $this->expires = $expires;
        $this->stationurl = $stationurl;
        $this->station = $station;
        $this->stream = $stream;
        $this->musicbrainz_artistid = $mbartist;
        $this->musicbrainz_albumid = $mbalbum;
        $this->musicbrainz_albumartistid = $mbalbumartist;
        $this->musicbrainz_trackid = $mbtrack;
    }

    public function getImage($size) {
        return ($this->albumobject->getImage($size, $this->image));
    }

    public function getSpotiAlbum() {
        return $this->albumobject->spotilink;
    }

    public function setAlbumObject($object) {
        $this->albumobject = $object;
        $object->musicbrainz_albumid = $this->musicbrainz_albumid;
    }
}

class musicCollection {

    public function __construct($connection) {
        $this->connection = $connection;
        $this->artists = array();
        $this->albums = array();
    }

    private function findAlbumByName($album) {
        $results = array();
        foreach($this->albums as $object) {
            if(strtolower($object->name) == $album) {
                $results[] = $object;
            }
        }
        return $results;
    }

    private function findAlbum($album, $artist, $directory, $sptfy) {
        if ($artist != null) {
            $a = trim($album);
            foreach ($this->artists[strtolower($artist)]->albums as $object) {
                if ($a == trim($object->name) && $object->is_spotify == $sptfy) {
                    return $object;
                }
            }
        }
        if ($directory != null && $directory != ".") {
            foreach ($this->findAlbumByName(strtolower($album)) as $object) {
                if ($directory == $object->folder && $object->is_spotify == $sptfy) {
                    return $object;
                }
            }
        }
        return false;
    }

    public function newTrack($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                                $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
                                $origimage, $spotialbum, $spotiartist) {

        global $current_album;
        global $current_artist;
        global $abm;
        global $curr_is_spotify;
        global $playlist;
        
        $sortartist = ($albumartist == null) ? $artist : $albumartist;
        $artistkey = strtolower(preg_replace('/^The /i', '', $sortartist));
        //Some discogs tags have 'Various' instead of 'Various Artists'
        if ($artistkey == "various") {
            $artistkey = "various artists";
        }

        $t = new track($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                        $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                        $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage);
        // If artist doesn't exist, create it - indexed by all lower case name for convenient sorting and grouping
        if (!array_key_exists($artistkey, $this->artists)) {
            $this->artists[$artistkey] = new artist($sortartist);
        }

        // IF this is a spotify artist result, then we need do nothing further
        if (substr($file,0,14) == "spotify:artist") {
            $this->artists[$artistkey]->spotilink = $file;
            return true;
        }

        if ($this->artists[$artistkey]->spotilink == null && $spotiartist != null) {
            $this->artists[$artistkey]->spotilink = $spotiartist;
        }
        
        // Keep Spotify albums separate from local albums
        if (substr($file,0,13) == "spotify:album") {
            $abm = $this->findAlbum($album, $artistkey, null, true);
            if ($abm == false) {
                $abm = new album($album, $sortartist);
                $this->albums[] = $abm;
                $this->artists[$artistkey]->newAlbum($abm);
            }
            $abm->setSpotilink($file);
            if ($image) {
                $abm->setImage($image);
            }
            if ($date) {
                $abm->setDate($date);
            }
            $current_artist = $sortartist;
            $current_album = $album;
            $curr_is_spotify = true;
            return true;
        } 
        
        $sptfy = false;
        if (substr($file,0,8) == "spotify:") {
            $sptfy = true;
        }
                
        if ($album != $current_album || $sortartist != $current_artist || $sptfy != $curr_is_spotify) {
            $abm = false;
        }

        // Albums are not indexed by name, since we may have 2 or more albums with the same name by multiple artists
        // Does an album with this name by this aritst already exist?

        if ($abm == false) {
            $abm = $this->findAlbum($album, $artistkey, null, $sptfy);
            if ($abm == false) {
                // Does an album with this name where the tracks are in the same directory exist?
                $abm = $this->findAlbum($album, null, $directory, $sptfy);
                if ($abm != false) {
                    // We found one - it's not by the same artist so we need to mark it as a compilation if it isn't already
                    if (!($abm->isCompilation())) {
                        $abm->setAsCompilation();
                        // Create various artists group if it isn't there
                        if (!array_key_exists("various artists", $this->artists)) {
                            $this->artists["various artists"] = new artist("Various Artists");
                        }
                        // Add the album to the various artists group
                        $this->artists["various artists"]->newAlbum($abm);
                    }
                } else {
                    // We didn't find the album, so create it
                    $abm = new album($album, $sortartist);
                    $this->albums[] = $abm;
                    $this->artists[$artistkey]->newAlbum($abm);
                }
            }
            // Store current artist and album so we only have to do the search if one of them changes.
            // This saves a minor but not insignificant number of CPU cycles, which will be noticeable with 
            // large collections on slow servers (eg Intel Atom/Raspberry Pi).
            // This one change provided a 10% speed increase on my Atom-based server.
            $current_artist = $sortartist;
            $current_album = $album;
            $curr_is_spotify = $sptfy;
        }
        $abm->newTrack($t);
        if ($abm->spotilink == null && $spotialbum != null) {
            $abm->spotilink = $spotialbum;
        }
        
        if ($playlistpos !== null) {
            $playlist[$playlistpos] = $t;
        }
    }

    // NOTE :   If it's a track from a compilation, it's now been added to the track artist AND various artists 
    //              and the album has the iscompilation flag set
    //              and the artist name for the album set to Various Artists
    //          Tracks which have 'Various Artists' as the artist name in the ID3 tag will be in the various artists group too,
    //              but 'iscompilation' will not be set unless as least one of the tracks on the album has something else as the artist name. 
    //              This shouldn't matter.

    public function getSortedArtistList() {
        $temp = array_keys($this->artists);
        sort($temp, SORT_STRING);
        return $temp;
    }

    public function artistName($artist) {
        return $this->artists[$artist]->name;
    }

    public function getAlbumList($artist, $ignore_compilations) {
        global $prefs;
        $albums = array();
        foreach($this->artists[$artist]->albums as $i => $object) {
            if ($object->isCompilation() && $ignore_compilations) {

            } else {
                if ($prefs['sortbydate'] == "true" &&
                    !($artist == "various artists" && $prefs['notvabydate'] == "true")) {
                    $d = $object->getDate();
                    if ($d == null) { 
                        $d = "99999";
                    }
                    while (array_key_exists($d, $albums)) {
                        $d = "0".$d;
                    }
                    $albums[$d] = $object;
                } else {
                    $d = $object->name;
                    while (array_key_exists($d, $albums)) {
                        $d = $d."1";
                    }
                    $albums[$d] = $object;
                }
            }
        }
        if ($prefs['sortbydate'] == "true" &&
            !($artist == "various artists" && $prefs['notvabydate'] == "true")) {
            ksort($albums, SORT_NUMERIC);
        } else {
            ksort($albums, SORT_STRING);
        }
        return $albums;
    }
    
    public function spotilink($artist) {
        return $this->artists[$artist]->spotilink;
    }

    public function createCompilation($name, $albums) {
        debug_print("Creating Compilation out of ".$name);
        // mark an already existing album as a compilation
        $abm = new album($name, "");
        // Take all the tracks from the existing albums with the same name
        foreach($albums as $i => $object) {
            $object->setAsCompilation();
            if ($abm->spotilink == null) {
                $abm->spotilink = $object->spotilink;
            }
            foreach($object->tracks as $t) {
                $abm->newTrack($t);
            }
        }
        $this->albums[] = $abm;
        $abm->setAsCompilation();
        if (!array_key_exists("various artists", $this->artists)) {
            $this->artists["various artists"] = new artist("Various Artists");
        }
        // Add the album to the various artists group
        $this->artists["various artists"]->newAlbum($abm);
    }

}

// Create a new collection
// Now... the trouble is that do_mpd_command returns a big array of the parsed text from mpd, which is lovely and all that.
// Trouble is, the way that works is that everything is indexed by number so parsing that array ONLY works IF every single
// track has the exact same tags - which in reality just ain't gonna happen.
// So - the only thing we can rely on is the list of files and we have to parse it very carefully.
// However on the plus side parsing 'listallinfo' is the fastest way to create our collection by about a quadrillion miles.

function process_file($collection, $filedata) {

    global $numtracks;
    global $totaltime;

    $file = $filedata['file'];

    list (  $name, $duration, $number, $date, $genre, $artist, $album, $folder,
            $type, $image, $expires, $stationurl, $station, $backendid, $playlistpos, 
            $albumartist, $disc, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
            $origimage, $spoitalbum, $spotiartist)
        = array (   null, 0, "", null, null, null, null, null,
                    "local", null, null, null, null, null, null, 
                    null, 0, null, null, null, null, null, null, null );

    $artist = (array_key_exists('Artist', $filedata)) ? $filedata['Artist'] : rawurldecode(basename(dirname(dirname($file))));
    $album = (array_key_exists('Album', $filedata)) ? $filedata['Album'] : rawurldecode(basename(dirname($file)));
    // $albumartist = (array_key_exists('AlbumArtistSort', $filedata)) ? $filedata['AlbumArtistSort'] : ((array_key_exists('AlbumArtist', $filedata)) ? $filedata['AlbumArtist'] : null);
    $albumartist = (array_key_exists('AlbumArtist', $filedata)) ? $filedata['AlbumArtist'] : null; 
    $name = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($file);
    $duration = (array_key_exists('Time', $filedata)) ? $filedata['Time'] : null;
    $number = (array_key_exists('Track', $filedata)) ? format_tracknum($filedata['Track']) : format_tracknum(basename($file));
    $disc = (array_key_exists('Disc', $filedata)) ? format_tracknum($filedata['Disc']) : 0;
    $date = (array_key_exists('Date',$filedata)) ? $filedata['Date'] : null;
    $genre = (array_key_exists('Genre', $filedata)) ? $filedata['Genre'] : null;
    $image = (array_key_exists('Image', $filedata)) ? $filedata['Image'] : null;
    $mbartist = (array_key_exists('MUSICBRAINZ_ARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ARTISTID'] : null;
    $mbalbum = (array_key_exists('MUSICBRAINZ_ALBUMID', $filedata)) ? $filedata['MUSICBRAINZ_ALBUMID'] : null;
    $mbalbumartist = (array_key_exists('MUSICBRAINZ_ALBUMARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ALBUMARTISTID'] : null;
    $mbtrack = (array_key_exists('MUSICBRAINZ_TRACKID', $filedata)) ? $filedata['MUSICBRAINZ_TRACKID'] : null;
    $backendid = (array_key_exists('Id',$filedata)) ? $filedata['Id'] : null;
    $playlistpos = (array_key_exists('Pos',$filedata)) ? $filedata['Pos'] : null;
    $spotialbum = (array_key_exists('SpotiAlbum',$filedata)) ? $filedata['SpotiAlbum'] : null;
    $spotiartist = (array_key_exists('SpotiArtist',$filedata)) ? $filedata['SpotiArtist'] : null;
    $folder = dirname($file);
    if (substr($file, 0, 11) == "soundcloud:") {
        $folder = "soundcloud";
    }


    $stream = "";

    if ((preg_match('/^http:\/\//', $file) || preg_match('/^mms:\/\//', $file)) &&
        !array_key_exists('Artist', $filedata) && !array_key_exists('Album', $filedata)) {

        list (  $name, $duration, $number, $date, $genre, $artist, $album, $folder,
                $type, $image, $expires, $stationurl, $station, $stream)
                = getStuffFromXSPF($file);
    }

    // if ($image == null) {
    //     if (substr($file, 0, 11) == "soundcloud:") {
    //         $image = "images/soundcloud-logo.png";
    //     }
    // }

    $collection->newTrack(  $name, $file, $duration, $number, $date, $genre, $artist, $album, $folder,
                            $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                            $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
                            $origimage, $spotialbum, $spotiartist);

    $numtracks++;
    $totaltime += $duration;
}


function getStuffFromXSPF($url) {
    global $xml;
    global $xspf_loaded;
    global $lfm_xspfs;
    global $stream_xspfs;

    // Preload all the stream and lastfm playlists (on the first time we need them)
    // - saves time later as we don't have to read them in every time.

    if (!$xspf_loaded) {
        $playlists = glob("prefs/LFMRADIO*.xspf");
        foreach($playlists as $i => $file) {
            $x = simplexml_load_file($file);
            array_push($lfm_xspfs, $x);
        }
        $playlists = glob("prefs/*STREAM*.xspf");
        foreach($playlists as $i => $file) {
            $x = simplexml_load_file($file);
            array_push($stream_xspfs, $x);
        }
        $xspf_loaded = true;
    }

    foreach($lfm_xspfs as $i => $x) {
        foreach($x->playlist->trackList->track as $i => $track) {
            if($track->location == $url) {
                return array (  $track->title, 
                                ($track->duration)/1000,
                                null, null, null, 
                                $track->creator,
                                $track->album, 
                                null, 
                                "lastfmradio",
                                $track->image,
                                $track->expires,
                                $x->playlist->stationurl,
                                $x->playlist->title, 
                                null );
            }

        }
    }

    foreach($stream_xspfs as $i => $x) {
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url) {
                return array (  $track->title,
                                0, 
                                null, null, null,
                                $track->creator, 
                                $track->album, 
                                null, 
                                "stream",
                                $track->image, 
                                null, null, null, 
                                $track->stream);
            }
        }
    }

    if (file_exists('prefs/'.md5($url).'.xspf')) {
        $x = simplexml_load_file('prefs/'.md5($url).'.xspf');
        return array (  $x->trackList->track->title,
                        ($x->trackList->track->duration)/1000,
                        null, null, null,
                        $x->trackList->track->creator,
                        $x->trackList->track->album,
                        null, 
                        "local",
                        $x->trackList->track->image,
                        null, null, null, null);
    }

    return array(   "",
                    0,
                    "",
                    null, null,
                    htmlspecialchars($url),
                    "Unknown Internet Stream",
                    null,
                    "stream",
                    "images/broadcast.png",
                    null, null, null,
                    ""
                );

}

function doCollection($command, $jsondata = null) {

    global $connection;
    global $is_connected;
    global $COMPILATION_THRESHOLD;
    global $prefs;
    $collection = new musicCollection($connection);
    
    debug_print("Starting Collection Scan ".$command);
    
    $files = array();
    $filecount = 0;
    if ($is_connected) {
        if ($command == null) {
            debug_print("Parsing Mopidy JSON Data");
            parse_mopidy_json_data($collection, $jsondata);
        } elseif ($command == "listallinfo" && $prefs['use_mopidy_tagcache'] == 1) {
            debug_print("Doing Mopidy tag cache scan.");
            if (file_exists("mopidy-tags/tag_cache")) {
                parse_mopidy_tagcache($collection);
            }
        } else {
            fputs($connection, $command."\n");
            $firstline = null;
            $filedata = array();
            $parts = true;
            while(!feof($connection) && $parts) {
                    $parts = getline($connection);
                    if (is_array($parts)) {
                        if ($parts[0] != "playlist" && $parts[0] != "Last-Modified") {
                            if ($parts[0] == $firstline) {
                                $filecount++;
                                process_file($collection, $filedata);
                                $filedata = array();
                            }
                            $filedata[$parts[0]] = $parts[1];
                            if ($firstline == null) {
                                $firstline = $parts[0];
                            }
                        }
                    }
            }

            if (array_key_exists('file', $filedata) && $filedata['file']) {
                $filecount++;
                process_file($collection, $filedata);
            }
        }

        // Rescan stage - to find albums that are compilations but have been missed by the above step
        $possible_compilations = array();
        foreach($collection->albums as $i => $al) {
            $an = utf8_decode($al->name);
            if (!$al->isCompilation() && $an != "") {
                $numtracks = $al->trackCount();
                if ($numtracks < $COMPILATION_THRESHOLD) {
                    $spt = $al->spotilink;
                    if ($spt == null) {
                        $spt = "";
                    }
                    if (array_key_exists($an.$spt, $possible_compilations)) {
                        $possible_compilations[$an.$spt][] = $al;
                    } else {
                        $possible_compilations[$an.$spt] = array($al);
                    }
                }
            }
        }

        foreach($possible_compilations as $name => $array) {
            if (count($array) > 1) {
                $collection->createCompilation($name, $array);
            }
        }
    }
        
    return $collection;
}

function createXML($artistlist, $prefix, $output) {
    global $numtracks;
    global $totaltime;

    $output->writeLine(xmlnode("numtracks", $numtracks));
    $output->writeLine(xmlnode("duration", format_time($totaltime)));

    if (array_search("various artists", $artistlist)) {
        $key = array_search("various artists", $artistlist);
        do_albums_xml("various artists", false, true, $prefix, $output);
        unset($artistlist[$key]);
    }

    // Add all the other artists
    foreach($artistlist as $artistkey) {
        do_albums_xml($artistkey, true, false, $prefix, $output);
    }

}

function do_albums_xml($artistkey, $compilations, $showartist, $prefix, $output) {

    global $count;
    global $collection;
    global $divtype;
    
    //debug_print("Doing Artist: ".$artistkey);
    $artist = $collection->artistName($artistkey);
    $albumlist = $collection->getAlbumList($artistkey, $compilations, false);
    if (count($albumlist) > 0 || $collection->spotilink($artistkey) != null) {    
        $output->writeLine('<artist id="'.$prefix.'artist'.$count.'">'."\n");
        $output->WriteLine(xmlnode('name', $artist));
        if ($collection->spotilink($artistkey) != null) {
            $output->writeLine(xmlnode('spotilink', rawurlencode($collection->spotilink($artistkey))));
        }
        $output->writeLine("<albums>\n");
        foreach($albumlist as $album) {
            $output->writeLine('<album id="'.$prefix.'album'.$count.'">'."\n");
            if ($album->spotilink != null) {
                $output->writeLine(xmlnode('spotilink', rawurlencode($album->spotilink)));
            }
            $output->writeLine(xmlnode('name', $album->name));
            if ($album->musicbrainz_albumid) {
                $output->writeLine(xmlnode('mbid', $album->musicbrainz_albumid));
            }
            if (!$album->is_spotify) {
                $output->writeLine(xmlnode('directory', rawurlencode($album->folder)));
            }
            $output->writeLine(xmlnode('date', $album->getDate()));
            $output->writeLine("<image>\n");
            $artname = md5($album->artist." ".$album->name);
            $output->writeLine(xmlnode('name', $artname));
            $image=$album->getImage('small');
            $output->writeLine(xmlnode('src', $image));
            if ($image == "") {
                $output->writeLine(xmlnode('exists', 'no'));
            } else {
                $output->writeLine(xmlnode('exists', 'yes'));
            }
            $b = munge_album_name($album->name);
            $output->writeLine(xmlnode('romprartist', rawurlencode($album->artist)));
            $output->writeLine(xmlnode('rompralbum', rawurlencode($b)));
            $output->writeLine(xmlnode('searched', 'no'));
            $output->writeLine("</image>\n");

            $numdiscs = $album->sortTracks();
            $output->writeLine(xmlnode('numdiscs', $numdiscs));
            $currdisc = -1;
            $output->writeLine("<tracks>\n");
            if (count($album->tracks) > 0) {
                foreach($album->tracks as $trackobj) {
                    $output->writeLine("<track>\n");
                    // Disc Numbers
                    if ($numdiscs > 1) {
                        if ($trackobj->disc != null && $trackobj->disc != $currdisc) {
                            $currdisc = $trackobj->disc;
                            $output->writeLine(xmlnode('disc', $currdisc));
                        }
                    }
                    if ( ($showartist || 
                        ($trackobj->albumartist != null && ($trackobj->albumartist != $trackobj->artist))) &&
                        ($trackobj->artist != null && $trackobj->artist != '.')
                    ) {
                        $output->writeLine(xmlnode('artist', $trackobj->artist));
                    }
                    // $output->writeLine(xmlnode('albumartist', $trackobj->albumartist));
                    $output->writeLine(xmlnode('url', rawurlencode($trackobj->url)));
                    $output->writeLine(xmlnode('number', $trackobj->number));
                    $output->writeLine(xmlnode('name', $trackobj->name));
                    $output->writeLine(xmlnode('duration', format_time($trackobj->duration)));
                    $output->writeLine("</track>\n");
                    $count++;
                }
            }
            $output->writeLine("</tracks>\n");
            $output->writeLine("</album>\n");
            $count++;
        }
        $output->writeLine("</albums>\n");
        $output->writeLine("</artist>\n");
        $count++;
    }
    
}

function parse_mopidy_tagcache($collection) {

    global $prefs;
    debug_print("Starting Mopidy Tag Cache Scan ");
    
    $firstline = null;
    $filedata = array();
    $parts = true;
    $fp = fopen("mopidy-tags/tag_cache", "r");

    if ($fp) {
        $a = "";
        while(!feof($fp) && strtolower($a) != "songlist begin") {
            $a = trim(fgets($fp));
        }
        while(!feof($fp) && $parts) {
            $parts = getline($fp);
            if (is_array($parts)) {
                if ($parts[0] != "playlist" && $parts[0] != "Last-Modified") {
                    if ($parts[0] == $firstline) {
                        process_file($collection, $filedata);
                        $filedata = array();
                    }
                    if ($parts[0] == 'file') {
                        $parts[1] = "file://".$prefs['music_directory'].$parts[1];
                    }
                    $filedata[$parts[0]] = $parts[1];
                    if ($firstline == null) {
                        $firstline = $parts[0];
                    }
                }
            }
        }

        if (array_key_exists('file', $filedata) && $filedata['file']) {
             process_file($collection, $filedata);
        }
    }
    fclose($fp);
}

?>
