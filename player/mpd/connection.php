<?php

include ("player/mpd/sockets.php");
include ("player/".$prefs['player_backend']."/collectionupdate.php");
$dtz = ini_get('date.timezone');
if (!$dtz) {
    date_default_timezone_set('UTC');
}

@open_mpd_connection();

$prepared = false;
// Create a new collection

function doCollection($command, $domains = null) {

    global $connection, $collection, $prepared;
    $collection = new musicCollection($connection);


    debug_print("Starting Collection Scan ".$command, "MPD");
    if (!$prepared) {
        prepareCollectionUpdate();
        $prepared = true;
    }
    if ($command == "listallinfo") {
        // Forget listallinfo and try to do this in a mopidy and mpd compatible way
        // Also the mpd guys say "don't use listallinfo" and it's disabled in mopidy
        musicCollectionUpdate();
    } else {
        $dirs = array();
        doMpdParse($command, $dirs, $domains);
    }
}

function doMpdParse($command, &$dirs, $domains) {

    global $connection, $collection;
    if (!$connection) return;
    fputs($connection, $command."\n");
    $filedata = array();
    $parts = true;
    $foundfile = false;
    if (count($domains) == 0) {
        $domains = null;
    }

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
                            if (!is_array($domains) || in_array(getDomain(unwanted_array($filedata['file'])),$domains)) {
                                process_file($filedata);
                            }
                            $filedata = array();
                        }
                    }

                    $multivalues = array();
                    switch ($parts[0]) {
                        case "Last-Modified":
                            if (array_key_exists('file', $filedata)) {
                                // We don't want the Last-Modified stamps of the directories to be used for the files.
                                $multivalues[] = strtotime($parts[1]);
                            }
                            break;

                        default:
                            $multivalues = explode(ROMPR_MULTIVALUE_SEPARATOR,$parts[1]);
                            break;
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
        if (!is_array($domains) || in_array(getDomain(unwanted_array($filedata['file'])),$domains)) {
            process_file($filedata);
        }
    }
}

