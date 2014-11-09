<?php
ob_start();
include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
debug_print("------- Searching For Album Art --------","GETALBUMCOVER");
include ("backends/".$prefs['apache_backend']."/backend.php");

// Discogs functionality removed in version 0.50 after discogs strated requiring
// authentication for images

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
$big_file = "";
$base64data = "";
$delaytime = 1;
$fp = null;
$in_collection = false;
$found = false;

$fname = $_REQUEST['key'];
if (array_Key_exists('stream', $_REQUEST)) {
    // 'Stream' is used when we're updating the image for
    // a favourite radio station.
    $stream = $_REQUEST["stream"];
}

$findalbum = array("get_imagesearch_info", "check_stream", "check_search", "check_playlist");

if (array_key_exists("src", $_REQUEST)) {
    $src = $_REQUEST['src'];
} else if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
} else if (array_key_exists("base64data", $_REQUEST)) {
    $base64data = $_REQUEST['base64data'];
} else {
    while ($found == false && count($findalbum) > 0) {
        $fn = array_shift($findalbum);
        list($in_collection, $artist, $album, $mbid, $albumpath, $spotilink, $found) = $fn($fname);
    }
    if (!$found) {
        debug_print("Image key could not be found!","GETALBUMCOVER");
        header("HTTP/1.1 404 Not Found");
        ob_flush();
        exit(0);
    }
}

if (preg_match('/\d+/', $mbid) && !preg_match('/-/', $mbid)) {
    debug_print(" Supplied MBID of ".$mbid." looks more like a Discogs ID","GETALBUMCOVER");
    $mbid = "";
}


if ($mbid != "") {
    $searchfunctions = array( 'tryLocal', 'trySpotify', 'tryMusicBrainz', 'tryLastFM' );
} else {
    $searchfunctions = array( 'tryLocal', 'trySpotify', 'tryLastFM', 'tryMusicBrainz' );
}

debug_print("  KEY     : ".$fname,"GETALBUMCOVER");
debug_print("  SOURCE  : ".$src,"GETALBUMCOVER");
debug_print("  UPLOAD  : ".$file,"GETALBUMCOVER");
debug_print("  STREAM  : ".$stream,"GETALBUMCOVER");
debug_print("  ARTIST  : ".$artist,"GETALBUMCOVER");
debug_print("  ALBUM   : ".$album,"GETALBUMCOVER");
debug_print("  MBID    : ".$mbid,"GETALBUMCOVER");
debug_print("  PATH    : ".$albumpath,"GETALBUMCOVER");
debug_print("  SPOTIFY : ".$spotilink,"GETALBUMCOVER");

// Attempt to download an image file

$convert_path = find_executable("convert");

$download_file = "";
if ($file != "") {
    $in_collection = ($stream == "") ? true : false;
    $download_file = get_user_file($file, $fname, $_FILES['ufile']['tmp_name']);
} elseif ($src != "") {
    $in_collection = ($stream == "") ? true : false;
    $download_file = download_file($src, $fname, $convert_path);
} elseif ($base64data != "") {
    $in_collection = ($stream == "") ? true : false;
    $download_file = save_base64_data($base64data, $fname);
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
        debug_print("  No art was found. Try the Tate Modern","GETALBUMCOVER");
    }
}

if ($error == 0) {
    list ($small_file, $main_file, $big_file) = saveImage($fname, $in_collection, $stream);
}

// Now that we've attempted to retrieve an image, even if it failed,
// we need to edit the cached albums list so it doesn't get searched again
// and edit the URL so it points to the correct image if one was found
if ($in_collection) {
    // We only put small_file in the image db. The rest can be calculated from that.
    update_image_db($fname, $error, $small_file);
} else if ($error == 0 && $stream != "") {
    update_stream_image($stream, $main_file);
}

header('Content-Type: text/xml; charset=utf-8');
print  '<?xml version="1.0" encoding="utf-8"?>'."\n".
        '<imageresults version="1">'."\n".
        '<imageList>';
print xmlnode('url', $main_file);
print xmlnode('origurl', $big_file);
print xmlnode('delaytime', $delaytime);
print "</imageList>\n</imageresults>\n";

if ($download_file != "" && file_exists($download_file)) {
    unlink($download_file);
}

debug_print("--------------------------------------------","GETALBUMCOVER");

ob_flush();

