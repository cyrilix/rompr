<?php
// Clean the backend cache. We do this with an AJAX request because
// a) It doesn't slow down the loading of the page, and
// b) If we do it at page load time Chrome's page preload feature
//    can result in two of them running simultanesouly, which
//    produces 'cannot stat' errors.
include("includes/vars.php");
include("includes/functions.php");

debug_print("Starting Large Badger Process","CACHE CLEANER");
// Everything is kept for one month, except lyrics which are kept for 6 months (approx)
clean_cache_dir('prefs/jsoncache/musicbrainz/', 2592000);
clean_cache_dir('prefs/jsoncache/discogs/', 2592000);
clean_cache_dir('prefs/jsoncache/wikipedia/', 2592000);
clean_cache_dir('prefs/jsoncache/lastfm/', 2592000);
clean_cache_dir('prefs/jsoncache/spotify/', 2592000);
clean_cache_dir('prefs/jsoncache/lyrics/', 15552000);
clean_cache_dir('prefs/imagecache/', 2592000);
system('rm prefs/albumart/*');
?>

<html></html>