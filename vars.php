<?php
$prefs = array( "mpd_host" => "localhost",
                "mpd_port" => 6600,
                "consume" => 0,
                "repeat" => 0,
                "random" => 0,
                "crossfade" => 0,
                "volume" => 100,
                "lastfm_user" => "",
                "lastfm_scrobbling" => 0,
                "lastfm_autocorrect" => 0,
                "theme" => "BrushedAluminium.css",
                "scrobblepercent" => 50,
                "hidebrowser" => "false",
                "infosource" => "lastfm",
                "chooser" => "albumlist",
                "historylength" => 25,
                "dontscrobbleradio" => 0
                );
loadPrefs();

function savePrefs() {
    global $prefs;
    $fp = fopen('prefs/prefs', 'w');
    if($fp) {
        foreach($prefs as $key=>$value) {
            fwrite($fp, $key . "||||" . $value . "\n");
        }
        if(!fclose($fp)) {
            echo "Error! Couldn't close the prefs file.";
        }
    }
}

function loadPrefs() {
    global $prefs;
    if (file_exists('prefs/prefs')) {
        $fcontents = file ('prefs/prefs');
        if ($fcontents) {
            while (list($line_num, $line) = each($fcontents)) {
                $a = explode("||||", $line);
                if ($a[1]) {
                    $prefs[$a[0]] = trim($a[1]);
                }
            }
        }
    }
}

function setswitches() {
    global $prefs;
    global $connection;
    $localprefs = $prefs;
    foreach(array("consume", "repeat", "crossfade", "random") as $key => $option) {
        //error_log("Setting ".$option." to ".$localprefs[$option]);
        do_mpd_command($connection, $option." ".$localprefs[$option], null, false);
    }
    // This doesn't work because mpd only allows setting the volume during playback
    //do_mpd_command($connection, "setvol ".$localprefs["volume"], null, false);
}

?>
