<html>
<head>
<?php
// Custom redirect for small album covers that don't exist.
$request = $_SERVER['REQUEST_URI'];
if (preg_match('/albumart\/small\//', $request)) {
    Header("HTTP/1.1 301 Moved Permanently");
    Header("Location: /rompr/images/album-unknown-small.png");
} else {
?>
<title>Badgers!</title>
</head>
<body>
<h2>It's all gone horribly wrong</h2>
<?php
print "The document ".$request." doesn't exist. Are you sure you know what you're doing?";
?>
</body>
<?php
}
?>
</html>