<?php

function open_mpd_connection() {
    global $prefs;
    global $connection;
    global $is_connected;
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
    }

    if ($prefs['mpd_password'] != "" && $is_connected) {
        $is_connected = false;
        fputs($connection, "password ".$prefs['mpd_password']."\n");
        while(!feof($connection)) {
            $gt = fgets($connection, 1024);
            $a = parse_mpd_var($gt);
            if($a === true) {
                $is_connected = true;
                break;
            } else if ($a == null) {

            } else {
                break;
            }
        }
    }
}

function getline($connection) {
    global $is_connected;
    if ($is_connected) {
        $got = trim(fgets($connection));
        if(strncmp("OK", $got, 2) == 0 || strncmp("ACK", $got, 3) == 0) {
            return false;
        }
        $key = trim(strtok($got, ":"));
        $val = trim(strtok("\0"));
        // Ignore 'directory' tags since we don't need them and therefore we don't need to make the parser handle them
        if ($val != '' && $val != null && $key != "directory") {
            return array($key, $val);
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function parse_mpd_var($in_str) {
    $got = trim($in_str);
    if(!isset($got))
        return null;
    if(strncmp("OK", $got,strlen("OK"))==0)
        return true;
    if(strncmp("ACK", $got,strlen("ACK"))==0) {
        debug_print("MPD command error : ".$got,"MPD");
        return array(0 => false, 1 => $got);
    }
    $key = trim(strtok($got, ":"));
    $val = trim(strtok("\0"));
    return array(0 => $key, 1 => $val);
}

function do_mpd_command($conn, $command, $varname = null, $return_array = false) {

    global $is_connected;
    $retarr = array();
    if ($is_connected) {

        debug_print("MPD Command ".$command,"MPD");

        $success = fputs($conn, $command."\n");
        if ($success) {
            while(!feof($conn)) {
                $var = parse_mpd_var(fgets($conn, 1024));
                if(isset($var)){
                    if($var === true && count($retarr) == 0) {
                        // Got an OK or ACK but no results
                        return true;
                    }
                    if($var === true) {
                        break;
                    }
                    if ($var[0] == false) {
                        if ($return_array == true) {
                            $retarr['error'] = $var[1];
                            debug_print("Setting Error Flag","MPD");
                        }
                        break;
                    }
                    if(isset($varname) && strcmp($var[0], $varname)) {
                        return $var[1];
                    } elseif($return_array == true) {
                        if(array_key_exists($var[0], $retarr)) {
                            if(is_array($retarr[($var[0])])) {
                                array_push($retarr[($var[0])], $var[1]);
                            } else {
                                $tmp = $retarr[($var[0])];
                                $retarr[($var[0])] = array($tmp, $var[1]);
                            }
                        } else {
                            $retarr[($var[0])] = $var[1];
                        }
                    }
                }
            }
        } else {
            $retarr['error'] = "There was an error communicating with MPD! (could not write to socket)";
        }
    }
    return $retarr;
}

function close_mpd($conn) {
    global $is_connected;
    if ($is_connected) {
        fclose($conn);
        $is_connected = false;
    }
}

?>
