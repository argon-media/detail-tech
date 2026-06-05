/* ============================================================
   Detail Tech — interactions (vanilla JS)
   ============================================================ */
(function () {
  "use strict";

  var QUOTE_URL = "https://app.urable.com/form/pxsoT9kI8FilhUXb06DN/GsoJU7spNrMB6gylHQiU";

  /* ---- Sticky header state ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 12) header.classList.add("is-stuck");
    else header.classList.remove("is-stuck");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav ---- */
  var drawer = document.getElementById("mobileNav");
  var openBtn = document.getElementById("menuToggle");
  var closeBtn = document.getElementById("menuClose");
  function openNav() { drawer.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  function closeNav() { drawer.classList.remove("is-open"); document.body.style.overflow = ""; }
  if (openBtn) openBtn.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  drawer.querySelectorAll("a[href^='#']").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Animated stat counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = (el.getAttribute("data-decimals") | 0);
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq");
      var isOpen = item.classList.contains("is-open");
      // close siblings for a clean single-open accordion
      document.querySelectorAll(".faq.is-open").forEach(function (o) {
        if (o !== item) { o.classList.remove("is-open"); o.querySelector(".faq__q").setAttribute("aria-expanded", "false"); }
      });
      item.classList.toggle("is-open", !isOpen);
      q.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  /* ---- Multi-step quote form -> hand off to Urable ---- */
  var form = document.getElementById("quoteForm");
  if (form) {
    var panels = form.querySelectorAll(".mstep__panel");
    var total = panels.length;
    var cur = 1;
    var sel = {};
    var elProgress = document.getElementById("mProgress");
    var elCount = document.getElementById("mCount");
    var elBack = document.getElementById("mBack");
    var elNext = document.getElementById("mNext");
    var elSubmit = document.getElementById("mSubmit");
    var elSummary = document.getElementById("mSummary");

    // option button selection (single per group)
    form.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var group = b.getAttribute("data-group");
        form.querySelectorAll('.opt[data-group="' + group + '"]').forEach(function (o) { o.classList.remove("is-sel"); });
        b.classList.add("is-sel");
        sel[group] = b.getAttribute("data-val");
        // auto-advance from step 1 (service pick)
        if (group === "service" && cur === 1) { setTimeout(function () { go(2); }, 220); }
      });
    });

    function show(n) {
      panels.forEach(function (p) { p.classList.toggle("is-active", +p.getAttribute("data-step") === n); });
      elProgress.style.width = (n / total * 100) + "%";
      elCount.textContent = "Step " + n + " of " + total;
      elBack.style.display = n === 1 ? "none" : "";
      elNext.style.display = n === total ? "none" : "";
      elSubmit.style.display = n === total ? "" : "none";
      if (n === total) {
        var v = (document.getElementById("qvehicle") || {}).value;
        elSummary.innerHTML = "<b>Service:</b> " + (sel.service || "—") +
          "<br><b>Vehicle:</b> " + (v ? v : "") + (sel.type ? " (" + sel.type + ")" : (v ? "" : "—"));
      }
    }
    function go(n) { cur = Math.max(1, Math.min(total, n)); show(cur); }

    elNext.addEventListener("click", function () {
      if (cur === 1 && !sel.service) { form.querySelector(".opt").focus(); return; }
      go(cur + 1);
    });
    elBack.addEventListener("click", function () { go(cur - 1); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      elSubmit.textContent = "Opening secure form…";
      elSubmit.disabled = true;
      window.location.href = QUOTE_URL;
    });

    show(1);
  }

  /* ---- Before / After peek carousel (infinite loop) ---- */
  (function () {
    var track = document.getElementById("baTrack");
    var slider = document.getElementById("baSlider");
    if (!track || !slider) return;
    var viewport = track.parentElement;
    var reals = Array.prototype.slice.call(track.children);
    var N = reals.length;
    if (N === 0) return;
    var dotsWrap = document.getElementById("baDots");
    var timer = null;

    var cloneFirst = reals[0].cloneNode(true);
    var cloneLast = reals[N - 1].cloneNode(true);
    track.insertBefore(cloneLast, reals[0]);
    track.appendChild(cloneFirst);
    var slides = track.children;
    var pos = N > 2 ? 2 : 1;
    var animating = false;

    for (var d = 0; d < N; d++) {
      var dot = document.createElement("button");
      dot.className = "ba__dot";
      dot.setAttribute("aria-label", "Go to result " + (d + 1));
      (function (idx) { dot.addEventListener("click", function () { goReal(idx); restart(); }); })(d);
      dotsWrap.appendChild(dot);
    }
    var dots = dotsWrap.children;

    function slideW() { return slides[0].getBoundingClientRect().width; }
    function gapW() { var g = getComputedStyle(track); return parseFloat(g.columnGap || g.gap) || 18; }

    function place(animate) {
      track.style.transition = animate ? "" : "none";
      var w = slideW(), gap = gapW();
      var offset = pos * (w + gap) - (viewport.clientWidth - w) / 2;
      track.style.transform = "translateX(" + (-offset) + "px)";
      var realIdx = (pos - 1 + N) % N;
      for (var k = 0; k < slides.length; k++) slides[k].classList.toggle("is-active", k === pos);
      for (var m = 0; m < dots.length; m++) dots[m].classList.toggle("is-active", m === realIdx);
      if (!animate) { void track.offsetWidth; track.style.transition = ""; }
    }
    function goReal(idx) { pos = idx + 1; place(true); }
    function next() { if (animating) return; animating = true; pos++; place(true); }
    function prev() { if (animating) return; animating = true; pos--; place(true); }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, 5500); }

    track.addEventListener("transitionend", function (e) {
      if (e.propertyName !== "transform") return;
      animating = false;
      if (pos === slides.length - 1) { pos = 1; place(false); }
      else if (pos === 0) { pos = N; place(false); }
    });

    var nextBtn = document.getElementById("baNext");
    var prevBtn = document.getElementById("baPrev");
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    for (var s = 0; s < slides.length; s++) {
      (function (domIdx) { slides[domIdx].addEventListener("click", function () { if (domIdx !== pos && !animating) { pos = domIdx; place(true); restart(); } }); })(s);
    }

    var startX = 0, dragging = false;
    slider.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; dragging = true; }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (!dragging) return; dragging = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
    }, { passive: true });

    window.addEventListener("resize", function () { place(false); });
    place(false);
    restart();
  })();

  /* ---- Year ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
