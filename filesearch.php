<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
include ("international.php");
?>
<div>
<form name="filesearch" action="filesearch.php" method="get">
<ul class="sourcenav">
<?php
print '<li><b>'.get_int_text("label_filesearch").'</b></li>';
print '<li><input class="sourceform winkle" name="searchtitle" type="text" size="60" />';
print '<button onclick="doSomethingUseful(\'filesearch\', \''.get_int_text("label_searching").'\')" type="submit">'.get_int_text("button_search").'</button></li>';
?>
</ul>
</form>
</div>
<?php

$cmd = "";

if(array_key_exists("searchtitle", $_REQUEST)) {
    $cmd = 'search file "'.format_for_mpd(html_entity_decode($_REQUEST['searchtitle'])).'"';
}

if ($cmd != "") {

    $count = 1;
    doFileSearch($cmd);

}

close_mpd($connection);

function doFileSearch($cmd) {
    global $FILESEARCH;
    $output = new collectionOutput($FILESEARCH);
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
