var blockElements = ['div', 'section', 'article', 'aside', 'nav',
    'header', 'footer', 'main', 'form', 'fieldset', 'table'
];
var ignoredElements = ['script', 'style', 'noscript', 'br', 'hr'];

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var winArea = winWidth * winHeight;

var isPixel = function(element) {
    var rect = element.getBoundingClientRect();
    var height = rect.bottom - rect.top;
    var width = rect.right - rect.left;

    return (height === 1 && width === 1);
};

var isShown = function(element) {
    var displayed = function(element, style) {
        if (!style) {
            style = window.getComputedStyle(element);
        }

        if (style.display === 'none') {
            return false;
        } else {
            var parent = element.parentNode;

            if (parent && (parent.nodeType === Node.DOCUMENT_NODE)) {
                return true;
            }

            return parent && displayed(parent, null);
        }
    };

    var getOpacity = function(element, style) {
        if (!style) {
            style = window.getComputedStyle(element);
        }

        if (style.position === 'relative') {
            return 1.0;
        } else {
            return parseFloat(style.opacity);
        }
    };

    var positiveSize = function(element, style) {
        if (!style) {
            style = window.getComputedStyle(element);
        }

        var tagName = element.tagName.toLowerCase();
        var rect = getClientRect(element);
        if (rect.height > 0 && rect.width > 0) {
            return true;
        }

        if (tagName == 'path' && (rect.height > 0 || rect.width > 0)) {
            var strokeWidth = element.strokeWidth;
            return !!strokeWidth && (parseInt(strokeWidth, 10) > 0);
        }

        return style.overflow !== 'hidden' && Array.from(element.childNodes).some(
            n => (n.nodeType === Node.TEXT_NODE && !!filterText(n.nodeValue)) ||
                (n.nodeType === Node.ELEMENT_NODE &&
                    positiveSize(n) && window.getComputedStyle(n).display !== 'none')
        );
    };

    var getOverflowState = function(element) {
        var region = getClientRect(element);
        var htmlElem = document.documentElement;
        var bodyElem = document.body;
        var htmlOverflowStyle = window.getComputedStyle(htmlElem).overflow;
        var treatAsFixedPosition;

        function getOverflowParent(e) {
            var position = window.getComputedStyle(e).position;
            if (position === 'fixed') {
                treatAsFixedPosition = true;
                return e == htmlElem ? null : htmlElem;
            } else {
                var parent = e.parentElement;

                while (parent && !canBeOverflowed(parent)) {
                    parent = parent.parentElement;
                }

                return parent;
            }

            function canBeOverflowed(container) {
                if (container == htmlElem) {
                    return true;
                }

                var style = window.getComputedStyle(container);
                var containerDisplay = style.display;
                if (containerDisplay.startsWith('inline')) {
                    return false;
                }

                if (position === 'absolute' && style.position === 'static') {
                    return false;
                }

                return true;
            }
        }

        function getOverflowStyles(e) {
            var overflowElem = e;
            if (htmlOverflowStyle === 'visible') {
                if (e == htmlElem && bodyElem) {
                    overflowElem = bodyElem;
                } else if (e == bodyElem) {
                    return {
                        x: 'visible',
                        y: 'visible'
                    };
                }
            }

            var ostyle = window.getComputedStyle(overflowElem);
            var overflow = {
                x: ostyle.overflowX,
                y: ostyle.overflowY
            };

            if (e == htmlElem) {
                overflow.x = overflow.x === 'visible' ? 'auto' : overflow.x;
                overflow.y = overflow.y === 'visible' ? 'auto' : overflow.y;
            }

            return overflow;
        }

        function getScroll(e) {
            if (e == htmlElem) {
                return {
                    x: htmlElem.scrollLeft,
                    y: htmlElem.scrollTop
                };
            } else {
                return {
                    x: e.scrollLeft,
                    y: e.scrollTop
                };
            }
        }

        for (var container = getOverflowParent(element); !!container; container =
            getOverflowParent(container)) {
            var containerOverflow = getOverflowStyles(container);

            if (containerOverflow.x === 'visible' && containerOverflow.y ===
                'visible') {
                continue;
            }

            var containerRect = getClientRect(container);

            if (containerRect.width == 0 || containerRect.height == 0) {
                return 'hidden';
            }

            var underflowsX = region.right < containerRect.left;
            var underflowsY = region.bottom < containerRect.top;

            if ((underflowsX && containerOverflow.x === 'hidden') || (underflowsY &&
                containerOverflow.y === 'hidden')) {
                return 'hidden';
            } else if ((underflowsX && containerOverflow.x !== 'visible') || (
                underflowsY && containerOverflow.y !== 'visible')) {
                var containerScroll = getScroll(container);
                var unscrollableX = region.right < containerRect.left -
                    containerScroll.x;
                var unscrollableY = region.bottom < containerRect.top -
                    containerScroll.y;
                if ((unscrollableX && containerOverflow.x !== 'visible') || (
                    unscrollableY && containerOverflow.x !== 'visible')) {
                    return 'hidden';
                }

                var containerState = getOverflowState(container);
                return containerState === 'hidden' ? 'hidden' : 'scroll';
            }

            var overflowsX = region.left >= containerRect.left + containerRect.width;
            var overflowsY = region.top >= containerRect.top + containerRect.height;

            if ((overflowsX && containerOverflow.x === 'hidden') || (overflowsY &&
                containerOverflow.y === 'hidden')) {
                return 'hidden';
            } else if ((overflowsX && containerOverflow.x !== 'visible') || (
                overflowsY && containerOverflow.y !== 'visible')) {
                if (treatAsFixedPosition) {
                    var docScroll = getScroll(container);
                    if ((region.left >= htmlElem.scrollWidth - docScroll.x) || (
                        region.right >= htmlElem.scrollHeight - docScroll.y)) {
                        return 'hidden';
                    }
                }

                var containerState = getOverflowState(container);
                return containerState === 'hidden' ? 'hidden' : 'scroll';
            }
        }

        return 'none';
    };

    function hiddenByOverflow(element) {
        return getOverflowState(element) === 'hidden' && Array.from(element.childNodes)
            .every(n => n.nodeType !== Node.ELEMENT_NODE || hiddenByOverflow(n) ||
                !positiveSize(n));
    }

    var tagName = element.tagName.toLowerCase();

    if (tagName === 'body') {
        return true;
    }

    if (tagName === 'input' && element.type.toLowerCase() === 'hidden') {
        return false;
    }

    if (tagName === 'noscript' || tagName === 'script' || tagName === 'style') {
        return false;
    }

    var style = window.getComputedStyle(element);

    if (style == null) {
        return false;
    }

    if (style.visibility === 'hidden' || style.visibility === 'collapse') {
        return false;
    }

    if (!displayed(element, style)) {
        return false;
    }

    if (getOpacity(element, style) === 0.0) {
        return false;
    }

    if (!positiveSize(element, style)) {
        return false;
    }

    return !hiddenByOverflow(element);
};

