<?php

set_time_limit(240);
$COMPILATION_THRESHOLD = 6;
$numtracks = 0;
$numalbums = 0;
$numartists = 0;
$totaltime = 0;

$xspf_loaded = false;
$stream_xspfs = array();
$podcasts = array();

$current_artist = "";
$current_album = "";
$abm = false;
$current_domain = "local";
$streamdomains = array("http", "mms", "rtsp", "https", "rtmp", "rtmps", "dirble", "tunein", "radio-de");
$playlist = array();

$count = 1;
$divtype = "album1";
$collection = null;

$dbterms = array( 'tags' => null, 'rating' => null );

class album {
    public function __construct($name, $artist, $domain) {
        global $numalbums;
        $this->artist = $artist;
        $this->name = trim($name);
        $this->tracks = array();
        $this->folder = null;
        $this->iscompilation = false;
        $this->musicbrainz_albumid = null;
        $this->datestamp = null;
        $this->spotilink = null;
        $this->domain = $domain;
        $this->image = null;
        $this->artistobject = null;
        $this->numOfDiscs = -1;
        $this->numOfTrackOnes = 0;
        $numalbums++;
    }

    public function newTrack($object) {
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
        if ($this->numOfDiscs < $object->disc) {
            $this->numOfDiscs = $object->disc;
        }
        if ($object->number == 1) {
            $this->numOfTrackOnes++;
        }
        $object->setAlbumObject($this);
    }

    public function isOneFile() {
        $result = true;
        foreach ($this->tracks as $i => $track) {
            if ($track->playlist) {

            } else {
                $result = false;
            }
        }
        return $result;
    }

    public function isCompilation() {
        return $this->iscompilation;
    }

    public function setSpotilink($link) {
        $this->spotilink = $link;
    }

    public function setImage($image) {
        $this->image = $image;
    }

    public function setDate($date) {
        $this->date = $date;
    }

    public function getKey() {
        return md5($this->artist." ".$this->name);
    }

    public function getImage($size) {
        global $ipath;
        // Return image for an album or track
        $image = "";
        $artname = $this->getKey();
        if ($this->image) {
            $image = $this->image;
        }
        if (file_exists("prefs/imagecache/".$artname."_".$size.".jpg")) {
            $image = "prefs/imagecache/".$artname."_".$size.".jpg";
        }
        switch ($this->domain) {
            case "podcast":
                if ($image == "") $image = $ipath."podcast-logo.png";
                break;
            case "youtube":
            case "soundcloud":
            case "tunein":
            case "radio-de":
            case "dirble":
            case "bassdrive":
            case "internetarchive":
                $image = "newimages/".$this->domain."-logo.png";
                break;
        }
        // If there's a local image this overrides everything else
        if (file_exists("albumart/".$size."/".$artname.".jpg")) {
            $image = "albumart/".$size."/".$artname.".jpg";
        }
        return $image;
    }

    public function setAsCompilation() {
        $this->artist = "Various Artists";
        $this->iscompilation = true;
    }

    public function setArtistObject($ob) {
        if ($this->artistobject !== null) {
            $this->artistobject->pleaseReleaseMe($this);
        }
        $this->artistobject = $ob;
    }

    public function trackCount() {
        return count($this->tracks);
    }

