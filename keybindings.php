<?php

$keys = array(  "nextrack" => "Right",
                "prevtrack" => "Left",
                "stop" => "Space",
                "play" => "P",
                "volumeup" => "A",
                "volumedown" => "Z"
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
            echo "Error! Couldn't close the keybindings file.";
        }
    }
}

?>