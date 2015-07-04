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
// foreach ($searchlimits as $domain => $text) {
//     // Need 'fullwidth' for bloody stupid firefox. divs are SUPPOSED to fill the width of their container, fuckwits.
//     print '<div class="indent containerbox padright fullwidth dropdown-container">';
//     print '<input type="checkbox" class="searchdomain autoset toggle" id="search_limit_'.$domain.'" value="'.$domain.'"';
//     print '><label for="search_limit_'.$domain.'">'.$text.'</label>';
//     print '</div>';
// }
print '</div>';
?>
<div class="containerbox">
    <div class="expand"></div>
<?php
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'find\')">'.get_int_text("button_findexact").'</button>';
print '<button style="margin-right:4px" class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
</div>
<div id="searchresultholder" class="noselection fullwidth"></div>
</div>
