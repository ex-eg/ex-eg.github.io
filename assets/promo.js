/* =========================================================================
   elgoharyX — رسالة منبثقة تروّج للاشتراك المميّز
   تظهر بشكل عشوائي في الصفحات، ويمكن للمستخدم تخطّيها (إغلاقها).
   - لا تظهر للمشتركين المميّزين.
   - لا تظهر في صفحات الاشتراك/الدخول/الإدارة/الإنشاء.
   - بعد الإغلاق لا تظهر مجددًا لمدة يومين (فترة تهدئة).
   ========================================================================= */
(function () {
  'use strict';

  var CFG = {
    chance: 0.5,                 // احتمال الظهور في كل تحميل (0.5 = 50%)
    delayMs: 7000,               // تظهر بعد 7 ثوانٍ من فتح الصفحة
    cooldownMs: 2 * 24 * 3600 * 1000, // بعد الإغلاق: يومان بلا ظهور
    key: 'apb_promo_dismissed'
  };

  // صفحات لا تظهر فيها الرسالة إطلاقًا
  if (/(premium|login|admin|create-profile|create-blog)\.html/i.test(location.pathname)) return;

  // لا تظهر للمشترك المميّز
  try {
    var u = JSON.parse(localStorage.getItem('apb_user') || 'null');
    if (u && u.premium === true) return;
  } catch (e) {}

  // احترام الإغلاق السابق (فترة تهدئة)
  try {
    var last = +localStorage.getItem(CFG.key) || 0;
    if (Date.now() - last < CFG.cooldownMs) return;
  } catch (e) {}

  // ظهور عشوائي
  if (Math.random() > CFG.chance) return;

  var CROWN = '<svg viewBox="0 0 24 24" fill="#1a1300" width="24" height="24"><path d="M2.5 8.5 6.5 12l3.7-6 1.8 0L15.5 12l4-3.5-1.7 10.5H4.2L2.5 8.5Zm3.2 10.5h12.6"/></svg>';
  var base = location.pathname.replace(/[^/]*$/, ''); // يعمل على الجذر أو /eg2/

  function remember() { try { localStorage.setItem(CFG.key, String(Date.now())); } catch (e) {} }

  function show() {
    if (document.getElementById('promoPop')) return;
    var en = false;
    try { var l = localStorage.getItem('apb_lang');
      if (l === 'en') en = true; else if (l !== 'ar') {
        var d = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
        en = d.indexOf('ar') !== 0; }
    } catch (e) {}
    var box = document.createElement('div');
    box.id = 'promoPop';
    box.className = 'promo-pop';
    box.setAttribute('role', 'dialog');
    box.innerHTML =
      '<button class="promo-x" aria-label="' + (en ? 'Close' : 'إغلاق') + '">&times;</button>' +
      '<div class="promo-ic">' + CROWN + '</div>' +
      '<div class="promo-body">' +
        '<b>' + (en ? 'Unlock all features' : 'افتح كل المزايا') + '</b>' +
        '<span>' + (en ? 'No ads at all, turn your blog into an app, a premium badge, and more.' : 'بلا إعلانات نهائيًا، حوّل مدونتك إلى تطبيق، شارة مميّزة، والمزيد.') + '</span>' +
        '<a class="promo-cta" href="' + base + 'premium.html">' + (en ? 'Subscribe now' : 'اشترك الآن') + '</a>' +
      '</div>';
    document.body.appendChild(box);
    // slide-in
    requestAnimationFrame(function () { box.classList.add('show'); });

    box.querySelector('.promo-x').addEventListener('click', function () {
      remember();
      box.classList.remove('show');
      setTimeout(function () { box.remove(); }, 350);
    });
    box.querySelector('.promo-cta').addEventListener('click', remember);
  }

  function arm() { setTimeout(show, CFG.delayMs); }
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm);
})();
