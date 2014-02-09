<?php

include("includes/vars.php");
include("includes/functions.php");
include("international.php");

error_reporting(0);
$base_url = "http://www.listenlive.eu/";
$cbase_url = "http://www.canadianwebradio.com/";

if (array_key_exists('country', $_REQUEST)) {
    $prefs['radiocountry'] = $_REQUEST['country'];
    savePrefs();
}

print '<div class="noselection fullwidth">';

$countries = array();
$genres = array();
$content = url_get_contents($base_url);
$DOM = new DOMDocument;
$DOM->loadHTML($content['contents']);
$stuff = $DOM->getElementById('thetable');
$links = $stuff->getElementsByTagName('a');
foreach ($links as $l) {
    $p = $l->getAttribute('href');
    $n = DOMinnerHTML($l);
    $countries[$n] = $base_url.$p;
    // debug_print($n." - ".$p,"RADIOCOUNTRIES");
}

if (preg_match('/listenlive.eu/', $prefs['radiocountry'])) {
    $stuff = $DOM->getElementById('thetable2');
    $links = $stuff->getElementsByTagName('a');
    foreach ($links as $l) {
        $p = $l->getAttribute('href');
        $n = DOMinnerHTML($l);
        $genres[$n] = $base_url.$p;
        // debug_print($n." - ".$p,"RADIOCOUNTRIES");
    }
}

$content = url_get_contents($cbase_url);
$DOM = new DOMDocument;
$DOM->loadHTML($content['contents']);
$stuff = $DOM->getElementById('thetable');
$links = $stuff->getElementsByTagName('a');
foreach ($links as $l) {
    $p = $l->getAttribute('href');
    $n = DOMinnerHTML($l);
    $countries['Canada - '.$n] = $cbase_url.$p;
    // debug_print($n." - ".$p,"RADIOCOUNTRIES");
}

if (preg_match('/canadianwebradio/', $prefs['radiocountry'])) {
    $stuff = $DOM->getElementById('thetable2');
    $links = $stuff->getElementsByTagName('a');
    foreach ($links as $l) {
        $p = $l->getAttribute('href');
        $n = DOMinnerHTML($l);
        $genres[$n] = $cbase_url.$p;
        // debug_print($n." - ".$p,"RADIOCOUNTRIES");
    }
}

$countries['United States'] = "http://www.usliveradio.com/";
$countries['Australia'] = "http://www.australianliveradio.com/";
$countries['New Zealand'] = "http://www.nzradioguide.co.nz/";
ksort($countries);
ksort($genres);

print '<div class="indent">';
print '<select id="radioselector" class="topformbutton" onchange="changeradiocountry()">';
foreach ($countries as $name => $link) {
    print '<option value="'.$link.'"';
    if ($link == $prefs['radiocountry']) {
        print ' selected';
    }
    print '>'.$name.'</option>';
}
foreach ($genres as $name => $link) {
    print '<option value="'.$link.'"';
    if ($link == $prefs['radiocountry']) {
        print ' selected';
    }
    print '>'.$name.'</option>';
}
print '</select></div>';

$getstr = $prefs['radiocountry'];
$content = url_get_contents($getstr);
$DOM = new DOMDocument;
$DOM->loadHTML($content['contents']);
$stuff = $DOM->getElementById('thetable3');

