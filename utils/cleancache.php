<?php
// Clean the backend cache. We do this with an AJAX request because
// a) It doesn't slow down the loading of the page, and
// b) If we do it at page load time Chrome's page preload feature
//    can result in two of them running simultanesouly, which
//    produces 'cannot stat' errors.

chdir('..');
include("includes/vars.php");
include("includes/functions.php");

debuglog("Checking Cache","CACHE CLEANER");

// DO NOT REDUCE the values for musicbrainz or discogs
// - we have to follow their API rules and as we don't check
// expiry headers at all we need to keep everything for a month
// otherwise they will ban us. Don't spoil it for everyone.

// One Month
clean_cache_dir('prefs/jsoncache/musicbrainz/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/discogs/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/wikipedia/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/lastfm/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/spotify/', 2592000);
// One Month
clean_cache_dir('prefs/jsoncache/google/', 2592000);
// Six Months - after all, lyrics are small and don't change
clean_cache_dir('prefs/jsoncache/lyrics/', 15552000);
// Two weeks (or it can get REALLY big)
clean_cache_dir('prefs/imagecache/', 1296000);
// Clean the albumart temporary upload directory
clean_cache_dir('albumart/', 1);
debuglog("Cache has been cleaned","CACHE CLEANER");

function clean_cache_dir($dir, $time) {

    debuglog("Cache Cleaner is running on ".$dir,"CACHE CLEANER");
    $cache = glob($dir."*");
    $now = time();
    foreach($cache as $file) {
        if (!is_dir($file)) {
            if($now - filemtime($file) > $time) {
                debuglog("Removing file ".$file,"CACHE CLEANER",4);
                @unlink ($file);
            }
        }
    }
}

?>

<html></html>