function doFileSearch($cmd, $domains = null) {
    global $connection, $dbterms;
    $tree = new mpdlistthing(null);
    $parts = true;
    $fcount = 0;
    $filedata = array();
    $foundfile = false;
    if (count($domains) == 0) {
        $domains = null;
    }
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
                            if (check_url_against_database($filedata['file'], $dbterms['tags'], $dbterms['rating']) == true) {
                                if (!is_array($domains) || in_array(getDomain(unwanted_array($filedata['file'])),$domains)) {
                                    $tree->newItem($filedata);
                                    $fcount++;
                                }
                            }
                        }  else {
                            if (!is_array($domains) || in_array(getDomain(unwanted_array($filedata['file'])),$domains)) {
                                $tree->newItem($filedata);
                                $fcount++;
                            }
                        }
                        $filedata = array();
                    }
                    $filedata[$parts[0]] = trim($parts[1]);
                    break;

                case "playlist":
                    $filedata[$parts[0]] = trim($parts[1]);
                    if ($dbterms['tags'] === null && $dbterms['rating'] === null) {
                        $tree->newItem($filedata);
                        $fcount++;
                    }
                    $filedata = array();
                    break;

                case "Title":
                case "Time":
                case "AlbumArtist":
                case "Album":
                case "Artist":
                    $filedata[$parts[0]] = trim($parts[1]);
                    break;
            }
        }
    }

    if (array_key_exists('file', $filedata)) {
        if (!is_array($domains) || in_array(getDomain(unwanted_array($filedata['file'])),$domains)) {
            $tree->newItem($filedata);
            $fcount++;
        }
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

function printFileItem($displayname, $fullpath, $time) {
    global $prefs;
    $ext = strtolower(pathinfo($fullpath, PATHINFO_EXTENSION));
    print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.rawurlencode($fullpath).'">';
    print '<i class="'.audioClass($ext).' fixed smallicon"></i>';
    print '<div class="expand">'.$displayname.'</div>';
    if ($time > 0) {
        print '<div class="fixed playlistrow2 tracktime">'.format_time($time).'</div>';
    }
    print '</div>';                     
}

function printPlaylistItem($displayname, $fullpath) {
    print '<div class="clickable clickcue ninesix draggable indent containerbox padright line" name="'.rawurlencode($fullpath).'">';
    print '<i class="icon-doc-text fixed smallicon"></i>';
    print '<div class="expand">'.$displayname.'</div>';
    print '</div>';
}

function printDirectoryItem($fullpath, $displayname, $prefix, $dircount, $printcontainer = false) {
    $c = ($printcontainer) ? "searchdir" : "directory";
    print '<div class="clickable '.$c.' clickalbum draggable containerbox menuitem clickdir" name="'.$prefix.$dircount.'">';
    print '<input type="hidden" name="'.rawurlencode($fullpath).'">';
    print '<i class="icon-toggle-closed menu mh fixed" name="'.$prefix.$dircount.'"></i>';
    print '<i class="icon-folder-open-empty fixed smallicon"></i>';
    print '<div class="expand">'.$displayname.'</div>';
    print '</div>';
    if ($printcontainer) {
        print '<div class="dropmenu" id="'.$prefix.$dircount.'">';
    }
}

class mpdlistthing {

    // Note: This is for displaying SEARCH RESULTS ONLY as a file tree.
    // Directory clicking only works on this when the entire results set
    // is loaded into the browser at once. Don't fuck with it, it's got teeth.

    public function __construct($name, $parent = null, $filedata = null) {
        $this->children = array();
        $this->name = $name;
        $this->parent = $parent;
        $this->filedata = $filedata;
    }

    public function newItem($filedata) {

        global $prefs;

        // This should only be called from outside the tree. 
        // This is the root object's pre-parser

        if (array_key_exists('playlist', $filedata)) {
            $decodedpath = $filedata['playlist'];
            $filedata['file_display_name'] = basename($decodedpath);
        } else {
            $decodedpath = rawurldecode($filedata['file']);
        }

        if ($prefs['ignore_unplayable'] && substr($decodedpath, 0, 12) == "[unplayable]") {
            return;
        }

        // All the different fixups for all the different mopidy backends
        // and their various random ways of doing things.
        if (preg_match('/podcast\+http:\/\//', $decodedpath)) {
            $filedata['file_display_name'] = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($decodedpath);
            $filedata['file_display_name'] = preg_replace('/Album: /','',$filedata['file_display_name']);
            $decodedpath = preg_replace('/podcast\+http:\/\//','podcast/',$decodedpath);
        
        } else if (preg_match('/:artist:/', $decodedpath)) {
            $filedata['file_display_name'] = $filedata['Artist'];
            $decodedpath = preg_replace('/(.+?):(.+?):/','$1/$2/',$decodedpath);
        
        } else if (preg_match('/:album:/', $decodedpath)) {
            $matches = array();
            $a = preg_match('/(.*?):(.*?):(.*)/',$decodedpath,$matches);
            $decodedpath = $matches[1]."/".$matches[2]."/".$filedata['AlbumArtist']."/".$matches[3];
            $filedata['file_display_name'] = $filedata['Album'];
        
        } else if (preg_match('/local:track:/', $decodedpath)) {
            $filedata['file_display_name'] = basename($decodedpath);
            $decodedpath = preg_replace('/:track:/','/',$decodedpath);
        
        } else if (preg_match('/:track:/', $decodedpath)) {
            $matches = array();
            $a = preg_match('/(.*?):(.*?):(.*)/',$decodedpath,$matches);
            $decodedpath = $matches[1]."/".$matches[2]."/".$filedata['Artist']."/".$filedata['Album']."/".$matches[3];
            $filedata['file_display_name'] = $filedata['Title'];
        
        } else if (preg_match('/soundcloud:song\//', $decodedpath)) {
            $filedata['file_display_name'] = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($decodedpath);
            $decodedpath = preg_replace('/soundcloud:song/','soundcloud/'.$filedata['Artist'],$decodedpath);
        
        } else if (preg_match('/youtube:video\//', $decodedpath)) {
            $filedata['file_display_name'] = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($decodedpath);
            $decodedpath = preg_replace('/youtube:video/','youtube',$decodedpath);
        
        } else {
            if ($prefs['player_backend'] == "mopidy") {
                $filedata['file_display_name'] = (array_key_exists('Title', $filedata)) ? $filedata['Title'] : basename($decodedpath);
            } else {
                $filedata['file_display_name'] = basename($filedata['file']);
            }
        }

        $pathbits = explode('/', $decodedpath);
        $name = array_shift($pathbits);

        if (!array_key_exists($name, $this->children)) {
            $this->children[$name] = new mpdlistthing($name, $this);
        }

        $this->children[$name]->newChild($pathbits, $filedata);
    }

    public function newChild($pathbits, $filedata) {
        $name = array_shift($pathbits);
        if (count($pathbits) == 0) {
            $this->children[$name] = new mpdlistthing($filedata['file_display_name'], $this, $filedata);
        } else {
            if (!array_key_exists($name, $this->children)) {
                $this->children[$name] = new mpdlistthing($name, $this);
            }
            $this->children[$name]->newChild($pathbits, $filedata);
        }
    }

    public function getHTML($prefix, &$dircount) {
        if ($this->name !== null) {
            if (count($this->children) > 0) {
                // Must be a directory
                printDirectoryItem($this->parent->getName($this->name), $this->name, $prefix, $dircount, true);
                $dircount++;
                foreach ($this->children as $child) {
                    $child->getHTML($prefix, $dircount);
                }
                print '</div>';
            } else {
                if (array_key_exists('playlist', $this->filedata)) {
                    printPlaylistItem($this->filedata['file_display_name'],$this->filedata['file']);
                } else {
                    printFileItem($this->filedata['file_display_name'],$this->filedata['file'], $this->filedata['Time']);
                }
            }
        } else {
            foreach ($this->children as $child) {
                $child->getHTML($prefix, $dircount);
            }
        }
    }

    public function getName($name) {
        if ($this->name !== null) {
            $name = $this->name."/".$name;
        }
        if ($this->parent !== null) {
            $name = $this->parent->getName($name);
        }
        return $name;
    }

}




// class mpdlistthing {

//     public function __construct($name, $fullpath, $iscue, $filedata) {
//         $this->children = array();
//         $this->name = $name;
//         $this->fullpath = $fullpath;
//         $this->isplaylist = $iscue;
//         $this->filedata = $filedata;
//         debug_print("New mpdlistthing ".$name." ".$fullpath,"SCANNER");
//     }

//     public function addpath($path, $fullpath, $is_playlist, $filedata) {

//         $len = (strpos($path, "/") === false) ? strlen($path) : strpos($path, "/");
//         $firstdir = substr($path, 0, $len);
//         debug_print("Adding Path ".$path." ".$fullpath." ".$firstdir,"SCANNER");
//         $flag = false;
//         if ($firstdir == $path) {
//             $flag = $is_playlist;
//         }
//         if (!array_key_exists($firstdir, $this->children)) {
//             $this->children[$firstdir] = new mpdlistthing($firstdir, $fullpath, $flag, $filedata);
//         } else {
//             if ($this->children[$firstdir]->isplaylist == false && $flag) {
//                 $this->children[$firstdir]->isplaylist = true;
//             }
//         }
//         if (strpos($path, "/") != false) {
//             $this->children[$firstdir]->addpath(substr($path, strpos($path, "/")+1, strlen($path)), $fullpath, $is_playlist, $filedata);
//         }
//     }

//     public function getHTML($prefix, &$dircount) {
//         global $dirpath;
//         if ($this->name != "/") {
//             if (count($this->children) > 0) {
//                 // This must be a directory if it has children
//                 $dirpath = $dirpath.$this->name."/";
//                 printDirectoryItem(trim($dirpath, '/'), $prefix, $dircount, true);
//                 $dircount++;
//             } else if ($this->isplaylist) {
//                 printPlaylistItem($this->fullpath);
//             } else {
//                 printFileItem($this->filedata);
//             }
//         } else {
//             $dirpath = "";
//         }
//         foreach($this->children as $thing) {
//             $thing->getHTML($prefix, $dircount);
//         }
//         if (count($this->children) > 0 && $this->name != "/") {
//             print "</div>\n";
//             $dirpath = dirname($dirpath);
//             debug_print("Dirpath is ".$dirpath,"SCANNER");
//             if ($dirpath == ".") {
//                 $dirpath = "";
//             }
//         }
//     }
// }

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
