<?php

loadOldPrefs();
unlink('prefs/prefs');
savePrefs();

function loadOldPrefs() {
    global $prefs;
    if (file_exists('prefs/prefs')) {
        $fp = fopen('prefs/prefs', 'r');
        if($fp) {
            $crap = true;
            if (flock($fp, LOCK_EX, $crap)) {
                $fcontents = array();
                while (!feof($fp)) {
                    array_push($fcontents, fgets($fp));
                }
                flock($fp, LOCK_UN);
                if(!fclose($fp)) {
                    error_log("ERROR!              : Couldn't close the prefs file.");
                    exit(1);
                }
                if (count($fcontents) > 0) {
                    foreach($fcontents as $line) {
                        $a = explode("||||", $line);
                        if (is_array($a) && count($a) > 1) {
                            $prefs[$a[0]] = trim($a[1]);
                        }
                    }
                } else {
                    error_log("===============================================");
                    error_log("ERROR!              : COULD NOT READ PREFS FILE");
                    error_log("===============================================");
                    exit(1);
                }
            } else {
                error_log("================================================================");
                error_log("ERROR!              : COULD NOT GET READ FILE LOCK ON PREFS FILE");
                error_log("================================================================");
                fclose($fp);
                exit(1);
            }
        } else {
            error_log("=========================================================");
            error_log("ERROR!              : COULD NOT GET HANDLE FOR PREFS FILE");
            error_log("=========================================================");
            exit(1);
        }
    }
}

?>
