<?php

function xmlnode($node, $content) {
    return '<'.$node.'>'.htmlspecialchars($content).'</'.$node.'>'."\n";
}

function format_for_mpd($term) {
    $term = str_replace('"','\\"',$term);
    return $term;
}

function format_for_disc($filename) {
    $filename = str_replace("\\","_",$filename);
    $filename = str_replace("/","_",$filename);
    $filename = str_replace("'","_",$filename);
    $filename = str_replace('"',"_",$filename);
    return $filename;
}

function open_mpd_connection() {
    global $prefs;
    global $connection;
    global $is_connected;
    $is_connected = false;
    if ($prefs['unix_socket'] != "") {
        $connection = fsockopen('unix://'.$prefs['unix_socket']);
    } else {
        $connection = fsockopen($prefs["mpd_host"], $prefs["mpd_port"], $errno, $errstr, 10);
    }

    if(isset($connection) && is_resource($connection)) {
        $is_connected = true;
        while(!feof($connection)) {
            $gt = fgets($connection, 1024);
            if(parse_mpd_var($gt))
                break;
        }
    }

    if ($prefs['mpd_password'] != "" && $is_connected) {
        $is_connected = false;
        fputs($connection, "password ".$prefs['mpd_password']."\n");
        while(!feof($connection)) {
            $gt = fgets($connection, 1024);
            $a = parse_mpd_var($gt);
            if($a === true) {
                $is_connected = true;
                break;
            } else if ($a == null) {

            } else {
                break;
            }
        }
    }
}

function getline($connection) {
    global $is_connected;
    if ($is_connected) {
        $got = trim(fgets($connection));
        if(strncmp("OK", $got, 2) == 0 || strncmp("ACK", $got, 3) == 0) {
            return false;
        }
        $key = trim(strtok($got, ":"));
        $val = trim(strtok("\0"));
        // Ignore 'directory' tags since we don't need them and therefore we don't need to make the parser handle them
        if ($val != '' && $val != null && $key != "directory") {
            return array($key, $val);
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function parse_mpd_var($in_str) {
    $got = trim($in_str);
    if(!isset($got))
        return null;
    if(strncmp("OK", $got,strlen("OK"))==0)
        return true;
    if(strncmp("ACK", $got,strlen("ACK"))==0) {
        debug_print("MPD command error : ".$got);
        return array(0 => false, 1 => $got);
    }
    $key = trim(strtok($got, ":"));
    $val = trim(strtok("\0"));
    return array(0 => $key, 1 => $val);
}

function do_mpd_command($conn, $command, $varname = null, $return_array = false) {

    global $is_connected;
    $retarr = array();
    if ($is_connected) {
    
        debug_print("MPD Command ".$command);
    
        $success = fputs($conn, $command."\n");
        if ($success) {
            while(!feof($conn)) {
                $var = parse_mpd_var(fgets($conn, 1024));
                if(isset($var)){
                    if($var === true && count($retarr) == 0) {
                        // Got an OK or ACK but no results
                        return true;
                    }
                    if($var === true) {
                        break;
                    }
                    if ($var[0] == false) {
                        if ($return_array == true) {
                            $retarr['error'] = $var[1];
                            debug_print("Setting Error Flag");
                        }
                        break;
                    }
                    if(isset($varname) && strcmp($var[0], $varname)) {
                        return $var[1];
                    } elseif($return_array == true) {
                        if(array_key_exists($var[0], $retarr)) {
                            if(is_array($retarr[($var[0])])) {
                                array_push($retarr[($var[0])], $var[1]);
                            } else {
                                $tmp = $retarr[($var[0])];
                                $retarr[($var[0])] = array($tmp, $var[1]);
                            }
                        } else {
                            $retarr[($var[0])] = $var[1];
                        }
                    }
                }
            }
        } else {
            $retarr['error'] = "There was an error communicating with MPD! (could not write to socket)";
        }
    }
    return $retarr;
}

function close_mpd($conn) {
    global $is_connected;
    if ($is_connected) {
        fclose($conn);
        $is_connected = false;
    }
}

function format_tracknum($tracknum) {
    $matches = array();
    if (preg_match('/^\s*0*(\d+)/', $tracknum, $matches)) {
        return $matches[1];
    }
    return '';
}

# url_get_contents function by Andy Langton: http://andylangton.co.uk/
function url_get_contents($url,$useragent='RompR Media Player/0.1',$headers=false,$follow_redirects=true,$debug=true) {

    // debug_print("Getting ".$url);
    # initialise the CURL library
    $ch = curl_init();

    # specify the URL to be retrieved
    curl_setopt($ch, CURLOPT_URL,$url);

    # we want to get the contents of the URL and store it in a variable
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);

    # specify the useragent: this is a required courtesy to site owners
    curl_setopt($ch, CURLOPT_USERAGENT, $useragent);

    # ignore SSL errors
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    
    # return headers as requested
    if ($headers==true){
        curl_setopt($ch, CURLOPT_HEADER,1);
    }

    # only return headers
    if ($headers=='headers only') {
        curl_setopt($ch, CURLOPT_NOBODY ,1);
    }

    # follow redirects - note this is disabled by default in most PHP installs from 4.4.4 up
    if ($follow_redirects==true) {
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    }

    $result['contents']=curl_exec($ch);
    $result['status'] = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    # if debugging, return an array with CURL's debug info and the URL contents
    if ($debug==true) {
        $result['info']=curl_getinfo($ch);
    }

    # free resources
    curl_close($ch);

    # send back the data
    return $result;
}

function format_time($t,$f=':') // t = seconds, f = separator 
{
    if (($t/86400) >= 1) {
        return sprintf("%d%s%2d%s%02d%s%02d", ($t/86400), " days ", ($t/3600)%24, $f, ($t/60)%60, $f, $t%60);
    }
    if (($t/3600) >= 1) {
        return sprintf("%2d%s%02d%s%02d", ($t/3600), $f, ($t/60)%60, $f, $t%60);
    } else {
        return sprintf("%02d%s%02d", ($t/60)%60, $f, $t%60);
    }
}

class collectionOutput {
    
    public function __construct($file) {
        $this->fname = $file;
        $this->fhandle = null;

        $xmlheaders = '<?xml version="1.0" encoding="utf-8"?>'."\n".
                        '<collection>'."\n".
                        '<artists>'."\n";

        if ($file != "") {
            $this->fhandle = fopen($file, 'w');
            fwrite($this->fhandle, $xmlheaders);
        } else {
            print $headers;
        }
    }
    
    public function writeLine($line) {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, $line);
        } else {
            print $line;
        }
    }
    
    public function closeFile() {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, "</artists>\n</collection>\n");
            fclose($this->fhandle);
        } else {
            print '</body></html>';
        }
    }
    
    public function dumpFile() {
        if ($this->fname != "") {
            // debug_print("Dumping Files List to ".$this->fname);
            $file = fopen($this->fname, 'r');
            while(!feof($file))
            {
                echo fgets($file);
            }
            fclose($file);
        }
    }

}

