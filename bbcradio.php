<div id="albumname" class="indent">
<table>
<?php
$x = simplexml_load_file("resources/bbcradio.xml");
foreach($x->stations->station as $i => $station) {
    print '<tr><td>';
    if ($station->image) {
        print '<img style="vertical=align:middle" width="20px" src="'.$station->image.'">';
    }
    print '</td><td>';
    print '<a href="#" onclick="getInternetPlaylist(\''.$station->playlist.'\', \''.$station->image.'\')">'.$station->name.'</a>';
    print '</td></tr>';
}
?>
</table>
</div>
