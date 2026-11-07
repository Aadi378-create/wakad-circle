const CACHE='wakad-circle-shopkeeper-v3';
const SHELL=['/next-core.js','/next.css','/order-updates.js','/cash-collection.js','/shop-tools.js','/shopkeeper/','/shopkeeper/manifest.webmanifest','/shopkeeper/install.js','/style.css?v=4','/portal.css?v=5','/portal.js','/cloud-session.js','/firebase-config.js','/firebase.js','/payments-core.js','/payments-ui.js','/payments.css?v=1','/vendor/qrcode.js','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('wakad-circle-shopkeeper-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){if(!url.pathname.startsWith('/shopkeeper/'))return;event.respondWith(fetch(event.request).catch(()=>caches.match('/shopkeeper/')));return;}
 if(!SHELL.some(asset=>new URL(asset,self.location.origin).pathname===url.pathname))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});

self.addEventListener('push',event=>{let payload;try{payload=event.data?.json()}catch{return}if(payload?.data?.type!=='order-alert')return;event.waitUntil(self.registration.showNotification('New order at Wakad Circle',{body:'Open your shopkeeper app to check availability and respond.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:String(payload.data.tag||'new-order').slice(0,160),data:{url:'/shopkeeper/'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const url=new URL('/shopkeeper/',self.location.origin).href;const open=clients.find(client=>client.url===url);if(open)return open.focus();return self.clients.openWindow(url)}))});
