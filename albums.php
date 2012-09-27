<div style="padding-left:12px">
<a href="#" title="Search Music" onclick="toggleSearch()"><img class="topimg" height="20px" src="images/system-search.png"></a>
</div>
<div id="search" class="invisible searchbox">
</div>

<script language="javascript">
$(document).ready(function(){
    $('#search').load("search.php");
});
</script>

<?php

include ("vars.php");
include ("functions.php");
include ("connection.php");
include ("collection.php");

$count = 1;
$divtype = "album1";
$collection = doCollection("listallinfo");
createHTML($collection->getSortedArtistList(), "a");
close_mpd($connection);

?>  

