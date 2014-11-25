<?php

$backend_in_use = "xml";

function dumpAlbums($which) {

    global $divtype;
    global $ARTIST;
    global $ALBUM;

    debug_print("Generating output from XML","DUMPALBUMS");

    $headers =  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'.
                '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">'.
                '<head>'.
                '<meta http-equiv="cache-control" content="max-age=0" />'.
                '<meta http-equiv="cache-control" content="no-cache" />'.
                '<meta http-equiv="expires" content="0" />'.
                '<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />'.
                '<meta http-equiv="pragma" content="no-cache" />'.
                '</head>'.
                '<body>';
    print $headers;
    $fname = getWhichXML($which);
    $fp = fopen($fname, 'r+');
    if ($fp) {
        $crap = true;
        // We need an exclusive lock on the file so we don't try to read it while
        // the albumart thread is writing to it
        if (flock($fp, LOCK_EX, $crap)) {
            $x = simplexml_load_file($fname);
            flock($fp, LOCK_UN);
            if (preg_match('/albumroot/', $which)) {
                if ($which == 'aalbumroot') {
                    print '<div class="menuitem"><h3>'.get_int_text("button_local_music").'</h3></div>';
                } else if ($which == 'balbumroot') {
                    print '<div class="menuitem"><h3>'.get_int_text("label_searchresults").'</h3></div>';
                }
                print alistheader($x->artists->numartists, $x->artists->numalbums, $x->artists->numtracks, $x->artists->duration);

                foreach($x->artists->artist as $i => $artist) {
                    artistHeader($artist['id'], $artist->spotilink, $artist->name, count($artist->albums->children()));
                    $divtype = ($divtype == "album1") ? "album2" : "album1";
                }
            } else {
                list ($type, $obj) = findItem($x, $which);
                if ($type == $ARTIST) {
                    $count = 0;
                    foreach($obj->albums->album as $i => $album) {
                        albumHeader(
                            $album->name,
                            $album->spotilink,
                            $album['id'],
                            $album->isonefile,
                            $album->image->exists,
                            $album->image->searched,
                            $album->image->name,
                            $album->image->src,
                            $album->date,
                            count($album->tracks->children())
                        );
                        $count++;
                    }
                    if ($count == 0) {
                        noAlbumsHeader();
                    }
                }
                if ($type == $ALBUM) {
                    $count = 0;
                    $currdisc = -1;
                    foreach($obj->tracks->track as $i => $trackobj) {
                        if (!$trackobj->playlist) {
                            if ($obj->numdiscs > 1 && $trackobj->disc && $trackobj->disc != $currdisc) {
                                $currdisc = $trackobj->disc;
                                print '<div class="discnumber indent">Disc '.$currdisc.'</div>';
                            }
                            albumTrack(
                                $trackobj->artist,
                                -1,
                                $trackobj->url,
                                $obj->tracks->track->count(),
                                $trackobj->number,
                                $trackobj->name,
                                $trackobj->duration,
                                (string) $trackobj->lastmodified === "" ? null : (string) $trackobj->lastmodified,
                                $trackobj->image
                            );
                            $count++;
                        }
                    }
                    if ($count == 0) {
                        noAlbumTracks();
                    }
                }
            }

        } else {
            debug_print("File Lock Failed!","DUMPALBUMS");
            print '<h3>'.get_int_text("label_general_error").'</h3>';
        }
    } else {
        debug_print("File Open Failed!","DUMPALBUMS");
        print '<h3>'.get_int_text("label_general_error").'</h3>';
    }
    fclose($fp);
    print '</body></html>';
}


function getWhichXML($which) {
    global $ALBUMSLIST;
    global $ALBUMSEARCH;
    global $FILESLIST;
    global $FILESEARCH;
    global $mysqlc;
    if (substr($which,0,2) == "aa") {
        return $ALBUMSLIST;
    } else if (substr($which,0,2) == "ba") {
        return $ALBUMSEARCH;
    } else if (substr($which,0,2) == "ad") {
        return $FILESLIST;
    } else if (substr($which,0,2) == "bd") {
        return $FILESEARCH;
    } else {
        if (file_exists('prefs/'.substr($which,0,1).'_list.xml')) {
            return 'prefs/'.substr($which,0,1).'_list.xml';
        } else {
            debug_print("ATTEMPTING TO LOOK FOR SOMETHING WE SHOULDN'T BE!","FUNCTIONS");
            return "";
        }
    }

}

