<?php

function xmlnode($node, $content) {
    return '<'.$node.'>'.htmlspecialchars($content).'</'.$node.'>'."\n";
}

function format_for_mpd($term) {
 
    $term = preg_replace('/(\"|\/|\&)/', '\\\\$1', $term);
    return $term;
    
}

function getline($connection) {
    $line = fgets($connection, 1024);
    $got = trim($line);
    if(strncmp("OK", $got,strlen("OK"))==0) {
        return false;
    }
    if(strncmp("ACK", $got,strlen("ACK"))==0) {
        return false;
    }
    $key = trim(strtok($got, ":"));
    $val = trim(strtok("\0"));
    //$retarr = explode(':', $got);
    // Ignore 'directory' tags since we don't need them and therefore we don't need to make the parser handle them
    if ($val != '' && $val != null && ($key != "directory")) {
        $retarr[0] = $key;
        $retarr[1] = $val;
        return $retarr;
    } else {
        return true;
    }
}

function parse_mpd_var($in_str) {
    
    //error_log($in_str);
    
    $got = trim($in_str);
    //error_log($got);
    if(!isset($got))
        return null;
    if(strncmp("OK", $got,strlen("OK"))==0) 
        return true;
    if(strncmp("ACK", $got,strlen("ACK"))==0) {
        //str_replace("\n", "\n<br />", $got);
        //print "&nbsp;<p><b>".$got."</b></p><br />\n";
        return true;
    }
    $key = trim(strtok($got, ":"));
    $val = trim(strtok("\0"));
    return array(0 => $key, 1 => $val);
}

function do_mpd_command($conn, $command, $varname = null, $return_array = false) {
    
    //error_log("mpd command ".$command);
    
    $retarr = array();
    fputs($conn, $command."\n");
    while(!feof($conn)) {
        $var = parse_mpd_var(fgets($conn, 1024));
        if(isset($var)){
            if($var === true && count($retarr) == 0)
                return true;
            if($var === true)
                break;
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
    return $retarr;
}

function close_mpd($conn) {
    do_mpd_command($conn, "close");
    fclose($conn);
    $is_connected = false;
}

function format_tracknum($tracknum) {        
    $matches = array();
    if (preg_match('/^\s*(\d+)/', $tracknum, $matches)) {
        return $matches[1];
    }
    return '';
}

# url_get_contents function by Andy Langton: http://andylangton.co.uk/
function url_get_contents($url,$useragent='RompR Media Player/0.1',$headers=false,$follow_redirects=false,$debug=true) {
 
    # initialise the CURL library
    $ch = curl_init();
    
    # specify the URL to be retrieved
    curl_setopt($ch, CURLOPT_URL,$url);
    
    # we want to get the contents of the URL and store it in a variable
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
    
    # specify the useragent: this is a required courtesy to site owners
    curl_setopt($ch, CURLOPT_USERAGENT, $useragent);
    
    # ignore SSL errors
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    # return headers as requested
    if ($headers==true){
        curl_setopt($ch, CURLOPT_HEADER,1);
    }
    
    # only return headers
    if ($headers=='headers only') {
        curl_setopt($ch, CURLOPT_NOBODY ,1);
    }
    
    # follow redirects - note this is disabled by default in most PHP installs from 4.4.4 up
    if ($follow_redirects==true) {
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1); 
    }
    
    $result['contents']=curl_exec($ch);
    # if debugging, return an array with CURL's debug info and the URL contents
    if ($debug==true) {
        $result['info']=curl_getinfo($ch);
    }

    # free resources
    curl_close($ch);
    
    # send back the data
    return $result;
}

?>