function check_stream($fname) {
    global $stream;
    $retval = array(false, null, null, null, null, null, false);
    if ($stream != "") {
        if (file_exists($stream)) {
            $ax = simplexml_load_file($stream);
            $retval[1] = "Internet Radio";
            $retval[2] = $ax->trackList->track[0]->album;
            $retval[6] = true;
            debug_print("Found stream file ".$stream,"GETALBUMCOVER");
        } else {
            debug_print(" Supplied stream file not found!","GETALBUMCOVER");
        }
    }
    return $retval;
}

function check_search($fname) {
    global $ALBUMSEARCH;
    $axp = array();
    $fp = null;
    $retval = array(false, null, null, null, null, null, false);

    if (file_exists($ALBUMSEARCH)) {
        if (get_file_lock($ALBUMSEARCH, $fp)) {
            $ax = simplexml_load_file($ALBUMSEARCH);
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
        $retval[6] = true;
    }
    return $retval;

}

function check_playlist($fname) {
    global $PLAYLISTFILE;
    $fp = null;
    $retval = array(false, null, null, null, null, null, false);
    if (file_exists($PLAYLISTFILE)) {
        if (get_file_lock($PLAYLISTFILE, $fp)) {
            $ax = json_decode(file_get_contents($PLAYLISTFILE), true);
            foreach ($ax as $track) {
                if ($track['key'] == $fname) {
                    $retval[1] = $track['albumartist'];
                    $retval[2] = $track['album'];
                    $retval[3] = $track['musicbrainz']['albumid'];
                    $retval[4] = rawurldecode($track['dir']);
                    $retval[5] = rawurldecode($track['spotify']['album']);
                    $retval[6] = true;
                    debug_print("Found album in playlist","DEBUGGING");
                    break;
                }
            }
        }
        release_file_lock($fp);
    }
    return $retval;
}

function get_user_file($src, $fname, $tmpname) {
    global $error;
    debug_print("  Uploading ".$src." ".$fname." ".$tmpname,"GETALBUMCOVER");
    $download_file = "prefs/".$fname;
    if (move_uploaded_file($tmpname, $download_file)) {
        debug_print("    File ".$src." is valid, and was successfully uploaded.","GETALBUMCOVER");
    } else {
        debug_print("    Possible file upload attack!","GETALBUMCOVER");
        header('HTTP/1.0 403 Forbidden');
        ob_flush();
        exit(0);
    }
    return $download_file;
}

function tryLocal() {
    global $albumpath;
    global $covernames;
    global $album;
    global $artist;
    global $fname;
    if ($albumpath == "" || $albumpath == "." || $albumpath === null) {
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
    if ($spotilink == "" || substr($spotilink, 0, 8) != 'spotify:') {
        return "";
    }
    $image = "";
    debug_print("  Trying Spotify for ".$spotilink,"GETALBUMCOVER");

    // php strict prevents me from doing end(explode()) because
    // only variables can be passed by reference. Stupid php.
    $spaffy = explode(":", $spotilink);
    $spiffy = end($spaffy);
    $url = 'https://api.spotify.com/v1/albums/'.$spiffy;
    debug_print("      Getting ".$url,"GETALBUMCOVER");
    $content = url_get_contents($url);

    if ($content['contents'] && $content['contents'] != "") {
        $data = json_decode($content['contents']);
        if (array_key_exists(0, $data->{'images'})) {
            $image = $data->{'images'}[0]->{'url'};
            debug_print("    Returning result from Spotify : ".$image,"GETALBUMCOVER");
       } else {
            debug_print("    No Spotify Image Found","GETALBUMCOVER");

       }
    } else {
        debug_print("    Spotify API data not retrieved","GETALBUMCOVER");
    }
    $delaytime = 1000;
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
    $delaytime = 600;
    if ($mbid == "") {
        return "";
    }
    $retval = "";
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

    return $retval;

}

function loadXML($domain, $path) {

    $t = url_get_contents($domain.$path);
    if ($t['status'] == "200") {
        return simplexml_load_string($t['contents']);
    }
    return false;

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

function update_stream_image($stream, $image) {
    if (file_exists($stream)) {
        debug_print("    Updating stream playlist ".$stream,"GETALBUMCOVER");
        $x = simplexml_load_file($stream);
        foreach($x->trackList->track as $i => $track) {
            $track->image = $image;
        }
        $fp = fopen($stream, 'w');
        if ($fp) {
            fwrite($fp, $x->asXML());
        }
        fclose($fp);
    }
}

?>
