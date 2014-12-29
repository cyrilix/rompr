
<div class="containerbox padright">
<?php
print '<h3>'.get_int_text("label_searchfor").'</h3>';
?>
</div>
<div class="containerbox padright">
<?php
print '<i>'.get_int_text("label_multiterms").'</i>';
?>
    </div>
<?php
foreach ($sterms as $label => $term) {
    print '<div class="containerbox padright dropdown-container">';
	print '<div class="fixed searchlabel"><span class="slt"><b>'.get_int_text($label).'</b></span></div>';
    print '<div class="expand"><input class="searchterm enter" name="'.$term.'" type="text" /></div>';
    print '</div>';
}

if ($prefs['apache_backend'] == "sql") {
?>
<div class="containerbox padright dropdown-container combobox">
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
