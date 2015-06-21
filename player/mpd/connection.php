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

function doCollection($command) {

    global $connection, $collection;
    $collection = new musicCollection($connection);

    $dirs = array("/");

    debug_print("Starting Collection Scan ".$command, "MPD");
    prepareCollectionUpdate();
    if ($command == "listallinfo") {
        // Forget listallinfo and try to do this in a mopidy and mpd compatible way
        // Also the mpd guys say "don't use listallinfo"
        // $artists = do_mpd_command($connection, 'list "artist"', null, true);
        // foreach ($artists['Artist'] as $a) {
        //     debug_print("Parsing Tracks for Artist ".$a,"COLLECTION");
        //     doMpdParse('find artist "'.format_for_mpd($a).'"');
        // }
        // foreach ($dirs as $dir) {
        while (count($dirs) > 0) {
            $dir = array_shift($dirs);
            doMpdParse('lsinfo "'.format_for_mpd($dir).'"', $dirs);
        }
    } else {
        doMpdParse($command, $dirs);
    }
}

function doMpdParse($command, &$dirs) {

    global $connection, $collection;
    fputs($connection, $command."\n");
    $filedata = array();
    $parts = true;
    $foundfile = false;

    while(!feof($connection) && $parts) {
        $parts = getline($connection, true);
        if (is_array($parts)) {
            switch ($parts[0]) {
                case "directory":
                    $dirs[] = trim($parts[1]);
                    break;

                default:
                    if ($parts[0] == "file") {
                        if (!$foundfile) {
                            $foundfile = true;
                        } else {
                            process_file($filedata);
                            $filedata = array();
                        }
                    }

                    $multivalues = array();
                    if ($parts[0] == "Last-Modified") {
                        if (array_key_exists('file', $filedata)) {
                            // We don't want the Last-Modified stamps of the directories
                            // to be used for the files.
                            $multivalues[] = strtotime($parts[1]);
                        }
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
                    break;
            }
        }
    }

    if (array_key_exists('file', $filedata) && $filedata['file']) {
        process_file($filedata);
    }
}

function doFileSearch($cmd) {
    global $connection, $dbterms;
    $tree = new mpdlistthing("/", "/", false, array());
    $parts = true;
    $fcount = 0;
    $filedata = array();
    $foundfile = false;
    fputs($connection, $cmd."\n");
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts)) {
            switch($parts[0]) {
                case "file":
                    if (!$foundfile) {
                        $foundfile = true;
                    } else {
                        if ($dbterms['tags'] !== null || $dbterms['rating'] !== null) {
                            // If this is a search and we have tags or ratings to search for, check them here.
                            if (check_url_against_database(trim($parts[1]), $dbterms['tags'], $dbterms['rating']) == true) {
                                $tree->addpath($filedata['file'], $filedata['file'], false, $filedata);
                                $fcount++;
                            }
                        }  else {
                            $tree->addpath($filedata['file'], $filedata['file'], false, $filedata);
                            $fcount++;
                        }
                        $filedata = array();
                    }
                    $filedata[$parts[0]] = trim($parts[1]);
                    break;

                case "playlist":
                    if ($dbterms['tags'] === null && $dbterms['rating'] === null) {
                        $tree->addpath(trim($parts[1]), trim($parts[1]), true, array());
                    }
                    $filedata = array();
                    break;

                case "Title":
                case "Time":
                    $filedata[$parts[0]] = $parts[1];
                    break;
            }
        }
    }

    if (array_key_exists('file', $filedata)) {
        $tree->addpath($filedata['file'], $filedata['file'], false, $filedata);
    }

    printFileSearch($tree, $fcount);
}

function printFileSearch($tree, $fcount) {
    $prefix = "sdirholder";
    $dircount = 0;
    print '<div class="menuitem">';
    print "<h3>".get_int_text("label_searchresults")."</h3>";
    print "</div>";
    print '<div style="margin-bottom:4px">
            <table width="100%" class="playlistitem">
            <tr><td align="left">'.$fcount.' '.get_int_text('label_files').'</td></tr>
            </table>
            </div>';
    $tree->getHTML($prefix, $dircount);    
}

function printFileItem($fileinfo) {
    $name = (array_key_exists('Title', $fileinfo)) ? $fileinfo['Title'] : basename($fileinfo['file']);
    $ext = strtolower(pathinfo($fileinfo['file'], PATHINFO_EXTENSION));
    print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.rawurlencode($fileinfo['file']).'">';
    print '<i class="'.audioClass($ext).' fixed smallicon"></i>';
    print '<div class="expand">'.$name.'</div>';
    print '<div class="fixed playlistrow2 tracktime">'.format_time($fileinfo['Time']).'</div>';
    print '</div>';                     
}

