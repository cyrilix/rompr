var info_wikipedia = function() {

	var me = "wikipedia";

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
                }
            }

            this.wikiGotFailed = function(data) {
            	debug.warn("WIKI PLUGIN", "Failed to get Wiki Link",data);
            }

            function getSearchArtist() {
                return (parent.playlistinfo.albumartist && parent.playlistinfo.albumartist != "") ? parent.playlistinfo.albumartist : self.artist.name();
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
						debug.log("WIKI PLUGIN",parent.index,"got artist data for",parent.playlistinfo.creator);
						if (data) {
							parent.playlistinfo.metadata.artist.wikipedia.artistinfo = data;
						} else {
							parent.playlistinfo.metadata.artist.wikipedia.artistinfo = {error: language.gettext("wiki_nothing")}
						}

						self.artist.doBrowserUpdate();
					},

					doBrowserUpdate: function() {
						if (displaying && parent.playlistinfo.metadata.artist.wikipedia.artistinfo !== undefined) {
							debug.log("WIKI PLUGIN",parent.index,"artist was asked to display");
							if (parent.playlistinfo.metadata.artist.wikipedia.artistinfo.error) {
								browser.Update('artist', me, parent.index, {	name: parent.playlistinfo.creator,
																			link: "",
																			data: '<h3 align="center">'+parent.playlistinfo.metadata.artist.wikipedia.artistinfo.error+'</h3>'
																		}
								);
							} else {
								browser.Update('artist', me, parent.index, {	name: parent.playlistinfo.creator,
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

					gotWikiLink: function(link, data) {
						browser.speciaUpdate(me, 'artist', { name: link.replace(/_/g, " "),
															 link: null,
															 data: data});
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
							parent.playlistinfo.metadata.album.wikipedia.albumdata = data;
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

					gotWikiLink: function(link, data) {
						browser.speciaUpdate(me, 'album', { name: link.replace(/_/g, " "),
															link: 'http://en.wikipedia.org/wiki/'+link,
															data: data});
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
							parent.playlistinfo.metadata.track.wikipedia.trackdata = data;
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

					gotWikiLink: function(link, data) {
						browser.speciaUpdate(me, 'track', { name: link.replace(/_/g, " "),
															link: 'http://en.wikipedia.org/wiki/'+link,
															data: data});
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
