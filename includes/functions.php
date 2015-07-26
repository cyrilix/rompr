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
    return '';
}

# url_get_contents function by Andy Langton: http://andylangton.co.uk/
function url_get_contents($url,$useragent='RompR Music Player/0.70',
    $headers=false,$follow_redirects=true,$debug=false,$fp=null) {

    global $prefs;
    $url = preg_replace('/ /', '%20', $url);
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
        return sprintf("%d%s%2d%s%02d%s%02d", ($t/86400), " ".get_int_text("label_days")." ",
            ($t/3600)%24, $f, ($t/60)%60, $f, $t%60);
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
    $b = preg_replace('/(\(|\[).*?bonus .*(\)|\])/i', "", $b);          // (With Bonus Tracks) (or with [ ])
    $b = preg_replace('/\s+-\s*$/', "", $b);                            // Chops any stray - off the end that could have been left by the previous
    $b = preg_replace('#\s+$#', '', $b);
    $b = preg_replace('#^\s+#', '', $b);
    return $b;
}

function sanitsizeDiscogsResult($name) {
    $b = preg_replace('/\* /',' ', $name);
    return $b;
}

function alistheader($nart, $nalb, $ntra, $tim) {
    return '<div style="margin-bottom:4px">'.
    '<table width="100%" class="playlistitem">'.
    '<tr><td align="left">'.$nart.' '.get_int_text("label_artists").
    '</td><td align="right">'.$nalb.' '.get_int_text("label_albums").'</td></tr>'.
    '<tr><td align="left">'.$ntra.' '.get_int_text("label_tracks").
    '</td><td align="right">'.$tim.'</td></tr>'.
    '</table>'.
    '</div>';
}

function albumTrack($artist, $rating, $url, $numtracks, $number, $name, $duration, $lm, $image) {
    global $prefs;
    if (substr($name,0,6) == "Album:") return true;
    if (substr($name,0,7) == "Artist:") return true;

    $d = getDomain($url);

    if ($prefs['player_backend'] == "mpd" && $d == "soundcloud") {
        $class = 'clickcue';
    } else {
        $class = 'clicktrack';
    }

    if ($image) {
        $class .= ' line';
    }

    // Outer container
    print '<div class="clickable '.$class.' ninesix draggable indent containerbox padright"
    name="'.$url.'">';

    // Track Number
    if ($number && $number != "" && $number > 0) {
        print '<div class="tracknumber fixed"';
        if ($numtracks > 99 || $number > 99) {
            print ' style="width:3em"';
        }
        print '>'.$number.'</div>';
    } else if ($image) {
        print '<div class="smallspacer fixed"></div>';
    }
    
    // Track Image and Backend Image
    switch ($d) {
        case "soundcloud":
        case "youtube":
            if ($image) {
                print '<div class="smallcover fixed">';
                print '<img class="smallcover fixed';
                print '" src="'.$image.'" />';
                print '</div>';
            }
            print '<i class="icon-'.$d.'-circled playlisticon fixed"></i>';
            break;

        case "spotify":
        case "gmusic":
            print '<i class="icon-'.$d.'-circled playlisticon fixed"></i>';
            break;
    }

    // Track Title, Artist, and Rating
    if ((string) $name == "") $name = urldecode($url);
    print '<div class="expand containerbox vertical">';
    print '<div class="fixed">'.$name.'</div>';
    if ($artist) {
        print '<div class="fixed playlistrow2">'.$artist.'</div>';
    }
    if ($rating > 0) {
        print '<div class="fixed playlistrow2">';
        print '<i class="icon-'.trim($rating).'-stars rating-icon-small"></i>';
        print '</div>';
    }
    print '</div>';

    // Track Duration
    print '<div class="fixed playlistrow2 tracktime">';
    if ($duration > 0) {
        print format_time($duration);
    }
    print '</div>';

    // Delete Button
    if ($lm === null) {
        print '<i class="icon-cancel-circled playlisticonr fixed clickable clickicon clickremdb"></i>';
    }

    print '</div>';
}

