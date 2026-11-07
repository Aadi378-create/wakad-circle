(function(){
 let prompt=null;
 const install=document.createElement('button');install.id='installshopkeeper';install.className='portal-button';install.textContent='Install shopkeeper app';document.querySelector('.portal-header-actions').prepend(install);
 const installState=WCNext.bindInstall(install);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event});
 install.onclick=async()=>{if(prompt){await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')installState.accepted();prompt=null;return}showModal('<h2>Your shop, one tap away.</h2><p>Install <b>Wakad Circle Shopkeeper</b> separately from the customer app.</p><p><b>Android / laptop Chrome:</b> browser menu → Install app.</p><p><b>iPhone:</b> Safari → Share → Add to Home Screen.</p><p class="form-note">Use this same browser profile to retain your sign-in. Keep the app open and connected for live alerts.</p>')};
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/shopkeeper/sw.js',{scope:'/shopkeeper/',updateViaCache:'none'}).then(registration=>{
  const update=document.createElement('button');update.className='portal-button';update.textContent='Update app';update.hidden=true;document.querySelector('.portal-header-actions').append(update);
  function ready(){update.hidden=!registration.waiting}ready();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',ready));
  update.onclick=()=>{registration.waiting?.postMessage('SKIP_WAITING');navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true})};
  window.addEventListener('focus',()=>registration.update().catch(()=>{}));
 }).catch(()=>notify('Installation is unavailable here. The shopkeeper website still works.'));
})();
