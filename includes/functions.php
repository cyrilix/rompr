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


function format_tracknum($tracknum) {
    $matches = array();
    if (preg_match('/^\s*0*(\d+)/', $tracknum, $matches)) {
        return $matches[1];
    }
    if (preg_match('/0*(\d+) of \d+/i', $tracknum, $matches)) {
        return $matches[1];
    }
    // if (preg_match('/0*(\d+)\..*?$/', $tracknum, $matches)) {
    //     return $matches[1];
    // }
    return '';
}

# url_get_contents function by Andy Langton: http://andylangton.co.uk/
function url_get_contents($url,$useragent='RompR Music Player/0.41',$headers=false,$follow_redirects=true,$debug=false,$fp=null) {

    global $prefs;
    # initialise the CURL library
    $ch = curl_init();
    # specify the URL to be retrieved
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_ENCODING , "");
    if ($fp === null) {
        # we want to get the contents of the URL and store it in a variable
        curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
    } else {
        curl_setopt($ch, CURLOPT_FILE, $fp);
    }
    # specify the useragent: this is a required courtesy to site owners
    curl_setopt($ch, CURLOPT_USERAGENT, $useragent);
    # ignore SSL errors
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    if ($prefs['proxy_host'] != "") {
        curl_setopt($ch, CURLOPT_PROXY, $prefs['proxy_host']);
    }
    if ($prefs['proxy_user'] != "" && $prefs['proxy_password'] != "") {
        curl_setopt($ch, CURLOPT_PROXYUSERPWD, $prefs['proxy_user'].':'.$prefs['proxy_password']);
    }

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

    if ($fp === null) {
        $result['contents']=curl_exec($ch);
    } else {
        curl_exec($ch);
    }
    $result['status'] = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    $result['content-type'] = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
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
        return sprintf("%d%s%2d%s%02d%s%02d", ($t/86400), " ".get_int_text("label_days")." ", ($t/3600)%24, $f, ($t/60)%60, $f, $t%60);
    }
    if (($t/3600) >= 1) {
        return sprintf("%2d%s%02d%s%02d", ($t/3600), $f, ($t/60)%60, $f, $t%60);
    } else {
        return sprintf("%02d%s%02d", ($t/60)%60, $f, $t%60);
    }
}

function format_time2($t,$f=':') // t = seconds, f = separator
{
    if (($t/86400) >= 1) {
        return sprintf("%d%s", ($t/86400), " ".get_int_text("label_days"));
    }
    if (($t/3600) >= 1) {
        return sprintf("%d%s", ($t/3600), " ".get_int_text("label_hours"));
    } else {
        return sprintf("%d%s", ($t/60)%60, " ".get_int_text("label_minutes"));
    }
}

