<?php

$COMPILATION_THRESHOLD = 6;

class album {    
    public function __construct($name, $artist) {
        //error_log("New Album : " . $name . " by " . $artist);
        $this->artist = $artist;
        $this->name = $name;
        $this->tracks = array();
        $this->folder = null;
        $this->iscompilation = false;
    }
    
    public function newTrack($object) {

        if ($object->number != null) {
            // Just in case we have duplicate track numbers - can happen in the case of multiple-disc albums
            // (I need to add support for that......)
            if (!array_key_exists($object->number, $this->tracks)) {
                $this->tracks[$object->number] = $object;
            } else {
                $this->tracks[] = $object;
            }
        } else {
            $this->tracks[] = $object;
        }
        if ($this->folder == null) {
            $this->folder = $object->folder;
        }
        $object->setAlbumObject($this);
    }
    
    public function isCompilation() {
        return $this->iscompilation;
    }
    
    public function setAsCompilation() {
        //error_log("Album " . $this->name . " being set as compilation");
        $this->artist = "Various Artists";
        $this->iscompilation = true;
    }  
    
    public function trackCount() {
        return count($this->tracks);
    }
    
    public function sortTracks() {
        $temp = array_keys($this->tracks);
        sort($temp, SORT_NUMERIC);
        $temp2 = array();
        foreach($temp as $key) {
            $temp2[$key] = $this->tracks[$key];
        }
        $this->tracks = $temp2;
    }
    
    public function getTrack($url) {
        foreach($this->tracks as $track) {
            if ($track->url == $url) {
                return $track;
            }
        }
        return null;
    }
    
}
    
class artist {
    
    public function __construct($name) {
        $this->name = $name;
        $this->albums = array();
        //error_log("New Artist : " . $name);
    }
    
    public function newAlbum($object) {
        // Pass an album object to this function
        if (array_key_exists(strtolower($object->name), $this->albums)) {
            error_log("Trying to add new album '" . $object->name . "' to artist '" . $this->name . "' but it already exists");
        } else {
            $this->albums[strtolower($object->name)] = $object;
        }
    }
        
}

class track {
    public function __construct($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station) {

        $this->artist = $artist;
        $this->album = $album;
        $this->name = $name;
        $this->url = $file;
        $this->duration = $duration;
        $this->number = $number;
        $this->datestamp = $date;
        $this->genre = $genre;
        $this->folder = $directory;
        // Only used by playlist
        $this->albumobject = null;
        $this->type = $type;
        $this->image = $image;
        $this->backendid = $backendid;
        $this->playlistpos = $playlistpos;
        $this->expires = $expires;
        $this->stationurl = $stationurl;
        $this->station = $station;
    }
    
    public function setAlbumObject($object) {
        $this->albumobject = $object;
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
    
    private function findAlbum($album, $artist, $directory) {
        if ($artist != null) {
            foreach($this->getAlbumList(strtolower(preg_replace('/^The /i', '', $artist)), false) as $object) {
                if ($album == $object->name) {
                    return $object;
                }
            }
        }
        if ($directory != null) {
            foreach ($this->findAlbumByName(strtolower($album)) as $object) {
                if ($directory == $object->folder) {
                    return $object;
                }
            }
        }
        return false;
    }
    
    public function newTrack($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station) {
        
        $artistkey = strtolower(preg_replace('/^The /i', '', $artist));        
        $t = new track($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station);
        // If artist doesn't exist, create it - indexed by all lower case name for convenient sorting and grouping
        if (!array_key_exists($artistkey, $this->artists)) {
            //error_log("Adding Artist : " . strtolower($artist));
            $this->artists[$artistkey] = new artist($artist);
        }
        
        // Albums are not indexed by name, since we may have 2 or more albums with the same name by multiple artists
        // Does an album with this name by this aritst already exist?
        $abm = $this->findAlbum($album, $artist, null);
        if ($abm == false) {
            // Does an album with this name where the tracks are in the same directory exist?
            $abm = $this->findAlbum($album, null, $directory);
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
            }

        }
        if ($abm == false) {
            // We didn't find the album, so create it
            $abm = new album($album, $artist);
            $this->albums[] = $abm;
            $this->artists[$artistkey]->newAlbum($abm);
        }
        $abm->newTrack($t);        
    }
        
    // NOTE :   If it's a track from a compilation, it's now been added to the track artist AND various artists and the album has the iscompilation flag set
    //              and the artist name for the album set to Various Artists
    //          Tracks which have 'Various Artists' as the artist name in the ID3 tag will be in the various artists group too,
    //              but 'iscompilation' will not be set unless as least one of the tracks on the album has something else as the artist name. This shouldn't matter.
    
    public function getSortedArtistList() {
        $temp = array_keys($this->artists);
        sort($temp, SORT_STRING);
        return $temp;
    }
    
