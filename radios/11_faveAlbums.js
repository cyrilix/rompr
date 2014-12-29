var faveAlbums = function() {

    var running = false;
    var populating = false;
    var tracks = new Array();

    function getTracks() {
        if (populating) {
            debug.warn("FAVEALBUMS", "Asked to populate but already doing so!")
            return false;
        }
        populating = true;
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "radios/favealbums.php",
            success: function(data) {
                if (data && data.length > 0) {
                    debug.debug("FAVEALBUMS","Got tracks",data);
                    running = true;
                    populating = false;
                    tracks = data;
                    addTracks();
                } else {
                    infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                    playlist.radioManager.stop();
                }
            },
            fail: function() {
                infobar.notify(infobar.NOTIFY,language.gettext('label_gotnotracks'));
                playlist.radioManager.stop();
            }
        });

    }

    function addTracks() {
        if (running) {
            var t = new Array();
            var c = 10;
            while (c > 0 && tracks.length > 0) {
                t.push({type: 'uri', name: tracks.shift()});
                c--;
            }
            if (t.length > 0) {
                player.controller.addTracks(t, playlist.playFromEnd(), null);
            } else {
                playlist.radioManager.stop();
            }
        }
    }

	return {

		populate: function(s, flag) {
            if (flag) running = flag;
            debug.shout("FAVEALBUMS", "Populating");
            if (tracks.length == 0) {
                getTracks();
            } else {
                addTracks();
            }
		},

        modeHtml: function() {
            return '<i class="icon-doc-text modeimg"></i><span class="modespan">'+language.gettext("label_favealbums")+'</span>&nbsp;';
        },

        stop: function() {
            running = false;
            populating = false;
            tracks = new Array();
        },

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" onclick="playlist.radioManager.load(\'faveAlbums\', null)">';
            html = html + '<div class="fixed">';
            html = html + '<i class="icon-doc-text smallicon"></i></div>';
            html = html + '<div class="expand">'+language.gettext('label_favealbums')+'</div>';
            html = html + '</div>';
            $("#pluginplaylists").append(html);

        }

	}

}();

playlist.radioManager.register("faveAlbums", faveAlbums);