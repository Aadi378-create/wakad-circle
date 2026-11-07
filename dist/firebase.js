const config = window.WK_FIREBASE_CONFIG;
if (config) {
  try {
    const base='https://www.gstatic.com/firebasejs/13.2.0/';
    const [appSDK, authSDK, dbSDK, fnSDK] = await Promise.all([
      import(base+'firebase-app.js'), import(base+'firebase-auth.js'),
      import(base+'firebase-firestore.js'), import(base+'firebase-functions.js')
    ]);
    const app=appSDK.initializeApp(config), auth=authSDK.getAuth(app), db=dbSDK.getFirestore(app);
    const emulator=window.WC_EMULATOR_HOSTS&&['localhost','127.0.0.1'].includes(location.hostname);
    if(emulator){authSDK.connectAuthEmulator(auth,'http://127.0.0.1:9095',{disableWarnings:true});auth.settings.appVerificationDisabledForTesting=true;dbSDK.connectFirestoreEmulator(db,'127.0.0.1',8085)}
    if(window.WC_APP_CHECK_SITE_KEY&&!emulator){const check=await import(base+'firebase-app-check.js');check.initializeAppCheck(app,{provider:new (window.WC_APP_CHECK_PROVIDER==='v3'?check.ReCaptchaV3Provider:check.ReCaptchaEnterpriseProvider)(window.WC_APP_CHECK_SITE_KEY),isTokenAutoRefreshEnabled:true})}
    const durableSession=await window.WCSession.persistentAuth(authSDK,auth);
    const functions=fnSDK.getFunctions(app,window.WK_FUNCTIONS_REGION||'asia-south1');
    if(emulator)fnSDK.connectFunctionsEmulator(functions,'127.0.0.1',5005);
    let verifier, confirmation,stopAddresses=()=>{},stopProfile=()=>{},authGeneration=0,alertToken=null;
    const channel=window.WCSession.orderChannel({sdk:dbSDK,db,onOrders:list=>window.WK.receiveOrders(list),onState:state=>window.WK.ordersConnection?.(state),onError:err=>window.WK.cloudError(err)});
    const call=(name,data)=>fnSDK.httpsCallable(functions,name)(data).then(r=>r.data);
    async function enableNotifications(ownerApp){
      if(!window.WKCloud.user)throw Error('Sign in to enable order notifications.');if(ownerApp&&!window.WKCloud.owner)throw Error('Shopkeeper sign-in required.');
      if(!window.WC_PUSH_VAPID_KEY)throw Error('Order notifications are not configured yet.');
      const sdk=await import(base+'firebase-messaging.js');if(!await sdk.isSupported())throw Error('Notifications are unavailable in this browser. Try the installed app in Chrome or Safari.');
      if(await Notification.requestPermission()!=='granted')throw Error('Allow notifications in browser settings to receive order updates.');
      const registration=await navigator.serviceWorker.getRegistration('/')||await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});if(!registration.active)await new Promise((resolve,reject)=>{const worker=registration.installing||registration.waiting;if(!worker)return reject(Error('App setup is still loading. Reopen it and try again.'));const timer=setTimeout(()=>reject(Error('App setup timed out. Reopen it and try again.')),30000);worker.addEventListener('statechange',()=>{if(worker.state==='activated'){clearTimeout(timer);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error('App setup needs an update. Reopen it and try again.'))}})});
      const uid=window.WKCloud.user.uid,token=await sdk.getToken(sdk.getMessaging(app),{vapidKey:window.WC_PUSH_VAPID_KEY,serviceWorkerRegistration:registration});if(uid!==window.WKCloud.user?.uid)throw Error('Your account changed. Please sign in again.');await call(ownerApp?'registerOrderAlerts':'registerCustomerAlerts',{token});try{localStorage.setItem((ownerApp?'wc-alert-device-':'wc-customer-alert-device-')+uid,token)}catch{}return true;
    }
    window.WKCloud={
      user:null,owner:false,durableSession,restoring:true,refreshOrders:()=>channel.refresh(),
      async sendOTP(phone){
        if(!/^\+91[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid Indian mobile number.');
        verifier?.clear();
        verifier=new authSDK.RecaptchaVerifier(auth,'recaptcha',{size:'normal'});
        confirmation=await authSDK.signInWithPhoneNumber(auth,phone,verifier);
      },
      async verifyOTP(code){if(!confirmation)throw new Error('Request an OTP first.');const result=await confirmation.confirm(code);window.WKCloud.user=result.user;const token=await result.user.getIdTokenResult();window.WKCloud.owner=token.claims.shopkeeper===true;window.WK.authChanged();},
      async signOut(){const uid=window.WKCloud.user?.uid;for(const [prefix,endpoint]of [['wc-alert-device-','removeOrderAlerts'],['wc-customer-alert-device-','removeCustomerAlerts']]){const key=prefix+uid;try{const token=localStorage.getItem(key);if(token)await call(endpoint,{token})}catch{console.warn('Notification-device cleanup could not complete.')}finally{try{localStorage.removeItem(key)}catch{}}}await authSDK.signOut(auth);},
      saveProfile: data=>call('saveProfile',data),
      saveStoreSettings: data=>call('saveStoreSettings',data),
      bulkSaveProducts: products=>call('bulkSaveProducts',{products}),
      collectOrderPayment: data=>call('collectOrderPayment',data),
      cancelOrder: id=>call('cancelOrder',{id}),
      proposeOrderChange: data=>call('proposeOrderChange',data),
      respondOrderChange: data=>call('respondOrderChange',data),
      enableOrderAlerts:()=>enableNotifications(true),
      enableCustomerAlerts:()=>enableNotifications(false),
      saveProduct: product=>call('saveProduct',product),
      placeOrder: payload=>call('placeOrder',payload),
      setStatus: (id,status,reason='')=>call('setOrderStatus',{id,status,reason}),
      submitPaymentReference: (id,reference)=>call('submitPaymentReference',{id,reference}),
      managePayment: data=>call('managePayment',data),
      saveAddress: address=>call('saveAddress',address),
      deleteAddress: id=>call('deleteAddress',{id})

    };
    dbSDK.onSnapshot(dbSDK.collection(db,'products'),snap=>window.WK.receiveProducts(snap.docs.map(d=>d.data())),err=>window.WK.cloudError(err));
    dbSDK.onSnapshot(dbSDK.doc(db,'store','config'),snap=>window.WK.receiveStore?.(snap.exists()?snap.data():null),err=>window.WK.cloudError(err));
    async function restoreSession(user){
      const generation=++authGeneration;const identityChanged=window.WKCloud.user?.uid!==user?.uid;window.WKCloud.user=user;if(identityChanged)window.WK.authReset?.();channel.stop();window.WKCloud.restoring=true;stopAddresses();stopProfile();window.WK.receiveProfile?.(null);window.WK.receiveOrders([]);window.WK.receiveAddresses?.([]);window.WKCloud.user=user;window.WKCloud.owner=false;
      let isOwner=false;
      if(user){try{const token=await user.getIdTokenResult();isOwner=token.claims.shopkeeper===true}catch(err){if(generation===authGeneration){window.WK.sessionError?.(err);window.WK.cloudError(err)}return}}
      if(generation!==authGeneration)return;
      window.WKCloud.owner=isOwner;window.WKCloud.restoring=false;
      window.WK.authChanged();
      channel.start(user,window.WK.appRole==='shopkeeper'&&isOwner);
      if(user&&window.WK.receiveAddresses)stopAddresses=dbSDK.onSnapshot(dbSDK.collection(db,'users',user.uid,'addresses'),snap=>{if(generation===authGeneration&&window.WKCloud.user?.uid===user.uid)window.WK.receiveAddresses(snap.docs.map(d=>d.data()))},err=>{if(generation===authGeneration)window.WK.cloudError(err)});
      else if(!user)window.WK.receiveOrders([]);
      if(user&&window.WK.receiveProfile)stopProfile=dbSDK.onSnapshot(dbSDK.doc(db,'users',user.uid),snap=>{if(generation===authGeneration&&window.WKCloud.user?.uid===user.uid)window.WK.receiveProfile(snap.exists()?snap.data():null)},err=>{if(generation===authGeneration)window.WK.cloudError(err)});
    }
    authSDK.onIdTokenChanged(auth,restoreSession);
    let lastResume=0;
    function resume(){if(document.visibilityState==='hidden'||!navigator.onLine||!auth.currentUser||Date.now()-lastResume<5000)return;lastResume=Date.now();if(window.WKCloud.restoring)restoreSession(auth.currentUser);else channel.refresh().catch(()=>{});}
    window.addEventListener('online',resume);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);
    window.addEventListener('offline',()=>window.WK.ordersConnection?.('reconnecting'));
    window.WK.cloudReady();
    if(!durableSession)window.WK.sessionError?.(new Error('This browser is blocking saved sign-in. Enable site storage or use the installed app in a normal browser profile.'));

  } catch(error){window.WK.cloudError(error);}
}
