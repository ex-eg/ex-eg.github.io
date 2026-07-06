/* elgoharyX — Firebase initialization.
   Single source of truth for the database connection. Every module that needs
   the DB imports `db` and the helpers from here instead of re-initializing. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app-check.js";
import { getDatabase, ref, set, get, child, remove, update, increment } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDynVoQRSD9icEcXfEz8Fdjms-sNd9gz9Y",
  authDomain: "xogame-a4254.firebaseapp.com",
  databaseURL: "https://xogame-a4254-default-rtdb.firebaseio.com",
  projectId: "xogame-a4254",
  storageBucket: "xogame-a4254.firebasestorage.app",
  messagingSenderId: "961834791643",
  appId: "1:961834791643:web:4916dd3cd8fa577d2f92fe",
  measurementId: "G-SESYRWKR5J"
};

const app = initializeApp(firebaseConfig);

/* App Check — attests that requests come from the real elgoharyX site (registered
   with this reCAPTCHA v3 key, restricted to ex-eg.github.io). Once App Check is set
   to "Enforce" for Realtime Database, requests without a valid token are rejected.
   For local testing (localhost), set a debug token — see note in the docs. */
try {
  // Optional: enable an App Check debug token on localhost so local dev keeps working.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LdjuUUtAAAAAG9D85LTSaK0HM5UoIrzgHnHB5DG'),
    isTokenAutoRefreshEnabled: true
  });
} catch (e) { console.warn('App Check init skipped:', e); }

