<?php
include("vars.php");
include("functions.php");
if (array_key_exists('url', $_REQUEST)) {
    getNewPodcast(rawurldecode($_REQUEST['url']));
} else if (array_key_exists('refresh', $_REQUEST)) {
    refreshPodcast($_REQUEST['refresh']);
} else if (array_key_exists('remove', $_REQUEST)) {
    removePodcast($_REQUEST['remove']);
} else if (array_key_exists('listened', $_REQUEST)) {
    markAsListened($_REQUEST['listened'], rawurldecode($_REQUEST['location']));
} else if (array_key_exists('removetrack', $_REQUEST)) {
    deleteTrack($_REQUEST['removetrack'], $_REQUEST['channel']);
} else if (array_key_exists('downloadtrack', $_REQUEST)) {
    downloadTrack($_REQUEST['downloadtrack'], $_REQUEST['channel']);
} else if (array_key_exists('markaslistened', $_REQUEST)) {
    markKeyAsListened($_REQUEST['markaslistened'], $_REQUEST['channel']);
}  else if (array_key_exists('displaymode', $_REQUEST)) {
    changeDisplayMode($_REQUEST['displaymode'], $_REQUEST['channel']);
} else if (array_key_exists('channellistened', $_REQUEST)) {
    markChannelAsListened($_REQUEST['channellistened']);
}  else if (array_key_exists('refreshoption', $_REQUEST)) {
    changeRefreshOption($_REQUEST['refreshoption'], $_REQUEST['channel']);
}


