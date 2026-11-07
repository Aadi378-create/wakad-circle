const CACHE='wakad-circle-shell-v11';
const SHELL=['./customer-notifications.js','./next-core.js','./next.css','./profile.js','./order-updates.js','./index.html','./style.css?v=4','./app.js','./offers.js','./commerce.js','./payments-core.js','./payments-ui.js','./payments.css?v=1','./vendor/qrcode.js','./commerce.css?v=4','./auth-ui.js','./cart-core.js','./firebase.js','./cloud-session.js','./firebase-config.js','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('wakad-circle-shell-')||k.startsWith('wakad-kissan-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('push',event=>{let payload;try{payload=event.data?.json()}catch{return}if(!['customer-order-update','order-alert'].includes(payload?.data?.type))return;const ownerAlert=payload.data.type==='order-alert';const permitted=['Your order has been accepted by the store.','Your order is being prepared.','Your order is ready for pickup.','Your order is out for delivery.','Your order is complete.','Your order could not be fulfilled. Open the app for details.','The store suggested a basket change. Open the app to review.','The store has confirmed your payment.','A refund needs attention. Open your order for details.','The store recorded your refund. Please check your receipt.'];const body=ownerAlert?'Open your shopkeeper app to check availability and respond.':permitted.includes(payload.data.body)?payload.data.body:'Your order has an update. Open the app to check.';event.waitUntil(self.registration.showNotification(ownerAlert?'New order at Wakad Circle':'Wakad Circle · Order update',{data:{ownerAlert},body,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:String(payload.data.tag||'order-update').slice(0,160)}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const owner=event.notification.data?.ownerAlert===true,path=owner?'/shopkeeper/':'/',url=new URL(owner?path:'/?orders=1',self.location.origin).href,open=clients.find(c=>{const u=new URL(c.url);return u.origin===self.location.origin&&u.pathname===path});if(open){await open.navigate(url);return open.focus()}return self.clients.openWindow(url)}))});
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
