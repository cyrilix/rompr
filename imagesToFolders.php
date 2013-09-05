<?php

include ("vars.php");
include ("functions.php");

$x = simplexml_load_file($ALBUMSLIST);
foreach($x->artists->artist as $i => $artist) {
	print "Artist : ".$artist->name."\n";
	foreach($artist->albums->album as $j => $album) {
		$alb = rawurldecode(html_entity_decode($album->name));
		print "  Album : ".$alb."\n";
		$dir = rawurldecode(munge_filepath($album->directory));
		print "    Directory : ".$dir."\n";
		$img = $album->image->name.".jpg";
		print "    Image : ".$img."\n";

		if (file_exists("albumart/asdownloaded/".$img)) {
			print "      Downloaded Image Exists\n";
			$newfile = $dir."/";

			if (file_exists($newfile.$img)) {
				print "       Archived image exists ".$newfile.$img."\n";
				system('rm "'.$newfile.$img.'"');
			}
			if (file_exists($newfile.'cover.jpg')) {
				print "       Cover image exists ".$newfile."cover.jpg\n";
				system('rm "'.$newfile.'cover.jpg"');
			}
			system('cp albumart/asdownloaded/'.$img.' "'.$newfile.'cover.jpg"');
		}
	}
}

?>
