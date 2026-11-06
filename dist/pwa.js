let installPrompt=null;
const installButton=document.createElement('button');installButton.id='installapp';installButton.textContent='Install app';
$('.demo-toolbar>div').prepend(installButton);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
installButton.onclick=async()=>{
  if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}
  showModal('<h2>Keep your kirana close.</h2><p><b>Android / laptop Chrome:</b> open the browser menu and choose Install app or Add to Home screen.</p><p><b>iPhone:</b> open in Safari, tap Share, then Add to Home Screen.</p><p class="form-note">Catalog and orders sync when connected to the internet. Phone sign-in is required on each new device.</p>');
};
function connectionChanged(){
  let banner=$('#offlinebanner');
  if(!navigator.onLine&&!banner){banner=document.createElement('div');banner.id='offlinebanner';banner.setAttribute('role','status');banner.textContent='You’re offline. Reconnect to load current prices, save changes, or place an order.';document.body.prepend(banner)}
  if(navigator.onLine)banner?.remove();
}
window.addEventListener('online',connectionChanged);window.addEventListener('offline',connectionChanged);connectionChanged();
if('serviceWorker' in navigator){
  let refreshing=false,hadController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing){refreshing=true;location.reload()}});
  navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>{
    function offerUpdate(){if(!registration.waiting)return;let button=$('#updateapp');if(button)return;button=document.createElement('button');button.id='updateapp';button.textContent='Update app';button.onclick=()=>registration.waiting?.postMessage('SKIP_WAITING');$('.demo-toolbar>div').prepend(button)}
    offerUpdate();registration.addEventListener('updatefound',()=>{registration.installing?.addEventListener('statechange',()=>{if(registration.waiting&&navigator.serviceWorker.controller)offerUpdate()})});
    window.addEventListener('focus',()=>registration.update().catch(()=>{}));
  }).catch(()=>notify('Installable app setup is unavailable in this browser. You can continue using the website.'));
}
