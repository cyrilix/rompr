<?php
if (array_key_exists('populate', $_REQUEST)) {

    chdir('..');

    include ("includes/vars.php");
    include ("includes/functions.php");
    include ("international.php");

    print '<div class="containerbox indent padright">';
    print '<b>'.get_int_text("label_soma").'<br>';
    print '<a href="http://somafm.com" target="_blank">'.get_int_text("label_soma_beg").'</a></b>';
    print '</div>';

    $content = url_get_contents("http://api.somafm.com/channels.xml", $_SERVER['HTTP_USER_AGENT'], false, true);
    if ($content['status'] == "200") {
        debuglog("Loaded Soma FM channels list","SOMAFM");
        $x = simplexml_load_string($content['contents']);
        $count = 0;
        print '<div class="noselection fullwidth">';
        foreach ($x->channel as $channel) {
            debuglog("Channel : ".$channel->title,"SOMAFM");

            print '<div class="containerbox menuitem">';

            print '<i class="icon-toggle-closed menu mh fixed" name="somafm'.$count.'"></i>';
            print '<div class="smallcover fixed"><img class="smallcover" src="getRemoteImage.php?url='.$channel->image.'" /></div>';

            print '<div class="expand"><span style="font-size:110%">'.utf8_encode($channel->title).'</span>';
            if ($channel->genre) {
                print '<br><span class="whatdoicallthis">'.utf8_encode($channel->genre).'</span>';
            }
            print '</div>';
            print '</div>';

            print '<div id="somafm'.$count.'" class="dropmenu">';

            if ($channel->description) {
                print '<div class="containerbox indent padright">';
                print '<div class="whatdoicallthis bum expand">'.utf8_encode($channel->description).'</div>';
                print '</div>';
            }

            print '<div class="containerbox indent padright dropdown-container">';
            if ($channel->twitter) {
                print '<div class="fixed"><a href="http://twitter.com/@'.$channel->twitter.'" target="_blank">';
                print '<i class="icon-twitter-logo smallicon padright"></i>';
                print '</a></div>';
            }
            if ($channel->dj) {
                print '<div class="expand"><b>DJ: </b>'.$channel->dj.'</div>';
            }
            print '</div>';
            if ($channel->listeners) {
                print '<div class="containerbox indent padright">';
                print '<div class="expand"><b>'.get_int_text("lastfm_listeners").' </b>'.$channel->listeners.'</div>';
                print '</div>';
            }
            if ($channel->lastPlaying) {
                print '<div class="containerbox indent padright">';
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
<div class="containerbox menuitem noselection multidrop">
<?php
print '<i class="icon-toggle-closed mh menu fixed" onclick="loadSomaFM()" name="somafmlist"></i>';
print '<i class="icon-somafm fixed smallcover-svg"></i>';
print '<div class="expand"><h3>'.get_int_text('label_somafm').'</h3></div>';
?>
<i id="somawait" class="smallicon invisible"></i>
</div>
<div id="somafmlist" class="dropmenu"></div>

<?php
}

function format_listenlink($c, $p, $label) {
    $img = (string) $c->xlimage;
    if (!$img) {
        $img = (string) $c->largeimage;
    }
    if (!$img) {
        $img = (string) $c->image;
    }
    print '<div class="clickable clickstream draggable menuitem indent containerbox padright" name="'.(string) $p.'" streamimg="getRemoteImage.php?url='.$img.'" streamname="'.$c->title.'">';
    print '<i class="icon-radio-tower fixed smallicon"></i>';
    print '<div class="fixed">'.$label.'&nbsp;</div>';
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
