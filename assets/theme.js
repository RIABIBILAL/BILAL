/**
 * ZINARA JEWELRY — theme JavaScript
 * Phase 3: header scroll state and the mobile menu disclosure.
 * Cinematic effects are added in a later phase — always respecting
 * prefers-reduced-motion.
 */

(function () {
  'use strict';

  /**
   * Header scroll state: swaps a transparent/overlay header to a solid
   * ivory one once the page has scrolled past a small threshold.
   */
  function initHeaderScrollState() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var scrollThreshold = 8;
    var ticking = false;

    function updateHeaderState() {
      var isScrolled = window.scrollY > scrollThreshold;
      header.classList.toggle('site-header--scrolled', isScrolled);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    }

    updateHeaderState();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * Mobile menu disclosure: toggles the panel via the hidden attribute
   * (no open/close animation — restrained by design), traps Escape to
   * close, and returns focus to the toggle button on close.
   */
  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    var closeButton = document.querySelector('[data-menu-close]');
    if (!toggle || !menu) return;

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('has-overlay-open');
      var firstFocusable = menu.querySelector('a, button');
      if (firstFocusable) firstFocusable.focus();
    }

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('has-overlay-open');
      toggle.focus();
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeButton) {
      closeButton.addEventListener('click', closeMenu);
    }

    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScrollState();
    initMobileMenu();
  });
})();
