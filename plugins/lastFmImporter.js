var lastfmImporter = function() {

	var impu = null;
	var currpage = 1;
	var totalpages = 0;
	var totaltracks = 0;
	var progressbar;
	var spbar;
	var perpage = 100;
	var databits = new Array();
	var stopped = false;
	var lastkey = 0;
	var finished = false;
	var throttleBackReset = null;
	var searchcount = 0;

	function putRow(t) {

		var fancy = $('<tr>', { class: "invisible", id: "trackrow"+t.key,  style: "border-top:1px solid #454545" });

		var row = '<td><img class="smallcover" src="';
		if (t.image) {
			row = row + t.image;
		} else {
			row += "newimages/album-unknown-small.png";
		}
		row += '" /></td>';
		row += '<td><b>'+t.title+'</b><br><i>by </i>';
		if (t.artist) {
			row += t.artist;
		}
		row += '<br><i>on </i>';
		if (t.album) {
			row += t.album;
		}
		row += '</td>';
		var tags = "";
		if (t.tags) {
			tags = t.tags.join(', ');
		}
		row += '<td>'+tags+'</td>';
		row += '<td align="center">'+t.Playcount+'</td>';
		row += '<td align="center">';
		if (t.loved) {
			row += '<img src="'+ipath+'lastfm-love.png" height="20px" />';
		}
		row += '</td>';
		row += '<td id="trackfound'+t.key+'"></td>';
		fancy.html(row);
		$("#frankzappa").append(fancy);
		fancy.fadeIn('slow');
	}

	function displayFinishBits() {
		if ($("#reviewfirst").is(':checked')) {
			$("#hoobajoob").html('<button class="fixed topformbutton" onclick="lastfmImporter.importEverything()">'+language.gettext("button_importnow")+'</button>');
		} else {
			$("#hoobajoob").html('<h3 align="center">'+language.gettext("label_finished")+'</h3>');
		}
		$('[name="beefheart"]').slideToggle(500);
		$("#hoobajoob").slideToggle(600);
 	}

	function doNextBatch() {
		// Note : totalpages = eg 57 but totaltracks/perpage might give eg 56.2 if the last page has only 20 tracks
		// and perpage is 100. Using that for the % calculation prevents the progress bar skipping backwards
		var p = (currpage/(totaltracks/perpage))*100;
		debug.mark("LASTM IMPORTER","doNextBatch. Progress is",p.toFixed(2),currpage,totalpages);
		progressbar.setProgress(p.toFixed(2));
		if (faveFinder.queueLength() == 0) {
			spbar.setProgress(p.toFixed(2));
		}
		currpage++;
		if (currpage <= totalpages) {
			debug.mark("LASTFM IMPORTER","Getting page",currpage);
			lastfmImporter.go();
		} else {
			debug.mark("LASTFM IMPORTER","Finished");
			progressbar.setProgress(100);
			finished = true;
			lastfm.setThrottling(500);
			if (searchcount == 0) {
				debug.mark("LASTM IMPORTER","Track Search Appears to have completed");
				displayFinishBits();
			}
		}
	}

	function throttleBack(time) {
		clearTimeout(throttleBackReset);
		lastfm.setThrottling(time);
		throttleBackReset = setTimeout(lastfmImporter.putYourFootDown, 20000);
	}

	function trackHtml(data) {
		var html = "";
		var u = data.uri;
		if (u.match(/spotify:/)) {
			html = html + '<img height="12px" src="'+ipath+'spotify-logo.png" style="margin-right:1em" />';
		} else if (u.match(/soundcloud:/)) {
			html = html + '<img height="12px" src="'+ipath+'soundcloud-logo.png" style="margin-right:1em" />';
		} else if (u.match(/youtube:/)) {
			html = html + '<img height="12px" src="newimages/Youtube-logo.png" style="margin-right:1em" />';
		} else if (u.match(/leftasrain:/)) {
			html = html + '<img height="12px" src="newimages/leftasrain.png" style="margin-right:1em" />';
		} else if (u.match(/gmusic:/)) {
			html = html + '<img height="12px" src="newimages/play-logo.png" style="margin-right:1em" />';
		}
		html = html + '<b>'+data.title+'</b><br><i>by </i>';
		html = html + data.artist+'<br><i>on </i>';
		html = html + data.album;
		var arse = data.uri;
		if (arse.indexOf(":") > 0) {
			html = html + '  <i>(' + arse.substr(0, arse.indexOf(":")) + ')</i>';
		}
		return html;
	}

	return {

		open: function() {
			if (impu == null) {
	        	impu = browser.registerExtraPlugin("impu", language.gettext("lastfm_import"), lastfmImporter);
	        	if (!lastfm.isLoggedIn()) {
		            $("#impufoldup").append('<h3 align="center">'+language.gettext("lastfm_pleaselogin")+'</h3>');
		            impu.slideToggle('fast');
		            return;
	        	}

	        	if (prefs.apache_backend != 'sql') {
		            $("#impufoldup").append('<h3 align="center">'+language.gettext("label_nosql")+'</h3>');
		            $("#impufoldup").append('<h3 align="center"><a href="http://sourceforge.net/p/rompr/wiki/Enabling%20Rating%20and%20Tagging/" target="_blank">Read The Wiki</a></h3>');
		            impu.slideToggle('fast');
		            return;
	        	}

	            $("#impufoldup").append(
	            	'<div name="beefheart" class="containerbox vertical">'+
	            		'<div style="margin-left:8px;margin-right:8px;margin-top:4px;margin-bottom:4px" class="containerbox">'+
	            			'<div class="fixed menuitem" style="width:10em"><b>Last.FM</b></div>'+
	            			'<div class="expand menuitem" id="lfmprogress"></div>'+
	            		'</div>'+
						'<div style="margin-left:8px;margin-right:8px;margin-top:4px;margin-bottom:12px" class="containerbox">'+
	            			'<div class="fixed menuitem" style="width:10em"><b>Track Search</b></div>'+
	            			'<div class="expand menuitem" id="searchprogress"></div>'+
	            		'</div>'+
	            	'</div>'
	            	);

				// Have to let these be created visible or the layout doesn't work
				$('[name="beefheart"]').hide();

	            $("#impufoldup").append('<div id="hoobajoob" style="margin-left:24px;margin-right:24px;margin-top:8px;margin-bottom:4px;padding:4px;" class="containerbox bordered">'+
	            	'<div class="expand">'+
	            	'<input type="radio" class="topcheck" name="importc" value="onlyloved" checked>'+language.gettext("label_onlyloved")+'</input><br>'+
	            	'<input type="radio" class="topcheck" name="importc" value="onlytagged">'+language.gettext("label_onlytagged")+'</input><br>'+
	            	'<input type="radio" class="topcheck" name="importc" value="both">'+language.gettext("label_tagandlove")+'</input><br>'+
	            	'<input type="radio" class="topcheck" name="importc" value="all">'+language.gettext("label_everything")+'</input></div>'+

	            	'<div class="expand">'+language.gettext("label_giveloved")+' '+
	            	'<select id="goo" class="topformbutton">'+
	            	'<option value="5">5 '+language.gettext("stars")+'</option>'+
	            	'<option value="4">4 '+language.gettext("stars")+'</option>'+
	            	'<option value="3">3 '+language.gettext("stars")+'</option>'+
	            	'<option value="2">2 '+language.gettext("stars")+'</option>'+
	            	'<option value="1">1 '+language.gettext("stars")+'</option>'+
	            	'<option value="0">'+language.gettext("norating")+'</option>'+
	            	'</select><br>'+
	            	'<input type="checkbox" class="topcheck" id="reviewfirst">'+language.gettext("label_review")+'</input><br>'+
	            	'<input type="checkbox" class="topcheck" id="wishlist">'+language.gettext("label_addtowish")+'</input>'+
	            	'</div>'+

	            	'<button class="fixed topformbutton" onclick="lastfmImporter.go()" id="importgo">GO</button>'+
	            	'</div>');

				$("#goo").val(prefs.synclovevalue);
	            $("#impufoldup").append('<table id="frankzappa" class="invisible" align="center" cellpadding="2" width="95%" style="border-collapse:collapse"></table>');
	            $("#frankzappa").append('<tr><th></th><th>'+language.gettext("label_track")+'</th><th>'+language.gettext("label_tags")+'</th><th>Plays</th><th>'+language.gettext("lastfm_loved")+'</th><th>'+language.gettext("label_oneresult")+'</th></tr>');

	            progressbar = new progressBar("lfmprogress", "horizontal");
	            spbar = new progressBar("searchprogress", "horizontal");

	            impu.slideToggle('fast', function() {
					browser.goToPlugin("impu");
	            });
	            currpage = 1;
	            databits = [];
	            stopped = false;
	            finished = false;
	            lastkey = 0;
				// This tends to hammer last.fm and they don't like it, so throttle our requests right back
				lastfm.setThrottling(1500);
				searchcount = 0;
			} else {
				browser.goToPlugin("impu");
			}
		},

		go: function() {
			if (!stopped) {
				if ($("#hoobajoob").is(':visible')) {
					$("#hoobajoob").slideToggle(500);
					$('[name="beefheart"]').slideToggle(600, function() {
						$("#frankzappa").fadeIn('fast');
					});
				}
				lastfm.library.getTracks(perpage, currpage, lastfmImporter.gotNextBatch, lastfmImporter.failed);
			}
		},

		gotNextBatch: function(data, dummy) {
			var olk = lastkey;
			if (data.tracks) {
				currpage = data.tracks['@attr'].page;
				totalpages = data.tracks['@attr'].totalPages;
				totaltracks = data.tracks['@attr'].total;
				debug.mark("LASTFM IMPORTER","Got Page",currpage,"of",totalpages,"in LastFM Library");
				for (var i = 0; i < data.tracks.track.length; i++) {
					var d = {};
					var key = i+((currpage-1)*perpage);
					if (data.tracks.track[i].image &&
						data.tracks.track[i].image[data.tracks.track[i].image.length-1] &&
						data.tracks.track[i].image[data.tracks.track[i].image.length-1]['#text']) {
						var x = data.tracks.track[i].image[data.tracks.track[i].image.length-1]['#text'];
						if (!x.match(/default_album_.*?\.png/)) {
							d.image = "getRemoteImage.php?url="+x;
						}
						x = null;
					}
					d.title = data.tracks.track[i].name;
					if (data.tracks.track[i].artist && data.tracks.track[i].artist.name) {
						d.artist = data.tracks.track[i].artist.name;
						d.albumartist = data.tracks.track[i].artist.name;
					}
					if (data.tracks.track[i].album && data.tracks.track[i].album.name) {
						d.album = data.tracks.track[i].album.name;
					}
					if (data.tracks.track[i].duration) {
						d.duration = Math.round(data.tracks.track[i].duration/1000);
					}
					d.key = key;
					// We can save ourselves some time by not bothering to carry on here if we know we don't need to
					var doit = ($('[name="importc"]:checked').val() == "onlytagged" && data.tracks.track[i].tagcount == 0) ? false : true;
					if (doit) {
						databits[key] = {index: 0, data: [d]};
						lastkey = key;
						if (data.tracks.track[i].tagcount > 0) {
							lastfm.track.getTags({artist: d.artist, track: d.title}, lastfmImporter.gotTags, lastfmImporter.gotNoTags, key);
						}
						// We have to do a getInfo lookup just to see if it's loved.
						// They do like to make using your loved tracks difficult, which kind of begs the question
						// What the hell are Loved Tracks for these days?
						lastfm.track.getInfo({artist: d.artist, track: d.title}, lastfmImporter.gotTrackinfo, lastfmImporter.gotNoTrackinfo, key);
					}

				}
			}
			data = null;
			if (olk == lastkey) {
				doNextBatch();
			}
		},

		failed: function(data) {
			debug.error("LASTFM IMPORTER","Something shit happened. Trying same page again");
			throttleBack(5000);
			currpage--;
			doNextBatch();
		},

		gotTags: function(data, reqid) {
			debug.log("LASTFM IMPORTER","Got Tags for reqid",reqid);
			var tags = new Array();
			try {
				var r = getArray(data.tags.tag);
			} catch(err) {
				var r = [];
			}
			for (var i in r) {
				tags.push(r[i].name);
			}
			databits[reqid].data[databits[reqid].index].tags = tags;
		},

		gotNoTags: function(data, reqid) {
			debug.warn("LASTFM IMPORTER","Tag Fuckup. Backing Off");
			throttleBack(2500);
		},

		gotTrackinfo: function(data, reqid) {
			if (!stopped) {
				debug.log("LASTFM IMPORTER","Got TrackInfo for",reqid,data);
				databits[reqid].data[databits[reqid].index].loved = (data.track.userloved && data.track.userloved == "1") ? true : false;
				// Since Last.FM requests are queued, we know that when we get this we've got all the data

				databits[reqid].data[databits[reqid].index].Rating = 0;
				if (databits[reqid].data[databits[reqid].index].loved === false &&
					($('[name="importc"]:checked').val() == "onlyloved" || $('[name="importc"]:checked').val() == "both" )) {
					// We don't want this one
					databits[reqid].data[databits[reqid].index].ignore = true;
				} else {
					databits[reqid].data[databits[reqid].index].ignore = false;
					if (databits[reqid].data[databits[reqid].index].loved) {
						databits[reqid].data[databits[reqid].index].Rating = $("#goo").val();
					} else {
						databits[reqid].data[databits[reqid].index].Rating = 0;
					}
					if (data.track.userplaycount) {
						databits[reqid].data[databits[reqid].index].Playcount = data.track.userplaycount;
					} else {
						databits[reqid].data[databits[reqid].index].Playcount = "1";
					}
					putRow(databits[reqid].data[databits[reqid].index]);
					databits[reqid].data[databits[reqid].index].reqid = reqid;
					faveFinder.findThisOne(databits[reqid].data[databits[reqid].index], lastfmImporter, false, true);
					searchcount++;
				}
				var p = (reqid/totaltracks)*100;
				progressbar.setProgress(p.toFixed(2));
				debug.mark("TRACKINFO","Progress is",p.toFixed(2),reqid,totaltracks);
				if (reqid == lastkey) {
					doNextBatch();
				}
			}
			data = null;
		},

		gotNoTrackinfo: function(data, reqid) {
			debug.warn("LASTFM IMPORTER","TrackInfo Fuckup. Backing Off");
			throttleBack(2500);
			if (reqid == lastkey) {
				doNextBatch();
			}
		},

		updateDatabase: function(results) {
			debug.log("LASTFMIMPORTER","Got Track results",results);
			// faveFinder calls back into here
			searchcount--;
			var data = results[0];
			if (stopped) {
				data.ignore = true;
				databits[data.reqid] = { index: 0, data: results };
				return;
			}
			databits[data.reqid] = {index: 0, data: results };
			var p = (data.key/totaltracks)*100;
			spbar.setProgress(p.toFixed(2));

			var html = '<div>';
			var html2 = null;
			if (data.uri) {
				$.each(databits[data.reqid].data, function(i,r) {
					r.ignore = false;
				});
				html = html + trackHtml(data);
				if (results.length > 1 && $("#reviewfirst").is(':checked')) {
					html = html + '<br /><span class="clickicon tiny plugclickable dropchoices infoclick" name="'+data.key+'"> '+language.gettext("label_moreresults", [(results.length - 1)]);
					html = html +'</span></div>';
					html2 = '<tr><td></td><td></td><td></td><td></td><td></td><td><div id="choices'+data.key+'" class="invisible">';
					for (var i = 1; i < results.length; i++) {
						html2 = html2 + '<div class="backhi plugclickable infoclick choosenew" name="'+i+'" style="margin-bottom:4px">'+trackHtml(results[i])+'</div>';
					}
					html2 = html2 + '</div></td><td></td><td></td></tr>';
				} else {
					html = html + '</div>';
				}
			} else {
				html = "<b><i>"+language.gettext("label_notfound")+"</i></b></div>";
				if (!($("#wishlist").is(':checked'))) {
					databits[data.reqid].data[0].ignore = true;
				}
			}
			$("#trackfound"+data.key).hide().html(html).fadeIn('fast');
			if (!($("#reviewfirst").is(':checked'))) {
				$("#trackrow"+data.key).append('<td align="center"></td>');
				lastfmImporter.doSqlStuff(data, false);
			} else {
				$("#trackrow"+data.key).append('<td align="center" class="invisible"><img src="'+ipath+'edit-delete.png" class="clickicon plugclickable infoclick removerow" /></td>').fadeIn('fast');
				$("#trackrow"+data.key).append('<td align="center" class="invisible"><button class="plugclickable infoclick importrow">Import</button></td>').fadeIn('fast');
				if (html2) {
					$("#trackrow"+data.key).after(html2);
				}
				$("#trackrow"+data.key+' td:last').fadeIn('fast');
				$("#trackrow"+data.key+' td:last').prev().fadeIn('fast');
			}
			debug.log("LASTFM IMPORTER", "Searchcount is",searchcount);
			if (searchcount == 0 && finished) {
				debug.mark("LASTM IMPORTER","Track Search Finished");
				displayFinishBits();
			}
		},

		handleClick: function(element, event) {
			if (element.hasClass('dropchoices')) {
				lastfmImporter.dropChoices(parseInt(element.attr('name')));
			} else if (element.hasClass('choosenew')) {
				lastfmImporter.chooseNew(element);
			} else if (element.hasClass('removerow')) {
				lastfmImporter.removeRow(event);
			} else if (element.hasClass('importrow')) {
				lastfmImporter.importRow(event);
			}
		},

		chooseNew: function(clickedElement) {
			var key = clickedElement.parent().attr("id");
			key = key.replace(/choices/, "");
			var index = clickedElement.attr("name");
			clickedElement.html(trackHtml(databits[key].data[databits[key].index]));
			clickedElement.attr("name", databits[key].index);
			databits[key].index = index;
			var html = '<div>' + trackHtml(databits[key].data[index]) +
			'<br /><span class="clickicon tiny plugclickable dropchoices infoclick" name="'+key+'"> '+language.gettext("label_moreresults", [(databits[key].data.length - 1)]);
			html = html +'</span></div>';
			$("#trackfound"+key).html(html);
			clickedElement.parent().slideToggle('fast');
		},

		dropChoices: function(which) {
			$("#choices"+which).slideToggle('fast');
		},

		stopThisCraziness: function() {
			stopped = true;
			lastfm.flushReqids();
			lastfm.setThrottling(500);
			displayFinishBits();
		},

		close: function() {
			stopped = true;
			lastfm.flushReqids();
			lastfm.setThrottling(500);
			impu = null;
			databits = [];
		},

		removeRow: function(event) {
			var clickedElement = $(event.target).parent().parent().attr("id");
			debug.log("LASTFM IMPORTER","Delete row",clickedElement);
			var key = parseInt(clickedElement.replace('trackrow',''));
			databits[key].data[databits[key].index].ignore = true;
			$("#"+clickedElement).next().fadeOut('slow');
			$("#"+clickedElement).fadeOut('slow');
		},

		importRow: function(event) {
			var clickedElement = $(event.target).parent().parent().attr("id");
			debug.log("LASTFM IMPORTER","Import row",clickedElement);
			var key = parseInt(clickedElement.replace('trackrow',''));
			debug.log("LASTFMIMPORTER","Importing",databits[key], databits[key].data[databits[key].index]);
			lastfmImporter.doSqlStuff(databits[key].data[databits[key].index], false);
		},

		doSqlStuff: function(data, callback) {
			if (!data || data.ignore) {
				if (callback) {
					debug.debug("LASTFM IMPORTER","Track is undefined or marked as ignore");
					callback();
				}
			} else {
				data.action = 'set';
				data.attribute = 'Rating';
				data.value = data.Rating;
				// urionly here is set to ensure that the backend matches ONLY the specific
				// version of this track that the user has chosen. It'll be created automatically
				// if it doesn't exist. Failure to set urionly would mean that any old version
				// of the track in the database would get matched.
				data.urionly = 1;
				debug.mark("LASTFM IMPORTER","Doing SQL Rating Stuff",data);

				// Bloody hell this code is a mess

		        $.ajax({
		            url: "userRatings.php",
		            type: "POST",
		            data: data,
		            dataType: 'json',
		            success: function(rdata) {
		                debug.log("LASTFM IMPORTER","Success",rdata);
		                updateCollectionDisplay(rdata);
		                // For some unknown reason, testing data.tags.length doesn't work.
		                // So if the tags array is empty we do this anyway. The PHP checks
		                // and returns 403 Forbidden in that case so nothing untoward will happen.
		                if (data.tags) {
		                	data.attribute = 'Tags';
		                	data.value = data.tags;
							debug.mark("LASTFM IMPORTER","Doing SQL Tag Stuff",data);
					        $.ajax({
					            url: "userRatings.php",
					            type: "POST",
					            data: data,
					            dataType: 'json',
					            success: function(rdata) {
					                debug.log("LASTFM IMPORTER","Success",rdata);
					                updateCollectionDisplay(rdata);
					                data.attribute = "Playcount";
					                data.value = data.Playcount;
					                data.action = "inc";
									debug.mark("LASTFM IMPORTER","Doing SQL Playcount Stuff",data);
							        $.ajax({
							            url: "userRatings.php",
							            type: "POST",
							            data: data,
							            dataType: 'json',
							            success: function(rdata) {
							                debug.log("LASTFM IMPORTER","Success",rdata);
							                data.ignore = true;
											$("#trackrow"+data.key+' td:last').html('<img src="newimages/tick.png" />');
											if (callback) {
												setTimeout(callback, 1000);
											}
							            },
							            error: function(rdata) {
							                debug.log("LASTFM IMPORTER","Failure");
							                data.ignore = true;
											$("#trackrow"+data.key+' td:last').html('<img src="newimages/tick.png" />');
											if (callback) {
												setTimeout(callback, 1000);
											}
							            }
							        });
					            },
					            error: function(rdata) {
					                debug.log("LASTFM IMPORTER","Failure with",data.tags);
					                data.ignore = true;
									$("#trackrow"+data.key+' td:last').html('<img src="newimages/tick.png" />');
									if (callback) {
										setTimeout(callback, 1000);
									}
					            }
					        });
		                } else {
			                data.attribute = "Playcount";
			                data.value = data.Playcount;
			                data.action = "inc";
							debug.mark("LASTFM IMPORTER","Doing SQL Playcount Stuff",data);
					        $.ajax({
					            url: "userRatings.php",
					            type: "POST",
					            data: data,
					            dataType: 'json',
					            success: function(rdata) {
					                debug.log("LASTFM IMPORTER","Success",rdata);
					                data.ignore = true;
									$("#trackrow"+data.key+' td:last').html('<img src="newimages/tick.png" />');
									if (callback) {
										setTimeout(callback, 1000);
									}
					            },
					            error: function(rdata) {
					                debug.log("LASTFM IMPORTER","Failure");
					                data.ignore = true;
									$("#trackrow"+data.key+' td:last').html('<img src="newimages/tick.png" />');
									if (callback) {
										setTimeout(callback, 1000);
									}
					            }
					        });
		                }
		            },
		            error: function(rdata) {
		                infobar.notify(infobar.ERROR,"Track Import Failed");
		                debug.warn("LASTFM IMPORTER","Failure");
						if (callback) {
							setTimeout(callback, 1000);
						}
		            }
		        });
		    }
		},

		importEverything: function() {
			if ($("#hoobajoob").is(':visible')) {
				$('[name="beefheart"]').children()[1].remove();
				$('[name="beefheart"] div:last').prev().html('<b>'+language.gettext("label_progress")+'</b>');
				$("#hoobajoob").slideToggle(500);
				$('[name="beefheart"]').slideToggle(600);
				progressbar.setProgress(0);
				// Remove the delete and 'import' boxes from the rows
				$('#frankzappa tr').each(function() { $(this).children('td').last().html('').prev().html('') });
			}

			if (databits.length > 0) {
				var next = databits.shift();
				var thing = null;
				if (next) {
					thing = next.data[next.index];
					if (thing) {
						if (thing.key) {
							var p = (thing.key/lastkey)*100;
							progressbar.setProgress(p.toFixed(2));
						}
					}
				}
				lastfmImporter.doSqlStuff(thing, lastfmImporter.importEverything);
			}
		},

		putYourFootDown: function() {
			clearTimeout(throttleBackReset);
			lastfm.setThrottling(1500);
		}

	}

}();

$("#specialplugins").append('<div class="fullwidth"><button onclick="lastfmImporter.open()">'+language.gettext("lastfm_import")+'</button></div>');