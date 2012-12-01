<?php
ob_start();
include ("vars.php");
include ("functions.php");

$stream = "";
$src = "";
$flag = "";
$error = 0;
$file = "";

$fname = rawurldecode($_REQUEST['key']);
if (array_key_exists("flag", $_REQUEST)) {
    $flag = $_REQUEST['flag'];
}
if (array_key_exists("src", $_REQUEST)) {
    $src = rawurldecode($_REQUEST['src']);
}
if (array_key_exists("stream", $_REQUEST)) {
    $stream = rawurldecode($_REQUEST['stream']);
}
if (array_key_exists("ufile", $_FILES)) {
    $file = $_FILES['ufile']['name'];
}

$convert_path = find_convert_path();

if ($flag == "") {
    $download_file = "";
    if ($src == "") {
        $download_file = get_user_file($file, $fname, $_FILES['ufile']['tmp_name']);
    } else {
        $download_file = download_file($src, $fname, $convert_path);
    }
    if ($error == 0) {
        $main_file = "albumart/original/".$fname.".jpg";
        $small_file = "albumart/small/".$fname.".jpg";
        if (file_exists($main_file)) {
            unlink($main_file);
        }
        if (file_exists($small_file)) {
            unlink($small_file);
        }
            $r = system( $convert_path.'convert "'.$download_file.'" "'.$main_file.'"');
            $r = system( $convert_path.'convert -resize 32x32 "'.$download_file.'" "'.$small_file.'"');
    }
    if (file_exists($download_file)) {
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

} else {

    if (file_exists($ALBUMSLIST) && $stream == "") {
        error_log("Flagging ".$fname." as ".$flag);
        $class = "updateable ".$flag;
        update_cache($fname, $class);
    }

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
    print "<HTML><body></body></html>";
    ob_flush();
} else {
    // Didn't get a valid image, so return a server error to prevent the javascript
    // from trying to modify things
    header('x', true, 404);
    ob_flush();
    die;
}

function check_file($file, $data) {
    $r = system('file "'.$file.'"');
    if (preg_match('/HTML/', $r)) {
        error_log("check_file thinks it has found a diversion");
        $matches=array();
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

function find_convert_path() {

    // Test to see if convert is on the path and adjust if not - this makes
    // it work on MacOSX when everything's installed from MacPorts
    $c = "";
    $a = 1;
    $r = system("convert", $a);
    if ($a == 127) {
        $c = "/opt/local/bin/";
    }
    return $c;

}

function download_file($src, $fname, $convert_path) {
    global $error;
    $file_extension = substr(strrchr($src,'.'),1);
    $download_file = "albumart/".$fname.".".$file_extension;
    error_log("Getting Album Art: ".$src." ".$file_extension." ".$fname);

    if (file_exists($download_file)) {
        unlink ($download_file);
    }
    $aagh = url_get_contents($src);
    $fp = fopen($download_file, "x");
    if ($fp) {
        fwrite($fp, $aagh['contents']);
        fclose($fp);
        check_file($download_file, $aagh['contents']);
        $r = system( $convert_path.'identify "'.$download_file.'"');
        error_log("Return value from identify was ".$r);
        if ($r == '' || 
            preg_match('/GIF 1x1/', $r)) {
            error_log("Broken/Invalid file returned");
            $error = 1;
        }
    } else {
        error_log("File open failed!");
        $error = 1;
    }
    return $download_file;
}

function get_user_file($src, $fname, $tmpname) {
    global $error;
    $file_extension = substr(strrchr($src,'.'),1);
    $download_file = "prefs/".$fname.".".$file_extension;
    if (move_uploaded_file($tmpname, $download_file)) {
        error_log("File ".$src." is valid, and was successfully uploaded.");
    } else {
        error_log("Possible file upload attack!");
        $error = 1;
    }
    return $download_file;
}

function update_cache($fname, $class) {

    global $ALBUMSLIST;

    if (file_exists($ALBUMSLIST)) {
        $cache = file_get_contents($ALBUMSLIST);
        $newcache = preg_replace('/<img class="updateable.*?(name=\"'.$fname.'\".*?)src=.*?>/m', '<img class="'.$class.'" $1 src="">', $cache);
        if ($newcache != null) {
            $fp = fopen($ALBUMSLIST, 'w');
            if ($fp) {
                fwrite($fp, $newcache);
            }
            fclose($fp);
        }
    }
}

?>
