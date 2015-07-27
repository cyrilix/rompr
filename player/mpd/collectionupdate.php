<?php

define('ROMPR_MULTIVALUE_SEPARATOR',';');

function musicCollectionUpdate() {
	$monitor = fopen('prefs/monitor','w');
    $dirs = array("/");
    while (count($dirs) > 0) {
        $dir = array_shift($dirs);
        fwrite($monitor, "\nScanning Directory ".$dir);
        doMpdParse('lsinfo "'.format_for_mpd($dir).'"', $dirs, null);
    }
    fwrite($monitor, "\nUpdating Database");
    fclose($monitor);
}

?>