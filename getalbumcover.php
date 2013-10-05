<?php
ob_start();
include ("vars.php");
include ("functions.php");

$stream = "";
$src = "";
$error = 0;
$file = "";
$artist = "";
$album = "";
$mbid = "";
$discogsid = "";
$albumpath = "";
$spotilink = "";
$small_file = "";
$main_file = "";
$base64data = "";
$delaytime = 1;
$fp = null;
$preferred_countries = array("UK", "UK and Europe", "Europe", "Germany", "US");
$preferred_formats = array("CD", "Vinyl", "Album", "Cassette", "Minidisc");
$compilation = false;

debug_print("------- Searching For Album Art --------","GETALBUMCOVER");

$fname = $_REQUEST['key'];
if (array_Key_exists('stream', $_REQUEST)) {
    $stream = $_REQUEST["stream"];
}

if (array_key_exists("src", $_REQUEST)) {
    $src = $_REQUEST['src'];
} else if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
} else if (array_key_exists("base64data", $_REQUEST)) {
    $base64data = $_REQUEST['base64data'];
} else {
    if ($stream != "") {
        if (file_exists($stream)) {
            $ax = simplexml_load_file($stream);
            $artist = "Internet Radio";
            $album = $ax->trackList->track[0]->album;
        } else {
            debug_print(" Supplied stream file not found!","GETALBUMCOVER");
        }
    } else {
        $axp = array();
        // Look for this album in our caches
        if (file_exists($ALBUMSLIST)) {
            if (get_file_lock($ALBUMSLIST, $fp)) {
                $ax = simplexml_load_file($ALBUMSLIST);
                $axp = $ax->xpath('//image/name[.="'.$fname.'"]/parent::*/parent::*');
            }
            release_file_lock($fp);
        }
        if (!$axp && file_exists($ALBUMSEARCH)) {
            if (get_file_lock($ALBUMSEARCH, $fp)) {
                $ax = simplexml_load_file($ALBUMSEARCH);
                $axp = $ax->xpath('//image/name[.="'.$fname.'"]/parent::*/parent::*');
            }
            release_file_lock($fp);
        }
        if (!$axp) {
            if (file_exists($PLAYLISTFILE)) {
                if (get_file_lock($PLAYLISTFILE, $fp)) {
                    $ax = json_decode(file_get_contents($PLAYLISTFILE), true);
                    foreach ($ax as $track) {
                        if ($track['key'] == $fname) {
                            $artist    = $track['albumartist'];
                            $album     = $track['album'];
                            $mbid      = $track['musicbrainz']['albumid'];
                            $albumpath = rawurldecode($track['dir']);
                            $spotilink = rawurldecode($track['spotify']['album']);
                            debug_print("Found album ".$album." in playlist","DEBUGGING");
                            break;
                        }
                    }
                }
                release_file_lock($fp);
            }
        } else {
            $aar       = $ax->xpath('//image/name[.="'.$fname.'"]/parent::*/parent::*/parent::*/parent::*');
            $artist    = $aar[0]->{'name'};
            $album     = $axp[0]->{'name'};
            $mbid      = $axp[0]->{'mbid'};
            $albumpath = rawurldecode($axp[0]->{'directory'});
            $spotilink = rawurldecode($axp[0]->{'spotilink'});
        }
    }
}

if (preg_match('/\d+/', $mbid) && !preg_match('/-/', $mbid)) {
    debug_print(" Supplied MBID of ".$mbid." looks more like a Discogs ID","GETALBUMCOVER");
    $discogsid = $mbid;
    $mbid = "";
}

if ($discogsid != "") {
    $discogsid = 'release/'.$discogsid;
}

// trying a discogs id will reset it, so musicbrains can try filling it in with a master release
// Last.FM can try to find us a musicbrainz ID if we don't have one

if ($discogsid != "" && $mbid != "") {
    $searchfunctions = array( 'tryLocal', 'tryRemoteCache', 'trySpotify', 'tryDiscogsId', 'tryMusicBrainz', 'tryDiscogsId', 'tryLastFM', 'tryDiscogs' );
} else if ($discogsid != "" && $mbid == "") {
    $searchfunctions = array( 'tryLocal', 'tryRemoteCache', 'trySpotify', 'tryDiscogsId', 'tryLastFM', 'tryMusicBrainz', 'tryDiscogsId', 'tryDiscogs' );
} else if ($discogsid == "" && $mbid != "") {
    $searchfunctions = array( 'tryLocal', 'tryRemoteCache', 'trySpotify', 'tryMusicBrainz', 'tryDiscogsId', 'tryLastFM', 'tryDiscogs' );
} else {
    $searchfunctions = array( 'tryLocal', 'tryRemoteCache', 'trySpotify', 'tryLastFM', 'tryMusicBrainz', 'tryDiscogsId', 'tryDiscogs' );
}