function artistHeader($id, $albumuri, $name, $numalbums = null) {
    global $divtype;
    if ($albumuri) {
        print '<div class="clickable clicktrack draggable containerbox menuitem'.$divtype.
            '" name="'.$albumuri.'">';
        print '<i class="icon-toggle-closed menu mh fixed" name="'.$id.'"></i>';
        $d = getDomain($albumuri);
        $d = preg_replace('/\+.*/','', $d);
        switch ($d) {
            case "spotify":
            case "gmusic":
            case "podcast":
            case "internetarchive":
                print '<i class="icon-'.$d.'-circled fixed playlisticon"></i>';
                break;

        }
        print '<div class="expand saname">'.$name.'</div>';
        print '</div>';
    } else {
        print '<div class="clickable clickalbum draggable containerbox menuitem '.
            $divtype.'" name="'.$id.'">';
        print '<i class="icon-toggle-closed menu mh fixed" name="'.$id.'"></i>';
        print '<div class="expand">'.$name.'</div>';
        print '</div>';
    }
}

function noAlbumsHeader() {
    print '<div class="playlistrow2" style="padding-left:64px">'.
        get_int_text("label_noalbums").'</div>';
}

function albumHeader($name, $albumuri, $id, $exists, $searched, $imgname, $src,
    $date, $numtracks = null, $aname = null) {
    
    global $prefs;
    if ($albumuri) {
        if (preg_match('/spotify%3Aartist%3A/', $albumuri)) {
            print '<div class="clickable clickartist draggable containerbox menuitem" name="'.
                preg_replace('/'.get_int_text('label_allartist').'/', '', $name).'">';
        } else if (strtolower(pathinfo($albumuri, PATHINFO_EXTENSION)) == "cue") {
            debuglog("Cue Sheet found for album ".$name,"FUNCTIONS");
            print '<div class="clickable clickcue draggable containerbox menuitem" name="'
                .$albumuri.'">';
        } else {
            print '<div class="clickable clicktrack draggable containerbox menuitem" name="'
                .$albumuri.'">';
        }
    } else {
        print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$id.'">';
    }
    print '<i class="icon-toggle-closed menu mh fixed" name="'.$id.'"></i>';

    // For BLOODY FIREFOX only we have to wrap the image in a div of the same size,
    // because firefox won't squash the image horizontally if it's in a box-flex layout.
    print '<div class="smallcover fixed">';
    if ($exists == "no" && $searched == "no") {
        print '<img class="smallcover fixed notexist" name="'.$imgname.'" />'."\n";
    } else  if ($exists == "no" && $searched == "yes") {
        print '<img class="smallcover fixed notfound" name="'.$imgname.'" />'."\n";
    } else {
        print '<img class="smallcover fixed" name="'.$imgname.'" src="'.$src.'" />'."\n";
    }
    print '</div>';
    if ($albumuri) {
        $d = getDomain($albumuri);
        $d = preg_replace('/\+.*/','', $d);
        switch($d) {
            case "spotify":
            case "gmusic":
            case "youtube":
            case "soundcloud":
            case "internetarchive":
                print '<i class="icon-'.$d.'-circled playlisticon fixed"></i>';
                break;

            case "podcast":
            case "podcast http":
            case "podcast ftp":
            case "podcast file":
                print '<i class="icon-podcast-circled playlisticon fixed"></i>';
                break;

            case "tunein":
            case "radio-de":
            case "dirble":
            case "bassdrive":
                print '<div class="playlisticon fixed"><img height="12px" src="newimages/'.
                    $d.'-logo.png" /></div>';
                break;
        }
        if (strtolower(pathinfo($albumuri, PATHINFO_EXTENSION)) == "cue") {
            print '<i class="icon-doc-text playlisticon fixed"></i>';
        }
    }

    print '<div class="expand">'.$name;
    if ($date && $date != "" && $prefs['sortbydate']) {
        print ' <span class="notbold">('.$date.')</span>';
    }
    if ($aname) {
        print '<br><span class="notbold">'.$aname.'</span>';
    }
    print '</div></div>';
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
    $directory = preg_replace('#/utils$#', '', $directory);
    $directory = preg_replace('#/streamplugins$#', '', $directory);
    return $protocol . $host . $directory;
}

