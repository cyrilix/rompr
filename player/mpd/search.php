<?php
require_once("includes/vars.php");
require_once("includes/functions.php");
require_once("international.php");

?>
<div class="containerbox" style="width:100%">
<form name="search" action="albums.php" method="get">
<ul class="sourcenav">
<?php
print '<li><b>'.get_int_text("label_searchfor").'</b></li>';
print '<li><input type="radio" name="stype" value="title"> '.get_int_text("label_track").'</input></li>';
print '<li><input type="radio" name="stype" value="album"> '.get_int_text("label_album").'</input></li>';
print '<li><input type="radio" name="stype" value="artist"> '.get_int_text("label_artist").'</input></li>';
print '<li><input class="sourceform winkle" name="searchtitle" type="text" />';
print '<button id="henrythegippo" type="submit" onclick="doSomethingUseful(\'search\',\''.get_int_text("label_searching").'\')">'.get_int_text("button_search").'</button></li>';
?>
</ul>
</form>
</div>
<script type="text/javascript">
$('form[name="search"]').ajaxForm(function(data) {
    $('#search').html(data);
});
<?php
    $pigeon = "artist";
    if (array_key_exists("stype", $_REQUEST)) {
        $pigeon = $_REQUEST['stype'];
    }

    print '    $(\'input[value="'.$pigeon.'"]\').attr("checked", true);'."\n";

    if (array_key_exists("searchtitle", $_REQUEST)) {
        print '    $(\'input[name="searchtitle"]\').val(\''.addslashes($_REQUEST['searchtitle']).'\');'."\n";
    }
?>
</script>
