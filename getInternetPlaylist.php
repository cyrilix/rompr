<?php
include ("vars.php");

// This is for getting a remote playlist from a radio station - eg PLS or ASX files
// This script parses that remote playlist and creates a local XSPF which will be
// used for adding the stream(s) to the playlist and for putting the info into the playlist

// Called with : 	url   	:  	The remote playlist to download or stream to add
//					station :	The name of the radio station (Groove Salad)
//					creator :	The name of the broadcaster (Soma FM)
//					image   :	The image to use in the playlist

// The generated playlists can be updated later if no information is known -
// the playlist will handle that when it gets stream info from mpd

include("functions.php");
header('Content-Type: text/xml; charset=utf-8');

$url = rawurldecode($_REQUEST['url']);
$station = (array_key_exists('station', $_REQUEST)) ? rawurldecode($_REQUEST['station']) : "Unknown Internet Stream";
$creator = (array_key_exists('creator', $_REQUEST)) ? rawurldecode($_REQUEST['creator']) : "Internet Radio";
$image = (array_key_exists('image', $_REQUEST)) ? rawurldecode($_REQUEST['image']) : "newimages/broadcast.png";
$usersupplied = (array_key_exists('usersupplied', $_REQUEST)) ? true : false;

debug_print("Getting Internet Stream:","RADIO_PLAYLIST");
debug_print("  url : ".$url,"RADIO_PLAYLIST");
debug_print("  station : ".$station,"RADIO_PLAYLIST");
debug_print("  creator : ".$creator,"RADIO_PLAYLIST");
debug_print("  image : ".$image,"RADIO_PLAYLIST");
debug_print("  user : ".$usersupplied,"RADIO_PLAYLIST");

$existing_album_names = array();
// Check which names we already have
$all_playlists = glob("prefs/*STREAM*.xspf");
foreach($all_playlists as $file) {
    if (file_exists($file)) {
    	if ($url) {
    		if (preg_match("/".md5($url)."/", $file)) {
    			debug_print("We already have a playlist for URL ".$url,"RADIO_PLAYLIST");
    			print file_get_contents($file);
    			if ($usersupplied && preg_match("/^STREAM/", basename($file))) {
    				// Make this a USERSTREAM
			        $newname = "prefs/USER".basename($file);
			        system('mv "'.$file.'" "'.$newname.'"');
    			}
    			exit(0);
    		}
    	}
        $x = simplexml_load_file($file);
        $n = (string)$x->trackList->track[0]->album;
        $n = preg_replace('/ \d+$/', '', $n);
        if (array_key_exists($n, $existing_album_names)) {
        	$existing_album_names[$n]++;
        } else {
        	$existing_album_names[$n] = 1;
        }
    }
}

if ($url) {

	$path = $url;
	$type = pathinfo($path, PATHINFO_EXTENSION);
	$qpos = strpos($type, "?");
  	if ($qpos != false) $type = substr($type, 0, $qpos);
	debug_print("Playlist Type Is ".$type,"RADIO_PLAYLIST");
	if ($type != "" && $type != null) {

		$playlist = null;
		switch ($type) {
			case "pls":
			case "PLS":
				$content = url_get_contents($url, 'RompR Media Player/0.1', false, true);
				debug_print("Playlist Is ".$content['contents'],"RADIO_PLAYLIST");
				$playlist = new plsFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "asx";
			case "ASX";
				$content = url_get_contents($url, 'RompR Media Player/0.1', false, true);
				debug_print("Playlist Is ".$content['contents'],"RADIO_PLAYLIST");
				$playlist = new asxFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "xspf";
			case "XSPF";
				$content = url_get_contents($url, 'RompR Media Player/0.1', false, true);
				debug_print("Playlist Is ".$content['contents'],"RADIO_PLAYLIST");
				$playlist = new xspfFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "m3u";
			case "M3U";
				$content = url_get_contents($url, 'RompR Media Player/0.1', false, true);
				debug_print("Playlist Is ".$content['contents'],"RADIO_PLAYLIST");
				$playlist = new m3uFile($content['contents'], $url, $station, $creator, $image);
				break;
			default;
				$playlist = new possibleStreamUrl($url, $station, $creator, $image);
				break;

		}

		if ($playlist) {
			$output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
			          '<playlist>'."\n".
					  '<trackList>'."\n";
			$output = $output . $playlist->getTracks();
			$output = $output . "</trackList>\n</playlist>\n";

			$fp = null;
			if ($usersupplied) {
				$fp = fopen('prefs/USERSTREAM_'.md5($url).'.xspf', 'w');
			} else {
				$fp = fopen('prefs/STREAM_'.md5($url).'.xspf', 'w');
			}
			if ($fp) {
			    fwrite($fp, $output);
			}
			fclose($fp);

			print $output;

		}
	} else {
		debug_print("Could not determine playlist type","RADIO_PLAYLIST");
	}
}