function scan_for_images($albumpath) {
    debuglog("Album Path Is ".$albumpath, "LOCAL IMAGE SCAN");
    $result = array();
    if (is_dir("prefs/MusicFolders") && $albumpath != ".") {
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
    $a = basename($dir_path);
    debuglog("    Scanning : ".$dir_path,"GET_IMAGES");
    $globpath = preg_replace('/(\*|\?|\[)/', '[$1]', $dir_path);
    debuglog("      Glob Path is ".$globpath,"GET_IMAGES");
    $files = glob($globpath."/*.{jpg,png,bmp,gif,jpeg,JPEG,JPG,BMP,GIF,PNG}", GLOB_BRACE);
    foreach($files as $i => $f) {
        $f = preg_replace('/%/', '%25', $f);
        debuglog("        Found : ".get_base_url()."/".preg_replace('/ /', "%20", $f),"GET_IMAGES");
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
    // debuglog("  Executable path is ".$c);
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
            debuglog("FAILED TO GET FILE LOCK ON ".$filename,"FUNCTIONS");
        }
    } else {
        debuglog("FAILED TO OPEN ".$filename,"FUNCTIONS");
    }
    return false;
}

function release_file_lock() {
    global $fp;
    flock($fp, LOCK_UN);
    fclose($fp);
}

function get_browser_language() {
    // TODO - this method is not good enough.
    if (array_key_exists('HTTP_ACCEPT_LANGUAGE', $_SERVER)) {
        return substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
    } else {
        return 'en';
    }
}

function getDomain($d) {
    if ($d === null || $d == "") {
        return "local";
    }
    $d = unwanted_array($d);
    $d = urldecode($d);
    $pos = strpos($d, ":");
    $a = substr($d,0,$pos);
    if ($a == "") {
        return "local";
    }
    $s = substr($d,$pos+3,15);
    if ($s == "api.soundcloud.") {
        return "soundcloud";
    }
    return $a;
}

