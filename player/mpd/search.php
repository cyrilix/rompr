<div id="collectionsearcher" style="padding:6px">
<?php
$sterms = array(
    "label_artist" => "artist",
    "label_albumartist" => "albumartist",
    "label_album" => "album",
    "label_track" => "title",
    "label_genre" => "genre",
    "musicbrainz_date" => "date",
    "label_composer" => "composer",
    "label_performer" => "performer",
    "label_filename" => "file",
    "label_anything" => "any"
);
include("skins/search.php");
?>
<div class="containerbox">
    <div class="expand"></div>
<?php
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'find\')">'.get_int_text("button_findexact").'</button>';
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
</div>
</div>
