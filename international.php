<?php

$languages = array();
$langnames = array();
// Always load English, as this will be used for defaults when the
// translations don't have anything.
include ('international/en.php');
$translations = $languages['en'];

$browser_language = get_browser_language();
$interface_language = array_key_exists("language", $prefs) ? $prefs["language"] : $browser_language;
debug_print("Interface language is ".$interface_language,"INTERNATIONAL");

if ($interface_language != "en") {
	if (file_exists('international/'.$interface_language.'.php')) {
		debug_print("Using translation ".$interface_language,"INTERNATIONAL");
		include ('international/'.$interface_language.'.php');
		$translations = array_merge($languages['en'], $languages[$interface_language]);
	} else {
		debug_print("Translation ".$interface_language." does not exist","INTERNATIONAL");
		$interface_language = "en";
	}
}

function get_int_text($key, $sub = null) {
	global $translations;
	if (array_key_exists($key, $translations)) {
		if (is_array($sub)) {
			return htmlspecialchars(vsprintf($translations[$key], $sub), ENT_QUOTES);
		} else {
			return htmlspecialchars($translations[$key], ENT_QUOTES);
		}
	} else {
		debug_print("ERROR! Translation key ".$key." not found!", "INTERNATIONAL");
		return "UNKNOWN KEY";
	}
}

?>