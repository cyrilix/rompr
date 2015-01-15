var ratingManager = function() {

	var rmg = null;
	var holders = new Array();

	function putTracks(holder, tracks, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center"><i class="icon-'+title+'-stars rating-icon-big"></i></th></tr>';
		for (var i in tracks) {
			html = html + '<tr class="infoclick draggable clickable clicktrack" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover';
			if (tracks[i].Image) {
				html = html + '" src="'+tracks[i].Image;
			} else {
				html = html + ' notfound';
			}
			html = html + '" /></td><td class="dan"><b>'+tracks[i].Title+'</b><br><i>by</i> <b>'+tracks[i].Artist+
				'</b><br><i>on</i> <b>'+tracks[i].Album+'</b></td>';
			html = html + '<td align="center" style="vertical-align:middle"><i class="icon-cancel-circled playlisticon clickicon infoclick plugclickable clickremrat"></i></td></tr>';
		}
		html = html + '</table>';
		holder.html(html);
	}

	function reloadRatList(rat) {
        $.ajax({
        	url: 'backends/sql/userRatings.php',
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

    			$("#rmgfoldup").append('<div class="containerbox padright noselection">'+
        			'<div class="expand">'+
            		'<input class="enter inbrowser" name="filterinput" type="text" />'+
        			'</div>'+
					'<button class="fixed" onclick="ratingManager.filter()">'+language.gettext("button_search")+'</button>'+
    				'</div>');
    			
			    $("#rmgfoldup").append('<div class="noselection fullwidth masonified" id="ratmunger"></div>');
	            $.ajax({
	            	url: 'backends/sql/userRatings.php',
	            	type: "POST",
	            	data: {action: 'ratlist'},
	            	dataType: 'json',
	            	success: function(data) {
            			setDraggable('rmgfoldup');
	            		ratingManager.doMainLayout(data);
	            	},
	            	error: function() {
	            		infobar.notify(infobar.ERROR, "Failed to get Rating list");
	            		rmg.slideToggle('fast');
	            	}
	            });
	            $('#rmgfoldup .enter').keyup(onKeyUp);
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
					hoverClass: 'highlighted'
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
		        var uri = decodeURIComponent(element.parent().parent().attr('name'));
		        debug.log("RATMANAGER","Removing Rating From",uri," current value is ",rat);
        		$.ajax({
        			url: "backends/sql/userRatings.php",
        			type: "POST",
        			data: {
        				artist: 'dummy',
        				title: 'dummy',
        				uri: uri,
        				urionly: 'true',
        				action: 'set',
        				attributes: [{attribute: "Rating", value: "0"}]
        			},
        			dataType: 'json',
        			success: function(rdata) {
        				updateCollectionDisplay(rdata);
        				reloadRatList(rat);
        			},
        			error: function() {
        				infobar.notify(infobar.ERROR, "Failed To Remove Rating");
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
	        		dontcreate: '1',
	        		action: 'set',
	        		attributes: [{ attribute: 'Rating', value: rat }]
	        	});
	        });
	        (function dotags() {
	        	var track = tracks.shift();
	        	if (track) {
	        		$.ajax({
	        			url: "backends/sql/userRatings.php",
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
		},

		filter: function() {
			var term = $('[name=filterinput]').val();
			if (term == "") {
				debug.log("RATING MANAGER","Showing Everything");
				$("#ratmunger tr").show();
			} else {
				debug.log("RATING MANAGER","Filtering on",term);
				var re = new RegExp(term, "i");
				$.each($("#ratmunger .clicktrack"), function() {
					var cont = $(this).children('.dan').html();
					if (re.test(cont)) {
						if ($(this).is(':hidden')) {
							$(this).show();
						}
					} else {
						if ($(this).is(':visible')) {
							$(this).hide();
						}
					}
				});
			}
			browser.rePoint();
		}

	}

}();

addPlugin(language.gettext("label_ratingmanager"), "ratingManager.open()");