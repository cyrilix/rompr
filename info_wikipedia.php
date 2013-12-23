<?php
include ("vars.php");
include ("functions.php");
include ("international.php");
$domain = "en";
$userdomain = false;
if (array_key_exists("lang", $_REQUEST)) {
    $domain = $_REQUEST["lang"];
}
debug_print("Using Language ".$domain,"WIKIPEDIA");
if(array_key_exists("wiki", $_REQUEST)) {
    // An intra-wiki link from a page we're displaying
    $a = preg_match('#(.*?)/(.*)#', rawurldecode($_REQUEST['wiki']), $matches);
    $html = get_wikipedia_page( $matches[2], $matches[1].".wikipedia.org", false );
    print $html;

} else if(array_key_exists("uri", $_REQUEST)) {
    // Full URI to get - eg this will be a link found from musicbrainz
    $uri = rawurldecode($_REQUEST['uri']);
    $a = preg_match('#http://(.*?)/#', $uri, $matches);
    $html = get_wikipedia_page(basename($uri), $matches[1], true);
    if ($userdomain == false) {
        // Found a page, but not in the user's chosen domain
        if (array_key_exists('term', $_REQUEST)) {
            debug_print("Page was retreieved but not in user's chosen language. Checking via a search","WIKIPEDIA");
            $upage = wikipedia_find_exact($_REQUEST['term'], $domain);
            if ($upage != '') {
                $html = $upage;
            }
        }
    }
    print $html;

} else if (array_key_exists("artist", $_REQUEST)) {
    // Search for an artist
    $html = getArtistWiki(rawurldecode($_REQUEST['artist']), rawurldecode($_REQUEST['disambiguation']));
    if ($html == null) {
        print '<h3 align="center">'.get_int_text("wiki_fail", array(rawurldecode($_REQUEST['artist']))).'</h3>';
    } else {
        print $html;
    }

} else if (array_key_exists("album", $_REQUEST)) {
    // Search for an album
    debug_print("Doing album ".$_REQUEST['album'],"WIKIPEDIA");
    $html = getAlbumWiki(rawurldecode($_REQUEST['album']), rawurldecode($_REQUEST['albumartist']));
    if ($html == null) {
        print '<h3 align="center">'.get_int_text("wiki_fail", array(rawurldecode($_REQUEST['album']))).'</h3>';
    } else {
        print $html;
    }

} else if (array_key_exists("track", $_REQUEST)) {
    // Search for a track
    debug_print("Doing track ".$_REQUEST['track'],"WIKIPEDIA");
    $html = getTrackWiki(rawurldecode($_REQUEST['track']), rawurldecode($_REQUEST['trackartist']));
    if ($html == null) {
        print '<h3 align="center">'.get_int_text("wiki_fail", array(rawurldecode($_REQUEST['track']))).'</h3>';
    } else {
        print $html;
    }
}

// ==========================================================================
//
// Getting stuff from wikipedia, including language munging
//
// ==========================================================================

function wikipedia_request($url) {
    debug_print("Getting : ".$url,"WIKIPEDIA");
    if (file_exists('prefs/jsoncache/wikipedia/'.md5($url))) {
        debug_print("  Returning cached data","WIKIPEDIA");
        return file_get_contents('prefs/jsoncache/wikipedia/'.md5($url));
    } else {
        $content = url_get_contents($url);
        $s = $content['status'];
        debug_print("Response Status was ".$s, "WIKIPEDIA");
        if ($s == "200") {
            file_put_contents('prefs/jsoncache/wikipedia/'.md5($url), $content['contents']);
            return $content['contents'];
        } else {
            return null;
        }
    }
}

