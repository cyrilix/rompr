$(document).ready(function(){
    debug.log("INIT","Document Ready Event has fired");
    infobar.createProgressBar();
    globalPlugins.initialise();
    player.controller.initialise();
    layoutProcessor.initialise();
    checkServerTimeOffset();
    $.get('utils/cleancache.php', function() {
        debug.shout("INIT","Cache Has Been Cleaned");
    });
    if (!prefs.hide_radiolist) {
        $("#yourradiolist").load("streamplugins/00_yourradio.php?populate");
    }
    if (prefs.country_userset == false) {
        // Have to pull this data in via the webserver as it's cross-domain
        // It's helpful and important to get the country code set, as many users won't see it
        // and it's necessary for the Spotify info panel to return accurate data
        $.getJSON("utils/getgeoip.php", function(result){
            debug.shout("GET COUNTRY", 'Country:',result.country,'Code:',result.country_code);
            $("#lastfm_country_codeselector").val(result.country_code);
            prefs.save({lastfm_country_code: result.country_code});
        });
    }
    $('.combobox').makeTagMenu({textboxextraclass: 'searchterm', textboxname: 'tag', labelhtml: '<div class="fixed searchlabel"><b>'+language.gettext("label_tag")+'</b></div>', populatefunction: populateTagMenu});
    $('.tagaddbox').makeTagMenu({textboxname: 'newtags', populatefunction: populateTagMenu, buttontext: language.gettext('button_add'), buttonfunc: tagAdder.add});
    browser.createButtons();
    setClickHandlers();
    setChooserButtons();
    $(".toggle").click(togglePref);
    $(".saveotron").keyup(saveTextBoxes);
    $(".saveomatic").change(saveSelectBoxes);
    $(".savulon").click(toggleRadio);
    setPrefs();
    if (prefs.playlistcontrolsvisible) {
        $("#playlistbuttons").show();
    }
    showUpdateWindow();
    if (!prefs.hide_radiolist) {
        podcasts.loadList();
    }
    window.addEventListener("storage", onStorageChanged, false);
    $("#sortable").click(onPlaylistClicked);
    layoutProcessor.sourceControl(prefs.chooser);
    layoutProcessor.adjustLayout();
    $(window).bind('resize', function() {
        layoutProcessor.adjustLayout();
    });
    if (prefs.chooser == "searchpane") {
        ihatefirefox();
    }
});