// [playlist]
// numberofentries=3
// File1=http://streamer-dtc-aa04.somafm.com:80/stream/1018
// Title1=SomaFM: Groove Salad (#1 128k mp3): A nicely chilled plate of ambient/downtempo beats and grooves.
// Length1=-1
// File2=http://mp2.somafm.com:8032
// Title2=SomaFM: Groove Salad (#2 128k mp3): A nicely chilled plate of ambient/downtempo beats and grooves.
// Length2=-1
// File3=http://ice.somafm.com/groovesalad
// Title3=SomaFM: Groove Salad (Firewall-friendly 128k mp3) A nicely chilled plate of ambient/downtempo beats and grooves.
// Length3=-1
// Version=2

// For Soma FM, is called with 	url = playlist URL
//								station = (eg) Groove Salad
//								creator = Soma FM

class plsFile {

	public function __construct($data, $url, $station, $creator, $image) {
		$this->url = $url;
		$this->station = checkStationName($station);
		$this->creator = $creator;
		$this->image = $image;

		$parts = explode(PHP_EOL, $data);
		$tracks = array();
		$pointer = -1;
		foreach ($parts as $line) {
			$bits = explode("=", $line);
			if (preg_match('/File/', $bits[0])) {
				$pointer++;
				$tracks[$pointer]['track'] = $bits[1];
				if (!array_key_exists('title', $tracks[$pointer])) {
					$tracks[$pointer]['title'] = "";
				}
			}
			if (preg_match('/Title/', $bits[0])) {
				$tracks[$pointer]['title'] = $bits[1];
				$this->station = checkStationAgain($this->station, $tracks[$pointer]['title']);
			}
		}
		$this->tracks = $tracks;
	}

	public function getTracks() {

		$output = "";
		foreach($this->tracks as $i => $track) {
			$output = $output . "<track>\n";
			$output = $output . xmlnode('album', $this->station);
			$output = $output . xmlnode('creator', $this->creator);
			$output = $output . xmlnode('image', $this->image);
		    if ($this->tracks[$i]['title'] != "") {
				$output = $output . xmlnode('stream', $this->tracks[$i]['title']);
			}
			$output = $output . xmlnode('location', $this->tracks[$i]['track']).
								xmlnode('compilation', 'yes').
								"</track>\n";
		}
		return $output;
	}

}

// <ASX version="3.0">
// 	<ABSTRACT>http://www.bbc.co.uk/5livesportsextra/</ABSTRACT>
// 	<TITLE>BBC Radio 5 live sports extra</TITLE>
// 	<AUTHOR>BBC</AUTHOR>
// 	<COPYRIGHT>(c) British Broadcasting Corporation</COPYRIGHT>
// 	<MOREINFO HREF="http://www.bbc.co.uk/5livesportsextra/" />
// 	<PARAM NAME="HTMLView" VALUE="http://www.bbc.co.uk/5livesportsextra/" />
// 	<PARAM NAME="GEO" VALUE="UK" />

// 	<Entry>
// 		<ref href="mms://wmlive-acl.bbc.co.uk/wms/bbc_ami/radio5/5spxtra_bb_live_ep1_sl0?BBC-UID=649f8b917418780a1d247f88818c39cb39a24514c0e00211d248f0c4e30ce058&amp;SSO2-UID=" />
// 	</Entry>
// 	<Entry>
// 		<ref href="mms://wmlive-acl.bbc.co.uk/wms/bbc_ami/radio5/5spxtra_bb_live_eq1_sl0?BBC-UID=649f8b917418780a1d247f88818c39cb39a24514c0e00211d248f0c4e30ce058&amp;SSO2-UID=" />
// 	</Entry>


class asxFile {

	public function __construct($data, $url, $station, $creator, $image) {
		$this->url = $url;
		$this->xml = simplexml_load_string($data, 'SimpleXMLElement', LIBXML_NOCDATA);
		$this->station = checkStationName(($this->xml->TITLE != null) ? $this->xml->TITLE : $station);
		$this->creator = ($this->xml->AUTHOR != null) ? $this->xml->AUTHOR : $creator;
		$this->image = $image;
	}

