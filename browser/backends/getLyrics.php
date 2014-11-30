<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("getid3/getid3.php");

$fname = rawurldecode($_REQUEST['file']);
$fname = preg_replace('/local:track:/','',$fname);
$fname = preg_replace('#file://#','',$fname);
$fname = 'prefs/MusicFolders/'.$fname;

$getID3 = new getID3;
$output = null;
debug_print("Looking for lyrics in ".$fname,"LYRICS");
debug_print("  Artist is ".$_REQUEST['artist'],"LYRICS");
debug_print("  Song is ".$_REQUEST['song'],"LYRICS");

if (file_exists($fname)) {
	debug_print("File Exists ".$fname,"LYRICS");
	$tags = $getID3->analyze($fname);
	getid3_lib::CopyTagsToComments($tags);

	if (array_key_exists('comments', $tags) &&
			array_key_exists('lyrics', $tags['comments'])) {
		$output = $tags['comments']['lyrics'][0];
	} else if (array_key_exists('comments', $tags) &&
				array_key_exists('unsynchronised_lyric', $tags['comments'])) {
		$output = $tags['comments']['unsynchronised_lyric'][0];
	} else if (array_key_exists('quicktime', $tags) &&
				array_key_exists('moov', $tags['quicktime']) &&
				array_key_exists('subatoms', $tags['quicktime']['moov'])) {
		read_apple_awfulness($tags['quicktime']['moov']['subatoms']);
	}
}

if ($output == null) {
	$uri = "http://lyrics.wikia.com/api.php?func=getSong&artist=".urlencode($_REQUEST['artist'])."&song=".urlencode($_REQUEST['song'])."&fmt=xml";
	if (file_exists('prefs/jsoncache/lyrics/'.md5($uri))) {
		$output = file_get_contents('prefs/jsoncache/lyrics/'.md5($uri));
	} else {
		debug_print("Getting ".$uri,"LYRICS");
		$content = url_get_contents($uri);
		if ($content['status'] == "200") {
			$l = simplexml_load_string($content['contents']);
			if ($l->url) {
				debug_print("Getting ".$l->url,"LYRICS");
				$webpage = url_get_contents(urldecode($l->url));
				if ($webpage['status'] == "200") {
					debug_print("   Got something","LYRICS");
					if (preg_match('/\<div class=\'lyricbox\'\>\<script\>.*?\<\/script\>(.*?)\<\!--/', $webpage['contents'], $matches)) {
						$output = html_entity_decode($matches[1]);
						file_put_contents('prefs/jsoncache/lyrics/'.md5($uri), $output);
					} else {
						debug_print("     preg didn't match","LYRICS");
					}
				}
			}
		}
	}
} else {
	debug_print("  Got lyrics from file","LYRICS");
}

if ($output == null) {
	$output = '<h3 align=center>'.get_int_text("lyrics_nonefound").'</h3><p>'.get_int_text("lyrics_info").'</p>';
}

print $output;

function read_apple_awfulness($a) {
	// Whoever came up with this was on something.
	// All we want to do is read some metadata...
	// why do you have to store it in such a horrible, horrible, way?
	global $output;
	foreach ($a as $atom) {
		if (array_key_exists('name', $atom)) {
			if (preg_match('/lyr$/', $atom['name'])) {
				$output = preg_replace( '/^.*?data/', '', $atom['data']);
				break;
			}
		}
		if (array_key_exists('subatoms', $atom)) {
			read_apple_awfulness($atom['subatoms']);
		}
	}
}

?>