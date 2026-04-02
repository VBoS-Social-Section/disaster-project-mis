/**
 * DRMIS Sidebar — Accordion (one group open at a time).
 * Strategy: wait for AdminLTE to fully init, then patch its Treeview
 * plugin so accordion mode is on, AND add our own capture-phase listener
 * as a hard fallback.
 */
(function () {
  "use strict";

  /* ── helpers ── */
  function collapse(item) {
    item.classList.remove("menu-open");
    var sub = item.querySelector(".nav-treeview");
    if (!sub) return;
    // Stop any jQuery slideDown in progress, force hide
    if (window.$) { try { $(sub).stop(true, true).hide(); } catch(e){} }
    sub.style.display  = "none";
    sub.style.height   = "";
    sub.style.overflow = "";
  }

  function expand(item) {
    item.classList.add("menu-open");
    var sub = item.querySelector(".nav-treeview");
    if (!sub) return;
    if (window.$) { try { $(sub).stop(true, true).show(); } catch(e){} }
    sub.style.display = "block";
  }

  function closeAllExcept(nav, keep) {
    nav.querySelectorAll(".nav-item.has-treeview.menu-open").forEach(function (item) {
      if (item !== keep) collapse(item);
    });
  }

  /* ── patch AdminLTE Treeview plugin (jQuery path) ── */
  function patchJqueryPlugin() {
    if (!window.$ || !$.fn || !$.fn.Treeview) return false;

    var orig = $.fn.Treeview;

    $.fn.Treeview = function (options) {
      // Force accordion option on every init call
      if (typeof options === "object" || options === undefined) {
        options = $.extend({}, options, { accordion: true });
      }
      return orig.call(this, options);
    };

    // Re-init any already-attached instances with accordion on
    $('[data-widget="treeview"]').each(function () {
      var inst = $(this).data("lte.treeview");
      if (inst) {
        try {
          inst._config = $.extend({}, inst._config, { accordion: true });
        } catch(e) {}
      }
    });

    return true;
  }

  /* ── hard-fallback capture-phase listener ── */
  function attachCapture(nav) {
    nav.addEventListener("click", function (e) {
      var link = e.target.closest(".nav-item.has-treeview > .nav-link");
      if (!link) return;

      var clicked = link.closest(".nav-item.has-treeview");
      var wasOpen = clicked.classList.contains("menu-open");

      // Let the event bubble normally so AdminLTE can toggle the class/animation,
      // but schedule a cleanup immediately after to enforce accordion.
      setTimeout(function () {
        // After AdminLTE has run: collapse everything else
        closeAllExcept(nav, wasOpen ? null : clicked);
        // If it was already open AdminLTE will have closed it — nothing more to do.
      }, 0);

    }, true); // capture phase — runs before AdminLTE
  }

  /* ── main init ── */
  function init() {
    var nav = document.querySelector(".nav-sidebar");
    if (!nav) return;

    patchJqueryPlugin();
    attachCapture(nav);
  }

  /* Run after everything else on the page has loaded */
  if (document.readyState === "complete") {
    setTimeout(init, 80);
  } else {
    window.addEventListener("load", function () { setTimeout(init, 80); });
  }

})();
