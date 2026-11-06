(function(root){
 async function persistentAuth(sdk,auth){
  for(const persistence of [sdk.indexedDBLocalPersistence,sdk.browserLocalPersistence]){
   try{await sdk.setPersistence(auth,persistence);return true}catch{}
  }
  return false;
 }
 function orderChannel({sdk,db,onOrders,onState,onError}){
  let version=0,unsubscribe=()=>{},query=null,refreshing=null,state='idle',watchdog;
  const status=value=>{state=value;onState(value)};
  const deliver=(snap,expected)=>{if(expected!==version)return;onOrders(snap.docs.map(d=>({id:d.id,...d.data()})));status(snap.metadata?.fromCache?'reconnecting':'live')};
  function stop(){version++;unsubscribe();unsubscribe=()=>{};query=null;refreshing=null;clearTimeout(watchdog);status('idle')}
  function start(user,owner){
   stop();if(!user)return;const current=version,ref=sdk.collection(db,'orders');
   query=owner?sdk.query(ref,sdk.orderBy('date','desc'),sdk.limit(100)):sdk.query(ref,sdk.where('uid','==',user.uid),sdk.orderBy('date','desc'),sdk.limit(100));
   status('loading');unsubscribe=sdk.onSnapshot(query,{includeMetadataChanges:true},snap=>deliver(snap,current),error=>{if(current===version){status('error');onError(error)}});
   watchdog=setTimeout(()=>{if(current===version&&state!=='live')refresh().catch(()=>{})},8000);
  }
  function refresh(){
   if(!query)return Promise.resolve(false);if(refreshing)return refreshing;
   const current=version,request=sdk.getDocsFromServer(query).then(snap=>{if(current!==version)return false;deliver(snap,current);return true}).catch(error=>{if(current===version){status('error');onError(error)}throw error});
   refreshing=request;request.finally(()=>{if(refreshing===request)refreshing=null}).catch(()=>{});return request;
  }
  return {start,stop,refresh};
 }
 const api={persistentAuth,orderChannel};if(typeof module==='object')module.exports=api;else root.WCSession=api;
})(typeof window==='object'?window:this);
