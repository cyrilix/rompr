
<?php
print '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" '.
'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
<title>RompR</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=100%, initial-scale=1.0, maximum-scale=1.0, '.
'minimum-scale=1.0, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="stylesheet" type="text/css" href="css/layout.css" />
<link rel="shortcut icon" href="newimages/favicon.ico" />
<link rel="stylesheet" type="text/css" href="themes/Darkness.css" />
<link rel="stylesheet" type="text/css" href="iconsets/Modern-Light/theme.css" />
<link rel="stylesheet" type="text/css" href="iconsets/Modern-Light/adjustments.css" />
<link rel="stylesheet" type="text/css" href="sizes/02-Normal.css" />
<script type="text/javascript" src="jquery/jquery-2.1.4.min.js"></script>
<script type="text/javascript" src="jquery/jquery-migrate-1.2.1.js"></script>
<script type="text/javascript" src="utils/setupbits.js"></script>
<style>
input[type=text] { width: 50% }
input[type=submit] { width: 40% }
</style>';
print '<script language="javascript">'."\n";
print 'var multihosts = '.json_encode($prefs['multihosts']).";\n";
print '</script>';
print '</head>
<body style="padding:8px;overflow-y:auto">
    <div class="bordered simar dingleberry" style="max-width:60em">
    <h3>';
print $title;
print '</h3>';
print '<p>'.get_int_text("setup_labeladdresses").'</p>';
print '<p class="tiny">'.get_int_text("setup_addressnote").'</p>';
print '<p>NOTE: Mopidy is still supported, but you must now use the MPD frontend in Mopidy</p>';
print '<form name="mpdetails" action="index.php" method="post">';
print '<hr class="dingleberry" />';
print '<h3>'.get_int_text("setup_mpd").'</h3>';

$c = 0;
foreach ($prefs['multihosts'] as $host => $def) {
    print '<div class="pref styledinputs">';
    print '<input id="host'.$c.'" type="radio" name="currenthost" value="'.$host.'" onclick="displaySettings(event)"';
    if ($host == $prefs['currenthost']) {
        print ' checked';
    }
    print '><label for="host'.$c.'">'.$host.'</label></div>';
    $c++;
}

print '<p>'.get_int_text("setup_ipaddress").'<br>';
print '<input type="text" name="mpd_host" value="'.$prefs['mpd_host'].'" /></p>';
print '<p>'.get_int_text("setup_port").'<br>';
print '<input type="text" name="mpd_port" value="'.$prefs['mpd_port'].'" /></p>';
print '<p>'.get_int_text("setup_password").'<br>';
print '<input type="text" name="mpd_password" value="'.$prefs['mpd_password'].'" /></p>';
print '<p>'.get_int_text("setup_unixsocket").'<br>';
print '<input type="text" name="unix_socket" value="'.$prefs['unix_socket'].'" /></p>';

print '<hr class="dingleberry" />';
print '<h3>Collection Settings</h3>';
print '<div class="pref styledinputs"><input id="dblite" type="radio" name="collection_type" value="sqlite"';
if (array_key_exists('collection_type', $prefs) && $prefs['collection_type'] == "sqlite") {
    print " checked";
}
print '><label for="dblite">Lite Database Collection</label></div>';
print '<p class="tiny">Full featured but may be slow with a large collection</p>';
print '<div class="pref styledinputs"><input id="dbsql" type="radio" name="collection_type" value="mysql"';
if (array_key_exists('collection_type', $prefs) && $prefs['collection_type'] == "mysql") {
    print " checked";
}
print '><label for="dbsql">Full Database Collection</input></label>';
print '<p class="tiny">Fast and full featured - requires MySQL Server:</p>';
print '<p>Server<br><input type="text" name="mysql_host" value="'.
    $prefs['mysql_host'].'" /></p>'."\n";
print '<p>Port<br><input type="text" name="mysql_port" value="'.
    $prefs['mysql_port'].'" /></p>'."\n";
print '<p>Database<br><input type="text" name="mysql_database" value="'.
    $prefs['mysql_database'].'" /></p>'."\n";
print '<p>Username<br><input type="text" name="mysql_user" value="'.
    $prefs['mysql_user'].'" /></p>'."\n";
print '<p>Password<br><input type="text" name="mysql_password" value="'.
    $prefs['mysql_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>Proxy Settings</h3>';
print '<p>Proxy Server (eg 192.168.3.4:8800)<br><input type="text" name="proxy_host" value="'.
    $prefs['proxy_host'].'" /></p>'."\n";
print '<p>Proxy Username<br><input type="text" name="proxy_user" value="'.
    $prefs['proxy_user'].'" /></p>'."\n";
print '<p>Proxy Password<br><input type="text" name="proxy_password" value="'.
    $prefs['proxy_password'].'" /></p>'."\n";
print '<hr class="dingleberry" />';
print '<h3>Debug Logging</h3>';
print '<table width="100%"><tr>';
for ($i = 0; $i<10; $i++) {
    print '<td align="left" class="styledinputs"><input id="debug'.$i.'" type="radio" name="debug_enabled" value="'.$i.'"';
    if ($prefs['debug_enabled'] == $i) {
        print " checked";
    }
    print '>';
    print '<label for="debug'.$i.'">';
    if ($i == 0) {
        print 'Off';
    } else {
        print 'Level '.$i;
    }
    print '</label></td>';
    if ($i == 4) {
        print '</tr><tr>';
    }
}
print '</tr></table>';
print '<p>Custom Log File</p>';
print '<p class=tiny>Rompr debug output will be sent to this file, but PHP error messages will
 still go to the web server error log. The web server needs write access to this file, it must
 already exist, and you should ensure it gets rotated as it will get large</p>';
print '<p><input type="text" style="width:90%" name="custom_logfile" value="'.
    $prefs['custom_logfile'].'" /></p>';
print '<p><input type="submit" value="OK" /></p>';
print'    </form>
    </div>
</body>
</html>';
print "\n";
?>
