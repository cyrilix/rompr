var alarm = function() {

	var inctimer = null;
	var inctime = 500;
	var incamount = null;
	var alarmtime = parseInt(prefs.alarmtime);
	var alarmtimer = null;

	return {

		startInc: function(amount) {
			debug.log("ALARM","startInc",amount);
			incamount = amount;
			inctime = 500;
			alarm.runIncrement();
		},

		runIncrement: function() {
			clearTimeout(inctimer);
			alarmtime += incamount;
			if (alarmtime > 86340) {
				alarmtime = alarmtime - 86400;
			} else if (alarmtime < 0) {
				alarmtime = 86400 + alarmtime;
			}
			alarm.setBoxes();
	        inctimer = setTimeout(alarm.runIncrement, inctime);
	        inctime -= 50;
	        if (inctime < 50) {
	        	inctime = 50;
	        }
		},

		stopInc: function() {
			debug.log("ALARM","Mouseup");
			clearTimeout(inctimer);
			prefs.save({alarmtime: alarmtime});
			alarm.setAlarm();
		},

		setBoxes: function() {
	        var mins = (alarmtime/60)%60;
	        var hours = alarmtime/3600;
	        $("#alarmhours").html(zeroPad(parseInt(hours.toString()), 2));
	        $("#alarmmins").html(zeroPad(parseInt(mins.toString()), 2));
		},

		toggle: function() {
			prefs.save({alarmon: !prefs.alarmon});
			alarm.setButton();
			alarm.setAlarm();
		},

		setButton: function() {
			var a = prefs.alarmon ? 1 : 0;
			$("#button_alarm_on").removeClass("togglebutton-0 togglebutton-1").addClass("togglebutton-"+a);
			$("#alarmclock").attr("src", "newimages/alarmclock_"+prefs.alarmon+".png");
		},

		setAlarm: function() {
			clearTimeout(alarmtimer);
			if (prefs.alarmon) {
				var d = new Date();
				var currentTime = d.getSeconds() + (d.getMinutes() * 60) + (d.getHours() * 3600);
				debug.log("ALARM", "Current Time Is",currentTime);
				if (alarmtime > currentTime) {
					var t = alarmtime - currentTime;
				} else {
					var t = 86400 - (currentTime - alarmtime);
				}
				debug.log("ALARM","Alarm will go off in",t,"seconds");
				alarmtimer = setTimeout(alarm.Ding, t*1000);
			} else {
				debug.log("ALARM","Alarm Disabled");
			}
		},

		Ding: function() {
			debug.log("ALARM","WAKEY WAKEY!");
			player.controller.play();
			infobar.notify(infobar.NOTIFY,'<img src="newimages/alarmclock_true.png" width="250px"/>');
			alarm.setAlarm();
		}

	}

}();

alarm.setBoxes();
alarm.setButton();
alarm.setAlarm();