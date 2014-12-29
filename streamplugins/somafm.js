function loadSomaFM() {
    if ($("#somafmlist").is(':empty')) {
        $("#somawait").makeSpinner();
        $("#somafmlist").load("streamplugins/01_somafm.php?populate", function() { $("#somawait").stopSpinner() });
    }
}
