<div style="padding-left:12px">
<a href="#" title="Search Files" onclick="toggleFileSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
</div>
<div id="filesearch" class="invisible searchbox">
</div>

<script language="javascript">
$(document).ready(function(){
    $('#filesearch').load("filesearch.php");
});
</script>

<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("filelister.php");

$count = 1;
$tree = doFileList("list file");
$tree->root->createHTML("a");
close_mpd($connection);

?>