debug_print("  KEY     : ".$fname,"GETALBUMCOVER");
debug_print("  SOURCE  : ".$src,"GETALBUMCOVER");
debug_print("  UPLOAD  : ".$file,"GETALBUMCOVER");
debug_print("  STREAM  : ".$stream,"GETALBUMCOVER");
debug_print("  ARTIST  : ".$artist,"GETALBUMCOVER");
debug_print("  ALBUM   : ".$album,"GETALBUMCOVER");
debug_print("  MBID    : ".$mbid,"GETALBUMCOVER");
debug_print("  DISCOGS : ".$discogsid,"GETALBUMCOVER");
debug_print("  PATH    : ".$albumpath,"GETALBUMCOVER");
debug_print("  SPOTIFY : ".$spotilink,"GETALBUMCOVER");

// Attempt to download an image file

$convert_path = find_executable("convert");

$download_file = "";
if ($file != "") {
    $download_file = get_user_file($file, $fname, $_FILES['ufile']['tmp_name']);
} elseif ($src != "") {
    $download_file = download_file($src, $fname, $convert_path);
} elseif ($base64data != "") {
    $download_file = save_base64_data($base64data, $fname);
} else {
    while (count($searchfunctions) > 0 && $src == "") {
        $fn = array_shift($searchfunctions);
        $src = $fn();
        if ($src != "") {
            // Don't store files locally if we know it's a spotify album
            // - this'll just fill up the disk really quickly.
            if ($spotilink == "") {
                $download_file = download_file($src, $fname, $convert_path);
                if ($error == 1) {
                    $error = 0;
                    $src = "";
                }
            }
        }
    }
    if ($src == "") {
        $error = 1;
        debug_print("  No art was found. Try the Tate Modern","GETALBUMCOVER");
    }
}

if ($error == 0 && $spotilink == "") {
    saveImage($fname);
}

// Now that we've attempted to retrieve an image, even if it failed,
// we need to edit the cached albums list so it doesn't get searched again
// and edit the URL so it points to the correct image if one was found
if (file_exists($ALBUMSLIST) && $stream == "" && $spotilink == "") {
    update_cache($fname, $error, $ALBUMSLIST, "albumart/small/".$fname.".jpg");
}

if ($spotilink != "") {
    updateRemoteCache($fname, $src);
}

if ($error == 0) {
    if ($stream != "") {
        if (file_exists($stream)) {
            debug_print("    Updating stream playlist ".$stream,"GETALBUMCOVER");
            $x = simplexml_load_file($stream);
            foreach($x->trackList->track as $i => $track) {
                $track->image = "albumart/original/".$fname.".jpg";
            }
            $fp = fopen($stream, 'w');
            if ($fp) {
                fwrite($fp, $x->asXML());
            }
            fclose($fp);
        }
    }

}

header('Content-Type: text/xml; charset=utf-8');
print  '<?xml version="1.0" encoding="utf-8"?>'."\n".
        '<imageresults version="1">'."\n".
        '<imageList>';
if ($spotilink == "") {
    if ($error == 1) {
        print xmlnode('url', "");
    } else {
        print xmlnode('url', "albumart/original/".$fname.".jpg");
        print xmlnode('origurl', "albumart/asdownloaded/".$fname.".jpg");
    }
} else {
    print xmlnode('url', $src);
}
print xmlnode('delaytime', $delaytime);
print "</imageList>\n</imageresults>\n";

if ($download_file != "" && file_exists($download_file)) {
    unlink($download_file);
}

debug_print("--------------------------------------------","GETALBUMCOVER");

ob_flush();

function get_user_file($src, $fname, $tmpname) {
    global $error;
    debug_print("  Uploading ".$src." ".$fname." ".$tmpname,"GETALBUMCOVER");
    $download_file = "prefs/".$fname;
    if (move_uploaded_file($tmpname, $download_file)) {
        debug_print("    File ".$src." is valid, and was successfully uploaded.","GETALBUMCOVER");
    } else {
        debug_print("    Possible file upload attack!","GETALBUMCOVER");
        $error = 1;
    }
    return $download_file;
}

