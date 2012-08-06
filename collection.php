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

        $this->tracks[] = $object;

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
            //if ($track->url == $url) {
                return $track;
            }
        }
        return null;
    }

}

class artist {

    public function __construct($name) {
        // error_log("New Artist : ".$name);
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
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station,
                                $albumartist, $disc, $stream) {

        // error_log($name." : ".$file." : ".$artist." : ".$album." : ".
        //             $type." : ".$playlistpos." : ".$stationurl." : ".$station." : ".
        //             $stream);

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
            foreach($this->getAlbumList(strtolower(preg_replace('/^The /i', '', $artist)), false, false) as $object) {
                // error_log("Finding album : ".$album." : ".$artist." : ".$object->name);
                if (trim($album) == trim($object->name)) {
                    // error_log("  FOUND!");
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
                                $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                                $albumartist, $disc, $stream) {
        $sortartist = $artist;
        if ($albumartist != null) { $sortartist = $albumartist; }

        $artistkey = strtolower(preg_replace('/^The /i', '', $sortartist));
        $t = new track($name, $file, $duration, $number, $date, $genre, $artist, $album, $directory,
                        $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, 
                        $albumartist, $disc, $stream);
        // If artist doesn't exist, create it - indexed by all lower case name for convenient sorting and grouping
        if (!array_key_exists($artistkey, $this->artists)) {
            //error_log("Adding Artist : " . strtolower($artist));
            $this->artists[$artistkey] = new artist($sortartist);
        }

        // Albums are not indexed by name, since we may have 2 or more albums with the same name by multiple artists
        // Does an album with this name by this aritst already exist?
        $abm = $this->findAlbum($album, $sortartist, null);
        if ($abm == false) {
            // error_log("Did not find album ".$album." in artist ".$sortartist);
            // Does an album with this name where the tracks are in the same directory exist?
            $abm = $this->findAlbum($album, null, $directory);
            if ($abm != false) {
                // error_log("Found this album but it's by someone else");
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
            $abm = new album($album, $sortartist);
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

    public function getAlbumList($artist, $ignore_compilations, $only_without_cover) {
        $albums = array();
        foreach($this->artists[$artist]->albums as $object) {
            if ($object->isCompilation() && $ignore_compilations) {

            } else {
                if ($only_without_cover) {
                    $artname = md5($this->artists[$artist]->name . " " . $object->name);
                    if (!file_exists("albumart/original/".$artname.".jpg")) {
			             // Changed for sorting albums alphabetically
                        //$albums[] = $object;
                        $albums[(string) $object->name] = $object;
                    }
                } else {
		          // Changed for sorting albums alphabetically
		          //$albums[] = $object;
                    $albums[(string) $object->name] = $object;
                }
            }
        }

	   // Changed for sorting albums alphabetically
	   ksort($albums, SORT_STRING);
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
    $file = $filedata['file'];

    list ($name, $duration, $number, $date, $genre, $artist, $album, $folder,
          $type, $image, $expires, $stationurl, $station, $backendid, $playlistpos, $albumartist, $disc)
        = array ( null, 0, "", null, null, null, null, null, "local", null, null, null, null, null, null, null, 0 );

    if (preg_match('/^http:\/\//', $file)
        || preg_match('/^mms:\/\//', $file)) {

        list ($name, $duration, $number, $date, $genre, $artist, $album, $folder,
                $type, $image, $expires, $stationurl, $station, $stream)
                = getStuffFromXSPF($file);
        if ($name == null) {
            $name = "";
            $album = "Unknown Internet Stream";
            $artist = htmlspecialchars($file);
            $duration = 0;
            $type = "stream";
            $image = "images/broadcast.png";
            $number = "";
            $stream = "";
        }
    } else {
        $artist = (array_key_exists('Artist', $filedata)) ? $filedata['Artist'] : basename(dirname(dirname($file)));
        $album = (array_key_exists('Album', $filedata)) ? $filedata['Album'] : basename(dirname($file));
        $albumartist = (array_key_exists('AlbumArtist', $filedata)) ? $filedata['AlbumArtist'] : null;
        $name = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($file);
        $duration = (array_key_exists('Time', $filedata)) ? $filedata['Time'] : null;
        $number = (array_key_exists('Track', $filedata)) ? format_tracknum($filedata['Track']) : format_tracknum(basename($file));
        $disc = (array_key_exists('Disc', $filedata)) ? format_tracknum($filedata['Disc']) : 0;
        $date = (array_key_exists('Date',$filedata)) ? $filedata['Date'] : null;
        $genre = (array_key_exists('Genre', $filedata)) ? $filedata['Genre'] : null;
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
    }

    $backendid = (array_key_exists('Id',$filedata)) ? $filedata['Id'] : null;
    $playlistpos = (array_key_exists('Pos',$filedata)) ? $filedata['Pos'] : null;

    $collection->newTrack($name, $file, $duration, $number, $date, $genre, $artist, $album, $folder,
                            $type, $image, $backendid, $playlistpos, $expires, $stationurl, $station, $albumartist, $disc, $stream);
}


function getStuffFromXSPF($url) {
    global $xml;
    //error_log("Checking for ".$url);

    $playlists = glob("prefs/*RADIO*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        $expiry = "";
        if ($x->playlist->unixtimestamp) {
            $expiry = $x->playlist->unixtimestamp+$x->playlist->link;
        }
        foreach($x->playlist->trackList->track as $i => $track) {
            if($track->location == $url) {
                return array (  $track->title, ($track->duration)/1000,
                                null, null, null, $track->creator,
                                $track->album, null, "lastfmradio",
                                $track->image, $expiry, $x->playlist->stationurl,
                                $x->playlist->title, null );
            }

        }
    }

    $playlists = glob("prefs/*STREAM*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url) {
                //error_log("Found Stream!");
                return array (  $track->title, null, null, null, null,
                                $track->creator, $track->album, null, "stream",
                                $track->image, null, null, null, $track->stream);
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
                        null, "local",
                        $x->trackList->track->image,
                        null, null, null, null);
    }

    return array( null, null, null, null, null, null, null, null, null, null, null, null, null, null );

}

function doCollection($command) {

    global $connection;
    global $is_connected;
    global $COMPILATION_THRESHOLD;
    $collection = new musicCollection($connection);

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

    $albumlist = $collection->getAlbumList($artistkey, $compilations, false);
    if (count($albumlist) > 0) {

        $artist = $collection->artistName($artistkey);
       // We have albums for this artist
        print '<div id="artistname" class="' . $divtype . '">' . "\n";
        print '<table width="100%"><tr><td width="18px"><a href="javascript:doMenu(\''.$prefix.'artist' . $count . '\');" class="toggle" name="'.$prefix.'artist' . $count . '"><img src="images/toggle-closed.png"></a></td><td>'.$artist.'</td></tr></table></div>';
        print '<div id="albummenu" name="'.$prefix.'artist' . $count . '" class="' . $divtype . '">' . "\n";

        // albumlist is now an array of album objects
        foreach($albumlist as $album) {

            print '<div id="albumname" class="' . $divtype . '">' . "\n";
            print '<table><tr><td>';
            print '<a href="javascript:doMenu(\''.$prefix.'album' . $count . '\');" class="toggle" name="'.$prefix.'album' . $count . '"><img src="images/toggle-closed.png"></a></td><td>' . "\n";
            // We don't set the src tags for the images when the page loads, otherwise we'd be loading in
            // literally hundres of images we don't need. Instead we set the name tag to the url
            // of the image, and then use jQuery magic to set the src tag when the menu is opened -
            // so we only ever load the images we need. The custom redirect will take care of missing images
            $artname = md5($artist . " " . $album->name);

            print '<img id="updateable" style="vertical-align:middle" src="" height="32" name="albumart/small/'.$artname.'.jpg"></td><td>';
            print '<a href="#" onclick="infobar.addalbum(\''.$prefix.'album' . $count . '\')">'.$album->name.'</a>';
            print "</td></tr></table></div>\n";

            print '<div id="albummenu" name="'.$prefix.'album' . $count . '" class="indent ' . $divtype . '">' . "\n";
            print '<table width="100%">';
            $numdiscs = $album->sortTracks();
            $currdisc = -1;
            foreach($album->tracks as $trackobj) {
                if ($numdiscs > 1) {
                    if ($trackobj->disc != null && $trackobj->disc != $currdisc) {
                        $currdisc = $trackobj->disc;
                        print '<tr><td class="discnumber" colspan="3">Disc '.$currdisc.'</td></tr>';
                    }
                }
                $dorow2 = false;
                if ($showartist || ($trackobj->albumartist != null && ($trackobj->albumartist != $trackobj->artist))) {
                    $dorow2 = true;
                }
                print '<tr><td align="left" class="tracknumber"';
                if ($dorow2) {
                    print 'rowspan="2"';
                }
                print '>' . $trackobj->number . "</td>";
                print '<td><a href="#" onclick="playlist.addtrack(\''.htmlentities(rawurlencode($trackobj->url)).'\')">'.
                        $trackobj->name.'</a>';
                print "</td>\n";
                print '<td align="right">'.format_time($trackobj->duration).'</td>';
                print "</tr>\n";
                if ($dorow2) {
                    print '<tr><td class="playlistrow2" colspan="2">' . $trackobj->artist . '</td></tr>';
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
