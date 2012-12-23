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
$searchfunctions = array( 'tryLastFM', 'tryMusicBrainz');

$fname = $_REQUEST['key'];
if (array_key_exists("src", $_REQUEST)) {
    $src = $_REQUEST['src'];
    error_log("Get Album Cover from ".$src);
}
if (array_key_exists("stream", $_REQUEST)) {
    $stream = $_REQUEST['stream'];
    error_log("Stream is ".$stream);
}
if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
    error_log("Uploading User File ".$file);
}
if (array_key_exists("artist", $_REQUEST)) {
    $artist = $_REQUEST['artist'];
    error_log("Artist : ".$artist);
}
if (array_key_exists("album", $_REQUEST)) {
    $album = $_REQUEST['album'];
    error_log("Album : ".$album);
}
if (array_key_exists("mbid", $_REQUEST)) {
    $mbid = $_REQUEST['mbid'];
    error_log("MBID : ".$mbid);
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
        error_log("No valid files found");
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
    $class = "updateable";
    if ($error == 1) {
        $class = "updateable notfound";
    }
    error_log("Classing ".$fname." as ".$class);
    update_cache($fname, $class);
}

if ($error == 0) {
    if ($stream != "") {
        if (file_exists($stream)) {
            error_log("Updating stream playlist ".$stream);
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
    //print "<HTML><body></body></html>";
    header('HTTP/1.1 204 No Content');
    ob_flush();
} else {
    // Didn't get a valid image, so return a server error to prevent the javascript
    // from trying to modify things - don't use 404 because we have a redirect in place
    // for 404 errors and that wouldn't be good.
    header('HTTP/1.1 400 Bad Request');
    ob_flush();
}


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
    error_log("Uploading ".$src." ".$fname." ".$tmpname);
    $download_file = "prefs/".$fname;
    if (move_uploaded_file($tmpname, $download_file)) {
        error_log("File ".$src." is valid, and was successfully uploaded.");
    } else {
        error_log("Possible file upload attack!");
        $error = 1;
    }
    return $download_file;
}

function download_file($src, $fname, $convert_path) {
    global $error;

    $download_file = "albumart/".$fname;
    error_log("Getting Album Art: ".$src." ".$fname." ".$download_file);

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
        error_log("Return value from identify was ".$r);
        if ($r == '' || 
            preg_match('/GIF 1x1/', $r) ||
            preg_match('/unable to open/', $r) ||
            preg_match('/no decode delegate/', $r)) {
            error_log("Broken/Invalid file returned");
            $error = 1;
        }
    } else {
        error_log("File open failed!");
        $error = 1;
    }
    return $download_file;
}


function check_file($file, $data) {
    // NOTE. WE've configured curl to follow redirects, so in truth this code should never do anything
    $matches = array();
    if (preg_match('/See: (.*)/', $data, $matches)) {
        error_log("check_file has found an silly musicbrainz diversion ".$data);
        $new_url = $matches[1];
        system('rm "'.$file.'"');
        $aagh = url_get_contents($new_url);
        error_log("check_file is getting ".$new_url);
        $fp = fopen($file, "x");
        if ($fp) {
            fwrite($fp, $aagh['contents']);
            fclose($fp);
        }
    } else {
        $o = array();
        $r = exec("file \"".$file."\" 2>&1", $o);
        if (preg_match('/HTML/', $r)) {
            error_log("check_file thinks it has found a diversion");
            if (preg_match('/<a href="(.*?)"/', $data, $matches)) {
                $new_url = $matches[1];
                system('rm "'.$file.'"');
                $aagh = url_get_contents($new_url);
                error_log("check_file is getting ".$new_url);
                $fp = fopen($file, "x");
                if ($fp) {
                    fwrite($fp, $aagh['contents']);
                    fclose($fp);
                }
            }
        }
    }
}

function update_cache($fname, $class) {

    global $ALBUMSLIST;

    if (file_exists($ALBUMSLIST)) {
        $fp = fopen($ALBUMSLIST, 'r+');
        if ($fp) {
            $crap = true;
            // Get an exclusive lock on the file. We can't have two threads trying to update it at once.
            // That would be bad.
            if (flock($fp, LOCK_EX, $crap)) {
                $cache = file_get_contents($ALBUMSLIST);
                $newcache = preg_replace('/\<img class=\"smallcover fixed updateable.*?(name=\"'.$fname.'\".*?) src=.*?\>/', '<img class="smallcover fixed '.$class.'" $1 src="">', $cache);
                if ($newcache != null) {
                    ftruncate($fp, 0);
                    fwrite($fp, $newcache);
                    fflush($fp);
                    flock($fp, LOCK_UN);
                } else {
                    error_log("PHP regular expressions are rubbish");
                }
            } else {
                error_log("FAILED TO GET FILE LOCK!!!!!!!!!!!!!!!!!!!!!");
            }
        }
        fclose($fp);
    }
}

function tryLastFM() {

    global $artist;
    global $album;
    global $mbid;
    $retval = "";
    $pic = "";
    
    error_log("Trying last.FM for ".$artist." ".$album);
    $xml = loadXML("http://ws.audioscrobbler.com", "/2.0/?method=album.getinfo&api_key=15f7532dff0b8d84635c757f9f18aaa3&album=".rawurlencode($album)."&artist=".rawurlencode($artist)."&autocorrect=1");
    if ($xml == false) {
        error_log("Received error response from Last.FM");
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
            error_log("    Last.FM gave us the MBID of ".$mbid);
        }
    }
    error_log("Last.FM gave us ".$retval);
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