var containsBlockElements = function(element, visibility = true) {
    for (var be of blockElements) {
        var children = Array.from(element.getElementsByTagName(be));
        if (visibility) {
            for (child of children){
                if (isShown(child))
                    return true;
            }
        }
        else {
            return children.length > 0 ? true : false;
        }
    }

    return false;
};

var getClientRect = function(element) {
    if (element.tagName.toLowerCase() === 'html') {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        return {
            top: 0,
            left: 0,
            bottom: h,
            right: w,
            width: w,
            height: h,
            x: 0,
            y: 0
        };
    }
    else {
        return element.getBoundingClientRect();
    }
};

var getElementArea = function(element) {
    var rect = element.getBoundingClientRect();
    return rect.height * rect.width;
};


var containsTextNodes = function(element) {
    if (element) {
        if (element.hasChildNodes()) {
            var nodes = [];
            for (var cnode of element.childNodes) {
                if (cnode.nodeType === Node.TEXT_NODE) {
                    var text = filterText(cnode.nodeValue);
                    if (text.length !== 0) {
                        nodes.push(text);
                    }
                }
            }

            return (nodes.length > 0 ? true : false);
        } else {
            return false;
        }
    } else {
        return false;
    }
};

var filterText = function(text) {
    return text.replace(/(\r\n|\n|\r)/gm, '').trim();
};


var allIgnoreChildren = function(element) {
    if (element.children.length === 0) {
        return false;
    } else {
        for (var child of element.children) {
            if (ignoredElements.includes(child.tagName.toLowerCase())) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }
};

var segments = function(element) {
    if (!element) {
        return [];
    }

    var tag = element.tagName.toLowerCase();
    if (!ignoredElements.includes(tag) && !isPixel(element) && isShown(element)) {
        if (blockElements.includes(tag)) {
            if (!containsBlockElements(element)) {
                if (allIgnoreChildren(element)) {
                    return [];
                } else {
                    if (getElementArea(element) / winArea > 0.3) {
                        var result = [];

                        for (var child of element.children) {
                            result = result.concat(segments(child));
                        }

                        return result;
                    }
                    else {
                        return [element];
                    }
                }
            } else if (containsTextNodes(element)) {
                return [element];
            } else {
                var result = [];

                for (var child of element.children) {
                    result = result.concat(segments(child));
                }

                return result;
            }
        } else {
            if (containsBlockElements(element, false)) {
                var result = [];

                for (var child of element.children) {
                    result = result.concat(segments(child));
                }

                return result;
            } else {
                if (getElementArea(element) / winArea > 0.3) {
                    var result = [];

                    for (var child of element.children) {
                        result = result.concat(segments(child));
                    }

                    return result;
                }
                else {
                    return [element];
                }
            }
        }
    } else {
        return [];
    }
};


var body = document.body
var texts = [];
var segment_data = [];
segments(body).forEach( e => {
    segment_data.push(e.innerText)
});
console.log(segment_data)
