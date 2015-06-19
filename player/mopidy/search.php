<div id="collectionsearcher" style="padding:6px">

<?php
$sterms = array(
    "label_artist" => "artist",
    "label_album" => "album",
    "label_track" => "track_name",
    "label_genre" => "genre",
    "label_composer" => "composer",
    "label_performer" => "performer",
    "label_anything" => "any"
);
include("skins/search.php");

print '<div class="containerbox padright dropdown-container" style="padding-top:4px">';
print '<input class="autoset toggle" type="checkbox" id="search_limit_limitsearch">'.get_int_text("label_limitsearch").'</input>';
print '</div>';

print '<div class="dropmenu" id="mopidysearchdomains" style="margin-top:4px">';
foreach ($searchlimits as $domain => $text) {
    // Need 'fullwidth' for bloody stupid firefox. divs are SUPPOSED to fill the width of their container, fuckwits.
    print '<div class="indent containerbox padright fullwidth dropdown-container">';
    print '<input type="checkbox" class="searchdomain autoset toggle" id="search_limit_'.$domain.'" value="'.$domain.'"';
    print '>'.$text.'</input>';
    print '</div>';
}
print '</div>';
?>
<div class="indent containerbox padright">
    <div class="expand"></div>
<?php
print '<button class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
</div>
<div id="searchresultholder" class="noselection"></div>
</div>
