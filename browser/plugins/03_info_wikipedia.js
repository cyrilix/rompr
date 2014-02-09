var info_wikipedia = function() {

	var me = "wikipedia";

	function formatWiki(xml) {
		var xml_node = $('api',xml);
       	var html = xml_node.find('parse > text').text();
       	var domain = xml_node.find('rompr > domain').text();
       	var jq = $('<div>'+html+'</div>');

		// Remove unwanted edit links
		jq.find("span.editsection").remove();

		// Make external links open in a new tab
		jq.find("a[href^='http:']").attr("target", "_blank");
		jq.find("a[href^='//']").attr("target", "_blank");
		jq.find("a[href^='/w/']").each( function() {
			var ref = $(this).attr('href');
			$(this).attr('href', 'http://'+domain+'.wikipedia.org'+ref);
			$(this).attr("target", "_blank");
		});

		// Make the contents table links work
		jq.find("a[href^='#']").each( function() {
			if (!$(this).hasClass('infoclick')) {
				var ref = $(this).attr('href');
				$(this).attr('name', ref);
				$(this).attr("href", "#");
				$(this).addClass("infoclick clickwikicontents");
			}
		});

		// Redirect wiki image links so they go to our function to be displayed
		jq.find("a.image[href^='/wiki/']").each( function() {
			var ref = $(this).attr('href');
			$(this).attr('href', '#');
			$(this).attr('name', domain+'.wikipedia.org/'+ref.replace(/\/wiki\//,''));
			$(this).addClass('infoclick clickwikimedia');
		});
		jq.find("a.image[href^='//commons.wikimedia.org/']").each( function() {
			var ref = $(this).attr('href');
			$(this).attr('href', '#');
			$(this).attr('name', 'commons.wikimedia.org/'+ref.replace(/\/\/commons\.wikimedia\.org\/wiki\//,''));
			$(this).addClass('infoclick clickwikimedia');
		});

		// Redirect intra-wikipedia links so they go to our function
		jq.find("a[href^='/wiki/']").each( function() {
			var ref = $(this).attr('href');
			$(this).attr('href', '#');
			$(this).attr('name', domain+'/'+ref.replace(/\/wiki\//,''));
			$(this).addClass('infoclick clickwikilink');
		});

		// Remove inline colour styles on elements.
		// We do background color twice because some elements have been found
		// to have 2 background color styles applied.
		if (prefs.theme == "Darkness.css" || prefs.theme == "TheBlues.css") {
			jq.find('[style*=background-color]').removeInlineCss('background-color');
			jq.find('[style*=background-color]').removeInlineCss('background-color');
			jq.find('[style*=background]').removeInlineCss('background');
			jq.find('[style*=color]').removeInlineCss('color');
		}
		// Remove these bits because they're a pain in the arse
		jq.find("li[class|='nv']").remove();

		return jq.html();

		// The original PHP formatter had these, but I'm not sure they're needed
		// //<a class="external text" href="//en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=render_collection&amp;colltitle=Book:Deep_Purple&amp;writer=rl">Download PDF</a>
		// $html = preg_replace( '/(<a .*? href=".*?Special\:Book.*?")/', '$1 target="_blank"', $html );

	}

	function formatLink(xml) {
		var xml_node = $('api',xml);
		return 'http://'+xml_node.find('rompr > domain').text()+'.wikipedia.org/wiki/'+xml_node.find('rompr > page').text();
	}

	function formatPage(xml) {
		var xml_node = $('api',xml);
		var page = xml_node.find('rompr > page').text();
		return page.replace(/_/g, ' ');
	}

	return {
		getRequirements: function(parent) {
			return ["musicbrainz"];
		},

		collection: function(parent) {

			debug.log("WIKI PLUGIN", "Creating data collection");

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
			}


            this.handleClick = function(source, element, event) {
                debug.log("WIKI PLUGIN",parent.index,source,"is handling a click event");
                if (element.hasClass('clickwikimedia')) {
                	wikipedia.wikiMediaPopup(element, event);
                } else if (element.hasClass('clickwikilink')) {
                	var link = decodeURIComponent(element.attr('name'));
                	debug.log("WIKI PLUGIN",parent.index,source,"clicked a wiki link",link);
                	self[source].followLink(link);
                } else if (element.hasClass('clickwikicontents')) {
                	var section = element.attr('name');
                	debug.log("WIKI PLUGIN",parent.index,source,"clicked a contents link",section);
                	if (mobile == "no") {
          				//TODO make this work on a phone (no custom scrollbars)
                		$("#infopane").mCustomScrollbar("scrollTo", section);
                	}

                }
            }

            this.wikiGotFailed = function(data) {
            	debug.warn("WIKI PLUGIN", "Failed to get Wiki Link",data);
            }

            function getSearchArtist() {
                return (parent.playlistinfo.albumartist && parent.playlistinfo.albumartist != "") ? parent.playlistinfo.albumartist : parent.playlistinfo.creator;
            }

			this.artist = function() {

				var retries = 10;

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.artist.wikipedia === undefined) {
							parent.playlistinfo.metadata.artist.wikipedia = {};
						}
						if (parent.playlistinfo.metadata.artist.wikipedia.artistinfo === undefined) {
							if (parent.playlistinfo.metadata.artist.wikipedia.artistlink === undefined) {
								debug.log("WIKI PLUGIN",parent.index,"Artist asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.log("WIKI PLUGIN",parent.index,"Artist giving up waiting for poxy musicbrainz");
									parent.playlistinfo.metadata.artist.wikipedia.artistlink = null;
									setTimeout(self.artist.populate, 200);
								} else {
									setTimeout(self.artist.populate, 2000);
								}
								return;
							}
							if (parent.playlistinfo.metadata.artist.wikipedia.artistlink === null) {
								debug.log("WIKI PLUGIN",parent.index,"Artist asked to populate but no link could be found. Trying a search");
								wikipedia.search({	artist: parent.playlistinfo.creator,
													disambiguation: parent.playlistinfo.metadata.artist.disambiguation || ""
												},
												self.artist.wikiResponseHandler,
												self.artist.wikiResponseHandler);
								return;
							}
							debug.log("WIKI PLUGIN",parent.index,"artist is populating",parent.playlistinfo.metadata.artist.wikipedia.artistlink);
							wikipedia.getFullUri({	uri: parent.playlistinfo.metadata.artist.wikipedia.artistlink,
													term: parent.playlistinfo.creator
												},
												self.artist.wikiResponseHandler,
												self.artist.wikiResponseHandler);
						} else {
							debug.log("WIKI PLUGIN",parent.index,"artist is already populated",parent.playlistinfo.metadata.artist.wikipedia.artistlink);
						}
					},

					wikiResponseHandler: function(data) {
						debug.log("WIKI PLUGIN",parent.index,"got artist data for",parent.playlistinfo.creator,data);
						if (data) {
							parent.playlistinfo.metadata.artist.wikipedia.artistinfo = formatWiki(data);
							parent.playlistinfo.metadata.artist.wikipedia.artistlink = formatLink(data);
						} else {
							parent.playlistinfo.metadata.artist.wikipedia.artistinfo = {error: language.gettext("wiki_nothing")}
						}

						self.artist.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.artist.wikipedia.artistinfo !== undefined) {
							debug.log("WIKI PLUGIN",parent.index,"artist was asked to display");
							if (parent.playlistinfo.metadata.artist.wikipedia.artistinfo.error) {
								browser.Update('artist', me, parent.index, {name: parent.playlistinfo.creator,
																			link: null,
																			data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.wikipedia.artistinfo.error+'</h3>'
																		}
								);
							} else {
								browser.Update('artist', me, parent.index, {name: parent.playlistinfo.creator,
																			link: parent.playlistinfo.metadata.artist.wikipedia.artistlink,
																			data: parent.playlistinfo.metadata.artist.wikipedia.artistinfo
																		}
								);
							}
						}
					},

					followLink: function(link) {
						wikipedia.getWiki(link, self.artist.gotWikiLink, self.wikiGotFailed);
					},

					gotWikiLink: function(data) {
						browser.speciaUpdate(me, 'artist', { name: formatPage(data),
															 link: formatLink(data),
															 data: formatWiki(data)});
					}
				}
			}();

			this.album = function() {

				var retries = 12;

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.album.wikipedia === undefined) {
							parent.playlistinfo.metadata.album.wikipedia = {};
						}
						if (parent.playlistinfo.metadata.album.wikipedia.albumdata === undefined) {
							if (parent.playlistinfo.metadata.album.wikipedia.albumlink === undefined) {
								debug.log("WIKI PLUGIN",parent.index,"Album asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.log("WIKI PLUGIN",parent.index,"Album giving up waiting for poxy musicbrainz");
									parent.playlistinfo.metadata.album.wikipedia.albumlink = null;
									setTimeout(self.album.populate, 200);
								} else {
									setTimeout(self.album.populate, 2000);
								}
								return;
							}
							if (parent.playlistinfo.metadata.album.wikipedia.albumlink === null) {
								debug.log("WIKI PLUGIN",parent.index,"Album asked to populate but no link could be found");
								if (parent.playlistinfo.musicbrainz.album_releasegroupid !== null) {
									debug.log("WIKI PLUGIN",parent.index," ... trying the album release group");
									musicbrainz.releasegroup.getInfo(parent.playlistinfo.musicbrainz.album_releasegroupid, '', self.album.mbRgHandler, self.album.mbRgHandler);
								} else {
									debug.log("WIKI PLUGIN",parent.index,"... trying a search");
									wikipedia.search({album: parent.playlistinfo.album, albumartist: getSearchArtist()}, self.album.wikiResponseHandler, self.album.wikiResponseHandler);
								}
								return;
							}
							debug.log("WIKI PLUGIN",parent.index,"album is populating",parent.playlistinfo.metadata.album.wikipedia.albumlink);
							wikipedia.getFullUri({	uri: parent.playlistinfo.metadata.album.wikipedia.albumlink,
													term: parent.playlistinfo.album
												},
												self.album.wikiResponseHandler,
												self.album.wikiResponseHandler);
						} else {
							debug.log("WIKI PLUGIN",parent.index,"album is already populated",parent.playlistinfo.metadata.album.wikipedia.albumlink);
						}
					},

					wikiResponseHandler: function(data) {
						debug.log("WIKI PLUGIN",parent.index,"got album data for",parent.playlistinfo.album);
						if (data) {
							parent.playlistinfo.metadata.album.wikipedia.albumdata = formatWiki(data);
							parent.playlistinfo.metadata.album.wikipedia.albumlink = formatLink(data);
						} else {
							parent.playlistinfo.metadata.album.wikipedia.albumdata = {error: language.gettext("wiki_nothing")}
						}

						self.album.doBrowserUpdate();
					},

					mbRgHandler: function(data) {
						debug.log("WIKI PLUGIN",parent.index,"got musicbrainz release group data for",parent.playlistinfo.album, data);
						if (data.error) {
							debug.log("WIKI PLUGIN",parent.index," ... MB error, trying a search");
							wikipedia.search({album: parent.playlistinfo.album, albumartist: getSearchArtist()}, self.album.wikiResponseHandler, self.album.wikiResponseHandler);
						} else {
							for (var i in data.relations) {
								if (data.relations[i].type == "wikipedia") {
									debug.log("WIKI PLUGIN",parent.index,"has found a Wikipedia album link",data.relations[i].url.resource);
									parent.playlistinfo.metadata.album.wikipedia.albumlink = data.relations[i].url.resource;
									wikipedia.getFullUri({	uri: parent.playlistinfo.metadata.album.wikipedia.albumlink,
															term: parent.playlistinfo.album
														},
														self.album.wikiResponseHandler,
														self.album.wikiResponseHandler);
									return;
								}
							}
							wikipedia.search({album: parent.playlistinfo.album, albumartist: getSearchArtist()}, self.album.wikiResponseHandler, self.album.wikiResponseHandler);
						}

					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.album.wikipedia.albumdata !== undefined) {
							debug.log("WIKI PLUGIN",parent.index,"album was asked to display");
							if (parent.playlistinfo.metadata.album.wikipedia.albumdata.error) {
								browser.Update('album', me, parent.index, {	name: parent.playlistinfo.album,
																		link: "",
																		data: '<h3 align="center">'+parent.playlistinfo.metadata.album.wikipedia.albumdata.error+'</h3>'
																	}
								);
							} else {
								browser.Update('album', me, parent.index, {	name: parent.playlistinfo.album,
																			link: parent.playlistinfo.metadata.album.wikipedia.albumlink,
																			data: parent.playlistinfo.metadata.album.wikipedia.albumdata
																	}
								);
							}
						}
					},

					followLink: function(link) {
						wikipedia.getWiki(link, self.album.gotWikiLink, self.wikiGotFailed);
					},

					gotWikiLink: function(data) {
						browser.speciaUpdate(me, 'album', { name: formatPage(data),
															link: formatLink(data),
															data: formatWiki(data)});
					}

				}
			}();

			this.track = function() {

				var retries = 15;

				return {

					populate: function() {
						if (parent.playlistinfo.metadata.track.wikipedia === undefined) {
							parent.playlistinfo.metadata.track.wikipedia = {};
						}
						if (parent.playlistinfo.metadata.track.wikipedia.trackdata === undefined) {
							if (parent.playlistinfo.metadata.track.wikipedia.tracklink === undefined) {
								debug.log("WIKI PLUGIN",parent.index,"track asked to populate but no link yet");
								retries--;
								if (retries == 0) {
									debug.log("WIKI PLUGIN",parent.index,"Track giving up waiting for poxy musicbrainz");
									parent.playlistinfo.metadata.track.wikipedia.tracklink = null;
									setTimeout(self.track.populate, 200);
								} else {
									setTimeout(self.track.populate, 2000);
								}
								return;
							}
							if (parent.playlistinfo.metadata.track.wikipedia.tracklink === null) {
								debug.log("WIKI PLUGIN",parent.index,"track asked to populate but no link could be found");
								debug.log("WIKI PLUGIN",parent.index,"... trying a search");
								wikipedia.search({track: parent.playlistinfo.title, trackartist: parent.playlistinfo.creator}, self.track.wikiResponseHandler, self.track.wikiResponseHandler);
								return;
							}
							debug.log("WIKI PLUGIN",parent.index,"track is populating",parent.playlistinfo.metadata.track.wikipedia.tracklink);
							wikipedia.getFullUri({	uri: parent.playlistinfo.metadata.track.wikipedia.tracklink,
													term: parent.playlistinfo.title
												},
												self.track.wikiResponseHandler,
												self.track.wikiResponseHandler);
						} else {
							debug.log("WIKI PLUGIN",parent.index,"track is already populated",parent.playlistinfo.metadata.track.wikipedia.tracklink);
						}
					},

					wikiResponseHandler: function(data) {
						debug.log("WIKI PLUGIN",parent.index,"got track data for",parent.playlistinfo.title);
						if (data) {
							parent.playlistinfo.metadata.track.wikipedia.trackdata = formatWiki(data);
							parent.playlistinfo.metadata.track.wikipedia.tracklink = formatLink(data);
						} else {
							parent.playlistinfo.metadata.track.wikipedia.trackdata = {error: language.gettext("wiki_nothing")}
						}

						self.track.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.track.wikipedia.trackdata !== undefined) {
							debug.log("WIKI PLUGIN",parent.index,"track was asked to display");
							if (parent.playlistinfo.metadata.track.wikipedia.trackdata.error) {
								browser.Update('track', me, parent.index, {	name: parent.playlistinfo.title,
																		link: "",
																		data: '<h3 align="center">'+parent.playlistinfo.metadata.track.wikipedia.trackdata.error+'</h3>'
																	}
								);
							} else {
								browser.Update('track', me, parent.index, {	name: parent.playlistinfo.title,
																			link: parent.playlistinfo.metadata.track.wikipedia.tracklink,
																			data: parent.playlistinfo.metadata.track.wikipedia.trackdata
																	}
								);
							}
						}
					},

					followLink: function(link) {
						wikipedia.getWiki(link, self.track.gotWikiLink, self.wikiGotFailed);
					},

					gotWikiLink: function(data) {
						browser.speciaUpdate(me, 'track', { name: formatPage(data),
															link: formatLink(data),
															data: formatWiki(data)});
					}

				}
			}();

			self.artist.populate();
			self.album.populate();
			self.track.populate();
		}
	}

}();

nowplaying.registerPlugin("wikipedia", info_wikipedia, "newimages/Wikipedia-logo.png", "button_wikipedia");