function download_file($src, $fname, $convert_path) {
    global $error;

    $download_file = "albumart/".$fname;
    debug_print("   Downloading Image ".$src." to ".$fname,"GETALBUMCOVER");

    if (file_exists($download_file)) {
        unlink ($download_file);
    }
    $aagh = url_get_contents($src);
    $fp = fopen($download_file, "x");
    if ($fp) {
        fwrite($fp, $aagh['contents']);
        fclose($fp);
        check_file($download_file, $aagh['contents']);
        $o = array();
        $c = $convert_path."identify \"".$download_file."\" 2>&1";
        // debug_print("    Command is ".$c,"GETALBUMCOVER");
        $r = exec( $c, $o);
        debug_print("    Return value from identify was ".$r,"GETALBUMCOVER");
        if ($r == '' ||
            preg_match('/GIF 1x1/', $r) ||
            preg_match('/unable to open/', $r) ||
            preg_match('/no decode delegate/', $r)) {
            debug_print("      Broken/Invalid file returned","GETALBUMCOVER");
            $error = 1;
        }
    } else {
        debug_print("    File open failed!","GETALBUMCOVER");
        $error = 1;
    }
    return $download_file;
}

function saveImage($fname) {
    debug_print("  Saving Image","GETALBUMCOVER");
    global $convert_path;
    global $download_file;
    $main_file = "albumart/original/".$fname.".jpg";
    $small_file = "albumart/small/".$fname.".jpg";
    $anglofile = "albumart/asdownloaded/".$fname.".jpg";
    if (file_exists($main_file)) {
        unlink($main_file);
    }
    if (file_exists($small_file)) {
        unlink($small_file);
    }
    if (file_exists($anglofile)) {
        unlink($anglofile);
    }
    // Ohhhhhh imagemagick is just... wow.
    // This resizes the images into a square box while adding padding to preserve the apsect ratio
    $o = array();
    $r = exec( $convert_path."convert \"".$download_file."\" -resize 82x82 -background none -gravity center -extent 82x82 \"".$main_file."\" 2>&1", $o);
    $r = exec( $convert_path."convert \"".$download_file."\" -resize 32x32 -background none -gravity center -extent 32x32 \"".$small_file."\" 2>&1", $o);
    if (is_dir("albumart/asdownloaded")) {
        $r = exec( $convert_path."convert \"".$download_file."\" \"".$anglofile."\" 2>&1", $o);
    }
}

function archiveImage($fname, $src) {
    debug_print("  Archving Image ".$fname,"GETALBUMCOVER");
    global $download_file;
    global $convert_path;
    $download_file = download_file($src, $fname, $convert_path);
    saveImage($fname);
}

function check_file($file, $data) {
    // NOTE. WE've configured curl to follow redirects, so in truth this code should never do anything
    $matches = array();
    if (preg_match('/See: (.*)/', $data, $matches)) {
        debug_print("    Check_file has found a silly musicbrainz diversion ".$data,"GETALBUMCOVER");
        $new_url = $matches[1];
        system('rm "'.$file.'"');
        $aagh = url_get_contents($new_url);
        debug_print("    check_file is getting ".$new_url,"GETALBUMCOVER");
        $fp = fopen($file, "x");
        if ($fp) {
            fwrite($fp, $aagh['contents']);
            fclose($fp);
        }
    // } else {
    //     $o = array();
    //     $r = exec("file \"".$file."\" 2>&1", $o);
    //     if (preg_match('/HTML/', $r)) {
    //         debug_print("  check_file thinks it has found a diversion");
    //         if (preg_match('/<a href="(.*?)"/', $data, $matches)) {
    //             $new_url = $matches[1];
    //             system('rm "'.$file.'"');
    //             $aagh = url_get_contents($new_url);
    //             debug_print("    check_file is getting ".$new_url);
    //             $fp = fopen($file, "x");
    //             if ($fp) {
    //                 fwrite($fp, $aagh['contents']);
    //                 fclose($fp);
    //             }
    //         }
    //     }
    }
}

