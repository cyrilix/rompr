<?php

// This is for getting a remote playlist from a radio station - eg PLS or ASX files
// This script parses that remote playlist and creates a local XSPF which will be
// used for adding the stream(s) to the playlist and for putting the info into the playlist

// Called with : 	url   	:  	The remote playlist to download or stream to add
//					station :	The name of the radio station (Groove Salad)
//					creator :	Not used for radio streams
//					image   :	The image to use in the playlist

// The generated playlists can be updated later if no information is known -
// the playlist will handle that when it gets stream info from mpd

chdir('..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("international.php");

$url = rawurldecode($_REQUEST['url']);
$station = (array_key_exists('station', $_REQUEST)) ? rawurldecode($_REQUEST['station']) : "Unknown Internet Stream";
$creator = "";
$image = (array_key_exists('image', $_REQUEST)) ? rawurldecode($_REQUEST['image']) : "newimages/broadcast.svg";
$usersupplied = (array_key_exists('usersupplied', $_REQUEST)) ? true : false;

debug_print("Getting Internet Stream:","RADIO_PLAYLIST");
debug_print("  url : ".$url,"RADIO_PLAYLIST");
debug_print("  station : ".$station,"RADIO_PLAYLIST");
debug_print("  image : ".$image,"RADIO_PLAYLIST");
debug_print("  user : ".$usersupplied,"RADIO_PLAYLIST");

if ($url) {

	$path = $url;
	$type = null;

	$content = url_get_contents($url, $_SERVER['HTTP_USER_AGENT'], false, true, true);
	debug_print("Playlist Is ".$content['status']." ".$content['contents'],"RADIO_PLAYLIST");

	$content_type = $content['info']['content_type'];
	// To cope with charsets in the header...
	// case "audio/x-scpls;charset=UTF-8";
	$content_type = preg_replace('/;.*/','',$content_type);

	switch ($content_type) {
		case "video/x-ms-asf":
			$type = asfOrasx($content['contents']);
			break;
		case "audio/x-scpls":
			$type = "pls";
			break;
		case "audio/x-mpegurl":
			$type = "m3u";
			break;
		case "application/xspf+xml":
			$type = "xspf";
			break;
		case "text/html":
			debug_print("HTML page returned!","RADIO_PLAYLIST");
			header('HTTP/1.0 404 Not Found');
			exit (0);
	}
	debug_print("Playlist Type From Content Type is ".$type,"RADIO_PLAYLIST");

	if ($type == "" || $type == null) {
		$type = pathinfo($path, PATHINFO_EXTENSION);
		$qpos = strpos($type, "?");
	  	if ($qpos != false) $type = substr($type, 0, $qpos);
		debug_print("Playlist Type From URL is ".$type,"RADIO_PLAYLIST");
	}

	$playlist = null;

	if ($content['status'] == "200" && $content['contents'] != "") {

		switch ($type) {
			case "pls":
			case "PLS":
				$playlist = new plsFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "asx";
			case "ASX";
				$playlist = new asxFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "asf";
			case "ASF";
				$playlist = new asfFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "xspf";
			case "XSPF";
				$playlist = new xspfFile($content['contents'], $url, $station, $creator, $image);
				break;
			case "m3u";
			case "M3U";
				$playlist = new m3uFile($content['contents'], $url, $station, $creator, $image);
				break;
			default;
				$playlist = new possibleStreamUrl($url, $station, $creator, $image);
				break;

		}
	} else if ($content['status'] == "404") {
		$playlist = null;
	} else {
		$playlist = new possibleStreamUrl($url, $station, $creator, $image);
	}

	if ($playlist) {
		list($tl, $st) = $playlist->getTracks();
		header('Content-Type: text/xml; charset=utf-8');
		$output = '<?xml version="1.0" encoding="utf-8"?>'."\n".
		          "<playlist>\n".
		          "<playlisturl>".htmlspecialchars($url)."</playlisturl>\n".
		          // "<addedbyrompr>true</addedbyrompr>\n".
				  '<trackList>'."\n";
		$output = $output . $tl;
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

	} else {
		debug_print("Could not determine playlist type","RADIO_PLAYLIST");
		header('HTTP/1.0 404 Not Found');
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
		$this->station = $station;
		$this->creator = $creator;
		$this->image = $image;

		$parts = explode(PHP_EOL, $data);
		$tracks = array();
		$pointer = -1;
		foreach ($parts as $line) {
			$bits = explode("=", $line);
			if (preg_match('/File/', $bits[0])) {
				$pointer++;
				$tracks[$pointer]['track'] = trim(implode('=', array_slice($bits,1)));
			}
			if (preg_match('/Title/', $bits[0])) {
				$tracks[$pointer]['title'] = $bits[1];
			}
		}
		if (array_key_exists('title', $tracks[0])) {
			$this->station = checkStationAgain($this->station, $tracks[0]['title']);
		}
		$this->tracks = $tracks;
	}

	public function getTracks() {

		$output = "";
		$t = array();
		foreach($this->tracks as $i => $track) {
			if (in_array($this->tracks[$i]['track'], $t)) {
				debug_print("Skipping duplicate track entry","RADIO PLAYLIST");
			} else {
				$output = $output . "<track>\n";
				$output = $output . xmlnode('album', $this->station);
				$output = $output . xmlnode('creator', $this->creator);
				$output = $output . xmlnode('title', "");
				$output = $output . xmlnode('type', "stream");
				$output = $output . xmlnode('image', $this->image);
			    if ($this->tracks[$i]['title'] != "") {
					$output = $output . xmlnode('stream', $this->tracks[$i]['title']);
				} else {
					$output = $output . xmlnode('stream', "");
				}
				$output = $output . xmlnode('location', $this->tracks[$i]['track']).
									xmlnode('compilation', 'yes').
									"</track>\n";
				array_push($t, $this->tracks[$i]['track']);
			}
		}
		return array($output, $this->station);
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
		$this->station = $this->xml->TITLE != null ? $this->xml->TITLE : $station;
		$this->creator = $creator;
		$this->image = $image;
	}

	public function getTracks() {

		$output = "";
		$t = array();
	    foreach($this->xml->Entry as $i => $r) {
	    	if (in_array((string) $r->ref['href'], $t)) {
	    		debug_print("Skipping duplicate track entry","RADIO PLAYLIST");
	    	} else {
		        $output = $output . "<track>\n".
		                            xmlnode('stream', "").
		                            xmlnode('album', $this->station).
									xmlnode('type', "stream").
									xmlnode('title', "").
		                            xmlnode('image', $this->image).
		                            xmlnode('creator', $this->creator).
		                            xmlnode('location', $r->ref['href']).
		                            "</track>\n";
		        array_push($t, (string) $r->ref['href']);
		    }

	    }
		return array($output, $this->station);

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
		$this->station = $this->xml->title != null ? $this->xml->title : $station;
		$this->creator = $creator;
		$this->image = $image;
	}

	public function getTracks() {

		$output = "";
	    foreach($this->xml->trackList->track as $i => $r) {
	        $output = $output . "<track>\n".
	                            xmlnode('stream', "").
	                            xmlnode('album', $this->station).
	                            xmlnode('image', $this->image).
								xmlnode('type', "stream").
								xmlnode('title', "").
	                            xmlnode('creator', $this->creator).
	                            xmlnode('location', $r->location).
	                            "</track>\n";
	    }
		return array($output, $this->station);

	}
}

// #This is a comment
//
// http://uk1.internet-radio.com:15614/

// or

// #EXTM3U
// #EXTINF:duration,Artist - Album

class m3uFile {

	public function __construct($data, $url, $station, $creator, $image) {
		debug_print("New M3U Station ".$station,"RADIO PLAYLIST");
		$this->url = $url;
		$this->station = $station;
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
		debug_print("Outputting M3U Station ".$this->station,"RADIO PLAYLIST");
		foreach($this->tracks as $i => $track) {
			$output = $output . "<track>\n";
			$output = $output . xmlnode('album', $this->station);
			$output = $output . xmlnode('stream', "");
			$output = $output . xmlnode('creator', $this->creator);
			$output = $output . xmlnode('title', "");
			$output = $output . xmlnode('type', "stream");
			$output = $output . xmlnode('image', $this->image);
			$output = $output . xmlnode('location', $track).
								xmlnode('compilation', 'yes').
								"</track>\n";
		}
		return array($output, $this->station);
	}
}

// [Reference]
// Ref1=http://wmlive-lracl.bbc.co.uk/wms/england/lrleicester?MSWMExt=.asf
// Ref2=http://212.58.252.33:80/wms/england/lrleicester?MSWMExt=.asf

class asfFile {

	public function __construct($data, $url, $station, $creator, $image) {
		$this->url = $url;
		$this->station = $station;
		$this->creator = $creator;
		$this->image = $image;
		$this->tracks = array();

		$parts = explode(PHP_EOL, $data);
		foreach ($parts as $line) {
			if (preg_match('/^Ref\d+=(.*)/', $line, $matches)) {
				$uri = trim($matches[1]);
				array_push($this->tracks, preg_replace('/http:/','mms:', $uri));
			}
		}
	}

	public function getTracks() {

		$output = "";
		foreach($this->tracks as $i => $track) {
			$output = $output . "<track>\n";
			$output = $output . xmlnode('album', $this->station);
			$output = $output . xmlnode('stream', "");
			$output = $output . xmlnode('creator', $this->creator);
			$output = $output . xmlnode('title', "");
			$output = $output . xmlnode('type', "stream");
			$output = $output . xmlnode('image', $this->image);
			$output = $output . xmlnode('location', $track).
								xmlnode('compilation', 'yes').
								"</track>\n";
		}
		return array($output, $this->station);
	}
}

// Fallback - if it's not any of the above types, treat it as a single stream URL and see what happens.

class possibleStreamUrl {

	public function __construct($url, $station, $creator, $image) {
		debug_print("Unknown Playlist Type - treating as stream URL","RADIO_PLAYLIST");
		$this->url = $url;
		$this->station = $station;
		$this->creator = $creator;
		$this->image = $image;
	}

	public function getTracks() {

        return array("<track>\n".
                xmlnode('stream', "").
                xmlnode('album', $this->station).
                xmlnode('image', $this->image).
				xmlnode('title', "").
				xmlnode('type', "stream").
                xmlnode('creator', $this->creator).
                xmlnode('location', $this->url).
                "</track>\n", $this->station);
	}
}

function checkStationAgain($currenttitle, $tracktitle) {
	// For MPD, we can get a station name from the pls file
	// For Mopidy, we'll let mopidy's scanner find one for us. This is more accurate
	global $prefs;
	$currenttitle = (string)$currenttitle;
	if (preg_match('/Unknown Internet Stream/', $currenttitle) && $prefs['player_backend'] == "mpd") {
		$a = preg_replace('/\(.*?\)/', '', $tracktitle);
		if ($a != '') {
			$currenttitle = $a;
		}
	}
	return $currenttitle;
}

function asfOrasx($s) {
	$type = null;
	if (preg_match('/^\[Reference\]/', $s)) {
		debug_print("Type of playlist determined as asf","RADIO_PLAYLIST");
		$type = "asf";
	} else if (preg_match('/^<ASX /', $s)) {
		debug_print("Type of playlist determined as asx","RADIO_PLAYLIST");
		$type = "asx";
	} else if (preg_match('/^http:/', $s)) {
		debug_print("Type of playlist determined as m3u-like","RADIO_PLAYLIST");
		$type = "m3u";
	}
	return $type;
}

?>



