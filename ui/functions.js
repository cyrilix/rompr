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
        if(typeof(obj[i])=="object")
            clone[i] = cloneObject(obj[i]);
        else
            clone[i] = obj[i];
    }
    return clone;
}

function clearSelection() {
    /* Really wierd behaviour. If some text is selected when we change the contents of
     * a panel in the browser, Chrome's CPU usage climbs and climbs.
     * Perhaps a Chrome bug, but not tested in other browsers. This function gets called
     * to clear any selected text before we do anything.
     */
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }
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
    return this.attr('src') == 'newimages/toggle-open-new.png';
}

jQuery.fn.isClosed = function() {
    return this.attr('src') == 'newimages/toggle-closed-new.png';
}

jQuery.fn.toggleOpen = function() {
    this.attr('src', 'newimages/toggle-open-new.png');
}

jQuery.fn.toggleClosed = function() {
    this.attr('src', 'newimages/toggle-closed-new.png');
}

jQuery.fn.removeInlineCss = function(property){

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

