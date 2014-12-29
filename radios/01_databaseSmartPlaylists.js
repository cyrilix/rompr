var starRadios = function() {

	var running = false;
    var populating = false;
    var selected;

    function getSmartPlaylistTracks(action, playlist) {
        if (populating) {
            debug.warn("STARRADIOS", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            data: { action: action, playlist: playlist },
            url: "backends/sql/userRatings.php",
            success: starRadios.Go,
            fail: starRadios.Fail
        });
    }

	return {

		populate: function(s, flag) {
            debug.log("STARRADIOS","Populate Called with ",s,running);
            if (s) {
                switch(s) {
                    case '1stars':
                    case '2stars':
                    case '3stars':
                    case '4stars':
                    case '5stars':
                    case 'neverplayed':
                        selected = s;
                        break;

                    default:
                        selected = 'tag+'+s;
                        break;
                }

            }
            if (flag) running = flag;
            debug.shout("STAR RADIOS", "Populating",selected);
			getSmartPlaylistTracks(running ? "repopulate" : "getplaylist", selected);
		},

        modeHtml: function() {
            if (selected.match(/^\dstars/)) {
                var cn = selected.replace(/(\d)/, 'icon-$1-');
                return '<i class="'+cn+' rating-icon-small"></i>';
            } else if (selected.match(/^tag/)){
                return '<i class="icon-tags modeimg"/><span class="modespan">'+selected.replace(/^tag\+/,'')+'</span>';
            } else {
                return '<i class="icon-doc-text modeimg"/></i><span class="modespan">'+language.gettext('label_'+selected)+'</span>';
            }
        },

        stop: function() {
            running = false;
            populating = false;
        },

        Go: function(data) {
            if (data.length > 0) {
                debug.log("SMARTPLAYLIST","Got tracks",data);
                running = true;
                populating = false;
                player.controller.addTracks(data, playlist.playFromEnd(), null);
            } else {
                debug.warn("SMARTPLAYLIST","Got NO tracks",data);
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        },

        Fail: function() {
            infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
            playlist.radioManager.stop();
        },

        tagPopulate: function(tags) {
            playlist.radioManager.load('starRadios', tags);
        },

        setup: function() {

            var html = '';

            if (prefs.apache_backend == "sql") {
                $.each(['1stars','2stars','3stars','4stars','5stars'], function(i, v) {
                    var cn = v.replace(/(\d)/, 'icon-$1-');
                    html = html + '<div class="containerbox backhi spacer dropdown-container" onclick="playlist.radioManager.load(\'starRadios\', \''+v+'\')">'+
                                    '<div class="fixed"><i class="'+cn+' rating-icon-small"></i></div>'+
                                    '<div class="expand">'+language.gettext('playlist_xstar', [i+1])+'</div>'+
                                    '</div>';

                });
                $("#pluginplaylists").append(html);

                var a = $('<div>', {class: "containerbox"}).appendTo("#pluginplaylists");
                var c = $('<div>', {class: "containerbox expand spacer dropdown-container"}).appendTo(a).makeTagMenu({
                    textboxname: 'cynthia', 
                    labelhtml: '<i class="icon-tags smallicon"></i>', 
                    populatefunction: populateTagMenu,
                    buttontext: language.gettext('button_playradio'),
                    buttonfunc: starRadios.tagPopulate
                });               
                html = '<div class="containerbox backhi spacer dropdown-container" onclick="playlist.radioManager.load(\'starRadios\', \'neverplayed\')">'+
                                '<div class="fixed"><i class="icon-doc-text smallicon"></i></div>'+
                                '<div class="expand">'+language.gettext('label_neverplayed')+'</div>'+
                                '</div>';

                $("#pluginplaylists").append(html);
            }
        }
	}
}();

playlist.radioManager.register("starRadios", starRadios);