const db = getDatabase(app);
const auth = getAuth(app);

  /* ---------- multi-page site links ----------
     Every section lives in its own HTML file in the same folder. ROOT is that
     folder's URL, and the helpers below build canonical cross-page links. */
  const ROOT = location.origin + location.pathname.replace(/[^/]*$/, '');
  const PAGE = (document.body && document.body.dataset.page) || '';
  const pageUrl = (file, qs) => ROOT + file + (qs ? ('?' + qs) : '');
  const urlHome        = ()  => ROOT;
  const urlExplore     = ()  => pageUrl('explore.html');
  const urlLogin       = ()  => pageUrl('login.html');
  const urlMyProfiles  = ()  => pageUrl('my-profiles.html');
  const urlMyBlog      = ()  => pageUrl('my-blog.html');
  const urlNewProfile  = ()  => pageUrl('create-profile.html');
  const urlNewBlog     = ()  => pageUrl('create-blog.html');
  const urlProfileView = id  => pageUrl('profile.html', 'id=' + id);
  const urlProfileEdit = id  => pageUrl('create-profile.html', 'edit=' + id);
  const urlBlogView    = id  => pageUrl('blog.html', 'blog=' + id);
  const urlBlogEdit    = id  => pageUrl('create-blog.html', 'blogedit=' + id);
  /* send a logged-out visitor to the login page, remembering where to return. */
  const gotoLogin = () => { location.href = urlLogin() + '?next=' + encodeURIComponent(location.href); };

  /* ---------- helpers ---------- */
  const LOGO='https://i.ibb.co/1t1TCvH7/103777.png';
  const SUN='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
  const MOON='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>';
  /* iOS-style line icons (replace emoji) */
  const UICON = {
    person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/></svg>',
    palette:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-.9.8-1.6 1.7-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.3-9-7.3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="11" r="1"/></svg>',
    photo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-9 9"/></svg>',
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z"/></svg>',
    scope:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2.4"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1 1 2h6c0-1 .3-1.4 1-2A6 6 0 0 0 12 3Z"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    cube:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
    wand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 16 8M14 6l4 4M18 3l.6 1.6L20.2 5.2l-1.6.6L18 7.4l-.6-1.6L15.8 5.2l1.6-.6Z"/></svg>',
  };
  const TAB = {
    cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    burger:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    mode:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
    howto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.1.9-1.1 1.8"/><path d="M12 16.4h.01"/></svg>',
    privacy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.1-7 10-4-1.9-7-5.5-7-10V6l7-3Z"/><path d="M9.3 12l1.9 1.9L15 10.2"/></svg>',
    support:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M5.2 5.2 8.4 8.4M15.6 15.6l3.2 3.2M18.8 5.2 15.6 8.4M8.4 15.6 5.2 18.8"/></svg>',
  };
  try{ if(localStorage.getItem('apb_mode')==='light') document.documentElement.setAttribute('data-mode','light'); }catch{}
  const $ = (s,r=document)=>r.querySelector(s);
  const esc = s => String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (m="تم النسخ ✓")=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900);};
  const initials = n => (n||"؟").trim().replace(/^(Prof\.|Dr\.|أ\.د\.|د\.)\s*/i,'').charAt(0).toUpperCase();

  /* update SEO meta tags dynamically (per profile / per view) */
  function setMeta(sel, attr, val){
    let el=document.head.querySelector(sel);
    if(!el){ el=document.createElement('meta'); const m=sel.match(/\[(name|property)="([^"]+)"\]/); if(m) el.setAttribute(m[1],m[2]); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  }
  function seoFor(d){
    const title=(d.name||'بروفايل')+' — '+(d.role?d.role.slice(0,60):'ملف أكاديمي')+' | elgoharyX';
    const desc=(d.about||d.role||'الملف الأكاديمي الشخصي').slice(0,155);
    const img=d.photo||LOGO;
    document.title=title;
    setMeta('meta[name="description"]','content',desc);
    setMeta('meta[property="og:title"]','content',title);
    setMeta('meta[property="og:description"]','content',desc);
    setMeta('meta[property="og:image"]','content',img);
    setMeta('meta[name="twitter:title"]','content',title);
    setMeta('meta[name="twitter:description"]','content',desc);
    setMeta('meta[name="twitter:image"]','content',img);
  }

  /* shared error screen (bad link, missing profile, unexpected failure) */
  function renderError(o){
    o=o||{};
    try{ document.body.style.background=''; }catch(e){}
    document.title=(o.code||'خطأ')+' — elgoharyX';
    const app=document.getElementById('app'); if(!app) return;
    app.innerHTML=`
      <div class="err-wrap"><div class="err-card">
        <img class="err-logo" src="${LOGO}" alt="elgoharyX"/>
        <div class="err-code">${esc(o.code||'404')}</div>
        <span class="err-tag"><i></i>${esc(o.tag||'رابط غير صالح · BROKEN LINK')}</span>
        <h2 class="err-title">${esc(o.title||'الصفحة غير موجودة')}</h2>
        <p class="err-msg">${esc(o.msg||'يبدو أن الرابط غير صحيح أو تم تعديله أو أن المحتوى لم يعد متاحاً.')}</p>
        <div class="err-actions">
          <a class="btn primary" href="${urlHome()}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 21v-6h6v6"/></svg>
            العودة للرئيسية</a>
          ${o.showReload?`<button class="btn ghost" onclick="location.reload()">إعادة المحاولة</button>`:''}
        </div>
      </div></div>`;
  }
  let _fatalShown=false;
  function fatalError(){
    if(_fatalShown) return; _fatalShown=true;
    renderError({code:'خطأ',tag:'خطأ غير متوقّع · UNEXPECTED',title:'حدث خطأ ما',
      msg:'واجهنا مشكلة غير متوقّعة أثناء تشغيل الصفحة. جرّب إعادة التحميل، وإن استمرّت المشكلة عُد إلى الرئيسية.',showReload:true});
  }
  // only real uncaught script errors trigger the boundary (ignore resource/load errors)
  window.addEventListener('error', e=>{ if(e && e.error instanceof Error) fatalError(); });

  /* short unique id (7 chars, no ambiguous letters) */
  const ALPH='23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  function shortId(n=7){const a=crypto.getRandomValues(new Uint32Array(n));let s='';for(let i=0;i<n;i++)s+=ALPH[a[i]%ALPH.length];return s;}
  async function uniqueShortId(){
    for(let k=0;k<6;k++){const id=shortId(7);const snap=await get(child(ref(db),'profiles/'+id));if(!snap.exists())return id;}
    return shortId(10);
  }
  async function uniqueUserId(){
    for(let k=0;k<6;k++){const id=shortId(9);const snap=await get(child(ref(db),'users/'+id));if(!snap.exists())return id;}
    return shortId(12);
  }
  /* auto URL shortener — tries multiple providers so it (almost) always works.
     Works only for public http/https links (i.e. after the site is hosted). */
  async function shorten(url){
    if(!/^https?:/i.test(url)) return null;
    const providers = [
      'https://is.gd/create.php?format=simple&url=',
      'https://tinyurl.com/api-create.php?url=',
      'https://v.gd/create.php?format=simple&url=',
    ];
    for(const p of providers){
      try{
        const r=await fetch(p+encodeURIComponent(url));
        if(!r.ok) continue;
        const t=(await r.text()).trim();
        if(/^https?:\/\//i.test(t) && !/error/i.test(t)) return t;
      }catch{ /* try next provider */ }
    }
    return null;
  }
  /* upload an image file to imgbb and return its hosted URL */
  const IMGBB_KEY='926c4a15635bfbd9038815bcbc0184ad';
  async function uploadToImgbb(file){
    const fd=new FormData(); fd.append('image', file);
    const r=await fetch('https://api.imgbb.com/1/upload?key='+IMGBB_KEY,{method:'POST',body:fd});
    const j=await r.json();
    if(!j||!j.success||!j.data) throw new Error('imgbb upload failed');
    return j.data.url || j.data.display_url;
  }

  const TEMPLATES = [
    {id:'royal',    name:'الكلاسيكي'},
    {id:'light',    name:'الفاتح'},
    {id:'aurora',   name:'العصري'},
    {id:'emerald',  name:'الزمردي'},
    {id:'crimson',  name:'القرمزي'},
    {id:'slate',    name:'الرمادي'},
    {id:'midnight', name:'منتصف الليل'},
    {id:'sand',     name:'الرملي'},
    {id:'rose',     name:'الوردي'},
    {id:'teal',     name:'الفيروزي'},
    {id:'sunset',   name:'الغروب'},
    {id:'mono',     name:'أحادي'},
    {id:'forest',   name:'الغابة'},
    {id:'ocean',    name:'المحيط'},
    {id:'plum',     name:'البرقوقي'},
    {id:'bronze',   name:'البرونزي'},
    {id:'ice',      name:'الجليدي'},
    {id:'graphite', name:'الجرافيت'},
    {id:'lavender', name:'الخزامى'},
    {id:'burgundy', name:'النبيذي'},
    {id:'indigo',   name:'النيلي'},
    {id:'neon',     name:'النيون'},
    {id:'ruby',     name:'الياقوتي'},
    {id:'coral',    name:'المرجاني'},
    {id:'mint',     name:'النعناعي'},
    {id:'steel',    name:'الفولاذي'},
    {id:'gold',     name:'الذهبي'},
    {id:'sapphire', name:'الياقوت الأزرق'},
    {id:'obsidian', name:'السبج'},
    {id:'pearl',    name:'اللؤلؤي'},
    {id:'jade',     name:'اليشمي'},
    {id:'amber',    name:'الكهرماني'},
    {id:'cocoa',    name:'الكاكاو'},
    {id:'denim',    name:'الجينز'},
    {id:'turquoise',name:'التركوازي'},
    {id:'magenta',  name:'الماجنتا'},
    {id:'lime',     name:'الليموني'},
    {id:'peach',    name:'الخوخي'},
    {id:'navy',     name:'الكحلي'},
    {id:'charcoal', name:'الفحمي'},
    {id:'berry',    name:'التوتي'},
    {id:'sky',      name:'السماوي'},
    {id:'moss',     name:'الطحلبي'},
    {id:'tangerine',name:'اليوسفي'},
    {id:'orchid',   name:'الأوركيد'},
    {id:'cobalt',   name:'الكوبالت'},
    {id:'blush',    name:'الوردي الناعم'},
    {id:'seafoam',  name:'زبد البحر'},
  ];

  const BASE_LAYOUTS = [
    {id:'classic', name:'الكلاسيكي', desc:'غلاف + أقسام',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="8" fill="currentColor" opacity=".35"/><circle cx="10" cy="11" r="4" fill="currentColor"/><rect x="17" y="14" width="18" height="2" fill="currentColor"/><rect x="6" y="20" width="28" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'sidebar', name:'السيرة (عمودين)', desc:'شريط جانبي',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="14" height="26" fill="currentColor" opacity=".35"/><circle cx="8" cy="9" r="3.5" fill="currentColor"/><rect x="19" y="6" width="16" height="2" fill="currentColor"/><rect x="19" y="12" width="16" height="2" fill="currentColor" opacity=".6"/><rect x="19" y="18" width="12" height="2" fill="currentColor" opacity=".4"/></svg>'},
    {id:'hero', name:'البطل', desc:'اسم فوق الغلاف',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="15" fill="currentColor" opacity=".35"/><circle cx="20" cy="8" r="4" fill="currentColor"/><rect x="12" y="20" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'minimal', name:'المبسّط', desc:'موسّط بلا غلاف',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><circle cx="20" cy="8" r="4" fill="currentColor"/><rect x="12" y="15" width="16" height="2" fill="currentColor"/><rect x="15" y="20" width="10" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'bento', name:'البطاقات', desc:'شبكة مربّعات',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="4" y="4" width="14" height="9" rx="1.5" fill="currentColor" opacity=".5"/><rect x="21" y="4" width="15" height="9" rx="1.5" fill="currentColor" opacity=".3"/><rect x="4" y="16" width="32" height="8" rx="1.5" fill="currentColor" opacity=".4"/></svg>'},
    {id:'fullphoto', name:'صورة كاملة', desc:'خلفية بالصورة',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="currentColor" opacity=".3"/><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="5" y="18" width="20" height="2.5" fill="currentColor"/><rect x="5" y="22" width="12" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'timeline', name:'المسار', desc:'خط زمني',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><line x1="10" y1="6" x2="10" y2="23" stroke="currentColor"/><circle cx="10" cy="9" r="2" fill="currentColor"/><circle cx="10" cy="15" r="2" fill="currentColor"/><circle cx="10" cy="21" r="2" fill="currentColor"/><rect x="15" y="8" width="18" height="2" fill="currentColor" opacity=".6"/><rect x="15" y="14" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'magazine', name:'المجلة', desc:'اسم كبير + أعمدة',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="5" y="5" width="22" height="5" fill="currentColor"/><rect x="5" y="14" width="14" height="2" fill="currentColor" opacity=".5"/><rect x="5" y="18" width="14" height="2" fill="currentColor" opacity=".5"/><rect x="22" y="14" width="13" height="2" fill="currentColor" opacity=".5"/><rect x="22" y="18" width="13" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'badge', name:'البطاقة التعريفية', desc:'ID بشريط',
      icon:'<svg viewBox="0 0 40 28"><rect x="7" y="1" width="26" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="17" y="3" width="6" height="2" rx="1" fill="currentColor"/><circle cx="20" cy="12" r="4" fill="currentColor"/><rect x="12" y="19" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'terminal', name:'الطرفية', desc:'نافذة كود',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="7" fill="currentColor" opacity=".3"/><circle cx="6" cy="4.5" r="1.3" fill="currentColor"/><circle cx="11" cy="4.5" r="1.3" fill="currentColor"/><circle cx="16" cy="4.5" r="1.3" fill="currentColor"/><rect x="5" y="13" width="16" height="2" fill="currentColor" opacity=".7"/><rect x="5" y="18" width="24" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'polaroid', name:'البولارويد', desc:'صورة مائلة',
      icon:'<svg viewBox="0 0 40 28"><g transform="rotate(-6 20 14)"><rect x="12" y="4" width="16" height="20" rx="1.5" fill="currentColor" opacity=".25" stroke="currentColor"/><rect x="14" y="6" width="12" height="12" fill="currentColor" opacity=".6"/><rect x="15" y="20" width="10" height="2" fill="currentColor"/></g></svg>'},
    {id:'diagonal', name:'القطري', desc:'انقسام مائل',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><path d="M1 1 H39 V13 L1 21 Z" fill="currentColor" opacity=".3"/><circle cx="12" cy="9" r="3" fill="currentColor"/></svg>'},
    {id:'compact', name:'المدمج', desc:'بطاقة أفقية',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="8" width="38" height="12" rx="3" fill="none" stroke="currentColor"/><circle cx="9" cy="14" r="3.5" fill="currentColor"/><rect x="16" y="11" width="18" height="2" fill="currentColor"/><rect x="16" y="15" width="12" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'framed', name:'الشهادة', desc:'إطار مزخرف',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="4" y="4" width="32" height="20" rx="1.5" fill="none" stroke="currentColor" opacity=".55"/><circle cx="20" cy="11" r="3" fill="currentColor"/><rect x="13" y="17" width="14" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'spotlight', name:'الأضواء', desc:'توهّج درامي',
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><circle cx="20" cy="12" r="8" fill="currentColor" opacity=".22"/><circle cx="20" cy="11" r="4" fill="currentColor"/><rect x="13" y="19" width="14" height="2" fill="currentColor" opacity=".6"/></svg>'},
  ];

  /* 100 layout variants = 15 base structures × visual modifiers (avatar shape · font · accent) */
  const _AV=[['',''],['av-rounded','مربّع دائري'],['av-square','مربّع'],['av-hex','سداسي']];
  const _FN=[['',''],['fn-sans','خط سانس'],['fn-mono','خط مونو']];
  const _AC=[['',''],['ac-ring','حلقة'],['ac-underline','خط سفلي'],['ac-bar','شريط جانبي']];
  const LAYOUTS = (()=>{
    const out = BASE_LAYOUTS.map(b=>({id:b.id, name:b.name, base:b.id, cls:'', icon:b.icon, desc:b.desc}));
    let i=0;
    while(out.length<100 && i<900){
      const b=BASE_LAYOUTS[i%BASE_LAYOUTS.length];
      const av=_AV[Math.floor(i/BASE_LAYOUTS.length)%_AV.length];
      const fn=_FN[Math.floor(i/5)%_FN.length];
      const ac=_AC[Math.floor(i/7)%_AC.length];
      const cls=[av[0],fn[0],ac[0]].filter(Boolean).join(' ');
      const desc=[av[1],fn[1],ac[1]].filter(Boolean).join(' · ');
      if(cls) out.push({id:'v'+i, name:b.name+' — '+desc, base:b.id, cls, icon:b.icon, desc});
      i++;
    }
    return out.slice(0,100);
  })();
  const LAYOUT_BY_ID = Object.fromEntries(LAYOUTS.map(l=>[l.id,l]));

  const ANIMS = [
    {id:'none', name:'بدون'}, {id:'fade', name:'تلاشٍ'}, {id:'rise', name:'صعود'},
    {id:'zoom', name:'تكبير'}, {id:'flip', name:'انقلاب'}, {id:'blur', name:'ضبابي'}, {id:'slide', name:'انزلاق'},
  ];
  /* 10 continuous 3D motions (applied to a wrapper so they don't clash with hover-tilt / entrance) */
  const MOTIONS = [
    {id:'none', name:'بدون'}, {id:'float', name:'عائم'}, {id:'sway', name:'تمايل'},
    {id:'pendulum', name:'بندول'}, {id:'spin', name:'دوران'}, {id:'flip', name:'انقلاب'},
    {id:'depth', name:'عمق نابض'}, {id:'wobble', name:'تذبذب'}, {id:'orbit', name:'مداري'},
    {id:'breathe', name:'تنفّس'}, {id:'tiltloop', name:'إمالة دائرية'},
  ];

  const SEAL = `<svg class="pf-seal" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke="rgba(230,201,128,.85)" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="24" stroke="rgba(230,201,128,.45)" stroke-width="1"/>
    <path d="M32 18 L46 25 L32 32 L18 25 Z" fill="rgba(230,201,128,.9)"/>
    <path d="M24 28 V37 C24 40 28 42 32 42 C36 42 40 40 40 37 V28" stroke="rgba(230,201,128,.9)" stroke-width="1.5"/>
    <line x1="46" y1="25" x2="46" y2="34" stroke="rgba(230,201,128,.9)" stroke-width="1.5"/></svg>`;

  /* ---------- profile card renderer (shared, multi-layout) ---------- */
  const posSafe=p=>/^[\d.]+%\s+[\d.]+%$/.test(p||'')?p:'50% 50%';
  const zoomSafe=z=>{const n=parseFloat(z);return isFinite(n)?Math.max(1,Math.min(3,n)):1;};
  const imgStyle=d=>`object-position:${posSafe(d.photoPos)};transform:scale(${zoomSafe(d.photoZoom)})`;
  function pfAvatar(d){
    const photo = d.photo ? `<img src="${esc(d.photo)}" alt="${esc(d.name)}" style="${imgStyle(d)}" onerror="this.remove()"/>` : esc(initials(d.name));
    return `<div class="pf-avatar">${photo}</div>`;
  }
  function pfWho(d){
    const nameEn = d.nameEn?`<span class="en">${esc(d.nameEn)}</span>`:'';
    return `<span class="pf-kicker">${esc(d.kicker||'أستاذ دكتور · Professor')}</span>
      <h1 class="pf-name">${esc(d.name||'الاسم')}${nameEn}</h1>
      ${d.role?`<p class="pf-role">${esc(d.role)}</p>`:''}`;
  }
  const secHead=(en,ar)=>`<div class="pf-sec">${en} <span class="line"></span><span class="ar">${ar}</span></div>`;
  const pfAbout=d=>d.about?`<p class="pf-about">${esc(d.about)}</p>`:'';
  const pfDetails=d=>`<div class="pf-info">
      ${d.university?infoItem('uni','الجامعة',d.university):''}
      ${d.specialization?infoItem('spec','التخصص',d.specialization):''}
      ${d.degree?infoItem('deg','الدرجة العلمية',d.degree):''}
      ${d.interests?infoItem('int','الاهتمامات البحثية',d.interests):''}
    </div>`;
  const extUrl=v=>/^https?:\/\//i.test(v)?v:'https://'+v;
  const CONTACT_TYPES = {
    whatsapp:{name:'واتساب', href:v=>'https://wa.me/'+String(v).replace(/[^\d]/g,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.6-5.9c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5s-.6-1.4-.8-1.9-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3c-.3.3-1 .9-1 2.2s1 2.6 1.1 2.8 2 3.1 4.9 4.3c1.8.8 2.5.9 3.4.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.6-.3Z"/></svg>'},
    telegram:{name:'تيليجرام', href:v=>/^https?:/i.test(v)?v:'https://t.me/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.2-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.9 13 2.3 11.6c-1-.3-1-1 .2-1.5l18.2-7c.8-.3 1.5.2 1.2 1.2Z"/></svg>'},
    linkedin:{name:'لينكدإن', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.55 22 10.5 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z"/></svg>'},
    twitter:{name:'X (تويتر)', href:v=>/^https?:/i.test(v)?v:'https://x.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L22 21h-6l-4.3-5.6L6.8 21H3.7l7-8L2.5 3h6.1l3.9 5.2L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z"/></svg>'},
    facebook:{name:'فيسبوك', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8H16l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z"/></svg>'},
    instagram:{name:'إنستغرام', href:v=>/^https?:/i.test(v)?v:'https://instagram.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'},
    youtube:{name:'يوتيوب', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5.2 3-5.2 3Z"/></svg>'},
    website:{name:'الموقع الإلكتروني', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>'},
    github:{name:'GitHub', href:v=>/^https?:/i.test(v)?v:'https://github.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.6 4.9.3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>'},
    scholar:{name:'Google Scholar', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 8l11 6 9-4.9V16h2V8L12 2Zm-7 9.3v3.2C5 16.4 8.1 18 12 18s7-1.6 7-3.5v-3.2l-7 3.8-7-3.8Z"/></svg>'},
    researchgate:{name:'ResearchGate', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm2.6 14-2.2-3.4h-1.3V16H9.4V8.2h3c1.7 0 2.8 1 2.8 2.5 0 1.1-.6 1.9-1.6 2.3L16 16h-1.4Zm-2.3-6.6h-1.2v2.4h1.2c.9 0 1.5-.5 1.5-1.2 0-.8-.6-1.2-1.5-1.2Z"/></svg>'},
    orcid:{name:'ORCID', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.7 7.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm.9 3.1H8v6.4h1.6v-6.4Zm2 0v6.4h2.5c2 0 3.4-1.4 3.4-3.2s-1.4-3.2-3.4-3.2h-2.5Zm1.6 1.4h.8c1.2 0 1.9.7 1.9 1.8s-.7 1.8-1.9 1.8h-.8v-3.6Z"/></svg>'},
    location:{name:'الموقع الجغرافي', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'},
  };
  const pfLinks=d=>{
    const arr=Array.isArray(d.links)?d.links:[];
    const html=arr.map(l=>{const t=CONTACT_TYPES[l&&l.type]; if(!t||!l.value) return '';
      return `<a class="pf-soc" href="${esc(t.href(l.value))}" target="_blank" rel="noopener" title="${esc(t.name)}">${t.icon}</a>`;}).join('');
    return html?`<div class="pf-socials">${html}</div>`:'';
  };
  const hasContact=d=>!!(d.email||d.phone||(Array.isArray(d.links)&&d.links.length));
  const pfContact=d=>{
    if(!hasContact(d)) return '';
    const btns=(d.email||d.phone)?`<div class="pf-actions">
      ${d.email?`<a class="pf-btn pri" href="mailto:${esc(d.email)}">${IC.mail} البريد الإلكتروني</a>
      <button class="pf-btn au" data-copy="${esc(d.email)}">${IC.copy} نسخ البريد</button>`:''}
      ${d.phone?`<a class="pf-btn gh" href="tel:${esc(d.phone)}">${IC.phone} اتصال هاتفي</a>`:''}
    </div>`:'';
    return btns+pfLinks(d);
  };
  const pfCover=d=>`<div class="pf-cover"><div class="lines"></div><div class="glow"></div>${SEAL}
      <div class="pf-est"><div class="en">${esc(d.universityEn||'University')}</div>
        <div class="ar">${esc(d.university||'')}${d.faculty?' — '+esc(d.faculty):''}</div></div></div>`;
  const photoOrInit=d=>d.photo?`<img src="${esc(d.photo)}" alt="${esc(d.name)}" style="${imgStyle(d)}" onerror="this.remove()"/>`:esc(initials(d.name));
  const cssUrl=u=>String(u||'').replace(/["'()\\<>\s]/g,m=>encodeURIComponent(m));
  const detailRows=d=>[['الجامعة',d.university],['التخصص',d.specialization],['الدرجة العلمية',d.degree],['الاهتمامات البحثية',d.interests]].filter(r=>r[1]);
  const timelineItems=d=>detailRows(d).map(r=>`<div class="tl-item"><span class="tl-dot"></span><div class="tl-c"><div class="l">${esc(r[0])}</div><div class="v">${esc(r[1])}</div></div></div>`).join('');
  const detailsPlain=d=>[['university',d.university],['field',d.specialization],['degree',d.degree],['interests',d.interests]].filter(r=>r[1]).map(r=>`<span class="tk">${r[0]}</span><span class="tsep">:</span> ${esc(r[1])}`).join('<br>');

  /* ---------- media: image gallery + YouTube videos inside the profile ---------- */
  const ytId=u=>{ const s=String(u||'').trim();
    const m=s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
    return m?m[1]:(/^[\w-]{11}$/.test(s)?s:''); };
  const galleryArr=d=>Array.isArray(d.gallery)?d.gallery.filter(u=>typeof u==='string'&&u.trim()):[];
  const videosArr =d=>Array.isArray(d.videos)?d.videos.map(ytId).filter(Boolean):[];
  const hasMedia  =d=>galleryArr(d).length>0||videosArr(d).length>0;
  const pfGallery=d=>{ const a=galleryArr(d); if(!a.length) return '';
    return `<div class="pf-gallery">${a.map((u,i)=>`<a class="pf-gitem" href="${esc(u)}" target="_blank" rel="noopener" title="عرض الصورة"><img src="${esc(u)}" alt="صورة ${i+1}" loading="lazy" onerror="this.closest('.pf-gitem').remove()"/></a>`).join('')}</div>`; };
  const pfVideos=d=>{ const a=videosArr(d); if(!a.length) return '';
    return `<div class="pf-videos">${a.map(id=>`<div class="pf-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="فيديو يوتيوب" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`).join('')}</div>`; };
  const pfMedia=d=>{ if(!hasMedia(d)) return '';
    const g=pfGallery(d), v=pfVideos(d);
    return `<div class="pf-media">
      ${g?`${secHead('Gallery','معرض الصور')}${g}`:''}
      ${v?`${secHead('Videos','فيديوهات')}${v}`:''}
    </div>`; };

  const LAYOUT_FN = {
    classic:d=>`${pfCover(d)}<div class="pf-inner">
        <div class="pf-top">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="pf-div"></div>${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}`:''}
        <div class="pf-div"></div>${secHead('Details','بيانات أساسية')}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact','التواصل')}
          <p class="pf-contact-p">${esc(d.contactNote||'يسعدني تواصلكم للاستفسارات الأكاديمية أو الإشراف البحثي أو التعاون العلمي.')}</p>${pfContact(d)}`:''}
      </div>`,
    sidebar:d=>`<div class="pf-side">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
        ${hasContact(d)?`<div class="pf-side-contact">${pfContact(d)}</div>`:''}</div>
      <div class="pf-main">
        ${d.about?`${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
      </div>`,
    hero:d=>`<div class="pf-hero"><div class="pf-hero-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div></div>
      <div class="pf-inner">
        ${d.about?`${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact','التواصل')}${pfContact(d)}`:''}
      </div>`,
    minimal:d=>`<div class="pf-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
        ${d.about?`<div class="pf-div"></div>${pfAbout(d)}`:''}
        <div class="pf-div"></div>${pfDetails(d)}
        ${hasContact(d)?`<div style="height:22px"></div>${pfContact(d)}`:''}
      </div>`,
    bento:d=>`<div class="pf-bento">
        <div class="bento-tile hero">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="bento-tile about"><div class="tile-h">نبذة تعريفية</div>${pfAbout(d)}</div>`:''}
        <div class="bento-tile det"><div class="tile-h">بيانات أساسية</div>${pfDetails(d)}</div>
        ${hasContact(d)?`<div class="bento-tile ct"><div class="tile-h">التواصل</div>${pfContact(d)}</div>`:''}
      </div>`,

    fullphoto:d=>`<div class="pf-fp">
        ${d.photo?`<img class="fp-img" src="${esc(d.photo)}" alt="${esc(d.name)}" style="${imgStyle(d)}" onerror="this.remove()"/>`:''}
        <div class="fp-scrim"></div><div class="fp-inner"><div class="pf-who">${pfWho(d)}</div></div>
      </div>
      <div class="pf-inner">
        ${d.about?`${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact','التواصل')}${pfContact(d)}`:''}
      </div>`,

    timeline:d=>`${pfCover(d)}<div class="pf-inner">
        <div class="pf-top">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="pf-div"></div>${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}`:''}
        <div class="pf-div"></div>${secHead('Timeline','المسار الأكاديمي')}
        <div class="pf-timeline">${timelineItems(d)}</div>
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact','التواصل')}${pfContact(d)}`:''}
      </div>`,

    magazine:d=>`<div class="pf-inner mag">
        <div class="mag-head">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        <div class="pf-div"></div>
        ${d.about?`<div class="mag-about">${esc(d.about)}</div><div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${pfContact(d)}`:''}
      </div>`,

    badge:d=>`<div class="pf-badge">
        <div class="badge-hole"></div>
        <div class="badge-body">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
          <div class="badge-info">${pfDetails(d)}</div>${pfContact(d)}</div>
        <div class="badge-foot">ACADEMIC · بطاقة تعريف أكاديمية</div>
      </div>`,

    terminal:d=>`<div class="pf-term">
        <div class="term-bar"><span></span><span></span><span></span><div class="term-title">~/profile.sh</div></div>
        <div class="term-body">
          <div class="term-line"><span class="tp">$</span> whoami</div><div class="term-out">${esc(d.name||'')}${d.nameEn?' · '+esc(d.nameEn):''}</div>
          ${d.role?`<div class="term-line"><span class="tp">$</span> cat role.txt</div><div class="term-out">${esc(d.role)}</div>`:''}
          ${d.about?`<div class="term-line"><span class="tp">$</span> cat about.md</div><div class="term-out">${esc(d.about)}</div>`:''}
          <div class="term-line"><span class="tp">$</span> ls -l details/</div><div class="term-out mono">${detailsPlain(d)}</div>
          ${hasContact(d)?`<div class="term-line"><span class="tp">$</span> ./contact</div><div class="term-cta">${pfContact(d)}</div>`:''}
          <div class="term-line"><span class="tp">$</span> <span class="cursor-blink">▊</span></div>
        </div>
      </div>`,

    polaroid:d=>`<div class="pf-inner pola">
        <div class="pola-wrap">
          <div class="polaroid"><div class="pola-photo">${photoOrInit(d)}</div><div class="pola-cap">${esc(d.name||'')}</div></div>
          <div class="pola-info"><div class="pf-who">${pfWho(d)}</div></div>
        </div>
        ${d.about?`<div class="pf-div"></div>${pfAbout(d)}`:''}
        <div class="pf-div"></div>${pfDetails(d)}
        ${hasContact(d)?`<div style="height:20px"></div>${pfContact(d)}`:''}
      </div>`,

    diagonal:d=>`<div class="pf-diag"><div class="diag-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>${hasContact(d)?pfContact(d):''}</div></div>
      <div class="pf-inner diag-body">
        ${d.about?`${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
      </div>`,

    compact:d=>`<div class="pf-compact">${pfAvatar(d)}
        <div class="compact-main"><div class="pf-who">${pfWho(d)}</div>
          <div class="compact-meta">${detailRows(d).map(r=>`<span>${esc(r[1])}</span>`).join('')}</div>
          ${hasContact(d)?pfContact(d):''}
        </div></div>`,

    framed:d=>`<div class="pf-inner framed"><div class="frame-box">
        <div class="frame-orn">❦</div>
        ${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
        ${d.about?`<div class="pf-div"></div>${pfAbout(d)}`:''}
        <div class="pf-div"></div>${pfDetails(d)}
        ${hasContact(d)?`<div style="height:18px"></div>${pfContact(d)}`:''}
        <div class="frame-orn">❦</div>
      </div></div>`,

    spotlight:d=>`<div class="pf-spot"><div class="spot-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>${hasContact(d)?pfContact(d):''}</div></div>
      <div class="pf-inner">
        ${d.about?`${secHead('Profile','نبذة تعريفية')}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details','بيانات أساسية')}${pfDetails(d)}
      </div>`,
  };

  function renderCard(d){
    const t    = TEMPLATES.some(x=>x.id===d.template)?d.template:'royal';
    const def  = LAYOUT_BY_ID[d.layout];
    const base = def ? def.base : (LAYOUT_FN[d.layout]?d.layout:'classic');
    const mods = def ? def.cls : '';
    const article = `<article class="pf t-${t} l-${base}${mods?' '+mods:''}${d.threeD?' is3d':''}">
      ${d.threeD?'<div class="pf-glare"></div>':''}
      ${LAYOUT_FN[base](d)}
      ${pfMedia(d)}
    </article>`;
    const m = MOTIONS.some(x=>x.id===d.motion3d && x.id!=='none') ? d.motion3d : '';
    return m ? `<div class="pf-motion m3d-${m}">${article}</div>` : article;
  }
  const IC = {
    uni:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4"/></svg>',
    spec:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/></svg>',
    deg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z"/></svg>',
    int:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
  };
  function infoItem(icon,label,val){
    return `<div class="pf-item"><div class="pf-ic">${IC[icon]}</div>
      <div><div class="l">${esc(label)}</div><div class="v">${esc(val)}</div></div></div>`;
  }

  /* wire copy buttons inside any rendered card */
  function wireCopy(root=document){
    root.querySelectorAll('[data-copy]').forEach(b=>{
      b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.copy);toast('تم نسخ البريد ✓');};
    });
  }

  /* interactive 3D tilt for cards rendered with .is3d */
  function wire3D(root=document){
    root.querySelectorAll('.pf.is3d').forEach(card=>{
      card.addEventListener('mousemove',e=>{
        const r=card.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        card.style.transform=`perspective(1100px) rotateX(${(py-.5)*-9}deg) rotateY(${(px-.5)*11}deg)`;
        card.style.setProperty('--mx',px*100+'%'); card.style.setProperty('--my',py*100+'%');
      });
      card.addEventListener('mouseleave',()=>{ card.style.transform='perspective(1100px)'; });
    });
  }

  /* double-click an avatar photo, then drag to align it inside its frame (sets object-position) */
  function wireAlign(root=document){
    root.querySelectorAll('.pf-avatar img, .pola-photo img, .pf-fp .fp-img').forEach(img=>{
      const frame=img.parentElement;
      img.addEventListener('dblclick',e=>{
        e.preventDefault();
        const on=img.classList.toggle('aligning'); frame.classList.toggle('align-on',on);
        toast(on?'اسحب لتحريك الصورة · مرّر العجلة للتكبير · دبل كليك للإنهاء':'تم حفظ الصورة ✓');
      });
      img.addEventListener('wheel',e=>{
        if(!img.classList.contains('aligning'))return;
        e.preventDefault();
        let z=zoomSafe(state.photoZoom)+(e.deltaY<0?0.08:-0.08);
        z=Math.max(1,Math.min(3,z)); state.photoZoom=+z.toFixed(2);
        img.style.transform='scale('+state.photoZoom+')';
        const zr=document.getElementById('zoomRange'); if(zr) zr.value=state.photoZoom;
      },{passive:false});
      let drag=null;
      const cur=()=>{const p=(state.photoPos||'50% 50%').split(/\s+/).map(parseFloat);return{x:isNaN(p[0])?50:p[0],y:isNaN(p[1])?50:p[1]};};
      img.addEventListener('pointerdown',e=>{
        if(!img.classList.contains('aligning'))return;
        e.preventDefault(); try{img.setPointerCapture(e.pointerId);}catch{}
        const c=cur(); drag={sx:e.clientX,sy:e.clientY,px:c.x,py:c.y,w:img.clientWidth||1,h:img.clientHeight||1};
      });
      img.addEventListener('pointermove',e=>{
        if(!drag)return;
        let nx=drag.px-(e.clientX-drag.sx)/drag.w*100;
        let ny=drag.py-(e.clientY-drag.sy)/drag.h*100;
        nx=Math.max(0,Math.min(100,nx)); ny=Math.max(0,Math.min(100,ny));
        state.photoPos=nx.toFixed(1)+'% '+ny.toFixed(1)+'%';
        img.style.objectPosition=state.photoPos;
        const px=document.getElementById('posX'), py=document.getElementById('posY');
        if(px) px.value=Math.round(nx); if(py) py.value=Math.round(ny);
      });
      const end=()=>{drag=null;};
      img.addEventListener('pointerup',end); img.addEventListener('pointercancel',end);
    });
  }

  /* ======================================================================
     BUILDER
     ====================================================================== */
  const DEFAULTS = {
    template:'royal', layout:'classic',
    kicker:'أستاذ دكتور · Professor',
    name:'Prof. Dr. Mona El-Fiky', nameEn:'',
    role:'أستاذ بقسم هندسة الحاسبات والذكاء الاصطناعي — كلية الهندسة، جامعة القاهرة.',
    about:'أستاذ جامعي وباحث بخبرة تتجاوز عشرين عاماً في مجالات الذكاء الاصطناعي وتعلّم الآلة ومعالجة اللغة الطبيعية. أُشرف على طلاب الدراسات العليا وأقود عدداً من المشروعات البحثية، وأسعى دائماً لربط المعرفة الأكاديمية بالتطبيقات العملية التي تخدم المجتمع.',
    university:'جامعة القاهرة', universityEn:'Cairo University', faculty:'كلية الهندسة',
    specialization:'ذكاء اصطناعي · تعلّم آلة', degree:'أستاذ دكتور', interests:'',
    threeD:false, anim:'rise', motion3d:'none', photoPos:'50% 50%', photoZoom:1, links:[], gallery:[], videos:[],
    email:'s.elazhary@cu.edu.eg', phone:'+20221000000',
    photo:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2A4UZQ9zLBWdO3oDvM9HfmLz8Hg8rne9GB-KEAnm6Y-_iJF4r4NdGMEPInRzrrw9Zuye-HTDCXIIK6FZh3Sgx3HqboQLkzRNLf9cksKCDp4xgydAs4kHCBayiP3JG1K17PDI2oVFN7YD9p88plFVjs60BfX3I7qGoKe_yjX5Vu7dlgY1zxYhpUwStKsc/s1600/a5b90f46-0789-4e9b-a41c-a2e054810503.jpg',
  };
  const EMPTY = {
    template:'royal', layout:'classic', kicker:'أستاذ دكتور · Professor',
    name:'', nameEn:'', role:'', about:'',
    university:'', universityEn:'University', faculty:'',
    specialization:'', degree:'', interests:'',
    threeD:false, anim:'rise', motion3d:'none', photoPos:'50% 50%', photoZoom:1, links:[], gallery:[], videos:[], email:'', phone:'', photo:''
  };
  let state = {...DEFAULTS};
  let currentUser = null;   // {uid, username, email}
  let editingId = null;     // id of profile being edited (null => creating new)
  let editMeta  = null;     // {ownerUid, ownerName, createdAt} of the edited profile

  /* ---------- user records ---------- */
  async function loadUserRecord(uid){
    try{ const s=await get(child(ref(db),'users/'+uid)); return s.exists()?s.val():null; }catch{ return null; }
  }
  async function usernameTaken(name){
    try{ const s=await get(child(ref(db),'usernames/'+name)); return s.exists(); }catch{ return false; }
  }

  /* ---------- password hashing + session (Realtime-DB auth, no Firebase Auth) ---------- */
  async function sha256(str){
    try{
      const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch{
      let h=5381; for(let i=0;i<str.length;i++) h=((h<<5)+h+str.charCodeAt(i))>>>0; // fallback
      return 'x'+h.toString(16);
    }
  }
  const hashPass=(salt,pass)=>sha256(salt+'::'+pass);
  const encEmail=e=>e.trim().toLowerCase().replace(/[.#$/\[\]]/g,',');
  async function emailToUid(email){
    try{ const s=await get(child(ref(db),'emails/'+encEmail(email))); return s.exists()?s.val():null; }catch{ return null; }
  }
  const SESSION_KEY='apb_session_uid';
  const USER_KEY='apb_user';
  const REFRESH_KEY='apb_refreshed';        // sessionStorage: did we refresh from the DB this session?
  const ADMIN_EMAIL_KEY='apb_admin_email';  // sessionStorage: cached admin email (avoids a read per page)
  const saveSession =uid=>{ try{ localStorage.setItem(SESSION_KEY,uid); }catch{} };
  const getSession  =()=>{ try{ return localStorage.getItem(SESSION_KEY); }catch{ return null; } };
  const clearSession=()=>{ try{ localStorage.removeItem(SESSION_KEY); localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(REFRESH_KEY); sessionStorage.removeItem(ADMIN_EMAIL_KEY); sessionStorage.removeItem('apb_admin_unlocked'); }catch{} };
  /* cache the logged-in user locally so pages render INSTANTLY without waiting on
     a (possibly slow) network read of users/<uid>. We load the record from the
     database only ONCE per browser session (see init) — every later page in the
     same visit is served from this local cache, sharply cutting database reads. */
  const cacheUser=u=>{ try{ localStorage.setItem(USER_KEY, JSON.stringify({uid:u.uid,username:u.username,email:u.email||'',photo:u.photo||'',premium:!!u.premium,cachedAt:Date.now()})); }catch{} };
  const getCachedUser=()=>{ try{ return JSON.parse(localStorage.getItem(USER_KEY)||'null'); }catch{ return null; } };

  /* ---------- shared-link password protection ----------
     The creator can set an optional password. We store {viewSalt, viewPassHash}
     inside the very same Firebase record as the rest of the data. When the link
     is opened, a lock screen asks for the password before the content shows —
     so if the link leaks, it stays protected. */
  const hashViewPass=(salt,pass)=>sha256((salt||'')+'::view::'+pass);
  async function buildViewPass(pass){
    const p=String(pass||'').trim();
    if(!p) return { viewSalt:null, viewPassHash:null };
    const salt=shortId(16);
    return { viewSalt:salt, viewPassHash:await hashViewPass(salt,p) };
  }
  /* Link password protection was removed — links are shared openly; profiles are
     shared for editing via a dedicated edit link instead. Kept as a no-op so any
     old records that still carry a viewPassHash simply open without a gate. */
  const isLocked=d=>false;
  const unlockKey=(kind,id)=>'apb_unlock_'+kind+'_'+id;
  const wasUnlocked=(kind,id)=>{ try{ return sessionStorage.getItem(unlockKey(kind,id))==='1'; }catch{ return false; } };
  const markUnlocked=(kind,id)=>{ try{ sessionStorage.setItem(unlockKey(kind,id),'1'); }catch{} };
  /* Renders a lock screen into #app; calls onUnlock() once the password matches. */
  function showPassGate(kind,id,rec,onUnlock){
    if(wasUnlocked(kind,id)){ onUnlock(); return; }
    document.body.style.background='';
    document.title='محتوى محمي — elgoharyX';
    $('#app').innerHTML=`
      <div class="lock-wrap"><div class="lock-card">
        <div class="lock-ic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4"/></svg></div>
        <h2 class="lock-title">هذا المحتوى محمي بكلمة مرور</h2>
        <p class="lock-sub">أدخل كلمة المرور التي شاركها معك صاحب الرابط لعرض المحتوى.</p>
        <div class="lock-err" id="lockErr"></div>
        <div class="field"><input id="lockPass" type="password" placeholder="كلمة المرور" autocomplete="off" style="text-align:center;letter-spacing:2px"/></div>
        <button class="btn primary" id="lockGo">فتح المحتوى</button>
        <a class="lock-home" href="${urlHome()}">العودة للرئيسية</a>
      </div></div>`;
    const inp=$('#lockPass'), err=$('#lockErr');
    const attempt=async()=>{
      err.textContent='';
      const val=inp.value;
      if(!val){ err.textContent='أدخل كلمة المرور'; return; }
      const go=$('#lockGo'); go.disabled=true; const old=go.textContent; go.textContent='جارٍ التحقق…';
      const h=await hashViewPass(rec.viewSalt||'',val);
      if(h===rec.viewPassHash){ markUnlocked(kind,id); onUnlock(); }
      else{ err.textContent='كلمة المرور غير صحيحة'; go.disabled=false; go.textContent=old; inp.value=''; inp.focus(); }
    };
    $('#lockGo').onclick=attempt;
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); attempt(); } });
    inp.focus();
  }

  /* theme cover gradients (dashboard) + full-page backgrounds (viewer) */
  const COVERS = {
    royal:'linear-gradient(135deg,#0f2a5e,#264f96)', light:'linear-gradient(135deg,#1c3f82,#3f74c9)',
    aurora:'linear-gradient(135deg,#1a1140,#4b1c7a 55%,#0e3b6e)', emerald:'linear-gradient(135deg,#06301f,#1aa564)',
    crimson:'linear-gradient(135deg,#5e0f1a,#c8384a)', slate:'linear-gradient(135deg,#232c3b,#54688a)',
    midnight:'linear-gradient(135deg,#04102e,#1e5bff)', sand:'linear-gradient(135deg,#8a5a2a,#d0a45a)',
    rose:'linear-gradient(135deg,#8a2440,#e28aa0)', teal:'linear-gradient(135deg,#05323a,#1aa5a0)',
    sunset:'linear-gradient(135deg,#7a1f4a,#ff8a4d)', mono:'linear-gradient(135deg,#27272a,#71717a)',
    forest:'linear-gradient(135deg,#1f5a34,#4fa564)', ocean:'linear-gradient(135deg,#0a4a70,#2f9ad0)',
    plum:'linear-gradient(135deg,#3a1060,#9a54e0)', bronze:'linear-gradient(135deg,#4a2f14,#cd7f32)',
    ice:'linear-gradient(135deg,#4aa8c8,#a2e0f0)', graphite:'linear-gradient(135deg,#1c1c20,#55555c)',
    lavender:'linear-gradient(135deg,#5a2fb0,#b09aec)', burgundy:'linear-gradient(135deg,#4a0f1a,#8e2a3c)',
    indigo:'linear-gradient(135deg,#1a1a6e,#5a54e0)', neon:'linear-gradient(135deg,#3a0a5e,#c81aa0 50%,#1ad0e0)',
    ruby:'linear-gradient(135deg,#6e0a2e,#e0356e)', coral:'linear-gradient(135deg,#e0654a,#ffb59a)',
    mint:'linear-gradient(135deg,#2aa06a,#8fe0b5)', steel:'linear-gradient(135deg,#54688a,#9aabc4)',
    gold:'linear-gradient(135deg,#2a2213,#e8c063)', sapphire:'linear-gradient(135deg,#0a1f5e,#2f6ae0)',
    obsidian:'linear-gradient(135deg,#1a1b1f,#5a5e68)', pearl:'linear-gradient(135deg,#c08a6a,#eecab0)',
    jade:'linear-gradient(135deg,#0a6a4c,#4fc0a0)', amber:'linear-gradient(135deg,#3a2606,#ffb020)',
    cocoa:'linear-gradient(135deg,#6a4228,#c89a72)', denim:'linear-gradient(135deg,#3a5590,#8aa0cc)',
    turquoise:'linear-gradient(135deg,#053a3a,#1ac0c0)', magenta:'linear-gradient(135deg,#4a0a52,#e035c0)',
    lime:'linear-gradient(135deg,#2a3a06,#a6e022)', peach:'linear-gradient(135deg,#e88a5a,#ffcbb0)',
    navy:'linear-gradient(135deg,#0a1636,#2f4a8a)', charcoal:'linear-gradient(135deg,#3a3d44,#787c86)',
    berry:'linear-gradient(135deg,#400a34,#c0357a)', sky:'linear-gradient(135deg,#2f9ad8,#a2dcf5)',
    moss:'linear-gradient(135deg,#2a3210,#8a9a3a)', tangerine:'linear-gradient(135deg,#4a2206,#ff8420)',
    orchid:'linear-gradient(135deg,#7a2f9a,#d0a0ec)', cobalt:'linear-gradient(135deg,#0a1f7a,#2f5ae8)',
    blush:'linear-gradient(135deg,#d87a98,#f8ccd8)', seafoam:'linear-gradient(135deg,#1ab0a0,#9ee0d6)',
  };
  const PAGE_BG = {
    royal:'#0c1424', light:'#e9eef6', aurora:'#0c0a22', emerald:'#061109', crimson:'#120608',
    slate:'#0d1015', midnight:'#02030a', sand:'#efe6d6', rose:'#f7e2e8', teal:'#020f12', sunset:'#120810',
    mono:'#efeff0', forest:'#e0ece0', ocean:'#dfeaf3', plum:'#0e0616', bronze:'#0f0b06', ice:'#e2eef5',
    graphite:'#070708', lavender:'#e8e0f3', burgundy:'#12070a',
    indigo:'#070919', neon:'#060410', ruby:'#12040a', coral:'#ffe2d6', mint:'#dcefe6', steel:'#e0e6ef',
    gold:'#0c0a08', sapphire:'#030a1a',
    obsidian:'#050506', pearl:'#f3ebe5', jade:'#daece4', amber:'#0f0a05', cocoa:'#e7dccf',
    denim:'#dee7f1', turquoise:'#020f10', magenta:'#0e040f', lime:'#080d03', peach:'#ffe4d8',
    navy:'#050912', charcoal:'#e3e4e7', berry:'#0e040d', sky:'#dcedf9', moss:'#0a0d03',
    tangerine:'#100803', orchid:'#e8dcf2', cobalt:'#030614', blush:'#f8e2e8', seafoam:'#d8efeb'
  };

  /* start a fresh, empty profile */
  function newProfile(){ editingId=null; editMeta=null; state={...EMPTY}; showBuilder(); window.scrollTo(0,0); }

  /* ---------- app bar (auth aware) ---------- */
  const modeIcon=()=>document.documentElement.getAttribute('data-mode')==='light'?SUN:MOON;
  /* avatar: the user's uploaded/Google photo if set, otherwise their initials */
  const userAvatar=(cls='avatar-sm')=> (currentUser&&currentUser.photo)
    ? `<span class="${cls} has-img"><img src="${esc(currentUser.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"/></span>`
    : `<span class="${cls}">${esc(initials(currentUser?currentUser.username:'؟'))}</span>`;
  /* skeleton placeholders shown while lists load (shimmer) */
  const skelCard=()=>`<div class="skel-card"><div class="skel skel-cover"></div><div class="skel-body">`
    +`<div class="skel skel-chip"></div><div class="skel skel-line w90"></div><div class="skel skel-line w60"></div>`
    +`<div class="skel-foot"><span class="skel skel-av"></span><span class="skel skel-line w40" style="flex:1"></span></div></div></div>`;
  const skelGrid=(n=6)=>`<div class="skel-grid">${Array.from({length:n},skelCard).join('')}</div>`;
  function appbar(active){
    const right = currentUser ? `
        <button class="btn ghost ab-only" data-act="mode" title="الوضع" style="padding:9px 12px">${modeIcon()}</button>
        <div class="ab-nav">
          <a class="btn ghost" href="${urlExplore()}" style="padding:9px 15px;font-size:13px${active==='explore'?';border-color:var(--gold);color:var(--txt)':''}">استكشف</a>
          <a class="btn ghost" href="${urlMyProfiles()}" style="padding:9px 15px;font-size:13px${active==='mine'?';border-color:var(--gold);color:var(--txt)':''}">بروفايلاتي</a>
          <a class="btn ghost" href="${urlMyBlog()}" style="padding:9px 15px;font-size:13px${active==='blogs'?';border-color:var(--gold);color:var(--txt)':''}">مدونتي</a>
          <a class="btn ghost" href="${urlNewProfile()}" style="padding:9px 15px;font-size:13px">+ بروفايل</a>
          <a class="btn ghost" href="${urlNewBlog()}" style="padding:9px 15px;font-size:13px">+ مدونة</a>
          <a class="btn ghost ab-vip" href="${pageUrl('premium.html')}" style="padding:9px 14px;font-size:13px${active==='premium'?';border-color:var(--gold);color:var(--txt)':''}">${CROWN}<span>مميز</span></a>
          ${isAdmin()?`<a class="btn ghost" href="${pageUrl('admin.html')}" style="padding:9px 13px;font-size:13px${active==='admin'?';border-color:var(--gold);color:var(--txt)':''}">الأدمن</a>`:''}
          <button class="btn ghost" data-act="logout" style="padding:9px 13px;font-size:13px">خروج</button>
        </div>
        <button class="btn ghost ab-bell" data-act="bell" title="الإشعارات" style="padding:9px 12px;position:relative">${BELL}<span class="bell-dot" id="bellDot" hidden></span></button>
        <a class="user-chip" href="${pageUrl('account.html')}" title="الملف الشخصي">${userAvatar('avatar-sm')}<span class="uc-name">${esc(currentUser.username)}</span></a>
        <button class="ab-burger" data-act="menu" aria-label="القائمة">${TAB.burger}</button>`
      : `<button class="btn ghost" data-act="mode" title="الوضع" style="padding:9px 12px">${modeIcon()}</button>
         <a class="btn ghost" href="${urlExplore()}" style="padding:9px 15px;font-size:13px${active==='explore'?';border-color:var(--gold);color:var(--txt)':''}">استكشف المدونات</a>
         <a class="btn ghost" href="${urlLogin()}" style="padding:9px 16px;font-size:13px">تسجيل الدخول</a>`;
    const premiumCls = (currentUser && currentUser.premium) ? ' ab-premium' : '';
    return `<div class="appbar${premiumCls}">
      <a class="brand" href="${urlHome()}" style="text-decoration:none;color:inherit"><span class="mark"><img src="${LOGO}" alt="elgoharyX"/></span>
        Academic Profiles <span class="ar">· منشئ البروفايلات</span></a>
      <div class="ab-right">${right}</div>
    </div>`;
  }
  /* professional slide-in side menu (mobile) */
  function drawer(active){
    if(!currentUser) return '';
    return `<div id="drawerWrap" class="drawer-wrap">
      <div class="drawer-bg" data-act="menu-close"></div>
      <aside class="drawer">
        <div class="drawer-brand">
          <span class="db-mark"><img src="${LOGO}" alt="elgoharyX"/></span>
          <div class="db-t"><b>Academic Profiles</b><span>منشئ البروفايلات · elgoharyX</span></div>
          <button class="dr-x" data-act="menu-close" aria-label="إغلاق">${TAB.x}</button>
        </div>
        <a class="drawer-head" href="${pageUrl('account.html')}" style="text-decoration:none">
          ${userAvatar('avatar-sm dr-av')}
          <div class="dr-id"><div class="dr-name">${esc(currentUser.username)}</div><div class="dr-sub">${esc(currentUser.email||'حساب elgoharyX')}</div></div>
        </a>
        <nav class="drawer-nav">
          <a class="dr-item ${active==='account'?'on':''}" href="${pageUrl('account.html')}">${UICON.person}<span>الملف الشخصي</span></a>
          <a class="dr-item dr-vip ${active==='premium'?'on':''}" href="${pageUrl('premium.html')}">${CROWN}<span>الاشتراك المميز</span></a>
          ${isAdmin()?`<a class="dr-item ${active==='admin'?'on':''}" href="${pageUrl('admin.html')}">${TAB.privacy}<span>لوحة الأدمن</span></a>`:''}
          <a class="dr-item ${active==='explore'?'on':''}" href="${urlExplore()}">${TAB.cards}<span>استكشف المدونات</span></a>
          <a class="dr-item ${active==='mine'?'on':''}" href="${urlMyProfiles()}">${TAB.cards}<span>بروفايلاتي</span></a>
          <a class="dr-item ${active==='blogs'?'on':''}" href="${urlMyBlog()}">${TAB.cards}<span>مدونتي</span></a>
          <a class="dr-item ${active==='build'?'on':''}" href="${urlNewProfile()}">${TAB.plus}<span>بروفايل جديد</span></a>
          <a class="dr-item" href="${urlNewBlog()}">${TAB.plus}<span>مدونة جديدة</span></a>
          <button class="dr-item" data-act="mode">${TAB.mode}<span>تبديل الوضع (ليلي / نهاري)</span></button>
          <div class="dr-sep"></div>
          <div class="dr-label">المساعدة والمعلومات</div>
          <a class="dr-item" href="${pageUrl('how-to.html')}">${TAB.howto}<span>كيفية إنشاء بروفايل</span></a>
          <a class="dr-item" href="${pageUrl('privacy.html')}">${TAB.privacy}<span>سياسة الخصوصية</span></a>
          <a class="dr-item" href="${pageUrl('support.html')}">${TAB.support}<span>الدعم والمساعدة</span></a>
          <a class="dr-item" href="${pageUrl('about.html')}">${TAB.howto}<span>عن الموقع</span></a>
          <div class="dr-sep"></div>
          <button class="dr-item danger" data-act="logout">${TAB.logout}<span>تسجيل الخروج</span></button>
        </nav>
        <div class="drawer-foot"><img src="${LOGO}" alt="elgoharyX"/><span>© 2026 <b>elgoharyX</b> — جميع الحقوق محفوظة</span></div>
      </aside>
    </div>`;
  }
  /* ---------- info pages (privacy / how-to / support) shown as a sheet ---------- */
  /*  ⚙️  عدّل بيانات التواصل بالأسفل بمعلوماتك الحقيقية  */
  const SUPPORT = { email:'elgoharyx.help@gmail.com', whatsapp:'https://wa.me/00000000000' };
  const INFO = {
    howto:{
      icon:TAB.howto, title:'كيفية إنشاء بروفايل',
      html:`<p>أنشئ بروفايلك الأكاديمي الاحترافي وشاركه برابط دائم في خطوات بسيطة:</p>
        <div class="step"><span class="n">1</span><div class="stx"><b>سجّل الدخول</b>أنشئ حساباً جديداً أو ادخل بحسابك الحالي.</div></div>
        <div class="step"><span class="n">2</span><div class="stx"><b>ابدأ بروفايلاً جديداً</b>اضغط «بروفايل جديد» من القائمة الجانبية أو الشريط العلوي.</div></div>
        <div class="step"><span class="n">3</span><div class="stx"><b>البيانات الأساسية</b>عبّئ الاسم، المسمّى العلمي، المنصب، النبذة، الجامعة والكلية والتخصص.</div></div>
        <div class="step"><span class="n">4</span><div class="stx"><b>التصميم</b>اختر التخطيط المناسب واللون من بين أكثر من 100 تخطيط و48 لوناً، وفعّل مؤثرات 3D وحركة الظهور إن رغبت.</div></div>
        <div class="step"><span class="n">5</span><div class="stx"><b>الصورة الشخصية</b>ارفع صورتك أو ألصق رابطها، ثم اضبط موضعها وتكبيرها داخل الإطار.</div></div>
        <div class="step"><span class="n">6</span><div class="stx"><b>وسائل التواصل</b>أضف بريدك ورقم هاتفك وأي وسائل تواصل أخرى.</div></div>
        <div class="step"><span class="n">7</span><div class="stx"><b>أنشئ الرابط</b>اضغط «إنشاء الرابط وحفظه» ليُحفظ بروفايلك ويُنشأ رابط دائم ومختصر تلقائياً.</div></div>
        <div class="step"><span class="n">8</span><div class="stx"><b>شارك بروفايلك</b>انسخ الرابط وشاركه، أو انسخ «رابط المشاركة للتعديل» لمن تريد أن يعدّل معك.</div></div>
        <p class="info-tip">💡 على الهاتف: استخدم الشريط السفلي للتنقّل بين الأقسام، وتبويب «المعاينة» لرؤية النتيجة مباشرةً.</p>`
    },
    privacy:{
      icon:TAB.privacy, title:'سياسة الخصوصية',
      html:`<p>نحرص على خصوصيتك. توضّح هذه السياسة البيانات التي نتعامل معها وكيفية استخدامها.</p>
        <h4>البيانات التي نجمعها</h4>
        <ul><li>اسم المستخدم والبريد الإلكتروني عند إنشاء الحساب.</li>
        <li>محتوى البروفايل الذي تُدخله بنفسك (الاسم، المنصب، النبذة، وسائل التواصل…).</li></ul>
        <h4>أين تُحفظ بياناتك</h4>
        <ul><li>تُخزَّن الحسابات والبروفايلات في قاعدة بيانات <b>Firebase</b> الآمنة من Google.</li>
        <li>الصور تُرفع عبر خدمة <b>imgbb</b> وتُحفظ كرابط عام.</li>
        <li>يُحفظ تفضيل الوضع (ليلي/نهاري) وجلسة الدخول على جهازك فقط.</li></ul>
        <h4>مشاركة الروابط</h4>
        <ul><li>رابط البروفايل عام؛ أي شخص يملكه يمكنه مشاهدته.</li>
        <li>«رابط التعديل» يتيح لحامله تعديل البروفايل — فشاركه بحذر.</li></ul>
        <h4>ماذا لا نفعل</h4>
        <ul><li>لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة لأغراض تسويقية.</li></ul>
        <h4>حقوقك</h4>
        <ul><li>يمكنك تعديل أو حذف أي بروفايل في أي وقت من صفحة «بروفايلاتي».</li></ul>`
    },
    support:{
      icon:TAB.support, title:'الدعم والمساعدة',
      html:`<p>واجهت مشكلة أو لديك اقتراح؟ إليك حلول أكثر المشكلات شيوعاً وطرق التواصل معنا.</p>
        <h4>مشكلات شائعة</h4>
        <ul><li><b>لا يُحفظ البروفايل:</b> تأكد من تسجيل الدخول ومن اتصالك بالإنترنت.</li>
        <li><b>لم يُختصر الرابط:</b> يعمل الاختصار تلقائياً بعد رفع الموقع على استضافة تدعم https.</li>
        <li><b>الصورة لا تظهر:</b> تأكد أن الرابط يشير مباشرةً إلى صورة، أو أعد رفعها من زر «رفع صورة».</li></ul>
        <h4>تواصل معنا</h4>
        <div class="sup-links">
          <a class="sup-link" href="mailto:${SUPPORT.email}">${TAB.support}<span>البريد الإلكتروني<b>${esc(SUPPORT.email)}</b></span></a>
          <a class="sup-link" href="${SUPPORT.whatsapp}" target="_blank" rel="noopener">${TAB.support}<span>واتساب<b>تواصل مباشر</b></span></a>
        </div>`
    }
  };
  function openInfo(key){
    const it=INFO[key]; if(!it) return;
    closeInfo();
    const ov=document.createElement('div');
    ov.className='overlay show'; ov.id='infoOv';
    ov.innerHTML=`<div class="modal info-modal">
      <button class="close" data-info-close aria-label="إغلاق">✕</button>
      <div class="info-h">${it.icon}<h3>${it.title}</h3></div>
      <div class="info-body">${it.html}</div>
      <button class="btn primary" data-info-close style="margin-top:4px">تم</button>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('[data-info-close]')) closeInfo(); });
  }
  function closeInfo(){ const o=$('#infoOv'); if(o) o.remove(); }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeInfo(); });

  function toggleMode(){
    const isLight=document.documentElement.getAttribute('data-mode')==='light';
    if(isLight){ document.documentElement.removeAttribute('data-mode'); try{localStorage.setItem('apb_mode','dark');}catch{} }
    else{ document.documentElement.setAttribute('data-mode','light'); try{localStorage.setItem('apb_mode','light');}catch{} }
    document.querySelectorAll('[data-act="mode"]').forEach(b=>{ const s=b.querySelector('span'); b.innerHTML=modeIcon()+(s?('<span>'+s.textContent+'</span>'):''); });
  }
  function wireAppbar(){
    // reflect premium state on <html> so gated controls can lock for free users
    document.documentElement.classList.toggle('user-free', !!currentUser && !isPremium());
    // Top-level navigation are now real <a href> links to separate pages (better
    // for SEO + crawlability) — the browser handles them. Here we only wire the
    // in-page controls: theme toggle, logout, and the mobile drawer.
    document.querySelectorAll('[data-act="mode"]').forEach(b=>b.onclick=toggleMode);
    document.querySelectorAll('[data-act="logout"]').forEach(b=>b.onclick=()=>{ try{ signOut(auth); }catch(e){} clearSession(); currentUser=null; toast('تم تسجيل الخروج'); location.href=urlHome(); });
    const dw=$('#drawerWrap');
    document.querySelectorAll('[data-act="menu"]').forEach(b=>b.onclick=()=>{ if(dw) dw.classList.add('open'); });
    document.querySelectorAll('[data-act="menu-close"]').forEach(b=>b.onclick=()=>{ if(dw) dw.classList.remove('open'); });
    // notifications bell (announcements + subscribe)
    document.querySelectorAll('[data-act="bell"]').forEach(b=>b.onclick=openNotifications);
    if(currentUser) refreshBell();
  }

  /* ---------- auth screen ---------- */
  function authError(e){
    const c=(e&&e.code)||'';
    if(c==='bad-username') return 'اسم المستخدم يجب أن يكون 3–20 حرفاً (أحرف/أرقام/_)';
    if(c==='username-taken') return 'اسم المستخدم مستخدم بالفعل';
    if(c.includes('email-already-in-use')) return 'هذا البريد مسجّل مسبقاً — سجّل الدخول';
    if(c.includes('wrong-password')||c.includes('user-not-found')||c==='auth/invalid-credential'||c==='auth/wrong-password'||c==='auth/user-not-found'||c==='auth/invalid-email') return 'بيانات الدخول غير صحيحة';
    if(c==='auth/operation-not-allowed') return 'فعّل تسجيل الدخول بالبريد/كلمة المرور في Firebase Authentication';
    if(c==='auth/too-many-requests') return 'محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة';
    if(c.includes('network')||c==='auth/network-request-failed') return 'تعذّر الاتصال بالشبكة';
    return 'حدث خطأ، حاول مجدداً';
  }
  /* ---------- sign in with Google / GitHub (Firebase Auth) ----------
     On first sign-in we create a users/<firebase-uid> record so OAuth accounts
     plug into the same account model (userProfiles/<uid>, userBlogs/<uid>). */
  function oauthError(e){
    const c=(e&&e.code)||'';
    if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request') return 'أُغلقت نافذة الدخول قبل إتمامها';
    if(c==='auth/account-exists-with-different-credential') return 'هذا البريد مسجّل بطريقة دخول أخرى — استخدمها';
    if(c==='auth/operation-not-allowed') return 'طريقة الدخول غير مفعّلة — فعّلها في Firebase Authentication';
    if(c==='auth/unauthorized-domain') return 'هذا النطاق غير مصرّح به في إعدادات Firebase Auth';
    if(c==='auth/popup-blocked') return 'المتصفح منع النافذة المنبثقة — اسمح بها وأعد المحاولة';
    return 'تعذّر تسجيل الدخول، حاول مجدداً';
  }
  async function oauthSignIn(which, btn){
    const err=$('#authErr'); if(err) err.textContent='';
    const provider = which==='github' ? new GithubAuthProvider() : new GoogleAuthProvider();
    const old = btn?btn.innerHTML:''; if(btn){ btn.disabled=true; btn.innerHTML='جارٍ فتح نافذة الدخول…'; }
    try{
      const res = await signInWithPopup(auth, provider);
      const u = res.user, uid = u.uid, email = u.email || '';
      let rec = await loadUserRecord(uid);
      if(!rec){
        const uname = String(u.displayName || (email? email.split('@')[0] : 'user')).slice(0,40) || 'user';
        rec = { username:uname, email, provider:which, photo:u.photoURL||'', createdAt:Date.now() };
        await set(ref(db,'users/'+uid), rec);
        if(email){ try{ await set(ref(db,'emails/'+encEmail(email)), uid); }catch(e){} }
      }
      currentUser = { uid, email:rec.email||email, username:rec.username||'مستخدم', photo:rec.photo||'' };
      saveSession(uid); cacheUser(currentUser);
      toast('تم تسجيل الدخول ✓'); route();
    }catch(e){
      console.error(e); if(err) err.textContent=oauthError(e);
      if(btn){ btn.disabled=false; btn.innerHTML=old; }
    }
  }
  const GOOGLE_SVG='<svg viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7C21.7 18.6 23 15.8 23 12.3Z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H1.7v2.9C3.6 21.4 7.5 24 12 24Z"/><path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.4H1.7C.9 8.9.5 10.4.5 12s.4 3.1 1.2 4.6l3.9-2.9Z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.6 1.7 6.4l3.9 3C6.5 6.8 9 4.8 12 4.8Z"/></svg>';
  const GITHUB_SVG='<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z"/></svg>';

  /* sign in with a Firebase Authentication email/password account (e.g. a user
     you added directly in the Firebase console — like the admin). Creates a
     users/<uid> record on first login so the account plugs into the app. */
  async function firebaseEmailLogin(email, pass){
    const res = await signInWithEmailAndPassword(auth, email, pass); // throws on wrong credentials
    const u=res.user, uid=u.uid, em=u.email||email;
    let rec=await loadUserRecord(uid);
    if(!rec){
      rec={ username:(u.displayName || (em.split('@')[0]) || 'مستخدم').slice(0,40), email:em, provider:'password', createdAt:Date.now() };
      await set(ref(db,'users/'+uid), rec);
      if(em){ try{ await set(ref(db,'emails/'+encEmail(em)), uid); }catch(e){} }
    }
    currentUser={ uid, email:rec.email||em, username:rec.username||'مستخدم', photo:rec.photo||'' };
    saveSession(uid); cacheUser(currentUser);
    toast('تم تسجيل الدخول ✓'); route();
  }

  function showAuth(mode='login'){
    document.title='تسجيل الدخول — منشئ البروفايلات';
    document.body.style.background='';
    $('#app').innerHTML = appbar('login') + `
    <div class="auth-wrap"><div class="panel auth-card">
      <h2 id="authTitle">${mode==='login'?'تسجيل الدخول':'إنشاء حساب'}</h2>
      <div class="sub">ادخل لإدارة بروفايلاتك وربطها بحسابك.</div>
      <div class="auth-tabs">
        <button data-mode="login" class="${mode==='login'?'active':''}">دخول</button>
        <button data-mode="signup" class="${mode==='signup'?'active':''}">حساب جديد</button>
      </div>
      <div class="auth-err" id="authErr"></div>
      <div id="unameField" class="field" style="${mode==='login'?'display:none':''}">
        <label>اسم المستخدم</label><input id="a-user" placeholder="username" autocomplete="username"/>
      </div>
      <div class="field"><label>البريد الإلكتروني</label><input id="a-email" type="email" placeholder="name@example.com" autocomplete="email"/></div>
      <div class="field"><label>كلمة المرور</label><input id="a-pass" type="password" placeholder="6 أحرف على الأقل" autocomplete="current-password"/></div>
      <button class="btn primary" id="authGo">${mode==='login'?'دخول':'إنشاء الحساب'}</button>
      <div class="auth-or"><span>أو تابع عبر</span></div>
      <button class="btn oauth oauth-google" id="authGoogle" type="button">${GOOGLE_SVG} المتابعة بحساب Google</button>
      <button class="btn oauth oauth-github" id="authGithub" type="button">${GITHUB_SVG} المتابعة بحساب GitHub</button>
    </div></div>`;
    wireAppbar();
    $('#authGoogle')&&($('#authGoogle').onclick=e=>oauthSignIn('google',e.currentTarget));
    $('#authGithub')&&($('#authGithub').onclick=e=>oauthSignIn('github',e.currentTarget));

    let cur=mode;
    const setMode=m=>{ cur=m;
      $('#authTitle').textContent=m==='login'?'تسجيل الدخول':'إنشاء حساب';
      $('#authGo').textContent  =m==='login'?'دخول':'إنشاء الحساب';
      $('#unameField').style.display=m==='login'?'none':'';
      $('#authErr').textContent='';
      document.querySelectorAll('.auth-tabs button').forEach(x=>x.classList.toggle('active',x.dataset.mode===m));
    };
    document.querySelectorAll('.auth-tabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));

    $('#authGo').onclick=async()=>{
      const err=$('#authErr'); err.textContent='';
      const email=$('#a-email').value.trim(), pass=$('#a-pass').value;
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent='بريد إلكتروني غير صحيح'; return; }
      if(pass.length<6){ err.textContent='كلمة المرور يجب ألا تقل عن 6 أحرف'; return; }
      const go=$('#authGo'); go.disabled=true; const old=go.textContent; go.textContent='جارٍ…';
      try{
        if(cur==='signup'){
          const uname=$('#a-user').value.trim();
          if(!/^[a-zA-Z0-9_\.؀-ۿ]{3,20}$/.test(uname)) throw {code:'bad-username'};
          if(await usernameTaken(uname.toLowerCase())) throw {code:'username-taken'};
          if(await emailToUid(email)) throw {code:'email-already-in-use'};
          const uid=await uniqueUserId();
          const salt=shortId(16);
          const passHash=await hashPass(salt,pass);
          await set(ref(db,'users/'+uid),{username:uname,email,salt,passHash,createdAt:Date.now()});
          await set(ref(db,'usernames/'+uname.toLowerCase()),uid);
          await set(ref(db,'emails/'+encEmail(email)),uid);
          currentUser={uid,email,username:uname,photo:''};
          saveSession(uid); cacheUser(currentUser);
          toast('تم إنشاء الحساب ✓'); route();
        }else{
          // the admin must be a Firebase Auth account → always sign the admin email
          // in through Firebase (even if a plain site account exists with that email)
          if(adminEmail===undefined) await loadAdminEmail();
          if(adminEmail && email.trim().toLowerCase()===adminEmail){ await firebaseEmailLogin(email, pass); return; }
          const uid=await emailToUid(email);
          if(!uid){
            // no custom account with this email — try a Firebase Auth account
            // (email/password users added in Firebase, e.g. the admin)
            await firebaseEmailLogin(email, pass); return;
          }
          const rec=await loadUserRecord(uid);
          if(!rec) throw {code:'user-not-found'};
          const h=await hashPass(rec.salt||'',pass);
          if(h!==rec.passHash){
            // password didn't match the custom record — maybe it's a Firebase account
            try{ await firebaseEmailLogin(email, pass); return; }catch(fb){ throw {code:'wrong-password'}; }
          }
          currentUser={uid,email:rec.email,username:rec.username,photo:rec.photo||''};
          saveSession(uid); cacheUser(currentUser);
          toast('تم تسجيل الدخول ✓'); route();
        }
      }catch(e){
        console.error(e); err.textContent=authError(e);
        go.disabled=false; go.textContent=old;
      }
    };
  }

  /* ---------- my profiles (dashboard) ---------- */
  const IC2 = {
    eye:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    pen:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    share:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5"/></svg>',
    link:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    up:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/></svg>',
  };

  /* ---------- account / profile page (edit account + avatar) ---------- */
  async function showAccount(){
    if(!currentUser){ gotoLogin(); return; }
    document.title='الملف الشخصي — elgoharyX';
    document.body.style.background='';
    let photo = currentUser.photo || '';
    const avatarInner=()=> photo
      ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer"/>`
      : `<span class="acct-initials">${esc(initials(currentUser.username))}</span>`;
    const providerLabel = { google:'Google', github:'GitHub' };
    $('#app').innerHTML = appbar('account') + `<div class="wrap acct-wrap">
      <div class="panel acct-card">
        <h2>الملف الشخصي</h2>
        <div class="sub">عدّل اسمك وصورتك الشخصية — تظهر في كل مكان بحسابك.</div>
        <div class="acct-top">
          <span class="acct-avatar" id="acctAvatar">${avatarInner()}</span>
          <div class="acct-top-btns">
            <button type="button" class="btn ghost" id="acctUp">${IC2.up} رفع صورة</button>
            <button type="button" class="btn ghost" id="acctRemove" style="${photo?'':'display:none'}">إزالة الصورة</button>
            <input type="file" id="acctFile" accept="image/*" hidden/>
          </div>
        </div>
        <div class="acct-note" id="acctNote"></div>
        <div class="field"><label>اسم المستخدم</label><input id="acct-username" value="${esc(currentUser.username)}" maxlength="40" placeholder="اسمك"/></div>
        <div class="field"><label>البريد الإلكتروني</label><input value="${esc(currentUser.email||'—')}" disabled/></div>
        <div id="acctPremium"></div>
        <div id="acctNotify"></div>
        <button class="btn primary" id="acctSave" style="width:100%">حفظ التغييرات</button>
      </div>
    </div>` + drawer('account');
    wireAppbar();
    // premium status row (loaded async)
    getPremium(currentUser.uid).then(pp=>{
      const box=$('#acctPremium'); if(!box) return;
      if(premiumActive(pp)) box.innerHTML=`<div class="acct-prem on"><span class="pm-vip">${CROWN} عضو مميز</span><span>فعّال حتى ${fmtDay(pp.expires)}</span></div>`;
      else box.innerHTML=`<a class="acct-prem off" href="${pageUrl('premium.html')}">${CROWN} ترقية إلى العضوية المميزة</a>`;
    }).catch(()=>{});

    // notifications subscribe toggle
    (function(){
      const box=$('#acctNotify'); if(!box) return;
      const draw=()=>{ const on=isSubscribed();
        box.innerHTML=`<div class="acct-notify-row">
          <span class="an-lbl">${BELL} إشعارات الموقع</span>
          <button class="btn ${on?'ghost':'primary'}" id="acctNotifBtn" style="width:auto;padding:9px 18px">${on?'إلغاء الاشتراك':'اشترك الآن'}</button></div>`;
        $('#acctNotifBtn').onclick=async()=>{
          if(isSubscribed()){ await unsubscribeNotifications(); toast('تم إلغاء الاشتراك'); }
          else { const p=await subscribeNotifications(); toast(p==='granted'?'تم تفعيل الإشعارات ✓':'تم الاشتراك ✓'); }
          draw();
        };
      };
      draw();
    })();

    const noteEl=$('#acctNote');
    const refresh=()=>{ $('#acctAvatar').innerHTML=avatarInner(); const r=$('#acctRemove'); if(r) r.style.display=photo?'':'none'; };
    $('#acctUp').onclick=()=>$('#acctFile').click();
    $('#acctFile').onchange=async()=>{
      const f=$('#acctFile').files&&$('#acctFile').files[0]; if(!f) return;
      if(!/^image\//.test(f.type)){ noteEl.className='acct-note'; noteEl.textContent='الملف ليس صورة'; return; }
      const btn=$('#acctUp'); const old=btn.innerHTML; btn.disabled=true; btn.textContent='جارٍ الرفع…'; noteEl.textContent='';
      try{ photo=await uploadToImgbb(f); refresh(); noteEl.className='acct-note ok'; noteEl.textContent='✓ تم رفع الصورة — اضغط «حفظ التغييرات» لتثبيتها'; }
      catch(e){ console.error(e); noteEl.className='acct-note'; noteEl.textContent='تعذّر رفع الصورة، حاول مجدداً'; }
      finally{ btn.disabled=false; btn.innerHTML=old; $('#acctFile').value=''; }
    };
    $('#acctRemove').onclick=()=>{ photo=''; refresh(); noteEl.className='acct-note'; noteEl.textContent='ستُزال الصورة عند الحفظ'; };
    $('#acctSave').onclick=async()=>{
      const name=$('#acct-username').value.trim();
      if(name.length<1){ noteEl.className='acct-note'; noteEl.textContent='اكتب اسم المستخدم'; return; }
      const btn=$('#acctSave'); btn.disabled=true; const old=btn.textContent; btn.textContent='جارٍ الحفظ…';
      try{
        const rec=(await loadUserRecord(currentUser.uid))||{};
        const merged={...rec, username:name.slice(0,40), email:rec.email||currentUser.email||'', createdAt:rec.createdAt||Date.now(), photo};
        await set(ref(db,'users/'+currentUser.uid), merged);
        currentUser.username=merged.username; currentUser.photo=photo; cacheUser(currentUser);
        noteEl.className='acct-note ok'; noteEl.textContent='✓ تم حفظ التغييرات'; toast('تم حفظ الملف الشخصي ✓');
      }catch(e){ console.error(e); noteEl.className='acct-note'; noteEl.textContent='تعذّر الحفظ — تأكد من نشر قواعد قاعدة البيانات'; }
      finally{ btn.disabled=false; btn.textContent=old; }
    };
  }

  async function showMyProfiles(){
    if(!currentUser){ showAuth('login'); return; }
    document.title='بروفايلاتي — منشئ البروفايلات';
    document.body.style.background='';
    $('#app').innerHTML = appbar('mine') + `<div class="wrap">
      <div class="mp-head">
        <div><h2>بروفايلاتي</h2><div class="sub">جميع البروفايلات المرتبطة بحسابك.</div></div>
        <button class="btn primary" id="mkNew" style="width:auto;padding:12px 22px">+ بروفايل جديد</button>
      </div>
      <div id="mpList">${skelGrid(6)}</div>
    </div>` + drawer('mine');
    wireAppbar();
    $('#mkNew').onclick=newProfile;
    try{
      const s=await get(child(ref(db),'userProfiles/'+currentUser.uid));
      const list = s.exists()? Object.entries(s.val()).map(([id,v])=>({id,...v})) : [];
      list.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      const base=location.href.split('#')[0].split('?')[0];
      if(!list.length){
        $('#mpList').innerHTML=`<div class="mp-empty">لا توجد بروفايلات بعد.<br><br>
          <button class="btn primary" id="mkNew2" style="width:auto;padding:12px 22px">أنشئ أول بروفايل</button></div>`;
        $('#mkNew2').onclick=newProfile; return;
      }
      $('#mpList').innerHTML=`<div class="mp-grid">${list.map(p=>`
        <div class="mp-card">
          <div class="mp-cover" style="background:${COVERS[p.template]||COVERS.royal}"><span class="badge">${esc((TEMPLATES.find(t=>t.id===p.template)||{}).name||'')}</span>${p.locked?'<span class="mp-lock" title="محمي بكلمة مرور">🔒</span>':''}</div>
          <div class="mp-body">
            <div class="mp-name">${esc(p.name||'بدون اسم')}</div>
            <div class="mp-meta">آخر تحديث: ${p.updatedAt?new Date(p.updatedAt).toLocaleDateString('ar-EG'):'—'}</div>
            <div class="mp-actions">
              <a href="${urlProfileView(p.id)}" target="_blank">${IC2.eye} عرض</a>
              <button data-edit="${p.id}">${IC2.pen} تعديل</button>
              <button data-share="${p.id}">${IC2.share} مشاركة للتعديل</button>
              <button data-link="${p.id}">${IC2.link} الرابط</button>
              <button class="del" data-del="${p.id}">حذف</button>
            </div>
          </div>
        </div>`).join('')}</div>`;
      $('#mpList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>startEdit(b.dataset.edit));
      $('#mpList').querySelectorAll('[data-link]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(urlProfileView(b.dataset.link));toast('تم نسخ رابط العرض ✓');});
      $('#mpList').querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(urlProfileEdit(b.dataset.share));toast('تم نسخ رابط التعديل ✓ — شاركه لمن يعدّل البروفايل');});
      $('#mpList').querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
        if(!confirm('حذف هذا البروفايل نهائياً؟')) return;
        try{ await remove(ref(db,'profiles/'+b.dataset.del)); await remove(ref(db,'userProfiles/'+currentUser.uid+'/'+b.dataset.del)); toast('تم الحذف'); showMyProfiles(); }
        catch(e){ console.error(e); toast('تعذّر الحذف'); }
      });
    }catch(e){
      console.error(e);
      $('#mpList').innerHTML=`<div class="mp-empty">تعذّر تحميل البروفايلات. تحقّق من قواعد قاعدة البيانات.</div>`;
    }
  }

  /* ---------- open an existing profile for editing ---------- */
  async function startEdit(id){
    if(!currentUser){ location.href=urlProfileEdit(id); return; }
    document.body.style.background='';
    $('#app').innerHTML=`<div class="loader"><div><div class="spin"></div>جارٍ فتح البروفايل للتعديل…</div></div>`;
    try{
      const s=await get(child(ref(db),'profiles/'+id));
      if(!s.exists()){ toast('البروفايل غير موجود'); showMyProfiles(); return; }
      const d=s.val();
      state={...EMPTY};
      ['template','layout','kicker','name','nameEn','role','about','university','universityEn','faculty','specialization','degree','interests','threeD','anim','motion3d','photoPos','photoZoom','links','gallery','videos','email','phone','photo']
        .forEach(k=>{ if(d[k]!=null) state[k]=d[k]; });
      if(!Array.isArray(state.links)) state.links = state.links?Object.values(state.links):[];
      if(!Array.isArray(state.gallery)) state.gallery = state.gallery?Object.values(state.gallery):[];
      if(!Array.isArray(state.videos)) state.videos = state.videos?Object.values(state.videos):[];
      editingId=id;
      editMeta={ownerUid:d.ownerUid||currentUser.uid, ownerName:d.ownerName||currentUser.username, createdAt:d.createdAt||Date.now(),
        viewSalt:d.viewSalt||null, viewPassHash:d.viewPassHash||null};
      showBuilder(); window.scrollTo(0,0);
    }catch(e){ console.error(e); toast('تعذّر الفتح'); showMyProfiles(); }
  }

  function fld(id,label,val,type='input',ph=''){
    if(type==='textarea') return `<div class="field"><label>${label}</label><textarea id="f-${id}" placeholder="${ph}">${esc(val)}</textarea></div>`;
    return `<div class="field"><label>${label}</label><input id="f-${id}" value="${esc(val)}" placeholder="${ph}"/></div>`;
  }

  function showBuilder(){
    if(!currentUser){ showAuth('login'); return; }
    const editing = editingId!==null;
    const sharedEdit = editing && editMeta && editMeta.ownerUid!==currentUser.uid;
    document.title = editing ? 'تعديل البروفايل' : 'منشئ البروفايلات الأكاديمية';
    document.body.style.background='';
    $('#app').innerHTML = appbar('build') + `
    <div class="wrap"><div class="builder">
      <section class="panel">
        <h2>${editing?'تعديل البروفايل':'أنشئ بروفايلك'}</h2>
        <div class="sub">${editing
          ? (sharedEdit?'أنت تعدّل بروفايلاً تمت مشاركته معك.':'عدّل البيانات ثم احفظ التغييرات.')
          : 'اختر تصميماً، عبّئ البيانات، ثم أنشئ رابطاً دائماً يُحفظ في Firebase.'}</div>

        <div class="bpane pane-on" data-pane="data">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.person} البيانات الأساسية</span></summary>
          <div class="acc-body">
            ${fld('name','الاسم (رئيسي)',state.name)}
            ${fld('nameEn','الاسم بالإنجليزية (اختياري)',state.nameEn,'input','Prof. Dr. …')}
            ${fld('kicker','المسمّى العلوي',state.kicker)}
            ${fld('role','المنصب / القسم',state.role,'textarea')}
            ${fld('about','النبذة التعريفية',state.about,'textarea')}
            <div class="grid2">${fld('university','الجامعة',state.university)}${fld('universityEn','Univ. (EN)',state.universityEn)}</div>
            <div class="grid2">${fld('faculty','الكلية',state.faculty)}${fld('degree','الدرجة العلمية',state.degree)}</div>
            <div class="grid2">${fld('specialization','التخصص',state.specialization)}${fld('interests','الاهتمامات البحثية',state.interests)}</div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="design">
        <details class="acc">
          <summary><span class="sum-t">${UICON.grid} التخطيط / الشكل <span style="color:var(--muted-2);font-weight:400">(${LAYOUTS.length})</span></span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('أول '+FREE_PROFILE_LAYOUTS+' تخطيطاً مجانية — والباقي للمشتركين المميزين.')}
            <input id="laySearch" class="lay-search" placeholder="ابحث عن تخطيط…"/>
            <div class="layouts" id="lays">
              ${LAYOUTS.map((l,li)=>{ const lk=li>=FREE_PROFILE_LAYOUTS; return `<div class="lay ${l.id===state.layout?'active':''} ${lk?'locked':''}" data-lay="${l.id}" data-name="${esc(l.name)}" ${lk?'data-locked="1"':''}>
                ${lk?'<span class="lay-lock">'+LOCKICON+'</span>':''}${l.icon}<div class="ln">${esc(l.name)}</div>${l.desc?`<div class="ld">${esc(l.desc)}</div>`:''}</div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.palette} لون التصميم <span style="color:var(--muted-2);font-weight:400">(${TEMPLATES.length})</span> ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' مميز</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('أول '+FREE_PROFILE_COLORS+' لوناً مجانية — وباقي الألوان للمشتركين المميزين.')}
            <div class="templates" id="tpls">
              ${TEMPLATES.map((t,ti)=>{ const lk=ti>=FREE_PROFILE_COLORS; return `<div class="tpl t-${t.id} ${t.id===state.template?'active':''} ${lk?'locked':''}" data-tpl="${t.id}" ${lk?'data-locked="1"':''}>
                <div class="swatch">${lk?'<span class="tpl-lock">'+LOCKICON+'</span>':''}</div><div class="nm">${t.name}</div></div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.cube} المؤثرات ثلاثية الأبعاد ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' مميز</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('المؤثرات ثلاثية الأبعاد وحركة الظهور متاحة للمشتركين المميزين.')}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="opt-row">
              <div><div class="lbl">إمالة تفاعلية (3D)</div><div class="desc">تميل البطاقة مع المؤشر وتبرز النصوص</div></div>
              <label class="switch"><input type="checkbox" id="f-threeD" ${state.threeD?'checked':''}><span class="slider"></span></label>
            </div>
            <div class="opt-row">
              <div><div class="lbl">حركة ثلاثية الأبعاد</div><div class="desc">حركة مستمرة للبطاقة (10 حركات)</div></div>
              <select id="f-motion" class="mini-select">
                ${MOTIONS.map(m=>`<option value="${m.id}" ${m.id===state.motion3d?'selected':''}>${m.name}</option>`).join('')}
              </select>
            </div>
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.wand} حركة الظهور ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' مميز</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('حركة ظهور البروفايل متاحة للمشتركين المميزين.')}
            <div class="opt-row ${isPremium()?'':'is-locked'}">
              <div><div class="lbl">أنيميشن الظهور</div><div class="desc">يظهر به البروفايل عند فتح الرابط</div></div>
              <div style="display:flex;gap:8px;align-items:center">
                <select id="f-anim" class="mini-select">
                  ${ANIMS.map(a=>`<option value="${a.id}" ${a.id===state.anim?'selected':''}>${a.name}</option>`).join('')}
                </select>
                <button type="button" class="btn ghost" id="animPlay" style="padding:9px 13px" title="معاينة الحركة">${UICON.play}</button>
              </div>
            </div>
          </div>
        </details>

        </div>

        <div class="bpane" data-pane="photo">
        <details class="acc">
          <summary><span class="sum-t">${UICON.photo} الصورة الشخصية</span></summary>
          <div class="acc-body">
            <div class="field">
              <label>رابط الصورة أو رفعها</label>
              <div class="upload-row">
                <input id="f-photo" value="${esc(state.photo)}" placeholder="https://… أو ارفع صورة"/>
                <button type="button" class="btn ghost" id="upBtn">${IC2.up} رفع صورة</button>
              </div>
              <input type="file" id="upFile" accept="image/*" hidden/>
              <div class="up-note" id="upNote">اضغط «ضبط موضع الصورة» بالأسفل ثم اسحب الصورة داخل الإطار في المعاينة.</div>
            </div>
            <label class="acc-lbl">ضبط الصورة داخل الإطار</label>
            <div class="align-ctl">
              <button type="button" class="btn ghost" id="alignToggle">${UICON.scope} سحب داخل الإطار</button>
              <button type="button" class="btn ghost" id="alignReset">إعادة ضبط</button>
            </div>
            <div class="align-sliders">
              <label class="rng"><span>أفقي ↔</span><input type="range" id="posX" min="0" max="100" step="1" value="${parseFloat((state.photoPos||'50% 50%').split(/\s+/)[0])||50}"/></label>
              <label class="rng"><span>رأسي ↕</span><input type="range" id="posY" min="0" max="100" step="1" value="${parseFloat((state.photoPos||'50% 50%').split(/\s+/)[1])||50}"/></label>
              <label class="rng"><span>تكبير</span><input type="range" id="zoomRange" min="1" max="3" step="0.05" value="${zoomSafe(state.photoZoom)}"/></label>
            </div>
            <div class="align-hint" id="alignHint">${UICON.bulb} حرّك المنزلقات لضبط الصورة يدوياً (أفقي/رأسي/تكبير)، أو فعّل «سحب داخل الإطار» ثم اسحب الصورة مباشرة.</div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.grid} معرض الصور والفيديو ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' مميز</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('معرض الصور والفيديوهات داخل البروفايل متاح للمشتركين المميزين.')}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="field">
              <label>معرض صور داخل البروفايل</label>
              <div class="upload-row">
                <input id="galVal" placeholder="ألصق رابط صورة… https://"/>
                <button type="button" class="btn ghost" id="galUp">${IC2.up} رفع صورة</button>
                <button type="button" class="btn ghost" id="galAdd" style="padding:11px 16px">إضافة</button>
              </div>
              <input type="file" id="galFile" accept="image/*" hidden/>
              <div class="up-note" id="galNote">أضف صوراً متعددة (رابط أو رفع) تظهر داخل البروفايل كمعرض أنيق.</div>
              <div class="media-list" id="galList"></div>
            </div>
            <div class="field">
              <label>فيديوهات يوتيوب</label>
              <div class="link-add">
                <input id="vidVal" placeholder="رابط يوتيوب… youtu.be/… أو youtube.com/watch?v=…"/>
                <button type="button" class="btn ghost" id="vidAdd" style="padding:11px 16px">إضافة</button>
              </div>
              <div class="up-note" id="vidNote">ألصق رابط الفيديو ثم اضغط «إضافة» — يظهر مدمجاً داخل البروفايل.</div>
              <div class="media-list" id="vidList"></div>
            </div>
            </div>
          </div>
        </details>

        </div>

        <div class="bpane" data-pane="contact">
        <details class="acc">
          <summary><span class="sum-t">${UICON.chat} وسائل التواصل</span></summary>
          <div class="acc-body">
            <div class="grid2">${fld('email','البريد الإلكتروني',state.email)}${fld('phone','رقم الهاتف',state.phone)}</div>
            <div class="field">
              <label>وسائل تواصل إضافية</label>
              <div class="link-add">
                <select id="linkType" class="mini-select">${Object.entries(CONTACT_TYPES).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select>
                <input id="linkVal" placeholder="الرابط أو المُعرّف/الرقم"/>
                <button type="button" class="btn ghost" id="linkAdd" style="padding:11px 16px">إضافة</button>
              </div>
              <div class="link-list" id="linkList"></div>
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${IC2.share} مشاركة البروفايل للتعديل</span></summary>
          <div class="acc-body">
            <div class="up-note ok" style="margin-bottom:0">${editing
              ? 'رابط بروفايلك عام للعرض. لمشاركته مع من يعدّل معك، انسخ «رابط المشاركة للتعديل» من نافذة الحفظ أو من صفحة «بروفايلاتي».'
              : 'بعد الحفظ ستحصل على رابطين: رابط عام للعرض، و«رابط مشاركة للتعديل» تعطيه لمن تريد أن يعدّل البروفايل معك.'}</div>
          </div>
        </details>
        </div>

        <button class="btn primary" id="gen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
          ${editing?'حفظ التغييرات':'إنشاء الرابط وحفظه'}
        </button>
      </section>

      <section class="preview-col" data-pane="preview">
        <div class="preview-head"><span class="t">معاينة حيّة</span><span class="live">مباشر</span></div>
        <div class="panel" style="padding:clamp(14px,2vw,22px)"><div class="stage" id="preview"></div></div>
      </section>

      <nav class="build-nav">
        <button class="bnav on" data-pane="data">${UICON.person}<span>البيانات</span></button>
        <button class="bnav" data-pane="design">${UICON.grid}<span>التصميم</span></button>
        <button class="bnav" data-pane="photo">${UICON.photo}<span>الصورة</span></button>
        <button class="bnav" data-pane="contact">${UICON.chat}<span>التواصل</span></button>
        <button class="bnav" data-pane="preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><span>المعاينة</span></button>
      </nav>
    </div></div>

    <div class="overlay" id="ov">
      <div class="modal">
        <button class="close" id="ovClose">✕</button>
        <div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="26" height="26"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h3 id="ovTitle">تم الحفظ</h3>
        <p id="ovDesc">هذا هو رابط بروفايلك الدائم — شاركه مع من تريد.</p>
        <div class="linkbox"><input id="outLink" readonly/><button class="btn gold" id="copyLink" style="padding:9px 16px">نسخ</button></div>
        <div id="shortNote" style="text-align:center;font-size:12px;color:var(--muted-2);margin:-8px 0 16px;min-height:16px"></div>
        <div class="modal-actions">
          <a class="btn primary" id="openLink" target="_blank">فتح البروفايل</a>
          <button class="btn ghost" id="toMine">بروفايلاتي</button>
        </div>
        <button class="btn ghost" id="copyEdit" style="width:100%;margin-top:10px">${IC2.share} نسخ رابط المشاركة للتعديل</button>
      </div>
    </div>` + drawer('build');

    // live preview
    let alignOn=false;
    const applyAlign=()=>{
      const imgs=$('#preview').querySelectorAll('.pf-avatar img, .pola-photo img, .pf-fp .fp-img');
      imgs.forEach(img=>{ img.classList.toggle('aligning',alignOn); const f=img.parentElement; if(f) f.classList.toggle('align-on',alignOn); });
      const t=$('#alignToggle'); if(t){ t.classList.toggle('active',alignOn); t.innerHTML=alignOn?UICON.check+' وضع السحب مفعّل':UICON.scope+' سحب داخل الإطار'; }
      const h=$('#alignHint'); if(h) h.classList.toggle('on',alignOn);
      const p=(state.photoPos||'50% 50%').split(/\s+/);
      const zx=$('#posX'); if(zx) zx.value=parseFloat(p[0])||50;
      const zy=$('#posY'); if(zy) zy.value=parseFloat(p[1])||50;
      const z=$('#zoomRange'); if(z) z.value=zoomSafe(state.photoZoom);
    };
    const paint = ()=>{ $('#preview').innerHTML = renderCard(state); wire3D($('#preview')); wireAlign($('#preview')); applyAlign(); };
    const playPreviewAnim = ()=>{ const pf=$('#preview .pf'); if(pf&&state.anim&&state.anim!=='none'){ pf.classList.remove('anim-'+state.anim); void pf.offsetWidth; pf.classList.add('anim-'+state.anim); } };
    paint(); playPreviewAnim();

    // 3D toggle
    const td=$('#f-threeD'); if(td) td.onchange=()=>{ state.threeD=td.checked; paint(); };
    // entrance animation
    const an=$('#f-anim'); if(an) an.onchange=()=>{ state.anim=an.value; paint(); playPreviewAnim(); };
    const ap=$('#animPlay'); if(ap) ap.onclick=()=>playPreviewAnim();

    // 3D motion
    const mo=$('#f-motion'); if(mo) mo.onchange=()=>{ state.motion3d=mo.value; paint(); };

    // image align controls (drag + manual sliders)
    const previewImg=()=>$('#preview .pf-avatar img')||$('#preview .pola-photo img')||$('#preview .fp-img');
    const at=$('#alignToggle'); if(at) at.onclick=()=>{ alignOn=!alignOn; applyAlign(); if(alignOn) toast('اسحب الصورة داخل الإطار · أو استخدم المنزلقات'); };
    const posX=$('#posX'), posY=$('#posY'), zr=$('#zoomRange');
    const applyPos=()=>{ state.photoPos=(posX?posX.value:50)+'% '+(posY?posY.value:50)+'%'; const img=previewImg(); if(img) img.style.objectPosition=state.photoPos; };
    if(posX) posX.oninput=applyPos; if(posY) posY.oninput=applyPos;
    if(zr) zr.oninput=()=>{ state.photoZoom=zoomSafe(zr.value); const img=previewImg(); if(img) img.style.transform='scale('+state.photoZoom+')'; };
    const arst=$('#alignReset'); if(arst) arst.onclick=()=>{ state.photoPos='50% 50%'; state.photoZoom=1; paint(); toast('تمت إعادة ضبط الصورة'); };

    // contact methods (links)
    state.links = Array.isArray(state.links)?[...state.links]:[];
    const renderLinks=()=>{
      const el=$('#linkList'); if(!el) return;
      el.innerHTML = state.links.length ? state.links.map((l,i)=>{ const t=CONTACT_TYPES[l.type];
        return `<span class="link-chip">${t?t.icon:''}<span>${esc((t?t.name:l.type)+' — '+l.value)}</span><button data-rm="${i}" title="حذف">✕</button></span>`;}).join('')
        : '<span class="link-empty">لم تُضف أي وسيلة تواصل بعد.</span>';
      el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ state.links.splice(+b.dataset.rm,1); renderLinks(); paint(); });
    };
    renderLinks();
    const la=$('#linkAdd'); if(la) la.onclick=()=>{
      const type=$('#linkType').value, value=$('#linkVal').value.trim();
      if(!value){ toast('أدخل الرابط أو المُعرّف'); return; }
      state.links.push({type,value}); $('#linkVal').value=''; renderLinks(); paint();
    };
    const lv=$('#linkVal'); if(lv) lv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#linkAdd').click(); } });

    // media: in-profile image gallery + youtube videos
    state.gallery = Array.isArray(state.gallery)?state.gallery.filter(Boolean):[];
    state.videos  = Array.isArray(state.videos)?state.videos.filter(Boolean):[];
    const renderGallery=()=>{
      const el=$('#galList'); if(!el) return;
      el.innerHTML = state.gallery.length ? state.gallery.map((u,i)=>
        `<span class="media-chip"><img src="${esc(u)}" alt="" onerror="this.style.display='none'"/><span class="mc-t">صورة ${i+1}</span><button data-grm="${i}" title="حذف">✕</button></span>`).join('')
        : '<span class="link-empty">لا توجد صور في المعرض بعد.</span>';
      el.querySelectorAll('[data-grm]').forEach(b=>b.onclick=()=>{ state.gallery.splice(+b.dataset.grm,1); renderGallery(); paint(); });
    };
    const renderVideos=()=>{
      const el=$('#vidList'); if(!el) return;
      el.innerHTML = state.videos.length ? state.videos.map((u,i)=>{ const id=ytId(u);
        return `<span class="media-chip vid${id?'':' bad'}">${UICON.play}<span class="mc-t">${id?('يوتيوب — '+id):'رابط غير صالح'}</span><button data-vrm="${i}" title="حذف">✕</button></span>`;}).join('')
        : '<span class="link-empty">لا توجد فيديوهات بعد.</span>';
      el.querySelectorAll('[data-vrm]').forEach(b=>b.onclick=()=>{ state.videos.splice(+b.dataset.vrm,1); renderVideos(); paint(); });
    };
    renderGallery(); renderVideos();
    const galAdd=$('#galAdd'); if(galAdd) galAdd.onclick=()=>{
      const v=$('#galVal').value.trim(); if(!v){ toast('ألصق رابط صورة'); return; }
      state.gallery.push(v); $('#galVal').value=''; renderGallery(); paint();
    };
    const gvv=$('#galVal'); if(gvv) gvv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#galAdd').click(); }});
    const galUp=$('#galUp'), galFile=$('#galFile'), galNote=$('#galNote');
    if(galUp){
      galUp.onclick=()=>galFile.click();
      galFile.onchange=async()=>{
        const f=galFile.files&&galFile.files[0]; if(!f) return;
        if(!/^image\//.test(f.type)){ galNote.className='up-note'; galNote.textContent='الملف المختار ليس صورة'; return; }
        if(f.size>32*1024*1024){ galNote.className='up-note'; galNote.textContent='حجم الصورة يتجاوز 32MB'; return; }
        const old=galUp.innerHTML; galUp.disabled=true; galUp.textContent='جارٍ الرفع…';
        galNote.className='up-note'; galNote.textContent='جارٍ رفع الصورة…';
        try{ const url=await uploadToImgbb(f); state.gallery.push(url); renderGallery(); paint();
          galNote.className='up-note ok'; galNote.textContent='✓ تمت إضافة الصورة إلى المعرض'; }
        catch(e){ console.error(e); galNote.className='up-note'; galNote.textContent='تعذّر رفع الصورة، حاول مجدداً'; }
        finally{ galUp.disabled=false; galUp.innerHTML=old; galFile.value=''; }
      };
    }
    const vidAdd=$('#vidAdd'); if(vidAdd) vidAdd.onclick=()=>{
      const v=$('#vidVal').value.trim(); if(!v){ toast('ألصق رابط يوتيوب'); return; }
      if(!ytId(v)){ toast('رابط يوتيوب غير صالح'); return; }
      state.videos.push(v); $('#vidVal').value=''; renderVideos(); paint();
    };
    const vvv=$('#vidVal'); if(vvv) vvv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#vidAdd').click(); }});

    // image upload -> imgbb -> photo url
    const upBtn=$('#upBtn'), upFile=$('#upFile'), upNote=$('#upNote');
    if(upBtn){
      upBtn.onclick=()=>upFile.click();
      upFile.onchange=async()=>{
        const file=upFile.files&&upFile.files[0]; if(!file) return;
        if(!/^image\//.test(file.type)){ upNote.className='up-note'; upNote.textContent='الملف المختار ليس صورة'; return; }
        if(file.size>32*1024*1024){ upNote.className='up-note'; upNote.textContent='حجم الصورة يتجاوز 32MB'; return; }
        const old=upBtn.innerHTML; upBtn.disabled=true; upBtn.textContent='جارٍ الرفع…';
        upNote.className='up-note'; upNote.textContent='جارٍ رفع الصورة…';
        try{
          const url=await uploadToImgbb(file);
          state.photo=url;
          const pf=$('#f-photo'); if(pf) pf.value=url;
          paint();
          upNote.className='up-note ok'; upNote.textContent='✓ تم رفع الصورة ووضع الرابط تلقائياً';
        }catch(e){
          console.error(e); upNote.className='up-note'; upNote.textContent='تعذّر رفع الصورة، حاول مجدداً';
        }finally{ upBtn.disabled=false; upBtn.innerHTML=old; upFile.value=''; }
      };
    }

    // inputs
    [['name'],['nameEn'],['kicker'],['role'],['about'],['university'],['universityEn'],
     ['faculty'],['degree'],['specialization'],['interests'],['email'],['phone'],['photo']]
     .forEach(([k])=>{
       const el=$('#f-'+k); if(!el)return;
       el.addEventListener('input',()=>{state[k]=el.value;paint();});
     });

    // layout picker (locked layouts need a subscription)
    $('#lays').querySelectorAll('.lay').forEach(l=>{
      l.onclick=()=>{
        if(l.dataset.locked && !isPremium()){ toast('هذا التخطيط للمشتركين المميزين ✦'); return; }
        state.layout=l.dataset.lay;
        $('#lays').querySelectorAll('.lay').forEach(x=>x.classList.toggle('active',x===l));
        paint();
      };
    });
    const ls=$('#laySearch'); if(ls) ls.oninput=()=>{ const q=ls.value.trim();
      $('#lays').querySelectorAll('.lay').forEach(el=>{ el.style.display = el.dataset.name.includes(q)?'':'none'; }); };

    // color template picker (locked colors need a subscription)
    $('#tpls').querySelectorAll('.tpl').forEach(t=>{
      t.onclick=()=>{
        if(t.dataset.locked && !isPremium()){ toast('هذا اللون للمشتركين المميزين ✦'); return; }
        state.template=t.dataset.tpl;
        $('#tpls').querySelectorAll('.tpl').forEach(x=>x.classList.toggle('active',x===t));
        paint();
      };
    });

    wireAppbar();
    let editLink='';

    // save (create or update)
    $('#gen').onclick = async ()=>{
      if(!currentUser){ showAuth('login'); return; }
      const btn=$('#gen'); btn.disabled=true; const old=btn.innerHTML; btn.innerHTML='جارٍ الحفظ…';
      const note=$('#shortNote'); note.textContent='';
      try{
        const owner     = editing ? editMeta.ownerUid  : currentUser.uid;
        const ownerName = editing ? editMeta.ownerName : currentUser.username;
        const createdAt = editing ? editMeta.createdAt : Date.now();
        const id = editingId || await uniqueShortId();
        // free accounts can't save premium profile features
        if(!isPremium()){
          const li=LAYOUTS.findIndex(l=>l.id===state.layout); if(li>=FREE_PROFILE_LAYOUTS) state.layout=(LAYOUTS[0]||{}).id||state.layout;
          const ti=TEMPLATES.findIndex(t=>t.id===state.template); if(ti>=FREE_PROFILE_COLORS) state.template=(TEMPLATES[0]||{}).id||state.template;
          state.threeD=false; state.anim='none'; if(MOTIONS[0]) state.motion3d=MOTIONS[0].id;
          state.gallery=[]; state.videos=[];
        }
        const clean = {...state, ownerUid:owner, ownerName, createdAt, updatedAt:Date.now(), viewSalt:null, viewPassHash:null};
        await set(ref(db,'profiles/'+id), clean);
        await set(ref(db,'userProfiles/'+owner+'/'+id), {name:state.name||'بدون اسم', template:state.template, updatedAt:Date.now()});
        // now in edit mode for subsequent saves
        editingId=id; editMeta={ownerUid:owner, ownerName, createdAt};

        const full=urlProfileView(id);
        editLink=urlProfileEdit(id);
        $('#ovTitle').textContent = editing?'تم حفظ التغييرات':'تم إنشاء البروفايل';
        $('#ovDesc').textContent = 'رابط عام للعرض بالأسفل — وبالأسفل «رابط المشاركة للتعديل» لمن يعدّل معك.';
        $('#outLink').value=full; $('#openLink').href=full;
        $('#ov').classList.add('show');
        note.textContent='';
      }catch(e){
        console.error(e); toast('تعذّر الحفظ — سجّل الدخول وتحقّق من قواعد قاعدة البيانات');
      }finally{ btn.disabled=false; btn.innerHTML=old; }
    };

    $('#copyLink').onclick=()=>{navigator.clipboard?.writeText($('#outLink').value);toast('تم نسخ الرابط ✓');};
    $('#copyEdit').onclick=()=>{ if(editLink){navigator.clipboard?.writeText(editLink);toast('تم نسخ رابط التعديل ✓ — شاركه لمن يعدّل البروفايل');} };
    $('#ovClose').onclick=()=>$('#ov').classList.remove('show');
    $('#toMine').onclick=()=>{$('#ov').classList.remove('show'); showMyProfiles();};
    $('#ov').onclick=e=>{if(e.target===$('#ov'))$('#ov').classList.remove('show');};

    // ---- app-like section navigation (mobile bottom bar + swipe) ----
    (function(){
      const nav=$('.build-nav'); if(!nav) return;
      const panel=$('.builder>.panel');
      const prev=$('.builder .preview-col');
      const panes=[...document.querySelectorAll('.builder .bpane')];
      const order=['data','design','photo','contact','preview'];
      let current='data';
      const isMobile=()=>window.matchMedia('(max-width:600px)').matches;
      const setPane=(name)=>{
        if(!order.includes(name)) return;
        current=name;
        nav.querySelectorAll('.bnav').forEach(b=>b.classList.toggle('on',b.dataset.pane===name));
        if(name==='preview'){
          if(panel) panel.classList.add('pane-hide');
          if(prev) prev.classList.add('pane-show');
          paint(); playPreviewAnim();
        }else{
          if(panel) panel.classList.remove('pane-hide');
          if(prev) prev.classList.remove('pane-show');
          panes.forEach(p=>p.classList.toggle('pane-on',p.dataset.pane===name));
        }
        if(isMobile()) window.scrollTo({top:0,behavior:'smooth'});
      };
      nav.querySelectorAll('.bnav').forEach(b=>b.onclick=()=>setPane(b.dataset.pane));
      // horizontal swipe between sections — but never hijack gestures that begin
      // on a control that needs its own horizontal drag / scroll / tap
      let sx=0,sy=0,tracking=false;
      const root=$('.builder');
      const NO_SWIPE='input,textarea,select,button,a,label,[type=range],.layouts,.templates,.lay,.tpl,.align-sliders,.link-list,.mini-select,.swatch';
      root.addEventListener('touchstart',e=>{
        tracking=false;
        if(!isMobile()||e.touches.length>1) return;
        if(e.target.closest(NO_SWIPE)) return;
        sx=e.touches[0].clientX; sy=e.touches[0].clientY; tracking=true;
      },{passive:true});
      root.addEventListener('touchend',e=>{
        if(!tracking) return; tracking=false;
        const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
        if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.8) return; // must be a deliberate horizontal swipe
        const i=order.indexOf(current);
        // RTL: swipe right → previous (earlier) section, swipe left → next
        const ni = dx>0 ? i-1 : i+1;
        if(ni>=0&&ni<order.length) setPane(order[ni]);
      },{passive:true});
      setPane('data');
    })();
  }

  /* ======================================================================
     VIEWER
     ====================================================================== */
  async function showViewer(id){
    $('#app').innerHTML = `<div class="loader"><div><div class="spin"></div>جارٍ تحميل البروفايل…</div></div>`;
    try{
      const snap = await get(child(ref(db),'profiles/'+id));
      if(!snap.exists()){
        renderError({code:'404', tag:'بروفايل غير موجود · NOT FOUND', title:'هذا البروفايل غير موجود',
          msg:'الرابط غير صحيح أو تم حذف البروفايل أو تعديل معرّفه. تحقّق من الرابط أو أنشئ بروفايلاً جديداً.'});
        return;
      }
      const d = snap.val();
      const paintProfile=()=>{
        seoFor(d);
        document.body.style.background = PAGE_BG[d.template]||'#0c1424';
        $('#app').innerHTML = `<div class="viewer">${renderCard(d)}<div class="elg-ad" data-ad="profile"></div></div>`;
        wireCopy($('#app')); wire3D($('#app'));
        if(d.anim && d.anim!=='none'){ const pf=$('#app .pf'); if(pf) pf.classList.add('anim-'+d.anim); }
        if(window.elgFillAds) window.elgFillAds($('#app'));
      };
      if(isLocked(d)){ showPassGate('p', id, d, paintProfile); return; }
      paintProfile();
    }catch(e){
      console.error(e);
      renderError({code:'⚠', tag:'تعذّر التحميل · LOAD ERROR', title:'تعذّر تحميل البيانات',
        msg:'تحقّق من اتصالك بالإنترنت أو من قواعد قاعدة البيانات، ثم أعد المحاولة.', showReload:true});
    }
  }

  /* ======================================================================
     BLOG MODULE — 150 professional design themes, posts, viewer & builder
     ====================================================================== */
  /* Each design: name + palette. Font scheme (bf) and hero layout (bh) are
     assigned across the set so all 150 feel genuinely distinct & professional. */
  const _bd=(name,light,bg,panel,text,muted,accent,accent2)=>({name,light,bg,panel,text,muted,accent,accent2});
  const BLOG_DESIGNS_RAW = [
    _bd('ميدنايت','0',  '#0c1424','#111d33','#eef2fb','#9fabc6','#c9a548','#e6c980'),
    _bd('أرشد أبيض','1','#ffffff','#f5f7fb','#16233d','#5a6a86','#1c3f82','#3f74c9'),
    _bd('زمرد ليلي','0','#08160f','#0e2018','#eafff2','#9fc4ac','#1aa564','#5fe0a0'),
    _bd('قرمزي','0',    '#160a0d','#200e12','#fff0f1','#d3a6ab','#c8384a','#ff7a8a'),
    _bd('رملي فاخر','1','#faf6ee','#f1e8d8','#3a2c18','#7a6a52','#8a5a2a','#c08a3a'),
    _bd('محيط عميق','0','#04121c','#0a2030','#e6f4ff','#9cc0d4','#1477b0','#4fc4f0'),
    _bd('خزامى','1',    '#f8f5fd','#ece4f7','#2a1a3d','#6a5a80','#7a34d0','#b070e0'),
    _bd('جرافيت','0',   '#0e0e11','#18181d','#f2f2f4','#a0a0a8','#f5a623','#ffca63'),
    _bd('نبيذي','0',    '#180a10','#241019','#fbeef0','#c9a9b2','#9a1a44','#e0407e'),
    _bd('غابة','1',     '#f2f7f2','#e2ede2','#183020','#5a7a62','#2f7a4a','#5fb87a'),
    _bd('سماء','1',     '#f2faff','#e0f0fb','#0f2f45','#4a6f88','#2f9ad8','#6fc4f0'),
    _bd('نيون','0',     '#0a0713','#140a1e','#fdeaff','#c6a6d0','#c81aa0','#4ff0ff'),
    _bd('برونز','0',    '#160f0a','#221810','#fbf2e6','#c4ac90','#cd7f32','#e6a45a'),
    _bd('ياقوت','0',    '#160610','#22091a','#ffeaf1','#d3a2b2','#c01050','#ff5e8a'),
    _bd('نعناع','1',    '#f0fbf6','#dff2ea','#123a2c','#4f7a68','#1f8a5a','#4fc088'),
    _bd('فحمي','0',     '#101012','#1a1a1e','#f2f3f5','#a6a8ad','#8fb0ff','#c8d4ff'),
    _bd('غروب','0',     '#180d12','#241420','#fff0ea','#d3aca0','#e0456b','#ff9e5e'),
    _bd('لؤلؤ','1',     '#fffdfb','#f4ece6','#3a2e2a','#8a746c','#b07a5a','#d8a888'),
    _bd('كوبالت','0',   '#05091a','#0c1430','#e6eeff','#9aabd4','#1a3fd0','#5f8aff'),
    _bd('عاج كلاسيكي','1','#fdfbf6','#f0ebe0','#2a2418','#6e6452','#8a6a1f','#c0982f'),
    _bd('توت بري','0',  '#140714','#20102a','#ffe8f4','#cfa4bc','#9a1a5a','#e0407e'),
    _bd('فيروز','0',    '#04161a','#0a2228','#e0fbfb','#93c8c8','#0f9a9a','#4fe0e0'),
    _bd('ماجنتا','0',   '#160718','#221028','#ffe8fb','#d0a6cc','#c010a0','#ff5ed8'),
    _bd('حجري','1',     '#f5f6f8','#e6e9ef','#1f2a3a','#5a6678','#4a6b9a','#7794c4'),
    _bd('عنبر','0',     '#160f06','#221810','#fdf3e2','#c9b48c','#e0951a','#ffca63'),
    _bd('كاكاو','1',    '#faf5f0','#ece0d4','#3a2a1e','#7a6656','#8a5a3a','#c08a60'),
    _bd('دنيم','1',     '#f4f7fb','#e2eaf3','#1f3050','#5a6a86','#3f5f9a','#7794c8'),
    _bd('لايم','0',     '#0e1405','#181f0a','#f2ffe0','#bcd096','#7ab02a','#c8f063'),
    _bd('أوركيد','1',   '#faf5fd','#ece0f5','#331a3d','#6f5a80','#9a3fc0','#c87fe8'),
    _bd('سافير','0',    '#060f24','#0c1a38','#e9f0ff','#9fb0d4','#1a45b0','#5f8aff'),
    _bd('خوخي','1',     '#fff7f3','#ffe9df','#4a2e22','#8a6558','#d0562f','#ff9a6a'),
    _bd('أوبسيديان','0','#0a0a0c','#141418','#f2f3f5','#a6a8ad','#c8ccd4','#eef0f4'),
    _bd('يشب','1',      '#f2fbf7','#ddefe7','#0f3a2e','#4a7a68','#0f8a66','#4fc0a0'),
    _bd('كوبالت فاتح','1','#f2f6ff','#e0e8fb','#101f45','#4a5a86','#2f5ae8','#6f8aff'),
    _bd('سلمون','0',    '#1a0e0c','#26140f','#fff0ea','#d3aca0','#e0654a','#ff9a7a'),
    _bd('بحري داكن','0','#080d1a','#101830','#eaf0fb','#9aa8c4','#2f4a8a','#5f7ac4'),
    _bd('موس أخضر','0', '#101405','#1a200a','#eef2df','#b0bc90','#788a34','#c8d67f'),
    _bd('تانجرين','0',  '#180d05','#241610','#fff0e2','#d0ac8c','#e07520','#ff9e50'),
    _bd('بلاش','1',     '#fff6f8','#fbe6ec','#42222e','#8a6270','#c05a7a','#eca0b8'),
    _bd('سيفوم','1',    '#f0fbf9','#dcf2ee','#0f3a36','#4a7a74','#1ab0a0','#5fc8ba'),
    _bd('إنديجو','0',   '#0b0e26','#141838','#eceeff','#a4a8d0','#3f3fb0','#7f7fe0'),
    _bd('ذهبي فاخر','0','#141210','#201c16','#fbf4e6','#bdae90','#b8912f','#e8c063'),
    _bd('فولاذ فاتح','1','#f4f6f9','#e4e9f0','#1f2a3a','#5a6678','#54688a','#8aa0c4'),
    _bd('برقوق','0',    '#150a1f','#20122e','#f4ecff','#bda6d3','#7a34d0','#b070e0'),
    _bd('جليد','1',     '#f4fafd','#e6f2f8','#12303d','#5a7885','#2f8fb0','#6fc4de'),
    _bd('صحراء ليلية','0','#161009','#221810','#fbf2e6','#c4ac90','#d8a35a','#f0c489'),
    _bd('أزرق ملكي','0','#0a1024','#121a38','#eaf0fb','#9aa8c4','#2f5db0','#5f8ae0'),
    _bd('وردي هادئ','1','#fff5f7','#fbe7ec','#3d1622','#8a5a68','#c14d6b','#e28aa0'),
    _bd('تركواز داكن','0','#03181a','#0a2428','#e0fbfb','#93c8c8','#1ac0c0','#5fe0e0'),
    _bd('أبيض تحريري','1','#ffffff','#f2f2f3','#18181b','#6b6b70','#27272a','#52525b'),
    /* ---- 50 more professional themes (51–100) ---- */
    _bd('كربون','0',    '#0a0c10','#141821','#eef1f6','#9aa2b0','#e0b23a','#ffd76a'),
    _bd('ثلج ناعم','1', '#fbfcfe','#eef2f8','#1a2230','#5c6678','#3b62c4','#6f8ee0'),
    _bd('غابة عميقة','0','#06140e','#0c2018','#e6fbf0','#93c4ab','#159a5e','#4fd699'),
    _bd('ياقوت داكن','0','#180509','#240a10','#ffe6ec','#cf9aa6','#b01236','#f0537a'),
    _bd('ذهب رملي','1', '#fbf7ee','#efe6d2','#352a17','#786a50','#94651f','#c89a34'),
    _bd('محيط ليلي','0','#03101c','#081e30','#e0f2ff','#93b6cf','#1284c0','#54c8f4'),
    _bd('بنفسج ملكي','0','#0d0722','#150e34','#eee6ff','#ab9cd0','#6a2fd0','#a878ec'),
    _bd('فحم دافئ','0', '#0e0d0c','#1a1815','#f4f2ee','#a8a29a','#e69a3a','#ffc26a'),
    _bd('توت داكن','0', '#150612','#22102a','#ffe6f6','#cf9ec6','#a3106a','#e850a4'),
    _bd('زيتوني','1',   '#f5f7ec','#e6ecd4','#2a2f16','#646a4c','#6e7a24','#a4b444'),
    _bd('سماوي فاتح','1','#f0f9ff','#dceffb','#0e2c40','#4a6c82','#1f8fd0','#5fc0f0'),
    _bd('رمادي فحمي','0','#0d0e10','#181a1e','#eef0f4','#a2a6ae','#7f9cff','#b4c4ff'),
    _bd('مرجاني','0',   '#1a0a0a','#261210','#fff0ec','#d3aaa2','#e0503a','#ff8e70'),
    _bd('عاجي دافئ','1','#fdf9f2','#f1e8d8','#33291c','#7a6a54','#9a6a2a','#cc9848'),
    _bd('أزرق فولاذي','0','#070c18','#0e1830','#e6ecf8','#98a6c2','#2a55c0','#6288ec'),
    _bd('زمردي فاتح','1','#eefcf4','#d8f2e4','#0e3a2a','#4a7a64','#12a06a','#4fd0a0'),
    _bd('خمري داكن','0','#170710','#22101c','#fbe8f0','#cba6b6','#901048','#dc4886'),
    _bd('عنبري','0',    '#170f04','#241810','#fef2df','#cbb488','#e8961a','#ffcf5f'),
    _bd('نيلي','0',     '#080a24','#101438','#e8eaff','#a0a4d4','#3838c0','#7a7aec'),
    _bd('وردي فاتح','1','#fff5f9','#fbe4ee','#40182a','#8a6072','#c84d80','#ec8ab0'),
    _bd('فيروزي عميق','0','#03181c','#0a262c','#dcfbfc','#8fc8ca','#12b0b0','#5fe4e4'),
    _bd('أسود لامع','0','#08080a','#121216','#f0f1f4','#a4a6ac','#d4d8e0','#ffffff'),
    _bd('حجر رملي','1', '#f7f5f0','#e9e4d8','#2e2a20','#6c6656','#8a6a3a','#bc9860'),
    _bd('أزرق سماوي','0','#04101f','#0a2036','#e4f0fb','#96acc6','#1f6ad0','#5f9cf0'),
    _bd('ليموني','0',   '#0f1405','#1a220a','#f4ffe2','#bed098','#84b024','#c4f050'),
    _bd('أوركيدي','1',  '#fbf4fe','#eddef6','#361a40','#725a82','#9a34c4','#c47ce8'),
    _bd('كهرماني','0',  '#151007','#221912','#fdf3e0','#cbb488','#d89a24','#f4c45f'),
    _bd('كاكاو داكن','0','#140c08','#201610','#f6ece2','#bfa892','#a06a3a','#d09860'),
    _bd('جينزي','1',    '#f2f6fc','#e0e9f5','#1c2f52','#586a88','#3558a0','#7090cc'),
    _bd('نعناعي داكن','0','#04140f','#0a221a','#e2fbf0','#8fc4ac','#1aa878','#5fd8ac'),
    _bd('سلموني فاتح','1','#fff6f2','#fbe6dc','#492c20','#8a6558','#d06040','#f4a080'),
    _bd('أزرق داكن جداً','0','#05091a','#0a1230','#e6ecfb','#96a2c4','#3050b0','#6f8ce8'),
    _bd('أخضر طحلبي','0','#0c1206','#161e0a','#eef4e0','#b0bc90','#6e8a2a','#aac858'),
    _bd('يوسفي','0',    '#170e05','#241610','#fff0df','#d0ac88','#e07818','#ffa64f'),
    _bd('خوخي وردي','1','#fff5f6','#fbe6ea','#43222c','#8a626c','#c05870','#eca0b4'),
    _bd('بحري ساطع','0','#03141c','#0a242e','#dcf4fc','#8fbccb','#1298c4','#54d0f0'),
    _bd('أرجواني عميق','0','#0e0620','#160e32','#efe6ff','#ac9ed0','#7328c4','#ab74e8'),
    _bd('ذهبي داكن','0','#12100c','#1e1a12','#faf2e2','#bcae8e','#b8912f','#e6c063'),
    _bd('فضي فاتح','1', '#f6f7f9','#e6e9ee','#232833','#5e6472','#5a6c8c','#90a4c4'),
    _bd('برقوقي','0',   '#140a1c','#1e1230','#f0e6fb','#b6a4cf','#7434c4','#ac74e4'),
    _bd('جليدي','1',    '#f2fbfe','#e2f2f9','#123240','#587885','#2a92b4','#6fc6de'),
    _bd('صحراوي','0',   '#150f07','#221810','#faf2e4','#c8b090','#d0a04c','#ecc484'),
    _bd('كحلي ملكي','0','#0a1026','#12183a','#e8eefb','#98a6c6','#2a5ec0','#5f92ec'),
    _bd('وردي عتيق','1','#fdf4f6','#f6e4ea','#3f1a26','#88586a','#bc506e','#e488a4'),
    _bd('تركوازي فاتح','1','#eefcfc','#d6f2f2','#0e3838','#4a7878','#12aaaa','#4fd6d6'),
    _bd('رصاصي','1',    '#f4f5f7','#e6e8ec','#22262e','#5c6270','#4c5a74','#8494b0'),
    _bd('برتقالي محروق','0','#170c06','#241410','#ffeee2','#d0a690','#e0602a','#ff9660'),
    _bd('أخضر بحري','0','#031614','#0a2422','#dcf6f2','#8fc4be','#12a094','#4fd4c6'),
    _bd('نبيذي فاخر','0','#160810','#221020','#fbe8f2','#cba4b8','#9a1a58','#dc4c92'),
    _bd('أزرق مخملي','0','#070a1a','#0e142e','#e6eafb','#98a2c4','#3448b8','#7480e4'),
    /* ---- 50 more professional themes (101–150) ---- */
    _bd('ليل توتي','0',  '#0c0714','#160e22','#f0e8fb','#b2a4c8','#7a3ad0','#ac78ec'),
    _bd('قهوة فاتحة','1','#f8f3ec','#ece0d0','#3a2c1e','#7a6a54','#956039','#c2905e'),
    _bd('أزرق جليدي','1','#f0f8fd','#dcedf8','#123044','#4e6e82','#2287c0','#5cbef0'),
    _bd('غروب ناري','0','#170a08','#25120e','#ffece4','#d3a898','#e04e2a','#ff8c56'),
    _bd('زمرد داكن','0','#03130d','#0a2018','#dcfbee','#8cc4aa','#12a05e','#4fd694'),
    _bd('ضباب رمادي','1','#f5f6f8','#e7eaef','#242832','#5e6472','#556184','#8896b8'),
    _bd('توهج ذهبي','0','#14110a','#201a10','#fcf3e0','#c2b088','#c99320','#ecc258'),
    _bd('بترولي','0',   '#04141a','#0a2028','#dcf4fa','#8cbcca','#0f8ca8','#4cccea'),
    _bd('خزامى فاتح','1','#f9f5fd','#ece2f6','#341c42','#6f5c82','#8a3ec0','#bc7ce6'),
    _bd('كرزي','0',     '#170710','#23101c','#ffe6f2','#cfa2ba','#a01050','#e2488c'),
    _bd('عشبي','1',     '#f3f8ee','#e4eed6','#26301a','#5e6a4c','#6a8a2c','#a2b84c'),
    _bd('نيلي عميق','0','#080826','#101038','#e6e8ff','#a0a2d2','#3434c2','#7676ea'),
    _bd('مرجان فاتح','1','#fff5f3','#fbe4de','#48261e','#8a655a','#d0583c','#f49a7c'),
    _bd('رخام داكن','0','#0c0d0f','#17181c','#eef0f4','#a4a8b0','#c8ccd6','#f0f2f8'),
    _bd('عنبر غامق','0','#160f05','#241810','#fdf2df','#cbb082','#dc9418','#f8c250'),
    _bd('محيطي','1',    '#eff9fd','#d8eff8','#0e3040','#4a7080','#1a8cba','#58c2e4'),
    _bd('برقوق داكن','0','#130818','#1e1028','#f2e6fb','#b8a6cc','#7228bc','#a86ce0'),
    _bd('ليموني داكن','0','#0d1206','#171e0a','#f2ffde','#bcce92','#7ea81e','#bcec48'),
    _bd('صدأ','0',      '#160c07','#231610','#fbeee2','#cba892','#b06030','#dc9260'),
    _bd('سماوي عميق','0','#04101e','#0a2034','#e2f0fb','#94accc','#1a72c8','#58a2ec'),
    _bd('وردي غامق','0','#170812','#221020','#ffe6f4','#cba2ba','#b01868','#e650a0'),
    _bd('فيروز فاتح','1','#effcfb','#d6f4f2','#0e3a38','#4a7a76','#12aca6','#50d8d0'),
    _bd('كحلي فحمي','0','#080a16','#101228','#e6e8f4','#98a0be','#3a4e9a','#7284c8'),
    _bd('خوخ فاتح','1', '#fff6f0','#fbe6da','#4a2e20','#8a6656','#d06838','#f4a072'),
    _bd('بنفسج داكن','0','#0e0620','#160c34','#eee4ff','#aa9cd2','#6a24c8','#a068ec'),
    _bd('زيتي داكن','0','#101305','#1a200a','#eef4de','#b0bc8e','#748a20','#aec84a'),
    _bd('تركواز غامق','0','#031816','#0a2622','#dcf6f2','#8ec6bc','#12a894','#50d8c4'),
    _bd('ذهب وردي','1', '#fef4f2','#f7e2dc','#42272a','#886066','#c06a72','#e89ca2'),
    _bd('أزرق فولاذي2','0','#070c16','#0e162c','#e6ecf6','#98a4bc','#345ea8','#6a90d4'),
    _bd('نعناع فاتح','1','#eefbf5','#d8f2e6','#0e3a2c','#4a7a66','#12a86e','#50d69e'),
    _bd('كهرمان فاتح','1','#fdf6ea','#f2e6cc','#3a2e14','#7a6a48','#a07818','#cca044'),
    _bd('أرجوان غامق','0','#100622','#180e36','#f0e4ff','#ac9ad4','#7020c8','#a662ec'),
    _bd('بحري فاتح','1','#f0f7fd','#dcecf8','#123244','#4e7082','#2280bc','#5cb8ee'),
    _bd('برتقال داكن','0','#160b05','#231410','#ffece0','#d0a68e','#dc5e1e','#fc9250'),
    _bd('أخضر داكن2','0','#06120c','#0c1e16','#def6ea','#8ec2a6','#149660','#4ec894'),
    _bd('ياقوت فاتح','1','#fdf3f5','#f6e2e8','#3f1a24','#885864','#bc3a5e','#e47c98'),
    _bd('رمادي أزرق','1','#f4f6fa','#e4e9f2','#1e2a3c','#586880','#4a6494','#7e9cc8'),
    _bd('كوبالت غامق','0','#040820','#0a1236','#e6eafb','#96a0c8','#2842c4','#6478ea'),
    _bd('خمري فاتح','1','#fbf2f4','#f4e0e6','#3d1a24','#865864','#b03a56','#dc7a92'),
    _bd('عنبي','0',     '#0e0716','#180e26','#eee4f6','#b0a2c4','#6234a8','#9c6cd4'),
    _bd('ذهبي رملي2','1','#faf5ea','#efe4ca','#352a16','#786c4c','#94661e','#c49838'),
    _bd('محيط داكن2','0','#03121c','#081f30','#dcf0fb','#8eaecc','#1276b8','#4ca8ec'),
    _bd('نعناعي غامق','0','#04140e','#0a2018','#def8ec','#8ec6a8','#14a468','#50d69a'),
    _bd('توت فاتح','1', '#fdf2f8','#f6e0ee','#3f1a30','#88586e','#b03a7c','#dc7ab0'),
    _bd('فحمي أزرق','0','#0a0c12','#151822','#eef0f6','#a2a8b6','#6a8cf0','#a0b8ff'),
    _bd('عسلي','0',     '#160f06','#241810','#fef2e0','#cbb084','#dc9820','#f8c458'),
    _bd('سماوي غامق','0','#040e1c','#0a1c30','#e0eefb','#92aacc','#1a68c4','#589cec'),
    _bd('بنفسج فاتح','1','#f8f4fd','#eae0f6','#301a40','#6c5a80','#8434c0','#b674e6'),
    _bd('زبرجد','0',    '#03140f','#0a201a','#dcf6ee','#8ec6ba','#12a084','#50d4bc'),
    _bd('أنيق أبيض2','1','#fdfdfd','#f0f1f3','#1a1a1e','#66666e','#2a2a30','#565660'),
  ];
  const _BF=['serif','amiri','mixed','sans','serif','mono'];
  const _BH=['cover','band','center','split','mag'];
  const BLOG_DESIGNS = BLOG_DESIGNS_RAW.map((d,i)=>({
    id:'bd'+(i+1),
    name:d.name,
    light:d.light==='1'||d.light===1,
    bg:d.bg, panel:d.panel, text:d.text, muted:d.muted, accent:d.accent, accent2:d.accent2,
    bf:_BF[i%_BF.length],
    bh:_BH[(i*2+Math.floor(i/5))%_BH.length],
  }));
  const BLOG_BY_ID = Object.fromEntries(BLOG_DESIGNS.map(d=>[d.id,d]));
  const blogDesign = id => BLOG_BY_ID[id] || BLOG_DESIGNS[0];
  /* extra blog customization options (3D, entrance animation, search box, sidebar, news ticker) */
  const BLOG_ANIMS   = [{id:'none',name:'بدون'},{id:'fade',name:'ظهور ناعم'},{id:'rise',name:'صعود'},{id:'zoom',name:'تكبير'},{id:'slide',name:'انزلاق جانبي'},{id:'flip',name:'انقلاب'}];
  const BLOG_SEARCH  = [{id:'off',name:'بدون'},{id:'pill',name:'كبسولة'},{id:'box',name:'صندوق'},{id:'underline',name:'خط سفلي'},{id:'glow',name:'متوهّج'}];
  const BLOG_SIDEBAR = [{id:'none',name:'بدون'},{id:'cards',name:'بطاقات'},{id:'minimal',name:'بسيط'},{id:'bordered',name:'مؤطّر'}];
  const BLOG_TICKER  = [{id:'none',name:'بدون'},{id:'marquee',name:'شريط متحرك'},{id:'badge',name:'شارة «عاجل»'},{id:'dots',name:'نقاط وامضة'}];
  const bAnim    = d => { const v=d.anim||'none'; return v!=='none'?('banim banim-'+v):''; };
  const bTilt    = d => d.threeD ? 'btilt' : '';
  const bSearchStyle  = d => d.searchStyle||'off';
  const bSidebarStyle = d => d.sidebarStyle||'none';
  const bTickerStyle  = d => d.tickerStyle||'none';
  (function injectBlogCSS(){
    const css = BLOG_DESIGNS.map(d=>{
      const stroke = d.light ? 'rgba(20,30,50,.12)' : 'rgba(210,222,245,.12)';
      return `.blog.${d.id}{--b-bg:${d.bg};--b-bg2:${d.panel};--b-panel:${d.panel};--b-text:${d.text};--b-muted:${d.muted};`
        + `--b-stroke:${stroke};--b-accent:${d.accent};--b-accent2:${d.accent2};--b-head:${d.text};`
        + `--b-hero:linear-gradient(135deg,${d.accent},${d.accent2})}`;
    }).join('\n');
    const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  })();

  /* blog helpers */
  const blogFmtDate = v => {
    if(v==null||v==='') return '';
    if(typeof v==='number') { try{ return new Date(v).toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'}); }catch{ return ''; } }
    return String(v);
  };
  /* strip tags → plain text (safe, no script execution) for excerpts & word counts */
  function stripHTML(html){ try{ return (new DOMParser().parseFromString(String(html||''),'text/html').body.textContent||'').replace(/\s+/g,' ').trim(); }catch{ return String(html||'').replace(/<[^>]*>/g,' '); } }
  const blogReadTime = body => { const w=stripHTML(body).split(/\s+/).filter(Boolean).length; return Math.max(1,Math.round(w/180))+' دقائق قراءة'; };
  /* public post list — hides unpublished drafts (published===false). Posts with no
     flag (legacy) are treated as published. Admin/builder use the raw array instead. */
  const blogPosts = d => Array.isArray(d.posts)?d.posts.filter(p=>p&&p.published!==false):[];
  const blogAllPosts = d => Array.isArray(d.posts)?d.posts.filter(Boolean):[];
  /* turn plain post text into rich HTML (## heading, ### sub, > quote, blank line = new paragraph).
     Parses line-by-line so a heading immediately followed by body text renders correctly. */
  function formatArticle(text){
    const lines=String(text||'').replace(/\r/g,'').split('\n');
    let html='', para=[];
    const flush=()=>{ if(para.length){ html+='<p>'+para.map(esc).join('<br>')+'</p>'; para=[]; } };
    for(const raw of lines){
      const t=raw.trim();
      if(!t){ flush(); continue; }
      if(t.startsWith('### ')){ flush(); html+='<h3>'+esc(t.slice(4))+'</h3>'; }
      else if(t.startsWith('## ')){ flush(); html+='<h2>'+esc(t.slice(3))+'</h2>'; }
      else if(t.startsWith('# ')){ flush(); html+='<h2>'+esc(t.slice(2))+'</h2>'; }
      else if(t.startsWith('> ')){ flush(); html+='<blockquote>'+esc(t.slice(2))+'</blockquote>'; }
      else para.push(t);
    }
    flush();
    return html;
  }
  /* sanitize author-authored HTML (from the rich editor) before rendering it to other readers.
     Whitelist tags/attributes, drop scripts/handlers/unsafe URLs, allow only YouTube/Vimeo iframes. */
  const RTE_ALLOWED = {
    B:[],STRONG:[],I:[],EM:[],U:[],S:[],STRIKE:[],DEL:[],MARK:[],SMALL:[],SUB:[],SUP:[],BR:[],HR:[],
    P:['style'],DIV:['style'],SPAN:['style'],H1:[],H2:[],H3:[],H4:[],H5:[],H6:[],
    BLOCKQUOTE:[],UL:[],OL:[],LI:[],PRE:[],CODE:[],
    A:['href','title'],IMG:['src','alt','title'],FIGURE:[],FIGCAPTION:[],
    TABLE:[],THEAD:[],TBODY:[],TR:[],TD:['colspan','rowspan'],TH:['colspan','rowspan'],
    IFRAME:['src','allow','allowfullscreen','frameborder','width','height']
  };
  const SAFE_STYLE = /^(text-align|font-weight|font-style|text-decoration|color|background-color)\s*:/i;
  function sanitizeHTML(html){
    let root;
    try{ root = new DOMParser().parseFromString('<div id="_r">'+String(html||'')+'</div>','text/html').getElementById('_r'); }
    catch{ return esc(stripHTML(html)); }
    if(!root) return '';
    const walk = node => {
      [...node.childNodes].forEach(ch=>{
        if(ch.nodeType===8){ ch.remove(); return; }           // comments
        if(ch.nodeType!==1) return;                            // keep text nodes
        const tag=ch.tagName;
        if(tag==='SCRIPT'||tag==='STYLE'||tag==='LINK'||tag==='META'||tag==='OBJECT'||tag==='EMBED'){ ch.remove(); return; }
        if(!RTE_ALLOWED[tag]){ walk(ch); const p=ch.parentNode; while(ch.firstChild) p.insertBefore(ch.firstChild,ch); p.removeChild(ch); return; }
        // scrub attributes
        [...ch.attributes].forEach(a=>{
          const n=a.name.toLowerCase();
          if(n.startsWith('on')){ ch.removeAttribute(a.name); return; }
          if(!RTE_ALLOWED[tag].includes(n)){ ch.removeAttribute(a.name); return; }
          if(n==='style' && !a.value.split(';').every(s=>!s.trim()||SAFE_STYLE.test(s.trim()))) ch.removeAttribute(a.name);
        });
        if(ch.hasAttribute('href')){ const h=ch.getAttribute('href')||''; if(/^\s*(javascript|data|vbscript):/i.test(h)) ch.removeAttribute('href'); else { ch.setAttribute('target','_blank'); ch.setAttribute('rel','noopener noreferrer'); } }
        if(ch.hasAttribute('src')){ const s=ch.getAttribute('src')||''; if(/^\s*(javascript|vbscript):/i.test(s)) ch.remove(); }
        if(tag==='IFRAME'){ const s=ch.getAttribute('src')||''; if(!/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//i.test(s)){ ch.remove(); return; } ch.setAttribute('loading','lazy'); }
        walk(ch);
      });
    };
    walk(root);
    return root.innerHTML;
  }
  const looksLikeHTML = s => /<[a-z][\s\S]*>/i.test(String(s||''));
  /* render a post body: rich HTML (sanitized) for editor content, or markdown-ish for legacy plain text */
  const renderPostBody = body => looksLikeHTML(body) ? sanitizeHTML(body) : formatArticle(body);
  const postExcerpt = p => p.excerpt ? esc(p.excerpt) : esc(stripHTML(p.body).slice(0,150));
  const blogAvatar = (name,cls='bh-av') => `<span class="${cls}">${esc(initials(name||'م'))}</span>`;

  /* Blogger-style rich-text toolbar (shared markup; execCommand acts on the focused editor) */
  const _rsvg = p => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const RTE_TOOLBAR = `<div class="rte-toolbar">
    <button type="button" class="rte-btn" data-cmd="bold" title="عريض"><b>B</b></button>
    <button type="button" class="rte-btn" data-cmd="italic" title="مائل"><i>I</i></button>
    <button type="button" class="rte-btn" data-cmd="underline" title="تحته خط"><u>U</u></button>
    <button type="button" class="rte-btn" data-cmd="strikeThrough" title="يتوسّطه خط"><s>S</s></button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h2" title="عنوان رئيسي">H2</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h3" title="عنوان فرعي">H3</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="blockquote" title="اقتباس">${_rsvg('<path d="M7 7c-1.6 0-3 1.4-3 3v6h5v-5H6c0-1 .6-2 2-2Zm9 0c-1.6 0-3 1.4-3 3v6h5v-5h-3c0-1 .6-2 2-2Z"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="p" title="فقرة عادية">¶</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="قائمة نقطية">${_rsvg('<circle cx="4.5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="17" r="1.1" fill="currentColor" stroke="none"/><path d="M9 7h11M9 12h11M9 17h11"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="insertOrderedList" title="قائمة مرقّمة">${_rsvg('<path d="M9 7h11M9 12h11M9 17h11M3.5 5.5h1V9M3 9h2"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="justifyRight" title="محاذاة لليمين">${_rsvg('<path d="M4 6h16M9 12h11M6 18h14"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="justifyCenter" title="توسيط">${_rsvg('<path d="M4 6h16M7 12h10M6 18h12"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="justifyLeft" title="محاذاة لليسار">${_rsvg('<path d="M4 6h16M4 12h11M4 18h14"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="createLink" title="إدراج رابط">${_rsvg('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>')}</button>
    <button type="button" class="rte-btn" data-rteimg title="إدراج صورة">${_rsvg('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-9 9"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-codeblock title="كتلة كود برمجي">${_rsvg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>')}</button>
    <button type="button" class="rte-btn" data-codeinline title="كود ضمن السطر"><span style="font-family:ui-monospace,monospace;font-size:14px;font-weight:700">&lt;&#47;&gt;</span></button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="removeFormat" title="مسح التنسيق">${_rsvg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
  </div>`;

  /* ---------- blog viewer ---------- */
  async function showBlogViewer(id){
    $('#app').innerHTML = `<div class="loader"><div><div class="spin"></div>جارٍ تحميل المدونة…</div></div>`;
    try{
      const snap = await get(child(ref(db),'blogs/'+id));
      if(!snap.exists()){
        renderError({code:'404', tag:'مدونة غير موجودة · NOT FOUND', title:'هذه المدونة غير موجودة',
          msg:'الرابط غير صحيح أو تم حذف المدونة. تحقّق من الرابط أو أنشئ مدونتك الخاصة.'});
        return;
      }
      const d = snap.val();
      const go = ()=>{
        const pq=new URLSearchParams(location.search).get('post');
        const pi=(pq!=null && pq!=='')?parseInt(pq,10):NaN;
        if(!isNaN(pi) && pi>=0 && blogPosts(d)[pi]) renderArticle(id,d,pi);
        else renderBlogIndex(id,d);
      };
      if(isLocked(d)){ showPassGate('b', id, d, go); return; }
      go();
    }catch(e){
      console.error(e);
      renderError({code:'⚠', tag:'تعذّر التحميل · LOAD ERROR', title:'تعذّر تحميل المدونة',
        msg:'تحقّق من اتصالك بالإنترنت أو من قواعد قاعدة البيانات، ثم أعد المحاولة.', showReload:true});
    }
  }
  function blogShell(d){
    const dz = blogDesign(d.design);
    document.body.style.background = dz.bg;
    document.title = (d.title||'مدونة')+' — elgoharyX';
    setMeta('meta[name="description"]','content',(d.subtitle||d.about||'مدونة احترافية').slice(0,155));
    setMeta('meta[property="og:title"]','content',(d.title||'مدونة')+' | elgoharyX');
    setMeta('meta[property="og:image"]','content',d.cover||LOGO);
    return dz;
  }
  function blogTop(d,dz){
    const logo = d.logo
      ? `<img class="bt-logo" src="${esc(d.logo)}" alt="${esc(d.title)}" onerror="this.outerHTML='<span class=\\'bt-mono\\'>${esc(initials(d.title))}</span>'"/>`
      : `<span class="bt-mono">${esc(initials(d.title||'م'))}</span>`;
    const home = urlHome();
    return `<header class="blog-top">
      <div class="bt-brand">${logo}<div class="bt-tt">${esc(d.title||'مدونة')}${d.author?`<small>بقلم ${esc(d.author)}</small>`:''}</div></div>
      <a class="bt-cta" href="${home}">✦ أنشئ مدونتك</a>
    </header>`;
  }
  function blogHero(d,dz){
    const kick = d.author?`<span class="blog-kick">مدونة ${esc(d.author)}</span>`:`<span class="blog-kick">مدونة إلكترونية</span>`;
    const title = `<h1 class="bhero-title">${esc(d.title||'عنوان المدونة')}</h1>`;
    const sub = d.subtitle?`<p class="bhero-sub">${esc(d.subtitle)}</p>`:'';
    const meta = `<div class="bhero-meta"><span class="bh-au">${blogAvatar(d.author)}${esc(d.author||'الكاتب')}</span>
      <span class="dot"></span><span>${blogPosts(d).length} مقالة</span></div>`;
    if(dz.bh==='cover'){
      return `<section class="blog-hero">
        ${d.cover?`<img class="bhero-img" src="${esc(d.cover)}" alt="" onerror="this.remove()"/>`:''}
        <div class="bhero-scrim"></div>
        <div class="bhero-in">${kick}${title}${sub}${meta}</div></section>`;
    }
    if(dz.bh==='split'){
      return `<section class="blog-hero"><div class="bhero-in">
        <div>${kick}${title}${sub}${meta}</div>
        <div class="bsplit-card">${d.cover?`<img src="${esc(d.cover)}" alt="" onerror="this.remove()"/>`:''}</div>
      </div></section>`;
    }
    // band / center / mag share the inner block
    return `<section class="blog-hero"><div class="bhero-in">${kick}${title}${sub}${meta}</div></section>`;
  }
  function blogPostCard(p,i,cls='bpost-card'){
    const media = p.cover
      ? `<div class="bpost-media"><img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()"/></div>`
      : `<div class="bpost-media"><span class="ph">${esc(initials(p.title||'#'))}</span></div>`;
    const date = blogFmtDate(p.date);
    return `<article class="${cls}" data-post="${i}">
      ${media}
      <div class="bpost-b">
        ${p.tag?`<span class="bpost-tag">${esc(p.tag)}</span>`:''}
        <h3 class="bpost-title">${esc(p.title||'مقالة بدون عنوان')}</h3>
        <p class="bpost-ex">${postExcerpt(p)}</p>
        <div class="bpost-meta">${date?`<span>${date}</span><span class="dot"></span>`:''}<span>${blogReadTime(p.body)}</span></div>
      </div></article>`;
  }
  /* ---- optional blog elements: news ticker, search box, sidebar ---- */
  function blogTicker(d){
    const style=bTickerStyle(d); if(style==='none') return '';
    const posts=blogPosts(d); if(!posts.length) return '';
    const titles=posts.slice(0,8).map(p=>esc(p.title||'مقالة'));
    if(style==='marquee'){
      const items=titles.map(t=>`<span class="tk-item">${t}</span>`).join('<span class="tk-sep">◆</span>');
      return `<div class="blog-ticker tk-marquee"><span class="tk-label">آخر الأخبار</span>
        <div class="tk-scroll"><div class="tk-track">${items}<span class="tk-sep">◆</span>${items}</div></div></div>`;
    }
    if(style==='badge'){
      return `<div class="blog-ticker tk-badge"><span class="tk-flag">عاجل</span><span class="tk-one">${titles[0]}</span></div>`;
    }
    const items=titles.slice(0,5).map(t=>`<span class="tk-item"><i class="tk-dot pulse-dot"></i>${t}</span>`).join('');
    return `<div class="blog-ticker tk-dots"><span class="tk-label">آخر الأخبار</span><div class="tk-list">${items}</div></div>`;
  }
  function blogSearchBox(d){
    const style=bSearchStyle(d); if(style==='off') return '';
    return `<div class="blog-search bs-${style}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="search" class="blog-search-input" placeholder="ابحث في المقالات…" aria-label="بحث في المقالات"/></div>`;
  }
  function blogSidebar(d,posts){
    const style=bSidebarStyle(d); if(style==='none') return '';
    const recent=posts.slice(0,5).map((p,i)=>`<a class="sb-post" data-post="${posts.indexOf(p)}"><span class="sb-idx">${i+1}</span><span class="sb-pt">${esc(p.title||'مقالة')}</span></a>`).join('')
      || '<span class="sb-empty">لا مقالات بعد</span>';
    const tags=[...new Set(posts.map(p=>p.tag).filter(Boolean))].slice(0,12);
    const tagHtml=tags.length?`<div class="sb-block"><h4>التصنيفات</h4><div class="sb-tags">${tags.map(t=>`<span class="sb-tag">${esc(t)}</span>`).join('')}</div></div>`:'';
    const about=d.about?`<div class="sb-block"><h4>عن المدونة</h4><p class="sb-about">${esc(d.about)}</p></div>`:'';
    const author=`<div class="sb-block sb-author">${blogAvatar(d.author,'av')}<div><b>${esc(d.author||'الكاتب')}</b><span>${esc(d.authorEn||'')||'مدونة على elgoharyX'}</span></div></div>`;
    return `<aside class="blog-side sb-${style}">
      ${author}
      <div class="sb-block"><h4>أحدث المقالات</h4><div class="sb-posts">${recent}</div></div>
      ${tagHtml}${about}
    </aside>`;
  }
  function wireBlogTilt(root){
    root.querySelectorAll('.bpost-card, .blog-feat').forEach(card=>{
      card.addEventListener('mousemove',e=>{
        const r=card.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
        card.style.transform=`perspective(820px) rotateX(${(-py*6).toFixed(2)}deg) rotateY(${(px*8).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
    });
  }
  function wireBlogIndex(id,d){
    const root=$('#app');
    root.querySelectorAll('[data-post]').forEach(el=>el.onclick=()=>renderArticle(id,d,+el.dataset.post));
    const inp=root.querySelector('.blog-search-input');
    if(inp) inp.addEventListener('input',()=>{ const q=inp.value.trim().toLowerCase();
      root.querySelectorAll('.blog-grid .bpost-card, .blog-feat').forEach(card=>{
        const t=(card.textContent||'').toLowerCase(); card.style.display=(!q||t.includes(q))?'':'none'; });
    });
    if(d.threeD) wireBlogTilt(root);
  }
  /* ---------- blog rating system (⭐ 1–5, ranks blogs in Explore) ---------- */
  const RSTAR='<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.6 1.1-6L3.4 9.4l6-.8L12 3Z"/></svg>';
  const blogAvg   = b => { const c=+b.rCount||0; return c ? (+b.rSum||0)/c : 0; };
  /* ترتيب: متوسط بايزي بسيط يمنع تصدّر تقييم واحد بـ5 نجوم؛ غير المقيَّمة في الأسفل */
  const blogScore = b => { const c=+b.rCount||0, s=+b.rSum||0; return c ? (s + 3.5*2)/(c + 2) : 0; };
  function starRow(avg, extraCls){
    const r=Math.round(avg);
    let h='';
    for(let n=1;n<=5;n++) h+=`<span class="rs-star${n<=r?' on':''}">${RSTAR}</span>`;
    return `<span class="star-row ${extraCls||''}">${h}</span>`;
  }
  function renderRatingWidget(el, id, avg, count, mine){
    const disp = mine || avg;
    el.innerHTML = `<div class="br-in">
      <span class="br-label">قيّم هذه المدونة</span>
      <div class="br-stars" role="group" aria-label="تقييم من 5 نجوم">
        ${[1,2,3,4,5].map(n=>`<button type="button" class="br-star${n<=Math.round(disp)?' on':''}" data-star="${n}" aria-label="${n} من 5">${RSTAR}</button>`).join('')}
      </div>
      <div class="br-info">${count?`<b>${avg.toFixed(1)}</b><span>من 5 · ${count} تقييم</span>`:`<span>كن أول من يقيّمها</span>`}${mine?`<span class="br-mine">تقييمك ${mine}★</span>`:''}</div>
    </div>`;
    const stars=el.querySelectorAll('.br-star');
    const paint=n=>stars.forEach(s=>s.classList.toggle('on', +s.dataset.star<=n));
    stars.forEach(b=>{
      b.onmouseenter=()=>paint(+b.dataset.star);
      b.onclick=()=>rateBlog(id, +b.dataset.star);
    });
    el.querySelector('.br-stars').onmouseleave=()=>paint(Math.round(mine||avg));
  }
  async function loadBlogRating(id){
    const el=$('#blogRate'); if(!el) return;
    try{
      const s=await get(child(ref(db),'blogRatings/'+id));
      const votes=s.exists()?s.val():{}; let sum=0,count=0;
      for(const k in votes){ const v=+votes[k]; if(v>=1&&v<=5){ sum+=v; count++; } }
      const uid=getSession();
      renderRatingWidget(el, id, count?sum/count:0, count, (uid&&votes[uid])?+votes[uid]:0);
    }catch(e){ console.warn('rating load failed', e); el.style.display='none'; }
  }
  async function rateBlog(id, val){
    const uid=getSession();
    if(!uid){ toast('سجّل الدخول لتقييم المدونة'); return; }
    try{
      await set(ref(db,'blogRatings/'+id+'/'+uid), val);
      const s=await get(child(ref(db),'blogRatings/'+id));
      const votes=s.exists()?s.val():{}; let sum=0,count=0;
      for(const k in votes){ const v=+votes[k]; if(v>=1&&v<=5){ sum+=v; count++; } }
      const idx=await get(child(ref(db),'blogIndex/'+id));
      if(idx.exists()) await update(ref(db,'blogIndex/'+id), { rSum:sum, rCount:count });
      toast('شكراً لتقييمك ✓');
      const el=$('#blogRate'); if(el) renderRatingWidget(el, id, count?sum/count:0, count, val);
    }catch(e){ console.error(e); toast('تعذّر حفظ التقييم — تأكد من نشر قواعد قاعدة البيانات'); }
  }

  function renderBlogIndex(id,d){
    const dz = blogShell(d);
    const posts = blogPosts(d);
    const featured = posts[0];
    const rest = posts.slice(1);
    const feat = featured ? `<div class="blog-feat" data-post="0">
        <div class="bf-media">${featured.cover?`<img src="${esc(featured.cover)}" alt="" onerror="this.remove()"/>`:''}</div>
        <div class="bf-body">
          ${featured.tag?`<span class="bf-tag">${esc(featured.tag)}</span>`:'<span class="bf-tag">مقالة مميزة</span>'}
          <h2 class="bf-title">${esc(featured.title||'مقالة مميزة')}</h2>
          <p class="bf-ex">${featured.excerpt?esc(featured.excerpt):esc(stripHTML(featured.body).slice(0,220))}</p>
          <div class="bf-meta">${blogAvatar(d.author,'bh-av')}<span>${esc(d.author||'الكاتب')}</span><span class="dot"></span><span>${blogReadTime(featured.body)}</span></div>
        </div></div>` : '';
    const grid = rest.length
      ? `<div class="blog-sec-h"><h3>أحدث المقالات</h3><span class="rule"></span></div>
         <div class="blog-grid">${rest.map((p,i)=>blogPostCard(p,i+1)).join('')}</div>`
      : (featured?'':`<div class="blog-empty">لا توجد مقالات منشورة بعد في هذه المدونة.</div>`);
    const about = d.about ? `<div class="blog-sec-h" style="margin-top:44px"><h3>عن المدونة</h3><span class="rule"></span></div>
      <p class="bhero-sub" style="max-width:75ch">${esc(d.about)}</p>` : '';
    const foot = `<footer class="blog-foot"><div class="blog-foot-in">
        <div class="bf-au">${blogAvatar(d.author,'av')}<div><b>${esc(d.author||'الكاتب')}</b><span>${esc(d.authorEn||'')||'مدونة على elgoharyX'}</span></div></div>
        <div class="bf-copy">© 2026 <b>${esc(d.title||'')}</b> — بُنيت عبر <a href="${urlHome()}">elgoharyX</a></div>
      </div></footer>`;
    const hasSide = bSidebarStyle(d)!=='none';
    const adSlot = `<div class="elg-ad" data-ad="article"></div>`;
    const rateBar = `<div class="blog-rate" id="blogRate"></div>`;
    const main = `${blogSearchBox(d)}${feat}${rateBar}${adSlot}${grid}${about}`;
    const layout = hasSide
      ? `<div class="blog-layout"><div class="blog-main">${main}</div>${blogSidebar(d,posts)}</div>`
      : main;
    $('#app').innerHTML = `<div class="blog ${dz.id} bf-${dz.bf} bh-${dz.bh} ${bAnim(d)} ${bTilt(d)}">
      ${blogTop(d,dz)}${blogTicker(d)}${blogHero(d,dz)}
      <div class="blog-wrap">${layout}</div>
      ${foot}</div>`;
    wireBlogIndex(id,d);
    if(d.ownerUid) getPremium(d.ownerUid).then(pp=>{ if(premiumActive(pp)){ const b=$('#app .blog'); if(b) b.classList.add('owner-premium'); } });
    if(window.elgFillAds) window.elgFillAds($('#app'));
    loadBlogRating(id);
    try{ history.replaceState(null,'', pageUrl('blog.html','blog='+id)); }catch(e){}
    window.scrollTo(0,0);
  }
  /* ---------- article engagement: views, likes (heart), permalink share ---------- */
  const ART_HEART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.3 6 5.3c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.5 0 5 3.7 3.5 6.7C19 16.5 12 21 12 21Z"/></svg>';
  const ART_SHARE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></svg>';
  const ART_EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const fmtNum = n => { n=+n||0; return n>=1000 ? (n/1000).toFixed(n>=10000?0:1)+'K' : String(n); };
  function setLikeBtn(btn, count, mine){ if(!btn) return; btn.dataset.lc=count; btn.classList.toggle('on',!!mine);
    const c=btn.querySelector('.al-count'); if(c) c.textContent=fmtNum(count); }
  async function loadArticleEngagement(id, idx){
    // count one view per browser session per article
    try{ const vk='av_'+id+'_'+idx;
      if(!sessionStorage.getItem(vk)){ sessionStorage.setItem(vk,'1');
        update(ref(db,'articleStats/'+id+'/'+idx), { views: increment(1) }).catch(()=>{}); }
    }catch(e){}
    try{
      const s=await get(child(ref(db),'articleStats/'+id+'/'+idx));
      const st=s.exists()?s.val():{};
      const views=+st.views||0, likes=st.likes||{}; let lc=0; for(const k in likes) if(likes[k]) lc++;
      const uid=getSession();
      const vEl=$('#artViews'); if(vEl) vEl.innerHTML=ART_EYE+' '+fmtNum(views)+' مشاهدة';
      setLikeBtn($('#artLike'), lc, uid && likes[uid]);
    }catch(e){ console.warn('engagement load failed', e); const vEl=$('#artViews'); if(vEl) vEl.style.display='none'; }
  }
  async function toggleArtLike(id, idx){
    const uid=getSession();
    if(!uid){ toast('سجّل الدخول للإعجاب بالمقال'); return; }
    const btn=$('#artLike'); if(!btn) return;
    const willLike=!btn.classList.contains('on');
    setLikeBtn(btn, (+btn.dataset.lc||0)+(willLike?1:-1), willLike);
    try{ const r=ref(db,'articleStats/'+id+'/'+idx+'/likes/'+uid);
      if(willLike) await set(r,true); else await remove(r);
    }catch(e){ console.error(e); toast('تعذّر — تأكد من نشر قواعد قاعدة البيانات'); loadArticleEngagement(id,idx); }
  }
  function shareArticle(id, idx){
    const url=pageUrl('blog.html','blog='+id+'&post='+idx);
    if(navigator.share){ navigator.share({title:document.title, url}).catch(()=>{}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(url).then(()=>toast('تم نسخ رابط المقال ✓')); }
    else toast(url);
  }

  /* ---------- article comments ---------- */
  const cmtDate = at => { try{ return new Date(at).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return ''; } };
  function commentHTML(c, cid, canDel){
    return `<div class="ac-item" data-cid="${cid}">
      <span class="ac-av">${esc(initials(c.name||'؟'))}</span>
      <div class="ac-main">
        <div class="ac-top"><b>${esc(c.name||'مستخدم')}</b><span class="ac-date">${cmtDate(c.at)}</span>
          ${canDel?`<button class="ac-del" data-del="${cid}" type="button">حذف</button>`:''}</div>
        <div class="ac-tx">${esc(c.text||'')}</div>
      </div></div>`;
  }
  async function loadComments(id, idx, d){
    const listEl=$('#acList'), cntEl=$('#acCount'); if(!listEl) return;
    try{
      const s=await get(child(ref(db),'articleComments/'+id+'/'+idx));
      const obj=s.exists()?s.val():{};
      const arr=Object.entries(obj).map(([cid,c])=>({cid,...(c||{})})).filter(c=>c && c.text);
      arr.sort((a,b)=>(b.at||0)-(a.at||0));
      const uid=getSession();
      if(cntEl) cntEl.textContent = arr.length?('('+arr.length+')'):'';
      listEl.innerHTML = arr.length
        ? arr.map(c=>commentHTML(c, c.cid, !!(uid && (c.uid===uid || uid===(d&&d.ownerUid))))).join('')
        : `<div class="ac-empty">لا توجد تعليقات بعد — كن أول من يعلّق.</div>`;
      listEl.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteComment(id,idx,b.dataset.del,d));
    }catch(e){ console.warn('comments load failed', e); listEl.innerHTML=`<div class="ac-empty">تعذّر تحميل التعليقات — تأكد من نشر قواعد قاعدة البيانات.</div>`; }
  }
  async function postComment(id, idx, d){
    const uid=getSession();
    if(!uid){ toast('سجّل الدخول للتعليق'); return; }
    const ta=$('#acText'); if(!ta) return;
    const text=(ta.value||'').trim();
    if(text.length<1){ toast('اكتب تعليقًا أولاً'); return; }
    if(text.length>1500){ toast('التعليق طويل جدًا (1500 حرف كحد أقصى)'); return; }
    const btn=$('#acPost'); if(btn){ btn.disabled=true; btn.textContent='جارٍ الإرسال…'; }
    try{
      const name=((currentUser&&currentUser.username)||'مستخدم').slice(0,60);
      await set(ref(db,'articleComments/'+id+'/'+idx+'/'+shortId(14)), { uid, name, text, at:Date.now() });
      ta.value=''; toast('تم إضافة تعليقك ✓'); loadComments(id,idx,d);
    }catch(e){ console.error(e); toast('تعذّر إضافة التعليق — تأكد من نشر قواعد قاعدة البيانات'); }
    finally{ if(btn){ btn.disabled=false; btn.textContent='أضف تعليق'; } }
  }
  async function deleteComment(id, idx, cid, d){
    if(!confirm('حذف هذا التعليق؟')) return;
    try{ await remove(ref(db,'articleComments/'+id+'/'+idx+'/'+cid)); toast('تم حذف التعليق'); loadComments(id,idx,d); }
    catch(e){ console.error(e); toast('تعذّر الحذف — تأكد من نشر القواعد'); }
  }

  function renderArticle(id,d,idx){
    const dz = blogShell(d);
    const posts = blogPosts(d);
    const p = posts[idx]; if(!p){ renderBlogIndex(id,d); return; }
    document.title = (p.title||'مقالة')+' — '+(d.title||'مدونة');
    const others = posts.map((x,i)=>({x,i})).filter(o=>o.i!==idx).slice(0,3);
    const more = others.length ? `<div class="art-more"><div class="blog-sec-h"><h3>مقالات أخرى</h3><span class="rule"></span></div>
      <div class="blog-grid">${others.map(o=>blogPostCard(o.x,o.i)).join('')}</div></div>` : '';
    $('#app').innerHTML = `<div class="blog ${dz.id} bf-${dz.bf} bh-${dz.bh}">
      ${blogTop(d,dz)}
      <div class="article-view">
        <button class="art-back">→ العودة إلى المدونة</button>
        ${p.tag?`<span class="art-tag">${esc(p.tag)}</span>`:''}
        <h1 class="art-title">${esc(p.title||'مقالة')}</h1>
        <div class="art-meta">${blogAvatar(d.author,'bh-av')}<span>${esc(d.author||'الكاتب')}</span>
          ${blogFmtDate(p.date)?`<span class="dot"></span><span>${blogFmtDate(p.date)}</span>`:''}
          <span class="dot"></span><span>${blogReadTime(p.body)}</span>
          <span class="dot"></span><span class="art-views" id="artViews">${ART_EYE} …</span></div>
        ${p.cover?`<div class="art-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)}" onerror="this.closest('.art-cover').remove()"/></div>`:''}
        <div class="art-body dropcap">${renderPostBody(p.body)||'<p>لا يوجد محتوى.</p>'}</div>
        <div class="art-actions">
          <button class="art-like" id="artLike" type="button" aria-label="إعجاب">${ART_HEART}<span class="al-count">0</span></button>
          <button class="art-share" id="artShare" type="button">${ART_SHARE}<span>مشاركة</span></button>
        </div>
        <section class="art-comments">
          <h3 class="ac-h">التعليقات <span id="acCount"></span></h3>
          ${currentUser
            ? `<div class="ac-form"><textarea id="acText" rows="3" maxlength="1500" placeholder="اكتب تعليقك…"></textarea>
                <button class="btn primary" id="acPost" type="button">أضف تعليق</button></div>`
            : `<div class="ac-login">سجّل الدخول لإضافة تعليق. <a href="${urlLogin()}">تسجيل الدخول</a></div>`}
          <div class="ac-list" id="acList"><div class="ac-empty">جارٍ تحميل التعليقات…</div></div>
        </section>
        <div class="elg-ad" data-ad="article"></div>
        ${more}
      </div></div>`;
    $('#app').querySelector('.art-back').onclick=()=>renderBlogIndex(id,d);
    $('#app').querySelectorAll('[data-post]').forEach(el=>el.onclick=()=>renderArticle(id,d,+el.dataset.post));
    $('#artLike').onclick=()=>toggleArtLike(id,idx);
    $('#artShare').onclick=()=>shareArticle(id,idx);
    if($('#acPost')) $('#acPost').onclick=()=>postComment(id,idx,d);
    if(window.elgFillAds) window.elgFillAds($('#app'));
    try{ history.replaceState(null,'', pageUrl('blog.html','blog='+id+'&post='+idx)); }catch(e){}
    loadArticleEngagement(id,idx);
    loadComments(id,idx,d);
    window.scrollTo(0,0);
  }

  /* ---------- blog admin (single blog per account) ----------
     Each account owns exactly one blog. This page manages it: view/share/edit the
     blog, and manage every post — edit, publish/unpublish, delete, or add a new one. */
  function blogAdminView(id,d){
    const dz=blogDesign(d.design);
    const base=location.href.split('#')[0].split('?')[0];
    const posts=Array.isArray(d.posts)?d.posts.filter(Boolean):[];
    const grad=`linear-gradient(135deg,${dz.accent},${dz.accent2})`;
    const logo = d.logo
      ? `<span class="badm-logo" style="background:${grad}"><img src="${esc(d.logo)}" alt="" onerror="this.remove()"/></span>`
      : `<span class="badm-logo" style="background:${grad}">${esc(initials(d.title||'م'))}</span>`;
    const rows = posts.length ? posts.map((p,i)=>{
      const pub = p.published!==false;
      const th = p.cover
        ? `<img class="bp-th" src="${esc(p.cover)}" alt="" onerror="this.outerHTML='<span class=&quot;bp-th&quot;>${esc(initials(p.title||'#'))}</span>'"/>`
        : `<span class="bp-th">${esc(initials(p.title||'#'))}</span>`;
      return `<div class="badm-post" data-pi="${i}">
        ${th}
        <div class="bp-main">
          <div class="bp-title">${esc(p.title||'مقالة بدون عنوان')}</div>
          <div class="bp-meta">
            <span class="bp-stat ${pub?'on':'off'}">${pub?'منشورة':'غير منشورة'}</span>
            ${p.tag?`<span>${esc(p.tag)}</span>`:''}
            <span>${blogReadTime(p.body)}</span>
          </div>
        </div>
        <div class="bp-acts">
          <button data-pedit="${i}">${IC2.pen} تعديل</button>
          <button data-ppub="${i}">${pub?'إلغاء النشر':'نشر'}</button>
          <button class="danger" data-pdel="${i}">حذف</button>
        </div>
      </div>`;
    }).join('') : `<div class="mp-empty">لا توجد مقالات بعد — اضغط «مقال جديد» لإضافة أول تدوينة.</div>`;
    return `<div class="wrap">
      <div class="badm-hero">
        ${logo}
        <div class="badm-id"><h2>${esc(d.title||'مدونتي')}</h2>
          <div class="sub">${posts.length} تدوينة · تصميم ${esc(dz.name)}</div></div>
        <div class="badm-acts">
          <a href="${urlBlogView(id)}" target="_blank">${IC2.eye} عرض المدونة</a>
          <button id="baLink">${IC2.link} نسخ الرابط</button>
          <button id="baEdit">${IC2.pen} تعديل بيانات المدونة</button>
        </div>
      </div>
      <div class="badm-bar"><h3>إدارة التدوينات</h3>
        <button class="btn primary" id="baNew" style="width:auto;padding:10px 18px">${TAB.plus} مقال جديد</button></div>
      <div class="badm-posts" id="baPosts">${rows}</div>
    </div>`;
  }

  async function showBlogAdmin(){
    if(!currentUser){ showAuth('login'); return; }
    document.title='إدارة مدونتي — elgoharyX';
    document.body.style.background='';
    const drawEmpty=()=>{
      $('#app').innerHTML = appbar('blogs') + `<div class="wrap">
        <div class="mp-head"><div><h2>مدونتي</h2><div class="sub">لكل حساب مدونة واحدة. أنشئ مدونتك وابدأ النشر.</div></div></div>
        <div class="mp-empty">لا توجد مدونة بعد.<br><br>
          <button class="btn primary" id="baCreate" style="width:auto;padding:12px 22px">أنشئ مدونتك</button></div>
      </div>` + drawer('blogs');
      wireAppbar(); $('#baCreate').onclick=newBlog;
    };
    $('#app').innerHTML = appbar('blogs') + `<div class="wrap">${skelGrid(4)}</div>` + drawer('blogs');
    wireAppbar();
    try{
      const s=await get(child(ref(db),'userBlogs/'+currentUser.uid));
      const entries = s.exists()? Object.entries(s.val()) : [];
      if(!entries.length){ drawEmpty(); return; }
      entries.sort((a,b)=>((b[1]&&b[1].updatedAt)||0)-((a[1]&&a[1].updatedAt)||0));
      const id=entries[0][0];
      const bs=await get(child(ref(db),'blogs/'+id));
      if(!bs.exists()){ await remove(ref(db,'userBlogs/'+currentUser.uid+'/'+id)); drawEmpty(); return; }
      const d=bs.val();
      d.posts = Array.isArray(d.posts)?d.posts.filter(Boolean):[];
      const base=location.href.split('#')[0].split('?')[0];
      const persist=async()=>{
        d.updatedAt=Date.now();
        const pub=d.posts.filter(p=>p.published!==false).length;
        await set(ref(db,'blogs/'+id), d);
        await set(ref(db,'userBlogs/'+currentUser.uid+'/'+id), {title:d.title||'مدونة', design:d.design, updatedAt:d.updatedAt});
        await set(ref(db,'blogIndex/'+id), {title:d.title||'مدونة', subtitle:d.subtitle||'', author:d.author||'',
          cover:d.cover||'', design:d.design, count:pub, updatedAt:d.updatedAt});
      };
      const wire=()=>{
        $('#baLink')&&($('#baLink').onclick=()=>{navigator.clipboard?.writeText(urlBlogView(id));toast('تم نسخ رابط المدونة ✓');});
        $('#baEdit')&&($('#baEdit').onclick=()=>startBlogEdit(id));
        $('#baNew')&&($('#baNew').onclick=()=>startBlogEdit(id,'new'));
        document.querySelectorAll('[data-pedit]').forEach(b=>b.onclick=()=>startBlogEdit(id,+b.dataset.pedit));
        document.querySelectorAll('[data-ppub]').forEach(b=>b.onclick=async()=>{
          const i=+b.dataset.ppub; if(!d.posts[i]) return;
          d.posts[i].published = (d.posts[i].published===false);
          b.disabled=true;
          try{ await persist(); toast(d.posts[i].published?'تم النشر ✓':'تم إلغاء النشر'); }
          catch(e){ console.error(e); toast('تعذّر الحفظ'); }
          paint();
        });
        document.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=async()=>{
          if(!confirm('حذف هذه التدوينة نهائياً؟')) return;
          const i=+b.dataset.pdel; d.posts.splice(i,1);
          try{ await persist(); toast('تم حذف التدوينة'); }
          catch(e){ console.error(e); toast('تعذّر الحذف'); }
          paint();
        });
      };
      function paint(){ $('#app').innerHTML = appbar('blogs') + blogAdminView(id,d) + drawer('blogs'); wireAppbar(); wire(); }
      paint();
    }catch(e){
      console.error(e);
      $('#app').innerHTML = appbar('blogs') + `<div class="wrap"><div class="mp-empty">تعذّر تحميل المدونة. تحقّق من قواعد قاعدة البيانات.</div></div>` + drawer('blogs');
      wireAppbar();
    }
  }

  /* ---------- blog builder state ---------- */
  const BLOG_EMPTY = { title:'', subtitle:'', author:'', authorEn:'', about:'', cover:'', logo:'', design:'bd1',
    threeD:false, anim:'none', searchStyle:'off', sidebarStyle:'none', tickerStyle:'none', posts:[] };
  const BLOG_SAMPLE = {
    title:'مدوّنة الفكر والمعرفة', subtitle:'مقالات في العلم والثقافة والتطوير الذاتي — تُنشر بعناية لتثري عقلك.',
    author:'أ. محمد الجوهري', authorEn:'Mohamed Elgohary', about:'مساحة معرفية أنشرها لمشاركة أفكاري وقراءاتي وتجاربي مع كل باحث عن المعرفة.',
    cover:'', logo:'', design:'bd1',
    threeD:true, anim:'rise', searchStyle:'pill', sidebarStyle:'cards', tickerStyle:'marquee',
    posts:[
      {id:'p1',title:'كيف تبني عادة القراءة اليومية',tag:'تطوير ذاتي',date:Date.now(),cover:'',published:true,excerpt:'خطوات عملية مبنية على علم النفس السلوكي لتحويل القراءة إلى عادة راسخة تلازمك مدى الحياة.',body:'## البداية الصغيرة\nابدأ بصفحة واحدة يومياً. الهدف ليس الكمية بل الاستمرارية.\n\n## اربطها بعادة قائمة\nاقرأ بعد قهوة الصباح مباشرة؛ العادة القديمة تصبح تذكيراً للعادة الجديدة.\n\n> من قرأ صفحة كل يوم قرأ مكتبة في عمره.\n\n## تتبّع تقدّمك\nسجّل ما تقرأه، فالتقدّم المرئي يغذّي الحافز.'},
      {id:'p2',title:'الذكاء الاصطناعي ومستقبل التعليم',tag:'تقنية',date:Date.now(),cover:'',published:true,excerpt:'كيف تُعيد نماذج الذكاء الاصطناعي تشكيل طريقة تعلّمنا، وما الفرص والمخاطر التي تحملها؟',body:'## تعليم مخصّص للجميع\nيتيح الذكاء الاصطناعي مساراً تعليمياً يناسب كل طالب على حدة.\n\n## دور المعلّم يتغيّر\nلا يختفي المعلّم، بل يتحوّل إلى موجّه وملهم.\n\n## تحديات يجب الانتباه لها\nالخصوصية والاعتماد المفرط والفجوة الرقمية قضايا تحتاج معالجة.'},
      {id:'p3',title:'فن إدارة الوقت للمنشغلين',tag:'إنتاجية',date:Date.now(),cover:'',published:true,excerpt:'أنظمة بسيطة وفعّالة لإدارة وقتك دون الشعور بالإرهاق أو الذنب.',body:'## قاعدة الدقيقتين\nإن كانت المهمة تستغرق أقل من دقيقتين، أنجزها فوراً.\n\n## خطّط مساءً\nحدّد أهم ثلاث مهام للغد قبل النوم.\n\n## احمِ وقتك العميق\nخصّص ساعات للتركيز بلا مقاطعات.'},
    ]
  };
  let blogState = {...BLOG_EMPTY};
  let blogEditingId = null;
  let blogEditMeta  = null;
  // controls where the builder lands when opened from the admin page:
  // 'new' → jump to the Articles pane with a fresh post; a number → focus that post.
  let blogBuilderFocus = null;

  /* each account has exactly one blog. Starting a "new" blog when one already
     exists just opens the admin page for the existing blog. */
  async function newBlog(){
    if(!currentUser){ showAuth('login'); return; }
    try{
      const s=await get(child(ref(db),'userBlogs/'+currentUser.uid));
      if(s.exists() && Object.keys(s.val()).length){
        toast('لديك مدونة واحدة بالفعل — يمكنك إدارتها وتعديلها');
        showBlogAdmin(); return;
      }
    }catch(e){ console.error(e); }
    blogEditingId=null; blogEditMeta=null; blogBuilderFocus=null;
    blogState=JSON.parse(JSON.stringify(BLOG_SAMPLE)); showBlogBuilder(); window.scrollTo(0,0);
  }
  async function startBlogEdit(id, focus=null){
    if(!currentUser){ location.href=urlBlogEdit(id); return; }
    document.body.style.background='';
    $('#app').innerHTML=`<div class="loader"><div><div class="spin"></div>جارٍ فتح المدونة للتعديل…</div></div>`;
    try{
      const s=await get(child(ref(db),'blogs/'+id));
      if(!s.exists()){ toast('المدونة غير موجودة'); showBlogAdmin(); return; }
      const d=s.val();
      blogState={...BLOG_EMPTY};
      ['title','subtitle','author','authorEn','about','cover','logo','design','threeD','anim','searchStyle','sidebarStyle','tickerStyle'].forEach(k=>{ if(d[k]!=null) blogState[k]=d[k]; });
      blogState.posts = Array.isArray(d.posts)?d.posts.filter(Boolean).map(p=>({...p})):[];
      if(!BLOG_BY_ID[blogState.design]) blogState.design='bd1';
      blogEditingId=id;
      blogEditMeta={ownerUid:d.ownerUid||currentUser.uid, ownerName:d.ownerName||currentUser.username, createdAt:d.createdAt||Date.now()};
      blogBuilderFocus=focus;
      showBlogBuilder(); window.scrollTo(0,0);
    }catch(e){ console.error(e); toast('تعذّر الفتح'); showBlogAdmin(); }
  }

  /* ---------- blog builder ---------- */
  function showBlogBuilder(){
    if(!currentUser){ showAuth('login'); return; }
    const editing = blogEditingId!==null;
    document.title = editing ? 'تعديل المدونة' : 'أنشئ مدونتك';
    document.body.style.background='';
    const s=blogState;
    const eyeSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    $('#app').innerHTML = appbar('build') + `
    <div class="wrap"><div class="builder">
      <section class="panel">
        <h2>${editing?'تعديل المدونة':'أنشئ مدونتك'}</h2>
        <div class="sub">${editing?'عدّل بيانات المدونة والمقالات ثم احفظ التغييرات.':'اختر تصميماً، أضف مقالاتك، ثم انشرها برابط دائم ومختصر.'}</div>

        <div class="bpane pane-on" data-pane="data">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.person} بيانات المدونة</span></summary>
          <div class="acc-body">
            ${fld('b-title','عنوان المدونة',s.title)}
            ${fld('b-subtitle','وصف مختصر (تحت العنوان)',s.subtitle,'textarea')}
            <div class="grid2">${fld('b-author','اسم الكاتب',s.author)}${fld('b-authorEn','Author (EN)',s.authorEn)}</div>
            ${fld('b-about','عن المدونة',s.about,'textarea')}
            <div class="field">
              <label>صورة الغلاف (رابط أو رفع)</label>
              <div class="upload-row">
                <input id="f-b-cover" value="${esc(s.cover)}" placeholder="https://… صورة غلاف المدونة"/>
                <button type="button" class="btn ghost" id="bCoverUp">${IC2.up} رفع</button>
              </div>
              <input type="file" id="bCoverFile" accept="image/*" hidden/>
              <div class="up-note" id="bCoverNote">تظهر في الواجهة الرئيسية للمدونة (خاصة في تصاميم الغلاف الكبير).</div>
            </div>
            <div class="field">
              <label>شعار المدونة (اختياري)</label>
              <div class="upload-row">
                <input id="f-b-logo" value="${esc(s.logo)}" placeholder="https://… شعار صغير أعلى المدونة"/>
                <button type="button" class="btn ghost" id="bLogoUp">${IC2.up} رفع</button>
              </div>
              <input type="file" id="bLogoFile" accept="image/*" hidden/>
            </div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="design">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.palette} تصميم المدونة <span style="color:var(--muted-2);font-weight:400">(${BLOG_DESIGNS.length})</span></span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('أول '+FREE_BLOG_DESIGNS+' تصميماً مجانية — والباقي (حتى 150) للمشتركين المميزين.')}
            <input id="bdSearch" class="lay-search" placeholder="ابحث عن تصميم…"/>
            <div class="bd-picker" id="bdPicker">
              ${BLOG_DESIGNS.map(d=>{ const lk=blogDesignLocked(d.id); return `<div class="bd-swatch ${d.id===s.design?'active':''} ${lk?'locked':''}" data-bd="${d.id}" data-name="${esc(d.name)}" ${lk?'data-locked="1"':''}>
                <div class="sw" style="background:linear-gradient(135deg,${d.accent},${d.accent2})">${lk?'<span class="sw-lock">'+LOCKICON+'</span>':''}</div><div class="nm">${esc(d.name)}</div></div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.cube} مؤثرات وعناصر المدونة ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' مميز</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote('المؤثرات المتقدمة (3D، أنيميشن، مربع البحث، القائمة الجانبية، شريط الأخبار) متاحة للمشتركين فقط.')}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="opt-row">
              <div><div class="lbl">مؤثر ثلاثي الأبعاد (3D)</div><div class="desc">تميل بطاقات المقالات مع حركة المؤشر</div></div>
              <label class="switch"><input type="checkbox" id="f-b-threeD" ${s.threeD?'checked':''}><span class="slider"></span></label>
            </div>
            <div class="opt-row">
              <div><div class="lbl">حركة الظهور (أنيميشن)</div><div class="desc">تظهر بها المقالات عند فتح المدونة</div></div>
              <select id="f-b-anim" class="mini-select">${BLOG_ANIMS.map(a=>`<option value="${a.id}" ${a.id===(s.anim||'none')?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">شكل مربع البحث</div><div class="desc">مربع بحث داخل المقالات</div></div>
              <select id="f-b-searchStyle" class="mini-select">${BLOG_SEARCH.map(a=>`<option value="${a.id}" ${a.id===bSearchStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">تصميم القائمة الجانبية</div><div class="desc">أحدث المقالات والتصنيفات وعن المدونة</div></div>
              <select id="f-b-sidebarStyle" class="mini-select">${BLOG_SIDEBAR.map(a=>`<option value="${a.id}" ${a.id===bSidebarStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">شريط آخر الأخبار</div><div class="desc">شريط بأحدث عناوين مقالاتك أعلى المدونة</div></div>
              <select id="f-b-tickerStyle" class="mini-select">${BLOG_TICKER.map(a=>`<option value="${a.id}" ${a.id===bTickerStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            </div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="articles">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.chat} المقالات <span style="color:var(--muted-2);font-weight:400" id="postsCount">(${s.posts.length})</span></span></summary>
          <div class="acc-body">
            <div id="postsList"></div>
            <button type="button" class="btn ghost" id="addPost" style="width:100%">${TAB.plus} إضافة مقالة</button>
          </div>
        </details>
        </div>

        <button class="btn primary" id="bGen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
          ${editing?'حفظ التغييرات':'نشر المدونة وإنشاء الرابط'}
        </button>
      </section>

      <section class="preview-col" data-pane="preview">
        <div class="preview-head"><span class="t">معاينة المدونة</span><span class="live">مباشر</span></div>
        <div class="panel" style="padding:0;overflow:hidden"><div id="blogPrev" style="max-height:78vh;overflow:auto;border-radius:12px"></div></div>
      </section>

      <nav class="build-nav">
        <button class="bnav on" data-pane="data">${UICON.person}<span>البيانات</span></button>
        <button class="bnav" data-pane="design">${UICON.palette}<span>التصميم</span></button>
        <button class="bnav" data-pane="articles">${UICON.chat}<span>المقالات</span></button>
        <button class="bnav" data-pane="preview">${eyeSvg}<span>المعاينة</span></button>
      </nav>
    </div></div>

    <div class="overlay" id="bov">
      <div class="modal">
        <button class="close" id="bovClose">✕</button>
        <div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="26" height="26"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h3 id="bovTitle">تم النشر</h3>
        <p id="bovDesc">هذا هو رابط مدونتك الدائم — شاركه مع من تريد.</p>
        <div class="linkbox"><input id="bOutLink" readonly/><button class="btn gold" id="bCopyLink" style="padding:9px 16px">نسخ</button></div>
        <div id="bShortNote" style="text-align:center;font-size:12px;color:var(--muted-2);margin:-8px 0 16px;min-height:16px"></div>
        <div class="modal-actions">
          <a class="btn primary" id="bOpenLink" target="_blank">فتح المدونة</a>
          <button class="btn ghost" id="bToMine">إدارة المدونة</button>
        </div>
      </div>
    </div>` + drawer('build');

    wireAppbar();

    const repaint=()=>{
      const el=$('#blogPrev'); if(!el) return;
      const d=blogState, dz=blogDesign(d.design), posts=blogPosts(d);
      const hasSide=bSidebarStyle(d)!=='none';
      const main=`${blogSearchBox(d)}${previewBody(d)}`;
      const layout=hasSide?`<div class="blog-layout"><div class="blog-main">${main}</div>${blogSidebar(d,posts)}</div>`:main;
      el.innerHTML=`<div class="blog ${dz.id} bf-${dz.bf} bh-${dz.bh} ${bAnim(d)} ${bTilt(d)}" style="min-height:auto">${blogTop(d,dz)}${blogTicker(d)}${blogHero(d,dz)}<div class="blog-wrap">${layout}</div></div>`;
      if(d.threeD) wireBlogTilt(el);
    };
    function previewBody(d){
      const posts=blogPosts(d); if(!posts.length) return `<div class="blog-empty">أضف مقالات لتظهر هنا.</div>`;
      const feat=posts[0], rest=posts.slice(1);
      const f=`<div class="blog-feat"><div class="bf-media">${feat.cover?`<img src="${esc(feat.cover)}" alt="" onerror="this.remove()"/>`:''}</div>
        <div class="bf-body"><span class="bf-tag">${esc(feat.tag||'مميزة')}</span><h2 class="bf-title">${esc(feat.title||'مقالة')}</h2>
        <p class="bf-ex">${feat.excerpt?esc(feat.excerpt):esc(stripHTML(feat.body).slice(0,180))}</p></div></div>`;
      const g=rest.length?`<div class="blog-sec-h"><h3>أحدث المقالات</h3><span class="rule"></span></div><div class="blog-grid">${rest.map((p,i)=>blogPostCard(p,i+1)).join('')}</div>`:'';
      return f+g;
    }

    // text/meta inputs
    [['title'],['subtitle'],['author'],['authorEn'],['about'],['cover'],['logo']].forEach(([k])=>{
      const el=$('#f-b-'+k); if(!el) return;
      el.addEventListener('input',()=>{ blogState[k]=el.value; repaint(); });
    });

    // design picker (locked designs need a subscription)
    $('#bdPicker').querySelectorAll('.bd-swatch').forEach(sw=>sw.onclick=()=>{
      if(sw.dataset.locked && !isPremium()){ toast('هذا التصميم للمشتركين المميزين ✦'); return; }
      blogState.design=sw.dataset.bd;
      $('#bdPicker').querySelectorAll('.bd-swatch').forEach(x=>x.classList.toggle('active',x===sw));
      repaint();
    });
    const bs=$('#bdSearch'); if(bs) bs.oninput=()=>{ const q=bs.value.trim();
      $('#bdPicker').querySelectorAll('.bd-swatch').forEach(el=>{ el.style.display=el.dataset.name.includes(q)?'':'none'; }); };

    // 3D / animation / search / sidebar / ticker options
    const chkThree=$('#f-b-threeD'); if(chkThree) chkThree.onchange=()=>{ blogState.threeD=chkThree.checked; repaint(); };
    [['anim'],['searchStyle'],['sidebarStyle'],['tickerStyle']].forEach(([k])=>{
      const el=$('#f-b-'+k); if(el) el.onchange=()=>{ blogState[k]=el.value; repaint(); };
    });

    // cover / logo upload
    const wireUp=(btnId,fileId,noteId,key)=>{
      const btn=$('#'+btnId), file=$('#'+fileId), note=noteId?$('#'+noteId):null;
      if(!btn) return;
      btn.onclick=()=>file.click();
      file.onchange=async()=>{
        const f=file.files&&file.files[0]; if(!f) return;
        if(!/^image\//.test(f.type)){ if(note){note.className='up-note';note.textContent='الملف ليس صورة';} return; }
        const old=btn.innerHTML; btn.disabled=true; btn.textContent='جارٍ الرفع…';
        try{ const url=await uploadToImgbb(f); blogState[key]=url; $('#f-b-'+key).value=url; repaint();
          if(note){note.className='up-note ok';note.textContent='✓ تم الرفع';} }
        catch(e){ console.error(e); if(note){note.className='up-note';note.textContent='تعذّر الرفع';} }
        finally{ btn.disabled=false; btn.innerHTML=old; file.value=''; }
      };
    };
    wireUp('bCoverUp','bCoverFile','bCoverNote','cover');
    wireUp('bLogoUp','bLogoFile',null,'logo');

    // posts editor
    function renderPosts(){
      const wrap=$('#postsList'); if(!wrap) return;
      $('#postsCount').textContent='('+blogState.posts.length+')';
      if(!blogState.posts.length){ wrap.innerHTML=`<div class="posts-empty">لا توجد مقالات بعد — اضغط «إضافة مقالة».</div>`; return; }
      const trashIco='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>';
      const chevIco='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
      wrap.innerHTML=blogState.posts.map((p,i)=>{
        const pub=p.published!==false;
        return `<div class="post-item" data-pi="${i}">
          <div class="pi-head" data-ptoggle="${i}">
            <span class="pi-num">${i+1}</span>
            <span class="pi-name">${esc(p.title)||'مقالة بدون عنوان'}</span>
            <span class="pi-stat ${pub?'on':'off'}">${pub?'منشورة':'مسودة'}</span>
            <button type="button" class="pi-del" data-pdel="${i}" title="حذف المقالة">${trashIco}</button>
            <span class="pi-chev">${chevIco}</span>
          </div>
          <div class="pi-body">
            <div class="field"><label>عنوان المقالة</label><input data-pf="title" value="${esc(p.title)}" placeholder="عنوان المقالة"/></div>
            <div class="grid2">
              <div class="field" style="margin:0"><label>التصنيف</label><input data-pf="tag" value="${esc(p.tag||'')}" placeholder="مثال: تقنية"/></div>
              <div class="field" style="margin:0"><label>التاريخ (اختياري)</label><input data-pf="date" value="${esc(typeof p.date==='number'?'':(p.date||''))}" placeholder="اختياري"/></div>
            </div>
            <div class="field"><label>صورة المقالة (اختياري)</label>
              <div class="up-row2"><input data-pf="cover" value="${esc(p.cover||'')}" placeholder="رابط الصورة" style="flex:1"/>
              <button type="button" class="btn ghost" data-pup="${i}" style="padding:10px 14px">${IC2.up} رفع</button>
              <input type="file" accept="image/*" hidden data-pfile="${i}"/></div>
            </div>
            <div class="field"><label>مقتطف قصير (اختياري)</label><textarea data-pf="excerpt" placeholder="يظهر في البطاقة — يُؤخذ من بداية المقال إن تُرك فارغاً" style="min-height:56px">${esc(p.excerpt||'')}</textarea></div>
            <label class="acc-lbl" style="display:block;margin-bottom:7px;font-size:12.5px;color:var(--muted)">نص المقالة (محرّر احترافي)</label>
            <div class="rte">${RTE_TOOLBAR}
              <div class="rte-editor" contenteditable="true" data-editor data-ph="اكتب مقالتك هنا ونسّقها بالأزرار أعلاه — عناوين، قوائم، اقتباس، أكواد، صور…"></div>
              <input type="file" accept="image/*" hidden data-rtefile/>
            </div>
          </div>
        </div>`;
      }).join('');
      // collapsible cards — only one article opens at a time (accordion)
      wrap.querySelectorAll('[data-ptoggle]').forEach(h=>h.addEventListener('click',e=>{
        if(e.target.closest('[data-pdel]')) return;
        const item=h.closest('.post-item'), wasOpen=item.classList.contains('open');
        wrap.querySelectorAll('.post-item.open').forEach(x=>x.classList.remove('open'));
        if(!wasOpen){ item.classList.add('open'); setTimeout(()=>item.scrollIntoView({behavior:'smooth',block:'nearest'}),70); }
      }));
      // per-field input (title / tag / date / cover / excerpt)
      wrap.querySelectorAll('.post-item').forEach(item=>{
        const i=+item.dataset.pi;
        item.querySelectorAll('[data-pf]').forEach(inp=>{
          inp.addEventListener('input',()=>{ blogState.posts[i][inp.dataset.pf]=inp.value; repaint();
            if(inp.dataset.pf==='title'){ const nm=item.querySelector('.pi-name'); if(nm) nm.textContent=inp.value||'مقالة بدون عنوان'; } });
        });
        // rich-text editor
        const rte=item.querySelector('[data-editor]');
        if(rte){
          rte.innerHTML = renderPostBody(blogState.posts[i].body);
          const sync=()=>{ blogState.posts[i].body = rte.innerHTML; repaint(); };
          rte.addEventListener('input', sync);
          rte.addEventListener('blur', sync);
          item.querySelectorAll('.rte-toolbar .rte-btn').forEach(btn=>{
            btn.addEventListener('mousedown', e=>e.preventDefault()); // keep the editor's selection
            btn.addEventListener('click', ()=>{
              rte.focus();
              if(btn.hasAttribute('data-rteimg')){ item.querySelector('[data-rtefile]').click(); return; }
              if(btn.hasAttribute('data-codeblock')){
                const t=(window.getSelection&&window.getSelection().toString())||'';
                document.execCommand('insertHTML',false,'<pre><code>'+esc(t||'// اكتب الكود هنا')+'</code></pre><p><br></p>');
                sync(); return;
              }
              if(btn.hasAttribute('data-codeinline')){
                const t=(window.getSelection&&window.getSelection().toString())||'';
                document.execCommand('insertHTML',false,'<code>'+esc(t||'code')+'</code>&nbsp;');
                sync(); return;
              }
              const cmd=btn.dataset.cmd, val=btn.dataset.val;
              try{
                if(cmd==='createLink'){ const u=prompt('أدخل الرابط (https://…)'); if(u) document.execCommand('createLink',false,/^https?:/i.test(u)?u:'https://'+u); }
                else if(cmd==='formatBlock'){ document.execCommand('formatBlock',false,val); }
                else if(cmd){ document.execCommand(cmd,false,null); }
              }catch(e){ console.error(e); }
              sync();
            });
          });
          const rf=item.querySelector('[data-rtefile]');
          if(rf) rf.onchange=async()=>{
            const f=rf.files&&rf.files[0]; if(!f) return;
            if(!/^image\//.test(f.type)){ toast('الملف ليس صورة'); return; }
            toast('جارٍ رفع الصورة…');
            try{ const url=await uploadToImgbb(f); rte.focus();
              document.execCommand('insertHTML',false,'<img src="'+String(url).replace(/"/g,'&quot;')+'" alt=""/>'); sync(); toast('✓ أُدرجت الصورة في المقال'); }
            catch(e){ console.error(e); toast('تعذّر رفع الصورة'); }
            finally{ rf.value=''; }
          };
        }
      });
      wrap.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=(e)=>{ e.stopPropagation(); if(!confirm('حذف هذه المقالة؟')) return; blogState.posts.splice(+b.dataset.pdel,1); renderPosts(); repaint(); });
      wrap.querySelectorAll('[data-pup]').forEach(b=>b.onclick=()=>{ const f=wrap.querySelector('[data-pfile="'+b.dataset.pup+'"]'); if(f) f.click(); });
      wrap.querySelectorAll('[data-pfile]').forEach(file=>{
        file.onchange=async()=>{
          const i=+file.dataset.pfile, f=file.files&&file.files[0]; if(!f) return;
          if(!/^image\//.test(f.type)){ toast('الملف ليس صورة'); return; }
          toast('جارٍ رفع الصورة…');
          try{ const url=await uploadToImgbb(f); blogState.posts[i].cover=url;
            const inp=wrap.querySelector('.post-item[data-pi="'+i+'"] [data-pf="cover"]'); if(inp) inp.value=url;
            repaint(); toast('✓ تم رفع صورة المقالة'); }
          catch(e){ console.error(e); toast('تعذّر رفع الصورة'); }
        };
      });
    }
    renderPosts();
    $('#addPost').onclick=()=>{
      blogState.posts.push({id:'p'+(blogState.posts.length+1)+'_'+shortId(4),title:'',tag:'',date:'',cover:'',excerpt:'',body:'',published:true});
      renderPosts(); repaint(); if(window.__blogSetPane) window.__blogSetPane('articles');
      const items=$('#postsList').querySelectorAll('.post-item'); const last=items[items.length-1];
      if(last){ wrap_openOnly(last); last.scrollIntoView({behavior:'smooth',block:'center'}); const t=last.querySelector('[data-pf="title"]'); if(t) setTimeout(()=>t.focus(),120); }
    };
    function wrap_openOnly(item){ const list=$('#postsList'); if(!list) return; list.querySelectorAll('.post-item.open').forEach(x=>x.classList.remove('open')); item.classList.add('open'); }

    repaint();

    // save / publish
    $('#bGen').onclick=async()=>{
      if(!currentUser){ showAuth('login'); return; }
      if(!blogState.title.trim()){ toast('أدخل عنوان المدونة'); return; }
      const btn=$('#bGen'); btn.disabled=true; const old=btn.innerHTML; btn.innerHTML='جارٍ الحفظ…';
      const note=$('#bShortNote'); note.textContent='';
      try{
        const owner     = editing ? blogEditMeta.ownerUid  : currentUser.uid;
        const ownerName = editing ? blogEditMeta.ownerName : currentUser.username;
        const createdAt = editing ? blogEditMeta.createdAt : Date.now();
        const id = blogEditingId || await uniqueBlogId();
        // free accounts can't save premium features (advanced elements + exclusive designs)
        if(!isPremium()){
          blogState.threeD=false; blogState.anim='none'; blogState.searchStyle='off'; blogState.sidebarStyle='none'; blogState.tickerStyle='none';
          if(blogDesignLocked(blogState.design)) blogState.design='bd1';
        }
        const cleanPosts = blogState.posts.filter(p=>p&&(p.title||p.body)).map(p=>({...p, published:p.published!==false}));
        const pubCount = cleanPosts.filter(p=>p.published!==false).length;
        const updatedAt=Date.now();
        const clean = {...blogState, posts:cleanPosts, ownerUid:owner, ownerName, createdAt, updatedAt};
        await set(ref(db,'blogs/'+id), clean);
        await set(ref(db,'userBlogs/'+owner+'/'+id), {title:blogState.title||'مدونة', design:blogState.design, updatedAt});
        // public directory entry (safe fields only) powers the explorer — counts published posts only
        await set(ref(db,'blogIndex/'+id), {
          title:blogState.title||'مدونة', subtitle:blogState.subtitle||'', author:blogState.author||'',
          cover:blogState.cover||'', design:blogState.design, count:pubCount, updatedAt
        });
        blogEditingId=id; blogEditMeta={ownerUid:owner, ownerName, createdAt};

        const full=urlBlogView(id);
        $('#bovTitle').textContent = editing?'تم حفظ التغييرات':'تم نشر المدونة';
        $('#bovDesc').textContent = 'هذا هو رابط مدونتك الدائم — شاركه مع من تريد.';
        $('#bOutLink').value=full; $('#bOpenLink').href=full;
        $('#bov').classList.add('show');
        note.textContent='';
      }catch(e){
        console.error(e); toast('تعذّر الحفظ — سجّل الدخول وتحقّق من قواعد قاعدة البيانات');
      }finally{ btn.disabled=false; btn.innerHTML=old; }
    };
    $('#bCopyLink').onclick=()=>{navigator.clipboard?.writeText($('#bOutLink').value);toast('تم نسخ الرابط ✓');};
    $('#bovClose').onclick=()=>$('#bov').classList.remove('show');
    $('#bToMine').onclick=()=>{$('#bov').classList.remove('show'); showBlogAdmin();};
    $('#bov').onclick=e=>{if(e.target===$('#bov'))$('#bov').classList.remove('show');};

    // ---- app-like section navigation (mobile bottom bar + swipe) ----
    (function(){
      const nav=$('.build-nav'); if(!nav) return;
      const panel=$('.builder>.panel');
      const prev=$('.builder .preview-col');
      const panes=[...document.querySelectorAll('.builder .bpane')];
      const order=['data','design','articles','preview'];
      let current='data';
      const isMobile=()=>window.matchMedia('(max-width:600px)').matches;
      const setPane=(name)=>{
        if(!order.includes(name)) return;
        current=name;
        nav.querySelectorAll('.bnav').forEach(b=>b.classList.toggle('on',b.dataset.pane===name));
        if(name==='preview'){
          if(panel) panel.classList.add('pane-hide');
          if(prev) prev.classList.add('pane-show');
          repaint();
        }else{
          if(panel) panel.classList.remove('pane-hide');
          if(prev) prev.classList.remove('pane-show');
          panes.forEach(p=>p.classList.toggle('pane-on',p.dataset.pane===name));
        }
        if(isMobile()) window.scrollTo({top:0,behavior:'smooth'});
      };
      window.__blogSetPane=setPane;
      nav.querySelectorAll('.bnav').forEach(b=>b.onclick=()=>setPane(b.dataset.pane));
      // horizontal swipe between sections — but never hijack gestures that begin
      // on a control that needs its own horizontal drag / scroll / tap
      let sx=0,sy=0,tracking=false;
      const root=$('.builder');
      const NO_SWIPE='input,textarea,select,button,a,label,.bd-picker,.bd-swatch,.rte,.rte-editor,.rte-toolbar,.post-item';
      root.addEventListener('touchstart',e=>{
        tracking=false;
        if(!isMobile()||e.touches.length>1) return;
        if(e.target.closest(NO_SWIPE)) return;
        sx=e.touches[0].clientX; sy=e.touches[0].clientY; tracking=true;
      },{passive:true});
      root.addEventListener('touchend',e=>{
        if(!tracking) return; tracking=false;
        const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
        if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.8) return;
        const i=order.indexOf(current);
        const ni = dx>0 ? i-1 : i+1;   // RTL: swipe right → previous, swipe left → next
        if(ni>=0&&ni<order.length) setPane(order[ni]);
      },{passive:true});
      // land on the pane requested by the admin page (add a fresh post / focus one)
      if(blogBuilderFocus==='new'){ $('#addPost')?.click(); setPane('articles'); }
      else if(typeof blogBuilderFocus==='number'){
        setPane('articles');
        const it=$('#postsList .post-item[data-pi="'+blogBuilderFocus+'"]');
        if(it){ it.classList.add('open'); setTimeout(()=>it.scrollIntoView({behavior:'smooth',block:'center'}),120); }
      }else setPane('data');
      blogBuilderFocus=null;
    })();
  }
  async function uniqueBlogId(){
    for(let k=0;k<6;k++){const id=shortId(7);const snap=await get(child(ref(db),'blogs/'+id));if(!snap.exists())return id;}
    return shortId(10);
  }

  /* ---------- blog explorer (public directory of every published blog) ---------- */
  function exploreCard(b,base,top){
    const dz=blogDesign(b.design);
    const grad=`linear-gradient(135deg,${dz.accent},${dz.accent2})`;
    const cover=b.cover
      ? `<img src="${esc(b.cover)}" alt="${esc(b.title)}" loading="lazy" onerror="this.remove()"/>`
      : `<span class="xp-mono">${esc(initials(b.title||'م'))}</span>`;
    const date=b.updatedAt?new Date(b.updatedAt).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}):'';
    return `<a class="xp-card${top?' xp-top':''}" href="${urlBlogView(b.id)}">
      ${top?'<span class="xp-top-badge">🏆 الأعلى تقييمًا</span>':''}
      <div class="xp-cover" style="background:${grad}">${cover}
        <span class="xp-badge">${esc(dz.name)}</span>${b.locked?'<span class="xp-lk" title="محمية بكلمة مرور">🔒</span>':''}</div>
      <div class="xp-b">
        <div class="xp-title">${esc(b.title||'مدونة بدون عنوان')}</div>
        <div class="xp-sub">${esc(b.subtitle||'مدونة على elgoharyX')}</div>
        <div class="xp-meta"><span class="xp-av" style="background:${grad}">${esc(initials(b.author||'م'))}</span>
          <span>${esc(b.author||'كاتب')}</span><span class="dot"></span><span>${(b.count||0)} مقالة</span>
          ${(+b.rCount)?`<span class="dot"></span><span class="xp-rate">${RSTAR} ${blogAvg(b).toFixed(1)} (${+b.rCount})</span>`:''}
          ${date?`<span class="dot"></span><span>${date}</span>`:''}</div>
      </div></a>`;
  }
  async function showExplore(){
    document.title='استكشف المدونات — elgoharyX';
    document.body.style.background='';
    $('#app').innerHTML = appbar('explore') + `
      <section class="xp-hero"><div class="xp-hero-in">
        <span class="xp-kick">✦ مكتبة المدونات</span>
        <h1>استكشف المدونات</h1>
        <p>تصفّح كل المدونات المنشورة على elgoharyX — اقرأ مقالات في التقنية والثقافة والتطوير، واستلهم لإنشاء مدونتك الخاصة.</p>
        <div class="xp-search"><input id="xpSearch" placeholder="ابحث بعنوان المدونة أو اسم الكاتب…" autocomplete="off"/></div>
      </div></section>
      <div class="wrap">
        <div class="xp-count" id="xpCount"></div>
        <div class="elg-ad" data-ad="infeed"></div>
        <div id="xpList">${skelGrid(6)}</div>
      </div>` + (currentUser?drawer('explore'):'');
    wireAppbar();
    try{
      const s=await get(child(ref(db),'blogIndex'));
      let list = s.exists()? Object.entries(s.val()).map(([id,v])=>({id,...v})) : [];
      // الأعلى تقييمًا يتصدّر، ثم الأحدث تحديثًا
      list.sort((a,b)=> (blogScore(b)-blogScore(a)) || ((b.updatedAt||0)-(a.updatedAt||0)));
      const base=location.href.split('#')[0].split('?')[0];
      const listEl=$('#xpList'), countEl=$('#xpCount');
      const draw=(arr)=>{
        countEl.textContent = list.length ? (arr.length+' من '+list.length+' مدونة') : '';
        listEl.innerHTML = arr.length
          ? `<div class="xp-grid">${arr.map((b,i)=>exploreCard(b,base, i===0 && (+b.rCount)>0)).join('')}</div>`
          : `<div class="xp-empty">${list.length?'لا توجد نتائج مطابقة لبحثك.':'لا توجد مدونات منشورة بعد — كن أول من ينشر مدونته!'}</div>`;
      };
      draw(list);
      if(window.elgFillAds) window.elgFillAds($('#app'));
      const sb=$('#xpSearch'); if(sb) sb.oninput=()=>{ const q=sb.value.trim().toLowerCase();
        draw(!q?list:list.filter(b=>((b.title||'')+' '+(b.author||'')+' '+(b.subtitle||'')).toLowerCase().includes(q))); };
    }catch(e){
      console.error(e);
      $('#xpList').innerHTML=`<div class="xp-empty">تعذّر تحميل المدونات. تحقّق من اتصالك أو من قواعد قاعدة البيانات.</div>`;
    }
  }

  /* ======================================================================
     PREMIUM / MANUAL PAYMENTS (InstaPay + Etisalat Cash, admin-approved)
     ====================================================================== */
  const PREMIUM = { first:100, renew:150, months:3, instapay:'01102052415', etisalat:'01102052489' };

  /* ▼▼▼ إشعار البريد للأدمن (EmailJS) — املأ القيم الأربعة من حسابك على emailjs.com ▼▼▼
     (المفاتيح دي عامة ومصمّمة تُستخدم في المتصفح، فمفيش خطر من ظهورها هنا) */
  const EMAILJS = {
    publicKey:  'KN-SelriJR4jhYWoc', // ✓ تم
    serviceId:  'service_o0p48dy',    // ✓ تم
    templateId: 'template_vxxti7l',   // ✓ تم — قالب إشعار الأدمن (طلبات الدفع)
    // (اختياري) قالب مخصّص لإشعارات المستخدمين. لو عندك قالب تاني على EmailJS
    // يستخدم {{to_email}} و{{title}} و{{message}} ضعه هنا؛ وإلا يُستخدم القالب الأساسي.
    notifyTemplateId: 'template_v9wqxge', // ✓ قالب إشعارات المستخدمين
    toEmail:    'exeg540@gmail.com'    // البريد اللي يستقبل الإشعار
  };
  /* ▲▲▲ */
  const emailjsReady = () => EMAILJS.publicKey && !EMAILJS.publicKey.startsWith('YOUR_');
  async function notifyAdminEmail(fields){
    if(!emailjsReady()) return; // لم تُضبط بعد — نتجاهل بهدوء
    try{
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ service_id:EMAILJS.serviceId, template_id:EMAILJS.templateId, user_id:EMAILJS.publicKey, template_params:fields })
      });
    }catch(e){ console.warn('email notify failed', e); }
  }
  const CROWN='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 8.5 6.5 12l3.7-6 1.8 0L15.5 12l4-3.5-1.7 10.5H4.2L2.5 8.5Zm3.2 10.5h12.6"/></svg>';
  const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M20 6 9 17l-5-5"/></svg>';
  /* أيقونات مزايا الاشتراك المميز */
  const AD_OFF_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 4 16 16"/></svg>';
  const PK_LINK_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
  const PK_STAR_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.6 1.1-6L3.4 9.4l6-.8L12 3Z"/></svg>';
  const PK_APP_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v6"/><path d="m9.5 11 2.5 2.5L14.5 11"/><path d="M11 18h2"/></svg>';
  const PK_BAR_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="2"/><path d="M6.5 6.5h4"/><circle cx="17" cy="6.5" r="1"/><rect x="3" y="12" width="18" height="8" rx="2"/></svg>';

  /* ======================================================================
     NOTIFICATIONS — site announcements (bell), subscribe, + email delivery
     Announcements are stored in RTDB (announcements/) so every visitor sees
     them in-site via the bell. Subscribing asks the browser for permission
     and records the opt-in (notifySubs/<uid>) so the admin can email the user.
     ====================================================================== */
  const BELL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
  const NOTIF_SEEN_KEY='apb_notif_seen';
  const NOTIF_OPTIN_KEY='apb_notif_optin';
  const notifSeen   = ()=>{ try{ return +localStorage.getItem(NOTIF_SEEN_KEY)||0; }catch{ return 0; } };
  const setNotifSeen= ts=>{ try{ localStorage.setItem(NOTIF_SEEN_KEY, String(ts||Date.now())); }catch{} };
  const isSubscribed= ()=>{ try{ return localStorage.getItem(NOTIF_OPTIN_KEY)==='1'; }catch{ return false; } };

  /* read announcements meant for everyone (or targeted at the current user) */
  async function loadAnnouncements(){
    try{
      const s=await get(child(ref(db),'announcements'));
      let list = s.exists()? Object.entries(s.val()).map(([id,v])=>({id,...v})) : [];
      const uid = currentUser && currentUser.uid;
      list = list.filter(a=> !a.uid || a.uid==='all' || a.uid===uid);
      list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      return list;
    }catch(e){ return []; }
  }

  /* opt in: ask the browser for permission + record the subscription */
  async function subscribeNotifications(){
    let perm='default';
    try{ if('Notification' in window) perm = (Notification.permission==='granted') ? 'granted' : await Notification.requestPermission(); }catch(e){}
    try{
      if(currentUser) await set(ref(db,'notifySubs/'+currentUser.uid), {
        username: currentUser.username||'', email: currentUser.email||'',
        enabled: true, push: perm==='granted', at: Date.now()
      });
    }catch(e){ console.warn('subscribe save failed', e); }
    try{ localStorage.setItem(NOTIF_OPTIN_KEY,'1'); }catch{}
    return perm;
  }
  async function unsubscribeNotifications(){
    try{ if(currentUser) await remove(ref(db,'notifySubs/'+currentUser.uid)); }catch(e){}
    try{ localStorage.removeItem(NOTIF_OPTIN_KEY); }catch{}
  }

  /* update the bell badge, and (once per load) pop native OS notifications */
  let _notifPopped=false;
  async function refreshBell(){
    if(!currentUser) return;
    const list=await loadAnnouncements();
    const seen=notifSeen();
    const fresh=list.filter(a=>(a.createdAt||0)>seen);
    const dot=$('#bellDot');
    if(dot){ if(fresh.length){ dot.hidden=false; dot.textContent=fresh.length>9?'9+':String(fresh.length); } else { dot.hidden=true; dot.textContent=''; } }
    if(!_notifPopped){
      _notifPopped=true;
      if('Notification' in window && Notification.permission==='granted' && isSubscribed()){
        fresh.slice(0,3).forEach(a=>{ try{ new Notification(a.title||'إشعار جديد — elgoharyX',
          { body:(a.body||'').slice(0,180), icon:LOGO, tag:'elgo-'+a.id }); }catch(e){} });
      }
    }
  }

  /* the notifications panel (bell) — shows announcements + a subscribe toggle */
  function closeNotif(){ const o=$('#notifOv'); if(o) o.remove(); }
  async function openNotifications(){
    closeNotif();
    const ov=document.createElement('div'); ov.className='overlay show'; ov.id='notifOv';
    ov.innerHTML=`<div class="modal notif-modal">
      <button class="close" data-notif-close aria-label="إغلاق">✕</button>
      <div class="info-h">${BELL}<h3>الإشعارات</h3></div>
      <div class="notif-sub" id="notifSubRow"></div>
      <div class="notif-list" id="notifList"><div class="pm-note" style="text-align:center;padding:16px 0">جارٍ التحميل…</div></div>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('[data-notif-close]')) closeNotif(); });
    const drawSub=()=>{
      const row=$('#notifSubRow'); if(!row) return; const on=isSubscribed();
      row.innerHTML = on
        ? `<span class="ns-on">${IC2.check||'✓'} أنت مشترك في إشعارات الموقع</span><button class="btn ghost" id="notifUnsub">إلغاء الاشتراك</button>`
        : `<span class="ns-txt">اشترك لتصلك إشعارات الموقع الجديدة أولاً بأول.</span><button class="btn primary" id="notifSub">🔔 اشترك</button>`;
      const s=$('#notifSub'); if(s) s.onclick=async()=>{ s.disabled=true; s.textContent='جارٍ التفعيل…';
        const p=await subscribeNotifications(); toast(p==='granted'?'تم تفعيل الإشعارات ✓':'تم الاشتراك ✓'); drawSub(); };
      const u=$('#notifUnsub'); if(u) u.onclick=async()=>{ await unsubscribeNotifications(); toast('تم إلغاء الاشتراك'); drawSub(); };
    };
    drawSub();
    const list=await loadAnnouncements();
    setNotifSeen(list.length?Math.max(...list.map(a=>a.createdAt||0)):Date.now());
    const dot=$('#bellDot'); if(dot){ dot.hidden=true; dot.textContent=''; }
    const el=$('#notifList'); if(!el) return;
    el.innerHTML = list.length ? list.map(a=>`<div class="notif-item">
        <div class="notif-t">${esc(a.title||'إشعار')}</div>
        ${a.body?`<div class="notif-b">${esc(a.body)}</div>`:''}
        <div class="notif-d">${fmtDay(a.createdAt)}</div>
      </div>`).join('') : `<div class="pm-note" style="text-align:center;padding:22px 0">لا توجد إشعارات بعد.</div>`;
  }

  /* send a single notification email to a user via EmailJS (fire-and-forget).
     Uses the dedicated notify template if configured; otherwise the main one.
     The message is sent under EVERY common variable name (message/content/text/
     note/body/msg) plus a combined title+body — so it shows no matter which
     variable the EmailJS template happens to reference. */
  async function sendUserEmail(toEmail, title, body, toName){
    if(!emailjsReady() || !toEmail) return false;
    const tpl = (EMAILJS.notifyTemplateId && !EMAILJS.notifyTemplateId.startsWith('YOUR_'))
      ? EMAILJS.notifyTemplateId : EMAILJS.templateId;
    const bodyText = (body && body.trim()) ? body : title;   // never empty
    const full = (body && body.trim()) ? (title + '\n\n' + body) : title;
    const params = {
      // recipient (different templates use different names)
      to_email: toEmail, to_name: toName||'', email: toEmail, name: toName||'', username: toName||'',
      // title / subject
      title: title, subject: title, header: title, from_name: 'elgoharyX',
      // body — under every common name so any template renders it
      message: bodyText, content: bodyText, text: bodyText, body: bodyText, msg: bodyText,
      // the payment-style template shows {{note}} — put the whole thing there
      note: full,
      // harmless extras kept so the fallback payment template renders cleanly
      method: '📢 إشعار', amount: '', screenshot: '', link: urlHome()
    };
    try{
      const r=await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ service_id:EMAILJS.serviceId, template_id:tpl, user_id:EMAILJS.publicKey, template_params:params })
      });
      return r.ok;
    }catch(e){ console.warn('user email failed', e); return false; }
  }

  let adminEmail = undefined; // undefined = not loaded yet, null = none
  async function loadAdminEmail(){
    // session cache: read the admin email from the DB only once per browser session
    try{ const c=sessionStorage.getItem(ADMIN_EMAIL_KEY); if(c!==null){ adminEmail = c||null; return adminEmail; } }catch(e){}
    try{ const s=await get(child(ref(db),'config/adminEmail')); adminEmail = s.exists()? String(s.val()).trim().toLowerCase() : null; }
    catch(e){ adminEmail = null; }
    try{ sessionStorage.setItem(ADMIN_EMAIL_KEY, adminEmail||''); }catch(e){}
    return adminEmail;
  }
  const isAdmin = () => !!(currentUser && adminEmail && (currentUser.email||'').trim().toLowerCase()===adminEmail);

  /* ---- admin panel password gate (hides the admin email behind a password
     that the admin sets from inside the panel). Stored hashed in config/adminGate,
     verified client-side; unlock is remembered for the browser session only. ---- */
  const hashAdminPass = (salt,pass)=>sha256((salt||'')+'::admin::'+String(pass||''));
  async function loadAdminGate(){
    try{ const s=await get(child(ref(db),'config/adminGate'));
      return s.exists() && s.val() && s.val().hash ? s.val() : null; }catch(e){ return null; }
  }
  const ADMIN_UNLOCK_KEY='apb_admin_unlocked';
  const adminUnlocked   =()=>{ try{ return sessionStorage.getItem(ADMIN_UNLOCK_KEY)==='1'; }catch{ return false; } };
  const markAdminUnlocked=()=>{ try{ sessionStorage.setItem(ADMIN_UNLOCK_KEY,'1'); }catch{} };
  const clearAdminUnlock =()=>{ try{ sessionStorage.removeItem(ADMIN_UNLOCK_KEY); }catch{} };
  /* mask an email for display: keep first 2 chars + full domain (ex•••@gmail.com) */
  const maskEmail = e=>{ const s=String(e||''); const at=s.indexOf('@'); if(at<1) return '•••';
    const head=s.slice(0,Math.min(2,at)); return head+'•••'+s.slice(at); };

  async function getPremium(uid){ try{ const s=await get(child(ref(db),'premium/'+uid)); return s.exists()?s.val():null; }catch(e){ return null; } }
  const premiumActive = p => !!(p && p.active && (!p.expires || p.expires>Date.now()));
  const isPremium = () => !!(currentUser && currentUser.premium);
  const fmtDay = ts => { try{ return new Date(ts).toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'}); }catch{ return ''; } };
  /* ---- premium gating: which features require a subscription ---- */
  const FREE_BLOG_DESIGNS = 50;      // first 50 blog designs are free
  const FREE_PROFILE_LAYOUTS = 50;   // first 50 profile layouts are free
  const FREE_PROFILE_COLORS = 12;    // first 12 profile colors are free
  const blogDesignLocked = id => { const n=parseInt(String(id).replace(/\D/g,''),10)||0; return n>FREE_BLOG_DESIGNS; };
  const gateNote = (txt)=>`<div class="gate-note">${LOCKICON}<span>${txt}</span><a href="${pageUrl('premium.html')}">ترقية للاشتراك المميز ✦</a></div>`;
  const LOCKICON='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  async function showPremium(){
    if(!currentUser){ gotoLogin(); return; }
    document.title='الاشتراك المميز — elgoharyX';
    document.body.style.background='';
    $('#app').innerHTML = appbar('premium') + `<div class="wrap"><div class="pro-loader"><div class="pl-in"><div class="pl-ringwrap"><div class="ring"></div></div></div></div></div>` + drawer('premium');
    wireAppbar();
    const p = await getPremium(currentUser.uid);
    const active = premiumActive(p);
    const price = (p && p.count) ? PREMIUM.renew : PREMIUM.first;
    let shot='';
    const statusHtml = active
      ? `<div class="pm-status ok"><span class="pm-vip">${CROWN} عضو مميز</span><span>اشتراكك فعّال حتى <b>${fmtDay(p.expires)}</b>. يمكنك التجديد بالأسفل.</span></div>`
      : (p ? `<div class="pm-status off">انتهى اشتراكك السابق — جدّده بالأسفل.</div>` : '');
    $('#app').innerHTML = appbar('premium') + `<div class="wrap pm-wrap">
      <div class="pm-hero"><span class="pm-crown">${CROWN}</span>
        <h1>الاشتراك المميز</h1>
        <p>استمتع بتجربة <b>بلا إعلانات نهائيًا</b> على كامل الموقع، واحصل على شارة «عضو مميز»، وإزالة علامة elgoharyX من روابطك، ومزايا حصرية قادمة.</p></div>
      ${statusHtml}
      <div class="pm-perks-msg">
        <span class="pm-pm-badge">${CROWN} كل مزايا العضوية المميزة</span>
        <p>عند اشتراكك تفتح لك هذه المزايا كاملةً على حسابك مباشرةً — إليك كل ما ستحصل عليه:</p>
      </div>
      <div class="pm-perks">
        <div class="pm-perk feature"><span class="pm-pk-ic">${AD_OFF_IC}</span>
          <div><b>بلا إعلانات نهائيًا</b><span>تصفّح الموقع كله — المدونات والبروفايلات — دون أي إعلان يقاطعك.</span></div></div>
        <div class="pm-perk feature"><span class="pm-pk-ic">${PK_APP_IC}</span>
          <div><b>حوّل مدونتك إلى تطبيق <span class="pm-new">جديد</span></b><span>ثبّت مدونتك كتطبيق مستقل على شاشة الهاتف والكمبيوتر — فتح فوري وعمل دون اتصال، بلا متجر تطبيقات.</span></div></div>
        <div class="pm-perk feature"><span class="pm-pk-ic">${PK_BAR_IC}</span>
          <div><b>شريط أدوات احترافي للكمبيوتر <span class="pm-new">جديد</span></b><span>واجهة علوية أنيقة مميّزة بلمسة ذهبية وتنقّل أوضح — تجربة أرقى على شاشة الكمبيوتر.</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${CROWN}</span>
          <div><b>شارة «عضو مميز»</b><span>تظهر على بروفايلك ومدونتك وتُميّزك عن غيرك.</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${PK_LINK_IC}</span>
          <div><b>روابط نظيفة باسمك</b><span>إزالة علامة elgoharyX من روابطك المشاركة.</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${PK_STAR_IC}</span>
          <div><b>أولوية الدعم + مزايا حصرية قادمة</b><span>أنت تدعم استمرار elgoharyX وتحصل على كل جديد أولًا.</span></div></div>
      </div>
      <div class="pm-price"><b>${price}</b><span>جنيه · لمدة 3 شهور</span>
        <div class="pm-note2">${price===PREMIUM.renew?'سعر التجديد':'سعر أول اشتراك'} — التجديد بعدها ${PREMIUM.renew} ج</div></div>
      <div class="pm-card">
        <h3>1) ادفع عبر إحدى الطريقتين</h3>
        <div class="pm-method"><div class="pm-mname"><b>InstaPay</b><span>انستا باي</span></div><span class="pm-num">${PREMIUM.instapay}</span><button class="btn ghost" data-copy="${PREMIUM.instapay}">نسخ</button></div>
        <div class="pm-method"><div class="pm-mname"><b>Etisalat Cash</b><span>اتصالات كاش</span></div><span class="pm-num">${PREMIUM.etisalat}</span><button class="btn ghost" data-copy="${PREMIUM.etisalat}">نسخ</button></div>
      </div>
      <div class="pm-card pm-upload">
        <h3>2) ارفع صورة إثبات الدفع</h3>
        <div class="field"><label>طريقة الدفع</label><select id="pmMethod" class="mini-select" style="width:100%"><option value="instapay">InstaPay — انستا باي</option><option value="etisalat">Etisalat Cash — اتصالات كاش</option></select></div>
        <div class="field"><label>صورة الإيصال</label>
          <button type="button" class="btn ghost" id="pmUp" style="width:100%">${IC2.up} رفع صورة الإيصال</button>
          <input type="file" id="pmFile" accept="image/*" hidden/>
          <div class="pm-shot" id="pmShot"></div></div>
        <div class="field"><label>ملاحظة (اختياري)</label><input id="pmNoteInp" placeholder="اسم المُرسِل أو رقم العملية…"/></div>
        <div class="pm-note" id="pmMsg"></div>
        <button class="btn primary" id="pmSend" style="width:100%">إرسال الطلب للمراجعة</button>
        <div class="pm-hint">بعد مراجعة الأدمن والتأكد من المبلغ (${price} ج) يُفعَّل اشتراكك خلال وقت قصير.</div>
      </div>
    </div>` + drawer('premium');
    wireAppbar();
    document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{ navigator.clipboard?.writeText(b.dataset.copy); toast('تم نسخ الرقم ✓'); });
    const msg=$('#pmMsg');
    $('#pmUp').onclick=()=>$('#pmFile').click();
    $('#pmFile').onchange=async()=>{
      const f=$('#pmFile').files&&$('#pmFile').files[0]; if(!f) return;
      if(!/^image\//.test(f.type)){ msg.className='pm-note'; msg.textContent='الملف ليس صورة'; return; }
      const b=$('#pmUp'); const old=b.innerHTML; b.disabled=true; b.textContent='جارٍ الرفع…';
      try{ shot=await uploadToImgbb(f); $('#pmShot').innerHTML=`<img src="${esc(shot)}" alt="إيصال"/>`; msg.className='pm-note ok'; msg.textContent='✓ تم رفع الصورة'; }
      catch(e){ console.error(e); msg.className='pm-note'; msg.textContent='تعذّر رفع الصورة'; }
      finally{ b.disabled=false; b.innerHTML=old; $('#pmFile').value=''; }
    };
    $('#pmSend').onclick=async()=>{
      if(!shot){ msg.className='pm-note'; msg.textContent='ارفع صورة إثبات الدفع أولاً'; return; }
      const btn=$('#pmSend'); btn.disabled=true; const old=btn.textContent; btn.textContent='جارٍ الإرسال…';
      try{
        const id=shortId(14);
        const methodName=$('#pmMethod').value==='etisalat'?'اتصالات كاش':'انستا باي';
        const noteVal=($('#pmNoteInp').value||'').slice(0,500);
        await set(ref(db,'paymentRequests/'+id), { uid:currentUser.uid, username:currentUser.username||'', email:currentUser.email||'', method:$('#pmMethod').value, amount:price, screenshot:shot, note:noteVal, status:'pending', createdAt:Date.now() });
        // notify the admin by email (EmailJS) — fire-and-forget so it never blocks the user
        notifyAdminEmail({ to_email:EMAILJS.toEmail, username:currentUser.username||'مستخدم', email:currentUser.email||'', method:methodName, amount:String(price), note:noteVal||'—', screenshot:shot, link:pageUrl('admin.html') });
        $('#app').querySelector('.pm-upload').innerHTML=`<div class="pm-done"><div class="ok">${CHECK}</div><h3>تم استلام طلبك ✓</h3><p>سيراجع الأدمن الإيصال ويؤكّد المبلغ، ثم يُفعَّل اشتراكك المميز. عُد لهذه الصفحة لاحقاً للاطمئنان.</p></div>`;
        toast('تم إرسال طلب الاشتراك ✓');
      }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent='تعذّر الإرسال — تأكد من نشر القواعد'; btn.disabled=false; btn.textContent=old; }
    };
  }

  /* grant / extend a premium subscription for a uid (shared by Payments + Users) */
  async function adminGrantPremium(uid, done){
    try{
      const cur=await getPremium(uid);
      const base=(cur && premiumActive(cur) && cur.expires)?cur.expires:Date.now();
      const expires=base + PREMIUM.months*30*24*3600*1000;
      const count=((cur && cur.count)?cur.count:0)+1;
      await set(ref(db,'premium/'+uid), { active:true, plan:String(count>1?PREMIUM.renew:PREMIUM.first), since:(cur&&cur.since)||Date.now(), expires, count });
      toast('تم تفعيل الاشتراك ✓'); done&&done();
    }catch(e){ console.error(e); toast('تعذّر التفعيل — تأكد أنك داخل بحساب الأدمن'); }
  }

  async function showAdmin(){
    if(!currentUser){ gotoLogin(); return; }
    document.title='لوحة تحكّم الأدمن — elgoharyX';
    document.body.style.background='';
    $('#app').innerHTML = appbar('admin') + `<div class="wrap">${skelGrid(3)}</div>` + drawer('admin');
    wireAppbar();
    if(adminEmail===undefined) await loadAdminEmail();
    const fbAuthed = !!(auth && auth.currentUser);
    const adminGateObj = await loadAdminGate();   // panel password (hides the admin email)
    const adminGateSet = !!adminGateObj;
    // "set admin email" + "panel password" cards
    const setupCard = () => `<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">إعداد بريد الأدمن</h3>
        <div class="sub" style="margin-bottom:14px">اكتب بريد الأدمن واضغط حفظ — يُخزَّن في قاعدة البيانات تلقائياً.</div>
        ${!adminEmail
          ? `<div class="pm-note" style="margin-bottom:12px">لم يُضبط الأدمن بعد — احفظ بريدك لتصبح الأدمن.</div>`
          : (isAdmin()
            ? `<div class="pm-note ok" style="margin-bottom:12px">الأدمن الحالي: <b dir="ltr" id="admEmailShow" data-full="${esc(adminEmail)}" data-shown="0">${esc(maskEmail(adminEmail))}</b> <button class="lnk-btn" id="admEmailReveal" type="button">إظهار</button></div>`
            : `<div class="pm-note ok" style="margin-bottom:12px">تم ضبط الأدمن بالفعل. 🔒</div>`)}
        ${fbAuthed?`
          <div class="field"><label>بريد الأدمن</label><input id="admEmailInp" dir="ltr" value="${esc((currentUser.email||'').trim().toLowerCase())}"/></div>
          <button class="btn primary" id="admSave" style="width:100%">حفظ بريد الأدمن</button>
          <div class="pm-note" id="admMsg"></div>
        `:`<div class="gate-note" style="display:block">لتعيين الأدمن يجب تسجيل الدخول عبر <b>Google</b> (حساب Firebase). اخرج ثم ادخل بزر «المتابعة بحساب Google» بنفس بريد الأدمن، ثم ارجع هنا واحفظه.</div>`}
      </div>
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🔒 كلمة مرور لوحة الأدمن</h3>
        <div class="sub" style="margin-bottom:14px">${adminGateSet?'اللوحة محمية بكلمة مرور — تُطلب عند فتح القسم لإخفاء بريد الأدمن. يمكنك تغييرها أو إزالتها.':'أضف كلمة مرور لحماية اللوحة وإخفاء بريد الأدمن — تُطلب عند فتح هذا القسم.'}</div>
        <div class="field"><label>كلمة المرور الجديدة</label><input id="admPass1" type="password" dir="ltr" placeholder="6 أحرف على الأقل" autocomplete="new-password"/></div>
        <div class="field"><label>تأكيد كلمة المرور</label><input id="admPass2" type="password" dir="ltr" placeholder="أعد كتابتها" autocomplete="new-password"/></div>
        <button class="btn primary" id="admPassSave" style="width:100%">${adminGateSet?'تغيير كلمة المرور':'حفظ كلمة المرور'}</button>
        ${adminGateSet?`<button class="btn del" id="admPassRemove" style="width:100%;margin-top:8px">إزالة كلمة المرور</button>`:''}
        <div class="pm-note" id="admPassMsg"></div>
      </div>`:''}`;
    const wireSetup = () => {
      // reveal / hide the masked admin email
      const rv=$('#admEmailReveal');
      if(rv) rv.onclick=()=>{ const b=$('#admEmailShow'); if(!b) return;
        const showing=b.dataset.shown==='1';
        b.textContent = showing ? maskEmail(b.dataset.full) : b.dataset.full;
        b.dataset.shown = showing?'0':'1'; rv.textContent = showing?'إظهار':'إخفاء'; };
      // save the admin email
      const b=$('#admSave');
      if(b) b.onclick=async()=>{
        const em=($('#admEmailInp').value||'').trim().toLowerCase(), msg=$('#admMsg');
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ msg.className='pm-note'; msg.textContent='بريد غير صحيح'; return; }
        b.disabled=true; const old=b.textContent; b.textContent='جارٍ الحفظ…';
        try{ await set(ref(db,'config/adminEmail'), em); adminEmail=em; try{ sessionStorage.setItem(ADMIN_EMAIL_KEY, em); }catch(e){} toast('تم حفظ بريد الأدمن ✓'); showAdmin(); }
        catch(e){ console.error(e); msg.className='pm-note'; msg.textContent='تعذّر الحفظ — لازم تكون داخل بجوجل، وتحفظ بريدك أنت (أول مرة) أو تكون الأدمن الحالي.'; b.disabled=false; b.textContent=old; }
      };
      // save / change the panel password
      const ps=$('#admPassSave');
      if(ps) ps.onclick=async()=>{
        const p1=($('#admPass1').value||''), p2=($('#admPass2').value||''), msg=$('#admPassMsg');
        if(p1.length<6){ msg.className='pm-note'; msg.textContent='كلمة المرور 6 أحرف على الأقل'; return; }
        if(p1!==p2){ msg.className='pm-note'; msg.textContent='كلمتا المرور غير متطابقتين'; return; }
        ps.disabled=true; const old=ps.textContent; ps.textContent='جارٍ الحفظ…';
        try{ const salt=shortId(16); const hash=await hashAdminPass(salt,p1);
          await set(ref(db,'config/adminGate'), { salt, hash, at:Date.now() });
          markAdminUnlocked(); toast('تم حفظ كلمة المرور ✓'); showAdmin();
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent='تعذّر الحفظ — تأكد أنك أدمن (Google) وأن القواعد المحدّثة منشورة'; ps.disabled=false; ps.textContent=old; }
      };
      // remove the panel password
      const pr=$('#admPassRemove');
      if(pr) pr.onclick=async()=>{ if(!confirm('إزالة كلمة مرور اللوحة؟ سيصبح بريد الأدمن ظاهراً لمن يفتح القسم.'))return;
        try{ await remove(ref(db,'config/adminGate')); clearAdminUnlock(); toast('تمت إزالة كلمة المرور'); showAdmin(); }
        catch(e){ console.error(e); toast('تعذّر — تأكد أنك أدمن'); } };
    };
    if(!isAdmin()){
      $('#app').innerHTML = appbar('admin') + `<div class="wrap">${setupCard()}
        <div class="mp-empty" style="max-width:600px;margin:0 auto">هذه اللوحة للأدمن فقط. بعد حفظ بريدك بالأعلى (وأنت داخل بجوجل) ستصبح الأدمن مباشرة.</div>
      </div>` + drawer('admin');
      wireAppbar(); wireSetup(); return;
    }

    /* ---------- password gate (hides the admin email behind a password) ---------- */
    if(adminGateSet && !adminUnlocked()){
      $('#app').innerHTML = appbar('admin') + `<div class="wrap">
        <div class="lock-wrap"><div class="lock-card">
          <div class="lock-ic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4"/></svg></div>
          <h2 class="lock-title">لوحة الأدمن محمية بكلمة مرور</h2>
          <p class="lock-sub">أدخل كلمة مرور لوحة الأدمن للمتابعة.</p>
          <div class="lock-err" id="admGateErr"></div>
          <div class="field"><input id="admGatePass" type="password" placeholder="كلمة المرور" autocomplete="off" style="text-align:center;letter-spacing:2px"/></div>
          <button class="btn primary" id="admGateGo">دخول</button>
          <a class="lock-home" href="${urlHome()}">العودة للرئيسية</a>
        </div></div>
      </div>` + drawer('admin');
      wireAppbar();
      const inp=$('#admGatePass'), err=$('#admGateErr'), go=$('#admGateGo');
      const attempt=async()=>{
        err.textContent='';
        const v=inp.value; if(!v){ err.textContent='أدخل كلمة المرور'; return; }
        go.disabled=true; const old=go.textContent; go.textContent='جارٍ التحقق…';
        const h=await hashAdminPass(adminGateObj.salt||'', v);
        if(h===adminGateObj.hash){ markAdminUnlocked(); showAdmin(); }
        else{ err.textContent='كلمة المرور غير صحيحة'; go.disabled=false; go.textContent=old; inp.value=''; inp.focus(); }
      };
      go.onclick=attempt;
      inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); attempt(); } });
      inp.focus();
      return;
    }

    /* ---------- tabbed control center ---------- */
    let TAB_ID='overview';
    const TABS=[['overview','نظرة عامة'],['users','المستخدمون'],['profiles','البروفايلات'],
      ['blogs','المدونات'],['payments','المدفوعات'],['notify','الإشعارات'],['config','الإعدادات']];
    const shell=(inner)=> appbar('admin') + `<div class="wrap adm-wrap">
      <div class="mp-head"><div><h2>لوحة تحكّم الأدمن</h2>
        <div class="sub">راقب وتحكّم في الموقع بالكامل — المستخدمون، المحتوى، الاشتراكات، والإشعارات.</div></div></div>
      <div class="adm-tabs">${TABS.map(t=>`<button class="adm-tab ${TAB_ID===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="adm-body" id="admBody">${inner}</div>
    </div>` + drawer('admin');
    const busy = ()=>`<div class="pm-note" style="text-align:center;padding:34px 0">جارٍ التحميل…</div>`;
    const bodyEl = ()=>$('#admBody');
    const wireTabs = ()=>document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    function setTab(id){
      TAB_ID=id;
      document.querySelectorAll('.adm-tab').forEach(b=>b.classList.toggle('on', b.dataset.tab===id));
      renderTab();
    }
    async function renderTab(){
      const el=bodyEl(); if(!el) return; el.innerHTML=busy();
      try{
        if(TAB_ID==='overview')      await renderOverview(el);
        else if(TAB_ID==='users')    await renderUsers(el);
        else if(TAB_ID==='profiles') await renderProfiles(el);
        else if(TAB_ID==='blogs')    await renderBlogs(el);
        else if(TAB_ID==='payments') await renderPayments(el);
        else if(TAB_ID==='notify')   await renderNotify(el);
        else if(TAB_ID==='config'){  el.innerHTML=setupCard(); wireSetup(); }
        wireTabLinks(el);
      }catch(e){ console.error(e); el.innerHTML=`<div class="mp-empty">تعذّر التحميل — تأكد أنك داخل بحساب الأدمن (Google) وأن قواعد قاعدة البيانات المحدّثة منشورة.</div>`; }
    }
    const wireTabLinks = el=>el.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>setTab(b.dataset.goto));

    /* ----- Overview ----- */
    async function renderOverview(el){
      const [uS,pS,bS,sS,payS]=await Promise.all([
        get(child(ref(db),'users')).catch(()=>null),
        get(child(ref(db),'profiles')).catch(()=>null),
        get(child(ref(db),'blogIndex')).catch(()=>null),
        get(child(ref(db),'notifySubs')).catch(()=>null),
        get(child(ref(db),'paymentRequests')).catch(()=>null),
      ]);
      const cnt=s=>s&&s.exists()?Object.keys(s.val()).length:0;
      const pays=payS&&payS.exists()?Object.values(payS.val()):[];
      const pending=pays.filter(r=>r.status==='pending').length;
      const cards=[['المستخدمون',cnt(uS),'users'],['البروفايلات',cnt(pS),'profiles'],
        ['المدونات',cnt(bS),'blogs'],['المشتركون بالإشعارات',cnt(sS),'notify'],
        ['طلبات قيد المراجعة',pending,'payments'],['إجمالي الطلبات',pays.length,'payments']];
      el.innerHTML=`<div class="adm-stats">${cards.map(c=>`<button class="adm-stat" data-goto="${c[2]}"><b>${c[1]}</b><span>${c[0]}</span></button>`).join('')}</div>
        <div class="pm-card" style="margin-top:18px"><h3>تحكّم سريع</h3>
          <div class="adm-quick">
            <button class="btn primary" data-goto="notify" style="width:auto">📢 إرسال إشعار للمستخدمين</button>
            <button class="btn ghost" data-goto="payments" style="width:auto">مراجعة طلبات الاشتراك (${pending})</button>
            <button class="btn ghost" data-goto="users" style="width:auto">إدارة المستخدمين</button>
          </div></div>`;
    }

    /* ----- Users ----- */
    async function renderUsers(el){
      const [uS,premS]=await Promise.all([ get(child(ref(db),'users')), get(child(ref(db),'premium')).catch(()=>null) ]);
      const prem=premS&&premS.exists()?premS.val():{};
      let users=uS.exists()?Object.entries(uS.val()).map(([uid,v])=>({uid,...v})):[];
      users.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      const row=u=>{ const active=premiumActive(prem[u.uid]);
        return `<div class="adm-user">
          <div class="adm-uinfo">
            <div class="adm-utop"><b>${esc(u.username||'مستخدم')}</b>${active?`<span class="pm-vip">${CROWN} مميز</span>`:''}</div>
            <div class="adm-meta" dir="ltr">${esc(u.email||'—')}</div>
            <div class="adm-uid">UID: <code>${esc(u.uid)}</code> · ${esc(u.provider||'بريد')} · ${fmtDay(u.createdAt)}</div>
          </div>
          <div class="adm-uacts">
            ${active?`<button class="btn ghost" data-revoke="${esc(u.uid)}">إلغاء التمييز</button>`:`<button class="btn gold" data-grant="${esc(u.uid)}">تفعيل مميز</button>`}
            <button class="btn ghost" data-mail="${esc(u.email||'')}" data-name="${esc(u.username||'')}">إشعار</button>
            <button class="btn del" data-deluser="${esc(u.uid)}" data-email="${esc(u.email||'')}" data-uname="${esc(u.username||'')}">حذف</button>
          </div></div>`; };
      el.innerHTML=`<div class="adm-search"><input id="admUserSearch" placeholder="ابحث بالاسم أو البريد…" autocomplete="off"/></div>
        <div class="adm-ulist" id="admUlist"></div>`;
      const wire=()=>{
        el.querySelectorAll('[data-grant]').forEach(b=>b.onclick=()=>{ if(confirm('تفعيل الاشتراك المميز لهذا المستخدم؟')) adminGrantPremium(b.dataset.grant,()=>renderUsers(el)); });
        el.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{ if(!confirm('إلغاء العضوية المميزة لهذا المستخدم؟'))return;
          try{ await set(ref(db,'premium/'+b.dataset.revoke),{active:false}); toast('تم الإلغاء'); renderUsers(el); }catch(e){ console.error(e); toast('تعذّر'); } });
        el.querySelectorAll('[data-mail]').forEach(b=>b.onclick=()=>promptSend(b.dataset.mail,b.dataset.name));
        el.querySelectorAll('[data-deluser]').forEach(b=>b.onclick=async()=>{
          if(!confirm('حذف هذا المستخدم نهائياً؟\n(لن تُحذف بروفايلاته/مدونته تلقائياً)'))return;
          const uid=b.dataset.deluser, email=b.dataset.email, uname=b.dataset.uname;
          try{
            await remove(ref(db,'users/'+uid));
            if(email){ try{ await remove(ref(db,'emails/'+encEmail(email))); }catch(e){} }
            if(uname){ try{ await remove(ref(db,'usernames/'+uname)); }catch(e){} }
            try{ await remove(ref(db,'notifySubs/'+uid)); }catch(e){}
            toast('تم حذف المستخدم'); renderUsers(el);
          }catch(e){ console.error(e); toast('تعذّر الحذف'); }
        });
      };
      const draw=arr=>{ $('#admUlist').innerHTML = arr.length?arr.map(row).join(''):'<div class="mp-empty">لا نتائج.</div>'; wire(); };
      draw(users);
      const sb=$('#admUserSearch'); if(sb) sb.oninput=()=>{ const q=sb.value.trim().toLowerCase();
        draw(!q?users:users.filter(u=>((u.username||'')+' '+(u.email||'')).toLowerCase().includes(q))); };
    }

    /* ----- Profiles ----- */
    async function renderProfiles(el){
      const s=await get(child(ref(db),'profiles'));
      let list=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
      list.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      const row=p=>`<div class="adm-citem">
          <div class="adm-cthumb" style="background:${COVERS[p.template]||COVERS.royal}"></div>
          <div class="adm-cinfo"><b>${esc(p.name||'بدون اسم')}</b>
            <div class="adm-meta">${esc(p.ownerName||'')} · ${fmtDay(p.updatedAt)}</div>
            <div class="adm-uid">ID: <code>${esc(p.id)}</code></div></div>
          <div class="adm-cacts"><a class="btn ghost" href="${urlProfileView(p.id)}" target="_blank">عرض</a>
            <button class="btn del" data-delpf="${esc(p.id)}" data-owner="${esc(p.ownerUid||'')}">حذف</button></div>
        </div>`;
      el.innerHTML=`<div class="adm-search"><input id="admPfSearch" placeholder="ابحث بالاسم أو المالك…" autocomplete="off"/></div>
        <div class="adm-clist" id="admPflist"></div>`;
      const draw=arr=>{ $('#admPflist').innerHTML=arr.length?arr.map(row).join(''):'<div class="mp-empty">لا نتائج.</div>';
        el.querySelectorAll('[data-delpf]').forEach(b=>b.onclick=async()=>{ if(!confirm('حذف هذا البروفايل نهائياً؟'))return;
          try{ await remove(ref(db,'profiles/'+b.dataset.delpf)); if(b.dataset.owner) try{ await remove(ref(db,'userProfiles/'+b.dataset.owner+'/'+b.dataset.delpf)); }catch(e){}
            toast('تم الحذف'); renderProfiles(el); }catch(e){ console.error(e); toast('تعذّر'); } }); };
      draw(list);
      const sb=$('#admPfSearch'); if(sb) sb.oninput=()=>{ const q=sb.value.trim().toLowerCase();
        draw(!q?list:list.filter(p=>((p.name||'')+' '+(p.ownerName||'')+' '+(p.id||'')).toLowerCase().includes(q))); };
    }

    /* ----- Blogs ----- */
    async function renderBlogs(el){
      const s=await get(child(ref(db),'blogIndex'));
      let list=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
      list.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      const row=b=>`<div class="adm-citem">
          <div class="adm-cthumb" style="background:${b.cover?`center/cover no-repeat url('${cssUrl(b.cover)}')`:(COVERS[b.design]||COVERS.royal)}"></div>
          <div class="adm-cinfo"><b>${esc(b.title||'مدونة')}</b>
            <div class="adm-meta">${esc(b.author||'')} · ${Number(b.count)||0} مقالة · ${fmtDay(b.updatedAt)}</div>
            <div class="adm-uid">ID: <code>${esc(b.id)}</code></div></div>
          <div class="adm-cacts"><a class="btn ghost" href="${urlBlogView(b.id)}" target="_blank">عرض</a>
            <button class="btn del" data-delblog="${esc(b.id)}">حذف</button></div>
        </div>`;
      el.innerHTML=`<div class="adm-search"><input id="admBgSearch" placeholder="ابحث بعنوان المدونة أو الكاتب…" autocomplete="off"/></div>
        <div class="adm-clist" id="admBglist"></div>`;
      const draw=arr=>{ $('#admBglist').innerHTML=arr.length?arr.map(row).join(''):'<div class="mp-empty">لا نتائج.</div>';
        el.querySelectorAll('[data-delblog]').forEach(b=>b.onclick=async()=>{ if(!confirm('حذف هذه المدونة نهائياً؟'))return;
          const id=b.dataset.delblog;
          try{
            let owner=''; try{ const bs=await get(child(ref(db),'blogs/'+id)); if(bs.exists()) owner=bs.val().ownerUid||''; }catch(e){}
            await remove(ref(db,'blogs/'+id)); await remove(ref(db,'blogIndex/'+id));
            if(owner) try{ await remove(ref(db,'userBlogs/'+owner+'/'+id)); }catch(e){}
            toast('تم الحذف'); renderBlogs(el);
          }catch(e){ console.error(e); toast('تعذّر'); } }); };
      draw(list);
      const sb=$('#admBgSearch'); if(sb) sb.oninput=()=>{ const q=sb.value.trim().toLowerCase();
        draw(!q?list:list.filter(b=>((b.title||'')+' '+(b.author||'')).toLowerCase().includes(q))); };
    }

    /* ----- Payments (subscription requests) ----- */
    async function renderPayments(el){
      const s=await get(child(ref(db),'paymentRequests'));
      let list=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
      list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      const pending=list.filter(r=>r.status==='pending').length;
      const rows=list.length?list.map(r=>`
        <div class="adm-req ${esc(r.status||'pending')}">
          <a class="adm-shot" href="${esc(r.screenshot||'#')}" target="_blank">${r.screenshot?`<img src="${esc(r.screenshot)}" alt="إيصال" loading="lazy"/>`:'<span>لا صورة</span>'}</a>
          <div class="adm-info">
            <div class="adm-top"><b>${esc(r.username||'مستخدم')}</b><span class="adm-amt">${Number(r.amount)||0} ج</span><span class="adm-badge ${esc(r.status||'pending')}">${r.status==='approved'?'مفعّل':r.status==='rejected'?'مرفوض':'قيد المراجعة'}</span></div>
            <div class="adm-meta">${esc(r.email||'')} · ${r.method==='etisalat'?'اتصالات كاش':'انستا باي'} · ${fmtDay(r.createdAt)}</div>
            ${r.note?`<div class="adm-note">📝 ${esc(r.note)}</div>`:''}
            <div class="adm-uid">UID: <code>${esc(r.uid)}</code></div>
            ${r.status==='pending'?`<div class="adm-acts"><button class="btn primary" data-approve="${esc(r.id)}" data-uid="${esc(r.uid)}">${CHECK} تأكيد وتفعيل</button><button class="btn ghost" data-reject="${esc(r.id)}">رفض</button></div>`:''}
          </div></div>`).join(''):`<div class="mp-empty">لا توجد طلبات دفع بعد.</div>`;
      el.innerHTML=`<div class="adm-subhead"><span class="pm-vip">${pending} قيد المراجعة</span></div><div class="adm-list">${rows}</div>`;
      el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{
        const id=b.dataset.approve, uid=b.dataset.uid;
        if(!confirm('تأكيد استلام المبلغ وتفعيل الاشتراك المميز لهذا المستخدم؟')) return;
        b.disabled=true;
        try{ await adminGrantPremium(uid); await set(ref(db,'paymentRequests/'+id+'/status'),'approved'); renderPayments(el); }
        catch(e){ console.error(e); toast('تعذّر التفعيل'); b.disabled=false; }
      });
      el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{
        if(!confirm('رفض هذا الطلب؟')) return;
        try{ await set(ref(db,'paymentRequests/'+b.dataset.reject+'/status'),'rejected'); toast('تم الرفض'); renderPayments(el); }
        catch(e){ console.error(e); toast('تعذّر'); }
      });
    }

    /* ----- Notifications (compose + send + history) ----- */
    async function renderNotify(el){
      el.innerHTML=`
        <div class="pm-card"><h3>إرسال إشعار جديد</h3>
          <div class="field"><label>العنوان</label><input id="ntTitle" placeholder="عنوان الإشعار" maxlength="140"/></div>
          <div class="field"><label>النص</label><textarea id="ntBody" placeholder="اكتب رسالتك للمستخدمين…" maxlength="1000"></textarea></div>
          <div class="field"><label>المُستَقبِلون</label>
            <select id="ntAud" class="mini-select" style="width:100%">
              <option value="all">كل المستخدمين</option>
              <option value="subs">المشتركون في الإشعارات فقط</option>
              <option value="one">مستخدم واحد (بالبريد)</option>
            </select></div>
          <div class="field" id="ntOneWrap" style="display:none"><label>بريد المستخدم</label><input id="ntOne" dir="ltr" placeholder="user@example.com"/></div>
          <label class="adm-check"><input type="checkbox" id="ntEmail" checked/><span>إرسال عبر البريد الإلكتروني أيضاً</span></label>
          <div class="pm-note" id="ntMsg"></div>
          <button class="btn primary" id="ntSend" style="width:100%">📢 إرسال الإشعار</button>
          <div class="pm-note2">يظهر الإشعار داخل الموقع لكل مستخدم عبر جرس الإشعارات، ويُرسَل بالبريد عند تفعيل الخيار.</div>
        </div>
        <div class="pm-card"><h3>الإشعارات المُرسَلة</h3><div id="ntList">${busy()}</div></div>`;
      const audSel=$('#ntAud'); audSel.onchange=()=>{ $('#ntOneWrap').style.display = audSel.value==='one'?'':'none'; };
      $('#ntSend').onclick=async()=>{
        const title=($('#ntTitle').value||'').trim(), bodyv=($('#ntBody').value||'').trim(), msg=$('#ntMsg');
        if(!title){ msg.className='pm-note'; msg.textContent='اكتب عنوان الإشعار'; return; }
        const aud=audSel.value, wantEmail=$('#ntEmail').checked;
        const btn=$('#ntSend'); btn.disabled=true; const old=btn.textContent; btn.textContent='جارٍ الإرسال…';
        try{
          let targetUid='all', recipients=[];
          if(aud==='one'){
            const em=($('#ntOne').value||'').trim().toLowerCase();
            if(!em){ msg.className='pm-note'; msg.textContent='اكتب بريد المستخدم'; btn.disabled=false; btn.textContent=old; return; }
            targetUid=(await emailToUid(em))||'all'; recipients=[{email:em,username:''}];
          }else if(aud==='subs'){
            const s=await get(child(ref(db),'notifySubs')).catch(()=>null);
            recipients=s&&s.exists()?Object.values(s.val()).filter(x=>x.email).map(x=>({email:x.email,username:x.username||''})):[];
          }else{
            const s=await get(child(ref(db),'users')).catch(()=>null);
            recipients=s&&s.exists()?Object.values(s.val()).filter(x=>x.email).map(x=>({email:x.email,username:x.username||''})):[];
          }
          const id=shortId(14);
          await set(ref(db,'announcements/'+id), { title:title.slice(0,140), body:bodyv.slice(0,1000), uid:targetUid, by:(currentUser.email||'admin'), createdAt:Date.now() });
          let sent=0;
          if(wantEmail && emailjsReady()){ for(const r of recipients){ if(await sendUserEmail(r.email,title,bodyv,r.username)) sent++; } }
          msg.className='pm-note ok';
          msg.textContent = wantEmail ? (emailjsReady()?`✓ تم النشر داخل الموقع وإرسال ${sent} بريد`:'✓ تم النشر داخل الموقع (فعّل EmailJS لإرسال البريد)') : '✓ تم نشر الإشعار داخل الموقع';
          $('#ntTitle').value=''; $('#ntBody').value=''; toast('تم إرسال الإشعار ✓'); loadNtList();
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent='تعذّر الإرسال — تأكد من نشر القواعد وأنك أدمن'; }
        finally{ btn.disabled=false; btn.textContent=old; }
      };
      const loadNtList=async()=>{
        const box=$('#ntList'); if(!box) return;
        try{ const s=await get(child(ref(db),'announcements'));
          let list=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
          list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
          box.innerHTML=list.length?list.map(a=>`<div class="adm-nrow">
            <div class="adm-ninfo"><b>${esc(a.title||'')}</b>${a.body?`<span>${esc(a.body.slice(0,120))}</span>`:''}
              <div class="adm-uid">${a.uid&&a.uid!=='all'?'مستخدم محدّد':'الكل'} · ${fmtDay(a.createdAt)}</div></div>
            <button class="btn del" data-delnt="${esc(a.id)}">حذف</button></div>`).join(''):'<div class="mp-empty">لا إشعارات مُرسَلة بعد.</div>';
          box.querySelectorAll('[data-delnt]').forEach(b=>b.onclick=async()=>{ if(!confirm('حذف هذا الإشعار؟'))return;
            try{ await remove(ref(db,'announcements/'+b.dataset.delnt)); toast('تم الحذف'); loadNtList(); }catch(e){ toast('تعذّر'); } });
        }catch(e){ box.innerHTML='<div class="mp-empty">تعذّر التحميل.</div>'; }
      };
      loadNtList();
    }

    /* quick single-user notification (from the Users tab) */
    function promptSend(email, name){
      if(!email){ toast('هذا المستخدم بلا بريد'); return; }
      const title=prompt('عنوان الإشعار:'); if(title===null||!title.trim()) return;
      const body=(prompt('نص الإشعار (اختياري):')||'').trim();
      const t=title.trim();
      emailToUid(email.toLowerCase()).then(uid=>{ const id=shortId(14);
        set(ref(db,'announcements/'+id),{ title:t.slice(0,140), body:body.slice(0,1000), uid:uid||'all', by:(currentUser.email||'admin'), createdAt:Date.now() }).catch(()=>{});
      });
      sendUserEmail(email,t,body,name).then(ok=>toast(ok?'تم إرسال الإشعار والبريد ✓':'تم نشر الإشعار (فعّل EmailJS للبريد)'));
    }

    $('#app').innerHTML = shell(busy()); wireAppbar(); wireTabs();
    renderTab();
  }

  /* ---------- router (multi-page) ----------
     Each section is its own HTML file that tags <body data-page="…">. The router
     renders that section's view, while legacy ?id=/?blog= links keep working on
     any page for backward compatibility with links already shared in the wild. */
  function route(){
    const p=new URLSearchParams(location.search);
    const q=k=>p.get(k);
    const needLogin=fn=>{ if(currentUser) fn(); else gotoLogin(); };
    // legacy query links (old single-page URLs) still resolve everywhere
    if(!PAGE || PAGE==='home'){
      if(q('id')){ showViewer(q('id')); return; }
      if(q('blog')){ showBlogViewer(q('blog')); return; }
      if(p.has('explore')){ showExplore(); return; }
      if(q('edit')){ needLogin(()=>startEdit(q('edit'))); return; }
      if(q('blogedit')){ needLogin(()=>startBlogEdit(q('blogedit'))); return; }
    }
    switch(PAGE){
      case 'view-profile':
        if(!q('id')){ showExplore(); return; }
        showViewer(q('id')); return;
      case 'view-blog':
        if(!q('blog')){ showExplore(); return; }
        showBlogViewer(q('blog')); return;
      case 'explore':     showExplore(); return;
      case 'login':
        if(currentUser){ location.href=q('next')||urlMyProfiles(); return; }
        showAuth('login'); return;
      case 'account':     needLogin(showAccount); return;
      case 'premium':     needLogin(showPremium); return;
      case 'admin':       needLogin(showAdmin); return;
      case 'my-profiles': needLogin(showMyProfiles); return;
      case 'my-blog':     needLogin(showBlogAdmin); return;
      case 'new-profile': needLogin(()=> q('edit')?startEdit(q('edit')):newProfile()); return;
      case 'new-blog':    needLogin(()=> q('blogedit')?startBlogEdit(q('blogedit')):newBlog()); return;
      default:
        // fallback (e.g. a bare index without data-page): dashboard or login
        if(currentUser) showMyProfiles(); else showAuth('login');
    }
  }
  (async function init(){
    const uid=getSession();
    if(!uid){ route(); return; }
    loadAdminEmail();                                  // session-cached: reads the DB only on the first page of a session
    // refresh premium status in the background & cache it for the NEXT navigation only —
    // we never flip the gate mid-view, so the current page stays fully consistent.
    const applyPrem=()=>getPremium(uid).then(pp=>{ try{ const c=getCachedUser()||{}; c.premium=premiumActive(pp); c.cachedAt=Date.now(); localStorage.setItem(USER_KEY, JSON.stringify(c)); }catch(e){} }).catch(()=>{});
    let refreshed=false; try{ refreshed = sessionStorage.getItem(REFRESH_KEY)==='1'; }catch(e){}
    const cached=getCachedUser();
    if(cached && cached.uid===uid){
      // instant render from the local cache — no database read needed
      currentUser=cached; route();
      // touch the database at most ONCE per browser session; later pages use the cache
      if(!refreshed){
        try{ sessionStorage.setItem(REFRESH_KEY,'1'); }catch(e){}
        applyPrem();
        loadUserRecord(uid).then(rec=>{ if(rec){ currentUser={uid, email:rec.email||'', username:rec.username||'مستخدم', photo:rec.photo||''}; cacheUser(currentUser); } }).catch(()=>{});
      }
      return;
    }
    // no cache (first visit / new device): load the record once, then cache it
    try{ sessionStorage.setItem(REFRESH_KEY,'1'); }catch(e){}
    let rec=null;
    try{ rec=await Promise.race([loadUserRecord(uid), new Promise(r=>setTimeout(()=>r(null),8000))]); }catch(e){}
    if(rec){ currentUser={uid, email:rec.email||'', username:rec.username||'مستخدم', photo:rec.photo||''}; cacheUser(currentUser); }
    route(); applyPrem();
  })();