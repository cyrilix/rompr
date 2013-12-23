<?php
ob_start();
include ("vars.php");
include ("functions.php");
if(array_key_exists("url", $_REQUEST)) {
    $lang = array_key_exists("lang", $_REQUEST) ? $_REQUEST["lang"] : false;
    get_lfm_page( $_REQUEST['url'], $lang );
} else {
    header('HTTP/1.1 400 Bad Request');
}
ob_flush();

function get_lfm_page($page, $lang) {
    $url = $page."/+wiki";
   if ($lang) {
        debug_print("Getting Bio with language ".$lang,"LFMBIO");
        $url .= "?lang=".$lang;
    }
    if (file_exists('prefs/jsoncache/lastfm/'.md5($url))) {
        debug_print("Returning cached data","LFMBIO");
        print file_get_contents('prefs/jsoncache/lastfm/'.md5($url));
    } else {
        $content = url_get_contents($url);
        if ($content['status'] == "200") {
            $html = $content['contents'];
            $html = preg_replace('/\n/', '</p><p>', $html);
            $html = preg_replace('/<br \/>/', '', $html);
            $matches = array();
            preg_match('/<div id=\"wiki\">(.*?)<\/div>/', $html, $matches);
            if (array_key_exists(1, $matches)) {
                file_put_contents('prefs/jsoncache/lastfm/'.md5($url), '<p>'.$matches[1].'</p>');
                print "<p>".$matches[1]."</p>";
            } else {
                header('HTTP/1.1 400 Bad Request');
            }
        } else {
            header('HTTP/1.1 400 Bad Request');
        }
    }
}

?>
