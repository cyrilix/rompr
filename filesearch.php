<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");
?>

<form name="filesearch" action="filesearch.php" method="get">
<ul class="sourcenav">
<li><b>Search For Files Containing:</b></li>
<li><input class="sourceform" name="searchtitle" type="text" size="60" />
<button class="topformbutton" type="submit">Search</button></li>
</ul>
</form>

<?php

$cmd = "";

if(array_key_exists("searchtitle", $_REQUEST)) {
    $cmd = 'search file "'.format_for_mpd(html_entity_decode($_REQUEST['searchtitle'])).'"';
}

if ($cmd != "") {
    
    $count = 1;
    $tree = doFileList($cmd);
    print '<div id="artistname">';
    print "<h3>Search Results:</h3>";
    print "</div>";
    $ihatephp = fopen('prefs/filesearch.html', 'w');
    $tree->root->createHTML("b");
    fclose($ihatephp);
    $file = fopen('prefs/filesearch.html', 'r');
    while(!feof($file))
    {
        echo fgets($file);
    }
    fclose($file);
    print '<div class="separator"></div>';

}

close_mpd($connection);

?>

<script type="text/javascript"> 

$('form[name="filesearch"]').ajaxForm(function(data) { 
    $('#filesearch').html(data);
}); 

</script>
