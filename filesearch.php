<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
?>
<div>
<form name="filesearch" action="filesearch.php" method="get">
<ul class="sourcenav">
<li><b>Search For Files Containing:</b></li>
<li><input class="sourceform winkle" name="searchtitle" type="text" size="60" />
<button onclick="doSomethingUseful('filesearch', 'Searching...')" type="submit">Search</button></li>
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
    print "<h3>Search Results:</h3>";
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
