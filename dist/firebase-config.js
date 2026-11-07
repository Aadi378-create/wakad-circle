// Firebase web configuration is public. Never put service-account credentials here.
window.WK_FIREBASE_PROJECT = {
  apiKey:'AIzaSyB9cAaEBK3-Rq6vj-Y64xPcSP0jAcSNspk',
  authDomain:'wakad-circle.firebaseapp.com',
  projectId:'wakad-kissan',
  storageBucket:'wakad-kissan.firebasestorage.app',
  messagingSenderId:'114726270849',
  appId:'1:114726270849:web:4277f0fdb91859675b9a80'
};
window.WK_FIREBASE_CONFIG = window.WK_FIREBASE_PROJECT;
if(new URLSearchParams(location.search).has('mode')){const url=new URL(location.href);url.searchParams.delete('mode');history.replaceState(null,'',url.pathname+url.search+url.hash);}
window.WK_FUNCTIONS_REGION = 'asia-south1';

window.WC_STORE_ADDRESS = "Wakad, Pune · 411057";

window.WC_PUSH_VAPID_KEY="BJQOHSCW9Safix-jvviVzQaDpl6-bjYoeYiS0v1HghCcGG4He7U3a5ibHpc-_XJahcXLIe11TdoRHanXH1fWyV8";
