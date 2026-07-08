/* elgoharyX — Firebase initialization + multi-database federation.
   Single source of truth for the DB connection. Every module imports `db` and the
   data helpers (ref/get/set/update/remove/child …) from here, so this file is the
   ONE place data access can be federated across several Realtime Databases.

   FEDERATION (admin-configured backup DBs):
     • reads  — merged across all DBs, so old data on the primary + new data on a
                backup are both visible (by key AND in list/collection reads).
     • writes — go to the "active" DB; on a non-permission failure they advance to
                the next DB automatically; config/** is mirrored to ALL DBs so the
                admin-auth rules (which read config/adminEmail) work on every DB.
     • remove — applied to ALL DBs (a record may live in any of them).

   SAFETY: when no backup is configured (the default), there is exactly ONE DB and
   every helper takes a fast path that calls the raw Firebase SDK directly — i.e.
   behaviour is byte-for-byte identical to a plain single-database setup. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
/* App Check + reCAPTCHA removed 2026-07-08 — see note below the config. */
import {
  getDatabase,
  ref as fbRef, child as fbChild, get as fbGet, set as fbSet,
  update as fbUpdate, remove as fbRemove,
  increment, onDisconnect, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

/* value-only helpers pass straight through (they are sentinels / listeners, not paths) */
export { increment, onDisconnect, onValue, serverTimestamp };
export { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

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

/* reCAPTCHA v3 site key(s) for App Check. The admin can change/replace the key
   from the panel; it is mirrored to localStorage so it survives (App Check runs
   before any DB read, and an enforced App Check would block reading the key from
   the DB — so localStorage, not a live DB read, is the source here). The first
   key is the active one; the rest are spares the admin can promote. */
const DEFAULT_CAPTCHA_KEYS = ['6LcZP0ktAAAAAP4C-bDF3Qd1ttTyeUcvTGrdihSy'];
export function captchaKeys(){
  try{ const s = localStorage.getItem('apb_captcha_keys'); if(s){ const a = JSON.parse(s); if(Array.isArray(a) && a.filter(Boolean).length) return a.filter(Boolean); } }catch(e){}
  return DEFAULT_CAPTCHA_KEYS.slice();
}

/* App Check + reCAPTCHA REMOVED 2026-07-08.
   The hardcoded reCAPTCHA v3 site key was NOT owned in this project's reCAPTCHA
   account, so Firebase App Check could never verify its token — the exchange kept
   failing with 400 "Invalid reCAPTCHA configuration". App Check enforcement is OFF,
   so it gave ZERO protection while adding ~3s of latency to the first DB read (the
   SDK waited on the failing token exchange) and spamming 400/503 errors. It is no
   longer initialized and the firebase-app-check SDK is no longer imported, so
   reCAPTCHA never loads. Enforcement MUST stay OFF unless App Check is re-added.
   TO RE-ENABLE bot protection later: create a reCAPTCHA v3 key you OWN for this
   domain, re-import { initializeAppCheck, ReCaptchaV3Provider } from the app-check
   SDK, initialize it with that site key, register the same key + its SECRET in the
   Firebase App Check console, confirm the exchange returns 200, THEN turn on
   enforcement. (captchaKeys()/DEFAULT_CAPTCHA_KEYS are kept only because the admin
   Settings panel still reads/writes config/captchaKeys — harmless, unused here.) */

/* ---------- database URL list (primary + admin-added backups) ----------
   The primary URL is the hardcoded default and is always first. Backups come from
   localStorage (mirrored from config/dbUrls, which is refreshed from the primary on
   each load for the NEXT load) — they must be available before any DB read, so a
   live DB read cannot be the source. */
const DEFAULT_DB_URL = firebaseConfig.databaseURL;
/* escape hatch: ?dbreset=1 clears saved backup DBs for a clean single-DB session
   (recover from a bad/misconfigured backup URL so you can fix it in Settings). */
let DBRESET = false;
try{ DBRESET = /[?&]dbreset=1/.test(location.search); if(DBRESET){ localStorage.removeItem('apb_db_urls'); localStorage.removeItem('apb_db_active'); } }catch(e){}
const dedupe = arr => { const seen = new Set(), out = []; for(const x of arr){ if(x && !seen.has(x)){ seen.add(x); out.push(x); } } return out; };
function backupUrls(){
  try{ const s = localStorage.getItem('apb_db_urls'); if(s){ const a = JSON.parse(s); if(Array.isArray(a)) return a.map(x=>String(x||'').trim()).filter(u=>/^https:\/\/.+/i.test(u)); } }catch(e){}
  return [];
}
function allUrls(){ return dedupe([DEFAULT_DB_URL, ...backupUrls()]); }

const URLS = allUrls();
let dbs = URLS.map(u => { try{ return getDatabase(app, u); }catch(e){ console.warn('elgoharyX: skipping bad DB url', u, e); return null; } }).filter(Boolean);
if(!dbs.length) dbs = [getDatabase(app, DEFAULT_DB_URL)];   // never end up with zero databases
const primaryDb = dbs[0];
/* a read/write must never hang the app on a slow/unreachable backup */
const withTimeout = (p, ms, fallback) => Promise.race([ p, new Promise(res => setTimeout(() => res(fallback), ms)) ]);

/* health: a backup that times out on a read is DISABLED for the rest of the session
   (the primary, index 0, is never disabled). So a slow/broken backup costs at most
   one short timeout, after which the app runs at full single-DB speed. */
const READ_MS = 3500;
const deadBackup = new Set();
function liveIdx(){ return dbs.map((_, i) => i).filter(i => i === 0 || !deadBackup.has(i)); }
function readTimed(i, path){
  let timedOut = false;
  return Promise.race([
    fbGet(fbRef(dbs[i], path)).catch(() => null),
    new Promise(res => setTimeout(() => { timedOut = true; res(null); }, READ_MS))
  ]).then(s => { if(timedOut && i !== 0){ deadBackup.add(i); console.warn('elgoharyX: backup DB', URLS[i], 'is slow — disabled for this session'); } return s; });
}

/* active write DB index (persisted so overflow writes keep going to the backup) */
let _activeWrite = 0;
try{ const s = localStorage.getItem('apb_db_active'); if(s!=null){ const i = parseInt(s,10); if(i>=0 && i<dbs.length) _activeWrite = i; } }catch(e){}
const persistActive = i => { _activeWrite = i; try{ localStorage.setItem('apb_db_active', String(i)); }catch(e){} };

/* the path a Reference points at (host-independent), e.g. "profiles/abc". */
function pathOf(r){
  try{
    if(r == null) return '';
    if(typeof r === 'string') return r.replace(/^\/+/, '');
    const u = new URL(r.toString());
    return decodeURIComponent(u.pathname).replace(/^\/+/, '');
  }catch(e){ return ''; }
}

/* ---------- synthetic snapshot (wraps a merged plain value) ---------- */
function makeSnap(value, key){
  const exists = value !== null && value !== undefined;
  const snap = {
    key: key != null ? key : null,
    exists: () => exists,
    val: () => (exists ? value : null),
    toJSON: () => (exists ? value : null),
    child(p){
      const parts = String(p).split('/').filter(s=>s!=='');
      let v = value;
      for(const part of parts){ v = (v && typeof v === 'object') ? v[part] : undefined; }
      return makeSnap(v === undefined ? null : v, parts.length ? parts[parts.length-1] : key);
    },
    hasChild(p){ return this.child(p).exists(); },
    hasChildren: () => exists && typeof value === 'object' && value !== null && Object.keys(value).length > 0,
    numChildren: () => (exists && typeof value === 'object' && value !== null) ? Object.keys(value).length : 0,
    forEach(cb){
      if(exists && typeof value === 'object' && value !== null){
        for(const k of Object.keys(value)){
          const v = value[k]; if(v === undefined || v === null) continue;
          if(cb(makeSnap(v, k)) === true) return true;
        }
      }
      return false;
    }
  };
  return snap;
}
/* merge the per-DB values: unite object collections (earlier DB wins on a key
   clash), else take the first DB that has a value. */
function mergeValues(vals){
  const existing = vals.filter(v => v !== null && v !== undefined);
  if(!existing.length) return null;
  const allObj = existing.every(v => typeof v === 'object' && v !== null && !Array.isArray(v));
  if(allObj && existing.length > 1){
    const merged = {};
    for(let i = existing.length - 1; i >= 0; i--) Object.assign(merged, existing[i]); // primary (i=0) applied last → wins
    return merged;
  }
  return existing[0];
}

/* ---------- exported data helpers (federated, with single-DB fast path) ---------- */
export function ref(_db, path){ return path === undefined ? fbRef(primaryDb) : fbRef(primaryDb, path); }
export function child(r, path){ return fbChild(r, path); }

/* a read must NEVER hang the UI forever. On the single-DB fast path a stalled
   connection (slow/failing App Check token exchange, flaky network) could leave
   fbGet() pending indefinitely and the page stuck on its loader/skeleton. Cap it
   and fall back to an empty snapshot so callers render an empty state instead of
   an endless spinner. Generous (12s) so only a genuine hang trips it. */
const GET_MS = 12000;
export async function get(r){
  const live = (dbs.length === 1) ? [0] : liveIdx();
  if(live.length === 1){                                       // fast path — real snapshot, single-DB speed
    const key = (p => p ? p.split('/').filter(Boolean).pop() || null : null)(pathOf(r));
    return Promise.race([
      fbGet(r),
      new Promise(res => setTimeout(() => res(makeSnap(null, key)), GET_MS))
    ]);
  }
  const path = pathOf(r);
  const snaps = await Promise.all(live.map(i => readTimed(i, path)));
  const vals = snaps.map(s => (s && s.exists()) ? s.val() : null);
  const merged = mergeValues(vals);
  const key = path ? path.split('/').filter(Boolean).pop() || null : null;
  return makeSnap(merged, key);
}

/* config/** must exist identically on every DB (rules read config/adminEmail), so
   those writes mirror to all DBs; everything else goes to the active DB. */
const isConfigPath = p => p === 'config' || p.indexOf('config/') === 0;

export async function set(r, value){
  if(dbs.length === 1) return fbSet(r, value);
  const path = pathOf(r);
  if(isConfigPath(path)) return mirrorConfig(d => fbSet(fbRef(d, path), value));
  return writeActive(i => fbSet(fbRef(dbs[i], path), value));
}
export async function update(r, values){
  if(dbs.length === 1) return fbUpdate(r, values);
  const path = pathOf(r);
  if(isConfigPath(path)) return mirrorConfig(d => fbUpdate(fbRef(d, path), values));
  return writeActive(i => fbUpdate(fbRef(dbs[i], path), values));
}
export async function remove(r){
  const path = pathOf(r);
  /* SAFETY GUARD — every legitimate delete targets a SPECIFIC record and has at
     least 2 path segments (e.g. "profiles/<id>", "users/<uid>", "config/adminGate").
     A shorter path — the root ("") or a whole top-level collection ("profiles",
     "users", …) — can only come from a bug such as an empty/undefined id. Refuse it
     so a single bad delete can NEVER wipe a collection or the entire database. */
  const segs = String(path).split('/').filter(Boolean);
  if(segs.length < 2){
    const msg = 'remove blocked: refusing to delete top-level path "' + path + '"';
    console.error(msg); throw new Error(msg);
  }
  if(dbs.length === 1) return fbRemove(fbRef(primaryDb, path));
  await Promise.all(dbs.map(d => withTimeout(fbRemove(fbRef(d, path)).catch(() => {}), 8000, null)));   // a record may be in any DB
}
/* config writes: the PRIMARY must succeed (rules everywhere read config/adminEmail),
   backups are mirrored best-effort in the background so a slow backup never blocks. */
async function mirrorConfig(op){
  const p = op(primaryDb);                                   // authoritative — surfaces permission errors
  dbs.slice(1).forEach(d => { try{ op(d).catch(() => {}); }catch(e){} });
  return p;
}
/* try the active DB, advancing to the next on a non-permission failure (over quota
   / unavailable / timeout → the DB is full or down, so overflow to the next). */
async function writeActive(op){
  for(let n = 0; n < dbs.length; n++){
    const i = (_activeWrite + n) % dbs.length;
    try{
      await Promise.race([ op(i), new Promise((_, rej) => setTimeout(() => rej(new Error('write-timeout')), 9000)) ]);
      if(i !== _activeWrite) persistActive(i); return;
    }catch(e){
      const msg = String((e && (e.code || e.message)) || '');
      if(/permission|denied/i.test(msg) || n === dbs.length - 1) throw e;   // rule error → don't shop around
    }
  }
}

export const db = primaryDb;
export const auth = getAuth(app);

/* refresh the backup-URL list from the primary DB for the NEXT load (so a backup
   the admin adds on one device propagates to others). Skipped during ?dbreset=1 so
   a bad backup in config doesn't immediately re-cache itself. */
try{ if(!DBRESET) fbGet(fbRef(primaryDb, 'config/dbUrls')).then(s => {
  if(s.exists()){ const a = (Array.isArray(s.val()) ? s.val() : Object.values(s.val() || {})).map(x=>String(x||'').trim()).filter(Boolean);
    try{ localStorage.setItem('apb_db_urls', JSON.stringify(a)); }catch(e){} }
}).catch(() => {}); }catch(e){}

/* ---------- admin: manage backup DBs ---------- */
export function dbState(){ return { urls: allUrls(), backups: backupUrls(), active: _activeWrite }; }
export async function saveDbBackups(list){
  const clean = dedupe((list || []).map(x => String(x || '').trim()).filter(Boolean));
  try{ localStorage.setItem('apb_db_urls', JSON.stringify(clean)); }catch(e){}
  await fbSet(fbRef(primaryDb, 'config/dbUrls'), clean);   // mirrored to primary; propagates on next load
  return clean;
}
export function setActiveDb(i){ const n = Math.max(0, Math.min(allUrls().length - 1, i | 0)); persistActive(n); return n; }