function createAlbumsList($file, $prefix) {

    global $collection;
    $output = new collectionOutput($file);
    createXML($collection->getSortedArtistList(), $prefix, $output);
    $output->closeFile();

}

class collectionOutput {

    public function __construct($file) {
        $this->fname = $file;
        $this->fhandle = null;

        $xmlheaders = '<?xml version="1.0" encoding="utf-8"?>'."\n".
                        '<collection>'."\n".
                        '<artists>'."\n";

        if ($file != "") {
            $this->fhandle = fopen($file, 'w');
            fwrite($this->fhandle, $xmlheaders);
        } else {
            print $xmlheaders;
        }
    }

    public function writeLine($line) {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, $line);
        } else {
            print $line;
        }
    }

    public function closeFile() {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, "</artists>\n</collection>\n");
            fclose($this->fhandle);
        } else {
            print '</body></html>';
        }
    }

    public function dumpFile() {
        if ($this->fname != "") {
            // debug_print("Dumping Files List to ".$this->fname);
            $file = fopen($this->fname, 'r');
            while(!feof($file))
            {
                echo fgets($file);
            }
            fclose($file);
        }
    }

}

function createXML($artistlist, $prefix, $output) {
    global $numtracks;
    global $numalbums;
    global $numartists;
    global $totaltime;

    $output->writeLine(xmlnode("numtracks", $numtracks));
    $output->writeLine(xmlnode("numalbums", $numalbums));
    $output->writeLine(xmlnode("duration", format_time($totaltime)));

    if (array_search("various artists", $artistlist)) {
        debug_print("Doing Various Artists","COLLECTION");
        $key = array_search("various artists", $artistlist);
        do_albums_xml("various artists", false, true, $prefix, $output);
        unset($artistlist[$key]);
    }

    // Add all the other artists
    foreach($artistlist as $artistkey) {
        do_albums_xml($artistkey, true, false, $prefix, $output);
    }
    $output->writeLine(xmlnode("numartists", $numartists));

}