function munge_album_name($name) {
    $b = preg_replace('/(\(|\[)disc\s*\d+.*?(\)|\])/i', "", $name);     // (disc 1) or (disc 1 of 2) or (disc 1-2) etc (or with [ ])
    $b = preg_replace('/(\(|\[)*cd\s*\d+.*?(\)|\])*/i', "", $b);        // (cd 1) or (cd 1 of 2) etc (or with [ ])
    $b = preg_replace('/\sdisc\s*\d+.*?$/i', "", $b);                   //  disc 1 or disc 1 of 2 etc
    $b = preg_replace('/\scd\s*\d+.*?$/i', "", $b);                     //  cd 1 or cd 1 of 2 etc
    $b = preg_replace('/(\(|\[)\d+\s*of\s*\d+(\)|\])/i', "", $b);       // (1 of 2) or (1of2) (or with [ ])
    $b = preg_replace('/(\(|\[)\d+\s*-\s*\d+(\)|\])/i', "", $b);        // (1 - 2) or (1-2) (or with [ ])
    $b = preg_replace('/(\(|\[)Remastered(\)|\])/i', "", $b);           // (Remastered) (or with [ ])
    $b = preg_replace('/(\(|\[).*?bonus .*(\)|\])/i', "", $b);      // (With Bonus Tracks) (or with [ ])
    $b = preg_replace('/\s+-\s*$/', "", $b);                            // Chops any stray - off the end that could have been left by the previous
    $b = preg_replace('#\s+$#', '', $b);
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function really_munge_album_name($name) {
    $b = preg_replace('/\[.*?\]/', "", $name);                  // Anything inside [  ]
    $b = preg_replace('/\(.*?\)/', "", $b);                     // Anything inside (  )
    $b = preg_replace('/\d\d\d\d(-|–)\d\d-\d\d/', "", $b);          // A date, US format
    $b = preg_replace('/\d\d-\d\d(-|–)\d\d\d\d/', "", $b);          // A date, UK format
    $b = preg_replace('/\d\d\d\d\s*(-|–)\s*\d\d\d\d/', "", $b);               // A year range
    $b = preg_replace('/\d\d\d\d\s*(-|–)\s*\d\d/', "", $b);               // A year range
    $b = preg_replace('/\d\d\s*(-|–)\s*\d\d\d\d/', "", $b);               // A year range
    $b = preg_replace('/\d\d\s*(-|–)\s*\d\d/', "", $b);               // A year range
    $b = preg_replace('/\d\d\d\d/', "", $b);                    // A year
    $b = preg_replace('/\s+-\s*$/', "", $b);                    // Chops any stray - off the end that could have been left by the previous
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function remove_punctuation($name) {
    $b = preg_replace('# / #', '/', $name);
    $b = preg_replace('#\!|\$|\%|\*|-|_|=|\+|\;|:|\'|"|,|\.+|<|>|\?|\\\|/|•|&|’|\)|\(| and|…|‐|\#|“|”|–#i', '', $b);
    $b = preg_replace('#\s+#', ' ', $b);
    $b = preg_replace('#\s+$#', '', $b);
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function remove_some_stuff($name) {
    $b = preg_replace('# \w+? Edition$#i', '', $name);
    $b = preg_replace('#\s+$#', '', $b);
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function noDefiniteArticles($name) {
    $b = preg_replace('/the |, the/i', '', $name);
    $b = preg_replace('#\s+#', ' ', $b);
    $b = preg_replace('#\s+$#', '', $b);
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function sanitsizeDiscogsResult($name) {
    $b = preg_replace('/\* /',' ', $name);
    return $b;
}

function deJazzify($name) {
    $b = preg_replace('/ quintet| quartet| trio| sextet/i', '', $name);
    return $b;
}

function normalizeChars($s) {
    $replace = array(
        'À'=>'A', 'Á'=>'A', 'Â'=>'A', 'Ã'=>'A', 'Ä'=>'Ae', 'Å'=>'A', 'Æ'=>'A', 'Ă'=>'A',
        'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'ae', 'å'=>'a', 'ă'=>'a', 'æ'=>'ae',
        'þ'=>'b', 'Þ'=>'B',
        'Ç'=>'C', 'ç'=>'c',
        'È'=>'E', 'É'=>'E', 'Ê'=>'E', 'Ë'=>'E',
        'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e',
        'Ğ'=>'G', 'ğ'=>'g',
        'Ì'=>'I', 'Í'=>'I', 'Î'=>'I', 'Ï'=>'I', 'İ'=>'I', 'ı'=>'i', 'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i',
        'Ñ'=>'N', 'ń'=>'n',
        'Ò'=>'O', 'Ó'=>'O', 'Ô'=>'O', 'Õ'=>'O', 'Ö'=>'Oe', 'Ø'=>'O', 'ö'=>'oe', 'ø'=>'o',
        'ð'=>'o', 'ñ'=>'n', 'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o',
        'Š'=>'S', 'š'=>'s', 'Ş'=>'S', 'ș'=>'s', 'Ș'=>'S', 'ş'=>'s', 'ß'=>'ss',
        'ț'=>'t', 'Ț'=>'T',
        'Ù'=>'U', 'Ú'=>'U', 'Û'=>'U', 'Ü'=>'Ue',
        'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ü'=>'ue',
        'Ý'=>'Y',
        'ý'=>'y', 'ý'=>'y', 'ÿ'=>'y',
        'Ž'=>'Z', 'ž'=>'z'
    );
    return strtr($s, $replace);
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

function alistheader($nart, $nalb, $ntra, $tim) {
    return '<div style="margin-bottom:4px">'.
    '<table width="100%" class="playlistitem">'.
    '<tr><td align="left">'.$nart.' '.get_int_text("label_artists").'</td><td align="right">'.$nalb.' '.get_int_text("label_albums").'</td></tr>'.
    '<tr><td align="left">'.$ntra.' '.get_int_text("label_tracks").'</td><td align="right">'.$tim.'</td></tr>'.
    '</table>'.
    '</div>';
}

function albumTrack($artist, $rating, $url, $numtracks, $number, $name, $duration, $lm, $image = "") {
    if ($artist || $rating > 0 || $lm === null) {
        print '<div class="clickable clicktrack ninesix draggable indent containerbox vertical padright" name="'.$url.'">';
        print '<div class="containerbox line">';
    } else {
        print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.$url.'">';
    }
    print '<div class="tracknumber fixed"';
    if ($numtracks > 99 || $number > 99) {
        print ' style="width:3em"';
    }
    if ($number > 0) {
        print '>'.$number.'</div>';
    } else {
        print '></div>';
    }
    if (substr($url,0,7) == "spotify") {
        print '<div class="playlisticon fixed"><img height="12px" src="newimages/spotify-logo.png" /></div>';
    } else if (substr($url,0,10) == "soundcloud") {
        if ($image !== "") {
            print '<div class="smallcover fixed">';
            print '<img class="smallcover fixed" src="'.$image.'" />';
            print '</div>';
        }
        print '<div class="playlisticon fixed"><img height="12px" src="newimages/soundcloud-logo.png" /></div>';
    } else if (substr($url,0,6) == "gmusic") {
        print '<div class="playlisticon fixed"><img height="12px" src="newimages/play-logo.png" /></div>';
    } else if (substr($url,0,7) == "youtube") {
        if ($image !== "") {
            print '<div class="smallcover fixed">';
            print '<img class="smallcover fixed" src="'.$image.'" />';
            print '</div>';
        }
        print '<div class="playlisticon fixed"><img height="12px" src="newimages/Youtube-logo.png" /></div>';
    }
    print '<div class="expand">'.$name.'</div>';
    print '<div class="fixed playlistrow2">'.$duration.'</div>';
    if ($artist) {
        print '</div><div class="containerbox line">';
        print '<div class="tracknumber fixed"></div>';
        print '<div class="expand playlistrow2">'.$artist.'</div>';
        print '</div>';
    }
    if ($rating > 0 || $lm === null) {
        if (!$artist) {
            print '</div>';
        }
        print '<div class="containerbox line"><div class="tracknumber fixed"></div><div class="expand playlistrow2">';
        if ($rating > 0) {
            print '<img height="12px" src="newimages/'.trim($rating).'stars.png" />';
        }
        print '</div>';
        if ($lm === null) {
            print '<div class="playlisticon fixed clickable clickicon clickremdb"><img height="12px" src="newimages/edit-delete.png" /></div>';
        }
        print '</div>';
    }
    print '</div>';

}

function noAlbumTracks() {
    print '<div class="playlistrow2" style="padding-left:64px">'.get_int_text("label_notracks").'</div>';
}

function artistHeader($id, $spotilink, $name) {
    global $divtype;
    print '<div class="noselection fullwidth '.$divtype.'">';
    if ($spotilink) {
        print '<div class="clickable clicktrack draggable containerbox menuitem" name="'.$spotilink.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$id.'"></div>';
        if (preg_match('/^spotify/', $spotilink)) {
            print '<div class="playlisticon fixed"><img height="12px" src="newimages/spotify-logo.png" /></div>';
            print '<input type="hidden" value="needsfiltering" />';
        } else if (preg_match('/^gmusic/', $spotilink)) {
            print '<div class="playlisticon fixed"><img height="12px" src="newimages/play-logo.png" /></div>';
        }
        print '<div class="expand saname">'.$name.'</div>';
        print '</div>';
    } else {
        print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$id.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$id.'"></div>';
        print '<div class="expand">'.$name.'</div>';
        print '</div>';
    }
    // Create the drop-down div that will hold this artist's albums
    print '<div id="'.$id.'" class="dropmenu notfilled"></div>';
    print "</div>\n";

}

function noAlbumsHeader() {
    print '<div class="playlistrow2" style="padding-left:64px">'.get_int_text("label_noalbums").'</div>';
}

function albumHeader($name, $spotilink, $id, $isonefile, $exists, $searched, $imgname, $src, $date) {
    global $prefs;
    if ($spotilink) {
        print '<div class="clickable clicktrack draggable containerbox menuitem" name="'.$spotilink.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$id.'"></div>';
    } else if ($isonefile) {
        print '<div class="clickable clickalbum onefile draggable containerbox menuitem" name="'.$id.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$id.'"></div>';
    } else {
        print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$id.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$id.'"></div>';
    }
    // For BLOODY FIREFOX only we have to wrap the image in a div of the same size,
    // because firefox won't squash the image horizontally if it's in a box-flex layout.
    print '<div class="smallcover fixed">';
    if ($exists == "no" && $searched == "no") {
        print '<img class="smallcover fixed notexist" name="'.$imgname.'" src="newimages/album-unknown-small.png" />'."\n";
    } else  if ($exists == "no" && $searched == "yes") {
        print '<img class="smallcover fixed notfound" name="'.$imgname.'" src="newimages/album-unknown-small.png" />'."\n";
    } else {
        print '<img class="smallcover fixed" name="'.$imgname.'" src="'.$src.'" />'."\n";
    }
    print '</div>';
    if ($spotilink) {
        if (preg_match('/^spotify/', $spotilink)) {
            print '<div class="playlisticon fixed"><img height="12px" src="newimages/spotify-logo.png" /></div>';
        } else if (preg_match('/^gmusic/', $spotilink)) {
            print '<div class="playlisticon fixed"><img height="12px" src="newimages/play-logo.png" /></div>';
        }
    }

    print '<div class="expand">'.$name;
    if ($date && $date != "" && $prefs['sortbydate'] == "true") {
        print ' <span class="notbold">('.$date.')</span>';
    }
    print '</div></div>';

    // Create the drop-down div that will hold this album's tracks
    print '<div id="'.$id.'" class="dropmenu notfilled"></div>';
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
    debug_print("    Scanning : ".$dir_path,"GET_IMAGES");
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
    $f = "file://".$prefs['music_directory_albumart'];
    if (substr($p, 0, strlen($f)) == $f) {
        $p = substr($p, strlen($f), strlen($p));
    }
    return "prefs/MusicFolders/".$p;
}

function find_executable($prog) {

    // Test to see if $prog is on the path and adjust if not - this makes
    // it work on MacOSX when everything's installed from MacPorts
    $c = "";
    $a = 1;
    $o = array();
    $r = exec($prog." 2>&1", $o, $a);
    if ($a == 127) {
        $c = "/opt/local/bin/";
        $a = 1;
        $o = array();
        $r = exec("/opt/local/bin/".$prog." 2>&1", $o, $a);
        if ($a == 127) {
            // Last resort, we'll assume it's a Homebrew installation
            $c = "PATH=/usr/local/bin:\$PATH PYTHONPATH=/usr/local/lib/python2.7/site-packages /usr/local/bin/";
        }
    }
    debug_print("  Executable path is ".$c);
    return $c;

}

function get_file_lock($filename) {
    global $fp;
    $fp = fopen($filename, 'r+');
    if ($fp) {
        $crap = true;
        if (flock($fp, LOCK_EX, $crap)) {
            return true;
        } else {
            debug_print("FAILED TO GET FILE LOCK ON ".$filename,"FUNCTIONS");
        }
    } else {
        debug_print("FAILED TO OPEN ".$filename,"FUNCTIONS");
    }
    return false;
}

function release_file_lock() {
    global $fp;
    flock($fp, LOCK_UN);
    fclose($fp);
}

function clean_cache_dir($dir, $time) {

    debug_print("Cache Cleaner is running on ".$dir,"CACHE CLEANER");
    $cache = glob($dir."*");
    $now = time();
    foreach($cache as $file) {
        if($now - filemtime($file) > $time) {
            debug_print("Removing file ".$file,"CACHE CLEANER");
            @unlink ($file);
        }
    }

}

function detect_mopidy() {
    // Let's see if we can retreieve the mopidy HTTP API
    // If we can, then we will use it and the user doesn't have to
    // configure everything (many users were unaware that this existed)
    global $prefs;
    debug_print("Checking to see if we can find mopidy","INIT");
    // SERVER_ADDR reflects the address typed into the browser
    debug_print("Server Address is ".$_SERVER['SERVER_ADDR'],"INIT");
    // REMOTE_ADDR is the address of the machine running the browser
    debug_print("Remote Address is ".$_SERVER['REMOTE_ADDR'],"INIT");

    // Our default setting for mpd_host is 'localhost'. This is relative to Apache and therefore not to the browser
    // if the browser is on another machine
    debug_print("mpd host is ".$prefs['mpd_host'],"INIT");
    if ($prefs['mpd_host'] == "localhost" || $prefs['mpd_host'] == "127.0.0.1") {
        if ($_SERVER['SERVER_ADDR'] != $_SERVER['REMOTE_ADDR']) {
            debug_print("Browser is on a different PC from the Apache server");
            if (check_mopidy_http($_SERVER['SERVER_ADDR'])) {
                $prefs['mopidy_http_address'] = $_SERVER['SERVER_ADDR'];
                return true;
            }
        } else {
            debug_print("Browser is on the same PC as the Apache server","INIT");
            // Therefore, the mpd/mopidy server must be on that PC too
            if (check_mopidy_http($prefs['mpd_host'])) {
                $prefs['mopidy_http_address'] = $prefs['mpd_host'];
                return true;
            } else if ($_SERVER['SERVER_ADDR'] != "::1") {
                if (check_mopidy_http($_SERVER['SERVER_ADDR'])) {
                    $prefs['mopidy_http_address'] = $_SERVER['SERVER_ADDR'];
                    return true;
                }
            }
        }
    } else {
        // In this case, the user has set mpd_host to an IP address, therefore that's
        // all we need to test
        if (check_mopidy_http($prefs['mpd_host'])) {
            $prefs['mopidy_http_address'] = $prefs['mpd_host'];
            return true;
        }
    }
    debug_print("Failed to load Mopidy HTTP API","INIT");
    return false;

}

function check_mopidy_http($addr) {
    global $prefs;
    debug_print("Checking for mopidy HTTP API at http://".$addr.':'.$prefs['mopidy_http_port'].'/mopidy/mopidy.min.js', "INIT");
    $result = url_get_contents('http://'.$addr.':'.$prefs['mopidy_http_port'].'/mopidy/mopidy.min.js');
    if ($result['status'] == "200") {
        debug_print("Mopidy HTTP API success","INIT");
        return true;
    } else {
        debug_print("Failed to get Mopidy HTTP API","INIT");
        return false;
    }
}

function get_browser_language() {
    // TODO - this method is not good enough.
    debug_print("Browser Language is ".$_SERVER['HTTP_ACCEPT_LANGUAGE'],"INTERNATIONAL");
    return substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
}

function getDomain($d) {
    // Note: for tracks being played via Mopidy-Beets, this will return 'http'
    // This is why, for streams, I set the domain to be the same as the type field.
    $a = substr($d,0,strpos($d, ":"));
    if ($a == "") {
        $a = "local";
    }
    return $a;
}

function askForMpdValues($title) {
    global $prefs;
print '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<link rel="stylesheet" type="text/css" href="themes/Darkness.css" />
</head>
<body style="padding:8px;overflow-y:auto">
    <div class="bordered simar dingleberry" style="max-width:40em">
    <h3>';
print $title;
print '</h3>';
print '<p>'.get_int_text("setup_labeladdresses").'</p>';
print '<p class="tiny">'.get_int_text("setup_addressnote").'</p>';
print '<form name="mpdetails" action="index.php" method="post">';
print '<p>'.get_int_text("setup_ipaddress").'<br><input type="text" class="winkle" name="mpd_host" value="'.$prefs['mpd_host'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_port").'<br><input type="text" class="winkle" name="mpd_port" value="'.$prefs['mpd_port'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_advanced").'</h3>';
print '<p>'.get_int_text("setup_leaveblank").'</p>';
print '<p>'.get_int_text("setup_password").'<br><input type="text" class="winkle" name="mpd_password" value="'.$prefs['mpd_password'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_unixsocket").'</p>';
print '<input type="text" class="winkle" name="unix_socket" value="'.$prefs['unix_socket'].'" /></p>';
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_mopidy").'</h3>';
print '<p>'.get_int_text("setup_mopidyport").'<br><input type="text" class="winkle" name="mopidy_http_port" value="'.$prefs['mopidy_http_port'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>MySQL Server Settings</h3>';
print '<p>Server<br><input type="text" class="winkle" name="mysql_host" value="'.$prefs['mysql_host'].'" /></p>'."\n";
print '<p>Port<br><input type="text" class="winkle" name="mysql_port" value="'.$prefs['mysql_port'].'" /></p>'."\n";
print '<p>Username<br><input type="text" class="winkle" name="mysql_user" value="'.$prefs['mysql_user'].'" /></p>'."\n";
print '<p>Password<br><input type="text" class="winkle" name="mysql_password" value="'.$prefs['mysql_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>Proxy Settings</h3>';
print '<p>Proxy Server (eg 192.168.3.4:8800)<br><input type="text" class="winkle" name="proxy_host" value="'.$prefs['proxy_host'].'" /></p>'."\n";
print '<p>Proxy Username<br><input type="text" class="winkle" name="proxy_user" value="'.$prefs['proxy_user'].'" /></p>'."\n";
print '<p>Proxy Password<br><input type="text" class="winkle" name="proxy_password" value="'.$prefs['proxy_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<p><input type="checkbox" name="debug_enabled" value="1"';
if ($prefs['debug_enabled'] == 1) {
    print " checked";
}
print '>'.get_int_text("setup_debug").'</input></p>';

print'        <p><input type="submit" class="winkle" value="OK" /></p>
    </form>
    </div>
</body>
</html>';
print "\n";
}

function update_stream_playlist($url, $name, $image="newimages/broadcast.png", $creator = "", $title = "", $type = "stream") {
    $file = "";
    $found = false;
    $x = null;

    $playlists = glob("prefs/*STREAM*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url && preg_match('/Unknown Internet Stream/', $track->album)) {
                debug_print("Found Stream To Update! - ".$file,"RADIO PLAYLISTS");
                $track->album = $name;
                $fp = fopen($file, 'w');
                if ($fp) {
                  fwrite($fp, $x->asXML());
                }
                fclose($fp);
                $found = true;
                break;
            }
        }
        if ($found) {
            break;
        }
    }

    if (!$found) {
        $xml = '<?xml version="1.0" encoding="utf-8"?>'.
            "<playlist>\n".
            "<playlisturl></playlisturl>\n".
            "<addedbyrompr>false</addedbyrompr>\n".
            "<trackList>\n".
            "<track>\n".
            xmlnode('album', $name).
            xmlnode('image', $image).
            xmlnode('creator', $creator).
            xmlnode('title', $title).
            xmlnode('stream', $title).
            xmlnode('type', $type).
            xmlnode('location', $url).
            "</track>\n".
            "</trackList>\n".
            "</playlist>";

        debug_print("Creating new playlist for stream ".$url);

        $fp = fopen('prefs/STREAM_'.md5($url).'.xspf', 'w');
        if ($fp) {
          fwrite($fp, $xml);
        }
        fclose($fp);
    }
}

?>
