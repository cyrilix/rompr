<?php

function download_file($src, $fname, $convert_path) {
    global $error;

    $download_file = "albumart/".$fname;
    debug_print("   Downloading Image ".$src." to ".$fname,"GETALBUMCOVER");

    if (file_exists($download_file)) {
        unlink ($download_file);
    }
    $aagh = url_get_contents($src,$_SERVER['HTTP_USER_AGENT']);
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

function saveImage($fname, $in_collection, $stream) {
    global $convert_path;
    global $download_file;
    debug_print("  Saving Image ".$download_file,"GETALBUMCOVER");
    $main_file = null;
    $small_file = null;
    $anglofile = null;
    if ($in_collection || $stream != '') {
        debug_print("    Saving image to albumart folder");
        $main_file = "albumart/original/".$fname.".jpg";
        $small_file = "albumart/small/".$fname.".jpg";
        $anglofile = "albumart/asdownloaded/".$fname.".jpg";
    } else {
        debug_print("    Saving image to image cache");
        $small_file = "prefs/imagecache/".$fname."_small.jpg";
        $main_file = "prefs/imagecache/".$fname."_original.jpg";
        $anglofile = "prefs/imagecache/".$fname."_asdownloaded.jpg";
    }
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
    $r = exec( $convert_path."convert \"".$download_file."\" -resize 82x82 -background black -alpha remove -gravity center -extent 82x82 \"".$main_file."\" 2>&1", $o);
    $r = exec( $convert_path."convert \"".$download_file."\" -resize 32x32 -background black -alpha remove -gravity center -extent 32x32 \"".$small_file."\" 2>&1", $o);
    $r = exec( $convert_path."convert \"".$download_file."\" -background black -alpha remove \"".$anglofile."\" 2>&1", $o);

    return array($small_file, $main_file, $anglofile);
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
    }
}

?>
