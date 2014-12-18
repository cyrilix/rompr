
<div class="containerbox padright">
<?php
print '<h3>'.get_int_text("label_searchfor").'</h3>';
?>
</div>
<div class="containerbox padright wibble">
<?php
print '<i>'.get_int_text("label_multiterms").'</i>';
?>
    </div>
<?php
foreach ($sterms as $label => $term) {
    print '<div class="containerbox padright dropdown-container">';
	print '<div class="fixed searchlabel"><span class="slt"><b>'.get_int_text($label).'</b></span></div>';
    print '<div class="expand"><input class="searchterm enter sourceform" name="'.$term.'" type="text" /></div>';
    print '</div>';
}

if ($prefs['apache_backend'] == "sql") {
?>
<div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed searchlabel"><b>'.get_int_text("label_tag").'</b></div>';
?>
<div class="expand dropdown-holder">
    <input class="searchterm enter sourceform" name="tag" type="text" style="width:100%;font-size:100%"/>
    <div class="drop-box dropshadow tagmenu" style="width:100%">
        <div class="tagmenu-contents">
        </div>
    </div>
</div>
<div class="fixed dropdown-button">
<?php
print '<img src="'.$ipath.'dropdown.png">';
?>
</div>
</div>

<div class="containerbox padright dropdown-container">
<?php
print '<div class="fixed searchlabel"><b>'.get_int_text("label_rating").'</b></div>
        <div class="expand">
        <select name="searchrating">
        <option value="5">5 '.get_int_text('stars').'</option>
        <option value="4">4 '.get_int_text('stars').'</option>
        <option value="3">3 '.get_int_text('stars').'</option>
        <option value="2">2 '.get_int_text('stars').'</option>
        <option value="1">1 '.get_int_text('star').'</option>
        <option value="" selected></option>
        </select>
       </div>
    </div>';
}
?>
