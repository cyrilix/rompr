var podcasts = function() {

	var downloadQueue = new Array();
	var downloadRunning = false;
	var updatenext = null;
	var updateTimer = null;

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
			        url: "podcasts.php",
			        cache: false,
			        contentType: "text/html; charset=utf-8",
			        data: {downloadtrack: track, channel: channel },
			        timeout: 360000,
			        success: function(data) {
			            monitor.stop();
			            $("#podcast_"+channel).html(data);
			            $("#podcast_"+channel).find('.fridge').tipTip();
			            doDummyProgressBars();
			            downloadRunning = false;
			            checkDownloadQueue();
			        },
			        error: function(data, status) {
			            monitor.stop();
			            alert("Failed To Download Podcast");
			            downloadRunning = false;
			            checkDownloadQueue();
			        }
			    });
			}
		}
	}

	function podcastDownloadMonitor(track, channel) {

	    var self = this;
	    var progressdiv = $('img[name="poddownload_'+track+'"]').parent();
	    progressdiv.html('<div id="podcastdownload" width="100%"></div>');
	    var pb = new progressBar('podcastdownload', 'horizontal');
	    var timer;
	    var running = true;

	    this.checkProgress = function() {
	        $.ajax( {
	            type: "GET",
	            url: "checkpodcastdownload.php",
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
	                alert("Something went wrong checking the download progress!");
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
			debug.debug("PODCAST DOWNLOAD","Putting Dummy Progress Bar in",track);
		    $('img[name="poddownload_'+track+'"]').addClass("spinner");
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

	return {
		doPodcast: function(input) {
		    var url = $("#"+input).attr("value");
		    debug.log("PODCAST","Getting podcast",url);
		    doSomethingUseful('cocksausage', 'Downloading...');
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {url: encodeURIComponent(url) },
		        success: function(data) {
		            $("#podcastslist").html(data);
		            $("#podcastslist").find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Retreive RSS feed");
		        }
		    } );
		},

		refreshPodcast: function(name) {
		    debug.mark("PODCAST","Refreshing podcast",name);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {refresh: name },
		        success: function(data) {
		            $("#podcast_"+name).html(data);
		            $("#podcast_"+name).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Retreive RSS feed");
		        }
		    } );
		},

		removePodcast: function(name) {
		    debug.log("PODCAST","Removing podcast",name);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {remove: name },
		        success: function(data) {
		            $("#podcastslist").html(data);
		            $("#podcastslist").find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Remove Podcast");
		        }
		    } );
		},

		markChannelAsListened: function(channel) {
		    debug.log("PODCAST","Marking as listened",name);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {channellistened: channel },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Remove Podcast");
		        }
		    } );
		},

		removePodcastTrack: function(track, channel) {
		    debug.log("PODCAST","Removing track",track,"from channel",channel);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {removetrack: track, channel: channel },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Remove Podcast");
		        }
		    } );
		},

		markEpisodeAsListened: function(track, channel) {
		    debug.log("PODCAST","Marking track",track,"from channel",channel,"as listened");
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {markaslistened: track, channel: channel },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Mark Podcast As Listened");
		        }
		    } );
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
		        debug.debug("PODCASTS","Looking for podcast",file);
		        var p = $("#podcastslist").find('div[name="'+file+'"]');
		        if (p.length == 1) {
		            var divid = p.parent().attr("id");
		            podid = divid.replace(/podcast_/, '');
		            debug.debug("PODCASTS", "We just listened to",file,"from",podid);
		            $.ajax( {
		                type: "GET",
		                url: "podcasts.php",
		                cache: false,
		                contentType: "text/html; charset=utf-8",
		                data: {listened: podid, location: encodeURIComponent(file)},
		                success: function(data) {
		                    $("#"+divid).html(data);
		                    $("#"+divid).find('.fridge').tipTip();
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
				debug.log("PODCASTS", "Looking for unlistened items in", $(this).attr('id'));
				var obj =  $(this).find('.newpodicon');
				var unl = $(this).find('.oldpodicon');
				var num = obj.length;
				var numl = unl.length;
				debug.log("PODCASTS", "... the count is",num,numl);
				total += num;
				utotal += numl;
				var indicator = $(this).prev().find('.podnumber');
				putPodCount(indicator, num, numl);
				obj = $(this).find('.podnextupdate');
				debug.debug("PODCASTS","Channel",obj.parent().attr("id"),"Next update is",obj.val());
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

		changeDisplayOption: function(channel) {
			var val = $("#podconf_"+channel).find('.ds').val();
			debug.log("PODCASTS","Changing display option for",channel,"to",val);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {displaymode: val, channel: channel },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Set Display Mode");
		        }
		    } );

		},

		changeRefreshOption: function(channel) {
			var val = $("#podconf_"+channel).find('.rs').val();
			debug.log("PODCASTS","Changing refresh option for",channel,"to",val);
		    $.ajax( {
		        type: "GET",
		        url: "podcasts.php",
		        cache: false,
		        contentType: "text/html; charset=utf-8",
		        data: {refreshoption: val, channel: channel },
		        success: function(data) {
		            $("#podcast_"+channel).html(data);
		            $("#podcast_"+channel).find('.fridge').tipTip();
		            podcasts.doNewCount();
		        },
		        error: function(data, status) {
		            alert("Failed To Set Display Mode");
		        }
		    } );
		},

		autoRefresh: function() {
			if (updatenext !== null) {
				$("#"+updatenext).prev().children('.podrefresh').click();
				updatenext = null;
			}
		}

	}

}();