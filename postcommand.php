<?php
include ("vars.php");
include ("functions.php");

open_mpd_connection();

if($is_connected) {

	 fputs($connection, "command_list_begin\n");
	 foreach ($_POST['commands'] as $cmd) {
	  	fputs($connection, $cmd."\n");

	 }
	 
	 do_mpd_command($connection, "command_list_end");

} 

close_mpd($connection);

?>