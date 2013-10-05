<?php
include ("vars.php");
include ("functions.php");
if(array_key_exists("wiki", $_REQUEST)) {
    $html = get_wikipedia_page( $_REQUEST['wiki'] );
    print format_wikipedia_page($html);
} else if(array_key_exists("uri", $_REQUEST)) {
    $uri = rawurldecode($_REQUEST['uri']);
    $a = preg_match('#http://(.*?)/#', $uri, $matches);
    $html = get_wikipedia_page(basename($uri), $matches[1]);
    print format_wikipedia_page($html);
} else if (array_key_exists("artist", $_REQUEST)) {
    $html = getArtistWiki(rawurldecode($_REQUEST['artist']), rawurldecode($_REQUEST['disambiguation']));
    if ($html == null) {
        print '<h3 align="center">Wikipedia could not find anything related to &quot;'.rawurldecode($_REQUEST['artist']).'&quot;</h3>';
    } else {
        print $html;
    }
} else if (array_key_exists("album", $_REQUEST)) {
    debug_print("Doing album ".$_REQUEST['album'],"WIKIPEDIA");
    $html = getAlbumWiki(rawurldecode($_REQUEST['album']), rawurldecode($_REQUEST['albumartist']));
    if ($html == null) {
        print '<h3 align="center">Wikipedia could not find anything related to &quot;'.rawurldecode($_REQUEST['album']).'&quot;</h3>';
    } else {
        print $html;
    }
} else if (array_key_exists("track", $_REQUEST)) {
    debug_print("Doing track ".$_REQUEST['track'],"WIKIPEDIA");
    $html = getTrackWiki(rawurldecode($_REQUEST['track']), rawurldecode($_REQUEST['trackartist']));
    if ($html == null) {
        print '<h3 align="center">Wikipedia could not find anything related to &quot;'.rawurldecode($_REQUEST['track']).'&quot;</h3>';
    } else {
        print $html;
    }
}

function prepare_string($searchstring) {
    // Escape naughty characters
    $searchstring = preg_replace( '/(\(|\)|\^|\$|\\\\|\/)/', '\\\\$1', $searchstring );
    return $searchstring;
}

function wikipedia_last_ditch_attempt($artistinfo) {

    //Last ditch effort - is there a disambiguation page?
    foreach ($artistinfo->query->search->p as $id) {
        if (preg_match('/\(disambiguation\)/i', $id['title'])) {
            debug_print("Artist returning disambiguation page","WIKIPEDIA");
            return $id['title'];
        }
    }

    return null;

}

function wikipedia_last_ditch_attempt_2($data) {

    //Last ditch effort - is there a disambiguation page?
    foreach ($data->query->search->p as $id) {
        if (preg_match('/\(disambiguation\)/i', $id['title'])) {
            return $id['title'];
        }
    }

    return null;

}

function wikipedia_get_list_of_suggestions($artistinfo, $term) {

    if (count($artistinfo->query->search->p) == 0) {
        return null;
    }
    $html = '<h3>Wikipedia was unable to find any pages matching '.$term.'</h3>';
    $html = $html . "<h3>Here are some suggestions it came up with</h3>";
    $html = $html . "<ul>";
    foreach ($artistinfo->query->search->p as $id) {
        $link = preg_replace('/\s/', '_', $id['title']);
        $html = $html . '<li><a href="#" name="'.htmlspecialchars($link, ENT_QUOTES).'" class="infoclick clickwikilink">'.$id['title'].'</a></li>';
    }
    $html = $html . "</ul>";
    return $html;

}

