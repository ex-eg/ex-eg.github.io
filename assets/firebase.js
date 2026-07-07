/* elgoharyX — Firebase initialization.
   Single source of truth for the database connection. Every module that needs
   the DB imports `db` / `auth` and the helpers from here instead of re-initializing.
   The Realtime-DB and Auth functions are re-exported so callers import everything
   Firebase-related from this one module. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app-check.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

/* Re-export the Realtime-DB and Auth helpers so other modules do:
   import { db, ref, set, get, ... } from './firebase.js'; */
export { ref, set, get, child, remove, update, increment } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
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

export const db = getDatabase(app);
export const auth = getAuth(app);
