<?php
include("functions.php");
error_log("Getting IceCast List...");
$content = url_get_contents("http://dir.xiph.org/yp.xml");
error_log("Got IceCast List...");
$xml = simplexml_load_string($content['contents'], 'SimpleXMLElement', LIBXML_NOCDATA);

set_time_limit(240);

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

print '<div id="booger" style="border-bottom:1px solid #dddddd;margin-bottom:4px"><table width="100%" class="playlistitem"><tr><td align="left">';
print count($stations) . ' IceCast Radio Stations</td></tr></table></div>';

ksort($genres, SORT_STRING);
$count = 0;
foreach ($genres as $i => $name) {
    print '<div class="dirname">' . "\n";
    print '<table width="100%" class="filetable"><tr><td style="width:24px"><a href="#" onclick="doMenu(event, \'genre' . $count . '\');" name="genre' . $count . '"><img src="images/toggle-closed.png"></a></td><td align="left">';
    print $genres[$i]->name;
    print '</td></tr></table></div>';
    print '<div class="filedropmenu" name="genre' . $count . '">' . "\n";
    print '<div class="filemenu" style="margin-left:32px">';
    print '<table width="100%" class="filetable">';
    foreach($genres[$i]->stations as $n => $station) {
        print '<tr><td><a href="#" onclick="addIceCast(\''.$stations[$station]->name.'\')">'.$stations[$station]->name."</a></td></tr>\n";
    }
    print "</table>\n";
    print "</div>\n";    
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

$fp = fopen("prefs/icecast.xspf", "w");
if ($fp) {
    fwrite($fp, $output);
}
fclose($fp);

?>