#!/usr/bin/php

<?php

// This is the URL handler for iTunes links.
// I have only tested this in Gnome 3.

// Installation
// ============

// Copy this file somewhere on the computer where you run your browser
// Make sure this file is executable
// chmod +x /path/to/this/itunes_open.php
// Make sure you have php5-curl installed
// sudo apt-get install php5-curl

// Gnome 3
// =======

// [Desktop Entry]
// Encoding=UTF-8
// Version=1.0
// Type=Application
// Terminal=false
// Exec=/path/to/this/itunes_open.php %U
// Name[en_US]=RompriTunes
// Comment[en_US]=Open iTunes podcast links in RompR                
// Name=RompriTunes
// Comment=Open iTunes podcast links in Rompr                
// Icon=/usr/share/icons/hicolor/256x256/apps/brasero.png
// Categories=Application;Network;
// MimeType=x-scheme-handler/itpc;
// Comment[en_US.utf8]=Open iTunes podcast links in RompR 

// Save the above as /usr/share/applications/rompritunes.desktop
// Edit the Exec= line so it points to wherever you put this file.
// Keep the %U on the end

// Then run
// sudo update-desktop-database


// Gnome 2 / XFCE
// ==============

// gconftool-2 -t string -s /desktop/gnome/url-handlers/itpc/command "/path/to/this/itunes_open.php %s"
// gconftool-2 -s /desktop/gnome/url-handlers/itpc/needs_terminal false -t bool
// gconftool-2 -t bool -s /desktop/gnome/url-handlers/itpc/enabled true

// (Untested)


// LXDE / OpenBox
// ===============

// In LXDE and Openbox-based desktops, Google how to set protocol handlers for xdg-open


// KDE
// ===

// ??


// Unity
// =====

// ??


// OSX
// ===

// Use RCDefaultApp http://www.rubicode.com/Software/RCDefaultApp/
// to set this file as the URL handler for itpc


// Everyone
// Modify this next line so it points to your rompr installation
// Put here the same thing you type in your web browser to open rompr
$rompr = "http://localhost/rompr";

// Don't mess with this bit
$url = $rompr.'/podcasts.php?url='.rawurlencode($argv[1]);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 45);
$result = array();
$result['contents'] = curl_exec($ch);
$result['status'] = curl_getinfo($ch,CURLINFO_HTTP_CODE);
curl_close($ch);

$desktop = getenv("DESKTOP_SESSION");

// TODO load  a special page that sets a local storage key. If it gets a reply it closes
// if it doesn't, it loads RompR

// You can mess with this bit if you know what you're doing
if ($result['status'] == '200') {
	// Stuff to do if it worked
	switch ($desktop) {
		case "gnome":
			exec( 'notify-send "Podcast added to Rompr"');
			exec( 'gnome-open '.$rompr);
			break;

		case "kde":
			exec( 'kdialog --title "Podcast added to Rompr" --passivepopup "Rompr should now open" 5' );
			exec( 'kde-open '.$rompr);
			break;

		default:
			exec( 'xdg-open '.$rompr);
			break;

	}
} else {
	// Stuff to do if it failed
	switch ($desktop) {
		case "gnome":
			exec( 'notify-send "Failed to add podcast to Rompr"');
			break;

		case "kde":
			exec( 'kdialog --title "Failed to add podcast to Rompr" --passivepopup "Sorry" 5' );
			break;

		default:
			break;

	}
}

?>

