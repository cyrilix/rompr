<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
?>
<div>
<form name="search" action="search.php" method="get">
<ul class="sourcenav">
<li><b>Search For:</b></li>
<li><input type="radio" name="stype" value="title"> Track</input></li>
<li><input type="radio" name="stype" value="album"> Album</input></li>
<li><input type="radio" name="stype" value="artist"> Artist</input></li>
<li><input class="sourceform winkle" name="searchtitle" type="text" size="60" />
<button id="henrythegippo" type="submit" onclick="doSomethingUseful()">Search</button></li>
</ul>
</form>
</div>
<?php

$cmd = "";

if(array_key_exists("findalbum", $_REQUEST)) {
    $cmd = "find ";
    if ($_REQUEST['findalbum'] != "") {
        $cmd = $cmd . 'album "'.format_for_mpd(html_entity_decode($_REQUEST['findalbum'])).'" ';
    }
    if ($_REQUEST['findartist'] != "") {
        $cmd = $cmd . 'artist "'.format_for_mpd(html_entity_decode($_REQUEST['findartist'])).'"';
    }
}

if(array_key_exists("searchtitle", $_REQUEST)) {
    $cmd = "search ".$_REQUEST['stype'].' "'.format_for_mpd(html_entity_decode($_REQUEST['searchtitle'])).'"';
}

if ($cmd != "") {
    
    $count = 1;
    $divtype = "album1";
    $collection = doCollection($cmd);
    doSearch($ALBUMSEARCH);
    print '<div class="menuitem">';
    print "<h3>Search Results:</h3>";
    print "</div>";
    dumpAlbums('balbumroot');
    print '<div class="separator"></div>';

}

close_mpd($connection);

function doSearch($file) {

    global $collection;
    $output = new collectionOutput($file);
    createXML($collection->getSortedArtistList(), "b", $output);  
    $output->closeFile();

}

?>

<script type="text/javascript"> 

$('form[name="search"]').ajaxForm(function(data) { 
    $('#search').html(data);
}); 

<?php
$pigeon = "title";
if (array_key_exists("stype", $_REQUEST)) {
    $pigeon = $_REQUEST['stype'];
}
print '    $(\'input[value="'.$pigeon.'"]\').attr("checked", true);'."\n";

if (array_key_exists("searchtitle", $_REQUEST)) {
    print '    $(\'input[name="searchtitle"]\').val(\''.$_REQUEST['searchtitle'].'\');'."\n";
}

if (array_key_exists("findalbum", $_REQUEST)) {
    print '    $(\'input[name="findalbum"]\').val(\''.$_REQUEST['findalbum'].'\');'."\n";
}

if (array_key_exists("findartist", $_REQUEST)) {
    print '    $(\'input[name="findartist"]\').val(\''.$_REQUEST['findartist'].'\');'."\n";
}

?>
</script>
