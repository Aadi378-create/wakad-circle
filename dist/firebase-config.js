// Firebase web configuration is public. Never put service-account credentials here.
window.WK_FIREBASE_PROJECT = {
  apiKey:'AIzaSyB9cAaEBK3-Rq6vj-Y64xPcSP0jAcSNspk',
  authDomain:'wakad-circle.firebaseapp.com',
  projectId:'wakad-kissan',
  storageBucket:'wakad-kissan.firebasestorage.app',
  messagingSenderId:'114726270849',
  appId:'1:114726270849:web:4277f0fdb91859675b9a80'
};
// Keep the presentation isolated from shared stock and real phone numbers.
window.WK_FIREBASE_CONFIG = new URLSearchParams(location.search).get('mode')!=='demo' ? window.WK_FIREBASE_PROJECT : null;
window.WK_FUNCTIONS_REGION = 'asia-south1';

window.WC_STORE_ADDRESS = "Wakad, Pune · 411057";
