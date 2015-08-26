var charts = function() {

	var cha = null;
	var holders = new Array();

	function putItems(holder, data, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center">'+title+'</th></tr>';
		html += '<tr class="chartheader">';
		for (var i in data[0]) {
			if (i != 'uri') {
				html += '<td><b>'+language.gettext(i)+'</b></td>';
			}
		}
		var maxplays = data[0].soundcloud_plays;
		debug.log("CHARTS","Max plays for",title,"is",maxplays);
		html += '</tr>';
		for (var i in data) {
			if (data[i].uri) {
				if (prefs.player_backend == "mpd" && data[i].uri.match(/soundcloud:/)) {
					html += '<tr class="chart infoclick draggable clickable clickcue backhi" name="'+encodeURIComponent(data[i].uri)+'">';
				} else {
					html += '<tr class="chart infoclick draggable clickable clicktrack backhi" name="'+encodeURIComponent(data[i].uri)+'">';
				}
			} else {
				html += '<tr class="chart">';
			}
			var n = 0;
			for (var j in data[i]) {
				if (j != "uri") {
					html += '<td>'+data[i][j]+'</td>';
				}
				n++;
			}
			html += '</tr>';

			var percent = (data[i].soundcloud_plays/maxplays)*100;
			html += '<tr style="height:4px"><td class="chartbar" colspan="'+n+'" style="background:linear-gradient(to right, '+getrgbs(percent)+'"></td></tr>';
			html += '<tr style="height:0.75em"><td colspan="'+n+'"></td></tr>';

		}
		html += '</table>';
		holder.html(html);
	}

	function getCharts(success, failure) {
        $.ajax({
        	url: 'backends/sql/userRatings.php',
        	type: "POST",
        	data: {action: 'getcharts'},
        	dataType: 'json',
        	success: success,
        	error: failure
        });
	}

	return {

		open: function() {

        	if (cha == null) {
	        	cha = browser.registerExtraPlugin("cha", language.gettext("label_charts"), charts);
	        	getCharts(charts.firstLoad, charts.firstLoadFail);
			    $("#chafoldup").append('<div class="noselection fullwidth masonified" id="chamunger"></div>');
	        } else {
	        	browser.goToPlugin("cha");
	        }

		},

		firstLoad: function(data) {
			setDraggable('chafoldup');
    		charts.doMainLayout(data);
		},

		firstLoadFail: function(data) {
    		infobar.notify(infobar.ERROR, "Failed to get Charts list");
    		cha.slideToggle('fast');
        },

		doMainLayout: function(data) {
			debug.log("CHARTS","Got data",data);
			for (var i in data) {
				debug.log("CHARTS",i);
				holders[i] = $('<div>', {class: 'tagholder selecotron noselection', id: 'chaman_'+i}).appendTo($("#chamunger"));
				putItems(holders[i], data[i], i);
			}
            cha.slideToggle('fast', function() {
	            $("#chamunger").masonry({
	            	itemSelector: '.tagholder',
	            	gutter: 0
	            });
	        	browser.goToPlugin("cha");
	            browser.rePoint();
            });
		},

		close: function() {
			cha = null;
			holders = [];
		},

		reloadAll: function() {
			if (cha) {
				getCharts(charts.backgroundUpdate,null);
			}
		},

		backgroundUpdate: function(data) {
			for (var i in data) {
				holders[i].empty();
				putItems(holders[i],data[i],i);
			}
		}

	}

}();

pluginManager.setAction(language.gettext("label_charts"), charts.open);
charts.open();
