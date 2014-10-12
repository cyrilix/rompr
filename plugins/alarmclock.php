
<li>
	<table align="center">
		<tr>
<?php
			print '<td align="center"><img src="'.$ipath.'arrow-increase.png" width="42px" onmousedown="alarm.startInc(3600)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>';
?>
			<td width="2%"></td>
<?php
			print '<td align="center"><img src="'.$ipath.'arrow-increase.png" width="42px" onmousedown="alarm.startInc(60)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>';
?>
		</tr>
		<tr>
			<td align="center" class="alarmnumbers" id="alarmhours" style="color:#ffffff">12</td>
			<td align="center" width="2%" class="alarmnumbers" style="color:#ffffff">:</td>
			<td align="center" class="alarmnumbers" id="alarmmins" style="color:#ffffff">00</td>
		</tr>
		<tr>
<?php
			print '<td align="center"><img src="'.$ipath.'arrow-decrease.png" width="42px" onmousedown="alarm.startInc(-3600)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>';
?>
			<td width="2%"></td>
<?php
			print '<td align="center"><img src="'.$ipath.'arrow-decrease.png" width="42px" onmousedown="alarm.startInc(-60)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>';
?>
		</tr>
	</table>
</li>

<li>
<?php
print '<table align="center"><tr><td align="center">';
print '<div id="button_alarm_on" onclick="alarm.toggle()" class="togglebutton clickicon togglebuton-0" /></div>';
if ($prefs['player_backend'] == "mopidy") {
	// Volume ramping won't work with MPD because we can't set the volume
	// to zero if playback is stopped. Duh.
	print '</td></tr><tr><td><input type="checkbox" onclick="alarm.toggleRamp()" id="button_alarm_ramp">'.get_int_text('config_alarm_ramp').'</input>';
}
print '</td></tr></table>';
?>
</li>