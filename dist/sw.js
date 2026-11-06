const CACHE='wakad-circle-shell-v8';
const SHELL=['./index.html','./style.css?v=4','./app.js','./offers.js','./commerce.js','./payments-core.js','./payments-ui.js','./payments.css?v=1','./vendor/qrcode.js','./commerce.css?v=4','./presentation.js','./firebase.js','./cloud-session.js','./firebase-config.js','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('wakad-circle-shell-')||k.startsWith('wakad-kissan-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Never cache Firebase API responses, OTPs, account data, or orders.
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/shopkeeper/'))return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));return;
  }
  if(!SHELL.some(asset=>new URL(asset,self.registration.scope).pathname===url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)));
});
