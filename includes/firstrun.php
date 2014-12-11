<?php
if (!is_dir('prefs/imagecache')) {
	mkdir('prefs/imagecache');
}
if (!is_dir('prefs/podcasts')) {
	mkdir('prefs/podcasts');
}
if (!is_dir('prefs/jsoncache')) {
	mkdir('prefs/jsoncache');
}
if (!is_dir('prefs/jsoncache/discogs')) {
	mkdir('prefs/jsoncache/discogs');
}
if (!is_dir('prefs/jsoncache/musicbrainz')) {
	mkdir('prefs/jsoncache/musicbrainz');
}
if (!is_dir('prefs/jsoncache/wikipedia')) {
	mkdir('prefs/jsoncache/wikipedia');
}
if (!is_dir('prefs/jsoncache/lastfm')) {
	mkdir('prefs/jsoncache/lastfm');
}
if (!is_dir('prefs/jsoncache/spotify')) {
	mkdir('prefs/jsoncache/spotify');
}
if (!is_dir('prefs/jsoncache/lyrics')) {
	mkdir('prefs/jsoncache/lyrics');
}

if ($prefs['apache_backend'] == 'sql') {
	list($result, $message) = check_sql_tables();
	if ($result == false) {
		initfail($message);
	}
}

debug_print("Initialisation done. Let's Boogie!", "INIT");
debug_print("=================****==================","    =    ");

function initfail($message) {

    header("HTTP/1.1 500 Internal Server Error");
?>
<html><head>
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="stylesheet" type="text/css" href="themes/Darkness.css" />
<title>Badgers!</title>
</head>
<body>
<h2 align="center" style="font-size:300%">SQL Server Error!</h2>
<br><br>
<h2 align="center">It's all gone horribly wrong</h2>
<br><br>
<h3 align="center">Rompr encountered an error while checking your SQL database.</h3>
<h3 align="center">The message was:</h3><br>
<?php
	print '<div class="bordered" style="width:75%;margin:auto"><p align="center"><b>'.$message.'</b></p></div></body></html>';
	askForMpdValues("");
	exit(0);

}
?>
