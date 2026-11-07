const config = window.WK_FIREBASE_CONFIG;
if (config) {
  try {
    const base='https://www.gstatic.com/firebasejs/13.2.0/';
    const [appSDK, authSDK, dbSDK, fnSDK] = await Promise.all([
      import(base+'firebase-app.js'), import(base+'firebase-auth.js'),
      import(base+'firebase-firestore.js'), import(base+'firebase-functions.js')
    ]);
    const app=appSDK.initializeApp(config), auth=authSDK.getAuth(app), db=dbSDK.getFirestore(app);
    const durableSession=await window.WCSession.persistentAuth(authSDK,auth);
    const functions=fnSDK.getFunctions(app,window.WK_FUNCTIONS_REGION||'asia-south1');
    let verifier, confirmation,stopAddresses=()=>{},authGeneration=0;
    const channel=window.WCSession.orderChannel({sdk:dbSDK,db,onOrders:list=>window.WK.receiveOrders(list),onState:state=>window.WK.ordersConnection?.(state),onError:err=>window.WK.cloudError(err)});
    const call=(name,data)=>fnSDK.httpsCallable(functions,name)(data).then(r=>r.data);
    window.WKCloud={
      user:null,owner:false,durableSession,restoring:true,refreshOrders:()=>channel.refresh(),
      async sendOTP(phone){
        if(!/^\+91[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid Indian mobile number.');
        verifier?.clear();
        verifier=new authSDK.RecaptchaVerifier(auth,'recaptcha',{size:'normal'});
        confirmation=await authSDK.signInWithPhoneNumber(auth,phone,verifier);
      },
      async verifyOTP(code){if(!confirmation)throw new Error('Request an OTP first.');const result=await confirmation.confirm(code);window.WKCloud.user=result.user;const token=await result.user.getIdTokenResult();window.WKCloud.owner=token.claims.shopkeeper===true;window.WK.authChanged();},
      async signOut(){await authSDK.signOut(auth);},
      saveProduct: product=>call('saveProduct',product),
      placeOrder: payload=>call('placeOrder',payload),
      setStatus: (id,status,reason='')=>call('setOrderStatus',{id,status,reason}),
      submitPaymentReference: (id,reference)=>call('submitPaymentReference',{id,reference}),
      managePayment: data=>call('managePayment',data),
      saveAddress: address=>call('saveAddress',address),
      deleteAddress: id=>call('deleteAddress',{id})

    };
    dbSDK.onSnapshot(dbSDK.collection(db,'products'),snap=>window.WK.receiveProducts(snap.docs.map(d=>d.data())),err=>window.WK.cloudError(err));
    async function restoreSession(user){
      const generation=++authGeneration;const identityChanged=window.WKCloud.user?.uid!==user?.uid;window.WKCloud.user=user;if(identityChanged)window.WK.authReset?.();channel.stop();window.WKCloud.restoring=true;stopAddresses();window.WK.receiveOrders([]);window.WK.receiveAddresses?.([]);window.WKCloud.user=user;window.WKCloud.owner=false;
      let isOwner=false;
      if(user){try{const token=await user.getIdTokenResult();isOwner=token.claims.shopkeeper===true}catch(err){if(generation===authGeneration){window.WK.sessionError?.(err);window.WK.cloudError(err)}return}}
      if(generation!==authGeneration)return;
      window.WKCloud.owner=isOwner;window.WKCloud.restoring=false;
      window.WK.authChanged();
      channel.start(user,window.WK.appRole==='shopkeeper'&&isOwner);
      if(user&&window.WK.receiveAddresses)stopAddresses=dbSDK.onSnapshot(dbSDK.collection(db,'users',user.uid,'addresses'),snap=>{if(generation===authGeneration&&window.WKCloud.user?.uid===user.uid)window.WK.receiveAddresses(snap.docs.map(d=>d.data()))},err=>{if(generation===authGeneration)window.WK.cloudError(err)});
      else if(!user)window.WK.receiveOrders([]);
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
