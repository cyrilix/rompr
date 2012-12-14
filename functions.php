<?php

function xmlnode($node, $content) {
    return '<'.$node.'>'.htmlspecialchars($content).'</'.$node.'>'."\n";
}

function format_for_mpd($term) {
    $term = str_replace('"','\\"',$term);
    return $term;
}

function format_for_disc($filename) {
    $filename = str_replace("\\","_",$filename);
    $filename = str_replace("/","_",$filename);
    $filename = str_replace("'","_",$filename);
    $filename = str_replace('"',"_",$filename);
    return $filename;
}

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
        error_log("MPD command error : ".$got);
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
    
        error_log("MPD Command ".$command);
    
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
                            error_log("Setting Error Flag");
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

function format_tracknum($tracknum) {
    $matches = array();
    if (preg_match('/^\s*0*(\d+)/', $tracknum, $matches)) {
        return $matches[1];
    }
    return '';
}

# url_get_contents function by Andy Langton: http://andylangton.co.uk/
function url_get_contents($url,$useragent='RompR Media Player/0.1',$headers=false,$follow_redirects=true,$debug=true) {

    // error_log("Getting ".$url);
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

function format_time($t,$f=':') // t = seconds, f = separator 
{
    if (($t/86400) >= 1) {
        return sprintf("%d%s%2d%s%02d%s%02d", ($t/86400), " days ", ($t/3600)%24, $f, ($t/60)%60, $f, $t%60);
    }
    if (($t/3600) >= 1) {
        return sprintf("%2d%s%02d%s%02d", ($t/3600), $f, ($t/60)%60, $f, $t%60);
    } else {
        return sprintf("%02d%s%02d", ($t/60)%60, $f, $t%60);
    }
}

class collectionOutput {
    
    public function __construct($file) {
        $this->fname = $file;
        $this->fhandle = null;
        
        $headers =  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'.
                    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">'.
                    '<head>'.
                    '<meta http-equiv="cache-control" content="max-age=0" />'.
                    '<meta http-equiv="cache-control" content="no-cache" />'.
                    '<meta http-equiv="expires" content="0" />'.
                    '<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />'.
                    '<meta http-equiv="pragma" content="no-cache" />'.
                    '</head>'.
                    '<body>';
        if ($file != "") {
            $this->fhandle = fopen($file, 'w');
            fwrite($this->fhandle, $headers);
        } else {
            print $headers;
        }
    }
    
    public function writeLine($line) {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, $line);
        } else {
            print $line;
        }
    }
    
    public function closeFile() {
        if ($this->fhandle != null) {
            fwrite($this->fhandle, '</body></html>');
            fclose($this->fhandle);
        } else {
            print '</body></html>';
        }
    }
    
    public function dumpFile() {
        if ($this->fname != "") {
            // error_log("Dumping Files List to ".$this->fname);
            $file = fopen($this->fname, 'r');
            while(!feof($file))
            {
                echo fgets($file);
            }
            fclose($file);
        }
    }

}
?>
