var alarm = function() {

	var inctimer = null;
	var inctime = 500;
	var incamount = null;
	var alarmtime = parseInt(prefs.alarmtime);
	var alarmtimer = null;
	var uservol = 100;
	var volinc = 1;
	var ramptimer = null;

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
			$("#button_alarm_ramp").attr("checked", prefs.alarmramp);
		},

		toggleRamp: function() {
			prefs.save({alarmramp: !prefs.alarmramp});
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
			if (prefs.alarmramp) {
				uservol = player.status.volume;
				volinc = uservol/60;
				player.controller.volume(0, player.controller.play);
				ramptimer = setTimeout(alarm.volRamp, 2000);
			} else {
				player.controller.play();
			}
			infobar.notify(infobar.NOTIFY,'<img src="newimages/alarmclock_true.png" width="250px"/>');
			alarm.setAlarm();
		},

		volRamp: function() {
			clearTimeout(ramptimer);
			var v = player.status.volume + volinc;
			debug.log("ALARM","Setting volume to",v);
			if (v >= uservol) {
				v = uservol;
				player.controller.volume(v,infobar.updateWindowValues);
			} else {
				player.controller.volume(v, infobar.updateWindowValues);
				ramptimer = setTimeout(alarm.volRamp, 2000);
			}
		}

	}

}();

alarm.setBoxes();
alarm.setButton();
alarm.setAlarm();