function printPlaylistItem($fullpath) {
    $s = basename($fullpath);
    print '<div class="clickable clickcue ninesix draggable indent containerbox padright line" name="'.rawurlencode($fullpath).'">';
    print '<i class="icon-doc-text fixed smallicon"></i>';
    print '<div class="expand">'.$s.'</div>';
    print '</div>';
}

function printDirectoryItem($fullpath, $prefix, $dircount, $printcontainer = false) {
    $s = basename($fullpath);
    $c = ($printcontainer) ? "searchdir" : "directory";
    print '<div class="clickable '.$c.' clickalbum draggable containerbox menuitem clickdir" name="'.$prefix.$dircount.'">';
    print '<input type="hidden" name="'.rawurlencode($fullpath).'">';
    print '<i class="icon-toggle-closed menu mh fixed" name="'.$prefix.$dircount.'"></i>';
    print '<i class="icon-folder-open-empty fixed smallicon"></i>';
    print '<div class="expand">'.$s.'</div>';
    print '</div>';
    if ($printcontainer) {
        print '<div class="dropmenu" id="'.$prefix.$dircount.'">';
    }
}

class mpdlistthing {

    public function __construct($name, $fullpath, $iscue, $filedata) {
        $this->children = array();
        $this->name = $name;
        $this->fullpath = $fullpath;
        $this->isplaylist = $iscue;
        $this->filedata = $filedata;
    }

    public function addpath($path, $fullpath, $is_playlist, $filedata) {

        debug_print("Path Being Added Is ".$path,"FILESEARCH");
        debug_print("File Being Added Is ".$filedata['file'],"FILESEARCH");

        $len = (strpos($path, "/") === false) ? strlen($path) : strpos($path, "/");
        $firstdir = substr($path, 0, $len);
        $flag = false;
        if ($firstdir == $path) {
            $flag = $is_playlist;
        }
        if (!array_key_exists($firstdir, $this->children)) {
            $this->children[$firstdir] = new mpdlistthing($firstdir, $fullpath, $flag, $filedata);
        } else {
            if ($this->children[$firstdir]->isplaylist == false && $flag) {
                $this->children[$firstdir]->isplaylist = true;
            }
        }
        if (strpos($path, "/") != false) {
            $this->children[$firstdir]->addpath(substr($path, strpos($path, "/")+1, strlen($path)), $fullpath, $is_playlist, $filedata);
        }
    }

    public function getHTML($prefix, &$dircount) {
        global $dirpath;
        if ($this->name != "/") {
            if (count($this->children) > 0) {
                // This must be a directory if it has children
                $dirpath = $dirpath.$this->name."/";
                printDirectoryItem(trim($dirpath, '/'), $prefix, $dircount, true);
                $dircount++;
            } else if ($this->isplaylist) {
                printPlaylistItem($this->fullpath);
            } else {
                printFileItem($this->filedata);
            }
        } else {
            $dirpath = "";
        }
        foreach($this->children as $thing) {
            $thing->getHTML($prefix, $dircount);
        }
        if (count($this->children) > 0 && $this->name != "/") {
            print "</div>\n";
            $dirpath = dirname($dirpath);
            if ($dirpath == ".") {
                $dirpath = "";
            }
        }
    }
}

function getDirItems($path) {
    global $connection, $is_connected;
    debug_print("Getting Directory Items For ".$path,"GIBBONS");
    $items = array();
    $parts = true;
    $lines = array();
    fputs($connection, 'lsinfo "'.format_for_mpd($path).'"'."\n");
    // We have to read in the entire response then go through it
    // because we only have the one connection to mpd so this function
    // is not strictly re-entrant and recursing doesn't work unless we do this.
    while(!feof($connection) && $parts) {
        $parts = getline($connection, true);
        if ($parts === false) {
            debug_print("Got OK or ACK from MPD","DIRBROWSER");
        } else {
            $lines[] = $parts;
        }
    }
    foreach ($lines as $parts) {
        if (is_array($parts)) {
            $s = trim($parts[1]);
            if (substr($s,0,1) != ".") {
                $fullpath = ltrim($path.'/'.$s, '/');
                switch ($parts[0]) {
                    case "file":
                        $items[] = $fullpath;
                        break;

                  case "directory":
                        $items = array_merge($items, getDirItems($fullpath));
                        break;
                }
            }
        }
    }
    return $items;
}

?>
