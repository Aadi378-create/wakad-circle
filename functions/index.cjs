const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {validateProduct,quote,fulfillmentDetails,validateAddress,orderTransition,nextOrderRate,nextProductRevision}=require('./domain.cjs');
initializeApp();const db=getFirestore(),options={region:'asia-south1',maxInstances:5,invoker:'public',cors:['https://wakad-kissan.web.app','https://wakad-kissan.firebaseapp.com','https://wakad-kissan-kirana.peakedbeam2.chatgpt.site']};
function signedIn(request){if(!request.auth||!request.auth.token.phone_number)throw new HttpsError('unauthenticated','Sign in with your phone number first.');}
function owner(request){signedIn(request);if(request.auth.token.shopkeeper!==true)throw new HttpsError('permission-denied','Only the shopkeeper can make this change.');}
function validate(fn){try{return fn()}catch(e){throw new HttpsError('invalid-argument',e.message)}}
exports.saveProduct=onCall(options,async request=>{owner(request);const p=validate(()=>validateProduct(request.data)),ref=db.collection('products').doc(String(p.id));await db.runTransaction(async tx=>{const current=await tx.get(ref);let revision;try{revision=nextProductRevision(current.exists?current.data():null,request.data.revision??0)}catch(err){throw new HttpsError('failed-precondition',err.message)}tx.set(ref,{...p,revision});});return {ok:true};});
exports.seedCatalog=onCall(options,async request=>{owner(request);if(!Array.isArray(request.data?.products)||!request.data.products.length||request.data.products.length>50)throw new HttpsError('invalid-argument','Invalid catalog.');const ps=validate(()=>request.data.products.map(validateProduct));await db.runTransaction(async tx=>{const snap=await tx.get(db.collection('products').limit(1));if(!snap.empty)throw new HttpsError('already-exists','Catalog already has products.');ps.forEach(p=>tx.set(db.collection('products').doc(String(p.id)),p));});return {ok:true};});
exports.placeOrder=onCall(options,async request=>{
  signedIn(request);const details=validate(()=>fulfillmentDetails(request.data));
  const key=request.data.requestId;if(typeof key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw new HttpsError('invalid-argument','Invalid checkout request.');
  const lines=request.data.items;if(!Array.isArray(lines)||!lines.length||lines.length>50||lines.some(l=>!l||!Number.isSafeInteger(l.id)||l.id<1))throw new HttpsError('invalid-argument','Invalid basket.');
  const orderRef=db.collection('orders').doc(request.auth.uid+'_'+key);
  return db.runTransaction(async tx=>{
    const previous=await tx.get(orderRef);if(previous.exists)return {id:orderRef.id,total:previous.data().total,status:previous.data().status};
    const rateRef=db.collection('orderLimits').doc(request.auth.uid),rateSnapshot=await tx.get(rateRef);
    let rate;try{rate=nextOrderRate(rateSnapshot.exists?rateSnapshot.data():null,Date.now())}catch(err){throw new HttpsError('resource-exhausted',err.message)}
    const refs=lines.map(l=>db.collection('products').doc(String(l.id)));
    const docs=await tx.getAll(...refs);const catalog=new Map(docs.filter(d=>d.exists).map(d=>[d.data().id,d.data()]));
    const bill=validate(()=>quote(lines,catalog,details.fulfillment));
    bill.items.forEach(i=>tx.update(db.collection('products').doc(String(i.id)),{stock:catalog.get(i.id).stock-i.qty,revision:(catalog.get(i.id).revision||0)+1}));
    const order={...details,...bill,uid:request.auth.uid,phone:request.auth.token.phone_number,status:'Pending confirmation',stockReleased:false,date:new Date().toISOString(),createdAt:FieldValue.serverTimestamp(),paymentMethod:details.fulfillment==='pickup'?'Pay at pickup':'Cash on delivery'};
    tx.set(rateRef,rate);
    tx.set(orderRef,order);return {id:orderRef.id,total:order.total,status:order.status};
  });
});
exports.setOrderStatus=onCall(options,async request=>{
  owner(request);const {id,status,reason=''}=request.data||{};
  if(typeof id!=='string'||!id||id.length>250||id.includes('/')||!['Accepted','Preparing','Ready for pickup','Out for delivery','Completed','Rejected'].includes(status)||typeof reason!=='string'||reason.length>200)throw new HttpsError('invalid-argument','Invalid order action.');
  const ref=db.collection('orders').doc(id);
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Order not found.');
    const order=snap.data();let change;try{change=orderTransition(order,status)}catch(err){throw new HttpsError('failed-precondition',err.message)}
    if(change.unchanged)return {ok:true,status};
    if(change.restore){
      const items=order.items.filter(i=>Number.isSafeInteger(i.id));
      const docs=items.length?await tx.getAll(...items.map(i=>db.collection('products').doc(String(i.id)))):[];
      docs.forEach((doc,index)=>{if(doc.exists)tx.update(doc.ref,{stock:doc.data().stock+items[index].qty,revision:(doc.data().revision||0)+1})});
    }
    tx.update(ref,{status,updatedAt:FieldValue.serverTimestamp(),...(status==='Rejected'?{stockReleased:true,rejectionReason:reason.trim()||'The store could not fulfil this order.'}:{})});
    return {ok:true,status};
  });
});
exports.saveAddress=onCall(options,async request=>{
  signedIn(request);const address=validate(()=>validateAddress(request.data)),collection=db.collection('users').doc(request.auth.uid).collection('addresses');
  await db.runTransaction(async tx=>{const snap=await tx.get(collection);if(snap.size>=10&&!snap.docs.some(d=>d.id===address.id))throw new HttpsError('resource-exhausted','You can save up to 10 addresses.');tx.set(collection.doc(address.id),{...address,updatedAt:FieldValue.serverTimestamp()})});return {ok:true};
});
exports.deleteAddress=onCall(options,async request=>{signedIn(request);const id=request.data?.id;if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new HttpsError('invalid-argument','Invalid address.');await db.collection('users').doc(request.auth.uid).collection('addresses').doc(id).delete();return {ok:true};});
