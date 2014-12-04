<?php
// Clean the backend cache. We do this with an AJAX request because
// a) It doesn't slow down the loading of the page, and
// b) If we do it at page load time Chrome's page preload feature
//    can result in two of them running simultanesouly, which
//    produces 'cannot stat' errors.
chdir('..');
include("includes/vars.php");
include("includes/functions.php");

debug_print("Checking Cache","CACHE CLEANER");
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
// Six Months
clean_cache_dir('prefs/jsoncache/lyrics/', 15552000);
// Two weeks (or it can get REALLY big)
clean_cache_dir('prefs/imagecache/', 1296000);
// Clean the albumart temporary upload directory
clean_cache_dir('albumart/', 1);
debug_print("Cache has been cleaned","CACHE CLEANER");
?>

<html></html>
