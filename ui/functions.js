function getPosition(e) {
    e = e || window.event;
    var cursor = {x:0, y:0};
    if (e.pageX || e.pageY) {
        cursor.x = e.pageX;
        cursor.y = e.pageY;
    }
    else {
        var de = document.documentElement;
        var b = document.body;
        cursor.x = e.clientX +
            (de.scrollLeft || b.scrollLeft) - (de.clientLeft || 0);
        cursor.y = e.clientY +
            (de.scrollTop || b.scrollTop) - (de.clientTop || 0);
    }
    return cursor;
}

function getWindowSize() {
    var size = {x:0, y:0};
    if (document.body && document.body.offsetWidth) {
        size.x = document.body.offsetWidth;
        size.y = document.body.offsetHeight;
    }
    if (document.compatMode=='CSS1Compat' &&
        document.documentElement &&
        document.documentElement.offsetWidth ) {
            size.x = document.documentElement.offsetWidth;
            size.y = document.documentElement.offsetHeight;
    }
    if (window.innerWidth && window.innerHeight) {
        size.x = window.innerWidth;
        size.y = window.innerHeight;
    }
    size.o = window.orientation;
    return size;
}

function getScrollXY() {
    var scroll = {x:0, y:0};
    if( typeof( window.pageYOffset ) == 'number' ) {
        //Netscape compliant
        scroll.y = window.pageYOffset;
        scroll.x = window.pageXOffset;
    } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
        //DOM compliant
        scroll.y = document.body.scrollTop;
        scroll.x = document.body.scrollLeft;
    } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
        //IE6 standards compliant mode
        scroll.y = document.documentElement.scrollTop;
        scroll.x = document.documentElement.scrollLeft;
    }
    return scroll;
}

function zeroPad(num, count)
{
    var numZeropad = num + '';
    while(numZeropad.length < count) {
        numZeropad = "0" + numZeropad;
    }
    return numZeropad;
}

function cloneObject(obj) {
    var clone = {};
    for(var i in obj) {
        if(obj[i] !== null && typeof(obj[i])=="object")
            clone[i] = cloneObject(obj[i]);
        else
            clone[i] = obj[i];
    }
    return clone;
}

function rawurlencode (str) {
    str = (str+'').toString();
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function htmlspecialchars_decode(string) {
    string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#0*39;/g, "'").replace(/&quot;/g, '"');
    string = string.replace(/&amp;/g, '&');
    return string;
}

// The world's smallest jQuery plugin :)
jQuery.fn.reverse = [].reverse;
// http://www.mail-archive.com/discuss@jquery.com/msg04261.html

jQuery.fn.isOpen = function() {
    return this.hasClass('icon-toggle-open');
}

jQuery.fn.isClosed = function() {
    return this.hasClass('icon-toggle-closed');
}

jQuery.fn.toggleOpen = function() {
    this.removeClass('icon-toggle-closed').addClass('icon-toggle-open');
    return this;
}

jQuery.fn.toggleClosed = function() {
    this.removeClass('icon-toggle-open').addClass('icon-toggle-closed');
    return this;
}

jQuery.fn.removeInlineCss = function(property) {

    if(property == null)
        return this.removeAttr('style');

    var proporties = property.split(/\s+/);

    return this.each(function(){
        var remover =
            this.style.removeProperty   // modern browser
            || this.style.removeAttribute   // old browser (ie 6-8)
            || jQuery.noop;  //eventual

        for(var i = 0 ; i < proporties.length ; i++)
            remover.call(this.style,proporties[i]);

    });
};

jQuery.fn.makeSpinner = function() {

    return this.each(function() {
        var originalclasses = new Array();
        var classes = $(this).attr("class").split(/\s/);
        for (var i = 0, len = classes.length; i < len; i++) {
            if (classes[i] == "invisible" || (/^icon/.test(classes[i]))) {
                originalclasses.push(classes[i]);
                $(this).removeClass(classes[i]);
            }
        }
        $(this).attr("originalclass", originalclasses.join(" "));
        $(this).addClass('icon-spin6 spinner');
    });
}

jQuery.fn.stopSpinner = function() {

    return this.each(function() {
        $(this).removeClass('icon-spin6 spinner');
        if ($(this).attr("originalclass")) {
            $(this).addClass($(this).attr("originalclass"));
            $(this).removeAttr("originalclass");
        }
    });
}

jQuery.fn.makeFlasher = function(options) {
    var settings = $.extend({
        flashtime: 4,
        easing: "ease",
        repeats: "infinite"
    }, options);

    return this.each(function() {
        var anistring = "pulseit "+settings.flashtime+"s "+settings.easing+" "+settings.repeats;
        $(this).css({"-webkit-animation": "",
                    "-moz-animation": "",
                    "animation": "",
                    "opacity": ""});
        // Without this the animation won't re-run (unless we put a delay in here),
        // which is far from ideal. As is this, but it's better.
        $(this).hide().show();
        $(this).on('animationend', flashStopper);
        $(this).on('webkitAnimationEnd', flashStopper);
        $(this).on('oanimationend', flashStopper);
        $(this).on('MSAnimationEnd', flashStopper);
        $(this).css({"-webkit-animation": anistring,
                    "-moz-animation": anistring,
                    "animation": anistring});
    });
}

function flashStopper() {
    $(this).css({"-webkit-animation": "",
                "-moz-animation": "",
                "animation": "",
                "opacity": ""});
    $(this).off('animationend', flashStopper);
    $(this).off('webkitAnimationEnd', flashStopper);
    $(this).off('oanimationend', flashStopper);
    $(this).off('MSAnimationEnd', flashStopper);
}

jQuery.fn.stopFlasher = function() {
    return this.each(function() {
        $(this).css({"-webkit-animation": "",
                    "-moz-animation": "",
                    "animation": "",
                    "opacity": ""
        });
    });
}

jQuery.fn.switchToggle = function(state) {
    return this.each(function() {
        var st = (state == 0 || state == "off" || !state) ? "icon-toggle-off" : "icon-toggle-on";
        $(this).removeClass("icon-toggle-on icon-toggle-off").addClass(st);
    });
}

jQuery.fn.isToggledOff = function() {
    return this.hasClass('icon-toggle-off');
}

function formatTimeString(duration) {
    if (duration > 0) {
        var secs=duration%60;
        var mins = (duration/60)%60;
        var hours = duration/3600;
        if (hours >= 1) {
            return parseInt(hours.toString()) + ":" + zeroPad(parseInt(mins.toString()), 2) + ":" + zeroPad(parseInt(secs.toString()),2);
        } else {
            return parseInt(mins.toString()) + ":" + zeroPad(parseInt(secs.toString()),2);
        }
    } else {
        return "";
    }
}

function getArray(data) {
    try {
        switch (typeof data) {
            case "object":
                if (data.length) {
                    return data;
                } else {
                    return [data];
                }
                break;
            case "undefined":
                return [];
                break;
            default:
                return [data];
                break;
        }
    } catch(err) {
        return [];
    }
}

function utf8_encode(s) {
  return unescape(encodeURIComponent(s));
}

function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function unescapeHtml(text) {
  return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.initcaps = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

String.prototype.removePunctuation = function() {
    var punctRE = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#\$%&\(\)\*\+,\-\.\/:;<=>\?@\[\]\^_`\{\|\}~]/g;
    return this.replace(/\s*\&\s*/, ' and ').replace(punctRE,'').replace(/\s+/g, ' ');
}