    public function sortTracks() {
        global $backend_in_use;
        if ($backend_in_use == "sql") {
            // Mopidy-Spotify doesn't send disc numbers. If we're using the sql backend
            // we don't really need to pre-sort tracks because we can do it on the fly.
            // However, when there are no disc numbers multi-disc albums don't sort properly.
            // Hence we do a little check that we have have the same number of 'Track 1's
            // as discs and only do the sort of they're not the same. This'll also
            // sort out badly tagged local files.
            if ($this->numOfTrackOnes <= 1 || $this->numOfTrackOnes == $this->numOfDiscs) return $this->numOfDiscs;
        }

        // For XML we have to do the sort every time, since we need the tracks to be in order

        $discs = array();
        $number = 1;
        foreach ($this->tracks as $ob) {
            if ($ob->number) {
                $track_no = intval($ob->number);
            } else {
                $track_no = $number;
            }
            # Just in case we have a multiple disc album with no disc number tags
            $discno = intval($ob->disc);
            if (!array_key_exists($discno, $discs)) {
            	$discs[$discno] = array();
            }
            while(array_key_exists($track_no, $discs[$discno])) {
                $discno++;
	            if (!array_key_exists($discno, $discs)) {
    	        	$discs[$discno] = array();
                }
            }
            $discs[$discno][$track_no] = $ob;
            $ob->updateDiscNo($discno);
            $number++;
        }
        $numdiscs = count($discs);

        $this->tracks = array();
        ksort($discs, SORT_NUMERIC);
        foreach ($discs as $disc) {
            ksort($disc, SORT_NUMERIC);
            $this->tracks = array_merge($this->tracks, $disc);
        }
        $this->numOfDiscs = $numdiscs;
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
        $key = md5(strtolower($object->name).$object->domain);
        $this->albums[$key] = $object;
        $object->setArtistObject($this);
    }

    public function pleaseReleaseMe($object) {
        $ak = null;
        foreach ($this->albums as $key => $album) {
            if ($album === $object) {
                $ak = $key;
                break;
            }
        }
        if ($ak) {
            debug_print("Removing album ".$object->name." from artist ".$this->name, "COLLECTION");
            unset($this->albums[$key]);
        } else {
            debug_print("AWOOGA! Removing album ".$object->name." from artist ".$this->name." FAILED!", "COLLECTION");
        }
    }

}

