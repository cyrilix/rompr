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
    $("#bbcwait").makeSpinner();
    $("#bbclist").load("streamplugins/02_nationalradio.php?"+qstring, function() { $("#bbcwait").stopSpinner() });
}