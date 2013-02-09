<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");
$outputs = do_mpd_command($connection, "outputs", null, true);
$otuputdata = array();
foreach ($outputs as $i => $n) {
    if (is_array($n)) {
        foreach ($n as $a => $b) {
            debug_print($i." - ".$b.":".$a);
            $outputdata[$a][$i] = $b;
        }
    } else {
        debug_print($i." - ".$n);
        $outputdata[0][$i] = $n;
    }
}
print json_encode($outputdata);
?>
