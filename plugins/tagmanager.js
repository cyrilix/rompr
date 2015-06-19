var tagManager = function() {

	var tmg = null;
	var holders = new Array();

	function putTracks(holder, tracks, title) {
		var html = '<table align="center" style="border-collapse:collapse;width:96%"><tr class="tagh"><th colspan="2" align="center">'+title+'</th><th width="20px"><i class="icon-cancel-circled playlisticon clickicon infoclick plugclickable clickdeltag"></i></th></tr>';
		for (var i in tracks) {
			if (tracks[i].Uri && prefs.player_backend == "mpd" && tracks[i].Uri.match(/soundcloud:/)) {
				html = html + '<tr class="infoclick draggable clickable clickcue" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover';
			} else {
				html = html + '<tr class="infoclick draggable clickable clicktrack" name="'+encodeURIComponent(tracks[i].Uri)+'"><td width="40px"><img class="smallcover';
			}
			if (tracks[i].Image) {
				html = html + '" src="'+tracks[i].Image;
			} else {
				html = html + ' notfound';
			}
			html = html + '" /></td><td class="dan"><b>'+tracks[i].Title+'</b><br><i>by</i> <b>'+tracks[i].Artist+
				'</b><br><i>on</i> <b>'+tracks[i].Album+'</b></td>';
			html = html + '<td align="center" style="vertical-align:middle"><i class="icon-cancel-circled playlisticon clickicon infoclick plugclickable clickremtag"></i></td></tr>';
		}
		html = html + '</table>';
		holder.html(html);
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
    			$("#tmgfoldup").append('<div class="containerbox padright noselection">'+
        			'<div class="expand">'+
            		'<input class="enter inbrowser" name="newtagnameinput" type="text" />'+
        			'</div>'+
					'<button class="fixed" onclick="tagManager.createTag()">'+language.gettext("button_createtag")+'</button>'+
    				'</div>');
    			$("#tmgfoldup").append('<div class="containerbox padright noselection">'+
        			'<div class="expand">'+
            		'<input class="enter inbrowser clearbox" name="tfilterinput" type="text" />'+
        			'</div>'+
					'<button class="fixed" onclick="tagManager.filter()">'+language.gettext("button_search")+'</button>'+
    				'</div>');
			    $("#tmgfoldup").append('<div class="noselection fullwidth masonified" id="tagmunger"></div>');
			    $('[name="tfilterinput"]').click(function(ev){
		            ev.preventDefault();
		            ev.stopPropagation();
		            var position = getPosition(ev);
		            var elemright = $('[name="tfilterinput"]').width() + $('[name="tfilterinput"]').offset().left;
		            if (position.x > elemright - 24) {
		            	$('[name="tfilterinput"]').val("");
		            	tagManager.filter();
		            }
			    });
			    $('[name="tfilterinput"]').hover(makeHoverWork);
			    $('[name="tfilterinput"]').mousemove(makeHoverWork);
	            $.ajax({
	            	url: 'backends/sql/userRatings.php',
	            	type: "POST",
	            	data: {action: 'taglist'},
	            	dataType: 'json',
	            	success: function(data) {
            			setDraggable('tmgfoldup');';'
	            		tagManager.doMainLayout(data);
	            	},
	            	error: function() {
	            		infobar.notify(infobar.ERROR, "Failed to get Taglist");
	            		tmg.slideToggle('fast');
	            	}
	            });
			    $("#tmgfoldup .enter").keyup( onKeyUp );
	        } else {
	        	browser.goToPlugin("tmg");
	        }

		},

		doMainLayout: function(data) {
			debug.log("TAGMANAGER","Got data",data);
			for (var i in data) {
				debug.log("TAGMANAGER",i);
				holders[i] = $('<div>', {class: 'tagholder noselection selecotron', id: 'tagman_'+i}).appendTo($("#tagmunger"));
				putTracks(holders[i], data[i], i);
				holders[i].droppable({
					addClasses: false,
					drop: tagManager.dropped,
					hoverClass: 'highlighted'
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
			if (tagname == "" || typeof tagname == "undefined") {
				return;
			}
			holders[tagname] = $('<div>', {class: 'tagholder', id: 'tagman_'+tagname}).prependTo($("#tagmunger"));
			putTracks(holders[tagname],[],tagname);
			holders[tagname].droppable({
				addClasses: false,
				drop: tagManager.dropped,
				hoverClass: 'highlighted'
			});
			$("#tagmunger").masonry('prepended', holders[tagname]);
			browser.rePoint();
		},

		reloadTagList: function(tag) {
	        $.ajax({
	        	url: 'backends/sql/userRatings.php',
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

		},

		dropped: function(event, ui) {
	        event.stopImmediatePropagation();
	        var tag = $(event.target).attr("id");
	        tag = tag.replace(/tagman_/,'');
	        doPluginDropStuff(tag,[{attribute: 'Tags', value: [tag]}],tagManager.reloadTagList);
		},

		handleClick: function(element, event) {
			if (element.hasClass('clickremtag')) {
		        var tag = element.parent().parent().parent().parent().parent().attr("id");
		        tag = tag.replace(/tagman_/,'');
		        var uri = decodeURIComponent(element.parent().parent().attr('name'));
		        debug.log("TAGMANAGER","Removing Tag",tag,"From",uri);
        		$.ajax({
        			url: "backends/sql/userRatings.php",
        			type: "POST",
        			data: {
        				artist: 'dummy',
        				title: 'dummy',
        				uri: uri,
        				urionly: 'true',
        				action: 'remove',
        				attributes: [{ attribute: "Tags", value: tag}]
        			},
        			dataType: 'json',
        			success: function(rdata) {
        				tagManager.reloadTagList(tag);
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
        			url: "backends/sql/userRatings.php",
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
			}
		},

		close: function() {
			tmg = null;
			holders = [];
		},

		filter: function() {
			var term = $('[name=tfilterinput]').val();
			if (term == "") {
				debug.log("TAG MANAGER","Showing Everything");
				$("#tagmunger tr").show();
			} else {
				debug.log("TAG MANAGER","Filtering on",term);
				var re = new RegExp(term, "i");
				$.each($("#tagmunger .clicktrack"), function() {
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

pluginManager.addPlugin(language.gettext("label_tagmanager"), tagManager.open, null);