class track {
    public function __construct($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                                $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
                                $origimage, $playlist, $lastmodified) {

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
        $this->playlist = $playlist;
        $this->lastmodified = $lastmodified;
        $this->image = $image;
        $this->needsupdate = false;
        // Only used by playlist
        $this->albumobject = null;
        $this->type = $type;
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

    public function getImage() {
        $d = getDomain(urldecode($this->url));
        switch ($d) {
            case "soundcloud":
            case "youtube":
            case "yt":
                if ($this->image) {
                    return $this->image;
                } else {
                    return "newimages/album-unknown-small.png";
                }
                break;

            default:
                return null;
        }
    }

    public function getSpotiAlbum() {
        return $this->albumobject->spotilink;
    }

    public function setAlbumObject($object) {
        $this->albumobject = $object;
        $object->musicbrainz_albumid = $this->musicbrainz_albumid;
    }

    public function updateDiscNo($disc) {
        $this->disc = $disc;
        $this->needsupdate = true;
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

    private function findAlbum($album, $artist, $directory, $domain) {
        if ($artist != null) {
            $a = md5(trim(strtolower($album)).$domain);
            $art = strtolower($artist);
            if (array_key_exists($a, $this->artists[$art]->albums)) {
                return $this->artists[$art]->albums[$a];
            }
        }
        if ($directory != null && $directory != ".") {
            foreach ($this->findAlbumByName(trim(strtolower($album))) as $object) {
                if ($directory == $object->folder && $object->domain == $domain) {
                    return $object;
                }
            }
        }
        return false;
    }

    public function newTrack($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                                $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
                                $origimage, $spotialbum, $spotiartist, $domain, $cuefile, $lastmodified, $linktype) {

        global $current_album;
        global $current_artist;
        global $abm;
        global $current_domain;
        global $playlist;
        global $prefs;

        // debug_print("New Track ".$name." ".$file." ".$album." ".$domain." ".$directory,"COLLECTION");

        if ($prefs['ignore_unplayable'] == "true" && substr($name, 0, 12) == "[unplayable]") {
            return true;
        }

        $sortartist = ($albumartist == null) ? $artist : $albumartist;
        // For sorting internet streams from mopidy backends that don't
        // supply an artist
        if ($sortartist == null && $station !== null) {
            $sortartist = $station;
        }
        $artistkey = strtolower(preg_replace('/^The /i', '', $sortartist));
        //Some discogs tags have 'Various' instead of 'Various Artists'
        if ($artistkey == "various") {
            $artistkey = "various artists";
        }

        // If artist doesn't exist, create it - indexed by all lower case name for convenient sorting and grouping
        if (!array_key_exists($artistkey, $this->artists)) {
            $this->artists[$artistkey] = new artist($sortartist);
        }

        if ($this->artists[$artistkey]->spotilink == null ) {
            if ($spotiartist != null) {
                $this->artists[$artistkey]->spotilink = $spotiartist;
            } else if ($linktype == "artist") {
                $this->artists[$artistkey]->spotilink = $file;
            }
        }

        if ($linktype == 'artist') return true;

        // Keep albums from different domains separate
        if ($linktype == 'album') {
            $abm = $this->findAlbum($album, $artistkey, null, $domain);
            if ($abm == false) {
                $abm = new album($album, $sortartist, $domain);
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
            $current_domain = $domain;
            return true;
        }

        if ($album != $current_album || $sortartist != $current_artist || $domain != $current_domain) {
            $abm = false;
        }

        // Create a track object then find an artist and album to associate it with
        $t = new track($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                        $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                        $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist,
                        $mbtrack, $origimage, $cuefile, $lastmodified);

        // Albums are not indexed by name, since we may have 2 or more albums with the same name by multiple artists

        // Does an album with this name by this aritst already exist?
        if ($abm === false) {
            $abm = $this->findAlbum($album, $artistkey, null, $domain);
            if ($abm === false) {
                if ($albumartist == null) {
                    // Does an album with this name where the tracks are in the same directory exist?
                    // We don't need to do this if albumartist is set - this is for detecting
                    // badly tagged compilations
                    $abm = $this->findAlbum($album, null, $directory, $domain);
                    if ($abm !== false) {
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
                    }
                }
                if ($abm === false) {
                    // We didn't find the album, so create it
                    $abm = new album($album, $sortartist, $domain);
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
            $current_domain = $domain;
        }
        $abm->newTrack($t);
        if ($abm->spotilink == null && $spotialbum != null) {
            $abm->spotilink = $spotialbum;
        }

        if ($playlistpos !== null) {
            $playlist[$playlistpos] = $t;
        }
    }

    // NOTE :   If it's a track from a compilation not tagged with 'various artists', it's now been added to various artists
    //              and the album has the iscompilation flag set
    //              and the artist name for the album set to Various Artists
    //          Tracks which have 'Various Artists' as the artist/album artist name in the ID3 tag will be in the various artists group too,
    //              but 'iscompilation' will not be set unless as least one of the tracks on the album has something else as the artist name.
    //              This shouldn't matter.
    //          In fact, following some recent changes, I don't think we even need the isCompilation flag.

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
        global $backend_in_use;
        $albums = array();
        if ($backend_in_use == "sql") {
            // No need to sort the albums when using the SQL database
            // - it's all done on the fly when we read the data out.
            return $this->artists[$artist]->albums;
        } else {
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
    }

    public function spotilink($artist) {
        return $this->artists[$artist]->spotilink;
    }

}

function process_file($collection, $filedata) {

    global $numtracks;
    global $totaltime;
    global $streamdomains;
    global $prefs;
    global $dbterms;
    global $ipath;

    list ( $file, $domain, $type, $expires, $stationurl, $station, $stream, $origimage )
        = array ( $filedata['file'], getDomain($filedata['file']), "local", null, null, null, "", null );

    if ($dbterms['tags'] !== null || $dbterms['rating'] !== null) {
        // If this is a search and we have tags or ratings to search for, check them here.
        if (check_url_against_database($file, $dbterms['tags'], $dbterms['rating']) == false) {
            return false;
        }
    }

    list($name, $artist, $number, $duration, $albumartist, $spotialbum,
            $image, $album, $date, $lastmodified, $disc, $mbalbum) = munge_filedata($filedata, $file);

    $genre = (array_key_exists('Genre', $filedata)) ? $filedata['Genre'] : null;
    $mbartist = (array_key_exists('MUSICBRAINZ_ARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ARTISTID'] : "";
    $mbalbumartist = (array_key_exists('MUSICBRAINZ_ALBUMARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ALBUMARTISTID'] : "";
    $mbtrack = (array_key_exists('MUSICBRAINZ_TRACKID', $filedata)) ? $filedata['MUSICBRAINZ_TRACKID'] : "";
    $backendid = (array_key_exists('Id',$filedata)) ? $filedata['Id'] : null;
    $playlistpos = (array_key_exists('Pos',$filedata)) ? $filedata['Pos'] : null;
    $spotiartist = (array_key_exists('SpotiArtist',$filedata)) ? $filedata['SpotiArtist'] : null;
    // 'playlist' is how mpd handles flac/cue files (either embedded cue or external cue).
    $playlist = (array_key_exists('playlist',$filedata)) ? $filedata['playlist'] : null;

    if (!array_key_exists('linktype', $filedata)) {
        if (preg_match('/^.*?:artist:/', $file)) {
            $linktype = "artist";
            $spotiartist = $file;
        } else if (preg_match('/^.*?:album:/', $file)) {
            $linktype = "album";
        } else {
            $linktype = "file";
        }
    } else {
        $linktype = $filedata['linktype'];
    }

    // Sometimes the file domain can be http but the album domain is correct
    // this is true eg for bassdrive
    if ($linktype == "file" && array_key_exists('SpotiAlbum',$filedata) &&
        getDomain($filedata['SpotiAlbum']) != getDomain($filedata['file'])) {
        $domain = getDomain($filedata['SpotiAlbum']);
    }

    switch($domain) {
        // The collectioniser will sort things into compilations based on folders
        // Some backends don't report folders and will therefore all be grouped under
        // Various Artists. Prevent this by making sure it's something meaningful and unique
        case "soundcloud":
        case "youtube":
            $folder = $artist;
            break;

        case "spotify":
            $folder = ($spotialbum == null) ? $file : $spotialbum;
            break;

        default:
            $folder = dirname($file);
            $folder = preg_replace('#^local:track:#', '', $folder);
            break;
    }

    if (in_array($domain, $streamdomains) &&
        !preg_match('#/item/\d+/file$#', $file) &&
        // !preg_match('#http://archives.bassdrivearchive.com/#', $file) &&
        !preg_match('#http://leftasrain.com/#', $file)) {
        // domain will be http for anything being played through mopidy-beets and various
        // other mopidy extensions, annoyingly. So we check the filename pattern too
        list (  $track_found,
                $name,
                $duration,
                $number,
                $date,
                $genre,
                $artist,
                $album,
                $folder,
                $type,
                $image,
                $expires,
                $stationurl,
                $station,
                $stream,
                $albumartist) = getStuffFromXSPF($file);

        // Streams added to Mopidy by various backends return some useful metadata

        if (!$track_found || preg_match("/Unknown Internet Stream/", $album)) {

            if ($prefs['player_backend'] == "mopidy") {
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
            } else {
                if (array_key_exists('Name', $filedata) && preg_match("/Unknown Internet Stream/", $album)) {
                    $album = $filedata['Name'];
                }
            }
            if (array_key_exists('Genre', $filedata) && $filedata['Genre'] == "Podcast") {
                $album = array_key_exists('Album', $filedata) ? $filedata['Album'] : $album;
                $name = array_key_exists('Title', $filedata) ? $filedata['Title'] : $album;
                $artist = array_key_exists('Artist', $filedata) ? $filedata['Artist'] : $album;
                $type = "podcast";
            }
            $image = (array_key_exists('Image', $filedata)) ? $filedata['Image'] : $image;
            $duration = (array_key_exists('Time', $filedata) && $filedata['Time'] != 0) ? $filedata['Time'] : $duration;
        }

        // $domain = $type;
        if ($origimage == null && preg_match('#^albumart/original/#',$image)) {
            $origimage = "albumart/asdownloaded/".basename($image);
        }
    }

    // Some podcast feeds don't report a duration, but mopidy's scanner will get one
    if ($domain == "podcast" && $duration == 0 && array_key_exists('Time', $filedata)) {
        $duration = $filedata['Time'];
    }

    $collection->newTrack(  $name, $file, $duration, $number, $date, $genre, $artist, $album, $folder,
                            $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                            $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack,
                            $origimage, $spotialbum, $spotiartist, $domain, $playlist, $lastmodified, $linktype);

    $numtracks++;
    $totaltime += $duration;
}

function getStuffFromXSPF($url) {
    global $xml;
    global $xspf_loaded;
    global $stream_xspfs;
    global $podcasts;
    global $ipath;

    // Preload all the stream and podcast playlists (on the first time we need them)
    // - saves time later as we don't have to read them in every time.

    if (!$xspf_loaded) {
        $playlists = glob("prefs/USERSTREAM*.xspf");
        foreach($playlists as $i => $file) {
            $x = simplexml_load_file($file);
            array_push($stream_xspfs, $x);
        }
        $playlists = glob("prefs/STREAM*.xspf");
        foreach($playlists as $i => $file) {
            $x = simplexml_load_file($file);
            array_push($stream_xspfs, $x);
        }
        $playlists = glob("prefs/podcasts/*");
        foreach($playlists as $pod) {
            if (is_dir($pod)) {
                $x = simplexml_load_file($pod.'/info.xml');
                array_push($podcasts, $x);
            }
        }
        $xspf_loaded = true;
    }

    foreach ($podcasts as $x) {
        foreach($x->trackList->track as $track) {
            if ($track->link == $url ||
                ($track->origlink && $track->origlink == $url)) {
                return array (
                    true,
                    (string) $track->title,
                    (string) $track->duration,
                    null,
                    null,
                    null,
                    (string) $track->artist,
                    (string) $x->album,
                    md5((string) $x->album),
                    "podcast",
                    "getRemoteImage.php?url=".(string) $x->image,
                    null,
                    null,
                    null,
                    "",
                    (string) $x->albumartist
                );
            }
        }
    }

    foreach($stream_xspfs as $i => $x) {
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url) {
                debug_print("FOUND STATION ".$url,"THING");
                $image = (string) $track->image;
                if (preg_match('/^http:/', $image)) {
                    $image = "getRemoteImage.php?url=".$image;
                }
                $type = (string) $track->type;
                if ($type == "") {
                    $type = "stream";
                }
                return array (
                    true,
                    (string) $track->title,
                    0,
                    null,
                    null,
                    null,
                    (string) $track->creator,
                    (string) $track->album,
                    getStreamFolder($url),
                    $type,
                    $image,
                    null,
                    null,
                    getDummyStation($url),
                    (string) $track->stream,
                    ""
                );
            }
        }
    }

    return array(
        false,
        "",
        0,
        "",
        null,
        null,
        "",
        "Unknown Internet Stream",
        getStreamFolder($url),
        "stream",
        $ipath."broadcast.png",
        null,
        null,
        getDummyStation($url),
        "",
        ""
    );

}

function getStreamFolder($url) {
    $f = dirname($url);
    if ($f == "." || $f == "") $f = $url;
    return $f;
}

function getDummyStation($url) {
    $f = getDomain(urldecode($url));
    switch ($f) {
        case "http":
        case "mms":
        case "rtsp":
        case "https":
        case "rtmp":
        case "rtmps":
            return "Radio";
            break;

        default:
            return ucfirst($f);
            break;
    }
}

?>
