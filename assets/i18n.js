/* =========================================================================
   elgoharyX — تبديل اللغة (عربي / English)
   كل عنصر قابل للترجمة يحمل السمة data-en بالنص الإنجليزي (يدعم HTML).
   نخزّن العربي الأصلي في data-ar تلقائيًا أول مرة، ونبدّل حسب الاختيار.
   الاختيار محفوظ في localStorage (apb_lang) ويضبط اتجاه الصفحة (rtl/ltr).
   ========================================================================= */
(function () {
  'use strict';
  var KEY = 'apb_lang';
  /* لغة الجهاز: عربي لو الجهاز عربي، وإلا إنجليزي (الأوسع انتشارًا) */
  function deviceLang(){
    try {
      var l = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
      return l.indexOf('ar') === 0 ? 'ar' : 'en';
    } catch (e) { return 'ar'; }
  }
  /* الأولوية: اختيار المستخدم المحفوظ ← ثم الكشف التلقائي حسب لغة الجهاز */
  function getLang(){
    try { var s = localStorage.getItem(KEY); if (s === 'en' || s === 'ar') return s; } catch (e) {}
    return deviceLang();
  }
  function saveLang(l){ try { localStorage.setItem(KEY, l); } catch (e) {} }

  function apply(lang){
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    var nodes = document.querySelectorAll('[data-en]');
    for (var i = 0; i < nodes.length; i++){
      var el = nodes[i];
      if (!el.hasAttribute('data-ar')) el.setAttribute('data-ar', el.innerHTML);
      el.innerHTML = (lang === 'en') ? el.getAttribute('data-en') : el.getAttribute('data-ar');
    }
    // نصّ الأزرار: يعرض اللغة الأخرى (التي سينتقل إليها)
    var toggles = document.querySelectorAll('[data-lang-toggle]');
    for (var j = 0; j < toggles.length; j++){
      var lbl = toggles[j].querySelector('.lt-label');
      if (lbl) lbl.textContent = (lang === 'en') ? 'العربية' : 'English';
      toggles[j].setAttribute('aria-label', (lang === 'en') ? 'التبديل إلى العربية' : 'Switch to English');
    }
  }

  window.elgSetLang = function (l){ l = (l === 'en') ? 'en' : 'ar'; saveLang(l); apply(l); };
  window.elgToggleLang = function (){ window.elgSetLang(getLang() === 'en' ? 'ar' : 'en'); };
  window.elgGetLang = getLang;

  function boot(){
    var toggles = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < toggles.length; i++) toggles[i].addEventListener('click', window.elgToggleLang);
    apply(getLang());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
