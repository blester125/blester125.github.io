/*!
 * Start Bootstrap - Agency Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        var loc = $anchor.attr('href');
        $anchor.blur();
        $('html, body').stop().animate({
            scrollTop: $(loc).offset().top
        }, 1000, 'easeInOutExpo');
        if (loc != "#page-top"){
            window.history.pushState({}, "", loc)
        } else {
            window.history.pushState({}, "", "/")
        }
        event.preventDefault();
    });
});

$(document).ready(function() {
    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top'
    })

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a, .navbar-brand').click(function() {
        var button = $('.navbar-toggle:visible');
        if (!button.hasClass('collapsed')) {
            button.click();
        }
    });
});
