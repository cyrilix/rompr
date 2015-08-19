function refreshMyDrink(path) {
    if ($("#icecastlist").is(':empty')) {
		makeabadger();
        $("#icecastlist").load("streamplugins/85_iceScraper.php?populate", spaghetti);
    } else if (path) {
		makeabadger();
        $("#icecastlist").load("streamplugins/85_iceScraper.php?populate=1&path="+path, spaghetti);
    }
}

function makeabadger() {
    $('[name="icecastlist"]').makeSpinner();
}

function spaghetti() {
	$('[name="icecastlist"]').stopSpinner();
}

menuOpeners['icecastlist'] = refreshMyDrink;
