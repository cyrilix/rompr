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
$albumpath = "";
$spotilink = "";
$small_file = "";
$main_file = "";
$searchfunctions = array( 'tryLocal', 'tryRemoteCache', 'trySpotify', 'tryLastFM', 'tryMusicBrainz');
$delaytime = 1;

$fname = $_REQUEST['key'];
if (array_key_exists("src", $_REQUEST)) {
    $src = $_REQUEST['src'];
    debug_print("Get Album Cover from ".$src);
}
if (array_key_exists("stream", $_REQUEST)) {
    $stream = $_REQUEST['stream'];
    debug_print("Stream is ".$stream);
}
if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
    debug_print("Uploading User File ".$file);
}
if (array_key_exists("artist", $_REQUEST)) {
    $artist = $_REQUEST['artist'];
    debug_print("ARTIST : ".$artist);
}
if (array_key_exists("album", $_REQUEST)) {
    $album = $_REQUEST['album'];
    debug_print("ALBUM : ".$album);
}
if (array_key_exists("mbid", $_REQUEST)) {
    $mbid = $_REQUEST['mbid'];
    debug_print("MBID : ".$mbid);
}
if (array_key_exists("albumpath", $_REQUEST)) {
    $albumpath = $_REQUEST['albumpath'];
    debug_print("PATH : ".$albumpath);
}
if (array_key_exists("spotilink", $_REQUEST)) {
    $spotilink = $_REQUEST['spotilink'];
    debug_print("SPOTIFY : ".$spotilink);
}

// Attempt to download an image file

$convert_path = find_executable("convert");

$download_file = "";
if ($file != "") {
    $download_file = get_user_file($file, $fname, $_FILES['ufile']['tmp_name']);
} elseif ($src != "") {
    $download_file = download_file($src, $fname, $convert_path);
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
        debug_print("No valid files found");
    }
}

if ($error == 0 && $spotilink == "") {
    saveImage($fname);    
}

if ($download_file != "" && file_exists($download_file)) {
    unlink($download_file);
}

// Now that we've attempted to retrieve an image, even if it failed,
// we need to edit the cached albums list so it doesn't get searched again
// and edit the URL so it points to the correct image if one was found
if (file_exists($ALBUMSLIST) && $stream == "" && $spotilink == "") {
    debug_print("Classing non-spotify ".$fname." as ".$error);
    update_cache($fname, $error, $ALBUMSLIST, "albumart/small/".$fname.".jpg");
} else if (file_exists($ALBUMSEARCH) && $spotilink != "") {
    debug_print("Classing spotify ".$fname." as ".$error);
    update_cache($fname, $error, $ALBUMSEARCH, $src);
}

if ($spotilink != "") {
    updateRemoteCache($fname, $src);
}

if ($error == 0) {
    if ($stream != "") {
        if (file_exists($stream)) {
            debug_print("Updating stream playlist ".$stream);
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
    }
} else {
    print xmlnode('url', $src);
}
print xmlnode('delaytime', $delaytime);
print "</imageList>\n</imageresults>\n";

debug_print("------------------------------------");

ob_flush();

function get_user_file($src, $fname, $tmpname) {
    global $error;
    debug_print("Uploading ".$src." ".$fname." ".$tmpname);
    $download_file = "prefs/".$fname;
    if (move_uploaded_file($tmpname, $download_file)) {
        debug_print("File ".$src." is valid, and was successfully uploaded.");
    } else {
        debug_print("Possible file upload attack!");
        $error = 1;
    }
    return $download_file;
}

function download_file($src, $fname, $convert_path) {
    global $error;

    $download_file = "albumart/".$fname;
    debug_print("Getting Album Art: ".$src." ".$fname." ".$download_file);

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
        $r = exec( $convert_path."identify \"".$download_file."\" 2>&1", $o);
        debug_print("Return value from identify was ".$r);
        if ($r == '' || 
            preg_match('/GIF 1x1/', $r) ||
            preg_match('/unable to open/', $r) ||
            preg_match('/no decode delegate/', $r)) {
            debug_print("Broken/Invalid file returned");
            $error = 1;
        }
    } else {
        debug_print("File open failed!");
        $error = 1;
    }
    return $download_file;
}

function saveImage($fname) {
    debug_print("Saving Image");
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
    debug_print("Archving Image ".$fname);
    global $download_file;
    global $convert_path;
    $download_file = download_file($src, $fname, $convert_path);
    saveImage($fname);
}

