<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("getid3/getid3.php");

$fname = rawurldecode($_REQUEST['file']);
$fname = preg_replace('/local:track:/','',$fname);
$fname = preg_replace('#file://#','',$fname);
$fname = 'prefs/MusicFolders/'.$fname;

$getID3 = new getID3;
$output = '<h3 align=center>'.get_int_text("lyrics_nonefound").'</h3><p>'.get_int_text("lyrics_info").'</p>';
debug_print("Looking for lyrics in ".$fname,"LYRICS");
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