    public function artistName($artist) {
        return $this->artists[$artist]->name;
    }
    
    public function getAlbumList($artist, $ignore_compilations) {
        $albums = array();
        foreach($this->artists[$artist]->albums as $object) {
            if ($object->isCompilation() && $ignore_compilations) {
                
            } else {
                $albums[] = $object;
            }
        }
        return $albums;
    }
    
    public function createCompilation($album) {
        global $COMPILATION_THRESHOLD;
        // mark an already existing album as a compilation
        $abm = new album($album, "");
        foreach($this->albums as $object) {
            if (strtolower(utf8_decode($object->name)) == strtolower($album)) {
                //if ($object->trackCount() < $COMPILATION_THRESHOLD) {
                    $object->setAsCompilation();
                    foreach($object->tracks as $t) {
                        $abm->newTrack($t);
                    }
                //}
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
    
    public function findTrack($file) {
        foreach($this->albums as $album) {
            $track = $album->getTrack($file);
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
    $file = $filedata['file'];
    
    list ($name, $duration, $number, $date, $genre, $artist, $album, $folder,
          $type, $image, $expires, $stationurl, $station, $backendid, $playlistpos)
        = array ( null, 0, "", null, null, null, null, null, "local", null, null, null, null, null, null );
        
    if (preg_match('/^http:\/\//', $file)
        || preg_match('/^mms:\/\//', $file)) {   
        
        list ($name, $duration, $number, $date, $genre, $artist, $album, $folder,
                $type, $image, $expires, $stationurl, $station)
                = getStuffFromXSPF($file);
        if ($name == null) {
            $name = "Unknown Stream";
            $album = "Unknown";
            $artist = "Unknown";
            $duration = 0;
            $type = "unknown";
            $number = "";
        }
    } else {
        $artist = (array_key_exists('Artist', $filedata)) ? $filedata['Artist'] : basename(dirname(dirname($file)));
        $album = (array_key_exists('Album', $filedata)) ? $filedata['Album'] : basename(dirname($file));
        $name = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($file);
        $duration = (array_key_exists('Time', $filedata)) ? $filedata['Time'] : null;
        $number = (array_key_exists('Track', $filedata)) ? format_tracknum($filedata['Track']) : format_tracknum(basename($file));
        $date = (array_key_exists('Date',$filedata)) ? $filedata['Date'] : null;
        $genre = (array_key_exists('Genre', $filedata)) ? $filedata['Genre'] : null;
        $folder = dirname($file);    
    }
    
    if ($image == null) {
        $artname = md5($artist." ".$album);
        if (file_exists("albumart/original/".$artname.".jpg")) {
            $image = "albumart/original/".$artname.".jpg";
        }
    }
    
    $backendid = (array_key_exists('Id',$filedata)) ? $filedata['Id'] : null;
    $playlistpos = (array_key_exists('Pos',$filedata)) ? $filedata['Pos'] : null;
    
    $collection->newTrack($name, $file, $duration, $number, $date, $genre, $artist, $album, $folder,
                            $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station);
}


function getStuffFromXSPF($url) {
    global $xml;
    //error_log("Checking for ".$url);
    if (file_exists('prefs/'.md5($url).'.xspf')) {
        //error_log("Found individual track playlist");
        $x = simplexml_load_file('prefs/'.md5($url).'.xspf');
        return array (  $x->trackList->track->title, 
                        ($x->trackList->track->duration)/1000, 
                        null, null, null, 
                        $x->trackList->track->creator,
                        $x->trackList->track->album, 
                        null, "local", 
                        $x->trackList->track->image, 
                        null, null, null);                       
    } 
        
    $playlists = glob("prefs/*STREAM*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url) {
                //error_log("Found Stream!");
                $album = $track->title;
                if ($track->album) { $album = $track->album; }
                return array (  $track->title, null, null, null, null, 
                                $track->creator, $album, null, "stream",
                                $track->image, null, null, null);
            }
        }
    }

    $playlists = glob("prefs/*RADIO*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        $expiry = "";
        if ($x->playlist->date) {
            $timestring = $x->playlist->date;
            $matches = array();
            if (preg_match('/(\d+)-(\d+)-(\d+)T(\d+):(\d+)(\d+)/', $timestring, $matches)) {
                $utime = mktime($matches[4],$matches[5],$matches[6],$matches[2],$matches[3],$matches[1]);
                $expiry = $utime+$x->playlist->link;
            }
        }
        foreach($x->playlist->trackList->track as $i => $track) {
            if($track->location == $url) {
                return array (  $track->title, ($track->duration)/1000,
                                null, null, null, $track->creator,
                                $track->album, null, "lastfmradio", 
                                $track->image, $expiry, $x->playlist->stationurl,
                                $x->playlist->title );
            }
                    
        }
    }

    return array( null, null, null, null, null, null, null, null, null, null, null, null, null );
     
}

function doCollection($command) {
    
    global $connection;
    global $COMPILATION_THRESHOLD;
    
    $collection = new musicCollection($connection);
    fputs($connection, $command."\n");
    $firstline = null;
    $filedata = array();
    $parts = true;
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts)) {
            if ($parts[0] == $firstline) {
                process_file($collection, $filedata);
                $filedata = array();
            }
            $filedata[$parts[0]] = $parts[1];
            if ($firstline == null) {
                $firstline = $parts[0];
            }
        }
    }
    if ($filedata['file']) {
        process_file($collection, $filedata);
    }

