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
    });
}

menuOpeners['bbclist'] = loadBigRadio;