<?php

include("vars.php");
include("functions.php");
include("international.php");

error_reporting(0);
$getstr = "http://www.listenlive.eu/uk.html";
$content = url_get_contents($getstr);

// <tr>
// <td><a href="http://www.bbc.co.uk/radio1/"><b>BBC Radio 1</b></a></td>
// <td>National</td>
// <td><img src="wma.gif" width="12" height="12" alt="Windows Media" /><br /><img src="aacplus.gif" width="12" height="12" alt="aacplus" /></td>
// <td><a href="http://bbc.co.uk/radio/listen/live/r1.asx">128 Kbps</a><br /><a href="http://www.bbc.co.uk/radio/listen/live/r1_aaclca.pls">128 Kbps</a></td>
// <td>Top 40/Dance</td>
// </tr>

$DOM = new DOMDocument;
$DOM->loadHTML($content['contents']);
$stuff = $DOM->getElementById('thetable3');

print '<div class="noselection fullwidth">';

$rows = $stuff->getElementsByTagName('tr');
for ($i=0; $i<$rows->length; $i++) {
    $bits = $rows->item($i)->getElementsByTagName('td');
    for($j=0; $j<$bits->length; $j++) {

        $links = $bits->item($j)->getElementsByTagName('a');
        foreach ($links as $l) {
            // debug_print(DOMinnerHTML($l),"RADIOPARSER");
            // debug_print($l->getAttribute('href'),"RADIOPARSER");
            $title = DOMinnerHTML($l);
            $link = $l->getAttribute('href');
            if (preg_match('/<b>/', $title)) {
                print '<div class="containerbox indent padright wibble">';
                print '<div class="expand" style="margin-top:6px"><span style="font-size:110%">'.$title.'</span></div>';
                print '</div>';
                $rtitle = $title;
            }
            if (preg_match('/Kbps/', $title)) {
                print '<div class="clickable clickfmradio indent containerbox padright" name="'.(string) $link.'" fmname="'.(string) $rtitle.'" fmthing="UK Radio">';
                print '<div class="indent expand">'.$title.'</div>';
                print '</div>';
            }



        }


    }
}


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


?>

