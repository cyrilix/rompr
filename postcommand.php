<?php
include ("vars.php");
include ("functions.php");

$is_connected = false;

if ($prefs['unix_socket'] != "") {
    $connection = fsockopen('unix://'.$prefs['unix_socket']);
} else {
    $connection = fsockopen($prefs["mpd_host"], $prefs["mpd_port"], $errno, $errstr, 10);
}

if(isset($connection) && is_resource($connection)) {

    $is_connected = true;

  	while(!feof($connection)) {
        $gt = fgets($connection, 1024);
        if(parse_mpd_var($gt))
            break;
     }

	 fputs($connection, "command_list_begin\n");
	 foreach ($_POST['commands'] as $cmd) {
	  	fputs($connection, $cmd."\n");

	 }
	 
	 do_mpd_command($connection, "command_list_end");

} 

close_mpd($connection);

?>