/* Training Grounds – site behavior (no dependencies) */
(function () {
  "use strict";

  /* ---------- Announcement bar: dismiss for this browser session ---------- */
  var announce = document.querySelector("[data-announce]");
  if (announce) {
    var KEY = "tg-burlington-announce-dismissed";
    try {
      if (sessionStorage.getItem(KEY) === "1") announce.classList.add("is-hidden");
    } catch (e) { /* storage unavailable – always show */ }

    var closeBtn = announce.querySelector("[data-announce-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        announce.classList.add("is-hidden");
        try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      });
    }
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  if (navToggle) {
    var nav = navToggle.closest(".site-nav");
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    // Close the menu after choosing a link (useful for #locations on the same page)
    nav.querySelectorAll(".nav-list a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Hero carousel ---------- */
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".slide"));
    var dotsWrap = document.querySelector("[data-dots]");
    var current = 0;
    var timer = null;
    var INTERVAL = 7000;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", function () { go(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var active = n === current;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", String(!active));
        var vid = s.querySelector("video");
        if (vid) { active ? vid.play().catch(function () {}) : vid.pause(); }
      });
      dots.forEach(function (d, n) { d.setAttribute("aria-current", String(n === current)); });
    }

    function start() {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = setInterval(function () { go(current + 1); }, INTERVAL);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    var prev = carousel.querySelector("[data-prev]");
    var next = carousel.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { go(current - 1); restart(); });
    if (next) next.addEventListener("click", function () { go(current + 1); restart(); });

    // Pause while hovered or focused
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    // Swipe on touch devices
    var startX = null;
    carousel.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    go(0);
    start();
  }

  /* ---------- Hours: mark today's staffed row and whether it's open now ---------- */
  var hours = document.querySelector("[data-hours]");
  if (hours) {
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    hours.querySelectorAll("dt[data-days]").forEach(function (dt) {
      var days = dt.getAttribute("data-days").split(",").map(Number);
      if (days.indexOf(day) === -1) return;
      var dd = dt.nextElementSibling;
      var o = (dt.getAttribute("data-open") || "").split(":").map(Number);
      var c = (dt.getAttribute("data-close") || "").split(":").map(Number);
      var open = o[0] * 60 + (o[1] || 0);
      var close = c[0] * 60 + (c[1] || 0);
      var isOpen = mins >= open && mins < close;
      var tag = document.createElement("span");
      tag.textContent = isOpen ? " · Staffed now" : " · Today";
      if (isOpen) tag.className = "is-open-now";
      if (dd) dd.appendChild(tag);
    });
  }
})();