function askForMpdValues($title) {
    global $prefs;
print '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" '.
'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, '.
'minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<link rel="stylesheet" type="text/css" href="themes/Darkness.css" />
<style>
input[type=text] { width: 50% }
input[type=submit] { width: 40% }
</style>
</head>
<body style="padding:8px;overflow-y:auto">
    <div class="bordered simar dingleberry" style="max-width:40em">
    <h3>';
print $title;
print '</h3>';
print '<p>'.get_int_text("setup_labeladdresses").'</p>';
print '<p class="tiny">'.get_int_text("setup_addressnote").'</p>';
print '<p>NOTE: Mopidy is still supported, but you must now use the MPD frontend in Mopidy</p>';
print '<p>This is the DEFAULT values. You can specify multiple different servers from the application</p>';
print '<form name="mpdetails" action="index.php" method="post">';
print '<p>'.get_int_text("setup_ipaddress").'<br><input type="text" name="mpd_host" value="'.
    $prefs['mpd_host'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_mpd").'</h3>';
print '<p>'.get_int_text("setup_port").'<br><input type="text" name="mpd_port" value="'.
    $prefs['mpd_port'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_password").'<br><input type="text" name="mpd_password" value="'.
    $prefs['mpd_password'].'" /></p>'."\n";
print '<p>'.get_int_text("setup_unixsocket").'</p>';
print '<input type="text" name="unix_socket" value="'.$prefs['unix_socket'].'" /></p>';

print '<hr class="dingleberry" />';
print '<h3>Collection Settings</h3>';
print '<p><input type="radio" name="collection_type" value="sqlite"';
if (array_key_exists('collection_type', $prefs) && $prefs['collection_type'] == "sqlite") {
    print " checked";
}
print '>Lite Database Collection</input></p>';
print '<p class="tiny">Full featured but may be slow with a large collection</p>';
print '<p><input type="radio" name="collection_type" value="mysql"';
if (array_key_exists('collection_type', $prefs) && $prefs['collection_type'] == "mysql") {
    print " checked";
}
print '>Full Database Collection</input></p>';
print '<p class="tiny">Fast and full featured - requires MySQL Server:</p>';
print '<p>Server<br><input type="text" name="mysql_host" value="'.
    $prefs['mysql_host'].'" /></p>'."\n";
print '<p>Port<br><input type="text" name="mysql_port" value="'.
    $prefs['mysql_port'].'" /></p>'."\n";
print '<p>Database<br><input type="text" name="mysql_database" value="'.
    $prefs['mysql_database'].'" /></p>'."\n";
print '<p>Username<br><input type="text" name="mysql_user" value="'.
    $prefs['mysql_user'].'" /></p>'."\n";
print '<p>Password<br><input type="text" name="mysql_password" value="'.
    $prefs['mysql_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>Proxy Settings</h3>';
print '<p>Proxy Server (eg 192.168.3.4:8800)<br><input type="text" name="proxy_host" value="'.
    $prefs['proxy_host'].'" /></p>'."\n";
print '<p>Proxy Username<br><input type="text" name="proxy_user" value="'.
    $prefs['proxy_user'].'" /></p>'."\n";
print '<p>Proxy Password<br><input type="text" name="proxy_password" value="'.
    $prefs['proxy_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>Debug Logging</h3>';
print '<table width="100%"><tr>';
for ($i = 0; $i<10; $i++) {
    print '<td><input type="radio" name="debug_enabled" value="'.$i.'"';
    if ($prefs['debug_enabled'] == $i) {
        print " checked";
    }
    print '>Level '.$i;
    if ($i == 0) {
        print ' (Off)';
    }
    print '</input></td>';
    if ($i == 4) {
        print '</tr><tr>';
    }
}
print '</tr></table>';
print '<p>Custom Log File</p>';
print '<p class=tiny>Rompr debug output will be sent to this file, but PHP error messages will
 still go to the web server error log. The web server needs write access to this file, it must
 already exist, and you should ensure it gets rotated as it will get large</p>';
print '<p><input type="text" style="width:90%" name="custom_logfile" value="'.
    $prefs['custom_logfile'].'" /></p>';
print '<p><input type="submit" value="OK" /></p>';
print'    </form>
    </div>
</body>
</html>';
print "\n";
}

function sql_init_fail($message) {

    global $prefs;
    header("HTTP/1.1 500 Internal Server Error");
?>
<html><head>
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="stylesheet" type="text/css" href="themes/Darkness.css" />
<title>Badgers!</title>
</head>
<body>
<h2 align="center" style="font-size:200%">Collection Database Error</h2>
<h4 align="center">It's all gone horribly wrong</h2>
<br>
<?php
print '<h3 align="center">Rompr encountered an error while checking your '.
    ucfirst($prefs['collection_type']).' database.</h3>';
?>
<h3 align="center">An SQLite or MySQL database is required to run Rompr</h3>
<h3 align="center">You may find it helpful to <a href="https://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>
<h3 align="center">The error message was:</h3><br>
<?php
    print '<div class="bordered" style="width:75%;margin:auto"><p align="center"><b>'.
        $message.'</b></p></div><br><br></body></html>';
    askForMpdValues("");
    exit(0);

}

function update_stream_playlist($url, $name, $image, $creator, $title, $type, $fname) {

    $file = "";
    $found = false;
    $x = null;
    if ($image === null) $image = "newimages/broadcast.svg";

    $playlists = glob("prefs/*STREAM*.xspf");
    foreach($playlists as $i => $file) {
        $x = simplexml_load_file($file);
        foreach($x->trackList->track as $i => $track) {
            if($track->location == $url && preg_match('/Unknown Internet Stream/', $track->album)) {
                debuglog("Found Stream To Update! - ".$file,"RADIO PLAYLISTS");
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

        debuglog("Creating new playlist for stream ".$url);
        $newname = 'prefs/'.$fname.'_'.md5($url).'.xspf';
        if (file_exists($newname)) {
            debuglog("Stream Playlist already exists!","STREAMS");
        } else {
            file_put_contents($newname, $xml);
        }
    }
}

function imagePath($image) {
    return ($image) ? $image : '';
}

function concatenate_artist_names($art) {
    if (!is_array($art)) {
        return $art;
    }
    if (count($art) == 1) {
        return $art[0];
    } else if (count($art) == 2) {
        return implode(' & ',$art);
    } else {
        $f = array_slice($art, 0, count($art) - 1);
        return implode($f, ", ")." & ".$art[count($art) - 1];
    }
}

function unwanted_array($a) {

    if (is_array($a)) {
        return $a[0];
    } else {
        return $a;
    }
}

function getArray($a) {
    if ($a === null) {
        return array();
    } else if (is_array($a)) {
        return $a;
    } else {
        return array($a);
    }
}

function getYear($date) {
    if (preg_match('/(\d\d\d\d)/', $date, $matches)) {
        return $matches[1];
    } else {
        return null;
    }
}

function audioClass($filetype) {
    $filetype = strtolower($filetype);
    switch ($filetype) {
        case "mp3":
            return 'icon-mp3-audio';
            break;

        case "mp4":
        case "m4a":
        case "aac":
        case "aacplus":
            return 'icon-aac-audio';
            break;

        case "flac":
            return 'icon-flac-audio';
            break;

        case "wma":
        case "windows media":
            return 'icon-wma-audio';
            break;

        case "ogg":
        case "ogg vorbis":
            return 'icon-ogg-audio';
            break;

        case "cue":
        case "pls":
        case "m3u":
            return "icon-doc-text";
            break;

        default:
            return 'icon-library';
            break;

    }

}

function checkComposerGenre($genre, $pref) {
    $gl = strtolower($genre);
    foreach ($pref as $g) {
        if ($gl == strtolower($g)) {
            return true;
        }
    }
    return false;
}

function getWishlist() {

    global $mysqlc, $divtype, $prefs;
    if ($mysqlc === null) {
        connect_to_database();
    }

    $qstring =
        'SELECT wishlist.*, Ratingtable.Rating FROM
        (SELECT Tracktable.TTindex AS ttindex, Tracktable.Title AS track, Tracktable.TrackNo
            AS num, Tracktable.Duration AS time, Tracktable.Disc as disc, Artisttable.Artistname
            AS artist, Albumtable.Albumname AS album, Albumtable.Image AS image, Albumtable.ImgKey
            AS imgkey FROM Tracktable JOIN Artisttable USING (Artistindex) JOIN Albumtable ON
            Tracktable.Albumindex = Albumtable.Albumindex WHERE Uri IS NULL AND Hidden = 0
        UNION
        SELECT Tracktable.TTindex AS ttindex, Tracktable.Title AS track, Tracktable.TrackNo
            AS num, Tracktable.Duration AS time, Tracktable.Disc as disc, Artisttable.Artistname
            AS artist, "" AS Albumname, NULL as Image, NULL AS ImgKey FROM Tracktable JOIN
            Artisttable USING (Artistindex) WHERE Albumindex IS NULL AND Uri IS NULL AND Hidden = 0)
        AS wishlist
        LEFT JOIN Ratingtable ON Ratingtable.TTindex = wishlist.ttindex
        ORDER BY ';
    foreach ($prefs['artistsatstart'] as $a) {
        $qstring .= "CASE WHEN LOWER(artist) = LOWER('".$a."') THEN 1 ELSE 2 END, ";
    }
    if (count($prefs['nosortprefixes']) > 0) {
        $qstring .= "(CASE ";
        foreach($prefs['nosortprefixes'] AS $p) {
            $phpisshitsometimes = strlen($p)+2;
            $qstring .= "WHEN LOWER(artist) LIKE '".strtolower($p)." %' THEN LOWER(SUBSTR(artist,".
                $phpisshitsometimes.")) ";
        }
        $qstring .= "ELSE LOWER(artist) END)";
    } else {
        $qstring .= "LOWER(artist)";
    }
    $qstring .= ', LOWER (album),
    num';

    $current_artist = "";
    $current_album = "";
    $count = 0;
    if ($result = generic_sql_query($qstring)) {
        while ($obj = $result->fetch(PDO::FETCH_OBJ)) {
            $bothclosed = false;
            debuglog("Found Track ".$obj->track,"WISHLIST");
            if ($current_artist != $obj->artist) {
                if ($current_artist != "") {
                    print '</div></div>';
                    $bothclosed = true;
                }
                $current_artist = $obj->artist;
                artistHeader("wishlistartist_".$count, null, $obj->artist, null);
                print '<div id="wishlistartist_'.$count.'" class="dropmenu '.$divtype.'">';
                $count++;
                $divtype = ($divtype == "album1") ? "album2" : "album1";
            }
            if ($current_album != $obj->album) {
                if (!$bothclosed && $current_album != "") {
                    print '</div>';
                }
                $current_album = $obj->album;
                albumHeader(
                    $obj->album,
                    null,
                    'wishlistalbum_'.$count,
                    ($obj->image === null) ? "no" : "yes",
                    ($obj->album == "") ? "yes" : "no",
                    $obj->imgkey,
                    $obj->image,
                    null,
                    null,
                    null
                );
                print '<div id="wishlistalbum_'.$count.'" class="dropmenu">';
                $count++;
            }
            albumTrack(
                null,
                $obj->Rating,
                null,
                0,
                $obj->num,
                $obj->track,
                0,
                null,
                null
            );
        }
    }

}

function get_player_ip() {
    global $prefs;
    // SERVER_ADDR reflects the address typed into the browser
    debuglog("Server Address is ".$_SERVER['SERVER_ADDR'],"INIT");
    // REMOTE_ADDR is the address of the machine running the browser
    debuglog("Remote Address is ".$_SERVER['REMOTE_ADDR'],"INIT");
    debuglog("mpd host is ".$prefs['mpd_host'],"INIT");

    if ($prefs['unix_socket'] != "" || $prefs['mpd_host'] == "localhost" || $prefs['mpd_host'] == "127.0.0.1") {
        return $_SERVER['SERVER_ADDR'] != "::1" ? $_SERVER['SERVER_ADDR'] : $prefs['mpd_host'];
    } else {
        return $prefs['mpd_host'];
    }

}

function getCacheData($uri, $cache) {

    $me = strtoupper($cache);
    debuglog("Getting ".$uri, $me);

    if (file_exists('prefs/jsoncache/'.$cache.'/'.md5($uri))) {
        debuglog("Returning cached data",$me);
        header("Pragma: From Cache");
        print file_get_contents('prefs/jsoncache/'.$cache.'/'.md5($uri));
    } else {
        $content = url_get_contents($uri);
        $s = $content['status'];
        debuglog("Response Status was ".$s, $me);
        header("Pragma: Not Cached");
        if ($s == "200") {
            print $content['contents'];
            file_put_contents('prefs/jsoncache/'.$cache.'/'.md5($uri), $content['contents']);
        } else {
            $a = array( 'error' => get_int_text($cache."_error"));
            print json_encode($a);
        }
    }

}

function get_user_file($src, $fname, $tmpname) {
    global $error;
    debuglog("  Uploading ".$src." ".$fname." ".$tmpname,"GETALBUMCOVER");
    $download_file = "prefs/".$fname;
    if (move_uploaded_file($tmpname, $download_file)) {
        debuglog("    File ".$src." is valid, and was successfully uploaded.","GETALBUMCOVER");
    } else {
        debuglog("    Possible file upload attack!","GETALBUMCOVER");
        header('HTTP/1.0 403 Forbidden');
        ob_flush();
        exit(0);
    }
    return $download_file;
}

?>
