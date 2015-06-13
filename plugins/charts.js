var charts = function() {

	var cha = null;
	var holders = new Array();

	function putItems(holder, data, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center">'+title+'</th></tr>';
		html = html + '<tr>';
		for (var i in data[0]) {
			if (i != 'uri') {
				html = html + '<td><b>'+language.gettext(i)+'</b></td>';
			}
		}
		var maxplays = data[0].soundcloud_plays;
		debug.log("CHARTS","Max plays for",title,"is",maxplays);
		html = html + '</tr>';
		for (var i in data) {
			if (data[i].uri) {
				if (prefs.player_backend == "mpd" && data[i].uri.match(/soundcloud:/)) {
					html = html + '<tr class="infoclick draggable clickable clickcue backhi" name="'+encodeURIComponent(data[i].uri)+'">';
				} else {
					html = html + '<tr class="infoclick draggable clickable clicktrack backhi" name="'+encodeURIComponent(data[i].uri)+'">';
				}
			} else {
				html = html + '<tr>';
			}
			var n = 0;
			for (var j in data[i]) {
				if (j != "uri") {
					html = html + '<td>'+data[i][j]+'</td>';
				}
				n++;
			}
			html = html + '</tr>';

			var percent = (data[i].soundcloud_plays/maxplays)*100;
			html = html + '<tr style="height:4px"><td colspan="'+n+'" style="background:linear-gradient(to right, '+getrgbs(percent)+'"></td></tr>';
			html = html + '<tr style="height:0.75em"><td colspan="'+n+'"></td></tr>';

		}
		html = html + '</table>';
		holder.html(html);
	}

	return {

		open: function() {

        	if (cha == null) {
	        	cha = browser.registerExtraPlugin("cha", language.gettext("label_charts"), charts);
	        	if (prefs.apache_backend != 'sql') {
		            $("#chafoldup").append('<h3 align="center">'+language.gettext("label_nosql")+'</h3>');
		            $("#chafoldup").append('<h3 align="center"><a href="http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>');
		            cha.slideToggle('fast');
		            return;
	        	}

			    $("#chafoldup").append('<div class="noselection fullwidth masonified" id="chamunger"></div>');
	            $.ajax({
	            	url: 'backends/sql/userRatings.php',
	            	type: "POST",
	            	data: {action: 'getcharts'},
	            	dataType: 'json',
	            	success: function(data) {
            			setDraggable('chafoldup');
	            		charts.doMainLayout(data);
	            	},
	            	error: function() {
	            		infobar.notify(infobar.ERROR, "Failed to get Charts list");
	            		cha.slideToggle('fast');
	            	}
	            });
	        } else {
	        	browser.goToPlugin("cha");
	        }

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
		}

	}

}();

pluginManager.addPlugin(language.gettext("label_charts"), charts.open, null);
