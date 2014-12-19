<?php
if (!is_dir('prefs/imagecache')) {
	mkdir('prefs/imagecache');
}
if (!is_dir('prefs/podcasts')) {
	mkdir('prefs/podcasts');
}
if (!is_dir('prefs/jsoncache')) {
	mkdir('prefs/jsoncache');
}
if (!is_dir('prefs/jsoncache/discogs')) {
	mkdir('prefs/jsoncache/discogs');
}
if (!is_dir('prefs/jsoncache/musicbrainz')) {
	mkdir('prefs/jsoncache/musicbrainz');
}
if (!is_dir('prefs/jsoncache/wikipedia')) {
	mkdir('prefs/jsoncache/wikipedia');
}
if (!is_dir('prefs/jsoncache/lastfm')) {
	mkdir('prefs/jsoncache/lastfm');
}
if (!is_dir('prefs/jsoncache/spotify')) {
	mkdir('prefs/jsoncache/spotify');
}
if (!is_dir('prefs/jsoncache/lyrics')) {
	mkdir('prefs/jsoncache/lyrics');
}
if (file_exists('prefs/keybindings')) {
	unlink('prefs/keybindings');
}

?>
