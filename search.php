<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");
?>
<!-- 
<form name="find" action="search.php" method="get">
<ul class="sourcenav">
There is a massive problem to be solved for laying out items in HTML pages
     css is not the answer. I HATE IT I HATE IT I HATE IT (or I'm just shit at it) -->
     
<!-- <li><b>Find Exact Match For:</b></li>     
<li><table width="100%">
<tr><td><b>Artist</b></td><td><input class="sourceform" name="findartist" type="text" size="60" style="width:100%" /></td></tr>
<tr><td><b>Album</b></td><td><input class="sourceform" name="findalbum" type="text" size="60" style="width:100%"/></td></tr>
<tr><td colspan="2" align="right"><button class="topformbutton" type="submit">Find</button></td></tr></table></li>
</ul>
</form> -->

<form name="search" action="search.php" method="get">
<ul class="sourcenav">
<li><b>Search For:</b></li>
<li><input type="radio" name="stype" value="title"> Track</input></li>
<li><input type="radio" name="stype" value="album"> Album</input></li>
<li><input type="radio" name="stype" value="artist"> Artist</input></li>
<li><input class="sourceform" name="searchtitle" type="text" size="60" />
<button class="topformbutton" type="submit">Search</button></li>
</ul>
</form>

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
    print '<div id="artistname">';
    print "<h3>Search Results:</h3>";
    print "</div>";
    createHTML($collection->getSortedArtistList(), "b");
    print '<div class="separator"></div>';

}

close_mpd($connection);

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
