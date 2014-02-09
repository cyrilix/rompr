
<li>
	<table align="center">
		<tr>
			<!-- <td style="overflow:hidden"><img src="newimages/padding.png" /></td> -->
			<td align="center"><img src="newimages/arrow-increase.png" width="42px" onmousedown="alarm.startInc(3600)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>
			<td width="2%"></td>
			<td align="center"><img src="newimages/arrow-increase.png" width="42px" onmousedown="alarm.startInc(60)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>
			<!-- <td style="overflow:hidden"><img src="newimages/padding.png" /></td> -->
		</tr>
		<tr>
			<!-- <td></td> -->
			<td align="center" class="alarmnumbers" id="alarmhours" style="color:#ffffff">12</td>
			<td align="center" width="2%" class="alarmnumbers" style="color:#ffffff">:</td>
			<td align="center" class="alarmnumbers" id="alarmmins" style="color:#ffffff">00</td>
			<!-- <td></td> -->
		</tr>
		<tr>
			<!-- <td></td> -->
			<td align="center"><img src="newimages/arrow-decrease.png" width="42px" onmousedown="alarm.startInc(-3600)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>
			<td width="2%"></td>
			<td align="center"><img src="newimages/arrow-decrease.png" width="42px" onmousedown="alarm.startInc(-60)" onmouseup="alarm.stopInc()" onmouseout="alarm.stopInc()" /></td>
			<!-- <td></td> -->
		</tr>
	</table>
</li>

<li>
<?php
print '<table align="center"><tr><td>';
print '<div id="button_alarm_on" onclick="alarm.toggle()" class="togglebutton clickicon togglebuton-0" /></div>';
print '</td></tr></table>';
?>
</li>