(function(root){
 function bounded(task,ms,message){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(message)),ms);Promise.resolve(task).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})})}
 async function notificationsEnabled(cloud,ownerApp,env=root){
  const uid=cloud?.user?.uid;if(!uid||cloud.restoring||(ownerApp&&!cloud.owner)||env.Notification?.permission!=='granted')return false;
  try{if(!env.localStorage.getItem((ownerApp?'wc-alert-device-':'wc-customer-alert-device-')+uid))return false;const registration=await bounded(env.navigator.serviceWorker.getRegistration('/'),5000,'Notification state timed out.');const subscription=registration&&await bounded(registration.pushManager.getSubscription(),5000,'Notification state timed out.');return !!subscription&&cloud.user?.uid===uid}catch{return false}
 }
 function notificationControl(button,{allowed,identity,check,enable,notify}){
  let generation=0;
  async function refresh(){const current=++generation;if(!allowed()){button.hidden=true;return}try{const enabled=await check();if(current===generation)button.hidden=!allowed()||enabled}catch{if(current===generation)button.hidden=!allowed()}}
  button.onclick=async()=>{if(!allowed())return;const current=++generation,uid=identity();button.disabled=true;try{await enable();if(current===generation&&uid===identity()&&allowed()){button.hidden=true;notify('Order alerts enabled on this device.')}}catch(error){if(current===generation){button.hidden=!allowed();notify(error.message||'Unable to enable notifications. Please try again.')}}finally{button.disabled=false;await refresh()}};
  return {refresh};
 }
 function soundControl(button,{create,onState,notify,beep}){
  let context=null;
  function sync(){const running=context?.state==='running';onState(context,running);button.hidden=running}
  button.onclick=async()=>{button.disabled=true;try{if(!context||context.state==='closed'){context=create();context.addEventListener?.('statechange',sync)}await bounded(context.resume(),10000,'Sound could not start. Please try again.');sync();if(context.state==='running')beep();else notify('Sound is blocked. Tap Enable sound again to retry.')}catch(error){button.hidden=false;onState(context,false);notify(error.message||'Sound is unavailable in this browser.')}finally{button.disabled=false}};
  return {sync};
 }
 const api={bounded,notificationsEnabled,notificationControl,soundControl};if(typeof module==='object')module.exports=api;else root.WCDeviceState=api;
})(typeof window==='object'?window:this);
