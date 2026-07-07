/* elgoharyX — image hosting (imgbb).
   Uploads an image file and returns its hosted URL. The API key(s) are managed
   by the admin from the Admin » Settings panel and stored in the database at
   config/imgbbKeys as an array. More than one key can be added: uploads try each
   key in order, so when one key hits its quota/limit the next one is used
   automatically. A built-in default key keeps uploads working before the admin
   configures any. */
import { db, ref, get, child, set } from './firebase.js';

/* legacy built-in key — used as a fallback when the admin hasn't set any yet. */
const DEFAULT_KEYS = ['926c4a15635bfbd9038815bcbc0184ad'];
const CONFIG_PATH = 'config/imgbbKeys';

let _keys = null; // in-memory cache for the session

/* normalize whatever is stored (array / object / single string) into a clean list */
function normalizeKeys(v){
  let arr;
  if(Array.isArray(v)) arr = v;
  else if(v && typeof v === 'object') arr = Object.values(v);
  else if(v == null || v === '') arr = [];
  else arr = [v];
  // trim, drop empties, de-duplicate while keeping order
  const seen = new Set(); const out = [];
  for(const k of arr){ const s = String(k||'').trim(); if(s && !seen.has(s)){ seen.add(s); out.push(s); } }
  return out;
}

/* read the configured image API keys (cached). Falls back to the default key. */
export async function loadImageKeys(){
  if(_keys) return _keys;
  let arr = [];
  try{
    const s = await get(child(ref(db), CONFIG_PATH));
    if(s.exists()) arr = normalizeKeys(s.val());
  }catch(e){ /* offline / rules — fall back to default */ }
  _keys = arr.length ? arr : DEFAULT_KEYS.slice();
  return _keys;
}

/* the current keys without hitting the database (for rendering the admin form).
   Returns the cached list, or the default until loadImageKeys() has run. */
export function currentImageKeys(){ return _keys ? _keys.slice() : DEFAULT_KEYS.slice(); }

/* forget the cached keys so the next load re-reads the database. */
export function clearImageKeysCache(){ _keys = null; }

/* persist the admin-provided keys (admin only — enforced by the DB rules). */
export async function saveImageKeys(keys){
  const arr = normalizeKeys(keys);
  await set(ref(db, CONFIG_PATH), arr);
  _keys = arr.length ? arr : DEFAULT_KEYS.slice();
  return _keys;
}

/* upload an image file to imgbb and return its hosted URL.
   Tries every configured key in order until one succeeds. */
export async function uploadToImgbb(file){
  const keys = await loadImageKeys();
  let lastErr = null;
  for(const key of keys){
    try{
      const fd = new FormData(); fd.append('image', file);
      const r = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), { method:'POST', body:fd });
      const j = await r.json();
      if(j && j.success && j.data) return j.data.url || j.data.display_url;
      lastErr = new Error((j && j.error && j.error.message) || 'imgbb upload failed');
    }catch(e){ lastErr = e; /* try the next key */ }
  }
  throw lastErr || new Error('imgbb upload failed');
}
