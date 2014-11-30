<?php
if (array_key_exists('populate', $_REQUEST)) {

    chdir('..');

    include ("includes/vars.php");
    include ("includes/functions.php");
    include ("international.php");

    print '<div class="containerbox indent padright wibble">';
    print '<b>'.get_int_text("label_soma").'<br>';
    print '<a href="http://somafm.com" target="_blank">'.get_int_text("label_soma_beg").'</a></b>';
    print '</div>';

    $content = url_get_contents("http://api.somafm.com/channels.xml", $_SERVER['HTTP_USER_AGENT'], false, true);
    if ($content['status'] == "200") {
        debug_print("Loaded Soma FM channels list","SOMAFM");
        $x = simplexml_load_string($content['contents']);
        $count = 0;
        print '<div class="noselection fullwidth">';
        foreach ($x->channel as $channel) {
            debug_print("Channel : ".$channel->title,"SOMAFM");

            print '<div class="containerbox menuitem wibble">';

            print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" name="somafm'.$count.'"></div>';
            print '<div class="smallcover fixed"><img height="32px" width="32px" src="getRemoteImage.php?url='.$channel->image.'" /></div>';

            print '<div class="expand"><span style="font-size:110%">'.utf8_encode($channel->title).'</span>';
            if ($channel->genre) {
                print '<br><span class="whatdoicallthis">'.utf8_encode($channel->genre).'</span>';
            }
            print '</div>';
            print '</div>';

            print '<div id="somafm'.$count.'" class="dropmenu wibble">';

            if ($channel->description) {
                print '<div class="containerbox indent padright wibble">';
                print '<div class="whatdoicallthis bum expand">'.utf8_encode($channel->description).'</div>';
                print '</div>';
            }

            print '<div class="containerbox indent padright wibble">';
            if ($channel->twitter) {
                print '<div class="fixed"><a href="http://twitter.com/@'.$channel->twitter.'" target="_blank">';
                print '<img width="16px" src="newimages/Twitter-Logo.png" style="margin-right:4px" />';
                print '</a></div>';
            }
            if ($channel->dj) {
                print '<div class="expand"><b>DJ: </b>'.$channel->dj.'</div>';
            }
            print '</div>';
            if ($channel->listeners) {
                print '<div class="containerbox indent padright wibble">';
                print '<div class="expand"><b>'.get_int_text("lastfm_listeners").' </b>'.$channel->listeners.'</div>';
                print '</div>';
            }
            if ($channel->lastPlaying) {
                print '<div class="containerbox indent padright wibble">';
                print '<div class="expand"><b>Last Played: </b>'.$channel->lastPlaying.'</div>';
                print '</div>';
            }
            if ($channel->highestpls) {
                format_listenlink($channel, $channel->highestpls, "HQ");
            }
            foreach ($channel->fastpls as $h) {
                format_listenlink($channel, $h, "MQ");
            }
            foreach ($channel->slowpls as $h) {
                format_listenlink($channel, $h, "LQ");
            }
            print '</div>';

            $count++;
        }

        print '</div>';

    }

} else {

?>

<script language="text/javascript">
function loadSomaFM() {
    if ($("#somafmlist").is(':empty')) {
        makeWaitingIcon("somawait");
        $("#somafmlist").load("streamplugins/01_somafm.php?populate", function() { stopWaitingIcon("somawait")});
    }
}
</script>

<div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><img src="'.$ipath.'toggle-closed-new.png" class="menu fixed" onclick="loadSomaFM()" name="somafmlist"></div>';
print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$ipath.'somafm.png"></div>';
print '<div class="expand">'.get_int_text('label_somafm').'</div>';
?>
<img id="somawait" height="14px" width="14px" src="newimages/transparent-32x32.png" />
</div>
<div id="somafmlist" class="dropmenu"></div>

<?php
}

function format_listenlink($c, $p, $label) {
    global $ipath;
    $img = (string) $c->xlimage;
    if (!$img) {
        $img = (string) $c->largeimage;
    }
    if (!$img) {
        $img = (string) $c->image;
    }
    print '<div class="clickable clickstream indent containerbox padright menuitem" name="'.(string) $p.'" streamimg="getRemoteImage.php?url='.$img.'" streamname="'.$c->title.'">';
    print '<div class="fixed">'.$label.'&nbsp;</div>';
    print '<div class="playlisticon fixed"><img height="12px" src="'.$ipath.'broadcast-24.png" /></div>';
    switch ($p[0]['format']) {
        case 'mp3':
            print '<div class="expand">MP3</div>';
            break;
        case 'aac':
            print '<div class="expand">AAC</div>';
            break;
        case 'aacp':
            print '<div class="expand">AAC Plus</div>';
            break;
        default:
            print '<div class="expand">Unknown Format</div>';
            break;

    }
    print '</div>';
}
?>
