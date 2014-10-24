var charts = function() {

	var cha = null;
	var holders = new Array();

	function putItems(holder, data, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center">'+title+'</th></tr>';
		html = html + '<tr>';
		for (var i in data[0]) {
			html = html + '<td><b>'+language.gettext(i)+'</b></td>';
		}
		html = html + '</tr>';
		for (var i in data) {
			html = html + '<tr>';
			for (var j in data[i]) {
				html = html + '<td>'+data[i][j]+'</td>';
			}
		}
		html = html + '</tr></table>';
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
	            	url: 'userRatings.php',
	            	type: "POST",
	            	data: {action: 'getcharts'},
	            	dataType: 'json',
	            	success: function(data) {
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
				holders[i] = $('<div>', {class: 'tagholder noselection', id: 'chaman_'+i}).appendTo($("#chamunger"));
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

$("#specialplugins").append('<div class="fullwidth"><button onclick="charts.open()">'+language.gettext("label_charts")+'</button></div>');