// General Scrolling Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Determine if the element is scrolled into view
 * @param {text} id              The id of the element
 * @param {int} percentage       Return true if the percentage is visible
 */
function isScrolledIntoView(id, percentage) {
    if (!isEmpty(id)) {
        var elemId = $(id);
        if (!isEmpty(elemId)) {
            percentage = (!isEmpty(percentage)) ? parseInt(percentage) : 0;
            var docViewTop = $(window).scrollTop();
            var docViewBottom = docViewTop + $(window).height();

            var elemTop = $(id).offset().top;
            var elemBottom = elemTop + $(id).height();
            var percentageVisible = (docViewBottom - elemTop) / (elemBottom - elemTop) * 100;

            return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop)) || (percentage > 0 && percentageVisible > percentage);
        }
        else
            return false;
    }
    else
        return false;
}

/**
 * Prevent background scrolling when the menu is open and a modal is open
 * @param {bool} bool   If true, allow scrolling
 */
function scrollHTMLBody(bool) {
    var h = $('html');
    var b = $('body');
    if (parseBool(bool)) {
        //Enable Scrolling
        h.removeClass('scrollLock');
        b.removeClass('scrollLock');
    }
    else {
        h.addClass('scrollLock');
        b.addClass('scrollLock');
    }
}

/**
 * unbind the scroll event handler
 * @param {object} handler         The handler to unbind from the scroll event
 */
function unbindScrollEventHandler(handler) {
    $(document).unbind('scroll', handler);
}