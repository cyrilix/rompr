<?php
ob_start();
include ("vars.php");
include ("functions.php");
if(array_key_exists("url", $_REQUEST)) {
    get_lfm_page( $_REQUEST['url'] );
} else {
    header('HTTP/1.1 400 Bad Request');
}
ob_flush();

function get_lfm_page($page) {

    $content = url_get_contents($page."/+wiki");
    $html = $content['contents'];
    $html = preg_replace('/\n/', '</p><p>', $html);
    $html = preg_replace('/<br \/>/', '', $html);
    $matches = array();
    preg_match('/<div id=\"wiki\">(.*?)<\/div>/', $html, $matches);
    if (array_key_exists(1, $matches)) {
        print "<p>".$matches[1]."</p>";
    } else {
        header('HTTP/1.1 400 Bad Request');
    }
}

?>
