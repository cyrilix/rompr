function refreshMyDrink(path) {
    $("#icewait").makeSpinner();
    if ($("#icecastlist").is(':empty') || path === false || path === undefined) {
        $("#icecastlist").load("streamplugins/85_iceScraper.php?populate", function() { $("#icewait").stopSpinner() });
    } else {
        $("#icecastlist").load("streamplugins/85_iceScraper.php?populate=1&path="+path, function() { $("#icewait").stopSpinner() });
    }
}

function makeabadger() {
    $("#icewait").makeSpinner();
}