function munge_album_name($name) {
    $b = preg_replace('/\[.*?\]/', "", $name);              // Anything inside [  ]
    $b = preg_replace('/\(disc\s*\d+.*?\)/i', "", $b);      // (disc 1) or (disc 1 of 2) or (disc 1-2) etc
    $b = preg_replace('/\(*cd\s*\d+.*?\)*/i', "", $b);      // (cd 1) or (cd 1 of 2) etc
    $b = preg_replace('/\sdisc\s*\d+.*?$/i', "", $b);       //  disc 1 or disc 1 of 2 etc
    $b = preg_replace('/\scd\s*\d+.*?$/i', "", $b);         //  cd 1 or cd 1 of 2 etc
    $b = preg_replace('/\(\d+\s*of\s*\d+\)/i', "", $b);     // (1 of 2) or (1of2)
    $b = preg_replace('/\(\d+\s*-\s*\d+\)/i', "", $b);      // (1 - 2) or (1-2)
    $b = preg_replace('/\(Remastered\)/i', "", $b);         // (Remastered)
    $b = preg_replace('/\s+-\s*$/', "", $b);                // Chops any stray - off the end that could have been left by the previous
    return $b;
}

function getWhichXML($which) {
    global $ALBUMSLIST;
    global $ALBUMSEARCH;
    global $FILESLIST;
    global $FILESEARCH;
    if (substr($which,0,2) == "aa") {
        return $ALBUMSLIST;
    } else if (substr($which,0,2) == "ba") {
        return $ALBUMSEARCH;
    } else if (substr($which,0,2) == "ad") {
        return $FILESLIST;
    } else if (substr($which,0,2) == "bd") {
        return $FILESEARCH;
    } else {
        debug_print("ATTEMPTING TO LOOK FOR SOMETHING WE SHOULDN't BE!");
        return "";
    }

}

