// These are functions I pulled off the net
// Thanks are due to their authors, whoever they were....

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
