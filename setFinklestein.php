<?php

if (is_link("prefs/MusicFolders")) {
	system ("unlink prefs/MusicFolders");
}

system ('ln -s "'.$_POST['dir'].'" prefs/MusicFolders');

?>
<html></html>
