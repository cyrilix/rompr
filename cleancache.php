<?php
// Clean the backend cache. We do this with an AJAX request because
// a) It doesn't slow down the loading of the page, and
// b) If we do it at page load time Chrome's page preload feature
//    can result in two of them running simultanesouly, which
//    produces 'cannot stat' errors.
include("includes/vars.php");
include("includes/functions.php");

debug_print("Starting Large Badger Process","CACHE CLEANER");
clean_cache_dir('prefs/jsoncache/musicbrainz/', 2592000);
clean_cache_dir('prefs/jsoncache/discogs/', 2592000);
clean_cache_dir('prefs/jsoncache/wikipedia/', 2592000);
clean_cache_dir('prefs/jsoncache/lastfm/', 259200);
clean_cache_dir('prefs/imagecache/', 259200);

?>

<html></html>