function get_wikipedia_page($page, $site, $langsearch) {

    // $page will be eg 'Air_(French_band)'
    // $site will be eg 'en.wikipedia.org'
    // $langsearch is true if we want to find a page in the user's language

    // $domain is the language the user wants to use - eg 'fr'
    global $domain;
    global $userdomain;

    // $request_domain is the language of the page we've been asked to get
    $r = preg_match("#(.*?)\.#", $site, $matches);
    $request_domain = $matches[1];
    $req = 'http://'.$site.'/w/api.php?action=parse&prop=text&page='.$page.'&format=xml';
    $format_domain = $request_domain;

    if ($langsearch) {

        debug_print("Request for page ".$page." from ".$site.". Domain is ".$request_domain." and user domain is ".$domain,"WIKIPEDIA");

        $user_link = ($request_domain == $domain) ? $page : null;
        $english_link = ($site == "en.wikipedia.org") ? $page : null;

        debug_print("User Link is ".$user_link." and english link is ".$english_link,"WIKIPEDIA");

        if ($domain != $request_domain) {
            debug_print("Asked for page ".$page." from site ".$site." but user wants domain ".$domain,"WIKIPEDIA");
            // Find language links for the requested page
            $langlinks = wikipedia_request("http://".$site."/w/api.php?action=query&prop=langlinks&titles=".$page."&format=xml");
            if ($langlinks !== null) {
                $langs = simplexml_load_string($langlinks);
                if ($langs->query->pages->page->langlinks) {
                    foreach($langs->query->pages->page->langlinks->ll as $ll) {
                        $l = $ll['lang'];
                        $t = dom_import_simplexml($ll)->textContent;
                        debug_print("Found language link ".$l." title ".$t,"WIKIPEDIA");
                        if ($l == $domain) {
                            $user_link = preg_replace('/ /', '_', $t);
                        }
                        if ($l == "en" && $english_link == null) {
                            $english_link = preg_replace('/ /', '_', $t);
                        }
                    }
                }
            }
        }

        debug_print("Language Scan Complete for ".$page,"WIKIPEDIA");
        debug_print("User Link is ".$user_link." and english link is ".$english_link,"WIKIPEDIA");

        if ($user_link !== null) {
            $req = 'http://'.$domain.'.wikipedia.org/w/api.php?action=parse&prop=text&page='.$user_link.'&format=xml';
            $format_domain = $domain;
            $userdomain = true;
        } else if ($english_link !== null) {
            $req = 'http://en.wikipedia.org/w/api.php?action=parse&prop=text&page='.$english_link.'&format=xml';
            $format_domain = "en";
        }

    }

    $xml = wikipedia_request($req);
    if ($xml !== null) {
        $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        $html = $info->parse->text;
        if (preg_match( '/REDIRECT <a href="\/wiki\/(.*?)"/', $html, $matches )) {
            $xml = wikipedia_request('http://'.$format_domain.'.wikipedia.org/w/api.php?action=parse&prop=text&page='.$matches[1].'&format=xml');
            $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
            $html = $info->parse->text;
        }
        return format_wikipedia_page($html, $format_domain);
    } else {
        return "";
    }

}

function format_wikipedia_page($html, $domain) {
    // Remove unwanted edit links:
    $html = preg_replace('/<span class="editsection">.*?<\/span>/', '', $html);
    //<a rel="nofollow" class="external text" href="http://www.jamaicanrecordings.com/jr_pages/005_aggrovators.htm">
    $html = preg_replace( '/(<a .*? href="http:\/\/.*?")/', '$1 target="_blank"', $html );
    //<a class="external text" href="//en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=render_collection&amp;colltitle=Book:Deep_Purple&amp;writer=rl">Download PDF</a>
    $html = preg_replace( '/(<a .*? href=".*?Special\:Book.*?")/', '$1 target="_blank"', $html );
    //<a href="/w/index.php?title=J%C3%B6rg_Schwenke&amp;action=edit&amp;redlink=1" class="new" title="JÃ¶rg Schwenke (page does not exist)">JÃ¶rg Schwenke</a>
    $html = preg_replace( '/<a href="\/w\/.*?">(.*?)<\/a>/', '$1', $html );

    // Reformat wikimedia links so they go to our AJAX query : <a href="/wiki/File:Billbongo.jpg"
    // Note that in non-english languages File: may be in that language. This regexp works for latin alphabets
    // but not for non-european languages with UTF-8 word characters - \w doesn't match these and using the u modifier
    // makes no difference
    $html = preg_replace_callback(
        '/<a href="(.*?\/wiki)\/(\w+:.*?)" class="image".*?>/',
        function($matches) use ($domain) {
            if ($matches[1] == '//commons.wikimedia.org/wiki/') {
                return '<a href="#" name="commons.wikimedia.org/'.htmlspecialchars($matches[2], ENT_QUOTES).'" class="infoclick clickwikimedia">';
            } else {
                return '<a href="#" name="'.$domain.'.wikipedia.org/'.htmlspecialchars($matches[2], ENT_QUOTES).'" class="infoclick clickwikimedia">';
            }
        },
        $html
    );

    //Redirect intra-wikipedia links so they come back to us and we can parse them
    $html = preg_replace_callback(
        '/<a href="\/wiki\/(.*?)"/',
        function($matches) use ($domain) {
            return '<a href="#" name="'.$domain.'/'.htmlspecialchars($matches[1], ENT_QUOTES).'" class="infoclick clickwikilink"';
        },
        $html
    );

    // Remove inline color styles on elements
    $html = preg_replace( '/(style=.*?)background.*?(\"|\;)/', '$1$2', $html );
    // Sometimes tables seem to have 2 background styles applied ??
    $html = preg_replace( '/(style=.*?)background.*?(\"|\;)/', '$1$2', $html );
    $html = preg_replace( '/(style=.*?)color.*?(\"|\;)/', '$1$2', $html );
    // These bits are a pain in the arse
    $html = preg_replace('/<li class="nv-.*?<\/li>/', '', $html);
    return $html;
}

