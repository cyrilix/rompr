<?php

if (is_dir("prefs/MusicFolders")) {
	system ("unlink prefs/MusicFolders");
}

system ('ln -s "'.$_POST['dir'].'" prefs/MusicFolders');

?>
<html></html>
