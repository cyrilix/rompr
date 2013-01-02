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
    }

    public function newTrack($object) {
        if (substr($object->url,0,8) == "spotify:") {
            $this->is_spotify = true;
        }
        $this->tracks[] = $object;

        if ($this->folder == null) {
            $this->folder = $object->folder;
        }
        $object->setAlbumObject($this);
    }

    public function isCompilation() {
        return $this->iscompilation;
    }
    
    public function setSpotilink($link) {
        $this->spotilink = $link;
        $this->is_spotify = true;
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

    public function getTrack($url, $pos) {
        foreach($this->tracks as $track) {
            if ($track->url == $url && $pos == $track->playlistpos) {
                return $track;
            }
        }
        return null;
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

    public function setAlbumObject($object) {
        $this->albumobject = $object;
        $object->musicbrainz_albumid = $this->musicbrainz_albumid;
        if ($object->datestamp == null) {
            $object->datestamp = $this->datestamp;
        }
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
        if ($directory != null) {
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
                                $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage) {

        global $current_album;
        global $current_artist;
        global $abm;
        global $curr_is_spotify;
        
        $sortartist = ($albumartist == null) ? $artist : $albumartist;

        $artistkey = strtolower(preg_replace('/^The /i', '', $sortartist));
        $t = new track($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                        $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                        $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage);
        // If artist doesn't exist, create it - indexed by all lower case name for convenient sorting and grouping
        if (!array_key_exists($artistkey, $this->artists)) {
            $this->artists[$artistkey] = new artist($sortartist);
            if (substr($file,0,14) == "spotify:artist") {
                $this->artists[$artistkey]->spotilink = $file;
                return true;
            }
        }
        
        if (substr($file,0,13) == "spotify:album") {
            $abm = $this->findAlbum($album, $artistkey, null, true);
            if ($abm == false) {
                $abm = new album($album, $sortartist);
                $this->albums[] = $abm;
                $this->artists[$artistkey]->newAlbum($abm);
            }
            $abm->setSpotilink($file);
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
                if ($prefs['sortbydate'] == "true") {
                    $d = $object->getDate();
                    if ($d == null) {
                        $albums[] = $object;
                    } else {
                        while (array_key_exists($d, $albums)) {
                            $d = "0".$d;
                        }
                        $albums[$d] = $object;
                    }
                } else {
                    $albums[$i] = $object;
                }
            }
        }

	   ksort($albums, SORT_STRING);
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

    public function findTrack($file, $pos = null) {
        foreach($this->albums as $album) {
            $track = $album->getTrack($file, $pos);
            if ($track != null) {
                return $track;
            }
        }
        return null;
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
            $albumartist, $disc, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage)
        = array (   null, 0, "", null, null, null, null, null,
                    "local", null, null, null, null, null, null, 
                    null, 0, null, null, null, null, null );

    if (preg_match('/^http:\/\//', $file) || preg_match('/^mms:\/\//', $file)) {

        list (  $name, $duration, $number, $date, $genre, $artist, $album, $folder,
                $type, $image, $expires, $stationurl, $station, $stream)
                = getStuffFromXSPF($file);

    } else {
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
        $mbartist = (array_key_exists('MUSICBRAINZ_ARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ARTISTID'] : null;
        $mbalbum = (array_key_exists('MUSICBRAINZ_ALBUMID', $filedata)) ? $filedata['MUSICBRAINZ_ALBUMID'] : null;
        $mbalbumartist = (array_key_exists('MUSICBRAINZ_ALBUMARTISTID', $filedata)) ? $filedata['MUSICBRAINZ_ALBUMARTISTID'] : null;
        $mbtrack = (array_key_exists('MUSICBRAINZ_TRACKID', $filedata)) ? $filedata['MUSICBRAINZ_TRACKID'] : null;
        $folder = dirname($file);
        $stream = "";
    }

    if ($image == null) {
        $artname = md5($artist." ".$album);
        if ($albumartist) {
            $artname = md5($albumartist." ".$album);
        }
        if (file_exists("albumart/original/".$artname.".jpg")) {
            $image = "albumart/original/".$artname.".jpg";
        }
        if (file_exists("albumart/asdownloaded/".$artname.".jpg")) {
            $origimage = "albumart/asdownloaded/".$artname.".jpg";
        }
    }

    $backendid = (array_key_exists('Id',$filedata)) ? $filedata['Id'] : null;
    $playlistpos = (array_key_exists('Pos',$filedata)) ? $filedata['Pos'] : null;

    $collection->newTrack(  $name, $file, $duration, $number, $date, $genre, $artist, $album, $folder,
                            $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                            $albumartist, $disc, $stream, $mbartist, $mbalbum, $mbalbumartist, $mbtrack, $origimage);

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

function doCollection($command) {

    global $connection;
    global $is_connected;
    global $COMPILATION_THRESHOLD;
    $collection = new musicCollection($connection);
    
    debug_print("Starting Collection Scan ".$command);
    
    $files = array();
    $filecount = 0;
    if ($is_connected) {
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
        
        if ($filecount == 0 && $command == "listallinfo") {
            debug_print("No local files found. Are you running mopidy?");
            if (file_exists("mopidy-tags/tag_cache")) {
                debug_print("Yes, you are!");
                parse_mopidy_tagcache($collection);
            }
        } else {
            debug_print($filecount." files found in scan ".$command);
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


function createHTML($artistlist, $prefix, $output) {

    global $numtracks;
    global $totaltime;    
    
    $output->writeLine( '<div><table width="100%" class="playlistitem"><tr><td align="left">');
    $output->writeLine( $numtracks . ' tracks</td><td align="right">Duration : ');
    $output->writeLine( format_time($totaltime) . '</td></tr></table></div>');

    // Make sure 'Various Artists' is the first one in the list
    if (array_search("various artists", $artistlist)) {
        $key = array_search("various artists", $artistlist);
        do_albums("various artists", false, true, $prefix, $output);
        unset($artistlist[$key]);
    }

    // Add all the other artists
    foreach($artistlist as $artistkey) {
        do_albums($artistkey, true, false, $prefix, $output);
    }
    
}

function do_albums($artistkey, $compilations, $showartist, $prefix, $output) {

    global $count;
    global $collection;
    global $divtype;
    
    //debug_print("Doing Artist: ".$artistkey);

    $albumlist = $collection->getAlbumList($artistkey, $compilations, false);
    if (count($albumlist) > 0) {
    
        // Create a div to hold the entire data for this artist
        $output->writeLine('<div class="noselection fullwidth '.$divtype.'">');

        $artist = $collection->artistName($artistkey);
        // Create Artist Name item
        if ($collection->spotilink($artistkey) != null) {
            $output->writeLine('<div class="clickable clicktrack draggable containerbox menuitem" name="'.rawurlencode($collection->spotilink($artistkey)).'">');
            $output->writeLine('<img src="images/toggle-closed.png" class="menu fixed" name="'.$prefix.'artist'.$count.'">');
            $output->writeLine('<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>');
            $output->writeLine('<div class="expand">'.$artist.'</div>');
            $output->writeLine('</div>');
        } else {
            $output->writeLine('<div class="clickable clickalbum draggable containerbox menuitem" name="'.$prefix.'artist'.$count.'">');
            $output->writeLine('<img src="images/toggle-closed.png" class="menu fixed" name="'.$prefix.'artist'.$count.'">');
            $output->writeLine('<div class="expand">'.$artist.'</div>');
            $output->writeLine('</div>');
        }
        
        // Create the drop-down div that will hold this artist's albums
        $output->writeLine('<div id="'.$prefix.'artist'.$count.'" class="dropmenu">');
        
        foreach($albumlist as $album) {
        
            //debug_print("Doing Album ".$album->name);
        
            // Creat the header for the album
            if ($album->spotilink != null) {
                $output->writeLine('<div class="clickable clicktrack draggable containerbox menuitem" name="'.rawurlencode($album->spotilink).'">');
                $output->writeLine('<img src="images/toggle-closed.png" class="menu fixed" name="'.$prefix.'album'.$count.'">');
            } else {
                $output->writeLine('<div class="clickable clickalbum draggable containerbox menuitem" name="'.$prefix.'album'.$count.'">');
                $output->writeLine('<img src="images/toggle-closed.png" class="menu fixed" name="'.$prefix.'album'.$count.'">');
            }

            // We don't set the src tags for the images when the page loads, otherwise we'd be loading in
            // literally hundres of images we don't need. Instead we set the name tag to the url
            // of the image, and then use jQuery magic to set the src tag when the menu is opened -
            // so we only ever load the images we need.
            
            // NOTE: Having empty src tags will make Chrome crash... eventually. Hence we set them all to album-unknown-small.png.
            
            // We also add an artist and album name tag to the image so we can use this for the auto-image lookup later on
            // We only do this for images that don't exist, just to keep the size of the HTML down            

            // NOTE: The format and ORDER of the tags in the <img> is VERY important as it matched by a regexp
            // when album art is retrieved
            
            // NOTE also: the newline at the end of the line is ESSENTIAL, because php's regular expressions don't quite work right. 
            // Specifically, .*? seems to not-quite work as it should. Almost. In a way that's bugged me for months.
            // I should have done this in perl.

            // Don't mess with this section without also updating the regexp in getalbumcover.php.
            // Proceed at your own risk
            $artname = md5($album->artist." ".$album->name);
            if (file_exists("albumart/original/".$artname.".jpg")) {
                $class = "smallcover fixed updateable";
                $output->writeLine( '<img class="'.$class.'" name="'.$artname.'" src="images/album-unknown-small.png" />'."\n");
            } else {
                $class = "smallcover fixed updateable notexist";
                $b = munge_album_name($album->name);
                $output->writeLine( '<img class="'.$class.'" romprartist="'.rawurlencode($album->artist).'" rompralbum="'.rawurlencode($b).'" name="'.$artname.'" src="images/album-unknown-small.png" />'."\n");
            }

            if ($album->spotilink != null) {
                $output->writeLine('<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>');
            }
            
            $output->writeLine('<div class="expand">'.$album->name.'</div>');
            $output->writeLine('</div>');
            
            // Create the drop-down div that will hold this album's tracks
            $output->writeLine('<div id="'.$prefix.'album'.$count.'" class="dropmenu">');
            $numdiscs = $album->sortTracks();
            $currdisc = -1;
            if (count($album->tracks) == 0) {
                $output->writeLine( '<div class="playlistrow2" style="padding-left:64px">No Individual Tracks Returned By Search</div>');
            } else {
                foreach($album->tracks as $trackobj) {
                    // Disc Numbers
                    if ($numdiscs > 1) {
                        if ($trackobj->disc != null && $trackobj->disc != $currdisc) {
                            $currdisc = $trackobj->disc;
                            $output->writeLine( '<div class="discnumber indent">Disc '.$currdisc.'</div>');
                        }
                    }

                    // Do we need to display the artist info?
                    $dorow2 = false;
                    if ( ($showartist || 
                        ($trackobj->albumartist != null && ($trackobj->albumartist != $trackobj->artist))) &&
                        ($trackobj->artist != null && $trackobj->artist != '.')
                    ) {
                        $dorow2 = true;
                    }
                    
                    // Track info
                    if ($dorow2) {
                        $output->writeLine('<div class="clickable clicktrack ninesix draggable indent containerbox vertical padright" name="'.rawurlencode($trackobj->url).'">');
                        $output->writeLine('<div class="containerbox line">');
                    } else {
                        $output->writeLine('<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.rawurlencode($trackobj->url).'">');
                    }
                    $output->writeLine('<div class="tracknumber fixed">'.$trackobj->number.'</div>');
                    if (substr($trackobj->url,0,strlen('spotify')) == "spotify") {
                        $output->writeLine('<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>');
                    }
                    $output->writeLine('<div class="expand">'.$trackobj->name.'</div>');
                    $output->writeLine('<div class="fixed playlistrow2">'.format_time($trackobj->duration).'</div>');
                    if ($dorow2) {
                        $output->writeLine('</div><div class="containerbox line">');
                        $output->writeLine('<div class="tracknumber fixed"></div>');
                        $output->writeline('<div class="expand playlistrow2">'.$trackobj->artist.'</div>');
                        $output->writeLine('</div>');
                    }
                    $output->writeLine('</div>');
                    $count++;
                }
            }
            $output->writeLine('</div>');
            $count++;
        }
        $output->writeLine('</div>');
        $output->writeLine("</div>\n");
        $divtype = ($divtype == "album1") ? "album2" : "album1";
        $count++;
    }
    
}

function parse_mopidy_tagcache($collection) {

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
                        $parts[1] = "file:///home/bob/Music/".$parts[1];
                        //$parts[1] = str_replace(" ", "%20", $parts[1]);
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
