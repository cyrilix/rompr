<?php
include("vars.php");
include("functions.php");

class MyXML extends SimpleXMLElement {

    public function find($xpath) {
        $tmp = $this->xpath($xpath);
        return isset($tmp[0])? $tmp[0]: null;
    }

    public function remove() {
        $dom = dom_import_simplexml($this);
        return $dom->parentNode->removeChild($dom);
    }

}

$timestamp = time();
$todelete = array();
if (file_exists('prefs/remoteImageCache.xml')) {
    $x = simplexml_load_file('prefs/remoteImageCache.xml');
    foreach($x->images->image as $i => $elem) {
    	$t = $elem->stamp;
    	if ($timestamp - $t > 2592000) {
    		// Image has not been accessed for a long time (30 days). Get rid of it.
    		$id = $elem['id'];
    		debug_print("Removing element ".$id,"IMAGECACHE");
    		array_push($todelete, $id);
    	}
    }

    $foo = new MyXML($x->asXML());
    foreach($todelete as $elem) {
        $foo->find('//images/image[@id="'.$elem.'"]')->remove();
    }
    $fp = fopen('prefs/remoteImageCache.xml', 'w');
    fwrite($fp, $foo->asXML());
    fclose($fp);
}

?>

<html></html>