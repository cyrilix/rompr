<div class="noselection fullwidth">
<?php
$x = simplexml_load_file("resources/bbcradio.xml");
foreach($x->stations->station as $i => $station) {

    print '<div class="clickable clickbbc indent containerbox padright menuitem" name="'.$station->playlist.'" bbcimg="'.$station->image.'">';
    print '<div class="fixed amid"><img width="20px" src="';
    if ($station->image) {
        print $station->image;
    } else {
        print "newimages/broadcast-24.png";
    }
    print '" /></div>';
    print '<div class="expand indent amid">'.$station->name.'</div>';
    print '</div>';
}
?>
</div>
