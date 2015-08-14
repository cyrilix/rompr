var podcasts = function() {

	var downloadQueue = new Array();
	var downloadRunning = false;
	var updatenext = null;
	var updateTimer = null;
	var loaded = false;

	function checkDownloadQueue() {
		if (downloadRunning == false) {
			var newTrack = downloadQueue.shift();
			if (newTrack) {
				downloadRunning = true;
				var track = newTrack.track;
				var channel = newTrack.channel;
				var monitor = new podcastDownloadMonitor(track, channel);
			    $.ajax( {
			        type: "GET",
			        url: "streamplugins/01_podcasts.php",
			        cache: false,
			        contentType: "text/html; charset=utf-8",
			        data: {downloadtrack: track, channel: channel, populate: 1 },
			        timeout: 360000,
			        success: function(data) {
			            monitor.stop();
			            $("#podcast_"+channel).html(data);
			            $("#podcast_"+channel).find('.fridge').tipTip({edgeOffset: 8});
			            doDummyProgressBars();
			            downloadRunning = false;
			            checkDownloadQueue();
			        },
			        error: function(data, status) {
			            monitor.stop();
			            debug.error("PODCASTS", "Podcast Download Failed!",data,status);
			            infobar.notify(infobar.ERROR, "Failed To Download Podcast");
			            downloadRunning = false;
			            checkDownloadQueue();
			        }
			    });
			}
		}
	}

	function podcastDownloadMonitor(track, channel) {

	    var self = this;
	    var progressdiv = $('i[name="poddownload_'+track+'"]').parent();
	    progressdiv.html('<div id="podcastdownload" width="100%"></div>');
	    var pb = new progressBar('podcastdownload', 'horizontal');
	    var timer;
	    var running = true;

	    this.checkProgress = function() {
	        $.ajax( {
	            type: "GET",
	            url: "utils/checkpodcastdownload.php",
	            cache: false,
	            dataType: "json",
	            success: function(data) {
	                pb.setProgress(data.percent);
	                debug.log("PODCAST DOWNLOAD","Download status is",data);
	                if (running) {
	                    timer = setTimeout(self.checkProgress, 500);
	                }
	            },
	            error: function() {
	                infobar.notify(infobar.ERROR, "Something went wrong checking the download progress!");
	            }
	        });
	    }

	    this.stop = function() {
	        running = false;
	        clearTimeout(timer);
	        pb = null;
	    }

	    timer = setTimeout(self.checkProgress, 2000);
	}

	function doDummyProgressBars() {
		for(var i = 0; i < downloadQueue.length; i++) {
			var track = downloadQueue[i].track;
			debug.trace("PODCAST DOWNLOAD","Putting Dummy Progress Bar in",track);
		    $('i[name="poddownload_'+track+'"]').makeSpinner();
		}
	}

	function putPodCount(indicator, num, numl) {
		if (num == 0) {
			indicator.removeClass('newpod');
			indicator.html("");
		} else {
			indicator.html(num);
			if (!indicator.hasClass('newpod')) {
				indicator.addClass('newpod');
			}
		}
		var il = indicator.next();
		if (numl == 0) {
			il.removeClass('unlistenedpod');
			il.html("");
		} else {
			il.html(numl);
			if (!il.hasClass('unlistenedpod')) {
				il.addClass('unlistenedpod');
			}
		}
	}

	function podcastRequest(options) {
		debug.log("PODCASTS","Sending request",options);
		options.populate = 1;
	    $.ajax( {
	        type: "GET",
	        url: "streamplugins/01_podcasts.php",
	        cache: false,
	        contentType: "text/html; charset=utf-8",
	        data: options,
	        success: function(data) {
	            $("#podcast_"+options.channel).html(data);
	            $("#podcast_"+options.channel).find('.fridge').tipTip({edgeOffset: 8});
	            podcasts.doNewCount();
	        },
	        error: function(data, status) {
	            debug.error("PODCASTS", "Failed To Set Option:",options,data,status);
	            infobar.notify(infobar.ERROR,language.gettext("label_general_error"));
	        }
	    });

	}

	return {

		loadList: function() {
			if (!loaded) {
		        $("#podcastslist").load("streamplugins/01_podcasts.php?populate=1", function() {
		            $(".fridge").tipTip({delay: 1000, edgeOffset: 8});
		            podcasts.doNewCount();
		        });
		        loaded = true;
		    }
    	},

		doPodcast: function(input) {
		    var url = $("#"+input).val();
		    debug.log("PODCAST","Getting podcast",url);
		    doSomethingUseful('cocksausage', language.gettext("label_downloading"));
		    $.ajax( {
		        type: "GET",
		        url: "streamplugins/01_podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {url: encodeURIComponent(url), populate: 1 },
		        success: function(data) {
		            $("#podcastslist").html(data);
		            $("#podcastslist").find('.fridge').tipTip({edgeOffset: 8});
		            infobar.notify(infobar.NOTIFY, "Subscribed to Podcast");
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            infobar.notify(infobar.ERROR, "Failed to Subscribe to Podcast");
		            podcasts.loadlist();
		        }
		    } );
		},

		handleDrop: function() {
    		setTimeout(function() { podcasts.doPodcast('podcastsinput') }, 1000);
    	},

		refreshPodcast: function(name) {
		    debug.mark("PODCAST","Refreshing podcast",name);
		    $.ajax( {
		        type: "GET",
		        url: "streamplugins/01_podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {refresh: name, populate: 1 },
		        success: function(data) {
		            $("#podcast_"+name).html(data);
		            $("#podcast_"+name).find('.fridge').tipTip({edgeOffset: 8});
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            infobar.notify(infobar.ERROR, language.gettext("podcast_rss_error"));
		        }
		    } );
		},

		removePodcast: function(name) {
		    debug.log("PODCAST","Removing podcast",name);
		    $.ajax( {
		        type: "GET",
		        url: "streamplugins/01_podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {remove: name, populate: 1 },
		        success: function(data) {
		            $("#podcastslist").html(data);
		            $("#podcastslist").find('.fridge').tipTip({edgeOffset: 8});
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            infobar.notify(infobar.ERROR, language.gettext("podcast_remove_error"));
		        }
		    } );
		},

		markChannelAsListened: function(channel) {
		    debug.log("PODCAST","Marking as listened",name);
		    $.ajax( {
		        type: "GET",
		        url: "streamplugins/01_podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {channellistened: channel, populate: 1 },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip({edgeOffset: 8});
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            infobar.notify(infobar.ERROR, language.gettext("podcast_general_error"));
		        }
		    } );
		},

		removePodcastTrack: function(track, channel) {
		    debug.log("PODCAST","Removing track",track,"from channel",channel);
		    podcastRequest({removetrack: track, channel: channel });
		},

		markEpisodeAsListened: function(track, channel) {
		    debug.log("PODCAST","Marking track",track,"from channel",channel,"as listened");
		    podcastRequest({markaslistened: track, channel: channel });
		},

		downloadPodcast: function(track, channel) {
		    debug.mark("PODCAST","Downloading track",track,"from channel",channel);
		    downloadQueue.push({track: track, channel: channel});
		    doDummyProgressBars();
		    checkDownloadQueue();
		},

		downloadPodcastChannel: function(channel) {
            $("#podcast_"+channel).find('.poddownload').click();
		},

		checkMarkPodcastAsListened: function(file) {
		    if (file.match(/^http:/)) {
		        debug.trace("PODCASTS","Looking for podcast",file);
		        var p = $("#podcastslist").find('div[name="'+file+'"]');
		        if (p.length == 1) {
		            var divid = p.parent().attr("id");
		            podid = divid.replace(/podcast_/, '');
		            debug.trace("PODCASTS", "We just listened to",file,"from",podid);
		            $.ajax( {
		                type: "GET",
		                url: "streamplugins/01_podcasts.php",
		                cache: false,
		                contentType: "text/html; charset=utf-8",
		                data: {listened: podid, location: encodeURIComponent(file), populate: 1},
		                success: function(data) {
		                    $("#"+divid).html(data);
		                    $("#"+divid).find('.fridge').tipTip({edgeOffset: 8});
				            podcasts.doNewCount();
		                },
		                error: function(data, status) {
		                    debug.error("PODCASTS","Failed to mark",file,"as listened");
		                }
		            } );

		        } else if (p.length > 1) {
		            debug.error("PODCASTS","Found multiple matches for podcast URL!!!");
		        }
		    }
		},

		doNewCount: function() {
			var total = 0;
			var utotal = 0;
			var updatetime = null;
			clearTimeout(updateTimer);
			updatenext = null;
			$('div[id^="podcast_"]').each( function() {
				var id = $(this).attr('id');
				debug.trace("PODCASTS", "Looking for unlistened items in",id);
				var obj =  $(this).find('.newpodicon');
				var unl = $(this).find('.oldpodicon');
				var num = obj.length;
				var numl = unl.length;
				debug.trace("PODCASTS", "... the count is",num,numl);
				total += num;
				utotal += numl;
				var indicator = $(this).prev().find('.podnumber');
				putPodCount(indicator, num, numl);

				var confpanel = id.replace(/podcast_/, 'podconf_');
				if ($("#"+confpanel).find('.podautodown').is(':checked')) {
					obj.each(function() {
						$(this).parent().parent().find('.poddownload').click();
					});
				}

				obj = $(this).find('.podnextupdate');
				debug.trace("PODCASTS","Channel",obj.parent().attr("id"),"Next update is",obj.val());
				if (obj.val() != 0 && (updatetime === null || obj.val() < updatetime)) {
					updatetime = obj.val();
					updatenext = obj.parent().attr("id");
				}
			});
			putPodCount($("#total_unlistened_podcasts"), total, utotal);
			updatetime = parseInt(updatetime) + parseInt(serverTimeOffset);
			var secondstoupdate = updatetime - (Date.now() / 1000);
			debug.log("PODCASTS","Next podcast to update is",updatenext,"at",updatetime,"which is in",secondstoupdate,"seconds");
			updateTimer = setTimeout(podcasts.autoRefresh, Math.max((secondstoupdate * 1000), 100));
		},

		changeOption: function(event) {
			var element = $(event.target);
			var elementType = element[0].tagName;
			var options = {option: element.attr("name")};
			debug.log("PODCASTS","Option:",element,elementType);
			switch(elementType) {
				case "SELECT":
					options.val = element.val();
					break;
				case "LABEL":
					options.val = !element.prev().is(':checked');
					break;
			}
			while(!element.hasClass('dropmenu')) {
				element = element.parent();
			}
			var channel = element.attr('id');
			options.channel = channel.replace(/podconf_/,'');
			podcastRequest(options);
		},

		autoRefresh: function() {
			if (updatenext !== null) {
				$("#"+updatenext).prev().children('.podrefresh').click();
				updatenext = null;
			}
		}
	}

}();