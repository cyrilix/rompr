<?php
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
include ("backends/xml/backend.php");
include ("backends/xml/filelister.php");
include ("international.php");
?>
<div style="padding:6px">
<form name="filesearch" action="filesearch.php" method="get">
<?php
print '<div clas="containerbox"><div class="expand"><b>'.get_int_text("label_filesearch").'</b></div></div>';
print '<div class="containerbox"><div class="expand"><input name="searchtitle" type="text" /></div>';
print '<button class="fixed" onclick="doSomethingUseful(\'filesearch\', \''.get_int_text("label_searching").'\')" type="submit">'.get_int_text("button_search").'</button></div>';
?>
</form>
</div>
<?php

if(array_key_exists("searchtitle", $_REQUEST)) {
    $cmd = 'search file "'.format_for_mpd(html_entity_decode($_REQUEST['searchtitle'])).'"';
    $count = 1;
    doFileSearch($cmd);
}

close_player($connection);

function doFileSearch($cmd) {
    $output = new collectionOutput(ROMPR_FILESEARCH_LIST);
    $tree = doFileList($cmd);
    $tree->getXML("b", $output);
    $output->closeFile();
    print '<div class="menuitem">';
    print "<h3>".get_int_text("label_searchresults")."</h3>";
    print "</div>";
    dumpTree('bdirroot');
    print '<div class="separator"></div>';
}

?>

<script type="text/javascript">
$('form[name="filesearch"]').ajaxForm(function(data) {
    $('#filesearch').html(data);
});
</script>
