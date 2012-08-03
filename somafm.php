<ul class="sourcenav">
<li><img src="images/somafm.png" width="128px"></li>
<li><a href="http://somafm.com" target="_blank">Please donate to soma fm to keep it running!</a></li>
<?php
$x = simplexml_load_file("resources/somafm.xml");
foreach($x->stations->station as $i => $station) {
    print '<li><table cellspacing="4">';
    print '<tr><td colspan="2"><h3 class="soma">'.$station->name.'</h3></td></tr>';
    print '<tr><td><img src="'.$station->image.'" height="64px"></td>';
    print '<td>'.$station->description.'</td></tr>';
    print '<tr><td colspan="2">';
    foreach($station->link as $j => $link) {
        $pl = $link->desc;
        $pl = preg_replace('/ /', '&nbsp;', $pl);
        print '<a class="tiny" href="#" onclick="doPLSStream(\''.$link->playlist.'\', \''.$station->image.'\', \''.$station->name.'\', \'Soma FM\')">'.$pl.'</a>';
    }
    print '</td></tr></table></li><hr>'."\n";
}
?>
</ul>