	public function getTracks() {

		$output = "";
	    foreach($this->xml->Entry as $i => $r) {
	        $output = $output . "<track>\n".
	                            xmlnode('stream', $this->station).
	                            xmlnode('album', $this->station).
	                            xmlnode('image', $this->image).
	                            xmlnode('creator', $this->creator).
	                            xmlnode('location', $r->ref['href']).
	                            "</track>\n";

	    }
	    return $output;

	}
}

// <playlist version="1" xmlns="http://xspf.org/ns/0/">
//     <title>I Love Radio (www.iloveradio.de)</title>
//     <info>http://www.iloveradio.de</info>
//     <trackList>
//         <track><location>http://87.230.53.70:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.157.79:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.156.44:80/iloveradio1.mp3</location></track>
//         <track><location>http://87.230.100.70:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.158.62:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.157.81:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.157.76:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.158.76:80/iloveradio1.mp3</location></track>
//         <track><location>http://89.149.254.214:80/iloveradio1.mp3</location></track>
//         <track><location>http://80.237.157.64:80/iloveradio1.mp3</location></track>
//     </trackList>
// </playlist>

class xspfFile {

	public function __construct($data, $url, $station, $creator, $image) {
		$this->url = $url;
		$this->xml = simplexml_load_string($data, 'SimpleXMLElement', LIBXML_NOCDATA);
		$this->station = checkStationName(($this->xml->title != null) ? $this->xml->title : $station);
		$this->creator = ($this->xml->info != null) ? $this->xml->info : $creator;
		$this->image = $image;
	}

	public function getTracks() {

		$output = "";
	    foreach($this->xml->trackList->track as $i => $r) {
	        $output = $output . "<track>\n".
	                            xmlnode('stream', $this->station).
	                            xmlnode('album', $this->station).
	                            xmlnode('image', $this->image).
	                            xmlnode('creator', $this->creator).
	                            xmlnode('location', $r->location).
	                            "</track>\n";
	    }
	    return $output;

	}
}

// #This is a comment
//
// http://uk1.internet-radio.com:15614/

class m3uFile {

	public function __construct($data, $url, $station, $creator, $image) {
		$this->url = $url;
		$this->station = checkStationName($station);
		$this->creator = $creator;
		$this->image = $image;
		$this->tracks = array();

		$parts = explode(PHP_EOL, $data);
		foreach ($parts as $line) {
			if (preg_match('/^\#/', $line) ||
				preg_match('/^\s*$/', $line)) {

			} else {
				array_push($this->tracks, trim($line));
			}
		}
	}

	public function getTracks() {

		$output = "";
		foreach($this->tracks as $i => $track) {
			$output = $output . "<track>\n";
			$output = $output . xmlnode('album', $this->station);
			$output = $output . xmlnode('creator', $this->creator);
			$output = $output . xmlnode('image', $this->image);
			$output = $output . xmlnode('location', $track).
								xmlnode('compilation', 'yes').
								"</track>\n";
		}
		return $output;
	}
}

// Fallback - if it's not any of the above types, treat it as a single stream URL and see what happens.

class possibleStreamUrl {

	public function __construct($url, $station, $creator, $image) {
		$this->url = $url;
		$this->station = checkStationName($station);
		$this->creator = $creator;
		$this->image = $image;
	}

	public function getTracks() {

        return "<track>\n".
                xmlnode('stream', $this->station).
                xmlnode('album', $this->station).
                xmlnode('image', $this->image).
                xmlnode('creator', $this->creator).
                xmlnode('location', $this->url).
                "</track>\n";
	}
}

function checkStationName($station) {
	global $existing_album_names;
	$station = (string)$station;
	if (array_key_exists($station, $existing_album_names)) {
		$existing_album_names[$station]++;
		$station = $station. " ".$existing_album_names[$station];
	} else {
		$existing_album_names[$station] = 1;
	}
	return $station;
}

function checkStationAgain($currenttitle, $tracktitle) {
	global $existing_album_names;
	$currenttitle = (string)$currenttitle;
	if (preg_match('/Unknown Internet Stream/', $currenttitle)) {
		$a = preg_replace('/\(.*?\)/', '', $tracktitle);
		if ($a != '') {
			$currenttitle = checkStationName($a);
		}
	}
	return $currenttitle;
}

?>



