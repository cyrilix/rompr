<?php

include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");
include ("getid3/getid3.php");

$fname = $_REQUEST['file'];
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
	if (array_key_exists('comments', $tags) && array_key_exists('lyrics', $tags['comments'])) {
		$output = $tags['comments']['lyrics'][0];
	}
}

print $output;

?>