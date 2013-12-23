<?php
include ("vars.php");
include ("functions.php");
include ("international.php");

print '<div class="containerbox indent padright wibble">';
print '<b>'.get_int_text("label_soma").'<br>';
print '<a href="http://somafm.com" target="_blank">'.get_int_text("label_soma_beg").'</a></b>';
print '</div>';

$x = simplexml_load_file("resources/somafm.xml");
$count = 0;
print '<div class="noselection fullwidth">';
foreach($x->stations->station as $i => $station) {

    print '<div class="containerbox menuitem wibble">';
    print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="somafm'.$count.'"></div>';
    print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$station->image.'" /></div>';
    print '<div class="expand"><span style="font-size:110%">'.utf8_encode($station->name).'</span><br><span class="whatdoicallthis">'.utf8_encode($station->description).'</span></div>';
    print '</div>';

    print '<div id="somafm'.$count.'" class="dropmenu wibble">';

    if ($station->longdesc) {
        print '<div class="containerbox indent padright wibble">';
        print '<div class="whatdoicallthis bum expand">'.utf8_encode($station->longdesc).'</div>';
        print '</div>';
    }
    foreach($station->link as $j => $link) {
        $pl = preg_replace('/ /', '&nbsp;', $link->desc);
        print '<div class="clickable clicksoma indent containerbox padright menuitem" name="'.$link->playlist.'" somaimg="'.$station->image.'" somaname="'.$station->name.'">';
        print '<div class="playlisticon fixed"><img height="12px" src="newimages/broadcast-12.png" /></div>';
        print '<div class="expand">'.utf8_encode($pl).'</div>';
        print '</div>';
    }
    print '</div>';
    $count++;

}
print '</div>';

?>