function findItem($x, $which) {
    global $ARTIST;
    global $ALBUM;
    $t = substr($which, 1, 3);
    if ($t == "art") {
        $it = $x->xpath("artists/artist[@id='".$which."']");
        return array($ARTIST, $it[0]);
    } else {
        $it = $x->xpath("artists/artist/albums/album[@id='".$which."']");
        return array($ALBUM, $it[0]);
    }
}

function findFileItem($x, $which) {
    $it = $x->xpath("//item[id='".$which."']");
    return $it[0];
}

function dumpAlbums($which) {
    global $divtype;
    global $ARTIST;
    global $ALBUM;
    $headers =  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'.
                '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">'.
                '<head>'.
                '<meta http-equiv="cache-control" content="max-age=0" />'.
                '<meta http-equiv="cache-control" content="no-cache" />'.
                '<meta http-equiv="expires" content="0" />'.
                '<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />'.
                '<meta http-equiv="pragma" content="no-cache" />'.
                '</head>'.
                '<body>';
    print $headers;
    $x = simplexml_load_file(getWhichXML($which));
    if ($which == 'aalbumroot' || $which == 'balbumroot') {
        print '<div><table width="100%" class="playlistitem"><tr><td align="left">';
        print $x->artists->numtracks . ' tracks</td><td align="right">Duration : ';
        print $x->artists->duration . '</td></tr></table></div>';
        foreach($x->artists->artist as $i => $artist) {
            artistHeader($artist);
            $divtype = ($divtype == "album1") ? "album2" : "album1";
        }
    } else {
        list ($type, $obj) = findItem($x, $which);
        if ($type == $ARTIST) {
            albumHeaders($obj);
        }
        if ($type == $ALBUM) {
            albumTracks($obj);
        }
        
    }

    print '</body></html>';
}

function artistHeader($artist) {
    global $divtype;
    print '<div class="noselection fullwidth '.$divtype.'">';
    if ($artist->spotilink) {
        print '<div class="clickable clicktrack draggable containerbox menuitem" name="'.$artist->spotilink.'">';
        print '<img src="images/toggle-closed.png" class="menu fixed" name="'.$artist['id'].'">';
        print '<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>';
        print '<div class="expand">'.$artist->name.'</div>';
        print '</div>';
    } else {
        print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$artist['id'].'">';
        print '<img src="images/toggle-closed.png" class="menu fixed" name="'.$artist['id'].'">';
        print '<div class="expand">'.$artist->name.'</div>';
        print '</div>';
    }
    // Create the drop-down div that will hold this artist's albums
    print '<div id="'.$artist['id'].'" class="dropmenu notfilled"></div>';
    print "</div>\n";

}

function albumHeaders($artist) {
    foreach($artist->albums->album as $i => $album) {
        if ($album->spotilink) {
            print '<div class="clickable clicktrack draggable containerbox menuitem" name="'.$album->spotilink.'">';
            print '<img src="images/toggle-closed.png" class="menu fixed" name="'.$album['id'].'">';
        } else {
            print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$album['id'].'">';
            print '<img src="images/toggle-closed.png" class="menu fixed" name="'.$album['id'].'">';
        }
        if ($album->image->romprartist) {
            print '<img class="smallcover fixed notexist" romprartist="'.$album->image->romprartist.'" rompralbum="'.$album->image->rompralbum.'" romprpath="'.$album->directory.'" name="'.$album->image->name.'" src="'.$album->image->src.'" />'."\n";
        } else {
            print '<img class="smallcover fixed" name="'.$album->image->name.'" src="'.$album->image->src.'" />';
        }
        if ($album->spotilink) {
            print '<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>';
        }
        
        print '<div class="expand">'.$album->name.'</div>';
        print '</div>';
        
        // Create the drop-down div that will hold this album's tracks
        print '<div id="'.$album['id'].'" class="dropmenu notfilled"></div>';

    }
}

