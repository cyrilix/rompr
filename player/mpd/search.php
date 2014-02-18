<div id="mopidysearcher" style="padding:6px">
    <div class="containerbox padright">
<?php
print '<h3>'.get_int_text("label_searchfor").'</h3>';
?>
    </div>
    <div class="containerbox padright wibble">
<?php
print '<i>'.get_int_text("label_multiterms").'</i>';
?>
    </div>

    <div class="containerbox padright dropdown-container">
<?php
$labia = strlen(htmlspecialchars_decode(get_int_text("label_artist"), ENT_QUOTES));
foreach(array(get_int_text("label_album"), get_int_text("label_track"), get_int_text("label_tag")) as $a) {
    if (strlen(htmlspecialchars_decode($a, ENT_QUOTES)) > $labia) {
        debug_print("Setting search box width from ".htmlspecialchars_decode($a, ENT_QUOTES)." to ".strlen(htmlspecialchars_decode($a, ENT_QUOTES))."em","SEARCH");
        $labia = strlen(htmlspecialchars_decode($a, ENT_QUOTES));
    }
}
$labia -= 1;
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_artist").'</b></div>';
?>
        <div class="expand"><input class="searchterm enter sourceform" name="artist" type="text" /></div>
    </div>

    <div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_album").'</b></div>';
?>
        <div class="expand"><input class="searchterm enter sourceform" name="album" type="text" /></div>
    </div>

    <div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_track").'</b></div>';
?>
        <div class="expand"><input class="searchterm enter sourceform" name="title" type="text" /></div>
    </div>

<?php
if ($prefs['apache_backend'] == "sql") {
?>
    <div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_tag").'</b></div>';
?>
        <div class="expand dropdown-holder">
            <input class="searchterm enter sourceform" name="tag" type="text" style="width:100%;font-size:100%"/>
            <div class="drop-box dropshadow tagmenu" style="width:100%">
                <div class="tagmenu-contents">
                </div>
            </div>
        </div>
        <div class="fixed dropdown-button">
            <img src="newimages/dropdown.png">
        </div>
    </div>

    <div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed" style="width:'.$labia.'em"><b>'.get_int_text("label_rating").'</b></div>
        <div class="expand">
        <select name="searchrating">
        <option value="5">5 '.get_int_text('stars').'</option>
        <option value="4">4 '.get_int_text('stars').'</option>
        <option value="3">3 '.get_int_text('stars').'</option>
        <option value="2">2 '.get_int_text('stars').'</option>
        <option value="1">1 '.get_int_text('star').'</option>
        <option value="" selected></option>
        </select>
       </div>
    </div>';
}
?>
    <div class="indent containerbox padright">
        <div class="expand"></div>
<?php
print '<button class="fixed" onclick="player.controller.search(\'search\')">'.get_int_text("button_search").'</button>';
?>
    </div>

    <div id="searchresultholder" class="noselection fullwidth"></div>

</div>
<script type="text/javascript">
    $("#mopidysearcher input").keyup( function(event) {
        if (event.keyCode == 13) {
            player.controller.search('search');
        }
    } );
</script>
