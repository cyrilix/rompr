<div id="mopidysearcher" style="padding:6px">
<?php
$sterms = array(
    "label_artist" => "artist",
    "label_album" => "album",
    "label_track" => "title",
    "label_genre" => "genre",
    "label_composer" => "composer",
    "label_performer" => "performer"
);
include("layouts/search.php");
?>
<div class="indent containerbox padright">
    <div class="expand"></div>
<?php
print '<button class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
</div>
<div id="searchresultholder" class="noselection fullwidth"></div>
</div>
