<div id="collectionsearcher" style="padding:6px">
<?php
$sterms = array(
    "label_artist" => "artist",
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
print '<div id="searchdomaincontrol" class="podoptions containerbox padright dropdown-container styledinputs" style="padding-top:4px">';
print '<input class="autoset toggle" type="checkbox" id="search_limit_limitsearch">
<label for="search_limit_limitsearch">'.get_int_text("label_limitsearch").'</label>';
print '</div>';

print '<div class="dropmenu styledinputs" id="mopidysearchdomains" style="margin-top:4px">';
print '</div>';
?>
<div class="containerbox">
    <div class="expand"></div>
<?php
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'find\')">'.get_int_text("button_findexact").'</button>';
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
</div>
</div>
