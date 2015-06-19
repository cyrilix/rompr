<?php

$backend_in_use = "xml";

function dumpAlbums($which) {

    global $divtype;

    debug_print("Generating output ".$which." from XML","DUMPALBUMS");

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
                    // print '<div class="menuitem"><h3>'.get_int_text("button_local_music").'</h3></div>';
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
                if ($type == ROMPR_ITEM_ARTIST) {
                    $count = 0;
                    foreach($obj->albums->album as $i => $album) {
                        albumHeader(
                            $album->name,
                            $album->spotilink,
                            $album['id'],
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
                if ($type == ROMPR_ITEM_ALBUM) {
                    $currdisc = -1;
                    $numtracks = count($obj->tracks->track);
                    foreach($obj->tracks->track as $i => $trackobj) {
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
                        if ($numtracks == 2 && $trackobj->name == "Cue Sheet") {
                            break;
                        }
                    }
                    if ($numtracks == 0) {
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
}


function getWhichXML($which) {
    global $mysqlc;
    if (substr($which,0,2) == "aa") {
        return ROMPR_XML_COLLECTION;
    } else if (substr($which,0,2) == "ba") {
        return ROMPR_XML_SEARCH;
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
    debug_print("Creating XML Collection Output","XML_BACKEND");
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

    // Add all the other artists
    foreach($artistlist as $artistkey) {
        if ($artistkey == "various artists") {
            do_albums_xml($artistkey, false, true, $prefix, $output);
        } else {
            do_albums_xml($artistkey, true, false, $prefix, $output);
        }
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
                        $trackobj->get_artist_string() != null
                    ) {
                        $output->writeLine(xmlnode('artist', $trackobj->get_artist_string()));
                    }
                    $output->writeLine(xmlnode('url', rawurlencode($trackobj->url)));
                    $output->writeLine(xmlnode('number', $trackobj->number));
                    $output->writeLine(xmlnode('name', $trackobj->name));
                    $output->writeLine(xmlnode('duration', format_time($trackobj->duration)));
                    $output->writeLine(xmlnode('image', $trackobj->image));
                    $output->writeLine(xmlnode('lastmodified', $trackobj->lastmodified));
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

function getItemsToAdd($which, $cmd = null) {
    $fname = getWhichXML($which);
    $x = simplexml_load_file($fname);
    list ($type, $obj) = findItem($x, $which);
    if ($type == ROMPR_ITEM_ARTIST) {
        return getTracksForArtist($obj, $cmd);
    }
    if ($type == ROMPR_ITEM_ALBUM) {
        return getTracksForAlbum($obj, $cmd);
    }
}

function getTracksForArtist($artist, $cmd) {
    $retarr = array();
    foreach($artist->albums->album as $i => $album) {
        $retarr = array_merge($retarr, getTracksForAlbum($album, $cmd));
    }
    return $retarr;
}

function getTracksForAlbum($album, $cmd) {
    $retarr = array();
    foreach($album->tracks->track as $j => $track) {
        if ($cmd == null) {
            if ((string) $track->name == "Cue Sheet" || (string) $track->name == "M3U Playlist") {
                array_push($retarr, "load ".rawurldecode($track->url));
                break;
            } else {
                array_push($retarr, "add ".rawurldecode($track->url));
            }
        } else {
            if ((string) $track->name == "Cue Sheet" 
                || (string) $track->name == "M3U Playlist") {
            } else {
                array_push($retarr, $cmd.' "'.rawurldecode($track->url).'"');
            }
        }
    }
    return $retarr;
}

function get_imagesearch_info($fname) {
    $axp = array();
    $fp = null;
    $retval = array(false, null, null, null, null, null, false);
    if (file_exists(ROMPR_XML_COLLECTION)) {
        if (get_file_lock(ROMPR_XML_COLLECTION, $fp)) {
            $ax = simplexml_load_file(ROMPR_XML_COLLECTION);
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
    if (file_exists(ROMPR_XML_COLLECTION)) {
        // Get an exclusive lock on the file. We can't have two threads trying to update it at once.
        // That would be bad.
        $fp = fopen(ROMPR_XML_COLLECTION, 'r+');
        if ($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {
                $x = simplexml_load_file(ROMPR_XML_COLLECTION);
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

function prepareCollectionUpdate() {

}

?>
