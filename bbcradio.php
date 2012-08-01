<ul class="sourcenav">
<li><h3>Live BBC Radio</h3></li>
<li><table>
<?php
$x = simplexml_load_file("resources/bbcradio.xml");
foreach($x->stations->station as $i => $station) {
    print '<tr><td>';
    if ($station->image) {
        print '<img style="vertical=align:middle" width="24px" src="'.$station->image.'">';
    }
    print '</td><td>';
    print '<a href="#" onclick="doASXStream(\''.$station->playlist.'\', \''.$station->image.'\')">'.$station->name.'</a>';
    print '</td></tr>';
}
?>
</table></li>
</ul>
