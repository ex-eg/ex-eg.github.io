/* elgoharyX — shared motion layer (loaded on every page).
   - Reveals elements with class "reveal" as they scroll into view.
   - Animates count-up numbers on [data-count] when they enter the viewport.
   - Works with content injected later by app.js (MutationObserver + scroll ticks).
   Rect-based (no IntersectionObserver dependency) so it works everywhere, and
   respects prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // requestAnimationFrame must be invoked with `this === window`; bind it once.
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window)
    : function (cb) { return setTimeout(cb, 16); };

  function vh() { return window.innerHeight || document.documentElement.clientHeight || 0; }
  function inView(el) {
    var r = el.getBoundingClientRect();
    var h = vh();
    return r.top < h * 0.92 && r.bottom > 0;
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = parseInt(el.getAttribute('data-dur'), 10) || 1500;
    if (reduce) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString('en-US') + suffix;
      if (p < 1) raf(step);
      else el.textContent = target.toLocaleString('en-US') + suffix;
    }
    raf(step);
    // guarantee the final value even if rAF is throttled (background / offscreen tab)
    setTimeout(function () { el.textContent = target.toLocaleString('en-US') + suffix; }, dur + 400);
  }

  function tick() {
    var reveals = document.querySelectorAll('.reveal:not(.in)');
    for (var i = 0; i < reveals.length; i++) {
      if (reduce || inView(reveals[i])) reveals[i].classList.add('in');
    }
    var counts = document.querySelectorAll('[data-count]:not(.counted)');
    for (var j = 0; j < counts.length; j++) {
      if (reduce || inView(counts[j])) { counts[j].classList.add('counted'); countUp(counts[j]); }
    }
  }

  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    var run = function () { ticking = false; tick(); };
    if (window.requestAnimationFrame) window.requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.readyState !== 'loading') schedule();
  else document.addEventListener('DOMContentLoaded', schedule);

  /* app.js re-renders #app asynchronously — catch new reveal/count nodes */
  if (window.MutationObserver && document.body) {
    var mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* final safety net: never leave content invisible */
  setTimeout(function () {
    var hidden = document.querySelectorAll('.reveal:not(.in)');
    for (var i = 0; i < hidden.length; i++) { if (inView(hidden[i])) hidden[i].classList.add('in'); }
    tick();
  }, 1200);
})();

/* ---------------------------------------------------------------------------
   Cookie-consent notice — shown once, remembered locally. Loaded on every page
   (this file is included site-wide). Covers essential storage (login session +
   theme preference) AND third-party advertising cookies (Google AdSense).
--------------------------------------------------------------------------- */
(function () {
  'use strict';
  var KEY = 'apb_cookie_consent';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

  var COOKIE_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 3 3 0 0 1-3-3 3 3 0 0 0-2-2Z"/>'
    + '<circle cx="9" cy="10" r="1"/><circle cx="14" cy="14" r="1"/><circle cx="10.5" cy="15" r="1"/></svg>';

  function close(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
    var bar = document.getElementById('cookieBar');
    if (!bar) return;
    bar.classList.remove('show');
    setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 320);
  }

  function show() {
    if (document.getElementById('cookieBar') || !document.body) return;
    var en = false;
    try { var l = localStorage.getItem('apb_lang');
      if (l === 'en') en = true; else if (l !== 'ar') {
        var d = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
        en = d.indexOf('ar') !== 0; }
    } catch (e) {}
    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.id = 'cookieBar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', en ? 'Cookie notice' : 'إشعار ملفات تعريف الارتباط');
    bar.innerHTML =
      '<div class="ck-in">' +
        '<span class="ck-ic">' + COOKIE_IC + '</span>' +
        '<div class="ck-tx">' + (en
          ? '<b>elgoharyX</b> uses cookies to save your login session and preferences, and to show ads via <b>Google</b> and its partners. By clicking “Accept” you agree to their use. '
          : 'يستخدم <b>elgoharyX</b> ملفات تعريف الارتباط (الكوكيز) لحفظ جلسة دخولك وتفضيلاتك، ولعرض الإعلانات عبر <b>Google</b> وشركائها. بالضغط على «موافق» فإنك توافق على استخدامها. ') +
          '<a href="privacy.html">' + (en ? 'Privacy Policy' : 'سياسة الخصوصية') + '</a></div>' +
        '<div class="ck-acts">' +
          '<button class="ck-btn ok" id="ckAccept">' + (en ? 'Accept' : 'موافق') + '</button>' +
          '<button class="ck-btn gh" id="ckDecline">' + (en ? 'Decline' : 'رفض') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    // setTimeout (not rAF) so the entrance still fires if the tab is throttled
    setTimeout(function () { bar.classList.add('show'); }, 30);
    document.getElementById('ckAccept').onclick = function () { close('1'); };
    document.getElementById('ckDecline').onclick = function () { close('0'); };
  }

  function boot() { setTimeout(show, 900); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
