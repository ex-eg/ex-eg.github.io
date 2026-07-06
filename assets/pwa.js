/* elgoharyX — PWA install experience
   - Registers the service worker
   - Android/Chrome: captures beforeinstallprompt and shows a custom install bar
   - iOS Safari: shows "Add to Home Screen" instructions (no native prompt there)
   The bar is dismissible and remembers the choice, so it never nags. */
(function () {
  'use strict';

  var LOGO = 'https://i.ibb.co/1t1TCvH7/103777.png';
  var DISMISS_KEY = 'apb_pwa_dismissed';

  // Register the service worker (enables offline + installability).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (err) {
        console.warn('SW registration failed:', err);
      });
    });
  }

  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream;

  function dismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function rememberDismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  var deferredPrompt = null;

  function buildBanner(bodyHTML, withInstallBtn) {
    if (document.getElementById('pwaBanner')) return null;
    var el = document.createElement('div');
    el.className = 'pwa-banner';
    el.id = 'pwaBanner';
    el.innerHTML =
      '<img class="pwa-logo" src="' + LOGO + '" alt="elgoharyX"/>' +
      '<div class="pwa-txt">' + bodyHTML + '</div>' +
      (withInstallBtn ? '<button class="pwa-install" id="pwaInstall">تثبيت</button>' : '') +
      '<button class="pwa-x" id="pwaClose" aria-label="إغلاق">&times;</button>';
    document.body.appendChild(el);
    // animate in on next frame
    requestAnimationFrame(function () { el.classList.add('show'); });
    document.getElementById('pwaClose').addEventListener('click', function () {
      hideBanner(); rememberDismiss();
    });
    return el;
  }

  function hideBanner() {
    var el = document.getElementById('pwaBanner');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }

  function toastMsg(m) {
    var t = document.getElementById('toast');
    if (t) { t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1900); }
  }

  // Public install trigger — wired to any [data-install] button on any page.
  function triggerInstall() {
    if (isStandalone) { toastMsg('التطبيق مثبّت بالفعل ✓'); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; document.body.classList.remove('can-install'); });
      return;
    }
    if (isIOS) {
      buildBanner('<b>ثبّت على الآيفون</b><span>اضغط زر المشاركة <span class="pwa-ico">&#x2191;</span> ثم اختر «إضافة إلى الشاشة الرئيسية».</span>', false);
      return;
    }
    buildBanner('<b>تثبيت التطبيق</b><span>افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</span>', false);
  }
  window.elgoInstall = triggerInstall;
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-install]') : null;
    if (b) { e.preventDefault(); triggerInstall(); }
  });
  window.addEventListener('load', function () {
    if (isStandalone) document.body.classList.add('is-standalone');
    else if (isIOS) document.body.classList.add('can-install');
  });

  // ----- Android / Chromium: native install flow -----
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (document.body) document.body.classList.add('can-install');
    if (isStandalone || dismissed()) return;
    var b = buildBanner(
      '<b>ثبّت التطبيق على جهازك</b><span>للوصول السريع والعمل دون اتصال — دون متجر تطبيقات.</span>',
      true
    );
    if (!b) return;
    document.getElementById('pwaInstall').addEventListener('click', function () {
      hideBanner();
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
    });
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideBanner();
    rememberDismiss();
  });

  // ----- iOS Safari: manual instructions (no beforeinstallprompt) -----
  window.addEventListener('load', function () {
    if (isIOS && !isStandalone && !dismissed()) {
      setTimeout(function () {
        buildBanner(
          '<b>ثبّت التطبيق على الآيفون</b>' +
          '<span>اضغط زر المشاركة <span class="pwa-ico">&#x2191;</span> ثم اختر «إضافة إلى الشاشة الرئيسية».</span>',
          false
        );
      }, 1800);
    }
  });
})();