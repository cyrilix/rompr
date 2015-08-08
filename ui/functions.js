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
    if (!text) return '';
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function unescapeHtml(text) {
    if (!text) return '';
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

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

