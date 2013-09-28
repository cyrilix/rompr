var wikipedia = function() {

	return {

		search: function(terms, success, fail) {
			var url = "info_wikipedia.php?";
			for (var i in terms) {
				url = url + i+'='+encodeURIComponent(terms[i])+"&";
			}
			url = url.replace(/&$/,'');
		    $.ajax({
		        type: "GET",
		        url: url,
		        success: success,
		        error: fail
		    });
		},

		getFullUri: function(url, success, fail) {
			var url = "info_wikipedia.php?uri="+encodeURIComponent(url);
		    $.ajax({
		        type: "GET",
		        url: url,
		        success: success,
		        error: fail
		    });
		},

		wikiMediaPopup: function(element, event) {
        	imagePopup.create(element, event);
		    var url = "http://en.wikipedia.org/w/api.php?action=query&iiprop=url|size&prop=imageinfo&titles=" + element.attr('name') + "&format=json&callback=?";
		    $.getJSON(url, function(data) {
		        $.each(data.query.pages, function(index, value) {
		        	imagePopup.create(element, event, value.imageinfo[0].url);
		        	return false;
		        });
		    }).fail( function() { imagePopup.close() });
		    return false;
		},

		getWiki: function(link, success, fail) {
			$("#infopane").css({cursor:'wait'});
			$("#infopane a").css({cursor:'wait'});
			var url = "info_wikipedia.php?wiki="+link;
		    $.ajax({
		        type: "GET",
		        url: url,
		        success: function(data) {
		        	success(link, data);
		        },
		        error: function(data) {
		        	fail(data);
		        },
		        complete: function() {
					$("#infopane").css({cursor:'auto'});
					$("#infopane a").css({cursor:'auto'});
		        }
		    });
		},
	}

}();

// TODO
// info_wikipeda.php currently only handles en.wikipedia.org pages.
// We need the callbacks to include the domain info
// However... the fucking css classes are all in foreign too!