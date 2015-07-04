var metaBackup = function() {
	
	var mbb = null;
	var meta = new Array();
	var progressbar;
	var metaindex = 0;

	function getBackupData() {
		$("#mbbmunger").empty();
        $.ajax({
        	url: 'backends/sql/userRatings.php',
        	type: "POST",
        	data: {action: 'getbackupdata'},
        	dataType: 'json',
        	success: function(data) {
        		metaBackup.doMainLayout(data);
        	},
        	error: function() {
        		infobar.notify(infobar.ERROR, "Failed to get Backup info");
        		mbb.slideToggle('fast');
        	}
        });
	}

	return {

		open: function() {
			if (mbb === null) {
	        	mbb = browser.registerExtraPlugin("mbb", language.gettext("label_metabackup"), metaBackup);

    			$("#mbbfoldup").append('<div class="containerbox padright noselection">'+
        			'<div class="expand">'+
            		'</div>'+
					'<button class="fixed" onclick="metaBackup.create()">'+language.gettext("button_backup")+'</button>'+
    				'</div>');

			    $("#mbbfoldup").append('<div class="noselection fullwidth" id="mbbmunger"></div>');
			    getBackupData();
			} else {
				browser.goToPlugin("mbb");
			}
		},

		doMainLayout: function(data) {
			debug.log("METABACKUP",data);
			meta = [];
			var n = 0;
			$("#mbbmunger").append('<h2>Existing Backup</h2>');
			$("#mbbmunger").append('<div id="mbbrestore" class="containerbox padright noselection">'+
    			'<div class="expand">'+
        		'</div>'+
				'<button id="ilikeboobs" class="fixed" onclick="metaBackup.restore()">'+language.gettext("button_restore")+'</button>'+
				'</div>');
            $("#mbbmunger").append(
            	'<div name="minge" class="containerbox vertical">'+
            		'<div style="margin-left:8px;margin-right:8px;margin-top:4px;margin-bottom:4px" class="containerbox">'+
            			'<div class="fixed menuitem" style="width:10em"><b>Progress</b></div>'+
            			'<div class="expand menuitem" id="metaprogress"></div>'+
            		'</div>'+
            		'<div style="margin-left:8px;margin-right:8px;margin-top:4px;margin-bottom:4px" class="containerbox">'+
            			'<div class="expand menuitem" id="metainfo"></div>'+
            		'</div>'+
            	'</div>'
            	);
		    progressbar = new progressBar("metaprogress", "horizontal");

			$('[name="minge"]').hide();

			for (var r in data.Ratings) {
				for (var t in data.Ratings[r]) {
					n++;
					var thing = {
						action: "set",
						attributes: [{
							attribute: 'Rating',
							value: r
						}],
						title: data.Ratings[r][t]['Title'],
						artist: data.Ratings[r][t]['Artist'],
						albumartist: data.Ratings[r][t]['Albumartist'],
						album: data.Ratings[r][t]['Album'],
						image: data.Ratings[r][t]['Image'],
						trackno: data.Ratings[r][t]['Trackno'],
						disc: data.Ratings[r][t]['Disc'],
						duration: data.Ratings[r][t]['Duration']
					};
					if (prefs.player_backend == "mopidy") {
						var a = data.Ratings[r][t]['Uri'];
						if (a) {
							if (a.substr(0, 7) == "spotify" || a.substr(0,10) == "soundcloud" || a.substr(0,7) == "youtube") {
								thing.uri = a;
							}
						}
					}
					meta.push(thing);
				}
			}
			for (var r in data.Tags) {
				for (var t in data.Tags[r]) {
					n++;
					var thing = {
						action: "set",
						attributes: [{
							attribute: 'Tags',
							value: [r]
						}],
						title: data.Tags[r][t]['Title'],
						artist: data.Tags[r][t]['Artist'],
						albumartist: data.Tags[r][t]['Albumartist'],
						album: data.Tags[r][t]['Album'],
						image: data.Tags[r][t]['Image'],
						trackno: data.Tags[r][t]['Trackno'],
						disc: data.Tags[r][t]['Disc'],
						duration: data.Tags[r][t]['Duration']
					};
					if (prefs.player_backend == "mopidy") {
						var a = data.Tags[r][t]['Uri'];
						if (a) {
							if (a.substr(0, 7) == "spotify" || a.substr(0,10) == "soundcloud" || a.substr(0,7) == "youtube") {
								thing.uri = a;
							}
						}
					}
					meta.push(thing);
				}
			}
			for (var r in data.Playcounts) {
				n++;
				var thing = {
					action: "inc",
					attributes: [{
						attribute: 'Playcount',
						value: data.Playcounts[r]['Playcount']
					}],
					title: data.Playcounts[r]['Title'],
					artist: data.Playcounts[r]['Artist'],
					albumartist: data.Playcounts[r]['Albumartist'],
					album: data.Playcounts[r]['Album'],
					trackno: data.Playcounts[r]['Trackno'],
					disc: data.Playcounts[r]['Disc'],
					duration: data.Playcounts[r]['Duration'],
					image: data.Playcounts[r]['Image']
				};
				meta.push(thing);
			}
			if (n > 0) {
				$("#mbbmunger").append('<table id="tits" align="center" cellpadding="2" width="95%" style="border-collapse:collapse"></table>');
	            $("#tits").append('<tr><th>Title</th><th>Artist</th><th>Album</th><th>Album Artist</th><th>Metadata</th></tr>');
	            for (var i in meta) {
	            	var fuck = meta[i].attributes[0].attribute;
	            	$("#tits").append('<tr><td>'+meta[i]['title']+'</td><td>'+meta[i]['artist']+'</td><td>'+meta[i]['album']+'</td><td>'+meta[i]['albumartist']+'</td><td>'+meta[i].attributes[0].attribute+' : '+getArray(meta[i].attributes[0].value)[0]+'</td></tr>');
	            }
	        }
            if (!$("#mbbfoldup").is(':visible')) {
	            mbb.slideToggle('fast', function() {
		        	browser.goToPlugin("mbb");
	            });
	        }
            if (n == 0) {
            	$("#mbbrestore").fadeOut('fast');
            }
		},

		create: function() {
            $.ajax({
            	url: 'backends/sql/userRatings.php',
            	type: "POST",
            	data: {action: 'metabackup'},
            	success: function(data) {
            		infobar.notify(infobar.NOTIFY, "Backup Created");
            		getBackupData();
            	},
            	error: function() {
            		infobar.notify(infobar.ERROR, "Failed to get Backup info");
            		mbb.slideToggle('fast');
            	}
            });
	    },

		close: function() {
			mbb = null;
			meta = [];
			metaindex = 0;
		},

		restore: function() {
			$("#ilikeboobs").prop('disabled', true);
			if (!$('[name="minge"]').is(':visible')) {
				$('[name="minge"]').slideToggle('slow');
			}
			var p = (metaindex/meta.length)*100;
			progressbar.setProgress(p.toFixed(2));
			if (metaindex < meta.length) {
				var arse = meta[metaindex];
				$("#metainfo").html('Setting '+arse.attributes[0].attribute+' to '+getArray(arse.attributes[0].value)[0]+' on '+arse.title+' by '+arse.artist);
		        $.ajax({
		            url: "backends/sql/userRatings.php",
		            type: "POST",
		            data: arse,
		            dataType: 'json',
		            success: function(rdata) {
		                debug.log("FRIDGE","Success",rdata);
		                updateCollectionDisplay(rdata);
		                metaindex++;
		                setTimeout(metaBackup.restore, 500);
					},
		            error: function(rdata) {
		                debug.warn("FRIDGE","Failure");
		                metaindex++;
		                setTimeout(metaBackup.restore, 500);
		            }
		        });
		    } else {
				$("#ilikeboobs").prop('disabled', false);
				$("#metainfo").html("Finished");
		    }
		}

	}

}();

pluginManager.addPlugin(language.gettext("label_metabackup"), metaBackup.open, null);