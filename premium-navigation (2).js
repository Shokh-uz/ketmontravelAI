/* ===================================
   PREMIUM NAVIGATION & SCROLL EFFECTS
   Phase 2: Premium Redesign
   =================================== */

(function () {
    'use strict';

    // Sticky Navigation on Scroll
    const navigationSection = document.querySelector('.navigation-section');
    const scrollToTopBtn = document.getElementById('scrollToTop');

    let lastScrollTop = 0;

    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add 'scrolled' class when scrolled down
        if (scrollTop > 50) {
            navigationSection?.classList.add('scrolled');
        } else {
            navigationSection?.classList.remove('scrolled');
        }

        // Show/hide scroll to top button
        if (scrollTop > 300) {
            scrollToTopBtn?.classList.add('visible');
        } else {
            scrollToTopBtn?.classList.remove('visible');
        }

        lastScrollTop = scrollTop;
    }

    // Throttle scroll event for better performance
    let scrollTimeout;
    window.addEventListener('scroll', function () {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(handleScroll);
    });

    // Scroll to top functionality
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Active link highlighting - REMOVED for native performance
    // Smooth scroll - REMOVED for native CSS scroll-behavior
    // Ripple effects - REMOVED for performance

    // Initialize on page load
    handleScroll();

})();

// Mobile menu auto-close (Lightweight)
(function () {
    const mobileLinks = document.querySelectorAll('.mobile-nav-list a');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileLinks.length > 0 && mobileNav) {
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.remove('active');
            });
        });
    }
})();
