// Firebase web configuration is public. Never put service-account credentials here.
window.WK_FIREBASE_PROJECT = {
  apiKey:'AIzaSyB9cAaEBK3-Rq6vj-Y64xPcSP0jAcSNspk',
  authDomain:'wakad-circle.firebaseapp.com',
  projectId:'wakad-kissan',
  storageBucket:'wakad-kissan.firebasestorage.app',
  messagingSenderId:'114726270849',
  appId:'1:114726270849:web:4277f0fdb91859675b9a80'
};
// Sample mode is restricted to local development. Hosted sites always use real data and payments.
window.WC_LOCAL_DEMO = ['localhost','127.0.0.1','[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('mode')==='demo';
window.WK_FIREBASE_CONFIG = window.WC_LOCAL_DEMO ? null : window.WK_FIREBASE_PROJECT;
if(!window.WC_LOCAL_DEMO && new URLSearchParams(location.search).has('mode')){const url=new URL(location.href);url.searchParams.delete('mode');history.replaceState(null,'',url.pathname+url.search+url.hash);}

window.WK_FUNCTIONS_REGION = 'asia-south1';

window.WC_STORE_ADDRESS = "Wakad, Pune · 411057";
