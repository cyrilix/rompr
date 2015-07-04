<?php

define('ROMPR_MULTIVALUE_SEPARATOR',';');

function musicCollectionUpdate() {
    $dirs = array("/");
    while (count($dirs) > 0) {
        $dir = array_shift($dirs);
        doMpdParse('lsinfo "'.format_for_mpd($dir).'"', $dirs, null);
    }
}

?>