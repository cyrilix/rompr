<?php
include ("vars.php");
include ("functions.php");
include ("connection.php");

$DIRECTORY = 1;
$FILE = 2;

class mpdlistthing {

    public function __construct($name, $type, $parnt, $level) {
    
        $this->parnt = $parnt;
        $this->type = $type;
        $this->name = $name;
        $this->children = array();
        $this->readpointer = 0;
        $this->level = $level;
        $this->listed = false;
        //error_log("Created new object - type ".$type." name $name");
    }
    
    public function getName() {
        return $this->name;
    }
    
    public function getPath() {
        global $DIRECTORY;
        if ($this->type == $DIRECTORY) {
            return $this->name;
        } else {
            $n = $this->parnt->getName();
            $nm = $this->name;
            if ($n != ".") {
                $nm = $n."/".$nm;
            }
            return $nm;
        }
    }
    
    public function getKind() {
        return $this->type;
    }
    
    public function addChild($type, $name) {
        $object = new mpdlistthing($name, $type, $this, $this->level+1);
        $this->children[] = $object;
        return $object;
    }
    
    public function getParent() {
        return $this->parnt;
    }
    
    public function setListed() {
        $this->listed = true;
    }
    
    public function getNextChild() {
        $next = null;
        if ($this->readpointer < count($this->children)) {
            $next = $this->children[$this->readpointer];
            $this->readpointer++;
        } else {
            $next = $this->parnt;
        }
        return $next;
    }
    
    public function createHTML() {
        global $FILE;
        global $DIRECTORY;
        global $count;
        global $divtype;
        if ($this->type == $DIRECTORY) {
            if ($this->parnt != null) {
                print '<div id="dirname">';
                print '<a href="javascript:doMenu(\'dir'.$count.'\');" class="toggle" name="dir'.$count.'">+</a>';
                print '<img src="images/folder.png" height="16px">&nbsp;&nbsp;';
                print '<a href="#" onclick="infobar.command(\'command=add&arg='.htmlentities(rawurlencode($this->getPath())).'\', playlist.repopulate)">';
                print basename($this->name);
                print "</a></div>\n";
                print '<div id="filedropmenu" name="dir'.$count.'">';
                $count++;
            }
            foreach ($this->children as $obj) {
                $obj->createHTML();
            }
            if ($this->parnt != null) {
                print "</div>\n";
            }
        } else {
            print '<div id="filemenu">';
            print '<img src="images/audio-x-generic.png" height="16px">&nbsp;&nbsp;';
            print '<a href="#" onclick="infobar.command(\'command=add&arg='.htmlentities(rawurlencode($this->getPath())).'\', playlist.repopulate)">';
            print $this->name;
            print '</a></div>';
        }
    }
}

class filetree {
    
    public function __construct() {
        global $FILE;
        global $DIRECTORY;
        $this->root = new mpdlistthing(".", $DIRECTORY, null, -1);
        $this->root->setListed();
        $this->current_dir = $this->root;
    }
    
    // Debug function
    public function dump() {
        global $DIRECTORY;
        
        $this->current_dir = $this->root;
        $object = $this->current_dir->getNextChild();
        while ($object) {
            if ($object->getKind() == $DIRECTORY) {
                $this->current_dir = $object;
            }
            if ($object->listed == false) {
                $indent = "";
                for ($i=0; $i<=$object->level; $i++) {
                    $indent = $indent."  ";
                }
                $indent = $indent . basename($object->getName());
                error_log($indent);
                $object->setListed();
            }
            $object = $this->current_dir->getNextChild();
        }
    }
    
    
    
    public function newline($line) {
    
        global $FILE;
        global $DIRECTORY;
        
        //error_log("LINE : ".$line);
    
        $file = basename($line);
        $dir = dirname($line);
        
        while ($this->current_dir->getName() != substr($dir, 0, strlen($this->current_dir->getName())) &&
                $this->current_dir != $this->root) {
            $this->current_dir = $this->current_dir->getParent();
        }

        $where_are_we = $this->current_dir->getName();
        $create_dir = dirname($line);

        if ($where_are_we != ".") {
            $create_dir = substr($create_dir, strlen($where_are_we));
        }
        $dirs_to_create = explode("/", $create_dir);
        
        foreach($dirs_to_create as $d) {
            if ($d != '' && $d !='.') {
                if ($this->current_dir->getName() == ".") {
                    $this->current_dir = $this->current_dir->addChild($DIRECTORY, $d);
                } else {
                    $this->current_dir = $this->current_dir->addChild($DIRECTORY, $this->current_dir->getName()."/".$d);
                }
            }
        }
        
        $this->current_dir->addChild($FILE, $file);        
            
    }
    
    
}

function doFileList($command) {

    global $connection;
    
    $tree = new filetree;
    $parts = true;

    fputs($connection, $command."\n");
    while(!feof($connection) && $parts) {
        $parts = getline($connection);
        if (is_array($parts) && $parts[0] == "file") {
            $tree->newline($parts[1]);
        }
    }
    
    //$tree->dump();
    return $tree;
}

$count = 1;
$tree = doFileList("list file");
$tree->root->createHTML();
close_mpd($connection);

?>