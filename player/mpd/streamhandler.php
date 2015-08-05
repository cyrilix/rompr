<?php
$streamdomains = array(
    "http", "https", "mms", "mmsh", "mmst", "mmsu", "gopher", "rtp", "rtsp", "rtmp", "rtmpt",
    "rtmps", "dirble", "tunein", "radio-de", "audioaddict", "oe1");

function check_is_stream(&$filedata) {
    global $streamdomains;
    if (in_array($filedata['domain'], $streamdomains) &&
        !preg_match('#/item/\d+/file$#', $filedata['file']) &&
        strpos($filedata['file'], 'vk.me') === false &&
        strpos($filedata['file'], 'oe1:archive') === false &&
        strpos($filedata['file'], 'http://leftasrain.com') === false)
    {

        $filedata['Track'] = null;

        list (  $track_found,
                $filedata['Title'],
                $filedata['Time'],
                $filedata['Artist'],
                $filedata['Album'],
                $filedata['folder'],
                $filedata['type'],
                $filedata['X-AlbumImage'],
                $filedata['station'],
                $filedata['stream'],
                $filedata['AlbumArtist']) = getStuffFromXSPF($filedata['file']);

        if (!$track_found) {

            debuglog(
                "Stream Track ".$filedata['file']." from ".$filedata['domain']." was not found in stored library","STREAMHANDLER"
                ,5
            );

            if (strrpos($filedata['file'], '#') !== false) {
                # Fave radio stations added by Cantata/MPDroid
                $$filedata['Album'] = substr($filedata['file'],
                    strrpos($filedata['file'], '#')+1, strlen($filedata['file']));
            }

            if ($filedata['Name'] !== null) {
                debuglog("Setting album to ".$filedata['Name'],"STREAMHANDLER");
                $filedata['Album'] = $filedata['Name'];
            }

            if ($filedata['Title'] !== null && $filedata['Name'] == null) {
                $filedata['Album'] = $filedata['Title'];
                $filedata['Title'] = '';
            }

            if ($filedata['Genre'] == "Podcast") {
                if ($filedata['X-AlbumImage'] == null) {
                    $filedata['X-AlbumImage'] = "newimages/podcast-logo.svg";
                }
                $filedata['type'] = "podcast";
            }

            // This is for sorting out some kind of Mopidy-related oddness but I can't remember
            // what it was or whether it's still relevant.
            if ($filedata['Album'] != null && $filedata['Artist'] != null && $filedata['Title'] != null) {
                $temp = $filedata['Artist'][0];
                $filedata['Artist'] = array($filedata['Title']);
                $filedata['Title'] = $temp;
            }

            if ($filedata['Album'] == null && $filedata['Artist'] != null && $filedata['Title'] != null) {
                $filedata['Album'] = $filedata['Title'];
                $filedata['Title'] = "";
            }

            // Pretty up the images for some mopidy stream domains
            switch ($filedata['domain']) {
                case "audioaddict":
                    if ($filedata['X-AlbumImage'] == null) {
                        $filedata['X-AlbumImage'] = "newimages/".$domain."-logo.png";
                    }
                    break;

                case "oe1":
                case "tunein":
                case "radio-de":
                case "dirble":
                    if ($filedata['X-AlbumImage'] == null) {
                        $filedata['X-AlbumImage'] = "newimages/".$domain."-logo.svg";
                    }
                    break;

                case "http":
                    if (strpos($filedata['file'], 'bassdrive.com') !== false) {
                        if ($filedata['X-AlbumImage'] == null) {
                            $filedata['X-AlbumImage'] = "newimages/bassdrive-logo.svg";
                        }
                        $filedata['Album'] = "Bassdrive";
                    }
                    break;
            }
        }
    }
}

?>