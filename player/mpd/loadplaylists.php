<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
if (array_key_exists('playlist', $_REQUEST)) {
    $pl = rawurldecode($_REQUEST['playlist']);
    do_playlist_tracks($pl,'icon-music');
} else {
    $playlists = do_mpd_command($connection, "listplaylists", null, true);
    if (!is_array($playlists)) {
        $playlists = array();
    } else if (array_key_exists('playlist', $playlists) && !is_array($playlists['playlist'])) {
        $temp = $playlists['playlist'];
        $playlists = array();
        $playlists['playlist'][0] = $temp;
    }
    if (array_key_exists('playlist', $playlists) && is_array($playlists['playlist'])) {
        sort($playlists['playlist'], SORT_STRING);
        $c = 0;
        foreach ($playlists['playlist'] as $pl) {
            debug_print("Adding Playlist To List : ".$pl,"MPD PLAYLISTS");
            add_playlist($pl, htmlspecialchars($pl), 'icon-doc-text', 'clickloadplaylist', true, $c);
            $c++;
        }
    }
}

function do_playlist_tracks($pl, $icon) {
    global $connection;
    $streams = do_mpd_command($connection, 'listplaylistinfo "'.$pl.'"', null, true);
    if (is_array($streams) && array_key_exists('file', $streams)) {
        if (!is_array($streams['file'])) {
            $temp = $streams['file'];
            $streams = array();
            $streams['file'][0] = $temp;
        }
        foreach ($streams['file'] as $st) {
            if ($pl == '[Radio Streams]') {
                add_playlist(rawurlencode($st), htmlspecialchars(substr($st, strrpos($st, '#')+1, strlen($st))), 'icon-radio-tower' ,'clicktrack', false, 0);
            } else {
                add_playlist(rawurlencode($st), htmlspecialchars($st), 'icon-music' ,'clicktrack', false, 0);
            }
        }
    }
}

function add_playlist($link, $name, $icon, $class, $delete, $count) {
    switch ($class) {
        case 'clickloadplaylist':
            print '<div class="containerbox meunitem clickable '.$class.'" name="pholder'.$count.'">';
            print '<input type="hidden" name="'.$link.'" />';
            print '<i class="icon-toggle-closed mh menu fixed" name="pholder'.$count.'"></i>';
            print '<i class="'.$icon.' fixed smallicon"></i>';
            print '<div class="expand">'.$name.'</div>';
            if ($delete) {
                print '<i class="icon-cancel-circled fixed smallicon clickable clickicon clickdeleteplaylist"></i>';
            }
            print '</div>';
            break;

        case "clicktrack":
            print '<div class="containerbox meunitem clickable '.$class.'" name="'.$link.'">';
            print '<i class="'.$icon.' fixed smallicon"></i>';
            print '<div class="expand">'.$name.'</div>';
            if ($delete) {
                print '<i class="icon-cancel-circled fixed smallicon clickable clickicon clickdeleteplaylist"></i>';
            }
            print '</div>';
            break;

        default:
            debug_print("ERROR! Not permitted type passed to add_playlist", "MPD_PLAYLISTS");
            break;


    }
}

?>
