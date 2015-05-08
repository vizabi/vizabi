//ADAPTED CODE FROM: http://blog.vjeux.com/2011/javascript/urlon-url-object-notation.html

var URLON={stringify:function(a){function b(a){return encodeURI(a.replace(/([=:&@_;\/])/g,"/$1"))}function c(a){if("number"==typeof a||a===!0||a===!1||null===a)return":"+a;if(a instanceof Array){for(var d=[],e=0;e<a.length;++e)d.push(c(a[e]));return"@"+d.join("&")+";"}if("object"==typeof a){var d=[];for(var f in a)d.push(b(f)+c(a[f]));return"_"+d.join("&")+";"}return"="+b((null!==a?void 0!==a?a:"undefined":"null").toString())}return c(a).replace(/;+$/g,"")},parse:function(a){function c(){for(var c="";b!==a.length;++b){if("/"===a.charAt(b)){if(b+=1,b===a.length){c+=";";break}}else if(a.charAt(b).match(/[=:&@_;]/))break;c+=a.charAt(b)}return c}function d(){var e=a.charAt(b++);if("="===e)return c();if(":"===e){var f=c();return"true"===f?!0:"false"===f?!1:(f=parseFloat(f),isNaN(f)?null:f)}if("@"===e){var g=[];a:if(!(b>=a.length||";"===a.charAt(b)))for(;;){if(g.push(d()),b>=a.length||";"===a.charAt(b))break a;b+=1}return b+=1,g}if("_"===e){var g={};a:if(!(b>=a.length||";"===a.charAt(b)))for(;;){var h=c();if(g[h]=d(),b>=a.length||";"===a.charAt(b))break a;b+=1}return b+=1,g}throw"Unexpected char "+e}var b=0;return a=decodeURI(a),d()}};

var URL = {};

//grabs width, height, tabs open, and updates the url
function updateURL() {
    var state;
    if(typeof VIZ !== 'undefined') {
       state = VIZ.getOptions().state
    }
    formatDates(state);

    var url = {
        width: parseInt(placeholder.style.width,10),
        height: parseInt(placeholder.style.height,10),
        fullscreen: hasClass(placeholder, 'fullscreen'),
        bodyC: document.body.getAttribute("class")
    };

    forEachElement(".collapsible-section", function(el, i) {
        var open = hasClass(el, "open");
        var id = el.getAttribute('id');
        url[id] = open;
    });

    url_string = URLON.stringify(url);
    forEachElement("#vzbp-nav a", function(el, i) {
        var href = el.getAttribute("href")+"#";
        href = href.substring(0, href.indexOf('#'));
        href += "#"+url_string;
        el.setAttribute("href", href);
    });

    if(state) {
        url.state = state;
        url_string = URLON.stringify(url);
    }

    window.history.replaceState('Object', 'Title', "#" + url_string);
}

function parseURL() {
    var hash = window.location.hash;

    if (hash) {
        options = URLON.parse(hash.replace("#", ""));

        URL.state = options.state;
        URL.lang = options.lang;

        if(setDivSize && options.width && options.height) {
            setDivSize(placeholder, options.width, options.height);
            if(options.fullscreen) {
                setFullscreen();
            }
        }

        forEachElement(".collapsible-section", function(el, i) {
            var id = el.getAttribute('id');
            if(options[id]) {
                addClass(el, 'open');
            }
            else {
                removeClass(el, 'open');
            }
        });

        if(options.bodyC) {
            document.body.setAttribute('class', options.bodyC);
        }
    }
}