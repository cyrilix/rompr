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
$searchfunctions = array( 'tryLocal', 'tryLastFM', 'tryMusicBrainz');

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
    debug_print("Artist : ".$artist);
}
if (array_key_exists("album", $_REQUEST)) {
    $album = $_REQUEST['album'];
    debug_print("Album : ".$album);
}
if (array_key_exists("mbid", $_REQUEST)) {
    $mbid = $_REQUEST['mbid'];
    debug_print("MBID : ".$mbid);
}
if (array_key_exists("albumpath", $_REQUEST)) {
    $albumpath = $_REQUEST['albumpath'];
    debug_print("PATH : ".$albumpath);
}

// Attempt to download an image file

$convert_path = find_convert_path();

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
            $download_file = download_file($src, $fname, $convert_path);
            if ($error == 1) {
                $error = 0;
                $src = "";
            }
        }
    }
    if ($src == "") {
        $error = 1;
        debug_print("No valid files found");
    }
}

if ($error == 0) {
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

if ($download_file != "" && file_exists($download_file)) {
    unlink($download_file);
}

// Now that we've attempted to retrieve an image, even if it failed,
// we need to edit the cached albums list so it doesn't get searched again
// and edit the URL so it points to the correct image if one was found
if (file_exists($ALBUMSLIST) && $stream == "") {
    debug_print("Classing ".$fname." as ".$error);
    update_cache($fname, $error);
}

if ($error == 0) {
    if ($stream != "") {
        if (file_exists($stream)) {
            debug_print("Updating stream playlist ".$stream);
            $x = simplexml_load_file($stream);
            foreach($x->trackList->track as $i => $track) {
                $track->image = $main_file;
            }
            $fp = fopen($stream, 'w');
            if ($fp) {
                fwrite($fp, $x->asXML());
            }
            fclose($fp);
        }
    }
    header('HTTP/1.1 204 No Content');
} else {
    // Didn't get a valid image, so return a server error to prevent the javascript
    // from trying to modify things - don't use 404 because we have a redirect in place
    // for 404 errors and that wouldn't be good.
    header('HTTP/1.1 400 Bad Request');
}

ob_flush();

function find_convert_path() {

    // Test to see if convert is on the path and adjust if not - this makes
    // it work on MacOSX when everything's installed from MacPorts
    $c = "";
    $a = 1;
    $o = array();
    $r = exec("convert 2>&1", $o, $a);
    if ($a == 127) {
        $c = "/opt/local/bin/";
    }
    return $c;

}

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

function update_cache($fname, $notfound) {

    global $ALBUMSLIST;

    if (file_exists($ALBUMSLIST)) {
        // Get an exclusive lock on the file. We can't have two threads trying to update it at once.
        // That would be bad.
        $fp = fopen($ALBUMSLIST, 'r+');
        if ($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {

                $x = simplexml_load_file($ALBUMSLIST);
                debug_print("Updating cache for for ".$fname." ".$notfound);
                foreach($x->artists->artist as $i => $artist) {
                    foreach($artist->albums->album as $j => $album) {
                        if ($album->image->name == $fname) {
                            debug_print("Found it");
                            // we always want to remove the romprartist and rompralbum items - this will
                            // prevent it being auto-searched again
                            // If notfound is 0 we also update the image src tage
                            unset($album->image->romprartist);
                            unset($album->image->rompralbum);
                            if ($notfound == 0) {
                                $album->image->src = "albumart/small/".$fname.".jpg";
                            }
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
    if ($albumpath == "") {
        return "";
    }
    $files = scan_for_images($albumpath);
    foreach ($covernames as $j => $name) {
        foreach ($files as $i => $file) {
            $info = pathinfo($file);
            $file_name = strtolower(basename($file,'.'.$info['extension']));
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

function tryLastFM() {

    global $artist;
    global $album;
    global $mbid;
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
    return $retval;
    
}

function tryMusicBrainz() {
    global $mbid;
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


?>
