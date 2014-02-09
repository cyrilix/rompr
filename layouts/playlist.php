<div id="horse" class="fullwidth">
<table width="100%"><tr><td align="left" style="width:17px">
<?php
print '<img onclick="togglePlaylistButtons()" title="'.get_int_text('button_playlistcontrols').'" class="clickicon lettuce" height="15px" src="newimages/dropdown.png" />';
?>
</td>
<td align="left" id="pltracks"></td>
<td align="right" id="pltime"></td>
</tr>
<tr><td colspan="3" align="center" class="tiny" id="plmode"></td></tr>
</table>
</div>
<div id="playlistbuttons" class="invisible searchbox">
<table width="90%" align="center" style="border-collapse:collapse">
<tr>
<?php
print '<td width="50%" align="right"><div class="togglecontainer"><div class="togglediv tgtl">'.get_int_text('button_shuffle').
'</div><div class="togglebutton clickicon togglebutton-0 togglediv" id="random" onclick="player.controller.toggleRandom()"></div>'.
'</div></td>';
print '<td width="50%" align="left"><div class="togglecontainer">'.
'<div class="togglebutton clickicon togglebutton-0 togglediv" id="crossfade" onclick="player.controller.toggleCrossfade()"></div><div class="togglediv tgtr">'.
get_int_text('button_crossfade').'</div></div></td>';
print '</tr><tr>';
print '<td width="50%" align="right"><div class="togglecontainer"><div class="togglediv tgtl">'.get_int_text('button_repeat').
'</div><div class="togglebutton clickicon togglebutton-0 togglediv" id="repeat" onclick="player.controller.toggleRepeat()"></div>'.
'</div></td>';
print '<td width="50%" align="left"><div class="togglecontainer">'.
'<div class="togglebutton clickicon togglebutton-0 togglediv" id="consume" onclick="player.controller.toggleConsume()"></div><div class="togglediv tgtr">'.
get_int_text('button_consume').'</div></div></td>';
?>
</tr>
</table>
</div>

<div id="pscroller">
    <div id="sortable" class="noselection fullwidth">
    </div>
</div>
