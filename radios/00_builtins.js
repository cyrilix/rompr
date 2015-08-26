var starRadios = function() {

	return {

        setup: function() {

            var html = '';

            $.each(['1stars','2stars','3stars','4stars','5stars'], function(i, v) {
                var cn = v.replace(/(\d)/, 'icon-$1-');
                html += '<div class="containerbox backhi spacer dropdown-container" '+
                        'onclick="playlist.radioManager.load(\'starRadios\', \''+v+'\')">'+
                        '<div class="fixed"><i class="'+cn+' rating-icon-small"></i></div>'+
                        '<div class="expand">&nbsp;'+language.gettext('playlist_xstar', [i+1])+
                        '</div>'+
                        '</div>';

            });
            $("#pluginplaylists").append(html);

            var a = $('<div>', {class: "containerbox"}).appendTo("#pluginplaylists");
            var c = $('<div>', {class: "containerbox expand spacer dropdown-container"}).
                appendTo(a).makeTagMenu({
                textboxname: 'cynthia',
                labelhtml: '<i class="icon-tags smallicon"></i>',
                populatefunction: populateTagMenu,
                buttontext: language.gettext('button_playradio'),
                buttonfunc: starRadios.tagPopulate
            });

            html = '<div class="containerbox backhi spacer dropdown-container" '+
                    'onclick="playlist.radioManager.load(\'starRadios\', \'allrandom\')">'+
                    '<div class="fixed"><i class="icon-music smallicon"></i></div>'+
                    '<div class="expand">'+language.gettext('label_allrandom')+'</div>'+
                    '</div>';

            $("#pluginplaylists").append(html);

            html = '<div class="containerbox backhi spacer dropdown-container" '+
                    'onclick="playlist.radioManager.load(\'starRadios\', \'neverplayed\')">'+
                    '<div class="fixed"><i class="icon-music smallicon"></i></div>'+
                    '<div class="expand">'+language.gettext('label_neverplayed')+'</div>'+
                    '</div>';

            $("#pluginplaylists").append(html);
        }
	}
}();

var recentlyaddedtracks = function() {

    return {

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" '+
                'onclick="playlist.radioManager.load(\'recentlyaddedtracks\', \'random\')">';

            html += '<div class="fixed">';
            html += '<i class="icon-music smallicon"></i></div>';
            html += '<div class="expand">'+
                language.gettext('label_recentlyadded_random')+'</div>';

            html += '</div>';
            html += '<div class="containerbox spacer backhi dropdown-container" '+
                'onclick="playlist.radioManager.load(\'recentlyaddedtracks\', \'byalbum\')">';

            html += '<div class="fixed">';
            html += '<i class="icon-music smallicon"></i></div>';
            html += '<div class="expand">'+language.gettext('label_recentlyadded_byalbum')+
                '</div>';

            html += '</div>';
            $("#pluginplaylists").append(html);

        }

    }

}();

var mostPlayed = function() {

    return {

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" '+
                'onclick="playlist.radioManager.load(\'mostPlayed\', null)">';
            html += '<div class="fixed">';
            html += '<i class="icon-music smallicon"></i></div>';
            html += '<div class="expand">'+language.gettext('label_mostplayed')+'</div>';
            html += '</div>';
            $("#pluginplaylists").append(html);

        }

    }

}();

var faveAlbums = function() {

    return {

        setup: function() {

            var html = '<div class="containerbox spacer backhi dropdown-container" '+
                'onclick="playlist.radioManager.load(\'faveAlbums\', null)">';
            html += '<div class="fixed">';
            html += '<i class="icon-music smallicon"></i></div>';
            html += '<div class="expand">'+language.gettext('label_favealbums')+'</div>';
            html += '</div>';
            $("#pluginplaylists").append(html);

        }

    }

}();

var faveArtistRadio = function() {

    return {

        setup: function() {
            var html = '<div class="containerbox spacer backhi dropdown-container" '+
                'onclick="playlist.radioManager.load(\'faveArtistRadio\', null)">';

            html += '<div class="fixed">';
            html += '<i class="icon-wifi smallicon"></i></div>';
            html += '<div class="expand">'+language.gettext('label_radio_fartist')+'</div>';

            html += '</div>';
            $("#pluginplaylists_everywhere").append(html);
        }
    }
}();

