/* =========================================================================
   elgoharyX — إعلانات Google AdSense (الربح من الموقع)
   -------------------------------------------------------------------------
   ▼▼▼ الخطوة الوحيدة المطلوبة منك ▼▼▼
   1) افتح حساب AdSense على https://adsense.google.com وأضِف موقعك
      (ex-eg.github.io) وانتظر الموافقة.
   2) بعد الموافقة، انسخ "معرّف الناشر" ويبدأ بـ  ca-pub-  وضعه في client.
   3) من AdSense أنشئ 4 وحدات إعلانية من نوع «عرض / Display»،
      وانسخ رقم كل وحدة (Ad slot) وضعه في المكان المناسب داخل slots.
   4) عدّل ملف ads.txt في جذر الموقع ليحتوي على نفس معرّف الناشر.
   قبل وضع معرّف حقيقي لن تظهر أي إعلانات ولن تُحمّل مكتبة جوجل — الموقع آمن.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = {
    // معرّف الناشر — مثال: 'ca-pub-1234567890123456'
    client: 'ca-pub-8599845319245705',

    // أرقام الوحدات الإعلانية (Ad slot) — كل رقم مكوّن من أرقام فقط
    slots: {
      article: '0000000000', // داخل مقالات المدونة
      infeed:  '0000000000', // صفحة استكشاف المدونات
      profile: '0000000000', // صفحات البروفايل العامة
      home:    '0000000000'  // الصفحة الرئيسية
    },

    label: (function(){ try{ var l=localStorage.getItem('apb_lang'); if(l==='en') return 'Ad'; if(l==='ar') return 'إعلان'; return /^ar/i.test((navigator.language||''))?'إعلان':'Ad'; }catch(e){ return 'إعلان'; } })(),        // الكلمة التي تظهر فوق كل إعلان
    respectPremium: true   // إخفاء الإعلانات عن المشتركين المميّزين
  };

  window.ELG_ADS = CFG;

  // مُفعّل فقط بعد وضع معرّف ناشر حقيقي (ca-pub-XXXXXXXXXXXXXXXX الافتراضي لا يُفعّل)
  var ENABLED = /^ca-pub-\d{10,}$/.test(CFG.client);

  // هل المستخدم الحالي مشترك مميّز؟ (نقرأ نفس الكاش الذي يستخدمه التطبيق)
  function isPremiumViewer() {
    if (!CFG.respectPremium) return false;
    if (window.ELG_NO_ADS === true) return true;
    try {
      var u = JSON.parse(localStorage.getItem('apb_user') || 'null');
      return !!(u && u.premium === true);
    } catch (e) { return false; }
  }

  var OFF = !ENABLED || isPremiumViewer();

  // حمّل مكتبة AdSense مرّة واحدة فقط — وتجنّب التكرار إن كانت موجودة في <head>
  if (!OFF && !document.querySelector('script[src*="adsbygoogle.js"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CFG.client;
    s.crossOrigin = 'anonymous';
    (document.head || document.documentElement).appendChild(s);
  }

  // املأ كل حاويات الإعلانات (.elg-ad) التي لم تُملأ بعد
  function fill(root) {
    if (OFF) return;
    var scope = root && root.querySelectorAll ? root : document;
    var boxes = scope.querySelectorAll('.elg-ad:not([data-done])');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var kind = box.getAttribute('data-ad') || 'article';
      var slot = CFG.slots[kind] || CFG.slots.article;
      // رقم الوحدة لم يُضبط بعد (فارغ أو أصفار) — نتركها مخفيّة، وإعلانات Auto تملأ الصفحة تلقائيًا
      if (!/^\d{6,}$/.test(slot) || /^0+$/.test(slot)) continue;
      box.setAttribute('data-done', '1');

      var lbl = document.createElement('span');
      lbl.className = 'elg-ad-lbl';
      lbl.textContent = CFG.label;

      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', CFG.client);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      box.appendChild(lbl);
      box.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }
  }

  // متاحة للتطبيق (app.js) لاستدعائها بعد كل عملية عرض ديناميكية
  window.elgFillAds = fill;

  if (document.readyState !== 'loading') fill();
  else document.addEventListener('DOMContentLoaded', function () { fill(); });
})();
