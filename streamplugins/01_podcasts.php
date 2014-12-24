<?php

if (array_key_exists('populate', $_REQUEST)) {

    chdir('..');

    include("includes/vars.php");
    include("includes/functions.php");
    include("includes/podcastfunctions.php");
    include("international.php");
    $dtz = ini_get('date.timezone');
    if (!$dtz) {
        date_default_timezone_set('UTC');
    }
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
    } else if (array_key_exists('channellistened', $_REQUEST)) {
        markChannelAsListened($_REQUEST['channellistened']);
    } else if (array_key_exists('option', $_REQUEST)) {
        changeOption($_REQUEST['option'], $_REQUEST['val'], $_REQUEST['channel']);
    }

    if (array_key_exists('refresh', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['refresh']);
    } else if (array_key_exists('itunes', $_REQUEST)) {

    } else if (array_key_exists('listened', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['listened']);
    } else if (array_key_exists('removetrack', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
    } else if (array_key_exists('downloadtrack', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
    } else if (array_key_exists('markaslistened', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
    } else if (array_key_exists('channellistened', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['channellistened']);
    } else if (array_key_exists('option', $_REQUEST)) {
        doPodcast('prefs/podcasts/'.$_REQUEST['channel']);
    } else {

        print '<div id="fruitbat" class="noselection fullwidth">';
        print '<div id="cocksausage">';
        print '<div class="containerbox"><div class="expand">'.get_int_text("podcast_entrybox").'</div></div>';
        print '<div class="containerbox"><div class="expand"><input class="enter sourceform" name="ginger" id="podcastsinput" type="text" /></div>';
        print '<button class="fixed sourceform" onclick="podcasts.doPodcast(\'podcastsinput\')">'.get_int_text("label_retrieve").'</button></div>';
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
        print "$('#podcastsinput').on('drop', podcasts.handleDrop);\n";
        print '</script>'."\n";
    }

} else {

?>
<div class="containerbox menuitem noselection">
<?php
print '<div class="mh fixed"><i class="icon-toggle-closed menu fixed" name="podcastslist"></i></div>';
print '<div class="fixed"><i class="icon-podcast-circled smallcover-svg"></i></div>';
print '<div class="expand">'.get_int_text('label_podcasts').'<span id="total_unlistened_podcasts"></span><span></span></div>';
?>
</div>
<div id="podcastslist" class="dropmenu">
</div>
<?php
}
?>