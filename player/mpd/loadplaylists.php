<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("collection/collection.php");
include ("player/mpd/connection.php");
include ("backends/xml/backend.php");
if (array_key_exists('playlist', $_REQUEST)) {
    $pl = rawurldecode($_REQUEST['playlist']);
    do_playlist_tracks($pl,'icon-music');
} else {
    do_playlist_header();
    $playlists = do_mpd_command($connection, "listplaylists", null, true);
    if (!is_array($playlists)) {
        $playlists = array();
    } else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
        $temp = $playlists['playlist'];
        $playlists = array();
        $playlists['playlist'][0] = $temp;
    }
    $c = 0;
    if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
        sort($playlists['playlist'], SORT_STRING);
        foreach ($playlists['playlist'] as $pl) {
            debug_print("Adding Playlist To List : ".$pl,"MPD PLAYLISTS");
            add_playlist($pl, htmlspecialchars($pl), 'icon-doc-text', 'clickloadplaylist', true, $c, false);
            $c++;
        }
    }
    $existingfiles = glob('prefs/userplaylists/*');
    foreach($existingfiles as $file) {
        add_playlist(file_get_contents($file), basename($file), 'icon-doc-text', 'clickloadplaylist', true, $c, true);
        $c++;        
    }

}

function do_playlist_tracks($pl, $icon) {
    global $connection, $putinplaylistarray, $playlist;
    if ($pl == '[Radio Streams]') {
        $streams = do_mpd_command($connection, 'listplaylistinfo "'.$pl.'"', null, true);
        if (is_array($streams) && array_key_exists('file', $streams)) {
            if (!is_array($streams['file'])) {
                $temp = $streams['file'];
                $streams = array();
                $streams['file'][0] = $temp;
            }
            $c = 0;
            foreach ($streams['file'] as $st) {
                add_playlist(rawurlencode($st), htmlspecialchars(substr($st, strrpos($st, '#')+1, strlen($st))), 'icon-radio-tower' ,'clicktrack', true, $c, false);
                $c++;
            }
        }
    } else {
        $putinplaylistarray = true;
        doCollection('listplaylistinfo "'.$pl.'"', null, array("TlTrack"), true);
        $c = 0;
        foreach($playlist as $track) {
            $matches = array();
            $link = $track->url;
            debug_print("Checking URL ".$link,"PLAYLISTS");
            $class = "clicktrack";
            if (preg_match("/api\.soundcloud\.com\/tracks\/(\d+)\//", $track->url, $matches)) {
                debug_print(" ... Link is SoundCloud","PLAYLISTS");
                $link = "soundcloud://track/".$matches[1];
                $class = "clickcue";
            }
            add_playlist(rawurlencode($link), htmlspecialchars($track->name), 'icon-music', $class, true, $c, false);
            $c++;
        }
    }
}

function add_playlist($link, $name, $icon, $class, $delete, $count, $is_user) {
    switch ($class) {
        case 'clickloadplaylist':
            print '<div class="clickable '.$class.' containerbox menuitem" name="pholder'.$count.'">';
            print '<input type="hidden" name="'.$link.'" />';
            print '<i class="icon-toggle-closed menu mh fixed" name="pholder'.$count.'"></i>';
            $image = md5("Playlist ".$name);
            if (file_exists('albumart/small/'.$image.'.jpg')) {
                print '<div class="smallcover fixed"><img class="smallcover fixed" name="'.$image.'" src="albumart/small/'.$image.'.jpg" /></div>';
            } else {
                print '<div class="smallcover fixed"><img class="smallcover fixed" name="'.$image.'" src="newimages/playlist.svg" /></div>';
            }
            print '<div class="expand">'.$name.'</div>';
            if ($delete) {
                $add = ($is_user) ? "user" : "";
                print '<i class="icon-floppy fixed smallicon clickable clickicon clickrename'.$add.'playlist"></i>';
                print '<i class="icon-cancel-circled fixed smallicon clickable clickicon clickdelete'.$add.'playlist"></i>';
            }
            print '</div>';
            break;

        case "clicktrack":
            print '<div class="containerbox meunitem clickable '.$class.'" name="'.$link.'">';
            print '<i class="'.$icon.' fixed smallicon"></i>';
            print '<div class="expand">'.$name.'</div>';
            if ($delete) {
                print '<i class="icon-cancel-circled fixed playlisticonr clickable clickicon clickdeleteplaylisttrack" name="'.$count.'"></i>';
            }
            print '</div>';
            break;

        case "clickcue":
            print '<div class="containerbox meunitem clickable '.$class.'" name="'.$link.'">';
            print '<i class="'.$icon.' fixed smallicon"></i>';
            print '<div class="expand">'.$name.'</div>';
            print '</div>';
            break;

        default:
            debug_print("ERROR! Not permitted type passed to add_playlist", "MPD_PLAYLISTS");
            break;


    }
}

function do_playlist_header() {
    print '<div class="containerbox spacer dropdown-container">';
    print '<div class="fixed padright"><span style="vertical-align:middle">External URL</span></div>';
    print '<div class="expand dropdown-holder"><input class="enter" id="godfreybiggins" type="text" onkeyup="onKeyUp(event)" /></div>';
    print '<button class="fixed" style="margin-left:8px;vertical-align:middle" onclick="player.controller.loadPlaylistURL($(\'#godfreybiggins\').val())">Play</button>';
    print '</div>';
}

?>
