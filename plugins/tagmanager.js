var tagManager = function() {

	var tmg = null;
	var holders = new Array();

	function putTracks(holder, tracks, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="2" align="center">'+title+'</th><th width="20px"><img class="clickicon infoclick plugclickable clickdeltag" src="'+ipath+'edit-delete.png" height="16px" /></th></tr>';
		for (var i in tracks) {
			html = html + '<tr class="infoclick plugclickable tablerow"><td width="40px"><img class="smallcover" src="';
			if (tracks[i].Image) {
				html = html + tracks[i].Image;
			} else {
				html = html + 'newimages/album-unknown-small.png';
			}
			html = html + '" /></td><td><b>'+tracks[i].Title+'</b><br><i>by</i> <b>'+tracks[i].Artist+
				'</b><br><i>on</i> <b>'+tracks[i].Album+'</b></td>';
			html = html + '<td align="center" style="vertical-align:middle"><img class="clickicon infoclick plugclickable clickremtag" src="'+ipath+'edit-delete.png" height="12px" /></td></tr>';
		}
		html = html + '</table>';
		holder.html(html);
	}

	function reloadTagList(tag) {
        $.ajax({
        	url: 'userRatings.php',
        	type: "POST",
        	data: {action: 'taglist'},
        	dataType: 'json',
        	success: function(data) {
        		putTracks(holders[tag], data[tag], tag);
        		browser.rePoint();
        	},
        	error: function() {
        		infobar.notify(infobar.ERROR, "Failed to get Taglist");
        	}
        });

	}

	return {

		open: function() {

        	if (tmg == null) {
	        	tmg = browser.registerExtraPlugin("tmg", language.gettext("label_tagmanager"), tagManager);
	        	if (prefs.apache_backend != 'sql') {
		            $("#tmgfoldup").append('<h3 align="center">'+language.gettext("label_nosql")+'</h3>');
		            $("#tmgfoldup").append('<h3 align="center"><a href="http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>');
		            tmg.slideToggle('fast');
		            return;
	        	}

	        	$("#tmgfoldup").append('<div class="containerbox padright">'+
	        		'<div class="expand"><b>'+language.gettext("label_tagmanagertop")+'</b></div>'+
	        		'</div>');
    			$("#tmgfoldup").append('<div class="containerbox padright">'+
        			'<div class="expand">'+
            		'<input class="enter sourceform" name="newtagnameinput" type="text" />'+
        			'</div>'+
					'<button class="fixed sourceform" onclick="tagManager.createTag()">'+language.gettext("button_createtag")+'</button>'+
    				'</div>');
			    $("#tmgfoldup .enter").keyup( onKeyUp );
			    $("#tmgfoldup").append('<div class="noselection fullwidth masonified" id="tagmunger"></div>');
	            $.ajax({
	            	url: 'userRatings.php',
	            	type: "POST",
	            	data: {action: 'taglist'},
	            	dataType: 'json',
	            	success: tagManager.doMainLayout,
	            	error: function() {
	            		infobar.notify(infobar.ERROR, "Failed to get Taglist");
	            		tmg.slideToggle('fast');
	            	}
	            });
	        } else {
	        	browser.goToPlugin("tmg");
	        }

		},

		doMainLayout: function(data) {
			debug.log("TAGMANAGER","Got data",data);
			for (var i in data) {
				debug.log("TAGMANAGER",i);
				holders[i] = $('<div>', {class: 'tagholder', id: 'tagman_'+i}).appendTo($("#tagmunger"));
				putTracks(holders[i], data[i], i);
				holders[i].droppable({
					addClasses: false,
					drop: tagManager.dropped,
					hoverClass: 'tagman-hover'
				});
			}
            tmg.slideToggle('fast', function() {
	            $("#tagmunger").masonry({
	            	itemSelector: '.tagholder',
	            	gutter: 0
	            });
	        	browser.goToPlugin("tmg");
	            browser.rePoint();
            });
		},

		createTag: function() {
			var tagname = $('[name=newtagnameinput]').val();
			holders[tagname] = $('<div>', {class: 'tagholder', id: 'tagman_'+tagname}).prependTo($("#tagmunger"));
			putTracks(holders[tagname],[],tagname);
			holders[tagname].droppable({
				addClasses: false,
				drop: tagManager.dropped,
				hoverClass: 'tagman-hover'
			});
			$("#tagmunger").masonry('prepended', holders[tagname]);
			browser.rePoint();
		},

		dropped: function(event, ui) {
	        event.stopImmediatePropagation();
	        var tracks = new Array();
	        var tag = $(event.target).attr("id");
	        tag = tag.replace(/tagman_/,'');
	        $.each($('.selected'), function (index, element) {
	        	var uri = unescapeHtml(decodeURIComponent($(element).attr("name")));
	        	debug.log("TAGMANAGER","Dragged",uri,"to",tag);
	        	tracks.push({
	        		uri: uri,
	        		artist: 'dummy',
	        		title: 'dummy',
	        		urionly: '1',
	        		action: 'set',
	        		attribute: 'Tags',
	        		value: [tag]
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
	        				dotags();
	        			},
	        			error: function() {
	        				infobar.notify(infobar.ERROR, "Failed To Set Tag");
	        				dotags();
	        			}
	        		});
	        	} else {
	        		tracks = null;
	        		reloadTagList(tag);
	        	}
	        })();

		},

		handleClick: function(element, event) {
			if (element.hasClass('clickremtag')) {
		        var tag = element.parent().parent().parent().parent().parent().attr("id");
		        tag = tag.replace(/tagman_/,'');
		        debug.log("TAGMANAGER","Removing Tag",tag);
		        var details = element.parent().prev().html();
		        debug.log("TAGMANAGER","From",details);
		        var matches = details.match(/<b>(.*?)<\/b><br><i>by<\/i> <b>(.*?)<\/b><br><i>on<\/i> <b>(.*?)<\/b>/);
        		$.ajax({
        			url: "userRatings.php",
        			type: "POST",
        			data: {
        				artist: unescapeHtml(matches[2]),
        				album: unescapeHtml(matches[3]),
        				title: unescapeHtml(matches[1]),
        				action: 'remove',
        				value: tag
        			},
        			dataType: 'json',
        			success: function(rdata) {
        				reloadTagList(tag);
        			},
        			error: function() {
        				infobar.notify(infobar.ERROR, "Failed To Remove Tag");
        			}
        		});
			} else if (element.hasClass('clickdeltag')) {
		        var tag = element.parent().parent().parent().parent().parent().attr("id");
		        tag = tag.replace(/tagman_/,'');
		        debug.log("TAGMANAGER","Deleting Tag",tag);
        		$.ajax({
        			url: "userRatings.php",
        			type: "POST",
        			data: {
        				action: 'deletetag',
        				value: tag
        			},
        			success: function(rdata) {
        				$("#tagmunger").masonry('remove', holders[tag]);
        				holders[tag] = null;
        				browser.rePoint();
        			},
        			error: function() {
        				infobar.notify(infobar.ERROR, "Failed To Delete Tag");
        			}
        		});
			} else if (element.hasClass("tablerow")) {
				if (element.hasClass('selected')) {
					$("#tagmunger .selected").removeClass('selected');
				} else {
					var lookfor = $(element.children('td')[1]).html();
					debug.log("TAGMANAGER","Clicked On",lookfor);
					$("#tagmunger").find('tr').filter(function() {
						var l = $($(this).children('td')[1]).html();
						if (l == lookfor) return true;
						return false;
					}).addClass('selected');
				}
			}
		},

		close: function() {
			tmg = null;
			holders = [];
		}

	}

}();

$("#specialplugins").append('<button onclick="tagManager.open()">'+language.gettext("label_tagmanager")+'</button>');