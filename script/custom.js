(function ($) {
    "use strict";

    function currentPage() {
        var path = window.location.pathname.split("/").pop();
        return path || "index.html";
    }

    $(function () {
        $(".navbar-fixed-top").addClass("top-nav-collapse");

        if (window.WOW) new WOW().init();

        $("#preloader").delay(100).fadeOut("slow");
        $("#load").delay(100).fadeOut("slow");

        var page = currentPage();
        $(".navbar-nav li").removeClass("active").each(function () {
            var link = $(this).find("a").first().attr("href");
            if (link && link.split("/").pop() === page) $(this).addClass("active");
        });

        $("body.page-people .teampeople").each(function () {
            if (!$(this).find(".avatar").length) $(this).addClass("people-alumni");
        });

        $(".navbar-nav li a").on("click", function (event) {
            var href = $(this).attr("href") || "";
            var target = href.charAt(0) === "#" ? $(href) : $();

            if (target.length) {
                event.preventDefault();
                $("html, body").stop().animate({
                    scrollTop: target.offset().top - 68
                }, 700, "easeInOutExpo");
            }

            if ($(".navbar-collapse").hasClass("in") && $.fn.collapse) {
                $(".navbar-collapse").collapse("hide");
            }
        });

        $(".page-scroll a").on("click", function (event) {
            var href = $(this).attr("href") || "";
            var target = href.charAt(0) === "#" ? $(href) : $();
            if (!target.length) return;

            event.preventDefault();
            $("html, body").stop().animate({
                scrollTop: target.offset().top - 68
            }, 700, "easeInOutExpo");
        });

        $(window).on("scroll", function () {
            $("#back-to-top").toggle($(this).scrollTop() > 300);
        });
    });
}(jQuery));
