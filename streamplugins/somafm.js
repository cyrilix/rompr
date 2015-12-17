function loadSomaFM() {
    if ($("#somafmlist").is(':empty')) {
    	$('[name="somafmlist"]').makeSpinner();
        $("#somafmlist").load("streamplugins/01_somafm.php?populate", function( ) {
			$('[name="somafmlist"]').stopSpinner();
        });
    }
}

menuOpeners['somafmlist'] = loadSomaFM;