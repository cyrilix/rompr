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

// In LXDE and Openbox-based desktops, set protocol handlers for xdg-open


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

exec( 'xdg-open '.$rompr.'/podcasts.php?itunes='.rawurlencode($argv[1]));
?>