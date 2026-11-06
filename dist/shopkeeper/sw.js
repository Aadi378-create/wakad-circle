const CACHE='wakad-circle-shopkeeper-v1';
const SHELL=['/shopkeeper/','/shopkeeper/manifest.webmanifest','/shopkeeper/install.js','/style.css?v=4','/portal.css?v=5','/portal.js','/cloud-session.js','/firebase-config.js','/firebase.js','/payments-core.js','/payments-ui.js','/payments.css?v=1','/vendor/qrcode.js','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('wakad-circle-shopkeeper-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){if(!url.pathname.startsWith('/shopkeeper/'))return;event.respondWith(fetch(event.request).catch(()=>caches.match('/shopkeeper/')));return;}
 if(!SHELL.some(asset=>new URL(asset,self.location.origin).pathname===url.pathname))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
