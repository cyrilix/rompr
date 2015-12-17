<?php
ob_start();
include ("includes/vars.php");
include ("includes/functions.php");
include ("utils/imagefunctions.php");
debuglog("------- Searching For Album Art --------","GETALBUMCOVER");
include ("backends/sql/backend.php");

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
$albumuri = "";
$small_file = "";
$big_file = "";
$base64data = "";
$delaytime = 1;
$fp = null;
$in_collection = false;
$found = false;
$covernames = array("cover", "albumart", "thumb", "albumartsmall", "front");

$fname = $_REQUEST['key'];
if (array_Key_exists('stream', $_REQUEST)) {
    // 'Stream' is used when we're updating the image for
    // a favourite radio station.
    $stream = $_REQUEST["stream"];
}

$findalbum = array("get_imagesearch_info", "check_stream", "check_playlist");

if (array_key_exists("src", $_REQUEST)) {
    $src = $_REQUEST['src'];
} else if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
} else if (array_key_exists("base64data", $_REQUEST)) {
    $base64data = $_REQUEST['base64data'];
} else {
    while ($found == false && count($findalbum) > 0) {
        $fn = array_shift($findalbum);
        list($in_collection, $artist, $album, $mbid, $albumpath, $albumuri, $found) = $fn($fname);
    }
    if (!$found) {
        debuglog("Image key could not be found!","GETALBUMCOVER");
        header("HTTP/1.1 404 Not Found");
        ob_flush();
        exit(0);
    }
}

if (preg_match('/\d+/', $mbid) && !preg_match('/-/', $mbid)) {
    debuglog(" Supplied MBID of ".$mbid." looks more like a Discogs ID","GETALBUMCOVER");
    $mbid = "";
}


if ($mbid != "") {
    $searchfunctions = array( 'tryLocal', 'trySpotify', 'tryMusicBrainz', 'tryLastFM' );
} else {
    $searchfunctions = array( 'tryLocal', 'trySpotify', 'tryLastFM', 'tryMusicBrainz' );
}

debuglog("  KEY      : ".$fname,"GETALBUMCOVER");
debuglog("  SOURCE   : ".$src,"GETALBUMCOVER");
debuglog("  UPLOAD   : ".$file,"GETALBUMCOVER");
debuglog("  STREAM   : ".$stream,"GETALBUMCOVER");
debuglog("  ARTIST   : ".$artist,"GETALBUMCOVER");
debuglog("  ALBUM    : ".$album,"GETALBUMCOVER");
debuglog("  MBID     : ".$mbid,"GETALBUMCOVER");
debuglog("  PATH     : ".$albumpath,"GETALBUMCOVER");
debuglog("  ALBUMURI : ".$albumuri,"GETALBUMCOVER");

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
        debuglog("  No art was found. Try the Tate Modern","GETALBUMCOVER");
    }
}

if ($error == 0) {
    list ($small_file, $big_file) = saveImage($fname, $in_collection, $stream);
}

// Now that we've attempted to retrieve an image, even if it failed,
// we need to edit the cached albums list so it doesn't get searched again
// and edit the URL so it points to the correct image if one was found
if ($in_collection) {
    // We only put small_file in the image db. The rest can be calculated from that.
    update_image_db($fname, $error, $small_file);
} else if ($error == 0 && $stream != "") {
    update_stream_image($stream, $big_file);
}

if ($download_file != "" && file_exists($download_file)) {
    debuglog("Removing downloaded file ".$download_file,"GETALBUMCOVER");
    unlink($download_file);
}

$o = array( 'url' => $small_file, 'origimage' => $big_file, 'delaytime' => $delaytime);
header('Content-Type: application/json; charset=utf-8');
print json_encode($o);

debuglog("--------------------------------------------","GETALBUMCOVER");

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
            debuglog("Found stream file ".$stream,"GETALBUMCOVER");
        } else {
            debuglog(" Supplied stream file not found!","GETALBUMCOVER");
        }
    }
    return $retval;
}

