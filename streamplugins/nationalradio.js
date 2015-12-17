function loadBigRadio() {
    if ($("#bbclist").is(':empty')) {
    	loadBigRadioHtml('populate=1&country='+prefs.radiocountry);
    }
}

function changeradiocountry() {
	prefs.save({radiocountry: $("#radioselector").val()});
	loadBigRadioHtml("populate=1&country="+$("#radioselector").val());
}

function loadBigRadioHtml(qstring) {
    $('[name="bbclist"]').makeSpinner();
    $("#bbclist").load("streamplugins/02_nationalradio.php?"+qstring, function() {
    	$('[name="bbclist"]').stopSpinner().removeClass('icon-toggle-closed');
    	if (!$('[name="bbclist"]').hasClass('icon-toggle-open')) {
    		$('[name="bbclist"]').addClass('icon-toggle-open');
    	}
        $('[name="radiosearcher"]').click(function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var position = getPosition(ev);
            var elemright = $('[name="radiosearcher]').width() + $('[name="radiosearcher"]').offset().left;
            if (position.x > elemright - 24) {
                $('[name="radiosearcher"]').val("");
                searchBigRadio();
            }
        });
        $('[name="radiosearcher"]').hover(makeHoverWork);
        $('[name="radiosearcher"]').mousemove(makeHoverWork);
        $('[name="radiosearcher"]').keyup(onKeyUp);
    });
}

function searchBigRadio() {
    var term = $('[name="radiosearcher"]').val();
    $('#bbclist .radiostation').show();
    if (term != '') {
        term = new RegExp(term.toLowerCase());
        $('#bbclist .radiostation').each(function(){
            var stn = $(this);
            var match = false;
            stn.find('.searchable').each(function() {
                var c = $(this).html().toLowerCase();
                if (term.test(c)) {
                    match = true;
                    return true;
                }
            });
            if (!match) {
                stn.hide();
            }
        });
    }
}

menuOpeners['bbclist'] = loadBigRadio;