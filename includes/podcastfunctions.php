<?php

function getNewPodcast($url) {
    debug_print("Getting podcast ".$url,"PODCASTS");
    // iTunes links normally link to the same XML feed as the RSS link, so fixup the protocol and hope
    $url = preg_replace('#^itpc://#', 'http://', $url);
    $fname = md5($url);
    if (!is_dir('prefs/podcasts/'.$fname)) {
        mkdir('prefs/podcasts/'.$fname);
    }
    $fp = fopen('prefs/podcasts/'.$fname.'/feed.xml', 'w');
    if (!$fp) {
        debug_print("COULD NOT OPEN FILE FOR FEED!","PODCASTS");
        header('HTTP/1.0 404 Not Found');
        debug_print("Failed to get ".$url,"PODCASTS");
        fclose($fp);
        if (file_exists('prefs/podcasts/'.$fname.'/feed.xml')) {
            unlink('prefs/podcasts/'.$fname.'/feed.xml');
        }
        exit;
    }
    $result = url_get_contents($url, 'RompR Music Player/0.41', false, true, false, $fp);
    fclose($fp);
    if ($result['status'] != "200") {
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
    $ppg = $feed->channel->children('ppg', TRUE);
    $refreshoption = "never";
    $displaymode = "all";
    $autodownload = "false";
    $keepdownloaded = "false";
    $sortmode = "newestfirst";
    $hidedescriptions = "false";
    $daystokeep = 0;
    $numtokeep = 0;
    $daysLive = -1;
    if ($oldinfo) {
        $refreshoption = $oldinfo->refreshoption;
        $displaymode = $oldinfo->displaymode;
        $autodownload = $oldinfo->autodownload;
        $daystokeep = $oldinfo->daystokeep;
        $numtokeep = $oldinfo->numtokeep;
        $keepdownloaded = $oldinfo->keepdownloaded;
        $sortmode = $oldinfo->sortmode;
        $hidedescriptions = $oldinfo->hidedescriptions;
    } else {
        if ($ppg && $ppg->seriesDetails) {
            $refreshoption = $ppg->seriesDetails[0]->attributes()->frequency;
            if ($refreshoption != "hourly" && $refreshoption != "daily" &&
                $refreshoption != "weekly" && $refreshoption != "monthly") {
                $refreshoption = "never";
            }
        }
    }
    if ($ppg && $ppg->seriesDetails && $ppg->seriesDetails[0]->attributes()->daysLive) {
        $daysLive = $ppg->seriesDetails[0]->attributes()->daysLive;
    }

    $image = "newimages/podcast-logo.png";
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

    $i = getDomain($image);
    if ($i == "http" || $i == "https") {
        $imgname = 'prefs/podcasts/'.$fname.'/'.preg_replace('/\?.*$/','',basename($image));
        $fp = fopen($imgname, 'w');
        debug_print("Downloading Image ".$image." to ".$imgname,"PODCASTS");
        $result = url_get_contents($image, 'RompR Music Player/0.60', false, true, false, $fp);
        if ($result['status'] == '200') {
            debug_print("Image download Success","PODCASTS");
            $image = $imgname;
        } else {
            debug_print("Failed to download Image","PODCASTS");
        }
        fclose($fp);
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
    $x->addChild('album', htmlspecialchars($album));
    $x->addChild('refreshoption', $refreshoption);
    $x->addChild('sortmode', $sortmode);
    $x->addChild('hidedescriptions', $hidedescriptions);
    $x->addChild('displaymode', $displaymode);
    $x->addChild('daystokeep', $daystokeep);
    $x->addChild('numtokeep', $numtokeep);
    $x->addChild('keepdownloaded', $keepdownloaded);
    $x->addChild('autodownload', $autodownload);
    $x->addChild('description', htmlspecialchars((string) $feed->channel->description));
    $x->addChild('albumartist', htmlspecialchars($albumartist));
    $x->addChild('daysLive', $daysLive);

    $tracklist = $x->addChild('trackList');
    $count = 0;

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
            }
        }
        $m = $item->children('itunes', TRUE);
        if ($duration == 0 && $m && $m->duration) {
            $duration = (string) $m->duration;
        }
        // Always store time values in seconds
        if ($duration != 0 && preg_match('/:/', $duration)) {
            if (strlen($duration) == 5) {
                // Make sure we have a HH:MM:SS time string. strtotime doesn't cope with MM:SS
                $duration = "00:".$duration;
            }
            $duration = strtotime($duration) - strtotime('TODAY');
        }
        if ($m && $m->author) {
            $artist = (string) $m->author;
        } else {
            $artist = $albumartist;
        }
        $pubdate = (string) $item->pubDate;
        if ($item->enclosure && $item->enclosure->attributes()) {
            $filesize = $item->enclosure->attributes()->length;
        }
        $description = (string) $item->description;
        if ($description == "" && $m && $m->summary) {
            $description = (string) $m->summary;
        }
        $key = md5((string) $item->guid);
        $listened = "no";
        $new = "yes";
        $deleted = "no";
        $link = htmlspecialchars($link);
        $origlink = null;

        if ($oldinfo) {
            // debug_print("Checking previous download for ".$key,"PODCASTS");
            $axp = $oldinfo->xpath('//track/key[.="'.$key.'"]/parent::*');
            if ($axp) {
                // debug_print("... Found ".$key,"PODCASTS");
                $listened = $axp[0]->{'listened'};
                $link = $axp[0]->{'link'};
                $deleted = $axp[0]->{'deleted'};
                if ($axp[0]->{'origlink'}) {
                    $origlink = $axp[0]->{'origlink'};
                }
                $new = "no";
                $axp[0]->{'found'} = "yes";
                if ($deleted == "no") {
                    $count++;
                }
            } else {
                $count++;
            }
        } else {
            $count++;
        }

        if (($numtokeep > 0 && $count > $numtokeep) ||
            checkExpiry($pubdate, $daystokeep)) {
            $od = $deleted;
            $deleted = "yes";
            if (is_dir('prefs/podcasts/'.$fname.'/'.$key)) {
                if ($keepdownloaded == "false") {
                    system('rm -fR prefs/podcasts/'.$fname.'/'.$key);
                } else {
                    $deleted = $od;
                }
            }
        }

        $track = $tracklist->addChild('track');
        $track->addChild('title', htmlspecialchars($item->title));
        $track->addChild('duration', $duration);
        $track->addChild('artist', htmlspecialchars($artist));
        $track->addChild('pubdate', $pubdate);
        $track->addChild('filesize', $filesize);
        $track->addChild('description', htmlspecialchars($description));
        $track->addChild('key', $key);
        debug_print("Track Link Is ".$link,"PODCASTS");
        $track->addChild('link', htmlspecialchars($link));
        $track->addChild('listened', $listened);
        $track->addChild('new', $new);
        $track->addChild('deleted', $deleted);
        if ($origlink) {
            $track->addChild('origlink', $origlink);
        }

    }

    // Now add any remaining ones from the old list that have been downloaded but not
    // found in the new list
    if ($oldinfo) {
        foreach($oldinfo->trackList->track as $track) {
            if ($track->found && $track->found == "yes") {

            } else if (is_dir('prefs/podcasts/'.$fname.'/'.$track->key)) {
                // This is messy but simplexml sucks big fat donkey shit and it's late and I'm tired.
                if ($track->deleted == "no") {
                    $count++;
                    if ($keepdownloaded == "false" &&
                        (($numtokeep > 0 && $count > $numtokeep) ||
                        checkExpiry($track->pubdate, $daystokeep))) {
                        system('rm -fR prefs/podcasts/'.$fname.'/'.$track->key);
                    } else {
                        $item = $tracklist->addChild('track');
                        $item->addChild('deleted', $track->deleted);
                        $item->addChild('title', $track->title);
                        $item->addChild('duration', $track->duration);
                        $item->addChild('artist', $track->artist);
                        $item->addChild('pubdate', $track->pubdate);
                        $item->addChild('filesize', $track->filesize);
                        $item->addChild('description', $track->description);
                        $item->addChild('key', $track->key);
                        $item->addChild('link', $track->link);
                        $item->addChild('listened', $track->listened);
                        $item->addChild('new', $track->new);
                    }
                }
            }
        }
    }

    saveFormattedXML($x, 'prefs/podcasts/'.$fname.'/info.xml');
}