    // Rescan stage - to find albums that are compilations but have been missed by the above step
    $possible_compilations = array();
    foreach($collection->albums as $i => $al) {
        if (!$al->isCompilation() && utf8_decode($al->name) != "") {
            $numtracks = $al->trackCount();
            if ($numtracks < $COMPILATION_THRESHOLD) {
                if (array_key_exists(utf8_decode($al->name), $possible_compilations)) {
                    $possible_compilations[utf8_decode($al->name)]++;
                } else {
                    $possible_compilations[utf8_decode($al->name)] = 1;
                }
            }
        }
    }
            
    foreach($possible_compilations as $name => $count) {
        if ($count > 1) {
            //error_log("Album ".$name." score is ".$count);
            $collection->createCompilation($name);
        }
    }
    
    return $collection;
}

function createHTML($artistlist, $prefix) {
    // Make sure 'Various Artists' is the first one in the list
    if (array_search("various artists", $artistlist)) {
        $key = array_search("various artists", $artistlist);
        unset($artistlist[$key]);
        do_albums("various artists", false, true, $prefix);
    }

    // Add all the other artists
    foreach($artistlist as $artistkey) {
        do_albums($artistkey, true, false, $prefix);
    }
}

function do_albums($artistkey, $compilations, $showartist, $prefix) {
    
    global $count;
    global $collection;
    global $divtype;

    $albumlist = $collection->getAlbumList($artistkey, $compilations);
    if (count($albumlist) > 0) {
        $artist = $collection->artistName($artistkey);
       // We have albums for this artist
        print '<div id="artistname" class="' . $divtype . '">' . "\n";
        print '<a href="javascript:doMenu(\''.$prefix.'artist' . $count . '\');" class="toggle" name="'.$prefix.'artist' . $count . '">+</a>' . "\n";
        print $artist;
        print "</div>\n";    
        print '<div id="albummenu" name="'.$prefix.'artist' . $count . '" class="' . $divtype . '">' . "\n";
        
        // albumlist is now an array of album objects
        foreach($albumlist as $album) {
            
            print '<div id="albumname" class="' . $divtype . '">' . "\n";
            print '<table><tr><td>';
            print '<a href="javascript:doMenu(\''.$prefix.'album' . $count . '\');" class="toggle" name="'.$prefix.'album' . $count . '">+</a></td><td>' . "\n";
            // We don't set the src tags for the images when the page loads, otherwise we'd be loading in
            // literally hundres of images we don't need. Instead we set the name tag to the url
            // of the image, and then use jQuery magic to set the src tag when the menu is opened - 
            // so we only ever load the images we need. The custom redirect will take care of missing images
            $artname = md5($artist . " " . $album->name);

            print '<img id="updateable" style="vertical-align:middle" src="" height="32" name="albumart/small/'.$artname.'.jpg"></td><td>';
            //print '<a href="#" onclick="infobar.command(\'command=findadd&arg=album&arg2='.htmlentities(rawurlencode($album->name)).'\', playlist.repopulate)">'.
            //            $album->name.'</a>';
            print '<a href="#" onclick="infobar.addalbum(\''.$prefix.'album' . $count . '\')">'.$album->name.'</a>';
            print "</td></tr></table></div>\n";    

            print '<div id="albummenu" name="'.$prefix.'album' . $count . '" class="indent ' . $divtype . '">' . "\n";
            print '<table width="100%">';
            $album->sortTracks();
            foreach($album->tracks as $trackobj) {
                print '<tr><td align="left" class="tracknumber">' . $trackobj->number . "</td><td>";
                print '<a href="#" onclick="infobar.command(\'command=add&arg='.htmlentities(rawurlencode($trackobj->url)).'\', playlist.repopulate)">'.
                        $trackobj->name.'</a>';
                print "</td></tr>\n";
                if ($showartist) {
                    print '<tr><td></td><td class="playlistrow2">' . $trackobj->artist . '</td></tr>';
                }
            }
            
            print "</table>\n";        
            print "</div>\n";
            $count++;
        }
        print "</div>\n";

        $count++;
        $divtype = ($divtype == "album1") ? "album2" : "album1";
    }
}

?>