function get_wikipedia_artistinfo($artist, $disambig) {

    $searchfor = $artist;
    if ($disambig != "") {
        $searchfor = $artist.' ('.$disambig.')';
    }
    debug_print("Searching Wikipedia for ".$searchfor, "WIKIPEDIA");
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($searchfor) . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $artistinfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

    // First look for exact match
    $page = null;
    foreach ($artistinfo->query->search->p as $id) {
        $searchstring = $id['title'];
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', $searchfor)) {
            $page = $id['title'];
            break;
        }
    }

    if ($page == null) {
        $poss = array();
        foreach ($artistinfo->query->search->p as $id) {
            if (preg_match('/\(.*?band\)|\(.*?musician\)|\(.*?singer\)/i', $id['title'])) {
                array_push($poss, $id['title']);
            }
        }
        if (count($poss) == 1) {
            $page = array_shift($poss);
        }
    }


    if ($page == null) {
        debug_print("Searching Wikipedia for ".$artist, "WIKIPEDIA");
        $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($artist) . '&srprop=score&format=xml');
        $xml = $content['contents'];
        $artist2info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        // Now try various combinations of modified strings to see if we get anything
        foreach ($artist2info->query->search->p as $id) {

            $poss = array();
            foreach ($artistinfo->query->search->p as $id) {
                if (preg_match('/\(.*?band\)|\(.*?musician\)|\(.*?singer\)/i', $id['title'])) {
                    array_push($poss, $id['title']);
                }
            }
            if (count($poss) == 1) {
                $page = array_shift($poss);
                break;
            }

            $searchstring = $id['title'];
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist)) {
                $page = $id['title'];
                break;
            }

            $searchstring = $id['title'];
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', "The " . $artist)) {
                $page = $id['title'];
                break;
            }
            $searchstring = $id['title'];
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*The ' . $searchstring . '\s*$/i', $artist)) {
                $page = $id['title'];
                break;
            }

            if (preg_match('/&/', $id['title'])) {
                $searchstring = $id['title'];
                $searchstring = preg_replace( '/&/', 'and', $searchstring );
                $searchstring = prepare_string($searchstring);
                if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist)) {
                    $page = $id['title'];
                    break;
                }
            }

            if (preg_match('/and/', $id['title'])) {
                $searchstring = $id['title'];
                $searchstring = preg_replace( '/and/', '&', $searchstring );
                $searchstring = prepare_string($searchstring);
                if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist)) {
                    $page = $id['title'];
                    break;
                }
            }

            // Any '.'? Let's remove them (both ways round)
            if (preg_match('/\./', $id['title'])) {
                $searchstring = $id['title'];
                $searchstring = preg_replace( '/\./', '', $searchstring );
                $searchstring = prepare_string($searchstring);
                if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist)) {
                    $page = $id['title'];
                    break;
                }
            }
            if (preg_match('/\./', $artist)) {
                $searchstring = $id['title'];
                $t = preg_replace( '/\./', '', $artist );
                $searchstring = prepare_string($searchstring);
                if (preg_match('/^\s*' . $searchstring . '\s*$/i', $t)) {
                    $page = $id['title'];
                    break;
                }
            }

            // Words for numbers, numbers for words.
            $numbers = array('/1/','/2/','/3/','/4/','/5/','/6/','/7/','/8/','/9/');
            $words = array("one", "two", "three", "four", "five", "six", "seven", "eight", "nine");

            $searchstring = $id['title'];
            $searchstring = preg_replace( $numbers, $words, $searchstring);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist) ||
                preg_match('/^\s*' . $searchstring . '\s*$/i', "The ".$artist)) {
                $page = $id['title'];
                break;
            }

            $numbers = array('1','2','3','4','5','6','7','8','9');
            $words = array("/one/", "/two/", "/three/", "/four/", "/five/", "/six/", "/seven/", "/eight/", "/nine/");
            $searchstring = $id['title'];
            $searchstring = preg_replace( $words, $numbers, $searchstring);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist) ||
                preg_match('/^\s*' . $searchstring . '\s*$/i', "The ".$artist)) {
                $page = $id['title'];
                break;
            }

        }
    }

    if ($page == null) {
        // No results returned. If there's an '&' or 'and' or '+' in the name - such as 'Fruitbat & Umbrella'
        // try querying for 'Fruitbat' and 'Umbrella' separately and if there are any results, display them all
        $artist = preg_replace('/ and /', ' & ', $artist);
        $artist = preg_replace('/\+/', '&', $artist);
        if (preg_match('/ & /', $artist) > 0) {
            $alist = explode(' & ', $artist);
            $jhtml = '';
            foreach ($alist as $artistname) {
                $jhtml = $jhtml . get_wikipedia_artistinfo($artistname, "");
            }
            return $jhtml;
        } elseif (preg_match('/,/', $artist) > 0) {
            $alist = explode(',', $artist);
            $jhtml = '';
            foreach ($alist as $artistname) {
                $jhtml = $jhtml . get_wikipedia_artistinfo($artistname, "");
            }
            return $jhtml;
        }
    }

    if ($page == null) {
        $page = wikipedia_last_ditch_attempt($artistinfo);
    }

    if ($page == null) {
        $page = wikipedia_get_list_of_suggestions($artistinfo, $artist);
        if ($page != null) {
            return $page;
        }
    }

    if ($page == null) {
        return null;
    }
    $html = get_wikipedia_page($page);
    $html = format_wikipedia_page($html);
    return $html;

}