function checkExpiry($pubdate, $daystokeep) {
    if ($daystokeep == 0) {
        return false;
    }
    $pubtime = strtotime($pubdate);
    $deletetime = $daystokeep * 86400;
    if ($pubtime+$deletetime < time()) {
        return true;
    } else {
        return false;
    }
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

function format_text($d) {
    $d = preg_replace('/(<a href=.*?)>/', '$1 target="_blank">', $d);
    $d = preg_replace('/(<a rel="nofollow" href=.*?)>/', '$1 target="_blank">', $d);
    $d = preg_replace('/style\s*=\s*\".*?\"/', '', $d);
    $d = preg_replace('/<p>\s*<\/p>/', '', $d);
    $d = preg_replace('/<p>&nbsp;<\/p>/', '', $d);
    $d = preg_replace('/\n|\r\n/', '<br>', $d);
    return $d;
}

function doPodcast($c) {
    $y = simplexml_load_file($c.'/info.xml');
    $pm = basename($c);
    $aa = $y->albumartist;
    if ($aa != '') {
        $aa = $aa . ' - ';
    }
    print '<div class="whatdoicallthis">'.format_text((string) $y->description).'</div>';
    print '<div class="clearfix bumpad">';
    print '<i title="'.get_int_text("podcast_delete").'" class="icon-cancel-circled podicon clickable clickicon podremove tright fridge" name="podremove_'.$pm.'"></i>';
    print '<i title="'.get_int_text("podcast_configure").'" class="icon-cog-alt podicon clickable clickicon podconf tleft fridge" name="podconf_'.$pm.'"></i>';
    print '<i title="'.get_int_text("podcast_refresh").'" class="icon-refresh podicon clickable clickicon podrefresh tleft fridge" name="podrefresh_'.$pm.'"></i>';
    print '<i title="'.get_int_text("podcast_download_all").'" class="icon-download podicon clickable clickicon podgroupload tleft fridge" name="podgroupload_'.$pm.'"></i>';
    print '<i title="'.get_int_text("podcast_mark_all").'" class="icon-headphones podicon clickable clickicon podgrouplisten tleft fridge" name="podgrouplisten_'.$pm.'"></i>';
    print '</div>';
    $class = "dropmenu marged";
    if ((array_key_exists('channel', $_REQUEST) && $_REQUEST['channel'] == $pm) &&
        array_key_exists('option', $_REQUEST)) {
        // Don't rehide the config panel if we're choosing something from it
        $class .= " visible";
    }
    print '<div class="'.$class.'" id="podconf_'.$pm.'">';
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
    print '<input type="hidden" class="podauto" value="'.$y->autodownload.'" />';

    print '<div class="containerbox vertical podoptions">';
    print '<div class="containerbox fixed dropdown-container"><div class="divlabel">'.get_int_text("podcast_display").'</div>';
    print '<div class="selectholder">';
    print '<select name="displaymode" onchange="podcasts.changeOption(event)">';
    $options =  '<option value="all">'.get_int_text("podcast_display_all").'</option>'.
                '<option value="new">'.get_int_text("podcast_display_onlynew").'</option>'.
                '<option value="unlistened">'.get_int_text("podcast_display_unlistened").'</option>'.
                '<option value="downloadednew">'.get_int_text("podcast_display_downloadnew").'</option>'.
                '<option value="downloaded">'.get_int_text("podcast_display_downloaded").'</option>';
    print preg_replace('/(<option value="'.$y->displaymode.'")/', '$1 selected', $options);
    print '</select>';
    print '</div></div>';

    print '<div class="containerbox fixed dropdown-container"><div class="divlabel">'.get_int_text("podcast_refresh").'</div>';
    print '<div class="selectholder">';
    print '<select name="refreshoption" onchange="podcasts.changeOption(event)">';
    $options =  '<option value="never">'.get_int_text("podcast_refresh_never").'</option>'.
                '<option value="hourly">'.get_int_text("podcast_refresh_hourly").'</option>'.
                '<option value="daily">'.get_int_text("podcast_refresh_daily").'</option>'.
                '<option value="weekly">'.get_int_text("podcast_refresh_weekly").'</option>'.
                '<option value="monthly">'.get_int_text("podcast_refresh_monthly").'</option>';
    $opt = $y->refreshoption;
    if (!$opt) {
        $opt = "never";
    }
    print preg_replace('/(<option value="'.$opt.'")/', '$1 selected', $options);
    print '</select>';
    print '</div></div>';

    print '<div class="containerbox fixed dropdown-container"><div class="divlabel">'.get_int_text("podcast_expire").'</div>';
    print '<div class="selectholder">';
    print '<select title="'.get_int_text("podcast_expire_tooltip").'" name="daystokeep" class="fridge" onchange="podcasts.changeOption(event)">';
    $options =  '<option value="0">'.get_int_text("podcast_expire_never").'</option>'.
                '<option value="7">'.get_int_text("podcast_expire_week").'</option>'.
                '<option value="14">'.get_int_text("podcast_expire_2week").'</option>'.
                '<option value="30">'.get_int_text("podcast_expire_month").'</option>'.
                '<option value="60">'.get_int_text("podcast_expire_2month").'</option>'.
                '<option value="182">'.get_int_text("podcast_expire_6month").'</option>'.
                '<option value="365">'.get_int_text("podcast_expire_year").'</option>';
    $opt = $y->daystokeep;
    if (!$opt) {
        $opt = "0";
    }
    print preg_replace('/(<option value="'.$opt.'")/', '$1 selected', $options);
    print '</select>';
    print '</div></div>';

    print '<div class="containerbox fixed dropdown-container"><div class="divlabel">'.get_int_text("podcast_keep").'</div>';
    print '<div class="selectholder">';
    print '<select title="'.get_int_text("podcast_keep_tooltip").'" name="numtokeep" class="fridge" onchange="podcasts.changeOption(event)">';
    $options =  '<option value="0">'.get_int_text("podcast_keep_0").'</option>'.
                '<option value="1">1</option>'.
                '<option value="5">5</option>'.
                '<option value="10">10</option>'.
                '<option value="25">25</option>'.
                '<option value="50">50</option>'.
                '<option value="100">100</option>'.
                '<option value="200">200</option>';
    $opt = $y->numtokeep;
    if (!$opt) {
        $opt = "0";
    }
    print preg_replace('/(<option value="'.$opt.'")/', '$1 selected', $options);
    print '</select>';
    print '</div></div>';

    print '<div class="containerbox fixed dropdown-container"><div class="divlabel">'.get_int_text("podcast_sortmode").'</div>';
    print '<div class="selectholder">';
    print '<select name="sortmode" onchange="podcasts.changeOption(event)">';
    $options =  '<option value="newestfirst">'.get_int_text("podcast_newestfirst").'</option>'.
                '<option value="oldestfirst">'.get_int_text("podcast_oldestfirst").'</option>';
    print preg_replace('/(<option value="'.$y->sortmode.'")/', '$1 selected', $options);
    print '</select>';
    print '</div></div>';

    print '</div>';

    print '<div class="containerbox fixed bumpad">';
    print '<input title="'.get_int_text("podcast_kd_tooltip").'" type="checkbox" class="topcheck fridge" name="keepdownloaded" onclick="podcasts.changeOption(event)"';
    if ($y->keepdownloaded == "true") {
        print ' checked';
    }
    print '>'.get_int_text("podcast_keep_downloaded").'</input></div>';

    print '<div class="containerbox fixed bumpad">';
    print '<input type="checkbox" class="topcheck podautodown" name="autodownload" onclick="podcasts.changeOption(event)"';
    if ($y->autodownload == "true") {
        print ' checked';
    }
    print '>'.get_int_text("podcast_auto_download").'</input></div>';

    print '<div class="containerbox fixed bumpad">';
    print '<input type="checkbox" class="topcheck fridge" name="hidedescriptions" onclick="podcasts.changeOption(event)"';
    if ($y->hidedescriptions == "true") {
        print ' checked';
    }
    print '>'.get_int_text("podcast_hidedescriptions").'</input></div>';

    print '</div>';
    if ($y->sortmode == "oldestfirst") {
        for ($i = count($y->trackList->track)-1; $i >=0; $i--) {
            format_episode($y, $y->trackList->track[$i], $pm);
        }
    } else {
        foreach($y->trackList->track as $item) {
            format_episode($y, $item, $pm);
        }
    }
}

function format_episode(&$y, &$item, $pm) {
    if ($item->deleted == "yes") {
        return;
    }
    if ($y->displaymode == "downloadednew" &&
        (!is_dir('prefs/podcasts/'.$pm.'/'.$item->key) && $item->new == "no"))
    {
        return;
    }
    if ($y->displaymode == "new" && $item->new == "no") {
        return;
    }
    if ($y->displaymode == "unlistened" && $item->listened == "yes") {
        // Track cannot be new and unlistened, that can't happen because it makes no sense
        return;
    }
    if ($y->displaymode == "downloaded" && !is_dir('prefs/podcasts/'.$pm.'/'.$item->key)) {
        return;
    }
    print '<div class="clickable clicktrack item podcastitem draggable" name="'.htmlspecialchars_decode($item->link).'">';
    print '<div class="containerbox">';
    if ($item->new == "yes") {
        print '<i title="'.get_int_text("podcast_tooltip_new").'" class="icon-sun fixed newpodicon fridge"></i>';
    } else if ($item->listened == "no") {
        print '<i title="'.get_int_text("podcast_tooltip_notnew").'" class="icon-unlistened fixed oldpodicon fridge"></i>';
    }
    print '<div class="podtitle expand">'.$item->title.'</div></div>';
    print '<div class="whatdoicallthis padright clearfix"><span class="tleft"><i>'.$item->pubdate.'</i></span>';
    if ($item->duration != 0) {
        print '<span class="tright">'.format_time($item->duration).'</span>';
    }
    print '</div>';
    if ($y->daysLive > -1 && $item->listened == "no" && !is_dir('prefs/podcasts/'.$pm.'/'.$item->key)) {
        $pubtime = strtotime((string) $item->pubdate);
        $expiretime = $pubtime + (($y->daysLive) * 86400);
        $timeleft = format_time2($expiretime - time());
        if ($expiretime < time()) {
            print '<div><b>'.get_int_text("podcast_expired").'</b></div>';
        } else if ($expiretime - time() < 86400) {
            print '<div><b><font color="red">'.get_int_text("podcast_timeleft", array($timeleft))."</font></b></div>";
        } else {
            print '<div><b>'.get_int_text("podcast_timeleft", array($timeleft))."</b></div>";
        }
    }
    if ($y->hidedescriptions == "true") {
        // Testing for true because podcasts subscribed with rompr < 0.60 won't have this option set at all
    } else {
        print '<div class="whatdoicallthis">'.format_text((string) $item->description).'</div>';
    }
    print '<div class="clearfix" name="podcontrols_'.$pm.'">';
    if (is_dir('prefs/podcasts/'.$pm.'/'.$item->key)) {
        print '<i class="icon-floppy podicon tleft fridge" title="'.get_int_text("podcast_tooltip_downloaded").'"></i>';
    } else {
        print '<i class="icon-download podicon clickable clickicon tleft poddownload fridge" title="'.get_int_text("podcast_tooltip_download").'" name="poddownload_'.$item->key.'"></i>';
    }
    if ($item->listened == "no") {
        print '<i class="icon-headphones podicon clickable clickicon tleft podmarklistened fridge" title="'.get_int_text("podcast_tooltip_mark").'" name="podmarklistened_'.$item->key.'"></i>';
    }
    print '<i class="icon-cancel-circled podicon clickable clickicon tright podtrackremove fridge" title="'.get_int_text("podcast_tooltip_delepisode").'" name="podtrackremove_'.$item->key.'" ></i>';
    print '</div>';
    print '</div>';
}

function doPodcastHeader($c) {
    $y = simplexml_load_file($c.'/info.xml');
    $pm = basename($c);
    $aa = $y->albumartist;
    if ($aa != '') {
        $aa = $aa . ' - ';
    }
    print '<div class="containerbox menuitem">';
    print '<i class="icon-toggle-closed menu mh fixed" name="podcast_'.$pm.'"></i>';
    $i = getDomain($y->image);
    if ($i == "http" || $i == "https") {
        $img = "getRemoteImage.php?url=".$y->image;
    } else {
        $img = $y->image;
    }
    print '<div class="smallcover fixed"><img class="smallcover" src="'.$img.'" /></div>';
    print '<div class="expand"><b>'.$aa.$y->album.'</b><span class="podnumber"></span><span></span></div>';
    print '</div>';
    print '<div id="podcast_'.$pm.'" class="indent dropmenu padright">';

}

function markAsListened($c, $url) {
    debug_print("Marking ".$url." from ".$c." as listened","PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$c.'/info.xml');
    $axp = $x->xpath('//track/link[.="'.htmlspecialchars($url).'"]/parent::*');
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
    debug_print("Marking ".$key." from ".$channel." as listened","PODCASTS");
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $axp = $x->xpath('//track/key[.="'.$key.'"]/parent::*');
    debug_print("Found Track. Title is ".$axp[0]->{'title'},"PODCASTS");
    $axp[0]->{'listened'} = "yes";
    $axp[0]->{'new'} = "no";
    saveFormattedXML($x, 'prefs/podcasts/'.$channel.'/info.xml');
}

function changeOption($option, $val, $channel) {
    $x = simplexml_load_file('prefs/podcasts/'.$channel.'/info.xml');
    $x->{$option} = $val;
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
    $result = url_get_contents($link, 'RompR Music Player/0.41', false, true, false, $fp);
    fclose($fp);
    if ($result['status'] != "200") {
        header('HTTP/1.0 404 Not Found');
        debug_print("Failed to get ".$link,"PODCASTS");
        system ('rm -fR prefs/podcasts/'.$channel.'/'.$key);
        exit;
    }
    $axp[0]->{'origlink'} = (string) $axp[0]->{'link'};
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