var ratingManager = function() {

	var rmg = null;
	var holders = new Array();

	function putTracks(holder, tracks, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center"><img height="16px" src="newimages/'+title+'stars.png" /></th></tr>';
		for (var i in tracks) {
			html = html + '<tr class="infoclick draggable clickable clicktrack" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover" src="';
			if (tracks[i].Image) {
				html = html + tracks[i].Image;
			} else {
				html = html + 'newimages/album-unknown-small.png';
			}
			html = html + '" /></td><td><b>'+tracks[i].Title+'</b><br><i>by</i> <b>'+tracks[i].Artist+
				'</b><br><i>on</i> <b>'+tracks[i].Album+'</b></td>';
			html = html + '<td align="center" style="vertical-align:middle"><img class="clickicon infoclick plugclickable clickremrat" src="'+ipath+'edit-delete.png" height="12px" /></td></tr>';
		}
		html = html + '</table>';
		holder.html(html);
	}

	function reloadRatList(rat) {
        $.ajax({
        	url: 'userRatings.php',
        	type: "POST",
        	data: {action: 'ratlist'},
        	dataType: 'json',
        	success: function(data) {
        		putTracks(holders[rat], data[rat], rat);
        		browser.rePoint();
        	},
        	error: function() {
        		infobar.notify(infobar.ERROR, "Failed to get Rating list");
        	}
        });

	}

	return {

		open: function() {

        	if (rmg == null) {
	        	rmg = browser.registerExtraPlugin("rmg", language.gettext("label_ratingmanager"), ratingManager);
	        	if (prefs.apache_backend != 'sql') {
		            $("#rmgfoldup").append('<h3 align="center">'+language.gettext("label_nosql")+'</h3>');
		            $("#rmgfoldup").append('<h3 align="center"><a href="http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>');
		            rmg.slideToggle('fast');
		            return;
	        	}

	        	$("#rmgfoldup").append('<div class="containerbox padright">'+
	        		'<div class="expand"><b>'+language.gettext("label_ratingmanagertop")+'</b></div>'+
	        		'</div>');
			    $("#rmgfoldup").append('<div class="noselection fullwidth masonified" id="ratmunger"></div>');
	            $.ajax({
	            	url: 'userRatings.php',
	            	type: "POST",
	            	data: {action: 'ratlist'},
	            	dataType: 'json',
	            	success: function(data) {
	            		if (mobile != "phone") {
	            			setDraggable('rmgfoldup');
	            		}
	            		ratingManager.doMainLayout(data);
	            	},
	            	error: function() {
	            		infobar.notify(infobar.ERROR, "Failed to get Rating list");
	            		rmg.slideToggle('fast');
	            	}
	            });
	        } else {
	        	browser.goToPlugin("rmg");
	        }

		},

		doMainLayout: function(data) {
			debug.log("RATINGMANAGER","Got data",data);
			for (var i in data) {
				debug.log("RATMANAGER",i);
				holders[i] = $('<div>', {class: 'tagholder selecotron noselection', id: 'ratman_'+i}).appendTo($("#ratmunger"));
				putTracks(holders[i], data[i], i);
				holders[i].droppable({
					addClasses: false,
					drop: ratingManager.dropped,
					hoverClass: 'tagman-hover'
				});
			}
            rmg.slideToggle('fast', function() {
	            $("#ratmunger").masonry({
	            	itemSelector: '.tagholder',
	            	gutter: 0
	            });
	        	browser.goToPlugin("rmg");
	            browser.rePoint();
            });
		},

		handleClick: function(element, event) {
			if (element.hasClass('clickremrat')) {
		        var rat = element.parent().parent().parent().parent().parent().attr("id");
		        rat = rat.replace(/ratman_/,'');
		        var details = element.parent().prev().html();
		        debug.log("RATMANAGER","Removing Rating From",details," current value is ",rat);
		        var matches = details.match(/<b>(.*?)<\/b><br><i>by<\/i> <b>(.*?)<\/b><br><i>on<\/i> <b>(.*?)<\/b>/);
        		$.ajax({
        			url: "userRatings.php",
        			type: "POST",
        			data: {
        				artist: unescapeHtml(matches[2]),
        				album: unescapeHtml(matches[3]),
        				title: unescapeHtml(matches[1]),
        				action: 'set',
        				attribute: 'Rating',
        				forceupdate: "true",
        				value: "0"
        			},
        			dataType: 'json',
        			success: function(rdata) {
        				updateCollectionDisplay(rdata);
        				reloadRatList(rat);
        			},
        			error: function() {
        				infobar.notify(infobar.ERROR, "Failed To Remove Tag");
        			}
        		});
			}
		},

		dropped: function(event, ui) {
	        event.stopImmediatePropagation();
	        var tracks = new Array();
	        var rat = $(event.target).attr("id");
	        rat = rat.replace(/ratman_/,'');
	        $.each($('.selected'), function (index, element) {
	        	var uri = unescapeHtml(decodeURIComponent($(element).attr("name")));
	        	debug.log("RATMANAGER","Dragged",uri,"to",rat);
	        	tracks.push({
	        		uri: uri,
	        		artist: 'dummy',
	        		title: 'dummy',
	        		urionly: '1',
	        		action: 'set',
	        		attribute: 'Rating',
	        		value: rat
	        	});
	        });
	        (function dotags() {
	        	var track = tracks.shift();
	        	if (track) {
	        		$.ajax({
	        			url: "userRatings.php",
	        			type: "POST",
	        			data: track,
	        			dataType: 'json',
	        			success: function(rdata) {
	        				updateCollectionDisplay(rdata);
	        				dotags();
	        			},
	        			error: function() {
	        				infobar.notify(infobar.ERROR, "Failed To Set Rating");
	        				dotags();
	        			}
	        		});
	        	} else {
	        		tracks = null;
	        		reloadRatList(rat);
	        	}
	        })();

		},

		close: function() {
			rmg = null;
			holders = [];
		}

	}

}();

$("#specialplugins").append('<button onclick="ratingManager.open()">'+language.gettext("label_ratingmanager")+'</button>');