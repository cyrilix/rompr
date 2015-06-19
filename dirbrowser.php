
<?php
include ("includes/vars.php");
include ("includes/functions.php");
include("international.php");
include ("player/mpd/connection.php");
$error = 0;
$dbterms = array( 'tags' => null, 'rating' => null );

$path = (array_key_exists('path', $_REQUEST)) ? rawurldecode($_REQUEST['path']) : "";
$prefix = (array_key_exists('prefix', $_REQUEST)) ? $_REQUEST['prefix'].'_' : "dirholder";

@open_mpd_connection();

if ($is_connected) {
    htmlHeaders();
    if ($path == "") {
        print '<div class="menuitem containerbox" style="margin-top:12px;padding-left:8px">
                <div class="expand" style="font-weight:bold;font-size:120%;padding-top:0.4em">'.get_int_text('button_file_browser').'</div>
                </div>';
    }
	doFileBrowse($path, $prefix);
} else {
    header("HTTP/1.1 500 Internal Server Error");	
}

close_mpd($connection);

function doFileBrowse($path, $prefix) {
	global $connection;
	debug_print("Browsing ".$path,"DIRBROWSER");
	$parts = true;
	$dircount = 0;
	fputs($connection, 'listfiles "'.format_for_mpd($path).'"'."\n");
    while(!feof($connection) && $parts) {
        $parts = getline($connection, true);
        if ($parts === false) {
            debug_print("Got OK or ACK from MPD","DIRBROWSER");
        }
        if (is_array($parts)) {
			$s = trim($parts[1]);
			if (substr($s,0,1) != ".") {
				$fullpath = ltrim($path.'/'.$s, '/');
	        	switch ($parts[0]) {
	        		case "file":
	        			printFileItem($fullpath);
	        			break;

	        		case "directory":
	        			printDirectoryItem($fullpath, $prefix, $dircount);
				        $dircount++;
	        			break;
	        	}
	        }
        }
    }
    print '</body></html>';
}

?>