<?php

include ("vars.php");

$x = simplexml_load_file($ALBUMSLIST);
foreach($x->artists->artist as $i => $artist) {
	print "Artist : ".$artist->name."\n";
	foreach($artist->albums->album as $j => $album) {
		$alb = rawurldecode(html_entity_decode($album->name));
		print "  Album : ".$alb."\n";
		$dir = rawurldecode(html_entity_decode($album->directory));
		print "    Directory : ".$dir."\n";
		$img = $album->image->name.".jpg";
		print "    Image : ".$img."\n";

		if (file_exists("albumart/asdownloaded/".$img)) {
			print "      Downloaded Image Exists\n";
			$newfile = "prefs/MusicFolders/".$dir."/";
			print "        Copying to ".$newfile."\n";
			if (file_exists($newfile."/".$img)) {
				print "    FILE ".$newfile." ALREADY EXSISTS!\n";
				system('rm "'.$newfile.$img.'"');
			}
			system('cp albumart/asdownloaded/'.$img.' "'.$newfile.'"');
		}
	}
}

?>
