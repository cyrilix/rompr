<?php
$x = simplexml_load_file("resources/somafm.xml");
$count = 0;
print '<div class="noselection fullwidth">';
foreach($x->stations->station as $i => $station) {
    
    print '<div class="containerbox menuitem">';
    print '<img src="images/toggle-closed.png" class="menu fixed" name="somafm'.$count.'">';
    print '<div  class="smallcover fixed"><img height="32px" width="32px" src="'.$station->image.'" /></div>';
    print '<div class="expand">'.utf8_encode($station->name).'</div>';
    print '</div>';
   
    print '<div id="somafm'.$count.'" class="dropmenu">';
    print '<div class="containerbox indent padright">';
    print '<div class="expand whatdoicallthis">'.$station->description.'</div>';
    print '</div>';
    foreach($station->link as $j => $link) {
        $pl = preg_replace('/ /', '&nbsp;', $link->desc);
        print '<div class="clickable clicksoma indent containerbox padright menuitem" name="'.$link->playlist.'" somaimg="'.$station->image.'" somaname="'.$station->name.'">';
        print '<div class="playlisticon fixed"><img height="12px" src="images/broadcast.png" /></div>';
        print '<div class="expand">'.utf8_encode($pl).'</div>';
        print '</div>';
    }
    print '</div>';
    $count++;

}
print '</div>';

?>