function check_file($file, $data) {
    // NOTE. WE've configured curl to follow redirects, so in truth this code should never do anything
    $matches = array();
    if (preg_match('/See: (.*)/', $data, $matches)) {
        debug_print("check_file has found an silly musicbrainz diversion ".$data);
        $new_url = $matches[1];
        system('rm "'.$file.'"');
        $aagh = url_get_contents($new_url);
        debug_print("check_file is getting ".$new_url);
        $fp = fopen($file, "x");
        if ($fp) {
            fwrite($fp, $aagh['contents']);
            fclose($fp);
        }
    } else {
        $o = array();
        $r = exec("file \"".$file."\" 2>&1", $o);
        if (preg_match('/HTML/', $r)) {
            debug_print("check_file thinks it has found a diversion");
            if (preg_match('/<a href="(.*?)"/', $data, $matches)) {
                $new_url = $matches[1];
                system('rm "'.$file.'"');
                $aagh = url_get_contents($new_url);
                debug_print("check_file is getting ".$new_url);
                $fp = fopen($file, "x");
                if ($fp) {
                    fwrite($fp, $aagh['contents']);
                    fclose($fp);
                }
            }
        }
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
                debug_print("Updating cache for for ".$fname." ".$notfound);
                foreach($x->artists->artist as $i => $artist) {
                    foreach($artist->albums->album as $j => $album) {
                        if ($album->image->name == $fname) {
                            debug_print("Found it");
                            if ($notfound == 0) {
                                $album->image->src = $imagefile;
                                $album->image->exists = "yes";
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
                debug_print("FAILED TO GET FILE LOCK");
            }
        } else {
            debug_print("FAILED TO OPEN CACHE FILE!");
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
    if ($albumpath == "") {
        return "";
    }
    debug_print("SEARCHING:".strtolower($artist." - ".$album));
    $files = scan_for_images($albumpath);
    foreach ($files as $i => $file) {
        $info = pathinfo($file);
        $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
        if ($file_name == $fname) {
            debug_print("Returning archived image");
            return $file;
        }
    }
    foreach ($files as $i => $file) {
        $info = pathinfo($file);
        $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
        if ($file_name == strtolower($artist." - ".$album) ||
            $file_name == strtolower($album)) {
            debug_print("Returning file matching album name");
            return $file;
        }
    }
    foreach ($covernames as $j => $name) {
        foreach ($files as $i => $file) {
            $info = pathinfo($file);
            $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));        
            if ($file_name == $name) {
                debug_print("  Returning ".$file);
                return $file;
            }
        }
    }
    // If we haven't found one but there's only one, then return that
    if (count($files) == 1) {
        debug_print("  Returning ".$files[0]);
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
    debug_print("Trying Spotify for ".$spotilink);
    // php strict prevents me from doing end(explode()) because
    // only variables can be passed by reference. Stupid php.
    $spaffy = explode(":", $spotilink);
    $spiffy = end($spaffy);
    $url = "http://open.spotify.com/album/".$spiffy;
    debug_print("   Getting ".$url);
    $content = url_get_contents($url);
    $DOM = new DOMDocument;
    // stop libmxl from spaffing error reports into the log
    libxml_use_internal_errors(true);
    $DOM->loadHTML($content['contents']);
    $stuff = $DOM->getElementById('big-cover');
    if ($stuff) {
        $image = $stuff->getAttribute('src');
        if ($image) {
            debug_print("Returning result from Spotify : ".$image);
        } else {
            debug_print("No valid image link found");
            $image = "";
        }
    } else {
        debug_print("No Spotify Image Found");
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
    
    debug_print("Trying last.FM for ".$artist." ".$album);
    $xml = loadXML("http://ws.audioscrobbler.com", "/2.0/?method=album.getinfo&api_key=15f7532dff0b8d84635c757f9f18aaa3&album=".rawurlencode($album)."&artist=".rawurlencode($artist)."&autocorrect=1");
    if ($xml === false) {
        debug_print("Received error response from Last.FM");
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
            debug_print("    Last.FM gave us the MBID of ".$mbid);
        }
    }
    debug_print("Last.FM gave us ".$retval);
    $delaytime = 800;
    return $retval;
    
}

function tryMusicBrainz() {
    global $mbid;
    global $delaytime;
    $delaytime = 600;
    if ($mbid != "") {
        return "http://coverartarchive.org/release/".$mbid."/front";
    } else {
        return "";
    }
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
    debug_print("   Checking Remote Image Cache");
    if (file_exists('prefs/remoteImageCache.xml')) {
        $x = simplexml_load_file('prefs/remoteImageCache.xml');
        $xp = $x->xpath("images/image[@id='".$fname."']");
        if ($xp) {
            debug_print("   .. Found Cached Remote Image");
            $delaytime = 200;
            return $xp[0]->src;
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
            debug_print("Updating Timestamp");
            if ($timestamp - $xp[0]->stamp < 3600) {
                // Image is being accessed regularly. We'd better archive it
                // to avoid hammering spotify's servers;
                archiveImage($fname, $src);
            }
            $xp[0]->stamp = $timestamp;
        } else {
            debug_print("Adding New Remote Image to Cache");
            $e = $x->images->addChild('image');
            $e->addAttribute('id', $fname);
            $e->addChild('src', $src);
            $e->addChild('stamp', $timestamp);
        }
    } else {
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

?>
