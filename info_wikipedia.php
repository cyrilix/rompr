<?php
include ("functions.php");
if(array_key_exists("wiki", $_REQUEST)) {
    $html = get_wikipedia_page( $_REQUEST['wiki'] );
    print wikipedia_bio_header('Wikipedia : ', rawurldecode($_REQUEST['wiki']));
    print format_wikipedia_page($html);
} else {
    $html = getArtistWiki(rawurldecode($_REQUEST['artist']));
    if ($html == null) {
        print wikipedia_bio_header("Wikipedia : ", rawurldecode($_REQUEST['artist'])).'<h3 align="center">Wikipedia could not find anything related to &quot;'.rawurldecode($_REQUEST['artist']).'&quot;</h3>';
    } else {
        print $html;
    }
}

function prepare_string($searchstring) {
    // Escape naughty characters
    $searchstring = preg_replace( '/(\(|\)|\^|\$|\\\\|\/)/', '\\\\$1', $searchstring );        
    return $searchstring;
}

function wikipedia_search($term) {

    // Try to find a match for the artist name on Wikipedia
    //  This is more involved than it sounds, since ID3 tags don't always match up with what's on Wikipedia
    //  So we look for an exact match, then we try playing around with it a bit
    //error_log( 'Wikipedia - Searching for ' . $term );
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($term) . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $artistinfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);

    // First look for exact match
    foreach ($artistinfo->query->search->p as $id) {
        $searchstring = $id['title'];
        //error_log( 'Checking ' . $searchstring . ' against ' . $term);
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term)) {
            return $id['title'];
        }
    }

    // Now try various combinations of modified strings to see if we get anything
    foreach ($artistinfo->query->search->p as $id) {
        $searchstring = $id['title'];
        //error_log( 'Checking ' . $searchstring . ' against The ' . $term);
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', "The " . $term)) {
            return $id['title'];
        }
        $searchstring = $id['title'];
        //error_log( 'Checking The ' . $searchstring . ' against ' . $term);
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*The ' . $searchstring . '\s*$/i', $term)) {
            return $id['title'];
        }
    
        if (preg_match('/&/', $id['title'])) {
            $searchstring = $id['title'];
            $searchstring = preg_replace( '/&/', 'and', $searchstring );
            //error_log( 'Checking ' . $searchstring . ' against ' . $term);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term)) {
                return $id['title'];
            }
        }    

        if (preg_match('/and/', $id['title'])) {
            $searchstring = $id['title'];
            $searchstring = preg_replace( '/and/', '&', $searchstring );
            //error_log( 'Checking ' . $searchstring . ' against ' . $term);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term)) {
                return $id['title'];
            }
        }    
    
        // Any '.'? Let's remove them (both ways round)
        if (preg_match('/\./', $id['title'])) {
            $searchstring = $id['title'];
            $searchstring = preg_replace( '/\./', '', $searchstring );
            //error_log( 'Checking ' . $searchstring . ' against ' . $term);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term)) {
                return $id['title'];
            }
        }
        if (preg_match('/\./', $term)) {
            $searchstring = $id['title'];
            $t = preg_replace( '/\./', '', $term );
            //error_log( 'Checking ' . $searchstring . ' against ' . $term);
            $searchstring = prepare_string($searchstring);
            if (preg_match('/^\s*' . $searchstring . '\s*$/i', $t)) {
                return $id['title'];
            }
        }
    
        // Words for numbers, numbers for words.
        $numbers = array('/1/','/2/','/3/','/4/','/5/','/6/','/7/','/8/','/9/');
        $words = array("one", "two", "three", "four", "five", "six", "seven", "eight", "nine");

        $searchstring = $id['title'];
        $searchstring = preg_replace( $numbers, $words, $searchstring);
        //error_log( 'Checking ' . $searchstring . ' against ' . $term);
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term) ||
            preg_match('/^\s*' . $searchstring . '\s*$/i', "The ".$term)) {
            return $id['title'];
        }

        $numbers = array('1','2','3','4','5','6','7','8','9');
        $words = array("/one/", "/two/", "/three/", "/four/", "/five/", "/six/", "/seven/", "/eight/", "/nine/");
        $searchstring = $id['title'];
        $searchstring = preg_replace( $words, $numbers, $searchstring);
        //error_log( 'Checking ' . $searchstring . ' against ' . $term);
        $searchstring = prepare_string($searchstring);
        if (preg_match('/^\s*' . $searchstring . '\s*$/i', $term) ||
            preg_match('/^\s*' . $searchstring . '\s*$/i', "The ".$term)) {
            return $id['title'];
        }

    }    
        
    return null;
}

