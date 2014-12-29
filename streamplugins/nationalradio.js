function loadBigRadio() {
    if ($("#bbclist").is(':empty')) {
        $("#bbcwait").makeSpinner();
        $("#bbclist").load("streamplugins/02_nationalradio.php?populate", function() { $("#bbcwait").stopSpinner() });
    }
}

function changeradiocountry() {
    $("#bbclist").load("streamplugins/02_nationalradio.php?populate=1&country="+$("#radioselector").val());
}
