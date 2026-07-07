/* elgoharyX — PWA install experience
   - Registers the service worker
   - Android/Chrome: captures beforeinstallprompt and shows a custom install bar
   - iOS Safari: shows "Add to Home Screen" instructions (no native prompt there)
   The bar is dismissible and remembers the choice, so it never nags. */
(function () {
  'use strict';

  var LOGO = 'https://i.ibb.co/1t1TCvH7/103777.png';
  var DISMISS_KEY = 'apb_pwa_dismissed';

  // pick the active language (saved choice, else device language) for banner text
  function _en(){ try { var l = localStorage.getItem('apb_lang'); if (l === 'en') return true; if (l === 'ar') return false;
    var d = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase(); return d.indexOf('ar') !== 0; } catch (e) { return false; } }
  function L(ar, en){ return _en() ? en : ar; }

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
      (withInstallBtn ? '<button class="pwa-install" id="pwaInstall">' + L('تثبيت', 'Install') + '</button>' : '') +
      '<button class="pwa-x" id="pwaClose" aria-label="' + L('إغلاق', 'Close') + '">&times;</button>';
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
    if (isStandalone) { toastMsg(L('التطبيق مثبّت بالفعل ✓', 'The app is already installed ✓')); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; document.body.classList.remove('can-install'); });
      return;
    }
    if (isIOS) {
      buildBanner(L('<b>ثبّت على الآيفون</b><span>اضغط زر المشاركة <span class="pwa-ico">&#x2191;</span> ثم اختر «إضافة إلى الشاشة الرئيسية».</span>', '<b>Install on iPhone</b><span>Tap the Share button <span class="pwa-ico">&#x2191;</span> then choose “Add to Home Screen”.</span>'), false);
      return;
    }
    buildBanner(L('<b>تثبيت التطبيق</b><span>افتح قائمة المتصفح ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</span>', '<b>Install the app</b><span>Open your browser menu, then choose “Install app” or “Add to Home Screen”.</span>'), false);
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
      L('<b>ثبّت التطبيق على جهازك</b><span>للوصول السريع والعمل دون اتصال — دون متجر تطبيقات.</span>', '<b>Install the app on your device</b><span>For quick access and offline use — no app store needed.</span>'),
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
          L('<b>ثبّت التطبيق على الآيفون</b>' +
          '<span>اضغط زر المشاركة <span class="pwa-ico">&#x2191;</span> ثم اختر «إضافة إلى الشاشة الرئيسية».</span>',
            '<b>Install the app on iPhone</b>' +
          '<span>Tap the Share button <span class="pwa-ico">&#x2191;</span> then choose “Add to Home Screen”.</span>'),
          false
        );
      }, 1800);
    }
  });
})();