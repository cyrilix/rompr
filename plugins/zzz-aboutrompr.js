var aboutRompr = function() {

	var about = null;

	return {

		open: function() {
		    $("#configpanel").slideToggle('fast');

        	about = browser.registerExtraPlugin("about", "About Rompr", aboutRompr);

            $("#aboutfoldup").append(
            	'<h3 align="center">This is Rompr</h3>'+
            	'<p>Copyright Mark Greenwood and contributors, 2011 - 2014</p>'+
            	'<p><b>WHO?</b><br/>'+
            	'Most of the coding (good and bad) - Mark Greenwood<br>'+
            	'Many patches, and instilling some life back into the project, espcially with regard to translation - Vitaly Ignatov</p>'+
            	'<p><b>WHAT?</b><br>'+
            	'Rompr is all about discovery. Discovering more about the music you love and discovering music you don\'t know. '+
            	'That\'s why radio stations and Last.FM feature prominently and is why I like using it with Mopidy for Spotify support. '+
            	'If you love music you should get a Spotify subscription and check out Mopidy if you\'re not already using it.</p>'+
            	'<p><b>WHY?</b><br>'+
            	'Rompr exists because it\'s the client I want. The collectioniser aims to do what Amarok 1.4 used to do with my music collection. '+
            	'The looks aim to do what Amarok 2 does with my music collection. It\'s an MPD and Mopidy client because my media center is over there. '+
            	'And I frequently have nothing better to do than fart around with Javascript and I want a client that doesn\'t look like it was made in the 1980s.<br>'+
            	'Why is it called RompR? It just is. I think it was going to be an acronym but I gave up at \'R\'</p>'+
            	'<p><b>WHERE?</b><br>'+
            	'Rompr is developed on Mac OS X. In the UK, where Last.FM still works. My media centre runs Mythbuntu and is over there.<br>'+
            	'BLOG: <a href="https://sourceforge.net/p/rompr/blog/" target="_blank">https://sourceforge.net/p/rompr/blog/</a><br>'+
            	'WIKI: <a href="https://sourceforge.net/p/rompr/wiki/Installation/" target="_blank">https://sourceforge.net/p/rompr/wiki/Installation/</a><br>'+
            	'FORUM: <a href="https://sourceforge.net/p/rompr/discussion/" target="_blank">https://sourceforge.net/p/rompr/discussion/</a></p>'+
            	'<p><b>HOW?</b><br>'+
            	'RompR, like so much free software, is built on the work of others. Here\'s a list that\'s as complete as possible:<br>'+
            	'JQuery : <a href="http://jquery.com" target="_blank">http://jquery.com</a><br>'+
            	'JQuery UI (heavily modified) : <a href="http://jqueryui.com" target="_blank">http://jqueryui.com</a><br>'+
            	'JQuery AJAX Form Plugin : <a href="http://malsup.com/jquery/form" target="_blank">http://malsup.com/jquery/form</a><br>'+
            	'JQuery JSONP plugin : <a href="https://github.com/jaubourg/jquery-jsonp" target="_blank">https://github.com/jaubourg/jquery-jsonp</a><br>'+
            	'JQuery ScrollTo plugin : <a href="http://demos.flesler.com/jquery/scrollTo" target="_blank">http://demos.flesler.com/jquery/scrollTo</a><br>'+
            	'TipTip JQuery Tooltip plugin : <a href="http://code.drewwilson.com/entry/tiptip-jquery-plugin" target="_blank">http://code.drewwilson.com/entry/tiptip-jquery-plugin</a><br>'+
            	'JQuery Custom Scrollbar plugin : <a href="http://manos.malihu.gr/jquery-custom-content-scroller" target="_blank">http://manos.malihu.gr/jquery-custom-content-scroller</a><br>'+
            	'JQuery Touchwipe plugin : <a href="http://www.netcu.de/jquery-touchwipe-iphone-ipad-library" target="_blank">http://www.netcu.de/jquery-touchwipe-iphone-ipad-library</a><br>'+
            	'JavaScript MD5 hashing algorithm : <a href="http://pajhome.org.uk/crypt/md5" target="_blank">http://pajhome.org.uk/crypt/md5</a><br>'+
            	'JavaScript keyboard shortcut helper : <a href="http://www.openjs.com/scripts/events/keyboard_shortcuts" target="_blank">http://www.openjs.com/scripts/events/keyboard_shortcuts</a><br>'+
            	'JavaScript keycode normaliser : <a href="http://jonathan.tang.name/code/js_keycode" target="_blank">http://jonathan.tang.name/code/js_keycode</a><br>'+
            	'PHP generic URL downloader : <a href="http://andylangton.co.uk/" target="_blank">http://andylangton.co.uk/</a><br>'+
            	'PHP site URL finder : <a href="http://www.cleverlogic.net/tutorials/how-dynamically-get-your-sites-main-or-base-url" target="_blank">http://www.cleverlogic.net/tutorials/how-dynamically-get-your-sites-main-or-base-url</a><br>'+
            	'Each of the items in the above list is made available under a specific license. Please follow the links for details</p>'+
            	'<p><b>I DON\'T LIKE TO GET SERIOUS BUT...</b><br>'+
            	'<b>LICENSE</b><br>'+
            	'This program is SpongWare.<br>'+
			'The use of SpongWare is entirely according to the following conditions:<br>'+
			'1) You may use it or not, I don\'t care. Just don\'t winge at me, I hate that.<br>'+
			'2) It is provided \'as is\'. Nobody is responsible for anything it might or might not do.<br>'+
			'3) You may distribute it freely, although I would advise against printing it out and throwing it out of the window, that stuff gets you fined.<br>'+
			'4) You may alter it if you wish, and distribute the altered version if you wish but you must include this license and distribute it under this license.<br>'+
			'5) Before installing this software, smile at someone you like. Failure to do so is just not nice<br>'+
			'6) There is no rule 6<br>'+
			'7) This notice must be included with any copy of the software you distribute<br>'+
			'8) Adherence to \'coding standards\' is to be regarded with suspicion.<br>'+
			'9) If this program goes wrong in any way, for example it deletes all your data or perhaps it wipes the entire internet overnight and leaves the world a dead place, nobody is responsible. Deal with it. You use it at your own risk. As you do with, say, knives. Or cereal.<br>'+
			'10) Use of any part of this software in any commercial context by any for-profit organisation without the express permission of the author is forbidden.</p>'

            );

            about.slideToggle('fast');

		},

		close: function() {
			about = null;
		},

	}

}();

$("#specialplugins").append('<button onclick="aboutRompr.open()">About Rompr</button>');