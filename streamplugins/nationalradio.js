function loadBigRadio() {
    if ($("#bbclist").is(':empty')) {
    	loadBigRadioHtml('populate');
    }
}

function changeradiocountry() {
	loadBigRadioHtml("populate=1&country="+$("#radioselector").val());
}

function loadBigRadioHtml(qstring) {
    $("#bbcwait").makeSpinner();
    $("#bbclist").load("streamplugins/02_nationalradio.php?"+qstring, function() { $("#bbcwait").stopSpinner() });
}