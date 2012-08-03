<?php
include("functions.php");
$content = url_get_contents("http://dir.xiph.org/yp.xml");
$xml = simplexml_load_string($content['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

$output = '<?xml version="1.0" encoding="utf-8"?><playlist version="1">'."\n".
            '<title>Icecast Stations</title>'."\n".
            '<creator>RompR</creator>'."\n".
            '<trackList>'."\n";

print '<h3>&nbsp;&nbsp;IceCast Radio Stations</h3>';
$genres = array();

class station {
    public function __construct($name, $url) {
        $this->name = $name;
        $this->url = $url;
    }
}

class genre {
    public function __construct($name) {
        $this->name = $name;
        $this->stations = array();
    }
    
    public function newstation($station) {
        array_push($this->stations, $station);
    }
}

foreach($xml->entry as $i => $entry) {
    
    $name = $entry->server_name;
    $location = $entry->listen_url;
    $genre = $entry->genre;
    if (!$genre) {
        $genre = "Unknown";
    }
    
    $output = $output . "<track>\n".
                        xmlnode('album', $name).
                        xmlnode('creator', 'IceCast Radio').
                        xmlnode('location', $location).
                        xmlnode('image', "images/icecast.png").
                        "</track>\n";
    
    $station = new station($name, $location);
    $g_array = explode(' ', $genre);
    foreach($g_array as $i => $wombat) {
        $g = utf8_decode($wombat);
        if (!array_key_exists($g, $genres)) {
            $genres[$g] = new genre($wombat);
        }
        $genres[$g]->newstation($station);
    }
    
}

ksort($genres, SORT_STRING);
$count = 0;
$divtype = "album1";
foreach ($genres as $i => $name) {
    print '<div id="albumname" class="' . $divtype . '">' . "\n";
    print '<table width="100%"><tr><td class="tracknumbr"><a href="javascript:doMenu(\'genre' . $count . '\');" class="toggle" name="genre' . $count . '"><img src="images/toggle-closed.png"></a></td><td>';
    print $genres[$i]->name;
    print '</td></tr></table></div>';
    print '<div id="albummenu" style="padding-left:24px" name="genre' . $count . '" class="' . $divtype . '">' . "\n";
    print '<table width="100%">';
    foreach($genres[$i]->stations as $n => $station) {
        print '<tr><td><a href="#" onclick="playlist.addtrack(\''.$station->url.'\')">'.$station->name."</a></td></tr>\n";
    }
    print "</table>\n";
    print "</div>\n";
    $count++;
    if ($divtype == "album1") {
        $divtype = "album2";
    } else {
        $divtype = "album1";
    }
}

$output = $output . "</trackList>\n</playlist>\n";

$fp = fopen("prefs/STREAM_icecast.xspf", "w");
if ($fp) {
    fwrite($fp, $output);
}
fclose($fp);

?>