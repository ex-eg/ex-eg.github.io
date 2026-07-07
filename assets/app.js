/* elgoharyX — main application module.
   Firebase, shared helpers and image hosting now live in their own modules:
     firebase.js  → DB/Auth init + re-exported Realtime-DB/Auth helpers
     core.js      → i18n, links, DOM/escape/toast helpers, SEO, error screen, ids
     imagehost.js → imgbb upload (multi-key, admin-managed)
   Everything imported below comes from them, so this file holds only the app's
   screens, router and logic. */
import {
  db, auth, ref, set, get, child, remove, update, increment,
  GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut,
  captchaKeys, dbState, saveDbBackups, setActiveDb
} from './firebase.js';
import {
  ROOT, PAGE, curLang, t, pageUrl,
  urlHome, urlExplore, urlLogin, urlMyProfiles, urlMyBlog, urlNewProfile, urlNewBlog,
  urlProfileView, urlProfileEdit, urlBlogView, urlBlogEdit, gotoLogin,
  LOGO, SUN, MOON, UICON, TAB,
  $, esc, toast, initials, setMeta, seoFor, renderError, fatalError,
  shortId, uniqueShortId, uniqueUserId, shorten
} from './core.js';
import { uploadToImgbb, loadImageKeys, saveImageKeys, clearImageKeysCache, currentImageKeys } from './imagehost.js';
import { logVisit, startPresence, captureReferral, recordReferralIfPending, referralCount } from './site.js';

  const TEMPLATES = [
    {id:'royal',    name:t('الكلاسيكي','Classic')},
    {id:'light',    name:t('الفاتح','Light')},
    {id:'aurora',   name:t('العصري','Modern')},
    {id:'emerald',  name:t('الزمردي','Emerald')},
    {id:'crimson',  name:t('القرمزي','Crimson')},
    {id:'slate',    name:t('الرمادي','Slate')},
    {id:'midnight', name:t('منتصف الليل','Midnight')},
    {id:'sand',     name:t('الرملي','Sand')},
    {id:'rose',     name:t('الوردي','Rose')},
    {id:'teal',     name:t('الفيروزي','Teal')},
    {id:'sunset',   name:t('الغروب','Sunset')},
    {id:'mono',     name:t('أحادي','Mono')},
    {id:'forest',   name:t('الغابة','Forest')},
    {id:'ocean',    name:t('المحيط','Ocean')},
    {id:'plum',     name:t('البرقوقي','Plum')},
    {id:'bronze',   name:t('البرونزي','Bronze')},
    {id:'ice',      name:t('الجليدي','Ice')},
    {id:'graphite', name:t('الجرافيت','Graphite')},
    {id:'lavender', name:t('الخزامى','Lavender')},
    {id:'burgundy', name:t('النبيذي','Burgundy')},
    {id:'indigo',   name:t('النيلي','Indigo')},
    {id:'neon',     name:t('النيون','Neon')},
    {id:'ruby',     name:t('الياقوتي','Ruby')},
    {id:'coral',    name:t('المرجاني','Coral')},
    {id:'mint',     name:t('النعناعي','Mint')},
    {id:'steel',    name:t('الفولاذي','Steel')},
    {id:'gold',     name:t('الذهبي','Gold')},
    {id:'sapphire', name:t('الياقوت الأزرق','Blue Sapphire')},
    {id:'obsidian', name:t('السبج','Obsidian')},
    {id:'pearl',    name:t('اللؤلؤي','Pearl')},
    {id:'jade',     name:t('اليشمي','Jade')},
    {id:'amber',    name:t('الكهرماني','Amber')},
    {id:'cocoa',    name:t('الكاكاو','Cocoa')},
    {id:'denim',    name:t('الجينز','Denim')},
    {id:'turquoise',name:t('التركوازي','Turquoise')},
    {id:'magenta',  name:t('الماجنتا','Magenta')},
    {id:'lime',     name:t('الليموني','Lime')},
    {id:'peach',    name:t('الخوخي','Peach')},
    {id:'navy',     name:t('الكحلي','Navy')},
    {id:'charcoal', name:t('الفحمي','Charcoal')},
    {id:'berry',    name:t('التوتي','Berry')},
    {id:'sky',      name:t('السماوي','Sky')},
    {id:'moss',     name:t('الطحلبي','Moss')},
    {id:'tangerine',name:t('اليوسفي','Tangerine')},
    {id:'orchid',   name:t('الأوركيد','Orchid')},
    {id:'cobalt',   name:t('الكوبالت','Cobalt')},
    {id:'blush',    name:t('الوردي الناعم','Soft Pink')},
    {id:'seafoam',  name:t('زبد البحر','Seafoam')},
  ];

  const BASE_LAYOUTS = [
    {id:'classic', name:t('الكلاسيكي','Classic'), desc:t('غلاف + أقسام','Cover plus sections'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="8" fill="currentColor" opacity=".35"/><circle cx="10" cy="11" r="4" fill="currentColor"/><rect x="17" y="14" width="18" height="2" fill="currentColor"/><rect x="6" y="20" width="28" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'sidebar', name:t('السيرة (عمودين)','Resume (two columns)'), desc:t('شريط جانبي','Sidebar'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="14" height="26" fill="currentColor" opacity=".35"/><circle cx="8" cy="9" r="3.5" fill="currentColor"/><rect x="19" y="6" width="16" height="2" fill="currentColor"/><rect x="19" y="12" width="16" height="2" fill="currentColor" opacity=".6"/><rect x="19" y="18" width="12" height="2" fill="currentColor" opacity=".4"/></svg>'},
    {id:'hero', name:t('البطل','Hero'), desc:t('اسم فوق الغلاف','Name over cover'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="15" fill="currentColor" opacity=".35"/><circle cx="20" cy="8" r="4" fill="currentColor"/><rect x="12" y="20" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'minimal', name:t('المبسّط','Minimal'), desc:t('موسّط بلا غلاف','Centered, no cover'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><circle cx="20" cy="8" r="4" fill="currentColor"/><rect x="12" y="15" width="16" height="2" fill="currentColor"/><rect x="15" y="20" width="10" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'bento', name:t('البطاقات','Cards'), desc:t('شبكة مربّعات','Grid of tiles'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="4" y="4" width="14" height="9" rx="1.5" fill="currentColor" opacity=".5"/><rect x="21" y="4" width="15" height="9" rx="1.5" fill="currentColor" opacity=".3"/><rect x="4" y="16" width="32" height="8" rx="1.5" fill="currentColor" opacity=".4"/></svg>'},
    {id:'fullphoto', name:t('صورة كاملة','Full photo'), desc:t('خلفية بالصورة','Photo background'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="currentColor" opacity=".3"/><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="5" y="18" width="20" height="2.5" fill="currentColor"/><rect x="5" y="22" width="12" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'timeline', name:t('المسار','Timeline'), desc:t('خط زمني','Time line'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><line x1="10" y1="6" x2="10" y2="23" stroke="currentColor"/><circle cx="10" cy="9" r="2" fill="currentColor"/><circle cx="10" cy="15" r="2" fill="currentColor"/><circle cx="10" cy="21" r="2" fill="currentColor"/><rect x="15" y="8" width="18" height="2" fill="currentColor" opacity=".6"/><rect x="15" y="14" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'magazine', name:t('المجلة','Magazine'), desc:t('اسم كبير + أعمدة','Big name plus columns'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="5" y="5" width="22" height="5" fill="currentColor"/><rect x="5" y="14" width="14" height="2" fill="currentColor" opacity=".5"/><rect x="5" y="18" width="14" height="2" fill="currentColor" opacity=".5"/><rect x="22" y="14" width="13" height="2" fill="currentColor" opacity=".5"/><rect x="22" y="18" width="13" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'badge', name:t('البطاقة التعريفية','ID badge'), desc:t('ID بشريط','ID with lanyard'),
      icon:'<svg viewBox="0 0 40 28"><rect x="7" y="1" width="26" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="17" y="3" width="6" height="2" rx="1" fill="currentColor"/><circle cx="20" cy="12" r="4" fill="currentColor"/><rect x="12" y="19" width="16" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'terminal', name:t('الطرفية','Terminal'), desc:t('نافذة كود','Code window'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="1" y="1" width="38" height="7" fill="currentColor" opacity=".3"/><circle cx="6" cy="4.5" r="1.3" fill="currentColor"/><circle cx="11" cy="4.5" r="1.3" fill="currentColor"/><circle cx="16" cy="4.5" r="1.3" fill="currentColor"/><rect x="5" y="13" width="16" height="2" fill="currentColor" opacity=".7"/><rect x="5" y="18" width="24" height="2" fill="currentColor" opacity=".5"/></svg>'},
    {id:'polaroid', name:t('البولارويد','Polaroid'), desc:t('صورة مائلة','Tilted photo'),
      icon:'<svg viewBox="0 0 40 28"><g transform="rotate(-6 20 14)"><rect x="12" y="4" width="16" height="20" rx="1.5" fill="currentColor" opacity=".25" stroke="currentColor"/><rect x="14" y="6" width="12" height="12" fill="currentColor" opacity=".6"/><rect x="15" y="20" width="10" height="2" fill="currentColor"/></g></svg>'},
    {id:'diagonal', name:t('القطري','Diagonal'), desc:t('انقسام مائل','Slanted split'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><path d="M1 1 H39 V13 L1 21 Z" fill="currentColor" opacity=".3"/><circle cx="12" cy="9" r="3" fill="currentColor"/></svg>'},
    {id:'compact', name:t('المدمج','Compact'), desc:t('بطاقة أفقية','Horizontal card'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="8" width="38" height="12" rx="3" fill="none" stroke="currentColor"/><circle cx="9" cy="14" r="3.5" fill="currentColor"/><rect x="16" y="11" width="18" height="2" fill="currentColor"/><rect x="16" y="15" width="12" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'framed', name:t('الشهادة','Certificate'), desc:t('إطار مزخرف','Decorative frame'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><rect x="4" y="4" width="32" height="20" rx="1.5" fill="none" stroke="currentColor" opacity=".55"/><circle cx="20" cy="11" r="3" fill="currentColor"/><rect x="13" y="17" width="14" height="2" fill="currentColor" opacity=".6"/></svg>'},
    {id:'spotlight', name:t('الأضواء','Spotlight'), desc:t('توهّج درامي','Dramatic glow'),
      icon:'<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="3" fill="none" stroke="currentColor"/><circle cx="20" cy="12" r="8" fill="currentColor" opacity=".22"/><circle cx="20" cy="11" r="4" fill="currentColor"/><rect x="13" y="19" width="14" height="2" fill="currentColor" opacity=".6"/></svg>'},
  ];

  /* 100 layout variants = 15 base structures × visual modifiers (avatar shape · font · accent) */
  const _AV=[['',''],['av-rounded',t('مربّع دائري','Rounded square')],['av-square',t('مربّع','Square')],['av-hex',t('سداسي','Hexagon')]];
  const _FN=[['',''],['fn-sans',t('خط سانس','Sans font')],['fn-mono',t('خط مونو','Mono font')]];
  const _AC=[['',''],['ac-ring',t('حلقة','Ring')],['ac-underline',t('خط سفلي','Underline')],['ac-bar',t('شريط جانبي','Side bar')]];
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
    {id:'none', name:t('بدون','None')}, {id:'fade', name:t('تلاشٍ','Fade')}, {id:'rise', name:t('صعود','Rise')},
    {id:'zoom', name:t('تكبير','Zoom')}, {id:'flip', name:t('انقلاب','Flip')}, {id:'blur', name:t('ضبابي','Blur')}, {id:'slide', name:t('انزلاق','Slide')},
  ];
  /* 10 continuous 3D motions (applied to a wrapper so they don't clash with hover-tilt / entrance) */
  const MOTIONS = [
    {id:'none', name:t('بدون','None')}, {id:'float', name:t('عائم','Float')}, {id:'sway', name:t('تمايل','Sway')},
    {id:'pendulum', name:t('بندول','Pendulum')}, {id:'spin', name:t('دوران','Spin')}, {id:'flip', name:t('انقلاب','Flip')},
    {id:'depth', name:t('عمق نابض','Pulsing depth')}, {id:'wobble', name:t('تذبذب','Wobble')}, {id:'orbit', name:t('مداري','Orbit')},
    {id:'breathe', name:t('تنفّس','Breathe')}, {id:'tiltloop', name:t('إمالة دائرية','Tilt loop')},
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
    return `<span class="pf-kicker">${esc(d.kicker||t('أستاذ دكتور · Professor','Professor · Professor'))}</span>
      <h1 class="pf-name">${esc(d.name||t('الاسم','Name'))}${nameEn}</h1>
      ${d.role?`<p class="pf-role">${esc(d.role)}</p>`:''}`;
  }
  const secHead=(en,ar)=>`<div class="pf-sec">${en} <span class="line"></span><span class="ar">${ar}</span></div>`;
  const pfAbout=d=>d.about?`<p class="pf-about">${esc(d.about)}</p>`:'';
  const pfDetails=d=>`<div class="pf-info">
      ${d.university?infoItem('uni',t('الجامعة','University'),d.university):''}
      ${d.specialization?infoItem('spec',t('التخصص','Specialization'),d.specialization):''}
      ${d.degree?infoItem('deg',t('الدرجة العلمية','Academic degree'),d.degree):''}
      ${d.interests?infoItem('int',t('الاهتمامات البحثية','Research interests'),d.interests):''}
    </div>`;
  const extUrl=v=>/^https?:\/\//i.test(v)?v:'https://'+v;
  const CONTACT_TYPES = {
    whatsapp:{name:t('واتساب','WhatsApp'), href:v=>'https://wa.me/'+String(v).replace(/[^\d]/g,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.6-5.9c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5s-.6-1.4-.8-1.9-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3c-.3.3-1 .9-1 2.2s1 2.6 1.1 2.8 2 3.1 4.9 4.3c1.8.8 2.5.9 3.4.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.3-.2-.6-.3Z"/></svg>'},
    telegram:{name:t('تيليجرام','Telegram'), href:v=>/^https?:/i.test(v)?v:'https://t.me/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.2-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.9 13 2.3 11.6c-1-.3-1-1 .2-1.5l18.2-7c.8-.3 1.5.2 1.2 1.2Z"/></svg>'},
    linkedin:{name:t('لينكدإن','LinkedIn'), href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.55 22 10.5 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z"/></svg>'},
    twitter:{name:t('X (تويتر)','X (Twitter)'), href:v=>/^https?:/i.test(v)?v:'https://x.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L22 21h-6l-4.3-5.6L6.8 21H3.7l7-8L2.5 3h6.1l3.9 5.2L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z"/></svg>'},
    facebook:{name:t('فيسبوك','Facebook'), href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8H16l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z"/></svg>'},
    instagram:{name:t('إنستغرام','Instagram'), href:v=>/^https?:/i.test(v)?v:'https://instagram.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'},
    youtube:{name:t('يوتيوب','YouTube'), href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5.2 3-5.2 3Z"/></svg>'},
    website:{name:t('الموقع الإلكتروني','Website'), href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>'},
    github:{name:'GitHub', href:v=>/^https?:/i.test(v)?v:'https://github.com/'+String(v).replace(/^@/,''), icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.6 4.9.3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>'},
    scholar:{name:'Google Scholar', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 8l11 6 9-4.9V16h2V8L12 2Zm-7 9.3v3.2C5 16.4 8.1 18 12 18s7-1.6 7-3.5v-3.2l-7 3.8-7-3.8Z"/></svg>'},
    researchgate:{name:'ResearchGate', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm2.6 14-2.2-3.4h-1.3V16H9.4V8.2h3c1.7 0 2.8 1 2.8 2.5 0 1.1-.6 1.9-1.6 2.3L16 16h-1.4Zm-2.3-6.6h-1.2v2.4h1.2c.9 0 1.5-.5 1.5-1.2 0-.8-.6-1.2-1.5-1.2Z"/></svg>'},
    orcid:{name:'ORCID', href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.7 7.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm.9 3.1H8v6.4h1.6v-6.4Zm2 0v6.4h2.5c2 0 3.4-1.4 3.4-3.2s-1.4-3.2-3.4-3.2h-2.5Zm1.6 1.4h.8c1.2 0 1.9.7 1.9 1.8s-.7 1.8-1.9 1.8h-.8v-3.6Z"/></svg>'},
    location:{name:t('الموقع الجغرافي','Location'), href:extUrl, icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'},
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
      ${d.email?`<a class="pf-btn pri" href="mailto:${esc(d.email)}">${IC.mail} ${t('البريد الإلكتروني','Email')}</a>
      <button class="pf-btn au" data-copy="${esc(d.email)}">${IC.copy} ${t('نسخ البريد','Copy email')}</button>`:''}
      ${d.phone?`<a class="pf-btn gh" href="tel:${esc(d.phone)}">${IC.phone} ${t('اتصال هاتفي','Call')}</a>`:''}
    </div>`:'';
    return btns+pfLinks(d);
  };
  const pfCover=d=>`<div class="pf-cover"><div class="lines"></div><div class="glow"></div>${SEAL}
      <div class="pf-est"><div class="en">${esc(d.universityEn||t('University','University'))}</div>
        <div class="ar">${esc(d.university||'')}${d.faculty?' — '+esc(d.faculty):''}</div></div></div>`;
  const photoOrInit=d=>d.photo?`<img src="${esc(d.photo)}" alt="${esc(d.name)}" style="${imgStyle(d)}" onerror="this.remove()"/>`:esc(initials(d.name));
  const cssUrl=u=>String(u||'').replace(/["'()\\<>\s]/g,m=>encodeURIComponent(m));
  const detailRows=d=>[[t('الجامعة','University'),d.university],[t('التخصص','Specialization'),d.specialization],[t('الدرجة العلمية','Academic degree'),d.degree],[t('الاهتمامات البحثية','Research interests'),d.interests]].filter(r=>r[1]);
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
    return `<div class="pf-gallery">${a.map((u,i)=>`<a class="pf-gitem" href="${esc(u)}" target="_blank" rel="noopener" title="${t('عرض الصورة','View image')}"><img src="${esc(u)}" alt="${t('صورة','Image')} ${i+1}" loading="lazy" onerror="this.closest('.pf-gitem').remove()"/></a>`).join('')}</div>`; };
  const pfVideos=d=>{ const a=videosArr(d); if(!a.length) return '';
    return `<div class="pf-videos">${a.map(id=>`<div class="pf-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${t('فيديو يوتيوب','YouTube video')}" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`).join('')}</div>`; };
  const pfMedia=d=>{ if(!hasMedia(d)) return '';
    const g=pfGallery(d), v=pfVideos(d);
    return `<div class="pf-media">
      ${g?`${secHead('Gallery',t('معرض الصور','Image gallery'))}${g}`:''}
      ${v?`${secHead('Videos',t('فيديوهات','Videos'))}${v}`:''}
    </div>`; };

  const LAYOUT_FN = {
    classic:d=>`${pfCover(d)}<div class="pf-inner">
        <div class="pf-top">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="pf-div"></div>${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}`:''}
        <div class="pf-div"></div>${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact',t('التواصل','Contact'))}
          <p class="pf-contact-p">${esc(d.contactNote||t('يسعدني تواصلكم للاستفسارات الأكاديمية أو الإشراف البحثي أو التعاون العلمي.','I welcome your messages for academic inquiries, research supervision, or scientific collaboration.'))}</p>${pfContact(d)}`:''}
      </div>`,
    sidebar:d=>`<div class="pf-side">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
        ${hasContact(d)?`<div class="pf-side-contact">${pfContact(d)}</div>`:''}</div>
      <div class="pf-main">
        ${d.about?`${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
      </div>`,
    hero:d=>`<div class="pf-hero"><div class="pf-hero-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div></div>
      <div class="pf-inner">
        ${d.about?`${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact',t('التواصل','Contact'))}${pfContact(d)}`:''}
      </div>`,
    minimal:d=>`<div class="pf-inner">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
        ${d.about?`<div class="pf-div"></div>${pfAbout(d)}`:''}
        <div class="pf-div"></div>${pfDetails(d)}
        ${hasContact(d)?`<div style="height:22px"></div>${pfContact(d)}`:''}
      </div>`,
    bento:d=>`<div class="pf-bento">
        <div class="bento-tile hero">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="bento-tile about"><div class="tile-h">${t('نبذة تعريفية','About')}</div>${pfAbout(d)}</div>`:''}
        <div class="bento-tile det"><div class="tile-h">${t('بيانات أساسية','Basic details')}</div>${pfDetails(d)}</div>
        ${hasContact(d)?`<div class="bento-tile ct"><div class="tile-h">${t('التواصل','Contact')}</div>${pfContact(d)}</div>`:''}
      </div>`,

    fullphoto:d=>`<div class="pf-fp">
        ${d.photo?`<img class="fp-img" src="${esc(d.photo)}" alt="${esc(d.name)}" style="${imgStyle(d)}" onerror="this.remove()"/>`:''}
        <div class="fp-scrim"></div><div class="fp-inner"><div class="pf-who">${pfWho(d)}</div></div>
      </div>
      <div class="pf-inner">
        ${d.about?`${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact',t('التواصل','Contact'))}${pfContact(d)}`:''}
      </div>`,

    timeline:d=>`${pfCover(d)}<div class="pf-inner">
        <div class="pf-top">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        ${d.about?`<div class="pf-div"></div>${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}`:''}
        <div class="pf-div"></div>${secHead('Timeline',t('المسار الأكاديمي','Academic timeline'))}
        <div class="pf-timeline">${timelineItems(d)}</div>
        ${hasContact(d)?`<div class="pf-div"></div>${secHead('Contact',t('التواصل','Contact'))}${pfContact(d)}`:''}
      </div>`,

    magazine:d=>`<div class="pf-inner mag">
        <div class="mag-head">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div></div>
        <div class="pf-div"></div>
        ${d.about?`<div class="mag-about">${esc(d.about)}</div><div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
        ${hasContact(d)?`<div class="pf-div"></div>${pfContact(d)}`:''}
      </div>`,

    badge:d=>`<div class="pf-badge">
        <div class="badge-hole"></div>
        <div class="badge-body">${pfAvatar(d)}<div class="pf-who">${pfWho(d)}</div>
          <div class="badge-info">${pfDetails(d)}</div>${pfContact(d)}</div>
        <div class="badge-foot">ACADEMIC · ${t('بطاقة تعريف أكاديمية','Academic ID card')}</div>
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
        ${d.about?`${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
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
        ${d.about?`${secHead('Profile',t('نبذة تعريفية','About'))}${pfAbout(d)}<div class="pf-div"></div>`:''}
        ${secHead('Details',t('بيانات أساسية','Basic details'))}${pfDetails(d)}
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
      b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.copy);toast(t('تم نسخ البريد ✓','Email copied ✓'));};
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
        toast(on?t('اسحب لتحريك الصورة · مرّر العجلة للتكبير · دبل كليك للإنهاء','Drag to move the image · scroll to zoom · double-click to finish'):t('تم حفظ الصورة ✓','Image saved ✓'));
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
    kicker:t('أستاذ دكتور · Professor','Professor'),
    name:'Prof. Dr. Mona El-Fiky', nameEn:'',
    role:t('أستاذ بقسم هندسة الحاسبات والذكاء الاصطناعي — كلية الهندسة، جامعة القاهرة.','Professor of Computer Engineering and Artificial Intelligence — Faculty of Engineering, Cairo University.'),
    about:t('أستاذ جامعي وباحث بخبرة تتجاوز عشرين عاماً في مجالات الذكاء الاصطناعي وتعلّم الآلة ومعالجة اللغة الطبيعية. أُشرف على طلاب الدراسات العليا وأقود عدداً من المشروعات البحثية، وأسعى دائماً لربط المعرفة الأكاديمية بالتطبيقات العملية التي تخدم المجتمع.','A university professor and researcher with over twenty years of experience in artificial intelligence, machine learning, and natural language processing. I supervise graduate students, lead several research projects, and always strive to connect academic knowledge with practical applications that serve society.'),
    university:t('جامعة القاهرة','Cairo University'), universityEn:'Cairo University', faculty:t('كلية الهندسة','Faculty of Engineering'),
    specialization:t('ذكاء اصطناعي · تعلّم آلة','Artificial Intelligence · Machine Learning'), degree:t('أستاذ دكتور','Professor'), interests:'',
    threeD:false, anim:'rise', motion3d:'none', photoPos:'50% 50%', photoZoom:1, links:[], gallery:[], videos:[],
    email:'s.elazhary@cu.edu.eg', phone:'+20221000000',
    photo:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2A4UZQ9zLBWdO3oDvM9HfmLz8Hg8rne9GB-KEAnm6Y-_iJF4r4NdGMEPInRzrrw9Zuye-HTDCXIIK6FZh3Sgx3HqboQLkzRNLf9cksKCDp4xgydAs4kHCBayiP3JG1K17PDI2oVFN7YD9p88plFVjs60BfX3I7qGoKe_yjX5Vu7dlgY1zxYhpUwStKsc/s1600/a5b90f46-0789-4e9b-a41c-a2e054810503.jpg',
  };
  const EMPTY = {
    template:'royal', layout:'classic', kicker:t('أستاذ دكتور · Professor','Professor'),
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
    document.title=t('محتوى محمي — elgoharyX','Protected Content — elgoharyX');
    $('#app').innerHTML=`
      <div class="lock-wrap"><div class="lock-card">
        <div class="lock-ic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4"/></svg></div>
        <h2 class="lock-title">${t('هذا المحتوى محمي بكلمة مرور','This content is password protected')}</h2>
        <p class="lock-sub">${t('أدخل كلمة المرور التي شاركها معك صاحب الرابط لعرض المحتوى.','Enter the password the link owner shared with you to view the content.')}</p>
        <div class="lock-err" id="lockErr"></div>
        <div class="field"><input id="lockPass" type="password" placeholder="${t('كلمة المرور','Password')}" autocomplete="off" style="text-align:center;letter-spacing:2px"/></div>
        <button class="btn primary" id="lockGo">${t('فتح المحتوى','Unlock content')}</button>
        <a class="lock-home" href="${urlHome()}">${t('العودة للرئيسية','Back to Home')}</a>
      </div></div>`;
    const inp=$('#lockPass'), err=$('#lockErr');
    const attempt=async()=>{
      err.textContent='';
      const val=inp.value;
      if(!val){ err.textContent=t('أدخل كلمة المرور','Enter the password'); return; }
      const go=$('#lockGo'); go.disabled=true; const old=go.textContent; go.textContent=t('جارٍ التحقق…','Verifying…');
      const h=await hashViewPass(rec.viewSalt||'',val);
      if(h===rec.viewPassHash){ markUnlocked(kind,id); onUnlock(); }
      else{ err.textContent=t('كلمة المرور غير صحيحة','Incorrect password'); go.disabled=false; go.textContent=old; inp.value=''; inp.focus(); }
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
    : `<span class="${cls}">${esc(initials(currentUser?currentUser.username:t('؟','?')))}</span>`;
  /* skeleton placeholders shown while lists load (shimmer) */
  const skelCard=()=>`<div class="skel-card"><div class="skel skel-cover"></div><div class="skel-body">`
    +`<div class="skel skel-chip"></div><div class="skel skel-line w90"></div><div class="skel skel-line w60"></div>`
    +`<div class="skel-foot"><span class="skel skel-av"></span><span class="skel skel-line w40" style="flex:1"></span></div></div></div>`;
  const skelGrid=(n=6)=>`<div class="skel-grid">${Array.from({length:n},skelCard).join('')}</div>`;
  function appbar(active){
    const right = currentUser ? `
        <button class="btn ghost ab-only" data-act="mode" title="${t('الوضع','Theme')}" style="padding:9px 12px">${modeIcon()}</button>
        <div class="ab-nav">
          <a class="btn ghost" href="${urlExplore()}" style="padding:9px 15px;font-size:13px${active==='explore'?';border-color:var(--gold);color:var(--txt)':''}">${t('استكشف','Explore')}</a>
          <a class="btn ghost" href="${urlMyProfiles()}" style="padding:9px 15px;font-size:13px${active==='mine'?';border-color:var(--gold);color:var(--txt)':''}">${t('بروفايلاتي','My Profiles')}</a>
          <a class="btn ghost" href="${urlMyBlog()}" style="padding:9px 15px;font-size:13px${active==='blogs'?';border-color:var(--gold);color:var(--txt)':''}">${t('مدونتي','My Blog')}</a>
          <a class="btn ghost" href="${urlNewProfile()}" style="padding:9px 15px;font-size:13px">${t('+ بروفايل','+ Profile')}</a>
          <a class="btn ghost" href="${urlNewBlog()}" style="padding:9px 15px;font-size:13px">${t('+ مدونة','+ Blog')}</a>
          <a class="btn ghost ab-vip" href="${pageUrl('premium.html')}" style="padding:9px 14px;font-size:13px${active==='premium'?';border-color:var(--gold);color:var(--txt)':''}">${CROWN}<span>${t('مميز','Premium')}</span></a>
          ${isAdmin()?`<a class="btn ghost" href="${pageUrl('admin.html')}" style="padding:9px 13px;font-size:13px${active==='admin'?';border-color:var(--gold);color:var(--txt)':''}">${t('الأدمن','Admin')}</a>`:''}
          <button class="btn ghost" data-act="logout" style="padding:9px 13px;font-size:13px">${t('خروج','Log out')}</button>
        </div>
        <button class="btn ghost ab-bell" data-act="bell" title="${t('الإشعارات','Notifications')}" style="padding:9px 12px;position:relative">${BELL}<span class="bell-dot" id="bellDot" hidden></span></button>
        <a class="user-chip" href="${pageUrl('account.html')}" title="${t('الملف الشخصي','Profile')}">${userAvatar('avatar-sm')}<span class="uc-name">${esc(currentUser.username)}</span></a>
        <button class="ab-burger" data-act="menu" aria-label="${t('القائمة','Menu')}">${TAB.burger}</button>`
      : `<button class="btn ghost" data-act="mode" title="${t('الوضع','Theme')}" style="padding:9px 12px">${modeIcon()}</button>
         <a class="btn ghost" href="${urlExplore()}" style="padding:9px 15px;font-size:13px${active==='explore'?';border-color:var(--gold);color:var(--txt)':''}">${t('استكشف المدونات','Explore Blogs')}</a>
         <a class="btn ghost" href="${urlLogin()}" style="padding:9px 16px;font-size:13px">${t('تسجيل الدخول','Log in')}</a>`;
    const premiumCls = (currentUser && currentUser.premium) ? ' ab-premium' : '';
    const langBtn = `<button class="lang-toggle ab-lang" data-act="lang" aria-label="Language"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg><span class="lt-label"></span></button>`;
    return `<div class="appbar${premiumCls}">
      <a class="brand" href="${urlHome()}" style="text-decoration:none;color:inherit"><span class="mark"><img src="${LOGO}" alt="elgoharyX"/></span>
        Academic Profiles <span class="ar">${t('· منشئ البروفايلات','· Profile Builder')}</span></a>
      <div class="ab-right">${langBtn}${right}</div>
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
          <div class="db-t"><b>Academic Profiles</b><span>${t('منشئ البروفايلات','Profile Builder')} · elgoharyX</span></div>
          <button class="dr-x" data-act="menu-close" aria-label="${t('إغلاق','Close')}">${TAB.x}</button>
        </div>
        <a class="drawer-head" href="${pageUrl('account.html')}" style="text-decoration:none">
          ${userAvatar('avatar-sm dr-av')}
          <div class="dr-id"><div class="dr-name">${esc(currentUser.username)}</div><div class="dr-sub">${esc(currentUser.email||t('حساب elgoharyX','elgoharyX account'))}</div></div>
        </a>
        <nav class="drawer-nav">
          <a class="dr-item ${active==='account'?'on':''}" href="${pageUrl('account.html')}">${UICON.person}<span>${t('الملف الشخصي','Profile')}</span></a>
          <a class="dr-item dr-vip ${active==='premium'?'on':''}" href="${pageUrl('premium.html')}">${CROWN}<span>${t('الاشتراك المميز','Premium')}</span></a>
          <button class="dr-item" data-act="invite"><span style="font-size:18px">🎁</span><span>${t('ادعُ أصدقاءك — بريميوم مجاني','Invite friends — free Premium')}</span></button>
          ${isAdmin()?`<a class="dr-item ${active==='admin'?'on':''}" href="${pageUrl('admin.html')}">${TAB.privacy}<span>${t('لوحة الأدمن','Admin')}</span></a>`:''}
          <a class="dr-item ${active==='explore'?'on':''}" href="${urlExplore()}">${TAB.cards}<span>${t('استكشف المدونات','Explore Blogs')}</span></a>
          <a class="dr-item ${active==='mine'?'on':''}" href="${urlMyProfiles()}">${TAB.cards}<span>${t('بروفايلاتي','My Profiles')}</span></a>
          <a class="dr-item ${active==='blogs'?'on':''}" href="${urlMyBlog()}">${TAB.cards}<span>${t('مدونتي','My Blog')}</span></a>
          <a class="dr-item ${active==='build'?'on':''}" href="${urlNewProfile()}">${TAB.plus}<span>${t('بروفايل جديد','New Profile')}</span></a>
          <a class="dr-item" href="${urlNewBlog()}">${TAB.plus}<span>${t('مدونة جديدة','New Blog')}</span></a>
          <button class="dr-item" data-act="mode">${TAB.mode}<span>${t('تبديل الوضع (ليلي / نهاري)','Toggle theme (dark / light)')}</span></button>
          <div class="dr-sep"></div>
          <div class="dr-label">${t('المساعدة والمعلومات','Help and Info')}</div>
          <a class="dr-item" href="${pageUrl('how-to.html')}">${TAB.howto}<span>${t('كيفية إنشاء بروفايل','How to create a profile')}</span></a>
          <a class="dr-item" href="${pageUrl('privacy.html')}">${TAB.privacy}<span>${t('سياسة الخصوصية','Privacy Policy')}</span></a>
          <a class="dr-item" href="${pageUrl('support.html')}">${TAB.support}<span>${t('الدعم والمساعدة','Support and Help')}</span></a>
          <a class="dr-item" href="${pageUrl('about.html')}">${TAB.howto}<span>${t('عن الموقع','About')}</span></a>
          <div class="dr-sep"></div>
          <button class="dr-item danger" data-act="logout">${TAB.logout}<span>${t('تسجيل الخروج','Log out')}</span></button>
        </nav>
        <div class="drawer-foot"><img src="${LOGO}" alt="elgoharyX"/><span>© 2026 <b>elgoharyX</b> — ${t('جميع الحقوق محفوظة','All rights reserved')}</span></div>
      </aside>
    </div>`;
  }
  /* ---------- info pages (privacy / how-to / support) shown as a sheet ---------- */
  /*  ⚙️  عدّل بيانات التواصل بالأسفل بمعلوماتك الحقيقية  */
  const SUPPORT = { email:'elgoharyx.help@gmail.com', whatsapp:'https://wa.me/00000000000' };
  const INFO = {
    howto:{
      icon:TAB.howto, title:t('كيفية إنشاء بروفايل','How to create a profile'),
      html:`<p>${t('أنشئ بروفايلك الأكاديمي الاحترافي وشاركه برابط دائم في خطوات بسيطة:','Create your professional academic profile and share it with a permanent link in simple steps:')}</p>
        <div class="step"><span class="n">1</span><div class="stx"><b>${t('سجّل الدخول','Log in')}</b>${t('أنشئ حساباً جديداً أو ادخل بحسابك الحالي.','Create a new account or sign in with your existing one.')}</div></div>
        <div class="step"><span class="n">2</span><div class="stx"><b>${t('ابدأ بروفايلاً جديداً','Start a new profile')}</b>${t('اضغط «بروفايل جديد» من القائمة الجانبية أو الشريط العلوي.','Press New Profile from the side menu or the top bar.')}</div></div>
        <div class="step"><span class="n">3</span><div class="stx"><b>${t('البيانات الأساسية','Basic information')}</b>${t('عبّئ الاسم، المسمّى العلمي، المنصب، النبذة، الجامعة والكلية والتخصص.','Fill in the name, academic title, position, bio, university, faculty and specialization.')}</div></div>
        <div class="step"><span class="n">4</span><div class="stx"><b>${t('التصميم','Design')}</b>${t('اختر التخطيط المناسب واللون من بين أكثر من 100 تخطيط و48 لوناً، وفعّل مؤثرات 3D وحركة الظهور إن رغبت.','Choose a suitable layout and color from over 100 layouts and 48 colors, and enable 3D effects and entrance animation if you like.')}</div></div>
        <div class="step"><span class="n">5</span><div class="stx"><b>${t('الصورة الشخصية','Profile photo')}</b>${t('ارفع صورتك أو ألصق رابطها، ثم اضبط موضعها وتكبيرها داخل الإطار.','Upload your photo or paste its link, then adjust its position and zoom inside the frame.')}</div></div>
        <div class="step"><span class="n">6</span><div class="stx"><b>${t('وسائل التواصل','Contact channels')}</b>${t('أضف بريدك ورقم هاتفك وأي وسائل تواصل أخرى.','Add your email, phone number and any other contact channels.')}</div></div>
        <div class="step"><span class="n">7</span><div class="stx"><b>${t('أنشئ الرابط','Create the link')}</b>${t('اضغط «إنشاء الرابط وحفظه» ليُحفظ بروفايلك ويُنشأ رابط دائم ومختصر تلقائياً.','Press Create and save link so your profile is saved and a permanent short link is generated automatically.')}</div></div>
        <div class="step"><span class="n">8</span><div class="stx"><b>${t('شارك بروفايلك','Share your profile')}</b>${t('انسخ الرابط وشاركه، أو انسخ «رابط المشاركة للتعديل» لمن تريد أن يعدّل معك.','Copy the link and share it, or copy the edit share link for anyone you want to edit with you.')}</div></div>
        <p class="info-tip">${t('💡 على الهاتف: استخدم الشريط السفلي للتنقّل بين الأقسام، وتبويب «المعاينة» لرؤية النتيجة مباشرةً.','💡 On mobile: use the bottom bar to navigate between sections, and the Preview tab to see the result live.')}</p>`
    },
    privacy:{
      icon:TAB.privacy, title:t('سياسة الخصوصية','Privacy Policy'),
      html:`<p>${t('نحرص على خصوصيتك. توضّح هذه السياسة البيانات التي نتعامل معها وكيفية استخدامها.','We care about your privacy. This policy explains the data we handle and how we use it.')}</p>
        <h4>${t('البيانات التي نجمعها','Data we collect')}</h4>
        <ul><li>${t('اسم المستخدم والبريد الإلكتروني عند إنشاء الحساب.','Username and email when creating an account.')}</li>
        <li>${t('محتوى البروفايل الذي تُدخله بنفسك (الاسم، المنصب، النبذة، وسائل التواصل…).','The profile content you enter yourself (name, position, bio, contact channels…).')}</li></ul>
        <h4>${t('أين تُحفظ بياناتك','Where your data is stored')}</h4>
        <ul><li>${t('تُخزَّن الحسابات والبروفايلات في قاعدة بيانات','Accounts and profiles are stored in the')} <b>Firebase</b> ${t('الآمنة من Google.','secure database from Google.')}</li>
        <li>${t('الصور تُرفع عبر خدمة','Images are uploaded via the')} <b>imgbb</b> ${t('وتُحفظ كرابط عام.','service and stored as a public link.')}</li>
        <li>${t('يُحفظ تفضيل الوضع (ليلي/نهاري) وجلسة الدخول على جهازك فقط.','The theme preference (dark/light) and login session are stored on your device only.')}</li></ul>
        <h4>${t('مشاركة الروابط','Sharing links')}</h4>
        <ul><li>${t('رابط البروفايل عام؛ أي شخص يملكه يمكنه مشاهدته.','The profile link is public; anyone who has it can view it.')}</li>
        <li>${t('«رابط التعديل» يتيح لحامله تعديل البروفايل — فشاركه بحذر.','The edit link lets its holder edit the profile — share it carefully.')}</li></ul>
        <h4>${t('ماذا لا نفعل','What we do not do')}</h4>
        <ul><li>${t('لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة لأغراض تسويقية.','We do not sell your data or share it with third parties for marketing purposes.')}</li></ul>
        <h4>${t('حقوقك','Your rights')}</h4>
        <ul><li>${t('يمكنك تعديل أو حذف أي بروفايل في أي وقت من صفحة «بروفايلاتي».','You can edit or delete any profile at any time from the My Profiles page.')}</li></ul>`
    },
    support:{
      icon:TAB.support, title:t('الدعم والمساعدة','Support and Help'),
      html:`<p>${t('واجهت مشكلة أو لديك اقتراح؟ إليك حلول أكثر المشكلات شيوعاً وطرق التواصل معنا.','Ran into a problem or have a suggestion? Here are solutions to the most common issues and ways to reach us.')}</p>
        <h4>${t('مشكلات شائعة','Common issues')}</h4>
        <ul><li><b>${t('لا يُحفظ البروفايل:','Profile does not save:')}</b> ${t('تأكد من تسجيل الدخول ومن اتصالك بالإنترنت.','Make sure you are logged in and connected to the internet.')}</li>
        <li><b>${t('لم يُختصر الرابط:','Link was not shortened:')}</b> ${t('يعمل الاختصار تلقائياً بعد رفع الموقع على استضافة تدعم https.','Shortening works automatically once the site is hosted on a provider that supports https.')}</li>
        <li><b>${t('الصورة لا تظهر:','Image does not appear:')}</b> ${t('تأكد أن الرابط يشير مباشرةً إلى صورة، أو أعد رفعها من زر «رفع صورة».','Make sure the link points directly to an image, or re-upload it from the Upload Image button.')}</li></ul>
        <h4>${t('تواصل معنا','Contact us')}</h4>
        <div class="sup-links">
          <a class="sup-link" href="mailto:${SUPPORT.email}">${TAB.support}<span>${t('البريد الإلكتروني','Email')}<b>${esc(SUPPORT.email)}</b></span></a>
          <a class="sup-link" href="${SUPPORT.whatsapp}" target="_blank" rel="noopener">${TAB.support}<span>${t('واتساب','WhatsApp')}<b>${t('تواصل مباشر','Direct contact')}</b></span></a>
        </div>`
    }
  };
  function openInfo(key){
    const it=INFO[key]; if(!it) return;
    closeInfo();
    const ov=document.createElement('div');
    ov.className='overlay show'; ov.id='infoOv';
    ov.innerHTML=`<div class="modal info-modal">
      <button class="close" data-info-close aria-label="${t('إغلاق','Close')}">✕</button>
      <div class="info-h">${it.icon}<h3>${it.title}</h3></div>
      <div class="info-body">${it.html}</div>
      <button class="btn primary" data-info-close style="margin-top:4px">${t('تم','Done')}</button>
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
    document.querySelectorAll('[data-act="logout"]').forEach(b=>b.onclick=()=>{ try{ signOut(auth); }catch(e){} clearSession(); currentUser=null; toast(t('تم تسجيل الخروج','Logged out')); location.href=urlHome(); });
    const dw=$('#drawerWrap');
    document.querySelectorAll('[data-act="menu"]').forEach(b=>b.onclick=()=>{ if(dw) dw.classList.add('open'); });
    document.querySelectorAll('[data-act="menu-close"]').forEach(b=>b.onclick=()=>{ if(dw) dw.classList.remove('open'); });
    // notifications bell (announcements + subscribe)
    document.querySelectorAll('[data-act="bell"]').forEach(b=>b.onclick=openNotifications);
    // referral invite popup (share link → 1-day premium)
    document.querySelectorAll('[data-act="invite"]').forEach(b=>b.onclick=()=>{ const dw=$('#drawerWrap'); if(dw) dw.classList.remove('open'); openReferral(false); });
    // language toggle (Arabic / English) — flips language then re-renders the page
    document.querySelectorAll('[data-act="lang"]').forEach(b=>{
      const lbl=b.querySelector('.lt-label'); if(lbl) lbl.textContent = curLang()==='en'?'ع':'EN';
      b.setAttribute('title', curLang()==='en'?'العربية':'English');
      b.onclick=()=>{ const n = curLang()==='en'?'ar':'en';
        if(window.elgSetLang) window.elgSetLang(n);
        else { try{ localStorage.setItem('apb_lang', n); }catch(e){} document.documentElement.setAttribute('dir', n==='en'?'ltr':'rtl'); document.documentElement.setAttribute('lang', n); }
        route();
      };
    });
    if(currentUser) refreshBell();
  }

  /* ---------- auth screen ---------- */
  function authError(e){
    const c=(e&&e.code)||'';
    if(c==='bad-username') return t('اسم المستخدم يجب أن يكون 3–20 حرفاً (أحرف/أرقام/_)','Username must be 3–20 characters (letters/numbers/_)');
    if(c==='username-taken') return t('اسم المستخدم مستخدم بالفعل','That username is already taken');
    if(c.includes('email-already-in-use')) return t('هذا البريد مسجّل مسبقاً — سجّل الدخول','This email is already registered — log in');
    if(c.includes('wrong-password')||c.includes('user-not-found')||c==='auth/invalid-credential'||c==='auth/wrong-password'||c==='auth/user-not-found'||c==='auth/invalid-email') return t('بيانات الدخول غير صحيحة','Incorrect login details');
    if(c==='auth/operation-not-allowed') return t('فعّل تسجيل الدخول بالبريد/كلمة المرور في Firebase Authentication','Enable Email/Password sign-in in Firebase Authentication');
    if(c==='auth/too-many-requests') return t('محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة','Too many attempts — wait a moment and try again');
    if(c.includes('network')||c==='auth/network-request-failed') return t('تعذّر الاتصال بالشبكة','Network connection failed');
    return t('حدث خطأ، حاول مجدداً','Something went wrong, please try again');
  }
  /* ---------- sign in with Google / GitHub (Firebase Auth) ----------
     On first sign-in we create a users/<firebase-uid> record so OAuth accounts
     plug into the same account model (userProfiles/<uid>, userBlogs/<uid>). */
  function oauthError(e){
    const c=(e&&e.code)||'';
    if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request') return t('أُغلقت نافذة الدخول قبل إتمامها','The sign-in window was closed before completing');
    if(c==='auth/account-exists-with-different-credential') return t('هذا البريد مسجّل بطريقة دخول أخرى — استخدمها','This email is registered with a different sign-in method — use it');
    if(c==='auth/operation-not-allowed') return t('طريقة الدخول غير مفعّلة — فعّلها في Firebase Authentication','This sign-in method is not enabled — enable it in Firebase Authentication');
    if(c==='auth/unauthorized-domain') return t('هذا النطاق غير مصرّح به في إعدادات Firebase Auth','This domain is not authorized in the Firebase Auth settings');
    if(c==='auth/popup-blocked') return t('المتصفح منع النافذة المنبثقة — اسمح بها وأعد المحاولة','The browser blocked the popup — allow it and try again');
    return t('تعذّر تسجيل الدخول، حاول مجدداً','Sign-in failed, please try again');
  }
  async function oauthSignIn(which, btn){
    const err=$('#authErr'); if(err) err.textContent='';
    const provider = which==='github' ? new GithubAuthProvider() : new GoogleAuthProvider();
    const old = btn?btn.innerHTML:''; if(btn){ btn.disabled=true; btn.innerHTML=t('جارٍ فتح نافذة الدخول…','Opening the sign-in window…'); }
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
      currentUser = { uid, email:rec.email||email, username:rec.username||t('مستخدم','User'), photo:rec.photo||'' };
      saveSession(uid); cacheUser(currentUser);
      toast(t('تم تسجيل الدخول ✓','Signed in ✓')); route();
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
      rec={ username:(u.displayName || (em.split('@')[0]) || t('مستخدم','User')).slice(0,40), email:em, provider:'password', createdAt:Date.now() };
      await set(ref(db,'users/'+uid), rec);
      if(em){ try{ await set(ref(db,'emails/'+encEmail(em)), uid); }catch(e){} }
    }
    currentUser={ uid, email:rec.email||em, username:rec.username||t('مستخدم','User'), photo:rec.photo||'' };
    saveSession(uid); cacheUser(currentUser);
    toast(t('تم تسجيل الدخول ✓','Signed in ✓')); route();
  }

  function showAuth(mode='login'){
    document.title=t('تسجيل الدخول — منشئ البروفايلات','Log in — Academic Profiles');
    document.body.style.background='';
    $('#app').innerHTML = appbar('login') + `
    <div class="auth-wrap"><div class="panel auth-card">
      <h2 id="authTitle">${mode==='login'?t('تسجيل الدخول','Log in'):t('إنشاء حساب','Sign up')}</h2>
      <div class="sub">${t('ادخل لإدارة بروفايلاتك وربطها بحسابك.','Sign in to manage your profiles and link them to your account.')}</div>
      <div class="auth-tabs">
        <button data-mode="login" class="${mode==='login'?'active':''}">${t('دخول','Log in')}</button>
        <button data-mode="signup" class="${mode==='signup'?'active':''}">${t('حساب جديد','New account')}</button>
      </div>
      <div class="auth-err" id="authErr"></div>
      <div id="unameField" class="field" style="${mode==='login'?'display:none':''}">
        <label>${t('اسم المستخدم','Username')}</label><input id="a-user" placeholder="username" autocomplete="username"/>
      </div>
      <div class="field"><label>${t('البريد الإلكتروني','Email')}</label><input id="a-email" type="email" placeholder="name@example.com" autocomplete="email"/></div>
      <div class="field"><label>${t('كلمة المرور','Password')}</label><input id="a-pass" type="password" placeholder="${t('6 أحرف على الأقل','At least 6 characters')}" autocomplete="current-password"/></div>
      <button class="btn primary" id="authGo">${mode==='login'?t('دخول','Log in'):t('إنشاء الحساب','Create account')}</button>
      <div class="auth-or"><span>${t('أو تابع عبر','or continue with')}</span></div>
      <button class="btn oauth oauth-google" id="authGoogle" type="button">${GOOGLE_SVG} ${t('المتابعة بحساب Google','Continue with Google')}</button>
      <button class="btn oauth oauth-github" id="authGithub" type="button">${GITHUB_SVG} ${t('المتابعة بحساب GitHub','Continue with GitHub')}</button>
    </div></div>`;
    wireAppbar();
    $('#authGoogle')&&($('#authGoogle').onclick=e=>oauthSignIn('google',e.currentTarget));
    $('#authGithub')&&($('#authGithub').onclick=e=>oauthSignIn('github',e.currentTarget));

    let cur=mode;
    const setMode=m=>{ cur=m;
      $('#authTitle').textContent=m==='login'?t('تسجيل الدخول','Log in'):t('إنشاء حساب','Sign up');
      $('#authGo').textContent  =m==='login'?t('دخول','Log in'):t('إنشاء الحساب','Create account');
      $('#unameField').style.display=m==='login'?'none':'';
      $('#authErr').textContent='';
      document.querySelectorAll('.auth-tabs button').forEach(x=>x.classList.toggle('active',x.dataset.mode===m));
    };
    document.querySelectorAll('.auth-tabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));

    $('#authGo').onclick=async()=>{
      const err=$('#authErr'); err.textContent='';
      const email=$('#a-email').value.trim(), pass=$('#a-pass').value;
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent=t('بريد إلكتروني غير صحيح','Invalid email address'); return; }
      if(pass.length<6){ err.textContent=t('كلمة المرور يجب ألا تقل عن 6 أحرف','Password must be at least 6 characters'); return; }
      const go=$('#authGo'); go.disabled=true; const old=go.textContent; go.textContent=t('جارٍ…','Working…');
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
          toast(t('تم إنشاء الحساب ✓','Account created ✓')); route();
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
          toast(t('تم تسجيل الدخول ✓','Signed in ✓')); route();
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
    document.title=t('الملف الشخصي — elgoharyX','Profile — elgoharyX');
    document.body.style.background='';
    let photo = currentUser.photo || '';
    const avatarInner=()=> photo
      ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer"/>`
      : `<span class="acct-initials">${esc(initials(currentUser.username))}</span>`;
    const providerLabel = { google:'Google', github:'GitHub' };
    $('#app').innerHTML = appbar('account') + `<div class="wrap acct-wrap">
      <div class="panel acct-card">
        <h2>${t('الملف الشخصي','Profile')}</h2>
        <div class="sub">${t('عدّل اسمك وصورتك الشخصية — تظهر في كل مكان بحسابك.','Edit your name and photo — they appear everywhere in your account.')}</div>
        <div class="acct-top">
          <span class="acct-avatar" id="acctAvatar">${avatarInner()}</span>
          <div class="acct-top-btns">
            <button type="button" class="btn ghost" id="acctUp">${IC2.up} ${t('رفع صورة','Upload photo')}</button>
            <button type="button" class="btn ghost" id="acctRemove" style="${photo?'':'display:none'}">${t('إزالة الصورة','Remove photo')}</button>
            <input type="file" id="acctFile" accept="image/*" hidden/>
          </div>
        </div>
        <div class="acct-note" id="acctNote"></div>
        <div class="field"><label>${t('اسم المستخدم','Username')}</label><input id="acct-username" value="${esc(currentUser.username)}" maxlength="40" placeholder="${t('اسمك','Your name')}"/></div>
        <div class="field"><label>${t('البريد الإلكتروني','Email')}</label><input value="${esc(currentUser.email||'—')}" disabled/></div>
        <div id="acctPremium"></div>
        <div id="acctNotify"></div>
        <button class="btn primary" id="acctSave" style="width:100%">${t('حفظ التغييرات','Save changes')}</button>
      </div>
    </div>` + drawer('account');
    wireAppbar();
    // premium status row (loaded async)
    getPremium(currentUser.uid).then(pp=>{
      const box=$('#acctPremium'); if(!box) return;
      if(premiumActive(pp)) box.innerHTML=`<div class="acct-prem on"><span class="pm-vip">${CROWN} ${t('عضو مميز','Premium member')}</span><span>${t('فعّال حتى','Active until')} ${fmtDay(pp.expires)}</span></div>`;
      else box.innerHTML=`<a class="acct-prem off" href="${pageUrl('premium.html')}">${CROWN} ${t('ترقية إلى العضوية المميزة','Upgrade to Premium')}</a>`;
    }).catch(()=>{});

    // notifications subscribe toggle
    (function(){
      const box=$('#acctNotify'); if(!box) return;
      const draw=()=>{ const on=isSubscribed();
        box.innerHTML=`<div class="acct-notify-row">
          <span class="an-lbl">${BELL} ${t('إشعارات الموقع','Site notifications')}</span>
          <button class="btn ${on?'ghost':'primary'}" id="acctNotifBtn" style="width:auto;padding:9px 18px">${on?t('إلغاء الاشتراك','Unsubscribe'):t('اشترك الآن','Subscribe now')}</button></div>`;
        $('#acctNotifBtn').onclick=async()=>{
          if(isSubscribed()){ await unsubscribeNotifications(); toast(t('تم إلغاء الاشتراك','Unsubscribed')); }
          else { const p=await subscribeNotifications(); toast(p==='granted'?t('تم تفعيل الإشعارات ✓','Notifications enabled ✓'):t('تم الاشتراك ✓','Subscribed ✓')); }
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
      if(!/^image\//.test(f.type)){ noteEl.className='acct-note'; noteEl.textContent=t('الملف ليس صورة','The file is not an image'); return; }
      const btn=$('#acctUp'); const old=btn.innerHTML; btn.disabled=true; btn.textContent=t('جارٍ الرفع…','Uploading…'); noteEl.textContent='';
      try{ photo=await uploadToImgbb(f); refresh(); noteEl.className='acct-note ok'; noteEl.textContent=t('✓ تم رفع الصورة — اضغط «حفظ التغييرات» لتثبيتها','✓ Photo uploaded — press “Save changes” to apply it'); }
      catch(e){ console.error(e); noteEl.className='acct-note'; noteEl.textContent=t('تعذّر رفع الصورة، حاول مجدداً','Photo upload failed, please try again'); }
      finally{ btn.disabled=false; btn.innerHTML=old; $('#acctFile').value=''; }
    };
    $('#acctRemove').onclick=()=>{ photo=''; refresh(); noteEl.className='acct-note'; noteEl.textContent=t('ستُزال الصورة عند الحفظ','The photo will be removed on save'); };
    $('#acctSave').onclick=async()=>{
      const name=$('#acct-username').value.trim();
      if(name.length<1){ noteEl.className='acct-note'; noteEl.textContent=t('اكتب اسم المستخدم','Enter a username'); return; }
      const btn=$('#acctSave'); btn.disabled=true; const old=btn.textContent; btn.textContent=t('جارٍ الحفظ…','Saving…');
      try{
        const rec=(await loadUserRecord(currentUser.uid))||{};
        const merged={...rec, username:name.slice(0,40), email:rec.email||currentUser.email||'', createdAt:rec.createdAt||Date.now(), photo};
        await set(ref(db,'users/'+currentUser.uid), merged);
        currentUser.username=merged.username; currentUser.photo=photo; cacheUser(currentUser);
        noteEl.className='acct-note ok'; noteEl.textContent=t('✓ تم حفظ التغييرات','✓ Changes saved'); toast(t('تم حفظ الملف الشخصي ✓','Profile saved ✓'));
      }catch(e){ console.error(e); noteEl.className='acct-note'; noteEl.textContent=t('تعذّر الحفظ — تأكد من نشر قواعد قاعدة البيانات','Save failed — make sure the database rules are published'); }
      finally{ btn.disabled=false; btn.textContent=old; }
    };
  }

  async function showMyProfiles(){
    if(!currentUser){ showAuth('login'); return; }
    document.title=t('بروفايلاتي — منشئ البروفايلات','My Profiles — Academic Profiles');
    document.body.style.background='';
    $('#app').innerHTML = appbar('mine') + `<div class="wrap">
      <div class="mp-head">
        <div><h2>${t('بروفايلاتي','My Profiles')}</h2><div class="sub">${t('جميع البروفايلات المرتبطة بحسابك.','All profiles linked to your account.')}</div></div>
        <button class="btn primary" id="mkNew" style="width:auto;padding:12px 22px">+ ${t('بروفايل جديد','New Profile')}</button>
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
        $('#mpList').innerHTML=`<div class="mp-empty">${t('لا توجد بروفايلات بعد.','No profiles yet.')}<br><br>
          <button class="btn primary" id="mkNew2" style="width:auto;padding:12px 22px">${t('أنشئ أول بروفايل','Create your first profile')}</button></div>`;
        $('#mkNew2').onclick=newProfile; return;
      }
      $('#mpList').innerHTML=`<div class="mp-grid">${list.map(p=>`
        <div class="mp-card">
          <div class="mp-cover" style="background:${COVERS[p.template]||COVERS.royal}"><span class="badge">${esc((TEMPLATES.find(t=>t.id===p.template)||{}).name||'')}</span>${p.locked?'<span class="mp-lock" title="'+t('محمي بكلمة مرور','Password protected')+'">🔒</span>':''}</div>
          <div class="mp-body">
            <div class="mp-name">${esc(p.name||t('بدون اسم','Untitled'))}</div>
            <div class="mp-meta">${t('آخر تحديث:','Last update:')} ${p.updatedAt?new Date(p.updatedAt).toLocaleDateString('ar-EG'):'—'}</div>
            <div class="mp-actions">
              <a href="${urlProfileView(p.id)}" target="_blank">${IC2.eye} ${t('عرض','View')}</a>
              <button data-edit="${p.id}">${IC2.pen} ${t('تعديل','Edit')}</button>
              <button data-share="${p.id}">${IC2.share} ${t('مشاركة للتعديل','Share for editing')}</button>
              <button data-link="${p.id}">${IC2.link} ${t('الرابط','Link')}</button>
              <button class="del" data-del="${p.id}">${t('حذف','Delete')}</button>
            </div>
          </div>
        </div>`).join('')}</div>`;
      $('#mpList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>startEdit(b.dataset.edit));
      $('#mpList').querySelectorAll('[data-link]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(urlProfileView(b.dataset.link));toast(t('تم نسخ رابط العرض ✓','View link copied ✓'));});
      $('#mpList').querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(urlProfileEdit(b.dataset.share));toast(t('تم نسخ رابط التعديل ✓ — شاركه لمن يعدّل البروفايل','Edit link copied ✓ — share it with your co-editor'));});
      $('#mpList').querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
        if(!confirm(t('حذف هذا البروفايل نهائياً؟','Permanently delete this profile?'))) return;
        try{ await remove(ref(db,'profiles/'+b.dataset.del)); await remove(ref(db,'userProfiles/'+currentUser.uid+'/'+b.dataset.del)); toast(t('تم الحذف','Deleted')); showMyProfiles(); }
        catch(e){ console.error(e); toast(t('تعذّر الحذف','Delete failed')); }
      });
    }catch(e){
      console.error(e);
      $('#mpList').innerHTML=`<div class="mp-empty">${t('تعذّر تحميل البروفايلات. تحقّق من قواعد قاعدة البيانات.','Failed to load profiles. Check the database rules.')}</div>`;
    }
  }

  /* ---------- open an existing profile for editing ---------- */
  async function startEdit(id){
    if(!currentUser){ location.href=urlProfileEdit(id); return; }
    document.body.style.background='';
    $('#app').innerHTML=`<div class="loader"><div><div class="spin"></div>${t('جارٍ فتح البروفايل للتعديل…','Opening the profile for editing…')}</div></div>`;
    try{
      const s=await get(child(ref(db),'profiles/'+id));
      if(!s.exists()){ toast(t('البروفايل غير موجود','Profile not found')); showMyProfiles(); return; }
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
    }catch(e){ console.error(e); toast(t('تعذّر الفتح','Failed to open')); showMyProfiles(); }
  }

  function fld(id,label,val,type='input',ph=''){
    if(type==='textarea') return `<div class="field"><label>${label}</label><textarea id="f-${id}" placeholder="${ph}">${esc(val)}</textarea></div>`;
    return `<div class="field"><label>${label}</label><input id="f-${id}" value="${esc(val)}" placeholder="${ph}"/></div>`;
  }

  function showBuilder(){
    if(!currentUser){ showAuth('login'); return; }
    const editing = editingId!==null;
    const sharedEdit = editing && editMeta && editMeta.ownerUid!==currentUser.uid;
    document.title = editing ? t('تعديل البروفايل','Edit Profile') : t('منشئ البروفايلات الأكاديمية','Academic Profile Builder');
    document.body.style.background='';
    $('#app').innerHTML = appbar('build') + `
    <div class="wrap"><div class="builder">
      <section class="panel">
        <h2>${editing?t('تعديل البروفايل','Edit Profile'):t('أنشئ بروفايلك','Create your profile')}</h2>
        <div class="sub">${editing
          ? (sharedEdit?t('أنت تعدّل بروفايلاً تمت مشاركته معك.','You are editing a profile shared with you.'):t('عدّل البيانات ثم احفظ التغييرات.','Edit the data then save your changes.'))
          : t('اختر تصميماً، عبّئ البيانات، ثم أنشئ رابطاً دائماً يُحفظ في Firebase.','Choose a design, fill in the data, then create a permanent link saved in Firebase.')}</div>

        <div class="bpane pane-on" data-pane="data">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.person} ${t('البيانات الأساسية','Basic information')}</span></summary>
          <div class="acc-body">
            ${fld('name',t('الاسم (رئيسي)','Name (primary)'),state.name)}
            ${fld('nameEn',t('الاسم بالإنجليزية (اختياري)','Name in English (optional)'),state.nameEn,'input','Prof. Dr. …')}
            ${fld('kicker',t('المسمّى العلوي','Top label'),state.kicker)}
            ${fld('role',t('المنصب / القسم','Position / Department'),state.role,'textarea')}
            ${fld('about',t('النبذة التعريفية','About'),state.about,'textarea')}
            <div class="grid2">${fld('university',t('الجامعة','University'),state.university)}${fld('universityEn','Univ. (EN)',state.universityEn)}</div>
            <div class="grid2">${fld('faculty',t('الكلية','Faculty'),state.faculty)}${fld('degree',t('الدرجة العلمية','Degree'),state.degree)}</div>
            <div class="grid2">${fld('specialization',t('التخصص','Specialization'),state.specialization)}${fld('interests',t('الاهتمامات البحثية','Research interests'),state.interests)}</div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="design">
        <details class="acc">
          <summary><span class="sum-t">${UICON.grid} ${t('التخطيط / الشكل','Layout / Style')} <span style="color:var(--muted-2);font-weight:400">(${LAYOUTS.length})</span></span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('أول '+FREE_PROFILE_LAYOUTS+' تخطيطاً مجانية — والباقي للمشتركين المميزين.','The first '+FREE_PROFILE_LAYOUTS+' layouts are free — the rest are for Premium members.'))}
            <input id="laySearch" class="lay-search" placeholder="${t('ابحث عن تخطيط…','Search for a layout…')}"/>
            <div class="layouts" id="lays">
              ${LAYOUTS.map((l,li)=>{ const lk=li>=FREE_PROFILE_LAYOUTS; return `<div class="lay ${l.id===state.layout?'active':''} ${lk?'locked':''}" data-lay="${l.id}" data-name="${esc(l.name)}" ${lk?'data-locked="1"':''}>
                ${lk?'<span class="lay-lock">'+LOCKICON+'</span>':''}${l.icon}<div class="ln">${esc(l.name)}</div>${l.desc?`<div class="ld">${esc(l.desc)}</div>`:''}</div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.palette} ${t('لون التصميم','Design color')} <span style="color:var(--muted-2);font-weight:400">(${TEMPLATES.length})</span> ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' '+t('مميز','Premium')+'</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('أول '+FREE_PROFILE_COLORS+' لوناً مجانية — وباقي الألوان للمشتركين المميزين.','The first '+FREE_PROFILE_COLORS+' colors are free — the rest are for Premium members.'))}
            <div class="templates" id="tpls">
              ${TEMPLATES.map((t,ti)=>{ const lk=ti>=FREE_PROFILE_COLORS; return `<div class="tpl t-${t.id} ${t.id===state.template?'active':''} ${lk?'locked':''}" data-tpl="${t.id}" ${lk?'data-locked="1"':''}>
                <div class="swatch">${lk?'<span class="tpl-lock">'+LOCKICON+'</span>':''}</div><div class="nm">${t.name}</div></div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.cube} ${t('المؤثرات ثلاثية الأبعاد','3D effects')} ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' '+t('مميز','Premium')+'</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('المؤثرات ثلاثية الأبعاد وحركة الظهور متاحة للمشتركين المميزين.','3D effects and entrance animation are available for Premium members.'))}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="opt-row">
              <div><div class="lbl">${t('إمالة تفاعلية (3D)','Interactive tilt (3D)')}</div><div class="desc">${t('تميل البطاقة مع المؤشر وتبرز النصوص','The card tilts with the cursor and highlights text')}</div></div>
              <label class="switch"><input type="checkbox" id="f-threeD" ${state.threeD?'checked':''}><span class="slider"></span></label>
            </div>
            <div class="opt-row">
              <div><div class="lbl">${t('حركة ثلاثية الأبعاد','3D motion')}</div><div class="desc">${t('حركة مستمرة للبطاقة (10 حركات)','Continuous card motion (10 motions)')}</div></div>
              <select id="f-motion" class="mini-select">
                ${MOTIONS.map(m=>`<option value="${m.id}" ${m.id===state.motion3d?'selected':''}>${m.name}</option>`).join('')}
              </select>
            </div>
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.wand} ${t('حركة الظهور','Entrance animation')} ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' '+t('مميز','Premium')+'</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('حركة ظهور البروفايل متاحة للمشتركين المميزين.','The profile entrance animation is available for Premium members.'))}
            <div class="opt-row ${isPremium()?'':'is-locked'}">
              <div><div class="lbl">${t('أنيميشن الظهور','Entrance animation')}</div><div class="desc">${t('يظهر به البروفايل عند فتح الرابط','How the profile appears when the link opens')}</div></div>
              <div style="display:flex;gap:8px;align-items:center">
                <select id="f-anim" class="mini-select">
                  ${ANIMS.map(a=>`<option value="${a.id}" ${a.id===state.anim?'selected':''}>${a.name}</option>`).join('')}
                </select>
                <button type="button" class="btn ghost" id="animPlay" style="padding:9px 13px" title="${t('معاينة الحركة','Preview animation')}">${UICON.play}</button>
              </div>
            </div>
          </div>
        </details>

        </div>

        <div class="bpane" data-pane="photo">
        <details class="acc">
          <summary><span class="sum-t">${UICON.photo} ${t('الصورة الشخصية','Profile photo')}</span></summary>
          <div class="acc-body">
            <div class="field">
              <label>${t('رابط الصورة أو رفعها','Photo link or upload')}</label>
              <div class="upload-row">
                <input id="f-photo" value="${esc(state.photo)}" placeholder="${t('https://… أو ارفع صورة','https://… or upload a photo')}"/>
                <button type="button" class="btn ghost" id="upBtn">${IC2.up} ${t('رفع صورة','Upload photo')}</button>
              </div>
              <input type="file" id="upFile" accept="image/*" hidden/>
              <div class="up-note" id="upNote">${t('اضغط «ضبط موضع الصورة» بالأسفل ثم اسحب الصورة داخل الإطار في المعاينة.','Press “Adjust photo position” below then drag the photo inside the frame in the preview.')}</div>
            </div>
            <label class="acc-lbl">${t('ضبط الصورة داخل الإطار','Adjust the photo inside the frame')}</label>
            <div class="align-ctl">
              <button type="button" class="btn ghost" id="alignToggle">${UICON.scope} ${t('سحب داخل الإطار','Drag inside the frame')}</button>
              <button type="button" class="btn ghost" id="alignReset">${t('إعادة ضبط','Reset')}</button>
            </div>
            <div class="align-sliders">
              <label class="rng"><span>${t('أفقي ↔','Horizontal ↔')}</span><input type="range" id="posX" min="0" max="100" step="1" value="${parseFloat((state.photoPos||'50% 50%').split(/\s+/)[0])||50}"/></label>
              <label class="rng"><span>${t('رأسي ↕','Vertical ↕')}</span><input type="range" id="posY" min="0" max="100" step="1" value="${parseFloat((state.photoPos||'50% 50%').split(/\s+/)[1])||50}"/></label>
              <label class="rng"><span>${t('تكبير','Zoom')}</span><input type="range" id="zoomRange" min="1" max="3" step="0.05" value="${zoomSafe(state.photoZoom)}"/></label>
            </div>
            <div class="align-hint" id="alignHint">${UICON.bulb} ${t('حرّك المنزلقات لضبط الصورة يدوياً (أفقي/رأسي/تكبير)، أو فعّل «سحب داخل الإطار» ثم اسحب الصورة مباشرة.','Move the sliders to adjust the photo manually (horizontal/vertical/zoom), or enable “Drag inside the frame” then drag the photo directly.')}</div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.grid} ${t('معرض الصور والفيديو','Photo and video gallery')} ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' '+t('مميز','Premium')+'</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('معرض الصور والفيديوهات داخل البروفايل متاح للمشتركين المميزين.','The in-profile photo and video gallery is available for Premium members.'))}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="field">
              <label>${t('معرض صور داخل البروفايل','In-profile photo gallery')}</label>
              <div class="upload-row">
                <input id="galVal" placeholder="${t('ألصق رابط صورة… https://','Paste an image link… https://')}"/>
                <button type="button" class="btn ghost" id="galUp">${IC2.up} ${t('رفع صورة','Upload photo')}</button>
                <button type="button" class="btn ghost" id="galAdd" style="padding:11px 16px">${t('إضافة','Add')}</button>
              </div>
              <input type="file" id="galFile" accept="image/*" hidden/>
              <div class="up-note" id="galNote">${t('أضف صوراً متعددة (رابط أو رفع) تظهر داخل البروفايل كمعرض أنيق.','Add multiple photos (link or upload) that appear inside the profile as an elegant gallery.')}</div>
              <div class="media-list" id="galList"></div>
            </div>
            <div class="field">
              <label>${t('فيديوهات يوتيوب','YouTube videos')}</label>
              <div class="link-add">
                <input id="vidVal" placeholder="${t('رابط يوتيوب… youtu.be/… أو youtube.com/watch?v=…','YouTube link… youtu.be/… or youtube.com/watch?v=…')}"/>
                <button type="button" class="btn ghost" id="vidAdd" style="padding:11px 16px">${t('إضافة','Add')}</button>
              </div>
              <div class="up-note" id="vidNote">${t('ألصق رابط الفيديو ثم اضغط «إضافة» — يظهر مدمجاً داخل البروفايل.','Paste the video link then press “Add” — it appears embedded inside the profile.')}</div>
              <div class="media-list" id="vidList"></div>
            </div>
            </div>
          </div>
        </details>

        </div>

        <div class="bpane" data-pane="contact">
        <details class="acc">
          <summary><span class="sum-t">${UICON.chat} ${t('وسائل التواصل','Contact methods')}</span></summary>
          <div class="acc-body">
            <div class="grid2">${fld('email',t('البريد الإلكتروني','Email'),state.email)}${fld('phone',t('رقم الهاتف','Phone'),state.phone)}</div>
            <div class="field">
              <label>${t('وسائل تواصل إضافية','Additional contact methods')}</label>
              <div class="link-add">
                <select id="linkType" class="mini-select">${Object.entries(CONTACT_TYPES).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select>
                <input id="linkVal" placeholder="${t('الرابط أو المُعرّف/الرقم','Link or handle/number')}"/>
                <button type="button" class="btn ghost" id="linkAdd" style="padding:11px 16px">${t('إضافة','Add')}</button>
              </div>
              <div class="link-list" id="linkList"></div>
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${IC2.share} ${t('مشاركة البروفايل للتعديل','Share profile for editing')}</span></summary>
          <div class="acc-body">
            <div class="up-note ok" style="margin-bottom:0">${editing
              ? t('رابط بروفايلك عام للعرض. لمشاركته مع من يعدّل معك، انسخ «رابط المشاركة للتعديل» من نافذة الحفظ أو من صفحة «بروفايلاتي».','Your profile link is public for viewing. To share it with a co-editor, copy the “Share for editing” link from the save dialog or from the “My Profiles” page.')
              : t('بعد الحفظ ستحصل على رابطين: رابط عام للعرض، و«رابط مشاركة للتعديل» تعطيه لمن تريد أن يعدّل البروفايل معك.','After saving you get two links: a public view link, and a “Share for editing” link you give to whoever edits the profile with you.')}</div>
          </div>
        </details>
        </div>

        <button class="btn primary" id="gen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
          ${editing?t('حفظ التغييرات','Save changes'):t('إنشاء الرابط وحفظه','Create and save the link')}
        </button>
      </section>

      <section class="preview-col" data-pane="preview">
        <div class="preview-head"><span class="t">${t('معاينة حيّة','Live preview')}</span><span class="live">${t('مباشر','Live')}</span></div>
        <div class="panel" style="padding:clamp(14px,2vw,22px)"><div class="stage" id="preview"></div></div>
      </section>

      <nav class="build-nav">
        <button class="bnav on" data-pane="data">${UICON.person}<span>${t('البيانات','Data')}</span></button>
        <button class="bnav" data-pane="design">${UICON.grid}<span>${t('التصميم','Design')}</span></button>
        <button class="bnav" data-pane="photo">${UICON.photo}<span>${t('الصورة','Photo')}</span></button>
        <button class="bnav" data-pane="contact">${UICON.chat}<span>${t('التواصل','Contact')}</span></button>
        <button class="bnav" data-pane="preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><span>${t('المعاينة','Preview')}</span></button>
      </nav>
    </div></div>

    <div class="overlay" id="ov">
      <div class="modal">
        <button class="close" id="ovClose">✕</button>
        <div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="26" height="26"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h3 id="ovTitle">${t('تم الحفظ','Saved')}</h3>
        <p id="ovDesc">${t('هذا هو رابط بروفايلك الدائم — شاركه مع من تريد.','This is your permanent profile link — share it with anyone you like.')}</p>
        <div class="linkbox"><input id="outLink" readonly/><button class="btn gold" id="copyLink" style="padding:9px 16px">${t('نسخ','Copy')}</button></div>
        <div id="shortNote" style="text-align:center;font-size:12px;color:var(--muted-2);margin:-8px 0 16px;min-height:16px"></div>
        <div class="modal-actions">
          <a class="btn primary" id="openLink" target="_blank">${t('فتح البروفايل','Open profile')}</a>
          <button class="btn ghost" id="toMine">${t('بروفايلاتي','My Profiles')}</button>
        </div>
        <button class="btn ghost" id="copyEdit" style="width:100%;margin-top:10px">${IC2.share} ${t('نسخ رابط المشاركة للتعديل','Copy the share-for-editing link')}</button>
      </div>
    </div>` + drawer('build');

    // live preview
    let alignOn=false;
    const applyAlign=()=>{
      const imgs=$('#preview').querySelectorAll('.pf-avatar img, .pola-photo img, .pf-fp .fp-img');
      imgs.forEach(img=>{ img.classList.toggle('aligning',alignOn); const f=img.parentElement; if(f) f.classList.toggle('align-on',alignOn); });
      const t=$('#alignToggle'); if(t){ t.classList.toggle('active',alignOn); t.innerHTML=alignOn?UICON.check+' '+(curLang()==='en'?'Drag mode enabled':'وضع السحب مفعّل'):UICON.scope+' '+(curLang()==='en'?'Drag inside the frame':'سحب داخل الإطار'); }
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
    const at=$('#alignToggle'); if(at) at.onclick=()=>{ alignOn=!alignOn; applyAlign(); if(alignOn) toast(t('اسحب الصورة داخل الإطار · أو استخدم المنزلقات','Drag the photo inside the frame · or use the sliders')); };
    const posX=$('#posX'), posY=$('#posY'), zr=$('#zoomRange');
    const applyPos=()=>{ state.photoPos=(posX?posX.value:50)+'% '+(posY?posY.value:50)+'%'; const img=previewImg(); if(img) img.style.objectPosition=state.photoPos; };
    if(posX) posX.oninput=applyPos; if(posY) posY.oninput=applyPos;
    if(zr) zr.oninput=()=>{ state.photoZoom=zoomSafe(zr.value); const img=previewImg(); if(img) img.style.transform='scale('+state.photoZoom+')'; };
    const arst=$('#alignReset'); if(arst) arst.onclick=()=>{ state.photoPos='50% 50%'; state.photoZoom=1; paint(); toast(t('تمت إعادة ضبط الصورة','Photo reset')); };

    // contact methods (links)
    state.links = Array.isArray(state.links)?[...state.links]:[];
    const renderLinks=()=>{
      const el=$('#linkList'); if(!el) return;
      el.innerHTML = state.links.length ? state.links.map((l,i)=>{ const t=CONTACT_TYPES[l.type];
        return `<span class="link-chip">${t?t.icon:''}<span>${esc((t?t.name:l.type)+' — '+l.value)}</span><button data-rm="${i}" title="${curLang()==='en'?'Delete':'حذف'}">✕</button></span>`;}).join('')
        : '<span class="link-empty">'+(curLang()==='en'?'No contact methods added yet.':'لم تُضف أي وسيلة تواصل بعد.')+'</span>';
      el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ state.links.splice(+b.dataset.rm,1); renderLinks(); paint(); });
    };
    renderLinks();
    const la=$('#linkAdd'); if(la) la.onclick=()=>{
      const type=$('#linkType').value, value=$('#linkVal').value.trim();
      if(!value){ toast(t('أدخل الرابط أو المُعرّف','Enter the link or handle')); return; }
      state.links.push({type,value}); $('#linkVal').value=''; renderLinks(); paint();
    };
    const lv=$('#linkVal'); if(lv) lv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#linkAdd').click(); } });

    // media: in-profile image gallery + youtube videos
    state.gallery = Array.isArray(state.gallery)?state.gallery.filter(Boolean):[];
    state.videos  = Array.isArray(state.videos)?state.videos.filter(Boolean):[];
    const renderGallery=()=>{
      const el=$('#galList'); if(!el) return;
      el.innerHTML = state.gallery.length ? state.gallery.map((u,i)=>
        `<span class="media-chip"><img src="${esc(u)}" alt="" onerror="this.style.display='none'"/><span class="mc-t">${t('صورة','Photo')} ${i+1}</span><button data-grm="${i}" title="${t('حذف','Delete')}">✕</button></span>`).join('')
        : '<span class="link-empty">'+t('لا توجد صور في المعرض بعد.','No photos in the gallery yet.')+'</span>';
      el.querySelectorAll('[data-grm]').forEach(b=>b.onclick=()=>{ state.gallery.splice(+b.dataset.grm,1); renderGallery(); paint(); });
    };
    const renderVideos=()=>{
      const el=$('#vidList'); if(!el) return;
      el.innerHTML = state.videos.length ? state.videos.map((u,i)=>{ const id=ytId(u);
        return `<span class="media-chip vid${id?'':' bad'}">${UICON.play}<span class="mc-t">${id?(t('يوتيوب — ','YouTube — ')+id):t('رابط غير صالح','Invalid link')}</span><button data-vrm="${i}" title="${t('حذف','Delete')}">✕</button></span>`;}).join('')
        : '<span class="link-empty">'+t('لا توجد فيديوهات بعد.','No videos yet.')+'</span>';
      el.querySelectorAll('[data-vrm]').forEach(b=>b.onclick=()=>{ state.videos.splice(+b.dataset.vrm,1); renderVideos(); paint(); });
    };
    renderGallery(); renderVideos();
    const galAdd=$('#galAdd'); if(galAdd) galAdd.onclick=()=>{
      const v=$('#galVal').value.trim(); if(!v){ toast(t('ألصق رابط صورة','Paste an image link')); return; }
      state.gallery.push(v); $('#galVal').value=''; renderGallery(); paint();
    };
    const gvv=$('#galVal'); if(gvv) gvv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#galAdd').click(); }});
    const galUp=$('#galUp'), galFile=$('#galFile'), galNote=$('#galNote');
    if(galUp){
      galUp.onclick=()=>galFile.click();
      galFile.onchange=async()=>{
        const f=galFile.files&&galFile.files[0]; if(!f) return;
        if(!/^image\//.test(f.type)){ galNote.className='up-note'; galNote.textContent=t('الملف المختار ليس صورة','The selected file is not an image'); return; }
        if(f.size>32*1024*1024){ galNote.className='up-note'; galNote.textContent=t('حجم الصورة يتجاوز 32MB','Image size exceeds 32MB'); return; }
        const old=galUp.innerHTML; galUp.disabled=true; galUp.textContent=t('جارٍ الرفع…','Uploading…');
        galNote.className='up-note'; galNote.textContent=t('جارٍ رفع الصورة…','Uploading photo…');
        try{ const url=await uploadToImgbb(f); state.gallery.push(url); renderGallery(); paint();
          galNote.className='up-note ok'; galNote.textContent=t('✓ تمت إضافة الصورة إلى المعرض','✓ Photo added to the gallery'); }
        catch(e){ console.error(e); galNote.className='up-note'; galNote.textContent=t('تعذّر رفع الصورة، حاول مجدداً','Photo upload failed, please try again'); }
        finally{ galUp.disabled=false; galUp.innerHTML=old; galFile.value=''; }
      };
    }
    const vidAdd=$('#vidAdd'); if(vidAdd) vidAdd.onclick=()=>{
      const v=$('#vidVal').value.trim(); if(!v){ toast(t('ألصق رابط يوتيوب','Paste a YouTube link')); return; }
      if(!ytId(v)){ toast(t('رابط يوتيوب غير صالح','Invalid YouTube link')); return; }
      state.videos.push(v); $('#vidVal').value=''; renderVideos(); paint();
    };
    const vvv=$('#vidVal'); if(vvv) vvv.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#vidAdd').click(); }});

    // image upload -> imgbb -> photo url
    const upBtn=$('#upBtn'), upFile=$('#upFile'), upNote=$('#upNote');
    if(upBtn){
      upBtn.onclick=()=>upFile.click();
      upFile.onchange=async()=>{
        const file=upFile.files&&upFile.files[0]; if(!file) return;
        if(!/^image\//.test(file.type)){ upNote.className='up-note'; upNote.textContent=t('الملف المختار ليس صورة','The selected file is not an image'); return; }
        if(file.size>32*1024*1024){ upNote.className='up-note'; upNote.textContent=t('حجم الصورة يتجاوز 32MB','Image size exceeds 32MB'); return; }
        const old=upBtn.innerHTML; upBtn.disabled=true; upBtn.textContent=t('جارٍ الرفع…','Uploading…');
        upNote.className='up-note'; upNote.textContent=t('جارٍ رفع الصورة…','Uploading photo…');
        try{
          const url=await uploadToImgbb(file);
          state.photo=url;
          const pf=$('#f-photo'); if(pf) pf.value=url;
          paint();
          upNote.className='up-note ok'; upNote.textContent=t('✓ تم رفع الصورة ووضع الرابط تلقائياً','✓ Photo uploaded and link filled in automatically');
        }catch(e){
          console.error(e); upNote.className='up-note'; upNote.textContent=t('تعذّر رفع الصورة، حاول مجدداً','Photo upload failed, please try again');
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
        if(l.dataset.locked && !isPremium()){ toast(t('هذا التخطيط للمشتركين المميزين ✦','This layout is for Premium members ✦')); return; }
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
        if(t.dataset.locked && !isPremium()){ toast(curLang()==='en'?'This color is for Premium members ✦':'هذا اللون للمشتركين المميزين ✦'); return; }
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
      const btn=$('#gen'); btn.disabled=true; const old=btn.innerHTML; btn.innerHTML=t('جارٍ الحفظ…','Saving…');
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
        $('#ovTitle').textContent = editing?t('تم حفظ التغييرات','Changes saved'):t('تم إنشاء البروفايل','Profile created');
        $('#ovDesc').textContent = t('رابط عام للعرض بالأسفل — وبالأسفل «رابط المشاركة للتعديل» لمن يعدّل معك.','A public view link is below — and below it the share-to-edit link for anyone editing with you.');
        $('#outLink').value=full; $('#openLink').href=full;
        $('#ov').classList.add('show');
        note.textContent='';
      }catch(e){
        console.error(e); toast(t('تعذّر الحفظ — سجّل الدخول وتحقّق من قواعد قاعدة البيانات','Could not save — sign in and check your database rules'));
      }finally{ btn.disabled=false; btn.innerHTML=old; }
    };

    $('#copyLink').onclick=()=>{navigator.clipboard?.writeText($('#outLink').value);toast(t('تم نسخ الرابط ✓','Link copied ✓'));};
    $('#copyEdit').onclick=()=>{ if(editLink){navigator.clipboard?.writeText(editLink);toast(t('تم نسخ رابط التعديل ✓ — شاركه لمن يعدّل البروفايل','Edit link copied ✓ — share it with whoever edits the profile'));} };
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
    $('#app').innerHTML = `<div class="loader"><div><div class="spin"></div>${t('جارٍ تحميل البروفايل…','Loading profile…')}</div></div>`;
    try{
      const snap = await get(child(ref(db),'profiles/'+id));
      if(!snap.exists()){
        renderError({code:'404', tag:t('بروفايل غير موجود · NOT FOUND','PROFILE NOT FOUND'), title:t('هذا البروفايل غير موجود','This profile does not exist'),
          msg:t('الرابط غير صحيح أو تم حذف البروفايل أو تعديل معرّفه. تحقّق من الرابط أو أنشئ بروفايلاً جديداً.','The link is invalid, or the profile was deleted or its id changed. Check the link or create a new profile.')});
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
      renderError({code:'⚠', tag:t('تعذّر التحميل · LOAD ERROR','LOAD ERROR'), title:t('تعذّر تحميل البيانات','Could not load the data'),
        msg:t('تحقّق من اتصالك بالإنترنت أو من قواعد قاعدة البيانات، ثم أعد المحاولة.','Check your internet connection or your database rules, then try again.'), showReload:true});
    }
  }

  /* ======================================================================
     BLOG MODULE — 150 professional design themes, posts, viewer & builder
     ====================================================================== */
  /* Each design: name + palette. Font scheme (bf) and hero layout (bh) are
     assigned across the set so all 150 feel genuinely distinct & professional. */
  const _bd=(name,light,bg,panel,text,muted,accent,accent2)=>({name,light,bg,panel,text,muted,accent,accent2});
  const BLOG_DESIGNS_RAW = [
    _bd(t('ميدنايت','Midnight'),'0',  '#0c1424','#111d33','#eef2fb','#9fabc6','#c9a548','#e6c980'),
    _bd(t('أرشد أبيض','Editorial White'),'1','#ffffff','#f5f7fb','#16233d','#5a6a86','#1c3f82','#3f74c9'),
    _bd(t('زمرد ليلي','Night Emerald'),'0','#08160f','#0e2018','#eafff2','#9fc4ac','#1aa564','#5fe0a0'),
    _bd(t('قرمزي','Crimson'),'0',    '#160a0d','#200e12','#fff0f1','#d3a6ab','#c8384a','#ff7a8a'),
    _bd(t('رملي فاخر','Royal Sand'),'1','#faf6ee','#f1e8d8','#3a2c18','#7a6a52','#8a5a2a','#c08a3a'),
    _bd(t('محيط عميق','Deep Ocean'),'0','#04121c','#0a2030','#e6f4ff','#9cc0d4','#1477b0','#4fc4f0'),
    _bd(t('خزامى','Lavender'),'1',    '#f8f5fd','#ece4f7','#2a1a3d','#6a5a80','#7a34d0','#b070e0'),
    _bd(t('جرافيت','Graphite'),'0',   '#0e0e11','#18181d','#f2f2f4','#a0a0a8','#f5a623','#ffca63'),
    _bd(t('نبيذي','Wine'),'0',    '#180a10','#241019','#fbeef0','#c9a9b2','#9a1a44','#e0407e'),
    _bd(t('غابة','Forest'),'1',     '#f2f7f2','#e2ede2','#183020','#5a7a62','#2f7a4a','#5fb87a'),
    _bd(t('سماء','Sky'),'1',     '#f2faff','#e0f0fb','#0f2f45','#4a6f88','#2f9ad8','#6fc4f0'),
    _bd(t('نيون','Neon'),'0',     '#0a0713','#140a1e','#fdeaff','#c6a6d0','#c81aa0','#4ff0ff'),
    _bd(t('برونز','Bronze'),'0',    '#160f0a','#221810','#fbf2e6','#c4ac90','#cd7f32','#e6a45a'),
    _bd(t('ياقوت','Ruby'),'0',    '#160610','#22091a','#ffeaf1','#d3a2b2','#c01050','#ff5e8a'),
    _bd(t('نعناع','Mint'),'1',    '#f0fbf6','#dff2ea','#123a2c','#4f7a68','#1f8a5a','#4fc088'),
    _bd(t('فحمي','Charcoal'),'0',     '#101012','#1a1a1e','#f2f3f5','#a6a8ad','#8fb0ff','#c8d4ff'),
    _bd(t('غروب','Sunset'),'0',     '#180d12','#241420','#fff0ea','#d3aca0','#e0456b','#ff9e5e'),
    _bd(t('لؤلؤ','Pearl'),'1',     '#fffdfb','#f4ece6','#3a2e2a','#8a746c','#b07a5a','#d8a888'),
    _bd(t('كوبالت','Cobalt'),'0',   '#05091a','#0c1430','#e6eeff','#9aabd4','#1a3fd0','#5f8aff'),
    _bd(t('عاج كلاسيكي','Classic Ivory'),'1','#fdfbf6','#f0ebe0','#2a2418','#6e6452','#8a6a1f','#c0982f'),
    _bd(t('توت بري','Wild Berry'),'0',  '#140714','#20102a','#ffe8f4','#cfa4bc','#9a1a5a','#e0407e'),
    _bd(t('فيروز','Turquoise'),'0',    '#04161a','#0a2228','#e0fbfb','#93c8c8','#0f9a9a','#4fe0e0'),
    _bd(t('ماجنتا','Magenta'),'0',   '#160718','#221028','#ffe8fb','#d0a6cc','#c010a0','#ff5ed8'),
    _bd(t('حجري','Stone'),'1',     '#f5f6f8','#e6e9ef','#1f2a3a','#5a6678','#4a6b9a','#7794c4'),
    _bd(t('عنبر','Amber'),'0',     '#160f06','#221810','#fdf3e2','#c9b48c','#e0951a','#ffca63'),
    _bd(t('كاكاو','Cocoa'),'1',    '#faf5f0','#ece0d4','#3a2a1e','#7a6656','#8a5a3a','#c08a60'),
    _bd(t('دنيم','Denim'),'1',     '#f4f7fb','#e2eaf3','#1f3050','#5a6a86','#3f5f9a','#7794c8'),
    _bd(t('لايم','Lime'),'0',     '#0e1405','#181f0a','#f2ffe0','#bcd096','#7ab02a','#c8f063'),
    _bd(t('أوركيد','Orchid'),'1',   '#faf5fd','#ece0f5','#331a3d','#6f5a80','#9a3fc0','#c87fe8'),
    _bd(t('سافير','Sapphire'),'0',    '#060f24','#0c1a38','#e9f0ff','#9fb0d4','#1a45b0','#5f8aff'),
    _bd(t('خوخي','Peach'),'1',     '#fff7f3','#ffe9df','#4a2e22','#8a6558','#d0562f','#ff9a6a'),
    _bd(t('أوبسيديان','Obsidian'),'0','#0a0a0c','#141418','#f2f3f5','#a6a8ad','#c8ccd4','#eef0f4'),
    _bd(t('يشب','Jade'),'1',      '#f2fbf7','#ddefe7','#0f3a2e','#4a7a68','#0f8a66','#4fc0a0'),
    _bd(t('كوبالت فاتح','Light Cobalt'),'1','#f2f6ff','#e0e8fb','#101f45','#4a5a86','#2f5ae8','#6f8aff'),
    _bd(t('سلمون','Salmon'),'0',    '#1a0e0c','#26140f','#fff0ea','#d3aca0','#e0654a','#ff9a7a'),
    _bd(t('بحري داكن','Deep Navy'),'0','#080d1a','#101830','#eaf0fb','#9aa8c4','#2f4a8a','#5f7ac4'),
    _bd(t('موس أخضر','Green Moss'),'0', '#101405','#1a200a','#eef2df','#b0bc90','#788a34','#c8d67f'),
    _bd(t('تانجرين','Tangerine'),'0',  '#180d05','#241610','#fff0e2','#d0ac8c','#e07520','#ff9e50'),
    _bd(t('بلاش','Blush'),'1',     '#fff6f8','#fbe6ec','#42222e','#8a6270','#c05a7a','#eca0b8'),
    _bd(t('سيفوم','Seafoam'),'1',    '#f0fbf9','#dcf2ee','#0f3a36','#4a7a74','#1ab0a0','#5fc8ba'),
    _bd(t('إنديجو','Indigo'),'0',   '#0b0e26','#141838','#eceeff','#a4a8d0','#3f3fb0','#7f7fe0'),
    _bd(t('ذهبي فاخر','Royal Gold'),'0','#141210','#201c16','#fbf4e6','#bdae90','#b8912f','#e8c063'),
    _bd(t('فولاذ فاتح','Light Steel'),'1','#f4f6f9','#e4e9f0','#1f2a3a','#5a6678','#54688a','#8aa0c4'),
    _bd(t('برقوق','Plum'),'0',    '#150a1f','#20122e','#f4ecff','#bda6d3','#7a34d0','#b070e0'),
    _bd(t('جليد','Ice'),'1',     '#f4fafd','#e6f2f8','#12303d','#5a7885','#2f8fb0','#6fc4de'),
    _bd(t('صحراء ليلية','Night Desert'),'0','#161009','#221810','#fbf2e6','#c4ac90','#d8a35a','#f0c489'),
    _bd(t('أزرق ملكي','Royal Blue'),'0','#0a1024','#121a38','#eaf0fb','#9aa8c4','#2f5db0','#5f8ae0'),
    _bd(t('وردي هادئ','Calm Pink'),'1','#fff5f7','#fbe7ec','#3d1622','#8a5a68','#c14d6b','#e28aa0'),
    _bd(t('تركواز داكن','Deep Turquoise'),'0','#03181a','#0a2428','#e0fbfb','#93c8c8','#1ac0c0','#5fe0e0'),
    _bd(t('أبيض تحريري','Editorial White'),'1','#ffffff','#f2f2f3','#18181b','#6b6b70','#27272a','#52525b'),
    /* ---- 50 more professional themes (51–100) ---- */
    _bd(t('كربون','Carbon'),'0',    '#0a0c10','#141821','#eef1f6','#9aa2b0','#e0b23a','#ffd76a'),
    _bd(t('ثلج ناعم','Soft Snow'),'1', '#fbfcfe','#eef2f8','#1a2230','#5c6678','#3b62c4','#6f8ee0'),
    _bd(t('غابة عميقة','Deep Forest'),'0','#06140e','#0c2018','#e6fbf0','#93c4ab','#159a5e','#4fd699'),
    _bd(t('ياقوت داكن','Deep Ruby'),'0','#180509','#240a10','#ffe6ec','#cf9aa6','#b01236','#f0537a'),
    _bd(t('ذهب رملي','Sand Gold'),'1', '#fbf7ee','#efe6d2','#352a17','#786a50','#94651f','#c89a34'),
    _bd(t('محيط ليلي','Night Ocean'),'0','#03101c','#081e30','#e0f2ff','#93b6cf','#1284c0','#54c8f4'),
    _bd(t('بنفسج ملكي','Royal Violet'),'0','#0d0722','#150e34','#eee6ff','#ab9cd0','#6a2fd0','#a878ec'),
    _bd(t('فحم دافئ','Warm Charcoal'),'0', '#0e0d0c','#1a1815','#f4f2ee','#a8a29a','#e69a3a','#ffc26a'),
    _bd(t('توت داكن','Deep Berry'),'0', '#150612','#22102a','#ffe6f6','#cf9ec6','#a3106a','#e850a4'),
    _bd(t('زيتوني','Olive'),'1',   '#f5f7ec','#e6ecd4','#2a2f16','#646a4c','#6e7a24','#a4b444'),
    _bd(t('سماوي فاتح','Light Sky'),'1','#f0f9ff','#dceffb','#0e2c40','#4a6c82','#1f8fd0','#5fc0f0'),
    _bd(t('رمادي فحمي','Charcoal Grey'),'0','#0d0e10','#181a1e','#eef0f4','#a2a6ae','#7f9cff','#b4c4ff'),
    _bd(t('مرجاني','Coral'),'0',   '#1a0a0a','#261210','#fff0ec','#d3aaa2','#e0503a','#ff8e70'),
    _bd(t('عاجي دافئ','Warm Ivory'),'1','#fdf9f2','#f1e8d8','#33291c','#7a6a54','#9a6a2a','#cc9848'),
    _bd(t('أزرق فولاذي','Steel Blue'),'0','#070c18','#0e1830','#e6ecf8','#98a6c2','#2a55c0','#6288ec'),
    _bd(t('زمردي فاتح','Light Emerald'),'1','#eefcf4','#d8f2e4','#0e3a2a','#4a7a64','#12a06a','#4fd0a0'),
    _bd(t('خمري داكن','Deep Wine'),'0','#170710','#22101c','#fbe8f0','#cba6b6','#901048','#dc4886'),
    _bd(t('عنبري','Amber'),'0',    '#170f04','#241810','#fef2df','#cbb488','#e8961a','#ffcf5f'),
    _bd(t('نيلي','Indigo'),'0',     '#080a24','#101438','#e8eaff','#a0a4d4','#3838c0','#7a7aec'),
    _bd(t('وردي فاتح','Light Pink'),'1','#fff5f9','#fbe4ee','#40182a','#8a6072','#c84d80','#ec8ab0'),
    _bd(t('فيروزي عميق','Deep Turquoise'),'0','#03181c','#0a262c','#dcfbfc','#8fc8ca','#12b0b0','#5fe4e4'),
    _bd(t('أسود لامع','Glossy Black'),'0','#08080a','#121216','#f0f1f4','#a4a6ac','#d4d8e0','#ffffff'),
    _bd(t('حجر رملي','Sandstone'),'1', '#f7f5f0','#e9e4d8','#2e2a20','#6c6656','#8a6a3a','#bc9860'),
    _bd(t('أزرق سماوي','Azure Blue'),'0','#04101f','#0a2036','#e4f0fb','#96acc6','#1f6ad0','#5f9cf0'),
    _bd(t('ليموني','Lemon'),'0',   '#0f1405','#1a220a','#f4ffe2','#bed098','#84b024','#c4f050'),
    _bd(t('أوركيدي','Orchid'),'1',  '#fbf4fe','#eddef6','#361a40','#725a82','#9a34c4','#c47ce8'),
    _bd(t('كهرماني','Amber'),'0',  '#151007','#221912','#fdf3e0','#cbb488','#d89a24','#f4c45f'),
    _bd(t('كاكاو داكن','Deep Cocoa'),'0','#140c08','#201610','#f6ece2','#bfa892','#a06a3a','#d09860'),
    _bd(t('جينزي','Denim'),'1',    '#f2f6fc','#e0e9f5','#1c2f52','#586a88','#3558a0','#7090cc'),
    _bd(t('نعناعي داكن','Deep Mint'),'0','#04140f','#0a221a','#e2fbf0','#8fc4ac','#1aa878','#5fd8ac'),
    _bd(t('سلموني فاتح','Light Salmon'),'1','#fff6f2','#fbe6dc','#492c20','#8a6558','#d06040','#f4a080'),
    _bd(t('أزرق داكن جداً','Very Deep Blue'),'0','#05091a','#0a1230','#e6ecfb','#96a2c4','#3050b0','#6f8ce8'),
    _bd(t('أخضر طحلبي','Moss Green'),'0','#0c1206','#161e0a','#eef4e0','#b0bc90','#6e8a2a','#aac858'),
    _bd(t('يوسفي','Tangerine'),'0',    '#170e05','#241610','#fff0df','#d0ac88','#e07818','#ffa64f'),
    _bd(t('خوخي وردي','Pink Peach'),'1','#fff5f6','#fbe6ea','#43222c','#8a626c','#c05870','#eca0b4'),
    _bd(t('بحري ساطع','Bright Navy'),'0','#03141c','#0a242e','#dcf4fc','#8fbccb','#1298c4','#54d0f0'),
    _bd(t('أرجواني عميق','Deep Purple'),'0','#0e0620','#160e32','#efe6ff','#ac9ed0','#7328c4','#ab74e8'),
    _bd(t('ذهبي داكن','Deep Gold'),'0','#12100c','#1e1a12','#faf2e2','#bcae8e','#b8912f','#e6c063'),
    _bd(t('فضي فاتح','Light Silver'),'1', '#f6f7f9','#e6e9ee','#232833','#5e6472','#5a6c8c','#90a4c4'),
    _bd(t('برقوقي','Plum'),'0',   '#140a1c','#1e1230','#f0e6fb','#b6a4cf','#7434c4','#ac74e4'),
    _bd(t('جليدي','Icy'),'1',    '#f2fbfe','#e2f2f9','#123240','#587885','#2a92b4','#6fc6de'),
    _bd(t('صحراوي','Desert'),'0',   '#150f07','#221810','#faf2e4','#c8b090','#d0a04c','#ecc484'),
    _bd(t('كحلي ملكي','Royal Navy'),'0','#0a1026','#12183a','#e8eefb','#98a6c6','#2a5ec0','#5f92ec'),
    _bd(t('وردي عتيق','Vintage Pink'),'1','#fdf4f6','#f6e4ea','#3f1a26','#88586a','#bc506e','#e488a4'),
    _bd(t('تركوازي فاتح','Light Turquoise'),'1','#eefcfc','#d6f2f2','#0e3838','#4a7878','#12aaaa','#4fd6d6'),
    _bd(t('رصاصي','Slate'),'1',    '#f4f5f7','#e6e8ec','#22262e','#5c6270','#4c5a74','#8494b0'),
    _bd(t('برتقالي محروق','Burnt Orange'),'0','#170c06','#241410','#ffeee2','#d0a690','#e0602a','#ff9660'),
    _bd(t('أخضر بحري','Sea Green'),'0','#031614','#0a2422','#dcf6f2','#8fc4be','#12a094','#4fd4c6'),
    _bd(t('نبيذي فاخر','Royal Wine'),'0','#160810','#221020','#fbe8f2','#cba4b8','#9a1a58','#dc4c92'),
    _bd(t('أزرق مخملي','Velvet Blue'),'0','#070a1a','#0e142e','#e6eafb','#98a2c4','#3448b8','#7480e4'),
    /* ---- 50 more professional themes (101–150) ---- */
    _bd(t('ليل توتي','Berry Night'),'0',  '#0c0714','#160e22','#f0e8fb','#b2a4c8','#7a3ad0','#ac78ec'),
    _bd(t('قهوة فاتحة','Light Coffee'),'1','#f8f3ec','#ece0d0','#3a2c1e','#7a6a54','#956039','#c2905e'),
    _bd(t('أزرق جليدي','Icy Blue'),'1','#f0f8fd','#dcedf8','#123044','#4e6e82','#2287c0','#5cbef0'),
    _bd(t('غروب ناري','Fiery Sunset'),'0','#170a08','#25120e','#ffece4','#d3a898','#e04e2a','#ff8c56'),
    _bd(t('زمرد داكن','Deep Emerald'),'0','#03130d','#0a2018','#dcfbee','#8cc4aa','#12a05e','#4fd694'),
    _bd(t('ضباب رمادي','Grey Mist'),'1','#f5f6f8','#e7eaef','#242832','#5e6472','#556184','#8896b8'),
    _bd(t('توهج ذهبي','Golden Glow'),'0','#14110a','#201a10','#fcf3e0','#c2b088','#c99320','#ecc258'),
    _bd(t('بترولي','Teal'),'0',   '#04141a','#0a2028','#dcf4fa','#8cbcca','#0f8ca8','#4cccea'),
    _bd(t('خزامى فاتح','Light Lavender'),'1','#f9f5fd','#ece2f6','#341c42','#6f5c82','#8a3ec0','#bc7ce6'),
    _bd(t('كرزي','Cherry'),'0',     '#170710','#23101c','#ffe6f2','#cfa2ba','#a01050','#e2488c'),
    _bd(t('عشبي','Grass'),'1',     '#f3f8ee','#e4eed6','#26301a','#5e6a4c','#6a8a2c','#a2b84c'),
    _bd(t('نيلي عميق','Deep Indigo'),'0','#080826','#101038','#e6e8ff','#a0a2d2','#3434c2','#7676ea'),
    _bd(t('مرجان فاتح','Light Coral'),'1','#fff5f3','#fbe4de','#48261e','#8a655a','#d0583c','#f49a7c'),
    _bd(t('رخام داكن','Dark Marble'),'0','#0c0d0f','#17181c','#eef0f4','#a4a8b0','#c8ccd6','#f0f2f8'),
    _bd(t('عنبر غامق','Deep Amber'),'0','#160f05','#241810','#fdf2df','#cbb082','#dc9418','#f8c250'),
    _bd(t('محيطي','Oceanic'),'1',    '#eff9fd','#d8eff8','#0e3040','#4a7080','#1a8cba','#58c2e4'),
    _bd(t('برقوق داكن','Deep Plum'),'0','#130818','#1e1028','#f2e6fb','#b8a6cc','#7228bc','#a86ce0'),
    _bd(t('ليموني داكن','Deep Lemon'),'0','#0d1206','#171e0a','#f2ffde','#bcce92','#7ea81e','#bcec48'),
    _bd(t('صدأ','Rust'),'0',      '#160c07','#231610','#fbeee2','#cba892','#b06030','#dc9260'),
    _bd(t('سماوي عميق','Deep Sky'),'0','#04101e','#0a2034','#e2f0fb','#94accc','#1a72c8','#58a2ec'),
    _bd(t('وردي غامق','Deep Pink'),'0','#170812','#221020','#ffe6f4','#cba2ba','#b01868','#e650a0'),
    _bd(t('فيروز فاتح','Light Turquoise'),'1','#effcfb','#d6f4f2','#0e3a38','#4a7a76','#12aca6','#50d8d0'),
    _bd(t('كحلي فحمي','Charcoal Navy'),'0','#080a16','#101228','#e6e8f4','#98a0be','#3a4e9a','#7284c8'),
    _bd(t('خوخ فاتح','Light Peach'),'1', '#fff6f0','#fbe6da','#4a2e20','#8a6656','#d06838','#f4a072'),
    _bd(t('بنفسج داكن','Deep Violet'),'0','#0e0620','#160c34','#eee4ff','#aa9cd2','#6a24c8','#a068ec'),
    _bd(t('زيتي داكن','Deep Olive'),'0','#101305','#1a200a','#eef4de','#b0bc8e','#748a20','#aec84a'),
    _bd(t('تركواز غامق','Deep Turquoise'),'0','#031816','#0a2622','#dcf6f2','#8ec6bc','#12a894','#50d8c4'),
    _bd(t('ذهب وردي','Rose Gold'),'1', '#fef4f2','#f7e2dc','#42272a','#886066','#c06a72','#e89ca2'),
    _bd(t('أزرق فولاذي2','Steel Blue 2'),'0','#070c16','#0e162c','#e6ecf6','#98a4bc','#345ea8','#6a90d4'),
    _bd(t('نعناع فاتح','Light Mint'),'1','#eefbf5','#d8f2e6','#0e3a2c','#4a7a66','#12a86e','#50d69e'),
    _bd(t('كهرمان فاتح','Light Amber'),'1','#fdf6ea','#f2e6cc','#3a2e14','#7a6a48','#a07818','#cca044'),
    _bd(t('أرجوان غامق','Deep Purple'),'0','#100622','#180e36','#f0e4ff','#ac9ad4','#7020c8','#a662ec'),
    _bd(t('بحري فاتح','Light Navy'),'1','#f0f7fd','#dcecf8','#123244','#4e7082','#2280bc','#5cb8ee'),
    _bd(t('برتقال داكن','Deep Orange'),'0','#160b05','#231410','#ffece0','#d0a68e','#dc5e1e','#fc9250'),
    _bd(t('أخضر داكن2','Deep Green 2'),'0','#06120c','#0c1e16','#def6ea','#8ec2a6','#149660','#4ec894'),
    _bd(t('ياقوت فاتح','Light Ruby'),'1','#fdf3f5','#f6e2e8','#3f1a24','#885864','#bc3a5e','#e47c98'),
    _bd(t('رمادي أزرق','Blue Grey'),'1','#f4f6fa','#e4e9f2','#1e2a3c','#586880','#4a6494','#7e9cc8'),
    _bd(t('كوبالت غامق','Deep Cobalt'),'0','#040820','#0a1236','#e6eafb','#96a0c8','#2842c4','#6478ea'),
    _bd(t('خمري فاتح','Light Wine'),'1','#fbf2f4','#f4e0e6','#3d1a24','#865864','#b03a56','#dc7a92'),
    _bd(t('عنبي','Grape'),'0',     '#0e0716','#180e26','#eee4f6','#b0a2c4','#6234a8','#9c6cd4'),
    _bd(t('ذهبي رملي2','Sand Gold 2'),'1','#faf5ea','#efe4ca','#352a16','#786c4c','#94661e','#c49838'),
    _bd(t('محيط داكن2','Deep Ocean 2'),'0','#03121c','#081f30','#dcf0fb','#8eaecc','#1276b8','#4ca8ec'),
    _bd(t('نعناعي غامق','Deep Mint'),'0','#04140e','#0a2018','#def8ec','#8ec6a8','#14a468','#50d69a'),
    _bd(t('توت فاتح','Light Berry'),'1', '#fdf2f8','#f6e0ee','#3f1a30','#88586e','#b03a7c','#dc7ab0'),
    _bd(t('فحمي أزرق','Charcoal Blue'),'0','#0a0c12','#151822','#eef0f6','#a2a8b6','#6a8cf0','#a0b8ff'),
    _bd(t('عسلي','Honey'),'0',     '#160f06','#241810','#fef2e0','#cbb084','#dc9820','#f8c458'),
    _bd(t('سماوي غامق','Deep Azure'),'0','#040e1c','#0a1c30','#e0eefb','#92aacc','#1a68c4','#589cec'),
    _bd(t('بنفسج فاتح','Light Violet'),'1','#f8f4fd','#eae0f6','#301a40','#6c5a80','#8434c0','#b674e6'),
    _bd(t('زبرجد','Peridot'),'0',    '#03140f','#0a201a','#dcf6ee','#8ec6ba','#12a084','#50d4bc'),
    _bd(t('أنيق أبيض2','Elegant White 2'),'1','#fdfdfd','#f0f1f3','#1a1a1e','#66666e','#2a2a30','#565660'),
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
  const BLOG_ANIMS   = [{id:'none',name:t('بدون','None')},{id:'fade',name:t('ظهور ناعم','Soft fade')},{id:'rise',name:t('صعود','Rise')},{id:'zoom',name:t('تكبير','Zoom')},{id:'slide',name:t('انزلاق جانبي','Side slide')},{id:'flip',name:t('انقلاب','Flip')}];
  const BLOG_SEARCH  = [{id:'off',name:t('بدون','None')},{id:'pill',name:t('كبسولة','Pill')},{id:'box',name:t('صندوق','Box')},{id:'underline',name:t('خط سفلي','Underline')},{id:'glow',name:t('متوهّج','Glowing')}];
  const BLOG_SIDEBAR = [{id:'none',name:t('بدون','None')},{id:'cards',name:t('بطاقات','Cards')},{id:'minimal',name:t('بسيط','Minimal')},{id:'bordered',name:t('مؤطّر','Bordered')}];
  const BLOG_TICKER  = [{id:'none',name:t('بدون','None')},{id:'marquee',name:t('شريط متحرك','Moving marquee')},{id:'badge',name:t('شارة «عاجل»','Breaking badge')},{id:'dots',name:t('نقاط وامضة','Blinking dots')}];
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
  const blogReadTime = body => { const w=stripHTML(body).split(/\s+/).filter(Boolean).length; return Math.max(1,Math.round(w/180))+t(' دقائق قراءة',' min read'); };
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
  const blogAvatar = (name,cls='bh-av') => `<span class="${cls}">${esc(initials(name||t('مدونة','Blog')))}</span>`;

  /* Blogger-style rich-text toolbar (shared markup; execCommand acts on the focused editor) */
  const _rsvg = p => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const RTE_TOOLBAR = `<div class="rte-toolbar">
    <button type="button" class="rte-btn" data-cmd="bold" title="${t('عريض','Bold')}"><b>B</b></button>
    <button type="button" class="rte-btn" data-cmd="italic" title="${t('مائل','Italic')}"><i>I</i></button>
    <button type="button" class="rte-btn" data-cmd="underline" title="${t('تحته خط','Underline')}"><u>U</u></button>
    <button type="button" class="rte-btn" data-cmd="strikeThrough" title="${t('يتوسّطه خط','Strikethrough')}"><s>S</s></button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h2" title="${t('عنوان رئيسي','Heading')}">H2</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h3" title="${t('عنوان فرعي','Subheading')}">H3</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="blockquote" title="${t('اقتباس','Quote')}">${_rsvg('<path d="M7 7c-1.6 0-3 1.4-3 3v6h5v-5H6c0-1 .6-2 2-2Zm9 0c-1.6 0-3 1.4-3 3v6h5v-5h-3c0-1 .6-2 2-2Z"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="p" title="${t('فقرة عادية','Paragraph')}">¶</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="${t('قائمة نقطية','Bulleted list')}">${_rsvg('<circle cx="4.5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="17" r="1.1" fill="currentColor" stroke="none"/><path d="M9 7h11M9 12h11M9 17h11"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="insertOrderedList" title="${t('قائمة مرقّمة','Numbered list')}">${_rsvg('<path d="M9 7h11M9 12h11M9 17h11M3.5 5.5h1V9M3 9h2"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="justifyRight" title="${t('محاذاة لليمين','Align right')}">${_rsvg('<path d="M4 6h16M9 12h11M6 18h14"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="justifyCenter" title="${t('توسيط','Center')}">${_rsvg('<path d="M4 6h16M7 12h10M6 18h12"/>')}</button>
    <button type="button" class="rte-btn" data-cmd="justifyLeft" title="${t('محاذاة لليسار','Align left')}">${_rsvg('<path d="M4 6h16M4 12h11M4 18h14"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="createLink" title="${t('إدراج رابط','Insert link')}">${_rsvg('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>')}</button>
    <button type="button" class="rte-btn" data-rteimg title="${t('إدراج صورة','Insert image')}">${_rsvg('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-9 9"/>')}</button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-codeblock title="${t('كتلة كود برمجي','Code block')}">${_rsvg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>')}</button>
    <button type="button" class="rte-btn" data-codeinline title="${t('كود ضمن السطر','Inline code')}"><span style="font-family:ui-monospace,monospace;font-size:14px;font-weight:700">&lt;&#47;&gt;</span></button>
    <span class="rte-sep"></span>
    <button type="button" class="rte-btn" data-cmd="removeFormat" title="${t('مسح التنسيق','Clear formatting')}">${_rsvg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
  </div>`;

  /* ---------- blog viewer ---------- */
  async function showBlogViewer(id){
    $('#app').innerHTML = `<div class="loader"><div><div class="spin"></div>${t('جارٍ تحميل المدونة…','Loading blog…')}</div></div>`;
    try{
      const snap = await get(child(ref(db),'blogs/'+id));
      if(!snap.exists()){
        renderError({code:'404', tag:t('مدونة غير موجودة · NOT FOUND','BLOG NOT FOUND'), title:t('هذه المدونة غير موجودة','This blog does not exist'),
          msg:t('الرابط غير صحيح أو تم حذف المدونة. تحقّق من الرابط أو أنشئ مدونتك الخاصة.','The link is invalid or the blog was deleted. Check the link or create your own blog.')});
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
      renderError({code:'⚠', tag:t('تعذّر التحميل · LOAD ERROR','LOAD ERROR'), title:t('تعذّر تحميل المدونة','Could not load the blog'),
        msg:t('تحقّق من اتصالك بالإنترنت أو من قواعد قاعدة البيانات، ثم أعد المحاولة.','Check your internet connection or your database rules, then try again.'), showReload:true});
    }
  }
  function blogShell(d){
    const dz = blogDesign(d.design);
    document.body.style.background = dz.bg;
    document.title = (d.title||t('مدونة','Blog'))+' — elgoharyX';
    setMeta('meta[name="description"]','content',(d.subtitle||d.about||t('مدونة احترافية','A professional blog')).slice(0,155));
    setMeta('meta[property="og:title"]','content',(d.title||t('مدونة','Blog'))+' | elgoharyX');
    setMeta('meta[property="og:image"]','content',d.cover||LOGO);
    return dz;
  }
  function blogTop(d,dz){
    const logo = d.logo
      ? `<img class="bt-logo" src="${esc(d.logo)}" alt="${esc(d.title)}" onerror="this.outerHTML='<span class=\\'bt-mono\\'>${esc(initials(d.title))}</span>'"/>`
      : `<span class="bt-mono">${esc(initials(d.title||t('مدونة','Blog')))}</span>`;
    const home = urlHome();
    return `<header class="blog-top">
      <div class="bt-brand">${logo}<div class="bt-tt">${esc(d.title||t('مدونة','Blog'))}${d.author?`<small>${t('بقلم','By')} ${esc(d.author)}</small>`:''}</div></div>
      <a class="bt-cta" href="${home}">✦ ${t('أنشئ مدونتك','Create your blog')}</a>
    </header>`;
  }
  function blogHero(d,dz){
    const kick = d.author?`<span class="blog-kick">${t('مدونة','Blog')} ${esc(d.author)}</span>`:`<span class="blog-kick">${t('مدونة إلكترونية','Online blog')}</span>`;
    const title = `<h1 class="bhero-title">${esc(d.title||t('عنوان المدونة','Blog title'))}</h1>`;
    const sub = d.subtitle?`<p class="bhero-sub">${esc(d.subtitle)}</p>`:'';
    const meta = `<div class="bhero-meta"><span class="bh-au">${blogAvatar(d.author)}${esc(d.author||t('الكاتب','Author'))}</span>
      <span class="dot"></span><span>${blogPosts(d).length} ${t('مقالة','articles')}</span></div>`;
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
        <h3 class="bpost-title">${esc(p.title||t('مقالة بدون عنوان','Untitled article'))}</h3>
        <p class="bpost-ex">${postExcerpt(p)}</p>
        <div class="bpost-meta">${date?`<span>${date}</span><span class="dot"></span>`:''}<span>${blogReadTime(p.body)}</span></div>
      </div></article>`;
  }
  /* ---- optional blog elements: news ticker, search box, sidebar ---- */
  function blogTicker(d){
    const style=bTickerStyle(d); if(style==='none') return '';
    const posts=blogPosts(d); if(!posts.length) return '';
    const titles=posts.slice(0,8).map(p=>esc(p.title||t('مقالة','Article')));
    if(style==='marquee'){
      const items=titles.map(t=>`<span class="tk-item">${t}</span>`).join('<span class="tk-sep">◆</span>');
      return `<div class="blog-ticker tk-marquee"><span class="tk-label">${t('آخر الأخبار','Latest news')}</span>
        <div class="tk-scroll"><div class="tk-track">${items}<span class="tk-sep">◆</span>${items}</div></div></div>`;
    }
    if(style==='badge'){
      return `<div class="blog-ticker tk-badge"><span class="tk-flag">${t('عاجل','Breaking')}</span><span class="tk-one">${titles[0]}</span></div>`;
    }
    const items=titles.slice(0,5).map(t=>`<span class="tk-item"><i class="tk-dot pulse-dot"></i>${t}</span>`).join('');
    return `<div class="blog-ticker tk-dots"><span class="tk-label">${t('آخر الأخبار','Latest news')}</span><div class="tk-list">${items}</div></div>`;
  }
  function blogSearchBox(d){
    const style=bSearchStyle(d); if(style==='off') return '';
    return `<div class="blog-search bs-${style}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="search" class="blog-search-input" placeholder="${t('ابحث في المقالات…','Search articles…')}" aria-label="${t('بحث في المقالات','Search articles')}"/></div>`;
  }
  function blogSidebar(d,posts){
    const style=bSidebarStyle(d); if(style==='none') return '';
    const recent=posts.slice(0,5).map((p,i)=>`<a class="sb-post" data-post="${posts.indexOf(p)}"><span class="sb-idx">${i+1}</span><span class="sb-pt">${esc(p.title||t('مقالة','Article'))}</span></a>`).join('')
      || `<span class="sb-empty">${t('لا مقالات بعد','No articles yet')}</span>`;
    const tags=[...new Set(posts.map(p=>p.tag).filter(Boolean))].slice(0,12);
    const tagHtml=tags.length?`<div class="sb-block"><h4>${t('التصنيفات','Categories')}</h4><div class="sb-tags">${tags.map(t=>`<span class="sb-tag">${esc(t)}</span>`).join('')}</div></div>`:'';
    const about=d.about?`<div class="sb-block"><h4>${t('عن المدونة','About the blog')}</h4><p class="sb-about">${esc(d.about)}</p></div>`:'';
    const author=`<div class="sb-block sb-author">${blogAvatar(d.author,'av')}<div><b>${esc(d.author||t('الكاتب','Author'))}</b><span>${esc(d.authorEn||'')||t('مدونة على elgoharyX','A blog on elgoharyX')}</span></div></div>`;
    return `<aside class="blog-side sb-${style}">
      ${author}
      <div class="sb-block"><h4>${t('أحدث المقالات','Latest articles')}</h4><div class="sb-posts">${recent}</div></div>
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
      <span class="br-label">${t('قيّم هذه المدونة','Rate this blog')}</span>
      <div class="br-stars" role="group" aria-label="${t('تقييم من 5 نجوم','Rate out of 5 stars')}">
        ${[1,2,3,4,5].map(n=>`<button type="button" class="br-star${n<=Math.round(disp)?' on':''}" data-star="${n}" aria-label="${n}">${RSTAR}</button>`).join('')}
      </div>
      <div class="br-info">${count?`<b>${avg.toFixed(1)}</b><span>${t('من 5 · '+count+' تقييم','of 5 · '+count+' ratings')}</span>`:`<span>${t('كن أول من يقيّمها','Be the first to rate it')}</span>`}${mine?`<span class="br-mine">${t('تقييمك '+mine+'★','You: '+mine+'★')}</span>`:''}</div>
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
    if(!uid){ toast(t('سجّل الدخول لتقييم المدونة','Sign in to rate the blog')); return; }
    try{
      await set(ref(db,'blogRatings/'+id+'/'+uid), val);
      const s=await get(child(ref(db),'blogRatings/'+id));
      const votes=s.exists()?s.val():{}; let sum=0,count=0;
      for(const k in votes){ const v=+votes[k]; if(v>=1&&v<=5){ sum+=v; count++; } }
      const idx=await get(child(ref(db),'blogIndex/'+id));
      if(idx.exists()) await update(ref(db,'blogIndex/'+id), { rSum:sum, rCount:count });
      toast(t('شكراً لتقييمك ✓','Thanks for your rating ✓'));
      const el=$('#blogRate'); if(el) renderRatingWidget(el, id, count?sum/count:0, count, val);
    }catch(e){ console.error(e); toast(t('تعذّر حفظ التقييم — تأكد من نشر قواعد قاعدة البيانات','Could not save rating — make sure the database rules are published')); }
  }

  function renderBlogIndex(id,d){
    const dz = blogShell(d);
    const posts = blogPosts(d);
    const featured = posts[0];
    const rest = posts.slice(1);
    const feat = featured ? `<div class="blog-feat" data-post="0">
        <div class="bf-media">${featured.cover?`<img src="${esc(featured.cover)}" alt="" onerror="this.remove()"/>`:''}</div>
        <div class="bf-body">
          ${featured.tag?`<span class="bf-tag">${esc(featured.tag)}</span>`:`<span class="bf-tag">${t('مقالة مميزة','Featured Article')}</span>`}
          <h2 class="bf-title">${esc(featured.title||t('مقالة مميزة','Featured Article'))}</h2>
          <p class="bf-ex">${featured.excerpt?esc(featured.excerpt):esc(stripHTML(featured.body).slice(0,220))}</p>
          <div class="bf-meta">${blogAvatar(d.author,'bh-av')}<span>${esc(d.author||t('الكاتب','Author'))}</span><span class="dot"></span><span>${blogReadTime(featured.body)}</span></div>
        </div></div>` : '';
    const grid = rest.length
      ? `<div class="blog-sec-h"><h3>${t('أحدث المقالات','Latest Articles')}</h3><span class="rule"></span></div>
         <div class="blog-grid">${rest.map((p,i)=>blogPostCard(p,i+1)).join('')}</div>`
      : (featured?'':`<div class="blog-empty">${t('لا توجد مقالات منشورة بعد في هذه المدونة.','No published articles yet in this blog.')}</div>`);
    const about = d.about ? `<div class="blog-sec-h" style="margin-top:44px"><h3>${t('عن المدونة','About the Blog')}</h3><span class="rule"></span></div>
      <p class="bhero-sub" style="max-width:75ch">${esc(d.about)}</p>` : '';
    const foot = `<footer class="blog-foot"><div class="blog-foot-in">
        <div class="bf-au">${blogAvatar(d.author,'av')}<div><b>${esc(d.author||t('الكاتب','Author'))}</b><span>${esc(d.authorEn||'')||t('مدونة على elgoharyX','A blog on elgoharyX')}</span></div></div>
        <div class="bf-copy">© 2026 <b>${esc(d.title||'')}</b> — ${t('بُنيت عبر','Built with')} <a href="${urlHome()}">elgoharyX</a></div>
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
      const vEl=$('#artViews'); if(vEl) vEl.innerHTML=ART_EYE+' '+fmtNum(views)+' '+t('مشاهدة','views');
      setLikeBtn($('#artLike'), lc, uid && likes[uid]);
    }catch(e){ console.warn('engagement load failed', e); const vEl=$('#artViews'); if(vEl) vEl.style.display='none'; }
  }
  async function toggleArtLike(id, idx){
    const uid=getSession();
    if(!uid){ toast(t('سجّل الدخول للإعجاب بالمقال','Sign in to like the article')); return; }
    const btn=$('#artLike'); if(!btn) return;
    const willLike=!btn.classList.contains('on');
    setLikeBtn(btn, (+btn.dataset.lc||0)+(willLike?1:-1), willLike);
    try{ const r=ref(db,'articleStats/'+id+'/'+idx+'/likes/'+uid);
      if(willLike) await set(r,true); else await remove(r);
    }catch(e){ console.error(e); toast(t('تعذّر — تأكد من نشر قواعد قاعدة البيانات','Failed — make sure the database rules are published')); loadArticleEngagement(id,idx); }
  }
  function shareArticle(id, idx){
    const url=pageUrl('blog.html','blog='+id+'&post='+idx);
    if(navigator.share){ navigator.share({title:document.title, url}).catch(()=>{}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(url).then(()=>toast(t('تم نسخ رابط المقال ✓','Article link copied ✓'))); }
    else toast(url);
  }

  /* ---------- article comments ---------- */
  const cmtDate = at => { try{ return new Date(at).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return ''; } };
  function commentHTML(c, cid, canDel){
    return `<div class="ac-item" data-cid="${cid}">
      <span class="ac-av">${esc(initials(c.name||t('؟','?')))}</span>
      <div class="ac-main">
        <div class="ac-top"><b>${esc(c.name||t('مستخدم','User'))}</b><span class="ac-date">${cmtDate(c.at)}</span>
          ${canDel?`<button class="ac-del" data-del="${cid}" type="button">${t('حذف','Delete')}</button>`:''}</div>
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
        : `<div class="ac-empty">${t('لا توجد تعليقات بعد — كن أول من يعلّق.','No comments yet — be the first to comment.')}</div>`;
      listEl.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteComment(id,idx,b.dataset.del,d));
    }catch(e){ console.warn('comments load failed', e); listEl.innerHTML=`<div class="ac-empty">${t('تعذّر تحميل التعليقات — تأكد من نشر قواعد قاعدة البيانات.','Failed to load comments — make sure the database rules are published.')}</div>`; }
  }
  async function postComment(id, idx, d){
    const uid=getSession();
    if(!uid){ toast(t('سجّل الدخول للتعليق','Sign in to comment')); return; }
    const ta=$('#acText'); if(!ta) return;
    const text=(ta.value||'').trim();
    if(text.length<1){ toast(t('اكتب تعليقًا أولاً','Write a comment first')); return; }
    if(text.length>1500){ toast(t('التعليق طويل جدًا (1500 حرف كحد أقصى)','Comment too long (1500 chars max)')); return; }
    const btn=$('#acPost'); if(btn){ btn.disabled=true; btn.textContent=t('جارٍ الإرسال…','Sending…'); }
    try{
      const name=((currentUser&&currentUser.username)||t('مستخدم','User')).slice(0,60);
      await set(ref(db,'articleComments/'+id+'/'+idx+'/'+shortId(14)), { uid, name, text, at:Date.now() });
      ta.value=''; toast(t('تم إضافة تعليقك ✓','Your comment was added ✓')); loadComments(id,idx,d);
    }catch(e){ console.error(e); toast(t('تعذّر إضافة التعليق — تأكد من نشر قواعد قاعدة البيانات','Could not add comment — make sure the database rules are published')); }
    finally{ if(btn){ btn.disabled=false; btn.textContent=t('أضف تعليق','Add Comment'); } }
  }
  async function deleteComment(id, idx, cid, d){
    if(!confirm(t('حذف هذا التعليق؟','Delete this comment?'))) return;
    try{ await remove(ref(db,'articleComments/'+id+'/'+idx+'/'+cid)); toast(t('تم حذف التعليق','Comment deleted')); loadComments(id,idx,d); }
    catch(e){ console.error(e); toast(t('تعذّر الحذف — تأكد من نشر القواعد','Could not delete — make sure the rules are published')); }
  }

  function renderArticle(id,d,idx){
    const dz = blogShell(d);
    const posts = blogPosts(d);
    const p = posts[idx]; if(!p){ renderBlogIndex(id,d); return; }
    document.title = (p.title||t('مقالة','Article'))+' — '+(d.title||t('مدونة','Blog'));
    const others = posts.map((x,i)=>({x,i})).filter(o=>o.i!==idx).slice(0,3);
    const more = others.length ? `<div class="art-more"><div class="blog-sec-h"><h3>${t('مقالات أخرى','More Articles')}</h3><span class="rule"></span></div>
      <div class="blog-grid">${others.map(o=>blogPostCard(o.x,o.i)).join('')}</div></div>` : '';
    $('#app').innerHTML = `<div class="blog ${dz.id} bf-${dz.bf} bh-${dz.bh}">
      ${blogTop(d,dz)}
      <div class="article-view">
        <button class="art-back">${t('→ العودة إلى المدونة','→ Back to blog')}</button>
        ${p.tag?`<span class="art-tag">${esc(p.tag)}</span>`:''}
        <h1 class="art-title">${esc(p.title||t('مقالة','Article'))}</h1>
        <div class="art-meta">${blogAvatar(d.author,'bh-av')}<span>${esc(d.author||t('الكاتب','Author'))}</span>
          ${blogFmtDate(p.date)?`<span class="dot"></span><span>${blogFmtDate(p.date)}</span>`:''}
          <span class="dot"></span><span>${blogReadTime(p.body)}</span>
          <span class="dot"></span><span class="art-views" id="artViews">${ART_EYE} …</span></div>
        ${p.cover?`<div class="art-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)}" onerror="this.closest('.art-cover').remove()"/></div>`:''}
        <div class="art-body dropcap">${renderPostBody(p.body)||`<p>${t('لا يوجد محتوى.','No content.')}</p>`}</div>
        <div class="art-actions">
          <button class="art-like" id="artLike" type="button" aria-label="${t('إعجاب','Like')}">${ART_HEART}<span class="al-count">0</span></button>
          <button class="art-share" id="artShare" type="button">${ART_SHARE}<span>${t('مشاركة','Share')}</span></button>
        </div>
        <section class="art-comments">
          <h3 class="ac-h">${t('التعليقات','Comments')} <span id="acCount"></span></h3>
          ${currentUser
            ? `<div class="ac-form"><textarea id="acText" rows="3" maxlength="1500" placeholder="${t('اكتب تعليقك…','Write your comment…')}"></textarea>
                <button class="btn primary" id="acPost" type="button">${t('أضف تعليق','Add Comment')}</button></div>`
            : `<div class="ac-login">${t('سجّل الدخول لإضافة تعليق.','Sign in to add a comment.')} <a href="${urlLogin()}">${t('تسجيل الدخول','Log in')}</a></div>`}
          <div class="ac-list" id="acList"><div class="ac-empty">${t('جارٍ تحميل التعليقات…','Loading comments…')}</div></div>
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
      : `<span class="badm-logo" style="background:${grad}">${esc(initials(d.title||t('مدونة','Blog')))}</span>`;
    const rows = posts.length ? posts.map((p,i)=>{
      const pub = p.published!==false;
      const th = p.cover
        ? `<img class="bp-th" src="${esc(p.cover)}" alt="" onerror="this.outerHTML='<span class=&quot;bp-th&quot;>${esc(initials(p.title||'#'))}</span>'"/>`
        : `<span class="bp-th">${esc(initials(p.title||'#'))}</span>`;
      return `<div class="badm-post" data-pi="${i}">
        ${th}
        <div class="bp-main">
          <div class="bp-title">${esc(p.title||t('مقالة بدون عنوان','Untitled article'))}</div>
          <div class="bp-meta">
            <span class="bp-stat ${pub?'on':'off'}">${pub?t('منشورة','Published'):t('غير منشورة','Unpublished')}</span>
            ${p.tag?`<span>${esc(p.tag)}</span>`:''}
            <span>${blogReadTime(p.body)}</span>
          </div>
        </div>
        <div class="bp-acts">
          <button data-pedit="${i}">${IC2.pen} ${t('تعديل','Edit')}</button>
          <button data-ppub="${i}">${pub?t('إلغاء النشر','Unpublish'):t('نشر','Publish')}</button>
          <button class="danger" data-pdel="${i}">${t('حذف','Delete')}</button>
        </div>
      </div>`;
    }).join('') : `<div class="mp-empty">${t('لا توجد مقالات بعد — اضغط «مقال جديد» لإضافة أول تدوينة.','No articles yet — click New Article to add your first post.')}</div>`;
    return `<div class="wrap">
      <div class="badm-hero">
        ${logo}
        <div class="badm-id"><h2>${esc(d.title||t('مدونتي','My Blog'))}</h2>
          <div class="sub">${posts.length} ${t('تدوينة','posts')} · ${t('تصميم','Design')} ${esc(dz.name)}</div></div>
        <div class="badm-acts">
          <a href="${urlBlogView(id)}" target="_blank">${IC2.eye} ${t('عرض المدونة','View Blog')}</a>
          <button id="baLink">${IC2.link} ${t('نسخ الرابط','Copy Link')}</button>
          <button id="baEdit">${IC2.pen} ${t('تعديل بيانات المدونة','Edit Blog Details')}</button>
        </div>
      </div>
      <div class="badm-bar"><h3>${t('إدارة التدوينات','Manage Posts')}</h3>
        <button class="btn primary" id="baNew" style="width:auto;padding:10px 18px">${TAB.plus} ${t('مقال جديد','New Article')}</button></div>
      <div class="badm-posts" id="baPosts">${rows}</div>
    </div>`;
  }

  async function showBlogAdmin(){
    if(!currentUser){ showAuth('login'); return; }
    document.title=t('إدارة مدونتي — elgoharyX','Manage My Blog — elgoharyX');
    document.body.style.background='';
    const drawEmpty=()=>{
      $('#app').innerHTML = appbar('blogs') + `<div class="wrap">
        <div class="mp-head"><div><h2>${t('مدونتي','My Blog')}</h2><div class="sub">${t('لكل حساب مدونة واحدة. أنشئ مدونتك وابدأ النشر.','Each account has one blog. Create yours and start publishing.')}</div></div></div>
        <div class="mp-empty">${t('لا توجد مدونة بعد.','No blog yet.')}<br><br>
          <button class="btn primary" id="baCreate" style="width:auto;padding:12px 22px">${t('أنشئ مدونتك','Create your Blog')}</button></div>
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
        await set(ref(db,'userBlogs/'+currentUser.uid+'/'+id), {title:d.title||t('مدونة','Blog'), design:d.design, updatedAt:d.updatedAt});
        await set(ref(db,'blogIndex/'+id), {title:d.title||t('مدونة','Blog'), subtitle:d.subtitle||'', author:d.author||'',
          cover:d.cover||'', design:d.design, count:pub, updatedAt:d.updatedAt});
      };
      const wire=()=>{
        $('#baLink')&&($('#baLink').onclick=()=>{navigator.clipboard?.writeText(urlBlogView(id));toast(t('تم نسخ رابط المدونة ✓','Blog link copied ✓'));});
        $('#baEdit')&&($('#baEdit').onclick=()=>startBlogEdit(id));
        $('#baNew')&&($('#baNew').onclick=()=>startBlogEdit(id,'new'));
        document.querySelectorAll('[data-pedit]').forEach(b=>b.onclick=()=>startBlogEdit(id,+b.dataset.pedit));
        document.querySelectorAll('[data-ppub]').forEach(b=>b.onclick=async()=>{
          const i=+b.dataset.ppub; if(!d.posts[i]) return;
          d.posts[i].published = (d.posts[i].published===false);
          b.disabled=true;
          try{ await persist(); toast(d.posts[i].published?t('تم النشر ✓','Published ✓'):t('تم إلغاء النشر','Unpublished')); }
          catch(e){ console.error(e); toast(t('تعذّر الحفظ','Could not save')); }
          paint();
        });
        document.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=async()=>{
          if(!confirm(t('حذف هذه التدوينة نهائياً؟','Delete this post permanently?'))) return;
          const i=+b.dataset.pdel; d.posts.splice(i,1);
          try{ await persist(); toast(t('تم حذف التدوينة','Post deleted')); }
          catch(e){ console.error(e); toast(t('تعذّر الحذف','Delete failed')); }
          paint();
        });
      };
      function paint(){ $('#app').innerHTML = appbar('blogs') + blogAdminView(id,d) + drawer('blogs'); wireAppbar(); wire(); }
      paint();
    }catch(e){
      console.error(e);
      $('#app').innerHTML = appbar('blogs') + `<div class="wrap"><div class="mp-empty">${t('تعذّر تحميل المدونة. تحقّق من قواعد قاعدة البيانات.','Could not load the blog. Check the database rules.')}</div></div>` + drawer('blogs');
      wireAppbar();
    }
  }

  /* ---------- blog builder state ---------- */
  const BLOG_EMPTY = { title:'', subtitle:'', author:'', authorEn:'', about:'', cover:'', logo:'', design:'bd1',
    threeD:false, anim:'none', searchStyle:'off', sidebarStyle:'none', tickerStyle:'none', posts:[] };
  const BLOG_SAMPLE = {
    title:t('مدوّنة الفكر والمعرفة','The Thought & Knowledge Blog'), subtitle:t('مقالات في العلم والثقافة والتطوير الذاتي — تُنشر بعناية لتثري عقلك.','Articles on science, culture, and self-development — carefully written to enrich your mind.'),
    author:t('أ. محمد الجوهري','Mohamed Elgohary'), authorEn:'Mohamed Elgohary', about:t('مساحة معرفية أنشرها لمشاركة أفكاري وقراءاتي وتجاربي مع كل باحث عن المعرفة.','A knowledge space I publish to share my thoughts, readings, and experiences with every seeker of knowledge.'),
    cover:'', logo:'', design:'bd1',
    threeD:true, anim:'rise', searchStyle:'pill', sidebarStyle:'cards', tickerStyle:'marquee',
    posts:[
      {id:'p1',title:t('كيف تبني عادة القراءة اليومية','How to Build a Daily Reading Habit'),tag:t('تطوير ذاتي','Self-development'),date:Date.now(),cover:'',published:true,excerpt:t('خطوات عملية مبنية على علم النفس السلوكي لتحويل القراءة إلى عادة راسخة تلازمك مدى الحياة.','Practical steps grounded in behavioral psychology to turn reading into a lasting lifelong habit.'),body:t('## البداية الصغيرة\nابدأ بصفحة واحدة يومياً. الهدف ليس الكمية بل الاستمرارية.\n\n## اربطها بعادة قائمة\nاقرأ بعد قهوة الصباح مباشرة؛ العادة القديمة تصبح تذكيراً للعادة الجديدة.\n\n> من قرأ صفحة كل يوم قرأ مكتبة في عمره.\n\n## تتبّع تقدّمك\nسجّل ما تقرأه، فالتقدّم المرئي يغذّي الحافز.','## Start Small\nBegin with a single page a day. The goal is not quantity but consistency.\n\n## Anchor It to an Existing Habit\nRead right after your morning coffee; the old habit becomes a reminder for the new one.\n\n> Whoever reads a page every day reads a library in a lifetime.\n\n## Track Your Progress\nLog what you read — visible progress fuels motivation.')},
      {id:'p2',title:t('الذكاء الاصطناعي ومستقبل التعليم','Artificial Intelligence and the Future of Education'),tag:t('تقنية','Technology'),date:Date.now(),cover:'',published:true,excerpt:t('كيف تُعيد نماذج الذكاء الاصطناعي تشكيل طريقة تعلّمنا، وما الفرص والمخاطر التي تحملها؟','How are AI models reshaping the way we learn, and what opportunities and risks do they bring?'),body:t('## تعليم مخصّص للجميع\nيتيح الذكاء الاصطناعي مساراً تعليمياً يناسب كل طالب على حدة.\n\n## دور المعلّم يتغيّر\nلا يختفي المعلّم، بل يتحوّل إلى موجّه وملهم.\n\n## تحديات يجب الانتباه لها\nالخصوصية والاعتماد المفرط والفجوة الرقمية قضايا تحتاج معالجة.','## Personalized Learning for Everyone\nAI enables a learning path tailored to each student individually.\n\n## The Role of the Teacher Changes\nThe teacher does not disappear, but becomes a guide and an inspiration.\n\n## Challenges to Watch\nPrivacy, over-reliance, and the digital divide are issues that need addressing.')},
      {id:'p3',title:t('فن إدارة الوقت للمنشغلين','The Art of Time Management for Busy People'),tag:t('إنتاجية','Productivity'),date:Date.now(),cover:'',published:true,excerpt:t('أنظمة بسيطة وفعّالة لإدارة وقتك دون الشعور بالإرهاق أو الذنب.','Simple, effective systems to manage your time without feeling exhausted or guilty.'),body:t('## قاعدة الدقيقتين\nإن كانت المهمة تستغرق أقل من دقيقتين، أنجزها فوراً.\n\n## خطّط مساءً\nحدّد أهم ثلاث مهام للغد قبل النوم.\n\n## احمِ وقتك العميق\nخصّص ساعات للتركيز بلا مقاطعات.','## The Two-Minute Rule\nIf a task takes less than two minutes, do it right away.\n\n## Plan in the Evening\nDefine your three most important tasks for tomorrow before sleeping.\n\n## Protect Your Deep Work\nSet aside hours for focus without interruptions.')},
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
        toast(t('لديك مدونة واحدة بالفعل — يمكنك إدارتها وتعديلها','You already have one blog — you can manage and edit it'));
        showBlogAdmin(); return;
      }
    }catch(e){ console.error(e); }
    blogEditingId=null; blogEditMeta=null; blogBuilderFocus=null;
    blogState=JSON.parse(JSON.stringify(BLOG_SAMPLE)); showBlogBuilder(); window.scrollTo(0,0);
  }
  async function startBlogEdit(id, focus=null){
    if(!currentUser){ location.href=urlBlogEdit(id); return; }
    document.body.style.background='';
    $('#app').innerHTML=`<div class="loader"><div><div class="spin"></div>${t('جارٍ فتح المدونة للتعديل…','Opening the blog for editing…')}</div></div>`;
    try{
      const s=await get(child(ref(db),'blogs/'+id));
      if(!s.exists()){ toast(t('المدونة غير موجودة','Blog not found')); showBlogAdmin(); return; }
      const d=s.val();
      blogState={...BLOG_EMPTY};
      ['title','subtitle','author','authorEn','about','cover','logo','design','threeD','anim','searchStyle','sidebarStyle','tickerStyle'].forEach(k=>{ if(d[k]!=null) blogState[k]=d[k]; });
      blogState.posts = Array.isArray(d.posts)?d.posts.filter(Boolean).map(p=>({...p})):[];
      if(!BLOG_BY_ID[blogState.design]) blogState.design='bd1';
      blogEditingId=id;
      blogEditMeta={ownerUid:d.ownerUid||currentUser.uid, ownerName:d.ownerName||currentUser.username, createdAt:d.createdAt||Date.now()};
      blogBuilderFocus=focus;
      showBlogBuilder(); window.scrollTo(0,0);
    }catch(e){ console.error(e); toast(t('تعذّر الفتح','Could not open')); showBlogAdmin(); }
  }

  /* ---------- blog builder ---------- */
  function showBlogBuilder(){
    if(!currentUser){ showAuth('login'); return; }
    const editing = blogEditingId!==null;
    document.title = editing ? t('تعديل المدونة','Edit Blog') : t('أنشئ مدونتك','Create your Blog');
    document.body.style.background='';
    const s=blogState;
    const eyeSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    $('#app').innerHTML = appbar('build') + `
    <div class="wrap"><div class="builder">
      <section class="panel">
        <h2>${editing?t('تعديل المدونة','Edit Blog'):t('أنشئ مدونتك','Create your Blog')}</h2>
        <div class="sub">${editing?t('عدّل بيانات المدونة والمقالات ثم احفظ التغييرات.','Edit the blog details and articles then save your changes.'):t('اختر تصميماً، أضف مقالاتك، ثم انشرها برابط دائم ومختصر.','Pick a design, add your articles, then publish with a permanent short link.')}</div>

        <div class="bpane pane-on" data-pane="data">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.person} ${t('بيانات المدونة','Blog Details')}</span></summary>
          <div class="acc-body">
            ${fld('b-title',t('عنوان المدونة','Blog Title'),s.title)}
            ${fld('b-subtitle',t('وصف مختصر (تحت العنوان)','Short description (under the title)'),s.subtitle,'textarea')}
            <div class="grid2">${fld('b-author',t('اسم الكاتب','Author name'),s.author)}${fld('b-authorEn','Author (EN)',s.authorEn)}</div>
            ${fld('b-about',t('عن المدونة','About the Blog'),s.about,'textarea')}
            <div class="field">
              <label>${t('صورة الغلاف (رابط أو رفع)','Cover image (URL or upload)')}</label>
              <div class="upload-row">
                <input id="f-b-cover" value="${esc(s.cover)}" placeholder="${t('https://… صورة غلاف المدونة','https://… blog cover image')}"/>
                <button type="button" class="btn ghost" id="bCoverUp">${IC2.up} ${t('رفع','Upload')}</button>
              </div>
              <input type="file" id="bCoverFile" accept="image/*" hidden/>
              <div class="up-note" id="bCoverNote">${t('تظهر في الواجهة الرئيسية للمدونة (خاصة في تصاميم الغلاف الكبير).','Shown on the blog home page (especially in large-cover designs).')}</div>
            </div>
            <div class="field">
              <label>${t('شعار المدونة (اختياري)','Blog logo (optional)')}</label>
              <div class="upload-row">
                <input id="f-b-logo" value="${esc(s.logo)}" placeholder="${t('https://… شعار صغير أعلى المدونة','https://… small logo at the top of the blog')}"/>
                <button type="button" class="btn ghost" id="bLogoUp">${IC2.up} ${t('رفع','Upload')}</button>
              </div>
              <input type="file" id="bLogoFile" accept="image/*" hidden/>
            </div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="design">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.palette} ${t('تصميم المدونة','Blog Design')} <span style="color:var(--muted-2);font-weight:400">(${BLOG_DESIGNS.length})</span></span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('أول '+FREE_BLOG_DESIGNS+' تصميماً مجانية — والباقي (حتى 150) للمشتركين المميزين.','The first '+FREE_BLOG_DESIGNS+' designs are free — the rest (up to 150) are for premium subscribers.'))}
            <input id="bdSearch" class="lay-search" placeholder="${t('ابحث عن تصميم…','Search for a design…')}"/>
            <div class="bd-picker" id="bdPicker">
              ${BLOG_DESIGNS.map(d=>{ const lk=blogDesignLocked(d.id); return `<div class="bd-swatch ${d.id===s.design?'active':''} ${lk?'locked':''}" data-bd="${d.id}" data-name="${esc(d.name)}" ${lk?'data-locked="1"':''}>
                <div class="sw" style="background:linear-gradient(135deg,${d.accent},${d.accent2})">${lk?'<span class="sw-lock">'+LOCKICON+'</span>':''}</div><div class="nm">${esc(d.name)}</div></div>`; }).join('')}
            </div>
          </div>
        </details>

        <details class="acc">
          <summary><span class="sum-t">${UICON.cube} ${t('مؤثرات وعناصر المدونة','Blog Effects & Elements')} ${isPremium()?'':'<span class="lock-chip">'+LOCKICON+' '+t('مميز','Premium')+'</span>'}</span></summary>
          <div class="acc-body">
            ${isPremium()?'':gateNote(t('المؤثرات المتقدمة (3D، أنيميشن، مربع البحث، القائمة الجانبية، شريط الأخبار) متاحة للمشتركين فقط.','Advanced effects (3D, animation, search box, sidebar, news ticker) are for subscribers only.'))}
            <div class="${isPremium()?'':'is-locked'}">
            <div class="opt-row">
              <div><div class="lbl">${t('مؤثر ثلاثي الأبعاد (3D)','3D effect (3D)')}</div><div class="desc">${t('تميل بطاقات المقالات مع حركة المؤشر','Article cards tilt with the cursor movement')}</div></div>
              <label class="switch"><input type="checkbox" id="f-b-threeD" ${s.threeD?'checked':''}><span class="slider"></span></label>
            </div>
            <div class="opt-row">
              <div><div class="lbl">${t('حركة الظهور (أنيميشن)','Entrance animation')}</div><div class="desc">${t('تظهر بها المقالات عند فتح المدونة','How articles appear when the blog opens')}</div></div>
              <select id="f-b-anim" class="mini-select">${BLOG_ANIMS.map(a=>`<option value="${a.id}" ${a.id===(s.anim||'none')?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">${t('شكل مربع البحث','Search box style')}</div><div class="desc">${t('مربع بحث داخل المقالات','A search box inside the articles')}</div></div>
              <select id="f-b-searchStyle" class="mini-select">${BLOG_SEARCH.map(a=>`<option value="${a.id}" ${a.id===bSearchStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">${t('تصميم القائمة الجانبية','Sidebar design')}</div><div class="desc">${t('أحدث المقالات والتصنيفات وعن المدونة','Latest articles, categories and about the blog')}</div></div>
              <select id="f-b-sidebarStyle" class="mini-select">${BLOG_SIDEBAR.map(a=>`<option value="${a.id}" ${a.id===bSidebarStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            <div class="opt-row">
              <div><div class="lbl">${t('شريط آخر الأخبار','News ticker')}</div><div class="desc">${t('شريط بأحدث عناوين مقالاتك أعلى المدونة','A bar with your latest article headlines at the top of the blog')}</div></div>
              <select id="f-b-tickerStyle" class="mini-select">${BLOG_TICKER.map(a=>`<option value="${a.id}" ${a.id===bTickerStyle(s)?'selected':''}>${a.name}</option>`).join('')}</select>
            </div>
            </div>
          </div>
        </details>
        </div>

        <div class="bpane" data-pane="articles">
        <details class="acc" open>
          <summary><span class="sum-t">${UICON.chat} ${t('المقالات','Articles')} <span style="color:var(--muted-2);font-weight:400" id="postsCount">(${s.posts.length})</span></span></summary>
          <div class="acc-body">
            <div id="postsList"></div>
            <button type="button" class="btn ghost" id="addPost" style="width:100%">${TAB.plus} ${t('إضافة مقالة','Add Article')}</button>
          </div>
        </details>
        </div>

        <button class="btn primary" id="bGen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
          ${editing?t('حفظ التغييرات','Save Changes'):t('نشر المدونة وإنشاء الرابط','Publish the blog and create the link')}
        </button>
      </section>

      <section class="preview-col" data-pane="preview">
        <div class="preview-head"><span class="t">${t('معاينة المدونة','Blog Preview')}</span><span class="live">${t('مباشر','Live')}</span></div>
        <div class="panel" style="padding:0;overflow:hidden"><div id="blogPrev" style="max-height:78vh;overflow:auto;border-radius:12px"></div></div>
      </section>

      <nav class="build-nav">
        <button class="bnav on" data-pane="data">${UICON.person}<span>${t('البيانات','Data')}</span></button>
        <button class="bnav" data-pane="design">${UICON.palette}<span>${t('التصميم','Design')}</span></button>
        <button class="bnav" data-pane="articles">${UICON.chat}<span>${t('المقالات','Articles')}</span></button>
        <button class="bnav" data-pane="preview">${eyeSvg}<span>${t('المعاينة','Preview')}</span></button>
      </nav>
    </div></div>

    <div class="overlay" id="bov">
      <div class="modal">
        <button class="close" id="bovClose">✕</button>
        <div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="26" height="26"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h3 id="bovTitle">${t('تم النشر','Published')}</h3>
        <p id="bovDesc">${t('هذا هو رابط مدونتك الدائم — شاركه مع من تريد.','This is your permanent blog link — share it with anyone you want.')}</p>
        <div class="linkbox"><input id="bOutLink" readonly/><button class="btn gold" id="bCopyLink" style="padding:9px 16px">${t('نسخ','Copy')}</button></div>
        <div id="bShortNote" style="text-align:center;font-size:12px;color:var(--muted-2);margin:-8px 0 16px;min-height:16px"></div>
        <div class="modal-actions">
          <a class="btn primary" id="bOpenLink" target="_blank">${t('فتح المدونة','Open Blog')}</a>
          <button class="btn ghost" id="bToMine">${t('إدارة المدونة','Manage Blog')}</button>
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
      const posts=blogPosts(d); if(!posts.length) return `<div class="blog-empty">${t('أضف مقالات لتظهر هنا.','Add articles to show here.')}</div>`;
      const feat=posts[0], rest=posts.slice(1);
      const f=`<div class="blog-feat"><div class="bf-media">${feat.cover?`<img src="${esc(feat.cover)}" alt="" onerror="this.remove()"/>`:''}</div>
        <div class="bf-body"><span class="bf-tag">${esc(feat.tag||t('مميزة','Featured'))}</span><h2 class="bf-title">${esc(feat.title||t('مقالة','Article'))}</h2>
        <p class="bf-ex">${feat.excerpt?esc(feat.excerpt):esc(stripHTML(feat.body).slice(0,180))}</p></div></div>`;
      const g=rest.length?`<div class="blog-sec-h"><h3>${t('أحدث المقالات','Latest Articles')}</h3><span class="rule"></span></div><div class="blog-grid">${rest.map((p,i)=>blogPostCard(p,i+1)).join('')}</div>`:'';
      return f+g;
    }

    // text/meta inputs
    [['title'],['subtitle'],['author'],['authorEn'],['about'],['cover'],['logo']].forEach(([k])=>{
      const el=$('#f-b-'+k); if(!el) return;
      el.addEventListener('input',()=>{ blogState[k]=el.value; repaint(); });
    });

    // design picker (locked designs need a subscription)
    $('#bdPicker').querySelectorAll('.bd-swatch').forEach(sw=>sw.onclick=()=>{
      if(sw.dataset.locked && !isPremium()){ toast(t('هذا التصميم للمشتركين المميزين ✦','This design is for Premium subscribers ✦')); return; }
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
        if(!/^image\//.test(f.type)){ if(note){note.className='up-note';note.textContent=t('الملف ليس صورة','File is not an image');} return; }
        const old=btn.innerHTML; btn.disabled=true; btn.textContent=t('جارٍ الرفع…','Uploading…');
        try{ const url=await uploadToImgbb(f); blogState[key]=url; $('#f-b-'+key).value=url; repaint();
          if(note){note.className='up-note ok';note.textContent=t('✓ تم الرفع','✓ Uploaded');} }
        catch(e){ console.error(e); if(note){note.className='up-note';note.textContent=t('تعذّر الرفع','Upload failed');} }
        finally{ btn.disabled=false; btn.innerHTML=old; file.value=''; }
      };
    };
    wireUp('bCoverUp','bCoverFile','bCoverNote','cover');
    wireUp('bLogoUp','bLogoFile',null,'logo');

    // posts editor
    function renderPosts(){
      const wrap=$('#postsList'); if(!wrap) return;
      $('#postsCount').textContent='('+blogState.posts.length+')';
      if(!blogState.posts.length){ wrap.innerHTML=`<div class="posts-empty">${t('لا توجد مقالات بعد — اضغط «إضافة مقالة».','No articles yet — click «Add article».')}</div>`; return; }
      const trashIco='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>';
      const chevIco='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
      wrap.innerHTML=blogState.posts.map((p,i)=>{
        const pub=p.published!==false;
        return `<div class="post-item" data-pi="${i}">
          <div class="pi-head" data-ptoggle="${i}">
            <span class="pi-num">${i+1}</span>
            <span class="pi-name">${esc(p.title)||t('مقالة بدون عنوان','Untitled article')}</span>
            <span class="pi-stat ${pub?'on':'off'}">${pub?t('منشورة','Published'):t('مسودة','Draft')}</span>
            <button type="button" class="pi-del" data-pdel="${i}" title="${t('حذف المقالة','Delete article')}">${trashIco}</button>
            <span class="pi-chev">${chevIco}</span>
          </div>
          <div class="pi-body">
            <div class="field"><label>${t('عنوان المقالة','Article title')}</label><input data-pf="title" value="${esc(p.title)}" placeholder="${t('عنوان المقالة','Article title')}"/></div>
            <div class="grid2">
              <div class="field" style="margin:0"><label>${t('التصنيف','Category')}</label><input data-pf="tag" value="${esc(p.tag||'')}" placeholder="${t('مثال: تقنية','e.g. Tech')}"/></div>
              <div class="field" style="margin:0"><label>${t('التاريخ (اختياري)','Date (optional)')}</label><input data-pf="date" value="${esc(typeof p.date==='number'?'':(p.date||''))}" placeholder="${t('اختياري','Optional')}"/></div>
            </div>
            <div class="field"><label>${t('صورة المقالة (اختياري)','Article image (optional)')}</label>
              <div class="up-row2"><input data-pf="cover" value="${esc(p.cover||'')}" placeholder="${t('رابط الصورة','Image URL')}" style="flex:1"/>
              <button type="button" class="btn ghost" data-pup="${i}" style="padding:10px 14px">${IC2.up} ${t('رفع','Upload')}</button>
              <input type="file" accept="image/*" hidden data-pfile="${i}"/></div>
            </div>
            <div class="field"><label>${t('مقتطف قصير (اختياري)','Short excerpt (optional)')}</label><textarea data-pf="excerpt" placeholder="${t('يظهر في البطاقة — يُؤخذ من بداية المقال إن تُرك فارغاً','Shows on the card — taken from the start of the article if left empty')}" style="min-height:56px">${esc(p.excerpt||'')}</textarea></div>
            <label class="acc-lbl" style="display:block;margin-bottom:7px;font-size:12.5px;color:var(--muted)">${t('نص المقالة (محرّر احترافي)','Article body (pro editor)')}</label>
            <div class="rte">${RTE_TOOLBAR}
              <div class="rte-editor" contenteditable="true" data-editor data-ph="${t('اكتب مقالتك هنا ونسّقها بالأزرار أعلاه — عناوين، قوائم، اقتباس، أكواد، صور…','Write your article here and format it with the buttons above — headings, lists, quotes, code, images…')}"></div>
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
                document.execCommand('insertHTML',false,'<pre><code>'+esc(t||t('// اكتب الكود هنا','// write your code here'))+'</code></pre><p><br></p>');
                sync(); return;
              }
              if(btn.hasAttribute('data-codeinline')){
                const t=(window.getSelection&&window.getSelection().toString())||'';
                document.execCommand('insertHTML',false,'<code>'+esc(t||'code')+'</code>&nbsp;');
                sync(); return;
              }
              const cmd=btn.dataset.cmd, val=btn.dataset.val;
              try{
                if(cmd==='createLink'){ const u=prompt(t('أدخل الرابط (https://…)','Enter the link (https://…)')); if(u) document.execCommand('createLink',false,/^https?:/i.test(u)?u:'https://'+u); }
                else if(cmd==='formatBlock'){ document.execCommand('formatBlock',false,val); }
                else if(cmd){ document.execCommand(cmd,false,null); }
              }catch(e){ console.error(e); }
              sync();
            });
          });
          const rf=item.querySelector('[data-rtefile]');
          if(rf) rf.onchange=async()=>{
            const f=rf.files&&rf.files[0]; if(!f) return;
            if(!/^image\//.test(f.type)){ toast(t('الملف ليس صورة','File is not an image')); return; }
            toast(t('جارٍ رفع الصورة…','Uploading image…'));
            try{ const url=await uploadToImgbb(f); rte.focus();
              document.execCommand('insertHTML',false,'<img src="'+String(url).replace(/"/g,'&quot;')+'" alt=""/>'); sync(); toast(t('✓ أُدرجت الصورة في المقال','✓ Image inserted into the article')); }
            catch(e){ console.error(e); toast(t('تعذّر رفع الصورة','Image upload failed')); }
            finally{ rf.value=''; }
          };
        }
      });
      wrap.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=(e)=>{ e.stopPropagation(); if(!confirm(t('حذف هذه المقالة؟','Delete this article?'))) return; blogState.posts.splice(+b.dataset.pdel,1); renderPosts(); repaint(); });
      wrap.querySelectorAll('[data-pup]').forEach(b=>b.onclick=()=>{ const f=wrap.querySelector('[data-pfile="'+b.dataset.pup+'"]'); if(f) f.click(); });
      wrap.querySelectorAll('[data-pfile]').forEach(file=>{
        file.onchange=async()=>{
          const i=+file.dataset.pfile, f=file.files&&file.files[0]; if(!f) return;
          if(!/^image\//.test(f.type)){ toast(t('الملف ليس صورة','File is not an image')); return; }
          toast(t('جارٍ رفع الصورة…','Uploading image…'));
          try{ const url=await uploadToImgbb(f); blogState.posts[i].cover=url;
            const inp=wrap.querySelector('.post-item[data-pi="'+i+'"] [data-pf="cover"]'); if(inp) inp.value=url;
            repaint(); toast(t('✓ تم رفع صورة المقالة','✓ Article image uploaded')); }
          catch(e){ console.error(e); toast(t('تعذّر رفع الصورة','Image upload failed')); }
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
      if(!blogState.title.trim()){ toast(t('أدخل عنوان المدونة','Enter the blog title')); return; }
      const btn=$('#bGen'); btn.disabled=true; const old=btn.innerHTML; btn.innerHTML=t('جارٍ الحفظ…','Saving…');
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
        await set(ref(db,'userBlogs/'+owner+'/'+id), {title:blogState.title||t('مدونة','Blog'), design:blogState.design, updatedAt});
        // public directory entry (safe fields only) powers the explorer — counts published posts only
        await set(ref(db,'blogIndex/'+id), {
          title:blogState.title||t('مدونة','Blog'), subtitle:blogState.subtitle||'', author:blogState.author||'',
          cover:blogState.cover||'', design:blogState.design, count:pubCount, updatedAt
        });
        blogEditingId=id; blogEditMeta={ownerUid:owner, ownerName, createdAt};

        const full=urlBlogView(id);
        $('#bovTitle').textContent = editing?t('تم حفظ التغييرات','Changes saved'):t('تم نشر المدونة','Blog published');
        $('#bovDesc').textContent = t('هذا هو رابط مدونتك الدائم — شاركه مع من تريد.','This is your permanent blog link — share it with whoever you want.');
        $('#bOutLink').value=full; $('#bOpenLink').href=full;
        $('#bov').classList.add('show');
        note.textContent='';
      }catch(e){
        console.error(e); toast(t('تعذّر الحفظ — سجّل الدخول وتحقّق من قواعد قاعدة البيانات','Could not save — sign in and check your database rules'));
      }finally{ btn.disabled=false; btn.innerHTML=old; }
    };
    $('#bCopyLink').onclick=()=>{navigator.clipboard?.writeText($('#bOutLink').value);toast(t('تم نسخ الرابط ✓','Link copied ✓'));};
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
      : `<span class="xp-mono">${esc(initials(b.title||t('مدونة','Blog')))}</span>`;
    const date=b.updatedAt?new Date(b.updatedAt).toLocaleDateString(curLang()==='en'?'en-US':'ar-EG',{year:'numeric',month:'short',day:'numeric'}):'';
    return `<a class="xp-card${top?' xp-top':''}" href="${urlBlogView(b.id)}">
      ${top?`<span class="xp-top-badge">${t('🏆 الأعلى تقييمًا','🏆 Top Rated')}</span>`:''}
      <div class="xp-cover" style="background:${grad}">${cover}
        <span class="xp-badge">${esc(dz.name)}</span>${b.locked?`<span class="xp-lk" title="${t('محمية بكلمة مرور','Password protected')}">🔒</span>`:''}</div>
      <div class="xp-b">
        <div class="xp-title">${esc(b.title||t('مدونة بدون عنوان','Untitled blog'))}</div>
        <div class="xp-sub">${esc(b.subtitle||t('مدونة على elgoharyX','A blog on elgoharyX'))}</div>
        <div class="xp-meta"><span class="xp-av" style="background:${grad}">${esc(initials(b.author||t('مدونة','Blog')))}</span>
          <span>${esc(b.author||t('كاتب','Author'))}</span><span class="dot"></span><span>${(b.count||0)} ${t('مقالة','articles')}</span>
          ${(+b.rCount)?`<span class="dot"></span><span class="xp-rate">${RSTAR} ${blogAvg(b).toFixed(1)} (${+b.rCount})</span>`:''}
          ${date?`<span class="dot"></span><span>${date}</span>`:''}</div>
      </div></a>`;
  }
  async function showExplore(){
    document.title=t('استكشف المدونات — elgoharyX','Explore Blogs — elgoharyX');
    document.body.style.background='';
    $('#app').innerHTML = appbar('explore') + `
      <section class="xp-hero"><div class="xp-hero-in">
        <span class="xp-kick">${t('✦ مكتبة المدونات','✦ Blog Library')}</span>
        <h1>${t('استكشف المدونات','Explore Blogs')}</h1>
        <p>${t('تصفّح كل المدونات المنشورة على elgoharyX — اقرأ مقالات في التقنية والثقافة والتطوير، واستلهم لإنشاء مدونتك الخاصة.','Browse every blog published on elgoharyX — read articles on tech, culture, and self-development, and get inspired to create your own.')}</p>
        <div class="xp-search"><input id="xpSearch" placeholder="${t('ابحث بعنوان المدونة أو اسم الكاتب…','Search by blog title or author name…')}" autocomplete="off"/></div>
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
        countEl.textContent = list.length ? (curLang()==='en' ? (arr.length+' of '+list.length+' blogs') : (arr.length+' من '+list.length+' مدونة')) : '';
        listEl.innerHTML = arr.length
          ? `<div class="xp-grid">${arr.map((b,i)=>exploreCard(b,base, i===0 && (+b.rCount)>0)).join('')}</div>`
          : `<div class="xp-empty">${list.length?t('لا توجد نتائج مطابقة لبحثك.','No results match your search.'):t('لا توجد مدونات منشورة بعد — كن أول من ينشر مدونته!','No blogs published yet — be the first to publish yours!')}</div>`;
      };
      draw(list);
      if(window.elgFillAds) window.elgFillAds($('#app'));
      const sb=$('#xpSearch'); if(sb) sb.oninput=()=>{ const q=sb.value.trim().toLowerCase();
        draw(!q?list:list.filter(b=>((b.title||'')+' '+(b.author||'')+' '+(b.subtitle||'')).toLowerCase().includes(q))); };
    }catch(e){
      console.error(e);
      $('#xpList').innerHTML=`<div class="xp-empty">${t('تعذّر تحميل المدونات. تحقّق من اتصالك أو من قواعد قاعدة البيانات.','Failed to load blogs. Check your connection or the database rules.')}</div>`;
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
  /* ---- backup email (EmailJS) keys ----
     The hardcoded EMAILJS above is the primary; the admin can add backup credential
     sets in config/emailKeys. Sending tries each set in order, so when one account
     hits its monthly send limit the next one is used automatically. */
  let _emailKeys=null;
  const cleanEmailSet = x => ({
    publicKey:String((x&&x.publicKey)||'').trim(), serviceId:String((x&&x.serviceId)||'').trim(),
    templateId:String((x&&x.templateId)||'').trim(), notifyTemplateId:String((x&&x.notifyTemplateId)||'').trim(),
    toEmail:String((x&&x.toEmail)||'').trim()
  });
  const validEmailSet = x => x.publicKey && !x.publicKey.startsWith('YOUR_') && x.serviceId && x.templateId;
  async function loadEmailBackups(){
    let arr=[];
    try{ const s=await get(child(ref(db),'config/emailKeys')); if(s.exists()){ const v=s.val(); arr=Array.isArray(v)?v:Object.values(v||{}); } }catch(e){}
    return arr.map(cleanEmailSet).filter(validEmailSet);
  }
  async function emailKeyList(){
    if(_emailKeys) return _emailKeys;
    _emailKeys=[EMAILJS, ...(await loadEmailBackups())];   // primary first, then backups
    return _emailKeys;
  }
  const clearEmailKeysCache=()=>{ _emailKeys=null; };
  async function saveEmailBackups(list){
    const clean=(list||[]).map(cleanEmailSet).filter(validEmailSet);
    await set(ref(db,'config/emailKeys'), clean);
    _emailKeys=null;
    return clean;
  }
  /* send one EmailJS message, rotating through primary + backups until one succeeds */
  async function emailjsSend(kind, params){
    const keys=await emailKeyList();
    for(const k of keys){
      if(!k || !k.publicKey || k.publicKey.startsWith('YOUR_')) continue;
      const tpl = (kind==='notify' && k.notifyTemplateId && !k.notifyTemplateId.startsWith('YOUR_')) ? k.notifyTemplateId : k.templateId;
      const p = (kind==='admin' && k.toEmail) ? { ...params, to_email:k.toEmail } : params;
      try{
        const r=await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ service_id:k.serviceId, template_id:tpl, user_id:k.publicKey, template_params:p })
        });
        if(r.ok) return true;   // else quota/limit → try the next key
      }catch(e){ /* network error → try the next key */ }
    }
    return false;
  }
  async function notifyAdminEmail(fields){
    if(!emailjsReady()) return; // لم تُضبط بعد — نتجاهل بهدوء
    await emailjsSend('admin', fields);
  }
  /* ---- captcha (reCAPTCHA / App Check) keys — admin-editable ----
     App Check runs in firebase.js from localStorage (before any DB read), so saving
     mirrors to BOTH localStorage (what actually applies) and config/captchaKeys. */
  async function loadCaptchaKeys(){
    try{ const s=localStorage.getItem('apb_captcha_keys'); if(s){ const a=JSON.parse(s); if(Array.isArray(a)&&a.filter(Boolean).length) return a.filter(Boolean).map(x=>String(x).trim()); } }catch(e){}
    try{ const s=await get(child(ref(db),'config/captchaKeys')); if(s.exists()){ const v=s.val(); const clean=(Array.isArray(v)?v:Object.values(v||{})).map(x=>String(x||'').trim()).filter(Boolean);
      if(clean.length){ try{ localStorage.setItem('apb_captcha_keys', JSON.stringify(clean)); }catch(e){} return clean; } } }catch(e){}
    return captchaKeys();
  }
  async function saveCaptchaKeys(keys){
    const clean=(keys||[]).map(k=>String(k||'').trim()).filter(Boolean);
    try{ localStorage.setItem('apb_captcha_keys', JSON.stringify(clean)); }catch(e){}
    await set(ref(db,'config/captchaKeys'), clean);
    return clean;
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
        fresh.slice(0,3).forEach(a=>{ try{ new Notification(a.title||t('إشعار جديد — elgoharyX','New notification — elgoharyX'),
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
      <button class="close" data-notif-close aria-label="${t('إغلاق','Close')}">✕</button>
      <div class="info-h">${BELL}<h3>${t('الإشعارات','Notifications')}</h3></div>
      <div class="notif-sub" id="notifSubRow"></div>
      <div class="notif-list" id="notifList"><div class="pm-note" style="text-align:center;padding:16px 0">${t('جارٍ التحميل…','Loading…')}</div></div>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov||e.target.closest('[data-notif-close]')) closeNotif(); });
    const drawSub=()=>{
      const row=$('#notifSubRow'); if(!row) return; const on=isSubscribed();
      row.innerHTML = on
        ? `<span class="ns-on">${IC2.check||'✓'} ${t('أنت مشترك في إشعارات الموقع','You are subscribed to site notifications')}</span><button class="btn ghost" id="notifUnsub">${t('إلغاء الاشتراك','Unsubscribe')}</button>`
        : `<span class="ns-txt">${t('اشترك لتصلك إشعارات الموقع الجديدة أولاً بأول.','Subscribe to get the latest site notifications first.')}</span><button class="btn primary" id="notifSub">🔔 ${t('اشترك','Subscribe')}</button>`;
      const s=$('#notifSub'); if(s) s.onclick=async()=>{ s.disabled=true; s.textContent=t('جارٍ التفعيل…','Activating…');
        const p=await subscribeNotifications(); toast(p==='granted'?t('تم تفعيل الإشعارات ✓','Notifications enabled ✓'):t('تم الاشتراك ✓','Subscribed ✓')); drawSub(); };
      const u=$('#notifUnsub'); if(u) u.onclick=async()=>{ await unsubscribeNotifications(); toast(t('تم إلغاء الاشتراك','Unsubscribed')); drawSub(); };
    };
    drawSub();
    const list=await loadAnnouncements();
    setNotifSeen(list.length?Math.max(...list.map(a=>a.createdAt||0)):Date.now());
    const dot=$('#bellDot'); if(dot){ dot.hidden=true; dot.textContent=''; }
    const el=$('#notifList'); if(!el) return;
    el.innerHTML = list.length ? list.map(a=>`<div class="notif-item">
        <div class="notif-t">${esc(a.title||t('إشعار','Notification'))}</div>
        ${a.body?`<div class="notif-b">${esc(a.body)}</div>`:''}
        <div class="notif-d">${fmtDay(a.createdAt)}</div>
      </div>`).join('') : `<div class="pm-note" style="text-align:center;padding:22px 0">${t('لا توجد إشعارات بعد.','No notifications yet.')}</div>`;
  }

  /* send a single notification email to a user via EmailJS (fire-and-forget).
     Uses the dedicated notify template if configured; otherwise the main one.
     The message is sent under EVERY common variable name (message/content/text/
     note/body/msg) plus a combined title+body — so it shows no matter which
     variable the EmailJS template happens to reference. */
  async function sendUserEmail(toEmail, title, body, toName){
    if(!emailjsReady() || !toEmail) return false;
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
      method: t('📢 إشعار','📢 Notification'), amount: '', screenshot: '', link: urlHome()
    };
    return emailjsSend('notify', params);   // rotates through primary + backup keys
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
  const gateNote = (txt)=>`<div class="gate-note">${LOCKICON}<span>${txt}</span><a href="${pageUrl('premium.html')}">${t('ترقية للاشتراك المميز ✦','Upgrade to Premium ✦')}</a></div>`;
  const LOCKICON='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  async function showPremium(){
    if(!currentUser){ gotoLogin(); return; }
    document.title=t('الاشتراك المميز — elgoharyX','Premium — elgoharyX');
    document.body.style.background='';
    $('#app').innerHTML = appbar('premium') + `<div class="wrap"><div class="pro-loader"><div class="pl-in"><div class="pl-ringwrap"><div class="ring"></div></div></div></div></div>` + drawer('premium');
    wireAppbar();
    const p = await getPremium(currentUser.uid);
    const active = premiumActive(p);
    const price = (p && p.count) ? PREMIUM.renew : PREMIUM.first;
    let shot='';
    const statusHtml = active
      ? `<div class="pm-status ok"><span class="pm-vip">${CROWN} ${t('عضو مميز','Premium member')}</span><span>${t('اشتراكك فعّال حتى','Your subscription is active until')} <b>${fmtDay(p.expires)}</b>. ${t('يمكنك التجديد بالأسفل.','You can renew below.')}</span></div>`
      : (p ? `<div class="pm-status off">${t('انتهى اشتراكك السابق — جدّده بالأسفل.','Your previous subscription has ended — renew it below.')}</div>` : '');
    $('#app').innerHTML = appbar('premium') + `<div class="wrap pm-wrap">
      <div class="pm-hero"><span class="pm-crown">${CROWN}</span>
        <h1>${t('الاشتراك المميز','Premium Subscription')}</h1>
        <p>${t('استمتع بتجربة','Enjoy a')} <b>${t('بلا إعلانات نهائيًا','completely ad-free')}</b> ${t('على كامل الموقع، واحصل على شارة «عضو مميز»، وإزالة علامة elgoharyX من روابطك، ومزايا حصرية قادمة.','experience across the whole site, get the Premium member badge, remove the elgoharyX mark from your links, and enjoy exclusive perks coming soon.')}</p></div>
      ${statusHtml}
      <div class="pm-perks-msg">
        <span class="pm-pm-badge">${CROWN} ${t('كل مزايا العضوية المميزة','All premium membership perks')}</span>
        <p>${t('عند اشتراكك تفتح لك هذه المزايا كاملةً على حسابك مباشرةً — إليك كل ما ستحصل عليه:','When you subscribe, all these perks unlock on your account instantly — here is everything you get:')}</p>
      </div>
      <div class="pm-perks">
        <div class="pm-perk feature"><span class="pm-pk-ic">${AD_OFF_IC}</span>
          <div><b>${t('بلا إعلانات نهائيًا','Completely ad-free')}</b><span>${t('تصفّح الموقع كله — المدونات والبروفايلات — دون أي إعلان يقاطعك.','Browse the entire site — blogs and profiles — without any ad interrupting you.')}</span></div></div>
        <div class="pm-perk feature"><span class="pm-pk-ic">${PK_APP_IC}</span>
          <div><b>${t('حوّل مدونتك إلى تطبيق','Turn your blog into an app')} <span class="pm-new">${t('جديد','New')}</span></b><span>${t('ثبّت مدونتك كتطبيق مستقل على شاشة الهاتف والكمبيوتر — فتح فوري وعمل دون اتصال، بلا متجر تطبيقات.','Install your blog as a standalone app on your phone and computer — instant launch and offline access, no app store needed.')}</span></div></div>
        <div class="pm-perk feature"><span class="pm-pk-ic">${PK_BAR_IC}</span>
          <div><b>${t('شريط أدوات احترافي للكمبيوتر','Professional desktop toolbar')} <span class="pm-new">${t('جديد','New')}</span></b><span>${t('واجهة علوية أنيقة مميّزة بلمسة ذهبية وتنقّل أوضح — تجربة أرقى على شاشة الكمبيوتر.','An elegant top bar with a golden touch and clearer navigation — a finer experience on desktop.')}</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${CROWN}</span>
          <div><b>${t('شارة «عضو مميز»','Premium member badge')}</b><span>${t('تظهر على بروفايلك ومدونتك وتُميّزك عن غيرك.','Shown on your profile and blog to set you apart from others.')}</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${PK_LINK_IC}</span>
          <div><b>${t('روابط نظيفة باسمك','Clean links with your name')}</b><span>${t('إزالة علامة elgoharyX من روابطك المشاركة.','Remove the elgoharyX mark from your shared links.')}</span></div></div>
        <div class="pm-perk"><span class="pm-pk-ic">${PK_STAR_IC}</span>
          <div><b>${t('أولوية الدعم + مزايا حصرية قادمة','Priority support + exclusive perks coming')}</b><span>${t('أنت تدعم استمرار elgoharyX وتحصل على كل جديد أولًا.','You support keeping elgoharyX running and get everything new first.')}</span></div></div>
      </div>
      <div class="pm-price"><b>${price}</b><span>${t('جنيه · لمدة 3 شهور','EGP · for 3 months')}</span>
        <div class="pm-note2">${price===PREMIUM.renew?t('سعر التجديد','Renewal price'):t('سعر أول اشتراك','First subscription price')} — ${t('التجديد بعدها','Renewal afterwards')} ${PREMIUM.renew} ${t('ج','EGP')}</div></div>
      <div class="pm-card">
        <h3>${t('1) ادفع عبر إحدى الطريقتين','1) Pay via one of the two methods')}</h3>
        <div class="pm-method"><div class="pm-mname"><b>InstaPay</b><span>${t('انستا باي','InstaPay')}</span></div><span class="pm-num">${PREMIUM.instapay}</span><button class="btn ghost" data-copy="${PREMIUM.instapay}">${t('نسخ','Copy')}</button></div>
        <div class="pm-method"><div class="pm-mname"><b>Etisalat Cash</b><span>${t('اتصالات كاش','Etisalat Cash')}</span></div><span class="pm-num">${PREMIUM.etisalat}</span><button class="btn ghost" data-copy="${PREMIUM.etisalat}">${t('نسخ','Copy')}</button></div>
      </div>
      <div class="pm-card pm-upload">
        <h3>${t('2) ارفع صورة إثبات الدفع','2) Upload a payment proof image')}</h3>
        <div class="field"><label>${t('طريقة الدفع','Payment method')}</label><select id="pmMethod" class="mini-select" style="width:100%"><option value="instapay">InstaPay — ${t('انستا باي','InstaPay')}</option><option value="etisalat">Etisalat Cash — ${t('اتصالات كاش','Etisalat Cash')}</option></select></div>
        <div class="field"><label>${t('صورة الإيصال','Receipt image')}</label>
          <button type="button" class="btn ghost" id="pmUp" style="width:100%">${IC2.up} ${t('رفع صورة الإيصال','Upload receipt image')}</button>
          <input type="file" id="pmFile" accept="image/*" hidden/>
          <div class="pm-shot" id="pmShot"></div></div>
        <div class="field"><label>${t('ملاحظة (اختياري)','Note (optional)')}</label><input id="pmNoteInp" placeholder="${t('اسم المُرسِل أو رقم العملية…','Sender name or transaction number…')}"/></div>
        <div class="pm-note" id="pmMsg"></div>
        <button class="btn primary" id="pmSend" style="width:100%">${t('إرسال الطلب للمراجعة','Send request for review')}</button>
        <div class="pm-hint">${t('بعد مراجعة الأدمن والتأكد من المبلغ','After the admin reviews and confirms the amount')} (${price} ${t('ج','EGP')}) ${t('يُفعَّل اشتراكك خلال وقت قصير.','your subscription is activated shortly.')}</div>
      </div>
    </div>` + drawer('premium');
    wireAppbar();
    document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{ navigator.clipboard?.writeText(b.dataset.copy); toast(t('تم نسخ الرقم ✓','Number copied ✓')); });
    const msg=$('#pmMsg');
    $('#pmUp').onclick=()=>$('#pmFile').click();
    $('#pmFile').onchange=async()=>{
      const f=$('#pmFile').files&&$('#pmFile').files[0]; if(!f) return;
      if(!/^image\//.test(f.type)){ msg.className='pm-note'; msg.textContent=t('الملف ليس صورة','The file is not an image'); return; }
      const b=$('#pmUp'); const old=b.innerHTML; b.disabled=true; b.textContent=t('جارٍ الرفع…','Uploading…');
      try{ shot=await uploadToImgbb(f); $('#pmShot').innerHTML=`<img src="${esc(shot)}" alt="${t('إيصال','Receipt')}"/>`; msg.className='pm-note ok'; msg.textContent=t('✓ تم رفع الصورة','✓ Image uploaded'); }
      catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر رفع الصورة','Failed to upload the image'); }
      finally{ b.disabled=false; b.innerHTML=old; $('#pmFile').value=''; }
    };
    $('#pmSend').onclick=async()=>{
      if(!shot){ msg.className='pm-note'; msg.textContent=t('ارفع صورة إثبات الدفع أولاً','Upload a payment proof image first'); return; }
      const btn=$('#pmSend'); btn.disabled=true; const old=btn.textContent; btn.textContent=t('جارٍ الإرسال…','Sending…');
      try{
        const id=shortId(14);
        const methodName=$('#pmMethod').value==='etisalat'?t('اتصالات كاش','Etisalat Cash'):t('انستا باي','InstaPay');
        const noteVal=($('#pmNoteInp').value||'').slice(0,500);
        await set(ref(db,'paymentRequests/'+id), { uid:currentUser.uid, username:currentUser.username||'', email:currentUser.email||'', method:$('#pmMethod').value, amount:price, screenshot:shot, note:noteVal, status:'pending', createdAt:Date.now() });
        // notify the admin by email (EmailJS) — fire-and-forget so it never blocks the user
        notifyAdminEmail({ to_email:EMAILJS.toEmail, username:currentUser.username||t('مستخدم','User'), email:currentUser.email||'', method:methodName, amount:String(price), note:noteVal||'—', screenshot:shot, link:pageUrl('admin.html') });
        $('#app').querySelector('.pm-upload').innerHTML=`<div class="pm-done"><div class="ok">${CHECK}</div><h3>${t('تم استلام طلبك ✓','Your request has been received ✓')}</h3><p>${t('سيراجع الأدمن الإيصال ويؤكّد المبلغ، ثم يُفعَّل اشتراكك المميز. عُد لهذه الصفحة لاحقاً للاطمئنان.','The admin will review the receipt and confirm the amount, then your premium subscription is activated. Come back to this page later to check.')}</p></div>`;
        toast(t('تم إرسال طلب الاشتراك ✓','Subscription request sent ✓'));
      }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الإرسال — تأكد من نشر القواعد','Failed to send — make sure the rules are published'); btn.disabled=false; btn.textContent=old; }
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
      toast(t('تم تفعيل الاشتراك ✓','Subscription activated ✓')); done&&done();
    }catch(e){ console.error(e); toast(t('تعذّر التفعيل — تأكد أنك داخل بحساب الأدمن','Activation failed — make sure you are signed in with the admin account')); }
  }

  /* blank 404 page — shown to anyone who opens the admin section without being the
     admin (logged out, or a signed-in non-admin). Replaces the whole page so the
     admin panel's existence is fully hidden: a white page with only "404" on it. */
  function showAdmin404(){
    try{ document.title='404'; }catch(e){}
    const html='<div style="position:fixed;inset:0;margin:0;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;font-family:system-ui,-apple-system,\'Segoe UI\',Arial,sans-serif;font-weight:700;font-size:clamp(64px,18vw,150px);letter-spacing:2px">404</div>';
    try{ document.body.style.cssText='margin:0;background:#fff'; document.body.innerHTML=html; }
    catch(e){ document.documentElement.innerHTML='<body style="margin:0;background:#fff">'+html+'</body>'; }
  }
  async function showAdmin(){
    if(adminEmail===undefined) await loadAdminEmail();
    if(!isAdmin()){ showAdmin404(); return; }     // non-admins get a blank 404 — the panel stays hidden
    document.title=t('لوحة تحكّم الأدمن — elgoharyX','Admin Dashboard — elgoharyX');
    document.body.style.background='';
    $('#app').innerHTML = appbar('admin') + `<div class="wrap">${skelGrid(3)}</div>` + drawer('admin');
    wireAppbar();
    const fbAuthed = !!(auth && auth.currentUser);
    // load everything the panel needs in parallel (each already falls back safely on error)
    const [adminGateObj, imgKeys, captchaList, emailBackups] = await Promise.all([
      loadAdminGate(), loadImageKeys(), loadCaptchaKeys(), loadEmailBackups()
    ]);
    const adminGateSet = !!adminGateObj;
    const dbInfo = dbState();                      // primary + backup DB URLs and active write index
    // "set admin email" + "panel password" cards
    const setupCard = () => `<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">${t('إعداد بريد الأدمن','Admin email setup')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('اكتب بريد الأدمن واضغط حفظ — يُخزَّن في قاعدة البيانات تلقائياً.','Enter the admin email and press Save — it is stored in the database automatically.')}</div>
        ${!adminEmail
          ? `<div class="pm-note" style="margin-bottom:12px">${t('لم يُضبط الأدمن بعد — احفظ بريدك لتصبح الأدمن.','No admin set yet — save your email to become the admin.')}</div>`
          : (isAdmin()
            ? `<div class="pm-note ok" style="margin-bottom:12px">${t('أنت الأدمن الحالي ✓','You are the current admin ✓')}</div>`
            : `<div class="pm-note ok" style="margin-bottom:12px">${t('تم ضبط الأدمن بالفعل.','The admin is already set.')} 🔒</div>`)}
        ${fbAuthed?`
          <div class="field"><label>${t('بريد الأدمن','Admin email')}</label><input id="admEmailInp" dir="ltr" placeholder="${t('اكتب بريد الأدمن الجديد','Enter the new admin email')}" autocomplete="off"/></div>
          <button class="btn primary" id="admSave" style="width:100%">${t('حفظ بريد الأدمن','Save admin email')}</button>
          <div class="pm-note" id="admMsg"></div>
        `:`<div class="gate-note" style="display:block">${t('لتعيين الأدمن يجب تسجيل الدخول عبر','To set the admin you must sign in via')} <b>Google</b> (${t('حساب Firebase','Firebase account')}). ${t('اخرج ثم ادخل بزر «المتابعة بحساب Google» بنفس بريد الأدمن، ثم ارجع هنا واحفظه.','Sign out then sign in with the Continue with Google button using the same admin email, then come back here and save it.')}</div>`}
      </div>
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🔒 ${t('كلمة مرور لوحة الأدمن','Admin panel password')}</h3>
        <div class="sub" style="margin-bottom:14px">${adminGateSet?t('اللوحة محمية بكلمة مرور — تُطلب عند فتح القسم لإخفاء بريد الأدمن. يمكنك تغييرها أو إزالتها.','The panel is password-protected — it is requested when opening the section to hide the admin email. You can change or remove it.'):t('أضف كلمة مرور لحماية اللوحة وإخفاء بريد الأدمن — تُطلب عند فتح هذا القسم.','Add a password to protect the panel and hide the admin email — it is requested when opening this section.')}</div>
        <div class="field"><label>${t('كلمة المرور الجديدة','New password')}</label><input id="admPass1" type="password" dir="ltr" placeholder="${t('6 أحرف على الأقل','At least 6 characters')}" autocomplete="new-password"/></div>
        <div class="field"><label>${t('تأكيد كلمة المرور','Confirm password')}</label><input id="admPass2" type="password" dir="ltr" placeholder="${t('أعد كتابتها','Re-enter it')}" autocomplete="new-password"/></div>
        <button class="btn primary" id="admPassSave" style="width:100%">${adminGateSet?t('تغيير كلمة المرور','Change password'):t('حفظ كلمة المرور','Save password')}</button>
        ${adminGateSet?`<button class="btn del" id="admPassRemove" style="width:100%;margin-top:8px">${t('إزالة كلمة المرور','Remove password')}</button>`:''}
        <div class="pm-note" id="admPassMsg"></div>
      </div>`:''}
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🖼️ ${t('مفاتيح رفع الصور (imgbb)','Image upload keys (imgbb)')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('كل مفتاح في خانة مستقلة. تُجرَّب بالترتيب، فإذا فشل رفع صورة بأحدها ينتقل تلقائياً للتالي في الخلفية حتى تُرفع الصورة.','Each key in its own box. They are tried in order — if an upload fails on one, it automatically switches to the next in the background until the image uploads.')} <a href="https://api.imgbb.com/" target="_blank" rel="noopener" style="color:var(--gold)">imgbb</a></div>
        <div id="imgKeysList">${(imgKeys.length?imgKeys:['']).map(imgKeyRow).join('')}</div>
        <button class="btn ghost" id="imgKeysAdd" style="width:100%;margin-top:2px">＋ ${t('إضافة مفتاح آخر','Add another key')}</button>
        <button class="btn primary" id="imgKeysSave" style="width:100%;margin-top:10px">${t('حفظ المفاتيح','Save keys')}</button>
        <div class="pm-note" id="imgKeysMsg"></div>
      </div>`:''}
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🛡️ ${t('مفاتيح كاباتشا (reCAPTCHA / App Check)','Captcha keys (reCAPTCHA / App Check)')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('المفتاح الأول هو المُفعَّل، والباقي احتياطي يمكنك ترقيته. يُطبَّق عند إعادة تحميل الصفحة، ويُحفظ في هذا المتصفح.','The first key is the active one; the rest are spares you can promote. Applied on page reload and saved in this browser.')} <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener" style="color:var(--gold)">reCAPTCHA</a></div>
        <div id="capKeysList">${(captchaList.length?captchaList:['']).map(capKeyRow).join('')}</div>
        <button class="btn ghost" id="capKeysAdd" style="width:100%;margin-top:2px">＋ ${t('إضافة مفتاح احتياطي','Add a spare key')}</button>
        <button class="btn primary" id="capKeysSave" style="width:100%;margin-top:10px">${t('حفظ مفاتيح الكاباتشا','Save captcha keys')}</button>
        <div class="pm-note" id="capKeysMsg"></div>
      </div>`:''}
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">✉️ ${t('مفاتيح الإيميل الاحتياطية (EmailJS)','Backup email keys (EmailJS)')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('المفتاح الأساسي مضبوط في الكود. أضف حسابات EmailJS احتياطية — تُجرَّب بالترتيب، فإذا نفد حد الإرسال الشهري لأحدها يُستخدم التالي تلقائياً.','The primary key is set in the code. Add backup EmailJS accounts — they are tried in order, so when one hits its monthly send limit the next is used automatically.')} <a href="https://dashboard.emailjs.com/admin" target="_blank" rel="noopener" style="color:var(--gold)">EmailJS</a></div>
        <div id="emlList">${(emailBackups.length?emailBackups:[{}]).map(emailSetRow).join('')}</div>
        <button class="btn ghost" id="emlAdd" style="width:100%;margin-top:2px">＋ ${t('إضافة حساب احتياطي','Add a backup account')}</button>
        <button class="btn primary" id="emlSave" style="width:100%;margin-top:10px">${t('حفظ مفاتيح الإيميل','Save email keys')}</button>
        <div class="pm-note" id="emlMsg"></div>
      </div>`:''}
      ${isAdmin()?`<div class="panel" style="max-width:600px;margin:0 auto 18px;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🗄️ ${t('قواعد البيانات الاحتياطية (تكامل)','Backup databases (federation)')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('القراءة تُدمج من كل القواعد، والكتابة الجديدة تروح للقاعدة النشطة (وتنتقل تلقائياً للتالية عند الامتلاء). لازم تنشر نفس القواعد على كل قاعدة احتياطية. يُطبَّق بعد إعادة التحميل.','Reads merge across all databases; new writes go to the active one (and advance automatically when it fills). Publish the same security rules on every backup. Applied after a reload.')}</div>
        <div class="field"><label>${t('القاعدة الأساسية (ثابتة)','Primary database (fixed)')}</label><input value="${esc(dbInfo.urls[0]||'')}" dir="ltr" readonly style="opacity:.7;font-family:monospace;font-size:12px"/></div>
        <label style="font-size:13px;font-weight:600;display:block;margin:4px 0 6px">${t('قواعد احتياطية','Backup databases')}</label>
        <div id="dbList">${(dbInfo.backups.length?dbInfo.backups:['']).map(dbUrlRow).join('')}</div>
        <button class="btn ghost" id="dbAdd" style="width:100%;margin-top:2px">＋ ${t('إضافة قاعدة احتياطية','Add a backup database')}</button>
        <div class="field" style="margin-top:12px"><label>${t('قاعدة الكتابة النشطة','Active write database')}</label>
          <select id="dbActive" dir="ltr" style="width:100%">${dbInfo.urls.map((u,i)=>`<option value="${i}" ${i===dbInfo.active?'selected':''}>${i===0?t('الأساسية','Primary')+' — ':''}${esc(u)}</option>`).join('')}</select></div>
        <button class="btn primary" id="dbSave" style="width:100%;margin-top:6px">${t('حفظ إعدادات القواعد','Save database settings')}</button>
        <div class="pm-note" id="dbMsg"></div>
      </div>`:''}`;
    // one row = one API key box + a remove button (used on first render and by "add another")
    const imgKeyRow = (k='')=>`<div class="imgkey-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <input class="imgkey-inp" dir="ltr" value="${esc(k)}" placeholder="${t('مفتاح imgbb API','imgbb API key')}" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;font-family:monospace"/>
        <button type="button" class="btn del imgkey-del" title="${t('حذف','Remove')}" style="padding:8px 12px;flex:0 0 auto">✕</button>
      </div>`;
    const capKeyRow = (k='')=>`<div class="cap-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <input class="cap-inp" dir="ltr" value="${esc(k)}" placeholder="${t('مفتاح موقع reCAPTCHA v3','reCAPTCHA v3 site key')}" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;font-family:monospace"/>
        <button type="button" class="btn del cap-del" title="${t('حذف','Remove')}" style="padding:8px 12px;flex:0 0 auto">✕</button>
      </div>`;
    const dbUrlRow = (u='')=>`<div class="db-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <input class="db-inp" dir="ltr" value="${esc(u)}" placeholder="https://your-backup-default-rtdb.firebaseio.com" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;font-family:monospace;font-size:12px"/>
        <button type="button" class="btn del db-del" title="${t('حذف','Remove')}" style="padding:8px 12px;flex:0 0 auto">✕</button>
      </div>`;
    const emailSetRow = (s={})=>`<div class="eml-row" style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
        <button type="button" class="btn del eml-del" title="${t('حذف','Remove')}" style="position:absolute;top:8px;inset-inline-end:8px;padding:4px 10px">✕</button>
        <div class="field"><label>Public Key</label><input class="eml-pk" dir="ltr" value="${esc(s.publicKey||'')}" autocomplete="off"/></div>
        <div class="field"><label>Service ID</label><input class="eml-sv" dir="ltr" value="${esc(s.serviceId||'')}" autocomplete="off"/></div>
        <div class="field"><label>Template ID</label><input class="eml-tp" dir="ltr" value="${esc(s.templateId||'')}" autocomplete="off"/></div>
        <div class="field"><label>Notify Template ID (${t('اختياري','optional')})</label><input class="eml-nt" dir="ltr" value="${esc(s.notifyTemplateId||'')}" autocomplete="off"/></div>
        <div class="field"><label>To Email</label><input class="eml-to" dir="ltr" value="${esc(s.toEmail||'')}" autocomplete="off"/></div>
      </div>`;
    const wireSetup = () => {
      // save the admin email
      const b=$('#admSave');
      if(b) b.onclick=async()=>{
        const em=($('#admEmailInp').value||'').trim().toLowerCase(), msg=$('#admMsg');
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ msg.className='pm-note'; msg.textContent=t('بريد غير صحيح','Invalid email'); return; }
        b.disabled=true; const old=b.textContent; b.textContent=t('جارٍ الحفظ…','Saving…');
        try{ await set(ref(db,'config/adminEmail'), em); adminEmail=em; try{ sessionStorage.setItem(ADMIN_EMAIL_KEY, em); }catch(e){} toast(t('تم حفظ بريد الأدمن ✓','Admin email saved ✓')); showAdmin(); }
        catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الحفظ — لازم تكون داخل بجوجل، وتحفظ بريدك أنت (أول مرة) أو تكون الأدمن الحالي.','Failed to save — you must be signed in with Google and save your own email (first time) or be the current admin.'); b.disabled=false; b.textContent=old; }
      };
      // save / change the panel password
      const ps=$('#admPassSave');
      if(ps) ps.onclick=async()=>{
        const p1=($('#admPass1').value||''), p2=($('#admPass2').value||''), msg=$('#admPassMsg');
        if(p1.length<6){ msg.className='pm-note'; msg.textContent=t('كلمة المرور 6 أحرف على الأقل','Password must be at least 6 characters'); return; }
        if(p1!==p2){ msg.className='pm-note'; msg.textContent=t('كلمتا المرور غير متطابقتين','The passwords do not match'); return; }
        ps.disabled=true; const old=ps.textContent; ps.textContent=t('جارٍ الحفظ…','Saving…');
        try{ const salt=shortId(16); const hash=await hashAdminPass(salt,p1);
          await set(ref(db,'config/adminGate'), { salt, hash, at:Date.now() });
          markAdminUnlocked(); toast(t('تم حفظ كلمة المرور ✓','Password saved ✓')); showAdmin();
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الحفظ — تأكد أنك أدمن (Google) وأن القواعد المحدّثة منشورة','Failed to save — make sure you are the admin (Google) and the updated rules are published'); ps.disabled=false; ps.textContent=old; }
      };
      // remove the panel password
      const pr=$('#admPassRemove');
      if(pr) pr.onclick=async()=>{ if(!confirm(t('إزالة كلمة مرور اللوحة؟ سيصبح بريد الأدمن ظاهراً لمن يفتح القسم.','Remove the panel password? The admin email will become visible to anyone who opens the section.')))return;
        try{ await remove(ref(db,'config/adminGate')); clearAdminUnlock(); toast(t('تمت إزالة كلمة المرور','Password removed')); showAdmin(); }
        catch(e){ console.error(e); toast(t('تعذّر — تأكد أنك أدمن','Failed — make sure you are the admin')); } };
      // image-upload keys: each key in its own box, with add / remove
      const list=$('#imgKeysList');
      const add=$('#imgKeysAdd');
      if(add && list) add.onclick=()=>{ list.insertAdjacentHTML('beforeend', imgKeyRow('')); const inps=list.querySelectorAll('.imgkey-inp'); const last=inps[inps.length-1]; if(last) last.focus(); };
      // remove a row (delegated) — always keep at least one empty box on screen
      if(list) list.onclick=(e)=>{ const del=e.target.closest('.imgkey-del'); if(!del) return;
        const rows=list.querySelectorAll('.imgkey-row');
        if(rows.length<=1){ const inp=list.querySelector('.imgkey-inp'); if(inp) inp.value=''; }
        else del.closest('.imgkey-row').remove();
      };
      const ik=$('#imgKeysSave');
      if(ik) ik.onclick=async()=>{
        const msg=$('#imgKeysMsg');
        const keys=[...(list?list.querySelectorAll('.imgkey-inp'):[])].map(i=>i.value.trim()).filter(Boolean);
        if(!keys.length){ msg.className='pm-note'; msg.textContent=t('أضف مفتاحاً واحداً على الأقل','Add at least one key'); return; }
        ik.disabled=true; const old=ik.textContent; ik.textContent=t('جارٍ الحفظ…','Saving…');
        try{ const saved=await saveImageKeys(keys);
          msg.className='pm-note ok'; msg.textContent=t('تم حفظ المفاتيح ✓','Keys saved ✓')+' ('+saved.length+')';
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الحفظ — تأكد أنك أدمن (Google) وأن القواعد المحدّثة منشورة','Failed to save — make sure you are the admin (Google) and the updated rules are published'); }
        ik.disabled=false; ik.textContent=old;
      };
      // captcha (reCAPTCHA) keys: box per key, add / remove, save to localStorage + config
      const capList=$('#capKeysList'), capAdd=$('#capKeysAdd'), capSave=$('#capKeysSave');
      if(capAdd && capList) capAdd.onclick=()=>{ capList.insertAdjacentHTML('beforeend', capKeyRow('')); const ii=capList.querySelectorAll('.cap-inp'); const l=ii[ii.length-1]; if(l) l.focus(); };
      if(capList) capList.onclick=(e)=>{ const del=e.target.closest('.cap-del'); if(!del) return;
        const rows=capList.querySelectorAll('.cap-row');
        if(rows.length<=1){ const inp=capList.querySelector('.cap-inp'); if(inp) inp.value=''; } else del.closest('.cap-row').remove(); };
      if(capSave) capSave.onclick=async()=>{
        const msg=$('#capKeysMsg');
        const keys=[...(capList?capList.querySelectorAll('.cap-inp'):[])].map(i=>i.value.trim()).filter(Boolean);
        if(!keys.length){ msg.className='pm-note'; msg.textContent=t('أضف مفتاحاً واحداً على الأقل','Add at least one key'); return; }
        capSave.disabled=true; const old=capSave.textContent; capSave.textContent=t('جارٍ الحفظ…','Saving…');
        try{ const saved=await saveCaptchaKeys(keys);
          msg.className='pm-note ok'; msg.textContent=t('تم الحفظ ✓ — أعد تحميل الصفحة للتفعيل','Saved ✓ — reload the page to apply')+' ('+saved.length+')';
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('حُفظ محلياً، لكن تعذّر الحفظ في القاعدة — تأكد أنك أدمن والقواعد منشورة','Saved locally, but saving to the database failed — make sure you are the admin and the rules are published'); }
        capSave.disabled=false; capSave.textContent=old;
      };
      // backup email (EmailJS) accounts: repeatable 5-field sets, add / remove, save to config
      const emlList=$('#emlList'), emlAdd=$('#emlAdd'), emlSave=$('#emlSave');
      if(emlAdd && emlList) emlAdd.onclick=()=>{ emlList.insertAdjacentHTML('beforeend', emailSetRow({})); const r=emlList.querySelector('.eml-row:last-child .eml-pk'); if(r) r.focus(); };
      if(emlList) emlList.onclick=(e)=>{ const del=e.target.closest('.eml-del'); if(!del) return;
        const rows=emlList.querySelectorAll('.eml-row');
        if(rows.length<=1){ del.closest('.eml-row').querySelectorAll('input').forEach(i=>i.value=''); } else del.closest('.eml-row').remove(); };
      if(emlSave) emlSave.onclick=async()=>{
        const msg=$('#emlMsg');
        const sets=[...(emlList?emlList.querySelectorAll('.eml-row'):[])].map(r=>({
          publicKey:(r.querySelector('.eml-pk').value||'').trim(), serviceId:(r.querySelector('.eml-sv').value||'').trim(),
          templateId:(r.querySelector('.eml-tp').value||'').trim(), notifyTemplateId:(r.querySelector('.eml-nt').value||'').trim(),
          toEmail:(r.querySelector('.eml-to').value||'').trim()
        })).filter(s=>s.publicKey||s.serviceId||s.templateId);
        emlSave.disabled=true; const old=emlSave.textContent; emlSave.textContent=t('جارٍ الحفظ…','Saving…');
        try{ const saved=await saveEmailBackups(sets);
          msg.className='pm-note ok'; msg.textContent=t('تم حفظ الحسابات الاحتياطية ✓','Backup accounts saved ✓')+' ('+saved.length+')';
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الحفظ — تأكد أنك أدمن (Google) وأن القواعد المحدّثة منشورة','Failed to save — make sure you are the admin (Google) and the updated rules are published'); }
        emlSave.disabled=false; emlSave.textContent=old;
      };
      // backup databases: box per backup URL + active-write selector
      const dbL=$('#dbList'), dbAdd=$('#dbAdd'), dbSave=$('#dbSave');
      const syncDbActive=()=>{ const sel=$('#dbActive'); if(!sel) return; const urls=[dbInfo.urls[0], ...[...(dbL?dbL.querySelectorAll('.db-inp'):[])].map(i=>i.value.trim()).filter(Boolean)];
        const cur=sel.value; sel.innerHTML=urls.map((u,i)=>`<option value="${i}">${i===0?t('الأساسية','Primary')+' — ':''}${esc(u)}</option>`).join(''); if(cur<urls.length) sel.value=cur; };
      if(dbAdd && dbL) dbAdd.onclick=()=>{ dbL.insertAdjacentHTML('beforeend', dbUrlRow('')); const ii=dbL.querySelectorAll('.db-inp'); const l=ii[ii.length-1]; if(l) l.focus(); syncDbActive(); };
      if(dbL){ dbL.onclick=(e)=>{ const del=e.target.closest('.db-del'); if(!del) return;
          const rows=dbL.querySelectorAll('.db-row');
          if(rows.length<=1){ const inp=dbL.querySelector('.db-inp'); if(inp) inp.value=''; } else del.closest('.db-row').remove(); syncDbActive(); };
        dbL.addEventListener('input', syncDbActive); }
      if(dbSave) dbSave.onclick=async()=>{
        const msg=$('#dbMsg');
        const backups=[...(dbL?dbL.querySelectorAll('.db-inp'):[])].map(i=>i.value.trim()).filter(Boolean);
        const bad=backups.find(u=>!/^https:\/\/.+/i.test(u));
        if(bad){ msg.className='pm-note'; msg.textContent=t('رابط قاعدة غير صالح — لازم يبدأ بـ https://','Invalid database URL — it must start with https://'); return; }
        dbSave.disabled=true; const old=dbSave.textContent; dbSave.textContent=t('جارٍ الحفظ…','Saving…');
        try{ await saveDbBackups(backups); const sel=$('#dbActive'); if(sel) setActiveDb(parseInt(sel.value,10)||0);
          msg.className='pm-note ok'; msg.textContent=t('تم الحفظ ✓ — أعد تحميل الصفحة للتفعيل','Saved ✓ — reload the page to apply');
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('حُفظ محلياً، لكن تعذّر الحفظ في القاعدة — تأكد أنك أدمن والقواعد منشورة','Saved locally, but saving to the database failed — make sure you are the admin and the rules are published'); }
        dbSave.disabled=false; dbSave.textContent=old;
      };
    };

    /* ---------- password gate (hides the admin email behind a password) ---------- */
    if(adminGateSet && !adminUnlocked()){
      $('#app').innerHTML = appbar('admin') + `<div class="wrap">
        <div class="lock-wrap"><div class="lock-card">
          <div class="lock-ic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4"/></svg></div>
          <h2 class="lock-title">${t('لوحة الأدمن محمية بكلمة مرور','The admin panel is password-protected')}</h2>
          <p class="lock-sub">${t('أدخل كلمة مرور لوحة الأدمن للمتابعة.','Enter the admin panel password to continue.')}</p>
          <div class="lock-err" id="admGateErr"></div>
          <div class="field"><input id="admGatePass" type="password" placeholder="${t('كلمة المرور','Password')}" autocomplete="off" style="text-align:center;letter-spacing:2px"/></div>
          <button class="btn primary" id="admGateGo">${t('دخول','Enter')}</button>
          <a class="lock-home" href="${urlHome()}">${t('العودة للرئيسية','Back to Home')}</a>
        </div></div>
      </div>` + drawer('admin');
      wireAppbar();
      const inp=$('#admGatePass'), err=$('#admGateErr'), go=$('#admGateGo');
      const attempt=async()=>{
        err.textContent='';
        const v=inp.value; if(!v){ err.textContent=t('أدخل كلمة المرور','Enter the password'); return; }
        go.disabled=true; const old=go.textContent; go.textContent=t('جارٍ التحقق…','Verifying…');
        const h=await hashAdminPass(adminGateObj.salt||'', v);
        if(h===adminGateObj.hash){ markAdminUnlocked(); showAdmin(); }
        else{ err.textContent=t('كلمة المرور غير صحيحة','Incorrect password'); go.disabled=false; go.textContent=old; inp.value=''; inp.focus(); }
      };
      go.onclick=attempt;
      inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); attempt(); } });
      inp.focus();
      return;
    }

    /* ---------- tabbed control center ---------- */
    let TAB_ID='overview';
    let admTimer=null;   // auto-refresh interval for the active-now list (analytics tab)
    const TABS=[['overview',t('نظرة عامة','Overview')],['analytics',t('التحليلات','Analytics')],['users',t('المستخدمون','Users')],['profiles',t('البروفايلات','Profiles')],
      ['blogs',t('المدونات','Blogs')],['payments',t('المدفوعات','Payments')],['referrals',t('الدعوات','Referrals')],['notify',t('الإشعارات','Notifications')],['maintenance',t('الصيانة','Maintenance')],['config',t('الإعدادات','Settings')]];
    const TAB_IC = {
      overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
      analytics:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/></svg>',
      users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M16 6.2A3 3 0 0 1 16 12M20.5 19c0-2.3-1.4-4-3.5-4.6"/></svg>',
      profiles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="10" r="2.2"/><path d="M5 17c.5-1.8 2-2.8 3.5-2.8s3 1 3.5 2.8"/><path d="M14.5 9h4M14.5 13h4"/></svg>',
      blogs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 16h6"/></svg>',
      payments:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M6 15h4"/></svg>',
      referrals:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="5" rx="1.5"/><path d="M5 13v8h14v-8M12 8v13"/><path d="M12 8S10.5 3.5 8 4.5 9 8 12 8ZM12 8s1.5-4.5 4-3.5S15 8 12 8Z"/></svg>',
      notify:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
      maintenance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.7 2.7-2.3-.6-.6-2.3Z"/></svg>',
      config:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>'
    };
    const shell=(inner)=> appbar('admin') + `<div class="wrap adm-wrap">
      <header class="adm-head">
        <div class="adm-head-main">
          <span class="adm-badge-pill">${t('لوحة التحكّم','Control Panel')}</span>
          <h2>${t('لوحة تحكّم الأدمن','Admin Dashboard')}</h2>
          <div class="sub">${t('راقب وتحكّم في الموقع بالكامل — المستخدمون، المحتوى، الاشتراكات، والإشعارات.','Monitor and control the whole site — users, content, subscriptions, and notifications.')}</div>
        </div>
        <div class="adm-head-user">${userAvatar('avatar-sm adm-head-av')}<div class="adm-head-id"><b>${esc(currentUser.username||t('الأدمن','Admin'))}</b><span>${esc(currentUser.email||'')}</span></div></div>
      </header>
      <nav class="adm-tabs">${TABS.map(tb=>`<button class="adm-tab ${TAB_ID===tb[0]?'on':''}" data-tab="${tb[0]}"><span class="adm-tab-ic">${TAB_IC[tb[0]]||''}</span><span class="adm-tab-lb">${tb[1]}</span></button>`).join('')}</nav>
      <div class="adm-body" id="admBody">${inner}</div>
    </div>` + drawer('admin');
    const busy = ()=>`<div class="pm-note" style="text-align:center;padding:34px 0">${t('جارٍ التحميل…','Loading…')}</div>`;
    const bodyEl = ()=>$('#admBody');
    const wireTabs = ()=>document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    function setTab(id){
      TAB_ID=id;
      document.querySelectorAll('.adm-tab').forEach(b=>b.classList.toggle('on', b.dataset.tab===id));
      renderTab();
    }
    async function renderTab(){
      if(admTimer){ clearInterval(admTimer); admTimer=null; }   // stop any tab's auto-refresh
      const el=bodyEl(); if(!el) return; el.innerHTML=busy();
      try{
        if(TAB_ID==='overview')      await renderOverview(el);
        else if(TAB_ID==='analytics') await renderAnalytics(el);
        else if(TAB_ID==='users')    await renderUsers(el);
        else if(TAB_ID==='profiles') await renderProfiles(el);
        else if(TAB_ID==='blogs')    await renderBlogs(el);
        else if(TAB_ID==='payments') await renderPayments(el);
        else if(TAB_ID==='referrals') await renderReferrals(el);
        else if(TAB_ID==='notify')   await renderNotify(el);
        else if(TAB_ID==='maintenance') await renderMaintTab(el);
        else if(TAB_ID==='config'){  el.innerHTML=setupCard(); wireSetup(); }
        wireTabLinks(el);
      }catch(e){ console.error(e); el.innerHTML=`<div class="mp-empty">${t('تعذّر التحميل — تأكد أنك داخل بحساب الأدمن (Google) وأن قواعد قاعدة البيانات المحدّثة منشورة.','Failed to load — make sure you are signed in with the admin account (Google) and the updated database rules are published.')}</div>`; }
    }
    const wireTabLinks = el=>el.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>setTab(b.dataset.goto));

    /* ----- Maintenance ----- */
    async function renderMaintTab(el){
      const cfg = await loadMaintenance() || {};
      const row=(key,label,danger)=>`<label class="mnt-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 2px;border-bottom:1px solid var(--line)">
          <span style="${danger?'font-weight:700':''}">${label}</span>
          <input type="checkbox" data-mnt="${key}" ${cfg[key]?'checked':''} style="width:20px;height:20px;flex:0 0 auto;accent-color:var(--gold);cursor:pointer"/>
        </label>`;
      el.innerHTML = `<div class="panel" style="max-width:600px;margin:0 auto;padding:20px">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin-bottom:6px">🛠️ ${t('وضع الصيانة','Maintenance mode')}</h3>
        <div class="sub" style="margin-bottom:14px">${t('فعّل الصيانة على الموقع كله أو على قسم بعينه. الزوّار يرون صفحة صيانة، وأنت (الأدمن) تدخل عادي.','Enable maintenance for the whole site or a specific section. Visitors see a maintenance page; you (the admin) still get in normally.')}</div>
        ${row('site','🔴 '+t('إغلاق الموقع بالكامل','Close the whole site'),true)}
        ${row('explore',t('قسم الاستكشاف','Explore section'))}
        ${row('profiles',t('قسم البروفايلات (العرض والإنشاء)','Profiles section (view & create)'))}
        ${row('blogs',t('قسم المدونات (العرض والإنشاء)','Blogs section (view & create)'))}
        ${row('premium',t('قسم البريميوم','Premium section'))}
        <div class="field" style="margin-top:14px"><label>${t('رسالة الصيانة (اختياري)','Maintenance message (optional)')}</label><input id="mntMsg" value="${esc(cfg.msg||'')}" placeholder="${t('نعتذر، الموقع تحت الصيانة…','Sorry, the site is under maintenance…')}"/></div>
        <button class="btn primary" id="mntSave" style="width:100%;margin-top:6px">${t('حفظ إعدادات الصيانة','Save maintenance settings')}</button>
        <div class="pm-note" id="mntNote"></div>
      </div>`;
      const sv=$('#mntSave');
      if(sv) sv.onclick=async()=>{
        const out={};
        el.querySelectorAll('[data-mnt]').forEach(c=>{ if(c.checked) out[c.dataset.mnt]=true; });
        const m=($('#mntMsg').value||'').trim(); if(m) out.msg=m.slice(0,400);
        const note=$('#mntNote'); sv.disabled=true; const old=sv.textContent; sv.textContent=t('جارٍ الحفظ…','Saving…');
        try{ await set(ref(db,'config/maintenance'), out); maintCfg=out;
          note.className='pm-note ok'; note.textContent=t('تم حفظ إعدادات الصيانة ✓','Maintenance settings saved ✓');
        }catch(e){ console.error(e); note.className='pm-note'; note.textContent=t('تعذّر الحفظ — تأكد أنك أدمن (Google) وأن القواعد المحدّثة منشورة','Failed to save — make sure you are the admin (Google) and the updated rules are published'); }
        sv.disabled=false; sv.textContent=old;
      };
    }

    /* ----- Analytics ----- */
    async function renderAnalytics(el){
      let a={};
      try{ const s=await get(child(ref(db),'analytics')); if(s.exists()) a=s.val()||{}; }catch(e){}
      const total=a.total||0, daily=a.daily||{}, countries=a.countries||{};
      const p2=n=>(n<10?'0':'')+n, keyOf=dt=>dt.getFullYear()+'-'+p2(dt.getMonth()+1)+'-'+p2(dt.getDate());
      const today=daily[keyOf(new Date())]||0;
      const days=[]; { const base=Date.now(); for(let i=13;i>=0;i--){ const dd=new Date(base-i*86400000); const k=keyOf(dd); days.push([k, daily[k]||0]); } }
      const maxD=Math.max(1,...days.map(x=>x[1]));
      const bars=days.map(x=>`<div title="${x[0]}: ${x[1]}" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px">
          <div style="width:100%;background:var(--gold);border-radius:3px 3px 0 0;height:${Math.round(x[1]/maxD*90)+2}px"></div>
          <span style="font-size:9px;opacity:.6">${x[0].slice(5)}</span>
        </div>`).join('');
      const cList=Object.entries(countries).sort((m,n)=>n[1]-m[1]);
      const maxC=Math.max(1,...cList.map(x=>x[1]));
      const flag=cc=>/^[A-Z]{2}$/.test(cc)?cc.replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0))):'🌐';
      const cRows=cList.length?cList.map(x=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
          <span style="width:52px">${flag(x[0])} ${esc(x[0])}</span>
          <div style="flex:1;background:var(--line);border-radius:6px;overflow:hidden;height:10px"><div style="height:100%;width:${Math.round(x[1]/maxC*100)}%;background:var(--gold)"></div></div>
          <b style="width:44px;text-align:end">${x[1]}</b>
        </div>`).join(''):`<div class="pm-note">${t('لا توجد بيانات دول بعد','No country data yet')}</div>`;
      const stat=(v,l)=>`<div class="panel" style="flex:1;min-width:130px;text-align:center;padding:16px"><div style="font-size:28px;font-weight:800;color:var(--gold)">${v}</div><div class="sub">${l}</div></div>`;
      el.innerHTML=`
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
          ${stat(total,t('إجمالي الزيارات','Total visits'))}
          ${stat(today,t('زيارات اليوم','Today'))}
          ${stat('<span id="anaActive">…</span>',t('نشطون الآن','Active now'))}
        </div>
        <div class="panel" style="padding:18px;margin-bottom:16px">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px">${t('الزيارات — آخر ١٤ يوماً','Visits — last 14 days')}</h3>
          <div style="display:flex;align-items:flex-end;gap:4px;height:120px">${bars}</div>
        </div>
        <div class="panel" style="padding:18px;margin-bottom:16px">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px">${t('من أين يدخلون','Where they come from')}</h3>
          ${cRows}
        </div>
        <div class="panel" style="padding:18px">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px">${t('المتصلون الآن','Online now')}</h3>
          <div id="anaOnline"><div class="pm-note">${t('جارٍ التحميل…','Loading…')}</div></div>
        </div>`;
      const refreshOnline=async()=>{
        let pres={};
        try{ const s=await get(child(ref(db),'presence')); if(s.exists()) pres=s.val()||{}; }catch(e){}
        const now=Date.now(); const live=Object.values(pres).filter(pp=>pp&&pp.at&&(now-pp.at)<120000);
        const act=$('#anaActive'); if(act) act.textContent=live.length;
        const box=$('#anaOnline'); if(box){
          box.innerHTML = live.length
            ? live.sort((m,n)=>n.at-m.at).map(pp=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
                <span>${esc(pp.name||t('زائر','Visitor'))}</span><span class="sub" style="font-size:12px">${esc(pp.page||'')}</span></div>`).join('')
            : `<div class="pm-note">${t('لا أحد متصل الآن','No one online right now')}</div>`;
        }
      };
      await refreshOnline();
      admTimer=setInterval(refreshOnline, 15000);
    }

    /* ----- Referrals ----- */
    async function grantReferralPremium(uid, done){
      try{
        const cur=await getPremium(uid);
        const base=(cur && premiumActive(cur) && cur.expires)?cur.expires:Date.now();
        const expires=base + 24*3600*1000;   // +1 day
        const count=((cur && cur.count)?cur.count:0)+1;
        await set(ref(db,'premium/'+uid), { active:true, plan:'referral', since:(cur&&cur.since)||Date.now(), expires, count });
        await set(ref(db,'referralRewards/'+uid), { at:Date.now() });
        toast(t('تم منح بريميوم يوم ✓','1-day premium granted ✓')); done&&done();
      }catch(e){ console.error(e); toast(t('تعذّر — تأكد أنك داخل بحساب الأدمن (Google)','Failed — make sure you are signed in with the admin account (Google)')); }
    }
    async function renderReferrals(el){
      const goal=10;
      let refs={}, rewards={}, users={};
      try{ const s=await get(child(ref(db),'referrals')); if(s.exists()) refs=s.val()||{}; }catch(e){}
      try{ const s=await get(child(ref(db),'referralRewards')); if(s.exists()) rewards=s.val()||{}; }catch(e){}
      try{ const s=await get(child(ref(db),'users')); if(s.exists()) users=s.val()||{}; }catch(e){}
      const rows=Object.entries(refs).map(([ruid,kids])=>({uid:ruid,count:Object.keys(kids||{}).length}))
        .filter(r=>r.count>0).sort((m,n)=>n.count-m.count);
      const nameOf=uid=>{ const u=users[uid]; return u?(u.username||u.email||uid):uid; };
      const eligible=rows.filter(r=>r.count>=goal && !rewards[r.uid]);
      const card=(inner,title)=>`<div class="panel" style="padding:18px;margin-bottom:16px"><h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px">${title}</h3>${inner}</div>`;
      const eligHtml = eligible.length
        ? eligible.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)">
            <span><b>${esc(nameOf(r.uid))}</b> <span class="sub">— ${r.count} ${t('دعوة','referrals')}</span></span>
            <button class="btn primary" data-grant-ref="${esc(r.uid)}" style="flex:0 0 auto;padding:7px 14px">${t('منح بريميوم يوم','Grant 1-day premium')}</button>
          </div>`).join('')
        : `<div class="pm-note">${t('لا أحد مؤهَّل للمكافأة الآن','No one is eligible for a reward right now')}</div>`;
      const allHtml = rows.length
        ? rows.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
            <span>${esc(nameOf(r.uid))}</span>
            <span class="sub">${r.count}/${goal}${rewards[r.uid]?' · '+t('كوفئ ✓','rewarded ✓'):''}</span>
          </div>`).join('')
        : `<div class="pm-note">${t('لا توجد دعوات بعد','No referrals yet')}</div>`;
      el.innerHTML = card(eligHtml,'🎁 '+t('مكافآت بانتظار الموافقة','Rewards awaiting approval')) + card(allHtml,t('كل الدعوات','All referrals'));
      el.querySelectorAll('[data-grant-ref]').forEach(b=>b.onclick=()=>{
        if(confirm(t('منح هذا العضو بريميوم ليوم واحد؟','Grant this member 1 day of premium?')))
          grantReferralPremium(b.dataset.grantRef, ()=>renderReferrals(el));
      });
    }

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
      const cards=[[t('المستخدمون','Users'),cnt(uS),'users'],[t('البروفايلات','Profiles'),cnt(pS),'profiles'],
        [t('المدونات','Blogs'),cnt(bS),'blogs'],[t('المشتركون بالإشعارات','Notification subscribers'),cnt(sS),'notify'],
        [t('طلبات قيد المراجعة','Pending requests'),pending,'payments'],[t('إجمالي الطلبات','Total requests'),pays.length,'payments']];
      el.innerHTML=`<div class="adm-stats">${cards.map(c=>`<button class="adm-stat" data-goto="${c[2]}"><b>${c[1]}</b><span>${c[0]}</span></button>`).join('')}</div>
        <div class="pm-card" style="margin-top:18px"><h3>${t('تحكّم سريع','Quick controls')}</h3>
          <div class="adm-quick">
            <button class="btn primary" data-goto="notify" style="width:auto">📢 ${t('إرسال إشعار للمستخدمين','Send a notification to users')}</button>
            <button class="btn ghost" data-goto="payments" style="width:auto">${t('مراجعة طلبات الاشتراك','Review subscription requests')} (${pending})</button>
            <button class="btn ghost" data-goto="users" style="width:auto">${t('إدارة المستخدمين','Manage users')}</button>
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
            <div class="adm-utop"><b>${esc(u.username||t('مستخدم','User'))}</b>${active?`<span class="pm-vip">${CROWN} ${t('مميز','Premium')}</span>`:''}</div>
            <div class="adm-meta" dir="ltr">${esc(u.email||'—')}</div>
            <div class="adm-uid">UID: <code>${esc(u.uid)}</code> · ${esc(u.provider||t('بريد','Email'))} · ${fmtDay(u.createdAt)}</div>
          </div>
          <div class="adm-uacts">
            ${active?`<button class="btn ghost" data-revoke="${esc(u.uid)}">${t('إلغاء التمييز','Revoke Premium')}</button>`:`<button class="btn gold" data-grant="${esc(u.uid)}">${t('تفعيل مميز','Grant Premium')}</button>`}
            <button class="btn ghost" data-mail="${esc(u.email||'')}" data-name="${esc(u.username||'')}">${t('إشعار','Notify')}</button>
            <button class="btn del" data-deluser="${esc(u.uid)}" data-email="${esc(u.email||'')}" data-uname="${esc(u.username||'')}">${t('حذف','Delete')}</button>
          </div></div>`; };
      el.innerHTML=`<div class="adm-search"><input id="admUserSearch" placeholder="${t('ابحث بالاسم أو البريد…','Search by name or email…')}" autocomplete="off"/></div>
        <div class="adm-ulist" id="admUlist"></div>`;
      const wire=()=>{
        el.querySelectorAll('[data-grant]').forEach(b=>b.onclick=()=>{ if(confirm(t('تفعيل الاشتراك المميز لهذا المستخدم؟','Grant premium subscription to this user?'))) adminGrantPremium(b.dataset.grant,()=>renderUsers(el)); });
        el.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{ if(!confirm(t('إلغاء العضوية المميزة لهذا المستخدم؟','Revoke this user premium membership?')))return;
          try{ await set(ref(db,'premium/'+b.dataset.revoke),{active:false}); toast(t('تم الإلغاء','Revoked')); renderUsers(el); }catch(e){ console.error(e); toast(t('تعذّر','Failed')); } });
        el.querySelectorAll('[data-mail]').forEach(b=>b.onclick=()=>promptSend(b.dataset.mail,b.dataset.name));
        el.querySelectorAll('[data-deluser]').forEach(b=>b.onclick=async()=>{
          if(!confirm(t('حذف هذا المستخدم نهائياً؟\n(لن تُحذف بروفايلاته/مدونته تلقائياً)','Permanently delete this user?\n(Their profiles/blog will not be deleted automatically)')))return;
          const uid=b.dataset.deluser, email=b.dataset.email, uname=b.dataset.uname;
          try{
            await remove(ref(db,'users/'+uid));
            if(email){ try{ await remove(ref(db,'emails/'+encEmail(email))); }catch(e){} }
            if(uname){ try{ await remove(ref(db,'usernames/'+uname)); }catch(e){} }
            try{ await remove(ref(db,'notifySubs/'+uid)); }catch(e){}
            toast(t('تم حذف المستخدم','User deleted')); renderUsers(el);
          }catch(e){ console.error(e); toast(t('تعذّر الحذف','Delete failed')); }
        });
      };
      const draw=arr=>{ $('#admUlist').innerHTML = arr.length?arr.map(row).join(''):`<div class="mp-empty">${t('لا نتائج.','No results.')}</div>`; wire(); };
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
          <div class="adm-cinfo"><b>${esc(p.name||t('بدون اسم','Untitled'))}</b>
            <div class="adm-meta">${esc(p.ownerName||'')} · ${fmtDay(p.updatedAt)}</div>
            <div class="adm-uid">ID: <code>${esc(p.id)}</code></div></div>
          <div class="adm-cacts"><a class="btn ghost" href="${urlProfileView(p.id)}" target="_blank">${t('عرض','View')}</a>
            <button class="btn del" data-delpf="${esc(p.id)}" data-owner="${esc(p.ownerUid||'')}">${t('حذف','Delete')}</button></div>
        </div>`;
      el.innerHTML=`<div class="adm-search"><input id="admPfSearch" placeholder="${t('ابحث بالاسم أو المالك…','Search by name or owner…')}" autocomplete="off"/></div>
        <div class="adm-clist" id="admPflist"></div>`;
      const draw=arr=>{ $('#admPflist').innerHTML=arr.length?arr.map(row).join(''):`<div class="mp-empty">${t('لا نتائج.','No results.')}</div>`;
        el.querySelectorAll('[data-delpf]').forEach(b=>b.onclick=async()=>{ if(!confirm(t('حذف هذا البروفايل نهائياً؟','Permanently delete this profile?')))return;
          try{ await remove(ref(db,'profiles/'+b.dataset.delpf)); if(b.dataset.owner) try{ await remove(ref(db,'userProfiles/'+b.dataset.owner+'/'+b.dataset.delpf)); }catch(e){}
            toast(t('تم الحذف','Deleted')); renderProfiles(el); }catch(e){ console.error(e); toast(t('تعذّر','Failed')); } }); };
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
          <div class="adm-cinfo"><b>${esc(b.title||t('مدونة','Blog'))}</b>
            <div class="adm-meta">${esc(b.author||'')} · ${Number(b.count)||0} ${t('مقالة','articles')} · ${fmtDay(b.updatedAt)}</div>
            <div class="adm-uid">ID: <code>${esc(b.id)}</code></div></div>
          <div class="adm-cacts"><a class="btn ghost" href="${urlBlogView(b.id)}" target="_blank">${t('عرض','View')}</a>
            <button class="btn del" data-delblog="${esc(b.id)}">${t('حذف','Delete')}</button></div>
        </div>`;
      el.innerHTML=`<div class="adm-search"><input id="admBgSearch" placeholder="${t('ابحث بعنوان المدونة أو الكاتب…','Search by blog title or author…')}" autocomplete="off"/></div>
        <div class="adm-clist" id="admBglist"></div>`;
      const draw=arr=>{ $('#admBglist').innerHTML=arr.length?arr.map(row).join(''):`<div class="mp-empty">${t('لا نتائج.','No results.')}</div>`;
        el.querySelectorAll('[data-delblog]').forEach(b=>b.onclick=async()=>{ if(!confirm(t('حذف هذه المدونة نهائياً؟','Permanently delete this blog?')))return;
          const id=b.dataset.delblog;
          try{
            let owner=''; try{ const bs=await get(child(ref(db),'blogs/'+id)); if(bs.exists()) owner=bs.val().ownerUid||''; }catch(e){}
            await remove(ref(db,'blogs/'+id)); await remove(ref(db,'blogIndex/'+id));
            if(owner) try{ await remove(ref(db,'userBlogs/'+owner+'/'+id)); }catch(e){}
            toast(t('تم الحذف','Deleted')); renderBlogs(el);
          }catch(e){ console.error(e); toast(t('تعذّر','Failed')); } }); };
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
          <a class="adm-shot" href="${esc(r.screenshot||'#')}" target="_blank">${r.screenshot?`<img src="${esc(r.screenshot)}" alt="${t('إيصال','Receipt')}" loading="lazy"/>`:`<span>${t('لا صورة','No image')}</span>`}</a>
          <div class="adm-info">
            <div class="adm-top"><b>${esc(r.username||t('مستخدم','User'))}</b><span class="adm-amt">${Number(r.amount)||0} ${t('ج','EGP')}</span><span class="adm-badge ${esc(r.status||'pending')}">${r.status==='approved'?t('مفعّل','Approved'):r.status==='rejected'?t('مرفوض','Rejected'):t('قيد المراجعة','Pending')}</span></div>
            <div class="adm-meta">${esc(r.email||'')} · ${r.method==='etisalat'?t('اتصالات كاش','Etisalat Cash'):t('انستا باي','InstaPay')} · ${fmtDay(r.createdAt)}</div>
            ${r.note?`<div class="adm-note">📝 ${esc(r.note)}</div>`:''}
            <div class="adm-uid">UID: <code>${esc(r.uid)}</code></div>
            ${r.status==='pending'?`<div class="adm-acts"><button class="btn primary" data-approve="${esc(r.id)}" data-uid="${esc(r.uid)}">${CHECK} ${t('تأكيد وتفعيل','Confirm and activate')}</button><button class="btn ghost" data-reject="${esc(r.id)}">${t('رفض','Reject')}</button></div>`:''}
          </div></div>`).join(''):`<div class="mp-empty">${t('لا توجد طلبات دفع بعد.','No payment requests yet.')}</div>`;
      el.innerHTML=`<div class="adm-subhead"><span class="pm-vip">${pending} ${t('قيد المراجعة','Pending')}</span></div><div class="adm-list">${rows}</div>`;
      el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{
        const id=b.dataset.approve, uid=b.dataset.uid;
        if(!confirm(t('تأكيد استلام المبلغ وتفعيل الاشتراك المميز لهذا المستخدم؟','Confirm receipt of the amount and activate premium subscription for this user?'))) return;
        b.disabled=true;
        try{ await adminGrantPremium(uid); await set(ref(db,'paymentRequests/'+id+'/status'),'approved'); renderPayments(el); }
        catch(e){ console.error(e); toast(t('تعذّر التفعيل','Activation failed')); b.disabled=false; }
      });
      el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{
        if(!confirm(t('رفض هذا الطلب؟','Reject this request?'))) return;
        try{ await set(ref(db,'paymentRequests/'+b.dataset.reject+'/status'),'rejected'); toast(t('تم الرفض','Rejected')); renderPayments(el); }
        catch(e){ console.error(e); toast(t('تعذّر','Failed')); }
      });
    }

    /* ----- Notifications (compose + send + history) ----- */
    async function renderNotify(el){
      el.innerHTML=`
        <div class="pm-card"><h3>${t('إرسال إشعار جديد','Send a new notification')}</h3>
          <div class="field"><label>${t('العنوان','Title')}</label><input id="ntTitle" placeholder="${t('عنوان الإشعار','Notification title')}" maxlength="140"/></div>
          <div class="field"><label>${t('النص','Text')}</label><textarea id="ntBody" placeholder="${t('اكتب رسالتك للمستخدمين…','Write your message to the users…')}" maxlength="1000"></textarea></div>
          <div class="field"><label>${t('المُستَقبِلون','Recipients')}</label>
            <select id="ntAud" class="mini-select" style="width:100%">
              <option value="all">${t('كل المستخدمين','All users')}</option>
              <option value="subs">${t('المشتركون في الإشعارات فقط','Notification subscribers only')}</option>
              <option value="one">${t('مستخدم واحد (بالبريد)','One user (by email)')}</option>
            </select></div>
          <div class="field" id="ntOneWrap" style="display:none"><label>${t('بريد المستخدم','User email')}</label><input id="ntOne" dir="ltr" placeholder="user@example.com"/></div>
          <label class="adm-check"><input type="checkbox" id="ntEmail" checked/><span>${t('إرسال عبر البريد الإلكتروني أيضاً','Send via email too')}</span></label>
          <div class="pm-note" id="ntMsg"></div>
          <button class="btn primary" id="ntSend" style="width:100%">📢 ${t('إرسال الإشعار','Send notification')}</button>
          <div class="pm-note2">${t('يظهر الإشعار داخل الموقع لكل مستخدم عبر جرس الإشعارات، ويُرسَل بالبريد عند تفعيل الخيار.','The notification appears inside the site for each user via the notification bell, and is sent by email when the option is enabled.')}</div>
        </div>
        <div class="pm-card"><h3>${t('الإشعارات المُرسَلة','Sent notifications')}</h3><div id="ntList">${busy()}</div></div>`;
      const audSel=$('#ntAud'); audSel.onchange=()=>{ $('#ntOneWrap').style.display = audSel.value==='one'?'':'none'; };
      $('#ntSend').onclick=async()=>{
        const title=($('#ntTitle').value||'').trim(), bodyv=($('#ntBody').value||'').trim(), msg=$('#ntMsg');
        if(!title){ msg.className='pm-note'; msg.textContent=t('اكتب عنوان الإشعار','Enter the notification title'); return; }
        const aud=audSel.value, wantEmail=$('#ntEmail').checked;
        const btn=$('#ntSend'); btn.disabled=true; const old=btn.textContent; btn.textContent=t('جارٍ الإرسال…','Sending…');
        try{
          let targetUid='all', recipients=[];
          if(aud==='one'){
            const em=($('#ntOne').value||'').trim().toLowerCase();
            if(!em){ msg.className='pm-note'; msg.textContent=t('اكتب بريد المستخدم','Enter the user email'); btn.disabled=false; btn.textContent=old; return; }
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
          msg.textContent = wantEmail ? (emailjsReady()?`✓ ${t('تم النشر داخل الموقع وإرسال','Published inside the site and sent')} ${sent} ${t('بريد','emails')}`:t('✓ تم النشر داخل الموقع (فعّل EmailJS لإرسال البريد)','✓ Published inside the site (enable EmailJS to send email)')) : t('✓ تم نشر الإشعار داخل الموقع','✓ Notification published inside the site');
          $('#ntTitle').value=''; $('#ntBody').value=''; toast(t('تم إرسال الإشعار ✓','Notification sent ✓')); loadNtList();
        }catch(e){ console.error(e); msg.className='pm-note'; msg.textContent=t('تعذّر الإرسال — تأكد من نشر القواعد وأنك أدمن','Failed to send — make sure the rules are published and you are the admin'); }
        finally{ btn.disabled=false; btn.textContent=old; }
      };
      const loadNtList=async()=>{
        const box=$('#ntList'); if(!box) return;
        try{ const s=await get(child(ref(db),'announcements'));
          let list=s.exists()?Object.entries(s.val()).map(([id,v])=>({id,...v})):[];
          list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
          box.innerHTML=list.length?list.map(a=>`<div class="adm-nrow">
            <div class="adm-ninfo"><b>${esc(a.title||'')}</b>${a.body?`<span>${esc(a.body.slice(0,120))}</span>`:''}
              <div class="adm-uid">${a.uid&&a.uid!=='all'?t('مستخدم محدّد','Specific user'):t('الكل','Everyone')} · ${fmtDay(a.createdAt)}</div></div>
            <button class="btn del" data-delnt="${esc(a.id)}">${t('حذف','Delete')}</button></div>`).join(''):`<div class="mp-empty">${t('لا إشعارات مُرسَلة بعد.','No notifications sent yet.')}</div>`;
          box.querySelectorAll('[data-delnt]').forEach(b=>b.onclick=async()=>{ if(!confirm(t('حذف هذا الإشعار؟','Delete this notification?')))return;
            try{ await remove(ref(db,'announcements/'+b.dataset.delnt)); toast(t('تم الحذف','Deleted')); loadNtList(); }catch(e){ toast(t('تعذّر','Failed')); } });
        }catch(e){ box.innerHTML=`<div class="mp-empty">${t('تعذّر التحميل.','Failed to load.')}</div>`; }
      };
      loadNtList();
    }

    /* quick single-user notification (from the Users tab) */
    function promptSend(email, name){
      if(!email){ toast(t('هذا المستخدم بلا بريد','This user has no email')); return; }
      const title=prompt(t('عنوان الإشعار:','Notification title:')); if(title===null||!title.trim()) return;
      const body=(prompt(t('نص الإشعار (اختياري):','Notification text (optional):'))||'').trim();
      const t=title.trim();
      emailToUid(email.toLowerCase()).then(uid=>{ const id=shortId(14);
        set(ref(db,'announcements/'+id),{ title:t.slice(0,140), body:body.slice(0,1000), uid:uid||'all', by:(currentUser.email||'admin'), createdAt:Date.now() }).catch(()=>{});
      });
      sendUserEmail(email,t,body,name).then(ok=>toast(ok?(curLang()==='en'?'Notification and email sent ✓':'تم إرسال الإشعار والبريد ✓'):(curLang()==='en'?'Notification published (enable EmailJS for email)':'تم نشر الإشعار (فعّل EmailJS للبريد)')));
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
      case 'admin':       showAdmin(); return;   // showAdmin() shows a blank 404 to any non-admin (incl. logged-out)
      case 'my-profiles': needLogin(showMyProfiles); return;
      case 'my-blog':     needLogin(showBlogAdmin); return;
      case 'new-profile': needLogin(()=> q('edit')?startEdit(q('edit')):newProfile()); return;
      case 'new-blog':    needLogin(()=> q('blogedit')?startBlogEdit(q('blogedit')):newBlog()); return;
      default:
        // fallback (e.g. a bare index without data-page): dashboard or login
        if(currentUser) showMyProfiles(); else showAuth('login');
    }
  }
  /* ---------- referral invite popup (share link → 1-day premium) ---------- */
  function closeReferral(){ const o=$('#refOv'); if(o) o.remove(); }
  async function openReferral(auto){
    if(!currentUser){ gotoLogin(); return; }
    closeReferral();
    const goal=10;
    const link=ROOT+'?ref='+currentUser.uid;
    const introTxt=t('شارك رابطك — وبعد دخول '+goal+' مستخدمين منه تحصل على بريميوم يوماً كاملاً (بعد مراجعة الأدمن).','Share your link — after '+goal+' users join through it you get a full day of Premium (after admin review).');
    const shareMsg=t('انضم إلى elgoharyX عبر رابطي: ','Join elgoharyX via my link: ')+link;
    const ov=document.createElement('div');
    ov.id='refOv';
    ov.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:18px';
    ov.innerHTML=`<div class="ref-card" style="background:var(--panel,#fff);color:var(--txt,#111);max-width:440px;width:100%;border-radius:18px;padding:24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.45);position:relative;border:1px solid var(--line,rgba(0,0,0,.1))">
      <button id="refClose" title="${t('إغلاق','Close')}" style="position:absolute;top:12px;inset-inline-end:12px;background:none;border:none;font-size:22px;cursor:pointer;color:inherit;line-height:1">✕</button>
      <div style="font-size:36px;text-align:center">🎁</div>
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:22px;text-align:center;margin:6px 0 6px">${t('ادعُ أصدقاءك واربح بريميوم','Invite friends, earn Premium')}</h3>
      <p class="sub" style="text-align:center;margin-bottom:14px">${esc(introTxt)}</p>
      <div id="refProgress" class="sub" style="text-align:center;margin-bottom:14px">${t('جارٍ التحميل…','Loading…')}</div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <input id="refLink" value="${esc(link)}" readonly dir="ltr" style="flex:1;min-width:0;font-family:monospace;font-size:12px"/>
        <button class="btn primary" id="refCopy" style="flex:0 0 auto">${t('نسخ','Copy')}</button>
      </div>
      <a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent(shareMsg)}" target="_blank" rel="noopener" style="width:100%;display:block;text-align:center;margin-bottom:10px">${t('مشاركة عبر واتساب','Share on WhatsApp')}</a>
      ${auto?`<label style="display:flex;align-items:center;gap:8px;justify-content:center;font-size:13px;opacity:.85;cursor:pointer"><input type="checkbox" id="refHide"/> ${t('لا تُظهر هذه الرسالة مرة أخرى','Don\'t show this again')}</label>`:''}
    </div>`;
    document.body.appendChild(ov);
    const close=()=>{ if(auto){ const h=$('#refHide'); if(h&&h.checked){ try{ localStorage.setItem('apb_ref_hide','1'); }catch(e){} } } closeReferral(); };
    $('#refClose').onclick=close;
    ov.onclick=e=>{ if(e.target===ov) close(); };
    $('#refCopy').onclick=()=>{ const i=$('#refLink'); try{ navigator.clipboard.writeText(link); }catch(e){ try{ i.select(); document.execCommand('copy'); }catch(_){} } toast(t('تم نسخ الرابط ✓','Link copied ✓')); };
    try{
      const n=await referralCount(currentUser.uid);
      const el=$('#refProgress');
      if(el){
        el.innerHTML = n>=goal
          ? '<b style="color:var(--gold)">'+t('🎉 وصلت '+n+' — بانتظار موافقة الأدمن على مكافأتك','🎉 '+n+' reached — awaiting admin approval of your reward')+'</b>'
          : t('دخل <b>'+n+'</b> من <b>'+goal+'</b> مستخدمين','<b>'+n+'</b> of <b>'+goal+'</b> users joined');
      }
    }catch(e){}
  }

  /* ---------- maintenance mode (admin-controlled) ----------
     config/maintenance = { site:bool, explore:bool, profiles:bool, blogs:bool,
     premium:bool, msg:string }. When a section (or the whole site) is on, every
     visitor to it sees a maintenance page — except the admin, who always passes. */
  let maintCfg=null;
  async function loadMaintenance(){
    // fail-open with a timeout: never let a slow/failed read block the whole page render
    try{
      const s=await Promise.race([
        get(child(ref(db),'config/maintenance')),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('maint-timeout')), 4000))
      ]);
      maintCfg = s.exists()? (s.val()||{}) : {};
    }catch(e){ maintCfg = {}; }
    return maintCfg;
  }
  const MAINT_SECTION = {
    'explore':'explore',
    'view-profile':'profiles','new-profile':'profiles','my-profiles':'profiles',
    'view-blog':'blogs','new-blog':'blogs','my-blog':'blogs',
    'premium':'premium'
  };
  function maintOn(){
    if(!maintCfg) return false;
    if(maintCfg.site) return true;
    const sec = MAINT_SECTION[PAGE];
    return !!(sec && maintCfg[sec]);
  }
  function showMaintenancePage(){
    document.title=t('صيانة — elgoharyX','Maintenance — elgoharyX');
    try{ document.body.style.background=''; }catch(e){}
    const msg=(maintCfg && maintCfg.msg) ? maintCfg.msg : t('نُجري بعض التحسينات على الموقع الآن. من فضلك عُد بعد قليل — نعتذر عن الإزعاج.','We are making some improvements right now. Please check back shortly — sorry for the inconvenience.');
    const app=document.getElementById('app'); if(!app) return;
    app.innerHTML=`<div class="err-wrap"><div class="err-card">
      <img class="err-logo" src="${LOGO}" alt="elgoharyX"/>
      <div class="err-code">🛠️</div>
      <span class="err-tag"><i></i>${t('صيانة · MAINTENANCE','Maintenance · MAINTENANCE')}</span>
      <h2 class="err-title">${t('الموقع تحت الصيانة','Under maintenance')}</h2>
      <p class="err-msg">${esc(msg)}</p>
      <div class="err-actions"><button class="btn ghost" onclick="location.reload()">${t('إعادة المحاولة','Try again')}</button></div>
    </div></div>`;
  }
  /* which sections (or the whole site) are currently under maintenance */
  function maintActiveList(){
    if(!maintCfg) return [];
    if(maintCfg.site) return [t('الموقع كله','the whole site')];
    const on=[];
    if(maintCfg.explore)  on.push(t('الاستكشاف','Explore'));
    if(maintCfg.profiles) on.push(t('البروفايلات','Profiles'));
    if(maintCfg.blogs)    on.push(t('المدونات','Blogs'));
    if(maintCfg.premium)  on.push(t('البريميوم','Premium'));
    return on;
  }
  /* admin-only banner so the admin can SEE maintenance is active (they bypass the block) */
  function showAdminMaintBanner(){
    const ex=document.getElementById('maintBanner'); if(ex) ex.remove();
    if(!isAdmin()) return;
    const on=maintActiveList(); if(!on.length) return;
    const b=document.createElement('div'); b.id='maintBanner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:10000;background:#b91c1c;color:#fff;padding:7px 14px;text-align:center;font-size:12.5px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    b.textContent='🛠️ '+t('وضع الصيانة مفعّل على: ','Maintenance active on: ')+on.join('، ')+' — '+t('الزوّار يرون صفحة الصيانة (أنت تتخطاها كأدمن)','visitors see the maintenance page (you bypass it as admin)');
    document.body.appendChild(b);
  }
  /* route() wrapped with the maintenance gate — used by init() on every page load */
  async function routeGuarded(){
    if(maintCfg===null) await loadMaintenance();
    const anyMaint = maintActiveList().length>0;
    if(anyMaint && adminEmail===undefined) await loadAdminEmail();   // load so the admin can bypass + see the banner
    if(maintOn() && !isAdmin()){ showMaintenancePage(); return; }
    route();
    showAdminMaintBanner();
  }
  /* site telemetry + growth — runs once currentUser is resolved (or anonymously):
     log the visit, mark live presence, record any pending referral, maybe pop the invite. */
  function beginTracking(){
    try{
      const u=currentUser;
      logVisit();
      startPresence({ uid: u&&u.uid, name: u&&u.username, page: PAGE||'home' });
      if(u&&u.uid){ recordReferralIfPending(u.uid); maybeReferralPopup(); }
    }catch(e){}
  }
  function maybeReferralPopup(){
    try{
      if(!currentUser || isPremium()) return;
      if(localStorage.getItem('apb_ref_hide')==='1') return;
      if(sessionStorage.getItem('apb_ref_popup')==='1') return;
      sessionStorage.setItem('apb_ref_popup','1');
      setTimeout(()=>{ try{ openReferral(true); }catch(e){} }, 1600);
    }catch(e){}
  }
  (async function init(){
    captureReferral();                                 // remember ?ref=… before anything else
    const uid=getSession();
    if(!uid){ await routeGuarded(); beginTracking(); return; }
    loadAdminEmail();                                  // session-cached: reads the DB only on the first page of a session
    // refresh premium status in the background & cache it for the NEXT navigation only —
    // we never flip the gate mid-view, so the current page stays fully consistent.
    const applyPrem=()=>getPremium(uid).then(pp=>{ try{ const c=getCachedUser()||{}; c.premium=premiumActive(pp); c.cachedAt=Date.now(); localStorage.setItem(USER_KEY, JSON.stringify(c)); }catch(e){} }).catch(()=>{});
    let refreshed=false; try{ refreshed = sessionStorage.getItem(REFRESH_KEY)==='1'; }catch(e){}
    const cached=getCachedUser();
    if(cached && cached.uid===uid){
      // instant render from the local cache — no database read needed
      currentUser=cached; await routeGuarded(); beginTracking();
      // touch the database at most ONCE per browser session; later pages use the cache
      if(!refreshed){
        try{ sessionStorage.setItem(REFRESH_KEY,'1'); }catch(e){}
        // refresh the user record first (preserving the cached premium flag so it isn't
        // reset to false), THEN refresh premium — running them concurrently let the
        // record write clobber the premium write, so an activated member stayed "free".
        loadUserRecord(uid).then(rec=>{ if(rec){ currentUser={uid, email:rec.email||'', username:rec.username||t('مستخدم','User'), photo:rec.photo||'', premium:(getCachedUser()||{}).premium}; cacheUser(currentUser); } }).then(applyPrem).catch(()=>{});
      }
      return;
    }
    // no cache (first visit / new device): load the record once, then cache it
    try{ sessionStorage.setItem(REFRESH_KEY,'1'); }catch(e){}
    let rec=null;
    try{ rec=await Promise.race([loadUserRecord(uid), new Promise(r=>setTimeout(()=>r(null),8000))]); }catch(e){}
    if(rec){ currentUser={uid, email:rec.email||'', username:rec.username||t('مستخدم','User'), photo:rec.photo||''}; cacheUser(currentUser); }
    await routeGuarded(); beginTracking(); applyPrem();
  })();
