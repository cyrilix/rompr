<?php
include("functions.php");
error_log("Getting IceCast List...");
$content = url_get_contents("http://dir.xiph.org/yp.xml");
error_log("Got IceCast List...");
$xml = simplexml_load_string($content['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

$genres = array();
$stations = array();

class station {
    public function __construct($name) {
        $this->name = $name;
        $this->urllist = array();
    }

    public function addUrl($url) {
        array_push($this->urllist, $url);
    }
}

class genre {
    public function __construct($name) {
        $this->name = $name;
        $this->stations = array();
    }
    
    public function newstation($station) {
        if (!array_key_exists($station, $this->stations)) {
            $this->stations[$station] = $station;
        }
    }
}

foreach($xml->entry as $i => $entry) {
    
    $name = utf8_decode($entry->server_name);
    $location = $entry->listen_url;

    if ($name == "Unspecified name") {
        $name = basename($location);
        if ($name == "" || $name ==  null || $name == $location) {
            $name = "Unknown Internet Stream";
        }
    }

    $genre = $entry->genre;
    if (!$genre) {
        $genre = "Unknown";
    }
    
    if (!array_key_exists($name, $stations)) {
        $stations[$name] = new station($name);
    }    
    $stations[$name]->addUrl($location);

    $g_array = explode(' ', $genre);
    foreach($g_array as $i => $wombat) {
        $g = utf8_decode($wombat);
        if (!array_key_exists($g, $genres)) {
            $genres[$g] = new genre($wombat);
        }
        $genres[$g]->newstation($name);
    }
    
}

ksort($genres, SORT_STRING);
$count = 0;
foreach ($genres as $i => $name) {
    print '<div id="albumname">' . "\n";
    print '<table width="100%"><tr><td style="width:32px"><a href="javascript:doMenu(\'genre' . $count . '\');" class="toggle" name="genre' . $count . '"><img src="images/toggle-closed.png"></a></td><td align="left">';
    print $genres[$i]->name;
    print '</td></tr></table></div>';
    print '<div id="albummenu" style="padding-left:12px" name="genre' . $count . '">' . "\n";
    print '<table width="100%">';
    foreach($genres[$i]->stations as $n => $station) {
        print '<tr><td><a href="#" onclick="addIceCast(\''.$stations[$station]->name.'\')">'.$stations[$station]->name."</a></td></tr>\n";
    }
    print "</table>\n";
    print "</div>\n";
    $count++;
}

$output = '<?xml version="1.0" encoding="utf-8"?><playlist version="1">'."\n".
            '<title>Icecast Stations</title>'."\n".
            '<creator>RompR</creator>'."\n".
            '<trackList>'."\n";
foreach ($stations as $i => $station) {
    foreach ($station->urllist as $j => $url) {
        $output = $output . "<track>\n".
                            xmlnode('album', utf8_encode($station->name)).
                            xmlnode('creator', 'IceCast Radio').
                            xmlnode('location', $url).
                            xmlnode('image', "images/icecast.png").
                            "</track>\n";

    }
}
$output = $output . "</trackList>\n</playlist>\n";

$fp = fopen("prefs/STREAM_icecast.xspf", "w");
if ($fp) {
    fwrite($fp, $output);
}
fclose($fp);

?>