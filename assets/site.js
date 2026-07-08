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

/* count one visit per browser session PER PROFILE, so a creator sees how many
   distinct visitors opened each profile — by day and by country. Stored as
   aggregate counters under profileStats/<id>, mirroring the site-wide node. */
export async function logProfileVisit(id){
  if(!id) return;
  const flag = 'apb_pv_' + id;
  try{ if(sessionStorage.getItem(flag) === '1') return; }catch(e){}
  try{ sessionStorage.setItem(flag, '1'); }catch(e){}
  let cc = '';
  try{ const g = JSON.parse(sessionStorage.getItem('apb_geo') || '{}'); cc = String(g.cc || '').slice(0, 2).toUpperCase(); }catch(e){}
  try{
    const upd = { total: increment(1) };
    upd['daily/' + todayKey()] = increment(1);
    if(cc && /^[A-Z]{2}$/.test(cc)) upd['countries/' + cc] = increment(1);
    await update(ref(db, 'profileStats/' + id), upd);
  }catch(e){ /* rules not published / offline */ }
}

/* read the aggregate visit stats for one profile (owner-facing dashboard). */
export async function profileStats(id){
  const empty = { total: 0, daily: {}, countries: {} };
  if(!id) return empty;
  try{
    const s = await get(child(ref(db), 'profileStats/' + id));
    if(!s.exists()) return empty;
    const v = s.val() || {};
    return { total: v.total || 0, daily: v.daily || {}, countries: v.countries || {} };
  }catch(e){ return empty; }
}

/* ---------- daily streak (habit loop) ----------
   Rewards a logged-in user for returning on consecutive days. Stored at
   streaks/<uid> = { current, best, last:'YYYY-MM-DD', at }. Advances at most
   once per calendar day. A localStorage guard skips the DB once the day is
   already counted on this browser, so extra page views cost nothing. */
function dayKey(delta){ const d = new Date(); d.setDate(d.getDate() + (delta || 0)); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

/* instant, offline read of the last known streak for UI (chip in the app bar). */
export function cachedStreak(uid){
  if(!uid) return 0;
  try{ return parseInt(localStorage.getItem('apb_streak_n_' + uid) || '0', 10) || 0; }catch(e){ return 0; }
}

export async function bumpStreak(uid){
  if(!uid) return null;
  const today = dayKey(0);
  const ymdKey = 'apb_streak_ymd_' + uid;
  try{ if(localStorage.getItem(ymdKey) === today) return { current: cachedStreak(uid), best: cachedStreak(uid), isNewDay: false, reset: false }; }catch(e){}
  let cur = 0, best = 0, last = '';
  try{
    const s = await get(child(ref(db), 'streaks/' + uid));
    if(s.exists()){ const v = s.val() || {}; cur = v.current || 0; best = v.best || 0; last = v.last || ''; }
  }catch(e){ /* offline / rules — fall through as a fresh start */ }
  if(last === today){
    try{ localStorage.setItem(ymdKey, today); localStorage.setItem('apb_streak_n_' + uid, String(cur)); }catch(e){}
    return { current: cur, best: Math.max(best, cur), isNewDay: false, reset: false };
  }
  const reset = last !== dayKey(-1);
  const current = reset ? 1 : cur + 1;
  const newBest = Math.max(best, current);
  try{
    await set(ref(db, 'streaks/' + uid), { current, best: newBest, last: today, at: Date.now() });
  }catch(e){
    return null;   // write blocked (auth not ready / rules unpublished) — don't mark the day, retry next load
  }
  try{ localStorage.setItem(ymdKey, today); localStorage.setItem('apb_streak_n_' + uid, String(current)); }catch(e){}
  return { current, best: newBest, isNewDay: true, reset: reset && cur > 0 };
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

/* ---------- personal notifications (engagement loop) ----------
   A per-user inbox at notifications/<uid>/<nid> that pulls creators back:
   "someone viewed your profile", "new rating ⭐", "new comment 💬", "new follower".
   Public-write + validated by the DB rules (most users have no Firebase auth token,
   same trust model as the counters above). Best-effort: a blocked/failed write must
   NEVER affect the action that triggered it. */
export async function notify(toUid, data){
  if(!toUid || !data || !data.type) return;
  const nid = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const payload = { type: String(data.type).slice(0, 20), text: String(data.text || '').slice(0, 200), at: Date.now(), seen: false };
  if(data.link)  payload.link  = String(data.link).slice(0, 300);
  if(data.actor) payload.actor = String(data.actor).slice(0, 60);
  try{ await set(ref(db, 'notifications/' + toUid + '/' + nid), payload); }catch(e){ /* rules/offline — silent */ }
}
/* read a user's notification inbox, newest first (optionally capped). */
export async function loadNotifications(uid, cap){
  if(!uid) return [];
  try{
    const s = await get(child(ref(db), 'notifications/' + uid));
    if(!s.exists()) return [];
    const list = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...v }));
    list.sort((a, b) => (b.at || 0) - (a.at || 0));
    return cap ? list.slice(0, cap) : list;
  }catch(e){ return []; }
}
/* trim an inbox to its newest `keep` items (called opportunistically so it never grows unbounded). */
export async function trimNotifications(uid, keep){
  if(!uid) return;
  try{
    const s = await get(child(ref(db), 'notifications/' + uid));
    if(!s.exists()) return;
    const all = Object.entries(s.val() || {}).map(([id, v]) => ({ id, at: v && v.at || 0 }));
    if(all.length <= keep) return;
    all.sort((a, b) => (b.at || 0) - (a.at || 0));
    for(const o of all.slice(keep)){ try{ await set(ref(db, 'notifications/' + uid + '/' + o.id), null); }catch(e){} }
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
