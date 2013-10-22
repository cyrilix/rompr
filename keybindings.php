<?php
include ("vars.php");

$keys = array(  "nextrack" => "right+++right",
                "prevtrack" => "left+++left",
                "stop" => "space+++space",
                "play" => "P+++P",
                "volumeup" => "A+++A",
                "volumedown" => "Z+++Z"
            );

loadKeyBindings();

function loadKeyBindings() {
    global $keys;
    if (file_exists('prefs/keybindings')) {
        $fcontents = file ('prefs/keybindings');
        if ($fcontents) {
            while (list($line_num, $line) = each($fcontents)) {
                $a = explode("=", $line);
                $keys[$a[0]] = trim($a[1]);
            }
        }
    }
}

function saveKeyBindings() {
    global $keys;
    $fp = fopen('prefs/keybindings', 'w');
    if($fp) {
        foreach($keys as $key=>$value) {
            fwrite($fp, $key . "=" . $value . "\n");
        }
        if(!fclose($fp)) {
            debug_print("Error! Couldn't close the keybindings file.");
        }
    }
}

?>