$rows = $stuff->getElementsByTagName('tr');
for ($i=0; $i<$rows->length; $i++) {
    $boxes = $rows->item($i)->getElementsByTagName('td');
    $track = array();
    $track['meta'] = array();
    $trackformats = array();
    $tracklinks = array();
    foreach ($boxes as $td) {

        $td_contents = DOMinnerHTML($td);
        if (preg_match('/<b>(.*?)<\/b>/', $td_contents, $matches)) {
            $track['title'] = $matches[1];
            if (preg_match('/<b>(.*?)<\/b>/', $track['title'], $matches)) {
                $track['title'] = $matches[1];
            }
            if (preg_match('/<b>(.*?)$/', $track['title'], $matches)) {
                $track['title'] = $matches[1];
            }
            // debug_print("Station : ".$track['title'], "RADIOPARSER");
        } else if (preg_match('/<img /', $td_contents)) {
            $td_contents = preg_replace('/<br\s*\/*>/', '<ROMPR>', $td_contents);
            $td_rows = explode('<ROMPR>', $td_contents);
            foreach($td_rows as $img) {
                if ($img == "") {
                    array_push($trackformats, "");
                } else {
                    $d = new DOMDocument;
                    $d->loadHTML($img);
                    $cock = $d->getElementsByTagName('img');
                    $fuck = $cock->item(0);
                    $wtf = $fuck->getAttribute('alt');
                    array_push($trackformats, $wtf);
                }
            }
        } else if (preg_match('/<a /', $td_contents)) {
            $td_contents = preg_replace('/<br\s*\/*>/', '<ROMPR>', $td_contents);
            $tracklinks = explode('<ROMPR>', $td_contents);
        } else {
            if ($td_contents) {
                array_push($track['meta'], $td_contents);
            }
        }

    }

    $track['links'] = array();

    for($z = 0; $z < count($trackformats); $z++) {
        if ($trackformats[$z] != "f" &&
            $trackformats[$z] != "FlashPlayer" &&
            $trackformats[$z] != "Flash" &&
            $trackformats[$z] != "Flash Player" &&
            $trackformats[$z] != "WebPlayer") {

            $d = new DOMDocument;
            $d->loadHTML($tracklinks[$z]);
            $links = $d->getElementsByTagName('a');
            foreach($links as $l) {
                $text = DOMinnerHTML($l);
                $link = $l->getAttribute('href');
                if ($text != "f" &&
                    $text != "FlashPlayer" &&
                    $text != "Flash" &&
                    $text != "Flash Player" &&
                    $text != "WebPlayer") {

                    array_push($track['links'], array( 'text' => $text, 'url' => $link, 'type' => $trackformats[$z] ));
                }

            }

        }

    }

    if ($track['title'] && count($track['links']) > 0) {
        $imgname = getStationImage($track['title']);
        print '<div class="containerbox indent padright wibble menuitem" style="padding-bottom:2px;padding-top:10px">';
        print '<div class="smallcover fixed"><img class="smallcover fixed" src="'.$imgname.'" /></div>';
        print '<div class="expand" style="margin-top:6px"><span style="font-size:120%">'.$track['title'].'</span></div>';
        print '</div>';
        print '<div class="containerbox indent padright bum">';
        print '<div class="smallcoverpadder fixed"></div><div class="expand">'.implode(' ', $track['meta']).'</div>';
        print '</div>';
        foreach ($track['links'] as $k) {
            print '<div class="clickable clickstream indent containerbox padright menuitem" name="'.$k['url'].'" streamname="'.$track['title'].'" streamimg="'.$imgname.'">';

            $littleimg = "";
            switch($k['type']) {
                case "Windows Media":
                    $littleimg = "newimages/wma_16.png";
                    break;
                case "aacplus":
                case 'aacPlus':
                    $littleimg = "newimages/aac_16.png";
                    break;
                case "mp3":
                case "MP3":
                    $littleimg = "newimages/mp3_16.png";
                    break;
                case "ogg Vorbis":
                    $littleimg = "newimages/ogg_16.png";
                    break;

            }
            print '<div class="fixed"><img src="'.$littleimg.'" style="margin-right:6px"/></div>';
            print '<div class="expand">'.$k['text'].' '.$k['type'].'</div>';
            print '</div>';
        }
    }
}

debug_print("Finished","RADIOPARSER");

print '</div>';

function DOMinnerHTML(DOMNode $element)
{
    $innerHTML = "";
    $children  = $element->childNodes;

    foreach ($children as $child)
    {
        $innerHTML .= $element->ownerDocument->saveHTML($child);
    }

    return $innerHTML;
}

function getStationImage($name) {
    $nospaces = preg_replace('/ /','_',$name);
    if (file_exists('prefs/userimages/'.$nospaces.'.png')) {
        return 'prefs/userimages/'.$nospaces.'.png';
    } else if (file_exists('resources/'.$nospaces.'.png')) {
        return 'resources/'.$nospaces.'.png';
    } else {
        $nospaces = preg_replace('/_\(.*?\)$/', '', $nospaces);
        if (file_exists('resources/'.$nospaces.'.png')) {
            return 'resources/'.$nospaces.'.png';
        }
    }
    return 'newimages/broadcast.png';

}

?>