function check_playlist($fname) {
    $fp = null;
    $retval = array(false, null, null, null, null, null, false);
    if (file_exists(ROMPR_PLAYLIST_FILE)) {
        if (get_file_lock(ROMPR_PLAYLIST_FILE, $fp)) {
            $ax = json_decode(file_get_contents(ROMPR_PLAYLIST_FILE), true);
            foreach ($ax as $track) {
                if ($track['key'] == $fname) {
                    $retval[1] = $track['albumartist'];
                    $retval[2] = $track['album'];
                    $retval[3] = $track['metadata']['album']['musicbrainz_id'];
                    $retval[4] = rawurldecode($track['dir']);
                    $retval[5] = rawurldecode($track['metadata']['album']['uri']);
                    $retval[6] = true;
                    debuglog("Found album in playlist","DEBUGGING");
                    break;
                }
            }
        }
        release_file_lock($fp);
    }
    return $retval;
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
            debuglog("    Returning archived image","GETALBUMCOVER");
            return $file;
        }
    }
    foreach ($files as $i => $file) {
        $info = pathinfo($file);
        $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
        if ($file_name == strtolower($artist." - ".$album) ||
            $file_name == strtolower($album)) {
            debuglog("    Returning file matching album name","GETALBUMCOVER");
            return $file;
        }
    }
    foreach ($covernames as $j => $name) {
        foreach ($files as $i => $file) {
            $info = pathinfo($file);
            $file_name = strtolower(rawurldecode(html_entity_decode(basename($file,'.'.$info['extension']))));
            if ($file_name == $name) {
                debuglog("    Returning ".$file,"GETALBUMCOVER");
                return $file;
            }
        }
    }
    // If we haven't found one but there's only one, then return that
    if (count($files) == 1) {
        debuglog("    Returning ".$files[0],"GETALBUMCOVER");
        return $files[0];
    }
    return "";
}

function trySpotify() {
    global $albumuri;
    global $delaytime;
    if ($albumuri == "" || substr($albumuri, 0, 8) != 'spotify:') {
        return "";
    }
    $image = "";
    debuglog("  Trying Spotify for ".$albumuri,"GETALBUMCOVER");

    // php strict prevents me from doing end(explode()) because
    // only variables can be passed by reference. Stupid php.
    $spaffy = explode(":", $albumuri);
    $spiffy = end($spaffy);
    $url = 'https://api.spotify.com/v1/albums/'.$spiffy;
    debuglog("      Getting ".$url,"GETALBUMCOVER");
    $content = url_get_contents($url);

    if ($content['contents'] && $content['contents'] != "") {
        $data = json_decode($content['contents']);
        if (array_key_exists(0, $data->{'images'})) {
            $image = $data->{'images'}[0]->{'url'};
            debuglog("    Returning result from Spotify : ".$image,"GETALBUMCOVER");
       } else {
            debuglog("    No Spotify Image Found","GETALBUMCOVER");

       }
    } else {
        debuglog("    Spotify API data not retrieved","GETALBUMCOVER");
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

    debuglog("  Trying last.FM for ".$artist." ".$al,"GETALBUMCOVER");
    $xml = loadXML("http://ws.audioscrobbler.com", "/2.0/?method=album.getinfo&api_key=15f7532dff0b8d84635c757f9f18aaa3&album=".rawurlencode($al)."&artist=".rawurlencode($artist)."&autocorrect=1");
    if ($xml === false) {
        debuglog("    Received error response from Last.FM","GETALBUMCOVER");
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
            debuglog("      Last.FM gave us the MBID of ".$mbid,"GETALBUMCOVER");
        }
    }
    if ($retval != "") {
        debuglog("    Last.FM gave us ".$retval,"GETALBUMCOVER");
    } else {
        debuglog("    No cover found on Last.FM","GETALBUMCOVER");
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
    debuglog("  Getting MusicBrainz release info for ".$mbid,"GETALBUMCOVER");
    $release_info = url_get_contents('http://musicbrainz.org/ws/2/release/'.$mbid.'?inc=release-groups');
    if ($release_info['status'] != "200") {
        debuglog("    Error response from musicbrainz","GETALBUMCOVER");
        return "";
    }
    $x = simplexml_load_string($release_info['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($x->{'release'}->{'cover-art-archive'}->{'artwork'} == "true" &&
        $x->{'release'}->{'cover-art-archive'}->{'front'} == "true") {
        debuglog("    Musicbrainz has artwork for this release", "GETALBUMCOVER");
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
    debuglog("  Saving base64 data","GETALBUMCOVER");
    $image = explode('base64,',$data);
    $download_file = "albumart/".$fname;
    file_put_contents($download_file, base64_decode($image[1]));

        $o = array();
        $c = $convert_path."identify \"".$download_file."\" 2>&1";
        // debuglog("    Command is ".$c,"GETALBUMCOVER");
        $r = exec( $c, $o);
        debuglog("    Return value from identify was ".$r,"GETALBUMCOVER");

    $error = 0;
    return $download_file;
}

function update_stream_image($stream, $image) {
    if (file_exists($stream)) {
        debuglog("    Updating stream playlist ".$stream,"GETALBUMCOVER");
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
