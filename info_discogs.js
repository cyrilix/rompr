var info_discogs = function() {

	var me = "discogs";
	var medebug = 'DISCOGS PLUGIN';
	debug.setcolour(medebug, '#1133ff');

	function getURLs(urls) {
		var html = "";
		for (var i in urls) {
			if (urls[i] != "") {
				var u = urls[i];
				var d = u.match(/https*:\/\/(.*?)(\/|$)/);
				if (u.match(/wikipedia/i)) {
					html = html + '<li><img src="newimages/Wikipedia-logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Wikipedia ('+d[1]+')</a></li>';
				} else if (u.match(/facebook/i)) {
					html = html + '<li><img src="newimages/facebook-logo.png" class="menu padright wibble"><a href="'+u+'" target="_blank">Facebook</a></li>';
				} else {
					html = html + '<li><img src="newimages/transparent-32x32.png" class="menu padright wibble"><a href="'+u+'" target="_blank">'+d[1]+'</a></li>';
				}
			}
		}
		return html;
	}

	function getPrimaryImage(images, size) {
		for (var i in images) {
			if (images[i].type == "primary") {
				return images[i][size];
			}
		}
		if (images.length > 0) {
			return images[0][size];
		}
	}

	function formatNotes(p) {
        p = p.replace(/\n/g, '<br>');
        p = p.replace(/\[a(\d+?)\]/g, '<span name="$1">$1</span>');
        p = p.replace(/\[a=(.+?)\]/g, '<a href="http://www.discogs.com/artist/$1" target="_blank">$1</a>');
        p = p.replace(/\[l=(.+?)\]/g, '$1');
        p = p.replace(/\[m(\d+?)\]/g, '<a href="http://www.discogs.com/master/$1" target="_blank"><i>External Link</i></a>');
        p = p.replace(/\[url=(.+?)\](.+?)\[\/url\]/g, '<a href="$1" target="_blank">$2</a>');
        p = p.replace(/\[b\]/g, '<b>');
        p = p.replace(/\[\/b\]/g, '</b>');
        p = p.replace(/\[i\]/g, '<i>');
        p = p.replace(/\[\/i\]/g, '</i>');
        return p;
	}

	function prepareForSearch(term) {
		term = term.replace(/, The$/i, '');
		term = term.replace(/^The /i, '');
		term = term.replace(/ &/,'');
		term = term.replace(/ and/i,'');
		return encodeURIComponent(term);
	}

	function sanitizeDiscogsResult(name) {
		debug.debug(medebug,"Sanitising",name);
		name = decodeURIComponent(name);
		name = name.replace(/\* /,' ');
		name = name.replace(/\(\d+\)/,'');
		name = name.replace(/\, The/i, '');
		name = name.replace(/^The /i, '');
		name = name.replace(/ & /i, ' and ');
		var numbers = {one:"1", two:"2", three:"3", four:"4", five:"5", six:"6", seven:"7", eight:"8", nine:"9"};
		for (var val in numbers) {
    		name = name.replace(new RegExp(val, "ig"), numbers[val]);
    	}
		name = name.replace(/\s+$/,'');
		debug.debug(medebug,"  ... Sanitised",name.toLowerCase());
		return name.toLowerCase();
	}

	function getReleaseHTML(data) {
		var html = "";
		debug.debug(medebug,"Generating release HTML for",data.id);
		if (data.data.releases.length > 0) {
        	html = html + '<div class="mbbox clearfix"><span style="float:right">PAGES: ';
        	for (var i = 1; i <= data.data.pagination.pages; i++) {
        		if (i == data.data.pagination.page) {
        			html = html + " <b>"+i+"</b>";
        		} else {
        			var a = data.data.pagination.urls.last || data.data.pagination.urls.first;
        			var b = a.match(/artists\/(\d+)\/releases/);
        			if (b && b[1]) {
        				html = html + ' <a href="#" class="infoclick clickreleasepage" name="'+b[1]+'">'+i+'</a>';
        			}
        		}
        	}
        	html = html + '</span></div>';
        	html = html + '<div class="mbbox"><table class="padded" width="100%">';
        	html = html + '<tr><th></th><th>YEAR</th><th>TITLE</th><th>ARTIST</th><th>TYPE</th><th>LABEL</th></tr>'
        	for (var i in data.data.releases) {
        		if (data.data.releases[i].thumb) {
        			html = html + '<tr><td><img width="64px" src="'+data.data.releases[i].thumb+'" /></td>';
        		} else {
        			html = html + '<tr><td></td>';
        		}
        		if (data.data.releases[i].year) {
        			html = html + '<td>'+data.data.releases[i].year+'</td>';
        		} else {
        			html = html + '<td></td>';
        		}
        		if (data.data.releases[i].title) {
        			html = html + '<td><a href="#" class="infoclick clickgetdiscstuff" target="_blank">'+
        							data.data.releases[i].title+
        							'</a><input type="hidden" value="'+data.data.releases[i].resource_url+'" />';
        			if (data.data.releases[i].role && data.data.releases[i].role != 'Main') {
        				var r = data.data.releases[i].role;
        				r = r.replace(/([a-z])([A-Z])/, '$1 $2');
        				html = html + '<br>(<i>'+r+'</i>)'
        			}
        			if (data.data.releases[i].trackinfo) {
        				html = html + '<br>(<i>'+data.data.releases[i].trackinfo+'</i>)'
        			}
        			html = html + '</td>';
        		} else {
        			html = html + '<td></td>';
        		}
        		if (data.data.releases[i].artist) {
        			html = html + '<td>'+data.data.releases[i].artist+'</td>';
        		} else {
        			html = html + '<td></td>';
        		}
        		if (data.data.releases[i].format) {
        			html = html + '<td>'+data.data.releases[i].format+'</td>';
        		} else {
        			html = html + '<td></td>';
        		}
        		if (data.data.releases[i].label) {
        			html = html + '<td>'+data.data.releases[i].label+'</td>';
        		} else {
        			html = html + '<td></td>';
        		}
        		html = html + '</tr>';
        	}
        	html = html + '</table></div>';
        	html = html + '<div class="mbbox clearfix"><span style="float:right">PAGES: ';
        	for (var i = 1; i <= data.data.pagination.pages; i++) {
        		if (i == data.data.pagination.page) {
        			html = html + " <b>"+i+"</b>";
        		} else {
        			var a = data.data.pagination.urls.last || data.data.pagination.urls.first;
        			var b = a.match(/artists\/(\d+)\/releases/);
        			if (b && b[1]) {
        				html = html + ' <a href="#" class="infoclick clickreleasepage" name="'+b[1]+'">'+i+'</a>';
        			}
        		}
        	}
        	html = html + '</span></div>';
		}
		debug.debug(medebug,"Returning release HTML for",data.id);
		return html;
	}

	function getAlbumHTML(data) {
		debug.debug(medebug,"Creating HTML from release/master data",data);

		if (data.error && data.master === undefined && data.release === undefined) {
			return '<h3 align="center">'+data.error.error+'</h3>';
		}

        var html = '<div class="containerbox">';
        html = html + '<div class="fixed bright">';
		if (data.release) {
			html = html + getStyles(data.release.data.styles);
		} else {
			html = html + getStyles(data.master.data.styles);
		}
		if (data.release) {
			html = html + getGenres(data.release.data.genres);
		} else {
			html = html + getGenres(data.master.data.genres);
		}

		if (data.release) {
			html = html + '<br><ul><li><b>COMPANIES</b></li>';
			for (var i in data.release.data.companies) {
				html = html + '<li>'+data.release.data.companies[i].entity_type_name+
							" "+data.release.data.companies[i].name+'</li>';

			}
			html = html + '</ul>';
		}

		html = html + '</div>';

        html = html + '<div class="expand stumpy">';

        if (data.master && data.master.data.notes) {
        	var n = data.master.data.notes;
        	n = n.replace(/\n/g, '<br>');
        	html = html + '<p>'+n+'</p>';
        }

        if (data.release && data.release.data.notes) {
        	var n = formatNotes(data.release.data.notes);
        	html = html + '<p>'+n+'</p>';
        }

        if (data.release && data.release.data.extraartists && data.release.data.extraartists.length > 0) {
			html = html + '<div class="mbbox underline"><b>PERSONNEL</b></div>';
			for (var i in data.release.data.extraartists) {
				html = html + '<div class="mbbox"><b>'+data.release.data.extraartists[i].name+
							'</b> - '+data.release.data.extraartists[i].role+'</div>';
			}
		}

		if (data.release) {
			html = html + getTracklist(data.release.data.tracklist)
		} else {
			html = html + getTracklist(data.master.data.tracklist)
		}

		if (mobile == "no" && data.release && data.release.data.videos) {
			html = html + doVideos(data.release.data.videos);
		} else if (mobile == "no" && data.master && data.master.data.videos) {
			html = html + doVideos(data.master.data.videos);
		}

		html = html + '</div>';
		var images = new Array();
		if (data.release) {
			images = data.release.data.images;
		}
		if (data.master && data.master.data.images) {
			for(var i in data.master.data.images) {
				images.push(data.master.data.images[i]);
			}
		}

		if (images.length > 0) {
	        html = html + '<div class="cleft fixed">';
	        for (var i in images) {
		        html = html + '<div class="infoclick clickzoomimage"><img style="margin:1em" src="'+images[i].uri150+'" /></div>';
		        html = html + '<input type="hidden" value="getDiscogsImage.php?url='+images[i].uri+'" />';
	        }
	        html = html + '</div>';
		}
		html = html + '</div>';
		return html;
	}

	function doVideos(videos) {
		var html = '<div class="mbbox underline"><b>VIDEOS</b></div>';
		for (var i in videos) {
			var u = videos[i].uri;
			if (videos[i].embed == true && u.match(/youtube\.com/)) {
				var d = u.match(/http:\/\/www\.youtube\.com\/watch\?v=(.+)$/);
				if (d && d[1]) {
					html = html + '<div class="video"><object width="640" height="385"><param name="movie" value="http://www.youtube.com/v/'+
								d[1]+'?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'+
								d[1]+'?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object></div>';
				}

			}
		}
		return html;
	}

	function getStyles(styles) {
		var html = '<br><ul><li><b>STYLES</b></li>';
		for (var i in styles) {
			html = html + '<li>'+styles[i]+'</li>';
		}
		html = html + '</ul>';
		return html;
	}

	function getGenres(genres) {
		var html = '<br><ul><li><b>GENRES</b></li>';
		for (var i in genres) {
			html = html + '<li>'+genres[i]+'</li>';
		}
		html = html + '</ul>';
		return html;
	}

	function getTracklist(tracks) {
		var html = '<div class="mbbox underline"><b>TRACK LISTING</b></div><div class="mbbox"><table class="padded">';
		for (var i in tracks) {
			if (tracks[i].position == "") {
				html = html + '<tr><th colspan="3">'+tracks[i].title+'</th></tr>';
			} else {
				html = html + '<tr><td>'+tracks[i].position+'</td>';
				html = html + '<td><b>'+tracks[i].title+'</b>';
				if (tracks[i].artists && tracks[i].artists.length > 0) {
					html = html + '<br><i>';
					var jp = "";
					for (var k in tracks[i].artists) {
						if (jp != "") {
							html = html + " "+jp+" ";
						}
						html = html + tracks[i].artists[k].name;
						jp = tracks[i].artists[k].join;
					}
					html = html + '</i>';
				}

				if (tracks[i].extraartists) {
					for (var j in tracks[i].extraartists) {
						html = html + '<br><i>'+tracks[i].extraartists[j].role+
									' - '+tracks[i].extraartists[j].name+'</i>';
					}
				}
				html = html + '</td>';
				html = html + '<td>'+tracks[i].duration+'</td></tr>';
			}
		}
		html = html + '</table></div>';
		return html;
	}

	return {
		getRequirements: function(parent) {
			return ["musicbrainz"];
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

			this.stopDisplaying = function(waitingon) {
				displaying = false;
				pauseAllSlideShows();
			}

			this.handleClick = function(source, element, event) {
				debug.log(medebug,parent.index,source,"is handling a click event");
				if (element.hasClass('clickdoartist')) {
					var targetdiv = element.parent().next();
					if (!(targetdiv.hasClass('full')) && element.isClosed()) {
						doSomethingUseful(targetdiv, 'Getting Data');
	        			targetdiv.slideToggle('fast');
						getArtistData(element.attr('name'));
	        			element.toggleOpen();
	        			targetdiv.addClass('underline');
					} else {
						var id = element.attr('name');
		        		if (element.isOpen()) {
		        			element.toggleClosed();
		        			targetdiv.find('.thumbslideshow').each(function() {
		        				parent.playlistinfo.metadata.artist.discogs[$(this).attr('id')].pause();
		        			});
		        			targetdiv.removeClass('underline');
		        		} else {
		        			element.toggleOpen();
		        			targetdiv.find('.thumbslideshow').each(function() {
		        				parent.playlistinfo.metadata.artist.discogs[$(this).attr('id')].Go();
		        			});
		        			targetdiv.addClass('underline');
		        		}
		        		targetdiv.slideToggle('fast');
					}
				} else if (element.hasClass('clickreleasepage')) {
					var targetdiv = element.parent().parent().parent().attr("name");
					element.parent().parent().parent().addClass("expectingpage_"+element.text());
					doSomethingUseful(element.parent().parent(), "Getting Data...");
					getArtistReleases(element.attr('name'), element.text());
				} else if (element.hasClass('clickdodiscography')) {
					var targetdiv = element.parent().next();
					if (!(targetdiv.hasClass('full')) && element.isClosed()) {
						doSomethingUseful(targetdiv, 'Getting Data');
						targetdiv.addClass("expectingpage_1");
	        			getArtistReleases(element.attr('name'), 1);
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
		        } else if (element.hasClass('clickzoomimage')) {
					imagePopup.create(element, event, element.next().val());
				} else if (element.hasClass('clickgetdiscstuff')) {
					var link = element.next().val();
					var b = link.match(/(releases\/\d+)|(masters\/\d+)/);
					if (b && b[0]) {
						discogs.album.getInfo('', b[0],
							function(data) {
								if (data.data.uri) {
									window.open(data.data.uri, '_blank');
								}
							},
							function(data) {
								infobar.notify(infobar.ERROR, "Could not find link!");
							}
						);
					}
				} else if (element.hasClass('clickexpandbox')) {
					var id = element.attr('name');
					clearAllSlideShows();
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
											name: parent.playlistinfo.metadata.artist.discogs['artist_'+id].data.name,
											link: null,
											data: content
										}
									);
									animator.remove();
									startAllSlideshows();
								}
							);
						}
					);
				} else if (element.hasClass('clickzoomslides')) {

					var n = element.attr("name");
		        	var img = new Array();
			        for (var i in parent.playlistinfo.metadata.artist.discogs['artist_'+n].data.images) {
				        img.push('getDiscogsImage.php?url='+parent.playlistinfo.metadata.artist.discogs['artist_'+n].data.images[i].uri);
			        }
	    			clearAllSlideShows();
			        var expandingframe = element.parent().prev();
			        var animator = expandingframe.clone();
			        animator.attr('id', 'slideshow_'+n+'_big');
			        animator.find('img').remove();
			        var pos = expandingframe.offset();
			        var targetpos = $("#infopane").offset();
			        animator.css(
			        	{
			        		position: 'absolute',
			        		top: pos.top+"px",
			        		left: pos.left+"px",
			        		width: expandingframe.width()+"px",
			        		height: expandingframe.height()+"px",
			        		margin: "0px",
			        		padding: "0px"
			    		}
			    	);
			    	animator.appendTo($('body'));
			    	animator.animate(
			    		{
			    			top: (targetpos.top - $("#artistinformation").children('.infosection').height())+"px",
			    			left: targetpos.left+"px",
			    			width: ($("#infopane").width()-sbWidth)+"px",
			    			height: ($("#infopane").height() - $("#artistinformation").children('.infosection').height())+"px"
			    		},
			    		'fast',
			    		'swing',
			    		function() {
			    			$("#artistinformation").empty();
			    			animator.detach().appendTo($("#artistinformation"));
			    			animator.css({position: 'relative', top: 0, left: 0, width: "100%"});
							browser.speciaUpdate(
								me,
								'artist',
								{
									name: "Slideshow - "+parent.playlistinfo.metadata.artist.discogs['artist_'+n].data.name,
									link: null,
									data: $("#artistinformation").html()
								}
							);
					        if (parent.playlistinfo.metadata.artist.discogs['slideshow_'+n+'_big'] === undefined) {
					        	parent.playlistinfo.metadata.artist.discogs['slideshow_'+n+'_big'] = new slideshow(img, "slideshow_"+n+'_big', true);
					        }
							animator.remove();
							startAllSlideshows();

			    		}
			    	);
				}
			}

			function getArtistData(id) {
				debug.mark(medebug,parent.index,"Getting data for artist with ID",id);
				if (parent.playlistinfo.metadata.artist.discogs['artist_'+id] === undefined) {
					debug.log(medebug,parent.index," ... retrieivng data");
					discogs.artist.getInfo(
						'artist_'+id,
						id,
						self.artist.extraResponseHandler,
						self.artist.extraResponseHandler
					);
				} else {
					debug.log(medebug,parent.index," ... displaying what we've already got");
					putArtistData(parent.playlistinfo.metadata.artist.discogs['artist_'+id], "artist_"+id);
				}
			}

			function putArtistData(data, div) {
				var html = getArtistHTML(data, true);
				$('div[name="'+div+'"]').each(function() {
					if (!$(this).hasClass('full')) {
						$(this).html(html);
						$(this).addClass('full');
					}
					if (!($(this).is(':hidden'))) {
						debug.debug("Finding Slideshows in",div);
						$(this).find('.thumbslideshow').each(function() {
    						parent.playlistinfo.metadata.artist.discogs[$(this).attr('id')].Go();
    					});
					}
				});
			}

			function getArtistReleases(name, page) {
				debug.mark(medebug,parent.index,"Looking for release info for",name,"page",page);
				if (parent.playlistinfo.metadata.artist.discogs['discography_'+name+"_"+page] === undefined) {
					debug.log(medebug,"  ... retreiving them");
					discogs.artist.getReleases(
						name,
						page,
						'discography_'+name,
						self.artist.releaseResponseHandler,
						self.artist.releaseResponseHandler
					);
				} else {
					debug.log(medebug,"  ... displaying what we've already got",parent.playlistinfo.metadata.artist.discogs['discography_'+name+"_"+page]);
					putArtistReleases(parent.playlistinfo.metadata.artist.discogs['discography_'+name+"_"+page], 'discography_'+name);
				}
			}

			function putArtistReleases(data, div) {
				var html = getReleaseHTML(data);
				$('div[name="'+div+'"]').each(function() {
					if ($(this).hasClass('expectingpage_'+data.data.pagination.page)) {
						$(this).html(html);
						$(this).addClass('full');
						$(this).removeClass('expectingpage_'+data.data.pagination.page);
					}
				});
			}

			function getArtistHTML(data, expand) {
				if (data.error) {
					return '<h3 align="center">'+data.error+'</h3>';
				}
				debug.debug(medebug, "Creating Artist HTML",data);
		        var html = '<div class="containerbox">';
		        html = html + '<div class="fixed bright">';

		        if (data.data.images) {
		        	var img = new Array();
			        for (var i in data.data.images) {
				        img.push(data.data.images[i].uri150);
			        }
			        var a = 1;
			        while ($("#slideshow_"+data.data.id+"_"+a).length > 0) {
			        	a++;
			        }
			        html = html + '<div class="infoslideshow thumbslideshow" id="slideshow_'+data.data.id+'_'+a+'"></div>';
			        html = html + '<div class="infoslideshow thumbcontroller clearfix"><img class="tright infoclick clickzoomslides" name="'+data.data.id+'" height="16px" src="newimages/expand.png" /></div>';
			        if (parent.playlistinfo.metadata.artist.discogs['slideshow_'+data.data.id+'_'+a] === undefined) {
			        	parent.playlistinfo.metadata.artist.discogs['slideshow_'+data.data.id+'_'+a] = new slideshow(img, "slideshow_"+data.data.id+'_'+a, false);
			        }
			    }

			    if (data.data.realname && data.data.realname != "") {
			        html = html + '<br><ul><li><b>REAL NAME:</b> '+data.data.realname+'</li>';
			    }

		        if (data.data.aliases && data.data.aliases.length > 0) {
			        html = html + '<br><ul><li><b>ALIASES:</b></li>';
			        for (var i in data.data.aliases) {
			        	html = html + '<li>'+data.data.aliases[i].name+'</li>';
			        }
			        html = html + '</ul>';
			    }

		        if (data.data.namevariations && data.data.namevariations.length > 0) {
			        html = html + '<br><ul><li><b>ALSO KNOWN AS:</b></li>';
			        for (var i in data.data.namevariations) {
			        	html = html + '<li>'+data.data.namevariations[i]+'</li>';
			        }
			        html = html + '</ul>';
			    }

		        if (data.data.urls && data.data.urls.length > 0) {
			        html = html + '<br><ul><li><b>EXTERNAL LINKS:</b></li>';
			        html = html + getURLs(data.data.urls);
			        html = html + '</ul>';
			    }
			    html = html + '</div>';

		        html = html + '<div class="expand stumpy">';
		        html = html + '<div class="holdingcell">';
		        if (expand) {
					html = html + '<img class="clickexpandbox infoclick tleft" style="margin:1em" src="newimages/expand-up.png" height="16px" name="'+data.data.id+'">';
				}

		        if (data.data.images) {
					html = html + '<div class="infoclick clickzoomimage stright standout"><img width="250px" src="getDiscogsImage.php?url='+
								getPrimaryImage(data.data.images, 'uri')+'" /></div>';
					html = html + '<input type="hidden" value="getDiscogsImage.php?url='+getPrimaryImage(data.data.images, 'uri')+'" />';
			    }

		        if (data.data.profile) {
			        var p = formatNotes(data.data.profile);

			        // Discogs profiles come with a bunch of references to other artists formatted as [a123456]
			        // (where 123456 is the discogs artist id). formatNotes replaces these with spans so we can
			        // get the arist bio and update the displayed items without having to resort to replacing
			        // all the html in the div every time.
			        // To avoid getting the artist data every time we display the html, we'll also check to see
			        // if we already have the data and use it now if we do.
			        var m = p.match(/<span name="\d+">/g);
			        if (m) {
			        	for(var i in m) {
			        		var n = m[i].match(/<span name="(\d+)">/);
			        		if (n && n[1]) {
			        			debug.debug(medebug,"Found unpopulated artist reference",n[1]);
								if (parent.playlistinfo.metadata.artist.discogs['artist_'+n[1]] === undefined) {
									debug.debug(medebug,parent.index," ... retrieivng data");
									discogs.artist.getInfo(
										'artist_'+n[1],
										n[1],
										self.artist.extraResponseHandler2,
										self.artist.extraResponseHandler2
									);
								} else {
									debug.debug(medebug,parent.index," ... displaying what we've already got");
									var name = parent.playlistinfo.metadata.artist.discogs['artist_'+n[1]].data.name;
									var link = parent.playlistinfo.metadata.artist.discogs['artist_'+n[1]].data.uri;
									p = p.replace(new RegExp('<span name="'+n[1]+'">'+n[1]+'<\/span>', 'g'), '<a href="'+link+'" target="_blank">'+name+'</a>');
								}
			        		}
			        	}
			        }


			        html = html + '<p>'+p+'</p>';
			    }
			    html = html + '</div>';

			    if (data.data.members && data.data.members.length > 0) {
		        	html = html + '<div class="mbbox underline"><b>BAND MEMBERS</b></div>';
		        	html = html + doMembers(data.data.members);
			    }

			    if (data.data.groups && data.data.groups.length > 0) {
		        	html = html + '<div class="mbbox underline"><b>MEMBER OF</b></div>';
		        	html = html + doMembers(data.data.groups);
			    }

				html = html + '<div class="mbbox underline">';
			    html = html + '<img src="newimages/toggle-closed-new.png" class="menu infoclick clickdodiscography" name="'+data.data.id+'">';
			    html = html + '<b>'+data.data.name.toUpperCase()+' DISCOGRAPHY</b></div>';
			    html = html + '<div name="discography_'+data.data.id+'" class="invisible">';
			    html = html + '</div>';

		        html = html + '</div>';

		        html = html + '</div>';
		        return html;
			}

			function doMembers(members) {
				var html = "";
		    	for (var i in members) {
		    		html = html + '<div class="mbbox">';
        			html = html + '<img src="newimages/toggle-closed-new.png" class="menu infoclick clickdoartist" name="'+members[i].id+'">';
        			var n = members[i].name;
        			n = n.replace(/ \(\d+\)$/, '');
        			html = html + '<b>'+n+'</b>';
        			html = html + '</div>';
	        		html = html + '<div name="artist_'+members[i].id+'" class="invisible"></div>';
		    	}
		    	return html;
		    }

            function getSearchArtist() {
                var a = (parent.playlistinfo.albumartist && parent.playlistinfo.albumartist != "") ? parent.playlistinfo.albumartist : self.artist.name();
                if (a == "Various Artists") {
                	a = "Various";
                }
                return a;
            }

            function startAllSlideshows() {
				$('.thumbslideshow').each(function() {
					if (!($(this).is(':hidden'))) {
						var tostart = $(this).attr("id");
						debug.log(medebug,parent.index,"Starting",tostart);
						parent.playlistinfo.metadata.artist.discogs[tostart].Go()
					}
				});
            }

            function clearAllSlideShows() {
				$('.thumbslideshow').each(function() {
					var tostart = $(this).attr("id");
					debug.log(medebug,parent.index,"Clearing",tostart);
					parent.playlistinfo.metadata.artist.discogs[tostart].teardown()
				});
            }

            function pauseAllSlideShows() {
				for (var i in parent.playlistinfo.metadata.artist.discogs) {
					if (i.match(/^slideshow_/)) {
						parent.playlistinfo.metadata.artist.discogs[i].pause();
					}
				}
			}

			this.artist = function() {

				var retries = 10;

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.artist.discogs === undefined) {
							parent.playlistinfo.metadata.artist.discogs = {};
						}

						// OK so:
						// Discogs doesn't support looking up an artist by name, so we have to search.
						// Discogs' search engine is not very good.
						// We get help from musicbrainz, which can give us a link which we can use as a 'key'
						// to help us match the correct search result. This is far more accurate than any other method.
						// If all else fails, we try a search anyway and try to match on the artist name, which is much less accurate.

						// artistlink is what musicbrainz will try to give us. If it's undefined it means musicbrainz
						//		hasn't yet come up with any sort of answer. If it's null it means musicbrainz failed to find one
						//		or we gave up waiting for musicbrainz.
						// artistid is what we're trying to find. All we have at the initial stage is an artist name.
						//		If it's undefined it means we haven't even looked yet. If it's null it means we looked and failed.
						//		I can't say I remember why I check here to see if it's null, but I do recall there was a reason.

						if (parent.playlistinfo.metadata.artist.discogs.artistinfo === undefined &&
							(parent.playlistinfo.metadata.artist.discogs.artistid === undefined || parent.playlistinfo.metadata.artist.discogs.artistid === null)) {
							if (parent.playlistinfo.metadata.artist.discogs.artistlink === undefined) {
								debug.log(medebug,parent.index,"Artist asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.warn(medebug,parent.index,"Artist giving up waiting for bloody musicbrainz");
									parent.playlistinfo.metadata.artist.discogs.artistlink = null;
									setTimeout(self.artist.populate, 200);
								} else {
									setTimeout(self.artist.populate, 2000);
								}
								return;
							}
							if (parent.playlistinfo.metadata.artist.discogs.artistlink !== null) {
								var a = parent.playlistinfo.metadata.artist.discogs.artistlink;
								var s = a.split('/').pop()
								debug.mark(medebug,parent.index,"Artist asked to populate, using supplied link as basis for search",s);
								discogs.artist.search(
									prepareForSearch(decodeURIComponent(s.replace(/\+/g, ' '))),
									self.artist.diResponseHandler,
									self.artist.diResponseErrorHandler
								);
								return;
							}
							debug.mark(medebug,parent.index,"Artist asked to populate - trying a search");
							discogs.artist.search(
								prepareForSearch(parent.playlistinfo.creator),
								self.artist.parsesearchResponseHandler,
								self.artist.diResponseErrorHandler
							);
						} else {
							debug.mark(medebug,parent.index,"Artist is already populated");
						}
					},

					diResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got artist search data for",parent.playlistinfo.creator,data);
						if (data && data.data) {
							// These are search results, we now need to find the actual artist, which is
							// a lot easier if we have a link supplied by musicbrainz
							parent.playlistinfo.metadata.artist.discogs.artistid = null;
							var a = parent.playlistinfo.metadata.artist.discogs.artistlink;
							var s = a.split('/');
							var l1 = s.pop();
							var l2 = s.pop();
							var lookingfor = '/'+l2+'/'+l1;
							debug.log(medebug,parent.index,"scanning search data for",lookingfor);
							for (var i in data.data.results) {
								if (data.data.results[i].uri == lookingfor) {
									debug.debug(medebug, "Found artist with ID",data.data.results[i].id);
									parent.playlistinfo.metadata.artist.discogs.artistid = data.data.results[i].id;
									break;
								}
							}
							if (parent.playlistinfo.metadata.artist.discogs.artistid === null) {
								// just be a little bit careful
								for (var i in data.data.results) {
									if (decodeURIComponent(data.data.results[i].uri.toLowerCase()) == decodeURIComponent(lookingfor.toLowerCase())) {
										debug.debug(medebug, "Found artist with ID",data.data.results[i].id);
										parent.playlistinfo.metadata.artist.discogs.artistid = data.data.results[i].id;
										break;
									}
								}
							}
							if (parent.playlistinfo.metadata.artist.discogs.artistid !== null) {
								discogs.artist.getInfo(
									'artist_'+parent.playlistinfo.metadata.artist.discogs.artistid,
									parent.playlistinfo.metadata.artist.discogs.artistid,
									self.artist.artistResponseHandler,
									self.artist.artistResponseHandler
								);
							} else {
								self.artist.abjectFailure();
							}
						} else {
							self.artist.abjectFailure();
						}
					},

					parsesearchResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got artist search data for",parent.playlistinfo.creator,data);
						if (data && data.data) {
							parent.playlistinfo.metadata.artist.discogs.artistid = null;
							var lookingfor = parent.playlistinfo.creator;
							lookingfor = sanitizeDiscogsResult(lookingfor);
							debug.log(medebug,parent.index,"scanning search data for",lookingfor);
							for (var i in data.data.results) {
								if (sanitizeDiscogsResult(data.data.results[i].title) == lookingfor) {
									debug.debug(medebug, "Found artist with ID",data.data.results[i].id);
									parent.playlistinfo.metadata.artist.discogs.artistid = data.data.results[i].id;
									break;
								}
							}
							if (parent.playlistinfo.metadata.artist.discogs.artistid !== null) {
								discogs.artist.getInfo(
									'artist_'+parent.playlistinfo.metadata.artist.discogs.artistid,
									parent.playlistinfo.metadata.artist.discogs.artistid,
									self.artist.artistResponseHandler,
									self.artist.artistResponseHandler
								);
							} else {
								self.artist.abjectFailure();
							}
						} else {
							self.artist.abjectFailure();
						}
					},

					artistResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got artist data",data);
						if (data) {
							parent.playlistinfo.metadata.artist.discogs['artist_'+parent.playlistinfo.metadata.artist.discogs.artistid] = data;
							self.artist.doBrowserUpdate();
						} else {
							self.artist.abjectFailure();
						}
					},

					abjectFailure: function() {
						debug.fail(medebug,"Failed to find any artist data");
						parent.playlistinfo.metadata.artist.discogs.artistinfo = {error: "Couldn't get a sensible response from Discogs"};
						self.artist.doBrowserUpdate();
					},

					diResponseErrorHandler: function(data) {
						debug.warn(medebug,"There was a search error",data);
						parent.playlistinfo.metadata.artist.discogs.artistinfo = data;
						self.artist.doBrowserUpdate();
					},

					extraResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got extra artist data for",data.id,data);
						if (data) {
							parent.playlistinfo.metadata.artist.discogs[data.id] = data;
							putArtistData(parent.playlistinfo.metadata.artist.discogs[data.id], data.id);
							if (data.data) {
								// Fill in any [a123456] links in the main text body.
								$('span[name="'+data.data.id+'"]').html(data.data.name);
								$('span[name="'+data.data.id+'"]').wrap('<a href="'+data.data.uri+'" target="_blank"></a>');
							}
						}
					},

					extraResponseHandler2: function(data) {
						debug.mark(medebug,parent.index,"got stupidly extra artist data for",data.id,data);
						if (data) {
							parent.playlistinfo.metadata.artist.discogs[data.id] = data;
							if (data.data) {
								// Fill in any [a123456] links in the main text body.
								$('span[name="'+data.data.id+'"]').html(data.data.name);
								$('span[name="'+data.data.id+'"]').wrap('<a href="'+data.data.uri+'" target="_blank"></a>');
							}
						}
					},

					releaseResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"got release data for",data.id,data);
						if (data) {
							parent.playlistinfo.metadata.artist.discogs[data.id+"_"+data.data.pagination.page] = data;
							putArtistReleases(parent.playlistinfo.metadata.artist.discogs[data.id+"_"+data.data.pagination.page], data.id);
						}
					},

					doBrowserUpdate: function() {
						if (displaying) {
							debug.mark(medebug,parent.index,"artist was asked to display");
							// Any errors (such as failing to find the artist) go under artistinfo. Originally, this was where the actual artist info would go
							// too, but then this bright spark had the idea to index all the artist info by the artist ID. This is indeed useful.
							// But if there was an error in the initial search we don't know the ID. Hence artistinfo still exists and has to be checked.
							if (parent.playlistinfo.metadata.artist.discogs.artistinfo && parent.playlistinfo.metadata.artist.discogs.artistinfo.error) {
								browser.Update('artist',
									me,
									parent.index,
									{
										name: parent.playlistinfo.creator,
										link: "",
										data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.discogs.artistinfo.error+'</h3>'
									}
								);
							} else if (parent.playlistinfo.metadata.artist.discogs.artistid !== null &&
											parent.playlistinfo.metadata.artist.discogs['artist_'+parent.playlistinfo.metadata.artist.discogs.artistid] !== undefined) {
								var accepted = browser.Update('artist',
												me,
												parent.index,
												{
													name: parent.playlistinfo.creator,
													link: parent.playlistinfo.metadata.artist.discogs.artistlink,
													data: getArtistHTML(parent.playlistinfo.metadata.artist.discogs['artist_'+parent.playlistinfo.metadata.artist.discogs.artistid], false)
												}
								);
								startAllSlideshows();
							}
						}
					}

				}

			}();

			this.album = function() {

				var retries = 12;

				return {

					populate: function() {
						// We need to initialise these variables, to avoid 'cannot set property of' errors later.
						if (parent.playlistinfo.metadata.album.discogs === undefined) {
							parent.playlistinfo.metadata.album.discogs = {};
						}
						if (parent.playlistinfo.metadata.album.discogs.album === undefined) {
							parent.playlistinfo.metadata.album.discogs.album = {};
						}

						// error will be set if there was,er, an error.
						// master will be set if we got some actual data.
						if (parent.playlistinfo.metadata.album.discogs.album.error === undefined &&
							parent.playlistinfo.metadata.album.discogs.album.master === undefined) {

							if (parent.playlistinfo.type == "stream") {
								debug.mark(medebug,parent.index,"Not bothering to update album info as it's a radio station");
								parent.playlistinfo.metadata.album.discogs.album.error = {error: '(Internet Radio Station)'};
								self.album.doBrowserUpdate();
								return;
							}
							if (parent.playlistinfo.metadata.album.discogs.albumlink === undefined) {
								debug.log(medebug,parent.index,"Album asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.warn(medebug,parent.index,"Album giving up waiting for bloody musicbrainz");
									parent.playlistinfo.metadata.album.discogs.albumlink = null;
									setTimeout(self.album.populate, 200);
								} else {
									setTimeout(self.album.populate, 2000);
							}
								return;
							}
							if (parent.playlistinfo.metadata.album.discogs.albumlink === null) {
								debug.fail(medebug,parent.index,"Album asked to populate but no link could be found");
								if (parent.playlistinfo.musicbrainz.album_releasegroupid !== null &&
										parent.playlistinfo.musicbrainz.album_releasegroupid !== undefined) {
									debug.mark(medebug,parent.index," ... trying the album release group");
									musicbrainz.releasegroup.getInfo(
										parent.playlistinfo.musicbrainz.album_releasegroupid,
										'',
										self.album.mbRgHandler,
										self.album.mbRgHandler
									);
								} else {
									self.album.isItDownTheBackOfTheSofa();
								}
								return;
							}
							var link = parent.playlistinfo.metadata.album.discogs.albumlink;
							var b = link.match(/(release\/\d+)|(master\/\d+)/);
							if (b && b[0]) {
								var bunny = b[0];
								bunny = bunny.replace(/\//, 's\/');
								debug.mark(medebug,parent.index,"Album is populating",bunny);
								discogs.album.getInfo(
									'',
									bunny,
									self.album.albumResponseHandler,
									self.album.albumResponseErrorHandler
								);
							}
						} else {
							debug.mark(medebug,parent.index,"Album is already populated, I think");
						}
					},

					albumResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"Got album data",data);
						if (data.data.master_id) {
							// If this key exists, then we have retrieved a release page - this data is useful but we also
							// want the master release info. (Links that come to us from musicbrainz could be either master or release).
							// We will only display when we have the master info. Since we can't go back from master to release
							// then if we got a master link from musicbrainz that's all we're ever going to get.
							parent.playlistinfo.metadata.album.discogs.album.release = data;
							discogs.album.getInfo(
								'',
								'masters/'+data.data.master_id,
								self.album.albumResponseHandler,
								self.album.albumResponseErrorHandler
							);
						} else {
							parent.playlistinfo.metadata.album.discogs.album.master = data;
							self.album.doBrowserUpdate();
						}
					},

					albumResponseErrorHandler: function(data) {
						debug.fail(medebug,"Error in album request",data);
						parent.playlistinfo.metadata.album.discogs.album.error = data;
						self.album.doBrowserUpdate();
					},

					mbRgHandler: function(data) {
						debug.mark(medebug,parent.index,"got musicbrainz release group data for",parent.playlistinfo.album, data);
						if (data.error) {
							debug.fail(medebug,parent.index," ... MB error",data);
							self.album.isItDownTheBackOfTheSofa();
						} else {
							for (var i in data.relations) {
								if (data.relations[i].type == "discogs") {
									debug.mark(medebug,parent.index,"has found a Discogs album link",data.relations[i].url.resource);
									parent.playlistinfo.metadata.album.discogs.albumlink = data.relations[i].url.resource;
									self.album.populate();
									return;
								}
							}
							self.album.isItDownTheBackOfTheSofa();
						}
					},

					isItDownTheBackOfTheSofa: function() {
						debug.mark(medebug,parent.index,"Oh bejeesus we're going to have to search for the bloody album");
						// Searching for albums on Discogs is just horrific due to the huge amount of data in their database
						// and the lack of a facility to do an EXACT search
						// We're going to use the track name and Lucerne syntax to help narrow down the search results
						// and let discog's database do the heavy lifting
						var thingsToTry = [
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+release_title%3A'+prepareForSearch(munge_album_name(parent.playlistinfo.album))+'+artist%3A'+prepareForSearch(getSearchArtist())+'+format%3AAlbum',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+release_title%3A'+prepareForSearch(munge_album_name(parent.playlistinfo.album))+'+artist%3A'+prepareForSearch(getSearchArtist())+'+format%3ACompilation',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+release_title%3A'+prepareForSearch(munge_album_name(parent.playlistinfo.album))+'+artist%3A'+prepareForSearch(getSearchArtist())+'+format%3ALP',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+release_title%3A'+prepareForSearch(munge_album_name(parent.playlistinfo.album))+'+artist%3A'+prepareForSearch(getSearchArtist())+'+format%3AEP',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+release_title%3A'+prepareForSearch(munge_album_name(parent.playlistinfo.album))+'+artist%3A'+prepareForSearch(getSearchArtist())
						];

						(function theDohPrime() {
							var a = thingsToTry.shift();
							if (a) {
								discogs.album.search(a,
									function(data) {
										debug.log(medebug,parent.index,"Album Search Results",data);
										// We're gonna be really basic here, as a thorough search is a PITA to implement (see getalbumcover.php)
										var compartist = sanitizeDiscogsResult(parent.playlistinfo.creator+' - '+munge_album_name(parent.playlistinfo.album));
										for(var i in data.data.results) {
											var comp2 = sanitizeDiscogsResult(data.data.results[i].title);
											if (compartist == comp2) {
												debug.log(medebug,parent.index,"Search has found a result!",data.data.results[i].uri);
												parent.playlistinfo.metadata.album.discogs.albumlink = data.data.results[i].uri;
												self.album.populate();
												return;
											}
										}
										theDohPrime();
									},
									function(data) {
										theDohPrime();
									});
							} else {
								self.album.abjectFailure();
							}
						})();

					},

					abjectFailure: function() {
						debug.fail(medebug,"Completely failed to find the album");
						parent.playlistinfo.metadata.album.discogs.album.error = {error: 'No Discogs link could be found for this album'};
						self.album.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.album.discogs.album !== undefined &&
								(parent.playlistinfo.metadata.album.discogs.album.error !== undefined ||
								parent.playlistinfo.metadata.album.discogs.album.master !== undefined ||
								parent.playlistinfo.metadata.album.discogs.album.release !== undefined)) {
							debug.mark(medebug,parent.index,"album was asked to display");
							browser.Update('album',
								me,
								parent.index,
								{
									name: parent.playlistinfo.album,
									link: parent.playlistinfo.metadata.album.discogs.albumlink,
									data: getAlbumHTML(parent.playlistinfo.metadata.album.discogs.album)
								}
							);
						}
					},

				}

			}();

			this.track = function() {

				var retries = 15;

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.track.discogs === undefined) {
							parent.playlistinfo.metadata.track.discogs = {};
						}
						if (parent.playlistinfo.metadata.track.discogs.track === undefined) {
							parent.playlistinfo.metadata.track.discogs.track = {};
						}
						if (parent.playlistinfo.metadata.track.discogs.track.error === undefined &&
							parent.playlistinfo.metadata.track.discogs.track.master === undefined) {
							if (parent.playlistinfo.metadata.track.discogs.tracklink === undefined) {
								debug.log(medebug,parent.index,"Track asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.warn(medebug,parent.index,"Track giving up on bloody musicbrainz");
									parent.playlistinfo.metadata.track.discogs.tracklink = null;
									setTimeout(self.track.populate, 200);
								} else {
									setTimeout(self.track.populate, 2000);
								}
								return;
							}
							if (parent.playlistinfo.metadata.track.discogs.tracklink === null) {
								debug.mark(medebug,parent.index,"Track asked to populate but no link could be found");
								self.track.isItDownTheBackOfTheSofa();
								return;
							}
							var link = parent.playlistinfo.metadata.track.discogs.tracklink;
							var b = link.match(/(release\/\d+)|(master\/\d+)/);
							if (b && b[0]) {
								var bunny = b[0];
								bunny = bunny.replace(/\//, 's\/');
								debug.mark(medebug,parent.index,"Track is populating",bunny);
								discogs.track.getInfo(
									'',
									bunny,
									self.track.trackResponseHandler,
									self.track.trackResponseErrorHandler
								);
							}
						} else {
							debug.mark(medebug,parent.index,"Track is already populated, probably");
						}
					},

					trackResponseHandler: function(data) {
						debug.mark(medebug,parent.index,"Got track data",data);
						if (data.data.master_id) {
							// If this key exists, then we have retrieved a release page - this data is useful but we also
							// want the master release info. (Links that come to us from musicbrainz could be either master or release).
							// We will only display when we have the master info. Since we can't go back from master to release
							// then if we got a master link from musicbrainz that's all we're ever going to get.
							// On the other hand that's still more accurate the using discog's search facility, so we're going with it.
							parent.playlistinfo.metadata.track.discogs.track.release = data;
							discogs.track.getInfo(
								'',
								'masters/'+data.data.master_id,
								self.track.trackResponseHandler,
								self.track.trackResponseErrorHandler
							);
						} else {
							parent.playlistinfo.metadata.track.discogs.track.master = data;
							self.track.doBrowserUpdate();
						}
					},

					trackResponseErrorHandler: function(data) {
						debug.fail(medebug,"Got error in track request",data);
						parent.playlistinfo.metadata.track.discogs.track.error = data;
						self.track.doBrowserUpdate();
					},

					isItDownTheBackOfTheSofa: function() {
						debug.mark(medebug,parent.index,"Oh bejeesus we're going to have to search for the bloody track");
						// Searching for album tracks has no meaning on discogs - we can only search for tracks that were released as singles.
						var thingsToTry = [
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+artist%3A'+prepareForSearch(parent.playlistinfo.creator)+'+format%3ASingle',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+artist%3A'+prepareForSearch(parent.playlistinfo.creator)+'+format%3A7%22',
							'track%3A'+prepareForSearch(parent.playlistinfo.title)+'+artist%3A'+prepareForSearch(parent.playlistinfo.creator)+'+format%3A12%22'
						];

						(function smoothBitches() {
							var a = thingsToTry.shift();
							if (a) {
								discogs.album.search(a,
									function(data) {
										debug.log(medebug,parent.index,"Track Search Results",data);
										// We're gonna be really basic here, as a thorough search is a PITA to implement (see getalbumcover.php)
										var compartist = sanitizeDiscogsResult(parent.playlistinfo.creator+' - '+parent.playlistinfo.title);
										for (var i in data.data.results) {
											var comp2 = sanitizeDiscogsResult(data.data.results[i].title);
											if (comp2 == compartist) {
												debug.log(medebug,parent.index,"Track search has found a result!",data.data.results[i].uri);
												parent.playlistinfo.metadata.track.discogs.tracklink = data.data.results[0].uri;
												self.track.populate();
												return;
											}
										}
										smoothBitches();
									},
									function(data) {
										smoothBitches();
									});
							} else {
								self.track.abjectFailure();
							}
						})();

					},

					abjectFailure: function() {
						debug.fail(medebug,"Completely failed to find the track");
						parent.playlistinfo.metadata.track.discogs.track.error = {error: 'No Discogs link could be found for this track'};
						self.track.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.track.discogs.track !== undefined &&
								(parent.playlistinfo.metadata.track.discogs.track.error !== undefined ||
								parent.playlistinfo.metadata.track.discogs.track.master !== undefined ||
								parent.playlistinfo.metadata.track.discogs.track.release !== undefined)) {
							debug.mark(medebug,parent.index,"track was asked to display");
							browser.Update('track',
								me,
								parent.index,
								{
									name: parent.playlistinfo.title,
									link: parent.playlistinfo.metadata.track.discogs.tracklink,
									data: getAlbumHTML(parent.playlistinfo.metadata.track.discogs.track)
								}
							);
						}
					},

				}

			}();

			self.artist.populate();
			self.album.populate();
			self.track.populate();

		}

	}


}();

nowplaying.registerPlugin("discogs", info_discogs, "newimages/discogs-white-2.png", "Info Panel (Discogs)");