var mixRadio = function() {

    return {

        setup: function() {

            if (player.canPlay('spotify')) {

                var html = '<div class="containerbox spacer backhi dropdown-container" '+
                    'onclick="playlist.radioManager.load(\'mixRadio\', null)">';

                html += '<div class="fixed">';
                html += '<i class="icon-spotify-circled smallicon"></i></div>';
                html += '<div class="expand">'+language.gettext('label_radio_mix')+'</div>';

                html += '</div>';
                $("#pluginplaylists_spotify").append(html);
            }
        }
    }
}();

var genreRadio = function() {

    return {

        setup: function() {
            var html = '<div class="containerbox dropdown-container spacer">';
            html += '<div class="fixed"><i class="icon-wifi smallicon"/></i></div>';
            html += '<div class="fixed padright"><span style="vertical-align:middle">'+
                language.gettext('label_genre')+'</span></div>';
            html += '<div class="expand dropdown-holder"><input class="enter" id="humphrey" '+
                'type="text" onkeyup="onKeyUp(event)" /></div>';
            html += '<button class="fixed" style="margin-left:8px;vertical-align:middle" '+
                'onclick="playlist.radioManager.load(\'genreRadio\', $(\'#humphrey\').val())">'+
                language.gettext('button_playradio')+'</button>';
            html += '</div>';
            html += '</div>';
            $("#pluginplaylists_everywhere").append(html);
        }

    }

}();

var singleArtistRadio = function() {

    var tuner;
    var artist;

    return {

        setup: function() {
            var html = '<div class="containerbox dropdown-container spacer">';
            html += '<div class="fixed"><i class="icon-wifi smallicon"/></i></div>';
            html += '<div class="fixed padright"><span style="vertical-align:middle">'+
                language.gettext('label_singleartistradio')+'</span></div>';
            html += '<div class="expand dropdown-holder"><input class="enter" id="franklin" '+
                'type="text" onkeyup="onKeyUp(event)" /></div>';
            html += '<button class="fixed" style="margin-left:8px;vertical-align:middle" '+
                'onclick="playlist.radioManager.load(\'singleArtistRadio\', $(\'#franklin\').val())">'+
                language.gettext('button_playradio')+'</button>';
            html += '</div>';
            html += '</div>';
            $("#pluginplaylists_everywhere").append(html);
        }
    }
}();

var artistRadio = function() {

    return {

        setup: function() {
            if (player.canPlay('spotify')) {
                var html = '<div class="containerbox dropdown-container spacer">';
                html += '<div class="fixed"><i class="icon-spotify-circled smallicon"></i></div>';
                html += '<div class="fixed padright"><span style="vertical-align:middle">'+
                    language.gettext('lastfm_simar')+'</span></div>';
                html += '<div class="expand dropdown-holder"><input class="enter" '+
                    'id="bubbles" type="text" onkeyup="onKeyUp(event)" /></div>';
                html += '<button class="fixed" style="margin-left:8px;vertical-align:middle" '+
                    'onclick="playlist.radioManager.load(\'artistRadio\', $(\'#bubbles\').val())">'+
                    language.gettext('button_playradio')+'</button>';
                html += '</div>';
                html += '</div>';
                $("#pluginplaylists_spotify").append(html);
            }
        }

    }

}();

playlist.radioManager.register("starRadios", starRadios, 'radios/code/starRadios.js');
playlist.radioManager.register("recentlyaddedtracks", recentlyaddedtracks, 'radios/code/recentlyadded.js');
playlist.radioManager.register("mostPlayed", mostPlayed, 'radios/code/mostplayed.js');
playlist.radioManager.register("faveAlbums", faveAlbums, 'radios/code/favealbums.js');
playlist.radioManager.register("faveArtistRadio", faveArtistRadio, 'radios/code/faveartistradio.js');
playlist.radioManager.register("mixRadio", mixRadio, 'radios/code/mixradio.js');
playlist.radioManager.register("genreRadio", genreRadio,'radios/code/genreradio.js');
playlist.radioManager.register("singleArtistRadio", singleArtistRadio, 'radios/code/singleartistradio.js');
playlist.radioManager.register("artistRadio", artistRadio, 'radios/code/artistradio.js');