function albumTracks($album) {
    $currdisc = -1;
    $count = 0;
    foreach($album->tracks->track as $i => $trackobj) {
        if ($album->numdiscs > 1) {
            if ($trackobj->disc && $trackobj->disc != $currdisc) {
                $currdisc = $trackobj->disc;
                print '<div class="discnumber indent">Disc '.$currdisc.'</div>';
            }
        }
        if ($trackobj->artist) {
            print '<div class="clickable clicktrack ninesix draggable indent containerbox vertical padright" name="'.$trackobj->url.'">';
            print '<div class="containerbox line">';
        } else {
            print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.$trackobj->url.'">';
        }
        print '<div class="tracknumber fixed">'.$trackobj->number.'</div>';
        if (substr($trackobj->url,0,strlen('spotify')) == "spotify") {
            print '<div class="playlisticon fixed"><img height="12px" src="images/spotify-logo.png" /></div>';
        }
        print '<div class="expand">'.$trackobj->name.'</div>';
        print '<div class="fixed playlistrow2">'.$trackobj->duration.'</div>';
        if ($trackobj->artist) {
            print '</div><div class="containerbox line">';
            print '<div class="tracknumber fixed"></div>';
            print '<div class="expand playlistrow2">'.$trackobj->artist.'</div>';
            print '</div>';
        }
        print '</div>';
        $count++;
    }
    if ($count == 0) {
        print '<div class="playlistrow2" style="padding-left:64px">No Individual Tracks Returned By Search</div>';
    }

}

function get_base_url() {

    // I found this function on CleverLogic:
    // http://www.cleverlogic.net/tutorials/how-dynamically-get-your-sites-main-or-base-url

    /* First we need to get the protocol the website is using */
    $protocol = strtolower(substr($_SERVER["SERVER_PROTOCOL"], 0, 5)) == 'https://' ? 'https://' : 'http://';

    /* returns /myproject/index.php */
    $path = $_SERVER['PHP_SELF'];

    /*
     * returns an array with:
     * Array (
     *  [dirname] => /myproject/
     *  [basename] => index.php
     *  [extension] => php
     *  [filename] => index
     * )
     */
    $path_parts = pathinfo($path);
    $directory = $path_parts['dirname'];
    /*
     * If we are visiting a page off the base URL, the dirname would just be a "/",
     * If it is, we would want to remove this
     */
    $directory = ($directory == "/") ? "" : $directory;

    /* Returns localhost OR mysite.com */
    $host = $_SERVER['HTTP_HOST'];

    /*
     * Returns:
     * http://localhost/mysite
     * OR
     * https://mysite.com
     */
    return $protocol . $host . $directory;
}

function scan_for_images($albumpath) {
    $result = array();
    if (is_dir("prefs/MusicFolders")) {
        $albumpath = munge_filepath($albumpath);
        $result = array_merge($result, get_images($albumpath));
        // Is the album dir part of a multi-disc set?
        if (preg_match('/^CD\s*\d+$|^disc\s*\d+$/i', basename($albumpath))) {
            $albumpath = dirname($albumpath);
            $result = array_merge($result, get_images($albumpath));
        }
        // Are there any subdirectories?
        $globpath = preg_replace('/(\*|\?|\[)/', '[$1]', $albumpath);
        $lookfor = glob($globpath."/*", GLOB_ONLYDIR);
        foreach ($lookfor as $i => $f) {
            if (is_dir($f)) {
                $result = array_merge($result, get_images($f));
            }
        }
    }
    return $result;
}

function get_images($dir_path) {

    $funkychicken = array();
    debug_print("Scanning : ".$dir_path);
    $globpath = preg_replace('/(\*|\?|\[)/', '[$1]', $dir_path);
    $files = glob($globpath."/*.{jpg,png,bmp,gif,jpeg,JPEG,JPG,BMP,GIF,PNG}", GLOB_BRACE);
    foreach($files as $i => $f) {
        $f = preg_replace('/%/', '%25', $f);
        array_push($funkychicken, get_base_url()."/".preg_replace('/ /', "%20", $f));
    }
    return $funkychicken;
}

function munge_filepath($p) {
    global $prefs;
    $p = rawurldecode(html_entity_decode($p));
    $f = "file://".$prefs['music_directory'];
    if (substr($p, 0, strlen($f)) == $f) {
        $p = substr($p, strlen($f), strlen($p));
    }
    return "prefs/MusicFolders/".$p;
}

?>
