<div id="horse" class="fullwidth">
<table width="100%"><tr><td align="left" style="width:17px">
<?php
print '<i onclick="togglePlaylistButtons()" title="'.get_int_text('button_playlistcontrols').'" class="icon-menu playlisticon clickicon lettuce"></i>';
?>
</td>
<td align="left" id="pltracks"></td>
<td align="right" id="pltime"></td>
<td align="right" style="width:17px">
<?php
print '<i onclick="playlist.clear()" title="'.get_int_text('button_clearplaylist').'" class="icon-trash playlisticon clickicon lettuce"></i>';
?>
</td>
</tr>
<tr><td colspan="4" align="center" id="plmode"></td></tr>
</table>
</div>
<div id="playlistbuttons" class="invisible searchbox">
<table width="90%" align="center" style="border-collapse:collapse">
<tr>
<?php
print '<td width="50%" align="right"><div class="togglecontainer"><div class="togglediv tgtl">'.get_int_text('button_random').
'</div><div class="togglebutton clickicon icon-toggle-off" id="random" onclick="player.controller.toggleRandom()"></div>'.
'</div></td>';
print '<td width="50%" align="left"><div class="togglecontainer">'.
'<div class="togglebutton clickicon icon-toggle-off" id="crossfade" onclick="player.controller.toggleCrossfade()"></div><div class="togglediv tgtr">'.
get_int_text('button_crossfade').'</div></div></td>';
print '</tr><tr>';
print '<td width="50%" align="right"><div class="togglecontainer"><div class="togglediv tgtl">'.get_int_text('button_repeat').
'</div><div class="togglebutton clickicon icon-toggle-off" id="repeat" onclick="player.controller.toggleRepeat()"></div>'.
'</div></td>';
print '<td width="50%" align="left"><div class="togglecontainer">'.
'<div class="togglebutton clickicon icon-toggle-off" id="consume" onclick="player.controller.toggleConsume()"></div><div class="togglediv tgtr">'.
get_int_text('button_consume').'</div></div></td>';
?>
</tr>
</table>
</div>
<div id="pscroller">
    <div id="sortable" class="noselection fullwidth noborder">
    </div>
</div>
