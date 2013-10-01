<?php

class mpdlistthing {

    public function __construct($name, $fullpath) {
        $this->children = array();
        $this->name = $name;
        $this->fullpath = $fullpath;
        $this->protocol = "";
    }

    public function addpath($path, $fullpath) {

        $len = (strpos($path, "/") === false) ? strlen($path) : strpos($path, "/");
        $firstdir = substr($path, 0, $len);

        if (!array_key_exists($firstdir, $this->children)) {
            $this->children[$firstdir] = new mpdlistthing($firstdir, $fullpath);
        }
        if (strpos($path, "/") != false) {
            $this->children[$firstdir]->addpath(substr($path, strpos($path, "/")+1, strlen($path)), $fullpath);
        }
    }

    public function setprotocol($p) {
        $this->protocol = $p;
    }

    public function getXML($prefix, $output, $protocol = "") {
        global $count;
        global $dirpath;
        if ($this->name != "/") {
            if (count($this->children) > 0) {
                // This must be a directory if it has children
                $dirpath = $dirpath.$this->name."/";
                $output->writeLine("<item>\n");
                $output->writeLine(xmlnode('type', 'directory'));
                $output->writeLine(xmlnode('id', $prefix.'dir'.$count));
                $output->writeLine(xmlnode('name', $this->name));
                // We're using 'artists' as a wrapper, just because it makes it easier as that's what the albums list uses
                $output->writeLine("<artists>\n");
                $count++;
            } else {
                $output->writeLine("<item>\n");
                $output->writeLine(xmlnode('type', 'file'));
                $output->writeLine(xmlnode('url', rawurlencode($protocol.$this->fullpath)));
                $output->writeLine(xmlnode('name', $this->name));
                $output->writeLine("</item>\n");
            }
        } else {
            $protocol = $this->protocol;
            $dirpath = "";
        }
        foreach($this->children as $thing) {
            $thing->getXML($prefix, $output, $protocol);
        }
        if (count($this->children) > 0 && $this->name != "/") {
            $output->writeLine("</artists>\n</item>\n");
            $dirpath = dirname($dirpath);
            if ($dirpath == ".") {
                $dirpath = "";
            }
        }
    }
}

function doFileHTML($item) {
    if ($item->type == 'directory') {
        print '<div class="clickable clickalbum draggable containerbox menuitem" name="'.$item->id.'">';
        print '<div class="mh fixed"><img src="newimages/toggle-closed-new.png" class="menu fixed" name="'.$item->id.'"></div>';
        print '<div class="fixed playlisticon"><img width="16px" src="newimages/folder.png" /></div>';
        print '<div class="expand">'.$item->name.'</div>';
        print '</div>';
        print '<div id="'.$item->id.'" class="dropmenu notfilled"></div>';
    } else {
        print '<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.$item->url.'">';
        print '<div class="playlisticon fixed"><img height="16px" src="newimages/audio-x-generic.png" /></div>';
        print '<div class="expand">'.$item->name.'</div>';
        print '</div>';
    }
}


function doFileList($command) {

    global $connection;
    global $is_connected;

    $tree = new mpdlistthing("/", "/");
    $parts = true;
    if ($is_connected) {
        fputs($connection, $command."\n");
        while(!feof($connection) && $parts) {
            $parts = getline($connection);
            if (is_array($parts) && $parts[0] == "file") {
                if (substr($parts[1], 0, 7) == "file://") {
                    $tree->setprotocol("file:///");
                    $parts[1] = substr($parts[1], 8, strlen($parts[1]));
                }
                $tree->addpath(trim($parts[1]), trim($parts[1]));
            }
        }
    }
    return $tree;
}

function dumpTree($which) {
    $headers =  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'.
                '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">'.
                '<head>'.
                '<meta http-equiv="cache-control" content="max-age=0" />'.
                '<meta http-equiv="cache-control" content="no-cache" />'.
                '<meta http-equiv="expires" content="0" />'.
                '<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />'.
                '<meta http-equiv="pragma" content="no-cache" />'.
                '</head>'.
                '<body>';
    print $headers;
    $x = simplexml_load_file(getWhichXML($which));
    if ($which == 'adirroot' || $which == 'bdirroot') {
        foreach($x->artists->item as $i => $item) {
            doFileHTML($item);
        }
    } else {
        $i = findFileItem($x, $which);
        foreach($i->artists->item as $i => $item) {
            doFileHTML($item);
        }
    }
    print '</body></html>';
}


?>