function update_cache($fname, $notfound, $cachefile, $imagefile) {

    if (file_exists($cachefile)) {
        // Get an exclusive lock on the file. We can't have two threads trying to update it at once.
        // That would be bad.
        $fp = fopen($cachefile, 'r+');
        if ($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {

                $x = simplexml_load_file($cachefile);
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

function tryLocal() {
    global $albumpath;
    global $covernames;
    global $album;
    global $artist;
    global $fname;
    if ($albumpath == "" || $albumpath == ".") {
        return "";
    }
    $files = scan_for_images($albumpath);
    foreach ($files as $i => $file) {
        $info = pathinfo($file);
        $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
        if ($file_name == $fname) {
            debug_print("    Returning archived image","GETALBUMCOVER");
            return $file;
        }
    }
    foreach ($files as $i => $file) {
        $info = pathinfo($file);
        $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
        if ($file_name == strtolower($artist." - ".$album) ||
            $file_name == strtolower($album)) {
            debug_print("    Returning file matching album name","GETALBUMCOVER");
            return $file;
        }
    }
    foreach ($covernames as $j => $name) {
        foreach ($files as $i => $file) {
            $info = pathinfo($file);
            $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
            if ($file_name == $name) {
                debug_print("    Returning ".$file,"GETALBUMCOVER");
                return $file;
            }
        }
    }
    // If we haven't found one but there's only one, then return that
    if (count($files) == 1) {
        debug_print("    Returning ".$files[0],"GETALBUMCOVER");
        return $files[0];
    }
    return "";
}

function trySpotify() {
    global $spotilink;
    global $delaytime;
    if ($spotilink == "") {
        return "";
    }
    $image = "";
    debug_print("  Trying Spotify for ".$spotilink,"GETALBUMCOVER");
    // php strict prevents me from doing end(explode()) because
    // only variables can be passed by reference. Stupid php.
    $spaffy = explode(":", $spotilink);
    $spiffy = end($spaffy);
    $url = "http://open.spotify.com/album/".$spiffy;
    debug_print("      Getting ".$url,"GETALBUMCOVER");
    $content = url_get_contents($url);
    $DOM = new DOMDocument;
    // stop libmxl from spaffing error reports into the log
    libxml_use_internal_errors(true);
    $DOM->loadHTML($content['contents']);
    $stuff = $DOM->getElementById('big-cover');
    if ($stuff) {
        $image = $stuff->getAttribute('src');
        if ($image) {
            debug_print("    Returning result from Spotify : ".$image,"GETALBUMCOVER");
        } else {
            debug_print("    No valid image link found","GETALBUMCOVER");
            $image = "";
        }
    } else {
        debug_print("    No Spotify Image Found","GETALBUMCOVER");
    }
    $delaytime = 500;
    return $image;
}

function tryLastFM() {

    global $artist;
    global $album;
    global $mbid;
    global $delaytime;
    $retval = "";
    $pic = "";

    $al = munge_album_name($album);

    debug_print("  Trying last.FM for ".$artist." ".$al,"GETALBUMCOVER");
    $xml = loadXML("http://ws.audioscrobbler.com", "/2.0/?method=album.getinfo&api_key=15f7532dff0b8d84635c757f9f18aaa3&album=".rawurlencode($al)."&artist=".rawurlencode($artist)."&autocorrect=1");
    if ($xml === false) {
        debug_print("    Received error response from Last.FM","GETALBUMCOVER");
        return "";
    } else {
        foreach ($xml->album->image as $i => $image) {
            $attrs = $image->attributes();
            $pic = $image;
            if ($attrs['size'] == "large") {
                $retval = $image;
            }
        }
        if ($retval == "") {
            $retval = $pic;
        }
        if ($mbid == "") {
            $mbid = $xml->album->mbid;
            debug_print("      Last.FM gave us the MBID of ".$mbid,"GETALBUMCOVER");
        }
    }
    if ($retval != "") {
        debug_print("    Last.FM gave us ".$retval,"GETALBUMCOVER");
    } else {
        debug_print("    No cover found on Last.FM","GETALBUMCOVER");
    }
    $delaytime = 1000;

    return $retval;

}

function tryMusicBrainz() {
    global $mbid;
    global $delaytime;
    global $discogsid;
    global $compilation;
    $delaytime = 600;
    if ($mbid == "") {
        return "";
    }
    $retval = "";
    $groupid = null;
    // Let's get some information from musicbrainz about this album
    debug_print("  Getting MusicBrainz release info for ".$mbid,"GETALBUMCOVER");
    $release_info = url_get_contents('http://musicbrainz.org/ws/2/release/'.$mbid.'?inc=release-groups');
    if ($release_info['status'] != "200") {
        debug_print("    Error response from musicbrainz","GETALBUMCOVER");
        return "";
    }
    $x = simplexml_load_string($release_info['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($x->{'release'}->{'cover-art-archive'}->{'artwork'} == "true" &&
        $x->{'release'}->{'cover-art-archive'}->{'front'} == "true") {
        debug_print("    Musicbrainz has artwork for this release", "GETALBUMCOVER");
        $retval = "http://coverartarchive.org/release/".$mbid."/front";
    }

    foreach($x->{'release'}->{'release-group'} as $j) {
        if ($j->attributes()->{'id'}) {
            debug_print("    Release Group ID is ".(string)$j->attributes()->{'id'}, "GETALBUMCOVER");
            $groupid = (string)$j->attributes()->{'id'};
            break;
        }
    }

    if ($groupid !== null && $discogsid == "") {
        $group_info = url_get_contents("http://musicbrainz.org/ws/2/release-group/".$groupid."?inc=releases+release-group-rels+release-rels+url-rels");
        $x = simplexml_load_string($group_info['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);
        foreach($x->{'release-group'}->{'relation-list'} as $j) {
            if ((string)$j->attributes()->{'target-type'} == "url") {
                foreach($j->{'relation'} as $k) {
                    if ((string)$k->attributes()->{'type'} == "discogs") {
                        $dp = $k->{'target'};
                        $discogsid = basename(dirname($dp))."/".basename($dp);
                        debug_print("    Discogs ID is ".$discogsid,"GETALBUMCOVER");
                    }
                }
            }
        }
        debug_print("     Primary Type is ".$x->{'release-group'}->{'primary-type'},"DEBUGGING");
        if (property_exists($x->{'release-group'}, 'secondary-type-list')) {
            foreach($x->{'release-group'}->{'secondary-type-list'}->{'secondary-type'} as $j) {
                debug_print("        Secondary Type is ".$j,"DEBUGGING");
                if ($j == "Compilation") {
                    debug_print("      Flagging this album as a compilation","GETALBUMCOVER");
                    $compilation = true;
                }
            }
        }

    }

    return $retval;

}

function tryDiscogsId() {

    global $discogsid;
    global $delaytime;
    $retval = "";

    $delaytime = 1000;
    if ($discogsid != "") {
        $retval = getDiscogsCover($discogsid);
    }
    $discogsid = "";
    return $retval;

}

function tryDiscogs() {

    global $artist;
    global $album;
    global $discogsid;
    global $delaytime;
    $delaytime = 1000;

    // We search several times, each time spreading the search a little wider

    // Firstly - try discogs with a sanitised artist and album name
    $a = discogify_artist($artist);
    $al = munge_album_name($album);
    $result = searchDiscogs($a, $al);
    if ($result != "") {
        return $result;
    }

    // Now, try munging the album name a little more
    $al2 = really_munge_album_name($al);
    if ($al2 != $al && !preg_match('/^\s*$/', $al2)) {
        sleep(1);
        $retval = searchDiscogs($a, $al2);
        if ($retval != "") {
            return $retval;
        }
    }

    // Artist name with nickname
    $modded = preg_replace('#(\'|"|“|”).*?(\'|"|“|”) #', '', $a);
    if ($modded != $a && !preg_match('/^\s*$/', $al2)) {
        sleep(1);
        $retval = searchDiscogs($modded, $al2);
        if ($retval != "") {
            return $retval;
        }
    }

    // Try splitting the album name at a :, if there is one
    $a_mod2 = preg_match('#(.*?)\:.*#', $al2, $b);
    if (is_array($b) && count($b) > 1 && !preg_match('/^\s*\:*\s*$/', $b[1])) {
        sleep(1);
        $retval = searchDiscogs($a, $b[1]);
        if ($retval != "") {
            return $retval;
        } else if ($modded != $a) {
            sleep(1);
            $retval = searchDiscogs($modded, $b[1]);
            if ($retval != "") {
                return $retval;
            }
        }
    } else {
        $a_mod2 = preg_match('#(.*?) (-|–) .*#', $al2, $b);
        if (is_array($b) && count($b) > 1 && !preg_match('/^\s*(-|–)*\s*$/', $b[1])) {
            sleep(1);
            $retval = searchDiscogs($a, $b[1]);
            if ($retval != "") {
                return $retval;
            } else if ($modded != $a) {
                sleep(1);
                $retval = searchDiscogs($modded, $b[1]);
                if ($retval != "") {
                    return $retval;
                }
            }
        }
    }

    // Now, take the munged album name and remove all puncutation
    $al3 = remove_punctuation($al2);
    if ($al3 != $al2 && !preg_match('/^\s*$/', $al3)) {
        sleep(1);
        $retval = searchDiscogs($a, $al3);
        if ($retval != "") {
            return $retval;
        }
    }

    // Search for artist without leading 'The'
    $anothe = noDefiniteArticles($a);
    if ($anothe != $a && !preg_match('/^\s*$/', $al3)) {
        sleep(1);
        $retval = searchDiscogs($anothe, $al3);
        if ($retval != "") {
            return $retval;
        }
    }

    // Split the artist on '&', 'and', or 'with' boundaries and try each one in turn.
    if (preg_match('/ \& | and | with | feat\.* | featuring | \/ | meets | vs\.* /i', $a) && !preg_match('/^\s*$/', $al3)) {
        $arr = preg_split('/ \& | and | with | feat\.* | featuring | \/ | meets | vs\.* /i', $a);
        foreach($arr as $arrtist) {
            sleep(1);
            $retval = searchDiscogs($arrtist, $al3);
            if ($retval != "") {
                return $retval;
            }
        }
    }

    // Remove some special bits
    $al35 = remove_some_stuff($al3);
    if ($al35 != $al3 && !preg_match('/^\s*$/', $al35)) {
        sleep(1);
        $retval = searchDiscogs($a, $al35);
        if ($retval != "") {
            return $retval;
        }
    }

    // If the album name contains the artist name, remove artist name from album name
    // and try again - eg Motorhead - The Very Best of Motorhead
    if (preg_match('#'.$artist.'#', $al3)) {
        $al4 = preg_replace('#^'.$artist.' #', '', $al3);
        $al4 = preg_replace('#\s+$#', '', $al4);
        if (!preg_match('/^\s*$/', $al4)) {
            sleep(1);
            $retval = searchDiscogs($a, $al4);
        }
    }

    return "";

}

function searchDiscogs($a, $al) {
    debug_print("  Trying Discogs for ".$a." - ".$al,"GETALBUMCOVER");

    $t = url_get_contents("http://api.discogs.com/database/search?type=release&artist=".rawurlencode($a)."&release_title=".rawurlencode($al));
    if ($t['status'] != "200") {
        debug_print("    Received error response from Discogs","GETALBUMCOVER");
    } else {

        // debug_print(print_r($t['contents'],true));

        $j = json_decode($t['contents']);

        $results_by_relevance = array();
        // Generate a relevance score for each result
        foreach($j->results as $result) {
            debug_print("    Found ".$result->{'title'}." ".$result->{'country'}, "GETALBUMCOVER");

            // This matches eg  Artist - Album or
            //                  Artist (2) = Album
            // These are the most relevant. The final score depends on the country
            $regexp = '^'.$a.' (\(\d+\) )*- '.$al;
            // debug_print("        Comparing ".$regexp." with ".$result->{'title'},"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', sanitsizeDiscogsResult($result->{'title'}))) {
                $score = calculate_relevance($result, 0);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            // Try without any reference to 'The' in either the result or the search term
            $a_mod = noDefiniteArticles($a);
            $al_mod = noDefiniteArticles($al);
            $regexp = '^'.$a_mod.' (\(\d+\) )*- '.$al_mod;
            $tit = noDefiniteArticles(sanitsizeDiscogsResult($result->{'title'}));
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 0);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            // Now try with no punctuation
            $a_mod = remove_punctuation($a_mod);
            $al_mod = remove_punctuation($al_mod);
            $regexp = '^'.$a_mod.' (\(\d+\) )*'.$al_mod;
            $tit = noDefiniteArticles($result->{'title'});
            $tit = remove_punctuation($tit);
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 0);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            // Convert all eccented characters to ASCII equivalents
            $a_mod = normalizeChars($a_mod);
            $al_mod = normalizeChars($al_mod);
            $regexp = '^'.$a_mod.' (\(\d+\) )*'.$al_mod;
            $tit = normalizeChars($tit);
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 0);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            // Now *carefully* try something much wider.
            $regexp = '^'.$a_mod.' (\(\d+\) )*.*'.$al_mod.'.*';
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 100);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            // Now *carefully* try something much wider.
            $regexp = $a_mod.'.*(\(\d+\) )*.*'.$al_mod.'.*';
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 150);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

            $a_mod = deJazzify($a_mod);
            $tit = deJazzify($tit);
            $regexp = '^'.$a_mod.' (\(\d+\) )*'.$al_mod;
            // debug_print("        Comparing ".$regexp." with ".$tit,"GETALBUMCOVER");
            if (preg_match('#'.$regexp.'$#ui', $tit)) {
                $score = calculate_relevance($result, 20);
                if ($score !== null) {
                    while (array_key_exists($score, $results_by_relevance)) {
                        $score+=1;
                    }
                    $results_by_relevance[$score] = $result->{'id'};
                }
                continue;
            }

        }

        ksort($results_by_relevance, SORT_NUMERIC);
        // debug_print("Results By Relevance:".print_r($results_by_relevance, true),"GETALBUMCOVER");
        foreach($results_by_relevance as $result) {
            // Throttle requests to discogs or they'll ban us
            sleep(1);
            $p = getDiscogsCover('release/'.$result);
            if ($p != "") {
                return $p;
            }
        }

    }
    return "";
}

function calculate_relevance($result, $base_score) {

    global $preferred_countries;
    global $preferred_formats;
    global $album;
    global $compilation;
    $format = "";
    $s = count($preferred_countries) * 5;
    if (property_exists($result, 'country')) {
        $c = $result->{'country'};
        foreach($preferred_countries as $i => $cy) {
            if ($result->{'country'} == $cy) {
                $s = $i*5;
                break;
            }
        }
    }
    if (property_exists($result, 'format')) {
        if (in_array('7"', $result->{'format'}) ||
            in_array('45 RPM', $result->{'format'}) ||
            in_array('VHS', $result->{'format'}) ||
            in_array('Maxi-Single', $result->{'format'}) ||
            in_array('Single', $result->{'format'})) {
            $s = null;
            debug_print("          Score for ".$result->{'id'}." ".$result->{'title'}." in country ".$result->{'country'}." is null (irrelevant format)","GETALBUMCOVER");
            return $s;
        }

        $pf = count($preferred_formats) * 10;
        foreach ($preferred_formats as $i => $f) {
            if (in_array($f, $result->{'format'})) {
                $format = $f;
                $pf = $i*10;
                break;
            }
        }
        if (preg_match('/EP$|\(EP\)$/', $album) && (in_array("EP", $result->{'format'}) || in_array('12"', $result->{'format'}))) {
            debug_print('            Boosting rating due to EP/12"', "GETALBUMCOVER");
            $pf = $pf/2;
        } else {
            if (in_array("EP", $result->{'format'})) {
                debug_print('            Marking down as format is EP', "GETALBUMCOVER");
                $pf += 100;
            }
            if (in_array('12"', $result->{'format'})) {
                debug_print('            Marking down as format is 12"', "GETALBUMCOVER");
                $pf += 150;
            }
            if (in_array("Limited Edition", $result->{'format'}) && !preg_match('/limited edition/i', $album)) {
                debug_print('            Marking down as format is Limited Edition', "GETALBUMCOVER");
                $pf += 100;
            }
            if (in_array("Club Edition", $result->{'format'}) && !preg_match('/club edition/i', $album)) {
                debug_print('            Marking down as format is Club Edition', "GETALBUMCOVER");
                $pf += 100;
            }
            if (in_array("Compilation", $result->{'format'})) {
                if ($compilation) {
                    debug_print('            Boosting rating as this is a compilation', "GETALBUMCOVER");
                    $pf = $pf/2;
                } else {
                    debug_print('            Marking down as this is a compilation', "GETALBUMCOVER");
                    $pf += 200;
                }
            }
            if (in_array("Promo", $result->{'format'})) {
                debug_print('            Marking down as format is Promo', "GETALBUMCOVER");
                $pf += 200;
            }
            if (in_array("Sampler", $result->{'format'})) {
                debug_print('            Marking down as format is Sampler', "GETALBUMCOVER");
                $pf += 200;
            }
            if (in_array("Partially Unofficial", $result->{'format'})) {
                debug_print('            Marking down as format is Partially Unofficial', "GETALBUMCOVER");
                $pf += 200;
            }
            if (in_array("Unofficial Release", $result->{'format'})) {
                debug_print('            Marking down as format is Unofficial Release', "GETALBUMCOVER");
                $pf += 200;
            }
        }
    }

    $score = $s + $pf+ $base_score;
    debug_print("          Score for ".$result->{'id'}." ".$result->{'title'}." in country ".$result->{'country'}." format ".$format." is ".$score,"GETALBUMCOVER");
    return $score;

}

function discogify_artist($artist) {
    $artist = preg_replace('/Various Artists/', 'Various', $artist);
    return $artist;
}

function getDiscogsCover($discogsid) {
    $retval = "";
    debug_print("  Trying Discogs for ".$discogsid,"GETALBUMCOVER");
    $t = url_get_contents("http://api.discogs.com/".$discogsid);
    if ($t['status'] != "200") {
        debug_print("    Received error response from Discogs","GETALBUMCOVER");
    } else {
        // debug_print(print_r($t['contents'],true));
        $j = json_decode($t['contents']);
        $imgs = array();
        $key = null;
        if (property_exists($j->{'resp'}, 'release')) {
            $key = $j->{'resp'}->{'release'};
        } else if (property_exists($j->{'resp'}, 'master')) {
            $key = $j->{'resp'}->{'master'};
        } else {
            return "";
        }
        if (property_exists($key, 'images')) {
            foreach($key->{'images'} as $image) {
                debug_print("    Type:".$image->{'type'}." : ".$image->{'uri'}, "GETALBUMCOVER");
                if (!array_key_exists($image->{'type'}, $imgs)) {
                    $imgs[$image->{'type'}] = $image->{'uri'};
                }
            }
            if (array_key_exists('primary', $imgs)) {
                return $imgs['primary'];
            } else if (array_key_exists('secondary', $imgs)) {
                return $imgs['secondary'];
            } else if (array_key_exists('thumb', $imgs)) {
                return $imgs['thumb'];
            }
        }
    }
    return $retval;

}

function loadXML($domain, $path) {

    $t = url_get_contents($domain.$path);

    if ($t['status'] == "200") {
        return simplexml_load_string($t['contents']);
    }

    return false;

}

function tryRemoteCache() {
    global $fname;
    global $delaytime;
    global $download_file;
    global $convert_path;
    global $error;
    global $spotilink;
    $timestamp = time();
    debug_print("  Checking Remote Image Cache","GETALBUMCOVER");
    if (file_exists('prefs/remoteImageCache.xml')) {
        $x = simplexml_load_file('prefs/remoteImageCache.xml');
        $xp = $x->xpath("images/image[@id='".$fname."']");
        if ($xp) {
            debug_print("    Found Cached Remote Image","GETALBUMCOVER");
            if ($timestamp - $xp[0]->stamp < 600) {
                debug_print("      Archiving Frequently-accessed remote image","GETALBUMCOVER");
                $download_file = download_file($xp[0]->src, $fname, $convert_path);
                if ($error == 0) {
                    saveImage($fname);
                    $delaytime = 50;
                    return "albumart/original/".$fname.".jpg";
                }
            } else {
                $delaytime = 50;
                return $xp[0]->src;
            }
        }
    }
    return "";

}

function updateRemoteCache($fname, $src) {

    // Fuck me. SimpleXML sucks massive ass. With chocolate sauce.

    $timestamp = time();
    $x = null;
    if (file_exists('prefs/remoteImageCache.xml')) {
        $x = simplexml_load_file('prefs/remoteImageCache.xml');
        $xp = $x->xpath("images/image[@id='".$fname."']");
        if ($xp) {
            debug_print("  Remote Cache - Updating Timestamp","GETALBUMCOVER");
            $xp[0]->stamp = $timestamp;
        } else {
            debug_print("  Adding New Remote Image to Cache","GETALBUMCOVER");
            $e = $x->images->addChild('image');
            $e->addAttribute('id', $fname);
            $e->addChild('src', $src);
            $e->addChild('stamp', $timestamp);
        }
    } else {
        debug_print("  Creating Remote Image Cache","GETALBUMCOVER");
        $x = new SimpleXMLElement('<imageCache></imageCache>');
        $e = $x->addChild('images');
        $f = $e->addChild('image');
        $f->addAttribute('id', $fname);
        $f->addChild('src', $src);
        $f->addChild('stamp', $timestamp);
    }
    $fp = fopen('prefs/remoteImageCache.xml', 'w');
    fwrite($fp, $x->asXML());
    fclose($fp);
}

function save_base64_data($data, $fname) {
    global $error;
    global $convert_path;
    debug_print("  Saving base64 data","GETALBUMCOVER");
    $image = explode('base64,',$data);
    $download_file = "albumart/".$fname;
    file_put_contents($download_file, base64_decode($image[1]));

        $o = array();
        $c = $convert_path."identify \"".$download_file."\" 2>&1";
        // debug_print("    Command is ".$c,"GETALBUMCOVER");
        $r = exec( $c, $o);
        debug_print("    Return value from identify was ".$r,"GETALBUMCOVER");

    $error = 0;
    return $download_file;
}

?>