function wikipedia_last_ditch_attempt($term) {

    //error_log( 'Searching for ' . $term );
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($term) . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $artistinfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    //Does one of the link maybe contain (band)?
    foreach ($artistinfo->query->search->p as $id) {
        if (preg_match('/\(band\)/i', $id['title'])) {
//            error_log( 'Found One that contains (band)' );
            return $id['title'];
        }
    }

    //Last ditch effort - is there a disambiguation page?
    foreach ($artistinfo->query->search->p as $id) {
        if (preg_match('/\(disambiguation\)/i', $id['title'])) {
//            error_log( 'Found A Disambiguation Page' );
            return $id['title'];
        }
    }

    return null;

}

function wikipedia_get_list_of_suggestions($term) {

    //error_log( 'Searching for ' . $term );
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . rawurlencode($term) . '&srprop=score&format=xml');
    $xml = $content['contents'];
    $artistinfo = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    
    if (count($artistinfo->query->search->p) == 0) {
        return null;
    }
    
    $html = '<h3>Wikipedia was unable to find any pages matching this artist</h3>';
    $html = $html . "<h3>Here are some suggestions it came up with</h3>";
    $html = $html . "<ul>";
    foreach ($artistinfo->query->search->p as $id) {
        $link = preg_replace('/\s/', '_', $id['title']);
        // $html = $html . '<li><a href="#" onclick="doCommand(\'infopane\', \'info_wikipedia.php\', \'wiki='.$link.'\')">'.$id['title'].'</a></li>';
        $html = $html . '<li><a href="#" onclick="browser.getWiki(\''.$link.'\')">'.$id['title'].'</a></li>';
    }
    return wikipedia_bio_header('Wikipedia : ', $term) . $html;
    
}
    
function get_wikipedia_artistinfo($artist) {
 
    $page = wikipedia_search($artist);
    if ($page == null) {
        // No results returned. If there's an '&' or 'and' or '+' in the name - such as 'Fruitbat & Umbrella'
        // try querying for 'Fruitbat' and 'Umbrella' separately and if there are any results, display them all
//        error_log( 'Page was null' );
        $artist = preg_replace('/and/', '&', $artist);
        $artist = preg_replace('/\+/', '&', $artist);
        if (preg_match('/ & /', $artist) > 0) {
            $alist = explode(' & ', $artist);
            $jhtml = '';
            foreach ($alist as $artistname) {
                $jhtml = $jhtml . get_wikipedia_artistinfo($artistname);
           }
           return $jhtml;
        }
    }
    
    if ($page == null) {
        $page = wikipedia_last_ditch_attempt($artist);
    }
    
    if ($page == null) {
        $page = wikipedia_get_list_of_suggestions($artist);
        if ($page != null) {
            return $page;
        }
    }
    
    if ($page == null) {
        //error_log( 'Wikipedia My Arse!' );
        return null;
    }
    $html = get_wikipedia_page($page);
    $html = format_wikipedia_page($html);
    $html = wikipedia_bio_header('Biography : ', $artist) . $html . "\n";
    return $html;

}

function getArtistWiki($artist_name) {
    return get_wikipedia_artistinfo($artist_name);
}

function get_wikipedia_page($page) {
    
    $content = url_get_contents('http://en.wikipedia.org/w/api.php?action=parse&prop=text&page=' . rawurlencode($page) . '&format=xml');
    $xml = $content['contents'];
    $info = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    $html = $info->parse->text;
    if (preg_match( '/REDIRECT <a href="\/wiki\/(.*?)"/', $html, $matches )) {
        $html = get_wikipedia_page( $matches[1] );
    }
    return $html;

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
    $html = preg_replace( '/<a href="\/wiki\/(File:.*?)"/', '<a href="#" onclick="getWikimedia(\'$1\')"', $html );
//Redirect intra-wikipedia links so they come back to us and we can parse them
    $html = preg_replace( '/<a href="\/wiki\/(.*?)"/', '<a href="#" onclick="browser.getWiki(\'$1\')"', $html );
    return $html;
}

function wikipedia_bio_header($prefix, $artistname) {
    
    $artistname = preg_replace( '/_/', ' ', $artistname );
    
    $html = '<div id="infosection">' .
            '<table width="100%"><tr><td width="80%">' .
            '<h2>' . $prefix . $artistname . '</h2>' .
            '</td><td align="right">' .
            '<a href="http://en.wikipedia.org/wiki/' . $artistname . '" target="_blank">' .
            '<img src="images/Wikipedia-logo.png">' .
            '</a>' .
            '</td></tr></table>' .
            '</div>';
            
    return $html;
    
}

?>