<?php

include ("player/mpd/sockets.php");
$dtz = ini_get('date.timezone');
if (!$dtz) {
    date_default_timezone_set('UTC');
}

@open_mpd_connection();

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

    global $connection, $collection;
    $collection = new musicCollection($connection);

    debug_print("Starting Collection Scan ".$command, "MPD");
    prepareCollectionUpdate();

    $files = array();
    $filecount = 0;
    fputs($connection, $command."\n");
    $filedata = array();
    $parts = true;
    $foundfile = false;

    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if ($parts === false) {
            debug_print("Got OK or ACK from MPD","COLLECTION");
        }
        if (is_array($parts)) {
            if ($parts[0] == "file") {
                if (!$foundfile) {
                    $foundfile = true;
                } else {
                    $filecount++;
                    process_file($filedata);
                    $filedata = array();
                }
            }

            $multivalues = array();
            if ($parts[0] == "Last-Modified") {
                $multivalues[] = strtotime($parts[1]);
            } else {
                // Some tags have multiple values which are separated by a ;
                $multivalues = explode(';',$parts[1]);
            }            

            // Things like Performer can come back with multiple lines
            // (in fact this could happen with any tag!)

            if (array_key_exists($parts[0], $filedata)) {
                $filedata[$parts[0]] = array_unique(array_merge($filedata[$parts[0]], $multivalues));
            } else {
                $filedata[$parts[0]] = array_unique($multivalues);
            }

        }
    }

    if (array_key_exists('file', $filedata) && $filedata['file']) {
        $filecount++;
        process_file($filedata);
    }
}


?>
