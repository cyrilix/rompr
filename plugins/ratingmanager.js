var ratingManager = function() {

	var rmg = null;
	var holders = new Array();

	function putTracks(holder, tracks, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="3" align="center"><i class="icon-'+title+'-stars rating-icon-big"></i></th></tr>';
		for (var i in tracks) {
			if (tracks[i].Uri && prefs.player_backend == "mpd" && tracks[i].Uri.match(/soundcloud:/)) {
				html += '<tr class="infoclick draggable clickable clickcue" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover';
			} else {
				html += '<tr class="infoclick draggable clickable clicktrack" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover';
			}
			if (tracks[i].Image) {
				html += '" src="'+tracks[i].Image;
			} else {
				html += ' notfound';
			}
			html += '" /></td><td class="dan"><b>'+tracks[i].Title+'</b><br><i>by</i> <b>'+tracks[i].Artist+
				'</b><br><i>on</i> <b>'+tracks[i].Album+'</b></td>';
			html += '<td align="center" style="vertical-align:middle"><i class="icon-cancel-circled playlisticon clickicon infoclick plugclickable clickremrat"></i></td></tr>';
		}
		html += '</table>';
		holder.html(html);
	}

	return {

		open: function() {

        	if (rmg == null) {
	        	rmg = browser.registerExtraPlugin("rmg", language.gettext("label_ratingmanager"), ratingManager);

	        	$("#rmgfoldup").append('<div class="containerbox padright">'+
	        		'<div class="expand"><b>'+language.gettext("label_ratingmanagertop")+'</b></div>'+
	        		'</div>');

    			$("#rmgfoldup").append('<div class="containerbox padright noselection">'+
        			'<div class="expand">'+
            		'<input class="enter inbrowser clearbox" name="filterinput" type="text" />'+
        			'</div>'+
					'<button class="fixed" onclick="ratingManager.filter()">'+language.gettext("button_search")+'</button>'+
    				'</div>');
    			
			    $("#rmgfoldup").append('<div class="noselection fullwidth masonified" id="ratmunger"></div>');
			    $('[name="filterinput"]').click(function(ev){
		            ev.preventDefault();
		            ev.stopPropagation();
		            var position = getPosition(ev);
		            var elemright = $('[name="filterinput"]').width() + $('[name="filterinput"]').offset().left;
		            if (position.x > elemright - 24) {
		            	$('[name="filterinput"]').val("");
		            	ratingManager.filter();
		            }
			    });
			    $('[name="filterinput"]').hover(makeHoverWork);
			    $('[name="filterinput"]').mousemove(makeHoverWork);
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
				holders[i].acceptDroppedTracks({
					ondrop: ratingManager.dropped
				});
			}
            rmg.slideToggle('fast', function() {
	            $("#ratmunger").masonry({
	            	itemSelector: '.tagholder',
	            	gutter: 0
	            });
	        	browser.goToPlugin("rmg");
	            browser.rePoint();
	            infobar.markCurrentTrack();
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
        				ratingManager.reloadRatList(rat);
        			},
        			error: function() {
        				infobar.notify(infobar.ERROR, "Failed To Remove Rating");
        			}
        		});
			}
		},

		reloadRatList: function(rat) {
	        $.ajax({
	        	url: 'backends/sql/userRatings.php',
	        	type: "POST",
	        	data: {action: 'ratlist'},
	        	dataType: 'json',
	        	success: function(data) {
	        		for (var i in holders) {
		        		putTracks(holders[i], data[i], i);
	        		}
	        		browser.rePoint();
		            infobar.markCurrentTrack();
	        	},
	        	error: function() {
	        		infobar.notify(infobar.ERROR, "Failed to get Rating list");
	        	}
	        });

		},

		dropped: function(event, ui) {
	        event.stopImmediatePropagation();
	        var rat = ui.attr("id");
	        rat = rat.replace(/ratman_/,'');
	        doPluginDropStuff(rat,[{ attribute: 'Rating', value: rat }],ratingManager.reloadRatList)
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

pluginManager.addPlugin(language.gettext("label_ratingmanager"), ratingManager.open, null);