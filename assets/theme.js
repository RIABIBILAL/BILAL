/**
 * ZINARA JEWELRY — theme JavaScript
 * Phase 3: header scroll state and the mobile menu disclosure.
 * Phase 5: product page variant picker and media thumbnails.
 * Cart, search and content pages are fully native (no JS required).
 * Phase 7: restrained cinematic interactions (scroll reveal, magnetic
 * CTAs, hero parallax) — every one of them checks prefers-reduced-motion
 * and, where it's a hover-driven effect, (hover: hover) and
 * (pointer: fine) before doing anything, and none of them hide content
 * that would stay hidden if the check (or the script) never ran.
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

  /**
   * Product media: clicking a thumbnail swaps the active main media item.
   * Progressive enhancement — the thumbnails are ordinary buttons that
   * still make sense without this (all media items are simply listed).
   */
  function initProductThumbnails() {
    var thumbnails = document.querySelectorAll('[data-thumbnail]');
    thumbnails.forEach(function (thumbnail) {
      thumbnail.addEventListener('click', function () {
        var root = thumbnail.closest('.product');
        if (!root) return;
        var mediaId = thumbnail.getAttribute('data-media-id');

        root.querySelectorAll('[data-thumbnail]').forEach(function (t) {
          var isActive = t === thumbnail;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        root.querySelectorAll('.product__media-item').forEach(function (item) {
          var matches = item.getAttribute('data-media-id') === mediaId;
          item.hidden = !matches;
          item.classList.toggle('is-active', matches);
        });
      });
    });
  }

  /**
   * Product form: keeps the hidden variant id, price, add-to-cart state
   * and active media in sync with the option selects, without a page
   * reload. Falls back gracefully — the form still works as a plain
   * native submit if this never runs (e.g. JS disabled).
   */
  function initProductForm() {
    var forms = document.querySelectorAll('.product__form');
    forms.forEach(function (form) {
      var root = form.closest('.product');
      if (!root) return;

      var jsonEl = root.querySelector('[data-product-json]');
      if (!jsonEl) return;

      var variants;
      try {
        variants = JSON.parse(jsonEl.textContent);
      } catch (error) {
        return;
      }

      var optionSelects = form.querySelectorAll('[data-product-option]');
      if (!optionSelects.length) return;

      var variantIdInput = form.querySelector('[data-product-variant-id]');
      var addToCartButton = form.querySelector('[data-add-to-cart]');
      var addToCartText = form.querySelector('[data-add-to-cart-text]');

      function findMatchingVariant() {
        var selected = Array.prototype.map.call(optionSelects, function (select) {
          return select.value;
        });
        return variants.filter(function (variant) {
          return variant.options.every(function (value, index) {
            return value === selected[index];
          });
        })[0];
      }

      function updateMedia(variant) {
        if (!variant || !variant.featured_media) return;
        var mediaId = String(variant.featured_media.id);

        root.querySelectorAll('[data-thumbnail]').forEach(function (t) {
          var matches = t.getAttribute('data-media-id') === mediaId;
          t.classList.toggle('is-active', matches);
          t.setAttribute('aria-selected', matches ? 'true' : 'false');
        });

        root.querySelectorAll('.product__media-item').forEach(function (item) {
          var matches = item.getAttribute('data-media-id') === mediaId;
          item.hidden = !matches;
          item.classList.toggle('is-active', matches);
        });
      }

      function updateForm() {
        var variant = findMatchingVariant();
        if (!variant) return;

        if (variantIdInput) variantIdInput.value = variant.id;

        if (addToCartButton) {
          addToCartButton.disabled = !variant.available;
        }

        if (addToCartText) {
          addToCartText.textContent = variant.available
            ? addToCartText.getAttribute('data-available-text')
            : addToCartText.getAttribute('data-sold-out-text');
        }

        updateMedia(variant);

        if (window.history && window.history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url);
        }
      }

      optionSelects.forEach(function (select) {
        select.addEventListener('change', updateForm);
      });
    });
  }

  /**
   * Scroll reveal: fades/settles [data-animate] blocks into place as they
   * enter the viewport. Elements are visible by default in CSS — only
   * once this runs (motion allowed, IntersectionObserver available) do
   * they get hidden-then-revealed, so there's no FOUC and no dependency
   * on JS for the content to appear.
   */
  function initScrollReveal() {
    var elements = document.querySelectorAll('[data-animate]');
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    elements.forEach(function (el) {
      el.classList.add('is-animating');
    });

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /**
   * Magnetic CTA: primary/secondary buttons drift a few pixels toward the
   * cursor. Desktop pointer devices only, disabled under reduced motion.
   * Sets CSS custom properties the .button rule already knows how to
   * consume — never touches layout-affecting inline styles.
   */
  function initMagneticButtons() {
    if (!window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var maxOffset = 6;
    var buttons = document.querySelectorAll('.button--primary, .button--secondary');

    buttons.forEach(function (button) {
      button.addEventListener('mousemove', function (event) {
        var rect = button.getBoundingClientRect();
        var relX = (event.clientX - rect.left) / rect.width - 0.5;
        var relY = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.setProperty('--zinara-magnetic-x', (relX * maxOffset * 2).toFixed(1) + 'px');
        button.style.setProperty('--zinara-magnetic-y', (relY * maxOffset * 2).toFixed(1) + 'px');
      });

      button.addEventListener('mouseleave', function () {
        button.style.setProperty('--zinara-magnetic-x', '0px');
        button.style.setProperty('--zinara-magnetic-y', '0px');
      });
    });
  }

  /**
   * Hero parallax: the hero image drifts a few pixels vertically with
   * scroll — capped, rAF-throttled, desktop pointer devices only,
   * disabled under reduced motion.
   */
  function initHeroParallax() {
    var heroMedia = document.querySelector('.hero__media');
    if (!heroMedia) return;

    var heroImage = heroMedia.querySelector('.hero__image');
    if (!heroImage) return;

    if (!window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var maxShift = 30;
    var ticking = false;

    function update() {
      var rect = heroMedia.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var progress = 1 - (rect.top + rect.height / 2) / (viewportHeight + rect.height);
      var clamped = Math.max(0, Math.min(1, progress));
      var shift = (clamped - 0.5) * 2 * maxShift;
      heroImage.style.transform = 'translate3d(0, ' + shift.toFixed(1) + 'px, 0) scale(1.04)';
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScrollState();
    initMobileMenu();
    initProductThumbnails();
    initProductForm();
    initScrollReveal();
    initMagneticButtons();
    initHeroParallax();
  });
})();
