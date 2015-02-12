<?php
chdir('../..');
include ("includes/vars.php");
include ("includes/functions.php");
include ("player/mpd/connection.php");
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
    foreach ($playlists['playlist'] as $pl) {

        if ($pl == '[Radio Streams]') {
            # This is partial support for reading Cantata's Radio Streams playlist
            # Writing to it may come in a later release
            $streams = do_mpd_command($connection, 'listplaylistinfo "[Radio Streams]"', null, true);
            if (is_array($streams) && array_key_exists('file', $streams)) {
                if (!is_array($streams['file'])) {
                    $temp = $streams['file'];
                    $streams = array();
                    $streams['file'][0] = $temp;
                }
                foreach ($streams['file'] as $st) {
                    add_playlist(rawurlencode($st), htmlspecialchars(substr($st, strrpos($st, '#')+1, strlen($st))), 'icon-radio-tower' ,'clicktrack', false);
                }
            }
        } else {
            add_playlist(rawurlencode($pl), htmlspecialchars($pl), 'icon-folder-open-empty', 'clickloadplaylist', true);
        }
    }
}

function add_playlist($link, $name, $icon, $class, $delete) {
    switch ($class) {
        case 'clickloadplaylist':
            print '<div class="containerbox meunitem dropdown-container clickable '.$class.'">';
            print '<input type="hidden" name="'.$link.'" />';
            print '<i class="'.$icon.' fixed smallicon"></i>';
            print '<div class="expand">'.$name.'</div>';
            if ($delete) {
                print '<i class="icon-cancel-circled fixed smallicon clickable clickicon clickdeleteplaylist"></i>';
            }
            print '</div>';
            break;

        case "clicktrack":
            print '<div class="containerbox meunitem dropdown-container clickable '.$class.'" name="'.$link.'">';
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
