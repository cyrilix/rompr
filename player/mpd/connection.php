<?php

include ("player/mpd/sockets.php");
$dtz = ini_get('date.timezone');
if (!$dtz) {
    date_default_timezone_set('UTC');
}

@open_mpd_connection();

if($is_connected) {

    include ("player/xspf.php");
    $cmd_status = true;

    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            debug_print("Arg is ".$_REQUEST['arg'],"CONNECTION");
            $command.=" \"".format_for_mpd($_REQUEST["arg"])."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd($_REQUEST["arg2"])."\"";
        }
        $cmd_status = do_mpd_command($connection, $command, null, true);
    }

    if (!array_key_exists('fast', $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);
        if (array_key_exists('state', $mpd_status)) {
            while ($mpd_status['state'] == 'play' &&
                    (!array_key_exists('elapsed', $mpd_status) && !array_key_exists('time', $mpd_status)))
            {
                debug_print("Playing but no elapsed time yet.. waiting","CONNECTION");
                sleep(1);
                $mpd_status = do_mpd_command ($connection, "status", null, true);
            }
        }
        if (is_array($cmd_status) && !array_key_exists('error', $mpd_status)) {
            $mpd_status = array_merge($mpd_status, $cmd_status);
        }
        if (!array_key_exists('elapsed', $mpd_status) && array_key_exists('time', $mpd_status)) {
            // Rompr depends on mpd's elapsed count for the song progress but some mpd-like players (eg beets)
            // don't support this. This is lower resolution however.
            $mpd_status['elapsed'] = substr($mpd_status['time'] ,0, strpos($mpd_status['time'], ':'));
        }
    }

} else {
    if ($prefs['unix_socket'] != "") {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["unix_socket"];
    } else {
        $mpd_status['error'] = "Unable to Connect to MPD server at\n".$prefs["mpd_host"].":".$prefs["mpd_port"];
    }
}

function close_player() {
    global $connection;
    close_mpd($connection);
}

// Create a new collection
// Now... the trouble is that do_mpd_command returns a big array of the parsed text from mpd, which is lovely and all that.
// Trouble is, the way that works is that everything is indexed by number so parsing that array ONLY works IF every single
// track has the exact same tags - which in reality just ain't gonna happen.
// So - the only thing we can rely on is the list of files and we have to parse it very carefully.
// However on the plus side parsing 'listallinfo' is the fastest way to create our collection by about a quadrillion miles.

function doCollection($command) {

    global $connection;
    global $is_connected;
    global $COMPILATION_THRESHOLD;
    global $prefs;
    $collection = new musicCollection($connection);

    debug_print("Starting Collection Scan ".$command, "MPD");

    $files = array();
    $filecount = 0;
    fputs($connection, $command."\n");
    $firstline = null;
    $filedata = array();
    $parts = true;
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts)) {
            if ($parts[0] == $firstline) {
                $filecount++;
                process_file($collection, $filedata);
                $filedata = array();
            }
            $value = is_array($parts[1]) ? $parts[1][0] : $parts[1];
            if ($parts[0] == "Last-Modified") {
                $value = strtotime($value);
            }
            $filedata[$parts[0]] = $value;
            if ($firstline == null) {
                $firstline = $parts[0];
            }
        }
    }

    if (array_key_exists('file', $filedata) && $filedata['file']) {
        $filecount++;
        process_file($collection, $filedata);
    }

    return $collection;

}


?>
