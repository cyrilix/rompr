<?php
include ("vars.php");
//error_log("Saving prefs");
foreach($_POST as $key => $value) {
    //error_log($key."=".$value);
    if ($key == "lastfm_session_key") {
        $fp = fopen('prefs/prefs.js', 'w');
        if($fp) {
            fwrite($fp, 'var lastfm_session_key="'.$value.'";'."\n");
            fclose($fp);
        }
    } else {
        $prefs[$key] = $value;
    }
}
savePrefs();
?>
<html><body></body></html>