function get_wikipedia_albuminfo($album, $artist) {

    $album = munge_album_name($album);
    debug_print("Searching Wikipedia for ".$album." (album)", "WIKIPEDIA");
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($album." (album)") . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $albuminfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

    $page = null;

    foreach ($albuminfo->query->search->p as $id) {
        $searchstring = prepare_string($album).'\s+\('.prepare_string($artist).' album\)';
        // debug_print("1. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
        if (preg_match('/^\s*' . $searchstring . '/i', $id['title'])) {
            debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
            $page = $id['title'];
            break;
        }
    }

    if ($page == null) {
        foreach ($albuminfo->query->search->p as $id) {
            $searchstring = prepare_string($album).'\s+\(album\)';
            // debug_print("2. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        foreach ($albuminfo->query->search->p as $id) {
            $searchstring = prepare_string($album).'\s+\(\d+ album\)';
            // debug_print("2. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        foreach ($albuminfo->query->search->p as $id) {
            $searchstring = prepare_string($album);
            // debug_print("3. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        debug_print("Searching Wikipedia for ".$album, "WIKIPEDIA");
        $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($album) . '&srprop=score&format=xml');
        $xml = $content['contents'];
        $album2info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        foreach ($album2info->query->search->p as $id) {
            $searchstring = prepare_string($album);
            // debug_print("3. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        $page = wikipedia_last_ditch_attempt_2($albuminfo);
    }

    if ($page == null) {
        $page = wikipedia_get_list_of_suggestions($albuminfo, $album);
        if ($page != null) {
            return $page;
        }
    }

    if ($page == null) {
        return null;
    }
    $html = get_wikipedia_page($page);
    $html = format_wikipedia_page($html);
    return $html;

}

function get_wikipedia_trackinfo($track, $trackartist) {

    debug_print("Searching Wikipedia for ".$track." (song) by ".$trackartist, "WIKIPEDIA");
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($track." (song)") . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $albuminfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

    // Comments assume the following:
    // track is 'A Track'
    // artist is 'An Artist'

    $page = null;

    // Look for 'A Track (An Artist song)'
    foreach ($albuminfo->query->search->p as $id) {
        $searchstring = prepare_string($track).'\s+\('.prepare_string($trackartist).' song\)';
        // debug_print("1. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
        if (preg_match('/^\s*' . $searchstring . '/i', $id['title'])) {
            debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
            $page = $id['title'];
            break;
        }
    }

    // Look for 'A Track (song)'
    if ($page == null) {
        foreach ($albuminfo->query->search->p as $id) {
            $searchstring = prepare_string($track).'\s+\(song\)';
            // debug_print("2. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    // Look for 'A Track'
    if ($page == null) {
        foreach ($albuminfo->query->search->p as $id) {
            $searchstring = prepare_string($track);
            // debug_print("3. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        debug_print("Searching Wikipedia for ".$track, "WIKIPEDIA");
        $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($track) . '&srprop=score&format=xml');
        $xml = $content['contents'];
        $album2info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        foreach ($album2info->query->search->p as $id) {
            $searchstring = prepare_string($track);
            // debug_print("3. Checking page ".$id['title']." against ".$searchstring, "WIKIDEBUG");
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $id['title'])) {
                debug_print("Found Page : ".$id['title'], "WIKIPEDIA");
                $page = $id['title'];
                break;
            }
        }
    }

    if ($page == null) {
        $page = wikipedia_last_ditch_attempt_2($albuminfo);
    }

    if ($page == null) {
        $page = wikipedia_get_list_of_suggestions($albuminfo, $track);
        if ($page != null) {
            return $page;
        }
    }

    if ($page == null) {
        return null;
    }
    $html = get_wikipedia_page($page);
    $html = format_wikipedia_page($html);
    return $html;

}

function getArtistWiki($artist_name, $disambig) {
    return get_wikipedia_artistinfo($artist_name, $disambig);
}

function getAlbumWiki($album_name, $artist_name) {
    return get_wikipedia_albuminfo($album_name, $artist_name);
}

function getTrackWiki($track_name, $artist_name) {
    return get_wikipedia_trackinfo($track_name, $artist_name);
}

function get_wikipedia_page($page, $domain="en.wikipedia.org") {

    debug_print("Getting page ".$page." from ".$domain,"WIKIPEDIA");
    $content = url_get_contents('http://'.$domain.'/w/api.php?action=parse&prop=text&page=' . rawurlencode($page) . '&format=xml');
    $xml = $content['contents'];
    if ($content['status'] == "200") {
        $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        $html = $info->parse->text;
        if (preg_match( '/REDIRECT <a href="\/wiki\/(.*?)"/', $html, $matches )) {
            $html = get_wikipedia_page( $matches[1] );
        }
        return $html;
    } else {
        return "";
    }

}

function format_wikipedia_page($html) {
    // Remove unwanted edit links:
    $html = preg_replace('/<span class="editsection">.*?<\/span>/', '', $html);
    //<a rel="nofollow" class="external text" href="http://www.jamaicanrecordings.com/jr_pages/005_aggrovators.htm">
    $html = preg_replace( '/(<a .*? href="http:\/\/.*?")/', '$1 target="_blank"', $html );
    //<a class="external text" href="//en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=render_collection&amp;colltitle=Book:Deep_Purple&amp;writer=rl">Download PDF</a>
    $html = preg_replace( '/(<a .*? href=".*?Special\:Book.*?")/', '$1 target="_blank"', $html );
    //<a href="/w/index.php?title=J%C3%B6rg_Schwenke&amp;action=edit&amp;redlink=1" class="new" title="JÃ¶rg Schwenke (page does not exist)">JÃ¶rg Schwenke</a>
    $html = preg_replace( '/<a href="\/w\/.*?">(.*?)<\/a>/', '$1', $html );
    //Reformat wikimedia links so they go to our AJAX query : <a href="/wiki/File:Billbongo.jpg"
    $html = preg_replace_callback( '/<a href="\/wiki\/(File:.*?)"/', 'callback1', $html );
    //Redirect intra-wikipedia links so they come back to us and we can parse them
    $html = preg_replace_callback( '/<a href="\/wiki\/(.*?)"/', 'callback2', $html );
    // Remove inline color styles on elements
    $html = preg_replace( '/(<.*?)background.*?(\"|\;)/', '$1$2', $html );
    $html = preg_replace( '/(<.*?)color.*?(\"|\;)/', '$1$2', $html );
    // These bits are a pain in the arse
    $html = preg_replace('/<li class="nv-.*?<\/li>/', '', $html);
    return $html;
}

function callback1($matches) {
    return '<a href="#" name="'.htmlspecialchars($matches[1], ENT_QUOTES).'" class="infoclick clickwikimedia"';
}

function callback2($matches) {
    return '<a href="#" name="'.htmlspecialchars($matches[1], ENT_QUOTES).'" class="infoclick clickwikilink"';
}


?>