/* elgoharyX — site telemetry & growth.
   - Analytics: counts one visit per browser session, by day and by country
     (country via a free IP-geolocation lookup), stored as aggregate counters.
   - Presence: a live "who is on the site now" node, auto-removed on disconnect.
   - Referrals: captures ?ref=<uid> links and records one entry per referred
     account, so the admin can reward referrers (10 → 1-day premium, admin-approved).
   All DB paths are admin-read-only; writes are the lightweight counters below. */
import { db, ref, set, get, child, update, increment, onDisconnect, serverTimestamp } from './firebase.js';

const pad = n => (n < 10 ? '0' : '') + n;
function todayKey(){ const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

/* ---------- analytics ---------- */
/* count one visit per browser session (navigation between pages doesn't recount). */
export async function logVisit(){
  try{ if(sessionStorage.getItem('apb_visit_logged') === '1') return; }catch(e){}
  try{ sessionStorage.setItem('apb_visit_logged', '1'); }catch(e){}
  let cc = '';
  try{
    const r = await fetch('https://ipapi.co/json/');
    if(r.ok){
      const j = await r.json();
      cc = String(j.country_code || j.country || '').slice(0, 2).toUpperCase();
      try{ sessionStorage.setItem('apb_geo', JSON.stringify({ cc, country: j.country_name || '', city: j.city || '' })); }catch(e){}
    }
  }catch(e){ /* geo is best-effort */ }
  try{
    const upd = { total: increment(1) };
    upd['daily/' + todayKey()] = increment(1);
    if(cc && /^[A-Z]{2}$/.test(cc)) upd['countries/' + cc] = increment(1);
    await update(ref(db, 'analytics'), upd);
  }catch(e){ /* rules not published / offline */ }
}

/* ---------- presence (active-now) ---------- */
let _presenceStarted = false;
export function startPresence({ uid, name, page } = {}){
  if(_presenceStarted) return; _presenceStarted = true;
  let sid;
  try{ sid = sessionStorage.getItem('apb_sid'); if(!sid){ sid = 's' + Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('apb_sid', sid); } }
  catch(e){ sid = 's' + Date.now().toString(36); }
  const node = ref(db, 'presence/' + sid);
  const base = { page: String(page || '').slice(0, 40) };
  if(name) base.name = String(name).slice(0, 60);
  if(uid) base.uid = String(uid).slice(0, 64);
  const write = () => { try{ set(node, { ...base, at: serverTimestamp() }); }catch(e){} };
  try{
    write();
    onDisconnect(node).remove();
    // heartbeat so a lingering node (crash / lost close event) reads as stale after ~2 min
    setInterval(write, 45000);
  }catch(e){}
}

/* ---------- referrals ---------- */
/* remember an incoming ?ref=<uid> link for later (when the visitor has an account). */
export function captureReferral(){
  try{
    const code = new URLSearchParams(location.search).get('ref');
    if(code && /^[A-Za-z0-9_-]{4,64}$/.test(code)) localStorage.setItem('apb_ref', code);
  }catch(e){}
}
/* record this account once under the referrer that brought it in. */
export async function recordReferralIfPending(uid){
  if(!uid) return;
  let code; try{ code = localStorage.getItem('apb_ref'); }catch(e){}
  if(!code || code === uid) return;
  try{ if(localStorage.getItem('apb_ref_done') === '1') return; }catch(e){}
  try{
    await set(ref(db, 'referrals/' + code + '/' + uid), Date.now());
    try{ localStorage.setItem('apb_ref_done', '1'); }catch(e){}
  }catch(e){}
}
/* how many distinct accounts a user has referred so far. */
export async function referralCount(uid){
  if(!uid) return 0;
  try{
    const s = await get(child(ref(db), 'referrals/' + uid));
    if(!s.exists()) return 0;
    return Object.keys(s.val() || {}).length;
  }catch(e){ return 0; }
}
