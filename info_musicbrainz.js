var info_musicbrainz = function() {

	var me = "musicbrainz";
	var medebug = "MBNZ PLUGIN";
	debug.setcolour(medebug, '#11eeff');

	function getYear(data) {
		try {
			var date = data['first-release-date'] || data.date;
			if (!date) {
				var t = data.title;
				var m = t.match(/^(\d\d\d\d)/);
				date = m[0];
			}
			var d = new Date(date);
			var y = d.getFullYear();
			if (!y) { y = 0 }
			return parseInt(y);
		} catch(err) {
			return 0;
		}
	}

	function doSpan(data) {
		if (data.begin === undefined || data.begin === null) {
			return "";
		}
		var by = new Date(data.begin);
		var ey = new Date(data.end);
		var tby = by.getFullYear() || "";
		var tey = data.ended ? (ey.getFullYear() || "") : language.gettext("musicbrainz_now");
		return '('+tby+'&nbsp;-&nbsp;'+tey+')';
	}

	function albumsbyyear(a, b) {
		var year_a = getYear(a);
		var year_b = getYear(b);
		if (year_a == year_b) { return 0 }
		return (year_a > year_b) ? 1 : -1;
	}

	function getArtistHTML(data, expand) {

		if (data.error) {
			return '<h3 align="center">'+data.error+'</h3>';
		}

        var html = '<div class="containerbox">';
        html = html + '<div class="fixed bright">';
        html = html + '<ul><li>'+data.disambiguation+'</li></ul>';
        if (data.type !== null) {
        	html = html + '<ul><li><b>'+language.gettext("title_type")+': </b>'+data.type+'</li></ul>';
        }
        if (data.aliases && data.aliases.length > 0) {
	        html = html + '<br><ul><li><b>'+language.gettext("discogs_aliases")+'</b></li>';
	        for (var i in data.aliases) {
	        	html = html + '<li>'+data.aliases[i].name + '</li>';
	        }
	        html = html + '</ul>';
	    }

        if (data.begin_area) {
        	html = html + '<br><ul><li><b>'+language.gettext("musicbrainz_origin")+': </b>'+data.begin_area.name+", "+data.area.name+'</li></ul>';
        } else if (data.area) {
        	html = html + '<br><ul><li><b>'+language.gettext("musicbrainz_origin")+': </b>'+data.area.name+'</li></ul>';
        }
        if (data['life-span'] && data['life-span'].begin !== null) {
        	html = html + '<br><ul><li><b>'+language.gettext("musicbrainz_active")+': </b>'+data['life-span'].begin+" - "+(data['life-span'].end || language.gettext("musicbrainz_now"))+'</li></ul>';
        }
        if (data.rating && data.rating.value !== null) {
        	html = html + '<br><ul><li><b>'+language.gettext("musicbrainz_rating")+': </b>'+data.rating.value+"/5 from "+data.rating['votes-count']+' votes</li></ul>';
        }
        html = html + '<br>'+getURLs(data.relations, true);
        html = html + '</div>';

        html = html + '<div class="expand stumpy">';
        if (expand) {
			html = html + '<div class="mbbox"><img class="clickexpandbox infoclick tleft" src="newimages/expand-up.png" height="16px" name="'+data.id+'"></div>';
		}

        if (data.annotation) {
        	var a = data.annotation;
        	a = a.replace(/\n/, '<br>');
        	a = a.replace(/\[(.*?)\|(.*?)\]/g, '<a href="$1" target="_blank">$2</a>');
        	html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_notes")+':</b></div><div class="mbbox">'+a+'</div>';
        }

        if (data.tags && data.tags.length > 0) {
	        html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_tags")+'</b></div><div class="statsbox">';
	        for (var i in data.tags) {
	        	html = html + '<span class="mbtag">'+data.tags[i].name+'</span> ';
	        }
	        html = html + '</div>';
	    }

	    var bandMembers = new Array();
	    var memberOf = new Array();
    	for (var i in (data.relations)) {
    		if (data.relations[i].type == "member of band") {
    			if (data.relations[i].direction == "backward") {
    				bandMembers.push(data.relations[i]);
    			} else {
    				memberOf.push(data.relations[i]);
    			}
    		}
    	}
    	if (bandMembers.length > 0) {
        	html = html + '<div class="mbbox underline"><b>'+language.gettext("discogs_bandmembers")+'</b></div>'+getMembers(bandMembers);
    	}
    	if (memberOf.length > 0) {
        	html = html + '<div class="mbbox underline"><b>'+language.gettext("discogs_memberof")+'</b></div>'+getMembers(memberOf);
    	}

		html = html + '<div class="mbbox underline">';
	    html = html + '<img src="newimages/toggle-closed-new.png" class="menu infoclick clickdodiscography" name="'+data.id+'">';
	    html = html + '<b>'+language.gettext("discogs_discography", [data.name.toUpperCase()])+'</b></div>';
	    html = html + '<div name="discography_'+data.id+'" class="invisible">';
        html = html + '</div>';

        html = html + '</div>';
        html = html + '</div>';
        return html;

	}

	function getMembers(data) {
		var html = "";
		var already_done = new Array();
        var ayears = new Array();
        for (var i in data) {
			if (already_done[data[i].artist.id] !== true) {
				debug.debug(medebug,"New Artist",data[i].artist.id,data[i].artist.name,data[i].begin,data[i].end);
    			html = html + '<div class="mbbox">';
    			// The already_done flag is just there because artist can appear multiple times in this data
    			// if they did multiple stints in the band.

				html = html + '<img src="newimages/toggle-closed-new.png" class="menu infoclick clickdoartist" name="'+data[i].artist.id+'">';
    			html = html + '<b>'+data[i].artist.name+'  </b>'+"AYEARS_"+data[i].artist.id;
    			ayears[data[i].artist.id] = doSpan(data[i]);
    			html = html + '</div>';
    			html = html + '<div name="'+data[i].artist.id+'" class="invisible"></div>';
    			already_done[data[i].artist.id] = true;
    		} else {
				debug.debug(medebug,"Repeat Artist",data[i].artist.id,data[i].artist.name,data[i].begin,data[i].end);
    			ayears[data[i].artist.id] = ayears[data[i].artist.id] + " " + doSpan(data[i]);
    		}
        }
    	for(var i in ayears) {
    		html = html.replace("AYEARS_"+i, ayears[i]);
    	}
    	return html;

	}

	function getURLs(relations, withheader) {
		if (relations.length == 0) {
			return "";
		}
		if (withheader) {
			var html = '<ul><li><b>'+language.gettext("discogs_external")+'</b></li>';
		} else {
			var html = '<ul style="list-style:none;margin:2px;padding:0px">';
		}
		for (var i in relations) {
			if (relations[i].url) {
				var u = relations[i].url.resource;
				var d = u.match(/https*:\/\/(.*?)(\/|$)/);
			}
			switch (relations[i].type) {
				case "wikipedia":
					html = html + '<li><img src="newimages/Wikipedia-logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Wikipedia ('+d[1]+')</a></li>';
					break;

				case "wikidata":
					html = html + '<li><img src="newimages/Wikipedia-logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Wikidata</a></li>';
					break;

				case "discography":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_externaldiscography", [d[1]])+'</a></li>';
					break;

				case "musicmoz":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Musicmoz</a></li>';
					break;

				case "allmusic":
					html = html + '<li><img src="newimages/allmusic_logo.gif" class="menu padright wibble"><a href="'+u+'" target="_blank">Allmusic</a></li>';
					break;

				case "BBC Music page":
					html = html + '<li><img src="newimages/BBC%20logo.jpg" class="menu padright wibble"><a href="'+u+'" target="_blank">BBC Music Page</a></li>';
					break;

				case "discogs":
					html = html + '<li><img src="newimages/discogs-white-2.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Discogs</a></li>';
					break;

				case "official homepage":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_officalhomepage", [d[1]])+'</a></li>';
					break;

				case "fanpage":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_fansite", [d[1]])+'</a></li>';
					break;

				case "lyrics":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_lyrics", [d[1]])+'</a></li>';
					break;

				case "secondhandsongs":
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Secondhand Songs</a></li>';
					break;

				case "IMDb":
					html = html + '<li><img src="newimages/imdb-logo.jpg" class="menu padright wibble"><a href="'+u+'" target="_blank">IMDb</a></li>';
					break;

				case "social network":
					if (u.match(/last\.fm/i)) {
						html = html + '<li><img src="newimages/lastfm.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Last.FM</a></li>';
					} else if (u.match(/facebook\.com/i)) {
						html = html + '<li><img src="newimages/facebook-logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Facebook</a></li>';
					} else {
						html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_social", [d[1]])+'</a></li>';
					}
					break;

				case "youtube":
					html = html + '<li><img src="newimages/youtube-logo.gif" class="menu padright wibble"><a href="'+u+'" target="_blank">YouTube</a></li>';
					break;

				case "myspace":
					html = html + '<li><img src="newimages/myspace_logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Myspace</a></li>';
					break;

				case "microblog":
					if (u.match(/twitter\.com/i)) {
						html = html + '<li><img src="newimages/Twitter-Logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Twitter</a></li>';
					} else {
						html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_microblog", [d[1]])+'</a></li>';
					}
					break;

				case "other databases":
					if (u.match(/rateyourmusic\.com/i)) {
						html = html + '<li><img src="newimages/rate-your-music.jpg" class="menu padright wibble"><a href="'+u+'" target="_blank">Rate Your Music</a></li>';
					} else {
						html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+d[1]+'</a></li>';
					}
					break;

				case "review":
					if (u.match(/bbc\.co\.uk/i)) {
						html = html + '<li><img src="newimages/BBC logo.jpg" class="menu padright wibble"><a href="'+u+'" target="_blank">BBC Music Review</a></li>';
					} else {
						html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+language.gettext("musicbrainz_review", [d[1]])+'</a></li>';
					}
					break;

				case "VIAF":
					break;

				default:
					if (relations[i].url) {
						html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+d[1]+'</a></li>';
						break;
					}
			}
		}
		html = html + '</ul>'
		return html;

	}

	function getReleaseHTML(data) {

		if (data.error) {
			return '<h3 align="center">'+language.gettext("musicbrainz_contacterror")+'</h3>';
		}
		if (data['release-groups'].length > 0) {
			var dby = data['release-groups'].sort(albumsbyyear);
        	var html = '<div class="mbbox"><table class="padded" width="100%">';
        	html = html + '<tr><th>'+language.gettext("title_year")+'</th><th>'+language.gettext("title_title")+' / '
        				+language.gettext("title_artist")+'</th><th>'+language.gettext("title_type")+'</th><th>'
        				+language.gettext("musicbrainz_rating")+'</th><th>'+language.gettext("discogs_external")+'</th></tr>'
        	for (var i in dby) {

        		var y = getYear(dby[i]);
        		if (y == 0) {
        			y = "-";
        		}
        		html = html + '<tr><td>'+y+'</td>';
        		html = html + '<td><a href="http://www.musicbrainz.org/release-group/'+dby[i].id+'" target="_blank">'+dby[i].title+'</a>';

        		var ac = dby[i]['artist-credit'][0].name;
        		var jp = dby[i]['artist-credit'][0].joinphrase;
        		for(var j = 1; j < dby[i]['artist-credit'].length; j++) {
        			ac = ac + " "+jp+" "+dby[i]['artist-credit'][j].name;
        		}

        		html = html + '<br><i>'+ac+'</i></td><td>';
        		html = html + dby[i]['secondary-types'].join(' ');
        		html = html + ' ' + (dby[i]['primary-type'] || "");
        		html = html + '</td><td>';
        		if (dby[i].rating['votes-count'] == 0) {
        			html = html + language.gettext("musicbrainz_novotes");
        		} else {
        			html = html + language.gettext("musicbrainz_votes", [dby[i].rating.value, dby[i].rating['votes-count']]);
        		}
        		html = html + '</td><td>';
        		html = html + getURLs(dby[i].relations);
        		html = html + '</td></tr>';
        	}
        	html = html + '</table></div>';
        	return html;
        } else {
        	return "";
        }
    }

	function getCoverHTML(data) {
		var html = "";
		if (data) {
			for (var i in data.images) {
				html = html + '<div class="infoclick clickzoomimage">';
				html = html + '<img style="margin:1em" src="'+data.images[i].thumbnails.small+'" />';
				html = html + '</div>';
				html = html + '<input type="hidden" value="'+data.images[i].image+'" />';
			}
		}
		return html;
	}

	function getTrackHTML(data) {
		if (data.error && data.recording === undefined && data.work === undefined) {
			return '<h3 align="center">'+data.error.error+'</h3>';
		}
        var html = '<div class="containerbox">';
        html = html + '<div class="fixed bright">';
		if (data.recording) {
			if (data.recording.disambiguation) {
				html = html + '<ul>'+data.recording.disambiguation+'</ul>';
			}
		}
		if (data.work) {
			if (data.work.disambiguation) {
				html = html + '<ul>'+data.work.disambiguation+'</ul>';
			}
		}

		if (data.recording.rating && data.recording.rating.value !== null) {
        	html = html + '<br><ul><li><b>RATING: </b>'
        				+language.gettext("musicbrainz_votes", [data.recording.rating.value, data.recording.rating['votes-count']])
        				+'</li></ul>';
        }
		var rels = new Array();

		if (data.work) {
			for (var i in data.work.relations) {
				rels.push(data.work.relations[i]);
			}
		}
		if (data.recording) {
			for (var i in data.recording.relations) {
				rels.push(data.recording.relations[i]);
			}
		}
		html = html + getURLs(rels, true);
		html = html + '</div>';

        html = html + '<div class="expand stumpy">';

		if ((data.work && data.work.annotation) || (data.recording && data.recording.annotation)) {
			var a  = "";
			if (data.work && data.work.annotation) {
				a = a + data.work.annotation;
			}
			if (data.recording && data.recording.annotation) {
				a = a + data.recording.annotation;
			}
        	a = a.replace(/\n/, '<br>');
        	a = a.replace(/\[(.*?)\|(.*?)\]/, '<a href="$1" target="_blank">$2</a>');
        	html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_notes")+':</b></div><div class="mbbox">'+a+'</div>';
		}

        if (data.recording && data.recording.tags && data.recording.tags.length > 0) {
	        html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_tags")+'</b></div><div class="statsbox">';
	        for (var i in data.recording.tags) {
	        	html = html + '<span class="mbtag">'+data.recording.tags[i].name+'</span> ';
	        }
	        html = html + '</div>';
	    }
	    html = html + doCredits(rels);

	    if (data.recording && data.recording.releases && data.recording.releases.length > 0) {
			html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_appears")+'</b></div><div class="mbbox"><table class="padded">';
			for (var i in data.recording.releases) {
				html = html + '<tr><td><b><a href="http://www.musicbrainz.org/release/'+
							data.recording.releases[i].id+'" target="_blank">'+
							data.recording.releases[i].title+'</a></b></td><td>'+
							data.recording.releases[i].date+'</td><td><i>'+
							data.recording.releases[i].status+','+
							data.recording.releases[i].country+'</i></td></tr>';
			}
			html = html + '</table></div>';

	    }


		html = html + '</div>';
		return html;

	}

	function doCredits(rels) {
	    var doit = true;
	    var html = "";
	    for (var i in rels) {
	    	if (rels[i].artist) {
	    		if (doit) {
					html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_credits")+'</b></div><div class="mbbox"><table class="padded">';
					doit = false;
				}
	    		html = html + '<tr><td class="ucfirst">'+rels[i].type;
	    		if (rels[i].attributes) {
	    			var c = false;
	    			for (var j in rels[i].attributes) {
	    				if (j == 0) {
	    					html = html + ' (';
	    					c = true;
	    				} else {
	    					html = html +', ';
	    				}
	    				html = html + rels[i].attributes[j];
	    			}
	    			if (c) {
	    				html = html + ')';
	    			}
	    		}
	    		html = html +'</td><td><a href="http://www.musicbrainz.org/artist/'+rels[i].artist.id+'" target="_blank">'+rels[i].artist.name+'</a>';
	    		if (rels[i].artist.disambiguation) {
	    			html = html + ' <i>('+rels[i].artist.disambiguation+')</i>';
	    		}
	    		html = html +'</td></tr>';
	    	}
	    }
	    if (!doit) {
	    	html = html + '</table></div>';
	    }
	    return html;
	}

	return {
		getRequirements: function(parent) {
			if (parent.playlistinfo.musicbrainz.artistid == "" ||
				parent.playlistinfo.musicbrainz.albumid == "" ||
				parent.playlistinfo.musicbrainz.trackid == "") {
				return ["lastfm"];
			} else {
				return [];
			}
		},

		collection: function(parent) {

			debug.log(medebug, "Creating data collection");

			var self = this;
			var displaying = false;

			this.displayData = function() {
				displaying = true;
				self.artist.doBrowserUpdate();
				self.album.doBrowserUpdate();
				self.track.doBrowserUpdate();
			}

			this.stopDisplaying = function() {
				displaying = false;
			}

			this.handleClick = function(source, element, event) {
				debug.log(medebug,parent.index,source,"is handling a click event");
				if (element.hasClass('clickdoartist')){
					var targetdiv = element.parent().next();
					if (!(targetdiv.hasClass('full')) && element.isClosed()) {
						doSomethingUseful(targetdiv, language.gettext("info_gettinginfo"));
	        			targetdiv.slideToggle('fast');
						getArtistData(element.attr('name'));
	        			element.toggleOpen();
	        			targetdiv.addClass('underline');
		        	} else {
		        		if (element.isOpen()) {
		        			element.toggleClosed();
		        			targetdiv.removeClass('underline');
		        		} else {
		        			element.toggleOpen();
		        			targetdiv.addClass('underline');
		        		}
		        		targetdiv.slideToggle('fast');
		        	}
				} else if (element.hasClass('clickdodiscography')) {
					var targetdiv = element.parent().next();
					if (!(targetdiv.hasClass('full')) && element.isClosed()) {
						doSomethingUseful(targetdiv, language.gettext("info_gettinginfo"));
	        			getArtistReleases(element.attr('name'), 'discography_'+element.attr('name'));
	        			element.toggleOpen();
	        			targetdiv.slideToggle('fast');
		        	} else {
		        		if (element.isOpen()) {
		        			element.toggleClosed();
		        		} else {
		        			element.toggleOpen();
		        		}
	        			targetdiv.slideToggle('fast');
		        	}
				} else if (element.hasClass('clickexpandbox')) {
					var id = element.attr('name');
					var expandingframe = element.parent().parent().parent().parent();
					var content = expandingframe.html();
					content=content.replace(/<img class="clickexpandbox.*?>/, '');
					var pos = expandingframe.offset();
					var targetpos = $("#artistfoldup").offset();
					var animator = expandingframe.clone();
					animator.css('position', 'absolute');
					animator.css('top', pos.top+"px");
					animator.css('left', pos.left+"px");
					animator.css('width', expandingframe.width()+"px");
					animator.appendTo($('body'));
					$("#artistfoldup").animate(
						{
							opacity: 0
						},
						'fast',
						'swing',
						function() {
							animator.animate(
								{
									top: targetpos.top+"px",
									left: targetpos.left+"px",
									width: $("#artistinformation").width()+"px"
								},
								'fast',
								'swing',
								function() {
									browser.speciaUpdate(
										me,
										'artist',
										{
											name: parent.playlistinfo.metadata.artist.musicbrainz[id].name,
											link: null,
											data: content
										}
									);
									animator.remove();
								}
							);
						}
					);
				} else if (element.hasClass('clickzoomimage')) {
					imagePopup.create(element, event, element.next().val());
				}
			}

			function getArtistData(id) {
				debug.mark(medebug,parent.index,"Getting data for artist with ID",id);
				if (parent.playlistinfo.metadata.artist.musicbrainz[id] === undefined) {
					debug.log(medebug,parent.index," ... retrieivng data");
					musicbrainz.artist.getInfo(
						id,
						self.artist.extraResponseHandler,
						self.artist.extraResponseHandler
					);
				} else {
					debug.log(medebug,parent.index," ... displaying what we've already got");
					putArtistData(parent.playlistinfo.metadata.artist.musicbrainz[id], id);
				}
			}

			function putArtistData(data, div) {
				var html = getArtistHTML(data, true);
				$('div[name="'+div+'"]').each(function() {
					if (!$(this).hasClass('full')) {
						$(this).html(html);
						$(this).addClass('full');
					}
				});
			}

			function getArtistReleases(id, target) {
				debug.mark(medebug,parent.index,"Looking for release info with id",id,target);
				if (parent.playlistinfo.metadata.artist.musicbrainz[target] === undefined) {
					debug.log(medebug,"  ... retreiving them");
					musicbrainz.artist.getReleases(
						id,
						target,
						self.artist.releaseResponseHandler,
						self.artist.releaseResponseHandler
					);
				} else {
					debug.log(medebug,"  ... displaying what we've already got",parent.playlistinfo.metadata.artist.musicbrainz[target]);
					putArtistReleases(parent.playlistinfo.metadata.artist.musicbrainz[target], target);
				}
			}

			function putArtistReleases(data, div) {
				var html = getReleaseHTML(data);
				$('div[name="'+div+'"]').each(function() {
					if (!($(this).hasClass('full'))) {
						$(this).html(html);
						$(this).addClass('full');
					}
				});
			}

	        function getAlbumHTML(data) {
				if (data.error) {
					return '<h3 align="center">'+data.error+'</h3>';
				}

		        var html = '<div class="containerbox">';
		        html = html + '<div class="fixed bright">';
		        html = html + '<ul><li>'+data.disambiguation+'</li></ul>';
		        html = html + '<ul><li><b>'+language.gettext("musicbrainz_status")+': </b>';
		        if (data.status) {
		        	html = html +data.status+" ";
		        }
        		for(var j in data['release-group']['secondary-types']) {
        			html = html + data['release-group']['secondary-types'][j] + " ";
        		}
        		html = html + (data['release-group']['primary-type'] || "");
		        html = html + '</li></ul>';
		        if (data['release-group'] && data['release-group']['first-release-date']) {
		        	html = html + '<ul><li><b>'+language.gettext("musicbrainz_date")+': </b>'+data['release-group']['first-release-date']+'</li></ul>';
		        } else {
		        	html = html + '<ul><li><b>'+language.gettext("musicbrainz_date")+': </b>'+data.date+'</li></ul>';
		        }
		        if (data.country) {
		        	html = html + '<ul><li><b>'+language.gettext("musicbrainz_country")+': </b>'+data.country+'</li></ul>';
		        }
		        if (data['label-info'] && data['label-info'].length > 0) {
			        html = html + '<ul><li><b>'+language.gettext("title_label")+': </b></li>';
			        for (var i in data['label-info']) {
			        	html = html + '<li>'+data['label-info'][i].label.name+'</li>';
			        }
			        html = html + '</ul>';
			    }
		        html = html + '<br>'+getURLs(data.relations, true);
				html = html + '</div>';

		        html = html + '<div class="expand stumpy">';

				if (data.annotation) {
					var a = data.annotation;
		        	a = a.replace(/\n/, '<br>');
		        	a = a.replace(/\[(.*?)\|(.*?)\]/, '<a href="$1" target="_blank">$2</a>');
		        	html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_notes")+':</b></div><div class="mbbox">'+a+'</div>';
				}

		        if (data.tags && data.tags.length > 0) {
			        html = html + '<div class="mbbox underline"><b>'+language.gettext("musicbrainz_tags")+'</b></div><div class="statsbox">';
			        for (var i in data.tags) {
			        	html = html + '<span class="mbtag">'+data.tags[i].name+'</span> ';
			        }
			        html = html + '</div>';
			    }

			    html = html + doCredits(data.relations);

    			html = html + '<div class="mbbox underline"><b>'+language.gettext("discogs_tracklisting")+'</b></div><div class="mbbox"><table class="padded">';
    			for (var i in data.media) {
    				html = html + '<tr><th colspan="3"><b>'+language.gettext("musicbrainz_disc")+' '+data.media[i].position;
    				if (data.media[i].title !== null && data.media[i].title != "") {
    					html = html + " - " + data.media[i].title;
    				}
    				html = html + '</b></th></tr>';
    				for (var j in data.media[i].tracks) {
    					html = html + '<tr><td>'+data.media[i].tracks[j].number+'</td>';
    					html = html + '<td>'+data.media[i].tracks[j].title;
    					if (data['artist-credit'][0].name == "Various Artists" && data.media[i].tracks[j]['artist-credit']) {
    						html = html + '<br><i>';
    						var jp = "";
    						for (var k in data.media[i].tracks[j]['artist-credit']) {
    							if (jp != "") {
    								html = html + " "+jp+" ";
    							}
    							html = html + data.media[i].tracks[j]['artist-credit'][k].name;
    							jp = data.media[i].tracks[j]['artist-credit'][k].joinphrase;
    						}
    						html = html + '</i>';
    					}
    					html = html + '</td>';
    					html = html + '<td>'+formatTimeString(Math.round(data.media[i].tracks[j].length/1000))+'</td></tr>';
    				}
    			}
    			html = html + '</table>';
		        html = html + '</div>';
		        html = html + '</div>';
		        if (data['cover-art-archive'].artwork == true) {
			        html = html + '<div class="cleft fixed" id="coverart">';
			        html = html + getCoverArt();
			        html = html + '</div>';
			    }
		        html = html + '</div>';
		        return html;
	        }

			function getCoverArt() {
				debug.mark(medebug,parent.index,"Getting Cover Art");
				if (parent.playlistinfo.metadata.album.musicbrainz.coverart === undefined) {
					debug.log(medebug,parent.index," ... retrieivng data");
					musicbrainz.album.getCoverArt(
						parent.playlistinfo.musicbrainz.albumid,
						self.album.coverResponseHandler,
						self.album.coverResponseHandler
					);
					return "";
				} else {
					debug.log(medebug,parent.index," ... displaying what we've already got");
					return (getCoverHTML(parent.playlistinfo.metadata.album.musicbrainz.coverart));
				}
			}

			this.artist = function() {

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.artist.musicbrainz === undefined) {
							parent.playlistinfo.metadata.artist.musicbrainz = {};
						}
						if (parent.playlistinfo.musicbrainz.artistid == "") {
							debug.log(medebug,parent.index,"Artist asked to populate but no MBID, trying again in 2 seonds");
							setTimeout(self.artist.populate, 2000);
							return;
						}
						if (parent.playlistinfo.musicbrainz.artistid === null) {
							debug.fail(medebug,parent.index,"Artist asked to populate but no MBID could be found. Aborting");
							parent.playlistinfo.metadata.artist.musicbrainz.artist = {error: language.gettext("musicbrainz_noartist")};
							parent.updateData({ metadata:
										{ artist:
											{
												wikipedia: { artistlink: null,
												},
											  	discogs: {  artistlink: null,
											  	}
											}
										}
									}, null);
							self.artist.doBrowserUpdate();
							return;
						}
						if (parent.playlistinfo.metadata.artist.musicbrainz.artist === undefined &&
							parent.playlistinfo.metadata.artist.musicbrainz[parent.playlistinfo.musicbrainz.artistid] === undefined) {
							debug.mark(medebug,parent.index,"artist is populating",parent.playlistinfo.musicbrainz.artistid);
							musicbrainz.artist.getInfo(parent.playlistinfo.musicbrainz.artistid, self.artist.mbResponseHandler, self.artist.mbResponseHandler);
						} else {
							debug.mark(medebug,parent.index,"artist is already populated",parent.playlistinfo.musicbrainz.artistid);
						}
					},

					mbResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got artist data for",parent.playlistinfo.musicbrainz.artistid,data);
						// Look for the information that other plugins need
						var update = 	{ metadata:
										{ artist:
											{
												disambiguation: null,
												wikipedia: { artistlink: null,
												},
											  	discogs: {  artistlink: null,
											  	}
											}
										}
									};
						if (data) {
							if (data.error) {
								parent.playlistinfo.metadata.artist.musicbrainz.artist = data;
							} else {
								parent.playlistinfo.metadata.artist.musicbrainz[parent.playlistinfo.musicbrainz.artistid] = data;
								var wikilinks = { user: null, english: null, anything: null };
								debug.log(medebug,parent.index,"wikipedia language is",wikipedia.getLanguage());

								var domain = '^http://'+wikipedia.getLanguage();
								var re = new RegExp(domain);
								for (var i in data.relations) {
									if (data.relations[i].type == "wikipedia") {
										debug.mark(medebug,parent.index,"has found a Wikipedia artist link",data.relations[i].url.resource);
										// For wikipedia links we need to prioritise:
										// user's chosen domain first
										// english second
										// followed by anything will do
										// the php side will also try to use the link we choose to get language links for the
										// user's chosen language, but it's definitely best if we prioritise them here
										var wikitemp = data.relations[i].url.resource;
										if (re.test(wikitemp)) {
											debug.log(medebug,parent.index,"found user domain wiki link");
											wikilinks.user = wikitemp;
										} else if (wikitemp.match(/en.wikipedia.org/)) {
											debug.log(medebug,parent.index,"found english domain wiki link");
											wikilinks.english = wikitemp;
										} else {
											debug.log(medebug,parent.index,"found wiki link");
											wikilinks.anything = wikitemp;
										}
									}
									if (data.relations[i].type == "discogs" && update.metadata.artist.discogs.artistlink == null) {
										debug.mark(medebug,parent.index,"has found a Discogs artist link",data.relations[i].url.resource);
										update.metadata.artist.discogs.artistlink = data.relations[i].url.resource;
									}
								}
								if (update.metadata.artist.wikipedia.artistlink == null) {
									if (wikilinks.user) {
										debug.log(medebug,parent.index,"using user domain wiki link",wikilinks.user);
										update.metadata.artist.wikipedia.artistlink = wikilinks.user;
									} else if (wikilinks.english) {
										debug.log(medebug,parent.index,"using english domain wiki link",wikilinks.english);
										update.metadata.artist.wikipedia.artistlink = wikilinks.english;
									} else if (wikilinks.anything) {
										debug.log(medebug,parent.index,"using any old domain wiki link",wikilinks.anything);
										update.metadata.artist.wikipedia.artistlink = wikilinks.anything;
									}

								}
								if (data.disambiguation) {
									update.metadata.artist.disambiguation = data.disambiguation;
								}
							}
						} else {
							parent.playlistinfo.metadata.artist.musicbrainz.artist = {error: language.gettext("musicbrainz_noinfo")};
						}

						parent.updateData(update, null);
						self.artist.doBrowserUpdate();

					},

					extraResponseHandler: function(data) {
						if (data) {
							debug.log(medebug,parent.index,"got extra artist data for",data.id,data);
							parent.playlistinfo.metadata.artist.musicbrainz[data.id] = data;
							putArtistData(parent.playlistinfo.metadata.artist.musicbrainz[data.id], data.id);
						}

					},

					releaseResponseHandler: function(data) {
						if (data) {
							debug.log(medebug,parent.index,"got release data for",data.id,data);
							parent.playlistinfo.metadata.artist.musicbrainz[data.id] = data;
							putArtistReleases(parent.playlistinfo.metadata.artist.musicbrainz[data.id], data.id);
						}

					},

					doBrowserUpdate: function() {
						if (displaying) {
							debug.mark(medebug,parent.index," artist was asked to display");
							if (parent.playlistinfo.metadata.artist.musicbrainz.artist !== undefined && parent.playlistinfo.metadata.artist.musicbrainz.artist.error) {
								browser.Update('artist',
									me,
									parent.index,
									{
										name: parent.playlistinfo.creator,
										link: "",
										data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.musicbrainz.artist.error+'</h3>'
									}
								);
							} else if (parent.playlistinfo.metadata.artist.musicbrainz[parent.playlistinfo.musicbrainz.artistid] !== undefined) {
								browser.Update('artist',
									me,
									parent.index,
									{
										name: parent.playlistinfo.metadata.artist.musicbrainz[parent.playlistinfo.musicbrainz.artistid].name,
										link: 'http://musicbrainz.org/artist/'+parent.playlistinfo.musicbrainz.artistid,
										data: getArtistHTML(parent.playlistinfo.metadata.artist.musicbrainz[parent.playlistinfo.musicbrainz.artistid], false)
									}
								);
							}
						}
					},

				}

			}();

			this.album = function() {

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.album.musicbrainz === undefined) {
							parent.playlistinfo.metadata.album.musicbrainz = {};
						}
						if (parent.playlistinfo.metadata.album.musicbrainz.album === undefined) {
							if (parent.playlistinfo.type == "stream") {
								debug.mark(medebug,parent.index,"Not bothering to update album info as it's a radio station");
								parent.playlistinfo.metadata.album.musicbrainz.album = {error: '('+language.gettext("label_internet_radio")+')'};
								parent.updateData({
								            musicbrainz: { album_releasegroupid: null },
											metadata:
											{ album:
												{
													wikipedia: { albumlink: null },
												  	discogs: {  albumlink: null }
												}
											}
										}, null);
								self.album.doBrowserUpdate();
								return;
							}
							if (parent.playlistinfo.musicbrainz.albumid == "") {
								debug.log(medebug,parent.index,"Album asked to populate but no MBID, trying again in 2 seonds");
								setTimeout(self.album.populate, 2000);
								return;
							}
							if (parent.playlistinfo.musicbrainz.albumid === null) {
								debug.fail(medebug,parent.index,"Album asked to populate but no MBID could be found. Shit.");
								parent.playlistinfo.metadata.album.musicbrainz.album = {error: language.gettext("musicbrainz_noalbum")};
								parent.updateData({
								            musicbrainz: { album_releasegroupid: null },
											metadata:
											{ album:
												{
													wikipedia: { albumlink: null },
												  	discogs: {  albumlink: null }
												}
											}
										}, null);
								self.album.doBrowserUpdate();
								return;
							}
							debug.mark(medebug,parent.index,"album is populating",parent.playlistinfo.musicbrainz.albumid);
							musicbrainz.album.getInfo(
								parent.playlistinfo.musicbrainz.albumid,
								self.album.mbResponseHandler,
								self.album.mbResponseHandler
							);
						} else {
							debug.mark(medebug,parent.index,"album is already populated",parent.playlistinfo.musicbrainz.albumid);
						}
					},

					mbResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got album data for",parent.playlistinfo.musicbrainz.albumid);
						// Look for the information that other plugins need
						var update = 	{
							            musicbrainz: { album_releasegroupid: null },
										metadata:
										{ album:
											{
												wikipedia: { albumlink: null },
											  	discogs: {  albumlink: null }
											}
										}
									};
						if (data) {

							parent.playlistinfo.metadata.album.musicbrainz.album = data;
							var wikilinks = { user: null, english: null, anything: null };
							debug.log(medebug,parent.index,"wikipedia language is",wikipedia.getLanguage());

							var domain = '^http://'+wikipedia.getLanguage();
							var re = new RegExp(domain);
							for (var i in data.relations) {
								if (data.relations[i].type == "wikipedia" && update.metadata.album.wikipedia.albumlink === null) {
									debug.mark(medebug,parent.index,"has found a Wikipedia album link",data.relations[i].url.resource);
									var wikitemp = data.relations[i].url.resource;
									if (re.test(wikitemp)) {
										debug.log(medebug,parent.index,"found user domain wiki link");
										wikilinks.user = wikitemp;
									} else if (wikitemp.match(/en.wikipedia.org/)) {
										debug.log(medebug,parent.index,"found english domain wiki link");
										wikilinks.english = wikitemp;
									} else {
										debug.log(medebug,parent.index,"found wiki link");
										wikilinks.anything = wikitemp;
									}
								}
								if (data.relations[i].type == "discogs" && update.metadata.album.discogs.albumlink === null) {
									debug.mark(medebug,parent.index,"has found a Discogs album link",data.relations[i].url.resource);
									update.metadata.album.discogs.albumlink = data.relations[i].url.resource;
								}
							}
							if (update.metadata.album.wikipedia.albumlink == null) {
								if (wikilinks.user) {
									debug.log(medebug,parent.index,"using user domain wiki link",wikilinks.user);
									update.metadata.album.wikipedia.albumlink = wikilinks.user;
								} else if (wikilinks.english) {
									debug.log(medebug,parent.index,"using english domain wiki link",wikilinks.english);
									update.metadata.album.wikipedia.albumlink = wikilinks.english;
								} else if (wikilinks.anything) {
									debug.log(medebug,parent.index,"using any old domain wiki link",wikilinks.anything);
									update.metadata.album.wikipedia.albumlink = wikilinks.anything;
								}

							}

							if (data['release-group']) {
								update.musicbrainz.album_releasegroupid = data['release-group'].id;
							}
						} else {
							parent.playlistinfo.metadata.album.musicbrainz.album = {error: language.gettext("musicbrainz_noinfo")};
						}
						parent.updateData(update,null);
						self.album.doBrowserUpdate();
					},

					coverResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got Cover Art Data",data);
						parent.updateData({
										metadata:
										{ album:
											{
												musicbrainz: { coverart: data },
											}
										}
									});
						if (displaying) {
							$("#coverart").html(getCoverHTML(parent.playlistinfo.metadata.album.musicbrainz.coverart));
						}
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.album.musicbrainz.album !== undefined) {
							debug.mark(medebug,parent.index,"album was asked to display");
							if (parent.playlistinfo.metadata.album.musicbrainz.album.error) {
								browser.Update('album',
									me,
									parent.index,
									{
										name: parent.playlistinfo.album,
										link: "",
										data: '<h3 align="center">'+parent.playlistinfo.metadata.album.musicbrainz.album.error+'</h3>'
									}
								);
							} else {
								browser.Update('album',
									me,
									parent.index,
									{
										name: parent.playlistinfo.metadata.album.musicbrainz.album.title,
										link: 'http://musicbrainz.org/release/'+parent.playlistinfo.metadata.album.musicbrainz.album.id,
										data: html = getAlbumHTML(parent.playlistinfo.metadata.album.musicbrainz.album)
									}
								);
							}
						}
					}
				}

			}();

			this.track = function() {

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.track.musicbrainz === undefined) {
							parent.playlistinfo.metadata.track.musicbrainz = {};
						}
						if (parent.playlistinfo.metadata.track.musicbrainz.track === undefined) {
							if (parent.playlistinfo.musicbrainz.trackid == "") {
								debug.log(medebug,parent.index,"Track asked to populate but no MBID, trying again in 2 seonds");
								setTimeout(self.track.populate, 2000);
								return;
							}
							if (parent.playlistinfo.musicbrainz.trackid === null) {
								debug.fail(medebug,parent.index,"Track asked to populate but no MBID could be found..");
								parent.playlistinfo.metadata.track.musicbrainz.track = {};
				 				parent.playlistinfo.metadata.track.musicbrainz.track.error = {error: language.gettext("musicbrainz_notrack")};
								parent.updateData({
											metadata:
											{ track:
												{
													wikipedia: { tracklink: null },
												  	discogs: {  tracklink: null }
												}
											}
										}, null);
								self.track.doBrowserUpdate();
								return;
							}
							debug.mark(medebug,parent.index,"track is populating",parent.playlistinfo.musicbrainz.trackid);
							musicbrainz.track.getInfo(parent.playlistinfo.musicbrainz.trackid, self.track.mbResponseHandler, self.track.mbResponseHandler);
						} else {
							debug.mark(medebug,parent.index,"track is already populated",parent.playlistinfo.musicbrainz.trackid);
						}
					},

					mbResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got track data for",parent.playlistinfo.musicbrainz.trackid,data);
						// Look for the information that other plugins need
						var update = 	{
										metadata:
										{ track:
											{
												wikipedia: { tracklink: null },
											  	discogs: {  tracklink: null }
											}
										}
									};
						if (data) {
							if (data.error) {
								parent.playlistinfo.metadata.track.musicbrainz.track.error = data;
							} else {
								parent.playlistinfo.metadata.track.musicbrainz.track = data;
								if (data.recording) {
									for (var i in data.recording.relations) {
										if (data.recording.relations[i].type == "wikipedia" && update.metadata.track.wikipedia.tracklink === null) {
											debug.mark(medebug,parent.index,"has found a Wikipedia track link!!!!!",data.recording.relations[i].url.resource);
											//var wikitemp = data.relations[i].url.resource;
											//if (wikitemp.match(/en.wikipedia.org/)) {
												update.metadata.track.wikipedia.tracklink = data.recording.relations[i].url.resource;
											//}
										}
										if (data.recording.relations[i].type == "discogs" && update.metadata.track.discogs.tracklink === null) {
											debug.mark(medebug,parent.index,"has found a Discogs track link!!!!!",data.recording.relations[i].url.resource);
											update.metadata.track.discogs.tracklink = data.recording.relations[i].url.resource;
										}
									}
								}
								if (data.work) {
									for (var i in data.work.relations) {
										if (data.work.relations[i].type == "wikipedia" && update.metadata.track.wikipedia.tracklink === null) {
											debug.mark(medebug,parent.index,"has found a Wikipedia track link!!!!!",data.work.relations[i].url.resource);
											update.metadata.track.wikipedia.tracklink = data.work.relations[i].url.resource;
										}
										if (data.work.relations[i].type == "discogs" && update.metadata.track.discogs.tracklink === null) {
											debug.mark(medebug,parent.index,"has found a Discogs track link!!!!!",data.work.relations[i].url.resource);
											update.metadata.track.discogs.tracklink = data.work.relations[i].url.resource;
										}
									}
								}
							}
						} else {
							parent.playlistinfo.metadata.track.musicbrainz.track.error = {error: language.gettext("musicbrainz_noinfo")};
						}
						parent.updateData(update,null);
						self.track.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.track.musicbrainz.track !== undefined &&
								(parent.playlistinfo.metadata.track.musicbrainz.track.error !== undefined ||
								parent.playlistinfo.metadata.track.musicbrainz.track.recording !== undefined ||
								parent.playlistinfo.metadata.track.musicbrainz.track.work !== undefined)) {
							debug.mark(medebug,parent.index,"track was asked to display");
							var link = null;
							if (parent.playlistinfo.metadata.track.musicbrainz.track.recording) {
								link = 'http://musicbrainz.org/recording/'+parent.playlistinfo.metadata.track.musicbrainz.track.recording.id;
							}
							browser.Update('track', me, parent.index, {	name: parent.playlistinfo.title,
																	link: link,
																	data: getTrackHTML(parent.playlistinfo.metadata.track.musicbrainz.track)
																}
							);
						}
					}
				}

			}();

			self.artist.populate();
			self.album.populate();
			self.track.populate();
		}
	}

}();

nowplaying.registerPlugin("musicbrainz", info_musicbrainz, "newimages/musicbrainz_logo.png", "button_musicbrainz");