function do_albums_xml($artistkey, $compilations, $showartist, $prefix, $output) {

    global $count;
    global $collection;
    global $divtype;
    global $numartists;

    //debug_print("Doing Artist: ".$artistkey);
    $artist = $collection->artistName($artistkey);
    $albumlist = $collection->getAlbumList($artistkey, $compilations, false);
    if (count($albumlist) > 0 || $collection->spotilink($artistkey) != null) {
        $numartists++;
        $output->writeLine('<artist id="'.$prefix.'artist'.$count.'">'."\n");
        $output->writeLine(xmlnode('name', $artist));
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
            if ($album->domain == "local") {
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
            $output->writeLine(xmlnode('searched', 'no'));
            $output->writeLine("</image>\n");
            if ($album->isOneFile()) {
                $output->writeLine(xmlnode('isonefile', 'yes'));
            }
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
                    if (($showartist ||
                        ($album->artist != null && ($album->artist != $trackobj->get_artist_string()))) &&
                        ($trackobj->get_artist_string() != null && $trackobj->get_artist_string() != '.')
                    ) {
                        $output->writeLine(xmlnode('artist', $trackobj->get_artist_string()));
                    }
                    $output->writeLine(xmlnode('url', rawurlencode($trackobj->url)));
                    $output->writeLine(xmlnode('number', $trackobj->number));
                    $output->writeLine(xmlnode('name', $trackobj->name));
                    $output->writeLine(xmlnode('duration', format_time($trackobj->duration)));
                    $output->writeLine(xmlnode('image', $trackobj->image));
                    $output->writeLine(xmlnode('lastmodified', $trackobj->lastmodified));
                    if ($trackobj->playlist && count($album->tracks) == 1) {
                        // Don't include the cue sheet if the albums object has more than one track -
                        // because if it does then it will be a cue sheet alongside a multi-track rip
                        // and if we include it then the whole album gets added to the playlist twice
                        // It's totally silly to even display it
                        $output->writeLine(xmlnode('playlist', rawurlencode($trackobj->playlist)));
                    }
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

function getItemsToAdd($which) {
    global $ARTIST;
    global $ALBUM;

    $fname = getWhichXML($which);
    $x = simplexml_load_file($fname);
    if (substr($which, 0, 4) == "adir" || substr($which, 0, 4) == "bdir") {
        return getTracksForDir(findFileItem($x, $which));
    } else {
        list ($type, $obj) = findItem($x, $which);
        if ($type == $ARTIST) {
            return getTracksForArtist($obj);
        }
        if ($type == $ALBUM) {
            return getTracksForAlbum($obj);
        }
    }
}

function getTracksForArtist($artist) {
    $retarr = array();
    foreach($artist->albums->album as $i => $album) {
        $retarr = array_merge($retarr, getTracksForAlbum($album));
    }
    return $retarr;
}

function getTracksForAlbum($album) {
    $retarr = array();
    foreach($album->tracks->track as $j => $track) {
        if ($track->playlist) {
            array_push($retarr, "load ".rawurldecode($track->playlist));
        } else {
            array_push($retarr, "add ".rawurldecode($track->url));
        }
    }
    return $retarr;
}

function getTracksForDir($dir) {
    $retarr = array();
    foreach($dir->artists->item as $i => $d) {
        if ($d->type == "file") {
            array_push($retarr, "add ".rawurldecode($d->url));
        } else if ($d->type == "cue") {
            array_push($retarr, "load ".rawurldecode($d->url));
        } else {
            $retarr = array_merge($retarr, getTracksForDir($d));
        }
    }
    return $retarr;
}

function get_imagesearch_info($fname) {
    global $ALBUMSLIST;
    $axp = array();
    $fp = null;
    $retval = array(false, null, null, null, null, null, false);
    if (file_exists($ALBUMSLIST)) {
        if (get_file_lock($ALBUMSLIST, $fp)) {
            $ax = simplexml_load_file($ALBUMSLIST);
            $axp = $ax->xpath('//image/name[.="'.$fname.'"]/parent::*/parent::*');
        }
        release_file_lock($fp);
    }
    if ($axp) {
        $aar       = $ax->xpath('//image/name[.="'.$fname.'"]/parent::*/parent::*/parent::*/parent::*');
        $retval[1] = $aar[0]->{'name'};
        $retval[2] = $axp[0]->{'name'};
        $retval[3] = $axp[0]->{'mbid'};
        $retval[4] = rawurldecode($axp[0]->{'directory'});
        $retval[5] = rawurldecode($axp[0]->{'spotilink'});
        $retval[0] = true;
        $retval[6] = true;
    }
    return $retval;
}

function update_image_db($fname, $notfound, $imagefile) {
    global $ALBUMSLIST;
    if (file_exists($ALBUMSLIST)) {
        // Get an exclusive lock on the file. We can't have two threads trying to update it at once.
        // That would be bad.
        $fp = fopen($ALBUMSLIST, 'r+');
        if ($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {
                $x = simplexml_load_file($ALBUMSLIST);
                debug_print("  Updating cache for for ".$fname.", error is ".$notfound,"GETALBUMCOVER");
                foreach($x->artists->artist as $i => $artist) {
                    foreach($artist->albums->album as $j => $album) {
                        if ($album->image->name == $fname) {
                            debug_print("    Found XML Entry","GETALBUMCOVER");
                            if ($notfound == 0) {
                                $album->image->src = $imagefile;
                                $album->image->exists = "yes";
                            } else {
                                $album->image->src = "";
                                $album->image->exists = "no";
                            }
                            $album->image->searched = "yes";
                            ftruncate($fp, 0);
                            fwrite($fp, $x->asXML());
                            fflush($fp);
                            flock($fp, LOCK_UN);
                            break 2;
                        }
                    }
                }
            } else {
                debug_print("    FAILED TO GET FILE LOCK","GETALBUMCOVER");
            }
        } else {
            debug_print("    FAILED TO OPEN CACHE FILE!","GETALBUMCOVER");
        }
        fclose($fp);
    }

}

?>