// ==========================================================================
//
// Utility Functions
//
// ==========================================================================

function prepare_string($searchstring) {
    // Escape naughty characters
    $searchstring = preg_replace( '/(\(|\)|\^|\$|\\\\|\/)/', '\\\\$1', $searchstring );
    return $searchstring;
}

function wikipedia_find_exact($searchfor, $domain) {

    $xml = wikipedia_request('http://'.$domain.'.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($searchfor) . '&srprop=score&format=xml');
    $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    $page = null;

    // This is international, so we only look for an exact match (we can't possibly translate every possibility that's in artist_search, etc)
    foreach ($info->query->search->p as $id) {
        $searchstring = $id['title'];
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', $searchfor)) {
            $page = $id['title'];
            break;
        }
    }

    if ($page == null) {
        return '';
    } else {
        return get_wikipedia_page(preg_replace('/ /', '_', $page), $domain.".wikipedia.org", false);
    }

}

function find_dismbiguation_page($page) {

    $searchfor = $page.' (disambiguation)';
    debug_print("Searching Wikipedia for ".$searchfor, "WIKIPEDIA");
    $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($searchfor) . '&srprop=score&format=xml');
    $results = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

    foreach ($results->query->search->p as $id) {
        if ($id['title'] == $searchfor) {
            debug_print("returning disambiguation page for ".$page,"WIKIPEDIA");
            return get_wikipedia_page(preg_replace('/ /', '_', $id['title']), "en.wikipedia.org", true);
        }
    }

    return '';
}

function wikipedia_get_list_of_suggestions($term) {

    global $domain;
    debug_print("Getting list of suggestions for ".$term." from ".$domain.".wikipedia.org", "WIKIPEDIA");
    $xml = wikipedia_request('http://'.$domain.'.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($term) . '&srprop=score&format=xml');
    if ($xml != "") {
        $xml = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

        if (count($xml->query->search->p) == 0) {
            return null;
        }
        $html = '<h3>'.get_int_text("wiki_suggest", array($term)).'</h3>';
        $html = $html . '<h3>'.get_int_text("wiki_suggest2").'</h3>';
        $html = $html . "<ul>";
        foreach ($xml->query->search->p as $id) {
            $link = preg_replace('/\s/', '_', $id['title']);
            $html = $html . '<li><a href="#" name="'.$domain.'/'.htmlspecialchars($link, ENT_QUOTES).'" class="infoclick clickwikilink">'.$id['title'].'</a></li>';
        }
        $html = $html . "</ul>";
        return $html;
    } else {
        return "";
    }

}


// ==========================================================================
//
// Artist Search
//
// ==========================================================================


function getArtistWiki($artist_name, $disambig) {

    global $domain;

    // First, try a search and exact match in the user's chosen language.
    // This is to catch the case where a page exists on that user's wikipedia
    // domain and it has no language links to the en site
    if ($domain != "en") {
        $h = wikipedia_find_exact($artist_name, $domain);
        if ($h != '') {
            return $h;
        }
    }

    // Now try a search on the english site. We can be more wide-ranging in this search
    // we do this in English because (a) it has the most stuff and (b) I can speak it.
    // We can find translation links later.
    $h = wikipedia_artist_search($artist_name, $disambig);
    if ($h != '') {
        return $h;
    }

    // No results returned. If there's an '&' or 'and' or '+' in the name - such as 'Fruitbat & Umbrella'
    // try querying for 'Fruitbat' and 'Umbrella' separately and if there are any results, display them all
    $artist = preg_replace('/ and /', ' & ', $artist_name);
    $artist = preg_replace('/\+/', '&', $artist);
    if (preg_match('/ & /', $artist) > 0) {
        $alist = explode(' & ', $artist);
        $jhtml = '';
        foreach ($alist as $artistname) {
            $jhtml = $jhtml .  wikipedia_artist_search($artistname, "");
        }
        if ($jhtml != '') {
            return $jhtml;
        }
    } elseif (preg_match('/,/', $artist) > 0) {
        $alist = explode(',', $artist);
        $jhtml = '';
        foreach ($alist as $artistname) {
            $jhtml = $jhtml .  wikipedia_artist_search($artistname, "");
        }
        if ($hjtml != '') {
            return $jhtml;
        }
    }

    $h = find_dismbiguation_page($artist_name);
    if ($h != '') {
        return $h;
    }

    return wikipedia_get_list_of_suggestions($artist_name);
}

function  wikipedia_artist_search($artist, $disambig) {

    $page = null;
    if ($disambig != "") {
        $searchfor = $artist.' ('.$disambig.')';
        debug_print("Searching Wikipedia for ".$searchfor, "WIKIPEDIA ARTIST");
        $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($searchfor) . '&srprop=score&format=xml');
        $artistinfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

        // First look for exact match
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
    }

    if ($page == null) {
        debug_print("Searching Wikipedia for ".$artist, "WIKIPEDIA ARTIST");
        $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($artist) . '&srprop=score&format=xml');
        $artist2info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        foreach ($artist2info->query->search->p as $id) {

            $searchstring = $id['title'];
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $artist)) {
                $page = $id['title'];
                break;
            }

            $poss = array();
            if (preg_match('/\(.*?band\)|\(.*?musician\)|\(.*?singer\)/i', $id['title'])) {
                array_push($poss, $id['title']);
            }
            if (count($poss) == 1) {
                $page = array_shift($poss);
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
        return '';
    }

    debug_print("Artist search found page ".$page,"WIKIPEDIA ARTIST");
    return get_wikipedia_page(preg_replace('/ /', '_', $page), "en.wikipedia.org", true);

}

