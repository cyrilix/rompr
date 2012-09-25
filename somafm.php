<?php
$x = simplexml_load_file("resources/somafm.xml");
$count = 0;
foreach($x->stations->station as $i => $station) {
    
    $count++;
   
    print '<div id="artistname">';
    print '<table><tr style="vertical-align:top"><td rowspan="2" style="width:24px">';
    print '<a href="#" onclick="doMenu(\'somafm'.$count.'\');" name="somafm'.$count.'"><img src="images/toggle-closed.png"></a></td><td rowspan="2">' . "\n";
    print '<img src="'.$station->image.'" height="32"></td><td>';
    print $station->name;
    print '</td></tr><tr><td style="font-weight:normal;font-size:96%">'.$station->description."</td></tr></table></div>\n";

    print '<div id="albummenu" name="somafm'.$count.'">' . "\n";
    print '<table width="100%">';
    foreach($station->link as $j => $link) {
        $pl = preg_replace('/ /', '&nbsp;', $link->desc);
        print '<tr><td width="56px"></td><td><b><a href="#" onclick="getInternetPlaylist(\''.$link->playlist.'\', \''.$station->image.'\', \''.$station->name.'\', \'Soma FM\')">'.$pl.'</a></b></td></tr>';
    }
    print '</table></div>';

}
?>
