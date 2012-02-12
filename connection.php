<?php
$is_connected = false;

$connection = fsockopen($prefs["mpd_host"], $prefs["mpd_port"], $errno, $errstr, 10);
if(isset($connection) && is_resource($connection)) {
    while(!feof($connection)) {
        $gt = fgets($connection, 1024);
        if(parse_mpd_var($gt))
            break;
    }
    
    if (!array_key_exists("fast", $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);
    }
    
    if(array_key_exists("command", $_REQUEST)) {
        $command = $_REQUEST["command"];
        if(array_key_exists("arg", $_REQUEST) && strlen($_REQUEST["arg"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg"]))."\"";
        }
        if(array_key_exists("arg2", $_REQUEST) && strlen($_REQUEST["arg2"])>0) {
            $command.=" \"".format_for_mpd(html_entity_decode($_REQUEST["arg2"]))."\"";
        }        
        do_mpd_command($connection, $command);
        
        if (!array_key_exists("fast", $_REQUEST)) {
            if ($_REQUEST["command"] == "add" || $_REQUEST["command"] == "load") {
                if ($mpd_status["state"] == "stop") {
                    do_mpd_command($connection, "play ".$mpd_status["playlistlength"]);
                }
            }
        }
    }
    
    if (array_key_exists("list", $_REQUEST)) {
        $playstart = false;
        //error_log(html_entity_decode($_REQUEST['list']));
        $cmdlines = explode("||||", $_REQUEST['list']);
        fputs($connection, "command_list_begin\n");
        foreach($cmdlines as $cmd) {
            if ($cmd != "") {
                if (preg_match('/add /', $cmd) &&  $mpd_status["state"] == "stop") {
                    $playstart = true;
                }
                //error_log($cmd);
                fputs($connection, $cmd."\n");
            }
        }
        if ($playstart) {
            fputs($connection, "play ".$mpd_status["playlistlength"]."\n");
        }
        do_mpd_command($connection, "command_list_end");
    }
    
    if (!array_key_exists("fast", $_REQUEST)) {
        $mpd_status = do_mpd_command ($connection, "status", null, true);    
        while ($mpd_status['state'] == 'play' && !array_key_exists('elapsed', $mpd_status)) {
            sleep(1);
            $mpd_status = do_mpd_command ($connection, "status", null, true);
        }
    }

    $is_connected = true;
}

?>