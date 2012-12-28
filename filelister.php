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
    
    public function getHTML($prefix, $output, $protocol = "") {
        global $count;
        global $dirpath;
        if ($this->name != "/") {
            if (count($this->children) > 0) {
                // This must be a directory if it has children
                $dirpath = $dirpath.$this->name."/";
                $output->writeLine('<div class="clickable clickalbum draggable containerbox menuitem" name="dir'.$prefix.$count.'">');
                $output->writeLine('<img src="images/toggle-closed.png" class="menu fixed" name="dir'.$prefix.$count.'">');
                $output->writeLine('<div class="fixed playlisticon"><img width="16px" src="images/folder.png" /></div>');
                $output->writeLine('<div class="expand">'.rawurldecode($this->name).'</div>');
                $output->writeLine('</div>');
                $output->writeLine('<div id="dir'.$prefix.$count.'" class="dropmenu">');
                $count++;
            } else {
                $output->writeLine('<div class="clickable clicktrack ninesix draggable indent containerbox padright line" name="'.rawurlencode($protocol.$this->fullpath).'">');
                $output->writeLine('<div class="playlisticon fixed"><img height="16px" src="images/audio-x-generic.png" /></div>');
                $output->writeLine('<div class="expand">'.rawurldecode($this->name).'</div>');
                $output->writeLine('</div>');
            }
        } else {
            $protocol = $this->protocol;
            $dirpath = "";
        }
        foreach($this->children as $thing) {
            $thing->getHTML($prefix, $output, $protocol);
        }
        if (count($this->children) > 0) {
            $output->writeLine("</div>\n");
            $dirpath = dirname($dirpath);
            if ($dirpath == ".") {
                $dirpath = "";
            }
        }
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



?>