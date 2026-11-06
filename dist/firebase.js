const config = window.WK_FIREBASE_CONFIG;
if (config) {
  try {
    const base='https://www.gstatic.com/firebasejs/13.2.0/';
    const [appSDK, authSDK, dbSDK, fnSDK] = await Promise.all([
      import(base+'firebase-app.js'), import(base+'firebase-auth.js'),
      import(base+'firebase-firestore.js'), import(base+'firebase-functions.js')
    ]);
    const app=appSDK.initializeApp(config), auth=authSDK.getAuth(app), db=dbSDK.getFirestore(app);
    const functions=fnSDK.getFunctions(app,window.WK_FUNCTIONS_REGION||'asia-south1');
    let verifier, confirmation, stopOrders=()=>{};
    const call=(name,data)=>fnSDK.httpsCallable(functions,name)(data).then(r=>r.data);
    window.WKCloud={
      user:null,owner:false,
      async sendOTP(phone){
        if(!/^\+91[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid Indian mobile number.');
        verifier?.clear();
        verifier=new authSDK.RecaptchaVerifier(auth,'recaptcha',{size:'normal'});
        confirmation=await authSDK.signInWithPhoneNumber(auth,phone,verifier);
      },
      async verifyOTP(code){if(!confirmation)throw new Error('Request an OTP first.');const result=await confirmation.confirm(code);window.WKCloud.user=result.user;const token=await result.user.getIdTokenResult(true);window.WKCloud.owner=token.claims.shopkeeper===true;window.WK.authChanged();},
      async signOut(){await authSDK.signOut(auth);},
      saveProduct: product=>call('saveProduct',product),
      placeOrder: payload=>call('placeOrder',payload),
      setStatus: (id,status)=>call('setOrderStatus',{id,status}),
      seed: products=>call('seedCatalog',{products})
    };
    dbSDK.onSnapshot(dbSDK.collection(db,'products'),snap=>window.WK.receiveProducts(snap.docs.map(d=>d.data())),err=>window.WK.cloudError(err));
    authSDK.onAuthStateChanged(auth,async user=>{
      stopOrders();window.WKCloud.user=user;window.WKCloud.owner=false;
      if(user){const token=await user.getIdTokenResult(true);window.WKCloud.owner=token.claims.shopkeeper===true;}
      window.WK.authChanged();
      if(user){const ref=dbSDK.collection(db,'orders');const q=window.WKCloud.owner?ref:dbSDK.query(ref,dbSDK.where('uid','==',user.uid));
        stopOrders=dbSDK.onSnapshot(q,snap=>window.WK.receiveOrders(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>window.WK.cloudError(err));}
      else window.WK.receiveOrders([]);
    });
    window.WK.cloudReady();
  } catch(error){window.WK.cloudError(error);}
}
