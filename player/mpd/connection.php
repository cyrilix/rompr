<?php

include ("player/mpd/sockets.php");
$dtz = ini_get('date.timezone');
if (!$dtz) {
    date_default_timezone_set('UTC');
}

$ignored_extensions = array("jpg","jpeg","gif","bmp","png","log","nfo","info","txt","sfv");

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

function doFileSearch($cmd) {
    global $connection, $dbterms;
    $tree = new mpdlistthing("/", "/", false);
    $parts = true;
    $fcount = 0;
    fputs($connection, $cmd."\n");
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts) && $parts[0] == "file") {
            if (substr($parts[1], 0, 7) == "file://") {
                $tree->setprotocol("file:///");
                $parts[1] = substr($parts[1], 8, strlen($parts[1]));
            }
            if ($dbterms['tags'] !== null || $dbterms['rating'] !== null) {
                // If this is a search and we have tags or ratings to search for, check them here.
                if (check_url_against_database(trim($parts[1]), $dbterms['tags'], $dbterms['rating']) == true) {
                    $tree->addpath(trim($parts[1]), trim($parts[1]), false);
                    $fcount++;
                }
            }  else {
                $tree->addpath(trim($parts[1]), trim($parts[1]), false);
                $fcount++;
            }
        } else if (is_array($parts) && $parts[0] == "playlist" && $dbterms['tags'] === null && $dbterms['rating'] === null) {
            $tree->addpath(trim($parts[1]), trim($parts[1]), true);
            $fcount++;
        }
    }

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

function printFileItem($fullpath) {
    global $ignored_extensions;
    $s = basename($fullpath);
    $ext = strtolower(pathinfo($s, PATHINFO_EXTENSION));
    if ($ext == 'cue' || $ext == 'pls' || $ext == 'm3u' || $ext == 'xspf') {
        print '<div class="clickable clickcue ninesix draggable indent containerbox padright line" name="'.rawurlencode($fullpath).'">';
        print '<i class="icon-doc-text fixed smallicon"></i>';
        print '<div class="expand">'.$s.'</div>';
        print '</div>';
    } else if (!in_array($ext, $ignored_extensions)) {
        print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.rawurlencode($fullpath).'">';
        print '<i class="icon-music fixed smallicon"></i>';
        print '<div class="expand">'.$s.'</div>';
        print '</div>';                     
    }
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

    public function __construct($name, $fullpath, $iscue) {
        $this->children = array();
        $this->name = $name;
        $this->fullpath = $fullpath;
        $this->protocol = "";
        $this->isplaylist = $iscue;
    }

    public function addpath($path, $fullpath, $is_playlist) {

        $len = (strpos($path, "/") === false) ? strlen($path) : strpos($path, "/");
        $firstdir = substr($path, 0, $len);
        $flag = false;
        if ($firstdir == $path) {
            $flag = $is_playlist;
        }
        if (!array_key_exists($firstdir, $this->children)) {
            $this->children[$firstdir] = new mpdlistthing($firstdir, $fullpath, $flag);
        } else {
            if ($this->children[$firstdir]->isplaylist == false && $flag) {
                $this->children[$firstdir]->isplaylist = true;
            }
        }
        if (strpos($path, "/") != false) {
            $this->children[$firstdir]->addpath(substr($path, strpos($path, "/")+1, strlen($path)), $fullpath, $is_playlist);
        }
    }

    public function setprotocol($p) {
        $this->protocol = $p;
    }

    public function getHTML($prefix, &$dircount, $protocol = "") {
        global $dirpath;
        if ($this->name != "/") {
            if (count($this->children) > 0) {
                // This must be a directory if it has children
                $dirpath = $dirpath.$this->name."/";
                printDirectoryItem(trim($dirpath, '/'), $prefix, $dircount, true);
                $dircount++;
            } else {
                printFileItem($protocol.$this->fullpath);
            }
        } else {
            $protocol = $this->protocol;
            $dirpath = "";
        }
        foreach($this->children as $thing) {
            $thing->getHTML($prefix, $dircount, $protocol);
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
    global $connection, $is_connected, $ignored_extensions;
    debug_print("Getting Directory Items For ".$path,"GIBBONS");
    $items = array();
    $parts = true;
    $lines = array();
    fputs($connection, 'listfiles "'.format_for_mpd($path).'"'."\n");
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
                        $ext = strtolower(pathinfo($s, PATHINFO_EXTENSION));
                        if ($ext == 'cue' || $ext == 'pls' || $ext == 'm3u' || $ext == 'xspf') {
                        } else if (!in_array($ext, $ignored_extensions)) {
                            $items[] = $fullpath;
                        }
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
