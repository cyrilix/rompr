var aboutRompr = function() {

      var about = null;

      return {

      open: function() {
            if (about == null) {
      	      about = browser.registerExtraPlugin("about", "About Rompr", aboutRompr);
                  $("#aboutfoldup").load("includes/about.html", function() {
                        about.slideToggle('fast', function() {
                              browser.goToPlugin("about");
                        });
                  });
            } else {
                  browser.goToPlugin("about");
            }
      },

      close: function() {
      	about = null;
      }

}

}();

$("#specialplugins").append('<button onclick="aboutRompr.open()">'+language.gettext("button_about")+'</button>');