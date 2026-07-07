/* elgoharyX — core helpers (shared infrastructure).
   i18n, cross-page links, DOM/escape/toast helpers, SEO tags, the shared error
   screen and id/short-link utilities. Every other module imports what it needs
   from here. Kept dependency-light: only Firebase (for the unique-id lookups). */
import { db, ref, get, child } from './firebase.js';

/* ---------- multi-page site links ----------
   Every section lives in its own HTML file in the same folder. ROOT is that
   folder's URL, and the helpers below build canonical cross-page links. */
export const ROOT = location.origin + location.pathname.replace(/[^/]*$/, '');
export const PAGE = (document.body && document.body.dataset.page) || '';
/* ---------- i18n: bilingual helper (Arabic default / English) ----------
   t('عربي','English') returns the string in the active language. Language is
   resolved from i18n.js if present, else localStorage, else the device language. */
export function curLang(){
  try{
    if(window.elgGetLang) return window.elgGetLang();
    var s=localStorage.getItem('apb_lang'); if(s==='en'||s==='ar') return s;
    var l=((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase();
    return l.indexOf('ar')===0?'ar':'en';
  }catch(e){ return 'ar'; }
}
export const t = (ar, en) => (en != null && curLang() === 'en') ? en : ar;
export const pageUrl = (file, qs) => ROOT + file + (qs ? ('?' + qs) : '');
export const urlHome        = ()  => ROOT;
export const urlExplore     = ()  => pageUrl('explore.html');
export const urlLogin       = ()  => pageUrl('login.html');
export const urlMyProfiles  = ()  => pageUrl('my-profiles.html');
export const urlMyBlog      = ()  => pageUrl('my-blog.html');
export const urlHub         = ()  => pageUrl('hub.html');
export const urlNewProfile  = ()  => pageUrl('create-profile.html');
export const urlNewBlog     = ()  => pageUrl('create-blog.html');
export const urlProfileView = id  => pageUrl('profile.html', 'id=' + id);
export const urlProfileEdit = id  => pageUrl('create-profile.html', 'edit=' + id);
export const urlBlogView    = id  => pageUrl('blog.html', 'blog=' + id);
export const urlBlogEdit    = id  => pageUrl('create-blog.html', 'blogedit=' + id);
/* send a logged-out visitor to the login page, remembering where to return. */
export const gotoLogin = () => { location.href = urlLogin() + '?next=' + encodeURIComponent(location.href); };

/* ---------- helpers ---------- */
export const LOGO='https://i.ibb.co/1t1TCvH7/103777.png';
export const SUN='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
export const MOON='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>';
/* iOS-style line icons (replace emoji) */
export const UICON = {
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
export const TAB = {
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
export const $ = (s,r=document)=>r.querySelector(s);
export const esc = s => String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const toast = (m=t('تم النسخ ✓','Copied ✓'))=>{const el=$('#toast');el.textContent=m;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900);};
export const initials = n => (n||t('؟','?')).trim().replace(/^(Prof\.|Dr\.|أ\.د\.|د\.)\s*/i,'').charAt(0).toUpperCase();

/* update SEO meta tags dynamically (per profile / per view) */
export function setMeta(sel, attr, val){
  let el=document.head.querySelector(sel);
  if(!el){ el=document.createElement('meta'); const m=sel.match(/\[(name|property)="([^"]+)"\]/); if(m) el.setAttribute(m[1],m[2]); document.head.appendChild(el); }
  el.setAttribute(attr, val);
}
export function seoFor(d){
  const title=(d.name||t('بروفايل','Profile'))+' — '+(d.role?d.role.slice(0,60):t('ملف أكاديمي','Academic profile'))+' | elgoharyX';
  const desc=(d.about||d.role||t('الملف الأكاديمي الشخصي','Personal academic profile')).slice(0,155);
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
export function renderError(o){
  o=o||{};
  try{ document.body.style.background=''; }catch(e){}
  document.title=(o.code||t('خطأ','Error'))+' — elgoharyX';
  const app=document.getElementById('app'); if(!app) return;
  app.innerHTML=`
    <div class="err-wrap"><div class="err-card">
      <img class="err-logo" src="${LOGO}" alt="elgoharyX"/>
      <div class="err-code">${esc(o.code||'404')}</div>
      <span class="err-tag"><i></i>${esc(o.tag||t('رابط غير صالح · BROKEN LINK','Broken link · BROKEN LINK'))}</span>
      <h2 class="err-title">${esc(o.title||t('الصفحة غير موجودة','Page not found'))}</h2>
      <p class="err-msg">${esc(o.msg||t('يبدو أن الرابط غير صحيح أو تم تعديله أو أن المحتوى لم يعد متاحاً.','The link may be incorrect, was changed, or the content is no longer available.'))}</p>
      <div class="err-actions">
        <a class="btn primary" href="${urlHome()}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 21v-6h6v6"/></svg>
          ${t('العودة للرئيسية','Back to home')}</a>
        ${o.showReload?`<button class="btn ghost" onclick="location.reload()">${t('إعادة المحاولة','Try again')}</button>`:''}
      </div>
    </div></div>`;
}
let _fatalShown=false;
export function fatalError(){
  if(_fatalShown) return; _fatalShown=true;
  renderError({code:t('خطأ','Error'),tag:t('خطأ غير متوقّع · UNEXPECTED','Unexpected error · UNEXPECTED'),title:t('حدث خطأ ما','Something went wrong'),
    msg:t('واجهنا مشكلة غير متوقّعة أثناء تشغيل الصفحة. جرّب إعادة التحميل، وإن استمرّت المشكلة عُد إلى الرئيسية.','We ran into an unexpected problem while loading the page. Try reloading, and if the problem persists return to home.'),showReload:true});
}
// only real uncaught script errors trigger the boundary (ignore resource/load errors)
window.addEventListener('error', e=>{ if(e && e.error instanceof Error) fatalError(); });

/* short unique id (7 chars, no ambiguous letters) */
const ALPH='23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export function shortId(n=7){const a=crypto.getRandomValues(new Uint32Array(n));let s='';for(let i=0;i<n;i++)s+=ALPH[a[i]%ALPH.length];return s;}
export async function uniqueShortId(){
  for(let k=0;k<6;k++){const id=shortId(7);const snap=await get(child(ref(db),'profiles/'+id));if(!snap.exists())return id;}
  return shortId(10);
}
export async function uniqueUserId(){
  for(let k=0;k<6;k++){const id=shortId(9);const snap=await get(child(ref(db),'users/'+id));if(!snap.exists())return id;}
  return shortId(12);
}
/* auto URL shortener — tries multiple providers so it (almost) always works.
   Works only for public http/https links (i.e. after the site is hosted). */
export async function shorten(url){
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
      const txt=(await r.text()).trim();
      if(/^https?:\/\//i.test(txt) && !/error/i.test(txt)) return txt;
    }catch{ /* try next provider */ }
  }
  return null;
}
