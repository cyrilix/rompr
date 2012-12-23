<?php
include("functions.php");
// error_log("Getting IceCast List...");
$content = url_get_contents("http://dir.xiph.org/yp.xml");
// error_log("Got IceCast List...");
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
print '<div class="noselection fullwidth">';
print '<div class="underlined"><table width="100%" class="playlistitem"><tr><td align="left">';
print count($stations) . ' IceCast Radio Stations</td></tr></table></div>';

ksort($genres, SORT_STRING);
$count = 0;
foreach ($genres as $i => $name) {

    print '<div class="containerbox menuitem">';
    print '<img src="images/toggle-closed.png" class="menu fixed" name="genre'.$count.'">';
    print '<div class="expand">'.utf8_encode($genres[$i]->name).'</div>';
    print '</div>';
    
    print '<div id="genre'.$count.'" class="dropmenu">';
    foreach($genres[$i]->stations as $n => $station) {
        print '<div class="clickable clickicecast indent containerbox padright" name="'.rawurlencode($stations[$station]->name).'">';
        print '<div class="playlisticon fixed"><img height="12px" src="images/broadcast-12.png" /></div>';
        print '<div class="expand">'.utf8_encode($stations[$station]->name).'</div>';
        print '</div>';
    }
    print '</div>';
    $count++;
}

print '</div>';
print '</div>';

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