// ==========================================================================
//
// Album Search
//
// ==========================================================================


function getAlbumWiki($album_name, $artist_name) {

    global $domain;
    // First, try a search and exact match in the user's chosen language.
    // This is to catch the case where a page exists on that user's wikipedia
    // domain and it has no language links to the en site
    if ($domain != "en") {
        $h = wikipedia_find_exact($album_name, $domain);
        if ($h != '') {
            return $h;
        }
    }

    // Now try a search on the english site. We can be more wide-ranging in this search
    // we do this in English because (a) it has the most stuff and (b) I can speak it.
    // We can find translation links later.
    $h = wikipedia_album_search($album_name, $artist_name);
    if ($h != '') {
        return $h;
    }

    $h = find_dismbiguation_page($album_name);
    if ($h != '') {
        return $h;
    }

    return wikipedia_get_list_of_suggestions($album_name);

}

function wikipedia_album_search($album, $artist) {

    $album = munge_album_name($album);
    debug_print("Searching Wikipedia for ".$album." (album)", "WIKIPEDIA ALBUM");
    $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($album." (album)") . '&srprop=score&format=xml');
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
        debug_print("Searching Wikipedia for ".$album, "WIKIPEDIA ALBUM");
        $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($album) . '&srprop=score&format=xml');
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
        return null;
    }
    debug_print("Album search found page ".$page,"WIKIPEDIA ALBUM");
    return get_wikipedia_page(preg_replace('/ /', '_', $page), "en.wikipedia.org", true);

}

// ==========================================================================
//
// Track Search
//
// ==========================================================================


function getTrackWiki($track_name, $artist_name) {

    global $domain;
    // First, try a search and exact match in the user's chosen language.
    // This is to catch the case where a page exists on that user's wikipedia
    // domain and it has no language links to the en site
    if ($domain != "en") {
        $h = wikipedia_find_exact($track_name, $domain);
        if ($h != '') {
            return $h;
        }
    }

    // Now try a search on the english site. We can be more wide-ranging in this search
    // we do this in English because (a) it has the most stuff and (b) I can speak it.
    // We can find translation links later.
    $h = wikipedia_track_search($track_name, $artist_name);
    if ($h != '') {
        return $h;
    }

    $h = find_dismbiguation_page($track_name);
    if ($h != '') {
        return $h;
    }

    return wikipedia_get_list_of_suggestions($track_name);
}

function wikipedia_track_search($track, $trackartist) {

    debug_print("Searching Wikipedia for ".$track." (song) by ".$trackartist, "WIKIPEDIA TRACK");
    $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($track." (song)") . '&srprop=score&format=xml');
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
        debug_print("Searching Wikipedia for ".$track, "WIKIPEDIA TRACK");
        $xml = wikipedia_request('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($track) . '&srprop=score&format=xml');
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
        return null;
    }

    debug_print("Track search found page ".$page,"WIKIPEDIA TRACK");
    return get_wikipedia_page(preg_replace('/ /', '_', $page), "en.wikipedia.org", true);

}


// function get_wikipedia_mobile_page($page, $domain="en.wikipedia.org") {

//     debug_print("Getting mobile page ".$page." from ".$domain,"WIKIPEDIA");
//     $content = url_get_contents('http://'.$domain.'/w/api.php?action=mobileview&sections=all&prop=text&page=' . rawurlencode($page) . '&format=xml');
//     $xml = $content['contents'];
//     $html = "";
//     if ($content['status'] == "200") {
//         $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
//         foreach($info->mobileview->sections->section as $section) {
//             $html .= dom_import_simplexml($section)->textContent;
//         }
//     }
//     return $html;

// }


?>