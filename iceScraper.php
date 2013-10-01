<?php

include("vars.php");
include("functions.php");
// The HTML parser doesn't link the icecast page very much
// Their HTML is obviously crap :)
// So we need to disable error reporting for this page otherwise people using php development settings
// on their apache server will see a mass of crap in the icecast panel.
// Comment out the following line when trying to debug this script.
error_reporting(0);
$getstr = "http://dir.xiph.org/";
if (array_key_exists('path', $_REQUEST)) {
	$getstr = $getstr . $_REQUEST['path'];
	if (array_key_exists('page', $_REQUEST)) {
		$getstr = $getstr . "&page=" . $_REQUEST['page'];
	}
} else if (array_key_exists('searchfor', $_REQUEST)) {
	$getstr = $getstr . "search?search=" . $_REQUEST['searchfor'];
}
$content = url_get_contents($getstr);

$DOM = new DOMDocument;
$DOM->loadHTML($content['contents']);
$stuff = $DOM->getElementById('content');

// Munge links
$items = $stuff->getElementsByTagName('a');
for ($i = 0; $i < $items->length; $i++) {
    $link = $items->item($i)->getAttribute('href');
 	$items->item($i)->removeAttribute('onclick');
    if (substr($link, 0, 8) == '/listen/') {
    	// $items->item($i)->setAttribute('href', '#');
    	// $items->item($i)->setAttribute('onclick', "getInternetPlaylist('http://dir.xiph.org".$link."', 'newimages/icecast.png', null, null)");
    } else if (substr($link, 0, 10) == '/by_genre/') {
    	$items->item($i)->setAttribute('href', '#');
    	$items->item($i)->setAttribute('onclick', "refreshMyDrink('".$link."')");
    } else if (substr($link, 0, 11) == '/by_format/') {
    	$items->item($i)->setAttribute('href', '#');
    	$items->item($i)->setAttribute('onclick', "refreshMyDrink('".$link."')");
    } else if (substr($link, 0, 7) == 'http://') {
    	$items->item($i)->setAttribute('target', '_blank');
    } else if (substr($link, 0,8) == "?search=") {
    	$items->item($i)->setAttribute('href', '#');
    	$items->item($i)->setAttribute('onclick', "refreshMyDrink('/search".$link."')");
    }
}

// Munge descriptions to permit text wrapping (replace '/' with '/ ' unless it's preceeded or followed by another /)
$items = $stuff->getElementsByTagName('p');
for ($i = 0; $i < $items->length; $i++) {
	if ($items->item($i)->hasAttribute('class') && $items->item($i)->getAttribute('class') == 'stream-description') {
		$monkeyjesus = preg_replace('/(?<!\/)\/(?!\/)/', '/ ', $items->item($i)->nodeValue);
		$items->item($i)->nodeValue = htmlspecialchars($monkeyjesus);
	}
}

// Munge playback links - we only want the xspf link and we can display it more prettily
$items = $stuff->getElementsByTagName('td');
for ($i = 0; $i < $items->length; $i++) {
	if ($items->item($i)->hasAttribute('class') && $items->item($i)->getAttribute('class') == 'tune-in') {
		$link = "";
		$pls = $items->item($i)->getElementsByTagName('a');
		for ($j = 0; $j < $pls->length; $j++) {
		    $l = $pls->item($j)->getAttribute('href');
		    if (substr($l, -5) == ".xspf") {
		    	$link = $l;
		    	break;
		    }
		}
		if ($link != "") {
			$items->item($i)->nodeValue = "";
			$f = $DOM->createDocumentFragment();
			$f->appendXML('<p><a href="#" onclick="getInternetPlaylist(\'http://dir.xiph.org'.$link.'\', \'newimages/icecast.png\', null, null)"><img src="newimages/start.png" /></a></p>');
			$items->item($i)->appendChild($f);
		}
	}
}

// Why I can't just output that node to HTML is anybody's guess.
// PHP is a bit shit sometimes. Written by programmers, who don't think like normal people.
// Of course, it might be possible to do it, but if it is then it sure isn't obvious.
$outdoc = new DOMDocument;
$outdoc->formatOutput = true;
$stuff = $outdoc->importNode($stuff, true);
$outdoc->appendChild($stuff);
?>

<div class="containerbox fullwidth">
<form name="searchice" action="iceScraper.php" method="get">
<ul class="sourcenav">
<li><b>Search For:</b></li>
<li><input class="sourceform winkle" name="searchfor" type="text" size="60" />
<button type="submit">Search</button></li>
</ul>
</form>
</div>
<div class="containerbox fullwidth">
<div class="expand">
<?php
print $outdoc->saveHTML();
?>
</div>
</div>
<script type="text/javascript">

$('form[name="searchice"]').ajaxForm(function(data) {
    $('#icecastlist').html(data);
});

<?php
if (array_key_exists("searchfor", $_REQUEST)) {
    print '    $(\'input[name="searchfor"]\').val(\''.$_REQUEST['searchfor'].'\');'."\n";
}
?>

</script>