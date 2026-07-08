/* OneSignal Web Push service worker.
   Kept in its own /onesignal/ folder so its scope does NOT clash with the
   site's main service worker (sw.js) at the site root. */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
