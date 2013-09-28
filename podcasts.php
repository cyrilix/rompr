<?php
include("vars.php");
include("functions.php");
if (array_key_exists('url', $_REQUEST)) {
    getNewPodcast(rawurldecode($_REQUEST['url']));
} else if (array_key_exists('refresh', $_REQUEST)) {
    refreshPodcast($_REQUEST['refresh']);
} else if (array_key_exists('remove', $_REQUEST)) {
    removePodcast($_REQUEST['remove']);
}

print '<div id="fruitbat" class="noselection fullwidth">';
print '<div id="cocksausage">';
print '<p>Enter a URL of a podcast RSS feed in this box, or drag its icon there</p>';
print '<input class="enter sourceform" name="ginger" id="podcastsinput" type="text" size="60"/>';
print '<button onclick="doPodcast(\'podcastsinput\')">Retreive</button>';
print '</div>';

$channels = glob('prefs/podcasts/*');
foreach($channels as $c) {
    if (is_dir($c)) {
        $y = simplexml_load_file($c.'/info.xml');
        $pm = basename($c);
        $aa = $y->albumartist;
        if ($aa != '') {
            $aa = $aa . ' - ';
        }
        print '<div class="containerbox menuitem wibble">';
        print '<div class="mh fixed"><img src="images/toggle-closed-new.png" class="menu fixed" name="podcast_'.$pm.'"></div>';
        print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$y->image.'" /></div>';
        print '<div class="expand"><b>'.$aa.$y->album.'</b></div>';
        print '</div>';

        print '<div id="podcast_'.$pm.'" class="indent dropmenu wibble padright">';
        print '<div class="whatdoicallthis">'.$y->description.'</div>';
        print '<div class="clearfix" style="padding-bottom:4px;">';
        print '<img class="clickable clickicon podremove tright" name="podremove_'.$pm.'" src="images/edit-delete.png" height="16px" style="padding-right:4px">';
        print '<img class="clickable clickicon podconf tright" name="podconf_'.$pm.'" src="images/preferences.png" height="16px" style="padding-right:4px">';
        print '<img class="clickable clickicon podrefresh tright" name="podrefresh_'.$pm.'" src="images/Refresh.png" height="16px" style="padding-right:4px">';
        print '</div>';
        print '<div class="dropmenu" id="podconf_'.$pm.'">';
        print 'THIS IS SOME OPTIONS AND SHIT';
        print '</div>';
        foreach($y->trackList->track as $item) {
            print '<div class="clickable clicktrack" name="'.htmlspecialchars_decode($item->link).'">';
            print '<div><b>'.$item->title.'</b></div>';
            print '<div class="whatdoicallthis padright clearfix"><span class="tleft"><i>'.$item->pubdate.'</i></span>';
            if ($item->duration != 0) {
                print '<span class="tright">'.format_time($item->duration).'</span>';
            }
            print '</div>';
            print '<div class="whatdoicallthis">'.$item->description.'</div>';
            print '</div>';
        }
        print '</div>';
    }
}

print '</div>';
print '<script language="javascript">'."\n";
print '$("#podcastslist .enter").keyup( onKeyUp );'."\n";
// $('#ginger').on('drop', handleDropPodcasts);
print '</script>'."\n";

function getNewPodcast($url) {
    debug_print("Getting podcast ".$url,"PODCASTS");
    $fname = md5($url);
    if (!is_dir('prefs/podcasts/'.$fname)) {
        mkdir('prefs/podcasts/'.$fname);
    }
    $fp = fopen('prefs/podcasts/'.$fname.'/feed.xml', 'w');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_USERAGENT, 'RompR Music Player/0.40');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_exec($ch);
    $result = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);
    if ($result != "200") {
        header('HTTP/1.0 404 Not Found');
        if (file_exists('prefs/podcasts/'.$fname.'/feed.xml')) {
            unlink('prefs/podcasts/'.$fname.'/feed.xml');
        }
        exit;
    }
    $feed = simplexml_load_file('prefs/podcasts/'.$fname.'/feed.xml');
    $domain = preg_replace('#^(http://.*?)/.*$#', '$1', $url);

    $image = "images/Apple_Podcast_logo.png";
    $m = $feed->channel->children('itunes', TRUE);
    if ($feed->channel->image) {
        $image = $feed->channel->image->url;
    } else if ($m && $m->image) {
        $image = $m->image[0]->attributes()->href;
    }
    if (preg_match('#^/#', $image)) {
        // Image link with a relative URL. Duh.
        $image = $domain.$image;
    }
    $albumartist = "";
    if ($m && $m->author) {
        $albumartist = (string) $m->author;
    }
    $album = (string) $feed->channel->title;
    $x = new SimpleXMLElement('<podcast></podcast>');
    $x->addChild('feedurl', htmlspecialchars($url));
    $x->addChild('last-update', time());
    $x->addChild('image', $image);
    $x->addChild('album', $album);
    $x->addChild('description', htmlspecialchars((string) $feed->channel->description));
    $x->addChild('albumartist', $albumartist);
    $tracklist = $x->addChild('trackList');

    foreach($feed->channel->item as $item) {
        $link = "";
        $duration = 0;
        $m = $item->children('media', TRUE);
        if ($item->link) {
            $link = $item->link;
        } else if ($m && $m->content) {
            $link = $m->content[0]->attributes()->url;
        }
        if ($m && $m->content) {
            if ($m->content[0]->attributes()->duration) {
                $duration = (string) $m->content[0]->attributes()->duration;
            }
        }
        $m = $item->children('itunes', TRUE);
        if ($duration == 0 && $m && $m->duration) {
            $duration = (string) $m->duration;
        }
        // Always store time values in seconds
        if ($duration != 0 && preg_match('/:/', $duration)) {
            $duration = strtotime($duration) - strtotime('TODAY');
        }
        if ($m && $m->author) {
            $artist = (string) $m->author;
        } else {
            $artist = $albumartist;
        }
        $track = $tracklist->addChild('track');
        $track->addChild('link', htmlspecialchars($link));
        $track->addChild('title', $item->title);
        $track->addChild('duration', $duration);
        $track->addChild('artist', $artist);
        $track->addChild('pubdate', $item->pubDate);
        $track->addChild('description', htmlspecialchars((string) $item->description));
    }

    $fp = fopen('prefs/podcasts/'.$fname.'/info.xml', 'w');
    fwrite($fp, $x->asXML());
    fclose($fp);
}

function refreshPodcast($name) {
    debug_print("Refreshing podcast ".$name,"PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$name.'/info.xml');
    $url = $x->feedurl;
    getNewPodcast(htmlspecialchars_decode($url));
}

function removePodcast($name) {
    debug_print("Removing podcast ".$name,"PODCASTS");
    system('rm -fR prefs/podcasts/'.$name, $retval);
}

?>
