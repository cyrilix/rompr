<?php

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
    }

    public function getName() {
        return $this->name;
    }

    public function getTerminatedName() {
        return $this->name."/";
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

    public function createHTML($prefix, $output) {
        global $FILE;
        global $DIRECTORY;
        global $count;
        global $divtype;

        if ($this->type == $DIRECTORY) {
            if ($this->parnt != null) {
                $output->writeLine('<div class="dirname">');
                $output->writeLine('<table class="filetable">');
                $output->writeLine('<tr name="dir'.$prefix.$count.'" class="draggable nottweaked dir" onclick="trackSelect(event, this)" ondblclick="playlist.addtrack(\''.htmlentities(rawurlencode($this->getPath())).'\')"><td width="20px">');
                $output->writeLine('<a href="#" onclick="doMenu(event, \'dir'.$prefix.$count.'\');" name="dir'.$prefix.$count.'"><img src="images/toggle-closed.png"></a>');
                $output->writeLine('</td><td width="20px">');
                $output->writeLine('<img src="images/folder.png" height="16px">');
                $output->writeLine('</td><td>');
                $output->writeLine(basename($this->name));
                $output->writeLine('</td></tr></table>');
                $output->writeLine("</div>\n");
                $output->writeLine('<div class="filedropmenu" name="dir'.$prefix.$count.'">');
                $count++;
            }
            foreach ($this->children as $obj) {
                $obj->createHTML($prefix, $output);
            }
            if ($this->parnt != null) {
                $output->writeLine("</div>\n");
            }
        } else {
            $output->writeLine('<div class="filemenu"><table class="filetable">');
            $output->writeLine('<tr class="draggable nottweaked" ondblclick="playlist.addtrack(\''.htmlentities(rawurlencode($this->getPath())).'\')" onclick="trackSelect(event, this)"><td></td><td width="20px">');
            $output->writeLine('<img src="images/audio-x-generic.png" height="16px">');
            $output->writeLine('</td><td>');
            $output->writeLine($this->name);
            $output->writeLine('</td></tr>');
            $output->writeLine("</table></div>\n");
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
        $dir = dirname($line)."/";

        while ($this->current_dir->getTerminatedName() != substr($dir, 0, strlen($this->current_dir->getTerminatedName())) &&
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
    global $is_connected;

    $tree = new filetree;
    $parts = true;
    if ($is_connected) {
        fputs($connection, $command."\n");
        while(!feof($connection) && $parts) {
            $parts = getline($connection);
            if (is_array($parts) && $parts[0] == "file") {
                $tree->newline($parts[1]);
            }
        }
    }
    //$tree->dump();
    return $tree;
}

?>
