<?php
$x = simplexml_load_file("resources/somafm.xml");
$count = 0;
foreach($x->stations->station as $i => $station) {
    
    $count++;
   
    print '<div id="albumname">';
    print '<table><tr><td rowspan="2" style="width:32px">';
    print '<a href="javascript:doMenu(\'somafm'.$count.'\');" class="toggle" name="somafm'.$count.'"><img src="images/toggle-closed.png"></a></td><td rowspan="2">' . "\n";
    print '<img style="vertical-align:middle" src="'.$station->image.'" height="32"></td><td>';
    print $station->name;
    print '</td></tr><tr><td style="font-weight:normal">'.$station->description."</td></tr></table></div>\n";

    print '<div id="albummenu" name="somafm'.$count.'">' . "\n";
    print '<table width="100%">';
    foreach($station->link as $j => $link) {
        $pl = $link->desc;
        $pl = preg_replace('/ /', '&nbsp;', $pl);
        print '<tr><td><a href="#" onclick="getInternetPlaylist(\''.$link->playlist.'\', \''.$station->image.'\', \''.$station->name.'\', \'Soma FM\')">'.$pl.'</a></td></tr>';
    }
    print '</table></div>';

}
?>