if (array_key_exists('refresh', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['refresh']);
} else if (array_key_exists('listened', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['listened']);
} else if (array_key_exists('removetrack', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
} else if (array_key_exists('downloadtrack', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
} else if (array_key_exists('markaslistened', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
} else if (array_key_exists('displaymode', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
} else if (array_key_exists('channellistened', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channellistened']);
} else if (array_key_exists('refreshoption', $_REQUEST)) {
    doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
} else {

    print '<div id="fruitbat" class="noselection fullwidth">';
    print '<div id="cocksausage">';
    print '<p>Enter a URL of a podcast RSS feed in this box, or drag its icon there</p>';
    print '<input class="enter sourceform" name="ginger" id="podcastsinput" type="text" size="60"/>';
    print '<button onclick="podcasts.doPodcast(\'podcastsinput\')">Retreive</button>';
    print '</div>';

    $channels = glob('prefs/podcasts/*');
    foreach($channels as $c) {
        if (is_dir($c)) {
            doPodcastHeader($c);
            doPodcast($c);
            print '</div>';
        }
    }

    print '</div>';
    print '<script language="javascript">'."\n";
    print '$("#podcastslist .enter").keyup( onKeyUp );'."\n";
    // $('#ginger').on('drop', handleDropPodcasts);
    print '</script>'."\n";
}

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
        debug_print("Failed to get ".$url,"PODCASTS");
        if (file_exists('prefs/podcasts/'.$fname.'/feed.xml')) {
            unlink('prefs/podcasts/'.$fname.'/feed.xml');
        }
        exit;
    }
    debug_print("Feed retrieved from ".$url,"PODCASTS");
    $feed = simplexml_load_file('prefs/podcasts/'.$fname.'/feed.xml');
    $lastupdated = 0;
    $oldinfo = null;
    if (file_exists('prefs/podcasts/'.$fname.'/info.xml')) {
        $oldinfo = simplexml_load_file('prefs/podcasts/'.$fname.'/info.xml');
        $lastupdated = $oldinfo->lastupdate;
    }
    $domain = preg_replace('#^(http://.*?)/.*$#', '$1', $url);

    // <ppg:seriesDetails typicalDuration="PT28M" active="true" public="true" region="all" launchDate="2009-01-21" frequency="weekly" daysLive="60" liveItems="2" />
    $refreshoption = "never";
    $displaymode = "all";
    if ($oldinfo) {
        $refreshoption = $oldinfo->refreshoption;
        $displaymode = $oldinfo->displaymode;
    } else {
        $ppg = $feed->channel->children('ppg', TRUE);
        if ($ppg && $ppg->seriesDetails) {
            $refreshoption = $ppg->seriesDetails[0]->attributes()->frequency;
        }
    }

    $image = "newimages/Apple_Podcast_logo.png";
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
    $x->addChild('lastupdate', time());
    $x->addChild('image', $image);
    $x->addChild('album', $album);
    $x->addChild('refreshoption', $refreshoption);
    $x->addChild('displaymode', $displaymode);
    $x->addChild('description', htmlspecialchars((string) $feed->channel->description));
    $x->addChild('albumartist', $albumartist);
    $tracklist = $x->addChild('trackList');

    foreach($feed->channel->item as $item) {
        $link = "";
        $duration = 0;
        $m = $item->children('media', TRUE);
        if ($m && $m->content) {
            $link = (string) $m->content[0]->attributes()->url;
        } else if ($item->enclosure) {
            $link = (string) $item->enclosure->attributes()->url;
        }
        if ($m && $m->content) {
            if ($m->content[0]->attributes()->duration) {
                $duration = (string) $m->content[0]->attributes()->duration;
                debug_print("Duration set from media namespace to ".$duration,"PODCASTS");
            }
        }
        $m = $item->children('itunes', TRUE);
        if ($duration == 0 && $m && $m->duration) {
            $duration = (string) $m->duration;
            debug_print("Duration set from itunes namespace to ".$duration,"PODCASTS");
        }
        // Always store time values in seconds
        if ($duration != 0 && preg_match('/:/', $duration)) {
            if (strlen($duration) == 5) {
                // Make sure we have a HH:MM:SS time string. strtotime doesn't cope with MM:SS
                $duration = "00:".$duration;
            }
            $duration = strtotime($duration) - strtotime('TODAY');
        }
        debug_print("Duration string is ".$duration,"PODCASTS");
        if ($m && $m->author) {
            $artist = (string) $m->author;
        } else {
            $artist = $albumartist;
        }
        $pubdate = (string) $item->pubDate;
        $filesize = $item->enclosure->attributes()->length;
        $description = (string) $item->description;
        if ($description == "" && $m && $m->summary) {
            $description = (string) $m->summary;
        }
        $key = md5((string) $item->guid);
        $track = $tracklist->addChild('track');
        $track->addChild('title', htmlspecialchars($item->title));
        $track->addChild('duration', $duration);
        $track->addChild('artist', $artist);
        $track->addChild('pubdate', $pubdate);
        $track->addChild('filesize', $filesize);
        $track->addChild('description', htmlspecialchars($description));
        $track->addChild('key', $key);
        if ($oldinfo) {
            debug_print("Checking previous download for ".$key,"PODCASTS");
            $axp = $oldinfo->xpath('//track/key[.="'.$key.'"]/parent::*');
            if ($axp) {
                debug_print("... Found ".$key,"PODCASTS");
                $track->addChild('listened', $axp[0]->{'listened'});
                $track->addChild('deleted', $axp[0]->{'deleted'});
                // Copy the link from the previous version - this'll keep it correct
                // if the file has been downloaded.
                $track->addChild('link', $axp[0]->{'link'});
                $track->addChild('new', "no");
                // Mark this track as having been found in the new list
                $axp[0]->{'found'} = "yes";
            } else {
                $track->addChild('link', htmlspecialchars($link));
                $track->addChild('listened', "no");
                $track->addChild('deleted', "no");
                $track->addChild('new', "yes");
            }
        } else {
            $track->addChild('link', htmlspecialchars($link));
            $track->addChild('listened', "no");
            $track->addChild('deleted', "no");
            $track->addChild('new', "yes");
        }
        // $pubtime = strtotime($pubdate);
        // if ($pubtime > $lastupdated) {
        //     $track->addChild('new', "yes");
        // } else {
        //     $track->addChild('new', "no");
        // }
    }

    // Now add any remaining ones from the old list that have ben downloaded but not
    // found in the new list
    if ($oldinfo) {
        foreach($oldinfo->trackList->track as $track) {
            if ($track->found && $track->found == "yes") {

            } else if (is_dir('prefs/podcasts/'.$fname.'/'.$track->key)) {
                // This is messy but simplexml sucks big fat donkey shit and it's late and I'm tired.
                $track = $tracklist->addChild('track');
                $track->addChild('title', $track->title);
                $track->addChild('duration', $track->duration);
                $track->addChild('artist', $track->artist);
                $track->addChild('pubdate', $track->pubdate);
                $track->addChild('filesize', $track->filesize);
                $track->addChild('description', $track->description);
                $track->addChild('key', $track->key);
                $track->addChild('link', $track->link);
                $track->addChild('listened', $track->listened);
                $track->addChild('deleted', $track->deleted);
                $track->addChild('new', $track->new);
            }
        }
    }

    saveFormattedXML($x, 'prefs/podcasts/'.$fname.'/info.xml');
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

function doPodcast($c) {
    $y = simplexml_load_file($c.'/info.xml');
    $pm = basename($c);
    $aa = $y->albumartist;
    if ($aa != '') {
        $aa = $aa . ' - ';
    }
    print '<div class="whatdoicallthis">'.$y->description.'</div>';
    print '<div class="clearfix" style="padding-bottom:4px;">';
    print '<img title="Delete this Podcast" class="clickable clickicon podremove tright fridge" name="podremove_'.$pm.'" src="newimages/edit-delete.png" height="16px" style="margin-right:4px">';
    print '<img title="Configure this Podcast" class="clickable clickicon podconf tleft fridge" name="podconf_'.$pm.'" src="newimages/preferences.png" height="16px" style="margin-right:4px">';
    print '<img title="Refresh this Podcast" class="clickable clickicon podrefresh tleft fridge" name="podrefresh_'.$pm.'" src="newimages/Refresh.png" height="16px" style="margin-right:4px">';
    print '<img title="Download All Episodes of this Podcast" class="clickable clickicon podgroupload tleft fridge" name="podgroupload_'.$pm.'" src="newimages/download_icon.png" height="16px" style="margin-right:4px">';
    print '<img title="Mark All Episodes as Listened" class="clickable clickicon podgrouplisten tleft fridge" name="podgrouplisten_'.$pm.'" src="newimages/listen.png" height="16px" style="margin-right:4px">';
    print '</div>';
    print '<div class="dropmenu" id="podconf_'.$pm.'"';
    if ((array_key_exists('channel', $_REQUEST) && $_REQUEST['channel'] == $pm) &&
        array_key_exists('displaymode', $_REQUEST) ||
        array_key_exists('refreshoption', $_REQUEST)) {
        // Don't rehide the config panel if we're choosing something from it
        print ' style="display:block"';
    }
    print '>';
    $nextupdate = 0;
    switch($y->refreshoption) {
        case "hourly";
            $nextupdate = $y->lastupdate + 3600;
            break;
        case "daily":
            $nextupdate = $y->lastupdate + 86400;
            break;
        case "weekly":
            $nextupdate = $y->lastupdate + 604800;
            break;
        case "monthly":
            $nextupdate = $y->lastupdate + 18144000;
            break;

    }
    print '<input type="hidden" class="podnextupdate" value="'.$nextupdate.'" />';
    print '<div class="containerbox" style="margin-top:4px">';
    print '<span style="vertical-align:middle"><b>DISPLAY&nbsp;&nbsp;</b></span>';
    print '<span style="vertical-align:middle"><select class="ds topformbutton" onchange="podcasts.changeDisplayOption(\''.$pm.'\')">';
    $options =  '<option value="all">Everything</option>'.
                '<option value="new">Only New</option>'.
                '<option value="unlistened">New and Unlistened</option>'.
                '<option value="downloaded">Only Downloaded</option>';
    print preg_replace('/(<option value="'.$y->displaymode.'")/', '$1 selected', $options);
    print '</select></span></div>';
    print '<div class="containerbox" style="margin-top:4px">';
    print '<span style="vertical-align:middle"><b>REFRESH&nbsp;&nbsp;</b></span>';
    print '<span style="vertical-align:middle"><select class="rs topformbutton" onchange="podcasts.changeRefreshOption(\''.$pm.'\')">';
    $options =  '<option value="never">Manually</option>'.
                '<option value="hourly">Hourly</option>'.
                '<option value="daily">Daily</option>'.
                '<option value="weekly">Weekly</option>'.
                '<option value="monthly">Monthly</option>';
    $opt = $y->refreshoption;
    if (!$opt) {
        $opt = "never";
    }
    print preg_replace('/(<option value="'.$opt.'")/', '$1 selected', $options);
    print '</select></span></div>';
    print '</div>';
    foreach($y->trackList->track as $item) {
        if ($item->deleted == "yes") {
            continue;
        }
        if ($y->displaymode == "new" && $item->new == "no") {
            continue;
        }
        if ($y->displaymode == "unlistened" && $item->listened == "yes") {
            // Track cannot be new and unlistened, that can't happen because it makes no sense
            continue;
        }
        if ($y->displaymode == "downloaded" && !is_dir('prefs/podcasts/'.$pm.'/'.$item->key)) {
            continue;
        }
        print '<div class="clickable clicktrack item" name="'.htmlspecialchars_decode($item->link).'">';
        print '<div class="containerbox">';
        if ($item->new == "yes") {
            print '<div class="fixed"><img title="This is a new episode" class="newpodicon fridge" src="newimages/icon_new.png" /></div>';
        } else if ($item->listened == "no") {
            print '<div class="fixed"><img title="This episode is not new but it has not been listened to" class="oldpodicon fridge" src="newimages/listen.png" /></div>';
        }
        print '<div class="podtitle expand">'.$item->title.'</div></div>';
        print '<div class="whatdoicallthis padright clearfix"><span class="tleft"><i>'.$item->pubdate.'</i></span>';
        if ($item->duration != 0) {
            print '<span class="tright">'.format_time($item->duration).'</span>';
        }
        print '</div>';
        print '<div class="whatdoicallthis">'.$item->description.'</div>';
        print '<div class="clearfix" name="podcontrols_'.$pm.'" style="margin-bottom:4px">';
        if (is_dir('prefs/podcasts/'.$pm.'/'.$item->key)) {
            print '<img class="tleft fridge" title="This episode has been downloaded" src="newimages/downloaded.png" height="16px" style="margin-right:4px">';
        } else {
            print '<img class="clickable clickicon tleft poddownload fridge" title="Download this episode - it will be permanently stored on your computer" name="poddownload_'.$item->key.'" src="newimages/download_icon.png" height="16px" style="margin-right:4px">';
        }
        if ($item->listened == "no") {
            print '<img class="clickable clickicon tleft podmarklistened fridge" title="Mark as listened" name="podmarklistened_'.$item->key.'" src="newimages/listen.png" height="16px" style="margin-right:4px">';
        }
        print '<img class="clickable clickicon tright podtrackremove fridge" title="Delete this episode. If it has been downloaded, the files will be removed" name="podtrackremove_'.$item->key.'" src="newimages/edit-delete.png" height="16px" style="margin-right:4px">';
        print '</div>';
        print '</div>';
    }
}

function doPodcastHeader($c) {
    $y = simplexml_load_file($c.'/info.xml');
    $pm = basename($c);
    $aa = $y->albumartist;
    if ($aa != '') {
        $aa = $aa . ' - ';
    }
    print '<div class="containerbox menuitem wibble" style="margin-top:6px">';
    print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="podcast_'.$pm.'"></div>';
    print '<div class="smallcover fixed"><img height="32px" width="32px" src="'.$y->image.'" /></div>';
    print '<div class="expand"><b>'.$aa.$y->album.'</b><span class="podnumber"></span><span></span></div>';
    print '</div>';
    print '<div id="podcast_'.$pm.'" class="indent dropmenu wibble padright">';

}

function markAsListened($c, $url) {
    debug_print("Marking ".$url." from ".$c." as listened","PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$c.'/info.xml');
    $axp = $x->xpath('//track/link[.="'.$url.'"]/parent::*');
    debug_print("Found Track. Title is ".$axp[0]->{'title'},"PODCASTS");
    $axp[0]->{'listened'} = "yes";
    $axp[0]->{'new'} = "no";
    saveFormattedXML($x, 'prefs/podcasts/'.$c.'/info.xml');
}

function deleteTrack($key, $channel) {
    debug_print("Marking ".$key." from ".$channel." as deleted","PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $axp = $x->xpath('//track/key[.="'.$key.'"]/parent::*');
    debug_print("Found Track. Title is ".$axp[0]->{'title'},"PODCASTS");
    $axp[0]->{'deleted'} = "yes";
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
    if (is_dir('prefs/podcasts/'.$channel.'/'.$axp[0]->key)) {
        system('rm -fR prefs/podcasts/'.$channel.'/'.$axp[0]->key);
    }
}

function markKeyAsListened($key, $channel) {
    debug_print("Marking ".$key." from ".$channel." as deleted","PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $axp = $x->xpath('//track/key[.="'.$key.'"]/parent::*');
    debug_print("Found Track. Title is ".$axp[0]->{'title'},"PODCASTS");
    $axp[0]->{'listened'} = "yes";
    $axp[0]->{'new'} = "no";
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
}

function changeDisplayMode($mode, $channel) {
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $x->displaymode = $mode;
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
}

function changeRefreshOption($mode, $channel) {
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $x->refreshoption = $mode;
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
}

function markChannelAsListened($channel) {
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    foreach($x->trackList->track as $item) {
        $item->listened = "yes";
        $item->new = "no";
    }
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
}

function downloadTrack($key, $channel) {
    debug_print("Downloading ".$key." from ".$channel,"PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $axp = $x->xpath('//track/key[.="'.$key.'"]/parent::*');
    debug_print("Found Track. URL is is ".$axp[0]->{'link'},"PODCASTS");
    mkdir ('prefs/podcasts/'.$channel.'/'.$key);
    $link = (string) $axp[0]->{'link'};
    $filename = basename($link);
    $filename = preg_replace('/\?.*$/','',$filename);

    $fp = fopen('prefs/monitor.xml', 'w');
    $xml = '<?xml version="1.0" encoding="utf-8"?><download><filename>';
    $xml = $xml . 'prefs/podcasts/'.$channel.'/'.$key.'/'.$filename;
    $xml = $xml . '</filename><filesize>'.$axp[0]->filesize.'</filesize></download>';
    $fp = fopen('prefs/monitor.xml', 'w');
    fwrite($fp, $xml);
    fclose($fp);
    debug_print('Downloading To prefs/podcasts/'.$channel.'/'.$key.'/'.$filename,"PODCASTS");
    $fp = fopen('prefs/podcasts/'.$channel.'/'.$key.'/'.$filename, 'wb');
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$link);
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
        debug_print("Failed to get ".$link,"PODCASTS");
        system ('rm -fR prefs/podcasts/'.$channel.'/'.$key);
        exit;
    }
    $axp[0]->{'link'} = get_base_url().'/prefs/podcasts/'.$channel.'/'.$key.'/'.$filename;
    $fp = fopen('prefs/podcasts/'.$channel.'/info.xml', 'w');
    fwrite($fp, $x->asXML());
    fclose($fp);
}

function saveFormattedXML($simplexml, $file) {
    $dom = new DOMDocument('1.0');
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    $dom->loadXML($simplexml->asXML());
    $fp = fopen($file, 'w');
    fwrite($fp, $dom->saveXML());
    fclose($fp);
}

?>
